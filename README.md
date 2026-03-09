# SkillForge

SkillForge is a Stacks-native agentic commerce marketplace for AI skills and digital services.
It combines:

- Clarity smart contracts managed with Clarinet
- Leather wallet connection through `@stacks/connect`
- sBTC settlement, with optional USDCx-style SIP-010 payments
- x402-style HTTP 402 payment gating for agent execution
- Next.js frontend and API routes

## Official references used

- Stacks developer quickstart: https://docs.stacks.co/get-started/developer-quickstart
- Stacks smart contract integration and sBTC requirements: https://docs.stacks.co/reference/clarinet/integration
- `@stacks/connect` wallet RPC methods: https://www.npmjs.com/package/@stacks/connect
- x402 protocol docs: https://docs.x402.org/

## Project layout

- `app/`: Next.js UI and API routes
- `contracts/`: Clarity contracts
- `tests/`: Clarinet SDK / Vitest contract tests
- `scripts/`: contract validation, deployment, post-deploy, runtime, and x402 smoke scripts
- `settings/`: Clarinet network settings

## Environment variables

Copy `.env.example` to `.env.local` or export the values in your shell.

- `HIRO_API_KEY`: Hiro API key for Stacks API requests. Get it from https://platform.hiro.so/api-hub
- `STACKS_NETWORK`: `devnet`, `testnet`, or `mainnet`
- `STACKS_API_URL`: Stacks API base URL. For local Clarinet devnet use `http://127.0.0.1:3999`
- `RPC_URL`: RPC/read-only endpoint used by the app and scripts. Usually the same as `STACKS_API_URL`
- `CONTRACT_ADDRESS`: deployed marketplace contract address
- `CONTRACT_NAME`: marketplace contract name. Default is `skillforge-marketplace`
- `CONTRACT_ID`: optional full contract id override, for example `ST... .skillforge-marketplace`
- `SBTC_CONTRACT_ID`: SIP-010 sBTC contract id for the active network
- `USDCX_CONTRACT_ID`: optional SIP-010 USDCx contract id. On devnet the mock contract defaults to `mock-usdcx`
- `WALLET_PRIVATE_KEY`: optional private key for signed post-deploy checks and automated development transactions
- `DEPLOYER_MNEMONIC`: mnemonic used by the official Clarinet deployment flow for testnet/mainnet
- `APP_BASE_URL`: public origin for local metadata fallback and smoke tests
- `EXPLORER_URL`: explorer base URL shown in the UI
- `IPFS_GATEWAY`: gateway used to resolve `ipfs://` metadata
- `ENCRYPTION_KEY`: symmetric key used to encrypt private listing instructions before storage
- `GEMINI_API_KEY`: optional Gemini API key for real skill execution
- `PINATA_JWT`: preferred Pinata credential for IPFS uploads
- `PINATA_API_KEY`: optional Pinata API key if JWT is not used
- `PINATA_SECRET_API_KEY`: optional Pinata secret if JWT is not used
- `INFURA_API_KEY`: optional placeholder, not used by the current Stacks-only stack
- `ETHERSCAN_API_KEY`: optional placeholder, not used by the current Stacks-only stack
- `X402_LISTING_ID`: optional listing id used by `npm run x402:smoke`

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start a local Stacks devnet from the project:

```bash
clarinet deployments generate --devnet
clarinet integrate --no-dashboard -p deployments/default.devnet-plan.yaml
```

3. In a second terminal, run the app:

```bash
npm run dev
```

4. Open `http://127.0.0.1:3000`

The devnet setup follows the official Clarinet workflow from the Stacks quickstart and deployment docs.

## Contracts

- `skillforge-marketplace.clar`
  - sellers create listings
  - listings store payment asset, price, and metadata URI
  - buyers purchase with SIP-010 tokens
  - duplicate purchases are blocked
  - listing publish/unpublish is supported
- `mock-usdcx.clar`
  - local optional SIP-010 asset for dev/test flows

sBTC integration is handled through the official Clarinet requirement for the sBTC contracts.

## x402 integration notes

The x402 protocol is used here as an HTTP 402 payment contract around the Stacks marketplace.
The app emits and validates x402 payment headers with `@x402/core/http`, then verifies the corresponding Stacks settlement on-chain before allowing execution.

This is intentional: the current official x402 server packages are built around networks with first-party scheme adapters outside Stacks, so the Stacks settlement leg is implemented with the Stacks SDK and contract state verification instead of a fabricated unsupported chain adapter.

## Deployment

Generate a plan only:

```bash
npm run deploy:plan
```

Apply deployment and run post-deploy checks:

```bash
npm run deploy
```

The deployment script:

- creates a temporary Clarinet workspace
- injects `DEPLOYER_MNEMONIC` into the correct Clarinet settings file
- runs `clarinet deployments generate`
- runs `clarinet deployments apply`
- runs `npm run deploy:postcheck`

## Verification commands

```bash
npm run lint
npm run typecheck
npm run contract:check
npm run contract:test
npm run build
npm run runtime:check
npm run x402:smoke
```

## Notes

- If Pinata credentials are missing, metadata uploads fall back to a local development route under `/api/metadata/[id]`
- `WALLET_PRIVATE_KEY` is never hardcoded and is only read from environment variables
- `npm run contract:test` uses Vitest with `@stacks/clarinet-sdk`, which is the supported Clarinet v3 testing path
