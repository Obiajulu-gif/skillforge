import type { TokenMetadata } from './types';

export function splitContractId(contractId: string) {
  const [address, contractName] = contractId.split('.', 2);
  return { address, contractName };
}

export function shortAddress(address: string) {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(amount: bigint, decimals: number) {
  if (decimals === 0) {
    return amount.toString();
  }

  const negative = amount < 0;
  const normalized = negative ? amount * BigInt(-1) : amount;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = normalized / base;
  const fraction = normalized % base;

  if (fraction === BigInt(0)) {
    return `${negative ? '-' : ''}${whole.toString()}`;
  }

  const fractionString = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole.toString()}.${fractionString}`;
}

export function formatPrice(amount: bigint, token: TokenMetadata) {
  return `${formatTokenAmount(amount, token.decimals)} ${token.symbol}`;
}
