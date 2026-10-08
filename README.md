# AI SDK / Nift migration experiment

Source model: maintained authored Markdown/MDX/frontmatter and original numeric organization.

A0–A4 are accepted. A4 publishes 288 current documentation pages plus five representative routes from A3 (293 routes total). Historical families, ancillary outputs, complete parity and final benchmarks remain open. The upstream reference is pinned to `3ebefff610f96892c50be48cf1838c453e2349f7`. Frozen upstream builds/history and original benchmark evidence remain outside this repository.

Use Node 24.21.0, pnpm 11.23.0, Nift 4.8.0 and Python dependencies from `requirements.txt`. Install with `pnpm install --frozen-lockfile`.

```sh
python3 scripts/build-current-docs.py
python3 scripts/build-current-docs.py --force
nift status
```

Set `AI_SDK_NODE` if the pinned Node binary is not first on PATH. The project command prepares inputs before raw Nift composition. Bare `nift build` composes already prepared HTML. The old `build-proof.py` command owns the seven-route A3 prototype and replaces tracking; use it only when deliberately reproducing that historical scope.

Current documentation authority is `authored/v7/docs/`. The bounded pure synchronization stage derives transient MDX under `generated/synced/`, then pinned MDX/Fumadocs transforms derive transient HTML. Four unrelated prototype fixtures remain under `sources/` pending their family migrations. Current documentation has no duplicate maintained synchronized MDX.

Pinned Geistdocs/Fumadocs React UI preserves shared navigation, mobile drawers, TOC, page actions, themes and footer. Independent React content islands preserve stateful examples. External bundling owns client/server compilation; Nift owns publication composition with explicit dependencies. Neither bundle graph includes a Next runtime. Four non-exported, pinned Geistdocs UI modules are explicitly bound (page actions, breadcrumbs, footer links and TOC); this package coupling is recorded rather than presented as a public API. Unused font-barrel execution is separated from accepted static fonts/CSS, and feedback transport targets a local endpoint. The dependency lock includes a transitive Next peer, which is not executed.

Run `python3 scripts/serve.py --port 4332` for local publication testing (use a different port for the other repo). Compiled pinned redirect rules are maintained under `routes/`. Search/projections/OG and synthetic AI/feedback transport certification remain open; do not infer backend parity from an opening dialog. No live AI, feedback or analytics requests are authorized.

Read `HANDOVER.md`, `investigation/STATUS.md` and the living migration-init review. No Nift core/templates changes are permitted in this experiment.
