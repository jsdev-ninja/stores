<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Super-Admin Console — Feature Plan</title>
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
    .header-stats { display: flex; gap: 28px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; }
    .stat { font-size: 12px; color: #64748b; }
    .stat strong { display: block; font-weight: 600; color: #374151; margin-bottom: 2px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }

    section { background: #fff; border-radius: 10px; padding: 26px 28px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
    section h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
    section h3 { font-size: 13px; font-weight: 700; color: #334155; margin: 20px 0 10px; }
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

    .storage-block { padding: 14px 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #14b8a6; margin-top: 14px; }
    .storage-block strong { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #0f766e; display: block; margin-bottom: 6px; }

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
    pre { background: #0f172a; color: #e2e8f0; padding: 18px 22px; border-radius: 8px; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 12.5px; line-height: 1.65; overflow-x: auto; white-space: pre; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12.5px; background: #f1f5f9; padding: 1px 6px; border-radius: 4px; color: #0f172a; }

    .task-list { display: flex; flex-direction: column; gap: 9px; }
    .task-item { display: flex; gap: 12px; align-items: flex-start; padding: 11px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .task-check { width: 16px; height: 16px; border: 1.5px solid #cbd5e1; border-radius: 4px; flex-shrink: 0; margin-top: 2px; }
    .task-num { font-size: 11px; font-weight: 700; color: #6366f1; flex-shrink: 0; margin-top: 2px; width: 28px; }
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

    .fanout-item { padding: 14px 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1; margin-bottom: 12px; }
    .fanout-item:last-child { margin-bottom: 0; }
    .fanout-field { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; font-weight: 600; color: #4338ca; margin-bottom: 4px; }
    .fanout-meta { font-size: 12px; color: #64748b; margin-bottom: 8px; }

    .risk-item { display: flex; gap: 14px; align-items: flex-start; padding: 11px 0; border-bottom: 1px solid #f8fafc; }
    .risk-item:last-child { border-bottom: none; }
    .risk-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; flex-shrink: 0; margin-top: 3px; }
    .risk-high { background: #fee2e2; color: #991b1b; }
    .risk-medium { background: #fef3c7; color: #92400e; }
    .risk-low { background: #f0fdf4; color: #166534; }
    .risk-open { background: #eff6ff; color: #1e40af; }
    .risk-resolved { background: #dcfce7; color: #166534; }

    .test-section { background: #f0f9ff; border-color: #bae6fd; }
    .test-section h2 { color: #0369a1; border-color: #e0f2fe; }
    .test-group { padding: 14px 16px; background: #fff; border-radius: 7px; border-left: 3px solid #0ea5e9; margin-bottom: 12px; }
    .test-group:last-child { margin-bottom: 0; }
    .test-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .test-group-title { font-size: 13px; font-weight: 600; color: #0c4a6e; }
    .test-type-badge { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 7px; border-radius: 4px; background: #e0f2fe; color: #075985; }
    .test-target { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11.5px; color: #475569; }
    .test-skip { padding: 12px 14px; background: #f8fafc; border-radius: 7px; border-left: 3px solid #cbd5e1; margin-top: 14px; }
    .test-skip strong { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; display: block; margin-bottom: 6px; }

    .none { color: #94a3b8; font-size: 13.5px; font-style: italic; }
    .callout { padding: 14px 16px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; margin: 14px 0; font-size: 13.5px; line-height: 1.6; color: #3730a3; }
    .callout strong { color: #312e81; }
  </style>
</head>
<body>

<nav>
  <div class="logo">
    <span>Feature Plan</span>
    <strong>Super-Admin Console</strong>
  </div>

  <div class="nav-group">Overview</div>
  <a href="#goal">Goal</a>
  <a href="#scope">Scope</a>
  <a href="#behavior">User Flow</a>

  <div class="nav-group">Technical</div>
  <a href="#scaffold">App Scaffold</a>
  <a href="#auth">Auth &amp; Gating</a>
  <a href="#backend">Backend Module</a>
  <a href="#writes">Curated Writes</a>
  <a href="#audit">Audit Log Model</a>
  <a href="#data-model">Data Model</a>
  <a href="#contracts">Contracts</a>
  <a href="#fanout">Fan-out Dependencies</a>
  <a href="#shared">Shared Package</a>
  <a href="#frontend-arch">Frontend Architecture</a>

  <div class="nav-group">Work</div>
  <a href="#backend-tasks">Backend Tasks</a>
  <a href="#frontend-tasks">Frontend Tasks</a>
  <a href="#dependencies">Build Sequencing</a>

  <div class="nav-group">Verification</div>
  <a href="#test-plan">Test Plan</a>

  <div class="nav-group">Risk</div>
  <a href="#security">Security Design</a>
  <a href="#breaking">Breaking Changes</a>
  <a href="#risks">Risks &amp; Questions</a>
</nav>

<main>

  <header>
    <div class="meta-row">
      <span class="badge badge-draft">Draft — Awaiting Approval</span>
    </div>
    <h1>Super-Admin Console (v1)</h1>
    <p class="subtitle">A separate cross-store Firestore data browser with three curated, server-verified safe writes — replacing the Firebase console and one-off ops scripts for one user.</p>
    <div class="header-stats">
      <div class="stat"><strong>Type</strong>Feature</div>
      <div class="stat"><strong>Date</strong>2026-06-19</div>
      <div class="stat"><strong>Project</strong>@jsdev-store (storebrix.com)</div>
      <div class="stat"><strong>Stack</strong>Vite 5 · React 19 · HeroUI v3 · Tailwind v4 · Firebase Functions v2 (Node 20)</div>
      <div class="stat"><strong>Planned by</strong>software-architect</div>
    </div>
  </header>

  <!-- ── GOAL ── -->
  <section id="goal">
    <h2>Goal</h2>
    <p class="goal-text">Give Philip one internal app to pick any store and read its Orders, Products, and Profiles with entity-aware rendering, and to perform three reviewed, tenant-scoped, <code>superAdmin</code>-verified writes (order status, product visibility, product stock) — every edit recorded to a browsable audit log — so he stops spelunking the Firebase console and running the <code>change-order-status.ts</code> script.</p>
  </section>

  <!-- ── SCOPE ── -->
  <section id="scope">
    <h2>Scope</h2>
    <div class="scope-grid">
      <div class="scope-box scope-in">
        <div class="scope-label">In scope (v1)</div>
        <ul class="plan-list">
          <li>New separate app <code>apps/super-admin</code> (own Vite build + Firebase Hosting site), joined to the Yarn workspace</li>
          <li>Firebase Auth sign-in on the same <code>jsdev-stores-prod</code> project; <code>superAdmin</code> claim required, enforced client-side and server-side</li>
          <li>New backend module <code>functions/src/modules/superAdmin/</code> — admin-scoped callables taking explicit <code>companyId</code>+<code>storeId</code></li>
          <li>List all stores from root <code>STORES</code>; global store-switcher + persistent "current store" banner</li>
          <li>Read P0 collections — Orders, Products, Profiles — as list + single-record (entity-aware) with a raw-JSON read-only fallback</li>
          <li>Per-store server-side search: order by id/status, product by name/SKU, customer by email/phone</li>
          <li>Three curated writes: E1 set <code>Order.status</code> (bare field set), E2 toggle <code>Product.isPublished</code>, E3 set <code>Product.stock.quantity</code> (≥0)</li>
          <li>Audit log: one record per super-admin edit (who/entity/field/old→new/when), browsable in the app</li>
          <li>One CI step to build + deploy the new hosting site on merge to <code>main</code></li>
        </ul>
      </div>
      <div class="scope-box scope-out">
        <div class="scope-label">Out of scope (deferred)</div>
        <ul class="plan-list">
          <li>Any UI to set/clear custom claims or manage auth users (the <code>superAdmin</code> grant is a manual prerequisite — A1)</li>
          <li>Cloud Function logs / error dashboards; gcloud / IAM / billing / hosting control</li>
          <li>Reading or editing <code>STORES/{storeId}/private/*</code> secrets</li>
          <li>Raw arbitrary document editing; creating or deleting documents</li>
          <li>E4 (product price) and E5 (settings field) — phase 2</li>
          <li>Editing money/ledger data — <code>organizationBalance</code>/rollup, cart, amounts, invoices are view-only (P1 read, not v1)</li>
          <li>P1/P2 read collections (organizations, settings, invoices, …) — fast-follow, not v1</li>
          <li>Bulk / cross-store batch operations; multi-admin roles; per-store-scoped admins; rate limiting</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- ── USER FLOW ── -->
  <section id="behavior">
    <h2>User Flow</h2>
    <p style="margin-bottom:14px;">Golden path: investigate a stuck order and fix its status.</p>
    <ol class="flow-list">
      <li><span class="flow-actor">User</span>Opens the super-admin app URL and signs in with email + password (Firebase Auth, same project).</li>
      <li><span class="flow-actor">Frontend</span>Reads the ID token claims; if <code>superAdmin !== true</code>, shows "access denied" and offers sign-out. No app data is rendered.</li>
      <li><span class="flow-actor">Frontend → Backend</span>Calls <code>saListStores</code>; backend re-verifies <code>superAdmin</code> server-side and returns all stores from root <code>STORES</code>.</li>
      <li><span class="flow-actor">User</span>Picks a store from the global switcher. The "current store" banner pins <code>{name} · {companyId}/{storeId}</code> across all views.</li>
      <li><span class="flow-actor">User</span>Goes to Orders, filters by status or searches by order id.</li>
      <li><span class="flow-actor">Frontend → Backend</span><code>saListOrders</code> / <code>saSearchOrders</code> run server-side, scoped to the selected <code>companyId/storeId</code> via <code>getPath</code>.</li>
      <li><span class="flow-actor">User</span>Opens one order; sees an entity-aware record view (status, paymentStatus, cart items, delivery, B2B fields, <code>updatedBy</code>/<code>updatedAt</code>) plus a raw-JSON fallback panel.</li>
      <li><span class="flow-actor">User</span>Changes status via a dropdown of valid <code>Order.status</code> enum values and confirms.</li>
      <li><span class="flow-actor">Frontend → Backend</span><code>saSetOrderStatus</code>: re-verifies <code>superAdmin</code>, validates target against <code>OrderSchema.shape.status.options</code>, reads the doc tenant-scoped, writes <code>{ status, updatedBy, updatedAt }</code> with <code>merge:true</code> (bare set — no refund/invoice/payment side effects), and appends one audit record. Returns the new value.</li>
      <li><span class="flow-actor">Frontend</span>Shows confirmation, refreshes the record. The change is now visible; the Firebase console and the ops script were not needed.</li>
    </ol>
    <p style="margin-top:18px;margin-bottom:10px;font-size:13px;color:#64748b;">Product edit variants (E2/E3) and the audit-log view follow the same shape:</p>
    <ol class="flow-list">
      <li><span class="flow-actor">User</span>Opens a product, toggles <code>isPublished</code> or sets <code>stock.quantity</code>, confirms.</li>
      <li><span class="flow-actor">Backend</span>Validates against <code>ProductSchema</code>, writes the single field with <code>merge:true</code>, appends an audit record. The existing <code>onProductUpdate</code> Firestore trigger then auto-syncs the product to Algolia, so the storefront reflects the change with no extra work.</li>
      <li><span class="flow-actor">User</span>Opens the Audit Log view; <code>saListAuditEntries</code> returns recent edits (newest first) with who/what/field/old→new/when.</li>
    </ol>
  </section>

  <!-- ── APP SCAFFOLD ── -->
  <section id="scaffold">
    <h2>1 · App Scaffold — <code>apps/super-admin</code></h2>
    <p>Clone the proven <code>apps/store</code> toolchain exactly (Vite 5 + React 19 + <code>@vitejs/plugin-react-swc</code> + <code>vite-tsconfig-paths</code> + HeroUI v3 + Tailwind v4 via PostCSS + Firebase web SDK v10). This keeps the build identical to the reference app and lets the core package resolve through the same tsconfig path alias. <strong>Do not</strong> copy Sentry, Storybook, the legacy plugin, Mixpanel, Algolia, or i18n — the console is internal, single-user, English-only, and never touched by customers.</p>

    <h3>File layout</h3>
    <pre>apps/super-admin/
├── package.json            name: "super-admin", dev port 5177
├── vite.config.ts          react-swc + tsconfigPaths; server.port 5177
├── tsconfig.json           strict; paths: { "src/*", "@jsdev_ninja/core" -> ../../packages/core/lib/index.ts }
├── tsconfig.node.json      for vite.config.ts
├── postcss.config.js       { plugins: { "@tailwindcss/postcss": {} } }
├── index.html              minimal — &lt;div id="root"&gt; + module script (NO meta-pixel)
├── firebase.json           one hosting target: "super-admin"
├── .firebaserc             default project jsdev-stores-prod; target map
└── src/
    ├── main.tsx            ReactDOM root (NO redux Provider needed in v1)
    ├── index.css           @import "tailwindcss"; @import "@heroui/styles";
    ├── lib/firebase/
    │   ├── app.ts          initializeApp(firebaseConfig)  — same config as store/lib/firebase/app.ts
    │   ├── auth.ts          getAuth + getIdTokenResult().claims (mirror store/lib/firebase/auth.ts)
    │   └── callables.ts     getFunctions(app, "europe-west1") + typed httpsCallable wrappers
    ├── app/
    │   ├── App.tsx          router + AuthGate + StoreProvider + AppShell
    │   └── routes.tsx       route table
    ├── auth/                AuthGate, SignInPage, useSuperAdminClaim
    ├── store-context/       StoreProvider (current store), StoreSwitcher, CurrentStoreBanner
    ├── shell/               AppShell (sidebar nav + banner + outlet)
    ├── entities/            per-entity list/detail/edit + raw-JSON fallback
    │   ├── orders/  products/  profiles/
    └── audit/               AuditLogPage</pre>

    <h3>package.json (shape)</h3>
    <pre>{
  "name": "super-admin",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=5177",
    "build": "tsc &amp;&amp; vite build",
    "lint": "eslint . --ext ts,tsx --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@heroui/react": "^3.1.0",
    "@heroui/styles": "^3.1.0",
    "@hookform/resolvers": "^3.3.4",
    "@jsdev_ninja/core": "^0.17.0",
    "firebase": "^10.10.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.51.4",
    "react-router-dom": "^6.x",
    "zod": "^3.22.4"
  }
  // devDeps mirror apps/store: vite, @vitejs/plugin-react-swc, vite-tsconfig-paths,
  // typescript, eslint (+ ts plugins), tailwindcss v4, @tailwindcss/postcss, postcss
}</pre>
    <p style="font-size:13px;color:#64748b;margin-top:8px;">Note: <code>apps/store</code> wires routing through a local <code>src/navigation</code> abstraction. For an isolated new app, plain <code>react-router-dom</code> v6 is simpler (KISS) and is the only new dependency vs the store — it must be approved as a new dep. If the orchestrator prefers zero new deps, the app can hand-roll the same tiny route switch the store uses; either is fine. Flagged in Risks.</p>

    <h3>Workspace, hosting, and CI changes</h3>
    <ul class="plan-list">
      <li><strong>Yarn workspace:</strong> nothing to change — root <code>package.json</code> already globs <code>"apps/*"</code>. The app is picked up automatically. The core package resolves in-repo via the tsconfig path alias (dev) and from npm in CI (same as the store).</li>
      <li><strong>New Hosting site:</strong> create a dedicated site (e.g. <code>super-admin-jsdev</code>) under <code>jsdev-stores-prod</code> via <code>firebase hosting:sites:create</code>. The existing <code>tester</code> target already maps to the default site, so the console needs its own site rather than reusing the default. <em>(One-time infra step for the developer — call it out before running.)</em></li>
      <li><strong>apps/super-admin/.firebaserc:</strong> map <code>"super-admin"</code> target → the new site id. <strong>apps/super-admin/firebase.json:</strong> one <code>hosting</code> entry with <code>"target": "super-admin"</code>, <code>"source": "."</code>, <code>frameworksBackend.region: "europe-west1"</code>, and the same no-store cache headers the store uses.</li>
      <li><strong>CI (<code>.github/workflows/merge-workflow.yml</code>):</strong> add a guarded block mirroring the website pattern — a <code>git diff --quiet HEAD~1 HEAD -- apps/super-admin/</code> check, a build step (<code>yarn workspace super-admin run build</code>), and a deploy step using <code>FirebaseExtended/action-hosting-deploy@v0</code> with <code>entryPoint: apps/super-admin</code>, the existing <code>FIREBASE_SERVICE_ACCOUNT_JSDEV_STORES_PROD</code> secret, <code>projectId: jsdev-stores-prod</code>, and <code>FIREBASE_CLI_EXPERIMENTS: webframeworks</code>. Build core first (already done earlier in the job).</li>
    </ul>
  </section>

  <!-- ── AUTH & GATING ── -->
  <section id="auth">
    <h2>2 · Auth &amp; Edge Gating (defense in depth)</h2>
    <p><strong>Sign-in:</strong> the app uses Firebase Auth on the same <code>jsdev-stores-prod</code> project with email/password (<code>signInWithEmailAndPassword</code>), reusing the exact pattern in <code>apps/store/src/lib/firebase/auth.ts</code>. No tenant scoping is set on the auth instance — the super-admin is not a tenant member.</p>
    <p><strong>Client gate (UX only):</strong> an <code>AuthGate</code> reads <code>getIdTokenResult().claims</code> after sign-in. If <code>claims.superAdmin !== true</code>, the app renders an "access denied" screen and a sign-out button and never mounts the data UI. This mirrors the store's <code>ProtectedRoute access={{ superAdmin: true }}</code> but as the app's root boundary.</p>
    <div class="callout"><strong>The client gate is not security.</strong> A user can edit client state. The real boundary is the server-side <code>superAdmin</code> re-check on <em>every</em> callable (Section 8). The client gate exists only so a non-super-admin sees a clean denial instead of a wall of failed calls.</div>

    <h3>A1 — manual <code>superAdmin</code> claim bootstrap (one-time prerequisite)</h3>
    <p>No code sets custom claims, and v1 builds no claims UI. Before the console is usable, the developer grants the claim once via the Admin SDK against prod, exactly like the existing ops scripts authenticate (ADC). Document this as a runbook step in <code>apps/docs</code>; do not build it into the app:</p>
    <pre># Requires gcloud ADC: gcloud auth application-default login
# Run once. Sets superAdmin:true on Philip's uid. Re-run after sign-out/in to refresh the token.
GOOGLE_CLOUD_PROJECT=jsdev-stores-prod \
  functions/node_modules/.bin/tsx functions/scripts/grant-super-admin.ts --uid &lt;PHILIP_UID&gt;

# grant-super-admin.ts (ops script, OUTSIDE functions/src — not deployed):
#   await admin.auth().setCustomUserClaims(uid, { ...existingClaims, superAdmin: true });
# Then the user must sign out and back in (or force-refresh the ID token) to pick up the claim.</pre>
    <p style="font-size:13px;color:#64748b;">The grant script is a sibling to <code>change-order-status.ts</code> and follows the same "lives outside the deployed build, requires ADC, confirm before write" conventions. It preserves any existing claims (<code>admin</code>, <code>storeId</code>, …) by merging.</p>
  </section>

  <!-- ── BACKEND MODULE ── -->
  <section id="backend">
    <h2>3 · Backend Module — <code>functions/src/modules/superAdmin/</code></h2>
    <p>Confirmed module name: <code>superAdmin</code>. It follows the project's modular-monolith shape. Every callable is thin (verify → parse → call service → return); all logic lives in services; all Firestore access goes through <code>internal/paths.ts</code> built on <code>getPath</code>. All callables use <code>firebase-functions/v2</code> <code>onCall</code> with the established <code>{ memory, invoker:"public" }</code> options and the <code>{ success, … }</code> return convention (never throw to the client).</p>

    <h3>Folder layout</h3>
    <pre>functions/src/modules/superAdmin/
├── README.md                 purpose, owned paths (root SUPER_ADMIN_AUDIT), public surface, conventions
├── index.ts                  ONLY public surface — re-exports all callables + the audit schema/types
├── internal/
│   ├── verifySuperAdmin.ts   single source of the claim check; returns uid+email or a typed denial
│   ├── paths.ts              tenant getPath wrappers (orders/products/profiles) + auditCollectionPath()
│   ├── storesStore.ts        listAllStores() — reads root STORES (mirrors reconcileProjectionsSchedule)
│   ├── ordersStore.ts        list/get/search orders, setOrderStatusField
│   ├── productsStore.ts      list/get/search products, setProductFields
│   ├── profilesStore.ts      list/get/search profiles
│   └── auditStore.ts         appendAuditEntry() (.create deterministic id) + listAuditEntries()
├── services/
│   ├── setOrderStatus.ts      validate + write + audit (E1)
│   ├── setProductVisibility.ts validate + write + audit (E2)
│   └── setProductStock.ts      validate + write + audit (E3)
└── api/                       one file per callable (thin)
    ├── listStores.ts
    ├── listOrders.ts   getOrder.ts   searchOrders.ts
    ├── listProducts.ts getProduct.ts searchProducts.ts
    ├── listProfiles.ts getProfile.ts searchProfiles.ts
    ├── setOrderStatus.ts  setProductVisibility.ts  setProductStock.ts
    └── listAuditEntries.ts</pre>

    <h3>Callable surface (deployed names)</h3>
    <p style="font-size:13px;color:#64748b;">All deployed names are prefixed <code>sa</code> to avoid collisions with the ~40 existing functions and to make god-mode endpoints obvious in the Firebase console and logs.</p>
    <table class="model-table">
      <thead><tr><th>Callable</th><th>Input</th><th>Responsibility</th></tr></thead>
      <tbody>
        <tr><td class="field-name">saListStores</td><td class="field-type">{}</td><td>Verify superAdmin; read root <code>STORES</code>; return <code>StoreListItem[]</code> (id, companyId, name, urls). Read-only, no tenant scope (store metadata is the documented root exception).</td></tr>
        <tr><td class="field-name">saListOrders</td><td class="field-type">ListReq</td><td>List orders for <code>{companyId,storeId}</code>, newest first, paginated. Returns <code>OrderListRow[]</code> + cursor.</td></tr>
        <tr><td class="field-name">saGetOrder</td><td class="field-type">GetReq</td><td>Get one order by id, tenant-scoped. Returns the full <code>TOrder</code> (raw doc) for entity + raw-JSON views.</td></tr>
        <tr><td class="field-name">saSearchOrders</td><td class="field-type">SearchOrdersReq</td><td>Find by exact <code>id</code> or filter by <code>status</code>, tenant-scoped server-side query.</td></tr>
        <tr><td class="field-name">saListProducts</td><td class="field-type">ListReq</td><td>List products for the store, paginated. Returns <code>ProductListRow[]</code> + cursor.</td></tr>
        <tr><td class="field-name">saGetProduct</td><td class="field-type">GetReq</td><td>Get one product by id, tenant-scoped. Returns full <code>TProduct</code>.</td></tr>
        <tr><td class="field-name">saSearchProducts</td><td class="field-type">SearchProductsReq</td><td>Find by <code>sku</code> (exact) or <code>name</code> (prefix/contains) within the store. Firestore query — Algolia not used here (admin tool, see Risk R-Search).</td></tr>
        <tr><td class="field-name">saListProfiles</td><td class="field-type">ListReq</td><td>List profiles for the store, paginated. Returns <code>ProfileListRow[]</code> + cursor.</td></tr>
        <tr><td class="field-name">saGetProfile</td><td class="field-type">GetReq</td><td>Get one profile by id, tenant-scoped. Returns full <code>TProfile</code>.</td></tr>
        <tr><td class="field-name">saSearchProfiles</td><td class="field-type">SearchProfilesReq</td><td>Find by exact <code>email</code> or <code>phoneNumber</code> within the store.</td></tr>
        <tr><td class="field-name">saSetOrderStatus</td><td class="field-type">SetOrderStatusReq</td><td><strong>E1.</strong> Bare set <code>Order.status</code> (+ <code>updatedBy/updatedAt</code>); validate enum; audit. No side effects.</td></tr>
        <tr><td class="field-name">saSetProductVisibility</td><td class="field-type">SetProductVisibilityReq</td><td><strong>E2.</strong> Set <code>Product.isPublished</code>; audit. Algolia re-sync via existing trigger.</td></tr>
        <tr><td class="field-name">saSetProductStock</td><td class="field-type">SetProductStockReq</td><td><strong>E3.</strong> Set <code>Product.stock.quantity</code> (≥0); audit.</td></tr>
        <tr><td class="field-name">saListAuditEntries</td><td class="field-type">ListAuditReq</td><td>List audit records newest-first (optional <code>companyId/storeId</code> filter), paginated.</td></tr>
      </tbody>
    </table>
    <p style="font-size:13px;color:#64748b;margin-top:8px;">All 14 callables are re-exported from <code>modules/superAdmin/index.ts</code> and wired into <code>functions/src/index.tsx</code> with a single <code>export * from "./modules/superAdmin"</code> (or an explicit named re-export to match the file's style).</p>
  </section>

  <!-- ── CURATED WRITES ── -->
  <section id="writes">
    <h2>4 · Curated-Write Design (E1 / E2 / E3)</h2>
    <p>All three writes share one safe shape, implemented once per operation in <code>services/</code>: <strong>(1)</strong> verify <code>superAdmin</code> (in the api layer, before the service is called); <strong>(2)</strong> read the current doc tenant-scoped via <code>getPath</code> — 404 if absent; <strong>(3)</strong> validate the proposed field against the core entity schema; <strong>(4)</strong> write only the target field(s) with <code>merge:true</code>, capturing <code>oldValue</code>; <strong>(5)</strong> append exactly one audit record. The write and the audit append are sequenced so that <em>the audit record is written only after the field write succeeds</em>; the audit append uses a deterministic id + <code>.create()</code> so a retried call cannot double-log.</p>

    <h3>E1 — set order status (bare field set, matching <code>change-order-status.ts</code>)</h3>
    <ul class="plan-list">
      <li><strong>Validate:</strong> <code>OrderSchema.shape.status.options.includes(targetStatus)</code> — the same source of truth the script uses. Reject <code>invalid_status</code> otherwise.</li>
      <li><strong>Write:</strong> <code>ref.set({ status: target, updatedBy: actorEmailOrUid, updatedAt: Date.now() }, { merge: true })</code>. <strong>Nothing else.</strong> No call into <code>orders</code>/<code>ledger</code>/<code>documents</code> services — no refund, no invoice, no payment capture, no transition guard. This is the explicit O-2 decision.</li>
      <li><strong>Note:</strong> the <code>onOrderUpdate</code> trigger exists; the coder must confirm it does not key refund/invoice side effects off a bare status change. From the module map it handles order-document attachment and payment tracking, not status-triggered refunds — but this MUST be verified during implementation (see Risk R-OrderTrigger).</li>
    </ul>

    <h3>E2 — toggle product visibility</h3>
    <ul class="plan-list">
      <li><strong>Validate:</strong> <code>z.boolean()</code> on the input; the field exists and is required on <code>ProductSchema.isPublished</code>.</li>
      <li><strong>Write:</strong> <code>ref.set({ isPublished }, { merge: true })</code>. The existing <code>onProductUpdate</code> Firestore trigger (<code>catalog/triggers/product.ts</code>) fires and re-syncs the whole product doc to Algolia — so the storefront (which reads <code>isPublished:true</code> from the Algolia index) reflects the change automatically. <strong>No extra index work in this module.</strong></li>
    </ul>

    <h3>E3 — adjust product stock quantity</h3>
    <ul class="plan-list">
      <li><strong>Validate:</strong> <code>z.number().min(0)</code> matching <code>ProductSchema.stock.quantity</code>. Because <code>stock</code> is an <em>optional</em> object, the write sets the whole sub-object preserving <code>unit</code>: read current <code>stock.unit</code> (fallback to a sensible default only if the product never had stock — reject with <code>stock_uninitialized</code> rather than guessing a unit).</li>
      <li><strong>Write:</strong> <code>ref.set({ stock: { quantity, unit } }, { merge: true })</code>. Same Algolia auto-sync as E2.</li>
    </ul>

    <div class="callout"><strong>Audit-append safety.</strong> Because the field write and the audit append are two writes (the field doc is tenant-scoped, the audit doc is in a root collection — they cannot share a Firestore transaction across that boundary cleanly), the order is: write field → on success, append audit. If the audit append fails after a successful field write, the service logs <code>audit_write_failed</code> at ERROR with full context and still returns success for the field change (the field change is the user's intent; a missing audit row is a monitoring concern, not a data-integrity one). The deterministic audit id makes the append idempotent on retry. This trade-off is documented so the security-auditor sees it was deliberate.</div>
  </section>

  <!-- ── AUDIT LOG MODEL ── -->
  <section id="audit">
    <h2>5 · Audit Log Model</h2>
    <h3>Collection location — root <code>SUPER_ADMIN_AUDIT</code> (justified exception)</h3>
    <p>The project rule is "no root collections except <code>STORES</code>/<code>COMPANIES</code>; all data is tenant-scoped via <code>getPath</code>." This audit log is a <strong>deliberate, documented exception</strong>, for three concrete reasons:</p>
    <ul class="plan-list">
      <li><strong>It is cross-tenant by nature.</strong> The whole point of v1 is one actor acting across many stores. A per-tenant audit (<code>{companyId}/{storeId}/superAdminAudit</code>) would fragment the record across every store Philip ever touches and make "show me everything I changed last week" a fan-out query over all stores — exactly the cross-store read the spec is trying to make easy.</li>
      <li><strong>The actor is not a tenant member.</strong> Tenant scoping derives from "whose data is this." A god-mode action log is about the <em>operator</em>, not the tenant; it does not belong to any single store's data island.</li>
      <li><strong>Integrity isolation.</strong> A god-mode log that lived inside tenant data could in principle be reached/altered by the same god-mode writes it records. A separate root collection that <em>only</em> the superAdmin callables ever write (append-only, never updated/deleted) is cleaner to reason about and to lock down in security rules.</li>
    </ul>
    <p>Each record still <strong>stores</strong> <code>companyId</code> + <code>storeId</code> as fields (so the log is filterable per store), it just is not <em>pathed</em> under them. Firestore security rules will deny all client access to <code>SUPER_ADMIN_AUDIT</code> (reads go through the verified <code>saListAuditEntries</code> callable using the Admin SDK, which bypasses rules). The <code>updatedBy</code>/<code>updatedAt</code> stamping on the entity record (O-5) is retained <em>in addition</em> to this log.</p>

    <h3>Idempotency &amp; read</h3>
    <ul class="plan-list">
      <li><strong>Doc id:</strong> deterministic per edit — <code>sa_{actorUid}_{entityType}_{docId}_{field}_{timestampMillis}</code> written with <code>.create()</code>. A replayed call (same millis) is an idempotent no-op on <code>ALREADY_EXISTS</code>, matching the project's idempotency convention.</li>
      <li><strong>Read:</strong> <code>saListAuditEntries</code> orders by <code>timestamp desc</code>, optional <code>where companyId/storeId</code>, cursor-paginated. Requires a composite index (<code>companyId, storeId, timestamp</code>) — add to <code>functions/firestore.indexes.json</code>.</li>
    </ul>
  </section>

  <!-- ── DATA MODEL ── -->
  <section id="data-model">
    <h2>Data Model Changes</h2>
    <p style="margin-bottom:12px;">No changes to <code>@jsdev_ninja/core</code> entity schemas. The only new persisted collection is the audit log. E1 reuses the existing <code>updatedBy</code>/<code>updatedAt</code> fields already on <code>OrderSchema</code>.</p>
    <table class="model-table">
      <thead><tr><th>Field</th><th>Type</th><th>Collection / Path</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td class="field-name">id</td><td class="field-type">string</td><td><code>SUPER_ADMIN_AUDIT/{id}</code> (root)</td><td>Deterministic: <code>sa_{uid}_{entityType}_{docId}_{field}_{ts}</code>. Written via <code>.create()</code>.</td></tr>
        <tr><td class="field-name">actorUid</td><td class="field-type">string</td><td>SUPER_ADMIN_AUDIT</td><td>From <code>auth.uid</code> — never client input.</td></tr>
        <tr><td class="field-name">actorEmail</td><td class="field-type">string | null</td><td>SUPER_ADMIN_AUDIT</td><td>From <code>auth.token.email</code> if present.</td></tr>
        <tr><td class="field-name">action</td><td class="field-type">"setOrderStatus" | "setProductVisibility" | "setProductStock"</td><td>SUPER_ADMIN_AUDIT</td><td>Closed enum — one per curated write. New writes add a value here (fan-out, see below).</td></tr>
        <tr><td class="field-name">companyId</td><td class="field-type">string</td><td>SUPER_ADMIN_AUDIT</td><td>Stored as a field for filtering; record is NOT pathed under it.</td></tr>
        <tr><td class="field-name">storeId</td><td class="field-type">string</td><td>SUPER_ADMIN_AUDIT</td><td>Stored as a field for filtering.</td></tr>
        <tr><td class="field-name">collection</td><td class="field-type">"orders" | "products"</td><td>SUPER_ADMIN_AUDIT</td><td>Target Firestore collection.</td></tr>
        <tr><td class="field-name">docId</td><td class="field-type">string</td><td>SUPER_ADMIN_AUDIT</td><td>Target document id.</td></tr>
        <tr><td class="field-name">field</td><td class="field-type">"status" | "isPublished" | "stock.quantity"</td><td>SUPER_ADMIN_AUDIT</td><td>Dotted path of the changed field.</td></tr>
        <tr><td class="field-name">oldValue</td><td class="field-type">string | number | boolean | null</td><td>SUPER_ADMIN_AUDIT</td><td>Value before the write (null if field was absent).</td></tr>
        <tr><td class="field-name">newValue</td><td class="field-type">string | number | boolean</td><td>SUPER_ADMIN_AUDIT</td><td>Value after the write.</td></tr>
        <tr><td class="field-name">timestamp</td><td class="field-type">number</td><td>SUPER_ADMIN_AUDIT</td><td>Epoch millis via <code>Date.now()</code> (project convention — no Firestore Timestamp).</td></tr>
      </tbody>
    </table>
    <p style="margin-top:12px;font-size:13px;color:#64748b;"><strong>Index:</strong> add a composite index on <code>SUPER_ADMIN_AUDIT</code> (<code>companyId</code> ASC, <code>storeId</code> ASC, <code>timestamp</code> DESC) to <code>functions/firestore.indexes.json</code> for the filtered audit-log view.</p>
  </section>

  <!-- ── CONTRACTS ── -->
  <section id="contracts">
    <h2>6 · Contracts</h2>
    <div class="callout"><strong>Where contracts live:</strong> all DTO schemas are admin-only and shared between the backend module and the new app. Per the schema-placement table, these are <em>not</em> client-also-uses domain entities (those stay in core) and <em>not</em> single-module backend-only types. They are a backend module's public surface that the frontend must import type-safely. Decision: define them in <strong><code>functions/src/modules/superAdmin/contracts.ts</code></strong> and re-export from the module's <code>index.ts</code>; the frontend imports the inferred <strong>types</strong> from there via the tsconfig path. The Zod <em>schemas</em> stay backend-side (used for <code>safeParse</code>); the frontend gets the <code>z.infer</code> types and, where it needs runtime validation in forms, mirrors the small per-field input schema locally (status enum + stock ≥0) sourced from the core entity (<code>OrderSchema.shape.status</code>, <code>ProductSchema.shape.stock</code>) — so there is one source of truth and no drift. Reusing the core entity (Order/Product/Profile/Store) types directly avoids duplicating the heavy domain shapes.</div>

    <div class="contract-block">
      <div class="contract-label">Shared request primitives<span class="contract-location">functions/src/modules/superAdmin/contracts.ts</span></div>
      <pre>import { z } from "zod";

// Every tenant-scoped callable carries explicit ids — NEVER derived from a
// single-store token (that is the R1 cross-tenant constraint).
export const TenantRefSchema = z.object({
  companyId: z.string().min(1),
  storeId: z.string().min(1),
});

export const ListReqSchema = TenantRefSchema.extend({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(), // opaque: last doc id from the previous page
});

export const GetReqSchema = TenantRefSchema.extend({
  id: z.string().min(1),
});

// Uniform result envelope — mirrors the existing { success, ... } convention.
export type Result&lt;T&gt; =
  | { success: true; data: T; nextCursor?: string }
  | { success: false; error: SuperAdminError };

export type SuperAdminError =
  | "unauthorized"        // missing/!== true superAdmin claim
  | "invalid_input"       // zod parse failed
  | "not_found"           // doc absent at tenant path
  | "invalid_status"      // E1 target not in Order.status enum
  | "stock_uninitialized" // E3 on a product with no stock object
  | "internal";</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">List rows (lean projections for list views)<span class="contract-location">functions/src/modules/superAdmin/contracts.ts</span></div>
      <pre>export type StoreListItem = {
  id: string;          // storeId
  companyId: string;
  name: string;
  urls: string[];
};

export type OrderListRow = {
  id: string;
  date: number;
  status: TOrder["status"];
  paymentStatus: TOrder["paymentStatus"];
  customerName: string | null;  // client?.displayName ?? nameOnInvoice ?? null
  total: number;                // cart.cartTotal AS STORED (legacy shekels) — display only, no math
};

export type ProductListRow = {
  id: string;
  sku: string;
  name: string;            // first locale value, for the list
  isPublished: boolean;
  price: number;
  stockQuantity: number | null;
};

export type ProfileListRow = {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
};</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">Search requests<span class="contract-location">functions/src/modules/superAdmin/contracts.ts</span></div>
      <pre>import { OrderSchema } from "@jsdev_ninja/core";

export const SearchOrdersReqSchema = TenantRefSchema.extend({
  byId: z.string().min(1).optional(),
  byStatus: OrderSchema.shape.status.optional(), // reuse the enum — single source of truth
}).refine((v) =&gt; v.byId || v.byStatus, { message: "one filter required" });

export const SearchProductsReqSchema = TenantRefSchema.extend({
  bySku: z.string().min(1).optional(),
  byName: z.string().min(1).optional(),
}).refine((v) =&gt; v.bySku || v.byName, { message: "one filter required" });

export const SearchProfilesReqSchema = TenantRefSchema.extend({
  byEmail: z.string().email().optional(),
  byPhone: z.string().min(1).optional(),
}).refine((v) =&gt; v.byEmail || v.byPhone, { message: "one filter required" });</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">Curated-write requests (E1 / E2 / E3)<span class="contract-location">functions/src/modules/superAdmin/contracts.ts</span></div>
      <pre>import { OrderSchema, ProductSchema } from "@jsdev_ninja/core";

export const SetOrderStatusReqSchema = GetReqSchema.extend({
  // Reuse the entity enum so the API can never drift from the schema.
  status: OrderSchema.shape.status,
});

export const SetProductVisibilityReqSchema = GetReqSchema.extend({
  isPublished: z.boolean(),
});

export const SetProductStockReqSchema = GetReqSchema.extend({
  // Mirror ProductSchema.stock.quantity (number, min 0).
  quantity: z.number().min(0),
});

export type WriteResult = { docId: string; field: string; oldValue: unknown; newValue: unknown };</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">Audit record + read request<span class="contract-location">functions/src/modules/superAdmin/contracts.ts</span></div>
      <pre>export const SuperAdminActionSchema = z.enum([
  "setOrderStatus",
  "setProductVisibility",
  "setProductStock",
]);

export const AuditEntrySchema = z.object({
  id: z.string(),
  actorUid: z.string(),
  actorEmail: z.string().nullable(),
  action: SuperAdminActionSchema,
  companyId: z.string(),
  storeId: z.string(),
  collection: z.enum(["orders", "products"]),
  docId: z.string(),
  field: z.enum(["status", "isPublished", "stock.quantity"]),
  oldValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  newValue: z.union([z.string(), z.number(), z.boolean()]),
  timestamp: z.number(), // epoch millis
});
export type AuditEntry = z.infer&lt;typeof AuditEntrySchema&gt;;

export const ListAuditReqSchema = z.object({
  companyId: z.string().min(1).optional(),
  storeId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});</pre>
    </div>
  </section>

  <!-- ── FAN-OUT ── -->
  <section id="fanout">
    <h2>Fan-out Dependencies</h2>
    <p style="margin-bottom:12px;">Adding a future curated write (e.g. E4 price in phase 2) fans out across these locations. They must all change together; calling it out now prevents a half-wired write later.</p>

    <div class="fanout-item">
      <div class="fanout-field">SuperAdminAction enum</div>
      <div class="fanout-meta">Category: Discriminated union — Producer: <code>functions/src/modules/superAdmin/contracts.ts</code> (<code>SuperAdminActionSchema</code>)</div>
      <ul class="plan-list">
        <li><code>contracts.ts</code> — add the new action value to <code>SuperAdminActionSchema</code> and the <code>field</code> enum on <code>AuditEntrySchema</code></li>
        <li><code>services/&lt;newWrite&gt;.ts</code> — new service that validates + writes + appends audit with the new <code>action</code></li>
        <li><code>api/&lt;newWrite&gt;.ts</code> + <code>index.ts</code> — new thin callable, re-exported</li>
        <li><code>functions/src/index.tsx</code> — wire the new callable name into the deployed surface</li>
        <li><code>apps/super-admin/src/lib/firebase/callables.ts</code> — typed wrapper for the new callable</li>
        <li><code>apps/super-admin/src/entities/&lt;entity&gt;/&lt;Entity&gt;EditForm</code> — the edit control + the audit-log label/renderer for the new action</li>
      </ul>
    </div>

    <div class="fanout-item">
      <div class="fanout-field">Order.status enum</div>
      <div class="fanout-meta">Category: Shared type copy — Producer: <code>packages/core/lib/entities/Order.ts</code> (<code>OrderSchema.shape.status</code>)</div>
      <ul class="plan-list">
        <li>This plan deliberately <strong>reuses</strong> the enum everywhere (E1 request schema, search filter, frontend dropdown options) by importing <code>OrderSchema.shape.status</code> — so there is exactly one producer and no copy. If a coder is tempted to hardcode the 8 status strings in the dropdown or the validator, that is the fan-out to avoid: always derive from <code>OrderSchema.shape.status.options</code>.</li>
      </ul>
    </div>
  </section>

  <!-- ── SHARED PACKAGE ── -->
  <section id="shared">
    <h2>Shared Package Changes</h2>
    <p class="none">No <code>@jsdev_ninja/core</code> changes required. The console reuses existing entity schemas (Order, Product, Profile, Store) for rendering and write-validation, and defines its admin DTOs in the backend module (Section 6). This deliberately avoids a core version bump and the consumer-update churn that comes with it. If, during implementation, a coder finds a genuine need to add a shared type to core, that triggers the full version-bump-and-update-all-consumers workflow (apps/store, functions) and must be flagged back for approval — it is not expected for v1.</p>
  </section>

  <!-- ── FRONTEND ARCHITECTURE ── -->
  <section id="frontend-arch">
    <h2>7 · Frontend Architecture</h2>
    <h3>Routing &amp; shell</h3>
    <ul class="plan-list">
      <li><code>App.tsx</code>: <code>AuthGate</code> (sign-in + superAdmin claim) wraps <code>StoreProvider</code> wraps <code>AppShell</code> (sidebar + <code>CurrentStoreBanner</code> + routed outlet).</li>
      <li>Routes: <code>/</code> (store picker / dashboard), <code>/orders</code>, <code>/orders/:id</code>, <code>/products</code>, <code>/products/:id</code>, <code>/profiles</code>, <code>/profiles/:id</code>, <code>/audit</code>. Switching store keeps the current route (US-3) — the store id lives in context, not the URL path.</li>
    </ul>
    <h3>Store context + banner</h3>
    <ul class="plan-list">
      <li><code>StoreProvider</code> holds <code>{ stores, currentStore, setCurrentStore }</code>; loads <code>stores</code> once via <code>saListStores</code>; persists the selected store id in <code>localStorage</code> so a reload keeps the operator "inside" the same store.</li>
      <li><code>StoreSwitcher</code> (HeroUI <code>Select</code>/<code>Autocomplete</code>) in the shell header; <code>CurrentStoreBanner</code> pins <code>{name} · {companyId}/{storeId}</code> persistently and uses a distinct color so the operator always knows which tenant they are acting on.</li>
      <li>Every list/detail/edit view reads <code>currentStore</code> from context and passes <code>companyId/storeId</code> into the callable. No view can call a tenant endpoint without a selected store (guard renders a "pick a store" empty state).</li>
    </ul>
    <h3>Entity views (Orders / Products / Profiles)</h3>
    <ul class="plan-list">
      <li>Per entity: a <code>List</code> (HeroUI <code>Table</code>, server-paginated via cursor), a <code>SearchBar</code> (the entity's allowed filters), a <code>Detail</code> (entity-aware field rendering), and a <code>RawJsonPanel</code> (collapsible, read-only <code>&lt;pre&gt;</code> of the full doc — US-8 fallback so nothing is ever hidden).</li>
      <li>Detail views render the human fields the spec calls out (order: status, paymentStatus, cart items, delivery, B2B fields, <code>updatedBy/updatedAt</code>; product: name/sku/price/isPublished/stock; profile: displayName/email/phone/orgIds).</li>
    </ul>
    <h3>Curated-edit forms</h3>
    <ul class="plan-list">
      <li>RHF + <code>@hookform/resolvers/zod</code> with the per-field input schema (status from <code>OrderSchema.shape.status</code>; stock <code>z.number().min(0)</code>; visibility boolean). Each form is a small focused component (status dropdown; published toggle; stock number input) with an explicit confirm step.</li>
      <li>On submit: call the typed wrapper in <code>callables.ts</code>; on <code>success</code>, toast + refetch the record; on <code>error</code>, map the <code>SuperAdminError</code> code to a clear message. Errors never expose internals.</li>
    </ul>
    <h3>Calling the backend</h3>
    <pre>// apps/super-admin/src/lib/firebase/callables.ts
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./app";
import type { Result, OrderListRow, /* …types from the module… */ } from "@jsdev_ninja/core-or-module-types";

// Region MUST match deploy region.
const fns = getFunctions(app, "europe-west1");

export const saListOrders = (req: ListReq) =&gt;
  httpsCallable&lt;ListReq, Result&lt;OrderListRow[]&gt;&gt;(fns, "saListOrders")(req).then(r =&gt; r.data);
// …one thin typed wrapper per callable…</pre>
    <p style="font-size:13px;color:#64748b;">Audit-log view: a simple paginated HeroUI table fed by <code>saListAuditEntries</code>, with an optional store filter bound to the current store. Read-only.</p>
  </section>

  <!-- ── BACKEND TASKS ── -->
  <section id="backend-tasks">
    <h2>Backend Tasks</h2>
    <div class="task-list">
      <div class="task-item"><div class="task-num">B1</div><div><div class="task-title">Module skeleton + contracts + verifySuperAdmin + paths</div><div class="task-detail">Create <code>modules/superAdmin/</code> with <code>contracts.ts</code> (all schemas/types from Section 6), <code>internal/verifySuperAdmin.ts</code> (the single claim check returning <code>{uid, email}</code> or a typed denial), <code>internal/paths.ts</code> (getPath wrappers for orders/products/profiles + <code>auditCollectionPath()</code>), and <code>index.ts</code> stub. No business logic yet. Verify: tsc + lint green.</div></div></div>
      <div class="task-item"><div class="task-num">B2</div><div><div class="task-title">Stores + read/list/get/search endpoints (orders, products, profiles)</div><div class="task-detail">Implement <code>storesStore.listAllStores()</code> (root STORES, mirror reconcileProjectionsSchedule) and the read callables: <code>saListStores</code>, <code>saList/Get/Search</code> × {Orders, Products, Profiles}. Each: verify superAdmin → parse → tenant-scoped query via getPath → return lean rows / full doc. Structured logging, no console.log. Verify: callables return correct shapes against an emulator or a test store; unscoped access impossible.</div></div></div>
      <div class="task-item"><div class="task-num">B3</div><div><div class="task-title">Audit store + curated writes E1/E2/E3 + saListAuditEntries</div><div class="task-detail">Implement <code>internal/auditStore.ts</code> (<code>appendAuditEntry</code> with deterministic id + <code>.create()</code>, <code>listAuditEntries</code>), the three services (<code>setOrderStatus</code>/<code>setProductVisibility</code>/<code>setProductStock</code>) per Section 4, their thin callables, and <code>saListAuditEntries</code>. E1 is a bare set (no side effects); confirm <code>onOrderUpdate</code> has no status-triggered refund/invoice path. Verify: each write validates against the core schema, writes only the target field, appends exactly one audit row, is idempotent on retry.</div></div></div>
      <div class="task-item"><div class="task-num">B4</div><div><div class="task-title">Wire into deployed surface + index + README</div><div class="task-detail">Re-export all 14 callables from <code>functions/src/index.tsx</code>; add the <code>SUPER_ADMIN_AUDIT</code> composite index to <code>functions/firestore.indexes.json</code>; write <code>modules/superAdmin/README.md</code> (purpose, owned root path + its justification, public surface, conventions). Verify: <code>npm run build</code> + <code>npm run lint</code> in functions pass; no existing function name collides.</div></div></div>
      <div class="task-item"><div class="task-num">B5</div><div><div class="task-title">Ops script: grant-super-admin.ts (A1 bootstrap)</div><div class="task-detail">Add <code>functions/scripts/grant-super-admin.ts</code> (sibling to change-order-status.ts): takes <code>--uid</code>, merges <code>{ superAdmin: true }</code> into existing claims via Admin SDK, prints before/after, confirms before writing. NOT part of the deployed build. Document the run step in <code>apps/docs</code>. Verify: dry-run prints the claim diff; running it is a manual developer action (do not auto-run).</div></div></div>
    </div>
  </section>

  <!-- ── FRONTEND TASKS ── -->
  <section id="frontend-tasks">
    <h2>Frontend Tasks</h2>
    <div class="task-list">
      <div class="task-item"><div class="task-num">F1</div><div><div class="task-title">App scaffold + hosting + CI</div><div class="task-detail">Create <code>apps/super-admin</code> per Section 1 (package.json, vite/tsconfig/postcss/index.html, src bootstrap, Tailwind v4 + HeroUI styles import). Add the new Hosting site + <code>.firebaserc</code>/<code>firebase.json</code> target, and the guarded CI build+deploy block. Verify: <code>yarn workspace super-admin dev</code> serves on 5177; <code>build</code> + <code>lint</code> green; a blank authed shell renders.</div></div></div>
      <div class="task-item"><div class="task-num">F2</div><div><div class="task-title">Auth gate + Firebase client + callable wrappers</div><div class="task-detail">Implement <code>lib/firebase/{app,auth,callables}.ts</code>, <code>AuthGate</code> (sign-in, read <code>superAdmin</code> claim, deny non-super-admins), and typed <code>httpsCallable</code> wrappers (region <code>europe-west1</code>) importing the module's DTO types. Verify: a non-superAdmin sees access-denied and no data calls fire; a superAdmin reaches the shell.</div></div></div>
      <div class="task-item"><div class="task-num">F3</div><div><div class="task-title">Store context, switcher, banner, shell</div><div class="task-detail">Implement <code>StoreProvider</code> (loads <code>saListStores</code>, persists current store), <code>StoreSwitcher</code>, <code>CurrentStoreBanner</code>, and <code>AppShell</code> (sidebar nav + outlet). Switching store preserves the current route. Verify: picking a store updates the banner; reload keeps the selection; views without a store show a "pick a store" empty state.</div></div></div>
      <div class="task-item"><div class="task-num">F4</div><div><div class="task-title">Entity list/detail/search + raw-JSON fallback (Orders, Products, Profiles)</div><div class="task-detail">Per entity: paginated list table, allowed search filters, entity-aware detail, collapsible read-only raw-JSON panel. HeroUI v3 components. Verify: each list paginates server-side; search returns expected matches scoped to the current store; raw JSON shows the full doc.</div></div></div>
      <div class="task-item"><div class="task-num">F5</div><div><div class="task-title">Curated-edit forms (E1/E2/E3) + audit-log view</div><div class="task-detail">RHF+zod forms: order-status dropdown (options from <code>OrderSchema.shape.status</code>), product published toggle, product stock input (≥0), each with confirm + success/error handling. Audit-log page (paginated table from <code>saListAuditEntries</code>, optional current-store filter). Verify: a successful edit toasts + refetches and appears in the audit log; invalid input is blocked client-side and rejected server-side.</div></div></div>
    </div>
  </section>

  <!-- ── DEPENDENCIES ── -->
  <section id="dependencies">
    <h2>Build Sequencing</h2>
    <div class="dep-grid">
      <div class="dep-card"><strong>Run first</strong><p><strong>B1</strong> (contracts + verifySuperAdmin + paths). The DTO types it produces are the contract both sides build against. <strong>F1</strong> (app scaffold + hosting + CI) can start in parallel — it has no dependency on B1.</p></div>
      <div class="dep-card"><strong>Can run in parallel</strong><p>After B1: <strong>B2</strong> (reads) and <strong>B3</strong> (writes+audit) are independent and parallelizable. <strong>F2/F3</strong> (auth, store context) can build against the B1 type stubs while B2/B3 land. <strong>B5</strong> (grant script) is fully independent.</p></div>
      <div class="dep-card"><strong>Blocked until</strong><p><strong>F4</strong> (entity views) needs B2 deployed; <strong>F5</strong> (edit forms + audit view) needs B3 deployed. <strong>B4</strong> (wire into index + indexes) gates the first real deploy. Final integration test is blocked until B2+B3+B4 are deployed and the A1 claim (B5) is granted.</p></div>
    </div>
    <p style="margin-top:14px;"><strong>Core version bump:</strong> none expected — no <code>@jsdev_ninja/core</code> change is in scope (Section: Shared Package). If one becomes necessary, follow CLAUDE.md: bump <code>packages/core</code> version and update the exact version in both <code>apps/super-admin/package.json</code> and <code>functions/package.json</code> (and <code>apps/store</code> if touched), since CI publishes core to npm on merge and the backend installs from the registry.</p>
    <p style="margin-top:8px;"><strong>Suggested order:</strong> B1 + F1 → (B2 ∥ B3 ∥ F2 ∥ F3) → B4 → deploy backend → F4 + F5 → B5 grant → integration QA.</p>
  </section>

  <!-- ── TEST PLAN ── -->
  <section id="test-plan" class="test-section">
    <h2>Test Plan</h2>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Unit</span><span class="test-group-title">verifySuperAdmin</span><span class="test-target">modules/superAdmin/internal/verifySuperAdmin.ts</span></div>
      <ul class="plan-list">
        <li>should return uid+email when <code>auth.token.superAdmin === true</code></li>
        <li>should return an <code>unauthorized</code> denial when the claim is absent, false, or <code>auth</code> is undefined</li>
        <li>should not fall back to <code>admin</code> or any other claim (superAdmin only)</li>
      </ul>
    </div>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Unit</span><span class="test-group-title">Curated-write services (E1/E2/E3)</span><span class="test-target">modules/superAdmin/services/*.ts</span></div>
      <ul class="plan-list">
        <li>E1 should write only <code>status</code>+<code>updatedBy</code>+<code>updatedAt</code> and call no orders/ledger/documents side-effect service</li>
        <li>E1 should reject a status not in <code>OrderSchema.shape.status.options</code> with <code>invalid_status</code></li>
        <li>E3 should reject a negative quantity and reject <code>stock_uninitialized</code> when the product has no stock object</li>
        <li>each write should append exactly one audit record capturing the correct old→new values</li>
        <li>each write should be idempotent on retry (deterministic audit id, <code>ALREADY_EXISTS</code> → no duplicate)</li>
      </ul>
    </div>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Contract</span><span class="test-group-title">DTO schemas</span><span class="test-target">modules/superAdmin/contracts.ts</span></div>
      <ul class="plan-list">
        <li><code>SetOrderStatusReqSchema</code> should accept exactly the 8 enum values and reject others (derived from the entity, not hardcoded)</li>
        <li>search request schemas should reject an empty request (the <code>.refine</code> "one filter required")</li>
        <li><code>AuditEntrySchema</code> should round-trip a valid record and reject a bad <code>action</code>/<code>field</code></li>
      </ul>
    </div>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Edge Cases</span><span class="test-group-title">Critical scenarios (cross-tenant god-mode)</span></div>
      <ul class="plan-list">
        <li>a call with <code>superAdmin</code> absent/false should read and write NOTHING from any store (AC-7) — assert at the callable boundary, for read and write endpoints alike</li>
        <li>a write targeting store B while a (hypothetical) different store's data exists should only ever touch the <code>companyId/storeId</code> in the request path (no cross-tenant bleed)</li>
        <li>E2/E3 write should leave the storefront consistent because <code>onProductUpdate</code> re-syncs Algolia — verify the trigger still fires on a merge-write of a single field</li>
        <li>adding a future action value must update every fan-out consumer (Section: Fan-out) — covered by a contract test that the audit <code>action</code> enum and the wrapper list stay in sync</li>
      </ul>
    </div>
    <div class="test-skip">
      <strong>Out of scope for tests</strong>
      <ul class="plan-list">
        <li>HeroUI rendering / pixel layout of list/detail views — visual, low value</li>
        <li>Firebase Auth itself and the manual claim-grant script — exercised manually once (A1)</li>
        <li>Algolia internals — the sync is the existing trigger's responsibility, already covered by catalog</li>
      </ul>
    </div>
  </section>

  <!-- ── SECURITY DESIGN ── -->
  <section id="security" class="security-section">
    <h2>8 · Security Design</h2>
    <div class="security-item"><strong>Authentication</strong><p>Every callable verifies a real Firebase ID token (<code>request.auth</code>). No auth → <code>unauthorized</code>, no data touched. The client gate is UX only; the server check is the boundary.</p></div>
    <div class="security-item"><strong>Authorization — superAdmin only, server-side, on every endpoint</strong><p>A single <code>verifySuperAdmin(auth)</code> helper is the FIRST statement in every one of the 14 callables (reads and writes). It checks <code>auth.token.superAdmin === true</code> exclusively — not <code>admin</code>, not store membership. A forged or non-super-admin token, or a normal store admin's token, can read and write nothing through these endpoints (AC-7). This is the entire basis of the feature's safety.</p></div>
    <div class="security-item"><strong>Tenant scoping — explicit ids, never client-trusted for the path beyond scoping</strong><p>Because cross-store access is the whole point (R1), <code>companyId</code>+<code>storeId</code> ARE explicit client inputs — but they are used only to build the <code>getPath</code> scope. No callable hand-builds a path or hits a root collection (except <code>saListStores</code> on STORES and the audit collection, both documented exceptions). The superAdmin claim is what authorizes acting on any tenant; the ids only select which one. A scoping bug here is the platform's critical cross-tenant-leak class — hence the mandatory getPath + superAdmin combination and the audit log.</p></div>
    <div class="security-item"><strong>Input validation</strong><p>Every input is <code>zod.safeParse</code>d before use; bad input → <code>invalid_input</code>. Curated writes additionally validate the target value against the core entity schema (status enum, stock ≥0, boolean) so the API can never write a value the entity would reject. Writes touch only the named field(s) via <code>merge:true</code> — no arbitrary doc overwrite is possible by construction (there is no "write this object" endpoint).</p></div>
    <div class="security-item"><strong>Data boundaries &amp; exposure</strong><p>Errors return opaque <code>SuperAdminError</code> codes, never stack traces or internals. Structured logs (<code>firebase-functions/v2 logger</code>) record uid/companyId/storeId/action — never secrets. The app never reads <code>STORES/{storeId}/private/*</code>. The audit collection is denied to all clients in security rules; it is only read via the verified callable (Admin SDK bypasses rules).</p></div>
    <div class="security-item"><strong>No new external services</strong><p>The feature introduces no new SDK, API, webhook source, storage provider, or secret. It reuses the existing Firebase project, Admin SDK, and the catalog module's existing Algolia sync (via the existing trigger — the superAdmin module itself never calls Algolia and holds no Algolia keys).</p></div>
    <div class="security-item"><strong>Abuse / rate-limiting (god-mode endpoints)</strong><p>Per A5 this is a single-user tool and v1 adds no rate limiting. The mitigations that matter for a single trusted operator are: the hard superAdmin gate, the append-only audit log of every write, and the narrow write surface (3 fields, no creates/deletes). If the claim is ever granted to more people (phase 2), revisit rate-limiting and per-action authorization — flagged as an open question.</p></div>
  </section>

  <!-- ── BREAKING CHANGES ── -->
  <section id="breaking" class="breaking-section">
    <h2>Breaking Changes</h2>
    <p class="none">No breaking changes. Everything is additive: a new app, a new backend module, a new root audit collection, and new deployed callable names (all <code>sa*</code>-prefixed to avoid colliding with existing functions). No existing entity schema, function signature, or stored-data shape changes. The legacy <code>change-order-status.ts</code> script remains as a break-glass fallback (AC-6). The existing <code>apps/store</code> super-admin stub and <code>appApi.superAdmin.getAllStores</code> are left untouched — the new app is separate; they can be removed in a later cleanup but are out of scope here.</p>
  </section>

  <!-- ── RISKS ── -->
  <section id="risks">
    <h2>Risks &amp; Open Questions</h2>
    <div class="risk-item"><span class="risk-badge risk-resolved">Resolved</span><p><strong>R4 (spec) — stale storefront after E2/E3.</strong> Confirmed in code: <code>functions/src/modules/catalog/triggers/product.ts</code> has an <code>onProductUpdate</code> trigger that re-syncs the whole product doc to Algolia (<code>searchSync.upsert</code>) on ANY update. The storefront reads <code>isPublished</code>/products from Algolia (<code>react-instantsearch</code>, <code>websites/balasistore/useHomeProducts.ts</code> filters <code>isPublished:true</code>). So E2/E3 Firestore writes propagate to the storefront automatically — no extra index work, no staleness. This was the spec's open architect question; it is closed in favor of E2/E3 being safe.</p></div>
    <div class="risk-item"><span class="risk-badge risk-medium">Medium</span><p><strong>R-OrderTrigger — E1 must stay a bare set.</strong> An <code>onOrderUpdate</code> trigger exists (orders module). The module map shows it handling document-attachment and payment tracking, not status-triggered refunds/invoicing — but the coder MUST read it during B3 and confirm a bare <code>status</code> change triggers no refund/invoice/payment side effect. If it does, E1 needs a guard or the side-effecting path must be explicitly avoided. (Aligns with O-2 / spec R3.)</p></div>
    <div class="risk-item"><span class="risk-badge risk-medium">Medium</span><p><strong>R-Search — server-side search shape.</strong> v1 search is per-store Firestore queries (order by id/status, product by sku exact / name prefix, profile by email/phone exact). Firestore can't do case-insensitive substring search natively; "find product by name" will be prefix/exact, not fuzzy. This is acceptable for an ops tool (the spec calls it "simple field matching," not the Algolia experience) but the coder should set expectations in the UI (e.g. "exact/prefix match"). Some searches may need single-field indexes — add as the emulator/console flags them.</p></div>
    <div class="risk-item"><span class="risk-badge risk-low">Low</span><p><strong>New dependency: <code>react-router-dom</code>.</strong> The store routes via a local abstraction; the new isolated app is simpler with plain react-router v6. It is the only new runtime dep vs the store. If a zero-new-dep constraint applies, hand-roll the same minimal route switch instead. Needs a yes/no from the orchestrator.</p></div>
    <div class="risk-item"><span class="risk-badge risk-low">Low</span><p><strong>Hosting site creation is a manual infra step.</strong> Creating the new Firebase Hosting site (<code>firebase hosting:sites:create</code>) and confirming the <code>.firebaserc</code> target map is a one-time developer action that must run before the first CI deploy succeeds. Call it out and run it explicitly (do not bundle into an auto-approved deploy).</p></div>
    <div class="risk-item"><span class="risk-badge risk-open">Open</span><p><strong>Q1 — audit log location.</strong> This plan chooses a root <code>SUPER_ADMIN_AUDIT</code> collection (justified in Section 5) over per-tenant. Confirm Philip is comfortable with the documented root-collection exception, since it intentionally breaks the "tenant-scoped only" rule for a god-mode operator log.</p></div>
    <div class="risk-item"><span class="risk-badge risk-open">Open</span><p><strong>Q2 — deployed-name prefix.</strong> This plan uses an <code>sa*</code> prefix for the 14 callables. Confirm that's acceptable, or state a preferred naming convention before B-tasks start (renaming deployed callables later forces delete+create on deploy).</p></div>
    <div class="risk-item"><span class="risk-badge risk-open">Open</span><p><strong>Q3 — new Hosting site id.</strong> Proposed <code>super-admin-jsdev</code> (target <code>super-admin</code>). Confirm the site id / URL you want, and whether any extra access protection at the edge is desired beyond the superAdmin claim (v1 relies on the claim; the URL itself is reachable but useless without it).</p></div>
  </section>

</main>
</body>
</html>
