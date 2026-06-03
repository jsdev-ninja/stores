<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Product Backend Route — Bug Fix Plan</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      display: flex;
      min-height: 100vh;
    }

    nav {
      width: 224px;
      min-height: 100vh;
      background: #0f172a;
      color: #94a3b8;
      padding: 28px 0;
      position: fixed;
      top: 0; left: 0;
      overflow-y: auto;
    }

    nav .logo { padding: 0 20px 20px; border-bottom: 1px solid #1e293b; margin-bottom: 12px; }
    nav .logo span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin-bottom: 5px; }
    nav .logo strong { font-size: 13px; color: #f1f5f9; font-weight: 600; line-height: 1.4; display: block; }
    nav .nav-group { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #334155; padding: 14px 20px 4px; font-weight: 700; }
    nav a { display: block; padding: 7px 20px; font-size: 12.5px; color: #64748b; text-decoration: none; transition: all 0.12s; border-left: 2px solid transparent; }
    nav a:hover { color: #e2e8f0; background: #1e293b; border-left-color: #3b82f6; }

    main { margin-left: 224px; flex: 1; padding: 44px 52px 80px; min-width: 0; }
    header { margin-bottom: 36px; }
    .meta-row { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .badge-draft { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #dcfce7; color: #166534; }
    .badge-progress { background: #dbeafe; color: #1e40af; }
    .badge-blocked { background: #fee2e2; color: #991b1b; }
    header h1 { font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1.25; }
    header .subtitle { font-size: 14.5px; color: #64748b; margin-top: 6px; }
    .header-stats { display: flex; gap: 28px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .stat { font-size: 12px; color: #64748b; }
    .stat strong { display: block; font-weight: 600; color: #374151; margin-bottom: 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }

    section { background: #fff; border-radius: 10px; padding: 26px 28px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    section h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
    p { font-size: 14px; line-height: 1.65; color: #374151; }

    .goal-text { font-size: 17px; font-weight: 500; color: #0f172a; line-height: 1.6; }

    .scope-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
    .scope-box { padding: 14px 16px; border-radius: 8px; min-width: 0; }
    .scope-in { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .scope-out { background: #fff1f2; border: 1px solid #fecdd3; }
    .scope-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
    .scope-in .scope-label { color: #16a34a; }
    .scope-out .scope-label { color: #dc2626; }

    .flow-list { counter-reset: flow; list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .flow-list li { counter-increment: flow; position: relative; padding: 12px 14px 12px 48px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13.5px; line-height: 1.55; color: #374151; }
    .flow-list li::before { content: counter(flow); position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; background: #3b82f6; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .flow-list li .flow-actor { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #1e40af; background: #dbeafe; padding: 1px 7px; border-radius: 4px; margin-right: 8px; }
    .flow-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 18px 0 8px; }
    .flow-label:first-child { margin-top: 0; }

    ul.plan-list { list-style: none; display: flex; flex-direction: column; gap: 7px; }
    ul.plan-list li { position: relative; padding-left: 18px; font-size: 13.5px; line-height: 1.55; color: #374151; overflow-wrap: anywhere; }
    ul.plan-list li::before { content: '→'; position: absolute; left: 0; top: 0; color: #cbd5e1; }

    .model-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .model-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; padding: 0 12px 8px 0; border-bottom: 1px solid #f1f5f9; }
    .model-table td { padding: 9px 12px 9px 0; border-bottom: 1px solid #f8fafc; vertical-align: top; color: #374151; }
    .model-table tr:last-child td { border-bottom: none; }
    .field-name { font-family: 'SF Mono', 'Fira Code', monospace; color: #2563eb; }
    .field-type { font-family: 'SF Mono', 'Fira Code', monospace; color: #7c3aed; }

    .contract-block { margin-bottom: 20px; }
    .contract-block:last-child { margin-bottom: 0; }
    .contract-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; margin-bottom: 6px; }
    .contract-location { display: inline-block; font-size: 10px; font-weight: 600; padding: 1px 7px; border-radius: 4px; background: #eff6ff; color: #1d4ed8; margin-left: 8px; text-transform: none; letter-spacing: 0; }
    pre { background: #0f172a; color: #e2e8f0; padding: 18px 22px; border-radius: 8px; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 12.5px; line-height: 1.65; overflow-x: auto; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12.5px; background: #f1f5f9; padding: 1px 6px; border-radius: 4px; color: #0f172a; }

    .task-list { display: flex; flex-direction: column; gap: 9px; }
    .task-item { display: flex; gap: 12px; align-items: flex-start; padding: 11px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .task-check { width: 16px; height: 16px; border: 1.5px solid #cbd5e1; border-radius: 4px; flex-shrink: 0; margin-top: 2px; }
    .task-title { font-size: 13.5px; font-weight: 500; color: #1e293b; }
    .task-detail { font-size: 12px; color: #64748b; margin-top: 3px; line-height: 1.5; }

    .dep-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .dep-card { padding: 13px 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .dep-card strong { display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .dep-card p { font-size: 13px; color: #1e293b; }

    .security-section { background: #fffbeb; border-color: #fde68a; }
    .security-section h2 { color: #b45309; border-color: #fef3c7; }
    .security-item { padding: 12px 14px; background: #fff; border-radius: 7px; border-left: 3px solid #f59e0b; margin-bottom: 10px; }
    .security-item:last-child { margin-bottom: 0; }
    .security-item strong { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #b45309; display: block; margin-bottom: 5px; }
    .security-item p { font-size: 13.5px; color: #374151; }

    .breaking-section { background: #fff7ed; border-color: #fed7aa; }
    .breaking-section h2 { color: #c2410c; border-color: #ffedd5; }
    .breaking-item { padding: 14px 16px; background: #fff; border-radius: 7px; border-left: 3px solid #f97316; margin-bottom: 12px; }
    .breaking-item:last-child { margin-bottom: 0; }
    .breaking-item .change-arrow { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #c2410c; margin-top: 7px; }
    .breaking-item .migration { font-size: 13px; color: #374151; margin-top: 6px; }

    .risk-item { display: flex; gap: 14px; align-items: flex-start; padding: 11px 0; border-bottom: 1px solid #f8fafc; }
    .risk-item:last-child { border-bottom: none; }
    .risk-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; margin-top: 3px; }
    .risk-high { background: #fee2e2; color: #991b1b; }
    .risk-medium { background: #fef3c7; color: #92400e; }
    .risk-low { background: #f0fdf4; color: #166534; }
    .risk-open { background: #eff6ff; color: #1e40af; }

    .test-section { background: #f0f9ff; border-color: #bae6fd; }
    .test-section h2 { color: #0369a1; border-color: #e0f2fe; }
    .test-group { padding: 14px 16px; background: #fff; border-radius: 7px; border-left: 3px solid #0ea5e9; margin-bottom: 12px; }
    .test-group:last-child { margin-bottom: 0; }
    .test-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .test-group-title { font-size: 13px; font-weight: 600; color: #0c4a6e; }
    .test-type-badge { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 7px; border-radius: 4px; background: #e0f2fe; color: #075985; }
    .test-target { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11.5px; color: #475569; }
    .test-skip { padding: 12px 14px; background: #f8fafc; border-radius: 7px; border-left: 3px solid #cbd5e1; margin-top: 14px; }
    .test-skip strong { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; display: block; margin-bottom: 6px; }

    .gate-section { background: #faf5ff; border-color: #e9d5ff; }
    .gate-section h2 { color: #7e22ce; border-color: #f3e8ff; }
    .gate-item { padding: 12px 14px; background: #fff; border-radius: 7px; border-left: 3px solid #a855f7; margin-bottom: 10px; }
    .gate-item:last-child { margin-bottom: 0; }
    .gate-item strong { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #7e22ce; display: block; margin-bottom: 5px; }

    .none { color: #94a3b8; font-size: 13.5px; font-style: italic; }
  </style>
</head>
<body>

<nav>
  <div class="logo">
    <span>Bug Fix Plan</span>
    <strong>Create Product Backend Route</strong>
  </div>
  <div class="nav-group">Overview</div>
  <a href="#goal">Goal</a>
  <a href="#scope">Scope</a>
  <a href="#behavior">Behavior</a>
  <div class="nav-group">Technical</div>
  <a href="#data-model">Data Model</a>
  <a href="#contracts">Contracts</a>
  <a href="#fanout">Fan-out Dependencies</a>
  <a href="#shared">Shared Package</a>
  <div class="nav-group">Work</div>
  <a href="#backend">Backend Tasks</a>
  <a href="#frontend">Frontend Tasks</a>
  <a href="#dependencies">Dependencies</a>
  <a href="#gates">Approval Gates</a>
  <div class="nav-group">Verification</div>
  <a href="#test-plan">Test Plan</a>
  <div class="nav-group">Risk</div>
  <a href="#security">Security Invariants</a>
  <a href="#breaking">Breaking Changes</a>
  <a href="#risks">Risks &amp; Questions</a>
</nav>

<main>

  <header>
    <div class="meta-row">
      <span class="badge badge-draft">Draft</span>
      <span class="badge badge-blocked">Critical Data-Loss Bug</span>
    </div>
    <h1>Create Product Backend Route</h1>
    <p class="subtitle">Stop create-product from silently overwriting an existing product that shares the same SKU, by routing CREATE through an atomic backend <code>.create()</code> callable.</p>
    <div class="header-stats">
      <div class="stat"><strong>Type</strong>Bug Fix</div>
      <div class="stat"><strong>Date</strong>2026-05-30</div>
      <div class="stat"><strong>Project</strong>@jsdev-store</div>
      <div class="stat"><strong>Stack</strong>Firebase Functions v2 (TS) · Vite/React · Firestore</div>
      <div class="stat"><strong>Planned by</strong>software-architect</div>
    </div>
  </header>

  <!-- GOAL -->
  <section id="goal">
    <h2>Goal</h2>
    <p class="goal-text">Creating a product with a SKU that already exists must <strong>fail with a clear "SKU already in use" error</strong> instead of silently merge-overwriting the existing product. Editing an existing product keeps its current upsert behavior, unchanged.</p>
  </section>

  <!-- SCOPE -->
  <section id="scope">
    <h2>Scope</h2>
    <div class="scope-grid">
      <div class="scope-box scope-in">
        <div class="scope-label">In scope</div>
        <ul class="plan-list">
          <li>Add a dedicated <code>createProduct</code> admin callable in the catalog module that uses Firestore admin SDK <code>ref.create()</code> (atomic, fails if SKU doc exists).</li>
          <li>Map the Firestore <code>ALREADY_EXISTS</code> (gRPC code 6) error to an <code>HttpsError("already-exists", …)</code> the admin UI can render as "SKU already in use".</li>
          <li>Wire <code>createProduct</code> into root <code>functions/src/index.tsx</code> (protected file — see gates).</li>
          <li>Swap <code>AddProductPage</code> create flow from direct client <code>setV2</code> to the new <code>createProduct</code> callable. Image upload stays client-side; resolved URLs are passed in the payload.</li>
          <li>Add the <code>createProduct</code> client wrapper in <code>apps/store/src/lib/firebase/api.ts</code> and expose it via <code>appApi.admin.productCreate</code>.</li>
        </ul>
      </div>
      <div class="scope-box scope-out">
        <div class="scope-label">Out of scope</div>
        <ul class="plan-list">
          <li>EditProductPage / <code>saveProduct</code> behavior — stays on the existing client <code>setV2</code> merge-upsert path for now (see Risks for a follow-up note).</li>
          <li>Wiring the other catalog callables (<code>saveProduct</code>, <code>deleteProduct</code>, <code>createCategory</code>, <code>updateCategories</code>) — defer; only <code>createProduct</code> is wired now to keep blast radius minimal.</li>
          <li><code>firestore.rules</code> lockdown to block direct client product writes — <strong>no rules file exists anywhere in the repo today</strong>; recommend deferring (see Risks / Security). Without it the backend guard is advisory only.</li>
          <li>Algolia search-sync changes — triggers already fire on any product doc write; no change needed.</li>
          <li>Changing the SKU-as-doc-id data model.</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- BEHAVIOR -->
  <section id="behavior">
    <h2>Behavior — Broken vs. Expected</h2>
    <div class="flow-label">Current (broken) flow</div>
    <ol class="flow-list">
      <li><span class="flow-actor">Admin</span>Fills the Add-Product form with a SKU that already belongs to another product and submits.</li>
      <li><span class="flow-actor">Client</span><code>productCreate()</code> builds the product (id = sku), validates, and calls <code>FirebaseApi.firestore.setV2</code> → <code>setDoc(ref, doc, { merge: true })</code> at <code>{companyId}/{storeId}/products/{sku}</code>.</li>
      <li><span class="flow-actor">Firestore</span>Merge-set silently overwrites the existing product doc. No error. <strong>The original product's data is lost.</strong></li>
      <li><span class="flow-actor">System</span>Returns success; admin is navigated away believing a new product was created.</li>
    </ol>
    <div class="flow-label">Expected (fixed) flow</div>
    <ol class="flow-list">
      <li><span class="flow-actor">Admin</span>Fills the Add-Product form and submits. (Image, if any, is uploaded to Storage client-side first; resolved URL is in the payload.)</li>
      <li><span class="flow-actor">Client</span><code>appApi.admin.productCreate</code> calls the new <code>createProduct</code> callable with the product payload (no <code>companyId</code>/<code>storeId</code> trusted from client).</li>
      <li><span class="flow-actor">Backend</span>Admin check → validate → derive tenant from token → <code>ref.create()</code> at <code>products/{sku}</code>.</li>
      <li><span class="flow-actor">Backend</span><strong>If SKU is free:</strong> doc is created, success returned. <strong>If SKU exists:</strong> <code>.create()</code> throws gRPC code 6 → backend rethrows <code>HttpsError("already-exists", "SKU already in use")</code>.</li>
      <li><span class="flow-actor">Client</span>On success → navigate to products list. On <code>already-exists</code> → show "SKU already in use" message; stay on the form.</li>
      <li><span class="flow-actor">Backend</span><code>onProductCreate</code> trigger fires on the new doc → Algolia search sync (unchanged, automatic).</li>
    </ol>
  </section>

  <!-- DATA MODEL -->
  <section id="data-model">
    <h2>Data Model Changes</h2>
    <p class="none">No data model changes. Product shape, the <code>id = sku = objectID</code> convention, and the <code>{companyId}/{storeId}/products/{sku}</code> path are all unchanged. Only the <em>write semantics</em> for create change (merge-set → atomic create).</p>
  </section>

  <!-- CONTRACTS -->
  <section id="contracts">
    <h2>Contracts</h2>

    <div class="contract-block">
      <div class="contract-label">
        createProduct — callable request
        <span class="contract-location">frontend → functions</span>
      </div>
      <pre>// Request payload = the new product as built client-side (TNewProduct minus the
// transient `image` File field; image already uploaded, URLs in `images`).
// companyId / storeId are IGNORED if present — backend derives them from the admin token.
// Reuses ProductSchema / TNewProduct from @jsdev_ninja/core (packages/core/lib/entities/Product.ts).
// No new shared type is introduced.

type CreateProductRequest = TNewProduct; // sku is required and becomes the doc id</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">
        createProduct — callable response
        <span class="contract-location">functions → frontend</span>
      </div>
      <pre>// Mirrors the existing catalog callables' success/failure envelope shape.
type CreateProductResponse =
  | { success: true;  data: { id: string } }   // id = sku
  | { success: false; error: string };          // only used for the auth-fail case

// NOTE: business failures (validation, duplicate SKU) are surfaced as thrown
// HttpsError, NOT as { success:false } — see error contract below.</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">
        Error contract — duplicate SKU
        <span class="contract-location">functions → frontend</span>
      </div>
      <pre>// Backend: internal/productsStore.createProductDoc()
//   await ref.create(removeUndefinedFields(product));
//   catch (e) where e.code === 6 (gRPC ALREADY_EXISTS) →
//     throw new HttpsError("already-exists", "SKU already in use");
//
// Any other error → rethrow (becomes HttpsError "internal" to the client).
// Validation failure → throw new HttpsError("invalid-argument", "Invalid product data", issues)
//   (matches existing services/saveProduct.ts).
//
// Client (httpsCallable wrapper, lib/firebase/api.ts catch block):
//   error.code  === "already-exists"  → caller maps to user message "SKU already in use"
//   error.message contains the backend message string.
//
// Client wrapper returns a discriminated result so the page can branch without
// re-inspecting raw Firebase error codes:
type CreateProductResult =
  | { success: true;  data: { id: string } }
  | { success: false; reason: "duplicate-sku" | "invalid" | "unauthorized" | "unknown"; message: string };</pre>
    </div>
  </section>

  <!-- FAN-OUT -->
  <section id="fanout">
    <h2>Fan-out Dependencies</h2>
    <p class="none">No fan-out dependencies. The fix adds one producer (the <code>createProduct</code> callable) with a single consumer (AddProductPage via <code>appApi.admin.productCreate</code>). No discriminated unions, parallel registries, or cross-package type copies are touched.</p>
  </section>

  <!-- SHARED PACKAGE -->
  <section id="shared">
    <h2>Shared Package Changes</h2>
    <p class="none">No shared package changes. The endpoint reuses <code>ProductSchema</code> / <code>TNewProduct</code> / <code>TProduct</code> already exported from <code>@jsdev_ninja/core</code>.</p>
  </section>

  <!-- BACKEND TASKS -->
  <section id="backend">
    <h2>Backend Tasks</h2>
    <p style="margin-bottom:14px;"><strong>Decision: separate <code>createProduct</code> callable, not a <code>mode</code> param on <code>saveProduct</code>.</strong> Rationale: (1) create and edit have genuinely different write primitives (<code>ref.create()</code> vs <code>ref.set(…,{merge:true})</code>) and different error contracts (duplicate-SKU only matters for create) — a <code>mode</code> branch would smuggle two behaviors through one entry point and one error surface; (2) the catalog module convention is one Cloud Function per file with the export name = deployed name, so a dedicated file is the idiomatic shape; (3) <code>saveProduct</code> already exists and is correct for edit — leaving it untouched keeps the change additive and lowers regression risk; (4) least-surprise for future readers: the function name states its guarantee.</p>
    <div class="task-list">
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">B1 — Add <code>createProductDoc</code> to <code>internal/productsStore.ts</code></div>
          <div class="task-detail">New module-private function: <code>createProductDoc(product: TProduct): Promise&lt;void&gt;</code>. Build ref via <code>productPath(product.companyId, product.storeId, product.id)</code>. Call <code>await ref.create(removeUndefinedFields(product))</code> (NOT <code>.set</code>). Reuse the existing <code>removeUndefinedFields</code> helper in the same file. Do not catch here — let the error propagate to the service. Tabs, not spaces.</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">B2 — Add <code>services/createProduct.ts</code></div>
          <div class="task-detail">Mirror <code>services/saveProduct.ts</code>: <code>ProductSchema.safeParse</code> → on fail <code>throw new HttpsError("invalid-argument", "Invalid product data", issues)</code>. Build <code>TProduct</code> with tenant from args, <code>id = objectID = result.data.sku</code>, <code>images = result.data.images ?? []</code>. Call <code>createProductDoc(product)</code> inside a try/catch: if the caught error's gRPC code is <code>6</code> (ALREADY_EXISTS) → <code>throw new HttpsError("already-exists", "SKU already in use")</code>; otherwise rethrow. Log success with structured fields <code>{ productId, companyId, storeId }</code>. Return <code>TProduct</code>.</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">B3 — Add <code>api/createProduct.ts</code> (thin callable)</div>
          <div class="task-detail">Copy the shape of <code>api/saveProduct.ts</code>: <code>functionsV2.https.onCall({ memory: "256MiB", invoker: "public" }, …)</code>. Reject if <code>!auth?.token.admin</code> with <code>{ success:false, error:"Unauthorized" }</code> (matches sibling endpoints). Derive <code>companyId</code>/<code>storeId</code> from <code>auth.token</code> — never from <code>data</code>. Call <code>createProductService({ product: data, companyId, storeId })</code>. Return <code>{ success:true, data:{ id: product.id } }</code>. Thrown <code>HttpsError</code>s propagate to the client as-is.</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">B4 — Export from <code>catalog/index.ts</code></div>
          <div class="task-detail">Add <code>export { createProduct } from "./api/createProduct";</code> alongside the existing admin endpoint exports. Update <code>catalog/README.md</code> to document the new endpoint (create via <code>.create()</code>, fails ALREADY_EXISTS → already-exists) and clarify that <code>saveProduct</code> remains edit-only/upsert.</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">B5 — Wire into root <code>functions/src/index.tsx</code> &nbsp;⚠️ protected file (gate)</div>
          <div class="task-detail">Add <code>createProduct</code> to the existing <code>export { … } from "./modules/catalog";</code> block (joining <code>onProductCreate/Update/Delete</code>). Wire <strong>only</strong> <code>createProduct</code> now — leave the other catalog admin callables unexported. This file change requires explicit user approval before it is made (see Approval Gates).</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">B6 — Build &amp; verify (no deploy)</div>
          <div class="task-detail">Run the functions build (<code>npm run build</code> in <code>functions/</code>) and lint. Confirm typecheck passes and the new export resolves. Do NOT deploy — deploy is a separate gate.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- FRONTEND TASKS -->
  <section id="frontend">
    <h2>Frontend Tasks</h2>
    <div class="task-list">
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">F1 — Add <code>createProduct</code> wrapper to <code>lib/firebase/api.ts</code></div>
          <div class="task-detail">Add an <code>async function createProduct(product: TNewProduct)</code> that does the image upload (move the upload block out of <code>productCreate.ts</code> — or keep image upload in the caller and pass resolved URLs; see F2), then <code>httpsCallable(functions, "createProduct")</code> and calls it with the product. In the <code>catch</code>, branch on <code>error.code</code>: <code>"already-exists"</code> → <code>{ success:false, reason:"duplicate-sku", message }</code>; <code>"invalid-argument"</code> → <code>reason:"invalid"</code>; else <code>reason:"unknown"</code>. Add <code>createProduct</code> to the exported <code>api</code> object. Match the existing wrapper style in this file.</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">F2 — Repoint create flow in <code>appApi/admin/productCreate.ts</code> + <code>appApi/index.ts</code></div>
          <div class="task-detail">Keep the client-side image upload (Storage upload + old-image removal) in <code>productCreate.ts</code> so URLs are resolved before the backend call; replace the final <code>FirebaseApi.firestore.setV2(...)</code> with a call to the new <code>api.createProduct(product)</code>. In <code>appApi/index.ts</code>, <code>admin.productCreate</code> (~line 533) keeps calling this helper. <strong>Do NOT touch <code>admin.saveProduct</code> (~line 557)</strong> — edit stays on the merge-upsert path. Return the discriminated result up to the page.</div>
        </div>
      </div>
      <div class="task-item">
        <div class="task-check"></div>
        <div>
          <div class="task-title">F3 — Handle duplicate-SKU in <code>AddProductPage/index.tsx</code></div>
          <div class="task-detail">In the form <code>onSubmit</code> (~line 172): on <code>success</code> navigate to <code>admin.products</code> (unchanged). On <code>reason === "duplicate-sku"</code> show a clear error to the admin ("SKU already in use" / localized) and stay on the form. On <code>invalid</code>/<code>unknown</code> show a generic failure. Use the existing toast/error UI pattern in the admin pages; do not navigate away on failure.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- DEPENDENCIES -->
  <section id="dependencies">
    <h2>Dependencies</h2>
    <div class="dep-grid">
      <div class="dep-card">
        <strong>Run first</strong>
        <p>Backend B1→B6 (store → service → api → export → wire → build). B5 (root wiring) pauses for the protected-file gate.</p>
      </div>
      <div class="dep-card">
        <strong>Can run in parallel</strong>
        <p>None within backend (sequential). Frontend F1–F3 can be drafted in parallel with backend coding but must not be merged/verified until the callable is deployed.</p>
      </div>
      <div class="dep-card">
        <strong>Blocked until</strong>
        <p>Frontend swap (F1–F3) is functionally blocked until <code>createProduct</code> is deployed (deploy gate). Deploy is blocked until backend build verifies and user approves.</p>
      </div>
    </div>
  </section>

  <!-- APPROVAL GATES -->
  <section id="gates" class="gate-section">
    <h2>Approval Gates</h2>
    <div class="gate-item">
      <strong>Gate 1 — Root index.tsx edit</strong>
      <p><code>functions/src/index.tsx</code> is a normally-protected file. Editing it to export <code>createProduct</code> requires explicit user approval at the moment the edit is made (task B5).</p>
    </div>
    <div class="gate-item">
      <strong>Gate 2 — Deploy</strong>
      <p>Deploying the new function (<code>firebase deploy --only functions:createProduct</code> or equivalent) requires explicit user permission. Never auto-deploy. Deploy happens AFTER backend build verifies and BEFORE the frontend swap is verified end-to-end.</p>
    </div>
    <div class="gate-item">
      <strong>Gate 3 — Commit / push</strong>
      <p>Per project rules, each commit and push needs its own explicit ask. Plan approval is not commit/deploy approval.</p>
    </div>
  </section>

  <!-- TEST PLAN -->
  <section id="test-plan" class="test-section">
    <h2>Test Plan</h2>
    <p style="margin-bottom:14px;">Manual verification on the tester store only — <code>tester_company / tester_store</code>, <code>dev:test</code> on port 5175. Never balasistore/pecanis. Check the dev server is already running before starting it.</p>

    <div class="test-group">
      <div class="test-group-header">
        <span class="test-type-badge">Integration</span>
        <span class="test-group-title">Create product — happy path</span>
        <span class="test-target">AddProductPage → createProduct</span>
      </div>
      <ul class="plan-list">
        <li>Should create a new product when the SKU does not yet exist, and navigate to the products list.</li>
        <li>Should persist the product at <code>tester_company/tester_store/products/{sku}</code> with <code>id === sku === objectID</code>.</li>
        <li>Should upload the image client-side and store the resolved URL in <code>images</code> (no regression to existing image flow).</li>
      </ul>
    </div>

    <div class="test-group">
      <div class="test-group-header">
        <span class="test-type-badge">Edge Cases</span>
        <span class="test-group-title">Critical scenarios</span>
      </div>
      <ul class="plan-list">
        <li>Should REJECT with a visible "SKU already in use" message when creating a product whose SKU matches an existing product — and the existing product's data must be unchanged afterward (verify the doc was not overwritten). This is the core bug.</li>
        <li>Should keep the admin on the form (no navigation) on duplicate-SKU rejection.</li>
        <li>Editing an existing product via EditProductPage should still save successfully (regression — edit path untouched).</li>
        <li>Algolia search sync should still fire on a successful create (<code>onProductCreate</code> trigger) — new product appears in search.</li>
        <li>A non-admin / unauthenticated caller hitting <code>createProduct</code> should be rejected (auth boundary).</li>
        <li>Tenant spoofing: a payload carrying a foreign <code>companyId</code>/<code>storeId</code> must be ignored — the doc lands under the caller's token tenant only.</li>
      </ul>
    </div>

    <div class="test-skip">
      <strong>Out of scope for tests</strong>
      <ul class="plan-list">
        <li>Automated unit tests for the callable — project verifies admin flows manually on tester store; no test harness for catalog callables exists.</li>
        <li><code>firestore.rules</code> enforcement — no rules file exists; deferred.</li>
        <li>Other catalog callables (saveProduct/deleteProduct/categories) — not wired in this change.</li>
      </ul>
    </div>
  </section>

  <!-- SECURITY INVARIANTS -->
  <section id="security" class="security-section">
    <h2>Security Invariants</h2>
    <div class="security-item">
      <strong>Authentication</strong>
      <p>Only authenticated callers may invoke <code>createProduct</code>. The callable must reject when <code>auth</code> is absent.</p>
    </div>
    <div class="security-item">
      <strong>Authorization</strong>
      <p>Caller must have <code>auth.token.admin === true</code>. Reject otherwise with the standard <code>{ success:false, error:"Unauthorized" }</code> envelope used by sibling catalog endpoints.</p>
    </div>
    <div class="security-item">
      <strong>Tenant trust boundary</strong>
      <p><code>companyId</code> and <code>storeId</code> are ALWAYS derived from token claims (<code>auth.token.companyId</code> / <code>auth.token.storeId</code>). Any client-supplied tenant fields in the payload are overridden — never used to build the write path. This prevents writing into another tenant's product collection.</p>
    </div>
    <div class="security-item">
      <strong>Input validation</strong>
      <p>Payload is validated with <code>ProductSchema.safeParse</code> before any write; invalid input → <code>HttpsError("invalid-argument", …)</code>. <code>sku</code> must be a non-empty string (it becomes the doc id) — validation must reject empty/whitespace SKUs.</p>
    </div>
    <div class="security-item">
      <strong>Atomic create (no silent overwrite)</strong>
      <p>The write MUST use <code>ref.create()</code>, never <code>ref.set(…)</code> or <code>{ merge: true }</code>. This is the security/integrity invariant of this entire fix: a duplicate SKU must fail, not overwrite.</p>
    </div>
    <div class="security-item">
      <strong>No new external services / secrets</strong>
      <p>No new SDK, API, webhook, or secret is introduced. Algolia sync runs through the existing already-deployed triggers. No secret-handling changes.</p>
    </div>
    <div class="security-item">
      <strong>Advisory-only guard (documented gap)</strong>
      <p>With no <code>firestore.rules</code> file in the repo, a sufficiently-privileged client could still write to <code>products/{sku}</code> directly, bypassing this backend guard. The backend route closes the application path but is not a hard enforcement boundary until rules are added (deferred — see Risks).</p>
    </div>
  </section>

  <!-- BREAKING CHANGES -->
  <section id="breaking" class="breaking-section">
    <h2>Breaking Changes</h2>
    <p class="none">No breaking changes. The create path is repointed to a new endpoint with the same payload (reusing <code>TNewProduct</code>); the edit path and all existing callables/types are untouched. The behavioral change (duplicate SKU now fails) is the intended bug fix, not a contract break — it was previously silent data loss.</p>
  </section>

  <!-- RISKS -->
  <section id="risks">
    <h2>Risks &amp; Open Questions</h2>
    <div class="risk-item">
      <span class="risk-badge risk-high">High</span>
      <p>No <code>firestore.rules</code> exists anywhere in the repo, so the backend guard is advisory only — a direct client write could still overwrite. Recommend deferring a full rules lockdown to a dedicated follow-up (writing rules for a store that has never had them risks breaking other client writes — reads, carts, orders, profiles — and needs its own test pass). This fix removes the actual application-level overwrite path, which is the real-world trigger.</p>
    </div>
    <div class="risk-item">
      <span class="risk-badge risk-medium">Medium</span>
      <p>EditProductPage still writes directly via client <code>setV2</code> merge. If an admin opens "edit" but changes the SKU field, the merge would write to a <em>new</em> doc id and leave the old one orphaned (pre-existing behavior, not introduced here). Flagged as a candidate follow-up to also route edit through <code>saveProduct</code> backend callable.</p>
    </div>
    <div class="risk-item">
      <span class="risk-badge risk-medium">Medium</span>
      <p>gRPC ALREADY_EXISTS detection: confirm the admin SDK surfaces the duplicate as <code>error.code === 6</code> (numeric gRPC code) on <code>DocumentReference.create()</code>. The service must match on that reliably; if the SDK version exposes a different shape, the catch must be adjusted. Verify during B2 implementation.</p>
    </div>
    <div class="risk-item">
      <span class="risk-badge risk-low">Low</span>
      <p>Functions runtime mismatch in configs (<code>functions/firebase.json</code> = nodejs20, <code>apps/store/firebase.json</code> = nodejs16). Deploy must use the correct functions codebase/config; confirm the deploy command targets the nodejs20 functions project. Does not affect code, only the deploy gate.</p>
    </div>
    <div class="risk-item">
      <span class="risk-badge risk-open">Open</span>
      <p>Confirm: wire ONLY <code>createProduct</code> now (recommended), or wire the full catalog admin set (<code>saveProduct</code>, <code>deleteProduct</code>, <code>createCategory</code>, <code>updateCategories</code>) in the same change? Recommendation: only <code>createProduct</code>, to keep the data-loss fix small and low-risk.</p>
    </div>
    <div class="risk-item">
      <span class="risk-badge risk-open">Open</span>
      <p>Rollback plan: if the deployed callable misbehaves, the fastest rollback is to repoint <code>productCreate.ts</code> back to <code>setV2</code> (one-line client revert, no redeploy needed) while the function is investigated. Confirm this is the preferred rollback over reverting the deploy.</p>
    </div>
  </section>

</main>
</body>
</html>
