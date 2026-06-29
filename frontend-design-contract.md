# Frontend Design Contract

## screenArchitecture
three-pane-control-room. A live production desk: left cue-stack rail, center show
floor, right cue-gate inspector, with a transport bar pinned along the bottom.

## aboveTheFold
On first load the user lands inside the control room, not a marketing page. The
center show floor renders the ShowSpineTimeline for the active show, read live
from the contract in read-only mode: role lanes stacked across segment columns,
with cue nodes lit by their gate color. The left rail lists shows and the
selected show's cue stack, each cue carrying a GO / STANDBY / HOLD cue light. The
right rail shows the cue gate inspector, idle until a cue is called. The bottom
transport bar reads STANDBY.

## primaryInteraction
Select a show and a cue, then call the cue through the gate. Calling a cue is a
real on-chain write: a light pulse travels the show spine while the transport bar
stages the consensus lifecycle, the GateLock iris resolves to the settled
outcome, and the validator panel lights up. This is not submit-text-then-feed:
each cue is judged against a persisted Show Spine, its dependencies, and the
acknowledgements on record, and settles a six-way readiness outcome.

## layoutMap
- Left rail (CueRail): show list, the active show's cue stack with per-cue cue
  lights and risk dots, new-show and new-cue actions.
- Center (show floor): ShowSpineTimeline canvas on top, then the show rules and
  required roles, then the selected cue card with preconditions, dependencies,
  fallback, and the call-through-gate action.
- Right rail (inspector): GateLock lamp head, the settled reason and flags, the
  ValidatorPanel of backstop checks, and the ShowReceiptSeal for the run-of-show
  tally.
- Bottom (TransportBar): stages STANDBY, CUEING, ON AIR, SETTLED with the tx hash.

## visualMetaphor
A live-event control desk. A show spine drawn as horizontal role lanes and
segment columns; cue lights stacked GO / STANDBY / HOLD; a cue gate rendered as
an iris lamp head that opens for a go and locks shut on a block; a punched
call-sheet medallion sealed when a run-of-show receipt is recorded.

## motionSystem
1. ShowSpineTimeline canvas loop: a device-pixel-ratio aware stage where cue
   nodes breathe on their lanes, paused when the tab is hidden, disabled under
   prefers-reduced-motion.
2. Curtain entry sequence: panels and validator rows rise into place in a
   staggered reveal on first mount and on each gate settlement.
3. Pointer and selection reaction: the active cue node brightens and rings on the
   timeline, and cue-stack rows light their cue lamp on selection.
4. Transaction lifecycle theater: on call, a light pulse travels the spine while
   the TransportBar advances CUEING to ON AIR to SETTLED.
5. On-chain update: the GateLock iris stamps to its settled aperture and the
   ShowReceiptSeal medallion stamps with its ready/holding/blocked tally.

## effectStack
- Device-pixel-ratio aware canvas ShowSpineTimeline with lane rails, segment
  ticks, breathing cue nodes, and a traveling evaluation pulse.
- SVG GateLock iris whose aperture maps to the gate outcome.
- SVG ShowReceiptSeal punched medallion with a tally ring.
- CueLight lamp heads and a sweeping TransportBar progress indicator.

## componentShapeLanguage
Cue lights, lane rails, iris lamp heads, and punched call-sheet medallions.
Stacked signal lamps, horizontal spine lanes, an iris aperture for the gate, and
an engraved seal for the receipt. No generic cards as the primary surface.

## customVisualComponents
1. ShowSpineTimeline (canvas spine of role lanes and segment columns with a
   traveling cue pulse).
2. GateLock (SVG iris lamp head that opens, half-irises, or locks on the gate).
3. CueLight (stacked GO / STANDBY / HOLD lamp head with a live pulse ring).
4. ShowReceiptSeal (punched call-sheet medallion tallying cleared cues).
5. ValidatorPanel (the backstop checks revealing in sequence after a settlement).
6. TransportBar (consensus lifecycle theater bound to tx status).

## bannedFromThisBuild
- No generic centered marketing hero.
- No equal feature cards.
- No horizontal stats strip under a hero.
- No chip row under a hero.
- No submit-form-to-feed main skeleton.
- No three-column footer.
- No glassmorphism as the identity.
- No emoji; no em-dash character U+2014 anywhere.

## proofOfDifference
Versus persona-seal (a split-pane consent atelier of concentric persona
membranes and wax seals) and clarity-bridge (a meaning-bridge lens build),
CueFrame is a three-pane live production control room built on a show-spine
timeline, cue-light lamps, an iris cue gate, and a call-sheet seal. The contract
mechanic is a cue judged against a show spine, its dependencies, and role
acknowledgements into a six-way readiness gate (READY, READY_WITH_CAUTION, HOLD,
NEEDS_REVISION, BLOCKED, PRODUCER_CONFIRMATION_REQUIRED), distinct from a
consent-attribution gradient. The palette is backstage black, curtain navy, and
stage plum, lit by cue amber, stage magenta, signal cyan, go green, hold red, and
proof violet, not consent gold or aquatic blue-green.
