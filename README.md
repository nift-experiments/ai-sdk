# AI SDK / Nift migration experiment

Maintained source model: authored Markdown/MDX/frontmatter and original ordered sources. Upstream is pinned to `3ebefff610f96892c50be48cf1838c453e2349f7`.

A0–A6 are accepted. A6 publishes the complete 1,674-route publication; full browser parity, lifecycle benchmarks, optimization and final judgement remain open. Frozen upstream output/history/logs live outside this repository. These preparation runs are not headline benchmark samples.

Use Node 24.21.0, pnpm 11.23.0, Nift 4.8.0 and `requirements.txt`. Install with `pnpm install --frozen-lockfile`.

```sh
python3 scripts/build-content.py
python3 scripts/build-content.py --force
nift status
node scripts/serve.mjs --port 4334 --fixtures
```

Set `AI_SDK_NODE` if the pinned Node binary is not on PATH. The project command prepares fragments and runtime assets before Nift raw composition. Bare `nift build` composes already prepared HTML. Historical `build-proof.py`, `build-current-docs.py` and `build-docs.py` replace tracking with their earlier scopes; use them only to reproduce those checkpoints.

The 1,386 primary document bodies, 259 recipe aliases, and 29 ancillary/home pages are distinct from the 506 compiled redirect rules. Markdown downloads, seven discovery projections, sitemap, robots, search databases and runtime handlers are separate publication surfaces.

Authority is authored/v5, authored/v6, authored/v7 and authored/pages plus structured inputs. Pure local pinned synchronization derives transient MDX; a corpus-bounded pinned MDX/Fumadocs renderer derives HTML and structured references.

Static layout/content remains HTML. Pinned React islands retain navigation/search/version/theme/Ask AI and stateful demos. Simple positional tabs and code/card copying use vanilla controls. External bundlers own client/server artifacts; Nift composes explicit raw dependencies. Bundle graphs exclude a Next application runtime, although the lock contains an unused Next peer. Four pinned internal Geistdocs UI modules and one pinned Fumadocs search reader are explicit corpus-bounded bindings, not advertised public APIs.

Deploy `public/`, `runtime/`, `routes/redirects.json`, `scripts/serve.mjs` and the locked runtime dependencies together. The server supports static assets/ranges, Markdown negotiation, redirects, search, query/slug OG images, 404s and bounded chat/feedback transports. OG rendering is request-driven, not normal-build regeneration. Reference robots reflect the frozen preview deployment (`Disallow: /`); production indexing policy requires explicit deployment configuration.

`--fixtures` keeps chat/feedback local. No live AI, feedback or analytics requests are authorized in this campaign. Production transport code is preserved, but backend services/private credentials are not exercised. External playground remains a separately hosted application.

Read HANDOVER.md and investigation/STATUS.md. No Nift core/templates changes are permitted.
