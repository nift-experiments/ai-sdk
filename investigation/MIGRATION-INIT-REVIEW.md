# Migration-init review — A0

Generated guidance is preserved verbatim in `init-generated/` with SHA-256 manifest before tailoring. Read AGENTS first, then MIGRATION, HANDOVER, README, every investigation file and Nift config/tracking. Initialization built the placeholder scaffold successfully; it is excluded from migration counts.

## Framework-island discoverability

The generated HANDOVER already says: “A project may use Nift alongside tools such as Vite, React, Vue, Svelte, TypeScript, Go, Node, Python, PHP, serverless functions, or other systems.” It also asks agents to keep frameworks and other tooling where appropriate. Therefore vanilla-only output is not a justified interpretation of the current guidance. I would know frameworks are allowed without the explicit instruction.

However, island architecture is not sufficiently explicit: AGENTS and MIGRATION never name independently bundled client islands, explain their composition boundary or require per-feature decisions. HANDOVER says coexistence, which could also be read as retaining an entire Next.js application. The omission could lead to an overly complex vanilla replacement or an unnecessary full framework runtime; these are risks, not decisions already made.

Proposed MIGRATION addition under source compatibility: “Nift does not require framework-free output. Evaluate interactive features individually: static markup where possible, vanilla JavaScript for simple behavior, and independently bundled React, Vue, Svelte, Solid or other client islands when they are the lightest faithful solution. Nift composes their HTML/mount points and publishes their ordinary JavaScript/CSS assets; the external bundler owns framework compilation. Do not remove functionality merely to avoid a framework dependency, or retain an entire application runtime merely because upstream uses one. Record each island, its rationale, dependencies, bundle bytes, compilation cost and invalidation boundary.”

Proposed AGENTS pointer: “Preserve interactive parity; framework islands are permitted. Follow the per-feature architecture assessment in MIGRATION.md.”

Useful generated manifests already exist: baseline, external inputs, parity contract, divergences and status. Additional recommended scaffold: feature/island decision table; version-family reconciliation; remote UI/transport/backend boundaries; separate unchanged-cached, forced-full and fresh-application definitions. These remain campaign observations, not changes to Nift core/templates. Review will continue at every checkpoint.

## A1 discoveries

Versioned sync produces 1,386 MDX inputs across nine collections; this is not the published route count. Current sources and historical pins have different route/metadata/OG rules. Generated source/output inventories are useful scaffolds, but a version-family reconciliation table and runtime-route inventory are missing. Suggested parity scaffold columns: version, family, authored files, transformed inputs, document routes, aliases, redirect patterns, Markdown endpoints, LLM endpoints, social routes, special runtime routes.

Initialization correctly forbids broad migration before a frozen baseline. Installed Node 22.22.1 lacks built-in TypeScript stripping despite satisfying the upstream numeric engine range, so source tests need a genuine supported runtime capability, not just a version string. Record tool capabilities and hashes.

Upstream sync invokes git fetch --depth=1 for historical pins, introducing shallow markers into a full clone. The original full clone was retained and an unshallow repair is running to preserve history; no source content was changed. Generated guidance should distinguish immutable source files from required generated caches and Git acquisition metadata.

## Core-workspace feedback, ready now

The current HANDOVER permits React/Vue/Svelte, so describe this as an island-composition discoverability gap rather than a demonstrated vanilla-only prohibition. Exact proposed wording is above. Feed this review to later Nift guidance work without editing core/template files during this campaign. Candidate addition to HANDOVER Other stacks: “For mostly static sites, framework components may be independently bundled as client-side islands mounted into Nift-composed pages. External tooling owns those bundles; give Nift explicit dependencies on their outputs. Use the lightest faithful solution per feature.”

### A2 findings

Reference capture counts must not be advertised as migrated parity passes. Proposed scaffold fields: fixture route, viewport, theme/system environment, initial state, action, resulting state, transport mode, external-input hash, screenshot path, assertion and status. Separate local UI, synthetic transport and untested backend columns. Add server hostname to the baseline runtime manifest: upstream locale rewrites made a 127.0.0.1 binding unsuitable despite a successful production build. Include known-card vs arbitrary-query OG behavior before choosing static ownership.

### A3 findings

Framework islands proved practical: real upstream hero/provider/generation components hydrate independently; the recorded graph contains no Next runtime. Explicit link/image/English-locale adapters suffice for these fixtures. The authored path uses real pinned MDX transforms/components, while rendered-source normal builds refresh isolated React mounts from HTML/JSON without invoking an MDX compiler. An island source edit must invalidate both client bundles and server mount markup; retaining old SSR while rebuilding JS would leave hydration stale.

Generated guidance should add an island manifest with mount name, props source, SSR owner, bundle owner, dependency inputs and retirement ledger. Suggested text: "When an island changes, rebuild its assets and any server-rendered mount markup. Unrelated content edits should preserve unchanged island assets. Compare incremental publication against forced recomputation, including stale hashed bundle retirement."

The package manager's declared engine range was insufficient for native TypeScript source tests. Lock installer policy and module capability, not only version labels. Current pnpm settings belong in pnpm-workspace.yaml (https://pnpm.io/settings); use a package-specific build-script allowlist rather than allowing all scripts. A raw compatibility output should be appended without reinterpreting literal template syntax, with explicit source/fragment/layout dependencies.

Server-only frozen shells omitted controls added after upstream hydration. Freeze observable DOM behavior as well as HTTP HTML; the footer theme markup had to be composed explicitly. Record requested CSS viewport dimensions separately from screenshot pixel extents/format; do not infer viewport from a filename or assume screenshot bytes are PNG.

### A4 preparation findings

Authored-file, synchronized-file and published-route counts differ even in one corpus. Preserve original ordered source paths and local pure sync transforms; never carry a network/Git-history mutation stage into routine builds. Proposed guidance: “Store explicit authored-to-rendered-to-route provenance, account for dropped legacy landing pages, and preserve output timestamps when bytes are unchanged. Validate cached artifact existence and hashes; a matching input key alone does not prove publication inputs are intact.” Pin external image bytes as maintained inputs and reject unpinned renderer network requests. Full shell/navigation maintenance remains a separate acceptance gate from successful document-body rendering.
