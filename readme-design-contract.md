# README Design Contract

## readmeArchetype
Stage manager's prompt book and show call sheet. The README is itself a running
prompt book: a monospaced call-sheet header, a STANDBY briefing, then numbered
CUE sections called in show order, closing on "END OF BOOK". It reads like the
document a stage manager keeps at the desk to run a live event, not like a
software manual.

This archetype is distinct from persona-seal's consent-charter form (a legal
Preamble with numbered Articles and lettered Annexes) and from the banned default
heading skeleton.

## readmeNarrativeVoice
Control-room briefing voice: terse, imperative, calm under load. It addresses the
reader as the person about to take the desk ("Read it top to bottom before you
take the desk"). It uses theatrical calls (standby, go, on air, dark, clear) as
structural language rather than decoration. No marketing tone, no hype.

## readmeSectionPattern
Call-sheet header block ->
STANDBY (what is on the desk: one-paragraph product definition) ->
CUE 1 The call sheet (on-chain state model: five record kinds) ->
CUE 2 The gate (the six outcomes, the consensus question, why GenLayer) ->
CUE 3 Standing orders (deterministic guards before the model) ->
CUE 4 The backstops (deterministic invariants after consensus) ->
CUE 5 The panel on book (validators of record and what each rejects) ->
CUE 6 The desk (frontend architecture, visual system, custom motion, theater) ->
CUE 7 Taking the desk (local setup as a numbered call list) ->
CUE 8 Dark (deployment notes, placeholder contract address, view methods) ->
CUE 9 House rules (limitations) ->
END OF BOOK sign-off.

The cue-numbered show-order sequence is unique to CueFrame and is not the
Article/Annex order used by persona-seal, nor the banned default skeleton.

## readmeMotif
Show calls and the prompt book. Section headers are CUE numbers called in running
order; transitions borrow the stage manager's vocabulary (STANDBY, GO, ON AIR,
DARK, CLEAR). Key nouns are capitalized as defined records: Show Spine, Cue Card,
Role Acknowledgement, Evaluation, Receipt. Monospaced blocks stand in for desk
readouts and call-sheet headers.

## requiredFactsPlacement
- Project identity and one-sentence description: header block and STANDBY.
- Live frontend URL: CUE 8 (noted pending the user's own deploy).
- Contract address, network, explorer: CUE 8 (placeholder zero address).
- Why GenLayer is essential: CUE 2.
- Contract state model: CUE 1.
- Main write methods and what they mutate: CUE 4.
- Main view methods: CUE 8.
- Consensus question: CUE 2.
- Validator substance and what is rejected: CUE 5.
- Deterministic guards before AI: CUE 3.
- Deterministic backstops after consensus: CUE 4.
- Frontend architecture and app shell: CUE 6.
- Visual and motion system: CUE 6.
- Local setup: CUE 7.
- Testing instructions: CUE 7.
- Deployment notes: CUE 8.
- Known limitations: CUE 9.

## bannedReadmePatterns
- The banned default heading skeleton (What it is / Why GenLayer is essential /
  Contract mechanic / ... / Known limitations).
- persona-seal's consent-charter Preamble + Articles + Annexes structure.
- Opening with a marketing paragraph or a badge row.
- Emoji of any kind; the em-dash character U+2014 anywhere in the document.

## proofOfDifference
persona-seal's README is a consent charter written in a legal-charter voice, with
a Preamble, Articles I through VII, and Annexes A and B; its motif is rights and
clauses. CueFrame's README is a stage manager's prompt book written in a
control-room briefing voice, with a call-sheet header, a STANDBY, CUE 1 through
CUE 9 called in show order, and an END OF BOOK sign-off; its motif is show calls
and the desk. The document metaphor, the section ordering, the structural
vocabulary, and the voice are all different from persona-seal and from the banned
default skeleton.
