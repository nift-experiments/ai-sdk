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
