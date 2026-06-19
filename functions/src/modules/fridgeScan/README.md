# fridgeScan module

## Purpose

Detection-only spike — first slice of the "Build My Order From Fridge Photos" feature.

Accepts up to 6 fridge photos and returns a list of detected grocery products identified by Gemini vision. No Algolia matching, no inventory diff, no cart writes — detection only.

## Public surface

| Export | Type | Deployed name |
|---|---|---|
| `detectFridgeProducts` | `onCall` callable | `detectFridgeProducts` |

## Request / response

**Request** (callable `data`):
```json
{ "images": ["<https-url-or-base64-data-uri>", "..."] }
```
- `images`: 1–6 entries; each is an `https://` URL or a `data:image/...;base64,...` data URI.
- `companyId` / `storeId` / `userId` are derived from the Firebase auth token — never sent by the client.

**Response**:
```json
{
  "products": [
    {
      "heName": "חלב 3%",
      "heBrand": "תנובה",
      "quantity": 2,
      "unitHint": "liter",
      "confidence": 0.95,
      "countUncertain": false
    }
  ]
}
```

`products` matches `TDetectedItem[]` — see `types.ts` for the full Zod schema.

## Auth

Requires a signed-in, non-anonymous Firebase user. Anonymous and unauthenticated requests are rejected with `unauthenticated` / `permission-denied`.

## How to test

**Firebase emulator:**
```bash
cd functions && npm run serve
```
Then from the app (or the Firebase console callable tester):
```ts
import { httpsCallable } from "firebase/functions";
const detect = httpsCallable(functions, "detectFridgeProducts");
const result = await detect({ images: ["https://..."] });
console.log(result.data.products);
```

**Unit / integration:** pass base64 data URIs of test images to the emulator callable. Vertex AI calls are live — use a test GCP project or mock `@genkit-ai/google-genai` for offline unit tests.
