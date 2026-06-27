---
name: delivery-note-pdf-public-acl
description: Delivery-note PDFs are written to Storage publicRead at a path-enumerable URL keyed by sequential EZCount doc_number — recurring LOW/MEDIUM finding
metadata:
  type: project
---

`appApi.documents.createDeliveryNote` (functions/src/appApi/index.ts ~194-217) saves DN PDFs to Storage with `predefinedAcl: "publicRead"` + `file.makePublic()`, at path `{companyId}/{storeId}/deliveryNotes/{doc_number}`, then returns `file.publicUrl()` (never expires).

**Why:** Flagged during the 2026-06-26 AR money-path audit as a LOW (pre-existing, not introduced by the subscriber diff, but the new auto-DN subscriber increases the volume of public PDFs).

**How to apply:** `doc_number` is a sequential EZCount counter, so DN PDFs (customer name, line items, totals — PII + financials) are enumerable by guessing adjacent numbers. Recommend signed URLs instead of public ACL. Recurring finding — re-flag if any new flow creates more of these. Related secrets-in-logs note: the same function does `logger.write({... storePrivateData, order})` which logs the full private store doc INCLUDING the EZCount api key — separate pre-existing issue worth its own fix.
