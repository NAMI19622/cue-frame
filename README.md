# CueFrame

Run the moment before it happens.

```
PROMPT BOOK  -  AURORA CONTROL          SHOW: CueFrame protocol
CALL: house to half on your go          DESK: GenLayer testnet-bradbury
```

This is the prompt book for CueFrame, kept the way a stage manager keeps one:
a running document of standbys and calls, marked up cue by cue. Read it top to
bottom before you take the desk. Each section is a cue in the book; call them in
order and you will know the show before the house lights drop.

---

## STANDBY - what is on the desk

CueFrame turns a live event's run-of-show into a semantic show-control protocol.
A production team defines a **Show Spine** (the segment order, the rules of the
show, and the roles that must answer) and writes **Cue Cards** against it. Every
cue carries its preconditions, its dependencies on earlier cues, a responsible
role, a fallback plan, a risk level, and whether a producer or safety officer
must sign off. Roles call in **Acknowledgements**. The **cue gate** then reads a
cue against everything around it and settles one coarse outcome: the cue is
ready, ready with caution, must hold, needs revision, is blocked, or needs
producer confirmation. The decision is sealed as a **Receipt**.

Nothing here fires a real cue or drives real hardware. CueFrame rules on whether
a described cue would be ready to call. That ruling is the product.

---

## CUE 1 - the call sheet (state on-chain)

The Intelligent Contract holds five kinds of record. They are the entries in
this book.

- **Show Spine.** The run-of-show backbone: a title, an event type, a show mode
  (live, as-live, rehearsal, hybrid), an ordered list of segments, a list of
  show rules, and the roles required to acknowledge audience-facing cues. Owned
  by the address that opens it.
- **Cue Card.** A single cue against a spine: title, cue type, segment, timing
  window, responsible role, instruction, preconditions, dependencies on prior
  cues, audience visibility (backstage or audience-facing), a fallback
  instruction, a risk level, and a confirmation requirement. It carries its own
  status as it moves through the book.
- **Role Acknowledgement.** A role calling in on a cue: the role name and the
  acknowledgement text, stamped with the sender address.
- **Evaluation.** The settled ruling on a cue: the gate outcome, which
  preconditions matched and which remain unresolved, dependency issues, role
  issues, risk flags, required actions, a confidence in basis points, the
  validator summary, a short reason, and a proof hash.
- **Receipt.** The sealed record. A **Cue Receipt** seals one cue's ruling; a
  **Show Receipt** tallies how many cues across a spine are ready, holding, or
  blocked. Both are addressable on-chain and exportable as JSON.

Every collection is read through a paged view, capped at twenty rows a page.

---

## CUE 2 - the gate (the consensus question)

A cue is ruled into exactly one coarse, consensus-critical outcome.

```
READY                          every precondition met, roles in, deps complete, no rule broken
READY_WITH_CAUTION             ready, but a residual risk is held in check by a usable fallback
HOLD                           a precondition, dependency, or required acknowledgement is still out
NEEDS_REVISION                 the cue is incomplete or unsafe as written
BLOCKED                        the cue breaks a show rule or safety constraint and must not fire
PRODUCER_CONFIRMATION_REQUIRED defensible, but only a producer or safety officer may authorize it
```

**The question put to consensus:** given a Show Spine, a Cue Card, its
dependencies, and the acknowledgements on record, which coarse outcome is
correct, and which preconditions does the cue actually satisfy? A leader
proposes the ruling; every validator independently re-runs the same judgment and
must **agree on the outcome exactly**, **agree on whether any precondition
remains unresolved**, and **agree on confidence within a bounded tolerance**
before the ruling settles. The settled answer is load-bearing: it decides the
Receipt.

**Why this cannot be a static contract.** A plain contract can check that a
field is filled or a signature is valid. It cannot tell a clean go from a hold,
a valid dependency from an ordering breach, or a high-risk cue with a real
fallback from one with none. That is a contextual, semantic judgment about a live
show. Because the on-chain ruling governs whether a cue may be called, it has to
be a subjective decision that many validators reproduce and agree on, not the
private verdict of a single server. That is the property GenLayer provides and an
ordinary chain does not.

---

## CUE 3 - standing orders (guards before the gate)

The model never runs until the deterministic guards clear. These run on write
and at the top of every evaluation:

- The cue and its show must exist; the cue must not already be evaluated.
- All text inputs are length-capped, and enums (event type, show mode, cue type,
  risk level, confirmation requirement, audience visibility) are bounded on
  write so an out-of-range value falls back to a safe default.
- The cue's dependencies are resolved against real cues on-chain before the
  prompt is built, so the model is handed factual dependency status as data.

The evaluation prompt is injection-resistant: the show rules, the cue, and every
acknowledgement are presented as DATA, with an explicit instruction never to
follow text embedded inside a cue, an instruction, or an acknowledgement.

---

## CUE 4 - the backstops (code after consensus)

The model proposes; deterministic code disposes. After consensus settles, these
invariants are recomputed in code on every node, and the model cannot override
any of them. They are applied as a severity ladder; the strongest constraint
wins.

- **Evidence consistency.** Any cited precondition, dependency, or role that is
  not actually on the cue is dropped before it can influence the outcome.
- **Gate consistency.** A cue cannot settle READY while a required precondition
  remains unresolved; it is forced to HOLD.
- **Dependency completeness.** A cue that depends on an incomplete prior cue is
  forced to HOLD.
- **Role acknowledgement.** An audience-facing cue missing an acknowledgement
  from a required role cannot be READY; it is held. An acknowledgement from the
  wrong role does not count toward readiness.
- **Show rule.** A cue that depends on a later-segment cue is an ordering
  violation and is BLOCKED.
- **Fallback safety.** A high-risk cue with no fallback is forced to
  NEEDS_REVISION. A high-risk cue that is otherwise ready but carries a usable
  fallback settles to READY_WITH_CAUTION rather than plain READY.
- **Producer confirmation.** A cue that requires producer or safety-officer
  sign-off cannot clear on its own and is escalated to
  PRODUCER_CONFIRMATION_REQUIRED.

Writes that mutate state: `create_show_spine`, `create_cue_card`,
`submit_role_acknowledgement`, `evaluate_cue_gate`, `record_cue_receipt`,
`record_show_receipt`. Only `evaluate_cue_gate` calls the model; the rest are
deterministic.

---

## CUE 5 - the panel on book (validators of record)

Each evaluation records a panel of validator results so the ruling can be
audited. The panel checks substance, not shape: a plausible-looking ruling that
contradicts the spine is rejected.

- **Evidence Consistency** drops fabricated precondition, dependency, or role
  references.
- **Gate Consistency** refuses a READY that rests on unresolved preconditions.
- **Dependency Completeness** holds a cue waiting on an incomplete prior cue.
- **Role Acknowledgement** holds an audience-facing cue missing a required role,
  and ignores wrong-role acknowledgements.
- **Show Rule** blocks an ordering violation.
- **Fallback Safety** sends an unprotected high-risk cue back for revision.
- **Producer Confirmation** escalates a cue that needs sign-off.

A panel that only checked the model returned the right JSON shape would be
worthless on a live show. These checks re-derive the safe outcome in code and
refuse the contradiction.

---

## CUE 6 - the desk (frontend and visuals)

The interface is a static single-page application that talks to the contract
through `genlayer-js`. It reads live state in read-only mode and connects a
browser wallet (MetaMask) only for writes.

**Layout.** A three-pane production control room. The left rail is the cue stack:
shows on top, the selected show's cues below, each with a GO / STANDBY / HOLD cue
light. The center is the show floor: a show-spine timeline, the show rules, and
the selected cue card. The right rail is the cue gate inspector with the gate
lamp, the reason, the validator panel, and the run-of-show seal. A transport bar
runs along the bottom.

**Visual system.** Backstage Black and Curtain Navy surfaces under a Warm
Spotlight ink, lit by a cue-light signal set: Cue Amber, Stage Magenta, Signal
Cyan, Go Green, Hold Red, and Proof Violet. Type is Space Grotesk for display,
Inter for body, IBM Plex Mono for hashes and timing.

**Custom motion built for the metaphor.**

- **ShowSpineTimeline**, a device-pixel-ratio aware canvas drawing the spine as
  horizontal role lanes and segment columns, with cue nodes lit by their gate
  color and a light pulse that travels the spine during an evaluation round.
- **GateLock**, an iris that opens for a go, half-closes on a hold, and locks
  shut on a block.
- **CueLight**, the stacked GO / STANDBY / HOLD lamp head used across the cue
  stack, with a pulse ring while a round is live.
- **ShowReceiptSeal**, a punched call-sheet medallion whose ring tallies ready,
  holding, and blocked cues when a show receipt is sealed.

**Consensus theater.** A write is staged as a cue lifecycle on the transport bar:
CUEING (awaiting signature), then ON AIR (validators deliberating, one to five
minutes), then SETTLED. The wait is expected and is presented as part of the
show, not as an error. All motion respects reduced-motion preferences and pauses
when the tab is hidden.

---

## CUE 7 - taking the desk (local setup)

Assumes Node 18 or later and Python 3.11 or later.

1. Lint the contract from `cue-frame/`:
   - PowerShell: `$env:PYTHONIOENCODING="utf-8"; $env:PYTHONUTF8="1"; genvm-lint check contracts/contract.py`
2. Run the direct test suite: `python -m pytest tests/direct/ -q`.
3. Install the frontend from `cue-frame/frontend/`: `npm install`.
4. Copy `frontend/.env.example` to `frontend/.env.local` and set the contract
   address once you have deployed (it ships as the zero address placeholder).
5. Run the desk locally: `npm run dev`, then open the printed URL.
6. Static build: `CF_PAGES=1 npx next build`; the export lands in `frontend/out/`.

---

## CUE 8 - dark (deployment notes)

CueFrame is built to run locally and is not deployed here. Deploy the contract
yourself with your own tooling and key (a deployer key would be read from the
workspace `.env` as `GENLAYER_PRIVATE_KEY`; never commit a real key).

```
NETWORK     testnet-bradbury
CONTRACT    0x0000000000000000000000000000000000000000   (placeholder; fill after deploy)
EXPLORER    https://explorer-bradbury.genlayer.com
FRONTEND    pending your deploy
```

After deploying, set `NEXT_PUBLIC_CONTRACT_ADDRESS` and
`NEXT_PUBLIC_GENLAYER_NETWORK` in the frontend environment to point the desk at
your deployment. To target a different network, change the chain in
`frontend/lib/genlayer.ts`.

View methods read by the desk: `get_summary`, `get_shows_page`, `get_show`,
`get_cues_for_show`, `get_cue`, `get_evaluation`, `get_acks_for_cue`,
`get_receipt`, `get_receipt_for_cue`, `get_receipt_for_show`. All collection
views are paged with a maximum page size of twenty.

---

## CUE 9 - house rules (limitations)

- CueFrame never fires real cues, triggers real effects, or controls real
  hardware. It classifies whether a described cue would be ready to call. Nothing
  more.
- No deposits, no staking, no escrow, no value transfer. Users pay network fees
  only.
- An AI consensus round on Bradbury can take one to five minutes. The transport
  bar stages that wait as the cue lifecycle; it is expected, not a fault.
- The gate's judgment is probabilistic. The deterministic backstops exist
  precisely because the model can err; they bound the outcome but do not make it
  infallible. A real show still calls its own safety checks.

```
END OF BOOK  -  goodnight, and clear.
```
