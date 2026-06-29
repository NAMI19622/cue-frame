export interface Summary {
  shows: number;
  cues: number;
  acks: number;
  receipts: number;
  ready: number;
  held: number;
  blocked: number;
  gateValues: string[];
  contractOwner: string;
}

export interface ShowSpine {
  id: string;
  owner: string;
  title: string;
  eventType: string;
  showMode: string;
  segments: string[];
  showRules: string[];
  requiredRoles: string[];
  cueCount: number;
  seq: number;
}

export interface ValidatorResult {
  validator: string;
  passed: boolean;
  reason: string;
  blocks: boolean;
}

export interface CueCard {
  id: string;
  showId: string;
  owner: string;
  title: string;
  cueType: string;
  segment: string;
  timingWindow: string;
  responsibleRole: string;
  instruction: string;
  preconditions: string[];
  dependencies: string[];
  audienceVisibility: string;
  fallbackInstruction: string;
  riskLevel: string;
  confirmationRequirement: string;
  status: string;
  evaluated: boolean;
  gate: string;
  rawGate: string;
  matchedPreconditions: string[];
  unresolvedPreconditions: string[];
  dependencyIssues: string[];
  roleIssues: string[];
  riskFlags: string[];
  requiredActions: string[];
  confidenceBps: number;
  validatorSummary: ValidatorResult[];
  shortReason: string;
  proofHash: string;
  ackCount: number;
  seq: number;
}

export interface RoleAck {
  id: string;
  cueId: string;
  showId: string;
  sender: string;
  role: string;
  ackText: string;
  seq: number;
}

export interface CueReceipt {
  id: string;
  cueId: string;
  showId: string;
  gate: string;
  status: string;
  matchedPreconditions: string[];
  unresolvedPreconditions: string[];
  dependencyIssues: string[];
  roleIssues: string[];
  riskFlags: string[];
  requiredActions: string[];
  shortReason: string;
  proofHash: string;
  seq: number;
}

export interface ShowReceipt {
  id: string;
  showId: string;
  cuesTotal: number;
  cuesReady: number;
  cuesHeld: number;
  cuesBlocked: number;
  summary: string;
  proofHash: string;
  seq: number;
}

export interface Page<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}
