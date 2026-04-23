# @jsdev-store — Claude Project Notes

## Domain
- Production domain: **storebrix.com**

## Dev / Preview Rules
- Only use test stores for dev and preview
- Never use `balasistore` or `pecanis` dev scripts
- Use `dev:test` (port 5175) and `dev:test2` (port 5176) (before run dev server check if its running already)

## Scope
- This chat is **only** for the `@jsdev-store` project
- Anything unrelated should be flagged and ignored

## Code conventions

### Timestamps
- Always use **`number`** (epoch millis via `Date.now()`) for all timestamps in Firestore docs and TypeScript types.
- **Do NOT use `FirebaseFirestore.Timestamp`** or `FieldValue.serverTimestamp()`. The project standardizes on plain millis for simpler JSON serialization, easier client/server sharing, and consistent comparison.
- When reading existing docs that may contain old `Timestamp` fields, convert to millis at the boundary.
