---
name: project_genkit_media_ssrf
description: SSRF + DoS surface when genkit/vertexAI media parts accept user-supplied http(s) URLs — the backend (not Google) fetches them; how to audit any AI vision/multimodal callable here
metadata:
  type: project
---

When a genkit `ai.generate({ prompt: [{ media: { url } }] })` call (vertexAI/Gemini plugin, the stack used in `functions/src/services/genkit-service` and `functions/src/modules/fridgeScan`) is given an `http(s)://` media URL, the **genkit `downloadRequestMedia` default middleware fetches that URL inside our Cloud Function process** and inlines it as base64 before calling Gemini. The Gemini API itself cannot fetch arbitrary external HTTP, so the fetch is OURS, with OUR service-account egress — this is a server-side fetch = SSRF surface.

Key middleware facts (genkit `js/plugins/vertexai/src/gemini.ts`, applied via the model's `use`, so it runs even if the caller never sets `use`):
- `maxBytes` default = 20MB per media part (the only built-in guardrail).
- `filter` skips YouTube URLs (Gemini-native) but returns true for generic https → downloaded in-process.
- No host allowlist, no private-IP/SSRF blocking, no count limit of its own.

**Why severity is usually MEDIUM-ish, not auto-CRITICAL, on GCP:** GCE/Cloud Run metadata (169.254.169.254 / metadata.google.internal) has required `Metadata-Flavor: Google` since 2019 and ignores `X-Forwarded-For`; a plain image GET with no custom header is refused, so direct credential theft via metadata is blocked absent a separate header-injection/redirect bypass. Real residual risk = internal-service/VPC port probing + using us as a blind fetch proxy + 20MB×N egress/memory amplification. Escalate toward HIGH when the URL is fully attacker-controlled AND the function runs in a VPC with reachable internal services, or when it ships to all users with no flag.

**Preferred remediation (matches the project's tenant-isolation HARD RULE in CLAUDE.md):** do NOT accept arbitrary URLs. Require tenant-scoped Storage object paths and resolve to a `gs://` URI server-side (gs:// is passed through to Vertex and fetched by Google within-project, not by us), or accept base64 only, or at minimum a strict host allowlist + reject RFC1918/link-local/`.internal`. The fridgeScan full plan already specifies restricting to the caller's own Storage prefix — verify that lands before prod.

**How to apply:** For ANY new callable/trigger that passes user-influenced strings into a genkit media `url`, treat it as SSRF + DoS until proven otherwise. Check: (1) is the URL constrained to gs:// / tenant Storage / allowlist? (2) is there a per-image byte ceiling tighter than 20MB and a per-call image count cap? (3) is there per-user rate limiting (none exists in this backend — see below)? Also: data: URIs bypass the fetch but still need a byte-size check — Zod `.min(1)` does NOT bound size.

**Backend-wide gap:** there is NO rate-limiting/throttling helper anywhere in `functions/src` (grep for ratelimit/throttle = none). Every `onCall` uses `invoker:"public"` (chatbot, catalog, documents, budget all do) — that's the normal/correct Firebase pattern; auth is enforced in-handler, NOT a finding. Cost-abuse on expensive AI/vision callables is therefore unmitigated by default and must be added per-feature.
