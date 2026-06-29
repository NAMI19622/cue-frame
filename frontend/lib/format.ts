export function shortAddr(addr?: string | null): string {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function gateLabel(gate: string): string {
  return gate.replace(/_/g, ' ');
}

// The cue-light system. Each gate maps to a lamp on the control desk.
export function gateColor(gate: string): string {
  switch (gate) {
    case 'READY':
      return 'var(--go)';
    case 'READY_WITH_CAUTION':
      return 'var(--cyan)';
    case 'HOLD':
      return 'var(--amber)';
    case 'NEEDS_REVISION':
      return 'var(--magenta)';
    case 'BLOCKED':
      return 'var(--hold-red)';
    case 'PRODUCER_CONFIRMATION_REQUIRED':
      return 'var(--violet)';
    default:
      return 'var(--ink-3)';
  }
}

export function gateLamp(gate: string): 'go' | 'standby' | 'hold' {
  if (gate === 'READY' || gate === 'READY_WITH_CAUTION') return 'go';
  if (gate === 'BLOCKED') return 'hold';
  return 'standby';
}

export function statusColor(status: string): string {
  switch (status) {
    case 'ready':
    case 'complete':
      return 'var(--go)';
    case 'standby':
      return 'var(--cyan)';
    case 'holding':
      return 'var(--amber)';
    case 'revising':
      return 'var(--magenta)';
    case 'blocked':
      return 'var(--hold-red)';
    default:
      return 'var(--ink-3)';
  }
}

export function riskColor(risk: string): string {
  switch (risk) {
    case 'low':
      return 'var(--go)';
    case 'medium':
      return 'var(--amber)';
    case 'high':
      return 'var(--magenta)';
    case 'critical':
      return 'var(--hold-red)';
    default:
      return 'var(--ink-3)';
  }
}

export function bps(value: number): string {
  return (value / 100).toFixed(0) + '%';
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
