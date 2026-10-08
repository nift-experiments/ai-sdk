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

Package barrel exports can execute unused font compiler modules, and server actions need explicit standalone transport ownership. Proposed guidance: “Inspect bundled runtime graphs when reusing framework UI packages. Distinguish public component reuse from framework server behavior; pin fonts/static assets and record every corpus-bounded adapter. A dialog opening is not proof that its search or backend transport works.” Shared UI can wrap an opaque maintained/rendered HTML slot, but nested islands and page actions need their own hydration and invalidation tests before acceptance.

### A4 publication findings

Record pinned internal UI bindings separately from public APIs. Serialize heading titles as structured React children: HTML-only labels broke desktop text extraction while mobile rendering worked. Test both modes. Define necessary production constants outside the original framework and inspect console failures. Compare document/social titles including section-label rules. Browser visible-text checks should exclude inert island-props scripts; separately verify exact code and hidden metadata ownership. Keep UI/transport/backend acceptance separate.

### A5 historical findings

Preserve versioned authored provenance and distinguish ordered original files from synchronized pages. Derive version switching from available route sets so missing target pages fall back like upstream. Include maintenance-version robots and social-image rules, plus Markdown alternate links, in head comparisons. Serialize fixture mutations and publication verification. Check restored sources against the immutable original corpus, rather than only against an in-memory backup that could already contain an interrupted fixture. Store test backups outside maintained inputs before mutation.

### A6 complete-family findings

Pin transitive content serializers, not only top-level renderer packages: a minor mdast serializer difference changed escape bytes in otherwise equivalent Markdown downloads. Preserve original source enumeration when search relevance ties or discovery ordering expose it. Explicitly document every required private package binding, runtime HTTP owner, stylesheet sidecar and deployment artifact. A public route factory may still expect a framework request property such as nextUrl; isolate that small boundary rather than importing a framework server.

Proposed guidance: “Reconcile primary pages, aliases, redirects, negotiated Markdown, discovery/search and dynamic API surfaces separately. Preserve maintained structured reference data in a rendered-source model, and explain which inputs must be coordinated when editing. Test production transports with deterministic local fixtures; never equate fixture UI success with live backend certification.”

A preserved frozen HTML shell does not prove client parity. The landing prototype hydrated its hero but omitted install selectors and lower-page demos. The complete page now composes authored static layout with isolated interactive sections and shared navigation. Suggested scaffold: an interaction inventory per page section, with static/vanilla/island classification, mount/props/SSR/client owner, remote boundary and evidence state. Test each section after hydration, including controls outside the first viewport.

Package install policy must reject ambiguous placeholders: pnpm can write an unreviewed dependency build-script setting, which needs an explicit allow/deny decision. Search/LLMS projection order and renderer bytes belong in the input manifest. Community stats frozen as maintained data and request-generated OG images must be classified separately from routine build products.

A7 transport probing found that reusing `/api/feedback` collided with the upstream retired-playground API contract. The standalone documentation feedback adapter uses `/api/docs-feedback`; the old endpoint keeps its required 410 response. Proposed guidance: “Inventory reserved and retired API routes before assigning standalone transport paths. Exercise success/error submissions, not only opening a form or checking GET responses.”


### A7 asynchronous browser fixtures

A media preview begins playback only after its generation animation; a toast auto-dismisses; repeated synthetic message IDs can violate IndexedDB uniqueness. Proposed guidance: “Test completed asynchronous states with semantic conditions, capture transient states immediately, and give fixture messages valid unique IDs. Preserve failed observation attempts without treating a stale capture as a product defect. Probe local persistence separately from remote backend functionality.”

A route/link audit must include CSS URLs and restrict redirect matching by host conditions. Proposed scaffolding: a local-link inventory with explicit categories for static files, published routes, runtime endpoints, host-compatible redirects and inherited upstream failures. Record streamed soft-404 behavior separately from missing migrated pages.

### A9 profiling and dependency findings

The first faithful migration was not the final production architecture: whole-DOM island refresh, repeated MDX work, and repeated Markdown conversion dominated preparation. Preserve initial evidence and rejected optimizations. A broad HAST/compiled-file cache increased time and memory; bounded retention plus four worker processes improved throughput without discarding outputs. Suggested guidance: “Profile the complete publication before accepting benchmark numbers. Separate wall-time phases from nested plugin counters and concurrent task-time sums. Measure concurrent process memory when introducing worker pools; maximum individual-process RSS does not describe their aggregate footprint.”

Use actual compiler input graphs and validate cached output existence and SHA. Separate compiler/body keys from renderer and metadata keys. Store independently owned SSR and client island products; content edits should not rebuild an unchanged island entry. Prove narrower version-route data against the original resolver, and test corruption recovery as well as input changes. Suggested scaffold: dependency scope, output owner, integrity check, invalidation cases and retirement rule for each build product.

An HTML-source workflow requires explicit coordination among maintained HTML, search metadata, Markdown downloads and LLM projections. This is a real source-model maintenance tradeoff, not a reason to sneak a Markdown compiler into its routine build. Lifecycle fixtures must exercise that coordination and restore every input from external immutable backups. Report shared navigation fan-out and unchanged corpus/hash/IO costs honestly.
