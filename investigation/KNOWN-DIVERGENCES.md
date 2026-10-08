# KNOWN-DIVERGENCES.md

Every difference from the frozen reference must be recorded and classified.
Distinguish inherited upstream behaviour from a migration regression.

| ID | Route/component | Observed behaviour | Classification | Evidence | Approval/rationale | Resolution |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Classification: inherited upstream / intentional migration difference /
unresolved / blocking.

A migration is not complete while any entry is unresolved or blocking.

| A7-HISTORY | 21 historical source links | Broken upstream links remain broken. First uncached Next requests streamed not-found UI with 200; subsequent requests returned 404. | inherited upstream / intentional HTTP consistency | A7-ASSET-RESOLUTION.json | Preserve authored content; standalone 404 is consistent and no published page is lost. | characterized |
| A7-TRANSPORT | documentation feedback | JSON adapter replaces Next server action; retained helper/response behavior. | intentional migration difference | A7-INTERACTION-PROOF.json | Independent standalone runtime boundary; only canned backend tests. | characterized |
