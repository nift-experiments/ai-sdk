<!-- nift:migration:start -->
## Nift migration

This project is being migrated to Nift.

Read MIGRATION.md for the method, investigation/STATUS.md for where the
migration is, and HANDOVER.md for current state.
The initial Nift scaffold is placeholder; the baseline must be frozen before
any content translation.
Preserve the source baseline until parity verification is complete.
Follow migration checkpoints.
Maintain route/content/behaviour parity unless divergence is explicitly approved.
Record and classify known divergences (investigation/KNOWN-DIVERGENCES.md).
Do not modify Nift core to solve source-project compatibility gaps without
stopping and reporting the requirement.
Prefer compatibility adapters/stages over rewriting source semantics solely for
cleanliness.
Run the required parity/build checks before checkpoint commits.
Update HANDOVER.md and investigation/STATUS.md after meaningful checkpoints.
Do not declare completion without clean-checkout verification.
<!-- nift:migration:end -->

## Project pipeline

Use `python3 scripts/build-proof.py` for representative source edits, then `nift status`. Bare `nift build` composes prepared inputs. A3 has seven prototype routes; do not describe it as the complete site. Full authored sync ownership, shared UI, ancillary outputs and final parity/benchmarks remain open.
