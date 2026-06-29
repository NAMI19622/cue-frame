'use client';

import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { CONTRACT_ADDRESS } from './config';
import type {
  Summary,
  ShowSpine,
  CueCard,
  RoleAck,
  CueReceipt,
  ShowReceipt,
  Page,
} from './types';

type AnyClient = ReturnType<typeof createClient>;

let readClient: AnyClient | null = null;
let walletClient: AnyClient | null = null;
let connectedAddress: string | null = null;

// A read-only client backed by an ephemeral account. Reads never sign anything,
// but genlayer-js wants an account present.
export function getReadClient(): AnyClient {
  if (!readClient) {
    const account = createAccount();
    readClient = createClient({ chain: testnetBradbury, account });
  }
  return readClient;
}

export function getConnectedAddress(): string | null {
  return connectedAddress;
}

// Connect the browser wallet (MetaMask / Snap) for write transactions.
export async function connectWallet(): Promise<string> {
  const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
  if (!eth) {
    throw new Error('No browser wallet found. Install MetaMask to call the cue desk.');
  }
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet returned no accounts.');
  }
  connectedAddress = accounts[0];
  walletClient = createClient({
    chain: testnetBradbury,
    account: connectedAddress as `0x${string}`,
  });
  try {
    await (walletClient as any).initializeConsensusSmartContract?.();
  } catch {
    // best effort
  }
  return connectedAddress;
}

export function disconnectWallet(): void {
  walletClient = null;
  connectedAddress = null;
}

export function getWalletClient(): AnyClient {
  if (!walletClient) throw new Error('Wallet not connected.');
  return walletClient;
}

async function read<T>(method: string, args: any[] = []): Promise<T> {
  const client = getReadClient();
  const res = await (client as any).readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
  return res as T;
}

export const api = {
  getSummary: () => read<Summary>('get_summary'),
  getShowsPage: (offset: number, limit: number) =>
    read<Page<ShowSpine>>('get_shows_page', [offset, limit]),
  getShow: (id: string) => read<ShowSpine>('get_show', [id]),
  getCuesForShow: (showId: string, offset: number, limit: number) =>
    read<Page<CueCard>>('get_cues_for_show', [showId, offset, limit]),
  getCue: (id: string) => read<CueCard>('get_cue', [id]),
  getEvaluation: (id: string) => read<any>('get_evaluation', [id]),
  getAcksForCue: (cueId: string, offset: number, limit: number) =>
    read<Page<RoleAck>>('get_acks_for_cue', [cueId, offset, limit]),
  getReceipt: (id: string) => read<CueReceipt>('get_receipt', [id]),
  getReceiptForCue: (cueId: string) => read<CueReceipt>('get_receipt_for_cue', [cueId]),
  getReceiptForShow: (showId: string) => read<ShowReceipt>('get_receipt_for_show', [showId]),
};

export interface WriteProgress {
  hash?: string;
  statusName?: string;
  statusCode?: number;
}

// Submit a write and poll the transaction to a terminal status.
export async function writeAndWait(
  method: string,
  args: any[],
  onProgress?: (p: WriteProgress) => void,
): Promise<{ hash: string; receipt: any }> {
  const client = getWalletClient();
  const hash: string = await (client as any).writeContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
    value: 0n,
  });
  onProgress?.({ hash, statusName: 'PENDING', statusCode: 1 });

  const receipt = await (client as any).waitForTransactionReceipt({
    hash,
    status: 'ACCEPTED',
    retries: 100,
    interval: 5000,
  });
  onProgress?.({ hash, statusName: 'ACCEPTED', statusCode: 5 });
  return { hash, receipt };
}
