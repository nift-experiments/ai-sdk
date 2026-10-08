# Interactive architecture decisions — provisional A1 inventory

No migration implementation before accepted upstream baseline. Decisions below are candidates, subject to representative A3 parity proof. Both maintained-source models may use the same justified islands; they differ in authoritative content ownership.

| Feature | Candidate | Reason / required proof |
| --- | --- | --- |
| Provider cards, static templates/showcase | Static markup | Preserve links, content and layout without state runtime. |
| Code copy, simple positional tabs, theme, mobile menu | Vanilla JS where simpler | Preserve keyboard focus, storage, system theme changes and aria semantics. |
| Hero capability/provider/mode previews | React island | Interdependent state, animation, reveal and responsive composition; retaining bounded upstream components may be clearer than a rewrite. |
| Simulated chat/object/text generation and media previews | React island where justified | Stateful timing/media controls; fixtures are local simulations, never live AI requests. |
| Search/version selection | Evaluate local vanilla UI versus React island | Version-scoped search results and focus/dialog parity; do not remove behavior to avoid React. |
| Playground recovery | Evaluate vanilla local-storage adapter | Never read actual user data; tests use isolated synthetic fixtures and downloadable backup shape. External playground remains a separate application. |
| Interactive model feed | Bounded island + deterministic feed fixture | Remote model data acquisition and runtime transport stay outside local UI correctness claims. |

For each retained island record entry point, React/runtime versions, bundle count and bytes, CSS, compilation timing, incremental dependencies and unrelated-edit no-rebuild proof. No general Next.js/Fumadocs reconstruction.

## A6 implemented boundaries

Static authored/rendered page layouts, provider/reference cards, recursive property tables and marketing lists remain static. Positional MDX tabs, code copy and landing card copy use vanilla JS. The shared React chrome retains tightly coupled responsive navigation, version-scoped search, themes, page actions, feedback and Ask AI state, around an opaque HTML content slot.

Content registry: TextGeneration, HeroInteractive, CodeTemplate, PreviewSwitchProviders, BrowserIllustration, InlinePrompt, CardPlayer, ChatGeneration, ObjectGeneration, WeatherSearch, RecipeList, Guides, PlaygroundRecovery, CodeExamplesSection, HomeInstall and InstallCommand. Stateful timers/media/generation, filters/guide expansion, interdependent code/demo selection, animated command overflow/selector/copy and recovery error/download state justify their isolated boundaries. No entire Next application is retained. CardSnippet remains static with vanilla copy.

The content bundle has seven emitted JS/CSS outputs, not sixteen independently loaded entry bundles. Shared chrome has its own entry/chunks. Exact graphs, bytes and compile times are generated in islands-build.json/chrome-build.json; A8/A9 will preserve measured manifests and unrelated-edit invalidation evidence. Registry family count, DOM mount count and emitted bundle count must not be conflated.
