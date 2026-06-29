# Product Boundary

CueFrame is a semantic show-control protocol for live-event coordination. A
producer opens a Show Spine (segment order, show rules, required roles) and
writes Cue Cards against it. Crew roles call in acknowledgements, and a GenLayer
cue gate rules each cue into one coarse readiness outcome under validator
consensus.

## Intelligent Contract owns
- Authoritative storage: show spines, cue cards, role acknowledgements,
  dependency state, cue gate evaluations, cue receipts, and run-of-show receipts.
- State transition rules: opening a show spine, writing a cue card, logging a
  role acknowledgement, evaluating a cue, sealing a cue receipt, and sealing a
  show receipt.
- Deterministic input guards: existence checks (show, cue), already-evaluated
  checks, length caps on all text, and enum bounds (event type, show mode, cue
  type, risk level, confirmation requirement, audience visibility) that fall back
  to safe defaults on write.
- Dependency resolution: prior-cue dependencies are resolved against real cues
  on-chain before the prompt is built, so the model receives factual dependency
  status as data.
- Nondeterministic AI judgment: mapping a cue and its surroundings onto a coarse
  gate enum plus matched and unresolved preconditions, dependency issues, role
  issues, risk flags, required actions, and a confidence.
- Validator comparison: an independent re-run that must agree on the gate enum
  exactly, agree on whether any precondition remains unresolved, and agree on
  confidence within a bounded tolerance before the ruling settles.
- Deterministic backstops after consensus, applied as a severity ladder:
  evidence consistency drops fabricated references; a READY cannot stand with
  unresolved preconditions (forced HOLD); an incomplete dependency forces HOLD;
  an audience-facing cue missing a required-role acknowledgement is held and
  wrong-role acknowledgements are ignored; an ordering violation is BLOCKED; a
  high-risk cue with no fallback is forced to NEEDS_REVISION while one with a
  usable fallback settles to READY_WITH_CAUTION; a cue needing sign-off is
  escalated to PRODUCER_CONFIRMATION_REQUIRED.
- Paged read views over shows, cues, acknowledgements, and receipts.

## Frontend owns
- The production control-room UI and the cue-light visual system.
- Wallet connection (MetaMask) for writes only.
- Read-only previews of shows, cues, acknowledgements, evaluations, and receipts.
- Transaction submission and the consensus lifecycle theater on the transport bar.
- Slow paged polling and client-derived desk stats.
- Briefing and safety panels.

## External sources own
- Nothing. CueFrame uses no external APIs. The only nondeterminism is GenLayer
  LLM consensus inside the contract.

## Safety scope
- CueFrame never fires real cues, triggers real effects, or controls real
  hardware. The contract only classifies whether a described cue would be ready
  to call. Demo content is safe text only.
- No deposits, no staking, no escrow, no value transfer. Users pay network fees
  only.
