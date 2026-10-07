# STATUS.md

Resumable migration state. A new agent should be able to read `AGENTS.md`,
`MIGRATION.md`, this file and `HANDOVER.md` and know exactly where the
migration is without reconstructing history.

## Phases

Mark each: not started / in progress / blocked / done.

| Phase | Status | Acceptance criteria | Required evidence | Commands | Commit |
| --- | --- | --- | --- | --- | --- |
| 1 Baseline frozen | | | | | |
| 2 Parity contract + fixtures | | | | | |
| 3 Initial Nift structure | | | | | |
| 4 Shared shells/templates | | | | | |
| 5 Authored content | | | | | |
| 6 Source compatibility | | | | | |
| 7 Route/content/render parity | | | | | |
| 8 Incremental correctness | | | | | |
| 9 Benchmark | | | | | |
| 10 Clean-checkout verification | | | | | |
| 11 Handover / final report | | | | | |

GATE: compatibility proof must precede broad content translation. Do not mark
phase 5 in progress until phases 1-4 acceptance criteria are met.

## Current

- Checkpoint: A0 complete; A1 upstream acquisition in progress.
- Commit SHA:
- Known blockers:
- Next checkpoint: A1 frozen production baseline, then A2 parity contract.
