# Migration-init review — A0

Generated guidance is preserved verbatim in `init-generated/` with SHA-256 manifest before tailoring. Read AGENTS first, then MIGRATION, HANDOVER, README, every investigation file and Nift config/tracking. Initialization built the placeholder scaffold successfully; it is excluded from migration counts.

## Framework-island discoverability

The generated HANDOVER already says: “A project may use Nift alongside tools such as Vite, React, Vue, Svelte, TypeScript, Go, Node, Python, PHP, serverless functions, or other systems.” It also asks agents to keep frameworks and other tooling where appropriate. Therefore vanilla-only output is not a justified interpretation of the current guidance. I would know frameworks are allowed without the explicit instruction.

However, island architecture is not sufficiently explicit: AGENTS and MIGRATION never name independently bundled client islands, explain their composition boundary or require per-feature decisions. HANDOVER says coexistence, which could also be read as retaining an entire Next.js application. The omission could lead to an overly complex vanilla replacement or an unnecessary full framework runtime; these are risks, not decisions already made.

Proposed MIGRATION addition under source compatibility: “Nift does not require framework-free output. Evaluate interactive features individually: static markup where possible, vanilla JavaScript for simple behavior, and independently bundled React, Vue, Svelte, Solid or other client islands when they are the lightest faithful solution. Nift composes their HTML/mount points and publishes their ordinary JavaScript/CSS assets; the external bundler owns framework compilation. Do not remove functionality merely to avoid a framework dependency, or retain an entire application runtime merely because upstream uses one. Record each island, its rationale, dependencies, bundle bytes, compilation cost and invalidation boundary.”

Proposed AGENTS pointer: “Preserve interactive parity; framework islands are permitted. Follow the per-feature architecture assessment in MIGRATION.md.”

Useful generated manifests already exist: baseline, external inputs, parity contract, divergences and status. Additional recommended scaffold: feature/island decision table; version-family reconciliation; remote UI/transport/backend boundaries; separate unchanged-cached, forced-full and fresh-application definitions. These remain campaign observations, not changes to Nift core/templates. Review will continue at every checkpoint.
