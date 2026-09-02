---
'@keel/contracts': minor
'@keel/react': minor
---

Ten more components: TextField, Select, Checkbox, RadioGroup, Switch, Alert, Badge, Card, Avatar and Spinner.

The contract schema gains `booleans`, `slots` and `usage`. Booleans are kept out of the story matrix on purpose — crossing every flag into the cartesian product doubles the cell count per flag and produces mostly meaningless combinations, while the interesting ones are already covered by `states`.

`validateContract` now also rejects a boolean that defaults to `true` (which forces every consumer to opt out), a slot marked `isAccessibleName` that defaults to empty, and any keyboard-operable component that never declares where its accessible name comes from.
