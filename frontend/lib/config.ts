export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x3f682d8C49001c60AAc2bbafa5749350B3ef16f7') as `0x${string}`;

export const NETWORK = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'testnet-bradbury';

export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || 'https://explorer-bradbury.genlayer.com';

// Coarse, consensus-critical cue-gate outcomes. Order matches the contract.
export const GATE_VALUES = [
  'READY',
  'READY_WITH_CAUTION',
  'HOLD',
  'NEEDS_REVISION',
  'BLOCKED',
  'PRODUCER_CONFIRMATION_REQUIRED',
] as const;

export const EVENT_TYPES = [
  'broadcast',
  'conference',
  'awards_show',
  'concert',
  'theater',
  'sports',
  'livestream',
  'product_launch',
  'ceremony',
  'other',
] as const;

export const SHOW_MODES = ['live', 'as_live', 'rehearsal', 'hybrid'] as const;

export const CUE_TYPES = [
  'vtr',
  'audio',
  'lighting',
  'camera',
  'graphics',
  'talent',
  'stage',
  'pyro',
  'transition',
  'announcement',
  'other',
] as const;

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const CONFIRMATION_REQUIREMENTS = [
  'none',
  'stage_manager',
  'producer',
  'safety_officer',
] as const;

export const AUDIENCE_VISIBILITY = ['backstage', 'audience_facing'] as const;

export const TX_STATUS: Record<number, string> = {
  1: 'PENDING',
  2: 'PROPOSING',
  3: 'COMMITTING',
  4: 'REVEALING',
  5: 'ACCEPTED',
  6: 'UNDETERMINED',
  7: 'FINALIZED',
  8: 'CANCELED',
  12: 'VALIDATORS_TIMEOUT',
  13: 'LEADER_TIMEOUT',
};

export const VALIDATOR_LABELS: Record<string, string> = {
  evidence_consistency: 'Evidence Consistency',
  gate_consistency: 'Gate Consistency',
  dependency_completeness: 'Dependency Completeness',
  role_acknowledgement: 'Role Acknowledgement',
  fallback_safety: 'Fallback Safety',
  show_rule: 'Show Rule',
  producer_confirmation: 'Producer Confirmation',
};

export function explorerTx(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `${EXPLORER_BASE}/address/${addr}`;
}

