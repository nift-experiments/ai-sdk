# BASELINE.md

The frozen upstream reference. Complete this before migrating content.

## Upstream reference

- Upstream repository: https://github.com/vercel/ai
- Upstream commit SHA: 3ebefff610f96892c50be48cf1838c453e2349f7
- Upstream source directory: ../ai-sdk-upstream/apps/docs
- Production build command: pnpm --dir apps/docs build:site (sync-content → fumadocs-mdx → next build; verified from package.json and vercel.json).
- Toolchain / runtime versions: Node 22.22.1; packageManager declares pnpm 11.23.0 (global 11.25.0; acquisition in progress); Next 16.3.6; React ^19.2.3; Geistdocs 2.9.0; Fumadocs core/ui 16.2.2 and MDX 14.0.4; Shiki 3.23.0; Tailwind ^4.1.17. Resolved versions pending locked install. Turbo 2.9.14 exists at monorepo root but docs deployment invokes build:site directly.
- Tool/binary hashes (where relevant):

## Source model

Choose exactly one and describe it:

- [x] authored (human + agent; Markdown/MDX/frontmatter preserved)
- [ ] rendered (agent-primary; rendered HTML/CSS/JS + explicit metadata/nav)
- [ ] hybrid (describe):

Publication/behaviour parity does not require different source models to
preserve identical source semantics.

## Complete production pipeline

A successful build is not necessarily the complete publication. List every
production step in order (build, search/index generation, post-processing,
API/reference generation, downloads/exports, asset processing, deployment
transforms, registry-generated data, multi-stage re-builds):

1.

## Frozen reference output

REFERENCE OUTPUT (immutable, upstream):
    <absolute path>
MIGRATION OUTPUT (Nift, changes over time):
    <absolute path>

Never point parity comparison at MIGRATION OUTPUT on both sides.

## Upstream nondeterminism classification

- [ ] byte deterministic
- [ ] semantic deterministic
- [ ] nondeterministic but bounded/understood (describe)
- [ ] unresolved

## Baseline measurements

- Upstream build time (method, median/range):
- Upstream peak RSS:
- Environment / hardware:

## Toolchain acquisition

Selected official Node v24.21.0 Linux x64 (SHA-256 checked against vendor SHASUMS256) and pnpm 11.23.0 (registry tarball integrity verified), retained outside migration repositories in ../ai-sdk-baseline/toolchain. Built-in TypeScript stripping capability checked. Earlier bundled Node 22.22.1 test failures are environment diagnostics, not baseline failures or timings. First global-pnpm install passed lockfile supply-chain checks but timed out on dependency transfer; retry uses declared pnpm and reduced network concurrency without changing lockfile.

## Locked dependency resolution

next 16.3.6, react 19.2.6, react-dom 19.2.6, @vercel/geistdocs 2.9.0, fumadocs-core 16.2.2, fumadocs-mdx 14.0.4, fumadocs-ui 16.2.2, shiki 3.23.0, tailwindcss 4.3.0, motion 12.42.2, streamdown 2.5.0. Full source history restored after upstream historical sync shallow fetches. 36 upstream source tests pass under official Node 24.21.0. Production build running; no accepted timing yet. Acquisition/install time excluded from future benchmark timing.
