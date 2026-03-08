import {
  Cl,
  Pc,
  broadcastTransaction,
  fetchNonce,
  getAddressFromPrivateKey,
  makeContractCall,
} from "@stacks/transactions";

import { getStacksConfig, getStacksNetworkClient } from "@/app/lib/stacks/env";
import { fetchTransactionDetails, readListing, readListingCount } from "@/app/lib/stacks/server";
import { splitContractId } from "@/app/lib/stacks/utils";

import { resolveContractIdFromPlan } from "./shared";

async function waitForSuccessfulTx(txid: string, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const tx = await fetchTransactionDetails(txid);
    if (tx.tx_status === "success") {
      return tx;
    }
    if (tx.tx_status === "abort_by_response" || tx.tx_status === "abort_by_post_condition") {
      throw new Error(`Transaction ${txid} failed with status ${tx.tx_status}`);
    }

    await new Promise(resolve => setTimeout(resolve, 5_000));
  }

  throw new Error(`Timed out waiting for transaction ${txid}`);
}

async function maybeResolveContractId() {
  const config = getStacksConfig();
  if (config.contractId) {
    return config.contractId;
  }

  const planPath = process.env.DEPLOYMENT_PLAN_PATH;
  if (!planPath) {
    return "";
  }

  const contractId = await resolveContractIdFromPlan(planPath, config.contractName);
  if (!contractId) {
    return "";
  }

  const { address, contractName } = splitContractId(contractId);
  process.env.CONTRACT_ID = contractId;
  process.env.CONTRACT_ADDRESS = address;
  process.env.CONTRACT_NAME = contractName;
  return contractId;
}

async function createListingWriteCheck(contractId: string) {
  const config = getStacksConfig();
  const privateKey = config.walletPrivateKey.trim();
  if (!privateKey) {
    process.stdout.write("Skipping signed write checks because WALLET_PRIVATE_KEY is not configured.\n");
    return;
  }

  const paymentAsset = config.sbtcContractId || config.usdcxContractId;
  if (!paymentAsset) {
    throw new Error("SBTC_CONTRACT_ID or USDCX_CONTRACT_ID is required for signed write checks");
  }

  const { address: contractAddress, contractName } = splitContractId(contractId);
  const { contractName: tokenName } = splitContractId(paymentAsset);
  const network = getStacksNetworkClient();
  const senderAddress = getAddressFromPrivateKey(privateKey, network);
  const nonce = await fetchNonce({ address: senderAddress, network });

  const tx = await makeContractCall({
    contractAddress,
    contractName,
    functionName: "create-listing",
    functionArgs: [
      (() => {
        const { address, contractName: assetName } = splitContractId(paymentAsset);
        return Cl.contractPrincipal(address, assetName);
      })(),
      Cl.uint(1_000),
      Cl.stringAscii("https://skillforge.dev/post-deploy-check"),
    ],
    senderKey: privateKey,
    nonce,
    network,
  });

  const broadcast = await broadcastTransaction({ transaction: tx, network });
  if (!("txid" in broadcast)) {
    throw new Error(`Unable to broadcast create-listing transaction: ${JSON.stringify(broadcast)}`);
  }

  process.stdout.write(`Signed create-listing check broadcast: ${broadcast.txid}\n`);
  await waitForSuccessfulTx(broadcast.txid);

  if (process.env.ALLOW_SELF_PURCHASE_CHECK !== "true") {
    return;
  }

  const count = await readListingCount();
  const listing = await readListing(count);
  if (!listing) {
    throw new Error("Expected newly created listing to be readable after broadcast");
  }

  const purchaseNonce = await fetchNonce({ address: senderAddress, network });
  const purchaseTx = await makeContractCall({
    contractAddress,
    contractName,
    functionName: "purchase-listing",
    functionArgs: [Cl.uint(listing.id), Cl.contractPrincipal(splitContractId(paymentAsset).address, tokenName)],
    postConditions: [Pc.origin().willSendEq(listing.price).ft(paymentAsset as `${string}.${string}`, tokenName)],
    postConditionMode: "deny",
    senderKey: privateKey,
    nonce: purchaseNonce,
    network,
  });

  const purchaseBroadcast = await broadcastTransaction({ transaction: purchaseTx, network });
  if (!("txid" in purchaseBroadcast)) {
    throw new Error(`Unable to broadcast purchase transaction: ${JSON.stringify(purchaseBroadcast)}`);
  }

  process.stdout.write(`Signed self-purchase check broadcast: ${purchaseBroadcast.txid}\n`);
  await waitForSuccessfulTx(purchaseBroadcast.txid);
}

async function main() {
  const contractId = await maybeResolveContractId();
  if (!contractId) {
    throw new Error("Contract address is not configured and could not be inferred from a deployment plan");
  }

  const count = await readListingCount();
  process.stdout.write(`Verified contract ${contractId}. Current listing count: ${count}\n`);

  await createListingWriteCheck(contractId);
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "Unknown error"}\n`);
  process.exit(1);
});
