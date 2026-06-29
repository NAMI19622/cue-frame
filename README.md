# CueFrame

Run the moment before it happens.

CueFrame is a semantic show-control protocol on GenLayer. A producer defines a
show, writes cue cards against it, crew acknowledge their cues, and an AI cue
gate rules each cue ready, hold, revision, block, or producer-confirmation under
validator consensus. It fires no real cues and drives no hardware; it rules on
whether a described cue would be ready to call.

This document is a reference card. Scan the tables; read prose only where a table
cannot carry the meaning.

---

## At a glance

| | |
| --- | --- |
| Network | Bradbury testnet (`testnet-bradbury`) |
| Backend | the Intelligent Contract; no server, no database |
| Value transfer | none; network fees only |
| Contract address | carried in the frontend env and shown in the about panel |

---

## Gate outcomes

| Outcome | Meaning |
| --- | --- |
| `READY` | preconditions met, roles in, deps complete, no rule broken |
| `READY_WITH_CAUTION` | ready, residual risk held in check by a usable fallback |
| `HOLD` | a precondition, dependency, or required acknowledgement is out |
| `NEEDS_REVISION` | the cue is incomplete or unsafe as written |
| `BLOCKED` | the cue breaks a show rule or safety constraint |
| `PRODUCER_CONFIRMATION_REQUIRED` | defensible, but a producer must authorize |

Consensus question: given the spine, the cue, its dependencies, and the
acknowledgements, which outcome is correct and which preconditions are actually
satisfied? Validators must agree on the outcome exactly, on whether any
precondition is unresolved, and on confidence within tolerance before it settles.

---

## State and writes

| Record | Holds |
| --- | --- |
| Show Spine | title, event type, mode, segments, show rules, required roles |
| Cue Card | type, segment, timing, role, instruction, preconditions, dependencies, visibility, fallback, risk, confirmation requirement, status |
| Role Acknowledgement | role name, acknowledgement text, sender |
| Evaluation | outcome, matched/unresolved preconditions, dependency/role issues, risk flags, required actions, confidence, validator summary, reason, proof hash |
| Receipt | cue receipt (one cue) or show receipt (tally across the spine) |

| Write | Effect | Calls model |
| --- | --- | --- |
| `create_show_spine` | open a spine | no |
| `create_cue_card` | add a cue | no |
| `submit_role_acknowledgement` | record a role calling in | no |
| `evaluate_cue_gate` | rule a cue | yes |
| `record_cue_receipt` | seal one cue's ruling | no |
| `record_show_receipt` | tally the spine | no |

Reads (free, paged at 20): `get_summary`, `get_shows_page`, `get_show`,
`get_cues_for_show`, `get_cue`, `get_evaluation`, `get_acks_for_cue`,
`get_receipt`, `get_receipt_for_cue`, `get_receipt_for_show`.

---

## Guards, then backstops

Before the model (deterministic): cue and show exist; cue not already evaluated;
text length-capped and enums bounded; dependencies resolved against real cues so
the model is handed factual status as data. The prompt is injection-resistant:
rules, cue, and acknowledgements are data, never instructions.

After consensus (deterministic, severity ladder, model cannot override):

| Backstop | Forces |
| --- | --- |
| Evidence consistency | drops fabricated precondition/dependency/role references |
| Gate consistency | READY with an unresolved precondition is held |
| Dependency completeness | a cue on an incomplete prior cue is held |
| Role acknowledgement | audience-facing cue missing a required role is held; wrong-role ack ignored |
| Show rule | a later-segment dependency is an ordering breach, BLOCKED |
| Fallback safety | high-risk + no fallback goes to NEEDS_REVISION; high-risk + usable fallback to READY_WITH_CAUTION |
| Producer confirmation | a sign-off cue is escalated, never self-clears |

The validator panel records each check so a ruling can be audited.

---

## Local run

```
genvm-lint check contracts/contract.py     # PowerShell: set PYTHONIOENCODING=utf-8 first
python -m pytest tests/direct/ -q          # 19 direct tests
cd frontend && npm install && npm run dev
CF_PAGES=1 npx next build                  # static export to frontend/out
```

Deploy: `scripts/deploy.py` reads `GENLAYER_PRIVATE_KEY` from the workspace
`.env`, deploys, waits for ACCEPTED, writes `deployment.json`, and seeds the
demo show "Indie Builder Launch Night". `scripts/seed.py` reseeds. Point the
frontend with `NEXT_PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_GENLAYER_NETWORK`.

---

## The desk

A command-center gallery. The top bar is a pure broadcast readout: an ON AIR /
HOLD / STANDBY / CLEAR tally sign, the wordmark, a show-mode REC readout,
cue-count gauges, and a live studio clock. Controls (wallet, motion, briefing)
sit on the fixed bottom transport bar, which also stages the consensus lifecycle
CUEING to ON AIR to SETTLED. Between them: a full-width Show Spine timeline
(segment columns, role lanes, plotted cues, a NOW playhead), a horizontal cue
ribbon, and a focused on-air gate overlay with the GateLock iris. Backstage black,
cue amber, stage magenta, signal cyan. Reduced-motion respected; canvas pauses
when hidden.

---

## Notes

CueFrame never fires real cues or controls hardware. An AI round on Bradbury
takes one to five minutes; the transport bar stages it. The gate is
probabilistic; the backstops bound it. A real show still runs its own safety
checks.
