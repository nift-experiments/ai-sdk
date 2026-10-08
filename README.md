# AI SDK / Nift migration experiment

Source model: maintained Markdown/MDX/frontmatter; transient compatible HTML.

A0–A2 are accepted. A3 currently publishes seven representative routes. This is an architecture proof, not the completed migration or final benchmark. The upstream reference is pinned to `3ebefff610f96892c50be48cf1838c453e2349f7`; frozen output/history/evidence stays outside this repository.

Use Node 24.21.0, pnpm 11.23.0, Nift 4.8.0 and Python with `requirements.txt` installed. Install dependencies with `pnpm install --frozen-lockfile`. Run:

```sh
python3 scripts/build-proof.py
python3 scripts/build-proof.py --force
nift status
```

Set `AI_SDK_NODE` when the pinned Node binary is not first on PATH. The project command prepares its owned inputs before Nift composition. `nift build` alone composes already prepared HTML.

The human path uses the pinned MDX/Fumadocs transforms and upstream component ports. Its current representative `sources/` are synchronized MDX fixtures; full authored organization/sync ownership is required before scaling.

The UI ports replace only corpus-required Next link/image/English locale behavior. Independently bundled React islands retain the stateful hero, provider/model examples and simulated generation. No Next runtime appears in the island artifact graph. Geistdocs has a transitive Next peer in the installation lockfile; this prototype does not run it.

Catalog/media bytes are maintained static assets with frozen provenance. Normal proof builds make no AI, feedback or analytics requests. Full search/navigation, ancillary routes, OG runtime behavior, corpus migration, publication/browser parity, clean-checkout verification and final benchmarks remain open. Read `HANDOVER.md`, `investigation/STATUS.md`, and the living migration-init review before continuing.
