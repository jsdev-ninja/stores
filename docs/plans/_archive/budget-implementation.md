<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Module Rebuild + Ledger Wiring — Refactor Plan</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #1e293b; display: flex; min-height: 100vh; }
    nav { width: 224px; min-height: 100vh; background: #0f172a; color: #94a3b8; padding: 28px 0; position: fixed; top: 0; left: 0; overflow-y: auto; }
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
    .fanout-item { padding: 14px 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #6366f1; margin-bottom: 12px; }
    .fanout-item:last-child { margin-bottom: 0; }
    .fanout-field { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; font-weight: 600; color: #4338ca; margin-bottom: 4px; }
    .fanout-meta { font-size: 12px; color: #64748b; margin-bottom: 8px; }
    .none { color: #94a3b8; font-size: 13.5px; font-style: italic; }
    .gate-section { background: #faf5ff; border-color: #e9d5ff; }
    .gate-section h2 { color: #7e22ce; border-color: #f3e8ff; }
    .gate-item { padding: 12px 14px; background: #fff; border-radius: 7px; border-left: 3px solid #a855f7; margin-bottom: 10px; }
    .gate-item:last-child { margin-bottom: 0; }
    .gate-item strong { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #7e22ce; display: block; margin-bottom: 5px; }
  </style>
</head>
<body>

<nav>
  <div class="logo">
    <span>Refactor Plan</span>
    <strong>Budget Module Rebuild + Ledger Wiring</strong>
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
  <a href="#dependencies">Dependencies & Sequencing</a>
  <div class="nav-group">Verification</div>
  <a href="#test-plan">Test Plan</a>
  <div class="nav-group">Risk</div>
  <a href="#gates">Gates</a>
  <a href="#security">Security Invariants</a>
  <a href="#breaking">Breaking Changes</a>
  <a href="#risks">Risks & Questions</a>
</nav>

<main>
  <header>
    <div class="meta-row">
      <span class="badge badge-draft">Draft — awaiting approval</span>
    </div>
    <h1>Budget Module Rebuild + Ledger Wiring</h1>
    <p class="subtitle">Rebuild budget as a reactive B2B accounts-receivable projection driven by <code>order.placed</code> (debt up) and <code>ledger.transaction_posted</code> (debt down), and wire the ledger so payments actually post transactions.</p>
    <div class="header-stats">
      <div class="stat"><strong>Type</strong>Refactor / Re-architecture</div>
      <div class="stat"><strong>Date</strong>2026-05-31</div>
      <div class="stat"><strong>Project</strong>@jsdev-store</div>
      <div class="stat"><strong>Stack</strong>Firebase Functions v1/v2, TS strict, Zod, modular monolith, event bus</div>
      <div class="stat"><strong>Planned by</strong>software-architect</div>
    </div>
  </header>

  <!-- GOAL -->
  <section id="goal">
    <h2>Goal</h2>
    <p class="goal-text">Replace the delivery-note-driven budget writer with an event-driven budget module backed by two new flat, tenant-scoped collections (<code>budgetRecords</code> source of truth, <code>organizationBudgets</code> derived snapshot), and wire the ledger so every real payment posts a <code>ledger.transaction_posted</code> event the budget can subscribe to. Old <code>budgetAccounts</code>/<code>budgetTransactions</code> data is left inert.</p>
  </section>

  <!-- SCOPE -->
  <section id="scope">
    <h2>Scope</h2>
    <div class="scope-grid">
      <div class="scope-box scope-in">
        <div class="scope-label">In scope</div>
        <ul class="plan-list">
          <li>New <code>budgetRecords</code> + <code>organizationBudgets</code> schemas (domain entities in <code>@jsdev_ninja/core</code>) and registration in <code>storeCollections</code>.</li>
          <li>A single <code>applyBudgetEvent</code> service: Firestore txn that updates the snapshot and appends an immutable record, idempotent by <code>causedByEventId</code>.</li>
          <li>Three thin subscribers: <code>order.placed</code> → debt_increase (B2B only), <code>order.cancelled</code>/<code>order.refunded</code> → debt_reduction, <code>ledger.transaction_posted</code> → debt_reduction.</li>
          <li>Wire the <code>ledger</code> module into <code>functions/src/index.tsx</code> (its callables + the existing <code>onTransactionPostedMarkOrderPaid</code> subscriber are currently unexported / dead).</li>
          <li>Connect the active payment paths (<code>modules/payments/api/createPayment.ts</code> J5 auth, <code>chargeOrder.ts</code> J5 capture) to <code>ledger.postTransaction</code> with <code>payer.organizationId</code> + <code>reference.orderId</code>.</li>
          <li>Re-point the 5 budget callables to read/write the new collections while preserving the response shape the admin UI already consumes.</li>
          <li>Retire the delivery-note debt path (<code>budgetWriter.onDeliveryNoteCreated</code>) and the writer callers in <code>cancelOrder</code>/<code>refundOrder</code>/<code>appApi</code>.</li>
          <li>Composite Firestore indexes for the new query patterns.</li>
        </ul>
      </div>
      <div class="scope-box scope-out">
        <div class="scope-label">Out of scope</div>
        <ul class="plan-list">
          <li>Deleting old <code>budgetAccounts</code>/<code>budgetTransactions</code> data (left as inert legacy — smallest blast radius).</li>
          <li>Backfill of historical balances into <code>organizationBudgets</code> (offered as a gated option, NOT built by default — see Breaking Changes).</li>
          <li><code>budgetRollups</code> writer / pre-aggregation (unbuilt today, stays unbuilt).</li>
          <li>Credit-limit enforcement at order time (open decision #4 in the model doc — deferred).</li>
          <li>Migrating the unused <code>hyp_direct</code> redirect path (<code>createPaymentRedirect</code>/<code>recordHypDirectPayment</code>) — wire only if that path is live; confirm with developer.</li>
          <li>New admin UI for budget records (existing pages reused as-is).</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- BEHAVIOR -->
  <section id="behavior">
    <h2>Behavior (internal data flow — no user-facing UI change)</h2>
    <p style="margin-bottom:14px;">This is a backend re-architecture. The admin Budget pages render the same numbers; only the source collections and the event that produces debt change. Golden path for a B2B credit order:</p>
    <ol class="flow-list">
      <li><span class="flow-actor">Backend</span>A B2B order doc is created → <code>onOrderCreated</code> emits <code>order.placed</code> (already carries <code>organizationId</code> + <code>total</code>).</li>
      <li><span class="flow-actor">Backend</span>Budget subscriber <code>increaseDebtOnOrderPlaced</code> fires, skips if no <code>organizationId</code>, reads the order doc for <code>customerId</code>/<code>customerName</code>/<code>billingAccountId</code>, and calls <code>applyBudgetEvent({type:"debt_increase", amount: order.cart.cartTotal, ...})</code>.</li>
      <li><span class="flow-actor">Backend</span><code>applyBudgetEvent</code> runs one Firestore txn: claims <code>budgetIdempotency/{eventId}</code> via <code>.create()</code>, increments <code>organizationBudgets/{orgId}.totalCurrentDebt</code>, appends a <code>budgetRecords</code> entry. The org now owes the order total.</li>
      <li><span class="flow-actor">Customer</span>Later pays via HYP. The payment path posts a ledger transaction (<code>hyp_j5_auth</code> on auth, <code>hyp_capture</code> on charge) carrying <code>payer.organizationId</code> + <code>reference.orderId</code>.</li>
      <li><span class="flow-actor">Backend</span><code>postTransaction</code> emits <code>ledger.transaction_posted</code>; budget subscriber <code>reduceDebtOnTransactionPosted</code> fires for direction <code>in</code> + reference.type <code>order</code> + <code>payer.organizationId</code> present, and calls <code>applyBudgetEvent({type:"debt_reduction", amount, ...})</code>. Debt decreases.</li>
      <li><span class="flow-actor">Admin</span>Opens the Budget page → callables read <code>organizationBudgets</code> (balance) and <code>budgetRecords</code> (history), mapped to the existing response shape.</li>
    </ol>
    <p style="margin-top:16px;"><strong>Reversal path:</strong> order set to cancelled/refunded → <code>onOrderUpdate</code> calls <code>cancelOrder</code>/<code>refundOrder</code> which (after this change) emit <code>order.cancelled</code>/<code>order.refunded</code>; budget subscriber writes a <code>debt_reduction</code> for the order amount. (Refund currently does NOT emit an event — see Backend Tasks.)</p>
  </section>

  <!-- DATA MODEL -->
  <section id="data-model">
    <h2>Data Model Changes</h2>
    <p style="margin-bottom:14px;">Two new tenant-scoped collections under <code>{companyId}/{storeId}/…</code>. Reuses the existing <code>budgetIdempotency/{eventId}</code> marker collection + TTL pattern (already defined in <code>budget/internal/paths.ts</code> + <code>BudgetIdempotencyMarkerSchema</code>). All money is integer agorot; all timestamps are epoch millis; <code>year</code>/<code>month</code>/<code>yearMonth</code> computed in <strong>Asia/Jerusalem</strong>.</p>
    <table class="model-table">
      <thead><tr><th>Field</th><th>Type</th><th>Collection</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td class="field-name">recordId</td><td class="field-type">string</td><td>budgetRecords</td><td>= doc id</td></tr>
        <tr><td class="field-name">organizationId</td><td class="field-type">string</td><td>budgetRecords</td><td>B2B buyer org</td></tr>
        <tr><td class="field-name">customerId</td><td class="field-type">string</td><td>budgetRecords</td><td>acting user; "system" if none</td></tr>
        <tr><td class="field-name">customerName</td><td class="field-type">string</td><td>budgetRecords</td><td>denormalized at write</td></tr>
        <tr><td class="field-name">billingAccountId</td><td class="field-type">string | null</td><td>budgetRecords</td><td>HQ/branch sub-grouping</td></tr>
        <tr><td class="field-name">type</td><td class="field-type">"debt_increase" | "debt_reduction"</td><td>budgetRecords</td><td>discriminator — see Fan-out</td></tr>
        <tr><td class="field-name">amount</td><td class="field-type">number</td><td>budgetRecords</td><td>integer agorot, always positive</td></tr>
        <tr><td class="field-name">currency</td><td class="field-type">"ILS"</td><td>budgetRecords</td><td>literal</td></tr>
        <tr><td class="field-name">relatedId</td><td class="field-type">string</td><td>budgetRecords</td><td>orderId (increase) or ledger transactionId (reduction)</td></tr>
        <tr><td class="field-name">source</td><td class="field-type">"order" | "ledger" | "manual"</td><td>budgetRecords</td><td>origin of the record</td></tr>
        <tr><td class="field-name">causedByEventId</td><td class="field-type">string | null</td><td>budgetRecords</td><td>trace + idempotency; null for manual</td></tr>
        <tr><td class="field-name">createdAt</td><td class="field-type">number</td><td>budgetRecords</td><td>epoch millis</td></tr>
        <tr><td class="field-name">year / month / yearMonth</td><td class="field-type">number / number / string</td><td>budgetRecords</td><td>Asia/Jerusalem date parts; "2026-05"</td></tr>
        <tr><td class="field-name">companyId / storeId</td><td class="field-type">string</td><td>budgetRecords</td><td>tenant</td></tr>
        <tr><td class="field-name">organizationId</td><td class="field-type">string</td><td>organizationBudgets</td><td>= doc id</td></tr>
        <tr><td class="field-name">organizationName</td><td class="field-type">string</td><td>organizationBudgets</td><td>denormalized</td></tr>
        <tr><td class="field-name">totalCurrentDebt</td><td class="field-type">number</td><td>organizationBudgets</td><td>integer agorot, current outstanding</td></tr>
        <tr><td class="field-name">totalDebits / totalCredits</td><td class="field-type">number</td><td>organizationBudgets</td><td>lifetime sums (agorot)</td></tr>
        <tr><td class="field-name">currency</td><td class="field-type">"ILS"</td><td>organizationBudgets</td><td>literal</td></tr>
        <tr><td class="field-name">updatedAt</td><td class="field-type">number</td><td>organizationBudgets</td><td>epoch millis</td></tr>
        <tr><td class="field-name">companyId / storeId</td><td class="field-type">string</td><td>organizationBudgets</td><td>tenant</td></tr>
      </tbody>
    </table>
    <p style="margin-top:14px;"><strong>Indexes required</strong> (add to <code>firestore.indexes.json</code>): <code>budgetRecords</code> — (organizationId ASC, yearMonth ASC, createdAt DESC), (organizationId ASC, createdAt DESC), (customerId ASC, createdAt DESC), (year ASC, createdAt DESC). Deploying indexes is part of the deploy gate.</p>
    <p style="margin-top:10px;"><strong>Legacy (untouched):</strong> <code>budgetAccounts</code>, <code>budgetAccounts/{org}/budgetTransactions</code>, <code>budgetRollups</code> remain in Firestore as inert data and as registry keys.</p>
  </section>

  <!-- CONTRACTS -->
  <section id="contracts">
    <h2>Contracts</h2>

    <div class="contract-block">
      <div class="contract-label">BudgetRecord (domain entity, client-readable)<span class="contract-location">packages/core/lib/entities/Budget.ts</span></div>
      <pre>export const BudgetRecordTypeSchema = z.enum(["debt_increase", "debt_reduction"]);
export type TBudgetRecordType = z.infer&lt;typeof BudgetRecordTypeSchema&gt;;

export const BudgetRecordSchema = z.object({
  recordId: z.string().min(1),
  organizationId: z.string().min(1),
  customerId: z.string(),            // "system" when no acting user
  customerName: z.string(),
  billingAccountId: z.string().nullable(),
  type: BudgetRecordTypeSchema,
  amount: z.number().int().positive(),   // integer agorot, always positive
  currency: z.literal("ILS"),
  relatedId: z.string().min(1),          // orderId | ledger transactionId
  source: z.enum(["order", "ledger", "manual"]),
  causedByEventId: z.string().nullable(),
  createdAt: z.number().int().positive(),
  year: z.number().int(),                // Asia/Jerusalem
  month: z.number().int().min(1).max(12),
  yearMonth: z.string(),                 // "2026-05"
  companyId: z.string().min(1),
  storeId: z.string().min(1),
});
export type TBudgetRecord = z.infer&lt;typeof BudgetRecordSchema&gt;;</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">OrganizationBudget (derived snapshot, client-readable)<span class="contract-location">packages/core/lib/entities/Budget.ts</span></div>
      <pre>export const OrganizationBudgetSchema = z.object({
  organizationId: z.string().min(1),     // = doc id
  organizationName: z.string(),
  totalCurrentDebt: z.number().int(),    // integer agorot
  totalDebits: z.number().int(),
  totalCredits: z.number().int(),
  currency: z.literal("ILS"),
  updatedAt: z.number().int().positive(),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
});
export type TOrganizationBudget = z.infer&lt;typeof OrganizationBudgetSchema&gt;;</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">applyBudgetEvent — single writer (module-internal service input)<span class="contract-location">functions/src/modules/budget/services/applyBudgetEvent.ts</span></div>
      <pre>type ApplyBudgetEventInput = {
  companyId: string;
  storeId: string;
  organizationId: string;
  organizationName: string;
  customerId: string;          // "system" if none
  customerName: string;
  billingAccountId: string | null;
  type: "debt_increase" | "debt_reduction";
  amount: number;              // integer agorot, positive
  relatedId: string;           // orderId | transactionId
  source: "order" | "ledger" | "manual";
  causedByEventId: string | null;  // null only for manual admin writes
};
// Returns { applied: boolean } — false = idempotent replay (marker already existed).
// Txn order: 1) create budgetIdempotency/{causedByEventId} (skip for manual)
//            2) read+set organizationBudgets/{orgId} (delta applied)
//            3) create budgetRecords/{recordId}
// On ALREADY_EXISTS for the marker → no-op, return { applied: false }.</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">Budget callable responses — UNCHANGED shape (frontend contract)<span class="contract-location">apps/store/src/lib/firebase/api.ts (consumer)</span></div>
      <pre>// getBudgetAccount(organizationId) -> { success, data: TBudgetAccountResponse | null }
//   mapped from organizationBudgets/{orgId}:
//   { id, organizationId, organizationName, companyId, storeId,
//     totalDebits, totalCredits, balance: totalCurrentDebt,
//     currency:"ILS", updatedAt }
// listBudgetAccounts() -> { success, data: TBudgetAccountResponse[] }  (read organizationBudgets, orderBy totalCurrentDebt desc)
// getBudgetTransactions(orgId, billingAccountId?) -> { success, data: TBudgetTransactionResponse[] }
//   mapped from budgetRecords (where organizationId==, orderBy createdAt desc):
//   { id: recordId, type, amount, runningBalance: <omit or 0>, orderId: relatedId|null,
//     billingAccountId, note: null, createdAt, createdBy: customerId, ... }
// markOrderPaid(...)        -> writes a manual budgetRecords debt_reduction (source:"manual")
// addBudgetManualTransaction(...) -> writes a manual budgetRecords debt_increase|debt_reduction</pre>
    </div>

    <div class="contract-block">
      <div class="contract-label">postTransaction call from payment paths (existing ledger input)<span class="contract-location">functions/src/modules/payments/api/{createPayment,chargeOrder}.ts</span></div>
      <pre>// J5 auth (createPayment success) — type:"hyp_j5_auth", source:"hyp_result", dedup hyp_{Id}
// J5 capture (chargeOrder success) — type:"hyp_capture", source:"hyp_result"|"api"
// BOTH must include:
//   reference: { type: "order", id: order.id }
//   payer:     { organizationId?: order.organizationId, clientId?: order.client?.id,
//                billingAccountId?: order.billingAccount?.id }
//   amount: integer agorot (convert from the shekel figure sent to HYP), direction: "in"</pre>
    </div>
  </section>

  <!-- FAN-OUT -->
  <section id="fanout">
    <h2>Fan-out Dependencies</h2>
    <div class="fanout-item">
      <div class="fanout-field">BudgetRecord.type ("debt_increase" | "debt_reduction")</div>
      <div class="fanout-meta">Category: Discriminated union — Producer: <code>functions/src/modules/budget/services/applyBudgetEvent.ts</code></div>
      <ul class="plan-list">
        <li><code>applyBudgetEvent</code> snapshot delta: <code>debt_increase</code> → <code>+amount</code> on totalCurrentDebt & totalDebits; <code>debt_reduction</code> → <code>−amount</code> on totalCurrentDebt & <code>+amount</code> on totalCredits.</li>
        <li>Callable mapper in <code>budgetApi</code> when projecting records → legacy transaction response (sign of <code>amount</code> / display).</li>
        <li>Any future admin UI that color-codes record rows by type.</li>
      </ul>
    </div>
    <div class="fanout-item">
      <div class="fanout-field">TransactionPostedPayload.type + the budget reduce-debt guard</div>
      <div class="fanout-meta">Category: Discriminated union (consumer) — Producer: <code>functions/src/modules/ledger/events.ts</code></div>
      <ul class="plan-list">
        <li>Existing consumer: <code>orders/subscribers/markOrderPaidOnTransactionPosted.ts</code> (<code>TRANSACTION_TYPE_TO_PAYMENT_STATUS</code> record — must stay exhaustive).</li>
        <li>New consumer: <code>budget/subscribers/reduceDebtOnTransactionPosted.ts</code> — guard on direction "in" + reference.type "order" + payer.organizationId present. Adding a new ledger type later means revisiting both consumers.</li>
      </ul>
    </div>
    <div class="fanout-item">
      <div class="fanout-field">storeCollections registry keys</div>
      <div class="fanout-meta">Category: Parallel registry — Producer: <code>packages/core/lib/firebase-api/index.ts</code></div>
      <ul class="plan-list">
        <li>Add <code>budgetRecords</code> and <code>organizationBudgets</code> keys → consumed by <code>FirebaseAPI.firestore.getPath()</code> everywhere; new <code>budget/internal/paths.ts</code> helpers must use these keys (never hand-built paths).</li>
        <li><code>firestore.rules</code> must grant admin read on the two new collections (mirror existing <code>budgetAccounts</code> rules).</li>
        <li><code>firestore.indexes.json</code> composite indexes for <code>budgetRecords</code>.</li>
      </ul>
    </div>
  </section>

  <!-- SHARED -->
  <section id="shared">
    <h2>Shared Package Changes</h2>
    <ul class="plan-list">
      <li><code>packages/core/lib/entities/Budget.ts</code> — add <code>BudgetRecordSchema</code>/<code>TBudgetRecord</code>, <code>BudgetRecordTypeSchema</code>, <code>OrganizationBudgetSchema</code>/<code>TOrganizationBudget</code>. Keep existing <code>BudgetAccount</code>/<code>BudgetTransaction</code> exports (legacy data + callable mapping still reference them).</li>
      <li><code>packages/core/lib/firebase-api/index.ts</code> — register <code>budgetRecords</code> + <code>organizationBudgets</code> in <code>storeCollections</code>.</li>
      <li>Rebuild <code>@jsdev_ninja/core</code> and verify all packages typecheck before any coder touches functions (shared-first sequencing per orchestrator rules).</li>
    </ul>
  </section>

  <!-- BACKEND TASKS -->
  <section id="backend">
    <h2>Backend Tasks</h2>
    <div class="task-list">
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B0 — Shared schemas + registry (shared-first)</div>
        <div class="task-detail">Add BudgetRecord/OrganizationBudget schemas to core Budget.ts; register the two collection keys in storeCollections. Rebuild core, typecheck all packages.</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B1 — Budget data layer: paths + store + applyBudgetEvent service</div>
        <div class="task-detail">New <code>budget/internal/paths.ts</code> helpers for budgetRecords/organizationBudgets via getPath (keep existing budgetIdempotencyPath). New <code>budget/internal/budgetStore.ts</code> reads. New <code>budget/services/applyBudgetEvent.ts</code> — the ONLY writer: one Firestore txn (idempotency marker .create → snapshot set → record create), Asia/Jerusalem date parts (use a date-parts helper, not raw UTC), structured logging, tabs. Idempotent replay returns {applied:false}.</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B2 — Budget subscribers (thin, idempotent)</div>
        <div class="task-detail">New <code>budget/subscribers/increaseDebtOnOrderPlaced.ts</code> (skip if no organizationId; read order doc for customer/billingAccount; amount = order.cart.cartTotal; source "order"; causedByEventId = ctx.eventId). <code>reduceDebtOnTransactionPosted.ts</code> (guard direction "in" + reference.type "order" + payer.organizationId; amount from payload; source "ledger"; relatedId = transactionId). <code>reduceDebtOnOrderReversed.ts</code> subscribing to order.cancelled AND order.refunded. Each: parse → call applyBudgetEvent → return. Export from budget/index.ts.</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B3 — Re-point budget callables</div>
        <div class="task-detail">Rewrite <code>budget/api/budgetApi.ts</code> + the appApi.budget block (<code>appApi/index.ts</code> ~L513-641) to read organizationBudgets/budgetRecords and map to the existing callable response shape (balance = totalCurrentDebt). markOrderPaid + addBudgetManualTransaction write manual budgetRecords via applyBudgetEvent (causedByEventId=null, source "manual"). Keep admin-claim auth + token-derived tenant. Drop budgetWriter/repository imports.</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B4 — Retire the delivery-note debt path + writer callers</div>
        <div class="task-detail">Remove the budgetWriter.onDeliveryNoteCreated call in <code>appApi/index.ts</code> (~L262). Remove budgetWriter.onOrderCancelled calls in <code>cancelOrder.ts</code> + <code>refundOrder.ts</code> (debt reversal now via subscriber). Make <code>refundOrder.ts</code> emit <code>order.refunded</code> (today it emits nothing). Delete <code>budget/internal/writer.ts</code> + the now-unused <code>repository.ts</code> functions. Leave legacy collections/data untouched.</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B5 — Wire ledger into index.tsx (GATE: protected file)</div>
        <div class="task-detail">Export the ledger callables (postManualTransaction, captureHypJ5, createHypDirectPaymentLink, createHypCheckoutPayment, recordHypJ5Auth, recordHypDirectPayment, getPaymentLink) and the existing <code>onTransactionPostedMarkOrderPaid</code> subscriber from index.tsx. Export the 3 new budget subscribers + the markOrderPaidOnTransactionPosted already-built subscriber. Requires developer approval before edit + redeploy of changed function names.</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B6 — Connect payments → ledger.postTransaction</div>
        <div class="task-detail">In <code>payments/api/createPayment.ts</code> (J5 auth success) and <code>chargeOrder.ts</code> (J5 capture success), call <code>postTransaction</code> with type hyp_j5_auth / hyp_capture, amount in agorot, direction "in", reference {type:"order", id: order.id}, payer {organizationId, clientId, billingAccountId}. Keep HYP amount as source of truth; convert shekels→agorot at the call site. Decide dedup source: hyp_result (HYP Id) preferred. Remove the stray <code>console.log('PPPP…')</code> in chargeOrder while here. Do NOT double-write order.paymentStatus if the markOrderPaid subscriber now owns it (coordinate to avoid races).</div>
      </div></div>
      <div class="task-item"><div class="task-check"></div><div>
        <div class="task-title">B7 — Firestore rules + indexes</div>
        <div class="task-detail">Add admin-read rules for budgetRecords + organizationBudgets (mirror budgetAccounts). Add composite indexes listed in Data Model. These deploy under the deploy gate.</div>
      </div></div>
    </div>
  </section>

  <!-- FRONTEND TASKS -->
  <section id="frontend">
    <h2>Frontend Tasks</h2>
    <p class="none">No frontend changes required if callable response shapes are preserved (B3). The admin pages (AdminBudgetPage, AdminOrganizationDetailPage, AdminOrderPageNew) consume <code>balance</code>, <code>totalDebits</code>, <code>totalCredits</code>, and transaction <code>type/amount/createdAt/note</code> — all satisfiable from the new collections via the mapper. If the developer wants to surface <code>year</code>/<code>yearMonth</code> filtering or rename fields, that is a separate follow-up plan.</p>
  </section>

  <!-- DEPENDENCIES -->
  <section id="dependencies">
    <h2>Dependencies & Sequencing</h2>
    <div class="dep-grid">
      <div class="dep-card"><strong>Run first</strong><p>B0 (shared schemas + registry, rebuild core). Everything imports these types.</p></div>
      <div class="dep-card"><strong>Can run in parallel</strong><p>After B0: B1 (data layer) and the ledger-wiring workstream B5/B6 are largely independent. B7 (rules/indexes) can be authored anytime.</p></div>
      <div class="dep-card"><strong>Blocked until</strong><p>B2 subscribers need B1. B3 callables need B1. The <code>reduceDebtOnTransactionPosted</code> subscriber is only useful once B5+B6 make payments post transactions. B4 retirement lands after B2 is deployed so debt never has a gap.</p></div>
    </div>
    <p style="margin-top:16px;"><strong>Recommended order:</strong> B0 → B1 → B2 → B3 (budget half works end-to-end on order events) → B7 → <strong>GATE</strong> → B5 + B6 (ledger half) → B4 (retire old path last, once new path verified). Deploy is one gated step covering functions + rules + indexes.</p>
  </section>

  <!-- TEST PLAN -->
  <section id="test-plan" class="test-section">
    <h2>Test Plan</h2>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Unit</span><span class="test-group-title">applyBudgetEvent</span><span class="test-target">budget/services/applyBudgetEvent.ts</span></div>
      <ul class="plan-list">
        <li>should increment totalCurrentDebt + totalDebits and append one record on debt_increase</li>
        <li>should decrement totalCurrentDebt + increment totalCredits on debt_reduction</li>
        <li>should create the organizationBudgets snapshot on first event for an org</li>
        <li>should be a no-op (applied:false) and append no second record when the same causedByEventId is replayed</li>
        <li>should compute year/month/yearMonth in Asia/Jerusalem (e.g. an event at 2026-05-31T22:30Z lands in June Jerusalem time)</li>
        <li>should store amount as positive integer agorot regardless of type</li>
        <li>should allow manual writes with causedByEventId=null without an idempotency marker</li>
      </ul>
    </div>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Integration</span><span class="test-group-title">Budget subscribers</span><span class="test-target">budget/subscribers/*</span></div>
      <ul class="plan-list">
        <li>increaseDebtOnOrderPlaced should skip when order has no organizationId (B2C)</li>
        <li>increaseDebtOnOrderPlaced should write debt_increase = order.cart.cartTotal for a B2B order</li>
        <li>reduceDebtOnTransactionPosted should write debt_reduction only for direction "in" + reference.type "order" + payer.organizationId present</li>
        <li>reduceDebtOnTransactionPosted should skip transactions with no payer.organizationId (B2C payment)</li>
        <li>reduceDebtOnOrderReversed should write debt_reduction on both order.cancelled and order.refunded</li>
      </ul>
    </div>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Contract</span><span class="test-group-title">Budget callables map to legacy shape</span><span class="test-target">budget/api/budgetApi.ts</span></div>
      <ul class="plan-list">
        <li>getBudgetAccount should return balance === organizationBudgets.totalCurrentDebt</li>
        <li>getBudgetTransactions should return budgetRecords mapped with id/type/amount/createdAt the admin UI reads</li>
        <li>all 5 callables should reject when auth.token.admin is absent</li>
      </ul>
    </div>
    <div class="test-group">
      <div class="test-group-header"><span class="test-type-badge">Edge Cases</span><span class="test-group-title">Critical scenarios</span></div>
      <ul class="plan-list">
        <li>Double-delivery of order.placed (event bus retry) applies debt exactly once</li>
        <li>Payment posts before order.placed subscriber runs (out-of-order) → debt can go negative then settle; verify final balance is correct after both apply</li>
        <li>Tenant isolation: org with same id under a different store has an independent snapshot</li>
        <li>No-regression: existing onTransactionPostedMarkOrderPaid still sets order.paymentStatus after ledger wiring (no double-write race with chargeOrder)</li>
        <li>Legacy budgetAccounts data is still readable/untouched after migration</li>
      </ul>
    </div>
    <div class="test-skip">
      <strong>Out of scope for tests</strong>
      <ul class="plan-list">
        <li>budgetRollups (no writer built)</li>
        <li>HYP signature verification internals (already covered by ledger tests)</li>
        <li>Frontend admin pages (no code change)</li>
      </ul>
    </div>
    <p style="margin-top:14px;"><strong>Manual no-regression on tester store (port 5175/5176) + read-only check on balasistore:</strong> place a B2B test order → confirm a budgetRecords debt_increase + organizationBudgets balance; run a J5 auth+capture on the tester store → confirm a debt_reduction lands and the admin Budget page shows the reduced balance; cancel a B2B order → confirm credit-back. On balasistore, only verify the admin Budget page still loads against the new collections (do NOT run balasistore dev scripts; read-only verification).</p>
  </section>

  <!-- GATES -->
  <section id="gates" class="gate-section">
    <h2>Gates (pause for explicit approval)</h2>
    <div class="gate-item"><strong>Balance-reset decision</strong><p>Confirm: switch to fresh <code>organizationBudgets</code> (no backfill) — existing outstanding balances reset to zero — OR run the optional backfill (see Breaking Changes). This is a data-correctness decision, approve before B3/B5 land.</p></div>
    <div class="gate-item"><strong>index.tsx edit</strong><p>B5 edits the protected root wiring file and changes deployed function names/triggers. Show the diff and get developer approval before editing.</p></div>
    <div class="gate-item"><strong>Deploy</strong><p>Functions + firestore.rules + firestore.indexes.json deploy is a single explicit gate. Never deploy without the developer saying so.</p></div>
    <div class="gate-item"><strong>Commit / push</strong><p>Work on a feature branch. Each commit/push needs its own explicit ask (per project memory).</p></div>
  </section>

  <!-- SECURITY -->
  <section id="security" class="security-section">
    <h2>Security Invariants</h2>
    <div class="security-item"><strong>Authentication</strong><p>All 5 budget callables require <code>auth.token.admin</code> and derive tenant from <code>auth.token.companyId/storeId</code> — never from request body. Preserve this exactly when re-pointing in B3.</p></div>
    <div class="security-item"><strong>Authorization / tenant boundary</strong><p>Every read/write goes through <code>FirebaseAPI.firestore.getPath({companyId, storeId, …})</code> with token-derived tenant. A subscriber's tenant comes from the event doc params, never from payload. No cross-tenant org reads.</p></div>
    <div class="security-item"><strong>Input validation</strong><p>Subscriber payloads validated by the existing Zod payload schemas in <code>subscribe()</code>. <code>applyBudgetEvent</code> asserts amount is a positive integer (agorot). Callable bodies (markOrderPaid/addBudgetManualTransaction) must be Zod-parsed, not cast with <code>as any</code> (current code casts <code>order: any</code> — tighten in B3).</p></div>
    <div class="security-item"><strong>Trust escalation (money)</strong><p>Debt amount on payment reduction comes ONLY from the verified ledger transaction (HYP-verified amount), never from a client field. Debt increase amount comes from the server-read order doc's <code>cart.cartTotal</code>, not from the event payload's optional <code>total</code> (re-read the order to avoid a spoofed/duplicated event inflating debt). The order.placed event's <code>organizationId</code> is cross-checked against the order doc.</p></div>
    <div class="security-item"><strong>Idempotency</strong><p>Deterministic marker <code>budgetIdempotency/{causedByEventId}</code> via <code>.create()</code>; ALREADY_EXISTS → no-op. Ledger <code>postTransaction</code> already dedupes by <code>hyp_{Id}</code> — do not bypass it.</p></div>
    <div class="security-item"><strong>Logging / secrets</strong><p>Structured <code>logger</code> with orgId/orderId/eventId fields; never log HYP credentials or the storePrivate doc. The payment files already avoid logging secrets — keep it that way; remove the stray <code>console.log</code> in chargeOrder.</p></div>
    <div class="security-item"><strong>No new external service</strong><p>HYP is already integrated; this plan adds no new external dependency or secret. Ledger wiring only routes existing HYP results through <code>postTransaction</code>.</p></div>
  </section>

  <!-- BREAKING CHANGES -->
  <section id="breaking" class="breaking-section">
    <h2>Breaking Changes</h2>
    <div class="breaking-item">
      <p><strong>Outstanding B2B balances reset to zero (no backfill)</strong> — <code>organizationBudgets/*</code> start empty</p>
      <p class="change-arrow">balance read from legacy <code>budgetAccounts</code> → balance read from fresh <code>organizationBudgets</code></p>
      <p class="migration">Migration: direct replace; old <code>budgetAccounts</code>/<code>budgetTransactions</code> left inert (NOT deleted). Until new events accrue, every org shows <code>totalCurrentDebt = 0</code>. <strong>Gated decision:</strong> (A) accept the reset, or (B) run a one-off backfill that reads each legacy <code>budgetAccounts.balance</code>/totals and seeds the matching <code>organizationBudgets</code> snapshot (optionally also fan legacy <code>budgetTransactions</code> into <code>budgetRecords</code> with <code>source:"manual"</code>, <code>causedByEventId:null</code>). Backfill is a separate scripted task, run once, idempotent, behind its own approval — NOT built by default.</p>
    </div>
    <div class="breaking-item">
      <p><strong>Debt now accrues on <code>order.placed</code>, not on delivery-note issuance</strong> — <code>appApi/index.ts</code> + <code>handleOrderDocumentAttached</code> path</p>
      <p class="change-arrow">debt added when delivery note attached → debt added when order created (B2B)</p>
      <p class="migration">Migration: timing of debt changes. Orders that are placed but later cancelled now create+reverse a record pair (vs. never creating debt pre-fulfillment under the old model). Acceptable per DECISION #1; reversal subscriber handles cancel/refund. Confirm with developer that "debt at order time" matches the business AR policy.</p>
    </div>
    <div class="breaking-item">
      <p><strong>Ledger callables become live deployed functions</strong> — <code>functions/src/index.tsx</code></p>
      <p class="change-arrow">ledger module unexported (dead) → ledger callables + subscribers deployed</p>
      <p class="migration">Migration: new function names appear on deploy; <code>onTransactionPostedMarkOrderPaid</code> begins writing order.paymentStatus. Verify it does not conflict with chargeOrder's existing direct paymentStatus write (B6 coordinates this). Protected-file edit gate applies.</p>
    </div>
  </section>

  <!-- RISKS -->
  <section id="risks">
    <h2>Risks &amp; Open Questions</h2>
    <div class="risk-item"><span class="risk-badge risk-high">High</span><p>Balance reset (no backfill) — admins will see all B2B debts drop to zero on cutover. Must be an explicit, approved decision before deploy. If the store actively uses budget balances, choose backfill.</p></div>
    <div class="risk-item"><span class="risk-badge risk-high">High</span><p>Double-counting payments: if BOTH <code>chargeOrder</code> keeps writing paymentStatus AND the ledger subscriber writes it, or if a payment posts a transaction while the old budget payment path is still wired, debt could be reduced twice. B4/B6 must land coordinated; verify only one writer owns each side.</p></div>
    <div class="risk-item"><span class="risk-badge risk-medium">Medium</span><p>order.placed fires on doc create, but <code>customerId</code>/<code>billingAccountId</code> require reading the order doc (payload only carries organizationId/total). Subscriber must read the order; handle the rare case where the doc isn't readable yet (retry via thrown error — event bus retries up to 5x).</p></div>
    <div class="risk-item"><span class="risk-badge risk-medium">Medium</span><p>Asia/Jerusalem date parts: must use a tz-aware computation (e.g. Intl with timeZone), not <code>new Date().getMonth()</code> on a UTC server, or month buckets will be wrong near midnight / around DST.</p></div>
    <div class="risk-item"><span class="risk-badge risk-medium">Medium</span><p>Snapshot can momentarily go negative if a payment event is processed before the order.placed debt event (out-of-order delivery). The snapshot is rebuildable and self-corrects once both apply; document that <code>totalCurrentDebt</code> can be transiently negative.</p></div>
    <div class="risk-item"><span class="risk-badge risk-low">Low</span><p>Frontend transaction type already names the field <code>amount</code> + expects <code>balance</code> while legacy backend returned <code>debt</code>/<code>runningBalance</code> — a pre-existing latent mismatch. B3 mapper should emit exactly what the UI reads; confirm the admin pages render correctly during QA.</p></div>
    <div class="risk-item"><span class="risk-badge risk-open">Open</span><p>Is the <code>hyp_direct</code> redirect path (<code>createPaymentRedirect</code>/<code>recordHypDirectPayment</code>) live in production? If yes, it also needs payer.organizationId + reference wired (DECISION mentions <code>hyp_direct</code>). Confirm before scoping it in or out.</p></div>
    <div class="risk-item"><span class="risk-badge risk-open">Open</span><p>Keep the <code>billingAccountId</code> dimension on records (model open decision #5)? Plan keeps it (nullable) — confirm it is still used on delivery notes/invoices.</p></div>
    <div class="risk-item"><span class="risk-badge risk-open">Open</span><p>For <code>markOrderPaid</code> manual admin payments — should they remain (manual record) now that real HYP payments auto-reduce debt via the ledger? Risk of double-reduction if an admin manually marks paid AND a ledger payment posts. Confirm the manual path's role.</p></div>
  </section>

</main>
</body>
</html>
