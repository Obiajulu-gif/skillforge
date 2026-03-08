import { NextResponse } from 'next/server';

import { getStacksConfig } from '@/app/lib/stacks/env';

export async function GET() {
  const config = getStacksConfig();

  return NextResponse.json({
    stacksNetwork: config.stacksNetwork,
    stacksApiUrl: config.stacksApiUrl,
    rpcUrl: config.rpcUrl,
    contractAddress: config.contractAddress,
    contractName: config.contractName,
    contractId: config.contractId,
    sbtcContractId: config.sbtcContractId,
    usdcxContractId: config.usdcxContractId,
    ipfsGateway: config.ipfsGateway,
    explorerBaseUrl: config.explorerBaseUrl,
  });
}
