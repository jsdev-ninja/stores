/* =========================================================
   בלסי סטור — Admin Panel JS
   ========================================================= */

const ADMIN_PASS = 'balasi2026'; // demo password
const VAT = 0.18;
/* Categories where products are VAT-exempt by default (Israeli law: fresh produce) */
const ADMIN_VAT_EXEMPT_CATS = ['fruits'];

function isProductVatExempt(p) {
  if (!p) return false;
  if (typeof p.vatExempt === 'boolean') return p.vatExempt;
  return ADMIN_VAT_EXEMPT_CATS.includes(p.cat);
}

/* Determine if a single line is VAT-exempt — checks the line itself first
   (cat/vatExempt snapshots from the order) before falling back to the product. */
function isLineVatExempt(it, p) {
  if (it && typeof it.vatExempt === 'boolean') return it.vatExempt;
  if (it && it.cat && ADMIN_VAT_EXEMPT_CATS.includes(it.cat)) return true;
  return isProductVatExempt(p);
}

/* Look up the discount % a company gets based on its tier */
function getCompanyTierDiscount(companyId) {
  if (!companyId) return { tier: null, discount: 0, label: '' };
  const company = DB.companies.find(c => c.id === companyId);
  if (!company || !company.tier || company.tier === 'small') return { tier: company?.tier || 'small', discount: 0, label: '' };
  const tiers = (DB.settings && DB.settings.tiers) || [];
  const tier = tiers.find(t => t.id === company.tier);
  if (!tier) return { tier: company.tier, discount: 0, label: '' };
  return { tier: tier.id, discount: Number(tier.discount) || 0, label: tier.label };
}

/* Calculate VAT-aware total for a list of order/invoice items.
   Optionally accepts companyId to apply customer-tier discount on the whole order.
   Optionally accepts shipping (₪, לפני מע״מ) — דמי משלוח חייבים במע״מ ואינם זכאים
   להנחת רמת לקוח, ולכן מתווספים אחרי חישוב ההנחה. (נוסף 2026-06-11) */
function calculateTotalsWithVat(items, companyId, shipping) {
  let subtotal = 0, vatBase = 0, exemptBase = 0;
  items.forEach(it => {
    const p = DB.products.find(x => x.id === it.pid);
    const price = (typeof it.price !== 'undefined') ? it.price : (p?.price ?? it.externalPrice ?? 0);
    const lineTotal = price * it.qty;
    subtotal += lineTotal;
    if (isLineVatExempt(it, p)) exemptBase += lineTotal;
    else vatBase += lineTotal;
  });

  // Apply customer-tier discount BEFORE VAT (Israeli law: VAT applies to net price)
  const tierInfo = getCompanyTierDiscount(companyId);
  const discountPct = tierInfo.discount;
  let discountAmount = 0;
  if (discountPct > 0) {
    discountAmount = Math.round(subtotal * (discountPct / 100) * 100) / 100;
    // Reduce both bases proportionally
    const ratio = (subtotal - discountAmount) / subtotal;
    vatBase = Math.round(vatBase * ratio * 100) / 100;
    exemptBase = Math.round(exemptBase * ratio * 100) / 100;
    subtotal = subtotal - discountAmount;
  }

  // דמי משלוח — חייבים במע״מ, אינם זכאים להנחה, נשמרים כשורה נפרדת.
  // subtotal נשאר "מחיר הסחורה" בלבד; ship מתווסף לבסיס המע״מ ולסה״כ.
  const ship = Math.round((Number(shipping) || 0) * 100) / 100;
  if (ship > 0) vatBase += ship;

  const vat = Math.round(vatBase * VAT * 100) / 100;
  const total = Math.round((subtotal + ship + vat) * 100) / 100;
  return {
    subtotal, vatBase, exemptBase, vat, total,
    shipping: ship,
    vatPct: Math.round(VAT * 100), // שיעור המע״מ בפועל — לתצוגה אחידה בתעודה ובחשבונית
    discountPct, discountAmount,
    tierLabel: tierInfo.label,
    tierId: tierInfo.tier
  };
}

/* ---------- DATA STORE (localStorage backed) ---------- */
const DB = {
  load() {
    try {
      this.companies        = JSON.parse(localStorage.getItem('admin_companies')        || 'null') || seedCompanies();
      this.customers        = JSON.parse(localStorage.getItem('admin_customers')        || 'null') || seedCustomers();
      this.products         = JSON.parse(localStorage.getItem('admin_products')         || 'null') || seedProducts();
      this.orders           = JSON.parse(localStorage.getItem('admin_orders')           || 'null') || seedOrders();
      this.invoices         = JSON.parse(localStorage.getItem('admin_invoices')         || 'null') || seedInvoices();
      this.suppliers        = JSON.parse(localStorage.getItem('admin_suppliers')        || 'null') || seedSupplierInvoices();
      this.deliveryNotes    = JSON.parse(localStorage.getItem('admin_deliveryNotes')    || 'null') || seedDeliveryNotes();
      this.receipts         = JSON.parse(localStorage.getItem('admin_receipts')         || 'null') || seedReceipts();
      this.credits          = JSON.parse(localStorage.getItem('admin_credits')          || 'null') || seedCredits();
      this.categories       = JSON.parse(localStorage.getItem('admin_categories')       || 'null') || seedCategories();
      this.supplierEntities = JSON.parse(localStorage.getItem('admin_supplierEntities') || 'null') || seedSupplierEntities();
      this.promotions       = JSON.parse(localStorage.getItem('admin_promotions')       || 'null') || seedPromotions();
      this.settings         = JSON.parse(localStorage.getItem('admin_settings')         || 'null') || seedSettings();
      // Ensure autoBilling exists on legacy settings (added later)
      if (this.settings && !this.settings.autoBilling) {
        this.settings.autoBilling = seedSettings().autoBilling;
        localStorage.setItem('admin_settings', JSON.stringify(this.settings));
      }
      // One-time migration: replace placeholder business details with the real
      // registered company info (Balasi Store Ltd). Required for legal compliance
      // — without real C.P/address invoices issued before this update were invalid.
      const PLACEHOLDER_TAX_IDS = ['516127321', '', null, undefined];
      if (this.settings && PLACEHOLDER_TAX_IDS.includes(this.settings.taxId)) {
        const real = seedSettings();
        this.settings.companyName  = real.companyName;
        this.settings.taxId        = real.taxId;
        this.settings.address      = real.address;
        this.settings.addressNote  = real.addressNote;
        this.settings.email        = real.email;
        // Keep phone empty if it's still the placeholder, leave anything custom alone
        if (this.settings.phone === '03-1234567') this.settings.phone = '';
        localStorage.setItem('admin_settings', JSON.stringify(this.settings));
      }
      rebuildCatNames();
      // One-time migration (2026-05-19): fix monthly-deal endDates that
      // were set off-by-one due to a timezone bug. Earlier code computed
      // the end of month with toISOString(), which in Israel (UTC+2/+3)
      // shifts the local 31st back to UTC 30th. Only bump endDates that
      // match exactly the off-by-one pattern — custom dates the admin
      // set deliberately are not touched.
      try {
        if (localStorage.getItem('admin_fixed_monthlydeal_eom_v1') !== '1') {
          const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };
          let changed = false;
          (this.promotions || []).forEach(p => {
            if (!p || p.monthlyDeal !== true || !p.endDate) return;
            const m = String(p.endDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!m) return;
            const year  = Number(m[1]);
            const month = Number(m[2]);
            const day   = Number(m[3]);
            const actualEom = new Date(year, month, 0);
            const actualDay = actualEom.getDate();
            if (day === actualDay - 1) {
              p.endDate = fmt(new Date(year, month - 1, actualDay));
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem('admin_promotions', JSON.stringify(this.promotions));
          }
          localStorage.setItem('admin_fixed_monthlydeal_eom_v1', '1');
        }
      } catch (e) { /* migration is best-effort */ }
      // Mirror promotions to the public-site localStorage key so the
      // catalog reflects the current promo state on page load.
      try { localStorage.setItem('balasi_promotions', JSON.stringify(this.promotions || [])); } catch (e) {}
    } catch (e) { console.error(e); }
  },
  save(key) {
    const keys = ['companies','customers','products','orders','invoices','suppliers','deliveryNotes','receipts','credits','categories','supplierEntities','promotions','settings'];
    try {
      if (key) {
        localStorage.setItem('admin_' + key, JSON.stringify(this[key]));
      } else {
        keys.forEach(k => localStorage.setItem('admin_' + k, JSON.stringify(this[k])));
      }
    } catch (e) { console.error(e); }
  },
  reset() {
    const keys = ['companies','customers','products','orders','invoices','suppliers','deliveryNotes','receipts','credits','categories','supplierEntities','promotions','settings'];
    keys.forEach(k => localStorage.removeItem('admin_' + k));
    this.load();
  }
};

/* ---------- SEED DATA ---------- */
function seedCompanies() {
  return [
    {
      id:1, name:'הייטק לאב בע"מ', taxId:'516127321',
      address:'רוטשילד 22', city:'תל אביב', zip:'6688118',
      phone:'03-5550101', email:'office@hightechlab.co.il',
      notes:'לקוח VIP, שליחת חשבונית רק במייל', addedAt:'2024-08-12',
      // Multiple branches (תרחיש 3: חברה עם כמה משרדים)
      branches:[
        { id:'b1', label:'משרד ראשי - רוטשילד', address:'רוטשילד 22, תל אביב', phone:'03-5550101', isPrimary:true },
        { id:'b2', label:'סניף הרצליה פיתוח', address:'מדינת היהודים 60, הרצליה', phone:'09-5550199' }
      ],
      // Multiple accounts (תרחיש 4: כמה מספרי לקוח על חברה אחת)
      accounts:[
        { id:'a1', customerNumber:'C-1001', label:'חשבון מזון וקפה', payTerms:'net30', creditLimit:10000, isPrimary:true },
        { id:'a2', customerNumber:'C-1001-N', label:'חשבון ניקיון וכלים', payTerms:'net60', creditLimit:5000 }
      ]
    },
    {
      id:2, name:'משרד עו"ד גולדמן', taxId:'511223344',
      address:'דרך מנחם בגין 132', city:'תל אביב', zip:'6701701',
      phone:'03-5550202', email:'info@goldman-law.co.il',
      notes:'', addedAt:'2024-09-04',
      branches:[
        { id:'b1', label:'משרד יחיד', address:'דרך מנחם בגין 132, תל אביב', phone:'03-5550202', isPrimary:true }
      ],
      accounts:[
        { id:'a1', customerNumber:'C-1002', label:'חשבון ראשי', payTerms:'net60', creditLimit:8000, isPrimary:true }
      ]
    },
    {
      id:3, name:'סטארטאפ קלאוד-נט', taxId:'515678901',
      address:'הירקון 88', city:'רמת גן', zip:'5120304',
      phone:'03-5550303', email:'admin@cloudnet.io',
      notes:'הזמנה שבועית קבועה ביום ה\'', addedAt:'2024-10-15',
      branches:[
        { id:'b1', label:'משרד יחיד - רמת גן', address:'הירקון 88, רמת גן', phone:'03-5550303', isPrimary:true }
      ],
      accounts:[
        { id:'a1', customerNumber:'C-1003', label:'חשבון ראשי', payTerms:'credit', creditLimit:5000, isPrimary:true }
      ]
    },
    {
      id:4, name:'יזמות וייעוץ ש.ל.מ.', taxId:'512987654',
      address:'אבן גבירול 45', city:'גבעתיים', zip:'5340201',
      phone:'03-5550404', email:'office@shlm.co.il',
      notes:'', addedAt:'2025-01-20',
      branches:[
        { id:'b1', label:'משרד יחיד', address:'אבן גבירול 45, גבעתיים', phone:'03-5550404', isPrimary:true }
      ],
      accounts:[
        { id:'a1', customerNumber:'C-1004', label:'חשבון ראשי', payTerms:'net30', creditLimit:10000, isPrimary:true }
      ]
    },
    {
      id:5, name:'פרסום זן', taxId:'513456789',
      address:'הסחר 5', city:'הוד השרון', zip:'4540109',
      phone:'09-5550505', email:'hello@zen-pr.co.il',
      notes:'מינימום ₪650 (הוד השרון)', addedAt:'2025-02-08',
      branches:[
        { id:'b1', label:'משרד יחיד', address:'הסחר 5, הוד השרון', phone:'09-5550505', isPrimary:true }
      ],
      accounts:[
        { id:'a1', customerNumber:'C-1005', label:'חשבון ראשי', payTerms:'credit', creditLimit:6000, isPrimary:true }
      ]
    },
    {
      id:6, name:'בית עוז למידה', taxId:'514999111',
      address:'הקונגרס 12', city:'פתח תקווה', zip:'4951049',
      phone:'03-5550606', email:'info@bet-oz.org.il',
      notes:'רשת חינוך עם 3 סניפים', addedAt:'2025-03-22',
      // Multi-branch educational network (תרחיש 3 + 4)
      branches:[
        { id:'b1', label:'הקונגרס - מטה ראשי', address:'הקונגרס 12, פתח תקווה', phone:'03-5550606', isPrimary:true },
        { id:'b2', label:'סניף ת"א', address:'דיזנגוף 200, תל אביב', phone:'03-5550607' },
        { id:'b3', label:'סניף רמת גן', address:'ביאליק 45, רמת גן', phone:'03-5550608' }
      ],
      accounts:[
        { id:'a1', customerNumber:'C-1006', label:'חשבון מזון וכיבוד', payTerms:'net60', creditLimit:8000, isPrimary:true },
        { id:'a2', customerNumber:'C-1006-N', label:'חשבון ניקיון וחומרי משרד', payTerms:'net60', creditLimit:4000 }
      ]
    },
  ];
}

function seedCustomers() {
  return [
    // תרחיש 1: חברה עם מספר אנשים שמורשים (הייטק לאב)
    {
      id:1, name:'דנה כהן', role:'מנהלת משרד', phone:'050-1234001', email:'dana@hightechlab.co.il', addedAt:'2024-08-12',
      // companyId שומרים לתאימות אחורה
      companyId:1,
      // accessList — רשימת הרשאות מפורשת
      accessList:[
        { companyId:1, branchId:'b1', accountId:'a1', role:'orderer' },     // יכולה להזמין במשרד ראשי
        { companyId:1, branchId:'b1', accountId:'a2', role:'orderer' },     // יכולה להזמין גם בחשבון ניקיון
        { companyId:1, branchId:'b2', accountId:'a1', role:'orderer' }      // ובסניף הרצליה
      ]
    },
    {
      id:2, name:'יוסי לוי', role:'סמנכ"ל כספים', phone:'052-1234002', email:'yossi@hightechlab.co.il', addedAt:'2024-08-12',
      companyId:1,
      accessList:[
        // יוסי הוא מזמין רגיל. אפשר בעתיד להוסיף לו גם הרשאת אישור אם תופעל מערכת אישורים.
        { companyId:1, branchId:'b1', accountId:'a1', role:'orderer' },
        { companyId:1, branchId:'b1', accountId:'a2', role:'orderer' },
        { companyId:1, branchId:'b2', accountId:'a1', role:'orderer' }
      ]
    },
    // תרחיש 2: לקוח אחד שמורשה ב-2 חברות שונות (יועץ עצמאי)
    {
      id:8, name:'אילן רוזן', role:'יועץ עצמאי', phone:'050-1234008', email:'ilan@external-consultant.co.il', addedAt:'2025-04-10',
      companyId:1,
      accessList:[
        { companyId:1, branchId:'b1', accountId:'a1', role:'orderer' },     // מורשה בהייטק לאב
        { companyId:3, branchId:'b1', accountId:'a1', role:'orderer' }      // ובסטארטאפ קלאוד-נט
      ]
    },
    {
      id:3, name:'מיכל אברהם', role:'מזכירה ראשית', phone:'054-1234003', email:'michal@goldman-law.co.il', addedAt:'2024-09-04',
      companyId:2,
      accessList:[ { companyId:2, branchId:'b1', accountId:'a1', role:'orderer' } ]
    },
    {
      id:4, name:'רון פריד', role:'CTO', phone:'050-1234004', email:'ron@cloudnet.io', addedAt:'2024-10-15',
      companyId:3,
      accessList:[ { companyId:3, branchId:'b1', accountId:'a1', role:'orderer' } ]
    },
    {
      id:5, name:'אורית שמש', role:'אופיס מנג\'ר', phone:'053-1234005', email:'orit@shlm.co.il', addedAt:'2025-01-20',
      companyId:4,
      accessList:[ { companyId:4, branchId:'b1', accountId:'a1', role:'orderer' } ]
    },
    {
      id:6, name:'נועה דקל', role:'מנהלת פרויקטים', phone:'058-1234006', email:'noa@zen-pr.co.il', addedAt:'2025-02-08',
      companyId:5,
      accessList:[ { companyId:5, branchId:'b1', accountId:'a1', role:'orderer' } ]
    },
    // תרחיש 3+4: רשת עם 3 סניפים, מנהל ראשי + מנהל סניף
    {
      id:7, name:'אבי גרין', role:'מנהל אדמיניסטרציה ראשי', phone:'052-1234007', email:'avi@bet-oz.org.il', addedAt:'2025-03-22',
      companyId:6,
      accessList:[
        { companyId:6, branchId:'b1', accountId:'a1', role:'orderer' },    // הכל בכל הסניפים
        { companyId:6, branchId:'b1', accountId:'a2', role:'orderer' },
        { companyId:6, branchId:'b2', accountId:'a1', role:'orderer' },
        { companyId:6, branchId:'b2', accountId:'a2', role:'orderer' },
        { companyId:6, branchId:'b3', accountId:'a1', role:'orderer' },
        { companyId:6, branchId:'b3', accountId:'a2', role:'orderer' }
      ]
    },
    {
      id:9, name:'תמר אבן', role:'מנהלת סניף ת"א', phone:'054-1234009', email:'tamar@bet-oz.org.il', addedAt:'2025-04-15',
      companyId:6,
      accessList:[
        { companyId:6, branchId:'b2', accountId:'a1', role:'orderer' },    // רק בסניף ת"א
        { companyId:6, branchId:'b2', accountId:'a2', role:'orderer' }
      ]
    }
  ];
}

function seedProducts() {
  // Full catalog mirrors public site. Admin-only fields (sku/cost/stock/low) added.
  // cost = ~65% of price as default; stock/low set to reasonable demo values.
  const mk = (id, name, cat, brand, icon, price, unit, opts={}) => ({
    id,
    sku: 'BLS-' + String(id).padStart(4, '0'),
    name, cat, brand, icon, price,
    cost: opts.cost ?? Math.round(price * 0.65 * 100) / 100,
    unit,
    stock: opts.stock ?? 50,
    low: opts.low ?? 10,
    ...(opts.vatExempt !== undefined ? { vatExempt: opts.vatExempt } : {})
  });
  return [
    // Hot drinks
    mk(1, 'קפסולות נספרסו אסקפסו', 'coffee', 'נספרסו', '☕', 84, '10 קפסולות', { stock:240, low:30 }),
    mk(2, 'קפה טורקי אליטה', 'coffee', 'עלית', '☕', 32, '200 גרם'),
    mk(3, 'קפה לנדוור פולים שלמים', 'coffee', 'לנדוור', '☕', 78, '1 ק"ג', { stock:85, low:20 }),
    mk(4, 'תה ירוק ויסוצקי', 'coffee', 'ויסוצקי', '🍵', 24, '25 שקיות', { stock:18, low:30 }),
    mk(5, 'תה צמחים נענע ויסוצקי', 'coffee', 'ויסוצקי', '🍵', 22, '25 שקיות'),
    mk(6, 'מקציפת חלב נסטלה', 'coffee', 'נסטלה', '🥛', 38, '500 מ"ל'),
    mk(8, 'סוכרזית כפיות חד-פעמיות', 'coffee', 'סוכרזית', '🥄', 12, '200 יח׳'),

    // Cold drinks
    mk(10, 'מים מינרליים נביעות 1.5 ליטר', 'drinks', 'נביעות', '💧', 22, 'מארז 6', { stock:320, low:50 }),
    mk(11, 'מים מינרליים נביעות 0.5 ליטר', 'drinks', 'נביעות', '💧', 28, 'מארז 24', { stock:150, low:40 }),
    mk(12, 'קוקה קולה זירו', 'drinks', 'קוקה קולה', '🥤', 42, 'מארז 6×1.5L', { stock:42, low:25 }),
    mk(13, 'מיץ תפוזים פרימור', 'drinks', 'פרימור', '🍊', 14, '1 ליטר'),
    mk(14, 'מיץ תפוחים פרי-זה', 'drinks', 'פרי-זה', '🍎', 16, '1 ליטר'),
    mk(15, 'תה קר ויסוצקי לימון', 'drinks', 'ויסוצקי', '🍋', 9, '500 מ"ל'),
    mk(16, 'משקה אנרגיה רד בול', 'drinks', 'רד בול', '⚡', 11, '250 מ"ל'),
    mk(17, 'מי סודה זוויה', 'drinks', 'זוויה', '🥂', 24, 'מארז 6'),

    // Salty snacks
    mk(20, 'במבה אסם', 'snacks', 'אסם', '🥜', 6, '80 גרם', { stock:480, low:80, cost:3.8 }),
    mk(21, 'ביסלי גריל אסם', 'snacks', 'אסם', '🥨', 5, '70 גרם', { stock:12, low:80, cost:3.2 }),
    mk(22, 'דוריטוס גבינה', 'snacks', 'דוריטוס', '🌽', 8, '90 גרם'),
    mk(23, 'אגוזי קשיו קלויים', 'snacks', 'נטורל', '🥜', 42, '250 גרם', { stock:65, low:20 }),
    mk(24, 'שקדים קלויים מומלחים', 'snacks', 'נטורל', '🥜', 38, '250 גרם'),
    mk(25, 'גרנולה אנרגיה דובדבן', 'snacks', 'בייגל בייגל', '🌾', 32, '500 גרם'),
    mk(26, 'חטיף חמוצים מטעמי הגליל', 'snacks', 'הגליל', '🥒', 18, '4 יחידות'),
    mk(28, 'חטיף חלבון נטורל בר', 'snacks', 'נטורל בר', '💪', 9, 'יחידה 50 גרם'),

    // Sweet snacks
    mk(30, 'שוקולד עלית מריר 70%', 'sweets', 'עלית', '🍫', 14, '100 גרם'),
    mk(31, 'שוקולד פרה עלית', 'sweets', 'עלית', '🍫', 11, '100 גרם', { stock:0, low:30 }),
    mk(32, 'שוקולד קינדר בואנו', 'sweets', 'קינדר', '🍫', 8, 'יחידה'),
    mk(33, 'סוכריות מנטוס תות', 'sweets', 'מנטוס', '🍬', 5, 'גליל'),
    mk(34, 'מאסטיק טופי כריות', 'sweets', 'עלית', '🍬', 4, 'גליל'),
    mk(35, 'במבה ממולאת שוקולד', 'sweets', 'אסם', '🍫', 8, '80 גרם'),

    // Bakery
    mk(40, 'רוגלך שוקולד אנגל', 'bakery', 'אנגל', '🥐', 38, '500 גרם', { stock:24, low:15 }),
    mk(41, 'קרואסון חמאה', 'bakery', 'אנגל', '🥐', 8, 'יחידה'),
    mk(42, 'עוגיות שוקולד צ\'יפס ביתיות', 'bakery', 'בלסי', '🍪', 42, '500 גרם'),
    mk(43, 'עוגיות שיבולת שועל', 'bakery', 'בלסי', '🍪', 36, '400 גרם'),
    mk(44, 'מאפה גבינה מלוח', 'bakery', 'אנגל', '🥧', 14, 'יחידה'),
    mk(45, 'בורקס תפוחי אדמה', 'bakery', 'אנגל', '🥟', 10, 'יחידה'),
    mk(46, 'לחמניות קמח מלא', 'bakery', 'אנגל', '🍞', 28, 'מארז 8'),

    // Dairy
    mk(50, 'חלב תנובה 3% שומן', 'dairy', 'תנובה', '🥛', 8, '1 ליטר', { stock:78, low:30 }),
    mk(51, 'חלב סויה אלפרו', 'dairy', 'אלפרו', '🥛', 14, '1 ליטר'),
    mk(52, 'יוגורט יווני יופלה', 'dairy', 'יופלה', '🥄', 7, '150 גרם'),
    mk(53, 'גבינת קוטג\' תנובה 5%', 'dairy', 'תנובה', '🧀', 8, '250 גרם'),
    mk(54, 'גבינה צהובה עמק פרוסה', 'dairy', 'תנובה', '🧀', 24, '200 גרם'),
    mk(55, 'חמאה נטולת מלח', 'dairy', 'תנובה', '🧈', 18, '200 גרם'),

    // Fruits & Veggies (VAT exempt)
    mk(60, 'סל פירות טרי משרדי', 'fruits', 'בלסי', '🍎', 120, '2 ק"ג מעורב', { stock:32, low:10, vatExempt:true }),
    mk(61, 'סל פרימיום אקזוטי', 'fruits', 'בלסי', '🥭', 240, '3 ק"ג מעורב', { vatExempt:true }),
    mk(62, 'תפוחים אדומים', 'fruits', 'טרי', '🍎', 18, 'ק"ג', { vatExempt:true }),
    mk(63, 'בננות', 'fruits', 'טרי', '🍌', 11, 'ק"ג', { vatExempt:true }),
    mk(64, 'תפוזים מוסקה', 'fruits', 'טרי', '🍊', 12, 'ק"ג', { vatExempt:true }),
    mk(65, 'ענבים ירוקים', 'fruits', 'טרי', '🍇', 24, 'ק"ג', { vatExempt:true }),
    mk(66, 'תמרים מג\'הול', 'fruits', 'טרי', '🌴', 48, '500 גרם', { stock:25, low:8, vatExempt:true }),
    mk(67, 'עגבניות שרי', 'fruits', 'טרי', '🍅', 14, '500 גרם', { stock:40, low:12, vatExempt:true }),
    mk(68, 'מלפפונים', 'fruits', 'טרי', '🥒', 9, 'ק"ג', { vatExempt:true }),

    // Meals
    mk(70, 'סלט קיסר עם עוף', 'meals', 'בלסי', '🥗', 42, 'אישי'),
    mk(71, 'סלט קינואה ים-תיכוני', 'meals', 'בלסי', '🥗', 38, 'אישי'),
    mk(72, 'סנדוויץ\' טונה ובצל', 'meals', 'בלסי', '🥪', 28, 'יחידה'),
    mk(73, 'סנדוויץ\' חביתה ועגבניה', 'meals', 'בלסי', '🥪', 24, 'יחידה'),
    mk(74, 'פסטה ברוטב עגבניות', 'meals', 'בלסי', '🍝', 32, 'אישי'),
    mk(75, 'מגש סושי לפגישות', 'meals', 'בלסי', '🍣', 180, '24 חתיכות'),

    // Healthy
    mk(80, 'חטיף בריאות אגוזים ופירות', 'healthy', 'נטורל', '🌿', 9, '40 גרם'),
    mk(81, 'מים בטעם מלפפון ולימון', 'healthy', 'נביעות', '🥒', 12, '500 מ"ל'),
    mk(82, 'יוגורט קוקוס טבעוני', 'healthy', 'אלפרו', '🥥', 14, '150 גרם'),
    mk(84, 'אבקת חלבון צמחי וניל', 'healthy', 'נטורל', '💪', 140, '1 ק"ג'),
    mk(85, 'ירקות חתוכים וטריים', 'healthy', 'בלסי', '🥕', 24, '500 גרם'),

    // Disposable
    mk(90, 'כוסות פלסטיק 200 מ"ל', 'disposable', 'פלסטו', '🥤', 18, 'מארז 100', { stock:140, low:50 }),
    mk(91, 'כוסות חמות עם מכסה', 'disposable', 'פלסטו', '☕', 32, 'מארז 50'),
    mk(92, 'צלחות חד-פעמיות 23 ס"מ', 'disposable', 'פלסטו', '🍽️', 24, 'מארז 50'),
    mk(93, 'מפיות נייר 33×33', 'disposable', 'לילי', '📜', 14, 'מארז 100'),
    mk(94, 'סכו"ם חד-פעמי כסף', 'disposable', 'פלסטו', '🥄', 22, 'מארז 50'),
    mk(95, 'קשיות נייר ידידותיות', 'disposable', 'אקו', '🥤', 16, 'מארז 100'),
    mk(96, 'מגבות נייר תעשייתיות', 'disposable', 'לילי', '🧻', 38, '12 גלילים'),

    // Cleaning
    mk(100, 'סבון ידיים נוזלי 1 ליטר', 'cleaning', 'סנו', '🧴', 24, 'בקבוק'),
    mk(101, 'מגבונים מחטאים 100 יח\'', 'cleaning', 'סנו', '🧽', 18, 'מיכל'),
    mk(102, 'נייר טואלט פרימיום 24 גלילים', 'cleaning', 'לילי', '🧻', 48, 'מארז', { stock:55, low:20 }),
    mk(103, 'נוזל לכלים פיירי', 'cleaning', 'פיירי', '🧼', 18, '750 מ"ל', { stock:8, low:25 }),
    mk(104, 'אקונומיקה כלורית 4L', 'cleaning', 'סנו', '🧴', 24, '4 ליטר'),
    mk(105, 'שקיות זבל 60 ליטר', 'cleaning', 'סנו', '🗑️', 16, 'מארז 50'),
    mk(106, 'ספריי לניקוי משטחים', 'cleaning', 'סנו', '💨', 22, '750 מ"ל'),
  ];
}

function seedOrders() {
  const today = new Date();
  const dayAgo = (n) => new Date(today.getTime() - n*86400000).toISOString().split('T')[0];
  return [
    { id:1, orderNumber:'BLS-20260428-001', companyId:1, customerId:1, date:dayAgo(2), items:[{pid:1,qty:5},{pid:20,qty:20},{pid:60,qty:2}], total:932, payStatus:'paid', orderStatus:'delivered', notes:'' },
    { id:2, orderNumber:'BLS-20260427-002', companyId:3, customerId:4, date:dayAgo(3), items:[{pid:11,qty:8},{pid:21,qty:30},{pid:103,qty:4}], total:466, payStatus:'pending', orderStatus:'in-delivery', notes:'משלוח אחה"צ' },
    { id:3, orderNumber:'BLS-20260426-003', companyId:2, customerId:3, date:dayAgo(4), items:[{pid:3,qty:3},{pid:50,qty:10},{pid:40,qty:4}], total:546, payStatus:'paid', orderStatus:'delivered', notes:'' },
    { id:4, orderNumber:'BLS-20260425-004', companyId:5, customerId:6, date:dayAgo(5), items:[{pid:60,qty:5},{pid:23,qty:6},{pid:31,qty:20}], total:1072, payStatus:'pending', orderStatus:'confirmed', notes:'מינימום ₪650 - הוד השרון' },
    { id:5, orderNumber:'BLS-20260424-005', companyId:4, customerId:5, date:dayAgo(7), items:[{pid:1,qty:3},{pid:11,qty:5},{pid:90,qty:8}], total:536, payStatus:'paid', orderStatus:'delivered', notes:'' },
    { id:6, orderNumber:'BLS-20260424-006', companyId:1, customerId:1, date:dayAgo(7), items:[{pid:20,qty:50},{pid:21,qty:50},{pid:31,qty:30}], total:880, payStatus:'paid', orderStatus:'delivered', notes:'' },
    { id:7, orderNumber:'BLS-20260423-007', companyId:6, customerId:7, date:dayAgo(8), items:[{pid:50,qty:20},{pid:102,qty:3},{pid:103,qty:2}], total:340, payStatus:'pending', orderStatus:'pending', notes:'ממתין לאישור' },
    { id:8, orderNumber:'BLS-20260420-008', companyId:1, customerId:2, date:dayAgo(11), items:[{pid:60,qty:3},{pid:40,qty:6}], total:588, payStatus:'paid', orderStatus:'delivered', notes:'' },
  ];
}

function seedInvoices() {
  const today = new Date();
  const dayAgo = (n) => new Date(today.getTime() - n*86400000).toISOString().split('T')[0];
  const dayAhead = (n) => new Date(today.getTime() + n*86400000).toISOString().split('T')[0];
  return [
    { id:1, number:'INV-2026-0001', companyId:1, orderId:1, date:dayAgo(2), dueDate:dayAhead(28), amount:1090.44, paid:1090.44, notes:'' },
    { id:2, number:'INV-2026-0002', companyId:3, orderId:2, date:dayAgo(3), dueDate:dayAhead(0), amount:545.22, paid:0, notes:'' },
    { id:3, number:'INV-2026-0003', companyId:2, orderId:3, date:dayAgo(4), dueDate:dayAhead(56), amount:638.82, paid:638.82, notes:'' },
    { id:4, number:'INV-2026-0004', companyId:5, orderId:4, date:dayAgo(5), dueDate:dayAhead(25), amount:1254.24, paid:0, notes:'' },
    { id:5, number:'INV-2026-0005', companyId:4, orderId:5, date:dayAgo(7), dueDate:dayAhead(23), amount:627.12, paid:627.12, notes:'' },
    { id:6, number:'INV-2026-0006', companyId:1, orderId:6, date:dayAgo(7), dueDate:dayAhead(23), amount:1029.6, paid:0, notes:'' },
    { id:7, number:'INV-2026-0007', companyId:6, orderId:7, date:dayAgo(8), dueDate:dayAhead(52), amount:397.8, paid:0, notes:'' },
    { id:8, number:'INV-2026-0008', companyId:1, orderId:8, date:dayAgo(75), dueDate:dayAgo(45), amount:687.96, paid:0, notes:'באיחור!' },
    { id:9, number:'INV-2026-0009', companyId:2, orderId:null, date:dayAgo(95), dueDate:dayAgo(35), amount:432.0, paid:0, notes:'באיחור משמעותי' },
  ];
}

function seedCategories() {
  return [
    { id:'coffee',     name:'שתייה חמה',       icon:'☕',  desc:'קפה, תה, קפסולות',           vatExempt:false, hidden:false, order:1 },
    { id:'drinks',     name:'שתייה קרה',       icon:'💧',  desc:'מים, מיצים, משקאות',         vatExempt:false, hidden:false, order:2 },
    { id:'snacks',     name:'חטיפים מליחים',   icon:'🥨',  desc:'במבה, ביסלי, אגוזים',        vatExempt:false, hidden:false, order:3 },
    { id:'sweets',     name:'חטיפים מתוקים',   icon:'🍫',  desc:'שוקולדים, סוכריות',          vatExempt:false, hidden:false, order:4 },
    { id:'bakery',     name:'מאפים טריים',     icon:'🥐',  desc:'רוגלך, עוגיות, קרואסון',     vatExempt:false, hidden:false, order:5 },
    { id:'dairy',      name:'חלב וגבינות',     icon:'🥛',  desc:'יוגורט, גבינות, חלב',        vatExempt:false, hidden:false, order:6 },
    { id:'fruits',     name:'פירות וירקות',    icon:'🍎',  desc:'סלי פירות טריים',            vatExempt:true,  hidden:false, order:7 },
    { id:'meals',      name:'ארוחות וכריכים',  icon:'🥗',  desc:'סלטים, סנדוויצ\'ים',         vatExempt:false, hidden:false, order:8 },
    { id:'healthy',    name:'בריאות וטבעוני',  icon:'🌱',  desc:'טבעוני, ללא לקטוז',          vatExempt:false, hidden:false, order:9 },
    { id:'disposable', name:'כלים חד-פעמיים',  icon:'🥄',  desc:'צלחות, כוסות, מפיות',        vatExempt:false, hidden:false, order:10 },
    { id:'cleaning',   name:'ניקיון והיגיינה', icon:'🧼',  desc:'נייר, סבון, מגבונים',        vatExempt:false, hidden:false, order:11 }
  ];
}

function seedSupplierEntities() {
  return [
    { id:1, name:'אסם תעשיות',     contact:'יוסי כהן',    phone:'03-9302222', email:'orders@osem.co.il',     taxId:'520012345', address:'הסיגלית 5, שוהם',         payTerms:'net30', notes:'ספק חטיפים — משלוחים שבועיים' },
    { id:2, name:'תנובה',          contact:'מירי לוי',    phone:'08-9215000', email:'b2b@tnuva.co.il',       taxId:'520031115', address:'הרכבת 33, רחובות',        payTerms:'net30', notes:'מוצרי חלב — הזמנה מוקדמת ב-3 ימי עסקים' },
    { id:3, name:'נביעות',         contact:'דורון ברק',   phone:'04-6000600', email:'sales@neviot.co.il',    taxId:'520044456', address:'תעשייה צפון, מגדל העמק', payTerms:'net30', notes:'מים מינרליים — מארזים בלבד' },
    { id:4, name:'אנגל מאפיות',    contact:'רותי אנגל',   phone:'08-8503030', email:'orders@engel.co.il',    taxId:'520055123', address:'יקנעם עילית',             payTerms:'credit', notes:'מאפים טריים — הזמנה עד 16:00 לאספקה למחרת' },
    { id:5, name:'נספרסו ישראל',   contact:'שירות עסקי',  phone:'1-700-700-205', email:'business@nespresso.co.il', taxId:'520066789', address:'מרכז עזריאלי, ת"א',  payTerms:'net60', notes:'קפסולות — מינימום הזמנה 200 יח׳' },
    { id:6, name:'סנו תעשיות',     contact:'אבי שלום',    phone:'03-9320000', email:'b2b@sano.co.il',        taxId:'520077999', address:'הוד השרון',               payTerms:'net30', notes:'מוצרי ניקיון' },
    { id:7, name:'פלסטו',          contact:'',            phone:'09-7611111', email:'sales@plasto.co.il',    taxId:'520088444', address:'נתניה',                   payTerms:'credit', notes:'כלים חד-פעמיים' }
  ];
}

function seedSupplierInvoices() {
  const today = new Date();
  const dayAgo = (n) => new Date(today.getTime() - n*86400000).toISOString().split('T')[0];
  const dayAhead = (n) => new Date(today.getTime() + n*86400000).toISOString().split('T')[0];
  return [
    {
      id:1, number:'SUP-2026-0411', supplier:'אסם תעשיות', desc:'משלוח חודשי - חטיפים',
      date:dayAgo(15), dueDate:dayAhead(15), paid:0, status:'open', notes:'',
      lines:[
        // net=3.61, sell=6 → margin = (6-3.61)/6 = 39.83% ≈ 40%
        { barcode:'7290000123456', productName:'במבה אסם 80 גרם', qty:200, purchasePrice:3.80, discount:5, marginPercent:40, sellingPrice:6.00 },
        // net=3.04, sell=5 → margin = (5-3.04)/5 = 39.2% ≈ 39%
        { barcode:'7290000123457', productName:'ביסלי גריל אסם 70 גרם', qty:240, purchasePrice:3.20, discount:5, marginPercent:39, sellingPrice:5.00 },
        // net=5.10, sell=8 → margin = (8-5.10)/8 = 36.25% ≈ 36%
        { barcode:'7290000123458', productName:'במבה ממולאת שוקולד 80 גרם', qty:120, purchasePrice:5.10, discount:0, marginPercent:36, sellingPrice:8.00 }
      ],
      amount:0
    },
    {
      id:2, number:'SUP-2026-0408', supplier:'תנובה', desc:'מוצרי חלב שבועיים',
      date:dayAgo(7), dueDate:dayAhead(23), paid:0, status:'open', notes:'',
      lines:[
        // net=5.20, sell=8 → margin = (8-5.20)/8 = 35%
        { barcode:'7290000200001', productName:'חלב תנובה 3% 1 ליטר', qty:300, purchasePrice:5.20, discount:0, marginPercent:35, sellingPrice:8.00 },
        // net=5.225, sell=8 → margin = (8-5.225)/8 = 34.7% ≈ 35%
        { barcode:'7290000200002', productName:'גבינת קוטג\' תנובה 250 גרם', qty:80, purchasePrice:5.50, discount:5, marginPercent:35, sellingPrice:8.00 },
        // net=14.72, sell=24 → margin = (24-14.72)/24 = 38.7% ≈ 39%
        { barcode:'7290000200003', productName:'גבינה צהובה עמק 200 גרם', qty:50, purchasePrice:16.00, discount:8, marginPercent:39, sellingPrice:24.00 }
      ],
      amount:0
    },
    {
      id:3, number:'SUP-2026-0395', supplier:'נביעות', desc:'מים - מארזים גדולים',
      date:dayAgo(20), dueDate:dayAhead(10), paid:5430, status:'paid', notes:'שולם בהעברה בנקאית',
      lines:[
        // net=13.30, sell=22 → margin = (22-13.30)/22 = 39.5% ≈ 40%
        { barcode:'7290000300001', productName:'מים מינרליים 1.5 ליטר מארז 6', qty:200, purchasePrice:14.00, discount:5, marginPercent:40, sellingPrice:22.00 },
        // net=17.10, sell=28 → margin = (28-17.10)/28 = 38.9% ≈ 39%
        { barcode:'7290000300002', productName:'מים מינרליים 0.5 ליטר מארז 24', qty:80, purchasePrice:18.00, discount:5, marginPercent:39, sellingPrice:28.00 }
      ],
      amount:0
    },
    {
      id:4, number:'SUP-2026-0387', supplier:'אנגל מאפיות', desc:'מאפים טריים שבועיים',
      date:dayAgo(10), dueDate:dayAhead(20), paid:0, status:'open', notes:'',
      lines:[
        // net=24, sell=38 → margin = (38-24)/38 = 36.8% ≈ 37%
        { barcode:'7290000400001', productName:'רוגלך שוקולד 500 גרם', qty:60, purchasePrice:24.00, discount:0, marginPercent:37, sellingPrice:38.00 },
        // net=4.75, sell=8 → margin = (8-4.75)/8 = 40.6% ≈ 41%
        { barcode:'7290000400002', productName:'קרואסון חמאה יחיד', qty:200, purchasePrice:5.00, discount:5, marginPercent:41, sellingPrice:8.00 }
      ],
      amount:0
    },
    {
      id:5, number:'SUP-2026-0381', supplier:'נספרסו ישראל', desc:'קפסולות קפה - הזמנה גדולה',
      date:dayAgo(25), dueDate:dayAhead(5), paid:6240, status:'partial', notes:'תשלום ראשון מתוך שניים',
      lines:[
        // net=57.66, sell=84 → margin = (84-57.66)/84 = 31.4% ≈ 31%
        { barcode:'7290000500001', productName:'קפסולות נספרסו אסקפסו - 10 קפסולות', qty:200, purchasePrice:62.00, discount:7, marginPercent:31, sellingPrice:84.00 }
      ],
      amount:0
    },
    {
      id:6, number:'SUP-2026-0372', supplier:'סנו תעשיות', desc:'מוצרי ניקיון - מארז חודשי',
      date:dayAgo(35), dueDate:dayAgo(5), paid:0, status:'overdue', notes:'באיחור!',
      lines:[
        // net=11, sell=24 → margin = (24-11)/24 = 54.2% ≈ 54%
        { barcode:'7290000600001', productName:'סבון ידיים נוזלי 1 ליטר', qty:50, purchasePrice:11.00, discount:0, marginPercent:54, sellingPrice:24.00 },
        // net=14, sell=24 → margin = (24-14)/24 = 41.7% ≈ 42%
        { barcode:'7290000600002', productName:'אקונומיקה כלורית 4 ליטר', qty:30, purchasePrice:14.00, discount:0, marginPercent:42, sellingPrice:24.00 }
      ],
      amount:0
    },
    {
      id:7, number:'SUP-2026-0365', supplier:'פלסטו', desc:'כלים חד פעמיים',
      date:dayAgo(42), dueDate:dayAgo(12), paid:1230, status:'paid', notes:'',
      lines:[
        // net=11, sell=18 → margin = (18-11)/18 = 38.9% ≈ 39%
        { barcode:'7290000700001', productName:'כוסות פלסטיק 200 מ"ל מארז 100', qty:50, purchasePrice:11.00, discount:0, marginPercent:39, sellingPrice:18.00 }
      ],
      amount:0
    }
  ].map(inv => {
    // Auto-compute amount from lines (with VAT, respecting per-line vatExempt flag)
    let beforeVat = 0;
    let vatable = 0;
    inv.lines.forEach(l => {
      const net = l.purchasePrice * (1 - (l.discount || 0) / 100);
      const lineCost = net * l.qty;
      beforeVat += lineCost;
      if (!l.vatExempt) vatable += lineCost;
    });
    inv.amount = Math.round((beforeVat + vatable * 0.18) * 100) / 100;
    return inv;
  });
}

/* ---------- LEDGER SEED DATA (delivery notes, receipts, credits) ---------- */
function seedDeliveryNotes() {
  const today = new Date();
  const dayAgo = (n) => new Date(today.getTime() - n*86400000).toISOString().split('T')[0];
  return [
    {
      id:1, number:'DN-2026-0001', companyId:1, orderId:1, invoiceId:1,
      date:dayAgo(2), deliveredBy:'ניר כהן', notes:'נמסר לדנה כהן',
      items:[{pid:1,qty:5,price:84},{pid:20,qty:20,price:6},{pid:60,qty:2,price:120}], total:780
    },
    {
      id:2, number:'DN-2026-0002', companyId:3, orderId:2, invoiceId:2,
      date:dayAgo(3), deliveredBy:'איתי דוד', notes:'',
      items:[{pid:11,qty:8,price:28},{pid:21,qty:30,price:5},{pid:103,qty:4,price:18}], total:446
    },
    {
      id:3, number:'DN-2026-0003', companyId:2, orderId:3, invoiceId:3,
      date:dayAgo(4), deliveredBy:'ניר כהן', notes:'',
      items:[{pid:3,qty:3,price:78},{pid:50,qty:10,price:8},{pid:40,qty:4,price:38}], total:466
    },
    {
      id:4, number:'DN-2026-0004', companyId:5, orderId:4, invoiceId:4,
      date:dayAgo(5), deliveredBy:'איתי דוד', notes:'הגיע מאוחר עקב פקקים',
      items:[{pid:60,qty:5,price:120},{pid:23,qty:6,price:42},{pid:31,qty:20,price:11}], total:1072
    },
    {
      id:5, number:'DN-2026-0005', companyId:4, orderId:5, invoiceId:5,
      date:dayAgo(7), deliveredBy:'ניר כהן', notes:'',
      items:[{pid:1,qty:3,price:84},{pid:11,qty:5,price:28},{pid:90,qty:8,price:18}], total:536
    },
    {
      id:6, number:'DN-2026-0006', companyId:1, orderId:6, invoiceId:6,
      date:dayAgo(7), deliveredBy:'איתי דוד', notes:'',
      items:[{pid:20,qty:50,price:6},{pid:21,qty:50,price:5},{pid:31,qty:30,price:11}], total:880
    },
    {
      id:7, number:'DN-2026-0007', companyId:1, orderId:8, invoiceId:8,
      date:dayAgo(75), deliveredBy:'ניר כהן', notes:'',
      items:[{pid:60,qty:3,price:120},{pid:40,qty:6,price:38}], total:588
    }
  ];
}

function seedReceipts() {
  const today = new Date();
  const dayAgo = (n) => new Date(today.getTime() - n*86400000).toISOString().split('T')[0];
  return [
    { id:1, number:'RCP-2026-0001', companyId:1, invoiceId:1, date:dayAgo(1), amount:1090.44, method:'העברה בנקאית', notes:'' },
    { id:2, number:'RCP-2026-0002', companyId:2, invoiceId:3, date:dayAgo(3), amount:638.82, method:'אשראי', notes:'' },
    { id:3, number:'RCP-2026-0003', companyId:4, invoiceId:5, date:dayAgo(6), amount:627.12, method:'המחאה', notes:'המחאה דחויה ל-30 יום' },
    { id:4, number:'RCP-2026-0004', companyId:1, invoiceId:1, date:dayAgo(2), amount:0, method:'מזומן', notes:'מקדמה' }
  ];
}

function seedCredits() {
  const today = new Date();
  const dayAgo = (n) => new Date(today.getTime() - n*86400000).toISOString().split('T')[0];
  return [
    {
      id:1, number:'CRD-2026-0001', companyId:1, relatedInvoiceId:1,
      date:dayAgo(1), amount:48, reason:'מוצר פגום',
      items:[{pid:60,qty:1,price:120,refunded:48}], notes:'סל פירות עם ירק רקוב'
    },
    {
      id:2, number:'CRD-2026-0002', companyId:3, relatedInvoiceId:2,
      date:dayAgo(2), amount:30, reason:'אריזה פגומה',
      items:[{pid:21,qty:6,price:5,refunded:30}], notes:''
    }
  ];
}

function seedSettings() {
  return {
    companyName:'בלסי סטור בע״מ',
    taxId:'516127321',
    address:'שונצינו 1, תל אביב',
    addressNote:'אין קבלת קהל — שירות אונליין בלבד',
    phone:'',          // to be filled by admin in settings
    email:'balasistore5@gmail.com',
    vat:18,
    minOrder:200,
    minOrderSharon:650,
    freeShip:400,
    shipFee:35,
    /* "חשבונית ישראל" (Israel Invoice) — Israeli Tax Authority allocation
       requirement (effective Jan 2024). Every invoice above the threshold
       must carry a unique allocation number from the ITA's API.
       Effective thresholds (date-driven, not just yearly):
         2024-01-01 → ₪25,000
         2025-01-01 → ₪20,000
         2026-01-01 → ₪10,000   (until 2026-05-31)
         2026-06-01 →  ₪5,000   (and onward)
       Without this number, the buyer cannot deduct input VAT. We default
       to the current threshold and let the user override per-invoice. */
    allocation: {
      enabled: true,
      threshold: 10000,           // current threshold (May 2026), incl. VAT
      autoYearly: true            // auto-update threshold based on effective date
    },
    /* Customer tier system: tier-based pricing for offices of different sizes */
    tiers: [
      { id:'small',     label:'🥉 משרד קטן',       discount:0,  hint:'עד 15 עובדים · עד ₪500/חודש',  color:'#9a6f1d' },
      { id:'medium',    label:'🥈 משרד בינוני',     discount:5,  hint:'16-50 עובדים · ₪500-2,500/חודש', color:'#6c757d' },
      { id:'large',     label:'🥇 משרד גדול',       discount:10, hint:'51+ עובדים · ₪2,500+/חודש',   color:'#b8860b' },
      { id:'strategic', label:'💎 לקוח אסטרטגי',    discount:15, hint:'הסכם מותאם אישית · VIP',       color:'#1a5cad' }
    ],
    autoBilling: {
      enabled: true,           // master switch
      mode: 'confirm',         // 'confirm' = show prompt, 'auto' = run silently
      runDay: 1,               // day of month to trigger (1 = first of next month)
      lastRun: null,           // 'YYYY-MM' of the last billed month
      includeAllPayTerms: false // if true, also bill cash customers; default: only credit terms
    }
  };
}

/* ================================================================
   PROMOTIONS — admin UI
   ================================================================ */

/* Render the promotions table with search + status/type filters */
function renderPromotions() {
  const tbody = document.querySelector('#promotionsTable tbody');
  if (!tbody) return;
  const search       = (document.getElementById('promoSearch')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('promoStatusFilter')?.value || 'all';
  const typeFilter   = document.getElementById('promoTypeFilter')?.value   || 'all';
  const today        = new Date().toISOString().split('T')[0];

  let list = (DB.promotions || []).slice().sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (search) {
    list = list.filter(p =>
      (p.name || '').toLowerCase().includes(search) ||
      (p.couponCode || '').toLowerCase().includes(search)
    );
  }
  if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
  if (statusFilter !== 'all') {
    list = list.filter(p => {
      const isActive    = isPromotionActive(p);
      const isFuture    = p.startDate > today;
      const isExpired   = p.endDate < today;
      const isDisabled  = !p.active;
      if (statusFilter === 'active')    return isActive;
      if (statusFilter === 'scheduled') return p.active && isFuture;
      if (statusFilter === 'expired')   return isExpired;
      if (statusFilter === 'disabled')  return isDisabled;
      return true;
    });
  }

  // KPIs
  const all = DB.promotions || [];
  const activeCount    = all.filter(p => isPromotionActive(p)).length;
  const scheduledCount = all.filter(p => p.active && p.startDate > today).length;
  const couponCount    = all.filter(p => p.type === 'coupon' && isPromotionActive(p)).length;
  const monthUsage     = all.reduce((s,p) => s + (p.usageCount || 0), 0);
  document.getElementById('promoKpiActive').textContent    = activeCount;
  document.getElementById('promoKpiScheduled').textContent = scheduledCount;
  document.getElementById('promoKpiCoupons').textContent   = couponCount;
  document.getElementById('promoKpiUsage').textContent     = monthUsage;

  // Sidebar badge
  const badge = document.getElementById('sbPromoBadge');
  if (badge) {
    badge.textContent = activeCount;
    badge.style.display = activeCount > 0 ? 'inline-flex' : 'none';
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><h4>אין מבצעים להצגה</h4><p>לחצו "מבצע חדש" כדי ליצור את המבצע הראשון שלכם.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const typeLabel = ({
      product:'🎯 מוצר ספציפי',
      category:'📂 קטגוריה',
      coupon:'🎟️ קופון',
      order:'💰 סף הזמנה',
      bundle:'📦 חבילה'
    })[p.type] || p.type;

    let target = '—';
    if (p.type === 'product') {
      const prod = DB.products.find(x => x.id === p.target?.productId);
      target = prod ? `${prod.icon || '📦'} ${prod.name}` : '<span style="color:var(--danger)">מוצר לא נמצא</span>';
    } else if (p.type === 'category') {
      const cat = DB.categories?.find(x => x.id === p.target?.categoryId);
      target = cat ? `${cat.icon || ''} ${cat.name || p.target.categoryId}` : p.target?.categoryId;
    } else if (p.type === 'coupon') {
      target = `<span style="font-family:monospace;background:#f8f6f0;padding:3px 8px;border-radius:4px;border:1px solid #e0dccd;font-weight:700">${p.couponCode || '—'}</span>`;
    } else if (p.type === 'order') {
      target = `מינימום ₪${formatNum(p.minOrderAmount || 0)}`;
    } else if (p.type === 'bundle') {
      const ids = p.target?.productIds || [];
      target = `${ids.length} מוצרים מסומנים`;
    }

    const discount = p.type === 'bundle'
      ? `<b style="color:#1b7a3d">${p.bundleMinQty} ב-₪${formatNum(p.bundlePrice)}</b>`
      : (p.discountType === 'percent'
          ? `<b style="color:#1b7a3d">${p.discountValue}%</b>`
          : `<b style="color:#1b7a3d">₪${formatNum(p.discountValue)}</b>`);

    const period = `<span style="font-size:11.5px">${formatDate(p.startDate)}<br><span style="color:var(--muted)">עד ${formatDate(p.endDate)}</span></span>`;

    let statusPill;
    const isActive   = isPromotionActive(p);
    const isFuture   = p.active && p.startDate > today;
    const isExpired  = p.endDate < today;
    if (!p.active)        statusPill = '<span class="pill" style="background:#f4f4f4;color:#666">⏸ כבוי</span>';
    else if (isExpired)   statusPill = '<span class="pill" style="background:#fdebe0;color:#a14a2c">הסתיים</span>';
    else if (isFuture)    statusPill = '<span class="pill" style="background:#fff7e0;color:#7a5a15">⏳ עתידי</span>';
    else if (isActive)    statusPill = '<span class="pill pill-success">✓ פעיל</span>';
    else                  statusPill = '<span class="pill" style="background:#f4f4f4;color:#666">—</span>';

    const usage = p.type === 'coupon' && p.usageLimit
      ? `${p.usageCount || 0} / ${p.usageLimit}`
      : (p.usageCount || 0);

    return `<tr>
      <td class="strong-cell">${p.name}</td>
      <td>${typeLabel}</td>
      <td style="font-size:12.5px">${target}</td>
      <td>${discount}</td>
      <td>${period}</td>
      <td>${statusPill}</td>
      <td class="muted-cell" style="text-align:center">${usage}</td>
      <td>
        <button class="row-action" onclick="togglePromotion(${p.id})">${p.active ? 'כבה' : 'הפעל'}</button>
        <button class="row-action row-action-primary" onclick="openPromotionModal(${p.id})">ערוך</button>
        <button class="row-action row-action-danger" onclick="deletePromotion(${p.id})">×</button>
      </td>
    </tr>`;
  }).join('');
}

/* Open the create/edit promotion modal. id = null for new */
function openPromotionModal(id) {
  const p = id ? DB.promotions.find(x => x.id === id) : null;
  const isEdit = !!p;
  const today = new Date().toISOString().split('T')[0];
  const dayAhead = (n) => {
    const d = new Date(); d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  // Build dropdown options
  const productOpts = (DB.products || [])
    .map(prod => `<option value="${prod.id}" ${p?.target?.productId === prod.id ? 'selected' : ''}>${prod.icon || '📦'} ${prod.name} — ₪${prod.price}</option>`)
    .join('');
  const categoryOpts = (DB.categories || [])
    .map(cat => `<option value="${cat.id}" ${p?.target?.categoryId === cat.id ? 'selected' : ''}>${cat.icon || ''} ${cat.name}</option>`)
    .join('');

  // Reset bundle-selection state and seed it from the existing promo (if editing)
  window._bundleSelected = new Set(p?.target?.productIds || []);

  closeModal();
  setTimeout(() => {
    openModal(isEdit ? `עריכת מבצע ${p.name}` : 'מבצע חדש', `
      <form id="promoForm" onsubmit="savePromotion(event, ${id || 'null'})" style="padding:0">
        <div class="form-grid">
          <div class="field full">
            <label>שם המבצע <span class="req">*</span></label>
            <input type="text" name="name" value="${p?.name || ''}" placeholder="למשל: מבצע פתיחת שנה" required />
            <div style="font-size:11px;color:var(--muted);margin-top:3px">השם יופיע בכרטסת ובדוחות. הלקוחות לא רואים אותו.</div>
          </div>

          <div class="field full">
            <label>סוג המבצע <span class="req">*</span></label>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
              <label class="promo-type-card"><input type="radio" name="type" value="product" ${(p?.type || 'product') === 'product' ? 'checked' : ''} onchange="onPromoTypeChange()" /><span><b>🎯 מוצר ספציפי</b><small>הנחה על מוצר מסוים</small></span></label>
              <label class="promo-type-card"><input type="radio" name="type" value="category" ${p?.type === 'category' ? 'checked' : ''} onchange="onPromoTypeChange()" /><span><b>📂 קטגוריה</b><small>הנחה על קטגוריה שלמה</small></span></label>
              <label class="promo-type-card"><input type="radio" name="type" value="coupon" ${p?.type === 'coupon' ? 'checked' : ''} onchange="onPromoTypeChange()" /><span><b>🎟️ קופון</b><small>קוד שלקוח מקליד</small></span></label>
              <label class="promo-type-card"><input type="radio" name="type" value="order" ${p?.type === 'order' ? 'checked' : ''} onchange="onPromoTypeChange()" /><span><b>💰 סף הזמנה</b><small>הנחה על סכום מינימום</small></span></label>
              <label class="promo-type-card" style="grid-column:1/-1"><input type="radio" name="type" value="bundle" ${p?.type === 'bundle' ? 'checked' : ''} onchange="onPromoTypeChange()" /><span><b>📦 חבילת מוצרים (Buy-N)</b><small>למשל: 4 חטיפי נייטשר וואלי ב-₪80</small></span></label>
            </div>
          </div>

          <!-- Type-specific target fields (one of these is shown by onPromoTypeChange) -->
          <div class="field full" id="promoTargetProduct">
            <label>בחרו מוצר <span class="req">*</span></label>
            <select name="productId">${productOpts}</select>
          </div>
          <div class="field full" id="promoTargetCategory" style="display:none">
            <label>בחרו קטגוריה <span class="req">*</span></label>
            <select name="categoryId">${categoryOpts}</select>
          </div>
          <div class="field" id="promoTargetCoupon" style="display:none">
            <label>קוד הקופון <span class="req">*</span></label>
            <input type="text" name="couponCode" value="${p?.couponCode || ''}" placeholder="למשל: BAL20" style="font-family:monospace;text-transform:uppercase" />
            <div style="font-size:11px;color:var(--muted);margin-top:3px">הלקוח מקליד קוד זה בצ׳קאאוט. ללא רגישות לאותיות גדולות/קטנות.</div>
          </div>
          <div class="field" id="promoTargetOrder" style="display:none">
            <label>סכום מינימום (₪) <span class="req">*</span></label>
            <input type="number" name="minOrderAmount" value="${p?.minOrderAmount || 500}" min="0" step="10" />
            <div style="font-size:11px;color:var(--muted);margin-top:3px">ההנחה תוחל אוטומטית כשסכום הסל יגיע למינימום.</div>
          </div>

          <!-- BUNDLE configuration: pick eligible products + min qty + bundle price -->
          <div class="field full" id="promoTargetBundle" style="display:none">
            <label>מוצרים בחבילה <span class="req">*</span></label>
            <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">סמן את כל המוצרים המשתתפים במבצע. הלקוח יכול לערבב — למשל "כל 4 חטיפים מהרשימה ב-₪X".</div>
            <div style="display:flex;gap:6px;margin-bottom:8px">
              <input type="search" id="bundleProductSearch" placeholder="חיפוש מוצר לסימון..." oninput="filterBundleProducts(this.value)" style="flex:1" />
              <button type="button" class="btn btn-ghost" onclick="toggleAllBundleProducts(true)" style="padding:4px 12px;font-size:12px">בחר הכל</button>
              <button type="button" class="btn btn-ghost" onclick="toggleAllBundleProducts(false)" style="padding:4px 12px;font-size:12px">נקה</button>
            </div>
            <div id="bundleProductsList" style="max-height:240px;overflow-y:auto;border:1px solid var(--line);border-radius:6px;padding:8px;background:var(--paper)"></div>
            <div id="bundleSelectedCount" style="font-size:12px;color:var(--ink);font-weight:700;margin-top:6px;padding:6px 10px;background:#f0f9f3;border-radius:4px;display:none"></div>
          </div>
          <div class="field" id="promoBundleQty" style="display:none">
            <label>מינימום יחידות <span class="req">*</span></label>
            <input type="number" name="bundleMinQty" value="${p?.bundleMinQty || 4}" min="2" step="1" />
            <div style="font-size:11px;color:var(--muted);margin-top:3px">מספר יחידות בחבילה (למשל: 4)</div>
          </div>
          <div class="field" id="promoBundlePrice" style="display:none">
            <label>מחיר החבילה (₪) <span class="req">*</span></label>
            <input type="number" name="bundlePrice" value="${p?.bundlePrice || 80}" min="0" step="0.5" />
            <div style="font-size:11px;color:var(--muted);margin-top:3px">המחיר הכולל לכמות שצוינה (למשל: ₪80 לכל 4 יחידות)</div>
          </div>

          <!-- Coupon-only: usage limit -->
          <div class="field" id="promoUsageLimit" style="display:none">
            <label>מגבלת מימושים (אופציונלי)</label>
            <input type="number" name="usageLimit" value="${p?.usageLimit || ''}" min="0" placeholder="ללא הגבלה" />
            <div style="font-size:11px;color:var(--muted);margin-top:3px">השאר ריק לקופון ללא הגבלה. אחרי N מימושים הקופון יפסיק לעבוד.</div>
          </div>

          <div class="field">
            <label>סוג הנחה <span class="req">*</span></label>
            <select name="discountType">
              <option value="percent" ${(p?.discountType || 'percent') === 'percent' ? 'selected' : ''}>אחוזים (%)</option>
              <option value="amount" ${p?.discountType === 'amount' ? 'selected' : ''}>סכום קבוע (₪)</option>
            </select>
          </div>
          <div class="field">
            <label>גובה ההנחה <span class="req">*</span></label>
            <input type="number" name="discountValue" value="${p?.discountValue || 10}" min="0" step="0.5" required />
          </div>

          <div class="field">
            <label>תאריך התחלה <span class="req">*</span></label>
            <input type="date" name="startDate" value="${p?.startDate || today}" required />
          </div>
          <div class="field">
            <label>תאריך סיום <span class="req">*</span></label>
            <input type="date" name="endDate" value="${p?.endDate || dayAhead(30)}" required />
          </div>

          <div class="field full">
            <label class="check" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--line);background:var(--paper);cursor:pointer;border-radius:8px">
              <input type="checkbox" name="active" ${(p?.active !== false) ? 'checked' : ''} style="accent-color:var(--green)" />
              <div>
                <b>המבצע מופעל</b>
                <div style="font-size:12px;color:var(--muted)">השאירו מסומן להפעלת המבצע. ניתן לכבות זמנית בלי למחוק.</div>
              </div>
            </label>
          </div>
        </div>
      </form>
    `, [
      { label:'ביטול', class:'btn-ghost', action:closeModal },
      { label:isEdit ? 'שמור שינויים' : 'צור מבצע', class:'btn-primary', action:() => document.getElementById('promoForm').requestSubmit() }
    ]);
    document.getElementById('modalCard').style.maxWidth = '720px';
    onPromoTypeChange(); // hide/show the right target field
  }, 100);
}

/* Show only the target field that matches the currently-selected type */
function onPromoTypeChange() {
  const type = document.querySelector('input[name="type"]:checked')?.value;
  const fields = {
    product:  ['promoTargetProduct'],
    category: ['promoTargetCategory'],
    coupon:   ['promoTargetCoupon'],
    order:    ['promoTargetOrder'],
    bundle:   ['promoTargetBundle','promoBundleQty','promoBundlePrice']
  };
  // Hide all
  Object.values(fields).flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  // Show the relevant ones
  (fields[type] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });

  // Bundle uses its own pricing (bundlePrice replaces discountType/Value).
  // Hide the standard discount fields for bundles.
  const standardDiscountWrappers = document.querySelectorAll('select[name="discountType"], input[name="discountValue"]');
  standardDiscountWrappers.forEach(el => {
    const wrap = el.closest('.field');
    if (wrap) wrap.style.display = (type === 'bundle') ? 'none' : '';
  });

  // Show usage-limit only for coupons
  const usage = document.getElementById('promoUsageLimit');
  if (usage) usage.style.display = (type === 'coupon') ? '' : 'none';

  // For bundles, populate the products list
  if (type === 'bundle') populateBundleProductsList();
}

/* Render the multi-select product list inside the bundle config block.
   We respect the current promo's selection (when editing) and the search input. */
function populateBundleProductsList() {
  const wrap = document.getElementById('bundleProductsList');
  if (!wrap) return;
  // Try to read the current promo (if editing) for default selection
  const editingId = (() => {
    const m = document.querySelector('#promoForm [onsubmit*="savePromotion"]');
    if (!m) return null;
    const match = (m.getAttribute('onsubmit') || '').match(/savePromotion\(event,\s*([0-9]+)/);
    return match ? Number(match[1]) : null;
  })();
  const current = editingId ? DB.promotions.find(p => p.id === editingId) : null;
  const selected = new Set(current?.target?.productIds || []);
  // window-level state to track selection while modal is open
  window._bundleSelected = window._bundleSelected || new Set(selected);
  const products = (DB.products || []).slice().sort((a,b) => (a.cat || '').localeCompare(b.cat || '') || a.name.localeCompare(b.name));
  wrap.innerHTML = products.map(p => {
    const isSel = window._bundleSelected.has(p.id);
    const cat = (DB.categories || []).find(c => c.id === p.cat);
    return `<label class="bundle-prod-row" data-name="${p.name.toLowerCase()}" data-brand="${(p.brand || '').toLowerCase()}" data-cat="${(cat?.name || '').toLowerCase()}">
      <input type="checkbox" data-pid="${p.id}" ${isSel ? 'checked' : ''} onchange="toggleBundleProduct(${p.id}, this.checked)" />
      <span class="bp-icon">${p.icon || '📦'}</span>
      <span class="bp-info">
        <b>${p.name}</b>
        <span>${p.brand || '—'} · ${cat?.name || ''} · ₪${p.price}</span>
      </span>
    </label>`;
  }).join('');
  updateBundleSelectedCount();
}

function toggleBundleProduct(pid, checked) {
  if (!window._bundleSelected) window._bundleSelected = new Set();
  if (checked) window._bundleSelected.add(pid);
  else window._bundleSelected.delete(pid);
  updateBundleSelectedCount();
}

function toggleAllBundleProducts(check) {
  const visible = document.querySelectorAll('#bundleProductsList .bundle-prod-row:not(.hidden) input[type="checkbox"]');
  visible.forEach(cb => {
    cb.checked = !!check;
    const pid = Number(cb.dataset.pid);
    if (check) window._bundleSelected.add(pid);
    else       window._bundleSelected.delete(pid);
  });
  updateBundleSelectedCount();
}

function filterBundleProducts(q) {
  const term = (q || '').trim().toLowerCase();
  document.querySelectorAll('#bundleProductsList .bundle-prod-row').forEach(row => {
    if (!term) { row.classList.remove('hidden'); return; }
    const hay = row.dataset.name + ' ' + row.dataset.brand + ' ' + row.dataset.cat;
    row.classList.toggle('hidden', !hay.includes(term));
  });
}

function updateBundleSelectedCount() {
  const count = (window._bundleSelected || new Set()).size;
  const el = document.getElementById('bundleSelectedCount');
  if (!el) return;
  if (count > 0) {
    el.style.display = '';
    el.innerHTML = `✓ <b>${count}</b> מוצרים סומנו במבצע`;
  } else {
    el.style.display = '';
    el.innerHTML = '<span style="color:#a14a2c">⚠️ יש לסמן לפחות 2 מוצרים</span>';
    el.style.background = '#fdebe0';
  }
}

function savePromotion(e, id) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (data.endDate < data.startDate) {
    showToast('תאריך הסיום חייב להיות אחרי תאריך ההתחלה', 'error');
    return;
  }

  // Build the target object based on type
  const target = {};
  if (data.type === 'product')  target.productId  = Number(data.productId);
  if (data.type === 'category') target.categoryId = data.categoryId;
  if (data.type === 'bundle')   target.productIds = Array.from(window._bundleSelected || new Set());

  const promo = {
    id: id || (Math.max(0, ...(DB.promotions || []).map(p => p.id || 0)) + 1),
    name: data.name.trim(),
    type: data.type,
    target,
    discountType:  data.type === 'bundle' ? null : data.discountType,
    discountValue: data.type === 'bundle' ? null : Number(data.discountValue),
    startDate: data.startDate,
    endDate:   data.endDate,
    active:    data.active === 'on',
    couponCode:     data.type === 'coupon' ? data.couponCode.trim().toUpperCase() : null,
    minOrderAmount: data.type === 'order'  ? Number(data.minOrderAmount) : null,
    bundleMinQty:   data.type === 'bundle' ? Number(data.bundleMinQty) : null,
    bundlePrice:    data.type === 'bundle' ? Number(data.bundlePrice)  : null,
    usageLimit:     (data.type === 'coupon' && data.usageLimit) ? Number(data.usageLimit) : null,
    usageCount:     id ? (DB.promotions.find(p => p.id === id)?.usageCount || 0) : 0,
    createdAt:      id ? (DB.promotions.find(p => p.id === id)?.createdAt) : new Date().toISOString().split('T')[0]
  };

  // Validate coupon codes are unique
  if (promo.type === 'coupon') {
    if (!promo.couponCode) { showToast('יש להזין קוד קופון', 'error'); return; }
    const dup = (DB.promotions || []).find(p => p.id !== promo.id && p.type === 'coupon' && p.couponCode === promo.couponCode);
    if (dup) { showToast(`קוד הקופון "${promo.couponCode}" כבר קיים`, 'error'); return; }
  }

  // Validate bundle has products + reasonable settings
  if (promo.type === 'bundle') {
    if (!promo.target.productIds || promo.target.productIds.length < 2) {
      showToast('יש לסמן לפחות 2 מוצרים בחבילה', 'error');
      return;
    }
    if (!promo.bundleMinQty || promo.bundleMinQty < 2) {
      showToast('מינימום היחידות לחבילה חייב להיות 2 ומעלה', 'error');
      return;
    }
    if (!promo.bundlePrice || promo.bundlePrice < 0) {
      showToast('מחיר חבילה לא תקין', 'error');
      return;
    }
  }

  if (!DB.promotions) DB.promotions = [];
  if (id) {
    const idx = DB.promotions.findIndex(p => p.id === id);
    DB.promotions[idx] = promo;
    showToast(`✓ מבצע "${promo.name}" עודכן`);
  } else {
    DB.promotions.push(promo);
    showToast(`✓ מבצע "${promo.name}" נוצר`);
  }
  DB.save('promotions');
  closeModal();
  renderPromotions();
  // Sync to public-site localStorage so the catalog reflects new promo immediately
  syncPromotionsToPublicSite();
}

function togglePromotion(id) {
  const p = DB.promotions.find(x => x.id === id);
  if (!p) return;
  p.active = !p.active;
  DB.save('promotions');
  renderPromotions();
  syncPromotionsToPublicSite();
  showToast(p.active ? `✓ "${p.name}" הופעל` : `⏸ "${p.name}" כובה`);
}

function deletePromotion(id) {
  const p = DB.promotions.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`למחוק את המבצע "${p.name}" לצמיתות?`)) return;
  DB.promotions = DB.promotions.filter(x => x.id !== id);
  DB.save('promotions');
  renderPromotions();
  syncPromotionsToPublicSite();
  showToast('המבצע נמחק');
}

/* The public site reads its promotions from a different localStorage key.
   Whenever admin adds/edits/deletes a promotion, mirror the data to the
   public-site key so the catalog updates without a page reload. */
function syncPromotionsToPublicSite() {
  try {
    localStorage.setItem('balasi_promotions', JSON.stringify(DB.promotions || []));
  } catch (e) { console.warn('[promotions] sync failed', e); }
}

/* ================================================================
   MONTHLY DEALS — admin view
   ----------------------------------------------------------------
   The "מבצעי החודש" panel is a focused, simpler interface over the
   same DB.promotions table. Deals listed here are flagged with
   monthlyDeal:true so the public-site renderMonthlyDeals() function
   prefers them over auto-picked promos. The panel allows up to 6
   monthly deals (cap matches the rail size on the public site).
   ================================================================ */
const MONTHLY_DEALS_MAX = 6;

/* Format a Date as YYYY-MM-DD from LOCAL date parts (not UTC).
   toISOString() converts to UTC; in Israel (UTC+2/+3), the local
   midnight of the 31st becomes the UTC 30th, causing an off-by-one
   end-of-month bug. Used for both today and end-of-month here. */
function _formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function _adminEndOfMonth() {
  const d = new Date();
  return _formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function _adminToday() {
  return _formatLocalDate(new Date());
}

function getMonthlyDealPromos() {
  return (DB.promotions || []).filter(p => p.monthlyDeal === true);
}

function renderMonthlyDealsAdmin() {
  const list = document.getElementById('monthlyDealsList');
  const countEl = document.getElementById('mdCount');
  const badgeEl = document.getElementById('sbMonthlyDealsBadge');
  if (!list) return;
  const deals = getMonthlyDealPromos()
    .sort((a, b) => (a.monthlyDealOrder || 0) - (b.monthlyDealOrder || 0));
  if (countEl) countEl.textContent = deals.length;
  if (badgeEl) {
    badgeEl.textContent = deals.length;
    badgeEl.style.display = deals.length ? '' : 'none';
  }
  if (!deals.length) {
    list.innerHTML = `
      <div style="grid-column:1/-1;background:#fff;border:1px dashed #d8d3c3;border-radius:10px;padding:32px;text-align:center;color:#6b665e">
        אין כרגע מבצעי חודש מוגדרים.<br>
        <small>הלחיצה על "+ מבצע חודש חדש" תוסיף מבצע — או שהאתר יבחר אוטומטית 6 מוצרים פופולריים עם הנחה הכי גדולה.</small>
      </div>`;
    return;
  }
  list.innerHTML = deals.map(p => {
    const prod = (DB.products || []).find(x => x.id === p.target?.productId);
    const prodName = prod ? prod.name : '(מוצר לא נמצא)';
    const prodIcon = prod ? (prod.icon || '📦') : '⚠️';
    const oldPrice = prod ? prod.price : 0;
    const discType = p.discountType === 'percent' ? '%' : '₪';
    const discVal = p.discountValue;
    const newPrice = prod
      ? (p.discountType === 'percent'
          ? Math.round(oldPrice * (1 - discVal / 100) * 100) / 100
          : Math.max(0, oldPrice - discVal))
      : 0;
    const today = _adminToday();
    const isExpired = p.endDate && p.endDate < today;
    const statusLabel = !p.active
      ? '<span style="color:#9a948a">כבוי</span>'
      : isExpired
        ? '<span style="color:#b91c1c">פג תוקף</span>'
        : '<span style="color:#1b7a3d">פעיל</span>';
    return `
      <div class="md-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:8px;${!p.active || isExpired ? 'opacity:.65' : ''}">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:42px;height:42px;border-radius:50%;background:#fdebe0;display:grid;place-items:center;font-size:22px">${prodIcon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${prodName}</div>
            <div style="font-size:12px;color:#6b665e">${statusLabel} · עד ${p.endDate ? p.endDate.split('-').reverse().slice(0,2).join('.') : '—'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:baseline;gap:8px;padding:6px 0;border-top:1px solid #f3eee2;border-bottom:1px solid #f3eee2">
          ${prod ? `<span style="font-size:12px;color:#9a948a;text-decoration:line-through">₪${oldPrice}</span>` : ''}
          <b style="font-size:18px">${prod ? `₪${newPrice}` : '—'}</b>
          <span style="font-size:11px;font-weight:700;color:#fff;background:#e8804a;padding:2px 7px;margin-inline-start:auto">-${discVal}${discType}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" style="flex:1" onclick="openMonthlyDealModal(${p.id})">ערוך</button>
          <button class="btn btn-ghost btn-sm" style="flex:1" onclick="toggleMonthlyDealActive(${p.id})">${p.active ? 'כבה' : 'הפעל'}</button>
          <button class="btn btn-ghost btn-sm" style="color:#b91c1c" onclick="deleteMonthlyDeal(${p.id})" title="מחיקה">×</button>
        </div>
      </div>`;
  }).join('');
}

function openMonthlyDealModal(id) {
  const existing = id ? (DB.promotions || []).find(x => x.id === id) : null;
  const isEdit = !!existing;
  if (!isEdit && getMonthlyDealPromos().length >= MONTHLY_DEALS_MAX) {
    alert(`ניתן להגדיר עד ${MONTHLY_DEALS_MAX} מבצעי חודש. כדי להוסיף מבצע חדש — מחקו או כבו אחד מהקיימים.`);
    return;
  }

  const productOpts = (DB.products || [])
    .map(prod => `<option value="${prod.id}" ${existing?.target?.productId === prod.id ? 'selected' : ''}>${prod.icon || '📦'} ${prod.name} — ₪${prod.price}</option>`)
    .join('');

  const eom = _adminEndOfMonth();
  const today = _adminToday();
  const endVal = existing?.endDate || eom;
  const discType = existing?.discountType || 'percent';
  const discVal = existing?.discountValue ?? 15;
  const activeChecked = (existing ? existing.active : true) ? 'checked' : '';

  openModal(isEdit ? 'עריכת מבצע החודש' : 'מבצע חודש חדש', `
    <form id="mdForm" onsubmit="saveMonthlyDeal(event, ${id || 'null'})" style="padding:0">
      <div class="form-grid">
        <div class="field full">
          <label>בחרו מוצר <span class="req">*</span></label>
          <select name="productId" required>${productOpts}</select>
        </div>
        <div class="field">
          <label>סוג הנחה</label>
          <select name="discountType">
            <option value="percent" ${discType === 'percent' ? 'selected' : ''}>אחוזים (%)</option>
            <option value="amount" ${discType === 'amount' ? 'selected' : ''}>סכום (₪)</option>
          </select>
        </div>
        <div class="field">
          <label>ערך ההנחה <span class="req">*</span></label>
          <input type="number" name="discountValue" value="${discVal}" min="1" max="100" step="1" required />
        </div>
        <div class="field">
          <label>תאריך סיום</label>
          <input type="date" name="endDate" value="${endVal}" min="${today}" required />
        </div>
        <div class="field">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:24px">
            <input type="checkbox" name="active" ${activeChecked} />
            <span>פעיל</span>
          </label>
        </div>
      </div>
      <div class="m-foot" style="margin-top:16px">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">ביטול</button>
        <button type="submit" class="btn btn-primary">שמירה</button>
      </div>
    </form>
  `);
}

function saveMonthlyDeal(e, id) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const productId = Number(data.productId);
  const prod = (DB.products || []).find(x => x.id === productId);
  if (!prod) { alert('המוצר לא נמצא'); return; }

  const existing = id ? (DB.promotions || []).find(x => x.id === id) : null;
  const isEdit = !!existing;

  if (!isEdit) {
    // Block adding a second monthly-deal for the same product
    const dup = getMonthlyDealPromos().find(p => p.target?.productId === productId);
    if (dup) { alert('כבר קיים מבצע חודש על המוצר הזה — ערוך אותו במקום ליצור חדש.'); return; }
  }

  const today = _adminToday();
  const promo = isEdit ? existing : {
    id: ((DB.promotions || []).reduce((m, p) => Math.max(m, p.id || 0), 0)) + 1,
    type: 'product',
    target: { productId },
    usageCount: 0,
    createdAt: today,
    startDate: today,
    monthlyDeal: true,
    monthlyDealOrder: getMonthlyDealPromos().length
  };
  promo.name = `מבצע החודש — ${prod.name}`;
  promo.target = { productId };
  promo.type = 'product';
  promo.discountType = data.discountType;
  promo.discountValue = Number(data.discountValue);
  promo.endDate = data.endDate;
  promo.active = data.active === 'on';
  promo.monthlyDeal = true;
  if (typeof promo.monthlyDealOrder !== 'number') {
    promo.monthlyDealOrder = getMonthlyDealPromos().length;
  }

  if (!isEdit) {
    if (!Array.isArray(DB.promotions)) DB.promotions = [];
    DB.promotions.push(promo);
  }
  DB.save('promotions');
  syncPromotionsToPublicSite();
  closeModal();
  renderMonthlyDealsAdmin();
  if (typeof renderPromotions === 'function') renderPromotions();
  showToast(isEdit ? '✓ המבצע עודכן' : '✓ המבצע נוסף');
}

function deleteMonthlyDeal(id) {
  const p = (DB.promotions || []).find(x => x.id === id);
  if (!p) return;
  if (!confirm(`למחוק את "${p.name}"?`)) return;
  DB.promotions = (DB.promotions || []).filter(x => x.id !== id);
  DB.save('promotions');
  syncPromotionsToPublicSite();
  renderMonthlyDealsAdmin();
  if (typeof renderPromotions === 'function') renderPromotions();
  showToast('המבצע נמחק');
}

function toggleMonthlyDealActive(id) {
  const p = (DB.promotions || []).find(x => x.id === id);
  if (!p) return;
  p.active = !p.active;
  DB.save('promotions');
  syncPromotionsToPublicSite();
  renderMonthlyDealsAdmin();
  if (typeof renderPromotions === 'function') renderPromotions();
}

/* ================================================================
   PROMOTIONS — model + lookup logic
   ================================================================
   Each promotion is one of four types:
     • product  — a discount applied to a specific product
     • category — a discount applied to all products in a category
     • coupon   — a coupon code the customer types at checkout (whole order)
     • order    — automatic discount once cart subtotal hits a threshold

   discountType is either 'percent' (0-100) or 'amount' (₪).
   startDate / endDate define the active window (YYYY-MM-DD).
   active is a manual on/off override regardless of dates.
   usageLimit / usageCount track coupon redemptions.
   ================================================================ */
function seedPromotions() {
  const today = new Date();
  // Use local-date formatting (NOT toISOString) — toISOString shifts to
  // UTC and in Israel turns local midnight of the 31st into UTC 30th,
  // causing off-by-one bugs especially for end-of-month.
  const dayAhead = (n) => _formatLocalDate(new Date(today.getTime() + n*86400000));
  const dayAgo   = (n) => _formatLocalDate(new Date(today.getTime() - n*86400000));
  const endOfMonth = _formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const todayStr   = _formatLocalDate(today);
  // Monthly-deal seeds — these appear in the "מבצעי החודש" rail on the
  // public site and are managed via the dedicated admin panel. Keep them
  // here (rather than only in app.js) so admin DB.load -> sync doesn't
  // wipe them out on first admin launch.
  const monthlyDeals = [
    { productId: 1,  pct: 15, productName: 'קפסולות נספרסו' },
    { productId: 11, pct: 20, productName: 'מים נביעות 0.5L' },
    { productId: 20, pct: 10, productName: 'במבה אסם' },
    { productId: 22, pct: 15, productName: 'דוריטוס גבינה' },
    { productId: 12, pct: 18, productName: 'קוקה קולה זירו' },
    { productId: 21, pct: 12, productName: 'ביסלי גריל' },
  ].map((d, idx) => ({
    id: 100 + idx,
    name: `מבצע החודש — ${d.productName}`,
    type: 'product', target: { productId: d.productId },
    discountType: 'percent', discountValue: d.pct,
    startDate: todayStr, endDate: endOfMonth,
    active: true, usageCount: 0, createdAt: todayStr,
    monthlyDeal: true, monthlyDealOrder: idx
  }));
  return [
    ...monthlyDeals,
    {
      id: 1, name: 'הנחת 10% על קפה נמס',
      type: 'product', target: { productId: 1 },
      discountType: 'percent', discountValue: 10,
      startDate: dayAgo(7), endDate: dayAhead(14),
      active: true, usageCount: 0, createdAt: dayAgo(7)
    },
    {
      id: 2, name: 'מבצע עונה — חטיפים מתוקים 15%',
      type: 'category', target: { categoryId: 'sweets' },
      discountType: 'percent', discountValue: 15,
      startDate: dayAgo(3), endDate: dayAhead(28),
      active: true, usageCount: 0, createdAt: dayAgo(3)
    },
    {
      id: 3, name: 'קופון פתיחה — 7% הנחה',
      type: 'coupon', couponCode: 'BAL7',
      discountType: 'percent', discountValue: 7,
      startDate: dayAgo(30), endDate: dayAhead(60),
      active: true, usageCount: 0, usageLimit: 100, createdAt: dayAgo(30)
    },
    // NOTE: The "5% מעל ₪800" order-threshold promo was retired on
    // 2026-05-18 when the "first order 5%" discount was introduced —
    // stacking the two would have given new customers 10%, which is
    // not the intended business rule. Kept inactive (not deleted) so
    // the admin can re-enable from the promotions panel if needed.
    {
      id: 4, name: 'הזמנה גדולה — 5% מעל ₪800',
      type: 'order', minOrderAmount: 800,
      discountType: 'percent', discountValue: 5,
      startDate: dayAgo(14), endDate: dayAhead(45),
      active: false, usageCount: 0, createdAt: dayAgo(14)
    },
    {
      id: 5, name: '4 חטיפים מתוקים ב-₪25',
      type: 'bundle',
      target: { productIds: [21, 22, 23] },  // chocolate / candy / cookie product IDs (auto-fall back if products don't exist)
      bundleMinQty: 4, bundlePrice: 25,
      discountType: null, discountValue: null,
      startDate: dayAgo(7), endDate: dayAhead(21),
      active: false,  // disabled by default until admin reviews product selection
      usageCount: 0, createdAt: dayAgo(7)
    }
  ];
}

/* True if today's date falls inside the promotion's start/end window
   AND its `active` flag is on. Optionally accepts a custom date for testing. */
function isPromotionActive(promo, asOf) {
  if (!promo || !promo.active) return false;
  const today = (asOf || new Date().toISOString().split('T')[0]);
  if (promo.startDate && today < promo.startDate) return false;
  if (promo.endDate && today > promo.endDate) return false;
  // Coupon usage limit
  if (promo.type === 'coupon' && promo.usageLimit
      && (promo.usageCount || 0) >= promo.usageLimit) return false;
  return true;
}

/* Return all promotions currently active (excluding coupons,
   since those only kick in when the customer types the code). */
function getActiveAutoPromotions() {
  return (DB.promotions || [])
    .filter(p => p.type !== 'coupon')
    .filter(p => isPromotionActive(p));
}

/* Look up the strongest matching auto-promotion for a single product.
   Returns the discount object: { promo, originalPrice, discount, finalPrice }
   or null if no promotion applies. */
function getProductPromotion(product) {
  if (!product) return null;
  const candidates = getActiveAutoPromotions().filter(p => {
    if (p.type === 'product')  return p.target?.productId === product.id;
    if (p.type === 'category') return p.target?.categoryId === product.cat;
    return false;
  });
  if (!candidates.length) return null;

  // If multiple promotions match, pick the one giving the largest discount
  let best = null, bestDiscount = 0;
  candidates.forEach(p => {
    const d = computeDiscountAmount(product.price, p);
    if (d > bestDiscount) { best = p; bestDiscount = d; }
  });
  if (!best) return null;
  return {
    promo: best,
    originalPrice: product.price,
    discount: bestDiscount,
    finalPrice: Math.round((product.price - bestDiscount) * 100) / 100
  };
}

/* Compute how much (in ₪) a single promotion discounts a given price */
function computeDiscountAmount(price, promo) {
  if (!promo || !price) return 0;
  if (promo.discountType === 'percent') {
    return Math.round(price * (Number(promo.discountValue) / 100) * 100) / 100;
  }
  if (promo.discountType === 'amount') {
    return Math.min(price, Number(promo.discountValue));
  }
  return 0;
}

/* Validate a coupon code — returns the active coupon promotion or null */
function validateCoupon(code) {
  if (!code) return null;
  const norm = String(code).trim().toUpperCase();
  return (DB.promotions || []).find(p =>
    p.type === 'coupon' &&
    isPromotionActive(p) &&
    String(p.couponCode || '').toUpperCase() === norm
  ) || null;
}

/* Find the order-level promotion (if any) that applies to a given subtotal */
function getOrderPromotion(subtotal) {
  return (DB.promotions || [])
    .filter(p => p.type === 'order')
    .filter(p => isPromotionActive(p))
    .filter(p => subtotal >= (p.minOrderAmount || 0))
    .sort((a, b) => computeDiscountAmount(subtotal, b) - computeDiscountAmount(subtotal, a))[0]
    || null;
}

/* Increment usage counter on a coupon. Called when an order using
   the coupon is finalized in the admin. */
function incrementCouponUsage(couponCode) {
  if (!couponCode) return;
  const promo = validateCoupon(couponCode);
  if (!promo) return;
  promo.usageCount = (promo.usageCount || 0) + 1;
  DB.save('promotions');
}

/* ---------- AUTH ---------- */
function adminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('authPass').value;
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem('admin_auth', '1');
    showAdmin();
  } else {
    showToast('סיסמה שגויה', 'error');
  }
}

function adminLogout() {
  sessionStorage.removeItem('admin_auth');
  document.getElementById('authBg').style.display = 'flex';
  document.getElementById('adminApp').hidden = true;
}

function showAdmin() {
  document.getElementById('authBg').style.display = 'none';
  document.getElementById('adminApp').hidden = false;
  initAdmin();
}

/* ---------- INIT ---------- */
function initAdmin() {
  DB.load();
  // One-time backfill: any web order that lacks accountId — derive it from the
  // customerNumber that was saved on the original site payload.
  backfillOrderAccountIds();
  // Sync any orders submitted from the public site while admin was closed
  syncSiteOrders({ silent:false });
  renderDashboard();
  renderOrders();
  renderCompanies();
  renderCustomers();
  renderProducts();
  renderInvoices();
  renderDeliveryNotes();
  renderSupplierInvoices();
  renderDebts();
  if (typeof renderCategoriesAdmin === 'function') renderCategoriesAdmin();
  if (typeof renderSuppliersList === 'function') renderSuppliersList();
  syncHiddenProductsToPublic();
  syncProductImagesToPublic();
  syncCategoriesToPublic();
  attachAdminEvents();
  initOrderBroadcastListener();
  // Check whether monthly auto-billing should run today
  setTimeout(checkAutoBilling, 1500);
}

/* Backfill: orders imported before the accountId-from-customerNumber fix
   may point at the company's primary account by default. This re-derives
   the correct accountId from the original customerNumber the customer typed.
   Also FIXES orders where accountId was set incorrectly (e.g., defaulted to
   primary). It uses the original requested customerNumber as the source of truth. */
function backfillOrderAccountIds() {
  let fixed = 0;
  DB.orders.forEach(o => {
    if (o.source !== 'web' || !o.siteData?.customer) return;
    const c = o.siteData.customer;
    const requestedCN = c.customerNumber;
    const requestedAccId = c.accountId;
    const requestedLabel = c.accountLabel;

    // Always remember what the customer originally requested
    if (!o.requestedCustomerNumber && requestedCN) o.requestedCustomerNumber = requestedCN;
    if (!o.requestedAccountLabel && requestedLabel) o.requestedAccountLabel = requestedLabel;

    const company = DB.companies.find(c2 => c2.id === o.companyId);
    if (!company) return;
    const accs = company.accounts || [];

    // Priority: accountId → accountLabel → customerNumber
    let acc = null;
    if (requestedAccId) acc = accs.find(a => a.id === requestedAccId);
    if (!acc && requestedLabel) acc = accs.find(a => a.label === requestedLabel);
    if (!acc && requestedCN) {
      acc = accs.find(a => a.customerNumber === requestedCN)
         || accs.find(a => (a.customerNumber || '').toLowerCase() === String(requestedCN).toLowerCase())
         || accs.find(a => (a.customerNumber || '').replace(/\s+/g,'') === String(requestedCN).replace(/\s+/g,''));
    }
    if (acc && o.accountId !== acc.id) {
      o.accountId = acc.id;
      fixed++;
    }
  });
  // Also propagate to delivery notes & invoices that derived from those orders
  if (fixed > 0) {
    (DB.deliveryNotes || []).forEach(d => {
      const order = DB.orders.find(o => o.id === d.orderId);
      if (order?.accountId && d.accountId !== order.accountId) {
        d.accountId = order.accountId;
      }
    });
    (DB.invoices || []).forEach(inv => {
      const order = DB.orders.find(o => o.id === inv.orderId);
      if (order?.accountId && inv.accountId !== order.accountId) {
        inv.accountId = order.accountId;
      }
    });
    DB.save();
    console.log(`[backfill] Fixed accountId for ${fixed} order(s) based on customer's choice`);
  }
}

/* Manual fix-up: re-derive an order's accountId from siteData. Exposed for the UI. */
function resetOrderAccountFromCustomerChoice(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return false;
  const c = o.siteData?.customer || {};
  const requestedAccId = c.accountId;
  const requestedLabel = c.accountLabel || o.requestedAccountLabel;
  const requestedCN = c.customerNumber || o.requestedCustomerNumber;

  const company = DB.companies.find(c2 => c2.id === o.companyId);
  if (!company) return false;
  const accs = company.accounts || [];

  let acc = null;
  if (requestedAccId) acc = accs.find(a => a.id === requestedAccId);
  if (!acc && requestedLabel) acc = accs.find(a => a.label === requestedLabel);
  if (!acc && requestedCN) acc = accs.find(a => a.customerNumber === requestedCN);

  if (!acc) {
    showToast(`לא נמצא חשבון תואם אצל ${company.name}`, 'error');
    return false;
  }
  o.accountId = acc.id;
  if (requestedCN) o.requestedCustomerNumber = requestedCN;
  if (requestedLabel) o.requestedAccountLabel = requestedLabel;
  // Propagate to linked DN/invoice
  (DB.deliveryNotes || []).filter(d => d.orderId === o.id).forEach(d => d.accountId = acc.id);
  (DB.invoices || []).filter(i => i.orderId === o.id).forEach(i => i.accountId = acc.id);
  DB.save();
  showToast(`✓ החשבון עודכן ל-${acc.label} (${acc.customerNumber})`);
  return true;
}

/* ================================================================
   PUBLIC-SITE → ADMIN ORDER SYNC
   ================================================================ */
function syncSiteOrders({ silent } = {}) {
  let queue = [];
  try { queue = JSON.parse(localStorage.getItem('balasi_pending_orders') || '[]'); } catch (e) {}
  if (!queue.length) {
    if (!silent) showToast('אין הזמנות חדשות מהאתר');
    return 0;
  }

  // Track existing orderNumbers to avoid duplicates
  const existingNumbers = new Set(DB.orders.map(o => o.orderNumber));
  let imported = 0;
  let pendingCompanies = 0;

  queue.forEach(sp => {
    if (existingNumbers.has(sp.orderNumber)) return; // already imported

    // Try to match company by tax ID first, then by customer number, then by name
    let company = null;
    if (sp.customer.taxId) {
      company = DB.companies.find(c => c.taxId === sp.customer.taxId);
    }
    if (!company && sp.customer.customerNumber) {
      company = DB.companies.find(c => (c.accounts || []).some(a => a.customerNumber === sp.customer.customerNumber));
    }
    if (!company && sp.customer.companyName) {
      company = DB.companies.find(c => c.name === sp.customer.companyName);
    }

    let companyIsPending = false;
    if (!company) {
      companyIsPending = true;
      pendingCompanies++;
      const newId = Math.max(0, ...DB.companies.map(c => c.id)) + 1;
      const payTerms = ({ net30:'net30', net60:'net60' })[sp.payment.method] || 'credit';
      company = {
        id: newId,
        name: sp.customer.companyName || 'חברה לא מזוהה',
        taxId: sp.customer.taxId || '',
        address: sp.delivery.street || '',
        city: sp.delivery.city || '',
        zip: sp.delivery.zip || '',
        phone: sp.customer.phone || '',
        email: sp.customer.email || '',
        notes: '⚠️ נוצר אוטומטית מהזמנה באתר — דרושה השלמה ידנית',
        addedAt: new Date().toISOString().split('T')[0],
        pending: true,
        branches: [{
          id:'b1',
          label: 'משרד יחיד',
          address: (sp.delivery.street || '') + (sp.delivery.city ? ', ' + sp.delivery.city : ''),
          phone: sp.customer.phone || '',
          isPrimary: true
        }],
        accounts: [{
          id: 'a1',
          customerNumber: sp.customer.customerNumber || ('C-NEW-' + newId),
          label: 'חשבון ראשי',
          payTerms,
          creditLimit: 0,
          isPrimary: true
        }]
      };
      DB.companies.push(company);
    }

    // Match or create contact
    let customer = null;
    if (sp.customer.email) {
      customer = DB.customers.find(x =>
        x.email && x.email.toLowerCase() === sp.customer.email.toLowerCase() &&
        userHasAccessToCompany(x, company.id)
      );
    }
    if (!customer) {
      const newId = Math.max(0, ...DB.customers.map(c => c.id)) + 1;
      const branch = (company.branches || [])[0];
      const account = (company.accounts || [])[0];
      customer = {
        id: newId,
        name: sp.customer.contactName || 'איש קשר לא מזוהה',
        role: sp.customer.contactRole || '',
        phone: sp.customer.phone || '',
        email: sp.customer.email || '',
        addedAt: new Date().toISOString().split('T')[0],
        companyId: company.id,
        accessList: [{
          companyId: company.id,
          branchId: branch?.id,
          accountId: account?.id,
          role: 'orderer'
        }],
        pending: companyIsPending // mark pending if its company is pending
      };
      DB.customers.push(customer);
    }

    // Convert the date label into a proper date string
    let orderDate;
    if (sp.delivery.date === 'asap' || sp.delivery.date === 'next-week' || !sp.delivery.date) {
      orderDate = new Date().toISOString().split('T')[0];
    } else {
      orderDate = sp.delivery.date;
    }

    // Create the order — match items to existing products by id, OR auto-add missing
    // products to admin's catalog so they're recognized for future orders.
    const orderItems = (sp.items || []).map(i => {
      let matched = DB.products.find(p => p.id === i.pid);
      if (!matched && i.pid && i.name) {
        // Auto-import the product into admin's catalog using the public-site
        // category (so fruits/vegetables auto-pick up VAT exemption).
        const importedCat = i.cat || 'meals';
        const importedExempt = (typeof i.vatExempt === 'boolean')
          ? i.vatExempt
          : ADMIN_VAT_EXEMPT_CATS.includes(importedCat);
        matched = {
          id: i.pid,
          sku: 'BLS-' + String(i.pid).padStart(4, '0'),
          name: i.name,
          cat: importedCat,
          vatExempt: importedExempt,
          brand: '',
          icon: importedCat === 'fruits' ? '🥬' : '📦',
          price: i.price || 0,
          cost: Math.round((i.price || 0) * 0.65 * 100) / 100, // estimate 65% as cost
          unit: i.unit || 'יח׳',
          stock: 0,
          low: 5,
          autoImported: true     // flag so admin can identify auto-imported products
        };
        DB.products.push(matched);
      } else if (matched && !matched.cat && i.cat) {
        // Existing imported product missing cat — patch it
        matched.cat = i.cat;
        if (typeof matched.vatExempt !== 'boolean') {
          matched.vatExempt = (typeof i.vatExempt === 'boolean')
            ? i.vatExempt
            : ADMIN_VAT_EXEMPT_CATS.includes(i.cat);
        }
      }
      return matched
        ? { pid:i.pid, qty:i.qty, price:i.price, externalName:i.name, unit:i.unit || matched.unit, cat: i.cat }
        : { pid:i.pid, qty:i.qty, externalName:i.name, externalPrice:i.price, unit:i.unit, cat: i.cat }; // fallback
    });

    const newOrderId = Math.max(0, ...DB.orders.map(o => o.id)) + 1;

    // Identify which account the customer chose at checkout.
    // Priority: explicit accountId from the dropdown → match by customerNumber → primary.
    let chosenAccount = null;
    if (sp.customer.accountId) {
      chosenAccount = (company.accounts || []).find(a => a.id === sp.customer.accountId);
    }
    if (!chosenAccount && sp.customer.customerNumber) {
      chosenAccount = (company.accounts || []).find(a => a.customerNumber === sp.customer.customerNumber);
    }
    if (!chosenAccount && sp.customer.accountLabel) {
      chosenAccount = (company.accounts || []).find(a => a.label === sp.customer.accountLabel);
    }
    if (!chosenAccount) {
      chosenAccount = (company.accounts || []).find(a => a.isPrimary)
                   || (company.accounts || [])[0];
    }

    DB.orders.push({
      id: newOrderId,
      orderNumber: sp.orderNumber,
      companyId: company.id,
      customerId: customer.id,
      accountId: chosenAccount?.id,                              // ← preserve customer's account choice
      requestedCustomerNumber: sp.customer.customerNumber || null, // ← what the customer originally typed
      requestedAccountLabel: sp.customer.accountLabel || null,     // ← e.g., "מוצרי מזון"
      substitutionPref: sp.substitutionPref || 'allow',            // 'allow' or 'remove' — customer's preference for missing items
      date: orderDate,
      items: orderItems,
      total: sp.total,
      payStatus: 'pending',
      orderStatus: 'pending',
      notes: [
        sp.notes,
        sp.delivery.notes ? 'משלוח: ' + sp.delivery.notes : '',
        sp.delivery.floor ? 'קומה/כניסה: ' + sp.delivery.floor : '',
        sp.delivery.time ? 'שעת אספקה: ' + ({morning:'בוקר', noon:'צהריים', afternoon:'אחה"צ'})[sp.delivery.time] : '',
        sp.payment.po ? 'PO: ' + sp.payment.po : '',
        sp.recurring ? '🔁 הזמנה קבועה שבועית' : ''
      ].filter(Boolean).join(' · '),
      source: 'web',
      siteData: sp
    });

    imported++;
  });

  // Clear the queue after successful import
  if (imported > 0) {
    localStorage.setItem('balasi_pending_orders', JSON.stringify([]));
    DB.save();

    // Re-render relevant views
    renderDashboard();
    renderOrders();
    renderCompanies();
    renderCustomers();

    if (!silent) {
      const msg = `✓ ${imported} הזמנות חדשות יובאו מהאתר${pendingCompanies > 0 ? ` (${pendingCompanies} חברות חדשות לבדיקה)` : ''}`;
      showToast(msg);
    } else {
      // Update the badge for new orders in sidebar
      bumpNewOrderBadge(imported);
    }
  }

  return imported;
}

/* Update badge on the orders sidebar link */
function bumpNewOrderBadge(count) {
  const badge = document.getElementById('sbOrdersBadge');
  if (!badge) return;
  // We use a small dot indicator + flash animation
  const link = badge.closest('.sb-link');
  if (link) {
    link.classList.add('sb-link-flash');
    setTimeout(() => link.classList.remove('sb-link-flash'), 4000);
  }
}

/* Listen for live order broadcasts */
function initOrderBroadcastListener() {
  // Request browser notification permission early (silently)
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't auto-prompt — let user enable from settings
    }
  } catch (e) {}

  if (typeof BroadcastChannel === 'undefined') return;
  try {
    const ch = new BroadcastChannel('balasi-orders');
    ch.onmessage = (ev) => {
      console.log('[balasi-admin] BroadcastChannel received:', ev.data);
      if (ev.data && ev.data.type === 'new-order') {
        // Auto-import after 200ms delay (to let localStorage finish writing)
        setTimeout(() => {
          const imported = syncSiteOrders({ silent:true });
          console.log('[balasi-admin] Synced orders, imported:', imported);
          if (imported > 0) {
            triggerOrderAlert(ev.data);
          } else {
            // Even if sync says 0 (e.g., already imported), still notify so the user knows
            triggerOrderAlert(ev.data);
          }
        }, 250);
      }
    };
    window._adminOrdersChannel = ch;
    console.log('[balasi-admin] BroadcastChannel listener active on "balasi-orders"');
  } catch (e) {
    console.warn('BroadcastChannel not supported, fall back to manual sync');
  }

  // Also poll localStorage every 30 seconds as a fallback (in case BroadcastChannel
  // doesn't fire — e.g., browsers without support, or different storage contexts).
  setInterval(() => {
    try {
      const queue = JSON.parse(localStorage.getItem('balasi_pending_orders') || '[]');
      if (queue.length > 0) {
        const imported = syncSiteOrders({ silent:true });
        if (imported > 0) {
          // Notify about the most recent import
          const last = queue[queue.length - 1];
          triggerOrderAlert({
            orderNumber: last.orderNumber,
            total: last.total,
            customer: last.customer?.companyName || 'לקוח'
          });
        }
      }
    } catch (e) {}
  }, 30000);
}

/* Multi-channel alert when new order arrives */
function triggerOrderAlert(order) {
  // Visible toast
  showToast(`📥 הזמנה חדשה: ${order.orderNumber} מ-${order.customer || 'לקוח'} · ₪${order.total || 0}`);

  // Audio ding via Web Audio API (no external file needed)
  try {
    if (getNotificationSetting('sound')) playOrderDing();
  } catch (e) {}

  // Browser notification
  try {
    if (getNotificationSetting('browser') && 'Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('בלסי סטור — הזמנה חדשה', {
        body: `${order.customer || 'לקוח חדש'} · ₪${order.total || 0} · ${order.orderNumber}`,
        icon: 'logo.svg',
        tag: 'balasi-order-' + order.orderNumber,
        requireInteraction: false
      });
      notif.onclick = () => { window.focus(); switchView('orders'); notif.close(); };
      setTimeout(() => notif.close(), 8000);
    }
  } catch (e) { console.warn(e); }

  // (Future) Email/SMS — would go through backend; for now, log the intent
  const email = getNotificationSetting('email');
  const phone = getNotificationSetting('phone');
  if (email || phone) {
    console.log('[notify] Would send order alert to', { email, phone, order });
  }
}

/* Primed audio context — created once and reused so the browser's autoplay
   policy doesn't block subsequent plays. Must be created/resumed during
   a user gesture (we hook into first click anywhere). */
let _adminAudioCtx = null;
function getOrCreateAudioCtx() {
  try {
    if (!_adminAudioCtx) {
      _adminAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_adminAudioCtx.state === 'suspended') {
      _adminAudioCtx.resume(); // unsuspend after user gesture
    }
    return _adminAudioCtx;
  } catch (e) { return null; }
}

function playOrderDing() {
  const ctx = getOrCreateAudioCtx();
  if (!ctx) {
    console.warn('[notify] AudioContext unavailable');
    return;
  }
  // If still suspended (no user gesture yet), browser will block — log & exit
  if (ctx.state === 'suspended') {
    console.warn('[notify] AudioContext still suspended — first user interaction required');
    return;
  }
  const beep = (freq, start, dur) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime + start);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + start + 0.03);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  };
  // Fuller, more attention-grabbing pattern: 3 ascending beeps
  beep(660, 0,    0.20);
  beep(880, 0.18, 0.20);
  beep(1100, 0.36, 0.28);
}

/* Prime the audio context on the first user interaction so subsequent
   plays (triggered by BroadcastChannel events) can succeed. */
(function setupAudioPriming() {
  if (typeof window === 'undefined') return;
  const primer = () => {
    getOrCreateAudioCtx();
    document.removeEventListener('click', primer);
    document.removeEventListener('keydown', primer);
    document.removeEventListener('touchstart', primer);
  };
  document.addEventListener('click', primer, { once: true, capture: true });
  document.addEventListener('keydown', primer, { once: true, capture: true });
  document.addEventListener('touchstart', primer, { once: true, capture: true });
})();

/* Notification settings — stored locally as a stand-in for backend config */
function getNotificationSetting(key) {
  try {
    const s = JSON.parse(localStorage.getItem('admin_notif_settings') || '{}');
    if (key === 'sound')   return s.sound   !== false; // default ON
    if (key === 'browser') return s.browser !== false; // default ON (if permitted)
    if (key === 'email')   return s.email   || '';
    if (key === 'phone')   return s.phone   || '';
  } catch (e) {}
  return key === 'sound' || key === 'browser';
}

function setNotificationSetting(key, value) {
  try {
    const s = JSON.parse(localStorage.getItem('admin_notif_settings') || '{}');
    s[key] = value;
    localStorage.setItem('admin_notif_settings', JSON.stringify(s));
  } catch (e) {}
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('הדפדפן לא תומך בהתראות', 'error');
    return;
  }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      showToast('התראות הדפדפן הופעלו');
      // Send a test
      new Notification('בלסי סטור בע״מ', { body:'התראות הופעלו בהצלחה ✓', icon:'logo.svg' });
    } else {
      showToast('התראות נדחו — ניתן להפעיל בהגדרות הדפדפן');
    }
  });
}

function testOrderAlert() {
  triggerOrderAlert({ orderNumber:'BLS-TEST-' + Date.now().toString().slice(-6), customer:'לקוח לדוגמה', total:485 });
}

/* ---------- VIEW SWITCHING ---------- */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  const titles = {
    dashboard:'דשבורד', orders:'הזמנות', companies:'חברות', customers:'לקוחות',
    products:'מוצרים ומלאי', categoriesAdmin:'ניהול קטגוריות',
    subcategoriesAdmin:'ניהול תתי-קטגוריות', suppliersList:'ניהול ספקים',
    promotions:'מבצעים והנחות',
    monthlyDeals:'מבצעי החודש',
    deliveryNotes:'תעודות משלוח', invoices:'חשבוניות לקוחות', suppliers:'חשבוניות ספק',
    debts:'חובות לקוחות', settings:'הגדרות'
  };
  document.getElementById('viewTitle').textContent = titles[name] || name;
  if (name === 'deliveryNotes') renderDeliveryNotes();
  if (name === 'categoriesAdmin') renderCategoriesAdmin();
  if (name === 'subcategoriesAdmin') renderSubcategoriesAdmin();
  if (name === 'suppliersList') renderSuppliersList();
  if (name === 'promotions') renderPromotions();
  if (name === 'monthlyDeals') renderMonthlyDealsAdmin();
  if (name === 'settings') { hydrateNotificationSettings(); hydrateAutoBillingSettings(); hydrateCompanySettings(); hydrateAllocationSettings(); }
  if (window.innerWidth <= 980) toggleSidebar(false);
}

function hydrateNotificationSettings() {
  const sound = document.getElementById('notifSound');
  const browser = document.getElementById('notifBrowser');
  const email = document.getElementById('notifEmail');
  const phone = document.getElementById('notifPhone');
  if (sound) sound.checked = getNotificationSetting('sound');
  if (browser) browser.checked = getNotificationSetting('browser');
  if (email) email.value = getNotificationSetting('email');
  if (phone) phone.value = getNotificationSetting('phone');
}

/* Populate the company-info form with the currently saved settings */
/* Hydrate the ITA allocation-number settings card */
function hydrateAllocationSettings() {
  const a = (DB.settings || {}).allocation || {};
  const enabled    = document.getElementById('allocEnabled');
  const autoYearly = document.getElementById('allocAutoYearly');
  const threshold  = document.getElementById('allocThreshold');
  const current    = document.getElementById('allocCurrent');
  if (enabled) enabled.checked = a.enabled !== false;
  if (autoYearly) autoYearly.checked = a.autoYearly !== false;
  if (threshold) threshold.value = a.threshold || 10000;
  if (current) {
    const yr = new Date().getFullYear();
    const t = (a.autoYearly !== false) ? getAllocationThreshold() : (a.threshold || 10000);
    current.value = t === Infinity ? 'לא נדרש' : `₪${formatNum(t)} (${yr})`;
  }
}

function saveAllocationSettings(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  if (!DB.settings) DB.settings = {};
  if (!DB.settings.allocation) DB.settings.allocation = {};
  DB.settings.allocation.enabled    = f.get('enabled') === 'on';
  DB.settings.allocation.autoYearly = f.get('autoYearly') === 'on';
  DB.settings.allocation.threshold  = Number(f.get('threshold')) || 10000;
  DB.save('settings');
  hydrateAllocationSettings();
  showToast('✓ הגדרות "חשבונית ישראל" נשמרו');
  if (typeof renderInvoices === 'function') renderInvoices();
}

function hydrateCompanySettings() {
  const s = DB.settings || {};
  const form = document.getElementById('settingsForm');
  if (!form) return;
  const setVal = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = (val == null ? '' : val);
  };
  setVal('companyName', s.companyName);
  setVal('taxId',       s.taxId);
  setVal('address',     s.address);
  setVal('addressNote', s.addressNote);
  setVal('phone',       s.phone);
  setVal('email',       s.email);
  setVal('vat',            s.vat);
  setVal('minOrder',       s.minOrder);
  setVal('minOrderSharon', s.minOrderSharon);
  setVal('freeShip',       s.freeShip);
  setVal('shipFee',        s.shipFee);
}

function hydrateAutoBillingSettings() {
  const ab = (DB.settings || {}).autoBilling || {};
  const enabled = document.getElementById('abEnabled');
  const mode = document.getElementById('abMode');
  const runDay = document.getElementById('abRunDay');
  const includeAll = document.getElementById('abIncludeAll');
  const lastRun = document.getElementById('abLastRunLabel');
  if (enabled) enabled.checked = !!ab.enabled;
  if (mode) mode.value = ab.mode || 'confirm';
  if (runDay) runDay.value = String(ab.runDay || 1);
  if (includeAll) includeAll.checked = !!ab.includeAllPayTerms;
  if (lastRun) lastRun.textContent = ab.lastRun
    ? `${ab.lastRun} (${ab.lastRun.split('-')[1] ? hebrewMonth(Number(ab.lastRun.split('-')[1]) - 1) + ' ' + ab.lastRun.split('-')[0] : ab.lastRun})`
    : 'מעולם לא הופעל';
}

function toggleSidebar(force) {
  const sb = document.querySelector('.sidebar');
  if (typeof force === 'boolean') sb.classList.toggle('open', force);
  else sb.classList.toggle('open');
}

/* ---------- DASHBOARD ---------- */
function renderDashboard() {
  // KPIs
  const monthRevenue = DB.invoices
    .filter(inv => isThisMonth(inv.date))
    .reduce((s, inv) => s + inv.paid, 0);
  const activeOrders = DB.orders.filter(o => ['pending','confirmed','in-delivery'].includes(o.orderStatus)).length;
  const customersCount = DB.customers.length;
  // Open debt = unpaid invoices + unbilled DNs (with VAT)
  const invoiceDebt = DB.invoices.reduce((s, inv) => s + (inv.amount - inv.paid), 0);
  const dnDebt = DB.deliveryNotes.filter(d => !d.billed).reduce((sum, dn) => {
    const t = calculateTotalsWithVat(dn.items || [], undefined, dn.shipping || 0);
    return sum + t.total;
  }, 0);
  const totalCredits = DB.credits.reduce((s, cr) => s + (cr.amount || 0), 0);
  const openDebt = invoiceDebt + dnDebt - totalCredits;

  document.getElementById('kpiRevenue').textContent = `₪${formatNum(monthRevenue)}`;
  document.getElementById('kpiOrders').textContent = activeOrders;
  document.getElementById('kpiCustomers').textContent = customersCount;
  document.getElementById('kpiDebt').textContent = `₪${formatNum(openDebt)}`;
  document.getElementById('sbOrdersBadge').textContent = activeOrders;
  document.getElementById('sbDebtsBadge').textContent = DB.invoices.filter(inv => isOverdue(inv)).length;

  // Bulk billing banner — show on dashboard when there are unbilled DNs
  renderBulkBillingBanners();

  // Recent orders
  const recent = DB.orders.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
  const tbody = document.querySelector('#dashOrdersTable tbody');
  tbody.innerHTML = recent.map(o => {
    const company = DB.companies.find(c => c.id === o.companyId);
    return `<tr>
      <td class="strong-cell">${o.orderNumber}</td>
      <td>${company?.name || '—'}</td>
      <td class="muted-cell">${formatDate(o.date)}</td>
      <td class="price-cell">₪${formatNum(o.total)}</td>
      <td>${orderStatusPill(o.orderStatus)}</td>
    </tr>`;
  }).join('');

  // Low stock
  const lowStock = DB.products.filter(p => p.stock <= p.low).slice(0, 5);
  document.getElementById('lowStockList').innerHTML = lowStock.length
    ? lowStock.map(p => `
        <div class="lsl-item">
          <div class="lsl-item-l">
            <span class="lsl-emoji">${p.icon}</span>
            <div>
              <div class="lsl-name">${p.name}</div>
              <div class="lsl-cat">${p.brand} · ${p.unit}</div>
            </div>
          </div>
          <span class="lsl-stock">${p.stock === 0 ? 'אזל' : `${p.stock} ביחידה`}</span>
        </div>`).join('')
    : '<div class="empty"><h4>הכל במלאי תקין</h4><p>אין מוצרים שדורשים הזמנה מחדש</p></div>';

  // Top customers
  const customerTotals = {};
  DB.invoices.forEach(inv => {
    customerTotals[inv.companyId] = (customerTotals[inv.companyId] || 0) + inv.amount;
  });
  const top = Object.entries(customerTotals)
    .sort((a,b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topCustomers').innerHTML = top.map(([cid, total], i) => {
    const c = DB.companies.find(x => x.id === Number(cid));
    if (!c) return '';
    const orderCount = DB.orders.filter(o => o.companyId === c.id).length;
    return `<div class="tc-item">
      <span class="tc-rank">${i + 1}</span>
      <div>
        <div class="tc-name">${c.name}</div>
        <div class="tc-meta">${c.customerNumber} · ${c.city}</div>
      </div>
      <div class="tc-meta">${orderCount} הזמנות</div>
      <div class="tc-spent">₪${formatNum(total)}</div>
    </div>`;
  }).join('');
}

/* ---------- ORDERS ---------- */
/* Helper: classify orders into "active" vs "completed" buckets */
const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'in-delivery'];
const COMPLETED_ORDER_STATUSES = ['delivered', 'cancelled'];

function isCompletedOrder(o) {
  // An order is "completed" if any of:
  // 1. Status is 'delivered' or 'cancelled'
  // 2. It already has a delivery note (DN means goods were sent — work is done)
  // 3. It has an invoice (cash-terms orders: invoice = transaction closed)
  if (COMPLETED_ORDER_STATUSES.includes(o.orderStatus)) return true;
  if (o.deliveryNoteId) return true;
  if (o.invoiceId) return true;
  return false;
}

function switchOrdersTab(tab) {
  window._ordersTab = tab;
  document.querySelectorAll('.orders-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderOrders();
}

function renderOrders() {
  const tbody = document.querySelector('#ordersTable tbody');
  const search = document.getElementById('ordersSearch').value.trim().toLowerCase();
  const filter = document.getElementById('ordersFilter').value;
  const tab = window._ordersTab || 'active';

  // Update tab counts
  const activeCount = DB.orders.filter(o => !isCompletedOrder(o)).length;
  const completedCount = DB.orders.filter(o => isCompletedOrder(o)).length;
  const allCount = DB.orders.length;
  const activeBadge = document.getElementById('ordersTabActiveBadge');
  const completedBadge = document.getElementById('ordersTabCompletedBadge');
  const allBadge = document.getElementById('ordersTabAllBadge');
  if (activeBadge) activeBadge.textContent = activeCount;
  if (completedBadge) completedBadge.textContent = completedCount;
  if (allBadge) allBadge.textContent = allCount;

  let list = DB.orders.slice().sort((a,b) => b.date.localeCompare(a.date));

  // Apply tab filter first
  if (tab === 'active')         list = list.filter(o => !isCompletedOrder(o));
  else if (tab === 'completed') list = list.filter(o => isCompletedOrder(o));
  // 'all' = no tab filter

  if (search) list = list.filter(o => {
    const c = DB.companies.find(x => x.id === o.companyId);
    return o.orderNumber.toLowerCase().includes(search) || (c && c.name.toLowerCase().includes(search));
  });
  if (filter !== 'all') list = list.filter(o => o.orderStatus === filter);

  if (!list.length) {
    const emptyMsg = tab === 'completed'
      ? 'אין הזמנות שהסתיימו עדיין'
      : tab === 'active'
      ? 'אין הזמנות פעילות'
      : 'אין הזמנות להצגה';
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><h4>${emptyMsg}</h4></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(o => {
    const company = DB.companies.find(c => c.id === o.companyId);
    const customer = DB.customers.find(c => c.id === o.customerId);
    const sourceBadge = o.source === 'web'
      ? '<span class="pill pill-info" title="הזמנה מהאתר הציבורי">🌐 מהאתר</span>'
      : '';
    const pendingBadge = company?.pending
      ? '<span class="pill pill-warn" style="margin-right:4px;cursor:pointer" onclick="reviewPendingCompany(' + company.id + ')" title="חברה חדשה — דרושה בדיקה">⚠️ ממתין לבדיקה</span>'
      : '';
    const reviewBtn = company?.pending
      ? `<button class="row-action row-action-primary" style="background:var(--orange-bg);color:var(--orange-2);border-color:var(--orange)" onclick="reviewPendingCompany(${company.id})">⚠️ בדוק</button>`
      : '';
    // Show linked-document badges so admin sees instantly that this is "done"
    const dnBadge = o.deliveryNoteId
      ? `<span class="pill pill-info" style="font-size:10px;margin-right:3px" title="תעודת משלוח קיימת">📦 תעודה</span>`
      : '';
    const invBadge = o.invoiceId
      ? `<span class="pill pill-success" style="font-size:10px;margin-right:3px" title="חשבונית הופקה">🧾 חשבונית</span>`
      : '';
    return `<tr>
      <td class="strong-cell">${o.orderNumber}<div style="margin-top:3px">${sourceBadge}</div></td>
      <td>${company?.name || '—'}<div style="margin-top:3px">${pendingBadge}</div></td>
      <td class="muted-cell">${customer?.name || '—'}</td>
      <td class="muted-cell">${formatDate(o.date)}</td>
      <td class="price-cell">₪${formatNum(o.total)}</td>
      <td>${payStatusPill(o.payStatus)}</td>
      <td>${orderStatusPill(o.orderStatus)}<div style="margin-top:3px">${dnBadge}${invBadge}</div></td>
      <td>${reviewBtn}<button class="row-action" onclick="viewOrder(${o.id})">פרטים</button><button class="row-action row-action-danger" onclick="deleteOrder(${o.id})" title="מחיקת הזמנה">🗑</button></td>
    </tr>`;
  }).join('');
}

/* ================================================================
   DELETE ORDER — with cascade option for linked DN/invoice
   ================================================================ */
function deleteOrder(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  const company = DB.companies.find(c => c.id === o.companyId);
  const linkedDN = o.deliveryNoteId ? DB.deliveryNotes.find(d => d.id === o.deliveryNoteId) : null;
  const linkedInv = o.invoiceId ? DB.invoices.find(i => i.id === o.invoiceId) : null;
  const hasReceipts = linkedInv && (linkedInv.paid > 0);

  // Build warning content
  const warnings = [];
  if (linkedDN) warnings.push(`📦 תעודת משלוח <b>${linkedDN.number}</b> תימחק גם היא`);
  if (linkedInv) {
    if (hasReceipts) {
      warnings.push(`🧾 חשבונית <b>${linkedInv.number}</b> כבר שולמה (₪${formatNum(linkedInv.paid)}) — <span style="color:var(--danger)">לא ניתן למחוק</span>`);
    } else {
      warnings.push(`🧾 חשבונית <b>${linkedInv.number}</b> תימחק גם היא`);
    }
  }
  if (linkedInv && linkedInv.consolidatedDNs && linkedInv.consolidatedDNs.length > 1) {
    warnings.push(`⚠️ חשבונית זו <b>מרוכזת</b> ומאחדת ${linkedInv.consolidatedDNs.length} תעודות — לא ניתן למחוק רק את ההזמנה הזאת`);
  }

  // Hard block: paid invoice or consolidated invoice
  const blocked = hasReceipts || (linkedInv?.consolidatedDNs && linkedInv.consolidatedDNs.length > 1);

  openModal('מחיקת הזמנה', `
    <div style="padding:24px">
      <div class="cm-info" style="margin:0 0 16px;background:#fdebe0;border-right-color:var(--danger)">
        <span class="cm-info-icon">🚨</span>
        <p style="flex:1"><b>פעולה בלתי הפיכה!</b> ההזמנה תימחק לצמיתות.</p>
      </div>

      <div style="font-size:14px;line-height:1.7;color:var(--ink-2)">
        <b>פרטי ההזמנה:</b>
        <div style="margin:8px 0 14px;padding:10px 14px;background:#fafafa;border:1px solid var(--line);border-radius:8px;font-size:13px">
          <div><b>מספר:</b> ${o.orderNumber}</div>
          <div><b>חברה:</b> ${company?.name || '—'}</div>
          <div><b>תאריך:</b> ${formatDate(o.date)}</div>
          <div><b>סכום:</b> ₪${formatNum(o.total)}</div>
          <div><b>סטטוס:</b> ${orderStatusPill(o.orderStatus)}</div>
        </div>

        ${warnings.length ? `
          <b>השפעה על מסמכים מקושרים:</b>
          <ul style="margin:8px 0 0;padding-right:20px;line-height:1.9;font-size:13px">
            ${warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        ` : '<p style="color:var(--muted);font-size:13px">אין מסמכים מקושרים — מחיקה בטוחה.</p>'}

        ${blocked ? `
          <div style="margin-top:14px;padding:12px;background:#fdebe0;border:1px solid var(--danger);border-radius:8px;font-size:13px;color:#a14a2c">
            <b>חסום:</b> לא ניתן למחוק הזמנה זו כפי שהיא. ${hasReceipts
              ? 'יש לבטל את התשלום על החשבונית קודם, או ליצור זיכוי במקום למחוק.'
              : 'יש לבטל קודם את החשבונית המרוכזת או להפיק חשבונית חלופית.'}
          </div>
        ` : ''}
      </div>
    </div>
  `, blocked ? [
    { label:'סגור', class:'btn-ghost', action:closeModal }
  ] : [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'🗑 מחק לצמיתות', class:'btn-danger', action:() => doDeleteOrder(orderId) }
  ]);
  document.getElementById('modalCard').style.maxWidth = '560px';
}

function doDeleteOrder(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;

  // Cascade-delete linked DN and invoice (only if safe)
  if (o.deliveryNoteId) {
    DB.deliveryNotes = DB.deliveryNotes.filter(d => d.id !== o.deliveryNoteId);
  }
  if (o.invoiceId) {
    const inv = DB.invoices.find(i => i.id === o.invoiceId);
    // Only delete invoice if it isn't paid and isn't consolidated
    if (inv && (inv.paid || 0) === 0 && (!inv.consolidatedDNs || inv.consolidatedDNs.length <= 1)) {
      DB.invoices = DB.invoices.filter(i => i.id !== o.invoiceId);
    }
  }
  // Remove the order itself
  DB.orders = DB.orders.filter(x => x.id !== orderId);
  DB.save();

  closeModal();
  renderOrders();
  renderInvoices();
  renderDebts();
  renderDashboard();
  renderCompanies();
  showToast(`✓ ההזמנה ${o.orderNumber} נמחקה`);
}

function viewOrder(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o) return;
  const company = DB.companies.find(c => c.id === o.companyId);
  const customer = DB.customers.find(c => c.id === o.customerId);
  const account = (company?.accounts || []).find(a => a.id === o.accountId) || (company?.accounts || []).find(a => a.isPrimary) || (company?.accounts || [])[0];
  const payTerms = account?.payTerms || 'credit';
  const isPending = o.orderStatus === 'pending';
  const isWeb = o.source === 'web';
  const itemsHtml = o.items.map(it => {
    const p = DB.products.find(x => x.id === it.pid);
    const name = p ? `${p.icon} ${p.name}` : `📦 ${it.externalName || it.name || '—'}`;
    const brand = p?.brand || '—';
    const price = p?.price ?? it.externalPrice ?? 0;
    const status = it.status || 'delivered';

    // Visual treatment for missing/substituted items
    if (status === 'missing') {
      return `<tr style="background:#fef8f5">
        <td><span style="text-decoration:line-through;color:#999">${name}</span> <span class="pill" style="background:#fdebe0;color:#a14a2c;font-size:10px;margin-right:6px;padding:2px 8px;border-radius:4px;border:1px solid #d97757">❌ חסר במלאי</span></td>
        <td class="muted-cell" style="text-decoration:line-through;color:#999">${brand}</td>
        <td style="text-decoration:line-through;color:#999">${it.qty}</td>
        <td style="text-decoration:line-through;color:#999">₪${price}</td>
        <td class="muted-cell" style="text-decoration:line-through;color:#999">₪${formatNum(price * it.qty)}</td>
      </tr>`;
    }
    if (status === 'substituted' && it.substitutedWith) {
      const sub = it.substitutedWith;
      const subProduct = DB.products.find(x => x.id === sub.pid);
      const subName = (subProduct?.icon || sub.icon || '📦') + ' ' + (subProduct?.name || sub.name || '—');
      const subPrice = sub.price || subProduct?.price || 0;
      return `<tr style="background:#fffbef">
        <td colspan="5" style="padding:0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td><span style="text-decoration:line-through;color:#999">${name}</span> <span class="pill" style="background:#fff7e0;color:#7a5a15;font-size:10px;margin-right:6px;padding:2px 8px;border-radius:4px;border:1px solid #d4a217">🔄 הוחלף</span></td>
              <td class="muted-cell" style="text-decoration:line-through;color:#999">${brand}</td>
              <td style="text-decoration:line-through;color:#999">${it.qty}</td>
              <td style="text-decoration:line-through;color:#999">₪${price}</td>
              <td class="muted-cell" style="text-decoration:line-through;color:#999">₪${formatNum(price * it.qty)}</td>
            </tr>
            <tr style="background:#f3f8f4">
              <td>↳ ${subName} <span class="pill" style="background:#e3f2e8;color:#155f30;font-size:10px;margin-right:6px;padding:2px 8px;border-radius:4px;border:1px solid #1b7a3d">✓ נמסר במקום</span></td>
              <td class="muted-cell">${subProduct?.brand || '—'}</td>
              <td>${sub.qty}</td>
              <td>₪${subPrice}</td>
              <td class="strong-cell">₪${formatNum(subPrice * sub.qty)}</td>
            </tr>
          </table>
        </td>
      </tr>`;
    }
    return `<tr>
      <td>${name}</td>
      <td class="muted-cell">${brand}</td>
      <td>${it.qty}</td>
      <td>₪${price}</td>
      <td class="strong-cell">₪${formatNum(price * it.qty)}</td>
    </tr>`;
  }).join('');

  // Build a fulfillment summary banner if there are missing/substituted items
  const missingCount = (o.items || []).filter(i => i.status === 'missing').length;
  const substitutedCount = (o.items || []).filter(i => i.status === 'substituted').length;
  const fulfillmentSummaryBanner = (missingCount + substitutedCount) > 0 ? `
    <div class="cm-info" style="margin:0 0 14px;background:linear-gradient(135deg, #fff7e0, #fdebe0);border-right-color:#d4a217">
      <span class="cm-info-icon">📦</span>
      <p style="flex:1">
        <b>שינויים שהוגדרו בליקוט:</b>
        ${missingCount > 0 ? ` ${missingCount} פריטים חסרים במלאי (לא ייכללו במשלוח).` : ''}
        ${substitutedCount > 0 ? ` ${substitutedCount} פריטים יוחלפו במוצרים דומים.` : ''}
        <br><span style="font-size:12px;color:var(--muted)">בעת אישור ההזמנה, תעודת המשלוח תופק עם השינויים האלה.</span>
      </p>
    </div>
  ` : '';

  // אישור הזמנה תמיד יוצר תעודת משלוח. חשבונית מס תופק בנפרד —
  // ידנית מתעודת משלוח קיימת, או דרך החיוב המרוכז (autoBilling).
  // (תוקן 2026-05-18 כחלק מתיקון הבאג של חשבונית במקום תעודת משלוח.)
  const docType = 'תעודת משלוח';
  const docExplain = 'באישור ההזמנה תיווצר <b>תעודת משלוח</b>. חשבונית מס תופק בנפרד — ידנית מהתעודה או דרך החיוב החודשי המרוכז.';

  const actions = [
    { label:'סגור', class:'btn-ghost', action:closeModal },
    { label:'🗑 מחיקה', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => deleteOrder(id), 100); } },
  ];
  if (isPending) {
    actions.push({ label:'📦 מצב ליקוט', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => openPickerMode(id), 100); } });
    actions.push({ label:'✏️ ערוך הזמנה', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => editOrderModal(id), 100); } });
    actions.push({ label:`✓ אשר → ${docType}`, class:'btn-primary', action:() => approveOrder(id) });
  }

  openModal(`הזמנה ${o.orderNumber}`, `
    <div style="padding:22px">
      ${isWeb ? `<div class="cm-info" style="margin:0 0 16px"><span class="cm-info-icon">🌐</span><p>הזמנה זו <b>התקבלה מהאתר הציבורי</b>. ${isPending ? 'הזמנה ממתינה לאישור — ניתן לערוך לפני שליחה ללקוח.' : ''}</p></div>` : ''}

      <div class="form-grid" style="padding:0;margin-bottom:18px">
        <div><b>חברה:</b> ${company?.name || '—'}${company?.pending ? ' <span class="pill pill-warn">ממתין לבדיקה</span>' : ''}</div>
        <div><b>איש קשר:</b> ${customer?.name || '—'}</div>
        <div><b>תאריך:</b> ${formatDate(o.date)}</div>
        <div><b>אופן תשלום:</b> ${payTermsLabel(payTerms)}</div>
        <div>
          <b>חשבון לחיוב (לפי בחירת הלקוח):</b>
          ${account?.label || '—'} (${account?.customerNumber || '—'})
          ${account?.isPrimary ? '' : '<span class="pill pill-info" style="margin-right:6px;font-size:10px">חשבון משני</span>'}
          ${o.requestedCustomerNumber && account?.customerNumber !== o.requestedCustomerNumber
            ? `<div style="margin-top:4px;font-size:11.5px;color:var(--orange-2)">⚠️ הלקוח ביקש מספר ${o.requestedCustomerNumber} — לא נמצא חשבון תואם</div>`
            : ''}
        </div>
        <div><b>סטטוס:</b> ${orderStatusPill(o.orderStatus)} ${payStatusPill(o.payStatus)}</div>
      </div>

      ${isPending ? `<div class="cm-info" style="margin:0 0 14px;background:linear-gradient(135deg,var(--warn-bg),var(--paper));border-right-color:var(--warn)"><span class="cm-info-icon">📦</span><p>${docExplain}</p></div>` : ''}

      ${o.substitutionPref ? `
        <div class="cm-info" style="margin:0 0 14px;background:${o.substitutionPref === 'allow' ? 'var(--green-bg)' : 'var(--warn-bg)'};border-right-color:${o.substitutionPref === 'allow' ? 'var(--green)' : 'var(--warn)'}">
          <span class="cm-info-icon">${o.substitutionPref === 'allow' ? '🔄' : '❌'}</span>
          <p style="flex:1"><b>העדפת חוסרים:</b> ${o.substitutionPref === 'allow' ? 'הלקוח <b>מאשר</b> תחליפים למוצרים חסרים' : 'הלקוח <b>אינו מאשר</b> תחליפים — להסיר מוצרים חסרים'}</p>
        </div>
      ` : ''}

      ${fulfillmentSummaryBanner}

      <table class="table" style="margin-top:16px">
        <thead><tr><th>מוצר</th><th>יצרן</th><th>כמות</th><th>מחיר</th><th>סה"כ</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${o.shipping > 0 ? `
      <div style="text-align:left;margin-top:14px;font-size:14px">
        <div style="display:inline-flex;flex-direction:column;gap:4px;min-width:220px">
          <div style="display:flex;justify-content:space-between;gap:24px"><span>סכום ביניים</span><b>₪${formatNum((typeof o.subtotal === 'number' ? o.subtotal : (o.total - o.shipping)))}</b></div>
          <div style="display:flex;justify-content:space-between;gap:24px"><span>דמי משלוח</span><b>₪${formatNum(o.shipping)}</b></div>
          <div style="display:flex;justify-content:space-between;gap:24px;font-size:18px;font-weight:900;border-top:1px solid var(--line);padding-top:4px"><span>סה"כ</span><span>₪${formatNum(o.total)}</span></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">לפני מע״מ · דמי משלוח יתווספו לחיוב</div>
      </div>` : `
      <div style="text-align:left;font-size:18px;font-weight:900;margin-top:14px">סה"כ: ₪${formatNum(o.total)}</div>`}
      ${o.notes ? `<div style="margin-top:14px;background:var(--warn-bg);padding:10px;font-size:13px"><b>הערות:</b> ${o.notes}</div>` : ''}
      ${o.deliveryNoteId ? `<div style="margin-top:8px;background:var(--green-bg);padding:10px;font-size:13px"><b>📦 תעודת משלוח שנוצרה:</b> ${DB.deliveryNotes.find(d => d.id === o.deliveryNoteId)?.number || '—'}</div>` : ''}
      ${o.invoiceId ? `<div style="margin-top:8px;background:var(--info-bg);padding:10px;font-size:13px"><b>🧾 חשבונית שנוצרה:</b> ${DB.invoices.find(i => i.id === o.invoiceId)?.number || '—'}</div>` : ''}

      ${(() => {
        // Show any promotions that were applied at order time
        const promos = o.siteData?.promotions;
        if (!promos || promos.totalSaved <= 0) return '';
        const lines = [];
        if (promos.productSavings > 0)  lines.push(`<div>🏷️ הנחות מבצעי מוצר/קטגוריה: <b>−₪${formatNum(promos.productSavings)}</b></div>`);
        if (Array.isArray(promos.bundlePromos)) {
          promos.bundlePromos.forEach(b => {
            lines.push(`<div>📦 ${b.name} (×${b.bundles} חבילות): <b>−₪${formatNum(b.savings)}</b></div>`);
          });
        }
        if (promos.orderPromo)          lines.push(`<div>💰 הנחת סף הזמנה (${promos.orderPromo.name}): <b>−₪${formatNum(promos.orderPromo.amount)}</b></div>`);
        if (promos.firstOrderPromo)     lines.push(`<div>✨ ${promos.firstOrderPromo.name} (${promos.firstOrderPromo.pct || 5}%−): <b>−₪${formatNum(promos.firstOrderPromo.amount)}</b></div>`);
        if (promos.couponPromo)         lines.push(`<div>🎟️ קופון <code style="background:#fff;padding:1px 6px;border-radius:3px">${promos.couponPromo.code}</code> (${promos.couponPromo.name}): <b>−₪${formatNum(promos.couponPromo.amount)}</b></div>`);
        return `<div style="margin-top:14px;padding:12px 14px;background:linear-gradient(135deg,#fff7e0,#fdebe0);border-right:3px solid #d4a217;border-radius:6px;font-size:13px;line-height:1.7">
          <b style="display:block;margin-bottom:4px;color:#7a5a15">🏷️ מבצעים שהוחלו (סה״כ חיסכון ₪${formatNum(promos.totalSaved)})</b>
          ${lines.join('')}
        </div>`;
      })()}

      ${(() => {
        // Show legal consent evidence captured at the moment the customer
        // submitted this order. Critical for defending against future claims
        // of "I never agreed to your terms".
        const consent = o.siteData?.consent;
        if (!consent) {
          // Web orders submitted before consent capture was added — show
          // a warning so the admin knows the proof is missing for this one.
          if (o.source === 'web') {
            return `<div style="margin-top:14px;padding:12px 14px;background:#fdebe0;border-right:3px solid #d97757;font-size:12.5px;color:#a14a2c;line-height:1.55">
              <b>⚠️ ראיית הסכמה חסרה</b>
              <span style="display:block;margin-top:4px;font-size:11.5px">הזמנה זו התקבלה לפני הפעלת מנגנון תיעוד ההסכמה. אם הלקוח יערער על הסכמתו לתנאים, אין הוכחה דיגיטלית.</span>
            </div>`;
          }
          return '';
        }
        const dt = new Date(consent.consentedAt);
        const dtStr = dt.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'medium' });
        return `<details style="margin-top:14px;background:#f0f9f3;border:1px solid #a8d4b6;border-radius:6px;padding:0;font-size:12.5px">
          <summary style="padding:10px 14px;cursor:pointer;font-weight:700;color:#155f30;list-style:none;display:flex;align-items:center;gap:8px">
            <span>🛡️</span>
            <span style="flex:1">ראיית הסכמה לתנאי שימוש (${dtStr})</span>
            <span style="font-size:11px;font-weight:600;color:#155f30;opacity:.8">▼ פירוט</span>
          </summary>
          <div style="padding:0 14px 12px;color:#155f30;line-height:1.7">
            <div style="background:#fff;border:1px solid #c8e6c9;padding:10px 12px;margin-top:6px;border-radius:4px;font-size:12px;color:#1a1a17">
              <b>טקסט שאליו הסכים הלקוח (תנאים + פרטיות):</b><br>
              <span style="font-style:italic;color:#3a3630">"${consent.consentText}"</span>
            </div>
            ${consent.marketing ? `
              <div style="background:#fff;border:1px solid ${consent.marketing.granted ? '#c8e6c9' : '#e0dccd'};padding:10px 12px;margin-top:6px;border-radius:4px;font-size:12px;color:#1a1a17">
                <b>הסכמה לדיוור פרסומי (תיקון 40 לחוק התקשורת):</b><br>
                <span style="font-weight:700;color:${consent.marketing.granted ? '#1b7a3d' : '#a14a2c'}">
                  ${consent.marketing.granted ? '✓ נתן הסכמה' : '✗ לא נתן הסכמה'}
                </span>
                ${consent.marketing.granted && consent.marketing.text ? `
                  <br><span style="font-style:italic;color:#3a3630;font-size:11.5px">"${consent.marketing.text}"</span>
                ` : ''}
                ${consent.marketing.granted
                  ? '<br><span style="font-size:11px;color:#807a6e">ניתן לשלוח לו דיוור פרסומי. כל הודעה חייבת לכלול קישור הסרה.</span>'
                  : '<br><span style="font-size:11px;color:#a14a2c"><b>אין לשלוח דיוור פרסומי ללקוח זה.</b> שליחת הודעה תהיה הפרת חוק.</span>'}
              </div>
            ` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-top:10px;font-size:11.5px">
              <div><b>תאריך הסכמה:</b> ${dtStr}</div>
              <div><b>גרסת תנאים:</b> ${consent.termsVersion || '—'}</div>
              <div><b>גרסת מדיניות:</b> ${consent.privacyVersion || '—'}</div>
              <div><b>אזור זמן:</b> ${consent.timezone || '—'}</div>
              <div><b>שפת דפדפן:</b> ${consent.language || '—'}</div>
              <div><b>רזולוציית מסך:</b> ${consent.screen || '—'}</div>
              <div style="grid-column:1/-1"><b>זיהוי דפדפן:</b> <span style="font-family:monospace;font-size:10.5px;word-break:break-all;color:#3a3630">${(consent.userAgent || '—').slice(0, 200)}</span></div>
              ${consent.ipAddress ? `<div><b>כתובת IP:</b> ${consent.ipAddress}</div>` : ''}
              ${consent.referrer ? `<div style="grid-column:1/-1"><b>הופנה מ:</b> ${consent.referrer}</div>` : ''}
            </div>
          </div>
        </details>`;
      })()}
    </div>
  `, actions);
  document.getElementById('modalCard').style.maxWidth = '720px';
}

/* ================================================================
   ORDER APPROVAL → AUTO-CREATE DELIVERY NOTE / INVOICE
   ================================================================ */
function approveOrder(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  const company = DB.companies.find(c => c.id === o.companyId);
  if (!company) { showToast('חברה לא נמצאה', 'error'); return; }

  // If a coupon was redeemed on this order, increment its usage counter once.
  // We mark the order as `couponConsumed` so re-approving doesn't double-count.
  const couponCode = o.siteData?.promotions?.couponPromo?.code;
  if (couponCode && !o.couponConsumed) {
    incrementCouponUsage(couponCode);
    o.couponConsumed = true;
  }

  const account = (company.accounts || []).find(a => a.id === o.accountId) ||
                  (company.accounts || []).find(a => a.isPrimary) ||
                  (company.accounts || [])[0];
  // אישור הזמנה תמיד יוצר תעודת משלוח. חשבונית מס מופקת בנפרד —
  // ידנית מתעודת משלוח קיימת, או דרך חיוב חודשי מרוכז (autoBilling).
  // (תוקן 2026-05-18: בעבר נוצרה חשבונית ישירות כאשר payTerms != 'net30',
  //  מה שגרם לבאג בהזמנות לחברה השנייה של איש קשר רב-חברות.)
  confirmDialogAdmin({
    title: 'אישור הזמנה — יצירת תעודת משלוח',
    message: `
      <p>בלחיצה על אישור:</p>
      <ul style="text-align:right;font-size:13px;line-height:1.8;color:var(--ink-2);margin:12px 0;padding-right:20px">
        <li>סטטוס ההזמנה ישתנה ל-<b>"מאושר"</b></li>
        <li>תיווצר <b>תעודת משלוח</b> בסכום ₪${formatNum(o.total)}</li>
        <li>חשבונית מס תופק בנפרד — ידנית או דרך חיוב חודשי מרוכז</li>
        <li>אישור יישלח לדוא"ל הלקוח</li>
      </ul>
    `,
    confirmLabel: 'אשר וצור תעודת משלוח',
    onConfirm: () => doApproveOrder(orderId, true)
  });
}

function doApproveOrder(orderId, isCreditTerms) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  const company = DB.companies.find(c => c.id === o.companyId);
  const account = (company.accounts || []).find(a => a.id === o.accountId) ||
                  (company.accounts || []).find(a => a.isPrimary) ||
                  (company.accounts || [])[0];

  // Build items list — preserve all known info so the DN/invoice can display it later
  // even if the product is removed from the catalog or doesn't exist in admin DB.
  // Each line carries its FULFILLMENT STATUS:
  //   'delivered'   = item delivered as ordered (default)
  //   'missing'     = item was unavailable, removed (no charge)
  //   'substituted' = item replaced with a different product (line shows both)
  const items = o.items.map(it => {
    const p = DB.products.find(x => x.id === it.pid);
    const baseItem = {
      pid: it.pid,
      qty: it.qty,
      price: p?.price ?? it.externalPrice ?? it.price ?? 0,
      // Carry over fallback name/unit if the product isn't in the admin catalog
      externalName: it.externalName || it.name || (p ? null : 'מוצר לא ידוע'),
      externalPrice: it.externalPrice || it.price,
      unit: it.unit || p?.unit || '',
      cat: it.cat || p?.cat,
      // Status & substitution metadata
      status: it.status || 'delivered',
      substitutedWith: it.substitutedWith || null
    };
    return baseItem;
  });
  const subtotal = items
    .filter(i => i.status !== 'missing')
    .reduce((s, i) => {
      if (i.status === 'substituted' && i.substitutedWith) {
        return s + (i.substitutedWith.price * i.substitutedWith.qty);
      }
      return s + i.price * i.qty;
    }, 0);

  // Calculate the actual fulfilled total (excludes missing items, uses substitution prices)
  const fulfilledTotal = (() => {
    const t = calculateTotalsWithVat(items.filter(i => i.status !== 'missing').map(i => {
      // For substituted items, use the replacement product
      if (i.status === 'substituted' && i.substitutedWith) {
        return { ...i.substitutedWith, status: 'delivered' };
      }
      return i;
    }), o.companyId, o.shipping || 0);
    return t.total;
  })();

  // תמיד יוצרים תעודת משלוח בעת אישור ההזמנה — ללא תלות ב-payTerms,
  // ב-accessList של הלקוח או בכל פרמטר אחר.
  // אם ההזמנה הגיעה כשהיא כבר משולמת (payStatus='paid', למשל ע"י סליקת
  // אשראי במעמד ההזמנה), מופקת בנוסף חשבונית מס-קבלה (Tax Invoice-Receipt)
  // וקבלה תואמת, ותעודת המשלוח מסומנת billed=true.
  // אחרת — רק תעודת משלוח. חשבונית מס תופק מאוחר יותר (ידנית או autoBilling).
  // הפרמטר isCreditTerms נשמר לצורך תאימות לאחור עם קוראים קיימים.
  {
    const today = new Date().toISOString().split('T')[0];
    const yr    = today.slice(0, 4);
    const prepaid = (o.payStatus === 'paid'); // לקוח כבר שילם במעמד ההזמנה

    // 1. יצירת תעודת משלוח (תמיד)
    const dnId = Math.max(0, ...DB.deliveryNotes.map(d => d.id || 0)) + 1;
    const dn = {
      id: dnId,
      number: 'DN-' + yr + '-' + String(dnId).padStart(4, '0'),
      companyId: o.companyId,
      accountId: account?.id,
      orderId: o.id,
      invoiceId: null,
      date: today,
      deliveredBy: 'נציג שירות',
      notes: o.notes || '',
      items: items,
      shipping: o.shipping || 0,
      total: fulfilledTotal,
      billed: false
    };
    DB.deliveryNotes.push(dn);
    o.deliveryNoteId = dnId;
    o.orderStatus = 'confirmed';

    if (prepaid) {
      // 2. חשבונית מס-קבלה (Tax Invoice-Receipt) — תשלום באשראי בעת ההזמנה.
      // משתמשים בקידומת INVR- כדי להבחין מחשבונית מס רגילה (INV-).
      const totals = calculateTotalsWithVat(items, o.companyId, o.shipping || 0);
      const invId  = Math.max(0, ...(DB.invoices || []).map(i => i.id || 0)) + 1;
      const inv = {
        id: invId,
        number: 'INVR-' + yr + '-' + String(invId).padStart(4, '0'),
        companyId: o.companyId,
        accountId: account?.id,
        orderId: o.id,
        deliveryNoteId: dnId,
        date: today,
        dueDate: today, // שולם במעמד ההזמנה
        amount: totals.total,
        vatAmount: totals.vat,
        vatExemptBase: totals.exemptBase,
        paid: totals.total, // שולם במלואה
        isTaxInvoiceReceipt: true, // דגל המבדיל בין חשבונית מס לחשבונית מס-קבלה
        notes: 'חשבונית מס-קבלה — תשלום באשראי בעת ההזמנה (' + o.orderNumber + ')',
        items: items,
        shipping: o.shipping || 0
      };
      DB.invoices = DB.invoices || [];
      DB.invoices.push(inv);
      dn.invoiceId = invId;
      dn.billed = true;
      o.invoiceId = invId;

      // 3. קבלה תואמת המקשרת את התשלום לחשבונית מס-קבלה
      const rcpId = Math.max(0, ...(DB.receipts || []).map(r => r.id || 0)) + 1;
      const rcp = {
        id: rcpId,
        number: 'RCP-' + yr + '-' + String(rcpId).padStart(4, '0'),
        companyId: o.companyId,
        invoiceId: invId,
        date: today,
        amount: totals.total,
        method: 'אשראי',
        notes: 'תשלום במעמד ההזמנה (' + o.orderNumber + ')'
      };
      DB.receipts = DB.receipts || [];
      DB.receipts.push(rcp);

      DB.save();
      showToast(`✓ תעודת משלוח ${dn.number} וחשבונית מס-קבלה ${inv.number} הופקו בהצלחה`);
    } else {
      o.payStatus = 'pending';
      DB.save();
      showToast(`✓ תעודת משלוח ${dn.number} נוצרה בהצלחה`);
    }
  }

  // Send confirmation to customer (simulated)
  sendOrderConfirmation(orderId);

  closeModal();
  renderOrders();
  renderInvoices();
  renderDashboard();
}

/* Simulated email confirmation (would go through backend in production) */
function sendOrderConfirmation(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  const customer = DB.customers.find(c => c.id === o.customerId);
  if (!customer?.email) return;
  console.log('[email] Sending order confirmation to', customer.email, {
    orderNumber: o.orderNumber,
    total: o.total,
    status: o.orderStatus
  });
}

/* Confirmation dialog (admin variant) */
function confirmDialogAdmin({ title, message, confirmLabel, onConfirm }) {
  openModal(title, `
    <div style="padding:24px">
      <div style="font-size:14px;color:var(--ink-2);line-height:1.65">${message}</div>
    </div>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:confirmLabel || 'אשר', class:'btn-primary', action:() => { closeModal(); onConfirm && onConfirm(); } }
  ]);
}

/* ================================================================
   EDIT ORDER (for pending orders from public site)
   ================================================================ */
function editOrderModal(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  window._editOrderItems = JSON.parse(JSON.stringify(o.items || []));

  const company = DB.companies.find(c => c.id === o.companyId);
  const accounts = company?.accounts || [];
  // What the customer originally typed/picked at checkout
  const requestedCN    = o.requestedCustomerNumber || o.siteData?.customer?.customerNumber || null;
  const requestedAccId = o.siteData?.customer?.accountId || null;
  const requestedLabel = o.requestedAccountLabel    || o.siteData?.customer?.accountLabel  || null;

  // Find the requested account using the strongest signal first
  let requestedAcc = null;
  if (requestedAccId) requestedAcc = accounts.find(a => a.id === requestedAccId);
  if (!requestedAcc && requestedLabel) requestedAcc = accounts.find(a => a.label === requestedLabel);
  if (!requestedAcc && requestedCN) requestedAcc = accounts.find(a => a.customerNumber === requestedCN);

  // Make the customer's choice the SELECTED option in the dropdown
  const selectedAccountId = o.accountId || requestedAcc?.id || accounts.find(x=>x.isPrimary)?.id;
  const accountOpts = accounts.map(a => {
    const isReq = requestedAcc && a.id === requestedAcc.id;
    return `<option value="${a.id}" ${selectedAccountId === a.id ? 'selected' : ''}>${a.label} (${a.customerNumber}) · ${payTermsLabel(a.payTerms)}${isReq ? ' ← בחירת הלקוח' : ''}</option>`;
  }).join('');

  // Banner showing the customer's original request — ALWAYS shown for web orders
  const isWeb = o.source === 'web';
  let customerChoiceBanner = '';
  if (isWeb) {
    const labelDisplay = requestedLabel ? `<b>${requestedLabel}</b>` : '';
    const cnDisplay    = requestedCN ? `<span style="font-family:monospace;background:white;padding:2px 8px;border-radius:6px;border:1px solid var(--line)">${requestedCN}</span>` : '';
    let statusLine = '';
    if (requestedAcc) {
      const matched = (selectedAccountId === requestedAcc.id);
      statusLine = matched
        ? '<span style="color:var(--green-2);font-weight:700">✓ החשבון הנכון נבחר אוטומטית</span>'
        : '<span style="color:var(--orange-2);font-weight:700">⚠️ החשבון הנוכחי שונה ממה שהלקוח בחר!</span>';
    } else if (requestedCN || requestedLabel) {
      statusLine = '<span style="color:var(--orange-2);font-weight:700">⚠️ לא נמצא חשבון תואם בחברה — בחרו ידנית או הוסיפו חשבון חדש</span>';
    } else {
      statusLine = '<span style="color:var(--muted)">הלקוח לא בחר חשבון ספציפי — נבחר חשבון ברירת מחדל</span>';
    }

    // Build raw debug data — exactly what the public site sent
    const rawCustomer = o.siteData?.customer || {};
    const rawAccountIdSent = rawCustomer.accountId || '<span style="color:var(--orange-2)">לא נשלח</span>';
    const rawLabelSent = rawCustomer.accountLabel || '<span style="color:var(--orange-2)">לא נשלח</span>';
    const rawCNSent = rawCustomer.customerNumber || '<span style="color:var(--muted)">ריק</span>';

    customerChoiceBanner = `
      <div class="cm-info" style="margin:0 0 14px;background:linear-gradient(135deg,var(--green-bg),var(--paper));border-right-color:var(--green);align-items:flex-start">
        <span class="cm-info-icon">👤</span>
        <div style="flex:1">
          <div style="font-size:13.5px;color:var(--ink);margin-bottom:4px">
            <b>בחירת הלקוח בעת ההזמנה:</b>
          </div>
          <div style="font-size:13px;line-height:1.7">
            ${labelDisplay ? `שם החשבון: ${labelDisplay}<br>` : ''}
            ${cnDisplay ? `מספר לקוח: ${cnDisplay}<br>` : ''}
            ${statusLine}
          </div>
          <details style="margin-top:10px;font-size:11.5px">
            <summary style="cursor:pointer;color:var(--muted);font-weight:600">🔍 נתונים גולמיים שהתקבלו מהאתר (לאבחון)</summary>
            <div style="margin-top:6px;padding:8px 10px;background:#fafafa;border:1px solid var(--line);border-radius:6px;font-family:monospace;font-size:11px;line-height:1.7">
              <div>customerNumber: <b>${rawCNSent}</b></div>
              <div>accountId: <b>${rawAccountIdSent}</b></div>
              <div>accountLabel: <b>${rawLabelSent}</b></div>
              <div>companyAdminId: <b>${rawCustomer.companyAdminId || '<span style="color:var(--muted)">לא נשלח</span>'}</b></div>
            </div>
          </details>
        </div>
        ${requestedAcc && selectedAccountId !== requestedAcc.id ? `
          <button type="button" class="row-action row-action-primary" onclick="if(resetOrderAccountFromCustomerChoice(${orderId})){closeModal();setTimeout(()=>editOrderModal(${orderId}),120);}">
            🔄 אפס לבחירת הלקוח
          </button>
        ` : ''}
      </div>
    `;
  }

  openModal(`עריכת הזמנה ${o.orderNumber}`, `
    <form id="editOrderForm" onsubmit="saveEditedOrder(event, ${orderId})">
      <div class="cm-info" style="margin:0 0 16px">
        <span class="cm-info-icon">✏️</span>
        <p>ניתן לערוך כמויות, להסיר פריטים, להוסיף פריטים חדשים, ולבחור על איזה חשבון לזקוף את ההזמנה. <b>חשוב:</b> אם הלקוח ביקש בטלפון להוסיף משהו — תוסיפו כאן לפני האישור.</p>
      </div>

      ${customerChoiceBanner}

      <div class="form-grid">
        <div class="field"><label>חברה</label><input type="text" disabled value="${company?.name || '—'}" /></div>
        <div class="field"><label>חשבון לחיוב <span class="muted">(ברירת מחדל: בחירת הלקוח)</span></label>
          <select name="accountId">${accountOpts || '<option>—</option>'}</select>
        </div>
        <div class="field full"><label>הערות</label><textarea name="notes" rows="2">${o.notes || ''}</textarea></div>
      </div>

      <div class="cm-section-title">
        <span>פריטים בהזמנה</span>
        <button type="button" class="row-action row-action-primary" onclick="openAddItemPicker(${orderId})">+ הוסף פריט</button>
      </div>

      <div id="editOrderItems" style="padding:0 22px"></div>

      <div style="padding:16px 22px;background:var(--bg-2);border-top:1px solid var(--line);text-align:left">
        <span style="font-size:12px;color:var(--muted)">סה"כ הזמנה: </span>
        <b id="editOrderTotal" style="font-size:18px;color:var(--ink)">₪${formatNum(o.total)}</b>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'שמור שינויים', class:'btn-primary', action:() => document.getElementById('editOrderForm').requestSubmit() }
  ]);
  document.getElementById('modalCard').style.maxWidth = '720px';
  renderEditOrderItems();
}

function renderEditOrderItems() {
  const wrap = document.getElementById('editOrderItems');
  if (!wrap) return;
  const items = window._editOrderItems || [];
  if (!items.length) {
    wrap.innerHTML = '<div class="empty"><h4>אין פריטים</h4></div>';
    document.getElementById('editOrderTotal').textContent = '₪0';
    return;
  }
  let total = 0;

  // Build product options for substitution dropdown (current category preferred at top)
  wrap.innerHTML = items.map((it, i) => {
    const p = DB.products.find(x => x.id === it.pid);
    const name = p ? `${p.icon} ${p.name}` : `📦 ${it.externalName || it.name || 'פריט ללא שם'}`;
    const price = p?.price ?? it.externalPrice ?? 0;
    const status = it.status || 'delivered';

    // Calculate line total based on status
    let lineTotal = price * it.qty;
    let lineSubtotalLabel = `₪${formatNum(lineTotal)}`;
    let nameStyle = '';
    let metaExtra = '';

    if (status === 'missing') {
      lineTotal = 0;
      lineSubtotalLabel = '₪0';
      nameStyle = 'text-decoration:line-through;color:var(--muted)';
      metaExtra = '<span style="color:var(--orange-2);font-weight:700">❌ לא יסופק (חסר במלאי)</span>';
    } else if (status === 'substituted' && it.substitutedWith) {
      const sub = it.substitutedWith;
      lineTotal = (sub.price || 0) * (sub.qty || 1);
      lineSubtotalLabel = `₪${formatNum(lineTotal)} <span class="muted-cell" style="font-size:11px">(תחליף)</span>`;
      nameStyle = 'text-decoration:line-through;color:var(--muted)';
      metaExtra = `<span style="color:var(--green-2);font-weight:700">🔄 הוחלף ל: ${sub.icon || '📦'} ${sub.name} × ${sub.qty}</span>`;
    }

    total += lineTotal;

    // Build status selector + substitution picker
    const productOpts = DB.products
      .filter(x => x.id !== it.pid)
      .map(x => `<option value="${x.id}">${x.icon} ${x.name} — ₪${x.price}</option>`).join('');

    const subPickerHTML = status === 'substituted' ? `
      <div style="margin-top:8px;padding:8px;background:var(--green-bg);border-radius:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label style="font-size:12px;font-weight:700;color:var(--green-2)">🔄 תחליף:</label>
        <select onchange="setEditOrderSubstitution(${i}, this.value)" style="flex:1;min-width:200px;padding:6px;font-size:12.5px">
          <option value="">— בחרו מוצר תחליף —</option>
          ${productOpts}
        </select>
        ${it.substitutedWith ? `
          <span style="font-size:12px;color:var(--green-2)">כמות תחליף:
            <input type="number" min="1" value="${it.substitutedWith.qty}" onchange="updateEditOrderSubQty(${i}, this.value)" style="width:60px;padding:4px;font-size:12px" />
          </span>
        ` : ''}
      </div>
    ` : '';

    return `<div class="cm-card" style="margin-bottom:8px;flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%">
        <div class="cm-card-l">
          <div class="cm-card-icon">${p?.icon || '📦'}</div>
          <div>
            <div class="cm-card-title" style="${nameStyle}">${name}</div>
            <div class="cm-card-meta">₪${price} ליחידה · ${p?.unit || it.unit || '—'} ${metaExtra ? '<br>' + metaExtra : ''}</div>
          </div>
        </div>
        <div class="cm-card-r" style="display:flex;align-items:center;gap:10px">
          <div class="ci-qty" style="background:var(--bg-2);border-radius:999px;padding:2px;display:inline-flex;align-items:center">
            <button type="button" onclick="changeEditOrderQty(${i},-1)" style="width:24px;height:24px;border-radius:50%;background:var(--paper);font-weight:700">−</button>
            <span style="min-width:26px;text-align:center;font-weight:800;font-size:13px;padding:0 6px">${it.qty}</span>
            <button type="button" onclick="changeEditOrderQty(${i},1)" style="width:24px;height:24px;border-radius:50%;background:var(--paper);font-weight:700">+</button>
          </div>
          <select onchange="setEditOrderItemStatus(${i}, this.value)" style="font-size:12px;padding:6px;border-radius:6px;border:1px solid var(--line);min-width:130px">
            <option value="delivered" ${status === 'delivered' ? 'selected' : ''}>✅ זמין</option>
            <option value="missing" ${status === 'missing' ? 'selected' : ''}>❌ חסר — הסר</option>
            <option value="substituted" ${status === 'substituted' ? 'selected' : ''}>🔄 חסר — החלף</option>
          </select>
          <span class="strong-cell" style="min-width:80px;text-align:left">${lineSubtotalLabel}</span>
          <button type="button" class="row-action row-action-danger" onclick="removeEditOrderItem(${i})" title="הסר לחלוטין מההזמנה">🗑</button>
        </div>
      </div>
      ${subPickerHTML}
    </div>`;
  }).join('');
  document.getElementById('editOrderTotal').textContent = '₪' + formatNum(total);
}

function setEditOrderItemStatus(i, status) {
  const items = window._editOrderItems;
  if (!items[i]) return;
  items[i].status = status;
  if (status !== 'substituted') items[i].substitutedWith = null;
  renderEditOrderItems();
}

function setEditOrderSubstitution(i, productId) {
  const items = window._editOrderItems;
  if (!items[i] || !productId) return;
  const product = DB.products.find(p => p.id === Number(productId));
  if (!product) return;
  items[i].substitutedWith = {
    pid: product.id,
    qty: items[i].qty, // default same quantity
    price: product.price,
    name: product.name,
    icon: product.icon,
    unit: product.unit,
    cat: product.cat
  };
  renderEditOrderItems();
}

function updateEditOrderSubQty(i, qty) {
  const items = window._editOrderItems;
  if (!items[i] || !items[i].substitutedWith) return;
  items[i].substitutedWith.qty = Math.max(1, Number(qty) || 1);
  renderEditOrderItems();
}

function changeEditOrderQty(i, delta) {
  const items = window._editOrderItems;
  if (!items[i]) return;
  items[i].qty = Math.max(1, items[i].qty + delta);
  renderEditOrderItems();
}

function removeEditOrderItem(i) {
  window._editOrderItems.splice(i, 1);
  renderEditOrderItems();
}

function openAddItemPicker(orderId) {
  const productOpts = DB.products.map(p => `<option value="${p.id}">${p.name} — ₪${p.price}</option>`).join('');
  // Quick inline picker as a separate modal stacked on top
  const picker = document.createElement('div');
  picker.className = 'modal-bg open';
  picker.style.zIndex = '500';
  picker.innerHTML = `<div class="modal-card" style="max-width:460px">
    <div class="m-head"><h3>הוסף פריט להזמנה</h3>
      <button class="m-close" onclick="this.closest('.modal-bg').remove()">×</button>
    </div>
    <div class="m-body" style="padding:22px">
      <div class="field" style="margin-bottom:10px">
        <label>בחר מוצר</label>
        <select id="quickAddPid" style="padding:10px 12px;border:1.5px solid var(--line);width:100%;font-size:13px">${productOpts}</select>
      </div>
      <div class="field">
        <label>כמות</label>
        <input type="number" id="quickAddQty" value="1" min="1" style="padding:10px 12px;border:1.5px solid var(--line);width:100%;font-size:13px" />
      </div>
    </div>
    <div class="m-foot">
      <button class="btn btn-ghost" onclick="this.closest('.modal-bg').remove()">ביטול</button>
      <button class="btn btn-primary" onclick="confirmAddItem(${orderId});this.closest('.modal-bg').remove()">הוסף</button>
    </div>
  </div>`;
  document.body.appendChild(picker);
}

function confirmAddItem(orderId) {
  const pid = Number(document.getElementById('quickAddPid').value);
  const qty = Number(document.getElementById('quickAddQty').value);
  if (!pid || !qty) return;
  // Check if already in cart - if so, increment
  const existing = window._editOrderItems.find(it => it.pid === pid);
  if (existing) existing.qty += qty;
  else window._editOrderItems.push({ pid, qty });
  renderEditOrderItems();
}

function saveEditedOrder(e, orderId) {
  e.preventDefault();
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  const d = Object.fromEntries(new FormData(e.target).entries());
  o.items = window._editOrderItems;
  o.notes = d.notes;
  o.accountId = d.accountId;
  // Recalculate subtotal (לפני מע״מ)
  const subtotal = o.items.reduce((s, it) => {
    const p = DB.products.find(x => x.id === it.pid);
    const price = p?.price ?? it.externalPrice ?? 0;
    return s + price * it.qty;
  }, 0);
  // חישוב מחדש של דמי המשלוח — מכבד את בחירת ההסרה הקיימת (shippingWaived),
  // ומעריך מחדש את הסף/הפטור לפי הסכום המעודכן.
  const shipping = computeOrderShipping(o.companyId, subtotal, o.shippingWaived);
  o.subtotal = subtotal;
  o.shipping = shipping;
  o.total = subtotal + shipping;
  DB.save('orders');
  showToast('ההזמנה עודכנה');
  closeModal();
  renderOrders();
  renderDashboard();
  setTimeout(() => viewOrder(orderId), 100);
}

/* Inline status toggle directly inside the delivery-note view.
   Clicking ✓/❌/🔄 buttons on a line updates the DN's items array and re-renders. */
function setDnItemStatus(dnId, idx, status) {
  const dn = DB.deliveryNotes.find(d => d.id === dnId);
  if (!dn || dn.billed) return;
  if (!dn.items[idx]) return;
  dn.items[idx].status = status;
  if (status !== 'substituted') dn.items[idx].substitutedWith = null;
  // Recalculate DN total
  dn.total = calculateTotalsWithVat(dn.items.filter(i => i.status !== 'missing').map(i => {
    if (i.status === 'substituted' && i.substitutedWith) {
      return { ...i.substitutedWith, status: 'delivered' };
    }
    return i;
  }), dn.companyId, dn.shipping || 0).total;
  DB.save();
  // Re-open the DN to refresh
  closeModal();
  setTimeout(() => viewDeliveryNote(dnId), 100);
}

function setDnItemSubstitution(dnId, idx, productId) {
  const dn = DB.deliveryNotes.find(d => d.id === dnId);
  if (!dn || dn.billed) return;
  if (!dn.items[idx] || !productId) return;
  const product = DB.products.find(p => p.id === Number(productId));
  if (!product) return;
  dn.items[idx].substitutedWith = {
    pid: product.id,
    qty: dn.items[idx].qty,
    price: product.price,
    name: product.name,
    icon: product.icon,
    unit: product.unit,
    cat: product.cat
  };
  // Recalculate
  dn.total = calculateTotalsWithVat(dn.items.filter(i => i.status !== 'missing').map(i => {
    if (i.status === 'substituted' && i.substitutedWith) {
      return { ...i.substitutedWith, status: 'delivered' };
    }
    return i;
  }), dn.companyId, dn.shipping || 0).total;
  DB.save();
  closeModal();
  setTimeout(() => viewDeliveryNote(dnId), 100);
}

/* Open picker mode for an EXISTING delivery note (retroactive edits)
   This is for DNs that were already created and need fulfillment status updated. */
function openDeliveryNotePicker(dnId) {
  const dn = DB.deliveryNotes.find(d => d.id === dnId);
  if (!dn) return;
  if (dn.billed) {
    showToast('לא ניתן לערוך תעודה שכבר חויבה בחשבונית', 'error');
    return;
  }
  // Use the same picker UI but flagged as DN mode
  window._pickerOrderItems = JSON.parse(JSON.stringify(dn.items || []));
  window._pickerOrderId = null;          // not editing an order
  window._pickerDnId = dnId;             // editing a DN instead

  const existing = document.getElementById('pickerOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'pickerOverlay';
  overlay.className = 'picker-overlay';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  renderPickerMode();
}

/* ================================================================
   PICKER MODE — fullscreen, large-text view optimized for warehouse pickers
   on a tablet/phone. Big cards, big buttons, auto-save, progress bar.
   ================================================================ */
function openPickerMode(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  // Clone items for editing
  window._pickerOrderItems = JSON.parse(JSON.stringify(o.items || []));
  window._pickerOrderId = orderId;

  // Create fullscreen overlay
  const existing = document.getElementById('pickerOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'pickerOverlay';
  overlay.className = 'picker-overlay';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  renderPickerMode();
}

function closePickerMode(askConfirm = true) {
  const items = window._pickerOrderItems || [];
  const hasChanges = items.some(it => it.status && it.status !== 'delivered');
  if (askConfirm && hasChanges) {
    if (!confirm('יש שינויים שלא נשמרו. לסגור בכל זאת?')) return;
  }
  const overlay = document.getElementById('pickerOverlay');
  if (overlay) overlay.remove();
  document.body.style.overflow = '';
  window._pickerDnId = null;
  window._pickerOrderId = null;
}

function pickerSetStatus(idx, status) {
  const items = window._pickerOrderItems;
  if (!items[idx]) return;
  items[idx].status = status;
  if (status !== 'substituted') items[idx].substitutedWith = null;
  renderPickerMode();
}

function pickerSetSubstitution(idx, productId) {
  const items = window._pickerOrderItems;
  if (!items[idx] || !productId) return;
  const product = DB.products.find(p => p.id === Number(productId));
  if (!product) return;
  items[idx].substitutedWith = {
    pid: product.id,
    qty: items[idx].qty,
    price: product.price,
    name: product.name,
    icon: product.icon,
    unit: product.unit,
    cat: product.cat
  };
  renderPickerMode();
}

function pickerSetSubQty(idx, qty) {
  const items = window._pickerOrderItems;
  if (!items[idx] || !items[idx].substitutedWith) return;
  items[idx].substitutedWith.qty = Math.max(1, Number(qty) || 1);
  renderPickerMode();
}

function pickerSavePicking() {
  // DN editing mode (after DN was already created)
  if (window._pickerDnId) {
    const dn = DB.deliveryNotes.find(d => d.id === window._pickerDnId);
    if (!dn) return;
    dn.items = window._pickerOrderItems;
    // Recalculate the DN total
    const newTotal = calculateTotalsWithVat(dn.items.filter(i => i.status !== 'missing').map(i => {
      if (i.status === 'substituted' && i.substitutedWith) {
        return { ...i.substitutedWith, status: 'delivered' };
      }
      return i;
    }), dn.companyId, dn.shipping || 0).total;
    dn.total = newTotal;
    DB.save();
    showToast('✓ הליקוט עודכן. הסכום והמלאי בתעודה עודכנו.');
    const dnIdToReopen = window._pickerDnId;
    window._pickerDnId = null;
    closePickerMode(false);
    renderOrders();
    renderDashboard();
    setTimeout(() => viewDeliveryNote(dnIdToReopen), 200);
    return;
  }

  // Order editing mode (before DN/invoice creation)
  const o = DB.orders.find(x => x.id === window._pickerOrderId);
  if (!o) return;
  o.items = window._pickerOrderItems;
  // Recalculate the order total
  o.total = o.items
    .filter(i => i.status !== 'missing')
    .reduce((s, i) => {
      if (i.status === 'substituted' && i.substitutedWith) {
        return s + i.substitutedWith.price * i.substitutedWith.qty;
      }
      const p = DB.products.find(x => x.id === i.pid);
      const price = p?.price ?? i.externalPrice ?? i.price ?? 0;
      return s + price * i.qty;
    }, 0);
  DB.save('orders');
  showToast('✓ הליקוט נשמר. ההזמנה מעודכנת.');
  closePickerMode(false);
  renderOrders();
  setTimeout(() => viewOrder(window._pickerOrderId), 200);
}

function renderPickerMode() {
  const overlay = document.getElementById('pickerOverlay');
  if (!overlay) return;

  // Either editing an order or an existing DN
  let contextDoc, company, customer, contextLabel;
  if (window._pickerDnId) {
    const dn = DB.deliveryNotes.find(d => d.id === window._pickerDnId);
    if (!dn) { closePickerMode(false); return; }
    contextDoc = dn;
    contextLabel = 'תעודת משלוח ' + dn.number;
    company = DB.companies.find(c => c.id === dn.companyId);
    // Try to find original customer
    const order = dn.orderId ? DB.orders.find(o => o.id === dn.orderId) : null;
    customer = order ? DB.customers.find(c => c.id === order.customerId) : null;
  } else {
    const o = DB.orders.find(x => x.id === window._pickerOrderId);
    if (!o) { closePickerMode(false); return; }
    contextDoc = o;
    contextLabel = o.orderNumber;
    company = DB.companies.find(c => c.id === o.companyId);
    customer = DB.customers.find(c => c.id === o.customerId);
  }
  const o = contextDoc; // alias for downstream code
  const items = window._pickerOrderItems || [];

  // Stats
  const totalItems = items.length;
  const pickedCount = items.filter(i => i.status === 'delivered' || (!i.status)).length;
  const missingCount = items.filter(i => i.status === 'missing').length;
  const substitutedCount = items.filter(i => i.status === 'substituted').length;
  const handledCount = items.filter(i => i.status).length;
  const progressPct = totalItems > 0 ? Math.round((handledCount / totalItems) * 100) : 0;

  const subPref = o.substitutionPref || 'allow';
  const subPrefBanner = subPref === 'allow'
    ? `<div class="pk-pref pk-pref-allow">🔄 הלקוח <b>מאשר</b> תחליפים — אם פריט חסר, החליפו במוצר דומה</div>`
    : `<div class="pk-pref pk-pref-remove">❌ הלקוח <b>אינו מאשר</b> תחליפים — הסירו פריטים חסרים</div>`;

  const itemsHtml = items.map((it, idx) => {
    const p = DB.products.find(x => x.id === it.pid);
    const name = p?.name || it.externalName || it.name || 'מוצר ללא שם';
    const icon = p?.icon || '📦';
    const sku = p?.sku || (it.pid ? 'BLS-' + String(it.pid).padStart(4,'0') : '—');
    const unit = p?.unit || it.unit || 'יחידות';
    const status = it.status || null;

    // Status pill
    let statusPill = '';
    if (status === 'delivered') statusPill = '<div class="pk-status pk-status-delivered">✓ נלקט</div>';
    else if (status === 'missing') statusPill = '<div class="pk-status pk-status-missing">❌ חסר</div>';
    else if (status === 'substituted') statusPill = '<div class="pk-status pk-status-substituted">🔄 הוחלף</div>';

    // Build product picker for substitution
    const productOpts = DB.products
      .filter(x => x.id !== it.pid)
      .map(x => `<option value="${x.id}" ${it.substitutedWith?.pid === x.id ? 'selected' : ''}>${x.icon} ${x.name} — ₪${x.price}</option>`).join('');

    const subSection = status === 'substituted' ? `
      <div class="pk-sub-section">
        <div class="pk-sub-label">🔄 בחרו מוצר תחליף:</div>
        <select onchange="pickerSetSubstitution(${idx}, this.value)" class="pk-sub-select">
          <option value="">— בחרו מוצר —</option>
          ${productOpts}
        </select>
        ${it.substitutedWith ? `
          <div class="pk-sub-confirm">
            <span>✓ ${it.substitutedWith.icon || '📦'} ${it.substitutedWith.name}</span>
            <span>כמות:
              <input type="number" min="1" value="${it.substitutedWith.qty}" onchange="pickerSetSubQty(${idx}, this.value)" class="pk-sub-qty" />
            </span>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `<div class="pk-card ${status ? 'pk-card-' + status : ''}">
      <div class="pk-card-num">${idx + 1}</div>
      <div class="pk-card-body">
        <div class="pk-card-header">
          <div class="pk-card-icon">${icon}</div>
          <div class="pk-card-title">
            <h3>${name}</h3>
            <div class="pk-card-meta">
              <span class="pk-sku">${sku}</span>
              ${p?.brand ? `<span>·</span><span>${p.brand}</span>` : ''}
            </div>
          </div>
          ${statusPill}
        </div>
        <div class="pk-card-qty">
          <span class="pk-qty-label">כמות לליקוט:</span>
          <span class="pk-qty-value">${it.qty}</span>
          <span class="pk-qty-unit">${unit}</span>
        </div>
        <div class="pk-card-actions">
          <button onclick="pickerSetStatus(${idx}, 'delivered')" class="pk-btn pk-btn-delivered ${status === 'delivered' ? 'active' : ''}">
            ✓ נלקט
          </button>
          <button onclick="pickerSetStatus(${idx}, 'missing')" class="pk-btn pk-btn-missing ${status === 'missing' ? 'active' : ''}">
            ❌ חסר במלאי
          </button>
          ${subPref === 'allow' ? `
            <button onclick="pickerSetStatus(${idx}, 'substituted')" class="pk-btn pk-btn-substituted ${status === 'substituted' ? 'active' : ''}">
              🔄 החלף בדומה
            </button>
          ` : ''}
        </div>
        ${subSection}
      </div>
    </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="pk-container">
      <!-- Header -->
      <div class="pk-header">
        <div class="pk-header-l">
          <button class="pk-back" onclick="closePickerMode()" title="סגור">✕</button>
          <div>
            <div class="pk-order-num">${contextLabel}</div>
            <div class="pk-customer">${company?.name || '—'}${customer ? ' · ' + customer.name : ''}</div>
          </div>
        </div>
        <div class="pk-header-r">
          <button class="pk-print" onclick="window.print()" title="הדפס">🖨</button>
          <button class="pk-save-btn" onclick="pickerSavePicking()" ${handledCount === 0 ? 'disabled' : ''}>
            ${handledCount === 0 ? 'התחל ללקט' : `✓ סיום ליקוט (${handledCount}/${totalItems})`}
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="pk-progress-wrap">
        <div class="pk-progress-bar">
          <div class="pk-progress-fill" style="width:${progressPct}%"></div>
        </div>
        <div class="pk-progress-stats">
          <span>${handledCount}/${totalItems} פריטים טופלו</span>
          ${pickedCount > 0 ? `<span class="pk-stat-ok">✓ ${pickedCount} נלקטו</span>` : ''}
          ${missingCount > 0 ? `<span class="pk-stat-bad">❌ ${missingCount} חסרים</span>` : ''}
          ${substitutedCount > 0 ? `<span class="pk-stat-warn">🔄 ${substitutedCount} הוחלפו</span>` : ''}
        </div>
      </div>

      <!-- Customer preference banner -->
      ${subPrefBanner}

      <!-- Items grid -->
      <div class="pk-items">
        ${itemsHtml || '<div class="empty"><h4>אין פריטים בהזמנה זו</h4></div>'}
      </div>

      <!-- Bottom action bar (sticky) -->
      <div class="pk-footer">
        <button class="pk-mark-all-btn" onclick="pickerMarkAllDelivered()">✓ סמן הכל כנלקט</button>
        <button class="pk-save-btn pk-save-btn-large" onclick="pickerSavePicking()" ${handledCount === 0 ? 'disabled' : ''}>
          ✓ סיום ליקוט · שמור הזמנה
        </button>
      </div>
    </div>
  `;
}

function pickerMarkAllDelivered() {
  if (!confirm('לסמן את כל הפריטים כנלקטו?')) return;
  const items = window._pickerOrderItems;
  items.forEach(it => {
    it.status = 'delivered';
    it.substitutedWith = null;
  });
  renderPickerMode();
}

function openOrderModal() {
  const companyOpts = DB.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const productOpts = DB.products.map(p => `<option value="${p.id}">${p.name} — ₪${p.price}</option>`).join('');
  openModal('הזמנה חדשה', `
    <form id="newOrderForm" onsubmit="saveOrder(event)" style="padding:0">
      <div class="form-grid">
        <div class="field">
          <label>חברה <span class="req">*</span></label>
          <select name="companyId" id="newOrderCompany" required onchange="onOrderCompanyChange()"><option value="">בחרו חברה</option>${companyOpts}</select>
        </div>
        <div class="field" id="newOrderAccountField" style="display:none">
          <label>כרטיס חשבון <span class="req">*</span></label>
          <select name="accountId" id="newOrderAccount"></select>
          <small id="newOrderAccountHint" style="color:var(--muted);display:block;margin-top:4px">בחרו את כרטיס החשבון המתאים להזמנה זו</small>
        </div>
        <div class="field">
          <label>תאריך אספקה</label>
          <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" />
        </div>
        <div class="field full">
          <label>הערות</label>
          <textarea name="notes" rows="2" placeholder="מועד אספקה מועדף, הוראות מיוחדות..."></textarea>
        </div>
        <div class="field full">
          <label>הוסף מוצר</label>
          <div style="display:flex;gap:8px">
            <select id="newOrderProduct" style="flex:1;padding:10px 12px;border:1.5px solid var(--line)">
              <option value="">בחרו מוצר</option>${productOpts}
            </select>
            <input type="number" id="newOrderQty" value="1" min="1" style="width:80px" />
            <button type="button" class="btn btn-ghost" onclick="addOrderLine()">+</button>
          </div>
          <div id="newOrderLines" style="margin-top:10px"></div>
          <div id="newOrderTotal" style="margin-top:10px;text-align:left"></div>
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'צור הזמנה', class:'btn-primary', action:() => document.getElementById('newOrderForm').requestSubmit() }
  ]);
  window._orderLines = [];
  window._orderShipWaived = false;
}

/* חישוב דמי משלוח להזמנה (לפני מע״מ):
   מחזיר 0 אם — הלקוח פטור (company.freeShipping), או הוסר ידנית (waived),
   או שהסכום מגיע/עובר את סף המשלוח החינם, או שאין דמי משלוח מוגדרים.
   אחרת מחזיר את דמי המשלוח שהוגדרו בהגדרות החברה (shipFee). */
function computeOrderShipping(companyId, subtotal, waived) {
  const s = DB.settings || {};
  const freeShip = Number(s.freeShip) || 0;
  const shipFee  = Number(s.shipFee)  || 0;
  if (waived) return 0;
  if (!shipFee) return 0;
  if (!subtotal || subtotal <= 0) return 0;
  const company = DB.companies.find(c => c.id === companyId);
  if (company && company.freeShipping) return 0;
  if (freeShip > 0 && subtotal >= freeShip) return 0;
  return shipFee;
}

/* החלפת מצב "הסר דמי משלוח להזמנה זו" מתוך הצ'קבוקס בטופס */
function toggleOrderShipWaive(cb) {
  window._orderShipWaived = !!(cb && cb.checked);
  renderOrderLines();
}

/* בורר כרטיס-חשבון להזמנה חדשה:
   - אם לחברה הנבחרת יש יותר מחשבון אחד -> מציג בורר חובה (ברירת מחדל: חשבון isPrimary)
   - אם יש בדיוק חשבון אחד -> מסתיר את השדה; ה-accountId נקבע אוטומטית ב-saveOrder
   - אם אין חשבונות -> מסתיר את השדה; ההזמנה תישמר ללא accountId
*/
function onOrderCompanyChange() {
  const sel = document.getElementById('newOrderCompany');
  const fieldWrap = document.getElementById('newOrderAccountField');
  const accSel = document.getElementById('newOrderAccount');
  const hint = document.getElementById('newOrderAccountHint');
  if (!sel || !fieldWrap || !accSel) return;
  const companyId = Number(sel.value);
  const company = DB.companies.find(c => c.id === companyId);
  const accounts = (company && Array.isArray(company.accounts)) ? company.accounts : [];
  if (accounts.length > 1) {
    const primary = accounts.find(a => a.isPrimary) || accounts[0];
    accSel.innerHTML = accounts.map(a => {
      const numTxt = a.customerNumber ? ` (${a.customerNumber})` : '';
      const labelTxt = a.label || 'חשבון';
      const sel = (primary && a.id === primary.id) ? ' selected' : '';
      return `<option value="${a.id}"${sel}>${labelTxt}${numTxt}</option>`;
    }).join('');
    accSel.required = true;
    fieldWrap.style.display = '';
    if (hint) hint.textContent = `ללקוח זה ${accounts.length} כרטיסי חשבון - בחרו את הכרטיס לחיוב`;
  } else {
    accSel.innerHTML = '';
    accSel.required = false;
    fieldWrap.style.display = 'none';
  }
  // החברה השתנתה — ייתכן שהפטור/החיוב במשלוח השתנה, נרענן את הסיכום
  renderOrderLines();
}

function addOrderLine() {
  const pid = Number(document.getElementById('newOrderProduct').value);
  const qty = Number(document.getElementById('newOrderQty').value);
  if (!pid || !qty) return;
  window._orderLines = window._orderLines || [];
  window._orderLines.push({ pid, qty });
  renderOrderLines();
}

function removeOrderLine(idx) {
  window._orderLines.splice(idx, 1);
  renderOrderLines();
}

function renderOrderLines() {
  const lines = window._orderLines || [];
  const wrap = document.getElementById('newOrderLines');
  if (!wrap) return;
  wrap.innerHTML = lines.map((line, i) => {
    const p = DB.products.find(x => x.id === line.pid);
    if (!p) return '';
    return `<div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg);margin-bottom:4px">
      <span>${p.icon} ${p.name} × ${line.qty}</span>
      <span><b>₪${formatNum(p.price * line.qty)}</b> <button type="button" onclick="removeOrderLine(${i})" style="color:var(--danger);margin-right:8px">×</button></span>
    </div>`;
  }).join('');
  const subtotal = lines.reduce((s,l) => {
    const p = DB.products.find(x => x.id === l.pid);
    return s + (p ? p.price * l.qty : 0);
  }, 0);

  const totalEl = document.getElementById('newOrderTotal');
  if (!totalEl) return;

  const companyId = Number((document.getElementById('newOrderCompany') || {}).value) || null;
  const company   = DB.companies.find(c => c.id === companyId);
  const s         = DB.settings || {};
  const freeShip  = Number(s.freeShip) || 0;
  const shipFee   = Number(s.shipFee)  || 0;
  const waived    = !!window._orderShipWaived;
  const exempt    = !!(company && company.freeShipping);

  const shipping = computeOrderShipping(companyId, subtotal, waived);

  // שורת מצב המשלוח
  let shipRow = '';
  if (subtotal <= 0) {
    shipRow = '';
  } else if (exempt) {
    shipRow = `<div style="display:flex;justify-content:space-between;color:var(--muted);font-size:13px;padding:2px 0">
      <span>דמי משלוח</span><span>פטור — לקוח זה פטור מדמי משלוח</span></div>`;
  } else if (freeShip > 0 && subtotal >= freeShip) {
    shipRow = `<div style="display:flex;justify-content:space-between;color:#1b7a3d;font-size:13px;padding:2px 0">
      <span>דמי משלוח</span><span>משלוח חינם (מעל ₪${formatNum(freeShip)})</span></div>`;
  } else if (shipFee > 0) {
    // מתחת לסף — מציגים את דמי המשלוח עם אפשרות להסיר להזמנה זו
    shipRow = `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:2px 0">
        <span>דמי משלוח${freeShip > 0 ? ` <span style="color:var(--muted)">(מתחת לסף ₪${formatNum(freeShip)})</span>` : ''}</span>
        <b style="${waived ? 'text-decoration:line-through;color:var(--muted)' : ''}">₪${formatNum(shipFee)}</b>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted);cursor:pointer;padding:4px 0">
        <input type="checkbox" ${waived ? 'checked' : ''} onchange="toggleOrderShipWaive(this)" style="width:16px;height:16px;cursor:pointer" />
        הסר דמי משלוח להזמנה זו
      </label>`;
  }

  const total = subtotal + shipping;
  totalEl.innerHTML = `
    <div style="border-top:1px solid var(--line);margin-top:6px;padding-top:8px">
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:2px 0">
        <span>סכום ביניים</span><b>₪${formatNum(subtotal)}</b>
      </div>
      ${shipRow}
      <div style="display:flex;justify-content:space-between;font-weight:900;font-size:16px;margin-top:6px;padding-top:6px;border-top:1px solid var(--line)">
        <span>סה"כ</span><span>₪${formatNum(total)}</span>
      </div>
    </div>`;
}

function saveOrder(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const lines = window._orderLines || [];
  if (!lines.length) { showToast('הוסיפו לפחות מוצר אחד', 'error'); return; }
  const subtotal = lines.reduce((s,l) => {
    const p = DB.products.find(x => x.id === l.pid);
    return s + (p ? p.price * l.qty : 0);
  }, 0);
  const newId = Math.max(0, ...DB.orders.map(o => o.id)) + 1;
  const orderNumber = `BLS-${data.date.replace(/-/g,'')}-${String(newId).padStart(3,'0')}`;

  // קביעת accountId: אם נבחר בטופס - השתמש בו. אחרת, בחירה אוטומטית של החשבון הראשי / היחיד.
  const companyId = Number(data.companyId);
  const company = DB.companies.find(c => c.id === companyId);
  const companyAccounts = (company && Array.isArray(company.accounts)) ? company.accounts : [];
  let accountId = data.accountId || null;
  if (!accountId && companyAccounts.length) {
    const primary = companyAccounts.find(a => a.isPrimary) || companyAccounts[0];
    accountId = primary ? primary.id : null;
  }
  // אם נדרשה בחירה (יותר מחשבון אחד) אך לא נבחר - חוסם שמירה
  if (companyAccounts.length > 1 && !data.accountId) {
    showToast('יש לבחור כרטיס חשבון', 'error');
    return;
  }

  // דמי משלוח: מתווספים אוטומטית מתחת לסף משלוח חינם, אלא אם הלקוח פטור או הוסרו ידנית.
  // o.total נשמר לפני מע״מ (כמו ביתר ההזמנות); המע״מ מתווסף בתעודה/בחשבונית.
  const shippingWaived = !!window._orderShipWaived;
  const shipping = computeOrderShipping(companyId, subtotal, shippingWaived);
  const total = subtotal + shipping;

  DB.orders.push({
    id:newId, orderNumber, companyId, customerId:null,
    accountId,
    date:data.date, items:lines, total, subtotal, shipping, shippingWaived,
    payStatus:'pending', orderStatus:'pending', notes:data.notes
  });
  DB.save('orders');
  closeModal();
  renderOrders();
  renderDashboard();
  showToast('ההזמנה נוצרה בהצלחה');
}

function exportOrders() { showToast('בדמו: ייצוא לאקסל זמין בגרסה המסחרית'); }
function exportDeliveryNotes() { showToast('בדמו: ייצוא לאקסל זמין בגרסה המסחרית'); }

/* ---------- COMPANIES ---------- */
function renderCompanies() {
  const tbody = document.querySelector('#companiesTable tbody');
  const search = document.getElementById('companiesSearch').value.trim().toLowerCase();
  let list = DB.companies.slice();
  if (search) list = list.filter(c => c.name.toLowerCase().includes(search) || (c.taxId && c.taxId.includes(search)));
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><h4>אין חברות להצגה</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => {
    const contactCount = DB.customers.filter(x => userHasAccessToCompany(x, c.id)).length;
    const debt = DB.invoices.filter(inv => inv.companyId === c.id).reduce((s,i) => s + (i.amount - i.paid), 0);
    const branches = c.branches || [];
    const accounts = c.accounts || [];
    const primaryAccount = accounts.find(a => a.isPrimary) || accounts[0] || {};
    const customerNumber = primaryAccount.customerNumber || c.customerNumber || '—';
    const branchBadge = branches.length > 1 ? `<span class="pill pill-info" style="margin-right:4px">🏢 ${branches.length} סניפים</span>` : '';
    const accountBadge = accounts.length > 1 ? `<span class="pill pill-warn" style="margin-right:4px">💳 ${accounts.length} חשבונות</span>` : '';
    const pendingBadge = c.pending ? '<span class="pill pill-danger" style="margin-right:4px;cursor:pointer" onclick="reviewPendingCompany(' + c.id + ')" title="חברה חדשה מהאתר — דרושה בדיקה">⚠️ ממתין לבדיקה</span>' : '';
    return `<tr>
      <td class="strong-cell">${c.name} <span class="muted-cell" style="font-weight:400">${customerNumber}</span><div style="margin-top:4px">${pendingBadge}${branchBadge}${accountBadge}</div></td>
      <td class="muted-cell">${c.taxId}</td>
      <td>${c.city}</td>
      <td class="muted-cell">${c.address}</td>
      <td>${contactCount}</td>
      <td>${payTermsLabel(primaryAccount.payTerms || c.payTerms)}</td>
      <td class="${debt > 0 ? 'price-cell' : 'muted-cell'}" style="color:${debt > 0 ? 'var(--orange-2)' : ''}">${debt > 0 ? '₪' + formatNum(debt) : '—'}</td>
      <td>
        ${c.pending ? `<button class="row-action row-action-primary" style="background:var(--orange);color:var(--paper);border-color:var(--orange)" onclick="reviewPendingCompany(${c.id})">⚠️ בדוק לקוח</button>` : ''}
        <button class="row-action row-action-primary" onclick="openLedger(${c.id})">📒 כרטסת</button>
        <button class="row-action" onclick="openBaselinePhotos(${c.id})" title="תמונות Baseline ל-AI">📷 ${(c.baselinePhotos || []).length}</button>
        <button class="row-action" onclick="openCompanyModal(${c.id})">עריכה</button>
        <button class="row-action row-action-danger" onclick="deleteCompany(${c.id})">×</button>
      </td>
    </tr>`;
  }).join('');

  // also populate filter dropdown in customers
  const filterSel = document.getElementById('customersCompanyFilter');
  if (filterSel) {
    filterSel.innerHTML = '<option value="all">כל החברות</option>' + DB.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

/* Helper: check if customer has access to a company */
function userHasAccessToCompany(customer, companyId) {
  if (!customer) return false;
  if (customer.companyId === companyId) return true;
  return (customer.accessList || []).some(a => a.companyId === companyId);
}

let _companyModalTab = 'details';

function openCompanyModal(id) {
  const c = id ? DB.companies.find(x => x.id === id) : null;
  _companyModalTab = 'details';

  // Ensure new structure
  if (c && !c.branches) c.branches = [{ id:'b1', label:'משרד יחיד', address:c.address, phone:c.phone, isPrimary:true }];
  if (c && !c.accounts) c.accounts = [{ id:'a1', customerNumber:c.customerNumber||'', label:'חשבון ראשי', payTerms:c.payTerms||'credit', creditLimit:c.creditLimit||0, isPrimary:true }];

  const headerTitle = c ? `עריכת חברה — ${c.name}` : 'חברה חדשה';
  const tabs = c ? `
    <div class="cm-tabs">
      <button class="cm-tab active" data-tab="details" onclick="switchCompanyTab('details',${id})">פרטי חברה</button>
      <button class="cm-tab" data-tab="branches" onclick="switchCompanyTab('branches',${id})">🏢 סניפים <span class="cm-tab-badge">${(c.branches||[]).length}</span></button>
      <button class="cm-tab" data-tab="accounts" onclick="switchCompanyTab('accounts',${id})">💳 חשבונות <span class="cm-tab-badge">${(c.accounts||[]).length}</span></button>
      <button class="cm-tab" data-tab="users" onclick="switchCompanyTab('users',${id})">👥 משתמשים מורשים <span class="cm-tab-badge">${DB.customers.filter(u => userHasAccessToCompany(u, id)).length}</span></button>
    </div>
  ` : '';

  openModal(headerTitle, `
    ${tabs}
    <div id="cmTabContent">${renderCompanyDetailsTab(c, id)}</div>
  `, [
    { label:'סגירה', class:'btn-ghost', action:closeModal }
  ]);

  document.getElementById('modalCard').style.maxWidth = '780px';
}

function switchCompanyTab(tab, id) {
  _companyModalTab = tab;
  const c = DB.companies.find(x => x.id === id);
  document.querySelectorAll('.cm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const wrap = document.getElementById('cmTabContent');
  if (tab === 'details') wrap.innerHTML = renderCompanyDetailsTab(c, id);
  if (tab === 'branches') wrap.innerHTML = renderCompanyBranchesTab(c, id);
  if (tab === 'accounts') wrap.innerHTML = renderCompanyAccountsTab(c, id);
  if (tab === 'users') wrap.innerHTML = renderCompanyUsersTab(c, id);
}

/* TAB: פרטי חברה */
function renderCompanyDetailsTab(c, id) {
  return `
    <form id="companyForm" onsubmit="saveCompany(event, ${id || 'null'})">
      <div class="form-grid">
        <div class="field"><label>שם החברה <span class="req">*</span></label><input type="text" name="name" required value="${c?.name || ''}" /></div>
        <div class="field"><label>ח.פ <span class="req">*</span></label><input type="text" name="taxId" required value="${c?.taxId || ''}" /></div>
        <div class="field"><label>טלפון ראשי</label><input type="text" name="phone" value="${c?.phone || ''}" /></div>
        <div class="field"><label>דוא"ל ראשי</label><input type="email" name="email" value="${c?.email || ''}" /></div>
        <div class="field"><label>כתובת ראשית</label><input type="text" name="address" value="${c?.address || ''}" /></div>
        <div class="field"><label>עיר</label>
          <select name="city">
            ${['תל אביב','רמת גן','פתח תקווה','בני ברק','גבעת שמואל','גבעתיים','הרצליה','רמת השרון','הוד השרון'].map(city => `<option ${c?.city === city ? 'selected' : ''}>${city}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>מיקוד</label><input type="text" name="zip" value="${c?.zip || ''}" /></div>
        <div class="field full"><label>הערות כלליות</label><textarea name="notes" rows="2">${c?.notes || ''}</textarea></div>
        <div class="field full" style="margin-top:4px">
          <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:12px 14px;background:var(--bg);border:1.5px solid var(--line);border-radius:8px">
            <input type="checkbox" name="freeShipping" ${c?.freeShipping ? 'checked' : ''} style="width:18px;height:18px;margin-top:2px;flex:none;cursor:pointer" />
            <span>
              <b style="display:block">פטור מדמי משלוח</b>
              <span style="font-size:12px;color:var(--muted)">לא יתווספו דמי משלוח להזמנות של לקוח זה — גם כשההזמנה נמוכה מסף משלוח חינם (₪${formatNum((DB.settings || {}).freeShip || 0)}).</span>
            </span>
          </label>
        </div>
      </div>
      <div class="cm-foot"><button type="submit" class="btn btn-primary">שמור פרטים</button></div>
    </form>
  `;
}

/* TAB: סניפים */
function renderCompanyBranchesTab(c, id) {
  const branches = c.branches || [];
  return `
    <div class="cm-info">
      <span class="cm-info-icon">🏢</span>
      <p><b>סניפים</b> — חברה יכולה לכלול כמה משרדים פיזיים, כל סניף עם כתובת וטלפון משלו. ההזמנות יישלחו לכתובת הסניף הספציפי שנבחר.</p>
    </div>
    <div class="cm-list">
      ${branches.length ? branches.map((b, i) => `
        <div class="cm-card">
          <div class="cm-card-l">
            <div class="cm-card-icon">🏢</div>
            <div>
              <div class="cm-card-title">${b.label} ${b.isPrimary ? '<span class="pill pill-success" style="margin-right:6px">ראשי</span>' : ''}</div>
              <div class="cm-card-meta">${b.address || '—'} · ${b.phone || '—'}</div>
            </div>
          </div>
          <div class="cm-card-r">
            <button class="row-action" onclick="editBranch(${id},'${b.id}')">עריכה</button>
            ${branches.length > 1 ? `<button class="row-action row-action-danger" onclick="deleteBranch(${id},'${b.id}')">×</button>` : ''}
          </div>
        </div>
      `).join('') : '<div class="empty"><h4>אין סניפים מוגדרים</h4></div>'}
    </div>
    <div class="cm-foot"><button class="btn btn-primary" onclick="editBranch(${id},null)">+ הוסף סניף</button></div>
  `;
}

function editBranch(companyId, branchId) {
  const c = DB.companies.find(x => x.id === companyId);
  const b = branchId ? c.branches.find(x => x.id === branchId) : null;
  openModal(b ? 'עריכת סניף' : 'סניף חדש', `
    <form id="branchForm" onsubmit="saveBranch(event, ${companyId}, ${branchId ? "'" + branchId + "'" : 'null'})">
      <div class="form-grid">
        <div class="field full"><label>שם הסניף <span class="req">*</span></label><input type="text" name="label" required value="${b?.label || ''}" placeholder="לדוגמה: סניף ת״א — דיזנגוף" /></div>
        <div class="field full"><label>כתובת מלאה</label><input type="text" name="address" value="${b?.address || ''}" placeholder="רחוב, מספר, עיר" /></div>
        <div class="field"><label>טלפון</label><input type="text" name="phone" value="${b?.phone || ''}" /></div>
        <div class="field"><label class="check" style="cursor:pointer;display:flex;gap:8px;align-items:center;padding-top:8px">
          <input type="checkbox" name="isPrimary" ${b?.isPrimary ? 'checked' : ''} />
          <span>סניף ראשי</span>
        </label></div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => openCompanyModal(companyId), 100); _companyModalTab='branches'; } },
    { label:'שמור', class:'btn-primary', action:() => document.getElementById('branchForm').requestSubmit() }
  ]);
}

function saveBranch(e, companyId, branchId) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  d.isPrimary = !!d.isPrimary;
  const c = DB.companies.find(x => x.id === companyId);
  if (!c.branches) c.branches = [];
  if (d.isPrimary) c.branches.forEach(b => b.isPrimary = false);
  if (branchId) {
    Object.assign(c.branches.find(b => b.id === branchId), d);
    showToast('הסניף עודכן');
  } else {
    const newId = 'b' + (Math.max(0, ...c.branches.map(b => parseInt(b.id.replace('b','')) || 0)) + 1);
    c.branches.push({ id:newId, ...d });
    showToast('סניף נוסף');
  }
  DB.save('companies');
  closeModal();
  setTimeout(() => { openCompanyModal(companyId); switchCompanyTab('branches', companyId); }, 100);
}

function deleteBranch(companyId, branchId) {
  if (!confirm('למחוק את הסניף? פעולה זו לא תמחק הזמנות עבר.')) return;
  const c = DB.companies.find(x => x.id === companyId);
  c.branches = c.branches.filter(b => b.id !== branchId);
  DB.save('companies');
  switchCompanyTab('branches', companyId);
  showToast('הסניף נמחק');
}

/* TAB: חשבונות */
function renderCompanyAccountsTab(c, id) {
  const accounts = c.accounts || [];
  return `
    <div class="cm-info">
      <span class="cm-info-icon">💳</span>
      <p><b>חשבונות (מספרי לקוח)</b> — חברה יכולה לכלול כמה חשבונות נפרדים, כל אחד עם מספר לקוח ייחודי, תנאי תשלום ומסגרת אשראי משלו. <b>שימוש נפוץ:</b> חשבון נפרד למזון ולניקיון, כל אחד עם תנאים שונים. <b>אין הגבלת מוצרים</b> — בעת הזמנה הלקוח בוחר על איזה חשבון לזקוף כל פריט.</p>
    </div>
    <div class="cm-list">
      ${accounts.length ? accounts.map(a => {
        const restrictBadge = a.restricted
          ? `<span class="pill pill-warn" style="margin-right:6px">🔒 מוגבל: ${(a.allowedCategories || []).map(k => CAT_NAMES[k] || k).join(', ') || 'ללא קטגוריות'}</span>`
          : '';
        return `
        <div class="cm-card">
          <div class="cm-card-l">
            <div class="cm-card-icon">💳</div>
            <div>
              <div class="cm-card-title">${a.label} ${a.isPrimary ? '<span class="pill pill-success" style="margin-right:6px">ראשי</span>' : ''}</div>
              <div class="cm-card-meta">
                <b style="color:var(--ink)">${a.customerNumber}</b> · ${payTermsLabel(a.payTerms)} · מסגרת ₪${formatNum(a.creditLimit)}
              </div>
              ${restrictBadge ? `<div style="margin-top:4px">${restrictBadge}</div>` : ''}
            </div>
          </div>
          <div class="cm-card-r">
            <button class="row-action" onclick="editAccount(${id},'${a.id}')">עריכה</button>
            ${accounts.length > 1 ? `<button class="row-action row-action-danger" onclick="deleteAccount(${id},'${a.id}')">×</button>` : ''}
          </div>
        </div>
      `;}).join('') : '<div class="empty"><h4>אין חשבונות</h4></div>'}
    </div>
    <div class="cm-foot"><button class="btn btn-primary" onclick="editAccount(${id},null)">+ הוסף חשבון נוסף</button></div>
  `;
}

function editAccount(companyId, accountId) {
  const c = DB.companies.find(x => x.id === companyId);
  const a = accountId ? c.accounts.find(x => x.id === accountId) : null;

  const restricted = !!a?.restricted;
  const allowedCats = a?.allowedCategories || [];
  const catChips = Object.entries(CAT_NAMES).map(([k, n]) =>
    `<label class="cm-cat-chip ${allowedCats.includes(k) ? 'active' : ''}">
      <input type="checkbox" name="cat_${k}" ${allowedCats.includes(k) ? 'checked' : ''} />
      <span>${n}</span>
    </label>`
  ).join('');

  openModal(a ? 'עריכת חשבון' : 'חשבון חדש', `
    <form id="accountForm" onsubmit="saveAccount(event, ${companyId}, ${accountId ? "'" + accountId + "'" : 'null'})">
      <div class="cm-info" style="margin:0 0 14px">
        <span class="cm-info-icon">💡</span>
        <p>החשבון משמש <b>למטרות חיוב</b> — תנאי תשלום, מספר לקוח ומסגרת אשראי. <b>ברירת מחדל</b>: החשבון פתוח לכל המוצרים. <b>אופציונלי</b>: ניתן להגדיר שהחשבון יוגבל לקטגוריות מסוימות (לדוגמה: חשבון פירות וירקות בלבד).</p>
      </div>
      <div class="form-grid">
        <div class="field"><label>שם תיוג <span class="req">*</span></label><input type="text" name="label" required value="${a?.label || ''}" placeholder="לדוגמה: חשבון מזון" /></div>
        <div class="field"><label>מספר לקוח <span class="req">*</span></label><input type="text" name="customerNumber" required value="${a?.customerNumber || ''}" placeholder="C-1010" /></div>
        <div class="field"><label>תנאי תשלום</label>
          <select name="payTerms">
            <option value="credit" ${a?.payTerms === 'credit' ? 'selected' : ''}>אשראי / מזומן</option>
            <option value="net30" ${a?.payTerms === 'net30' ? 'selected' : ''}>שוטף + 30</option>
          </select>
        </div>
        <div class="field"><label>מסגרת אשראי (₪)</label><input type="number" name="creditLimit" value="${a?.creditLimit || 0}" /></div>
        <div class="field full"><label class="check" style="cursor:pointer;padding-top:6px">
          <input type="checkbox" name="isPrimary" ${a?.isPrimary ? 'checked' : ''} /> <span>סמן כחשבון ראשי (ברירת המחדל בעת הזמנה)</span>
        </label></div>

        <div class="field full" style="margin-top:8px;border-top:1px dashed var(--line);padding-top:14px">
          <label class="check" style="cursor:pointer">
            <input type="checkbox" id="restrictToggle" name="restricted" ${restricted ? 'checked' : ''} onchange="toggleRestrictionUI()" />
            <span>
              <b>הגבל חשבון לקטגוריות מסוימות</b>
              <div style="font-size:11.5px;color:var(--muted);margin-top:2px">לדוגמה: חשבון "פירות וירקות בלבד" שיאפשר רק קטגוריה זו</div>
            </span>
          </label>
        </div>
        <div class="field full" id="restrictionWrap" style="${restricted ? '' : 'display:none'}">
          <label>קטגוריות מותרות בחשבון זה</label>
          <div class="cm-cat-chips">${catChips}</div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:6px">ניתן לסמן יותר מקטגוריה אחת. אם לא תסמן כלום והגבלה פעילה — החשבון לא יאפשר אף מוצר.</div>
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => openCompanyModal(companyId), 100); _companyModalTab='accounts'; } },
    { label:'שמור', class:'btn-primary', action:() => document.getElementById('accountForm').requestSubmit() }
  ]);
}

function toggleRestrictionUI() {
  const wrap = document.getElementById('restrictionWrap');
  if (!wrap) return;
  wrap.style.display = document.getElementById('restrictToggle').checked ? '' : 'none';
}

function saveAccount(e, companyId, accountId) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const c = DB.companies.find(x => x.id === companyId);
  if (!c.accounts) c.accounts = [];
  const isPrimary = !!d.isPrimary;
  if (isPrimary) c.accounts.forEach(a => a.isPrimary = false);
  const restricted = !!d.restricted;
  const allowedCategories = restricted
    ? Object.keys(d).filter(k => k.startsWith('cat_')).map(k => k.replace('cat_', ''))
    : [];
  const payload = {
    label: d.label,
    customerNumber: d.customerNumber,
    payTerms: d.payTerms,
    creditLimit: Number(d.creditLimit) || 0,
    isPrimary,
    restricted,
    allowedCategories
  };
  if (accountId) {
    Object.assign(c.accounts.find(a => a.id === accountId), payload);
    showToast('החשבון עודכן');
  } else {
    const newId = 'a' + (Math.max(0, ...c.accounts.map(a => parseInt(a.id.replace('a','')) || 0)) + 1);
    c.accounts.push({ id:newId, ...payload });
    showToast('חשבון נוסף');
  }
  DB.save('companies');
  closeModal();
  setTimeout(() => { openCompanyModal(companyId); switchCompanyTab('accounts', companyId); }, 100);
}

function deleteAccount(companyId, accountId) {
  if (!confirm('למחוק את החשבון? לא תהיה השפעה על חשבוניות עבר.')) return;
  const c = DB.companies.find(x => x.id === companyId);
  c.accounts = c.accounts.filter(a => a.id !== accountId);
  DB.save('companies');
  switchCompanyTab('accounts', companyId);
  showToast('החשבון נמחק');
}

/* TAB: משתמשים מורשים */
function renderCompanyUsersTab(c, id) {
  const authorized = DB.customers.filter(u => userHasAccessToCompany(u, id));
  const branches = c.branches || [];
  const accounts = c.accounts || [];
  return `
    <div class="cm-info">
      <span class="cm-info-icon">👥</span>
      <p><b>משתמשים מורשים</b> — אנשי הקשר שמורשים לבצע הזמנות עבור החברה. אפשר להגביל לפי סניף ולפי חשבון, ולתת תפקיד שונה (מזמין / מאשר / צופה בלבד).</p>
    </div>
    <div class="cm-list">
      ${authorized.length ? authorized.map(u => {
        const access = (u.accessList || []).filter(a => a.companyId === id);
        return `
        <div class="cm-card">
          <div class="cm-card-l">
            <div class="cm-card-icon">${u.name[0]}</div>
            <div>
              <div class="cm-card-title">${u.name} <span class="pill pill-info" style="margin-right:6px">${u.role || 'איש קשר'}</span></div>
              <div class="cm-card-meta">${u.email} · ${access.length} הרשאות</div>
              <div class="cm-access-tags" style="margin-top:6px">
                ${access.map(a => {
                  const branch = branches.find(b => b.id === a.branchId);
                  const acc = accounts.find(x => x.id === a.accountId);
                  const roleColor = a.role === 'approver' ? 'pill-warn' : (a.role === 'viewer' ? 'pill-neutral' : 'pill-success');
                  const roleName = a.role === 'approver' ? '✓ מאשר נוסף' : (a.role === 'viewer' ? '👁 צופה' : '🛒 מזמין');
                  return `<span class="pill ${roleColor}" style="margin-left:4px">${branch?.label || '—'} · ${acc?.label || '—'} · ${roleName}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
          <div class="cm-card-r">
            <button class="row-action" onclick="openCustomerModal(${u.id})">עריכה</button>
          </div>
        </div>
      `;}).join('') : '<div class="empty"><h4>אין משתמשים מורשים</h4></div>'}
    </div>
    <div class="cm-foot"><button class="btn btn-primary" onclick="openCustomerModal(null, ${id})">+ הוסף משתמש מורשה</button></div>
  `;
}

function saveCompany(e, id) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  // checkbox: FormData משמיט שדה שאינו מסומן — נמיר תמיד לבוליאני מפורש
  d.freeShipping = (d.freeShipping === 'on' || d.freeShipping === true);
  if (id) {
    Object.assign(DB.companies.find(c => c.id === id), d);
    showToast('פרטי החברה עודכנו');
  } else {
    const newId = Math.max(0, ...DB.companies.map(c => c.id)) + 1;
    DB.companies.push({
      id:newId, ...d, addedAt: new Date().toISOString().split('T')[0],
      branches:[{ id:'b1', label:'משרד יחיד', address:d.address, phone:d.phone, isPrimary:true }],
      accounts:[{ id:'a1', customerNumber:'C-' + (1000 + newId), label:'חשבון ראשי', payTerms:'credit', creditLimit:5000, isPrimary:true }]
    });
    showToast('החברה נוספה');
  }
  DB.save('companies');
  renderCompanies();
  if (id) {
    setTimeout(() => openCompanyModal(id), 100);
  } else {
    closeModal();
  }
}

/* ================================================================
   REVIEW PENDING COMPANY (auto-created from website orders)
   ================================================================ */
function reviewPendingCompany(companyId) {
  const c = DB.companies.find(x => x.id === companyId);
  if (!c) return;
  // Build "merge with existing" options — exclude pending companies and self
  const otherCompanies = DB.companies
    .filter(x => x.id !== companyId && !x.pending)
    .sort((a, b) => a.name.localeCompare(b.name));
  const compOpts = otherCompanies.map(x => `<option value="${x.id}">${x.name} · ${x.taxId || '—'} · ${x.city || '—'}</option>`).join('');
  const ordersFromCompany = DB.orders.filter(o => o.companyId === companyId);
  const invoicesFromCompany = DB.invoices.filter(i => i.companyId === companyId);
  const dnsFromCompany = DB.deliveryNotes.filter(d => d.companyId === companyId);
  const customersFromCompany = DB.customers.filter(u => userHasAccessToCompany(u, companyId));

  openModal(`בדיקת לקוח חדש — ${c.name}`, `
    <div style="padding:0">
      <div class="cm-info" style="margin:18px 22px">
        <span class="cm-info-icon">⚠️</span>
        <p>לקוח זה <b>נוצר אוטומטית</b> מהזמנה שהתקבלה באתר הציבורי. המערכת לא הצליחה להתאים אותו ללקוח קיים, וצריך שתחליט: <b>האם זה לקוח חדש או שזה לקוח קיים שצריך למזג איתו?</b></p>
      </div>

      <!-- Customer details -->
      <div style="padding:0 22px 14px">
        <h4 style="font-size:12px;font-weight:800;color:var(--ink);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">פרטי הלקוח שהוזנו באתר</h4>
        <div class="cm-card">
          <div class="cm-card-l" style="flex:1">
            <div class="cm-card-icon">${(c.name || '?')[0]}</div>
            <div style="flex:1">
              <div class="cm-card-title">${c.name || '—'}</div>
              <div class="cm-card-meta" style="line-height:1.7">
                ${c.taxId ? `ח.פ: <b>${c.taxId}</b><br>` : '<i>ח.פ לא הוזן</i><br>'}
                ${c.email ? `📧 ${c.email}<br>` : ''}
                ${c.phone ? `📞 ${c.phone}<br>` : ''}
                ${c.address ? `📍 ${c.address}, ${c.city || ''}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity from this company -->
      <div style="padding:0 22px 14px">
        <h4 style="font-size:12px;font-weight:800;color:var(--ink);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">פעילות שכבר נכנסה למערכת</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px">
          <div class="kpi-card" style="padding:12px"><div class="kpi-info"><span class="kpi-label">הזמנות</span><b class="kpi-value" style="font-size:18px">${ordersFromCompany.length}</b></div></div>
          <div class="kpi-card" style="padding:12px"><div class="kpi-info"><span class="kpi-label">תעודות משלוח</span><b class="kpi-value" style="font-size:18px">${dnsFromCompany.length}</b></div></div>
          <div class="kpi-card" style="padding:12px"><div class="kpi-info"><span class="kpi-label">חשבוניות</span><b class="kpi-value" style="font-size:18px">${invoicesFromCompany.length}</b></div></div>
          <div class="kpi-card" style="padding:12px"><div class="kpi-info"><span class="kpi-label">אנשי קשר</span><b class="kpi-value" style="font-size:18px">${customersFromCompany.length}</b></div></div>
        </div>
      </div>

      <!-- Action: Approve as new -->
      <div style="padding:0 22px;border-top:1px solid var(--line);padding-top:14px;margin-top:8px">
        <h4 style="font-size:12px;font-weight:800;color:var(--green-2);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">אופציה א' — אישור כלקוח חדש</h4>
        <div class="cm-card" style="background:var(--green-bg);border-color:var(--green-soft)">
          <div class="cm-card-l" style="flex:1">
            <div class="cm-card-icon" style="background:var(--green);color:var(--paper)">✓</div>
            <div style="flex:1">
              <div class="cm-card-title">זה לקוח חדש שלא היה אצלי לפני כן</div>
              <div class="cm-card-meta">המערכת תאשר את הלקוח, תסיר את התווית "ממתין לבדיקה", ותשאיר את כל הפרטים כפי שהם. תוכל אחר כך לעדכן ידנית פרטים חסרים (תנאי תשלום, מסגרת אשראי וכו').</div>
            </div>
          </div>
          <div class="cm-card-r">
            <button class="btn btn-primary btn-sm" onclick="approveAsNewCompany(${companyId})">✓ אשר לקוח חדש</button>
          </div>
        </div>
      </div>

      <!-- Action: Merge -->
      ${otherCompanies.length ? `
        <div style="padding:14px 22px 22px">
          <h4 style="font-size:12px;font-weight:800;color:var(--orange-2);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">אופציה ב' — מיזוג עם לקוח קיים</h4>
          <div class="cm-card" style="background:var(--orange-bg);border-color:var(--orange);flex-direction:column;align-items:stretch">
            <div class="cm-card-l">
              <div class="cm-card-icon" style="background:var(--orange);color:var(--paper)">⇄</div>
              <div style="flex:1">
                <div class="cm-card-title">זה אותו לקוח כמו אחד שכבר קיים אצלי</div>
                <div class="cm-card-meta">לדוגמה: הוזן "David Balasi" אבל הלקוח כבר קיים בשם "בלסי דיוויד בע״מ". המערכת תעביר את כל ההזמנות, תעודות המשלוח, החשבוניות ואנשי הקשר ללקוח הקיים, ותמחק את הרשומה הכפולה.</div>
              </div>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;align-items:flex-end">
              <div class="field" style="flex:1">
                <label>בחר לקוח קיים למיזוג</label>
                <select id="mergeTargetSelect">
                  <option value="">— בחר —</option>${compOpts}
                </select>
              </div>
              <button class="btn btn-pop btn-sm" style="background:var(--orange);color:var(--paper)" onclick="mergeIntoExisting(${companyId})">⇄ מזג</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Action: Reject -->
      <div style="padding:0 22px 22px;border-top:1px solid var(--line);padding-top:14px">
        <h4 style="font-size:12px;font-weight:800;color:var(--danger);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">אופציה ג' — דחיית ההזמנה</h4>
        <div class="cm-card" style="background:var(--danger-bg);border-color:var(--danger)">
          <div class="cm-card-l" style="flex:1">
            <div class="cm-card-icon" style="background:var(--danger);color:var(--paper)">✕</div>
            <div style="flex:1">
              <div class="cm-card-title">לא לקבל את ההזמנה (ספאם / טעות / חשד להונאה)</div>
              <div class="cm-card-meta">תימחק החברה והזמנותיה. השתמש רק אם ברור שזה לא לקוח אמיתי.</div>
            </div>
          </div>
          <div class="cm-card-r">
            <button class="btn btn-danger btn-sm" onclick="rejectPendingCompany(${companyId})">✕ דחה ומחק</button>
          </div>
        </div>
      </div>
    </div>
  `, [
    { label:'סגור (החלט אחר כך)', class:'btn-ghost', action:closeModal }
  ]);
  document.getElementById('modalCard').style.maxWidth = '780px';
}

function approveAsNewCompany(companyId) {
  if (!confirm('לאשר את הלקוח החדש? פרטיו יישארו כפי שהם.')) return;
  const c = DB.companies.find(x => x.id === companyId);
  if (!c) return;
  delete c.pending;
  // Also clear pending flag on auto-created customers
  DB.customers.filter(u => userHasAccessToCompany(u, companyId)).forEach(u => delete u.pending);
  DB.save();
  renderCompanies();
  renderCustomers();
  renderOrders();
  renderDashboard();
  closeModal();
  showToast(`✓ ${c.name} אושר כלקוח חדש`);
}

function mergeIntoExisting(pendingCompanyId) {
  const targetId = Number(document.getElementById('mergeTargetSelect').value);
  if (!targetId) { showToast('בחר לקוח למיזוג', 'error'); return; }
  const pendingCompany = DB.companies.find(x => x.id === pendingCompanyId);
  const targetCompany = DB.companies.find(x => x.id === targetId);
  if (!pendingCompany || !targetCompany) return;

  if (!confirm(`למזג את "${pendingCompany.name}" עם "${targetCompany.name}"?\n\nכל ההזמנות, תעודות המשלוח, החשבוניות ואנשי הקשר יועברו ללקוח הקיים, והרשומה הכפולה תימחק.\n\nפעולה זו אינה הפיכה.`)) return;

  // Find target's primary branch and primary account for orphan items
  const targetBranch = (targetCompany.branches || []).find(b => b.isPrimary) || (targetCompany.branches || [])[0];
  const targetAccount = (targetCompany.accounts || []).find(a => a.isPrimary) || (targetCompany.accounts || [])[0];

  // Transfer orders
  DB.orders.filter(o => o.companyId === pendingCompanyId).forEach(o => {
    o.companyId = targetId;
    o.accountId = targetAccount?.id;
  });
  // Transfer invoices
  DB.invoices.filter(i => i.companyId === pendingCompanyId).forEach(i => {
    i.companyId = targetId;
    i.accountId = targetAccount?.id;
  });
  // Transfer delivery notes
  DB.deliveryNotes.filter(d => d.companyId === pendingCompanyId).forEach(d => {
    d.companyId = targetId;
    d.accountId = targetAccount?.id;
  });
  // Transfer receipts
  DB.receipts.filter(r => r.companyId === pendingCompanyId).forEach(r => { r.companyId = targetId; });
  // Transfer credits
  DB.credits.filter(cr => cr.companyId === pendingCompanyId).forEach(cr => { cr.companyId = targetId; });

  // Transfer customers (contacts)
  DB.customers.forEach(u => {
    if (u.companyId === pendingCompanyId) u.companyId = targetId;
    if (u.accessList) {
      u.accessList.forEach(a => {
        if (a.companyId === pendingCompanyId) {
          a.companyId = targetId;
          a.branchId = targetBranch?.id;
          a.accountId = targetAccount?.id;
        }
      });
    }
    delete u.pending;
  });

  // Remove the pending company
  DB.companies = DB.companies.filter(x => x.id !== pendingCompanyId);
  DB.save();
  renderCompanies();
  renderCustomers();
  renderOrders();
  renderInvoices();
  renderDashboard();
  closeModal();
  showToast(`✓ "${pendingCompany.name}" מוזג בהצלחה עם "${targetCompany.name}"`);
}

function rejectPendingCompany(pendingCompanyId) {
  const c = DB.companies.find(x => x.id === pendingCompanyId);
  if (!c) return;
  if (!confirm(`למחוק לצמיתות את "${c.name}" וכל הפעילות הקשורה אליו?\n\n• הזמנות יימחקו\n• תעודות משלוח יימחקו\n• חשבוניות יימחקו\n• אנשי קשר יימחקו\n\nפעולה זו אינה הפיכה.`)) return;

  DB.orders = DB.orders.filter(o => o.companyId !== pendingCompanyId);
  DB.invoices = DB.invoices.filter(i => i.companyId !== pendingCompanyId);
  DB.deliveryNotes = DB.deliveryNotes.filter(d => d.companyId !== pendingCompanyId);
  DB.receipts = DB.receipts.filter(r => r.companyId !== pendingCompanyId);
  DB.credits = DB.credits.filter(cr => cr.companyId !== pendingCompanyId);
  DB.customers = DB.customers.filter(u => !userHasAccessToCompany(u, pendingCompanyId));
  DB.companies = DB.companies.filter(x => x.id !== pendingCompanyId);
  DB.save();
  renderCompanies();
  renderCustomers();
  renderOrders();
  renderInvoices();
  renderDashboard();
  closeModal();
  showToast(`✕ "${c.name}" נדחה ונמחק`);
}

function deleteCompany(id) {
  if (!confirm('למחוק את החברה? פעולה זו תמחק גם את אנשי הקשר הקשורים אליה.')) return;
  DB.companies = DB.companies.filter(c => c.id !== id);
  DB.customers = DB.customers.filter(x => x.companyId !== id);
  DB.save();
  renderCompanies();
  renderCustomers();
  renderDashboard();
  showToast('החברה נמחקה');
}

/* ================================================================
   BASELINE PHOTOS (for AI-powered photo reorder)
   ================================================================ */
const PHOTO_AREAS = [
  { id:'fridge',  label:'מקרר',          icon:'🧊' },
  { id:'coffee',  label:'מדף קפה',       icon:'☕' },
  { id:'snacks',  label:'מדף חטיפים',    icon:'🥨' },
  { id:'drinks',  label:'מקרר משקאות',   icon:'🥤' },
  { id:'cleaning',label:'ארון ניקיון',   icon:'🧼' },
  { id:'storage', label:'מחסן כללי',     icon:'📦' },
  { id:'kitchen', label:'מטבחון כללי',   icon:'🍽️' },
  { id:'other',   label:'אחר',            icon:'📷' },
];

function openBaselinePhotos(companyId) {
  const c = DB.companies.find(x => x.id === companyId);
  if (!c) return;
  if (!c.baselinePhotos) c.baselinePhotos = [];

  const photosHtml = c.baselinePhotos.length
    ? c.baselinePhotos.map((photo, i) => `
        <div class="bp-card" data-idx="${i}">
          <div class="bp-img">
            <img src="${photo.data}" alt="${photo.label}" />
            <div class="bp-overlay">
              <button class="bp-action" onclick="event.stopPropagation();viewBaselinePhoto(${companyId},${i})" title="הגדל">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
              <button class="bp-action bp-action-danger" onclick="event.stopPropagation();deleteBaselinePhoto(${companyId},${i})" title="מחק">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="bp-meta">
            <span class="bp-area-icon">${getAreaIcon(photo.area)}</span>
            <div>
              <b>${photo.label}</b>
              <span>${formatDate(photo.addedAt)}</span>
            </div>
          </div>
        </div>
      `).join('')
    : `<div class="bp-empty">
        <div class="bp-empty-icon">📷</div>
        <h4>אין עדיין תמונות בסיס</h4>
        <p>העלו תמונות של מדפי הלקוח במצב מלא — אלה ישמשו את ה-AI להשוואה בעת הזמנות עתידיות.</p>
      </div>`;

  const areaOpts = PHOTO_AREAS.map(a => `<option value="${a.id}">${a.icon} ${a.label}</option>`).join('');

  openModal(`תמונות Baseline — ${c.name}`, `
    <div class="bp-wrap">
      <!-- Info banner -->
      <div class="bp-info">
        <span class="bp-info-icon">💡</span>
        <div>
          <b>כיצד זה עובד?</b>
          <p>כשהלקוח מבצע הזמנה ראשונה, צלמו את המדפים שלו ב<b>מצב מלא</b>. בהזמנות הבאות הלקוח יצלם את אותם מדפים, ה-AI ישווה ויזהה אוטומטית מה חסר. <b>מומלץ:</b> 3-5 תמונות בזוויות שונות.</p>
        </div>
      </div>

      <!-- Upload form -->
      <form id="bpUploadForm" onsubmit="uploadBaselinePhoto(event, ${companyId})" class="bp-upload">
        <div class="bp-upload-l">
          <label class="bp-file-label" for="bpFileInput">
            <input type="file" id="bpFileInput" accept="image/*" onchange="previewBaselinePhoto(event)" required />
            <div class="bp-file-empty" id="bpFileEmpty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>בחרו תמונה</span>
            </div>
            <div class="bp-file-preview" id="bpFilePreview" style="display:none">
              <img id="bpPreviewImg" alt="" />
            </div>
          </label>
        </div>
        <div class="bp-upload-r">
          <div class="field">
            <label>אזור בתמונה</label>
            <select name="area" id="bpAreaSelect" onchange="updateBpLabel()">${areaOpts}</select>
          </div>
          <div class="field">
            <label>תווית מותאמת</label>
            <input type="text" name="label" id="bpLabelInput" placeholder="לדוגמה: מקרר ראשי - מצב מלא" />
          </div>
          <div class="field">
            <label>הערות</label>
            <input type="text" name="notes" placeholder="פרטים נוספים על מצב המדף" />
          </div>
          <button type="submit" class="btn btn-primary">+ הוסף תמונה ל-Baseline</button>
        </div>
      </form>

      <!-- Photos grid -->
      <div class="bp-section-head">
        <h4>${c.baselinePhotos.length} תמונות בסיס נוכחיות</h4>
        ${c.baselinePhotos.length ? `<button class="row-action row-action-danger" onclick="clearAllBaseline(${companyId})">מחק הכל</button>` : ''}
      </div>
      <div class="bp-grid" id="bpGrid">${photosHtml}</div>
    </div>
  `, [
    { label:'סגירה', class:'btn-ghost', action:closeModal }
  ]);

  // Make modal larger
  document.getElementById('modalCard').style.maxWidth = '780px';
  // Init label
  setTimeout(updateBpLabel, 50);
}

function getAreaIcon(areaId) {
  return PHOTO_AREAS.find(a => a.id === areaId)?.icon || '📷';
}

function updateBpLabel() {
  const sel = document.getElementById('bpAreaSelect');
  const inp = document.getElementById('bpLabelInput');
  if (!sel || !inp) return;
  const area = PHOTO_AREAS.find(a => a.id === sel.value);
  if (area && !inp.value) {
    inp.placeholder = `לדוגמה: ${area.label} - מצב מלא`;
  }
}

function previewBaselinePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('bpFileEmpty').style.display = 'none';
    const preview = document.getElementById('bpFilePreview');
    preview.style.display = 'block';
    document.getElementById('bpPreviewImg').src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadBaselinePhoto(e, companyId) {
  e.preventDefault();
  const form = e.target;
  const file = document.getElementById('bpFileInput').files[0];
  if (!file) { showToast('יש לבחור תמונה', 'error'); return; }

  // Compress images to reasonable size for localStorage
  compressImage(file, 1200, 0.85).then(dataUrl => {
    const c = DB.companies.find(x => x.id === companyId);
    if (!c.baselinePhotos) c.baselinePhotos = [];

    const data = Object.fromEntries(new FormData(form).entries());
    const area = PHOTO_AREAS.find(a => a.id === data.area);
    const label = data.label.trim() || area?.label || 'תמונה';

    c.baselinePhotos.push({
      id: Date.now(),
      area: data.area,
      label,
      notes: data.notes,
      data: dataUrl,
      addedAt: new Date().toISOString().split('T')[0]
    });

    DB.save('companies');
    showToast('התמונה נשמרה ל-Baseline');
    closeModal();
    setTimeout(() => openBaselinePhotos(companyId), 200);
  }).catch(err => {
    console.error(err);
    showToast('שגיאה בעיבוד התמונה', 'error');
  });
}

/* Compress image before storing — keeps localStorage manageable */
function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const ratio = maxWidth / Math.max(img.width, img.height);
        const w = ratio < 1 ? img.width * ratio : img.width;
        const h = ratio < 1 ? img.height * ratio : img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function viewBaselinePhoto(companyId, idx) {
  const c = DB.companies.find(x => x.id === companyId);
  const photo = c?.baselinePhotos?.[idx];
  if (!photo) return;
  openModal(photo.label, `
    <div style="padding:0">
      <img src="${photo.data}" alt="${photo.label}" style="width:100%;display:block" />
      <div style="padding:18px 22px">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 14px;font-size:13px">
          <b>אזור:</b><span>${getAreaIcon(photo.area)} ${PHOTO_AREAS.find(a=>a.id===photo.area)?.label || photo.area}</span>
          <b>תאריך הוספה:</b><span>${formatDate(photo.addedAt)}</span>
          ${photo.notes ? `<b>הערות:</b><span>${photo.notes}</span>` : ''}
        </div>
      </div>
    </div>
  `, [
    { label:'חזרה', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => openBaselinePhotos(companyId), 100); } }
  ]);
}

function deleteBaselinePhoto(companyId, idx) {
  if (!confirm('למחוק את התמונה?')) return;
  const c = DB.companies.find(x => x.id === companyId);
  if (c?.baselinePhotos) {
    c.baselinePhotos.splice(idx, 1);
    DB.save('companies');
    openBaselinePhotos(companyId);
    showToast('התמונה נמחקה');
  }
}

function clearAllBaseline(companyId) {
  if (!confirm('למחוק את כל תמונות ה-Baseline של החברה?')) return;
  const c = DB.companies.find(x => x.id === companyId);
  if (c) {
    c.baselinePhotos = [];
    DB.save('companies');
    openBaselinePhotos(companyId);
    showToast('כל התמונות נמחקו');
  }
}

/* ---------- CUSTOMER LEDGER (כרטסת לקוח) ---------- */
let _ledgerCompanyId = null;
let _ledgerTab = 'all';
let _ledgerAccountId = 'all'; // 'all' or a specific account id
let _ledgerDnSelection = new Set(); // תעודות משלוח שנבחרו בכרטסת להפקת חשבונית מרוכזת

function openLedger(companyId) {
  _ledgerCompanyId = companyId;
  _ledgerTab = 'all';
  _ledgerAccountId = 'all';
  _ledgerDnSelection = new Set();
  renderLedger();
}

function switchLedgerAccount(accId) {
  _ledgerAccountId = accId;
  // Switching account also resets the type tab to "all" so the user
  // sees a complete picture of the newly selected account first.
  _ledgerTab = 'all';
  renderLedger();
}

// Ledger entries can be filtered by account. 'all' matches everything.
// Legacy entries that have no accountId are attributed to the company's
// primary account (best-effort) so they don't disappear when filtering.
function _ledgerAccountMatch(entryAccountId, accounts, selectedAccountId) {
  if (selectedAccountId === 'all') return true;
  if (entryAccountId) return entryAccountId === selectedAccountId;
  const primary = accounts.find(a => a.isPrimary) || accounts[0];
  return !!(primary && primary.id === selectedAccountId);
}

function renderLedger() {
  const companyId = _ledgerCompanyId;
  const c = DB.companies.find(x => x.id === companyId);
  if (!c) return;

  const accounts = Array.isArray(c.accounts) ? c.accounts : [];
  const hasMultipleAccounts = accounts.length > 1;
  const selectedAccountId = _ledgerAccountId;
  const match = (accId) => _ledgerAccountMatch(accId, accounts, selectedAccountId);

  // Calculate totals scoped to the selected account (or whole company if 'all').
  const invoices = DB.invoices.filter(i => i.companyId === companyId && match(i.accountId));
  const allDNs = DB.deliveryNotes.filter(d => d.companyId === companyId && match(d.accountId));
  const unbilledDNs = allDNs.filter(d => !d.billed);
  const unbilledTotal = unbilledDNs.reduce((sum, dn) => {
    const t = calculateTotalsWithVat(dn.items || [], undefined, dn.shipping || 0);
    return sum + t.total;
  }, 0);
  const totalCredits = DB.credits
    .filter(cr => cr.companyId === companyId && match(cr.accountId))
    .reduce((s, cr) => s + (cr.amount || 0), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const balance = totalInvoiced + unbilledTotal - totalPaid - totalCredits;

  const dnCount = allDNs.length;
  const invCount = invoices.length;
  const rcpCount = DB.receipts.filter(r => r.companyId === companyId && r.amount > 0 && match(r.accountId)).length;
  const crdCount = DB.credits.filter(cr => cr.companyId === companyId && match(cr.accountId)).length;

  // Selected-account display info (falls back to company-level when 'all').
  const selectedAccount = selectedAccountId === 'all' ? null : accounts.find(a => a.id === selectedAccountId);
  const headerCustomerNumber = selectedAccount
    ? selectedAccount.customerNumber
    : (accounts.map(a => a.customerNumber).filter(Boolean).join(' / ') || c.customerNumber || '—');
  const headerPayTerms = selectedAccount
    ? selectedAccount.payTerms
    : (c.payTerms || (accounts[0] && accounts[0].payTerms));

  // Account tabs — only render when a company has more than one account.
  const accountTabsHtml = hasMultipleAccounts ? `
    <div class="ledger-account-tabs">
      <button type="button" class="lat ${selectedAccountId === 'all' ? 'active' : ''}" data-acc="all">כל החשבונות</button>
      ${accounts.map(a => `
        <button type="button" class="lat ${selectedAccountId === a.id ? 'active' : ''}" data-acc="${esc(a.id)}">
          <span class="lat-label">${esc(a.label || 'חשבון')}</span>
          <span class="lat-cn">${esc(a.customerNumber || '')}</span>
        </button>
      `).join('')}
    </div>
  ` : '';

  const ledgerTitle = `כרטסת לקוח — ${esc(c.name)}${selectedAccount ? ' · ' + esc(selectedAccount.label) : ''}`;

  openModal(ledgerTitle, `
    <div class="ledger">
      ${accountTabsHtml}

      <!-- Customer header -->
      <div class="ledger-head">
        <div class="ledger-head-l">
          <div class="ledger-meta">
            <div><span>מספר לקוח</span><b>${esc(headerCustomerNumber)}</b></div>
            <div><span>ח.פ</span><b>${esc(c.taxId)}</b></div>
            <div><span>טלפון</span><b>${esc(c.phone || '—')}</b></div>
            <div><span>תנאי תשלום</span><b>${payTermsLabel(headerPayTerms)}</b></div>
            <div style="grid-column:1/-1"><span>כתובת</span><b>${esc(c.address)}, ${esc(c.city)}</b></div>
          </div>
        </div>
        <div class="ledger-head-r">
          <div class="ledger-balance">
            ${selectedAccount ? `<div class="lb-row" style="border-bottom:1px dashed var(--line);padding-bottom:6px;margin-bottom:6px"><span>חשבון</span><b style="color:var(--green-2)">${esc(selectedAccount.label)} (${esc(selectedAccount.customerNumber || '—')})</b></div>` : ''}
            <div class="lb-row"><span>סך חשבוניות</span><b>₪${formatNum(totalInvoiced)}</b></div>
            ${unbilledTotal > 0 ? `<div class="lb-row"><span>תעודות משלוח לא מחויבות</span><b style="color:var(--orange-2)">₪${formatNum(unbilledTotal)}</b></div>` : ''}
            <div class="lb-row"><span>סך תשלומים</span><b style="color:var(--green-2)">−₪${formatNum(totalPaid)}</b></div>
            ${totalCredits > 0 ? `<div class="lb-row"><span>סך זיכויים</span><b style="color:var(--green-2)">−₪${formatNum(totalCredits)}</b></div>` : ''}
            <div class="lb-row lb-total"><span>יתרה לתשלום</span><b style="color:${balance > 0 ? 'var(--orange-2)' : 'var(--muted)'}">₪${formatNum(balance)}</b></div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="ledger-actions">
        ${unbilledDNs.length ? `<button class="btn" style="background:var(--orange-2,#d97757);color:#fff;border:none" onclick="billLedgerConsolidated()" title="אחד את כל תעודות המשלוח שטרם חויבו לחשבונית מס אחת">🧾 הפק חשבונית מרוכזת (${unbilledDNs.length})</button>` : ''}
        <button class="btn btn-primary" onclick="newDeliveryNote(${companyId})">+ תעודת משלוח</button>
        <button class="btn btn-ghost" onclick="newReceipt(${companyId})">+ קבלה</button>
        <button class="btn btn-ghost" onclick="newCredit(${companyId})">+ זיכוי</button>
      </div>

      <!-- Type tabs -->
      <div class="ledger-tabs">
        <button class="lt ${_ledgerTab === 'all' ? 'active' : ''}" data-tab="all" onclick="switchLedgerTab('all')">הכל</button>
        <button class="lt ${_ledgerTab === 'dn'  ? 'active' : ''}" data-tab="dn"  onclick="switchLedgerTab('dn')">תעודות משלוח (${dnCount})</button>
        <button class="lt ${_ledgerTab === 'inv' ? 'active' : ''}" data-tab="inv" onclick="switchLedgerTab('inv')">חשבוניות (${invCount})</button>
        <button class="lt ${_ledgerTab === 'rcp' ? 'active' : ''}" data-tab="rcp" onclick="switchLedgerTab('rcp')">קבלות (${rcpCount})</button>
        <button class="lt ${_ledgerTab === 'crd' ? 'active' : ''}" data-tab="crd" onclick="switchLedgerTab('crd')">זיכויים (${crdCount})</button>
      </div>

      <!-- Ledger entries -->
      <div class="ledger-body" id="ledgerBody"></div>
    </div>
  `, [
    { label:'סגירה', class:'btn-ghost', action:closeModal }
  ]);

  // Bind account-tab buttons after the modal DOM is in place.
  if (hasMultipleAccounts) {
    document.querySelectorAll('.ledger-account-tabs .lat').forEach(btn => {
      btn.addEventListener('click', () => switchLedgerAccount(btn.getAttribute('data-acc')));
    });
  }

  // Make the modal wider for the ledger view.
  const card = document.getElementById('modalCard');
  if (card) card.style.maxWidth = '900px';

  renderLedgerBody();
}

/* הפקת חשבונית מרוכזת ישירות מכרטסת הלקוח — מאחדת את כל תעודות
   המשלוח שטרם חויבו (בהתאם לחשבון הנבחר בכרטסת) לחשבונית מס אחת.
   משתמשת באותו מנוע של ההפקה המרוכזת הכללית (executeBulkBillingFromWizard),
   כך שהמספור והחישוב (כולל דמי משלוח) זהים. (נוסף 2026-06-11) */
function billLedgerConsolidated(dnIdsOverride) {
  const companyId = _ledgerCompanyId;
  const c = DB.companies.find(x => x.id === companyId);
  if (!c) return;
  const accounts = Array.isArray(c.accounts) ? c.accounts : [];
  const match = (accId) => _ledgerAccountMatch(accId, accounts, _ledgerAccountId);
  let dns = (DB.deliveryNotes || []).filter(d =>
    d.companyId === companyId && match(d.accountId) && !d.billed && !d.invoiceId);
  const isPartial = Array.isArray(dnIdsOverride) && dnIdsOverride.length > 0;
  if (isPartial) {
    const idset = new Set(dnIdsOverride);
    dns = dns.filter(d => idset.has(d.id));
  }
  if (!dns.length) { showToast('אין תעודות משלוח לא מחויבות ללקוח זה'); return; }

  // סכום מדויק כפי שהמנוע יחשב: איחוד כל הפריטים + סכום דמי המשלוח
  const allItems = [];
  dns.forEach(d => (d.items || []).forEach(it => allItems.push({ ...it })));
  const shipping = dns.reduce((s, d) => s + (Number(d.shipping) || 0), 0);
  const grandTotal = calculateTotalsWithVat(allItems, companyId, shipping).total;

  const rows = dns.map(d => {
    const t = calculateTotalsWithVat(d.items || [], companyId, Number(d.shipping) || 0);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">
      <span><b>${esc(d.number)}</b> <span style="color:var(--muted);font-size:12px">· ${formatDate(d.date)} · ${(d.items || []).length} פריטים</span></span>
      <b class="price-cell">₪${formatNum(t.total)}</b>
    </div>`;
  }).join('');

  openModal('הפקת חשבונית מרוכזת — ' + esc(c.name), `
    <div style="padding:18px">
      <div style="background:#eef9f1;border:1px solid #b9dec3;padding:10px 12px;border-radius:6px;margin-bottom:12px;font-size:13px">
        ${isPartial ? `<b>${dns.length}</b> תעודות המשלוח שנבחרו` : `כל <b>${dns.length}</b> תעודות המשלוח שטרם חויבו`} יאוחדו ל<b>חשבונית מס אחת</b>.
      </div>
      ${rows}
      <div style="display:flex;justify-content:space-between;margin-top:14px;font-size:15px"><b>סה"כ לחשבונית (כולל מע"מ)</b><b>₪${formatNum(grandTotal)}</b></div>
    </div>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'הפק חשבונית מרוכזת', class:'btn-primary', action:() => confirmBillLedgerConsolidated(companyId, dns.map(d => d.id)) }
  ]);
}

function confirmBillLedgerConsolidated(companyId, dnIds) {
  // שימוש חוזר במנוע הקיים: בחירת תעודות הלקוח והפעלת ההפקה המרוכזת
  window._bulkBilling = { selected: new Set(dnIds) };
  executeBulkBillingFromWizard(); // יוצר חשבונית מס אחת, שומר, סוגר מודאל ומראה הודעה
  _ledgerDnSelection = new Set(); // איפוס הבחירה אחרי הפקה
  // פתיחה מחדש של הכרטסת כדי שהמשתמש יראה את המצב המעודכן
  if (_ledgerCompanyId === companyId && typeof renderLedger === 'function') {
    setTimeout(renderLedger, 60);
  }
}

// סימון/ביטול תעודת משלוח בכרטסת לצורך הפקה מרוכזת של הנבחרות בלבד
function toggleLedgerDnSelect(id, checked) {
  if (checked) _ledgerDnSelection.add(id);
  else         _ledgerDnSelection.delete(id);
  _updateLedgerDnSelBar();
}

// עדכון פס הבחירה (מונה + סכום) לפי התעודות שסומנו
function _updateLedgerDnSelBar() {
  const countEl = document.getElementById('ledgerDnSelCount');
  const totalEl = document.getElementById('ledgerDnSelTotal');
  if (!countEl || !totalEl) return;
  const dns = (DB.deliveryNotes || []).filter(d => _ledgerDnSelection.has(d.id));
  const items = [];
  let shipping = 0;
  dns.forEach(d => { (d.items || []).forEach(it => items.push({ ...it })); shipping += Number(d.shipping) || 0; });
  const total = dns.length ? calculateTotalsWithVat(items, _ledgerCompanyId, shipping).total : 0;
  countEl.textContent = dns.length;
  totalEl.textContent = '₪' + formatNum(total);
}

// הפקת חשבונית מרוכזת עבור התעודות שסומנו בלבד
function billLedgerSelected() {
  const ids = [..._ledgerDnSelection];
  if (!ids.length) { showToast('לא נבחרו תעודות משלוח'); return; }
  billLedgerConsolidated(ids);
}

function switchLedgerTab(tab) {
  _ledgerTab = tab;
  document.querySelectorAll('.lt').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderLedgerBody();
}

function renderLedgerBody() {
  const cid = _ledgerCompanyId;
  const body = document.getElementById('ledgerBody');
  if (!body) return;

  const c = DB.companies.find(x => x.id === cid);
  const accounts = (c && Array.isArray(c.accounts)) ? c.accounts : [];
  const hasMultipleAccounts = accounts.length > 1;
  const selectedAccountId = _ledgerAccountId;
  const match = (accId) => _ledgerAccountMatch(accId, accounts, selectedAccountId);

  // Resolve a friendly label for the per-row "account" column.
  const accountLabelById = (accId) => {
    const a = accId ? accounts.find(x => x.id === accId) : (accounts.find(x => x.isPrimary) || accounts[0]);
    if (!a) return '—';
    return esc(a.label) + (a.customerNumber ? ` <span style="color:var(--muted);font-size:11px">(${esc(a.customerNumber)})</span>` : '');
  };

  // Build unified entries list (filtered by selected account).
  const entries = [];

  if (_ledgerTab === 'all' || _ledgerTab === 'dn') {
    DB.deliveryNotes.filter(d => d.companyId === cid && match(d.accountId)).forEach(d => {
      entries.push({ type:'dn', date:d.date, data:d });
    });
  }
  if (_ledgerTab === 'all' || _ledgerTab === 'inv') {
    DB.invoices.filter(i => i.companyId === cid && match(i.accountId)).forEach(i => {
      entries.push({ type:'inv', date:i.date, data:i });
    });
  }
  if (_ledgerTab === 'all' || _ledgerTab === 'rcp') {
    DB.receipts.filter(r => r.companyId === cid && r.amount > 0 && match(r.accountId)).forEach(r => {
      entries.push({ type:'rcp', date:r.date, data:r });
    });
  }
  if (_ledgerTab === 'all' || _ledgerTab === 'crd') {
    DB.credits.filter(cr => cr.companyId === cid && match(cr.accountId)).forEach(cr => {
      entries.push({ type:'crd', date:cr.date, data:cr });
    });
  }

  // Sort by date descending
  entries.sort((a, b) => b.date.localeCompare(a.date));

  if (!entries.length) {
    body.innerHTML = '<div class="empty"><h4>אין תנועות להצגה</h4><p>לא נמצאו תנועות בקטגוריה זו</p></div>';
    return;
  }

  // Show the per-row account column only when there are multiple accounts AND
  // the user is viewing "all accounts" — otherwise it's redundant.
  const showAccountCol = hasMultipleAccounts && selectedAccountId === 'all';

  // ---- בחירת תעודות משלוח שטרם חויבו להפקת חשבונית מרוכזת ----
  const unbilledDnEntries = entries.filter(e => e.type === 'dn' && !e.data.billed && !e.data.invoiceId);
  // שמירה רק על מזהים שעדיין רלוונטיים (לא חויבו ומופיעים בתצוגה הנוכחית)
  _ledgerDnSelection = new Set([..._ledgerDnSelection].filter(id => unbilledDnEntries.some(e => e.data.id === id)));
  const canSelectDns = unbilledDnEntries.length > 0;
  const selectBar = canSelectDns ? `
    <div class="ledger-dn-selbar" style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 12px;margin-bottom:8px;background:#fff7f0;border:1px solid #f0c9b0;border-radius:6px;font-size:13px">
      <span>סמן תעודות משלוח שטרם חויבו → <b id="ledgerDnSelCount">0</b> נבחרו · סה"כ <b id="ledgerDnSelTotal">₪0.00</b></span>
      <button class="btn" style="background:var(--orange-2,#d97757);color:#fff;border:none;padding:5px 12px" onclick="billLedgerSelected()">הפק חשבונית מרוכזת לנבחרות</button>
    </div>` : '';

  body.innerHTML = selectBar + `
    <table class="table table-compact ledger-table">
      <thead>
        <tr>
          ${canSelectDns ? '<th style="width:30px"></th>' : ''}
          <th>סוג</th>
          <th>תאריך</th>
          <th>מס' מסמך</th>
          ${showAccountCol ? '<th>חשבון</th>' : ''}
          <th>פירוט</th>
          <th>חיוב</th>
          <th>זיכוי</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(e => {
          const types = {
            dn:  { label:'תעודת משלוח', cls:'pill-info' },
            inv: { label:'חשבונית', cls:'pill-warn' },
            rcp: { label:'קבלה', cls:'pill-success' },
            crd: { label:'זיכוי', cls:'pill-pending' }
          };
          const t = types[e.type];
          let charge = '—', credit = '—', desc = '';
          if (e.type === 'dn') {
            // DN value with VAT — shows as charge so it counts toward customer debt
            const dnTotals = calculateTotalsWithVat(e.data.items || [], undefined, e.data.shipping || 0);
            charge = '₪' + formatNum(dnTotals.total);
            desc = `${e.data.items.length} פריטים · ${e.data.deliveredBy || 'מסירה'}` + (e.data.billed ? ' · בחשבונית' : ' · טרם בחשבונית');
          }
          if (e.type === 'inv') {
            // If this invoice consolidates DNs, mark accordingly so user sees connection
            const isConsolidated = Array.isArray(e.data.consolidatedDNs) && e.data.consolidatedDNs.length;
            charge = '₪' + formatNum(e.data.amount);
            desc = e.data.notes || `סכום ${formatNum(e.data.amount)} כולל מע"מ`;
            if (isConsolidated) desc = `🔗 חשבונית מרוכזת — ${e.data.consolidatedDNs.length} תעודות`;
          }
          if (e.type === 'rcp') { credit = '₪' + formatNum(e.data.amount); desc = e.data.method + (e.data.notes ? ' · ' + e.data.notes : ''); }
          if (e.type === 'crd') { credit = '₪' + formatNum(e.data.amount); desc = e.data.reason || ''; }
          const accCell = showAccountCol ? `<td class="muted-cell">${accountLabelById(e.data.accountId)}</td>` : '';
          const isUnbilledDn = e.type === 'dn' && !e.data.billed && !e.data.invoiceId;
          const selCell = canSelectDns ? `<td>${isUnbilledDn ? `<input type="checkbox" class="ledger-dn-cb" data-dnid="${e.data.id}" ${_ledgerDnSelection.has(e.data.id) ? 'checked' : ''} onchange="toggleLedgerDnSelect(${e.data.id}, this.checked)" />` : ''}</td>` : '';
          return `<tr>
            ${selCell}
            <td><span class="pill ${t.cls}">${t.label}</span></td>
            <td class="muted-cell">${formatDate(e.date)}</td>
            <td class="strong-cell">${e.data.number}</td>
            ${accCell}
            <td class="muted-cell">${desc}</td>
            <td class="${charge !== '—' ? 'price-cell' : 'muted-cell'}" style="color:${charge !== '—' ? 'var(--orange-2)' : ''}">${charge}</td>
            <td class="${credit !== '—' ? 'price-cell' : 'muted-cell'}" style="color:${credit !== '—' ? 'var(--green-2)' : ''}">${credit}</td>
            <td>
              ${e.type === 'dn' ? `<button class="row-action" onclick="viewDeliveryNote(${e.data.id})">צפה</button>` : ''}
              ${e.type === 'inv' ? `<button class="row-action row-action-primary" onclick="viewInvoice(${e.data.id})">צפה</button>${(e.data.amount - (e.data.paid || 0)) > 0 ? `<button class="row-action" onclick="recordPayment(${e.data.id})">תשלום</button>` : ''}` : ''}
              ${e.type === 'rcp' ? `<button class="row-action row-action-primary" onclick="viewReceipt(${e.data.id})">צפה בקבלה</button>` : ''}
              ${e.type === 'crd' ? `<button class="row-action" onclick="viewCredit(${e.data.id})">צפה</button>` : ''}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  if (canSelectDns) _updateLedgerDnSelBar();
}

function viewDeliveryNote(id) {
  const dn = DB.deliveryNotes.find(d => d.id === id);
  if (!dn) return;
  const c = DB.companies.find(x => x.id === dn.companyId);
  const account = (c?.accounts || []).find(a => a.id === dn.accountId)
               || (c?.accounts || []).find(a => a.isPrimary)
               || (c?.accounts || [])[0] || {};
  const branch  = (c?.branches || []).find(b => b.isPrimary) || (c?.branches || [])[0] || {};
  const settings = DB.settings || {};
  const totals  = calculateTotalsWithVat(dn.items || [], dn.companyId, dn.shipping || 0);
  const linkedInv = dn.invoiceId ? DB.invoices.find(i => i.id === dn.invoiceId) : null;

  const itemsHtml = (dn.items || []).map((it, idx) => {
    const p = DB.products.find(x => x.id === it.pid);
    // Prefer admin product name; fall back to the snapshot saved on the line itself
    const name  = p?.name || it.externalName || it.name || 'מוצר ללא שם';
    const icon  = p?.icon || '📦';
    const sku   = p?.sku  || (it.pid ? 'BLS-' + String(it.pid).padStart(4,'0') : '—');
    const unit  = p?.unit || it.unit || '—';
    const desc  = p?.desc || '';
    const price = (typeof it.price !== 'undefined') ? it.price : (p?.price ?? it.externalPrice ?? 0);
    const lineTotal = price * it.qty;
    const exempt = isLineVatExempt(it, p);
    const status = it.status || 'delivered';
    // Render based on fulfillment status
    if (status === 'missing') {
      return `<tr class="dn-line dn-line-missing">
        <td class="dn-num">${idx + 1}</td>
        <td class="dn-sku" style="text-decoration:line-through;color:#999">${sku}</td>
        <td class="dn-name-cell">
          <div class="dn-name-flex">
            <span class="dn-icon" style="opacity:.4">${icon}</span>
            <div class="dn-name-info">
              <b style="text-decoration:line-through;color:#999">${name}</b>
              <div class="dn-name-meta">
                <span class="dn-missing-tag">❌ לא נמסר — חסר במלאי</span>

              </div>
            </div>
          </div>
        </td>
        <td class="dn-unit" style="text-decoration:line-through;color:#999">${unit}</td>
        <td class="dn-qty" style="text-decoration:line-through;color:#999">${it.qty}</td>
        <td class="dn-price" style="text-decoration:line-through;color:#999">₪${formatNum(price)}</td>
        <td class="dn-total"><b style="text-decoration:line-through;color:#999">₪${formatNum(lineTotal)}</b></td>
      </tr>`;
    }

    if (status === 'substituted' && it.substitutedWith) {
      const sub = it.substitutedWith;
      const subProduct = DB.products.find(x => x.id === sub.pid);
      const subName = subProduct?.name || sub.name || 'תחליף';
      const subIcon = subProduct?.icon || sub.icon || '📦';
      const subUnit = subProduct?.unit || sub.unit || unit;
      const subSku  = subProduct?.sku  || (sub.pid ? 'BLS-' + String(sub.pid).padStart(4,'0') : '—');
      const subPrice = sub.price || subProduct?.price || 0;
      const subLineTotal = subPrice * sub.qty;
      return `<tr class="dn-line dn-line-substituted">
        <td class="dn-num" rowspan="2">${idx + 1}</td>
        <td class="dn-sku" style="text-decoration:line-through;color:#999">${sku}</td>
        <td class="dn-name-cell">
          <div class="dn-name-flex">
            <span class="dn-icon" style="opacity:.4">${icon}</span>
            <div class="dn-name-info">
              <b style="text-decoration:line-through;color:#999">${name}</b>
              <div class="dn-name-meta">
                <span class="dn-substituted-tag">🔄 הוחלף — חסר במלאי</span>
              </div>
            </div>
          </div>
        </td>
        <td class="dn-unit" style="text-decoration:line-through;color:#999">${unit}</td>
        <td class="dn-qty" style="text-decoration:line-through;color:#999">${it.qty}</td>
        <td class="dn-price" style="text-decoration:line-through;color:#999">₪${formatNum(price)}</td>
        <td class="dn-total"><b style="text-decoration:line-through;color:#999">₪${formatNum(lineTotal)}</b></td>
      </tr>
      <tr class="dn-line dn-line-sub-replacement">
        <td class="dn-sku">${subSku}</td>
        <td class="dn-name-cell">
          <div class="dn-name-flex">
            <span class="dn-icon">${subIcon}</span>
            <div class="dn-name-info">
              <b>↳ ${subName}</b>
              <div class="dn-name-meta">
                <span class="dn-replacement-tag">✓ נמסר במקום הפריט שמעל</span>
              </div>
            </div>
          </div>
        </td>
        <td class="dn-unit">${subUnit}</td>
        <td class="dn-qty">${sub.qty}</td>
        <td class="dn-price">₪${formatNum(subPrice)}</td>
        <td class="dn-total"><b>₪${formatNum(subLineTotal)}</b></td>
      </tr>`;
    }

    // Default: delivered as ordered
    return `<tr class="dn-line">
      <td class="dn-num">${idx + 1}</td>
      <td class="dn-sku">${sku}</td>
      <td class="dn-name-cell">
        <div class="dn-name-flex">
          <span class="dn-icon">${icon}</span>
          <div class="dn-name-info">
            <b>${name}</b>
            <div class="dn-name-meta">
              ${exempt ? '<span class="dn-exempt-tag">פטור ממע״מ</span>' : ''}
              ${desc ? `<span class="dn-desc">${desc}</span>` : ''}
            </div>
          </div>
        </div>
      </td>
      <td class="dn-unit">${unit}</td>
      <td class="dn-qty">${it.qty}</td>
      <td class="dn-price">₪${formatNum(price)}</td>
      <td class="dn-total"><b>₪${formatNum(lineTotal)}</b></td>
    </tr>`;
  }).join('');

  // Count missing/substituted items for the header banner
  const missingCount = (dn.items || []).filter(i => i.status === 'missing').length;
  const substitutedCount = (dn.items || []).filter(i => i.status === 'substituted').length;
  const fulfillmentBanner = (missingCount + substitutedCount) > 0 ? `
    <div class="dn-fulfillment-notice">
      <span>📦</span>
      <div>
        <b>שינויים במשלוח לעומת ההזמנה המקורית</b>
        <span>
          ${missingCount > 0 ? `${missingCount} פריטים <b>לא נמסרו</b> (חסר במלאי).` : ''}
          ${substitutedCount > 0 ? ` ${substitutedCount} פריטים <b>הוחלפו</b> במוצרים דומים.` : ''}
          הסכומים בתעודה משקפים את המוצרים שנמסרו בפועל.
        </span>
      </div>
    </div>
  ` : '';

  const itemCount = (dn.items || []).length;
  const totalQty = (dn.items || []).reduce((s,i) => s + i.qty, 0);

  closeModal();
  setTimeout(() => {
    openModal(`תעודת משלוח ${dn.number}`, `
      <div class="dn-document">
        <!-- DOCUMENT HEADER -->
        <div class="dn-doc-head">
          <div class="dn-doc-head-l">
            <img src="logo.svg" alt="Balasi Store" class="dn-logo" />
            <div class="dn-sender">
              <b>${settings.companyName || 'בלסי סטור בע״מ'}</b>
              <span>${settings.address || 'שונצינו 1, תל אביב'}${settings.addressNote ? ' (' + settings.addressNote + ')' : ''}</span>
              <span>${settings.phone ? 'טל׳ ' + settings.phone + ' · ' : ''}${settings.email || 'balasistore5@gmail.com'}</span>
              <span>ח.פ ${settings.taxId || '516127321'}</span>
            </div>
          </div>
          <div class="dn-doc-head-r">
            <div class="dn-doc-title">תעודת משלוח</div>
            <div class="dn-doc-num">${dn.number}</div>
            <div style="margin:6px 0 4px">${renderCopyMarker(dn)}</div>
            <div class="dn-doc-meta">
              <div><span>תאריך:</span><b>${formatDate(dn.date)}</b></div>
              ${dn.deliveredBy ? `<div><span>נמסר ע״י:</span><b>${dn.deliveredBy}</b></div>` : ''}
            </div>
          </div>
        </div>

        <!-- RECIPIENT PANEL -->
        <div class="dn-recipient">
          <div class="dn-recipient-head">לכבוד</div>
          <div class="dn-recipient-grid">
            <div>
              <span class="dn-r-label">שם הלקוח</span>
              <b class="dn-r-name">${c?.name || '—'}</b>
              ${c?.taxId ? `<span class="dn-r-sub">ח.פ ${c.taxId}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">מספר לקוח</span>
              <b>${account.customerNumber || '—'}</b>
              ${account.label ? `<span class="dn-r-sub">${account.label}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">כתובת אספקה</span>
              <b>${branch.address || c?.address || '—'}${c?.city ? ', ' + c.city : ''}</b>
              ${c?.zip ? `<span class="dn-r-sub">מיקוד ${c.zip}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">פרטי קשר</span>
              <b>${c?.phone || '—'}</b>
              ${c?.email ? `<span class="dn-r-sub">${c.email}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- INVOICE STATUS BANNER -->
        ${linkedInv
          ? `<div class="dn-status-banner dn-status-billed">
              <span>🧾</span>
              <div><b>חויב בחשבונית</b><span>${linkedInv.number} · ${formatDate(linkedInv.date)}</span></div>
            </div>`
          : `<div class="dn-status-banner dn-status-pending">
              <span>⏳</span>
              <div><b>טרם הופקה חשבונית</b><span>סכום זה נכלל בחוב הפתוח של הלקוח וייכלל בחשבונית המרוכזת החודשית הבאה</span></div>
            </div>`
        }

        <!-- FULFILLMENT NOTICE — visible if items missing/substituted -->
        ${fulfillmentBanner}

        <!-- ITEMS TABLE -->
        <div class="dn-items-wrap">
          <table class="dn-items">
            <thead>
              <tr>
                <th class="dn-th-num">#</th>
                <th class="dn-th-sku">מק״ט</th>
                <th class="dn-th-name">פרטי המוצר</th>
                <th class="dn-th-unit">יחידה</th>
                <th class="dn-th-qty">כמות</th>
                <th class="dn-th-price">מחיר ליחידה</th>
                <th class="dn-th-total">סה״כ</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>

        <!-- TOTALS BOX -->
        <div class="dn-totals-wrap">
          <div class="dn-summary">
            <div class="dn-summary-row"><span>סך פריטים שונים</span><b>${itemCount}</b></div>
            <div class="dn-summary-row"><span>סך יחידות</span><b>${totalQty}</b></div>
          </div>
          <div class="dn-totals-box">
            <div class="dn-tot-row">
              <span>סכום ביניים (לפני מע״מ)</span>
              <b>₪${formatNum(totals.subtotal + (totals.discountAmount || 0))}</b>
            </div>
            ${totals.discountAmount > 0 ? `
              <div class="dn-tot-row" style="background:#f0f9f3;border-right:3px solid var(--green);color:#0f4a25">
                <span>הנחת רמת לקוח${totals.tierLabel ? ` — ${totals.tierLabel}` : ''} (${totals.discountPct}%)</span>
                <b style="color:#0f4a25">−₪${formatNum(totals.discountAmount)}</b>
              </div>
              <div class="dn-tot-row">
                <span>סכום נטו (אחרי הנחה)</span>
                <b>₪${formatNum(totals.subtotal)}</b>
              </div>
            ` : ''}
            ${totals.exemptBase > 0 ? `
              <div class="dn-tot-row dn-tot-row-sub">
                <span>מתוכו: בסיס חייב במע״מ</span>
                <span>₪${formatNum(totals.vatBase)}</span>
              </div>
              <div class="dn-tot-row dn-tot-row-sub dn-tot-exempt">
                <span>מתוכו: בסיס פטור ממע״מ (פירות/ירקות)</span>
                <span>₪${formatNum(totals.exemptBase)}</span>
              </div>
            ` : ''}
            ${totals.shipping > 0 ? `
              <div class="dn-tot-row">
                <span>דמי משלוח</span>
                <b>₪${formatNum(totals.shipping)}</b>
              </div>
            ` : ''}
            <div class="dn-tot-row">
              <span>מע״מ (${totals.vatPct || 18}%)</span>
              <b>₪${formatNum(totals.vat)}</b>
            </div>
            <div class="dn-tot-row dn-tot-grand">
              <span>סה״כ לתשלום</span>
              <span>₪${formatNum(totals.total)}</span>
            </div>
          </div>
        </div>

        ${dn.notes ? `<div class="dn-notes-box"><b>הערות:</b> ${dn.notes}</div>` : ''}

        <!-- SIGNATURE -->
        <div class="dn-signature">
          <div class="dn-sig-block">
            <span class="dn-sig-label">חתימת מקבל המשלוח</span>
            <div class="dn-sig-line"></div>
            <span class="dn-sig-fineprint">המקבל מאשר קבלת המוצרים במצב תקין ובכמויות הנקובות לעיל</span>
          </div>
          <div class="dn-sig-block">
            <span class="dn-sig-label">שם וחתימת המוסר</span>
            <div class="dn-sig-line"></div>
            <span class="dn-sig-fineprint">${dn.deliveredBy || ''}</span>
          </div>
        </div>

        <div class="dn-footer-print">
          <span>${settings.companyName || 'בלסי סטור בע״מ'} · ${settings.phone ? settings.phone + ' · ' : ''}${settings.email || 'balasistore5@gmail.com'}</span>
          <span>תעודת משלוח ${dn.number}</span>
        </div>
      </div>
    `, [
      { label:'חזור לכרטסת', class:'btn-ghost', action:() => { closeModal(); openLedger(dn.companyId); } },
      { label:'📜 היסטוריית הדפסות', class:'btn-ghost', action:() => showPrintHistory('dn', dn.id) },
      { label:'🖨 הדפס', class:'btn-ghost', action:() => printDocument('dn', dn.id) },
      { label:'✉ שלח במייל', class:'btn-ghost', action:() => emailDocument('dn', dn.id) },
      ...(!dn.billed ? [{ label:'📦 ערוך ליקוט', class:'btn-ghost', action:() => { closeModal(); setTimeout(() => openDeliveryNotePicker(dn.id), 100); } }] : []),
      // If the DN is already billed, swap the "issue invoice" action for an
      // allocation-number entry that targets the linked invoice. Saves the
      // admin a round-trip through the invoices list.
      ...(dn.billed && dn.invoiceId
        ? [{ label: (linkedInv && linkedInv.allocationNumber) ? '🛡 ערוך מספר הקצאה' : '🛡 הזן מספר הקצאה',
             class:'btn-primary',
             action:() => { closeModal(); setTimeout(() => setAllocationNumber(dn.invoiceId), 100); } }]
        : [{ label:'הפק חשבונית מהתעודה',
             class:'btn-primary',
             action:() => generateInvoiceFromDN(dn.id) }])
    ]);
    document.getElementById('modalCard').style.maxWidth = '880px';
  }, 100);
}

/* Print delivery note — uses CSS @media print rules */
function printDeliveryNote() {
  const card = document.getElementById('modalCard');
  if (!card) return;
  document.body.classList.add('printing-dn');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('printing-dn'), 500);
  }, 100);
}

/* Quick way to bill a single DN as its own invoice */
function generateInvoiceFromDN(dnId) {
  const dn = DB.deliveryNotes.find(d => d.id === dnId);
  if (!dn) return;
  if (dn.billed) { showToast('תעודה זו כבר חויבה'); return; }

  // FIX: include companyId so the tier discount is applied
  const totals = calculateTotalsWithVat(dn.items || [], dn.companyId, dn.shipping || 0);
  const company = DB.companies.find(c => c.id === dn.companyId);
  const todayIso = new Date().toISOString().split('T')[0];
  const defaultDue = addDaysISO(todayIso, 30);

  // Replace the bare confirm() with a proper modal that lets the user pick
  // an invoice date and a due date (instead of forcing today + 30 silently)
  closeModal();
  setTimeout(() => {
    openModal(`הפקת חשבונית מתעודת משלוח ${dn.number}`, `
      <div style="padding:22px">
        <div style="background:#f8f6f0;border:1px solid #e0dccd;padding:14px 16px;margin-bottom:18px;border-radius:6px">
          <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#807a6e;font-weight:700;margin-bottom:8px">פרטי החשבונית שתיווצר</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px">
            <div><span style="color:#807a6e">לקוח:</span> <b>${company?.name || '—'}</b></div>
            <div><span style="color:#807a6e">תעודת משלוח:</span> <b>${dn.number}</b></div>
            <div><span style="color:#807a6e">פריטים בתעודה:</span> <b>${(dn.items || []).length}</b></div>
            <div><span style="color:#807a6e">סכום (כולל מע״מ):</span> <b style="font-size:15px">₪${formatNum(totals.total)}</b></div>
          </div>
        </div>
        <form id="genInvForm" onsubmit="confirmGenerateInvoiceFromDN(event, ${dnId})">
          <div class="form-grid" style="padding:0">
            <div class="field"><label>תאריך החשבונית <span class="req">*</span></label>
              <input type="date" id="genInvDate" name="invDate" value="${todayIso}" onchange="document.getElementById('genInvDue').value = addDaysISO(this.value, 30)" required />
            </div>
            <div class="field"><label>תאריך לתשלום</label>
              <input type="date" id="genInvDue" name="dueDate" value="${defaultDue}" />
              <div style="font-size:11px;color:var(--muted);margin-top:3px">ברירת מחדל: 30 יום אחרי תאריך החשבונית</div>
            </div>
          </div>
        </form>
      </div>
    `, [
      { label:'ביטול', class:'btn-ghost', action:closeModal },
      { label:'הפק חשבונית', class:'btn-primary', action:() => document.getElementById('genInvForm').requestSubmit() }
    ]);
  }, 100);
}

/* Actually create the invoice once the user confirms the dates */
function confirmGenerateInvoiceFromDN(e, dnId) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const dn = DB.deliveryNotes.find(x => x.id === dnId);
  if (!dn || dn.billed) return;

  const totals = calculateTotalsWithVat(dn.items || [], dn.companyId, dn.shipping || 0);
  const invDateStr = d.invDate || new Date().toISOString().split('T')[0];
  const dueStr     = d.dueDate || addDaysISO(invDateStr, 30);
  const invYear    = invDateStr.slice(0, 4);
  const newId      = Math.max(0, ...DB.invoices.map(i => i.id || 0)) + 1;

  const inv = {
    id: newId,
    number: 'INV-' + invYear + '-' + String(newId).padStart(4, '0'),
    companyId: dn.companyId,
    accountId: dn.accountId,
    orderId: dn.orderId,
    date: invDateStr,
    dueDate: dueStr,
    amount: totals.total,
    vatAmount: totals.vat,
    vatExemptBase: totals.exemptBase,
    paid: 0,
    notes: `חשבונית מתעודת משלוח ${dn.number}`,
    items: dn.items,
    shipping: dn.shipping || 0
  };
  DB.invoices.push(inv);
  dn.billed = true;
  dn.invoiceId = newId;
  DB.save();
  closeModal();
  renderInvoices();
  renderDebts();
  renderDashboard();
  showToast(`✓ חשבונית ${inv.number} הופקה ב-₪${formatNum(totals.total)} לתאריך ${formatDate(invDateStr)}`);
  // After issuing, decide whether to prompt for an allocation number:
  //   • If above the ITA threshold → MUST capture it now (legal requirement).
  //   • Below threshold → optional. We still open the modal so the admin
  //     has an obvious place to enter it; it can be dismissed instantly
  //     by clicking "ביטול".
  const overThreshold = (Number(totals.total) || 0) >= (typeof getAllocationThreshold === 'function' ? getAllocationThreshold() : 10000);
  if (overThreshold) {
    showToast('⚠ סכום מעל הסף — נדרש מספר הקצאה מ"חשבונית ישראל"', 'warn');
  }
  // Always open the allocation modal after creating an invoice so there is
  // an immediate, obvious entry point. The modal copy clearly states
  // whether a number is mandatory or optional for this invoice.
  setTimeout(() => setAllocationNumber(newId), overThreshold ? 600 : 400);
}

/* ================================================================
   VIEW CREDIT NOTE — תעודת זיכוי
   Israeli VAT Regulations classify a credit note as a "negative tax
   invoice" (חשבונית מס שלילית) and require it to carry the same
   mandatory fields as a regular tax invoice:
     • Issuer name + tax ID + address
     • Recipient (customer) name + tax ID
     • Sequential running number
     • Issue date
     • Reference to the original invoice being credited
     • Itemized list with quantities and prices
     • Net amount, VAT amount (separate), and gross total
     • "Original / Faithful Copy" marker
     • Reason for the credit
     • Signature line
   ================================================================ */
function viewCredit(id) {
  const cr = DB.credits.find(x => x.id === id);
  if (!cr) { showToast('הזיכוי לא נמצא', 'error'); return; }
  const c = DB.companies.find(x => x.id === cr.companyId);
  const account = (c?.accounts || []).find(a => a.id === cr.accountId)
               || (c?.accounts || []).find(a => a.isPrimary)
               || (c?.accounts || [])[0] || {};
  const branch  = (c?.branches || []).find(b => b.isPrimary) || (c?.branches || [])[0] || {};
  const settings = DB.settings || {};
  const inv = cr.relatedInvoiceId ? DB.invoices.find(i => i.id === cr.relatedInvoiceId) : null;

  // Compute VAT split from items (preferred) or fall back to stored cr.amount
  const items = cr.items || [];
  const totals = items.length
    ? calculateTotalsWithVat(items, cr.companyId)
    : { subtotal: cr.amount, vatBase: cr.amount, exemptBase: 0, vat: 0, total: cr.amount,
        discountAmount: 0, discountPct: 0, tierLabel: '' };

  // For very-old credit records that didn't store full breakdown — we fall
  // back to inferring VAT (assume cr.amount is gross including 18% VAT).
  if (!items.length && cr.amount > 0) {
    totals.vat      = Math.round((cr.amount - cr.amount / 1.18) * 100) / 100;
    totals.subtotal = Math.round((cr.amount / 1.18) * 100) / 100;
    totals.vatBase  = totals.subtotal;
    totals.total    = cr.amount;
  }

  const itemsHtml = items.map((it, idx) => {
    const p = DB.products.find(x => x.id === it.pid);
    const name = p?.name || it.name || 'מוצר ללא שם';
    const icon = p?.icon || '📦';
    const sku  = p?.sku  || (it.pid ? 'BLS-' + String(it.pid).padStart(4,'0') : '—');
    const unit = p?.unit || it.unit || '—';
    const price = (typeof it.price !== 'undefined') ? it.price : (p?.price || 0);
    const refunded = it.refunded != null ? it.refunded : (price * it.qty);
    const exempt = isLineVatExempt(it, p);
    return `<tr class="dn-line">
      <td class="dn-num">${idx + 1}</td>
      <td class="dn-sku">${sku}</td>
      <td class="dn-name-cell">
        <div class="dn-name-flex">
          <span class="dn-icon">${icon}</span>
          <div class="dn-name-info">
            <b>${name}</b>
            <div class="dn-name-meta">
              ${exempt ? '<span class="dn-exempt-tag">פטור ממע״מ</span>' : ''}
            </div>
          </div>
        </div>
      </td>
      <td class="dn-unit">${unit}</td>
      <td class="dn-qty">${it.qty}</td>
      <td class="dn-price">₪${formatNum(price)}</td>
      <td class="dn-total"><b style="color:#1b7a3d">−₪${formatNum(refunded)}</b></td>
    </tr>`;
  }).join('');

  closeModal();
  setTimeout(() => {
    openModal(`תעודת זיכוי ${cr.number}`, `
      <div class="dn-document">
        <!-- DOCUMENT HEADER -->
        <div class="dn-doc-head">
          <div class="dn-doc-head-l">
            <img src="logo.svg" alt="Balasi Store" class="dn-logo" />
            <div class="dn-sender">
              <b>${settings.companyName || 'בלסי סטור בע״מ'}</b>
              <span>${settings.address || 'שונצינו 1, תל אביב'}${settings.addressNote ? ' (' + settings.addressNote + ')' : ''}</span>
              <span>${settings.phone ? 'טל׳ ' + settings.phone + ' · ' : ''}${settings.email || 'balasistore5@gmail.com'}</span>
              <span>ח.פ ${settings.taxId || '516127321'}</span>
            </div>
          </div>
          <div class="dn-doc-head-r">
            <div class="dn-doc-title">תעודת זיכוי</div>
            <div class="dn-doc-num">${cr.number}</div>
            <div style="margin:6px 0 4px">${renderCopyMarker(cr)}</div>
            <div class="dn-doc-meta">
              <div><span>תאריך הפקה:</span><b>${formatDate(cr.date)}</b></div>
              ${inv ? `<div><span>בגין חשבונית:</span><b style="font-family:monospace">${inv.number}</b></div>` : ''}
              ${inv ? `<div><span>תאריך חשבונית:</span><b>${formatDate(inv.date)}</b></div>` : ''}
            </div>
          </div>
        </div>

        <!-- RECIPIENT PANEL — required by VAT regulation §9 -->
        <div class="dn-recipient">
          <div class="dn-recipient-head">לכבוד</div>
          <div class="dn-recipient-grid">
            <div>
              <span class="dn-r-label">שם הלקוח</span>
              <b class="dn-r-name">${c?.name || '—'}</b>
              ${c?.taxId ? `<span class="dn-r-sub">ח.פ ${c.taxId}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">מספר לקוח</span>
              <b>${account.customerNumber || '—'}</b>
              ${account.label ? `<span class="dn-r-sub">${account.label}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">כתובת</span>
              <b>${branch.address || c?.address || '—'}${c?.city ? ', ' + c.city : ''}</b>
            </div>
            <div>
              <span class="dn-r-label">פרטי קשר</span>
              <b>${c?.phone || '—'}</b>
              ${c?.email ? `<span class="dn-r-sub">${c.email}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- REASON BANNER -->
        <div class="dn-status-banner" style="background:#fff7e0;border-bottom:1px solid #f0c9b5;color:#7a5a15">
          <span>↩️</span>
          <div>
            <b>סיבת הזיכוי</b>
            <span>${cr.reason || 'לא צוין'}${inv ? ' · בגין חשבונית מס ' + inv.number : ''}</span>
          </div>
        </div>

        <!-- ITEMS TABLE — only if line-items are stored -->
        ${itemsHtml ? `
          <div class="dn-items-wrap">
            <table class="dn-items">
              <thead>
                <tr>
                  <th class="dn-th-num">#</th>
                  <th class="dn-th-sku">מק״ט</th>
                  <th class="dn-th-name">פרטי המוצר</th>
                  <th class="dn-th-unit">יחידה</th>
                  <th class="dn-th-qty">כמות</th>
                  <th class="dn-th-price">מחיר ליחידה</th>
                  <th class="dn-th-total">סכום זיכוי</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          </div>
        ` : `
          <div style="padding:30px 32px;text-align:center;color:#807a6e;font-style:italic">
            תעודה זו אינה מפרטת פריטים — סיבת הזיכוי כללית.
          </div>
        `}

        <!-- TOTALS BOX — required by VAT regulation: net + VAT separated + gross -->
        <div class="dn-totals-wrap">
          <div class="dn-summary">
            <div class="dn-summary-row"><span>סוג מסמך</span><b>תעודת זיכוי (חשבונית מס שלילית)</b></div>
            <div class="dn-summary-row"><span>פריטים</span><b>${items.length || '—'}</b></div>
          </div>
          <div class="dn-totals-box">
            <div class="dn-tot-row">
              <span>סכום ביניים (לפני מע״מ)</span>
              <b style="color:#1b7a3d">−₪${formatNum(totals.subtotal)}</b>
            </div>
            ${totals.exemptBase > 0 ? `
              <div class="dn-tot-row dn-tot-row-sub">
                <span>מתוכו: בסיס חייב במע״מ</span>
                <span>₪${formatNum(totals.vatBase)}</span>
              </div>
              <div class="dn-tot-row dn-tot-row-sub dn-tot-exempt">
                <span>מתוכו: בסיס פטור ממע״מ (פירות/ירקות)</span>
                <span>₪${formatNum(totals.exemptBase)}</span>
              </div>
            ` : ''}
            <div class="dn-tot-row">
              <span>מע״מ (${totals.vatPct || 18}%) — לזיכוי</span>
              <b style="color:#1b7a3d">−₪${formatNum(totals.vat)}</b>
            </div>
            <div class="dn-tot-row dn-tot-grand" style="background:#1b7a3d">
              <span>סה״כ זיכוי</span>
              <span>−₪${formatNum(totals.total)}</span>
            </div>
          </div>
        </div>

        <!-- AMOUNT IN WORDS — anti-tampering, professional practice -->
        <div style="padding:14px 32px;border-top:1px dashed #d8d3c4;background:#f8f6f0;font-size:12.5px;line-height:1.65;color:#3a3630">
          <b style="color:#1a1a17">סכום במילים:</b>
          <span style="font-style:italic">${amountToHebrewWords(totals.total)} (לזיכוי)</span>
        </div>

        ${cr.notes ? `<div class="dn-notes-box"><b>הערות:</b> ${cr.notes}</div>` : ''}

        <!-- LEGAL FINE PRINT — required for credit notes per Israeli VAT law -->
        <div style="margin:8px 32px 0;padding:10px 14px;background:#f8f6f0;border:1px solid #e0dccd;font-size:11px;color:#6b675f;line-height:1.55">
          תעודה זו מהווה תעודת זיכוי כמשמעה בתקנות מס ערך מוסף, ומקטינה את החיוב במס תשומות אצל הלקוח בסכום המע״מ הנקוב לעיל.
          ${inv ? `הסכום מקזז את חשבונית מס מקורית מס׳ ${inv.number} מתאריך ${formatDate(inv.date)}.` : ''}
          על הלקוח לכלול תעודה זו בדיווח התקופתי הקרוב למע״מ.
        </div>

        <!-- SIGNATURE -->
        <div class="dn-signature">
          <div class="dn-sig-block">
            <span class="dn-sig-label">חתימה וחותמת</span>
            <div class="dn-sig-line"></div>
            <span class="dn-sig-fineprint">${settings.companyName || 'בלסי סטור בע״מ'}</span>
          </div>
          <div class="dn-sig-block">
            <span class="dn-sig-label">אישור הלקוח</span>
            <div class="dn-sig-line"></div>
            <span class="dn-sig-fineprint">הלקוח מאשר את קבלת תעודת הזיכוי</span>
          </div>
        </div>

        <div class="dn-footer-print">
          <span>${settings.companyName || 'בלסי סטור בע״מ'} · ${settings.phone ? settings.phone + ' · ' : ''}${settings.email || 'balasistore5@gmail.com'}</span>
          <span>תעודת זיכוי ${cr.number}</span>
        </div>
      </div>
    `, [
      { label:'סגור', class:'btn-ghost', action:closeModal },
      { label:'חזור לכרטסת', class:'btn-ghost', action:() => { closeModal(); openLedger(cr.companyId); } },
      { label:'📜 היסטוריית הדפסות', class:'btn-ghost', action:() => showPrintHistory('credit', cr.id) },
      { label:'🖨 הדפס', class:'btn-primary', action:() => printDocument('credit', cr.id) }
    ]);
    document.getElementById('modalCard').style.maxWidth = '880px';
  }, 100);
}

/* ================================================================
   VIEW RECEIPT — קבלה for a recorded payment
   Designed to be visually consistent with viewInvoice / viewDeliveryNote.
   Shows: business header, recipient, payment details, linked invoice,
   amount in words for legal validity, signature, print support.
   ================================================================ */
function viewReceipt(id) {
  const rcp = DB.receipts.find(r => r.id === id);
  if (!rcp) { showToast('הקבלה לא נמצאה', 'error'); return; }
  const c = DB.companies.find(x => x.id === rcp.companyId);
  const account = (c?.accounts || []).find(a => a.isPrimary) || (c?.accounts || [])[0] || {};
  const branch  = (c?.branches || []).find(b => b.isPrimary) || (c?.branches || [])[0] || {};
  const settings = DB.settings || {};
  const inv = rcp.invoiceId ? DB.invoices.find(i => i.id === rcp.invoiceId) : null;
  // Calculate remaining balance on the linked invoice (if any)
  const invBalance = inv ? Math.round((inv.amount - (inv.paid || 0)) * 100) / 100 : 0;

  closeModal();
  setTimeout(() => {
    openModal(`קבלה ${rcp.number}`, `
      <div class="dn-document">
        <!-- DOCUMENT HEADER -->
        <div class="dn-doc-head">
          <div class="dn-doc-head-l">
            <img src="logo.svg" alt="Balasi Store" class="dn-logo" />
            <div class="dn-sender">
              <b>${settings.companyName || 'בלסי סטור בע״מ'}</b>
              <span>${settings.address || 'שונצינו 1, תל אביב'}${settings.addressNote ? ' (' + settings.addressNote + ')' : ''}</span>
              <span>${settings.phone ? 'טל׳ ' + settings.phone + ' · ' : ''}${settings.email || 'balasistore5@gmail.com'}</span>
              <span>ח.פ ${settings.taxId || '516127321'}</span>
            </div>
          </div>
          <div class="dn-doc-head-r">
            <div class="dn-doc-title">קבלה</div>
            <div class="dn-doc-num">${rcp.number}</div>
            <div style="margin:6px 0 4px">${renderCopyMarker(rcp)}</div>
            <div class="dn-doc-meta">
              <div><span>תאריך:</span><b>${formatDate(rcp.date)}</b></div>
              <div><span>אמצעי תשלום:</span><b>${rcp.method || '—'}</b></div>
            </div>
          </div>
        </div>

        <!-- RECIPIENT PANEL -->
        <div class="dn-recipient">
          <div class="dn-recipient-head">התקבל מאת</div>
          <div class="dn-recipient-grid">
            <div>
              <span class="dn-r-label">שם הלקוח</span>
              <b class="dn-r-name">${c?.name || '—'}</b>
              ${c?.taxId ? `<span class="dn-r-sub">ח.פ ${c.taxId}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">מספר לקוח</span>
              <b>${account.customerNumber || '—'}</b>
              ${account.label ? `<span class="dn-r-sub">${account.label}</span>` : ''}
            </div>
            <div>
              <span class="dn-r-label">כתובת</span>
              <b>${branch.address || c?.address || '—'}${c?.city ? ', ' + c.city : ''}</b>
            </div>
            <div>
              <span class="dn-r-label">פרטי קשר</span>
              <b>${c?.phone || '—'}</b>
              ${c?.email ? `<span class="dn-r-sub">${c.email}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- PAYMENT-AGAINST-INVOICE BANNER -->
        ${inv ? `
          <div class="dn-status-banner dn-status-billed" style="cursor:pointer" onclick="closeModal(); setTimeout(() => viewInvoice(${inv.id}), 120)">
            <span>🧾</span>
            <div>
              <b>תשלום על חשבון חשבונית ${inv.number}</b>
              <span>סכום החשבונית: ₪${formatNum(inv.amount)} · שולם עד כה: ₪${formatNum(inv.paid || 0)} · ${invBalance > 0 ? `יתרה: ₪${formatNum(invBalance)}` : 'סגורה במלואה'} · לחצו לצפייה בחשבונית</span>
            </div>
          </div>
        ` : `
          <div class="dn-status-banner dn-status-pending">
            <span>💵</span>
            <div>
              <b>תשלום שאינו משויך לחשבונית ספציפית</b>
              <span>הסכום נכלל בכרטסת הלקוח כתשלום פתוח</span>
            </div>
          </div>
        `}

        <!-- AMOUNT — large visual emphasis, since this is the entire content of a receipt -->
        <div style="padding:30px 32px 24px;text-align:center;background:#fff">
          <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#807a6e;font-weight:800;margin-bottom:10px">סכום שהתקבל</div>
          <div style="font-size:48px;font-weight:900;letter-spacing:-.03em;color:#1a1a17;line-height:1">
            ₪${formatNum(rcp.amount)}
          </div>
          <div style="font-size:13px;color:#6b675f;margin-top:10px;font-style:italic">
            ${amountToHebrewWords(rcp.amount)}
          </div>
        </div>

        <!-- PAYMENT DETAILS TABLE -->
        <div class="dn-items-wrap">
          <table class="dn-items">
            <thead>
              <tr>
                <th class="dn-th-name">פרט</th>
                <th class="dn-th-name">ערך</th>
              </tr>
            </thead>
            <tbody>
              <tr class="dn-line">
                <td class="dn-name-cell"><b>אמצעי תשלום</b></td>
                <td>${rcp.method || '—'}</td>
              </tr>
              ${rcp.ref ? `
                <tr class="dn-line">
                  <td class="dn-name-cell"><b>אסמכתא</b></td>
                  <td style="font-family:monospace">${rcp.ref}</td>
                </tr>
              ` : ''}
              <tr class="dn-line">
                <td class="dn-name-cell"><b>תאריך התשלום</b></td>
                <td>${formatDate(rcp.date)}</td>
              </tr>
              ${inv ? `
                <tr class="dn-line">
                  <td class="dn-name-cell"><b>חשבונית קשורה</b></td>
                  <td><span style="font-family:monospace">${inv.number}</span> · ${formatDate(inv.date)}</td>
                </tr>
              ` : ''}
              <tr class="dn-line">
                <td class="dn-name-cell"><b>מספר קבלה</b></td>
                <td style="font-family:monospace">${rcp.number}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${rcp.notes ? `<div class="dn-notes-box"><b>הערות:</b> ${rcp.notes}</div>` : ''}

        <!-- LEGAL FINE PRINT — required by Israeli tax law for a valid receipt -->
        <div style="margin:8px 32px 0;padding:10px 14px;background:#f8f6f0;border:1px solid #e0dccd;font-size:11px;color:#6b675f;line-height:1.5">
          קבלה זו מהווה אישור על קבלת התשלום בלבד. על פי הוראות מס הכנסה, הקבלה מנופקת כנגד החשבונית המקורית.
          ${inv ? `סכום זה נזקף לחשבונית מס׳ ${inv.number}.` : ''}
        </div>

        <!-- SIGNATURE -->
        <div class="dn-signature">
          <div class="dn-sig-block">
            <span class="dn-sig-label">חתימה וחותמת</span>
            <div class="dn-sig-line"></div>
            <span class="dn-sig-fineprint">${settings.companyName || 'בלסי סטור בע״מ'}</span>
          </div>
          <div class="dn-sig-block">
            <span class="dn-sig-label">פרטי המקבל</span>
            <div class="dn-sig-line"></div>
            <span class="dn-sig-fineprint">${rcp.method === 'מזומן' ? 'אישור קבלת התשלום במזומן' : `התקבל ב${rcp.method || ''}`}</span>
          </div>
        </div>

        <div class="dn-footer-print">
          <span>${settings.companyName || 'בלסי סטור בע״מ'} · ${settings.phone ? settings.phone + ' · ' : ''}${settings.email || 'balasistore5@gmail.com'}</span>
          <span>קבלה ${rcp.number}</span>
        </div>
      </div>
    `, [
      { label:'סגור', class:'btn-ghost', action:closeModal },
      ...(c ? [{ label:'חזור לכרטסת', class:'btn-ghost', action:() => { closeModal(); openLedger(c.id); } }] : []),
      { label:'📜 היסטוריית הדפסות', class:'btn-ghost', action:() => showPrintHistory('receipt', rcp.id) },
      { label:'🖨 הדפס', class:'btn-primary', action:() => printDocument('receipt', rcp.id) }
    ]);
    document.getElementById('modalCard').style.maxWidth = '880px';
  }, 100);
}

/* Convert a number to Hebrew words for receipt validity (e.g. "אלף ושני שקלים").
   Covers 0 → 999,999,999 (just under one billion). For higher amounts or
   negatives it falls back to a numeric label. Israeli law doesn't strictly
   require amount-in-words on receipts, but it's a common professional
   practice that prevents tampering — and a key marker of legitimacy. */
function amountToHebrewWords(amount) {
  const num = Math.floor(amount);
  const cents = Math.round((amount - num) * 100);
  if (num < 0 || num > 999999999) return `${formatNum(amount)} שקלים חדשים`;

  const ones        = ['', 'אחד',  'שניים',  'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'];
  // Construct (smichut) form used before "אלפים" — e.g. "שלושת אלפים", "ארבעת אלפים"
  const onesSmichut = ['', '',     'שני',    'שלושת', 'ארבעת', 'חמשת',  'ששת',  'שבעת', 'שמונת', 'תשעת'];
  const teens       = ['עשרה', 'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר', 'שישה עשר', 'שבעה עשר', 'שמונה עשר', 'תשעה עשר'];
  const tens        = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];
  const hundreds    = ['', 'מאה', 'מאתיים', 'שלוש מאות', 'ארבע מאות', 'חמש מאות', 'שש מאות', 'שבע מאות', 'שמונה מאות', 'תשע מאות'];

  /* Convert any value 0-999 to Hebrew words. */
  function under1000(n) {
    if (n === 0) return '';
    const parts = [];
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h) parts.push(hundreds[h]);
    if (r >= 10 && r < 20) {
      parts.push(teens[r - 10]);
    } else if (r >= 20) {
      const t = Math.floor(r / 10);
      const u = r % 10;
      parts.push(tens[t] + (u ? ' ו' + ones[u] : ''));
    } else if (r > 0) {
      parts.push(ones[r]);
    }
    return parts.join(' ו');
  }

  /* The "thousands" segment, with its trailing "אלף" / "אלפים". */
  function thousandsLabel(n) {
    if (n === 0) return '';
    if (n === 1) return 'אלף';
    if (n === 2) return 'אלפיים';
    if (n >= 3 && n <= 9)   return onesSmichut[n] + ' אלפים';
    if (n === 10)           return 'עשרת אלפים';
    if (n >= 11 && n <= 19) return teens[n - 10] + ' אלף';
    // 20-999 thousands — use the regular under1000 form + singular "אלף"
    return under1000(n) + ' אלף';
  }

  /* The "millions" segment, with its trailing "מיליון". */
  function millionsLabel(n) {
    if (n === 0) return '';
    if (n === 1) return 'מיליון';
    if (n === 2) return 'שני מיליון';
    if (n >= 3 && n <= 9) return ones[n] + ' מיליון';
    return under1000(n) + ' מיליון';
  }

  // Decompose into millions / thousands / units
  const millions  = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const units     = num % 1000;

  const segments = [];
  if (millions  > 0) segments.push(millionsLabel(millions));
  if (thousands > 0) segments.push(thousandsLabel(thousands));
  if (units     > 0) segments.push(under1000(units));

  let result = segments.length === 0 ? 'אפס' : segments.join(' ');

  result += num === 1 ? ' שקל חדש' : ' שקלים חדשים';

  if (cents > 0) {
    result += ' ו' + under1000(cents) + (cents === 1 ? ' אגורה' : ' אגורות');
  }
  return result;
}

/* New transaction creators */
function newDeliveryNote(companyId) {
  const productOpts = DB.products.map(p => `<option value="${p.id}">${p.name} — ₪${p.price}</option>`).join('');
  window._dnLines = [];
  closeModal();
  setTimeout(() => {
    openModal('תעודת משלוח חדשה', `
      <form id="dnForm" onsubmit="saveDeliveryNote(event, ${companyId})" style="padding:0">
        <div class="form-grid">
          <div class="field"><label>תאריך מסירה</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" /></div>
          <div class="field"><label>נמסר ע"י</label><input type="text" name="deliveredBy" placeholder="שם הנהג" /></div>
          <div class="field full"><label>הערות</label><textarea name="notes" rows="2"></textarea></div>
          <div class="field full">
            <label>הוסף פריט</label>
            <div style="display:flex;gap:8px">
              <select id="dnProduct" style="flex:1;padding:10px 12px;border:1.5px solid var(--line)"><option value="">בחרו מוצר</option>${productOpts}</select>
              <input type="number" id="dnQty" value="1" min="1" style="width:80px" />
              <button type="button" class="btn btn-ghost" onclick="addDnLine()">+</button>
            </div>
            <div id="dnLines" style="margin-top:10px"></div>
            <div id="dnTotal" style="margin-top:10px;font-weight:800;text-align:left"></div>
          </div>
        </div>
      </form>
    `, [
      { label:'ביטול', class:'btn-ghost', action:() => { closeModal(); openLedger(companyId); } },
      { label:'צור תעודה', class:'btn-primary', action:() => document.getElementById('dnForm').requestSubmit() }
    ]);
  }, 100);
}

function addDnLine() {
  const pid = Number(document.getElementById('dnProduct').value);
  const qty = Number(document.getElementById('dnQty').value);
  if (!pid || !qty) return;
  const p = DB.products.find(x => x.id === pid);
  if (!p) return;
  window._dnLines.push({ pid, qty, price: p.price });
  renderDnLines();
}

function removeDnLine(idx) {
  window._dnLines.splice(idx, 1);
  renderDnLines();
}

function renderDnLines() {
  const wrap = document.getElementById('dnLines');
  if (!wrap) return;
  wrap.innerHTML = window._dnLines.map((line, i) => {
    const p = DB.products.find(x => x.id === line.pid);
    if (!p) return '';
    return `<div style="display:flex;justify-content:space-between;padding:8px;background:var(--bg);margin-bottom:4px">
      <span>${p.icon} ${p.name} × ${line.qty}</span>
      <span><b>₪${formatNum(line.price * line.qty)}</b> <button type="button" onclick="removeDnLine(${i})" style="color:var(--danger);margin-right:8px">×</button></span>
    </div>`;
  }).join('');
  const total = window._dnLines.reduce((s,l) => s + l.price * l.qty, 0);
  document.getElementById('dnTotal').textContent = `סה"כ: ₪${formatNum(total)}`;
}

function saveDeliveryNote(e, companyId) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  if (!window._dnLines.length) { showToast('הוסיפו לפחות פריט אחד', 'error'); return; }
  const total = window._dnLines.reduce((s,l) => s + l.price * l.qty, 0);
  const newId = Math.max(0, ...DB.deliveryNotes.map(d => d.id)) + 1;
  const number = 'DN-2026-' + String(newId).padStart(4, '0');
  DB.deliveryNotes.push({
    id:newId, number, companyId, orderId:null, invoiceId:null,
    date:d.date, deliveredBy:d.deliveredBy, notes:d.notes,
    items:window._dnLines, total
  });
  DB.save('deliveryNotes');
  showToast('תעודת המשלוח נוצרה');
  closeModal();
  setTimeout(() => openLedger(companyId), 200);
}

function newReceipt(companyId) {
  const openInvoices = DB.invoices.filter(i => i.companyId === companyId && i.amount > i.paid);
  const invOpts = openInvoices.map(i => `<option value="${i.id}">${i.number} - ${formatDate(i.date)} - יתרה ₪${formatNum(i.amount - i.paid)}</option>`).join('');
  closeModal();
  setTimeout(() => {
    openModal('קבלה חדשה', `
      <form id="rcpForm" onsubmit="saveReceipt(event, ${companyId})">
        <div class="form-grid">
          <div class="field full"><label>חשבונית לתשלום</label>
            <select name="invoiceId">
              <option value="">לא משויך לחשבונית ספציפית</option>
              ${invOpts}
            </select>
          </div>
          <div class="field"><label>תאריך</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" /></div>
          <div class="field"><label>סכום (₪)</label><input type="number" step="0.01" name="amount" required /></div>
          <div class="field"><label>אמצעי תשלום</label>
            <select name="method"><option>העברה בנקאית</option><option>אשראי</option><option>המחאה</option><option>מזומן</option></select>
          </div>
          <div class="field full"><label>הערות</label><input type="text" name="notes" /></div>
        </div>
      </form>
    `, [
      { label:'ביטול', class:'btn-ghost', action:() => { closeModal(); openLedger(companyId); } },
      { label:'הפק קבלה', class:'btn-primary', action:() => document.getElementById('rcpForm').requestSubmit() }
    ]);
  }, 100);
}

function saveReceipt(e, companyId) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  d.amount = Number(d.amount);
  const newId = Math.max(0, ...DB.receipts.map(r => r.id)) + 1;
  const number = 'RCP-2026-' + String(newId).padStart(4, '0');
  DB.receipts.push({
    id:newId, number, companyId,
    invoiceId: d.invoiceId ? Number(d.invoiceId) : null,
    date:d.date, amount:d.amount, method:d.method, notes:d.notes
  });

  // Apply payment to invoice if linked
  if (d.invoiceId) {
    const inv = DB.invoices.find(i => i.id === Number(d.invoiceId));
    if (inv) inv.paid = Math.min(inv.amount, inv.paid + d.amount);
  }

  DB.save();
  showToast('הקבלה הופקה ונרשמה');
  closeModal();
  setTimeout(() => openLedger(companyId), 200);
}

function newCredit(companyId) {
  const recentInvoices = DB.invoices.filter(i => i.companyId === companyId).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10);
  const invOpts = recentInvoices.map(i => `<option value="${i.id}">${i.number} - ${formatDate(i.date)}</option>`).join('');
  closeModal();
  setTimeout(() => {
    openModal('זיכוי חדש', `
      <form id="crdForm" onsubmit="saveCredit(event, ${companyId})">
        <div class="form-grid">
          <div class="field full"><label>חשבונית קשורה</label>
            <select name="relatedInvoiceId">
              <option value="">ללא קישור לחשבונית</option>
              ${invOpts}
            </select>
          </div>
          <div class="field"><label>תאריך</label><input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" /></div>
          <div class="field"><label>סכום זיכוי (₪)</label><input type="number" step="0.01" name="amount" required /></div>
          <div class="field full"><label>סיבת זיכוי</label>
            <select name="reason">
              <option>מוצר פגום</option>
              <option>אריזה פגומה</option>
              <option>תאריך תפוגה קצר</option>
              <option>טעות בהזמנה</option>
              <option>החזרת מוצר</option>
              <option>אחר</option>
            </select>
          </div>
          <div class="field full"><label>הערות</label><textarea name="notes" rows="2"></textarea></div>
        </div>
      </form>
    `, [
      { label:'ביטול', class:'btn-ghost', action:() => { closeModal(); openLedger(companyId); } },
      { label:'הפק זיכוי', class:'btn-primary', action:() => document.getElementById('crdForm').requestSubmit() }
    ]);
  }, 100);
}

function saveCredit(e, companyId) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  d.amount = Number(d.amount);
  const newId = Math.max(0, ...DB.credits.map(c => c.id)) + 1;
  const number = 'CRD-2026-' + String(newId).padStart(4, '0');
  DB.credits.push({
    id:newId, number, companyId,
    relatedInvoiceId: d.relatedInvoiceId ? Number(d.relatedInvoiceId) : null,
    date:d.date, amount:d.amount, reason:d.reason, notes:d.notes,
    items:[]
  });
  DB.save('credits');
  showToast('הזיכוי הופק');
  closeModal();
  setTimeout(() => openLedger(companyId), 200);
}

/* ---------- CUSTOMERS ---------- */
function renderCustomers() {
  const tbody = document.querySelector('#customersTable tbody');
  const search = document.getElementById('customersSearch').value.trim().toLowerCase();
  const compFilter = document.getElementById('customersCompanyFilter').value;
  let list = DB.customers.slice();
  if (search) list = list.filter(c => c.name.toLowerCase().includes(search) || (c.email && c.email.includes(search)));
  if (compFilter !== 'all') {
    const cid = Number(compFilter);
    list = list.filter(c => userHasAccessToCompany(c, cid));
  }
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><h4>אין לקוחות להצגה</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => {
    const accessList = c.accessList || [];
    const uniqueCompanyIds = [...new Set(accessList.map(a => a.companyId))];
    const companyNames = uniqueCompanyIds.map(cid => DB.companies.find(x => x.id === cid)?.name).filter(Boolean);
    const companyDisplay = companyNames.length === 0 ? '—' :
      companyNames.length === 1 ? companyNames[0] :
      `<b>${companyNames[0]}</b> + ${companyNames.length - 1} נוספות`;
    const multiCompanyBadge = uniqueCompanyIds.length > 1 ? '<span class="pill pill-warn" style="margin-right:4px">🔗 רב-חברתי</span>' : '';
    const rolesUsed = [...new Set(accessList.map(a => a.role))];
    const roleBadges = rolesUsed.map(r => {
      const cls = r === 'approver' ? 'pill-warn' : (r === 'viewer' ? 'pill-neutral' : 'pill-success');
      const lbl = r === 'approver' ? '✓ מאשר נוסף' : (r === 'viewer' ? '👁 צופה' : '🛒 מזמין');
      return `<span class="pill ${cls}" style="margin-left:4px">${lbl}</span>`;
    }).join('');

    return `<tr>
      <td class="strong-cell">${c.name}<div style="margin-top:4px">${roleBadges}</div></td>
      <td class="muted-cell">${c.role || '—'}</td>
      <td>${companyDisplay}<div style="margin-top:4px">${multiCompanyBadge}<span class="muted-cell" style="font-size:11px">${accessList.length} הרשאות</span></div></td>
      <td class="muted-cell">${c.phone || '—'}</td>
      <td class="muted-cell">${c.email || '—'}</td>
      <td class="muted-cell">${formatDate(c.addedAt)}</td>
      <td>
        <button class="row-action" onclick="openCustomerModal(${c.id})">עריכה</button>
        <button class="row-action row-action-danger" onclick="deleteCustomer(${c.id})">×</button>
      </td>
    </tr>`;
  }).join('');
}

function openCustomerModal(id, defaultCompanyId) {
  const c = id ? DB.customers.find(x => x.id === id) : null;
  // Initialize access list for new user with default company
  let accessList = c?.accessList ? JSON.parse(JSON.stringify(c.accessList)) : [];
  if (!accessList.length && defaultCompanyId) {
    const co = DB.companies.find(x => x.id === defaultCompanyId);
    if (co) {
      const branch = (co.branches || []).find(b => b.isPrimary) || (co.branches || [])[0];
      const account = (co.accounts || []).find(a => a.isPrimary) || (co.accounts || [])[0];
      if (branch && account) {
        accessList.push({ companyId:defaultCompanyId, branchId:branch.id, accountId:account.id, role:'orderer' });
      }
    }
  }

  window._editingAccessList = accessList;

  openModal(c ? `עריכת משתמש — ${c.name}` : 'משתמש חדש', `
    <form id="customerForm" onsubmit="saveCustomer(event, ${id || 'null'})">
      <div class="cm-info" style="margin:0 0 18px">
        <span class="cm-info-icon">👥</span>
        <p><b>משתמש</b> יכול להיות מורשה במספר חברות, בכל חברה במספר סניפים וחשבונות. ברירת המחדל היא <b>מזמין</b> — הזמנות יוצאות מיד ללא צורך באישור נוסף. אפשר גם לסמן משתמש כ<b>מאשר נוסף</b> (אופציונלי, רלוונטי רק למי שיפעיל מערכת אישורים בעתיד) או כ<b>צופה בלבד</b>.</p>
      </div>

      <div class="form-grid">
        <div class="field"><label>שם מלא <span class="req">*</span></label><input type="text" name="name" required value="${c?.name || ''}" /></div>
        <div class="field"><label>תפקיד</label><input type="text" name="role" value="${c?.role || ''}" placeholder="לדוגמה: מנהלת משרד" /></div>
        <div class="field"><label>טלפון</label><input type="text" name="phone" value="${c?.phone || ''}" /></div>
        <div class="field"><label>דוא"ל <span class="req">*</span></label><input type="email" name="email" required value="${c?.email || ''}" /></div>
      </div>

      <div class="cm-section-title">
        <span>הרשאות גישה</span>
        <button type="button" class="row-action row-action-primary" onclick="addAccessRow()">+ הוסף הרשאה</button>
      </div>
      <div id="accessRows" class="cm-access-rows"></div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'שמור', class:'btn-primary', action:() => document.getElementById('customerForm').requestSubmit() }
  ]);
  document.getElementById('modalCard').style.maxWidth = '780px';
  renderAccessRows();
}

function renderAccessRows() {
  const wrap = document.getElementById('accessRows');
  if (!wrap) return;
  const list = window._editingAccessList || [];
  if (!list.length) {
    wrap.innerHTML = `<div class="empty"><h4>אין הרשאות</h4><p>הוסיפו הרשאה אחת לפחות כדי שהמשתמש יוכל להזמין</p></div>`;
    return;
  }
  wrap.innerHTML = list.map((acc, i) => {
    const c = DB.companies.find(x => x.id === acc.companyId);
    const compOpts = DB.companies.map(co => `<option value="${co.id}" ${co.id === acc.companyId ? 'selected' : ''}>${co.name}</option>`).join('');
    const branchOpts = (c?.branches || []).map(b => `<option value="${b.id}" ${b.id === acc.branchId ? 'selected' : ''}>${b.label}${b.isPrimary ? ' (ראשי)' : ''}</option>`).join('');
    const accountOpts = (c?.accounts || []).map(a => `<option value="${a.id}" ${a.id === acc.accountId ? 'selected' : ''}>${a.label} (${a.customerNumber})</option>`).join('');
    return `
      <div class="cm-access-row">
        <div class="cm-access-num">${i + 1}</div>
        <div class="cm-access-body">
          <div class="cm-access-grid">
            <div class="field">
              <label>חברה</label>
              <select onchange="updateAccessRow(${i},'companyId',this.value)">${compOpts}</select>
            </div>
            <div class="field">
              <label>סניף</label>
              <select onchange="updateAccessRow(${i},'branchId',this.value)">${branchOpts || '<option>—</option>'}</select>
            </div>
            <div class="field">
              <label>חשבון</label>
              <select onchange="updateAccessRow(${i},'accountId',this.value)">${accountOpts || '<option>—</option>'}</select>
            </div>
            <div class="field">
              <label>תפקיד</label>
              <select onchange="updateAccessRow(${i},'role',this.value)">
                <option value="orderer" ${acc.role === 'orderer' ? 'selected' : ''}>🛒 מזמין — הזמנות יוצאות ישירות</option>
                <option value="approver" ${acc.role === 'approver' ? 'selected' : ''}>✓ מאשר נוסף (אופציונלי)</option>
                <option value="viewer" ${acc.role === 'viewer' ? 'selected' : ''}>👁 צופה בלבד</option>
              </select>
            </div>
          </div>
        </div>
        <button type="button" class="cm-access-rm" onclick="removeAccessRow(${i})" aria-label="הסר">×</button>
      </div>
    `;
  }).join('');
}

function addAccessRow() {
  if (!window._editingAccessList) window._editingAccessList = [];
  // Default to first company / branch / account
  const c = DB.companies[0];
  if (!c) return;
  const branch = (c.branches || []).find(b => b.isPrimary) || (c.branches || [])[0];
  const account = (c.accounts || []).find(a => a.isPrimary) || (c.accounts || [])[0];
  window._editingAccessList.push({
    companyId:c.id, branchId:branch?.id, accountId:account?.id, role:'orderer'
  });
  renderAccessRows();
}

function removeAccessRow(i) {
  window._editingAccessList.splice(i, 1);
  renderAccessRows();
}

function updateAccessRow(i, field, value) {
  if (!window._editingAccessList[i]) return;
  if (field === 'companyId') {
    value = Number(value);
    window._editingAccessList[i].companyId = value;
    // Reset branch and account when company changes
    const c = DB.companies.find(x => x.id === value);
    const branch = (c?.branches || []).find(b => b.isPrimary) || (c?.branches || [])[0];
    const account = (c?.accounts || []).find(a => a.isPrimary) || (c?.accounts || [])[0];
    window._editingAccessList[i].branchId = branch?.id;
    window._editingAccessList[i].accountId = account?.id;
    renderAccessRows();
    return;
  }
  window._editingAccessList[i][field] = value;
}

function saveCustomer(e, id) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const accessList = window._editingAccessList || [];
  if (!accessList.length) {
    showToast('יש להוסיף לפחות הרשאה אחת', 'error');
    return;
  }
  const payload = {
    name: d.name,
    role: d.role,
    phone: d.phone,
    email: d.email,
    companyId: accessList[0].companyId, // legacy/primary
    accessList
  };
  if (id) {
    Object.assign(DB.customers.find(c => c.id === id), payload);
    showToast('המשתמש עודכן');
  } else {
    const newId = Math.max(0, ...DB.customers.map(c => c.id)) + 1;
    DB.customers.push({ id:newId, ...payload, addedAt: new Date().toISOString().split('T')[0] });
    showToast('המשתמש נוסף');
  }
  DB.save('customers');
  closeModal();
  renderCustomers();
  renderCompanies();
}

function deleteCustomer(id) {
  if (!confirm('למחוק את איש הקשר?')) return;
  DB.customers = DB.customers.filter(c => c.id !== id);
  DB.save('customers');
  renderCustomers();
  renderCompanies();
  showToast('הלקוח נמחק');
}

/* ---------- PRODUCTS ---------- */
/* CAT_NAMES is rebuilt from DB.categories whenever categories change.
   The rest of admin.js still references CAT_NAMES directly, so this stays in sync. */
let CAT_NAMES = {
  coffee:'שתייה חמה', drinks:'שתייה קרה', snacks:'חטיפים מליחים', sweets:'חטיפים מתוקים',
  bakery:'מאפים', dairy:'חלב וגבינות', fruits:'פירות', meals:'ארוחות', healthy:'בריאות',
  disposable:'כלים חד-פעמיים', cleaning:'ניקיון'
};
function rebuildCatNames() {
  if (!DB?.categories) return;
  const map = {};
  DB.categories.slice().sort((a,b) => (a.order || 0) - (b.order || 0)).forEach(c => { map[c.id] = c.name; });
  CAT_NAMES = map;
}

function renderProducts() {
  const tbody = document.querySelector('#productsTable tbody');
  if (!tbody) return;
  const searchEl = document.getElementById('productsSearch');
  const rawSearch = (searchEl?.value || '').trim().toLowerCase();
  // Split multi-word queries on whitespace — every token must match somewhere in the product
  const searchTokens = rawSearch ? rawSearch.split(/\s+/).filter(Boolean) : [];
  const catFilter = document.getElementById('productsCatFilter')?.value || 'all';
  const stockFilter = document.getElementById('productsStockFilter')?.value || 'all';
  const supplierFilterEl = document.getElementById('productsSupplierFilter');
  const supplierFilter = supplierFilterEl ? supplierFilterEl.value : 'all';
  let list = DB.products.slice();
  if (searchTokens.length) {
    list = list.filter(p => {
      // Build one combined haystack from every searchable field
      const haystack = [
        p.name,
        p.brand,
        p.sku,
        p.barcode,
        p.supplier,
        p.unit,
        CAT_NAMES?.[p.cat],
        p.cat
      ].filter(Boolean).join(' ').toLowerCase();
      return searchTokens.every(tok => haystack.includes(tok));
    });
  }
  if (catFilter !== 'all') list = list.filter(p => p.cat === catFilter);
  if (supplierFilter && supplierFilter !== 'all') {
    if (supplierFilter === '__none__') list = list.filter(p => !p.supplier);
    else list = list.filter(p => p.supplier === supplierFilter);
  }
  if (stockFilter !== 'all') list = list.filter(p => stockKey(p) === stockFilter);

  // Populate category filter
  const catSel = document.getElementById('productsCatFilter');
  if (catSel && catSel.options.length <= 1) {
    catSel.innerHTML = '<option value="all">כל הקטגוריות</option>' + Object.entries(CAT_NAMES).map(([k,n]) => `<option value="${k}">${n}</option>`).join('');
  }

  // Populate supplier filter from existing products + supplier-invoices
  if (supplierFilterEl) {
    const supSet = new Set();
    DB.products.forEach(x => { if (x.supplier) supSet.add(x.supplier); });
    (DB.suppliers || []).forEach(s => { if (s.supplier) supSet.add(s.supplier); });
    const sortedSups = Array.from(supSet).sort((a,b) => a.localeCompare(b,'he'));
    const prevVal = supplierFilterEl.value;
    supplierFilterEl.innerHTML =
      '<option value="all">כל הספקים</option>' +
      '<option value="__none__">— ללא ספק —</option>' +
      sortedSups.map(s => `<option value="${s}">${s}</option>`).join('');
    if (Array.from(supplierFilterEl.options).some(o => o.value === prevVal)) supplierFilterEl.value = prevVal;
  }

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="12"><div class="empty"><h4>לא נמצאו מוצרים</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => {
    const sk = stockKey(p);
    const stockColor = sk === 'out' ? 'var(--danger)' : (sk === 'low' ? 'var(--orange-2)' : 'var(--green-2)');
    const vatBadge = isProductVatExempt(p) ? '<span class="pill pill-success" style="margin-right:4px;font-size:9.5px">ללא מע״מ</span>' : '';
    const hiddenBadge = p.hidden ? '<span class="pill pill-neutral" style="margin-right:4px;font-size:9.5px" title="לא מוצג באתר הציבורי">🚫 מוסתר</span>' : '';
    const rowOpacity = p.hidden ? 'style="opacity:.65"' : '';
    const thumb = p.image
      ? `<div style="width:38px;height:38px;border-radius:8px;background:#f4f6f3 center/cover no-repeat url('${p.image.replace(/'/g, "\\'")}');border:1px solid var(--line)"></div>`
      : `<div style="width:38px;height:38px;border-radius:8px;background:#f4f6f3;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:18px">${p.icon || '📦'}</div>`;
    return `<tr ${rowOpacity}>
      <td>${thumb}</td>
      <td class="muted-cell">${p.sku}</td>
      <td class="muted-cell" style="font-family:monospace;font-size:11.5px">${p.barcode || '—'}</td>
      <td class="strong-cell">${p.name}${vatBadge}${hiddenBadge}</td>
      <td>${CAT_NAMES[p.cat] || p.cat}</td>
      <td>${p.brand || '—'}</td>
      <td>${p.supplier || '—'}</td>
      <td class="muted-cell">${p.unit}</td>
      <td class="price-cell">₪${p.price}</td>
      <td style="color:${stockColor};font-weight:700">${p.stock}</td>
      <td>${stockPill(sk)}</td>
      <td>
        <button class="row-action" onclick="openProductModal(${p.id})">עריכה</button>
      </td>
    </tr>`;
  }).join('');
}

function openProductModal(id) {
  const p = id ? DB.products.find(x => x.id === id) : null;
  const catOpts = Object.entries(CAT_NAMES).map(([k,n]) => `<option value="${k}" ${p?.cat === k ? 'selected' : ''}>${n}</option>`).join('');
  const isExempt = p ? isProductVatExempt(p) : false;
  // If user explicitly set vatExempt, use that. Otherwise show category default.
  const explicitFlag = p && typeof p.vatExempt === 'boolean';
  // Build a unique list of suppliers from existing supplier invoices + existing products' supplier field
  const supplierSet = new Set();
  (DB.suppliers || []).forEach(s => { if (s?.supplier) supplierSet.add(s.supplier); });
  (DB.products || []).forEach(x => { if (x?.supplier) supplierSet.add(x.supplier); });
  const supplierOptions = Array.from(supplierSet).sort((a,b) => a.localeCompare(b,'he')).map(s => `<option value="${s}"></option>`).join('');
  // initial margin%
  const initialMargin = (p && Number(p.price) > 0 && Number(p.cost) > 0)
    ? Math.round(((p.price - p.cost) / p.price) * 1000) / 10
    : '';
  const initialImage = p?.image || '';
  const previewSrc = initialImage || '';
  // Purchase history (only when editing an existing product)
  const history = p ? getProductPurchaseHistory(p) : [];
  const historyHTML = renderPurchaseHistoryHTML(history);
  openModal(p ? 'עריכת מוצר' : 'מוצר חדש', `
    <form id="productForm" onsubmit="saveProduct(event, ${id || 'null'})">
      <div class="form-grid">
        <div class="field full" style="display:flex;gap:14px;align-items:flex-start;border-bottom:1px dashed var(--line);padding-bottom:14px">
          <div id="pmImagePreview" style="width:96px;height:96px;border-radius:12px;background:#f4f6f3 center/cover no-repeat;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:42px;flex-shrink:0;${previewSrc ? `background-image:url('${previewSrc}')` : ''}">
            ${previewSrc ? '' : (p?.icon || '📦')}
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px">
            <label style="font-size:12px;font-weight:600;color:var(--text)">תמונת מוצר</label>
            <input type="hidden" name="image" id="pmImage" value="${initialImage}" />
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <label class="btn btn-ghost" style="cursor:pointer;font-size:12px;margin:0;padding:6px 12px">
                📷 העלאה מהמחשב
                <input type="file" accept="image/*" style="display:none" onchange="handleProductImageUpload(this)" />
              </label>
              <button type="button" class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="promptProductImageUrl()">🔗 הדבקת קישור</button>
              ${initialImage ? '<button type="button" class="btn btn-ghost" style="font-size:12px;padding:6px 12px;color:var(--danger)" onclick="clearProductImage()">🗑 הסר תמונה</button>' : ''}
            </div>
            <div style="font-size:11px;color:var(--muted)">JPG / PNG / WebP — התמונה תוקטן אוטומטית ל-600px לחיסכון במקום</div>
          </div>
        </div>
        <div class="field"><label>מק"ט</label><input type="text" name="sku" value="${p?.sku || ''}" placeholder="BLS-XXXX" /></div>
        <div class="field"><label>אייקון</label><input type="text" name="icon" value="${p?.icon || '📦'}" maxlength="3" /></div>
        <div class="field full"><label>שם המוצר <span class="req">*</span></label><input type="text" name="name" required value="${p?.name || ''}" /></div>
        <div class="field">
          <label>ברקוד</label>
          <input type="text" name="barcode" value="${p?.barcode || ''}" placeholder="לדוגמה: 7290000123456" inputmode="numeric" pattern="[0-9]*" autocomplete="off" />
        </div>
        <div class="field"><label>קטגוריה <span class="req">*</span></label><select name="cat" required onchange="onProductCatChange()">${catOpts}</select></div>
        <div class="field">
          <label>תת-קטגוריה</label>
          <select name="subcat" id="pmSubcat">${buildSubcatOptions(p?.cat, getProductSubcatValue(p))}</select>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">בלסי לקוחות יוכלו לסנן לפי תת-קטגוריה זו בצ׳יפסים מעל הקטלוג.</div>
        </div>
        <div class="field"><label>יצרן</label><input type="text" name="brand" value="${p?.brand || ''}" /></div>
        <div class="field">
          <label>ספק</label>
          <input type="text" name="supplier" list="productSupplierOptions" value="${p?.supplier || ''}" placeholder="שם הספק (ניתן לבחור או להקליד חדש)" autocomplete="off" />
          <datalist id="productSupplierOptions">${supplierOptions}</datalist>
        </div>
        <div class="field"><label>יחידת מידה <span class="req">*</span></label><input type="text" name="unit" required value="${p?.unit || ''}" placeholder="100 גרם / מארז 6" /></div>
        <div class="field"><label>עלות (₪)</label><input type="number" step="0.5" id="pmCost" name="cost" value="${p?.cost || ''}" oninput="recalcMarginFromCostPrice()" /></div>
        <div class="field"><label>מחיר מכירה (₪) <span class="req">*</span></label><input type="number" step="0.5" id="pmPrice" name="price" required value="${p?.price || ''}" oninput="recalcMarginFromCostPrice()" /></div>
        <div class="field">
          <label>אחוז רווח (%)</label>
          <input type="number" step="0.1" id="pmMargin" value="${initialMargin}" placeholder="חישוב אוטומטי" oninput="applyMarginToPrice()" />
        </div>
        <div class="field" style="display:flex;align-items:flex-end">
          <div id="pmProfitLabel" style="font-size:12px;color:var(--muted);line-height:1.5">
            ${(p && p.price && p.cost) ? `רווח ליחידה: ₪${(p.price - p.cost).toFixed(2)}` : 'הזינו עלות ומחיר לחישוב הרווח'}
          </div>
        </div>
        <div class="field"><label>מלאי נוכחי</label><input type="number" name="stock" value="${p?.stock || 0}" /></div>
        <div class="field"><label>סף מלאי קטן</label><input type="number" name="low" value="${p?.low || 10}" /></div>
        <div class="field full" style="border-top:1px dashed var(--line);padding-top:12px;margin-top:6px">
          <label class="check" style="cursor:pointer">
            <input type="checkbox" name="vatExempt" ${isExempt ? 'checked' : ''} />
            <span>
              <b>פטור ממע״מ</b>
              <div style="font-size:11.5px;color:var(--muted);margin-top:2px">
                לפי החוק בישראל, פירות וירקות טריים, תמרים ומוצרי מזון בסיסיים מסוימים פטורים ממע״מ.
                ${!explicitFlag && p?.cat === 'fruits' ? '<br><b style="color:var(--green-2)">קטגוריית פירות וירקות מסומנת כפטורה כברירת מחדל</b>' : ''}
              </div>
            </span>
          </label>
        </div>
        <div class="field full" style="border-top:1px dashed var(--line);padding-top:12px;margin-top:0">
          <label class="check" style="cursor:pointer">
            <input type="checkbox" name="hidden" ${p?.hidden ? 'checked' : ''} />
            <span>
              <b>הסתר מהאתר הציבורי</b>
              <div style="font-size:11.5px;color:var(--muted);margin-top:2px">
                המוצר לא יוצג כלל בקטלוג שמופיע ללקוחות (לא יופיע אפילו כ"אזל מהמלאי"). באדמין ימשיך להופיע רגיל.
              </div>
            </span>
          </label>
        </div>
        ${p ? `
        <div class="field full" style="border-top:1px solid var(--line);padding-top:14px;margin-top:6px">
          <label style="font-weight:700;font-size:13.5px;color:var(--text);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
            <span>📜 היסטוריית רכישות</span>
            <span style="font-size:11px;font-weight:500;color:var(--muted)">${history.length} רכישות מתועדות</span>
          </label>
          ${historyHTML}
        </div>` : ''}
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'שמור', class:'btn-primary', action:() => document.getElementById('productForm').requestSubmit() }
  ]);
}

/* Aggregate every purchase of this product across DB.suppliers (supplier invoices).
   Match by barcode first, then fall back to product name. Returns a list sorted by date desc. */
function getProductPurchaseHistory(product) {
  if (!product) return [];
  const records = [];
  const matchByName = (lineName, prodName) => {
    if (!lineName || !prodName) return false;
    const a = lineName.toLowerCase().replace(/\s+/g, ' ').trim();
    const b = prodName.toLowerCase().replace(/\s+/g, ' ').trim();
    return a.includes(b) || b.includes(a);
  };
  (DB.suppliers || []).forEach(inv => {
    (inv.lines || []).forEach(line => {
      const byBarcode = product.barcode && line.barcode && line.barcode === product.barcode;
      const byName = !byBarcode && matchByName(line.productName || line.name, product.name);
      if (!byBarcode && !byName) return;
      const grossUnit = Number(line.purchasePrice) || 0;
      const discount = Number(line.discount) || 0;
      const netUnit = grossUnit * (1 - discount / 100);
      records.push({
        date: inv.date,
        invoiceNumber: inv.number,
        invoiceId: inv.id,
        supplier: inv.supplier,
        qty: Number(line.qty) || 0,
        grossUnit,
        discount,
        netUnit,
        sellingPrice: Number(line.sellingPrice) || 0,
        total: netUnit * (Number(line.qty) || 0)
      });
    });
  });
  records.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  return records;
}

function renderPurchaseHistoryHTML(history) {
  if (!history.length) {
    return `<div style="padding:20px;text-align:center;background:#fafbf8;border:1px dashed var(--line);border-radius:10px;color:var(--muted);font-size:12.5px">
      טרם תועדו רכישות עבור מוצר זה. רכישות יתועדו אוטומטית עם הזנת חשבונית ספק שמכילה את הברקוד או את שם המוצר.
    </div>`;
  }
  const fmtDate = d => d ? new Date(d).toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
  const totalQty   = history.reduce((s, r) => s + r.qty, 0);
  const totalSpend = history.reduce((s, r) => s + r.total, 0);
  const avgUnit    = totalQty > 0 ? totalSpend / totalQty : 0;
  const minUnit    = Math.min(...history.map(r => r.netUnit));
  const maxUnit    = Math.max(...history.map(r => r.netUnit));
  // Summary cards
  const summary = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:10px">
      <div style="background:#f4f6f3;border-radius:8px;padding:8px 10px">
        <div style="font-size:10.5px;color:var(--muted)">סה"כ רכישות</div>
        <div style="font-size:14px;font-weight:700">${history.length} פעמים</div>
      </div>
      <div style="background:#f4f6f3;border-radius:8px;padding:8px 10px">
        <div style="font-size:10.5px;color:var(--muted)">כמות מצטברת</div>
        <div style="font-size:14px;font-weight:700">${totalQty.toLocaleString('he-IL')} יח׳</div>
      </div>
      <div style="background:#f4f6f3;border-radius:8px;padding:8px 10px">
        <div style="font-size:10.5px;color:var(--muted)">מחיר יחידה ממוצע</div>
        <div style="font-size:14px;font-weight:700">₪${avgUnit.toFixed(2)}</div>
      </div>
      <div style="background:#f4f6f3;border-radius:8px;padding:8px 10px">
        <div style="font-size:10.5px;color:var(--muted)">טווח מחירים</div>
        <div style="font-size:14px;font-weight:700">₪${minUnit.toFixed(2)}–${maxUnit.toFixed(2)}</div>
      </div>
    </div>
  `;
  const rows = history.map(r => {
    const priceColor = r.netUnit === minUnit ? 'var(--green-2)' : (r.netUnit === maxUnit ? 'var(--orange-2)' : 'var(--text)');
    const tag = r.netUnit === minUnit && history.length > 1 ? '<span style="background:#e6f4ea;color:var(--green-2);font-size:9.5px;padding:1px 6px;border-radius:4px;margin-right:4px;font-weight:600">הכי זול</span>' : '';
    const discountBadge = r.discount ? `<span style="font-size:10px;color:var(--muted)">-${r.discount}%</span>` : '';
    return `<tr>
      <td style="padding:6px 8px;font-size:12px">${fmtDate(r.date)}</td>
      <td style="padding:6px 8px;font-size:12px;font-family:monospace;color:var(--muted)">${r.invoiceNumber || '—'}</td>
      <td style="padding:6px 8px;font-size:12px;font-weight:600">${r.supplier || '—'}</td>
      <td style="padding:6px 8px;font-size:12px;text-align:center">${r.qty.toLocaleString('he-IL')}</td>
      <td style="padding:6px 8px;font-size:12px;text-align:left;color:${priceColor};font-weight:700">
        ₪${r.netUnit.toFixed(2)} ${discountBadge} ${tag}
      </td>
      <td style="padding:6px 8px;font-size:12px;text-align:left">₪${r.total.toLocaleString('he-IL', { maximumFractionDigits:0 })}</td>
    </tr>`;
  }).join('');
  return `${summary}
    <div style="border:1px solid var(--line);border-radius:10px;overflow:hidden;max-height:280px;overflow-y:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">
        <thead style="background:#f4f6f3;position:sticky;top:0">
          <tr style="text-align:right">
            <th style="padding:8px;font-size:11px;color:var(--muted);font-weight:600">תאריך</th>
            <th style="padding:8px;font-size:11px;color:var(--muted);font-weight:600">חשבונית</th>
            <th style="padding:8px;font-size:11px;color:var(--muted);font-weight:600">ספק</th>
            <th style="padding:8px;font-size:11px;color:var(--muted);font-weight:600;text-align:center">כמות</th>
            <th style="padding:8px;font-size:11px;color:var(--muted);font-weight:600;text-align:left">מחיר ליחידה</th>
            <th style="padding:8px;font-size:11px;color:var(--muted);font-weight:600;text-align:left">סה"כ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* Image handling for product modal */
function handleProductImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('יש להעלות קובץ תמונה תקין', 'error');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast('גודל הקובץ חורג מהמותר (עד 8MB)', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => resizeProductImage(e.target.result, 600).then(applyProductImage);
  reader.readAsDataURL(file);
  input.value = '';
}

function promptProductImageUrl() {
  const url = prompt('הדבקת קישור לתמונה (https://...)');
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    showToast('יש להזין קישור חוקי שמתחיל ב-http(s)://', 'error');
    return;
  }
  applyProductImage(url);
}

function clearProductImage() {
  applyProductImage('');
  showToast('התמונה הוסרה');
}

function applyProductImage(src) {
  const hidden = document.getElementById('pmImage');
  const preview = document.getElementById('pmImagePreview');
  if (hidden) hidden.value = src || '';
  if (preview) {
    if (src) {
      preview.style.backgroundImage = `url('${src.replace(/'/g, "\\'")}')`;
      preview.textContent = '';
    } else {
      preview.style.backgroundImage = '';
      // restore icon fallback from name input
      const iconInput = document.querySelector('#productForm input[name="icon"]');
      preview.textContent = (iconInput && iconInput.value) || '📦';
    }
  }
}

/* Resize a base64 image to a max dimension via canvas — keeps localStorage usage in check */
function resizeProductImage(dataUrl, maxDim) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else                 { width  = Math.round(width  * (maxDim / height)); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      // Try JPEG first (much smaller); fall back to original if JPEG isn't supported
      try { resolve(canvas.toDataURL('image/jpeg', 0.85)); }
      catch (e) { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/* Live margin calculations inside product modal */
function recalcMarginFromCostPrice() {
  const cost  = Number(document.getElementById('pmCost')?.value)  || 0;
  const price = Number(document.getElementById('pmPrice')?.value) || 0;
  const marginEl = document.getElementById('pmMargin');
  const lbl      = document.getElementById('pmProfitLabel');
  if (price > 0 && cost > 0) {
    const m = ((price - cost) / price) * 100;
    if (marginEl && document.activeElement !== marginEl) marginEl.value = (Math.round(m * 10) / 10);
    if (lbl) lbl.innerHTML = `רווח ליחידה: <b style="color:${m < 0 ? 'var(--danger)' : 'var(--green-2)'}">₪${(price - cost).toFixed(2)}</b> · מחיר ללא מע״מ: ₪${(price / 1.18).toFixed(2)}`;
  } else if (lbl) {
    lbl.textContent = 'הזינו עלות ומחיר לחישוב הרווח';
    if (marginEl && document.activeElement !== marginEl) marginEl.value = '';
  }
}
function applyMarginToPrice() {
  const cost     = Number(document.getElementById('pmCost')?.value) || 0;
  const margin   = Number(document.getElementById('pmMargin')?.value);
  const priceEl  = document.getElementById('pmPrice');
  const lbl      = document.getElementById('pmProfitLabel');
  if (cost > 0 && !isNaN(margin) && margin < 100) {
    const newPrice = cost / (1 - margin / 100);
    if (priceEl && document.activeElement !== priceEl) priceEl.value = (Math.round(newPrice * 2) / 2);
    if (lbl) lbl.innerHTML = `רווח ליחידה: <b style="color:${margin < 0 ? 'var(--danger)' : 'var(--green-2)'}">₪${(newPrice - cost).toFixed(2)}</b>`;
  }
}

/* ----- subcategory helpers for the product modal ----- */
function buildSubcatOptions(catId, currentSubId) {
  const map = (typeof getAdminSubcategories === 'function') ? getAdminSubcategories() : {};
  const subs = (catId && Array.isArray(map[catId])) ? map[catId] : [];
  let opts = `<option value="">— ללא תת-קטגוריה —</option>`;
  subs.forEach(s => {
    opts += `<option value="${esc(s.id)}" ${s.id === currentSubId ? 'selected' : ''}>${esc(s.icon || '')} ${esc(s.name)}</option>`;
  });
  return opts;
}
function getProductSubcatValue(p) {
  if (!p) return '';
  // 1) admin override map  2) static subcat on product
  try {
    const overrides = JSON.parse(localStorage.getItem('balasi_product_subcats') || '{}') || {};
    if (Object.prototype.hasOwnProperty.call(overrides, p.id)) return overrides[p.id] || '';
  } catch (e) {}
  return p.subcat || '';
}
function onProductCatChange() {
  const catSel = document.querySelector('#productForm select[name="cat"]');
  const subSel = document.getElementById('pmSubcat');
  if (!catSel || !subSel) return;
  subSel.innerHTML = buildSubcatOptions(catSel.value, '');
}

function saveProduct(e, id) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  d.price = Number(d.price);
  d.cost = Number(d.cost) || 0;
  d.stock = Number(d.stock) || 0;
  d.low = Number(d.low) || 10;
  d.vatExempt = !!d.vatExempt; // checkbox → boolean (always set explicitly so user override is preserved)
  d.hidden = !!d.hidden;       // checkbox → boolean — hide from public catalog
  d.barcode = (d.barcode || '').trim();
  d.supplier = (d.supplier || '').trim();
  d.image = (d.image || '').trim();
  // Capture subcat into a separate map so the public site can read it without
  // requiring the static `subcat` field to be present on legacy products
  const _subcat = (d.subcat || '').trim();
  delete d.subcat; // don't persist directly on product record (keeps DB.products lean)
  // Validate barcode is unique (if provided)
  if (d.barcode) {
    const dup = DB.products.find(p => p.barcode === d.barcode && p.id !== id);
    if (dup) {
      showToast(`הברקוד כבר משויך למוצר: ${dup.name}`, 'error');
      return;
    }
  }
  let savedId = id;
  if (id) {
    Object.assign(DB.products.find(p => p.id === id), d);
    showToast('המוצר עודכן');
  } else {
    const newId = Math.max(0, ...DB.products.map(p => p.id)) + 1;
    if (!d.sku) d.sku = 'BLS-' + String(newId).padStart(4, '0');
    DB.products.push({ id:newId, ...d });
    savedId = newId;
    showToast('המוצר נוסף בהצלחה');
  }
  // Persist the subcategory choice to the override map and notify the public site
  saveProductSubcatOverride(savedId, _subcat);
  DB.save('products');
  syncHiddenProductsToPublic();
  syncProductImagesToPublic();
  closeModal();
  renderProducts();
  renderDashboard();
}

/* Persist a single product's subcategory choice. Cleared overrides are
   removed entirely so the static `subcat` (if any) can fall through. */
function saveProductSubcatOverride(productId, subId) {
  try {
    const overrides = JSON.parse(localStorage.getItem('balasi_product_subcats') || '{}') || {};
    if (subId) overrides[productId] = subId;
    else delete overrides[productId];
    localStorage.setItem('balasi_product_subcats', JSON.stringify(overrides));
    window.dispatchEvent(new StorageEvent('storage', { key:'balasi_product_subcats', newValue: JSON.stringify(overrides) }));
  } catch (e) { console.warn('[subcat override] save failed', e); }
}

/* Persist the list of hidden product IDs to a key the public site (app.js) reads,
   so hidden items are filtered out of the catalog without needing a refresh on the admin side. */
function syncHiddenProductsToPublic() {
  try {
    const ids = DB.products.filter(p => p.hidden).map(p => p.id);
    localStorage.setItem('balasi_hidden_products', JSON.stringify(ids));
  } catch (e) { /* localStorage may be blocked */ }
}

/* Persist a map of { productId: imageDataOrUrl } so the public site (app.js) can
   render the admin-uploaded image on product cards. */
function syncProductImagesToPublic() {
  try {
    const map = {};
    DB.products.forEach(p => { if (p.image) map[p.id] = p.image; });
    localStorage.setItem('balasi_product_images', JSON.stringify(map));
  } catch (e) {
    // QuotaExceeded is most likely the cause — fall back to clearing the cache key
    try { localStorage.removeItem('balasi_product_images'); } catch (_) {}
    showToast('שטח אחסון מקומי מלא — תמונות לא יוצגו באתר עד פינוי שטח', 'error');
  }
}

function openBulkPriceModal() {
  openModal('עדכון מחירים גלובלי', `
    <div style="padding:22px">
      <p style="margin-bottom:18px;font-size:13px;color:var(--muted)">בחרו את אופן עדכון המחירים. השינויים יחולו על כל המוצרים בקטגוריה שנבחרה (או על כולם).</p>
      <form id="bulkForm" onsubmit="applyBulkPrice(event)">
        <div class="form-grid" style="padding:0">
          <div class="field"><label>קטגוריה</label>
            <select name="cat">
              <option value="all">כל הקטגוריות</option>
              ${Object.entries(CAT_NAMES).map(([k,n]) => `<option value="${k}">${n}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>סוג עדכון</label>
            <select name="type">
              <option value="percent">אחוז (+/-)</option>
              <option value="amount">סכום קבוע (₪)</option>
              <option value="set">קביעה לערך</option>
            </select>
          </div>
          <div class="field full"><label>ערך</label><input type="number" step="0.5" name="value" required placeholder="לדוגמה: 5 (=+5% / +5₪)" /></div>
        </div>
      </form>
    </div>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'החל שינוי', class:'btn-primary', action:() => document.getElementById('bulkForm').requestSubmit() }
  ]);
}

function applyBulkPrice(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const value = Number(d.value);
  let count = 0;
  DB.products.forEach(p => {
    if (d.cat !== 'all' && p.cat !== d.cat) return;
    if (d.type === 'percent') p.price = Math.round(p.price * (1 + value/100) * 2) / 2;
    else if (d.type === 'amount') p.price = Math.max(0, p.price + value);
    else p.price = value;
    count++;
  });
  DB.save('products');
  closeModal();
  renderProducts();
  showToast(`${count} מוצרים עודכנו`);
}

/* ---------- DELIVERY NOTES (top-level view) ---------- */
function renderDeliveryNotes() {
  const tbody = document.querySelector('#dnTable tbody');
  if (!tbody) return;
  const search = (document.getElementById('dnSearch')?.value || '').trim().toLowerCase();
  const companyFilter = document.getElementById('dnCompanyFilter')?.value || 'all';
  const statusFilter = document.getElementById('dnStatusFilter')?.value || 'all';

  // Hydrate company filter dropdown if not already populated (skip the "all" option)
  const companyFilterEl = document.getElementById('dnCompanyFilter');
  if (companyFilterEl && companyFilterEl.options.length <= 1) {
    DB.companies.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      companyFilterEl.appendChild(opt);
    });
  }

  let list = (DB.deliveryNotes || []).slice().sort((a,b) => b.date.localeCompare(a.date));

  // Apply filters
  if (companyFilter !== 'all') list = list.filter(d => d.companyId === Number(companyFilter));
  if (statusFilter === 'unbilled') list = list.filter(d => !d.billed);
  if (statusFilter === 'billed') list = list.filter(d => d.billed);
  if (search) list = list.filter(d => {
    const c = DB.companies.find(x => x.id === d.companyId);
    return d.number.toLowerCase().includes(search) || (c && c.name.toLowerCase().includes(search));
  });

  // Update KPIs
  const allDNs = (DB.deliveryNotes || []);
  const unbilled = allDNs.filter(d => !d.billed);
  const unbilledAmount = unbilled.reduce((s, d) => {
    const t = calculateTotalsWithVat(d.items || [], d.companyId, d.shipping || 0);
    return s + t.total;
  }, 0);
  const totalEl = document.getElementById('dnKpiTotal');
  const unbilledEl = document.getElementById('dnKpiUnbilled');
  const unbilledAmountEl = document.getElementById('dnKpiUnbilledAmount');
  if (totalEl) totalEl.textContent = allDNs.length;
  if (unbilledEl) unbilledEl.textContent = unbilled.length;
  if (unbilledAmountEl) unbilledAmountEl.textContent = '₪' + formatNum(unbilledAmount);

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><h4>אין תעודות משלוח להצגה</h4><p>תעודות יווצרו אוטומטית כשמאשרים הזמנות מלקוחות אשראי</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map(d => {
    const c = DB.companies.find(x => x.id === d.companyId);
    const itemCount = (d.items || []).length;
    const missingCount = (d.items || []).filter(i => i.status === 'missing').length;
    const subCount = (d.items || []).filter(i => i.status === 'substituted').length;
    const totals = calculateTotalsWithVat(d.items || [], d.companyId, d.shipping || 0);
    const billed = !!(d.invoiceId || d.billed);
    const billedBadge = billed
      ? '<span class="pill pill-success">חויב</span>'
      : '<span class="pill pill-warn">ממתין לחיוב</span>';
    let itemsBadge = itemCount + ' פריטים';
    if (missingCount) itemsBadge += ' · ' + missingCount + ' חסר';
    if (subCount)     itemsBadge += ' · ' + subCount + ' הוחלף';
    return `<tr>
      <td class="strong-cell">${d.number}</td>
      <td class="muted-cell">${formatDate(d.date)}</td>
      <td>${c?.name || '—'}</td>
      <td class="muted-cell">${itemsBadge}</td>
      <td class="price-cell">₪${formatNum(totals.total)}</td>
      <td>${billedBadge}</td>
      <td><button class="row-action" onclick="viewDeliveryNote(${d.id})">צפה</button>${!billed ? `<button class="row-action row-action-primary" onclick="generateInvoiceFromDN(${d.id})">חייב</button>` : ''}</td>
    </tr>`;
  }).join('');
}

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Auto-login if previously authenticated (sessionStorage)
  try {
    if (sessionStorage.getItem('admin_auth') === '1') {
      showAdmin();
    }
  } catch (e) { console.warn('[boot] showAdmin failed', e); }

  // Data state diagnostic — log to console so you can verify localStorage state
  try {
    const counts = {};
    ['admin_companies','admin_customers','admin_products','admin_orders','admin_invoices','admin_deliveryNotes','admin_categories','admin_supplierEntities'].forEach(k => {
      const v = localStorage.getItem(k);
      const parsed = v ? JSON.parse(v) : null;
      counts[k.replace('admin_','')] = Array.isArray(parsed) ? parsed.length : (parsed ? 'object' : 'NULL');
    });
    console.log('[balasi-admin] localStorage state:', counts);
  } catch (e) { console.warn('[boot] data check failed', e); }
});

/* ========== HELPER FUNCTIONS ========== */

function formatNum(n) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('he-IL', { maximumFractionDigits: 2 });
}

function formatDate(d) {
  if (!d) return '';
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return new Intl.DateTimeFormat('he-IL', {
    year:'numeric', month:'2-digit', day:'2-digit',
    timeZone:'Asia/Jerusalem'
  }).format(date);
}

function showToast(msg, type) {
  let t = document.getElementById('adminToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'adminToast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.toggle('error', type === 'error');
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ===== כפתור "חזור" בחלונות פעולה (modal) =====
   כל חלון פעולה עובר דרך openModal. שומרים מחסנית של החלונות שנפתחו,
   כך ש"חזור" מחזיר לחלון הקודם — ואם אין חלון קודם, סוגר וחוזר לרשימה. */
let _modalStack = [];
let _currentModal = null;
let _isModalBack = false;

function goBackModal() {
  if (_modalStack.length > 0) {
    const prev = _modalStack.pop();
    _isModalBack = true;
    openModal(prev.title, prev.bodyHTML, prev.actions);
    _isModalBack = false;
  } else {
    closeModal();
  }
}

function openModal(title, bodyHTML, actions) {
  const _bgPrev = document.getElementById('modalBg');
  if (!_isModalBack && _bgPrev && _bgPrev.classList.contains('open') && _currentModal) {
    _modalStack.push(_currentModal);
  }
  _currentModal = { title: title, bodyHTML: bodyHTML, actions: actions };
  let bg = document.getElementById('modalBg');
  if (!bg) {
    bg = document.createElement('div');
    bg.id = 'modalBg';
    bg.className = 'modal-bg';
    bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg);
  }
  let footHTML = '';
  if (Array.isArray(actions) && actions.length) {
    footHTML = '<div class="m-foot">' + actions.map((a, i) => {
      const cls = 'btn ' + (a.class || 'btn-ghost');
      return `<button type="button" class="${cls}" data-action-idx="${i}">${a.label}</button>`;
    }).join('') + '</div>';
  }
  bg.innerHTML = `
    <div class="modal-card" id="modalCard">
      <div class="m-head"><div class="m-head-l"><button class="m-back" type="button" onclick="goBackModal()" aria-label="חזור" title="חזור"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg><span>חזור</span></button><h3>${title || ''}</h3></div><button class="m-close" type="button" onclick="closeModal()" aria-label="סגור">✕</button></div>
      <div class="m-body" id="modalBody">${bodyHTML || ''}</div>
      ${footHTML}
    </div>`;
  // Wire action buttons via addEventListener so closures (e.g. order id) are preserved.
  // Inlining via onclick + Function.prototype.toString() loses the surrounding scope.
  if (Array.isArray(actions) && actions.length) {
    bg.querySelectorAll('.m-foot button[data-action-idx]').forEach(btn => {
      const idx = Number(btn.getAttribute('data-action-idx'));
      const a = actions[idx];
      const handler = (a && typeof a.action === 'function') ? a.action : closeModal;
      btn.addEventListener('click', function (ev) {
        try { handler.call(this, ev); }
        catch (err) { console.error('Modal action failed:', err); }
      });
    });
  }
  bg.classList.add('open');
  document.documentElement.style.overflow = 'hidden';
}

function closeModal() {
  _modalStack = [];
  _currentModal = null;
  const bg = document.getElementById('modalBg');
  if (bg) bg.classList.remove('open');
  document.documentElement.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function orderStatusPill(s) {
  const map = {
    'pending':     '<span class="pill pill-warn">⏳ ממתינה</span>',
    'confirmed':   '<span class="pill pill-info">✓ אושרה</span>',
    'in-delivery': '<span class="pill pill-info">🚚 במשלוח</span>',
    'delivered':   '<span class="pill pill-success">✓ נמסרה</span>',
    'cancelled':   '<span class="pill pill-danger">✖ בוטלה</span>'
  };
  return map[s] || `<span class="pill">${esc(s) || '—'}</span>`;
}
function payStatusPill(s) {
  const map = {
    'paid':    '<span class="pill pill-success">שולם</span>',
    'partial': '<span class="pill pill-warn">חלקי</span>',
    'unpaid':  '<span class="pill pill-danger">לא שולם</span>',
    'open':    '<span class="pill pill-warn">פתוח</span>'
  };
  return map[s] || `<span class="pill">${esc(s) || '—'}</span>`;
}
function invoiceStatusPill(inv) {
  if (!inv) return '<span class="pill">—</span>';
  const balance = (inv.amount || 0) - (inv.paid || 0);
  if (balance <= 0.01) return '<span class="pill pill-success">✓ שולם</span>';
  const today = new Date().toISOString().slice(0,10);
  if (inv.dueDate && inv.dueDate < today) return '<span class="pill pill-danger">⏰ באיחור</span>';
  if ((inv.paid || 0) > 0) return '<span class="pill pill-warn">חלקי</span>';
  return '<span class="pill pill-warn">פתוח</span>';
}
function payTermsLabel(t) {
  return ({ credit:'מזומן/אשראי', net30:'שוטף+30', net45:'שוטף+45', net60:'שוטף+60', net90:'שוטף+90' })[t] || t || '';
}
function isOverdue(inv) {
  if (!inv) return false;
  const balance = (inv.amount || 0) - (inv.paid || 0);
  if (balance <= 0.01) return false;
  const today = new Date().toISOString().slice(0,10);
  return inv.dueDate && inv.dueDate < today;
}
function addDaysISO(isoDate, days) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d)) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0,10);
}

/* ===== INVOICES VIEW ===== */
function renderInvoices() {
  const tbody = document.querySelector('#invoicesTable tbody');
  if (!tbody) return;
  const search       = (document.getElementById('invoicesSearch')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('invoicesStatusFilter')?.value || 'all';

  let list = (DB.invoices || []).slice().sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  if (search) list = list.filter(inv => {
    const c = DB.companies.find(x => x.id === inv.companyId);
    return (inv.number || '').toLowerCase().includes(search) ||
           (c && (c.name || '').toLowerCase().includes(search));
  });
  if (statusFilter !== 'all') {
    list = list.filter(inv => {
      const balance = (inv.amount || 0) - (inv.paid || 0);
      const today = new Date().toISOString().slice(0,10);
      const overdue = inv.dueDate && inv.dueDate < today && balance > 0.01;
      if (statusFilter === 'paid')    return balance <= 0.01;
      if (statusFilter === 'open')    return balance > 0.01 && !overdue;
      if (statusFilter === 'overdue') return overdue;
      return true;
    });
  }

  // Refresh bulk-billing banner whenever the invoices view re-renders
  if (typeof renderBulkBillingBanners === 'function') {
    try { renderBulkBillingBanners(); } catch(_){}
  }

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty"><h4>אין חשבוניות להצגה</h4></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map(inv => {
    const c = DB.companies.find(x => x.id === inv.companyId);
    const balance = Math.max(0, (inv.amount || 0) - (inv.paid || 0));
    const allocBadge = inv.allocationNumber
      ? `<div style="font-size:10px;margin-top:3px"><span class="pill pill-info" title="מספר הקצאה">🛡 ${esc(inv.allocationNumber)}</span></div>`
      : '';
    const payBtn = balance > 0.01
      ? `<button class="row-action row-action-primary" onclick="recordPayment(${inv.id})">תשלום</button>`
      : '';
    const allocBtnLabel = inv.allocationNumber ? '🛡 ערוך הקצאה' : '🛡 הקצאה';
    const allocBtn = `<button class="row-action" onclick="setAllocationNumber(${inv.id})" title="הזן או ערוך מספר הקצאה ממערכת חשבונית ישראל">${allocBtnLabel}</button>`;
    return `<tr>
      <td class="strong-cell">${esc(inv.number)}${allocBadge}</td>
      <td>${esc(c?.name) || '—'}</td>
      <td class="muted-cell">${formatDate(inv.date)}</td>
      <td class="muted-cell">${formatDate(inv.dueDate)}</td>
      <td class="price-cell">₪${formatNum(inv.amount)}</td>
      <td class="price-cell">₪${formatNum(inv.paid)}</td>
      <td class="price-cell" style="${balance > 0 ? 'color:var(--orange-2);font-weight:700' : ''}">₪${formatNum(balance)}</td>
      <td>${invoiceStatusPill(inv)}</td>
      <td>
        <button class="row-action" onclick="viewInvoice(${inv.id})">צפה</button>
        ${allocBtn}
        ${payBtn}
      </td>
    </tr>`;
  }).join('');
}

/* ===== INVOICE VIEW — full printable tax-invoice document =====
   Renders a proper "חשבונית מס" document, mirroring the delivery-note
   layout: company header, recipient panel, items table, totals box,
   payment status, and — prominently — the ITA allocation number
   ("מספר הקצאה") which is mandatory on the physical document for
   invoices that fall above the yearly threshold. */
function viewInvoice(id) {
  const inv = (DB.invoices || []).find(x => x.id === id);
  if (!inv) { showToast('חשבונית לא נמצאה', 'error'); return; }
  const c = DB.companies.find(x => x.id === inv.companyId) || {};
  const account = (c.accounts || []).find(a => a.id === inv.accountId)
               || (c.accounts || []).find(a => a.isPrimary)
               || (c.accounts || [])[0] || {};
  const branch = (c.branches || []).find(b => b.isPrimary) || (c.branches || [])[0] || {};
  const settings = DB.settings || {};
  const items = inv.items || [];
  const totals = items.length ? calculateTotalsWithVat(items, inv.companyId, inv.shipping || 0) : null;
  const balance = Math.max(0, (inv.amount || 0) - (inv.paid || 0));
  const threshold = (typeof getAllocationThreshold === 'function') ? getAllocationThreshold() : 10000;
  const needsAlloc = (Number(inv.amount) || 0) >= threshold;
  const hasAlloc = !!inv.allocationNumber;

  // Build line items — same shape as the delivery-note view so it
  // visually matches and reuses the existing dn-* CSS.
  const itemsHtml = items.length ? items.map((it, idx) => {
    const p = DB.products.find(x => x.id === it.pid);
    const name = p?.name || it.externalName || it.name || 'מוצר ללא שם';
    const icon = p?.icon || '📦';
    const sku  = p?.sku  || (it.pid ? 'BLS-' + String(it.pid).padStart(4,'0') : '—');
    const unit = p?.unit || it.unit || '—';
    const desc = p?.desc || '';
    const price = (typeof it.price !== 'undefined') ? it.price : (p?.price ?? 0);
    const lineTotal = price * it.qty;
    const exempt = (typeof isLineVatExempt === 'function') ? isLineVatExempt(it, p) : false;
    return `<tr class="dn-line">
      <td class="dn-num">${idx + 1}</td>
      <td class="dn-sku">${esc(sku)}</td>
      <td class="dn-name-cell">
        <div class="dn-name-flex">
          <span class="dn-icon">${icon}</span>
          <div class="dn-name-info">
            <b>${esc(name)}</b>
            <div class="dn-name-meta">
              ${exempt ? '<span class="dn-exempt-tag">פטור ממע״מ</span>' : ''}
              ${desc ? `<span class="dn-desc">${esc(desc)}</span>` : ''}
            </div>
          </div>
        </div>
      </td>
      <td class="dn-unit">${esc(unit)}</td>
      <td class="dn-qty">${it.qty}</td>
      <td class="dn-price">₪${formatNum(price)}</td>
      <td class="dn-total"><b>₪${formatNum(lineTotal)}</b></td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="muted-cell" style="text-align:center;padding:20px">אין פירוט פריטים בחשבונית</td></tr>`;

  const itemCount = items.length;
  const totalQty = items.reduce((s,i) => s + (Number(i.qty) || 0), 0);

  // Allocation banner — visible directly above the items table so it
  // catches the customer's eye and meets the ITA "visible on document"
  // requirement.
  const allocBanner = hasAlloc
    ? `<div class="dn-status-banner" style="background:#e8f4ea;border:1px solid #b6d8c1;color:#1b5e34">
        <span>🛡</span>
        <div>
          <b>חשבונית מאושרת — "חשבונית ישראל"</b>
          <span>מספר הקצאה: <b style="font-size:14px;letter-spacing:1px">${esc(inv.allocationNumber)}</b>${inv.allocationDate ? ` · ${formatDate(inv.allocationDate)}` : ''}</span>
        </div>
       </div>`
    : (needsAlloc
        ? `<div class="dn-status-banner" style="background:#fff3e0;border:1px solid #f0c98e;color:#7a4a00">
            <span>⚠</span>
            <div>
              <b>נדרש מספר הקצאה</b>
              <span>סכום מעל הסף (₪${formatNum(threshold)}). לחץ "הזן מספר הקצאה" כדי להוסיף את המספר ממערכת "חשבונית ישראל".</span>
            </div>
           </div>`
        : '');

  // ===== חשבונית מרוכזת — תצוגה בסגנון הדוגמה של הלקוח =====
  // כשהחשבונית מאחדת כמה תעודות משלוח, מציגים שורה לכל תעודה (מספר, תאריך,
  // וסה״כ כולל מע״מ) במקום פירוט מוצרים. בסיכום למטה מפרידים: סה״כ חייב במע״מ,
  // סה״כ פטור ממע״מ (פירות/ירקות), סה״כ מע״מ, וסה״כ לתשלום.
  const _consDnIds = (Array.isArray(inv.consolidatedDNs) && inv.consolidatedDNs.length)
    ? inv.consolidatedDNs
    : (Array.isArray(inv.relatedDNs) ? inv.relatedDNs : []);
  const _consDns = _consDnIds
    .map(dnId => (DB.deliveryNotes || []).find(d => d.id === dnId))
    .filter(Boolean);
  const isConsolidatedView = _consDns.length > 1;
  const _vatPctLabel = (typeof VAT !== 'undefined') ? Math.round(VAT * 100) : 18;

  // סכום כל תעודה כולל מע״מ — מחושב באותו מנוע (calculateTotalsWithVat),
  // כך שפריטים פטורים (פירות/ירקות) והנחת רמת לקוח מטופלים נכון והשורות מסתכמות לסה״כ.
  // חישוב פר-תעודה באותו מנוע (calculateTotalsWithVat) — כך ששורות התעודות
  // מסתכמות בדיוק לסה״כ, והפירוק (חייב/פטור/מע״מ) נגזר מאותם ערכים.
  const _r2 = (n) => Math.round(n * 100) / 100;
  const _dnCalc = _consDns.map(dn => (typeof calculateTotalsWithVat === 'function')
    ? calculateTotalsWithVat(dn.items || [], inv.companyId, dn.shipping || 0)
    : { vatBase: 0, exemptBase: 0, vat: 0, total: (Number(dn.total) || 0) });
  const _consVatBase = _r2(_dnCalc.reduce((s, t) => s + (t.vatBase || 0), 0));
  const _consExempt  = _r2(_dnCalc.reduce((s, t) => s + (t.exemptBase || 0), 0));
  const _consVat     = _r2(_dnCalc.reduce((s, t) => s + (t.vat || 0), 0));
  const _consGrand   = _r2(_dnCalc.reduce((s, t) => s + (t.total || 0), 0));
  const _consBalance = Math.max(0, _r2(_consGrand - (inv.paid || 0)));

  const dnRowsHtml = _consDns.map((dn, i) => `
        <div class="dn-cons-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid #efece2;font-size:13px">
          <span>תעודת משלוח מס׳ <b>${esc(dn.number || '—')}</b></span>
          <span style="color:var(--muted,#6b6b6b)">תאריך: ${dn.date ? formatDate(dn.date) : '—'}</span>
          <span>סה״כ: <b>₪${formatNum(_dnCalc[i].total)}</b></span>
        </div>`).join('');

  const consolidatedBodyHtml = `
      <!-- DELIVERY-NOTES LIST (consolidated) -->
      <div class="dn-items-wrap">
        <div style="background:#f8f6f0;padding:10px 12px;font-size:12.5px;font-weight:700;border-bottom:1px solid #e0dccd">פירוט תעודות משלוח שאוחדו בחשבונית (${_consDns.length})</div>
        <div style="padding:2px 12px 6px">${dnRowsHtml}</div>
      </div>

      <!-- VAT SUMMARY (consolidated) -->
      <div class="dn-totals-wrap">
        <div class="dn-summary">
          <div class="dn-summary-row"><span>מספר תעודות משלוח</span><b>${_consDns.length}</b></div>
          <div class="dn-summary-row"><span>סטטוס תשלום</span><b>${invoiceStatusPill(inv)}</b></div>
        </div>
        <div class="dn-totals-box">
          ${totals && totals.discountAmount > 0 ? `
            <div class="dn-tot-row" style="background:#f0f9f3;border-right:3px solid var(--green);color:#0f4a25">
              <span>הנחת רמת לקוח${totals.tierLabel ? ` — ${esc(totals.tierLabel)}` : ''} (${totals.discountPct}%)</span>
              <b style="color:#0f4a25">−₪${formatNum(totals.discountAmount)}</b>
            </div>` : ''}
          <div class="dn-tot-row"><span>סה״כ חייב במע״מ</span><b>₪${formatNum(_consVatBase)}</b></div>
          ${_consExempt > 0 ? `
            <div class="dn-tot-row dn-tot-exempt"><span>סה״כ פטור ממע״מ (פירות/ירקות)</span><b>₪${formatNum(_consExempt)}</b></div>` : ''}
          <div class="dn-tot-row"><span>סה״כ מע״מ (${_vatPctLabel}%)</span><b>₪${formatNum(_consVat)}</b></div>
          <div class="dn-tot-row dn-tot-grand"><span>סה״כ לתשלום</span><span>₪${formatNum(_consGrand)}</span></div>
          ${inv.paid > 0 ? `
            <div class="dn-tot-row" style="background:#f0f9f3;color:#0f4a25"><span>שולם עד כה</span><b style="color:#0f4a25">₪${formatNum(inv.paid)}</b></div>` : ''}
          ${_consBalance > 0.01 ? `
            <div class="dn-tot-row" style="background:#fff3e0;color:#7a4a00;font-weight:700"><span>יתרה לתשלום</span><b style="color:#7a4a00">₪${formatNum(_consBalance)}</b></div>` : ''}
        </div>
      </div>`;

  const regularBodyHtml = `
      <!-- ITEMS TABLE -->
      <div class="dn-items-wrap">
        <table class="dn-items">
          <thead>
            <tr>
              <th class="dn-th-num">#</th>
              <th class="dn-th-sku">מק״ט</th>
              <th class="dn-th-name">פרטי המוצר</th>
              <th class="dn-th-unit">יחידה</th>
              <th class="dn-th-qty">כמות</th>
              <th class="dn-th-price">מחיר ליחידה</th>
              <th class="dn-th-total">סה״כ</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <!-- TOTALS BOX -->
      <div class="dn-totals-wrap">
        <div class="dn-summary">
          <div class="dn-summary-row"><span>סך פריטים שונים</span><b>${itemCount}</b></div>
          <div class="dn-summary-row"><span>סך יחידות</span><b>${totalQty}</b></div>
          <div class="dn-summary-row"><span>סטטוס תשלום</span><b>${invoiceStatusPill(inv)}</b></div>
        </div>
        <div class="dn-totals-box">
          ${totals ? `
            <div class="dn-tot-row">
              <span>סכום ביניים (לפני מע״מ)</span>
              <b>₪${formatNum(totals.subtotal + (totals.discountAmount || 0))}</b>
            </div>
            ${totals.discountAmount > 0 ? `
              <div class="dn-tot-row" style="background:#f0f9f3;border-right:3px solid var(--green);color:#0f4a25">
                <span>הנחת רמת לקוח${totals.tierLabel ? ` — ${esc(totals.tierLabel)}` : ''} (${totals.discountPct}%)</span>
                <b style="color:#0f4a25">−₪${formatNum(totals.discountAmount)}</b>
              </div>
            ` : ''}
            ${totals.exemptBase > 0 ? `
              <div class="dn-tot-row dn-tot-row-sub">
                <span>מתוכו: בסיס חייב במע״מ</span>
                <span>₪${formatNum(totals.vatBase)}</span>
              </div>
              <div class="dn-tot-row dn-tot-row-sub dn-tot-exempt">
                <span>מתוכו: בסיס פטור ממע״מ (פירות/ירקות)</span>
                <span>₪${formatNum(totals.exemptBase)}</span>
              </div>
            ` : ''}
            ${totals.shipping > 0 ? `
              <div class="dn-tot-row">
                <span>דמי משלוח</span>
                <b>₪${formatNum(totals.shipping)}</b>
              </div>
            ` : ''}
            <div class="dn-tot-row">
              <span>מע״מ (${totals.vatPct || 18}%)</span>
              <b>₪${formatNum(totals.vat)}</b>
            </div>
          ` : ''}
          <div class="dn-tot-row dn-tot-grand">
            <span>סה״כ לתשלום</span>
            <span>₪${formatNum(inv.amount)}</span>
          </div>
          ${inv.paid > 0 ? `
            <div class="dn-tot-row" style="background:#f0f9f3;color:#0f4a25">
              <span>שולם עד כה</span>
              <b style="color:#0f4a25">₪${formatNum(inv.paid)}</b>
            </div>` : ''}
          ${balance > 0.01 ? `
            <div class="dn-tot-row" style="background:#fff3e0;color:#7a4a00;font-weight:700">
              <span>יתרה לתשלום</span>
              <b style="color:#7a4a00">₪${formatNum(balance)}</b>
            </div>` : ''}
        </div>
      </div>`;

  openModal(`חשבונית מס ${esc(inv.number)}`, `
    <div class="dn-document">
      <!-- DOCUMENT HEADER -->
      <div class="dn-doc-head">
        <div class="dn-doc-head-l">
          <img src="logo.svg" alt="Balasi Store" class="dn-logo" onerror="this.style.display='none'" />
          <div class="dn-sender">
            <b>${esc(settings.companyName) || 'בלסי סטור בע״מ'}</b>
            <span>${esc(settings.address) || 'שונצינו 1, תל אביב'}${settings.addressNote ? ' (' + esc(settings.addressNote) + ')' : ''}</span>
            <span>${settings.phone ? 'טל׳ ' + esc(settings.phone) + ' · ' : ''}${esc(settings.email) || 'balasistore5@gmail.com'}</span>
            <span>ח.פ ${esc(settings.taxId) || '516127321'}</span>
          </div>
        </div>
        <div class="dn-doc-head-r">
          <div class="dn-doc-title">חשבונית מס</div>
          <div class="dn-doc-num">${esc(inv.number)}</div>
          <div class="dn-doc-meta" style="margin-top:8px">
            <div><span>תאריך הפקה:</span><b>${formatDate(inv.date)}</b></div>
            <div><span>לתשלום עד:</span><b>${formatDate(inv.dueDate)}</b></div>
            <div style="display:flex;align-items:center;gap:8px">
              <span>מספר הקצאה:</span>
              ${hasAlloc
                ? `<b style="color:#1b5e34;background:#e8f4ea;padding:2px 8px;border-radius:3px;letter-spacing:.5px">${esc(inv.allocationNumber)}</b>
                   <button type="button" onclick="setAllocationNumber(${inv.id})" style="background:none;border:none;color:#2563eb;text-decoration:underline;cursor:pointer;font-size:11.5px;padding:0">ערוך</button>`
                : `<input type="text" id="allocInline_${inv.id}"
                     placeholder="הזן מספר וצא מהשדה"
                     inputmode="numeric" pattern="[0-9]*" autocomplete="off"
                     style="width:170px;padding:4px 8px;border:1.5px dashed #c78a3e;border-radius:4px;background:#fff8ed;font-size:12px;font-weight:700;letter-spacing:.5px;text-align:right;color:#7a4a00;font-family:inherit"
                     onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                     onblur="saveAllocationInline(${inv.id}, this)" />`}
            </div>
          </div>
        </div>
      </div>

      <!-- RECIPIENT PANEL -->
      <div class="dn-recipient">
        <div class="dn-recipient-head">לכבוד</div>
        <div class="dn-recipient-grid">
          <div>
            <span class="dn-r-label">שם הלקוח</span>
            <b class="dn-r-name">${esc(c.name) || '—'}</b>
            ${c.taxId ? `<span class="dn-r-sub">ח.פ ${esc(c.taxId)}</span>` : ''}
          </div>
          <div>
            <span class="dn-r-label">מספר לקוח</span>
            <b>${esc(account.customerNumber) || '—'}</b>
            ${account.label ? `<span class="dn-r-sub">${esc(account.label)}</span>` : ''}
          </div>
          <div>
            <span class="dn-r-label">כתובת אספקה</span>
            <b>${esc(branch.address || c.address) || '—'}${c.city ? ', ' + esc(c.city) : ''}</b>
            ${c.zip ? `<span class="dn-r-sub">מיקוד ${esc(c.zip)}</span>` : ''}
          </div>
          <div>
            <span class="dn-r-label">פרטי קשר</span>
            <b>${esc(c.phone) || '—'}</b>
            ${c.email ? `<span class="dn-r-sub">${esc(c.email)}</span>` : ''}
          </div>
        </div>
      </div>

      ${allocBanner}

      ${isConsolidatedView ? consolidatedBodyHtml : regularBodyHtml}

      ${inv.notes ? `<div class="dn-notes-box"><b>הערות:</b> ${esc(inv.notes)}</div>` : ''}

      <div class="dn-footer-print">
        <span>${esc(settings.companyName) || 'בלסי סטור בע״מ'} · ${settings.phone ? esc(settings.phone) + ' · ' : ''}${esc(settings.email) || 'balasistore5@gmail.com'}</span>
        <span>חשבונית מס ${esc(inv.number)}${hasAlloc ? ' · מס׳ הקצאה ' + esc(inv.allocationNumber) : ''}</span>
      </div>
    </div>
  `, [
    { label:'סגירה', class:'btn-ghost', action:closeModal },
    { label:'הדפס', class:'btn-ghost', action:() => { if (typeof printDocument === 'function') printDocument('inv', inv.id); else window.print(); } },
    { label:'✉ שלח במייל', class:'btn-ghost', action:() => emailDocument('inv', inv.id) },
    // When no allocation number exists yet, surface this as the primary
    // call-to-action so the user can't miss it. Once a number is set it
    // becomes a ghost-styled "edit" button.
    { label: hasAlloc ? 'ערוך מספר הקצאה' : 'הזן מספר הקצאה',
      class: hasAlloc ? 'btn-ghost' : 'btn-primary',
      action:() => { closeModal(); setTimeout(() => setAllocationNumber(id), 100); } },
    ...(balance > 0.01 ? [{ label:'רשום תשלום', class:'btn-primary', action:() => { closeModal(); setTimeout(() => recordPayment(id), 100); } }] : [])
  ]);
  setTimeout(() => {
    const card = document.getElementById('modalCard');
    if (card) card.style.maxWidth = '880px';
  }, 50);
}

/* ===== RECORD PAYMENT (against invoice) ===== */
function recordPayment(id) {
  const inv = (DB.invoices || []).find(x => x.id === id);
  if (!inv) { showToast('חשבונית לא נמצאה', 'error'); return; }
  const c = DB.companies.find(x => x.id === inv.companyId);
  const balance = Math.max(0, (inv.amount || 0) - (inv.paid || 0));
  const today = new Date().toISOString().slice(0,10);

  openModal(`רישום תשלום — חשבונית ${esc(inv.number)}`, `
    <form id="payForm" onsubmit="savePayment(event, ${id})" style="padding:20px">
      <div style="background:#f8f6f0;padding:12px 14px;border-radius:6px;margin-bottom:14px;font-size:13px">
        <div><b>לקוח:</b> ${esc(c?.name) || '—'}</div>
        <div><b>סכום החשבונית:</b> ₪${formatNum(inv.amount)}</div>
        <div><b>שולם עד כה:</b> ₪${formatNum(inv.paid)}</div>
        <div style="color:var(--orange-2);font-weight:700"><b>יתרה לתשלום:</b> ₪${formatNum(balance)}</div>
      </div>
      <div class="form-grid" style="padding:0">
        <div class="field">
          <label>סכום ששולם <span class="req">*</span></label>
          <input type="number" name="amount" step="0.01" min="0.01" max="${balance}" value="${balance.toFixed(2)}" required />
        </div>
        <div class="field">
          <label>תאריך תשלום</label>
          <input type="date" name="date" value="${today}" />
        </div>
        <div class="field">
          <label>אמצעי תשלום</label>
          <select name="method">
            <option value="העברה בנקאית">העברה בנקאית</option>
            <option value="המחאה">המחאה</option>
            <option value="אשראי">אשראי</option>
            <option value="מזומן">מזומן</option>
            <option value="ביט">ביט / Pay</option>
          </select>
        </div>
        <div class="field full">
          <label>הערה (אופציונלי)</label>
          <input type="text" name="notes" placeholder="למשל: מס׳ אסמכתא, תאריך פירעון..." />
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'שמור תשלום', class:'btn-primary', action:() => document.getElementById('payForm').requestSubmit() }
  ]);
}

function savePayment(e, id) {
  e.preventDefault();
  const inv = (DB.invoices || []).find(x => x.id === id);
  if (!inv) return;
  const d = Object.fromEntries(new FormData(e.target).entries());
  const amt = Number(d.amount);
  const balance = (inv.amount || 0) - (inv.paid || 0);
  if (!amt || amt <= 0) { showToast('סכום לא תקין', 'error'); return; }
  if (amt > balance + 0.01) { showToast('הסכום עולה על היתרה', 'error'); return; }

  inv.paid = Math.round(((inv.paid || 0) + amt) * 100) / 100;
  // Generate a receipt
  if (!DB.receipts) DB.receipts = [];
  const newId = Math.max(0, ...DB.receipts.map(r => r.id || 0)) + 1;
  const yr = (d.date || new Date().toISOString().slice(0,10)).slice(0,4);
  DB.receipts.push({
    id: newId,
    number: 'RCP-' + yr + '-' + String(newId).padStart(4,'0'),
    companyId: inv.companyId,
    invoiceId: inv.id,
    date: d.date || new Date().toISOString().slice(0,10),
    amount: amt,
    method: d.method || '',
    notes: d.notes || ''
  });
  DB.save('invoices');
  DB.save('receipts');
  closeModal();
  if (typeof renderInvoices === 'function')   renderInvoices();
  if (typeof renderDebts === 'function')      renderDebts();
  if (typeof renderDashboard === 'function')  renderDashboard();
  showToast(`✓ נרשם תשלום ₪${formatNum(amt)} על חשבונית ${inv.number}`);
}

/* ===== SUPPLIER INVOICES ===== */
function renderSupplierInvoices() {
  const tbody = document.querySelector('#supplierTable tbody');
  if (!tbody) return;
  const search = (document.getElementById('supplierSearch')?.value || '').trim().toLowerCase();
  let list = (DB.suppliers || []).slice().sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  if (search) list = list.filter(s =>
    (s.number || '').toLowerCase().includes(search) ||
    (s.supplier || '').toLowerCase().includes(search) ||
    (s.desc || '').toLowerCase().includes(search)
  );

  // KPIs
  const today = new Date();
  const ym = today.toISOString().slice(0,7);
  const monthInvs = (DB.suppliers || []).filter(s => (s.date || '').slice(0,7) === ym);
  const monthSum  = monthInvs.reduce((sum, s) => sum + (s.amount || 0), 0);
  const owed      = (DB.suppliers || []).reduce((sum, s) => sum + Math.max(0, (s.amount || 0) - (s.paid || 0)), 0);
  const supKpiCount = document.getElementById('supKpiCount');
  const supKpiSum   = document.getElementById('supKpiSum');
  const supKpiPay   = document.getElementById('supKpiPay');
  if (supKpiCount) supKpiCount.textContent = monthInvs.length;
  if (supKpiSum)   supKpiSum.textContent   = '₪' + formatNum(monthSum);
  if (supKpiPay)   supKpiPay.textContent   = '₪' + formatNum(owed);

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty"><h4>אין חשבוניות ספק להצגה</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => {
    const balance = Math.max(0, (s.amount || 0) - (s.paid || 0));
    const status = (s.status === 'paid' || balance <= 0.01) ? 'paid'
                 : (s.status === 'overdue' || (s.dueDate && s.dueDate < new Date().toISOString().slice(0,10) && balance > 0.01)) ? 'overdue'
                 : (s.paid > 0 ? 'partial' : 'open');
    const statusPill = ({
      paid:    '<span class="pill pill-success">שולם</span>',
      partial: '<span class="pill pill-warn">חלקי</span>',
      open:    '<span class="pill pill-warn">פתוח</span>',
      overdue: '<span class="pill pill-danger">⏰ באיחור</span>'
    })[status];
    const payBtn = balance > 0.01
      ? `<button class="row-action row-action-primary" onclick="paySupplier(${s.id})">תשלום</button>`
      : '';
    return `<tr>
      <td class="strong-cell">${esc(s.number)}</td>
      <td>${esc(s.supplier) || '—'}</td>
      <td class="muted-cell">${esc(s.desc) || ''}</td>
      <td class="muted-cell">${formatDate(s.date)}</td>
      <td class="muted-cell">${formatDate(s.dueDate)}</td>
      <td class="price-cell">₪${formatNum(s.amount)}</td>
      <td class="price-cell">₪${formatNum(s.paid)}</td>
      <td>${statusPill}</td>
      <td>
        <button class="row-action" onclick="viewSupplierInvoice(${s.id})">צפה</button>
        ${payBtn}
        <button class="row-action row-action-danger" onclick="deleteSupplier(${s.id})" title="מחק">×</button>
      </td>
    </tr>`;
  }).join('');
}

function viewSupplierInvoice(id) {
  const s = (DB.suppliers || []).find(x => x.id === id);
  if (!s) { showToast('חשבונית ספק לא נמצאה', 'error'); return; }
  const balance = Math.max(0, (s.amount || 0) - (s.paid || 0));
  const lines = (s.lines || []).map(l => `<tr>
    <td>${esc(l.productName)}</td>
    <td class="muted-cell" style="text-align:center">${l.qty}</td>
    <td class="price-cell">₪${formatNum(l.purchasePrice)}</td>
    <td class="price-cell">${l.discount ? l.discount + '%' : '—'}</td>
    <td class="price-cell"><b>₪${formatNum(l.purchasePrice * (1 - (l.discount || 0)/100) * l.qty)}</b></td>
  </tr>`).join('') || '<tr><td colspan="5" class="muted-cell" style="text-align:center;padding:20px">אין פירוט שורות</td></tr>';

  openModal(`חשבונית ספק ${esc(s.number)}`, `
    <div style="padding:20px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px;background:#f8f6f0;padding:14px;border-radius:6px;margin-bottom:14px">
        <div><span style="color:var(--muted)">ספק:</span> <b>${esc(s.supplier) || '—'}</b></div>
        <div><span style="color:var(--muted)">תיאור:</span> <b>${esc(s.desc) || '—'}</b></div>
        <div><span style="color:var(--muted)">תאריך:</span> <b>${formatDate(s.date)}</b></div>
        <div><span style="color:var(--muted)">לתשלום עד:</span> <b>${formatDate(s.dueDate)}</b></div>
      </div>
      <table class="table" style="font-size:13px"><thead><tr>
        <th>מוצר</th><th style="text-align:center">כמות</th><th style="text-align:left">מחיר רכישה</th><th style="text-align:left">הנחה</th><th style="text-align:left">סה"כ</th>
      </tr></thead><tbody>${lines}</tbody></table>
      <div style="border-top:2px solid var(--line);padding-top:10px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;font-size:13.5px">
        <div style="font-size:16px">סה"כ (כולל מע"מ): <b>₪${formatNum(s.amount)}</b></div>
        <div style="color:var(--green-2)">שולם: <b>₪${formatNum(s.paid)}</b></div>
        ${balance > 0 ? `<div style="color:var(--orange-2);font-weight:700">יתרה: ₪${formatNum(balance)}</div>` : ''}
      </div>
      ${s.notes ? `<div style="margin-top:14px;font-size:12.5px;color:var(--muted)"><b>הערות:</b> ${esc(s.notes)}</div>` : ''}
    </div>
  `, [{ label:'סגירה', class:'btn-ghost', action:closeModal }]);
}

function paySupplier(id) {
  const s = (DB.suppliers || []).find(x => x.id === id);
  if (!s) return;
  const balance = Math.max(0, (s.amount || 0) - (s.paid || 0));
  confirmDialogAdmin({
    title: 'סימון חשבונית ספק כשולמה',
    message: `לסמן את חשבונית <b>${esc(s.number)}</b> מ-${esc(s.supplier)} (יתרה ₪${formatNum(balance)}) כשולמה במלואה?`,
    confirmLabel: '✓ סמן כשולם',
    onConfirm: () => {
      s.paid = s.amount;
      s.status = 'paid';
      DB.save('suppliers');
      renderSupplierInvoices();
      showToast(`✓ חשבונית ${s.number} סומנה כשולמה`);
    }
  });
}

function deleteSupplier(id) {
  const s = (DB.suppliers || []).find(x => x.id === id);
  if (!s) return;
  confirmDialogAdmin({
    title: 'מחיקת חשבונית ספק',
    message: `למחוק את חשבונית <b>${esc(s.number)}</b> מ-${esc(s.supplier)} לצמיתות? פעולה זו אינה הפיכה.`,
    confirmLabel: '🗑 מחק',
    onConfirm: () => {
      DB.suppliers = (DB.suppliers || []).filter(x => x.id !== id);
      DB.save('suppliers');
      renderSupplierInvoices();
      showToast('חשבונית הספק נמחקה');
    }
  });
}

/* ===== DEBTS VIEW ===== */
function renderDebts() {
  const tbody = document.querySelector('#debtsTable tbody');
  if (!tbody) return;
  const today = new Date();
  const todayIso = today.toISOString().slice(0,10);

  // Open invoices, oldest dueDate first
  const open = (DB.invoices || [])
    .map(inv => ({ inv, balance: Math.max(0, (inv.amount || 0) - (inv.paid || 0)) }))
    .filter(x => x.balance > 0.01)
    .sort((a,b) => (a.inv.dueDate || a.inv.date || '').localeCompare(b.inv.dueDate || b.inv.date || ''));

  // KPIs by aging bucket
  let total = 0, b30 = 0, b60 = 0, b90 = 0;
  open.forEach(({ inv, balance }) => {
    total += balance;
    const due = new Date(inv.dueDate || inv.date);
    const days = isNaN(due) ? 0 : Math.floor((today - due) / 86400000);
    if (days <= 30)      b30 += balance;
    else if (days <= 60) b60 += balance;
    else                 b90 += balance;
  });
  const elTot = document.getElementById('debtKpiTotal'); if (elTot) elTot.textContent = '₪' + formatNum(total);
  const el30  = document.getElementById('debtKpi30');    if (el30)  el30.textContent  = '₪' + formatNum(b30);
  const el60  = document.getElementById('debtKpi60');    if (el60)  el60.textContent  = '₪' + formatNum(b60);
  const el90  = document.getElementById('debtKpi90');    if (el90)  el90.textContent  = '₪' + formatNum(b90);
  // Generic dashboard hooks (used by some buttons)
  const kpiDebt = document.getElementById('kpiDebt');    if (kpiDebt) kpiDebt.textContent = '₪' + formatNum(total);
  const sbBadge = document.getElementById('sbDebtsBadge');
  if (sbBadge) {
    const overdueCount = open.filter(x => x.inv.dueDate && x.inv.dueDate < todayIso).length;
    sbBadge.textContent = overdueCount;
    sbBadge.style.display = overdueCount ? '' : 'none';
  }

  if (!open.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><h4>אין חובות פתוחים 🎉</h4><p>כל החשבוניות שולמו במלואן.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = open.map(({ inv, balance }) => {
    const c = DB.companies.find(x => x.id === inv.companyId);
    const due = new Date(inv.dueDate || inv.date);
    const days = isNaN(due) ? 0 : Math.floor((today - due) / 86400000);
    const overdue = days > 0;
    const daysLabel = overdue
      ? `<span style="color:var(--danger);font-weight:700">${days} ימי איחור</span>`
      : `<span style="color:var(--muted)">בזמן (${Math.abs(days)} ימים נותרו)</span>`;
    const reminderLabel = inv.lastReminderAt ? formatDate(inv.lastReminderAt) : '—';
    return `<tr>
      <td>${esc(c?.name) || '—'}</td>
      <td class="strong-cell">${esc(inv.number)}</td>
      <td class="muted-cell">${formatDate(inv.date)}</td>
      <td class="muted-cell">${formatDate(inv.dueDate)}</td>
      <td>${daysLabel}</td>
      <td class="price-cell" style="color:var(--orange-2);font-weight:700">₪${formatNum(balance)}</td>
      <td class="muted-cell">${reminderLabel}</td>
      <td>
        <button class="row-action" onclick="viewInvoice(${inv.id})">צפה</button>
        <button class="row-action row-action-primary" onclick="recordPayment(${inv.id})">תשלום</button>
        <button class="row-action" onclick="sendReminder(${inv.id})" title="שלח תזכורת">🔔</button>
      </td>
    </tr>`;
  }).join('');
}

function sendReminder(id) {
  const inv = (DB.invoices || []).find(x => x.id === id);
  if (!inv) return;
  inv.lastReminderAt = new Date().toISOString().slice(0,10);
  DB.save('invoices');
  renderDebts();
  showToast(`📤 תזכורת נשלחה ללקוח על חשבונית ${inv.number} (סימולציה)`);
}

/* ===== CATEGORIES ADMIN ===== */
function renderCategoriesAdmin() {
  const tbody = document.querySelector('#categoriesTable tbody');
  if (!tbody) return;
  const search = (document.getElementById('categoriesSearch')?.value || '').trim().toLowerCase();
  let list = (DB.categories || []).slice().sort((a,b) => (a.order || 0) - (b.order || 0));
  if (search) list = list.filter(c =>
    (c.name || '').toLowerCase().includes(search) ||
    (c.id || '').toLowerCase().includes(search) ||
    (c.desc || '').toLowerCase().includes(search)
  );
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><h4>אין קטגוריות להצגה</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => {
    const productCount = (DB.products || []).filter(p => p.cat === c.id).length;
    return `<tr>
      <td class="strong-cell">${c.icon || ''} ${esc(c.name)}</td>
      <td class="muted-cell"><code style="font-size:11px">${esc(c.id)}</code></td>
      <td class="muted-cell">${esc(c.desc) || ''}</td>
      <td style="text-align:center">${productCount}</td>
      <td>${c.hidden ? '<span class="pill pill-warn">מוסתר</span>' : '<span class="pill pill-success">פעיל</span>'}</td>
      <td>
        <button class="row-action" onclick="moveCategory('${esc(c.id)}', -1)" title="העבר למעלה">↑</button>
        <button class="row-action" onclick="moveCategory('${esc(c.id)}', 1)" title="העבר למטה">↓</button>
        <button class="row-action row-action-primary" onclick="openCategoryModal('${esc(c.id)}')">ערוך</button>
        <button class="row-action row-action-danger" onclick="deleteCategory('${esc(c.id)}')">×</button>
      </td>
    </tr>`;
  }).join('');
}

function openCategoryModal(id) {
  const c = id ? (DB.categories || []).find(x => x.id === id) : null;
  const isEdit = !!c;
  openModal(isEdit ? `עריכת קטגוריה — ${esc(c.name)}` : 'קטגוריה חדשה', `
    <form id="catForm" onsubmit="saveCategory(event, ${isEdit ? `'${esc(c.id)}'` : 'null'})" style="padding:20px">
      <div class="form-grid" style="padding:0">
        <div class="field">
          <label>מזהה (id) <span class="req">*</span></label>
          <input type="text" name="id" value="${esc(c?.id) || ''}" pattern="[a-z0-9_-]+" placeholder="coffee" ${isEdit ? 'readonly style="background:#f0eee5"' : 'required'} />
          <div style="font-size:11px;color:var(--muted);margin-top:3px">אותיות קטנות באנגלית בלבד. לא ניתן לשנות לאחר יצירה.</div>
        </div>
        <div class="field">
          <label>שם <span class="req">*</span></label>
          <input type="text" name="name" value="${esc(c?.name) || ''}" required />
        </div>
        <div class="field">
          <label>אייקון</label>
          <input type="text" name="icon" value="${esc(c?.icon) || ''}" placeholder="☕" maxlength="4" />
        </div>
        <div class="field">
          <label>סדר תצוגה</label>
          <input type="number" name="order" value="${c?.order || ((DB.categories || []).length + 1)}" min="0" />
        </div>
        <div class="field full">
          <label>תיאור</label>
          <input type="text" name="desc" value="${esc(c?.desc) || ''}" />
        </div>
        <div class="field full" style="display:flex;gap:14px">
          <label class="check" style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" name="vatExempt" ${c?.vatExempt ? 'checked' : ''} />
            <span>פטור ממע"מ (פירות/ירקות)</span>
          </label>
          <label class="check" style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" name="hidden" ${c?.hidden ? 'checked' : ''} />
            <span>מוסתר מהאתר הציבורי</span>
          </label>
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:isEdit ? 'שמור' : 'צור', class:'btn-primary', action:() => document.getElementById('catForm').requestSubmit() }
  ]);
}

function saveCategory(e, id) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  d.order = Number(d.order) || 0;
  d.vatExempt = !!d.vatExempt;
  d.hidden = !!d.hidden;
  if (!d.id || !/^[a-z0-9_-]+$/.test(d.id)) { showToast('מזהה לא תקין', 'error'); return; }
  if (!d.name) { showToast('יש להזין שם', 'error'); return; }
  if (!DB.categories) DB.categories = [];
  if (id) {
    const idx = DB.categories.findIndex(c => c.id === id);
    if (idx === -1) { showToast('הקטגוריה לא נמצאה', 'error'); return; }
    DB.categories[idx] = { ...DB.categories[idx], ...d, id };
    showToast(`✓ הקטגוריה "${d.name}" עודכנה`);
  } else {
    if (DB.categories.some(c => c.id === d.id)) { showToast('מזהה זה כבר קיים', 'error'); return; }
    DB.categories.push(d);
    showToast(`✓ הקטגוריה "${d.name}" נוצרה`);
  }
  DB.save('categories');
  if (typeof rebuildCatNames === 'function') rebuildCatNames();
  syncCategoriesToPublic();
  closeModal();
  renderCategoriesAdmin();
}

function deleteCategory(id) {
  const c = (DB.categories || []).find(x => x.id === id);
  if (!c) return;
  const productCount = (DB.products || []).filter(p => p.cat === id).length;
  if (productCount > 0) {
    showToast(`לא ניתן למחוק — יש ${productCount} מוצרים בקטגוריה`, 'error');
    return;
  }
  confirmDialogAdmin({
    title: 'מחיקת קטגוריה',
    message: `למחוק את הקטגוריה <b>${esc(c.name)}</b> לצמיתות?`,
    confirmLabel: '🗑 מחק',
    onConfirm: () => {
      DB.categories = DB.categories.filter(x => x.id !== id);
      DB.save('categories');
      if (typeof rebuildCatNames === 'function') rebuildCatNames();
      syncCategoriesToPublic();
      renderCategoriesAdmin();
      showToast('הקטגוריה נמחקה');
    }
  });
}

function moveCategory(id, dir) {
  const list = (DB.categories || []).slice().sort((a,b) => (a.order || 0) - (b.order || 0));
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) return;
  const swapWith = idx + dir;
  if (swapWith < 0 || swapWith >= list.length) return;
  const a = list[idx], b = list[swapWith];
  const ao = a.order || 0, bo = b.order || 0;
  a.order = bo; b.order = ao;
  // Persist back into DB.categories (same object refs)
  DB.save('categories');
  syncCategoriesToPublic();
  renderCategoriesAdmin();
}

function syncCategoriesToPublic() {
  try { localStorage.setItem('balasi_admin_categories', JSON.stringify(DB.categories || [])); }
  catch (e) { console.warn('[categories] sync failed', e); }
}

/* ============ SUBCATEGORIES MANAGEMENT (תתי-קטגוריות) ============ */
/* Defaults mirror the structure in app.js. The admin panel stores user-edited
   data in localStorage under `balasi_subcategories` (map of catId → array). */
const ADMIN_DEFAULT_SUBCATEGORIES = {
  coffee: [
    { id:'capsules',  name:'קפסולות',          icon:'☕' },
    { id:'beans',     name:'פולים וטחון',       icon:'🫘' },
    { id:'instant',   name:'קפה נמס',           icon:'🥤' },
    { id:'tea',       name:'תה וצמחים',         icon:'🍵' },
    { id:'milk',      name:'חלב להקצפה',        icon:'🥛' },
    { id:'sugar',     name:'סוכר וממתיקים',     icon:'🍯' },
  ],
  drinks: [
    { id:'water',     name:'מים',               icon:'💧' },
    { id:'soda',      name:'גזוז וקולה',        icon:'🥤' },
    { id:'juice',     name:'מיצים טבעיים',      icon:'🍊' },
    { id:'icetea',    name:'תה קר',             icon:'🍋' },
    { id:'energy',    name:'משקאות אנרגיה',     icon:'⚡' },
    { id:'sparkling', name:'סודה ומוגזים',      icon:'🥂' },
  ],
  snacks: [
    { id:'crisps',    name:'חטיפי תפוצ׳יפס',    icon:'🌽' },
    { id:'nuts',      name:'אגוזים וגרעינים',    icon:'🥜' },
    { id:'crackers',  name:'קרקרים ובייגלה',     icon:'🥨' },
    { id:'granola',   name:'גרנולה ובריאות',    icon:'🌾' },
  ],
  sweets: [
    { id:'chocolate', name:'שוקולד',             icon:'🍫' },
    { id:'cookies',   name:'עוגיות',             icon:'🍪' },
    { id:'candies',   name:'סוכריות וממתקים',   icon:'🍬' },
    { id:'wafers',    name:'וופלים וחטיפים',     icon:'🍭' },
  ],
  bakery: [
    { id:'pastries',  name:'מאפים',              icon:'🥐' },
    { id:'breads',    name:'לחמים',              icon:'🍞' },
    { id:'cakes',     name:'עוגות',              icon:'🎂' },
    { id:'rolls',     name:'רוגלך וגלילים',      icon:'🥧' },
  ],
  dairy: [
    { id:'milk',      name:'חלב',                icon:'🥛' },
    { id:'cheese',    name:'גבינות',             icon:'🧀' },
    { id:'yogurt',    name:'יוגורט',             icon:'🥣' },
    { id:'butter',    name:'חמאה ושמנת',        icon:'🧈' },
  ],
  fruits: [
    { id:'baskets',   name:'סלי פירות',         icon:'🧺' },
    { id:'whole',     name:'פירות בודדים',      icon:'🍎' },
    { id:'cut',       name:'פירות חתוכים',      icon:'🍓' },
    { id:'vegetables',name:'ירקות טריים',       icon:'🥒' },
    { id:'dried',     name:'פירות יבשים',       icon:'🍇' },
  ],
  meals: [
    { id:'salads',    name:'סלטים',              icon:'🥗' },
    { id:'sandwiches',name:'כריכים',             icon:'🥪' },
    { id:'wraps',     name:'רולים ופוקצ׳ות',     icon:'🌯' },
    { id:'hot',       name:'ארוחות חמות',        icon:'🍲' },
  ],
  healthy: [
    { id:'vegan',     name:'טבעוני',             icon:'🌱' },
    { id:'glutenfree',name:'ללא גלוטן',          icon:'🌾' },
    { id:'lactosefree',name:'ללא לקטוז',         icon:'🥛' },
    { id:'protein',   name:'חלבון',              icon:'💪' },
  ],
  disposable: [
    { id:'plates',    name:'צלחות',              icon:'🍽️' },
    { id:'cups',      name:'כוסות',              icon:'🥃' },
    { id:'cutlery',   name:'סכו״ם',              icon:'🥄' },
    { id:'napkins',   name:'מפיות',              icon:'🧻' },
    { id:'bowls',     name:'קעריות',             icon:'🥣' },
  ],
  cleaning: [
    { id:'paper',     name:'נייר ומגבות',        icon:'🧻' },
    { id:'detergent', name:'חומרי ניקוי',        icon:'🧴' },
    { id:'soap',      name:'סבונים',             icon:'🧼' },
    { id:'wipes',     name:'מגבונים',            icon:'🧽' },
    { id:'bags',      name:'שקיות וזבל',         icon:'🗑️' },
  ],
};

function getAdminSubcategories() {
  try {
    const stored = JSON.parse(localStorage.getItem('balasi_subcategories') || 'null');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) return stored;
  } catch (e) {}
  return JSON.parse(JSON.stringify(ADMIN_DEFAULT_SUBCATEGORIES));
}
function saveAdminSubcategories(map) {
  try {
    localStorage.setItem('balasi_subcategories', JSON.stringify(map));
    // Trigger storage event for other tabs (public site)
    window.dispatchEvent(new StorageEvent('storage', { key:'balasi_subcategories', newValue: JSON.stringify(map) }));
  } catch (e) { console.warn('[subcategories] save failed', e); }
}

let _adminSubcatParent = null; // currently-selected parent category id

function renderSubcategoriesAdmin() {
  // Populate parent select
  const sel = document.getElementById('subcatParentSelect');
  if (!sel) return;
  const cats = (DB.categories || []).slice().sort((a,b) => (a.order || 0) - (b.order || 0)).filter(c => c.id !== 'all');
  if (!_adminSubcatParent && cats.length) _adminSubcatParent = cats[0].id;
  sel.innerHTML = cats.map(c => `<option value="${esc(c.id)}" ${c.id === _adminSubcatParent ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`).join('');
  _adminSubcatParent = sel.value;

  // Render table for selected parent
  const tbody = document.querySelector('#subcategoriesTable tbody');
  if (!tbody) return;
  const map = getAdminSubcategories();
  const subs = Array.isArray(map[_adminSubcatParent]) ? map[_adminSubcatParent] : [];
  if (!subs.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><h4>אין תתי-קטגוריות לקטגוריה זו</h4><p style="margin-top:6px;color:var(--muted)">לחץ "תת-קטגוריה חדשה" כדי להוסיף אחת.</p></div></td></tr>`;
    return;
  }
  // Build a count map per subcategory using overrides + static
  const overrides = (() => {
    try { return JSON.parse(localStorage.getItem('balasi_product_subcats') || '{}') || {}; }
    catch (e) { return {}; }
  })();
  const prodSubcat = p => Object.prototype.hasOwnProperty.call(overrides, p.id)
    ? overrides[p.id]
    : (p.subcat || null);
  const productsInCat = (DB.products || []).filter(p => p.cat === _adminSubcatParent);

  tbody.innerHTML = subs.map((s, i) => {
    const count = productsInCat.filter(p => prodSubcat(p) === s.id).length;
    return `<tr>
      <td>
        <button class="row-action" onclick="moveSubcategory('${esc(s.id)}', -1)" title="העבר למעלה">↑</button>
        <button class="row-action" onclick="moveSubcategory('${esc(s.id)}', 1)" title="העבר למטה">↓</button>
      </td>
      <td style="font-size:20px">${esc(s.icon || '')}</td>
      <td class="strong-cell">${esc(s.name)}</td>
      <td class="muted-cell"><code style="font-size:11px">${esc(s.id)}</code></td>
      <td style="text-align:center">${count}</td>
      <td>
        <button class="row-action row-action-primary" onclick="openSubcategoryModal('${esc(s.id)}')">ערוך</button>
        <button class="row-action row-action-danger" onclick="deleteSubcategory('${esc(s.id)}')">×</button>
      </td>
    </tr>`;
  }).join('');
}

function openSubcategoryModal(subId) {
  if (!_adminSubcatParent) { showToast('בחר קטגוריית-אב קודם'); return; }
  const map = getAdminSubcategories();
  const subs = Array.isArray(map[_adminSubcatParent]) ? map[_adminSubcatParent] : [];
  const s = subId ? subs.find(x => x.id === subId) : null;
  const isEdit = !!s;
  const parentCat = (DB.categories || []).find(c => c.id === _adminSubcatParent);
  const parentName = parentCat ? `${parentCat.icon || ''} ${parentCat.name}` : _adminSubcatParent;
  openModal(isEdit ? `עריכת תת-קטגוריה — ${esc(s.name)}` : `תת-קטגוריה חדשה תחת ${esc(parentName)}`, `
    <form id="subcatForm" onsubmit="saveSubcategory(event, ${isEdit ? `'${esc(s.id)}'` : 'null'})" style="padding:20px">
      <div class="form-grid" style="padding:0">
        <div class="field">
          <label>מזהה (id) <span class="req">*</span></label>
          <input type="text" name="id" value="${esc(s?.id) || ''}" pattern="[a-z0-9_-]+" placeholder="capsules" ${isEdit ? 'readonly style="background:#f0eee5"' : 'required'} />
          <div style="font-size:11px;color:var(--muted);margin-top:3px">אותיות קטנות באנגלית, ספרות, מקף.</div>
        </div>
        <div class="field">
          <label>שם בעברית <span class="req">*</span></label>
          <input type="text" name="name" value="${esc(s?.name) || ''}" required placeholder="קפסולות" />
        </div>
        <div class="field">
          <label>אייקון (אמוג'י)</label>
          <input type="text" name="icon" value="${esc(s?.icon) || ''}" placeholder="☕" maxlength="4" />
        </div>
        <div class="field" style="display:flex;align-items:flex-end">
          <div style="font-size:12px;color:var(--muted);padding-bottom:8px">קטגוריית-אב: <b>${esc(parentName)}</b></div>
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:isEdit ? 'שמור' : 'צור', class:'btn-primary', action:() => document.getElementById('subcatForm').requestSubmit() }
  ]);
}

function saveSubcategory(e, subId) {
  e.preventDefault();
  if (!_adminSubcatParent) return;
  const d = Object.fromEntries(new FormData(e.target).entries());
  const map = getAdminSubcategories();
  if (!Array.isArray(map[_adminSubcatParent])) map[_adminSubcatParent] = [];
  const arr = map[_adminSubcatParent];
  if (subId) {
    // Edit existing
    const i = arr.findIndex(x => x.id === subId);
    if (i === -1) { showToast('תת-הקטגוריה לא נמצאה'); return; }
    arr[i] = { id: subId, name: d.name.trim(), icon: (d.icon || '').trim() };
  } else {
    // Create new — validate ID uniqueness within parent
    const newId = (d.id || '').trim().toLowerCase();
    if (!newId) { showToast('יש להזין מזהה'); return; }
    if (arr.some(x => x.id === newId)) { showToast('מזהה כבר קיים בקטגוריה זו'); return; }
    arr.push({ id: newId, name: d.name.trim(), icon: (d.icon || '').trim() });
  }
  saveAdminSubcategories(map);
  closeModal();
  renderSubcategoriesAdmin();
  showToast(subId ? 'תת-הקטגוריה עודכנה' : 'תת-הקטגוריה נוצרה');
}

function deleteSubcategory(subId) {
  if (!_adminSubcatParent) return;
  if (!confirm('למחוק את תת-הקטגוריה? מוצרים שמשויכים אליה לא ימחקו, אבל הסיווג שלהם יוסר.')) return;
  const map = getAdminSubcategories();
  const arr = Array.isArray(map[_adminSubcatParent]) ? map[_adminSubcatParent] : [];
  const i = arr.findIndex(x => x.id === subId);
  if (i === -1) return;
  arr.splice(i, 1);
  map[_adminSubcatParent] = arr;
  // Clean up product-level overrides pointing to this sub
  try {
    const overrides = JSON.parse(localStorage.getItem('balasi_product_subcats') || '{}') || {};
    let changed = false;
    Object.keys(overrides).forEach(pid => { if (overrides[pid] === subId) { delete overrides[pid]; changed = true; } });
    if (changed) localStorage.setItem('balasi_product_subcats', JSON.stringify(overrides));
  } catch (e) {}
  saveAdminSubcategories(map);
  renderSubcategoriesAdmin();
  showToast('תת-הקטגוריה נמחקה');
}

function moveSubcategory(subId, dir) {
  if (!_adminSubcatParent) return;
  const map = getAdminSubcategories();
  const arr = Array.isArray(map[_adminSubcatParent]) ? map[_adminSubcatParent] : [];
  const i = arr.findIndex(x => x.id === subId);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  saveAdminSubcategories(map);
  renderSubcategoriesAdmin();
}

function resetSubcategoriesToDefault() {
  if (!confirm('להחזיר את כל תתי-הקטגוריות לברירת המחדל? כל השינויים שלך יימחקו.')) return;
  try { localStorage.removeItem('balasi_subcategories'); } catch (e) {}
  // Notify other tabs
  window.dispatchEvent(new StorageEvent('storage', { key:'balasi_subcategories', newValue: null }));
  renderSubcategoriesAdmin();
  showToast('תתי-הקטגוריות הוחזרו לברירת מחדל');
}

/* ===== SUPPLIERS LIST (Supplier Entities) ===== */
function renderSuppliersList() {
  const tbody = document.querySelector('#suppliersListTable tbody');
  if (!tbody) return;
  const search = (document.getElementById('suppliersListSearch')?.value || '').trim().toLowerCase();
  let list = (DB.supplierEntities || []).slice().sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  if (search) list = list.filter(s =>
    (s.name || '').toLowerCase().includes(search) ||
    (s.contact || '').toLowerCase().includes(search) ||
    (s.email || '').toLowerCase().includes(search) ||
    (s.taxId || '').toLowerCase().includes(search)
  );
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><h4>אין ספקים להצגה</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = list.map(s => {
    const productCount = (DB.products || []).filter(p => p.supplier === s.name).length;
    return `<tr>
      <td class="strong-cell">${esc(s.name)}</td>
      <td>${esc(s.contact) || '—'}</td>
      <td class="muted-cell">${esc(s.phone) || '—'}</td>
      <td class="muted-cell">${esc(s.email) || '—'}</td>
      <td class="muted-cell">${esc(s.taxId) || '—'}</td>
      <td style="text-align:center">${productCount}</td>
      <td>
        <button class="row-action row-action-primary" onclick="openSupplierEntityModal(${s.id})">ערוך</button>
        <button class="row-action row-action-danger" onclick="deleteSupplierEntity(${s.id})">×</button>
      </td>
    </tr>`;
  }).join('');
}

function openSupplierEntityModal(id) {
  const s = id ? (DB.supplierEntities || []).find(x => x.id === id) : null;
  const isEdit = !!s;
  openModal(isEdit ? `עריכת ספק — ${esc(s.name)}` : 'ספק חדש', `
    <form id="supEntForm" onsubmit="saveSupplierEntity(event, ${id || 'null'})" style="padding:20px">
      <div class="form-grid" style="padding:0">
        <div class="field full">
          <label>שם הספק <span class="req">*</span></label>
          <input type="text" name="name" value="${esc(s?.name) || ''}" required />
        </div>
        <div class="field">
          <label>איש קשר</label>
          <input type="text" name="contact" value="${esc(s?.contact) || ''}" />
        </div>
        <div class="field">
          <label>טלפון</label>
          <input type="text" name="phone" value="${esc(s?.phone) || ''}" />
        </div>
        <div class="field">
          <label>דוא"ל</label>
          <input type="email" name="email" value="${esc(s?.email) || ''}" />
        </div>
        <div class="field">
          <label>ח.פ / ע.מ.</label>
          <input type="text" name="taxId" value="${esc(s?.taxId) || ''}" />
        </div>
        <div class="field full">
          <label>כתובת</label>
          <input type="text" name="address" value="${esc(s?.address) || ''}" />
        </div>
        <div class="field">
          <label>תנאי תשלום</label>
          <select name="payTerms">
            <option value="credit" ${(s?.payTerms || 'credit') === 'credit' ? 'selected' : ''}>מזומן/אשראי</option>
            <option value="net30"  ${s?.payTerms === 'net30' ? 'selected' : ''}>שוטף+30</option>
            <option value="net45"  ${s?.payTerms === 'net45' ? 'selected' : ''}>שוטף+45</option>
            <option value="net60"  ${s?.payTerms === 'net60' ? 'selected' : ''}>שוטף+60</option>
            <option value="net90"  ${s?.payTerms === 'net90' ? 'selected' : ''}>שוטף+90</option>
          </select>
        </div>
        <div class="field full">
          <label>הערות</label>
          <textarea name="notes" rows="2">${esc(s?.notes) || ''}</textarea>
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:isEdit ? 'שמור' : 'צור', class:'btn-primary', action:() => document.getElementById('supEntForm').requestSubmit() }
  ]);
}

function saveSupplierEntity(e, id) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  if (!d.name) { showToast('יש להזין שם ספק', 'error'); return; }
  if (!DB.supplierEntities) DB.supplierEntities = [];
  if (id) {
    const idx = DB.supplierEntities.findIndex(x => x.id === id);
    if (idx === -1) { showToast('ספק לא נמצא', 'error'); return; }
    DB.supplierEntities[idx] = { ...DB.supplierEntities[idx], ...d, id };
    showToast(`✓ הספק "${d.name}" עודכן`);
  } else {
    const newId = Math.max(0, ...DB.supplierEntities.map(x => x.id || 0)) + 1;
    DB.supplierEntities.push({ id: newId, ...d });
    showToast(`✓ הספק "${d.name}" נוצר`);
  }
  DB.save('supplierEntities');
  closeModal();
  renderSuppliersList();
}

function deleteSupplierEntity(id) {
  const s = (DB.supplierEntities || []).find(x => x.id === id);
  if (!s) return;
  const linkedInvoices = (DB.suppliers || []).filter(x => x.supplier === s.name).length;
  const linkedProducts = (DB.products || []).filter(p => p.supplier === s.name).length;
  let warn = `למחוק את הספק <b>${esc(s.name)}</b>?`;
  if (linkedInvoices || linkedProducts) {
    warn += `<br><br>שים לב: יש ${linkedInvoices} חשבוניות ו-${linkedProducts} מוצרים מקושרים. הם יישארו אך יאבדו את הקישור (השם הטקסטואלי יישמר).`;
  }
  confirmDialogAdmin({
    title: 'מחיקת ספק', message: warn, confirmLabel: '🗑 מחק',
    onConfirm: () => {
      DB.supplierEntities = DB.supplierEntities.filter(x => x.id !== id);
      DB.save('supplierEntities');
      renderSuppliersList();
      showToast('הספק נמחק');
    }
  });
}

/* ===== INVOICE MODAL (manual invoice creation) ===== */
function openInvoiceModal(companyId) {
  const companies = DB.companies || [];
  const today = new Date().toISOString().slice(0,10);
  const defaultDue = addDaysISO(today, 30);
  const compOpts = companies.map(c => `<option value="${c.id}" ${companyId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  // Pre-load this company's unbilled DNs (if a company is preselected)
  openModal('חשבונית מס חדשה', `
    <form id="invForm" onsubmit="saveInvoiceFromModal(event)" style="padding:20px">
      <div class="form-grid" style="padding:0">
        <div class="field full">
          <label>חברה <span class="req">*</span></label>
          <select name="companyId" id="newInvCompany" onchange="reloadNewInvDNs()" required>
            <option value="">— בחרו חברה —</option>${compOpts}
          </select>
        </div>
        <div class="field">
          <label>תאריך החשבונית</label>
          <input type="date" name="date" value="${today}" onchange="document.getElementById('newInvDue').value = addDaysISO(this.value, 30)" />
        </div>
        <div class="field">
          <label>תאריך לתשלום</label>
          <input type="date" id="newInvDue" name="dueDate" value="${defaultDue}" />
        </div>
        <div class="field full">
          <label>תעודות משלוח לכלול בחשבונית</label>
          <div id="newInvDnList" style="border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--paper);max-height:240px;overflow-y:auto;font-size:13px">
            <div class="muted-cell" style="text-align:center;padding:10px">בחרו חברה כדי לראות תעודות משלוח שטרם חויבו</div>
          </div>
          <div id="newInvTotal" style="margin-top:8px;font-size:13.5px;text-align:left">סה"כ נבחר: <b>₪0</b></div>
        </div>
        <div class="field full">
          <label>הערות (אופציונלי)</label>
          <input type="text" name="notes" placeholder="למשל: חשבונית ריכוז עבור יוני 2026" />
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'הפק חשבונית', class:'btn-primary', action:() => document.getElementById('invForm').requestSubmit() }
  ]);
  if (companyId) reloadNewInvDNs();
}

function reloadNewInvDNs() {
  const sel = document.getElementById('newInvCompany');
  const list = document.getElementById('newInvDnList');
  if (!sel || !list) return;
  const cid = Number(sel.value);
  if (!cid) {
    list.innerHTML = '<div class="muted-cell" style="text-align:center;padding:10px">בחרו חברה כדי לראות תעודות משלוח שטרם חויבו</div>';
    updateNewInvTotal();
    return;
  }
  const dns = (DB.deliveryNotes || []).filter(d => d.companyId === cid && !d.billed && !d.invoiceId);
  if (!dns.length) {
    list.innerHTML = '<div class="muted-cell" style="text-align:center;padding:10px">אין תעודות משלוח לא מחויבות לחברה זו</div>';
    updateNewInvTotal();
    return;
  }
  list.innerHTML = dns.map(d => {
    const t = calculateTotalsWithVat(d.items || [], d.companyId, d.shipping || 0);
    return `<label style="display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid var(--line);cursor:pointer">
      <input type="checkbox" data-dnid="${d.id}" data-amount="${t.total}" checked onchange="updateNewInvTotal()" />
      <div style="flex:1">
        <b>${esc(d.number)}</b>
        <div style="font-size:11.5px;color:var(--muted)">${formatDate(d.date)} · ${(d.items || []).length} פריטים</div>
      </div>
      <div class="price-cell">₪${formatNum(t.total)}</div>
    </label>`;
  }).join('');
  updateNewInvTotal();
}

function updateNewInvTotal() {
  const list = document.getElementById('newInvDnList');
  const totalEl = document.getElementById('newInvTotal');
  if (!list || !totalEl) return;
  let sum = 0;
  list.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => sum += Number(cb.dataset.amount) || 0);
  totalEl.innerHTML = `סה"כ נבחר: <b>₪${formatNum(sum)}</b>`;
}

function saveInvoiceFromModal(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  const companyId = Number(d.companyId);
  if (!companyId) { showToast('יש לבחור חברה', 'error'); return; }
  const list = document.getElementById('newInvDnList');
  const checkedIds = Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(cb => Number(cb.dataset.dnid));
  if (!checkedIds.length) { showToast('יש לבחור לפחות תעודת משלוח אחת', 'error'); return; }

  // Aggregate all items from selected DNs
  const dns = (DB.deliveryNotes || []).filter(x => checkedIds.includes(x.id));
  const items = [];
  dns.forEach(dn => (dn.items || []).forEach(it => items.push({ ...it })));
  const shipping = dns.reduce((s, dn) => s + (Number(dn.shipping) || 0), 0);
  const totals = calculateTotalsWithVat(items, companyId, shipping);
  // התאמת הסכום לסכום שורות התעודות (כל תעודה כולל מע״מ), כדי שהחשבונית
  // המרוכזת תסתכם בדיוק לסה״כ המוצג בה (תיקון עיגול מע״מ, 2026-06-11).
  {
    const _r2x = n => Math.round(n * 100) / 100;
    const _perDn = dns.map(dn => calculateTotalsWithVat(dn.items || [], companyId, Number(dn.shipping) || 0));
    totals.total      = _r2x(_perDn.reduce((s, t) => s + t.total, 0));
    totals.vat        = _r2x(_perDn.reduce((s, t) => s + t.vat, 0));
    totals.exemptBase = _r2x(_perDn.reduce((s, t) => s + t.exemptBase, 0));
    totals.vatBase    = _r2x(_perDn.reduce((s, t) => s + t.vatBase, 0));
  }

  const invDate = d.date || new Date().toISOString().slice(0,10);
  const yr = invDate.slice(0,4);
  const newId = Math.max(0, ...(DB.invoices || []).map(i => i.id || 0)) + 1;
  const inv = {
    id: newId,
    number: 'INV-' + yr + '-' + String(newId).padStart(4, '0'),
    companyId,
    date: invDate,
    dueDate: d.dueDate || addDaysISO(invDate, 30),
    amount: totals.total,
    vatAmount: totals.vat,
    vatExemptBase: totals.exemptBase,
    paid: 0,
    notes: d.notes || `חשבונית ריכוז עבור ${dns.map(x => x.number).join(', ')}`,
    items,
    shipping,
    relatedDNs: checkedIds
  };
  DB.invoices = DB.invoices || [];
  DB.invoices.push(inv);
  // Mark each DN as billed
  dns.forEach(dn => { dn.billed = true; dn.invoiceId = newId; });
  DB.save();
  closeModal();
  renderInvoices();
  renderDeliveryNotes();
  if (typeof renderDashboard === 'function') renderDashboard();
  showToast(`✓ חשבונית ${inv.number} הופקה — ₪${formatNum(totals.total)}`);
  // Always prompt for the ITA allocation number after an invoice is
  // created, so the admin has an obvious entry point. Modal copy
  // adapts based on whether the amount is above/below the threshold.
  const overThreshold = (Number(totals.total) || 0) >= (typeof getAllocationThreshold === 'function' ? getAllocationThreshold() : 10000);
  if (overThreshold) {
    showToast('⚠ סכום מעל הסף — נדרש מספר הקצאה מ"חשבונית ישראל"', 'warn');
  }
  setTimeout(() => setAllocationNumber(newId), overThreshold ? 600 : 400);
}

/* ===== SUPPLIER INVOICE MODAL ===== */
function openSupplierInvoiceModal(id) {
  const s = id ? (DB.suppliers || []).find(x => x.id === id) : null;
  const isEdit = !!s;
  const today = new Date().toISOString().slice(0,10);
  const supEnts = DB.supplierEntities || [];
  const supOpts = supEnts.map(se =>
    `<option value="${esc(se.name)}" ${s?.supplier === se.name ? 'selected' : ''}>${esc(se.name)}</option>`
  ).join('');

  // Stash existing lines on window (so add/remove can mutate)
  window._supLines = (s?.lines || []).map(l => ({ ...l }));

  openModal(isEdit ? `עריכת חשבונית ספק ${esc(s.number)}` : 'חשבונית ספק חדשה', `
    <form id="supInvForm" onsubmit="saveSupplierInvoiceFromModal(event, ${id || 'null'})" style="padding:20px">
      <div class="form-grid" style="padding:0">
        <div class="field">
          <label>ספק <span class="req">*</span></label>
          <select name="supplier" required>
            <option value="">— בחרו ספק —</option>${supOpts}
          </select>
        </div>
        <div class="field">
          <label>מס׳ חשבונית</label>
          <input type="text" name="number" value="${esc(s?.number) || ''}" placeholder="SUP-2026-0001" />
        </div>
        <div class="field">
          <label>תאריך</label>
          <input type="date" name="date" value="${s?.date || today}" />
        </div>
        <div class="field">
          <label>תאריך לתשלום</label>
          <input type="date" name="dueDate" value="${s?.dueDate || addDaysISO(today, 30)}" />
        </div>
        <div class="field full">
          <label>תיאור</label>
          <input type="text" name="desc" value="${esc(s?.desc) || ''}" placeholder="למשל: משלוח חודשי - חטיפים" />
        </div>
        <div class="field full">
          <label>שורות (מוצרים)</label>
          <div id="supLinesWrap" style="border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--paper);font-size:12.5px"></div>
          <button type="button" class="btn btn-ghost" style="margin-top:8px" onclick="addSupLine()">+ הוסף שורה</button>
          <div id="supTotal" style="margin-top:8px;text-align:left;font-size:13.5px">סה"כ (כולל מע"מ): <b>₪0</b></div>
        </div>
        <div class="field full">
          <label>הערות</label>
          <input type="text" name="notes" value="${esc(s?.notes) || ''}" />
        </div>
      </div>
    </form>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:isEdit ? 'שמור' : 'צור', class:'btn-primary', action:() => document.getElementById('supInvForm').requestSubmit() }
  ]);
  renderSupLines();
}

function addSupLine() {
  if (!window._supLines) window._supLines = [];
  window._supLines.push({ productName:'', qty:1, purchasePrice:0, discount:0 });
  renderSupLines();
}

function removeSupLine(i) {
  if (!window._supLines) return;
  window._supLines.splice(i, 1);
  renderSupLines();
}

function updateSupLine(i, field, val) {
  if (!window._supLines || !window._supLines[i]) return;
  window._supLines[i][field] = (field === 'productName' || field === 'barcode') ? val : Number(val) || 0;
  recalcSupTotal();
}

function renderSupLines() {
  const wrap = document.getElementById('supLinesWrap');
  if (!wrap) return;
  const lines = window._supLines || [];
  if (!lines.length) {
    wrap.innerHTML = '<div class="muted-cell" style="text-align:center;padding:10px">אין שורות. לחצו "+ הוסף שורה".</div>';
    recalcSupTotal();
    return;
  }
  wrap.innerHTML = lines.map((l, i) => `
    <div style="display:grid;grid-template-columns:2fr .8fr 1fr .7fr auto;gap:6px;align-items:center;margin-bottom:6px">
      <input type="text"   value="${esc(l.productName)}" placeholder="שם מוצר" oninput="updateSupLine(${i},'productName',this.value)" />
      <input type="number" value="${l.qty}" min="0" step="1"   placeholder="כמות"    oninput="updateSupLine(${i},'qty',this.value)" />
      <input type="number" value="${l.purchasePrice}" min="0" step="0.01" placeholder="מחיר"    oninput="updateSupLine(${i},'purchasePrice',this.value)" />
      <input type="number" value="${l.discount || 0}" min="0" max="100" step="1" placeholder="הנחה%" oninput="updateSupLine(${i},'discount',this.value)" />
      <button type="button" class="row-action row-action-danger" onclick="removeSupLine(${i})" title="הסר">×</button>
    </div>`).join('');
  recalcSupTotal();
}

function recalcSupTotal() {
  const lines = window._supLines || [];
  let beforeVat = 0;
  lines.forEach(l => {
    const net = (Number(l.purchasePrice) || 0) * (1 - (Number(l.discount) || 0) / 100);
    beforeVat += net * (Number(l.qty) || 0);
  });
  const total = Math.round(beforeVat * (1 + VAT) * 100) / 100;
  const el = document.getElementById('supTotal');
  if (el) el.innerHTML = `סה"כ (כולל מע"מ): <b>₪${formatNum(total)}</b>`;
}

function saveSupplierInvoiceFromModal(e, id) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  if (!d.supplier) { showToast('יש לבחור ספק', 'error'); return; }
  const lines = (window._supLines || []).filter(l => l.productName && l.qty > 0);
  if (!lines.length) { showToast('יש להזין לפחות שורה אחת', 'error'); return; }

  // Compute amount with VAT
  let beforeVat = 0;
  lines.forEach(l => {
    const net = (Number(l.purchasePrice) || 0) * (1 - (Number(l.discount) || 0) / 100);
    beforeVat += net * (Number(l.qty) || 0);
  });
  const amount = Math.round(beforeVat * (1 + VAT) * 100) / 100;

  if (!DB.suppliers) DB.suppliers = [];
  if (id) {
    const idx = DB.suppliers.findIndex(x => x.id === id);
    if (idx === -1) { showToast('חשבונית לא נמצאה', 'error'); return; }
    DB.suppliers[idx] = { ...DB.suppliers[idx], ...d, lines, amount };
    showToast(`✓ חשבונית ספק עודכנה`);
  } else {
    const newId = Math.max(0, ...DB.suppliers.map(x => x.id || 0)) + 1;
    const yr = (d.date || new Date().toISOString().slice(0,10)).slice(0,4);
    const number = d.number || ('SUP-' + yr + '-' + String(newId).padStart(4, '0'));
    DB.suppliers.push({
      id: newId, number, supplier: d.supplier, desc: d.desc || '',
      date: d.date || new Date().toISOString().slice(0,10),
      dueDate: d.dueDate || '',
      paid: 0, status: 'open',
      notes: d.notes || '',
      lines, amount
    });
    // Update product cost data based on the new supply (latest cost wins)
    lines.forEach(l => {
      if (!l.productName) return;
      const prod = (DB.products || []).find(p => p.name === l.productName || p.barcode === l.barcode);
      if (prod) {
        const net = (Number(l.purchasePrice) || 0) * (1 - (Number(l.discount) || 0) / 100);
        prod.cost = Math.round(net * 100) / 100;
        prod.lastSupplyDate = d.date;
      }
    });
    DB.save('products');
    showToast(`✓ חשבונית ספק ${number} נוצרה — ₪${formatNum(amount)}`);
  }
  DB.save('suppliers');
  window._supLines = null;
  closeModal();
  renderSupplierInvoices();
}

/* ===== BULK BILLING WIZARD =====
   The killer-feature: scan ALL unbilled DNs grouped by company, let admin
   tick which to invoice, then create one consolidated invoice per company. */
function openBulkBillingWizard() {
  const today = new Date().toISOString().slice(0,10);
  const groups = {};
  (DB.deliveryNotes || []).forEach(d => {
    if (d.billed || d.invoiceId) return;
    if (!groups[d.companyId]) groups[d.companyId] = [];
    groups[d.companyId].push(d);
  });
  const cids = Object.keys(groups).map(Number);
  if (!cids.length) {
    showToast('אין תעודות משלוח שלא חויבו 🎉');
    return;
  }
  // Stash on window so toggles can mutate it
  window._bulkBilling = { selected: new Set() };
  cids.forEach(cid => groups[cid].forEach(d => window._bulkBilling.selected.add(d.id)));

  const groupHTML = cids.map(cid => {
    const c = DB.companies.find(x => x.id === cid);
    const dns = groups[cid];
    const sumAll = dns.reduce((s, d) => s + (calculateTotalsWithVat(d.items || [], cid, d.shipping || 0).total || 0), 0);
    const dnRows = dns.map(d => {
      const t = calculateTotalsWithVat(d.items || [], cid, d.shipping || 0);
      return `<label class="bulk-dn-row" style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-bottom:1px solid var(--line)">
        <input type="checkbox" data-dnid="${d.id}" data-cid="${cid}" data-amount="${t.total}" checked onchange="onBulkBillingToggle(this)" />
        <div style="flex:1">
          <b>${esc(d.number)}</b>
          <span style="font-size:11.5px;color:var(--muted)">· ${formatDate(d.date)} · ${(d.items || []).length} פריטים</span>
        </div>
        <div class="price-cell">₪${formatNum(t.total)}</div>
      </label>`;
    }).join('');
    return `<details class="bulk-group" data-cid="${cid}" open style="border:1px solid var(--line);border-radius:8px;margin-bottom:10px;background:var(--paper)">
      <summary style="padding:12px 14px;cursor:pointer;display:flex;align-items:center;gap:10px">
        <input type="checkbox" data-cid="${cid}" data-master="1" checked onchange="onBulkBillingMasterToggle(this)" onclick="event.stopPropagation()" />
        <b style="flex:1">${esc(c?.name) || 'חברה ' + cid}</b>
        <span class="muted-cell" style="font-size:12px">${dns.length} תעודות</span>
        <b class="price-cell">₪${formatNum(sumAll)}</b>
      </summary>
      <div style="padding:0 14px 12px 14px">${dnRows}</div>
    </details>`;
  }).join('');

  openModal('הפקת חשבוניות מרוכזות', `
    <div style="padding:20px">
      <div style="background:#eef9f1;border:1px solid #b9dec3;padding:12px 14px;border-radius:6px;margin-bottom:14px;font-size:13px">
        <b>🚀 חיוב חכם:</b> נמצאו <b>${cids.length}</b> לקוחות עם תעודות שטרם חויבו.
        בחרו אילו תעודות לכלול לכל לקוח — מערכת תפיק חשבונית מס מרוכזת אחת ללקוח.
      </div>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <button type="button" class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="onBulkBillingToggleAll(true)">סמן הכל</button>
        <button type="button" class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="onBulkBillingToggleAll(false)">נקה הכל</button>
      </div>
      <div id="bulkBillingList">${groupHTML}</div>
      <div id="bulkBillingSummary" style="margin-top:14px;padding:12px 14px;background:#f8f6f0;border-radius:6px;font-size:13.5px;text-align:left"></div>
    </div>
  `, [
    { label:'ביטול', class:'btn-ghost', action:closeModal },
    { label:'הפק חשבוניות', class:'btn-primary', action:executeBulkBillingFromWizard }
  ]);
  document.getElementById('modalCard').style.maxWidth = '720px';
  updateBulkBillingSummary();
}

function onBulkBillingToggle(cb) {
  const id = Number(cb.dataset.dnid);
  if (cb.checked) window._bulkBilling.selected.add(id);
  else            window._bulkBilling.selected.delete(id);
  // Update master checkbox state for the group
  const cid = Number(cb.dataset.cid);
  const master = document.querySelector(`input[data-cid="${cid}"][data-master="1"]`);
  if (master) {
    const all = document.querySelectorAll(`.bulk-group[data-cid="${cid}"] input[data-dnid]`);
    const allChecked = Array.from(all).every(x => x.checked);
    master.checked = allChecked;
    master.indeterminate = !allChecked && Array.from(all).some(x => x.checked);
  }
  updateBulkBillingSummary();
}

function onBulkBillingMasterToggle(cb) {
  const cid = Number(cb.dataset.cid);
  document.querySelectorAll(`.bulk-group[data-cid="${cid}"] input[data-dnid]`).forEach(x => {
    x.checked = cb.checked;
    const id = Number(x.dataset.dnid);
    if (cb.checked) window._bulkBilling.selected.add(id);
    else            window._bulkBilling.selected.delete(id);
  });
  updateBulkBillingSummary();
}

function onBulkBillingToggleAll(check) {
  document.querySelectorAll('#bulkBillingList input[type="checkbox"]').forEach(cb => {
    cb.checked = !!check;
    if (cb.dataset.dnid) {
      const id = Number(cb.dataset.dnid);
      if (check) window._bulkBilling.selected.add(id);
      else       window._bulkBilling.selected.delete(id);
    }
  });
  updateBulkBillingSummary();
}

function updateBulkBillingSummary() {
  const el = document.getElementById('bulkBillingSummary');
  if (!el) return;
  const sel = window._bulkBilling?.selected || new Set();
  const dns = (DB.deliveryNotes || []).filter(d => sel.has(d.id));
  const companies = new Set(dns.map(d => d.companyId));
  const total = dns.reduce((s, d) => s + (calculateTotalsWithVat(d.items || [], d.companyId, d.shipping || 0).total || 0), 0);
  el.innerHTML = `יופקו <b>${companies.size}</b> חשבוניות עבור <b>${dns.length}</b> תעודות משלוח · סה"כ <b>₪${formatNum(total)}</b>`;
}

function executeBulkBillingFromWizard() {
  const sel = window._bulkBilling?.selected || new Set();
  if (!sel.size) { showToast('לא נבחרו תעודות', 'error'); return; }
  // Group by company
  const byCompany = {};
  (DB.deliveryNotes || []).forEach(d => {
    if (!sel.has(d.id)) return;
    if (d.billed || d.invoiceId) return;
    if (!byCompany[d.companyId]) byCompany[d.companyId] = [];
    byCompany[d.companyId].push(d);
  });

  const today = new Date().toISOString().slice(0,10);
  const yr = today.slice(0,4);
  let createdCount = 0;
  let totalAmount = 0;
  Object.entries(byCompany).forEach(([cid, dns]) => {
    const companyId = Number(cid);
    const items = [];
    dns.forEach(dn => (dn.items || []).forEach(it => items.push({ ...it })));
    const shipping = dns.reduce((s, dn) => s + (Number(dn.shipping) || 0), 0);
    const totals = calculateTotalsWithVat(items, companyId, shipping);
    // התאמת הסכום לסכום שורות התעודות (כל תעודה כולל מע״מ), כדי שהחשבונית
    // המרוכזת תסתכם בדיוק לסה״כ המוצג בה (תיקון עיגול מע״מ, 2026-06-11).
    {
      const _r2x = n => Math.round(n * 100) / 100;
      const _perDn = dns.map(dn => calculateTotalsWithVat(dn.items || [], companyId, Number(dn.shipping) || 0));
      totals.total      = _r2x(_perDn.reduce((s, t) => s + t.total, 0));
      totals.vat        = _r2x(_perDn.reduce((s, t) => s + t.vat, 0));
      totals.exemptBase = _r2x(_perDn.reduce((s, t) => s + t.exemptBase, 0));
      totals.vatBase    = _r2x(_perDn.reduce((s, t) => s + t.vatBase, 0));
    }
    // מספור רץ ורציף: הספירה מתבצעת מחדש בכל סבב אחרי שהחשבונית הקודמת
    // כבר נדחפה ל-DB.invoices, לכן אין להוסיף createdCount (תיקון 2026-06-11).
    const newId = Math.max(0, ...(DB.invoices || []).map(i => i.id || 0)) + 1;
    const inv = {
      id: newId,
      number: 'INV-' + yr + '-' + String(newId).padStart(4, '0'),
      companyId,
      date: today,
      dueDate: addDaysISO(today, 30),
      amount: totals.total,
      vatAmount: totals.vat,
      vatExemptBase: totals.exemptBase,
      paid: 0,
      notes: `חשבונית ריכוז עבור ${dns.length} תעודות משלוח: ${dns.map(d => d.number).join(', ')}`,
      items,
      shipping,
      relatedDNs: dns.map(d => d.id),
      consolidatedDNs: dns.map(d => d.id)
    };
    DB.invoices = DB.invoices || [];
    DB.invoices.push(inv);
    dns.forEach(dn => { dn.billed = true; dn.invoiceId = newId; });
    createdCount++;
    totalAmount += totals.total;
  });
  DB.save();
  closeModal();
  if (typeof renderInvoices === 'function')      renderInvoices();
  if (typeof renderDeliveryNotes === 'function') renderDeliveryNotes();
  if (typeof renderDashboard === 'function')     renderDashboard();
  window._bulkBilling = null;
  showToast(`✓ הופקו ${createdCount} חשבוניות בסך ₪${formatNum(totalAmount)}`);
}

/* ===== EXCEL EXPORTS (SheetJS) =====
   Real .xlsx exports for orders, invoices, delivery notes, customers
   and products. SheetJS (xlsx.full.min.js) is loaded from CDN in admin.html.
   All sheets are RTL-aware (Hebrew column headers, '!sheetView.RTL = true').
   Numbers are kept numeric (not strings) so accountants can sort/sum natively. */

function _xlsxAvailable() {
  if (typeof XLSX === 'undefined') {
    showToast('ספריית האקסל עדיין נטענת — נסה שוב בעוד שנייה', 'error');
    return false;
  }
  return true;
}

function _exportRowsToExcel(filename, sheetName, headers, rows, columnWidths) {
  if (!_xlsxAvailable()) return;
  try {
    const wb = XLSX.utils.book_new();
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // RTL view for Hebrew
    ws['!sheetView'] = [{ rightToLeft: true }];
    // Column widths (px → "wch" character count, ~7px per char)
    if (columnWidths && columnWidths.length) {
      ws['!cols'] = columnWidths.map(w => ({ wch: w }));
    }
    // Bold header row
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) {
        ws[addr].s = { font: { bold: true } };
      }
    }
    // Truncate sheet name to Excel's 31-char limit and strip illegal chars
    const safeName = String(sheetName).replace(/[\\\/\?\*\[\]:]/g, '').slice(0, 31) || 'Sheet1';
    XLSX.utils.book_append_sheet(wb, ws, safeName);
    XLSX.writeFile(wb, filename);
    showToast(`✓ הקובץ ${filename} הורד`);
  } catch (err) {
    console.error('[exportToExcel] failed', err);
    showToast('שגיאה בייצוא לאקסל', 'error');
  }
}

function _statusLabelHE(status) {
  const map = {
    pending:'ממתין', confirmed:'אושר', 'in-delivery':'במשלוח',
    delivered:'נמסר', cancelled:'בוטל', paid:'שולם', partial:'תשלום חלקי',
    unpaid:'לא שולם'
  };
  return map[status] || status || '';
}

function _payTermsHE(t) {
  const map = { cash:'מזומן', credit:'אשראי לקוח', net30:'שוטף+30', net60:'שוטף+60' };
  return map[t] || t || '';
}

function exportOrders() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['מס\' הזמנה','תאריך','חברה','לקוח','עיר','סטטוס','תנאי תשלום','כמות פריטים','סכום ביניים (₪)','מע"מ (₪)','סה"כ כולל מע"מ (₪)','הערות'];
  const widths = [13, 12, 28, 22, 14, 12, 14, 11, 14, 12, 18, 30];
  const list = (DB.orders || []).slice().sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const rows = list.map(o => {
    const c = DB.companies.find(x => x.id === o.companyId);
    const cu = DB.customers.find(x => x.id === o.customerId);
    const totals = calculateTotalsWithVat(o.items || [], o.companyId, o.shipping || 0);
    return [
      o.orderNumber || o.id || '',
      o.createdAt ? formatDate(o.createdAt) : '',
      (c?.name) || o.companyName || '—',
      (cu?.name) || o.customerName || '—',
      o.deliveryCity || c?.city || '',
      _statusLabelHE(o.status),
      _payTermsHE(o.paymentTerms),
      (o.items || []).length,
      Number(totals.subtotal || 0),
      Number(totals.vat || 0),
      Number(totals.total || 0),
      o.notes || ''
    ];
  });
  _exportRowsToExcel(`balasi-orders-${today}.xlsx`, 'הזמנות', headers, rows, widths);
}

function exportDeliveryNotes() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['מס\' תעודה','תאריך','חברה','ח.פ','כתובת משלוח','כמות פריטים','סטטוס פריטים','סכום ביניים (₪)','מע"מ (₪)','סה"כ (₪)','חויב בחשבונית?','חשבונית מקושרת'];
  const widths = [13, 12, 28, 12, 30, 11, 18, 14, 12, 14, 13, 16];
  const list = (DB.deliveryNotes || []).slice().sort((a,b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  const rows = list.map(d => {
    const c = DB.companies.find(x => x.id === d.companyId);
    const totals = calculateTotalsWithVat(d.items || [], d.companyId, d.shipping || 0);
    const items = d.items || [];
    const missing = items.filter(i => i.status === 'missing').length;
    const subbed = items.filter(i => i.status === 'substituted').length;
    let statusText = `${items.length - missing - subbed} סופקו`;
    if (missing) statusText += ` · ${missing} חסר`;
    if (subbed) statusText += ` · ${subbed} הוחלף`;
    const billed = !!(d.billed || d.invoiceId);
    const linkedInv = d.invoiceId ? (DB.invoices.find(x => x.id === d.invoiceId)?.number || '') : '';
    return [
      d.number || '',
      formatDate(d.date || d.createdAt),
      (c?.name) || '—',
      c?.taxId || '',
      d.deliveryAddress || c?.address || '',
      items.length,
      statusText,
      Number(totals.subtotal || 0),
      Number(totals.vat || 0),
      Number(totals.total || 0),
      billed ? 'כן' : 'לא',
      linkedInv
    ];
  });
  _exportRowsToExcel(`balasi-delivery-notes-${today}.xlsx`, 'תעודות משלוח', headers, rows, widths);
}

function exportInvoices() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['מס\' חשבונית','תאריך','חברה','ח.פ','מס\' הקצאה','סכום ביניים (₪)','מע"מ (₪)','סה"כ (₪)','שולם (₪)','יתרה (₪)','סטטוס','תאריך תשלום אחרון'];
  const widths = [13, 12, 28, 12, 16, 14, 12, 14, 12, 12, 14, 16];
  const list = (DB.invoices || []).slice().sort((a,b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  const rows = list.map(inv => {
    const c = DB.companies.find(x => x.id === inv.companyId);
    const totals = calculateTotalsWithVat(inv.items || [], inv.companyId, inv.shipping || 0);
    const total = Number(totals.total || 0);
    const paid = Number(inv.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const status = balance <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');
    const lastPay = (inv.payments || []).slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''))[0];
    return [
      inv.number || '',
      formatDate(inv.date || inv.createdAt),
      (c?.name) || '—',
      c?.taxId || '',
      inv.allocationNumber || '',
      Number(totals.subtotal || 0),
      Number(totals.vat || 0),
      total,
      paid,
      balance,
      _statusLabelHE(status),
      lastPay ? formatDate(lastPay.date) : ''
    ];
  });
  _exportRowsToExcel(`balasi-invoices-${today}.xlsx`, 'חשבוניות', headers, rows, widths);
}

function exportCustomersToExcel() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['שם','חברה','תפקיד','טלפון','דוא"ל','עיר','סך הזמנות','סכום מצטבר (₪)','הערות'];
  const widths = [22, 28, 14, 14, 26, 14, 12, 16, 30];
  const list = (DB.customers || []).slice().sort((a,b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const rows = list.map(cu => {
    const c = DB.companies.find(x => x.id === cu.companyId);
    const orders = (DB.orders || []).filter(o => o.customerId === cu.id);
    const totalSpent = orders.reduce((s, o) => s + (calculateTotalsWithVat(o.items || [], o.companyId, o.shipping || 0).total || 0), 0);
    return [
      cu.name || '',
      c?.name || '',
      cu.role || '',
      cu.phone || '',
      cu.email || '',
      cu.city || c?.city || '',
      orders.length,
      Number(totalSpent),
      cu.notes || ''
    ];
  });
  _exportRowsToExcel(`balasi-customers-${today}.xlsx`, 'לקוחות', headers, rows, widths);
}

function exportProductsToExcel() {
  const today = new Date().toISOString().slice(0,10);
  const headers = ['מק"ט','ברקוד','שם','מותג','קטגוריה','יחידה','מחיר (₪)','עלות (₪)','מלאי','מינימום מלאי','ספק','מע"מ פטור?','מוסתר?'];
  const widths = [12, 16, 28, 16, 14, 10, 12, 12, 10, 12, 18, 12, 11];
  const list = (DB.products || []).slice().sort((a,b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const rows = list.map(p => {
    const cat = DB.categories.find(c => c.id === p.cat);
    return [
      p.sku || '',
      p.barcode || '',
      p.name || '',
      p.brand || '',
      cat?.name || p.cat || '',
      p.unit || '',
      Number(p.price || 0),
      Number(p.cost || 0),
      Number(p.stock || 0),
      Number(p.minStock || 0),
      p.supplier || '',
      isProductVatExempt(p) ? 'כן' : 'לא',
      p.hidden ? 'כן' : 'לא'
    ];
  });
  _exportRowsToExcel(`balasi-products-${today}.xlsx`, 'מוצרים ומלאי', headers, rows, widths);
}

/* ===== SETTINGS SAVE HANDLERS ===== */
function saveSettings(e) {
  e.preventDefault();
  const f = e.target;
  if (!DB.settings) DB.settings = {};
  const get = (n) => f.querySelector(`[name="${n}"]`)?.value;
  const num = (n) => { const v = Number(get(n)); return isNaN(v) ? undefined : v; };

  if (get('companyName') !== undefined) DB.settings.companyName = (get('companyName') || '').trim();
  if (get('taxId')       !== undefined) DB.settings.taxId       = (get('taxId') || '').trim();
  if (get('address')     !== undefined) DB.settings.address     = (get('address') || '').trim();
  if (get('addressNote') !== undefined) DB.settings.addressNote = (get('addressNote') || '').trim();
  if (get('phone')       !== undefined) DB.settings.phone       = (get('phone') || '').trim();
  if (get('email')       !== undefined) DB.settings.email       = (get('email') || '').trim();
  const vat = num('vat');                if (vat            !== undefined) DB.settings.vat            = vat;
  const minOrder = num('minOrder');      if (minOrder       !== undefined) DB.settings.minOrder       = minOrder;
  const minSh = num('minOrderSharon');   if (minSh          !== undefined) DB.settings.minOrderSharon = minSh;
  const fs = num('freeShip');            if (fs             !== undefined) DB.settings.freeShip       = fs;
  const sf = num('shipFee');             if (sf             !== undefined) DB.settings.shipFee        = sf;

  DB.save('settings');
  showToast('✓ ההגדרות נשמרו');
}

function saveAutoBillingSettings(e) {
  e.preventDefault();
  const f = e.target;
  if (!DB.settings) DB.settings = {};
  const ab = DB.settings.autoBilling = DB.settings.autoBilling || {};
  ab.enabled            = !!f.querySelector('[name="enabled"]')?.checked;
  ab.mode               = f.querySelector('[name="mode"]')?.value || 'confirm';
  ab.runDay             = Number(f.querySelector('[name="runDay"]')?.value) || 1;
  ab.includeAllPayTerms = !!f.querySelector('[name="includeAllPayTerms"]')?.checked;
  DB.save('settings');
  showToast('✓ הגדרות חיוב אוטומטי נשמרו');
}

/* ===== EXPORT / IMPORT (full backup) ===== */
function exportData() {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      companies:        DB.companies        || [],
      customers:        DB.customers        || [],
      products:         DB.products         || [],
      orders:           DB.orders           || [],
      invoices:         DB.invoices         || [],
      suppliers:        DB.suppliers        || [],
      deliveryNotes:    DB.deliveryNotes    || [],
      receipts:         DB.receipts         || [],
      credits:          DB.credits          || [],
      categories:       DB.categories       || [],
      supplierEntities: DB.supplierEntities || [],
      promotions:       DB.promotions       || [],
      settings:         DB.settings         || {}
    }
  };
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `balasi-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('✓ הגיבוי הורד בהצלחה');
  } catch (err) {
    console.error('[exportData] failed', err);
    showToast('שגיאה ביצירת הגיבוי', 'error');
  }
}

function importData(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    let parsed;
    try { parsed = JSON.parse(ev.target.result); }
    catch (err) {
      showToast('הקובץ אינו JSON תקין', 'error');
      event.target.value = '';
      return;
    }
    if (!parsed || !parsed.data || (!parsed.data.companies && !parsed.data.orders)) {
      showToast('פורמט גיבוי לא תקין — חסרים שדות חובה', 'error');
      event.target.value = '';
      return;
    }
    const exportedAt = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString('he-IL') : 'לא ידוע';
    const counts = Object.entries(parsed.data).map(([k, v]) =>
      `${k}: ${Array.isArray(v) ? v.length : (v && typeof v === 'object' ? '✓' : '0')}`
    ).join(' · ');
    const ok = confirm(
      `שחזור גיבוי יחליף את הנתונים הקיימים.\n\n` +
      `תאריך הגיבוי: ${exportedAt}\n` +
      `תוכן: ${counts}\n\n` +
      `להמשיך?`
    );
    if (!ok) {
      event.target.value = '';
      return;
    }
    const keys = ['companies','customers','products','orders','invoices','suppliers','deliveryNotes','receipts','credits','categories','supplierEntities','promotions','settings'];
    keys.forEach(k => {
      if (parsed.data[k] !== undefined) {
        DB[k] = parsed.data[k];
        DB.save(k);
      }
    });
    if (typeof rebuildCatNames === 'function') rebuildCatNames();
    syncCategoriesToPublic();
    if (typeof syncPromotionsToPublicSite === 'function') syncPromotionsToPublicSite();
    if (typeof syncHiddenProductsToPublic === 'function') syncHiddenProductsToPublic();
    if (typeof syncProductImagesToPublic === 'function')  syncProductImagesToPublic();
    // Re-render all views
    if (typeof renderDashboard === 'function')         renderDashboard();
    if (typeof renderOrders === 'function')            renderOrders();
    if (typeof renderCompanies === 'function')         renderCompanies();
    if (typeof renderCustomers === 'function')         renderCustomers();
    if (typeof renderProducts === 'function')          renderProducts();
    if (typeof renderInvoices === 'function')          renderInvoices();
    if (typeof renderDeliveryNotes === 'function')     renderDeliveryNotes();
    if (typeof renderSupplierInvoices === 'function')  renderSupplierInvoices();
    if (typeof renderDebts === 'function')             renderDebts();
    if (typeof renderCategoriesAdmin === 'function')   renderCategoriesAdmin();
    if (typeof renderSuppliersList === 'function')     renderSuppliersList();
    if (typeof renderPromotions === 'function')        renderPromotions();
    event.target.value = '';
    showToast('✓ הגיבוי שוחזר בהצלחה');
  };
  reader.onerror = () => {
    showToast('שגיאה בקריאת הקובץ', 'error');
    event.target.value = '';
  };
  reader.readAsText(file);
}

function resetDemoData() {
  if (!confirm('האם לאפס את כל הנתונים ולחזור לנתוני דמו? פעולה זו אינה הפיכה.')) return;
  if (!confirm('אישור סופי: כל הנתונים יימחקו. ודאו שיש לכם גיבוי. להמשיך?')) return;
  DB.reset();
  if (typeof rebuildCatNames === 'function') rebuildCatNames();
  if (typeof syncCategoriesToPublic === 'function') syncCategoriesToPublic();
  if (typeof renderDashboard === 'function')         renderDashboard();
  if (typeof renderOrders === 'function')            renderOrders();
  if (typeof renderCompanies === 'function')         renderCompanies();
  if (typeof renderCustomers === 'function')         renderCustomers();
  if (typeof renderProducts === 'function')          renderProducts();
  if (typeof renderInvoices === 'function')          renderInvoices();
  if (typeof renderDeliveryNotes === 'function')     renderDeliveryNotes();
  if (typeof renderSupplierInvoices === 'function')  renderSupplierInvoices();
  if (typeof renderDebts === 'function')             renderDebts();
  if (typeof renderCategoriesAdmin === 'function')   renderCategoriesAdmin();
  if (typeof renderSuppliersList === 'function')     renderSuppliersList();
  if (typeof renderPromotions === 'function')        renderPromotions();
  showToast('✓ הנתונים אופסו לנתוני דמו');
}

/* ===== AUTO-BACKUP ===== */
function todayISODate() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    year:'numeric', month:'2-digit', day:'2-digit',
    timeZone:'Asia/Jerusalem'
  });
  return fmt.format(new Date());
}

function keepRollingLocalBackups() {
  try {
    const today = todayISODate();
    const snapshot = {
      version: 2,
      savedAt: new Date().toISOString(),
      data: {
        companies:        DB.companies        || [],
        customers:        DB.customers        || [],
        products:         DB.products         || [],
        orders:           DB.orders           || [],
        invoices:         DB.invoices         || [],
        suppliers:        DB.suppliers        || [],
        deliveryNotes:    DB.deliveryNotes    || [],
        receipts:         DB.receipts         || [],
        credits:          DB.credits          || [],
        categories:       DB.categories       || [],
        supplierEntities: DB.supplierEntities || [],
        promotions:       DB.promotions       || [],
        settings:         DB.settings         || {}
      }
    };
    const json = JSON.stringify(snapshot);
    try {
      localStorage.setItem('admin_snapshot_' + today, json);
    } catch (quotaErr) {
      console.warn('[autoBackup] localStorage full, pruning old snapshots');
      cleanupOldLocalBackups(0);
      try { localStorage.setItem('admin_snapshot_' + today, json); }
      catch (e2) { console.error('[autoBackup] still failing after cleanup', e2); return; }
    }
    cleanupOldLocalBackups(7);
  } catch (err) {
    console.error('[keepRollingLocalBackups] failed', err);
  }
}

function cleanupOldLocalBackups(keepCount) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('admin_snapshot_')) keys.push(k);
  }
  keys.sort();
  const toDelete = keys.slice(0, Math.max(0, keys.length - keepCount));
  toDelete.forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
}

/* ===== Small missing helper stubs ===== */
function isThisMonth(date) {
  if (!date) return false;
  const d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function dayAgo(n) {
  const d = new Date(Date.now() - n*86400000);
  return d.toISOString().split('T')[0];
}

function dayAhead(n) {
  const d = new Date(Date.now() + n*86400000);
  return d.toISOString().split('T')[0];
}

function fmtDate(d) { return formatDate(d); }
function hebrewMonth(m) {
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return months[m] || '';
}
function getAllocationThreshold() {
  // Date-driven threshold table for the Israeli Tax Authority's
  // "חשבונית ישראל" allocation-number requirement. Each entry is the
  // first date on which that threshold takes effect; we pick the most
  // recent entry whose date is <= today.
  //   2024-01-01 → ₪25,000
  //   2025-01-01 → ₪20,000
  //   2026-01-01 → ₪10,000   (covers May 2026)
  //   2026-06-01 →  ₪5,000   (and onward)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  function thresholdForDate(d) {
    if (d >= '2026-06-01') return 5000;
    if (d >= '2026-01-01') return 10000;
    if (d >= '2025-01-01') return 20000;
    if (d >= '2024-01-01') return 25000;
    return 25000;
  }
  const ab = DB.settings?.allocation;
  if (!ab) return thresholdForDate(today);
  // If the admin disabled auto-mode, honor the manually-typed value
  if (ab.autoYearly === false) return Number(ab.threshold) || thresholdForDate(today);
  return thresholdForDate(today);
}
function invoiceNeedsAllocation(inv) {
  if (!inv) return false;
  const totals = calculateTotalsWithVat(inv.items || [], inv.companyId, inv.shipping || 0);
  return totals.total >= getAllocationThreshold();
}
/* ================================================================
   SAVE ALLOCATION NUMBER — INLINE (from the invoice document)
   Called from the input field embedded in viewInvoice. Saves on
   blur or on Enter key. Silently ignores empty input so accidental
   tabbing through the field doesn't trigger errors.
   ================================================================ */
function saveAllocationInline(invId, inputEl) {
  const inv = (DB.invoices || []).find(x => x.id === invId);
  if (!inv) return;
  const raw = (inputEl && inputEl.value || '').trim();
  const digits = raw.replace(/\D/g, '');
  // Empty input → don't save, don't show error (user might just be tabbing through)
  if (!digits) return;
  // No change → don't trigger a save/render cycle
  if (digits === inv.allocationNumber) return;
  inv.allocationNumber = digits;
  inv.allocationDate = new Date().toISOString().slice(0, 10);
  if (DB && typeof DB.save === 'function') DB.save();
  if (typeof showToast === 'function') showToast('✓ מספר הקצאה נשמר: ' + digits, 'success');
  if (typeof renderInvoices === 'function') renderInvoices();
  // Re-open the invoice view so the user immediately sees the green
  // "saved" state instead of the dashed input.
  if (typeof viewInvoice === 'function') {
    closeModal();
    setTimeout(() => viewInvoice(invId), 80);
  }
}

/* ================================================================
   SET ALLOCATION NUMBER — חשבונית ישראל (Israel Tax Authority)
   Opens a modal to enter / update / clear the allocation number
   on an invoice. Persists to DB and re-renders the invoices view.
   ================================================================ */
function setAllocationNumber(id) {
  const inv = (DB.invoices || []).find(x => x.id === id);
  if (!inv) { if (typeof showToast === 'function') showToast('חשבונית לא נמצאה', 'error'); return; }
  const c = (DB.companies || []).find(x => x.id === inv.companyId);
  const current = inv.allocationNumber || '';
  const threshold = (typeof getAllocationThreshold === 'function') ? getAllocationThreshold() : 10000;
  const isOver = (Number(inv.amount) || 0) >= threshold;
  const escFn = (typeof esc === 'function') ? esc : (s => String(s == null ? '' : s));
  const fmtNum = (typeof formatNum === 'function') ? formatNum : (n => Number(n || 0).toLocaleString('he-IL'));
  const fmtDate = (typeof formatDate === 'function') ? formatDate : (d => d || '');

  openModal('מספר הקצאה — חשבונית ' + escFn(inv.number), `
    <div style="padding:20px;max-width:520px">
      <div style="background:#f8f6f0;padding:12px 14px;border-radius:6px;margin-bottom:16px;font-size:13px;line-height:1.7">
        <div><span style="color:var(--muted)">לקוח:</span> <b>${escFn(c?.name) || '—'}</b></div>
        <div><span style="color:var(--muted)">תאריך:</span> <b>${fmtDate(inv.date)}</b></div>
        <div><span style="color:var(--muted)">סכום:</span> <b>₪${fmtNum(inv.amount)}</b></div>
        ${isOver
          ? `<div style="margin-top:8px;color:var(--orange-2);font-weight:700">⚠ סכום מעל הסף (₪${fmtNum(threshold)}) — נדרש מספר הקצאה ממערכת "חשבונית ישראל"</div>`
          : `<div style="margin-top:8px;color:var(--muted);font-size:12px">חשבונית מתחת לסף (₪${fmtNum(threshold)}) — מספר הקצאה אינו חובה, אך ניתן לשמור אותו אם הופק ע"י הרשות.</div>`}
      </div>
      <label for="allocationNumberInput" style="display:block;font-weight:700;margin-bottom:6px">מספר הקצאה</label>
      <input type="text" id="allocationNumberInput"
        value="${escFn(current)}"
        placeholder="9 ספרות, לדוגמה: 123456789"
        style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:6px;font-size:16px;letter-spacing:1.5px;font-family:inherit"
        autocomplete="off" inputmode="numeric" pattern="[0-9]*" />
      <div style="font-size:11.5px;color:var(--muted);margin-top:6px">
        המספר ניתן ע"י רשות המסים בקריאה למערכת "חשבונית ישראל". שמור אותו לתיעוד ולשליחה ללקוח.
      </div>
      ${inv.allocationDate ? `<div style="font-size:11.5px;color:var(--muted);margin-top:8px">נשמר לאחרונה: ${fmtDate(inv.allocationDate)}</div>` : ''}
    </div>
  `, [
    { label: 'ביטול', class: 'btn-ghost', action: closeModal },
    ...(current ? [{
      label: 'הסר מספר', class: 'btn-ghost', action: function () {
        delete inv.allocationNumber;
        delete inv.allocationDate;
        if (DB && typeof DB.save === 'function') DB.save();
        closeModal();
        if (typeof renderInvoices === 'function') renderInvoices();
        if (typeof showToast === 'function') showToast('מספר ההקצאה הוסר', 'info');
      }
    }] : []),
    {
      label: 'שמור', class: 'btn-primary', action: function () {
        const input = document.getElementById('allocationNumberInput');
        const raw = (input && input.value || '').trim();
        const digits = raw.replace(/\D/g, '');
        if (!digits) {
          if (typeof showToast === 'function') showToast('יש להזין מספר הקצאה (ספרות בלבד)', 'error');
          if (input) input.focus();
          return;
        }
        inv.allocationNumber = digits;
        inv.allocationDate = new Date().toISOString().slice(0, 10);
        if (DB && typeof DB.save === 'function') DB.save();
        closeModal();
        if (typeof renderInvoices === 'function') renderInvoices();
        if (typeof showToast === 'function') showToast('✓ מספר הקצאה נשמר: ' + digits, 'success');
      }
    }
  ]);
  setTimeout(function () {
    const el = document.getElementById('allocationNumberInput');
    if (el) { el.focus(); el.select(); }
  }, 60);
}
function printDocument() { window.print(); }
function showPrintHistory() { showToast('בקרוב'); }
function renderCopyMarker() { return ''; }
function renderBulkBillingBanners() {
  const unbilled = (DB.deliveryNotes || []).filter(d => !d.billed && !d.invoiceId);
  const count = unbilled.length;
  const companies = new Set(unbilled.map(d => d.companyId)).size;
  const total = unbilled.reduce((s, d) => s + (calculateTotalsWithVat(d.items || [], d.companyId, d.shipping || 0).total || 0), 0);
  const banners = [
    { box: 'dashBulkBanner',     title: 'dashBulkBannerTitle', sub: 'dashBulkBannerSub' },
    { box: 'invoicesBulkBanner', title: 'bulkBannerTitle',     sub: 'bulkBannerSub' }
  ];
  banners.forEach(b => {
    const box = document.getElementById(b.box);
    if (!box) return;
    if (count > 0) {
      box.style.display = '';
      const t = document.getElementById(b.title);
      const s = document.getElementById(b.sub);
      if (t) t.textContent = `יש ${count} תעודות משלוח שטרם חויבו (${companies} לקוחות)`;
      if (s) s.textContent = `סה"כ ₪${formatNum(total)} · לחץ להפקת חשבונית מס מרוכזת אחת לכל לקוח`;
    } else {
      box.style.display = 'none';
    }
  });
}
function stockKey(p) { return p.stock <= 0 ? 'out' : (p.stock <= (p.minStock||5) ? 'low' : 'in'); }
function stockPill(p) {
  const k = stockKey(p);
  if (k === 'out') return '<span class="pill pill-danger">אזל</span>';
  if (k === 'low') return '<span class="pill pill-warn">מלאי קטן</span>';
  return '<span class="pill pill-success">במלאי</span>';
}
function setupAudioPriming() { /* audio context priming for browser autoplay policies */ }
function beep() { try { if (typeof getOrCreateAudioCtx === 'function') playOrderDing(); } catch(e){} }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val == null ? '' : val; }
function checkAutoBilling() { /* no-op stub */ }
function attachAdminEvents() {
  /* ---------------------------------------------------------------
     Wire up search inputs and filter selects to their render funcs.
     The HTML markup intentionally omits oninput/onchange so we keep
     all the wiring here in one place.
     Search inputs are debounced ~200ms to avoid jitter on long lists.
     --------------------------------------------------------------- */
  const debounce = (fn, ms = 200) => {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  };
  const wire = (id, event, handler) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.wired === '1') return;
    el.addEventListener(event, handler);
    el.dataset.wired = '1';
  };

  // Orders
  if (typeof renderOrders === 'function') {
    wire('ordersSearch', 'input',  debounce(() => renderOrders()));
    wire('ordersFilter', 'change', () => renderOrders());
  }
  // Companies
  if (typeof renderCompanies === 'function') {
    wire('companiesSearch', 'input', debounce(() => renderCompanies()));
  }
  // Customers (contacts)
  if (typeof renderCustomers === 'function') {
    wire('customersSearch',        'input',  debounce(() => renderCustomers()));
    wire('customersCompanyFilter', 'change', () => renderCustomers());
  }
  // Categories
  if (typeof renderCategoriesAdmin === 'function') {
    wire('categoriesSearch', 'input', debounce(() => renderCategoriesAdmin()));
  }
  // Suppliers list
  if (typeof renderSuppliersList === 'function') {
    wire('suppliersListSearch', 'input', debounce(() => renderSuppliersList()));
  }
  // Delivery notes
  if (typeof renderDeliveryNotes === 'function') {
    wire('dnSearch',         'input',  debounce(() => renderDeliveryNotes()));
    wire('dnCompanyFilter',  'change', () => renderDeliveryNotes());
    wire('dnStatusFilter',   'change', () => renderDeliveryNotes());
  }
  // Invoices
  if (typeof renderInvoices === 'function') {
    wire('invoicesSearch',       'input',  debounce(() => renderInvoices()));
    wire('invoicesStatusFilter', 'change', () => renderInvoices());
  }
  // Supplier invoices
  if (typeof renderSupplierInvoices === 'function') {
    wire('supplierSearch', 'input', debounce(() => renderSupplierInvoices()));
  }
}

/* mk is used inside seed functions — already defined inline there. We provide a fallback. */
if (typeof mk === 'undefined') {
  window.mk = function(...args) { return Object.assign({}, ...args.map(a => typeof a === 'object' ? a : {})); };
}

/* HTML escape — used by render functions for XSS protection */
function esc(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}


/* =====================================================================
   ✉ EMAIL / PDF — three-option flow:
     (1) Save as PDF — download only, no email
     (2) Open mail client — generates PDF + opens default mail client
     (3) Send directly via EmailJS — sends a formatted HTML email
                                     (PDF still downloaded for the user's
                                      records; not attached because the
                                      free EmailJS plan does not support
                                      programmatic attachments).
   ===================================================================== */

/* ---- Build the document data needed by all 3 flows ----------------- */
function _emailResolveDoc(type, id) {
  var info = { type: type, id: id, doc: null, company: {}, account: {},
               branch: {}, label: '', numberStr: '', totalAmount: 0,
               items: [], recipientEmail: '' };

  if (type === 'dn') {
    info.doc = (DB.deliveryNotes || []).find(function(d){ return d.id === id; });
    if (!info.doc) return null;
    info.label = 'תעודת משלוח';
    info.numberStr = info.doc.number || ('DN-' + id);
    var dnTotals = (typeof calculateTotalsWithVat === 'function')
      ? calculateTotalsWithVat(info.doc.items || [], info.doc.companyId, info.doc.shipping || 0) : null;
    info.totalAmount = dnTotals ? dnTotals.total : 0;
    info._totals = dnTotals;
  } else if (type === 'inv') {
    info.doc = (DB.invoices || []).find(function(x){ return x.id === id; });
    if (!info.doc) return null;
    info.label = 'חשבונית מס';
    info.numberStr = info.doc.number || ('INV-' + id);
    info.totalAmount = info.doc.amount || 0;
    info._totals = (info.doc.items && info.doc.items.length && typeof calculateTotalsWithVat === 'function')
      ? calculateTotalsWithVat(info.doc.items, info.doc.companyId, info.doc.shipping || 0) : null;
  } else {
    return null;
  }

  info.items   = info.doc.items || [];
  info.company = (DB.companies || []).find(function(x){ return x.id === info.doc.companyId; }) || {};
  info.account = (info.company.accounts || []).find(function(a){ return a.id === info.doc.accountId; })
              || (info.company.accounts || []).find(function(a){ return a.isPrimary; })
              || (info.company.accounts || [])[0] || {};
  info.branch  = (info.company.branches || []).find(function(b){ return b.isPrimary; })
              || (info.company.branches || [])[0] || {};

  // resolve recipient email (account → company → primary contact via accessList)
  if (info.account && info.account.email) info.recipientEmail = info.account.email;
  else if (info.company && info.company.email) info.recipientEmail = info.company.email;
  else if (Array.isArray(DB.customers)) {
    var contact = DB.customers.find(function(cust){
      return cust && cust.email && Array.isArray(cust.accessList) &&
             cust.accessList.some(function(a){ return a && a.companyId === info.doc.companyId; });
    });
    if (contact) info.recipientEmail = contact.email;
  }
  return info;
}

/* ---- Main entry: opens the action-selection modal ------------------ */
function emailDocument(type, id) {
  var info = _emailResolveDoc(type, id);
  if (!info) { showToast('המסמך לא נמצא', 'error'); return; }

  var settings  = DB.settings || {};
  var senderName  = settings.companyName || 'בלסי סטור בע״מ';
  var senderEmail = settings.email || 'balasistore5@gmail.com';
  var totalFmt = (typeof formatNum === 'function') ? formatNum(info.totalAmount) : String(info.totalAmount);

  // Is EmailJS configured?
  var ej = settings.emailjs || {};
  var ejReady = !!(ej.serviceId && ej.templateId && ej.publicKey);
  var ejSdkLoaded = (typeof emailjs !== 'undefined' && emailjs && typeof emailjs.send === 'function');

  var defaultSubject = info.label + ' ' + info.numberStr + ' — ' + senderName;
  var defaultBody =
    'שלום' + (info.company.name ? ' ' + info.company.name : '') + ',\n\n' +
    'מצורף בזאת ' + info.label + ' מספר ' + info.numberStr + ' על סך ₪' + totalFmt + '.\n\n' +
    'תודה,\n' +
    senderName + '\n' +
    senderEmail;

  // Build the 3 action-card HTMLs separately, then concatenate cleanly.
  var pdfBtnHtml =
    '<button type="button" onclick="savePdfOnly(\'' + type + '\',' + id + ')" ' +
        'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;border:1.5px solid var(--line);background:#fff;border-radius:8px;cursor:pointer;text-align:center;transition:all .15s" ' +
        'onmouseover="this.style.borderColor=\'#1b7a3d\';this.style.background=\'#f0f9f3\'" ' +
        'onmouseout="this.style.borderColor=\'var(--line)\';this.style.background=\'#fff\'">' +
      '<span style="font-size:24px">💾</span>' +
      '<b style="font-size:13.5px;color:var(--ink)">שמור כ-PDF</b>' +
      '<span style="font-size:11px;color:var(--muted);line-height:1.4">הורד קובץ PDF בלבד<br>(ללא שליחת מייל)</span>' +
    '</button>';

  var mailtoBtnHtml =
    '<button type="button" onclick="emailViaMailto(\'' + type + '\',' + id + ')" ' +
        'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;border:1.5px solid var(--line);background:#fff;border-radius:8px;cursor:pointer;text-align:center;transition:all .15s" ' +
        'onmouseover="this.style.borderColor=\'#2563eb\';this.style.background=\'#eaf3ff\'" ' +
        'onmouseout="this.style.borderColor=\'var(--line)\';this.style.background=\'#fff\'">' +
      '<span style="font-size:24px">📧</span>' +
      '<b style="font-size:13.5px;color:var(--ink)">פתח תוכנת מייל</b>' +
      '<span style="font-size:11px;color:var(--muted);line-height:1.4">PDF יורד + נפתחת תוכנת המייל<br>לצירוף ידני</span>' +
    '</button>';

  var sendBtnHtml;
  if (ejReady && ejSdkLoaded) {
    sendBtnHtml =
      '<button type="button" onclick="emailViaEmailJS(\'' + type + '\',' + id + ')" ' +
          'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;border:2px solid var(--green);background:#e8f4ea;border-radius:8px;cursor:pointer;text-align:center;transition:all .15s;position:relative" ' +
          'onmouseover="this.style.background=\'#d4ecd9\'" ' +
          'onmouseout="this.style.background=\'#e8f4ea\'">' +
        '<span style="position:absolute;top:6px;left:6px;background:var(--green);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:10px;letter-spacing:.5px">מומלץ</span>' +
        '<span style="font-size:24px">✉</span>' +
        '<b style="font-size:13.5px;color:#1b5e34">שלח ישירות עכשיו</b>' +
        '<span style="font-size:11px;color:#1b5e34;line-height:1.4">המייל יישלח אוטומטית<br>(EmailJS)</span>' +
      '</button>';
  } else {
    sendBtnHtml =
      '<button type="button" onclick="closeModal(); switchView(\'settings\');" ' +
          'style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;border:1.5px dashed #d0c8b8;background:#faf8f3;border-radius:8px;cursor:pointer;text-align:center;opacity:.9">' +
        '<span style="font-size:24px;filter:grayscale(1);opacity:.6">✉</span>' +
        '<b style="font-size:13.5px;color:var(--muted)">שלח ישירות עכשיו</b>' +
        '<span style="font-size:11px;color:var(--orange-2);line-height:1.4">⚙ דורש הגדרת EmailJS<br>(לחץ להגדרה)</span>' +
      '</button>';
  }

  var helperHtml = !ejReady
    ? '<div style="margin-top:10px;font-size:11.5px;color:var(--muted);text-align:center">' +
        'רוצה לשלוח מיילים ישירות בלי לפתוח Gmail? ' +
        '<a onclick="closeModal(); switchView(\'settings\');" style="color:#2563eb;cursor:pointer;text-decoration:underline">הגדר EmailJS</a> (פעם אחת, ~3 דקות)' +
      '</div>'
    : '';

  var recipientHint = info.recipientEmail
    ? '<div style="font-size:11.5px;color:var(--muted);margin-top:4px">המייל זוהה אוטומטית מכרטיס הלקוח. ניתן לערוך לפני שליחה.</div>'
    : '<div style="font-size:11.5px;color:var(--orange-2);margin-top:4px">⚠ לא נמצא מייל בכרטיס הלקוח — נא להזין ידנית.</div>';

  var modalHtml =
    '<form id="emailDocForm" onsubmit="return false" style="padding:22px">' +
      '<div style="background:#f8f6f0;border:1px solid #e0dccd;padding:14px 16px;margin-bottom:18px;border-radius:6px">' +
        '<div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#807a6e;font-weight:700;margin-bottom:8px">פרטי המסמך</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px">' +
          '<div><span style="color:#807a6e">מסמך:</span> <b>' + info.label + ' ' + esc(info.numberStr) + '</b></div>' +
          '<div><span style="color:#807a6e">לקוח:</span> <b>' + esc(info.company.name || '—') + '</b></div>' +
          '<div><span style="color:#807a6e">סכום:</span> <b>₪' + totalFmt + '</b></div>' +
          '<div><span style="color:#807a6e">מספר פריטים:</span> <b>' + (info.items.length || 0) + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="form-grid" style="padding:0">' +
        '<div class="field full" style="grid-column:1/-1">' +
          '<label>כתובת מייל הנמען <span class="req">*</span></label>' +
          '<input type="email" id="emailDocTo" value="' + esc(info.recipientEmail) + '" placeholder="customer@example.com" />' +
          recipientHint +
        '</div>' +
        '<div class="field full" style="grid-column:1/-1">' +
          '<label>נושא</label>' +
          '<input type="text" id="emailDocSubject" value="' + esc(defaultSubject) + '" />' +
        '</div>' +
        '<div class="field full" style="grid-column:1/-1">' +
          '<label>גוף ההודעה</label>' +
          '<textarea id="emailDocBody" rows="6" style="font-family:inherit;font-size:13px;line-height:1.6;width:100%;padding:10px;border:1.5px solid var(--line);border-radius:6px;background:#fff;resize:vertical">' + esc(defaultBody) + '</textarea>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:22px">' +
        '<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#807a6e;font-weight:700;margin-bottom:10px">בחר פעולה</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
          pdfBtnHtml + mailtoBtnHtml + sendBtnHtml +
        '</div>' +
        helperHtml +
      '</div>' +
    '</form>';

  openModal('✉ שליחת ' + info.label + ' ' + info.numberStr, modalHtml, [
    { label:'ביטול', class:'btn-ghost', action: closeModal }
  ]);
}


/* ---- Action 1: save as PDF only ------------------------------------ */
function savePdfOnly(type, id) {
  var info = _emailResolveDoc(type, id);
  if (!info) { showToast('המסמך לא נמצא','error'); return; }
  closeModal();
  showToast('יוצר קובץ PDF…');
  setTimeout(function(){
    if (type === 'dn') viewDeliveryNote(id);
    else                viewInvoice(id);
    setTimeout(function(){
      _generatePdfFromModal(info, function(filename){
        closeModal();
        showToast('✓ ' + filename + ' נשמר בהורדות');
      }, function(){
        closeModal();
      });
    }, 250);
  }, 120);
}

/* ---- Action 2: mailto + PDF download ------------------------------- */
function emailViaMailto(type, id) {
  var to       = (document.getElementById('emailDocTo')    || {}).value || '';
  var subject  = (document.getElementById('emailDocSubject')|| {}).value || '';
  var body     = (document.getElementById('emailDocBody')   || {}).value || '';
  if (!to) { showToast('יש להזין כתובת מייל', 'error'); return; }

  var info = _emailResolveDoc(type, id);
  if (!info) { showToast('המסמך לא נמצא','error'); return; }
  closeModal();
  showToast('יוצר קובץ PDF…');
  setTimeout(function(){
    if (type === 'dn') viewDeliveryNote(id);
    else                viewInvoice(id);
    setTimeout(function(){
      _generatePdfFromModal(info, function(filename){
        closeModal();
        showToast('✓ ' + filename + ' הורד');
        setTimeout(function(){
          var hint = '\n\n— —\nשים לב לצרף את הקובץ: ' + filename;
          var href = 'mailto:' + encodeURIComponent(to)
                   + '?subject=' + encodeURIComponent(subject)
                   + '&body='    + encodeURIComponent(body + hint);
          window.location.href = href;
          setTimeout(function(){ showToast('✓ נפתחה תוכנת המייל. צרף את ה-PDF ושלח.'); }, 500);
        }, 300);
      }, function(){
        closeModal();
      });
    }, 250);
  }, 120);
}

/* ---- Action 3: send directly via EmailJS --------------------------- */
function emailViaEmailJS(type, id) {
  var to       = (document.getElementById('emailDocTo')    || {}).value || '';
  var subject  = (document.getElementById('emailDocSubject')|| {}).value || '';
  var bodyText = (document.getElementById('emailDocBody')   || {}).value || '';
  if (!to) { showToast('יש להזין כתובת מייל', 'error'); return; }

  var info = _emailResolveDoc(type, id);
  if (!info) { showToast('המסמך לא נמצא','error'); return; }

  var settings = DB.settings || {};
  var ej = settings.emailjs || {};
  if (!ej.serviceId || !ej.templateId || !ej.publicKey) {
    showToast('EmailJS לא הוגדר — עבור להגדרות', 'error');
    return;
  }
  if (typeof emailjs === 'undefined' || !emailjs || typeof emailjs.send !== 'function') {
    showToast('ספריית EmailJS לא נטענה', 'error');
    return;
  }

  closeModal();
  showToast('שולח מייל…');

  // Generate a styled HTML body that mirrors the document
  var htmlBody = _buildEmailHtml(info, bodyText);
  var senderName = settings.companyName || 'בלסי סטור בע״מ';

  try { emailjs.init({ publicKey: ej.publicKey }); } catch(e) {}

  emailjs.send(ej.serviceId, ej.templateId, {
    to_email:     to,
    from_name:    senderName,
    subject:      subject,
    message:      bodyText,         // plain-text fallback
    message_html: htmlBody          // styled HTML body
  }, { publicKey: ej.publicKey })
  .then(function(){
    showToast('✓ המייל נשלח בהצלחה ל-' + to);
    // Also generate the PDF for the user's records
    setTimeout(function(){
      if (type === 'dn') viewDeliveryNote(id);
      else                viewInvoice(id);
      setTimeout(function(){
        _generatePdfFromModal(info, function(filename){
          closeModal();
          showToast('✓ PDF נשמר אצלך: ' + filename);
        }, function(){ closeModal(); });
      }, 250);
    }, 600);
  })
  .catch(function(err){
    console.error('EmailJS error:', err);
    var msg = (err && (err.text || err.message)) ? (err.text || err.message) : 'שגיאה לא ידועה';
    showToast('✗ שליחה נכשלה: ' + msg, 'error');
  });
}

/* ---- Build a styled HTML body for direct email sending ------------- */
function _buildEmailHtml(info, plainBody) {
  var settings = DB.settings || {};
  var senderName  = settings.companyName || 'בלסי סטור בע״מ';
  var senderEmail = settings.email || 'balasistore5@gmail.com';
  var senderPhone = settings.phone || '';
  var senderAddr  = settings.address || '';
  var senderTaxId = settings.taxId || '';

  var lines = [];
  (info.items || []).forEach(function(it, idx){
    var p = (DB.products || []).find(function(x){ return x.id === it.pid; });
    var name = (p && p.name) || it.externalName || it.name || 'מוצר';
    var sku  = (p && p.sku)  || (it.pid ? 'BLS-' + String(it.pid).padStart(4,'0') : '—');
    var unit = (p && p.unit) || it.unit || '';
    var price = (typeof it.price !== 'undefined') ? it.price : ((p && p.price) || 0);
    var qty = it.qty || 0;
    var lineTotal = price * qty;
    lines.push(
      '<tr>'
      + '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">' + (idx+1) + '</td>'
      + '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-size:11px;color:#666">' + esc(sku) + '</td>'
      + '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right"><b>' + esc(name) + '</b>' + (unit ? ' <span style="color:#888;font-size:11px">(' + esc(unit) + ')</span>' : '') + '</td>'
      + '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + qty + '</td>'
      + '<td style="padding:8px;border-bottom:1px solid #eee;text-align:left">₪' + (typeof formatNum === 'function' ? formatNum(price) : price) + '</td>'
      + '<td style="padding:8px;border-bottom:1px solid #eee;text-align:left"><b>₪' + (typeof formatNum === 'function' ? formatNum(lineTotal) : lineTotal) + '</b></td>'
      + '</tr>'
    );
  });
  var itemsTable = lines.length ? lines.join('') : '<tr><td colspan="6" style="padding:14px;text-align:center;color:#888">אין פירוט פריטים</td></tr>';

  var t = info._totals;
  var totalsHtml = '';
  if (t) {
    totalsHtml = ''
      + '<tr><td style="padding:6px 8px;text-align:right;color:#666">סכום ביניים (לפני מע״מ):</td>'
      +     '<td style="padding:6px 8px;text-align:left"><b>₪' + (typeof formatNum === 'function' ? formatNum(t.subtotal + (t.discountAmount || 0)) : t.subtotal) + '</b></td></tr>'
      + (t.discountAmount > 0 ? '<tr><td style="padding:6px 8px;text-align:right;color:#1b5e34">הנחה (' + t.discountPct + '%):</td><td style="padding:6px 8px;text-align:left;color:#1b5e34"><b>−₪' + (typeof formatNum === 'function' ? formatNum(t.discountAmount) : t.discountAmount) + '</b></td></tr>' : '')
      + '<tr><td style="padding:6px 8px;text-align:right;color:#666">מע״מ:</td>'
      +     '<td style="padding:6px 8px;text-align:left"><b>₪' + (typeof formatNum === 'function' ? formatNum(t.vat) : t.vat) + '</b></td></tr>';
  }

  var totalFmt = (typeof formatNum === 'function') ? formatNum(info.totalAmount) : info.totalAmount;
  var plainHtml = plainBody ? esc(plainBody).replace(/\n/g, '<br>') : '';

  return ''
    + '<div dir="rtl" style="font-family:Heebo,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#222;line-height:1.55">'
    +   '<div style="border-bottom:3px solid #1b7a3d;padding-bottom:14px;margin-bottom:18px">'
    +     '<h1 style="margin:0;font-size:22px;color:#1b7a3d">' + esc(senderName) + '</h1>'
    +     (senderAddr || senderPhone || senderEmail || senderTaxId
              ? '<div style="font-size:12px;color:#666;margin-top:4px">'
                + (senderAddr ? esc(senderAddr) + ' · ' : '')
                + (senderPhone ? 'טל׳ ' + esc(senderPhone) + ' · ' : '')
                + esc(senderEmail)
                + (senderTaxId ? ' · ח.פ ' + esc(senderTaxId) : '')
                + '</div>'
              : '')
    +   '</div>'
    +   '<div style="background:#f8f6f0;border-radius:6px;padding:14px 16px;margin-bottom:16px">'
    +     '<div style="font-size:12px;color:#888;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px">' + esc(info.label) + '</div>'
    +     '<div style="font-size:18px;font-weight:700">' + esc(info.numberStr) + '</div>'
    +     '<div style="font-size:13px;color:#555;margin-top:4px">לקוח: <b>' + esc(info.company.name || '—') + '</b></div>'
    +   '</div>'
    +   (plainHtml ? '<div style="margin-bottom:18px;font-size:14px">' + plainHtml + '</div>' : '')
    +   '<h3 style="font-size:14px;color:#1b7a3d;margin:18px 0 8px;border-bottom:1px solid #e0dccd;padding-bottom:6px">פירוט הפריטים</h3>'
    +   '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    +     '<thead><tr style="background:#1b7a3d;color:#fff">'
    +       '<th style="padding:8px;text-align:right">#</th>'
    +       '<th style="padding:8px;text-align:right">מק״ט</th>'
    +       '<th style="padding:8px;text-align:right">פריט</th>'
    +       '<th style="padding:8px;text-align:center">כמות</th>'
    +       '<th style="padding:8px;text-align:left">מחיר</th>'
    +       '<th style="padding:8px;text-align:left">סה״כ</th>'
    +     '</tr></thead><tbody>' + itemsTable + '</tbody>'
    +   '</table>'
    +   '<table style="width:auto;margin-right:auto;margin-top:14px;font-size:13px;border-collapse:collapse">'
    +     totalsHtml
    +     '<tr><td style="padding:10px 12px;text-align:right;background:#1b7a3d;color:#fff;font-weight:700">סה״כ לתשלום:</td>'
    +     '<td style="padding:10px 12px;text-align:left;background:#1b7a3d;color:#fff;font-weight:700;font-size:15px">₪' + totalFmt + '</td></tr>'
    +   '</table>'
    +   '<div style="margin-top:30px;padding-top:14px;border-top:1px solid #eee;font-size:11px;color:#888;text-align:center">'
    +     'נשלח באמצעות מערכת ' + esc(senderName) + ' · ' + esc(senderEmail)
    +   '</div>'
    + '</div>';
}

/* ---- Internal: capture .dn-document → PDF → save ------------------- */
function _generatePdfFromModal(info, onDone, onError) {
  var docEl = document.querySelector('#modalCard .dn-document');
  if (!docEl) {
    if (typeof showToast === 'function') showToast('שגיאה: לא הצלחתי לאתר את המסמך', 'error');
    if (typeof onError === 'function') onError();
    return;
  }
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    if (typeof showToast === 'function') showToast('ספריות PDF לא נטענו', 'error');
    if (typeof onError === 'function') onError();
    return;
  }
  var safeNumber = String(info.numberStr).replace(/[^A-Za-z0-9_\-]/g, '_');
  var filename = info.label.replace(/\s+/g, '_') + '_' + safeNumber + '.pdf';

  html2canvas(docEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    .then(function(canvas){
      try {
        var jsPDFCtor = window.jspdf.jsPDF;
        var pdf = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        var pageWidth  = pdf.internal.pageSize.getWidth();
        var pageHeight = pdf.internal.pageSize.getHeight();
        var imgWidth   = pageWidth - 10;
        var imgHeight  = canvas.height * imgWidth / canvas.width;
        var imgData    = canvas.toDataURL('image/jpeg', 0.92);
        if (imgHeight <= pageHeight - 10) {
          pdf.addImage(imgData, 'JPEG', 5, 5, imgWidth, imgHeight);
        } else {
          var renderedHeight = 0;
          var pageContentHeight = pageHeight - 10;
          while (renderedHeight < imgHeight) {
            pdf.addImage(imgData, 'JPEG', 5, 5 - renderedHeight, imgWidth, imgHeight);
            renderedHeight += pageContentHeight;
            if (renderedHeight < imgHeight) pdf.addPage();
          }
        }
        pdf.save(filename);
        if (typeof onDone === 'function') onDone(filename);
      } catch(err) {
        console.error('PDF gen failed:', err);
        if (typeof showToast === 'function') showToast('שגיאה ביצירת PDF', 'error');
        if (typeof onError === 'function') onError();
      }
    })
    .catch(function(err){
      console.error('html2canvas failed:', err);
      if (typeof showToast === 'function') showToast('שגיאה בצילום המסמך', 'error');
      if (typeof onError === 'function') onError();
    });
}

/* =====================================================================
   ⚙ EmailJS settings — save/load + test
   ===================================================================== */
function saveEmailJSSettings(e) {
  if (e && e.preventDefault) e.preventDefault();
  var sid = (document.getElementById('emailjsServiceId')  || {}).value || '';
  var tid = (document.getElementById('emailjsTemplateId') || {}).value || '';
  var pk  = (document.getElementById('emailjsPublicKey')  || {}).value || '';
  sid = sid.trim(); tid = tid.trim(); pk = pk.trim();

  if (!DB.settings) DB.settings = {};
  DB.settings.emailjs = { serviceId: sid, templateId: tid, publicKey: pk };
  if (typeof DB.save === 'function') DB.save();

  // re-init the EmailJS SDK so future sends use the new key right away
  if (pk && typeof emailjs !== 'undefined' && emailjs && typeof emailjs.init === 'function') {
    try { emailjs.init({ publicKey: pk }); } catch (err) { console.warn(err); }
  }
  _updateEmailJSStatusLabel();
  if (typeof showToast === 'function') {
    showToast(sid && tid && pk ? '✓ הגדרות EmailJS נשמרו' : 'ההגדרות נשמרו (חלקיות)');
  }
}

function loadEmailJSSettings() {
  var ej = (DB.settings || {}).emailjs || {};
  var sidEl = document.getElementById('emailjsServiceId');
  var tidEl = document.getElementById('emailjsTemplateId');
  var pkEl  = document.getElementById('emailjsPublicKey');
  if (sidEl) sidEl.value = ej.serviceId || '';
  if (tidEl) tidEl.value = ej.templateId || '';
  if (pkEl)  pkEl.value  = ej.publicKey || '';
  if (ej.publicKey && typeof emailjs !== 'undefined' && emailjs && typeof emailjs.init === 'function') {
    try { emailjs.init({ publicKey: ej.publicKey }); } catch(e) {}
  }
  _updateEmailJSStatusLabel();
}

function _updateEmailJSStatusLabel() {
  var el = document.getElementById('emailjsStatus');
  if (!el) return;
  var ej = (DB.settings || {}).emailjs || {};
  if (ej.serviceId  && ej.templateId && ej.publicKey) {
    el.textContent = '✓ סטטוס: מוגדר ופעיל';
    el.style.color = '#1b7a3d';
  } else if (ej.serviceId || ej.templateId || ej.publicKey) {
    el.textContent = '⚠ סטטוס: הגדרות חלקיות — חסרים שדות';
    el.style.color = '#d97757';
  } else {
    el.textContent = 'סטטוס: לא מוגדר';
    el.style.color = '#9aa0a6';
  }
}

/* Debounced renderProducts — fires 120ms after the user stops typing.
   Avoids re-rendering the whole products table on every keystroke. */
var _productsSearchDebounceTimer = null;
function debouncedRenderProducts() {
  if (_productsSearchDebounceTimer) clearTimeout(_productsSearchDebounceTimer);
  _productsSearchDebounceTimer = setTimeout(function () {
    _productsSearchDebounceTimer = null;
    if (typeof renderProducts === 'function') renderProducts();
  }, 120);
}
