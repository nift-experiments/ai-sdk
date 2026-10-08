# HANDOVER.md
v0.0.8

This is a living handover for working effectively in a Nift project.

Canonical version:

https://nift.dev/HANDOVER.md

Check the version at the top of this file against the canonical copy when the
project is old, unfamiliar, or behaving differently from the current Nift
documentation.

To replace this file with the latest canonical version:

```sh
curl -fsSL https://nift.dev/HANDOVER.md -o HANDOVER.md
```

If this project has project-specific additions, preserve or reapply them when
updating the canonical handover.

This project uses Nift as part of its website build process.

Nift is the project's build-time templating and dependency layer. It does not determine what the website is about or what other technologies the project should use.

Keep the existing project architecture and use the project's normal HTML, CSS, JavaScript, frameworks, backend, and other tooling where appropriate.

Do not introduce Nift-specific machinery where ordinary web tooling is the clearer solution.

## Start here

Before making substantial changes:

1. Inspect `.nift/config.json` and `.nift/tracked.json`.
2. Inspect the existing `content/`, `templates/`, and output structure.
3. Read this project's `README.md` and other project-specific documentation.
4. Run:

```sh
nift status
```

During normal development, build frequently:

```sh
nift build
```

Use this throughout a task, not only at the end. Rebuild after meaningful
changes so Nift can surface template, path, dependency, configuration, and
tracking errors while the cause is still obvious.

In particular, run `nift build` immediately after editing
`.nift/config.json` or `.nift/tracked.json`.

Use:

```sh
nift status
```

when you want to inspect what Nift considers stale and why.

Successful `nift build` output may include indented `↳ ...` lines explaining
why a page was considered stale and rebuilt, such as a missing generated output
or a changed dependency. These are rebuild reasons, not errors. Actual build
failures are reported as errors and cause the build to fail.

Do not delete or recreate `.nift/`.

## Nift's core template model

Most Nift websites need very little Nift-specific syntax.

The three primitives you will use most often are:

```text
@content
@input(...)
@path(...)
```

`@content` inserts the tracked page's content into its template.

```html
<main>
    @content
</main>
```

`@content` should execute exactly once across the rendered template/input graph
for a tracked page. It is normally placed in the page's template; the tracked
content file supplies the content inserted there.

Content files may still use other Nift syntax when needed. If page text needs
to display Nift syntax literally, prefix the active sigil with `\` rather than
leaving it as template syntax:

```html
<code>\@content</code>
<code>\@path('about')</code>
<code>\$[title]</code>
```

This applies whenever `@...`, `$[...]`, or other Nift syntax is intended as
literal output rather than something Nift should execute or resolve.

`@input(...)` inserts a reusable file and automatically makes it a dependency of the output using it.

```html
@input('templates/header.html')

<main>
    @content
</main>

@input('templates/footer.html')
```

### Structured JSON and markup sources

Use name-first `@json` when a template needs immutable structured data:

```text
@json(name, path)
@json(name, schema-path, path)
@json(name, schema-name, path)
@json(name){...}
@json(name, schema-path){...}
@json(name, schema-name){...}
```

Inline bodies are evaluated as Nift templates before JSON parsing. A schema
name refers to an earlier JSON binding. Data and schema files are automatic
dependencies and paths must stay inside the project.

Use `@markup(format){...}` or `@markup(format, path)` for Markdown (`md`),
AsciiDoc (`adoc`) or reStructuredText (`rst`). Nift evaluates template syntax in
the source first, Markup++ converts it once, and the resulting HTML is appended
without being parsed as Nift syntax again. File sources and host-resolved
AsciiDoc/RST includes are automatic dependencies.

`@path(...)` creates project-aware links to tracked pages and local assets.

Nift has additional features including metadata, JSON data, loops, conditionals, pagination, contracts, and explicit dependencies. Use them when the project actually needs them; do not use advanced features merely because they exist.

When writing expressions inside constructs such as `@if(...)`, refer to values directly rather than wrapping them in `$[...]`. For example:

```html
@if(name == 'about'){...}
```

Use `$[...]` when resolving or rendering a value into output, for example `$[title]`. Consult the expressions and control-flow documentation when using more advanced expression syntax.

## Internal links: use `@path`

Use `@path(...)` for internal links.

This applies to:

- links between pages;
- stylesheets;
- JavaScript;
- images and other local assets where Nift should know the relationship.

For pages, link to the **tracked page name**, not its generated file.

```html
<nav>
    <a href="@path('/')">Home</a>
    <a href="@path('about')">About</a>
    <a href="@path('docs')">Docs</a>
    <a href="@path('contact')">Contact</a>
</nav>
```

Do this:

```html
<a href="@path('about')">About</a>
```

Do not do this:

```html
<a href="@path('about.html')">About</a>
```

and do not hard-code the generated output path:

```html
<a href="about.html">About</a>
```

The tracked page name is the stable project identity. Its output filename or location may change independently.

CSS and JavaScript includes should also use `@path(...)`:

```html
<link rel="stylesheet" href="@path('public/assets/style.css')">
<script src="@path('public/assets/app.js')"></script>
```

Do not calculate relative paths such as:

```html
<link rel="stylesheet" href="../../assets/style.css">
```

Using `@path` lets Nift resolve the correct output-relative path and check the project relationship during the build.

## Project configuration

`.nift/config.json` contains project-level Nift configuration.

`.nift/tracked.json` describes tracked pages and their metadata, including things such as their content, template, and output relationships.

By default, ordinary CSS, JavaScript, images, fonts and other static assets live
directly in the configured output tree (normally `public/`) and do not have
entries in `.nift/tracked.json`. Edit those files in place. This keeps Nift's
tracked graph focused on content that Nift actually renders and avoids duplicate
source/output copies for files that need no build-time transformation.

Track an asset only when Nift genuinely needs to generate it from content,
templates or build-time data. Template-less tracked entries remain available for
that advanced case; they are not the default asset workflow.

These files are part of the project and should evolve with its structure.

If you add, remove, or reorganise pages, templates, outputs, deployment settings, or other Nift-managed structure, inspect the relevant `.nift` configuration and update it where necessary.

Do not treat `.nift/` as disposable generated state.

Do not invent `.nift/tracked.json` fields or assume arbitrary fields become
`$[...]` metadata. When you need tracking behaviour or metadata that is not
already demonstrated by the project, consult the tracked-files and metadata
documentation rather than guessing.

## Output directory

Do not assume the generated website always lives in `public/`.

A normal Nift project may use `public/`, but deployment targets can use a different output structure appropriate to the platform.

Inspect `.nift/config.json` before making assumptions about output paths.

Edit Nift-managed page sources rather than their generated output. Edit untracked
static assets directly in the configured output tree, unless the project
documents another tool or source directory as their owner.

## Pagination

Pagination has several related pieces across `.nift/tracked.json`, page
content, pagination templates, and generated page links. Do not infer its full
behaviour from this handover.

If working with pagination, read the dedicated documentation first:

https://nift.dev/docs/pagination.html

Preserve the project's existing pagination structure unless the task actually
requires changing it, and run `nift build` frequently while doing so.

## Other stacks and tools

Nift does not need to own the whole application.

A project may use Nift alongside tools such as Vite, React, Vue, Svelte, TypeScript, Go, Node, Python, PHP, serverless functions, or other systems.

Keep responsibilities separated:

- use Nift for build-time composition, tracked relationships, and dependencies;
- use the neighbouring tool for the job it is designed to do.

Do not replace an existing stack with Nift-specific code simply to make more of the project use Nift.

## Before finishing

Run:

```sh
nift build
nift status
```

The build should succeed and `nift status` should report the project up to date.
Spot-check generated output when changes affect paths, templates, tracked
relationships, or deployment structure.

## Documentation

Nift documentation:

https://nift.dev/docs.html

When unfamiliar with the project, prioritise:

1. Getting started — https://nift.dev/docs/getting-started.html
2. the three-primitives/template-language material;
3. paths and tracked files, especially `@path`;
4. project structure;
5. `.nift/config.json` and `.nift/tracked.json`;
6. incremental builds and CLI commands.

Then read feature documentation only when the task requires it, for example:

- JSON and control flow;
- pagination;
- contracts;
- minification;
- deployment targets;
- integration with other application stacks.

Prefer documented Nift behaviour and the existing project structure over guessing based on another website generator or framework.

## AI SDK experiment — A0

Source model: authored Markdown/MDX/frontmatter. Original generated guidance preserved in investigation/init-generated. Framework islands allowed with feature-specific justification; no broad migration before frozen upstream publication. Upstream clone in sibling ai-sdk-upstream is pinned and frozen; see accepted A1 below. Public GitHub repositories created after explicit visibility approval. Nift core/templates must remain unchanged. Next: pin upstream, inspect actual production pipeline/external services, build/freeze reference, continue living init review.

### A1 acquisition progress

Pinned upstream 3ebefff610f96892c50be48cf1838c453e2349f7; nine synced collections/1,386 MDX inputs archived and hashed outside experiment repos in ../ai-sdk-baseline. Frozen-lock dependency install and baseline subsequently completed; see accepted A1 below. No migration translated at this acquisition checkpoint. A0 committed/pushed independently. Investigate supported Node runtime with TypeScript capability and use declared pnpm 11.23.0 before baseline measurements.

### A1 accepted / A2 in progress

See A1-BASELINE-SUMMARY.json. Complete prepared-image production reference succeeded (231.59s single run; process/phase RSS 19,894.51 MiB). 1,674 public HTML routes all HTTP 200; 24 special probes recorded externally. Frozen full build archive/hash and source/input inventories outside migration repos. Use localhost binding, not 127.0.0.1, for Next reference locale routing. Browser reference proxy on localhost:4324 blocks telemetry/POST; original working server localhost:4323 guards outbound writes. Next: finish representative themes/viewports/interactions, characterize nondeterminism, prove bounded MDX/islands/raw-composition dependencies for both models before broad corpus work.

### A2 contract frozen

72 initial reference states hashed in investigation/A2-REFERENCE-MANIFEST.json; interaction evidence external. These are not migration parity passes. A3 representative bounded renderer/island/dependency proof is next; final interaction and nondeterminism coverage remains open. Fixture proxy localhost:4325 pins public catalog/media script URLs; no live AI/feedback certified.

### A3 representative proof

Seven routes compose through explicit raw dependencies. Six real MDX bodies match reference text, heading anchors, links and code text. Both models pass changed-page/literal-template, changed-island SSR/assets, title/description-removal incremental vs forced checks. See committed evidence JSON. Both models also pass seven-page shared-theme fan-out and missing/corrupt rendered-cache recovery checks. Source inputs are restored after tests. React hero/provider/generation interaction probes work without console errors. This is not full browser/publication parity; shared navigation/search/special families and authoritative authored sync still precede completion. Read README for pinned tools and normal project command. No Nift core/template changes.

## A4 source preparation (publication acceptance still open)

All 288 current documentation bodies pass frozen-reference text, heading-anchor, link and exact code comparisons. The human repository preserves all 294 original authored MDX files with numeric ordering under `authored/v7/docs/`; the pinned pure upstream sync transforms produce 288 MDX pages and 307 total synchronized files byte-identical to the frozen sync output. Six dropped legacy index pages are intentionally distinct from published routes. The agent repository maintains the 288 resulting HTML bodies and explicit metadata/routes in `current-docs.json`, plus maintained structured navigation. No routine Markdown renderer is added to the agent path.

This is content preparation, not complete A4 page publication or browser parity. Existing seven-route proof publication remains separate while the shared navigation/UI composition is implemented. Authored-source edits in the full corpus use `scripts/prepare-current-docs.py`; `scripts/build-proof.py` still exercises the A3 fixture pipeline. Do not treat the prototype `sources/` as full-corpus authority.

Current corpus discovery adds BrowserIllustration, InlinePrompt and CardPlayer islands because their observable animation, prompt and play/pause behavior requires state. Their client and server markup share the upstream components. Asset-cache validity now checks every generated bundle hash, rather than assuming the cache record proves output files exist.

### Shared UI probe

`node scripts/probe-docs-chrome.mjs` renders public package navbar/sidebar/version/footer/provider APIs around an opaque article slot. The server/browser probes have zero Next runtime inputs after separating unused font-barrel execution and the feedback server-action transport. Route hooks use explicit route context and ordinary document navigation. This remains an investigation, not the accepted full-corpus publication implementation. Current browser probe shows sidebar disclosure, version menu and search modal with no observed console warnings/errors. Search results, version fallback, resource dropdown and article/mobile actions remain uncertified. Client probe totals 1,977,268 bytes across 19 outputs; record and profile this cost rather than presenting it as minimal. Temporary public probe artifacts were removed; evidence remains outside the migration repository. The shared UI prototype has not been applied to `ai-sdk-agent` yet.

## A4 current publication validation

The current command publishes 288 current docs plus five remaining A3 prototype routes through shared pinned UI and raw Nift composition. Both 288-page content/TOC comparisons pass. Current-page edits with literal Nift syntax and title/description removal pass incremental-versus-forced byte comparisons; source inputs are restored. Final head checks and cache/shared-layout tests precede A4 acceptance. Current documentation authority is original authored sources in the human project and maintained HTML/metadata/navigation in the agent project. Do not run the seven-route proof command as a normal full-corpus build.

The shared UI is now present in both projects, with zero Next runtime graph inputs. Four internal pinned UI bindings are intentional package coupling. Desktop TOC label serialization and production environment defines were corrected after browser defects were detected. Version-path fallback across the full corpus and search/Markdown/OG/AI/feedback endpoints remain subsequent checkpoint work. Client bytes and shared navigation fan-out remain profiling targets.

### A4 accepted

All 288 current pages pass content, TOC, head metadata, canonical and title comparisons. Missing/corrupt shell, corrupt body, shared-head fan-out and current-page literal syntax/metadata incremental-versus-forced checks pass with restored inputs. Representative streamText desktop/mobile geometry and visible text match. See A4-PUBLICATION-SCOPE.json for browser scope and open transports. Next A5: historical authored corpora/agent HTML and full version fallback/navigation; A6 special families/transports.

## A5 versioned documentation

All 745 docs routes (288 v7, 232 v6, 225 v5) now compose alongside three A3 prototype routes (748 tracked routes). Human originals total 761 MDX files and derive 798 synchronized files byte-identical to pinned production. The agent owns 745 HTML bodies/metadata in docs-pages.json and maintained version trees in docs-navigation.json; no routine Markdown renderer. Duplicate historical/current prototype doc source files are retired. Version-route sets and nearest-ancestor/landing fallback are explicit. Historical robots/social-image rules and per-route Markdown alternate links preserve upstream behavior. Final serialized lifecycle cases restore exact immutable human source hashes. Complete special families and browser/transport parity remain A6/A7, and benchmarks/optimization/final assessment remain A8–A10. Normal command becomes python3 scripts/build-docs.py.

### A5 accepted

The final restored-corpus checks pass for all 745 published docs: content, anchors, links, code, TOC, metadata, titles, canonicals, Markdown alternates and LLM discovery link. See A5 evidence files. Historical source/sync hashes agree with the immutable archives. Proceed to A6; the experiment is not complete and no final benchmark claims are made.

## A6 accepted — complete families and HTTP publication

The publication now includes all 1,674 HTML routes: 1,386 primary MDX-derived documents, 259 recipe aliases, and 29 ancillary/home pages. All primary published bodies/TOCs pass frozen text, heading anchors, links and code comparisons; all aliases/ancillary pages pass content/link checks; all 1,674 heads pass metadata comparisons. All 1,386 Markdown downloads match frozen bytes, and both pipelines publish equal projection bytes. All 24 frozen HTTP cases pass on the standalone fixture server. Source models remain distinct. Search ranking preserves frozen source order; query OG fixture bytes match. No live backend/feedback/analytics writes occurred.

A7 full hydrated responsive/theme and interaction parity remains open, followed by A8 initial serialized benchmarks/lifecycle, A9 optimization and A10 final judgement/review. A6 preparation phase timings are engineering diagnostics, not benchmark headline samples. The homepage prototype omissions were corrected before accepting this full-family checkpoint.


## A7 accepted — hydrated browser and publication parity

All 72 representative states (12 route families × desktop/mobile × light/dark/system) match frozen reference headings, visible content, navigation/TOC links, title, theme colors and geometry. System resolves light in this environment; animation pixels and React IDs are not byte-equality claims. Browser interactions cover generation/loading, nested weather, prompt generation, playback, media decoding/seek, provider/model selection, recipe expansion/filtering, keyboard tabs/search, version selection, mobile navigation/TOC and copy. Synthetic chat/citations and feedback success/error are local fixture tests; production backends remain unexercised. Repeated chat replies now use unique fixture IDs and persist locally.

The final 24 HTTP cases pass. The all-page local asset/link plus CSS audit finds no migration regressions; 21 historical broken links are inherited. Next streamed soft 404s on first requests before caching a 404 status; the standalone server returns 404 consistently. The feedback route collision was fixed without changing retired API behavior. A8 still must run full-corpus lifecycle and serialized five-sample benchmarks; A9 optimization and A10 final comparison/review remain open. No Nift core/template changes.


## AI SDK experiment closeout

A0–A10 are complete; see investigation/A10-REPORT.md and investigation/benchmark-tools/README.md. Use the pinned Node 24.21.0, pnpm 11.23.0 and Nift 4.8.0 toolchain. Keep this repository's maintained source model and explicit asset/projection ownership. Runtime changes require the deployment runtime to restart. The accepted result is closed except for real defects; remaining profiling targets and migration-init proposals belong to later work. No Nift core/templates were changed.
