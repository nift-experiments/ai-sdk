# External inputs — A1 discovery

Upstream pin: 3ebefff610f96892c50be48cf1838c453e2349f7. Locked dependency installation in progress; not yet a frozen baseline.

Historical content: v6 0fb3a2241334c3e9df9aa15c86cb26c1cee9ba3a; v5 239ea3a151f81aa55b78d8eeca5fd20555730de5. Sync fetches git refs with archive/tarball fallback and caches under apps/docs/node_modules/.cache/ai-sdk-docs. Preserve complete upstream history and archived historical content outside migrations.

Font input: Next Google-font acquisition (Geist/Geist Mono); capture exact bytes before parity freeze. Home stats read public npm/GitHub counts, with authored fallback values and 3s timeouts; capture and freeze accepted responses separately. External image/video/model-list inputs require URL/hash inventory.

Runtime search is a version-selected local Geistdocs index, not assumed remote search. AI chat has optional Geistdocs proxy credentials: never request/use private credentials; deterministic fixture transport only. Feedback files upstream GitHub issues through Geistdocs; Markdown tracking POSTs to geistdocs.com/md-tracking; Vercel Analytics is mounted globally. Block these mutations/telemetry during reference and migration tests. Remote UI parity, transport shape and unexercised backend behavior must be reported separately.

OG has current-source slug image routes and a query-param shape with bounded arbitrary title/description. Capturing published cards as static assets alone does not preserve arbitrary query behavior. Evaluate a bounded route handler plus explicit static maintenance; do not erase this behavior. Historical versions are noindex with no social cards.

Root build invokes Turbo; docs vercel.json directly uses pnpm build:site. Root SDK/package builds are not silently included in docs benchmarks.

## Exact image delivery qualification

Six remote Markdown image inputs captured successfully, bodies/mime/SHA-256 retained in external baseline. Native attempts 01/02 failed direct image acquisition; attempt 03 supplies those identical image bytes through a narrow fetch hook, preserving dimension decoding, MDX compilation, worker startup and complete production pipeline. No upstream content/config/core changed. This is prepared-external-input production timing; do not label it an unchanged direct-network official task timing. Hook rejects outbound non-GET/HEAD requests. Font handling remains upstream and output font hashes will be recorded.
