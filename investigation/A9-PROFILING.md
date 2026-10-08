# Profiling and optimization — candidate evidence

Final benchmark acceptance is pending. These are single engineering diagnostic builds, not five-sample medians. The initial faithful implementation is preserved at A7: `ai-sdk` a622b4f and `ai-sdk-agent` 63ce5fd. Frozen upstream production evidence remains outside both repositories.

The initial authored pipeline took 140.712 seconds summed across sequential phases: MDX compatibility/SSR 89.101 seconds, Markdown downloads 24.902 seconds, shared shells 12.743 seconds, search 6.393 seconds, Nift composition 2.533 seconds. The initial HTML-source pipeline took 91.409 seconds: maintained HTML island refresh 62.036 seconds, shared shells 16.772 seconds, search 6.251 seconds, Nift composition 2.927 seconds. Neither is native Nift `@markup` performance.

The first broad cache attempt was rejected: retaining every unique Shiki HAST and compiled file made MDX slower (108.15 seconds) and raised maximum individual process/phase RSS to approximately 2.49 GiB. The accepted candidate retains only reused compiled bodies until their last use and applies a bounded, repeated-input Shiki cache. Four bounded Node workers share initialization within each shard; equal bodies stay in one shard. Of 1,386 documents, 201 compilations are reused within a forced run. Compiled body products are separately content-addressed from metadata and renderer dependencies.

The HTML-source pipeline now lexically locates just island hosts, batches SSR once, and replaces only host interiors. Static maintained bytes remain opaque. Its 1,415 documents contain 983 mounts (972 documentation, 11 ancillary). A real-corpus independent DOM proof checks host boundaries and adjacent JSON; complete publication/browser gates check resulting UI. No Markdown compiler is introduced into this project.

Islands, chrome and runtime use esbuild's actual transitive input graphs, explicit plugin-loaded inputs, Node/environment/lock inputs, and output SHA/existence validation. A content edit does not rebuild the island bundle. A changed import triggers graph recapture through its importer. Compiled client assets and SSR bundles have explicit ownership and retirement.

Version-menu props include only the current path's relevant ancestors and fallback. All 5,022 published-path/version-item comparisons match the pinned public resolver using the complete inventory. Search databases are separately cached per version; Markdown projections are cached per authoritative source; discovery depends on its version's projections. Redirect rules are snapshotted into deployment runtime explicitly. Deleted manifest-owned Markdown outputs are retired alongside deleted HTML.

The four-worker diagnostic authored pipeline took 53.642 seconds: MDX 27.38, Markdown downloads 7.55, shared shells 7.40, search 4.64, Nift composition 1.69. The corresponding HTML-source diagnostic took 25.673 seconds. These observations preceded the final correctness campaign and are not final benchmark claims.

## Counter scope

Sequential phase elapsed times partition pipeline wall time. MDX parse, transform, evaluation and React counters are internal stage counters. Shiki is nested within transforms, and family counters overlap compiler counters. Worker task-time sums can exceed wall time. Never add nested/task counters to sequential phase timings. The initial `io_hash_ms: 0` field is uninstrumented, not evidence of zero I/O; residual time includes preparation, bundling, hashing, artifact IO and process overhead. Agent lexical/SSR/write counters cover its internal refresh loop, not all process lifetime. Publication's redirect counter is nested within runtime-assets time.

GNU time's maximum RSS is the maximum measured individual process/phase, not concurrent aggregate memory. Final benchmarks additionally sample the live descendant process tree every 50 ms and sum RSS; shared pages can be counted more than once and short peaks can be missed. Both scopes must remain visible, especially with bounded workers.

## Remaining profiling targets

MDX parsing/highlighting remains an authored-source cost. Shared shell SSR, corpus metadata/hash scans, per-version search export and reference/runtime copying remain material. A navigation change still legitimately fans out over its tree's shells. The content registry remains one eager client entry (seven outputs, 1,131,411 bytes) with 16 island families, and shared chrome remains approximately 2,035,693 output bytes; no claim is made that each page downloads every byte or that each family is a separate bundle. Dynamic OG requests retain their runtime; normal builds publish fonts/background and metadata rather than regenerating every image. Live AI/feedback production services remain unexercised.

Authored MDX/frontmatter and organization remain maintained source in `ai-sdk`. Rendered HTML plus explicitly coordinated metadata/navigation/Markdown/LLM projections remain maintained source in `ai-sdk-agent`. No Nift core change is included.

See lifecycle/ for controlled changed-input observations, incremental/forced publication equality, route retirement, and generated-artifact corruption recovery. These are single engineering observations rather than final benchmark medians.
