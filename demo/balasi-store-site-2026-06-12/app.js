/* =========================================================
   בלסי סטור — Office Food Supply
   Professional E-commerce Logic
   ========================================================= */

/* Accessibility toolbar lives in a11y.js (loaded separately on every page) */

/* ============================================================
   PROMOTIONS — public-site logic (read-only mirror of admin DB)
   ============================================================
   The admin panel writes its promotions into localStorage under
   `balasi_promotions`. The catalog reads from there to compute
   discounted prices, badges, and the cart-level discount line.
   ============================================================ */

/* One-time migration (2026-05-18): retire the legacy "5% over ₪800"
   order-threshold promo so it doesn't stack with the new "first order
   5%" discount. We set active:false (rather than deleting) so admin
   can revive it later if business needs change. Guarded by a flag so
   it only runs once per browser. */
(function retireOrderThresholdPromoOnce() {
  try {
    if (localStorage.getItem('balasi_retired_order_threshold_v1') === '1') return;
    const list = JSON.parse(localStorage.getItem('balasi_promotions') || '[]');
    if (!Array.isArray(list) || !list.length) {
      localStorage.setItem('balasi_retired_order_threshold_v1', '1');
      return;
    }
    let changed = false;
    list.forEach(p => {
      if (p && p.type === 'order' && p.active === true) {
        p.active = false;
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('balasi_promotions', JSON.stringify(list));
    }
    localStorage.setItem('balasi_retired_order_threshold_v1', '1');
  } catch (e) { /* migration is best-effort */ }
})();

/* One-time migration (2026-05-19): fix monthly-deal endDates that were
   set off-by-one due to a timezone bug. Earlier code computed the end
   of month with toISOString(), which in Israel (UTC+2/+3) shifts the
   local 31st back to UTC 30th, so the stored endDate ended on "30"
   instead of "31" (similarly 29/30 for shorter months). We only bump
   endDates that match exactly that pattern — custom dates the admin
   set deliberately are not touched. */
(function fixMonthlyDealEomOnce() {
  try {
    if (localStorage.getItem('balasi_fixed_monthlydeal_eom_v1') === '1') return;
    const list = JSON.parse(localStorage.getItem('balasi_promotions') || '[]');
    if (!Array.isArray(list) || !list.length) {
      localStorage.setItem('balasi_fixed_monthlydeal_eom_v1', '1');
      return;
    }
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    let changed = false;
    list.forEach(p => {
      if (!p || p.monthlyDeal !== true || !p.endDate) return;
      const m = String(p.endDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return;
      const [_, yStr, moStr, dStr] = m;
      const year  = Number(yStr);
      const month = Number(moStr);    // 1-12
      const day   = Number(dStr);
      // Actual last-day-of-month for this year/month, in local time.
      const actualEom = new Date(year, month, 0);
      const actualDay = actualEom.getDate();
      // Only fix the exact off-by-one bug — leave any other date alone.
      if (day === actualDay - 1) {
        p.endDate = fmt(new Date(year, month - 1, actualDay));
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem('balasi_promotions', JSON.stringify(list));
    }
    localStorage.setItem('balasi_fixed_monthlydeal_eom_v1', '1');
  } catch (e) { /* migration is best-effort */ }
})();

function getSitePromotions() {
  try {
    const list = JSON.parse(localStorage.getItem('balasi_promotions') || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}

function isSitePromoActive(p) {
  if (!p || !p.active) return false;
  // Use local-date (not toISOString) so that around midnight in Israel
  // we don't flip to "yesterday" because of the UTC offset.
  const today = (typeof _formatLocalDate === 'function')
    ? _formatLocalDate(new Date())
    : new Date().toISOString().split('T')[0];
  if (p.startDate && today < p.startDate) return false;
  if (p.endDate && today > p.endDate) return false;
  if (p.type === 'coupon' && p.usageLimit && (p.usageCount || 0) >= p.usageLimit) return false;
  return true;
}

function siteComputeDiscount(price, promo) {
  if (!promo || !price) return 0;
  if (promo.discountType === 'percent') {
    return Math.round(price * (Number(promo.discountValue) / 100) * 100) / 100;
  }
  if (promo.discountType === 'amount') {
    return Math.min(price, Number(promo.discountValue));
  }
  return 0;
}

/* Best automatic promotion that applies to a single product (NOT coupons,
   NOT order-level — those are applied at cart time). */
function getSiteProductPromo(product) {
  if (!product) return null;
  const candidates = getSitePromotions()
    .filter(p => p.type === 'product' || p.type === 'category')
    .filter(p => isSitePromoActive(p))
    .filter(p => {
      if (p.type === 'product')  return p.target?.productId === product.id;
      if (p.type === 'category') return p.target?.categoryId === product.cat;
      return false;
    });
  if (!candidates.length) return null;
  let best = null, bestVal = 0;
  candidates.forEach(p => {
    const d = siteComputeDiscount(product.price, p);
    if (d > bestVal) { best = p; bestVal = d; }
  });
  if (!best) return null;
  return {
    promo: best,
    originalPrice: product.price,
    discount: bestVal,
    finalPrice: Math.round((product.price - bestVal) * 100) / 100
  };
}

/* The price that should actually be charged for this product right now */
function getEffectivePrice(product) {
  const promo = getSiteProductPromo(product);
  return promo ? promo.finalPrice : (product?.price || 0);
}

/* Validate a coupon code typed at checkout */
function siteValidateCoupon(code) {
  if (!code) return null;
  const norm = String(code).trim().toUpperCase();
  return getSitePromotions().find(p =>
    p.type === 'coupon' &&
    isSitePromoActive(p) &&
    String(p.couponCode || '').toUpperCase() === norm
  ) || null;
}

/* Find the highest-value order-threshold promotion that applies to a subtotal */
function siteGetOrderPromo(subtotal) {
  return getSitePromotions()
    .filter(p => p.type === 'order')
    .filter(p => isSitePromoActive(p))
    .filter(p => subtotal >= (p.minOrderAmount || 0))
    .sort((a, b) => siteComputeDiscount(subtotal, b) - siteComputeDiscount(subtotal, a))[0]
    || null;
}

/* ============================================================
   FIRST-ORDER DISCOUNT — 5% off the very first order
   ============================================================
   Business rule (decided 2026-05-18):
   • New customer = no prior NON-CANCELLED order anywhere in the
     system with the same email OR customerNumber OR taxId.
   • Cancelled orders do not count — customer can re-qualify after
     a cancellation.
   • Discount value: 5% off the subtotal that remains after product
     and bundle discounts (subtotalAfter other order-level promos).
   • Discount does NOT stack with the legacy "5% over ₪800" promo
     (that promo was retired — see migration above).
   ============================================================ */

const FIRST_ORDER_DISCOUNT_PCT = 5;

/* Read every order record we have anywhere on this device.
   Returns a flat array of raw order objects (different shapes — we
   only care whether SOME identifying field matches our customer). */
function siteCollectAllOrders() {
  const buckets = [
    'balasi_pending_orders',  // site → admin queue (not yet processed)
    'admin_orders',           // admin's main DB (after acceptance)
    'balasi_customer_orders'  // per-customer history mirror
  ];
  const out = [];
  buckets.forEach(key => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      if (!raw) return;
      // balasi_customer_orders is { email: [order, order, …] }, others are arrays
      if (Array.isArray(raw)) {
        raw.forEach(o => { if (o) out.push(o); });
      } else if (typeof raw === 'object') {
        Object.values(raw).forEach(list => {
          if (Array.isArray(list)) list.forEach(o => { if (o) out.push(o); });
        });
      }
    } catch (e) { /* skip malformed bucket */ }
  });
  return out;
}

/* True if this order is cancelled (in any of the possible status spellings) */
function siteOrderIsCancelled(o) {
  const s = String(o?.status || '').toLowerCase();
  return s === 'cancelled' || s === 'canceled' || s === 'בוטל' || s === 'מבוטל';
}

/* Extract the identifying fields from a single order record.
   Different code paths produce different shapes, so we look in
   multiple places. */
function siteOrderIdentity(o) {
  if (!o) return { email: '', customerNumber: '', taxId: '' };
  const customer = o.customer || {};
  const email =
    (o.email || customer.email || o.contactEmail || '').toString().trim().toLowerCase();
  const customerNumber =
    (o.customerNumber || customer.customerNumber || '').toString().trim();
  const taxId =
    (o.taxId || customer.taxId || '').toString().trim();
  return { email, customerNumber, taxId };
}

/* Is this customer placing their first non-cancelled order?
   `customer` = { email, customerNumber, taxId } — any/all may be empty.
   Returns false if we have no identifying info at all (we can't claim
   "first order" without at least one identifier to check against). */
function siteIsFirstOrderCustomer(customer) {
  const email = (customer?.email || '').toString().trim().toLowerCase();
  const customerNumber = (customer?.customerNumber || '').toString().trim();
  const taxId = (customer?.taxId || '').toString().trim();
  if (!email && !customerNumber && !taxId) return false;

  const all = siteCollectAllOrders();
  for (const o of all) {
    if (siteOrderIsCancelled(o)) continue;
    const id = siteOrderIdentity(o);
    if (email          && id.email          && id.email          === email)          return false;
    if (customerNumber && id.customerNumber && id.customerNumber === customerNumber) return false;
    if (taxId          && id.taxId          && id.taxId          === taxId)          return false;
  }
  return true;
}

/* ============================================================
   BUNDLE PROMOTIONS (Buy-N) — public site logic
   ============================================================
   For every active bundle, scan the cart, find all items whose
   product IDs are in the bundle's eligible list, and figure out
   how many bundles can be formed.

   The customer always gets the BEST deal: we sort eligible units
   in the cart by price descending, take the most expensive N×k
   units, and replace their normal total with the bundle price ×
   the number of bundles formed (k).

   Returns an array of:
   { promo, bundles: k, savings, baseTotal, discountedTotal,
     consumedUnits: [{pid, qty, price, savedPerUnit}] }
   ============================================================ */
function siteCalcBundleDiscounts(rawCartItems) {
  // rawCartItems = [{ id, qty, price, ... }] using ORIGINAL prices
  if (!rawCartItems || !rawCartItems.length) return [];
  const bundles = getSitePromotions()
    .filter(p => p.type === 'bundle')
    .filter(p => isSitePromoActive(p));
  if (!bundles.length) return [];

  // For each bundle, expand cart to per-unit list, filter to eligible products,
  // sort by price desc, and group by minQty.
  return bundles.map(b => {
    const eligibleIds = new Set(b.target?.productIds || []);
    const minQty      = Number(b.bundleMinQty) || 0;
    const bundlePrice = Number(b.bundlePrice)  || 0;
    if (!minQty || eligibleIds.size === 0) return null;

    // Expand each cart line into N individual units (so we can pick the most
    // expensive ones to bundle) — but cap to a sensible amount to avoid huge loops
    const units = [];
    rawCartItems.forEach(it => {
      if (!eligibleIds.has(it.id)) return;
      const unitPrice = (typeof it.originalPrice === 'number') ? it.originalPrice : it.price;
      const qty = Math.min(it.qty || 0, 200);
      for (let i = 0; i < qty; i++) units.push({ pid: it.id, price: unitPrice });
    });
    if (units.length < minQty) return null;
    units.sort((a, b) => b.price - a.price);

    const k = Math.floor(units.length / minQty);
    if (k === 0) return null;
    const consumed = units.slice(0, k * minQty);
    const baseTotal = consumed.reduce((s, u) => s + u.price, 0);
    const discountedTotal = k * bundlePrice;
    const savings = Math.round((baseTotal - discountedTotal) * 100) / 100;
    if (savings <= 0) return null; // bundle costs more than retail — skip

    // Group consumed units back by pid for cart display
    const consumedByPid = {};
    consumed.forEach(u => {
      if (!consumedByPid[u.pid]) consumedByPid[u.pid] = { pid: u.pid, qty: 0, totalOriginal: 0 };
      consumedByPid[u.pid].qty += 1;
      consumedByPid[u.pid].totalOriginal += u.price;
    });

    return {
      promo: b,
      bundles: k,
      savings,
      baseTotal,
      discountedTotal,
      consumedUnits: Object.values(consumedByPid)
    };
  }).filter(Boolean);
}

/* Build a friendly badge string for a product promotion (e.g., "20% הנחה") */
function getProductPromoBadge(product) {
  const info = getSiteProductPromo(product);
  if (!info) return '';
  const p = info.promo;
  if (p.discountType === 'percent') return `${p.discountValue}% הנחה`;
  return `הנחה ₪${p.discountValue}`;
}

/* Returns the active BUNDLE promotion that includes this product, if any.
   Used on product cards to show a bundle hint like "4 ב-₪80". */
function getProductBundlePromo(product) {
  if (!product) return null;
  return getSitePromotions()
    .filter(p => p.type === 'bundle')
    .filter(p => isSitePromoActive(p))
    .find(p => Array.isArray(p.target?.productIds) && p.target.productIds.includes(product.id))
    || null;
}

/* Refresh the catalog when promotions change (e.g., admin edits in another tab) */
window.addEventListener('storage', e => {
  if (e.key === 'balasi_promotions' && typeof renderProducts === 'function') {
    renderProducts();
    if (typeof renderCart === 'function') renderCart();
  }
});

/* ---------- LEGAL DOCUMENT VERSIONING ----------
   Bump these dates whenever terms.html or privacy.html are amended.
   The consent log records which version each customer agreed to,
   so we can prove exactly what they accepted years from now. */
const TERMS_VERSION   = '2026-05-07';
const PRIVACY_VERSION = '2026-05-07';
/* The verbatim text shown next to the consent checkbox — stored on every
   accepted consent so the legal record is self-contained even if the page
   text later changes. */
const CONSENT_TEXT = 'אני מאשר/ת את תנאי השימוש ומדיניות הפרטיות של בלסי סטור בע״מ';

/* ---------- CATEGORIES ---------- */
const DEFAULT_CATEGORIES = [
  { id:'all',       name:'הכל',            icon:'🛍️', desc:'כל הקטלוג' },
  { id:'coffee',    name:'שתייה חמה',      icon:'☕', desc:'קפה, תה, קפסולות' },
  { id:'drinks',    name:'שתייה קרה',      icon:'💧', desc:'מים, מיצים, משקאות' },
  { id:'snacks',    name:'חטיפים מליחים',  icon:'🥨', desc:'במבה, ביסלי, אגוזים' },
  { id:'sweets',    name:'חטיפים מתוקים',  icon:'🍫', desc:'שוקולדים, סוכריות' },
  { id:'bakery',    name:'מאפים טריים',    icon:'🥐', desc:'רוגלך, עוגיות, קרואסון' },
  { id:'dairy',     name:'חלב וגבינות',    icon:'🥛', desc:'יוגורט, גבינות, חלב' },
  { id:'fruits',    name:'פירות וירקות',   icon:'🍎', desc:'סלי פירות טריים' },
  { id:'meals',     name:'ארוחות וכריכים', icon:'🥗', desc:'סלטים, סנדוויצ\'ים' },
  { id:'healthy',   name:'בריאות וטבעוני', icon:'🌱', desc:'טבעוני, ללא לקטוז' },
  { id:'disposable',name:'כלים חד-פעמיים', icon:'🥄', desc:'צלחות, כוסות, מפיות' },
  { id:'cleaning',  name:'ניקיון והיגיינה', icon:'🧼', desc:'נייר, סבון, מגבונים' },
];

/* ---------- SUBCATEGORIES (תתי-קטגוריות) ----------
   Map of categoryId -> [{ id, name, icon }]. Each subcategory is scoped to its
   parent category. The admin panel may override this via localStorage. */
const DEFAULT_SUBCATEGORIES = {
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

let SUBCATEGORIES = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('balasi_subcategories') || 'null');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) return stored;
  } catch (e) {}
  return DEFAULT_SUBCATEGORIES;
})();

function getSubcategoriesFor(catId) {
  if (!catId || catId === 'all') return [];
  return Array.isArray(SUBCATEGORIES[catId]) ? SUBCATEGORIES[catId] : [];
}
function findSubcategory(catId, subId) {
  return getSubcategoriesFor(catId).find(s => s.id === subId) || null;
}

window.addEventListener('storage', e => {
  if (e.key !== 'balasi_subcategories') return;
  try {
    const stored = JSON.parse(e.newValue || 'null');
    SUBCATEGORIES = (stored && typeof stored === 'object' && !Array.isArray(stored))
      ? stored : DEFAULT_SUBCATEGORIES;
    if (typeof renderSubcatStrip === 'function') renderSubcatStrip();
    if (typeof renderProducts === 'function') renderProducts();
  } catch (err) {}
});

/* Static map of product-id -> default subcategory-id. Applied at load via
   the DOMContentLoaded handler. Admin overrides in `balasi_product_subcats`
   take precedence — see productSubcat() below. */
const DEFAULT_PRODUCT_SUBCAT_BY_ID = {
  1:'capsules',2:'beans',3:'beans',4:'tea',5:'tea',6:'milk',8:'sugar',
  10:'water',11:'water',12:'soda',13:'juice',14:'juice',15:'icetea',16:'energy',17:'sparkling',
  20:'crisps',21:'crackers',22:'crisps',23:'nuts',24:'nuts',25:'granola',26:'crackers',28:'granola',
  30:'chocolate',31:'chocolate',32:'chocolate',33:'candies',34:'candies',35:'wafers',
  40:'rolls',41:'pastries',42:'pastries',43:'pastries',44:'pastries',45:'pastries',46:'breads',
  50:'milk',51:'milk',52:'yogurt',53:'cheese',54:'cheese',55:'butter',
  60:'baskets',61:'baskets',62:'whole',63:'whole',64:'whole',65:'whole',66:'dried',67:'vegetables',68:'vegetables',
  70:'salads',71:'salads',72:'sandwiches',73:'sandwiches',74:'hot',75:'wraps',
  80:'vegan',81:'vegan',82:'vegan',84:'protein',85:'vegan',
  90:'cups',91:'cups',92:'plates',93:'napkins',94:'cutlery',95:'cutlery',96:'paper',
  100:'soap',101:'wipes',102:'paper',103:'detergent',104:'detergent',105:'bags',106:'detergent',
};

/* CATEGORIES is now mutable — read from admin via localStorage if available */
let CATEGORIES = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem('balasi_categories') || 'null');
    if (Array.isArray(stored) && stored.length) {
      return [{ id:'all', name:'הכל', icon:'🛍️', desc:'כל הקטלוג' }, ...stored];
    }
  } catch (e) {}
  return DEFAULT_CATEGORIES;
})();

/* Refresh categories when the admin updates them in another tab */
window.addEventListener('storage', e => {
  if (e.key !== 'balasi_categories') return;
  try {
    const stored = JSON.parse(e.newValue || 'null');
    if (Array.isArray(stored) && stored.length) {
      CATEGORIES = [{ id:'all', name:'הכל', icon:'🛍️', desc:'כל הקטלוג' }, ...stored];
      if (typeof renderSideCats === 'function') renderSideCats();
      if (typeof renderSubcatStrip === 'function') renderSubcatStrip();
      if (typeof renderProducts === 'function') renderProducts();
    }
  } catch (err) {}
});

/* ---------- CITIES & MIN ORDER ---------- */
const SPECIAL_MIN_CITIES = ['רמת השרון', 'הוד השרון'];
const SPECIAL_MIN_AMOUNT = 650;
const REGULAR_MIN_AMOUNT = 500;

/* ---------- VAT ---------- */
const VAT_RATE = 0.18;
/* Categories where products are VAT-exempt by default (Israeli law: fresh produce) */
const VAT_EXEMPT_CATEGORIES = ['fruits'];

function isVatExempt(product) {
  if (!product) return false;
  if (typeof product.vatExempt === 'boolean') return product.vatExempt;
  return VAT_EXEMPT_CATEGORIES.includes(product.cat);
}

/* ---------- PRODUCTS ---------- */
const PRODUCTS = [
  // קפה ותה
  { id:1, name:'קפסולות נספרסו אסקפסו', cat:'coffee', brand:'נספרסו', icon:'☕', price:84, unit:'10 קפסולות', desc:'קפסולות תואמות נספרסו, רוסט בינוני', tag:'נמכר', popular:9 },
  { id:2, name:'קפה טורקי אליטה', cat:'coffee', brand:'עלית', icon:'☕', price:32, unit:'200 גרם', desc:'קפה שחור איכותי לשתייה חמה', popular:7 },
  { id:3, name:'קפה לנדוור פולים שלמים', cat:'coffee', brand:'לנדוור', icon:'☕', price:78, unit:'1 ק"ג', desc:'תערובת ערביקה מתוקה ועדינה', tag:'חדש', popular:8 },
  { id:4, name:'תה ירוק ויסוצקי', cat:'coffee', brand:'ויסוצקי', icon:'🍵', price:24, unit:'25 שקיות', desc:'תה ירוק קלאסי ומרענן', popular:6 },
  { id:5, name:'תה צמחים נענע ויסוצקי', cat:'coffee', brand:'ויסוצקי', icon:'🍵', price:22, unit:'25 שקיות', desc:'תה נענע מרענן ללא קפאין', popular:5 },
  { id:6, name:'מקציפת חלב נסטלה', cat:'coffee', brand:'נסטלה', icon:'🥛', price:38, unit:'500 מ"ל', desc:'אבקת חלב להקצפה במכונת קפה', popular:4 },
  { id:8, name:'סוכרזית כפיות חד-פעמיות', cat:'coffee', brand:'סוכרזית', icon:'🥄', price:12, unit:'200 יח׳', desc:'מנות אישיות לסוכרזית', popular:5 },

  // משקאות
  { id:10, name:'מים מינרליים נביעות 1.5 ליטר', cat:'drinks', brand:'נביעות', icon:'💧', price:22, unit:'מארז 6', desc:'מים מינרליים טבעיים', popular:9 },
  { id:11, name:'מים מינרליים נביעות 0.5 ליטר', cat:'drinks', brand:'נביעות', icon:'💧', price:28, unit:'מארז 24', desc:'מים אישיים לפגישות', tag:'נמכר', popular:9 },
  { id:12, name:'קוקה קולה זירו', cat:'drinks', brand:'קוקה קולה', icon:'🥤', price:42, unit:'מארז 6×1.5L', desc:'קולה ללא סוכר', popular:8 },
  { id:13, name:'מיץ תפוזים פרימור', cat:'drinks', brand:'פרימור', icon:'🍊', price:14, unit:'1 ליטר', desc:'מיץ תפוזים סחוט קר', popular:6 },
  { id:14, name:'מיץ תפוחים פרי-זה', cat:'drinks', brand:'פרי-זה', icon:'🍎', price:16, unit:'1 ליטר', desc:'מיץ תפוחים 100% טבעי', popular:5 },
  { id:15, name:'תה קר ויסוצקי לימון', cat:'drinks', brand:'ויסוצקי', icon:'🍋', price:9, unit:'500 מ"ל', desc:'תה קר מרענן בטעם לימון', popular:6 },
  { id:16, name:'משקה אנרגיה רד בול', cat:'drinks', brand:'רד בול', icon:'⚡', price:11, unit:'250 מ"ל', desc:'משקה אנרגיה לזריזות', popular:7 },
  { id:17, name:'מי סודה זוויה', cat:'drinks', brand:'זוויה', icon:'🥂', price:24, unit:'מארז 6', desc:'סודה לשתייה ולקוקטיילים', popular:4 },

  // חטיפים
  { id:20, name:'במבה אסם', cat:'snacks', brand:'אסם', icon:'🥜', price:6, unit:'80 גרם', desc:'חטיף בוטנים אהוב', tag:'נמכר', popular:10 },
  { id:21, name:'ביסלי גריל אסם', cat:'snacks', brand:'אסם', icon:'🥨', price:5, unit:'70 גרם', desc:'חטיף חיטה בטעם גריל', popular:9 },
  { id:22, name:'דוריטוס גבינה', cat:'snacks', brand:'דוריטוס', icon:'🌽', price:8, unit:'90 גרם', desc:'חטיפי תירס בטעם גבינה', popular:8 },
  { id:23, name:'אגוזי קשיו קלויים', cat:'snacks', brand:'נטורל', icon:'🥜', price:42, unit:'250 גרם', desc:'קשיו קלוי טבעי, ללא מלח', popular:7 },
  { id:24, name:'שקדים קלויים מומלחים', cat:'snacks', brand:'נטורל', icon:'🥜', price:38, unit:'250 גרם', desc:'שקדים קלויים בקלייה עדינה', popular:7 },
  { id:25, name:'גרנולה אנרגיה דובדבן', cat:'snacks', brand:'בייגל בייגל', icon:'🌾', price:32, unit:'500 גרם', desc:'גרנולה ביתית עם דובדבן', popular:6 },
  { id:26, name:'חטיף חמוצים מטעמי הגליל', cat:'snacks', brand:'הגליל', icon:'🥒', price:18, unit:'4 יחידות', desc:'מלפפונים חמוצים עדינים', popular:4 },
  { id:28, name:'חטיף חלבון נטורל בר', cat:'snacks', brand:'נטורל בר', icon:'💪', price:9, unit:'יחידה 50 גרם', desc:'חטיף חלבון 20 גרם', popular:6 },

  // מתוקים
  { id:30, name:'שוקולד עלית מריר 70%', cat:'sweets', brand:'עלית', icon:'🍫', price:14, unit:'100 גרם', desc:'שוקולד מריר איכותי', popular:8 },
  { id:31, name:'שוקולד פרה עלית', cat:'sweets', brand:'עלית', icon:'🍫', price:11, unit:'100 גרם', desc:'שוקולד חלב קלאסי', popular:9 },
  { id:32, name:'שוקולד קינדר בואנו', cat:'sweets', brand:'קינדר', icon:'🍫', price:8, unit:'יחידה', desc:'שוקולד עם מילוי קרם אגוזים', popular:8 },
  { id:33, name:'סוכריות מנטוס תות', cat:'sweets', brand:'מנטוס', icon:'🍬', price:5, unit:'גליל', desc:'סוכריות מנטוס ארוזות', popular:5 },
  { id:34, name:'מאסטיק טופי כריות', cat:'sweets', brand:'עלית', icon:'🍬', price:4, unit:'גליל', desc:'מסטיקים בטעמים שונים', popular:4 },
  { id:35, name:'במבה ממולאת שוקולד', cat:'sweets', brand:'אסם', icon:'🍫', price:8, unit:'80 גרם', desc:'במבה עם מילוי שוקולד', tag:'חדש', popular:7 },

  // מאפים
  { id:40, name:'רוגלך שוקולד אנגל', cat:'bakery', brand:'אנגל', icon:'🥐', price:38, unit:'500 גרם', desc:'רוגלך טריים ביתיים', popular:9 },
  { id:41, name:'קרואסון חמאה', cat:'bakery', brand:'אנגל', icon:'🥐', price:8, unit:'יחידה', desc:'קרואסון חמאה צרפתי', popular:8 },
  { id:42, name:'עוגיות שוקולד צ\'יפס ביתיות', cat:'bakery', brand:'בלסי', icon:'🍪', price:42, unit:'500 גרם', desc:'עוגיות חמאה עם שוקולד', popular:8 },
  { id:43, name:'עוגיות שיבולת שועל', cat:'bakery', brand:'בלסי', icon:'🍪', price:36, unit:'400 גרם', desc:'עוגיות בריאות עם דבש', popular:6 },
  { id:44, name:'מאפה גבינה מלוח', cat:'bakery', brand:'אנגל', icon:'🥧', price:14, unit:'יחידה', desc:'מאפה גבינה בולגרית', popular:7 },
  { id:45, name:'בורקס תפוחי אדמה', cat:'bakery', brand:'אנגל', icon:'🥟', price:10, unit:'יחידה', desc:'בורקס מתפוחי אדמה', popular:7 },
  { id:46, name:'לחמניות קמח מלא', cat:'bakery', brand:'אנגל', icon:'🍞', price:28, unit:'מארז 8', desc:'לחמניות בריאות וטריות', popular:5 },

  // מוצרי חלב
  { id:50, name:'חלב תנובה 3% שומן', cat:'dairy', brand:'תנובה', icon:'🥛', price:8, unit:'1 ליטר', desc:'חלב טרי בקרטון', popular:9 },
  { id:51, name:'חלב סויה אלפרו', cat:'dairy', brand:'אלפרו', icon:'🥛', price:14, unit:'1 ליטר', desc:'חלב סויה ללא לקטוז', popular:6 },
  { id:52, name:'יוגורט יווני יופלה', cat:'dairy', brand:'יופלה', icon:'🥄', price:7, unit:'150 גרם', desc:'יוגורט יווני סמיך', popular:7 },
  { id:53, name:'גבינת קוטג\' תנובה 5%', cat:'dairy', brand:'תנובה', icon:'🧀', price:8, unit:'250 גרם', desc:'גבינת קוטג\' רזה', popular:8 },
  { id:54, name:'גבינה צהובה עמק פרוסה', cat:'dairy', brand:'תנובה', icon:'🧀', price:24, unit:'200 גרם', desc:'גבינה צהובה איכותית פרוסה', popular:8 },
  { id:55, name:'חמאה נטולת מלח', cat:'dairy', brand:'תנובה', icon:'🧈', price:18, unit:'200 גרם', desc:'חמאה ישראלית טרייה', popular:6 },

  // פירות
  { id:60, name:'סל פירות טרי משרדי', cat:'fruits', brand:'בלסי', icon:'🍎', price:120, unit:'2 ק"ג מעורב', desc:'תפוחים, בננות, תפוזים, ענבים', tag:'נמכר', popular:9 },
  { id:61, name:'סל פרימיום אקזוטי', cat:'fruits', brand:'בלסי', icon:'🥭', price:240, unit:'3 ק"ג מעורב', desc:'מנגו, פפאיה, אננס ועוד', popular:7 },
  { id:62, name:'תפוחים אדומים', cat:'fruits', brand:'טרי', icon:'🍎', price:18, unit:'ק"ג', desc:'תפוחים פריכים ומתוקים', popular:8 },
  { id:63, name:'בננות', cat:'fruits', brand:'טרי', icon:'🍌', price:11, unit:'ק"ג', desc:'בננות בשלות וטריות', popular:9 },
  { id:64, name:'תפוזים מוסקה', cat:'fruits', brand:'טרי', icon:'🍊', price:12, unit:'ק"ג', desc:'תפוזים עסיסיים', popular:7 },
  { id:65, name:'ענבים ירוקים', cat:'fruits', brand:'טרי', icon:'🍇', price:24, unit:'ק"ג', desc:'ענבים ללא חרצנים', popular:6 },
  { id:66, name:'תמרים מג\'הול', cat:'fruits', brand:'טרי', icon:'🌴', price:48, unit:'500 גרם', desc:'תמרים מג\'הול גדולים וטריים — פטור ממע״מ', popular:6 },
  { id:67, name:'עגבניות שרי', cat:'fruits', brand:'טרי', icon:'🍅', price:14, unit:'500 גרם', desc:'עגבניות שרי טריות', popular:7 },
  { id:68, name:'מלפפונים', cat:'fruits', brand:'טרי', icon:'🥒', price:9, unit:'ק"ג', desc:'מלפפונים פריכים', popular:6 },

  // ארוחות מוכנות
  { id:70, name:'סלט קיסר עם עוף', cat:'meals', brand:'בלסי', icon:'🥗', price:42, unit:'אישי', desc:'סלט עוף קלאסי עם רוטב קיסר', popular:8 },
  { id:71, name:'סלט קינואה ים-תיכוני', cat:'meals', brand:'בלסי', icon:'🥗', price:38, unit:'אישי', desc:'קינואה, ירקות ועלים ירוקים', popular:7 },
  { id:72, name:'סנדוויץ\' טונה ובצל', cat:'meals', brand:'בלסי', icon:'🥪', price:28, unit:'יחידה', desc:'סנדוויץ\' בלחם מקמח מלא', popular:7 },
  { id:73, name:'סנדוויץ\' חביתה ועגבניה', cat:'meals', brand:'בלסי', icon:'🥪', price:24, unit:'יחידה', desc:'חביתה טרייה בלחם בריא', popular:6 },
  { id:74, name:'פסטה ברוטב עגבניות', cat:'meals', brand:'בלסי', icon:'🍝', price:32, unit:'אישי', desc:'פסטה איטלקית קלאסית', popular:6 },
  { id:75, name:'מגש סושי לפגישות', cat:'meals', brand:'בלסי', icon:'🍣', price:180, unit:'24 חתיכות', desc:'מגש סושי מעורב טרי', tag:'חדש', popular:5 },

  // בריאות וטבעוני
  { id:80, name:'חטיף בריאות אגוזים ופירות', cat:'healthy', brand:'נטורל', icon:'🌿', price:9, unit:'40 גרם', desc:'חטיף טבעוני ללא סוכר', popular:6 },
  { id:81, name:'מים בטעם מלפפון ולימון', cat:'healthy', brand:'נביעות', icon:'🥒', price:12, unit:'500 מ"ל', desc:'מים מועשרים ללא קלוריות', popular:5 },
  { id:82, name:'יוגורט קוקוס טבעוני', cat:'healthy', brand:'אלפרו', icon:'🥥', price:14, unit:'150 גרם', desc:'יוגורט מחלב קוקוס', popular:5 },
  { id:84, name:'אבקת חלבון צמחי וניל', cat:'healthy', brand:'נטורל', icon:'💪', price:140, unit:'1 ק"ג', desc:'חלבון אפונה טבעוני', popular:4 },
  { id:85, name:'ירקות חתוכים וטריים', cat:'healthy', brand:'בלסי', icon:'🥕', price:24, unit:'500 גרם', desc:'גזר, סלרי, מלפפון', popular:6 },

  // כלים חד-פעמיים
  { id:90, name:'כוסות פלסטיק 200 מ"ל', cat:'disposable', brand:'פלסטו', icon:'🥤', price:18, unit:'מארז 100', desc:'כוסות שתייה קרה', popular:9 },
  { id:91, name:'כוסות חמות עם מכסה', cat:'disposable', brand:'פלסטו', icon:'☕', price:32, unit:'מארז 50', desc:'כוסות קרטון לקפה חם', popular:8 },
  { id:92, name:'צלחות חד-פעמיות 23 ס"מ', cat:'disposable', brand:'פלסטו', icon:'🍽️', price:24, unit:'מארז 50', desc:'צלחות קרטון איכותיות', popular:8 },
  { id:93, name:'מפיות נייר 33×33', cat:'disposable', brand:'לילי', icon:'📜', price:14, unit:'מארז 100', desc:'מפיות לבנות איכותיות', popular:8 },
  { id:94, name:'סכו"ם חד-פעמי כסף', cat:'disposable', brand:'פלסטו', icon:'🥄', price:22, unit:'מארז 50', desc:'סכין, מזלג, כפית', popular:7 },
  { id:95, name:'קשיות נייר ידידותיות', cat:'disposable', brand:'אקו', icon:'🥤', price:16, unit:'מארז 100', desc:'קשיות מתכלות לסביבה', popular:5 },
  { id:96, name:'מגבות נייר תעשייתיות', cat:'disposable', brand:'לילי', icon:'🧻', price:38, unit:'12 גלילים', desc:'מגבות לניגוב מטבח', popular:7 },

  // ניקיון
  { id:100, name:'סבון ידיים נוזלי 1 ליטר', cat:'cleaning', brand:'סנו', icon:'🧴', price:24, unit:'בקבוק', desc:'סבון ידיים אנטיבקטריאלי', popular:8 },
  { id:101, name:'מגבונים מחטאים 100 יח\'', cat:'cleaning', brand:'סנו', icon:'🧽', price:18, unit:'מיכל', desc:'מגבונים אלכוהוליים', popular:8 },
  { id:102, name:'נייר טואלט פרימיום 24 גלילים', cat:'cleaning', brand:'לילי', icon:'🧻', price:48, unit:'מארז', desc:'נייר טואלט 3 שכבות', tag:'נמכר', popular:9 },
  { id:103, name:'נוזל לכלים פיירי', cat:'cleaning', brand:'פיירי', icon:'🧼', price:18, unit:'750 מ"ל', desc:'מסיר שומנים ביעילות', popular:7 },
  { id:104, name:'אקונומיקה כלורית 4L', cat:'cleaning', brand:'סנו', icon:'🧴', price:24, unit:'4 ליטר', desc:'מחטא רב-תכליתי', popular:5 },
  { id:105, name:'שקיות זבל 60 ליטר', cat:'cleaning', brand:'סנו', icon:'🗑️', price:16, unit:'מארז 50', desc:'שקיות זבל חזקות', popular:7 },
  { id:106, name:'ספריי לניקוי משטחים', cat:'cleaning', brand:'סנו', icon:'💨', price:22, unit:'750 מ"ל', desc:'מנקה רב-משטחים מבושם', popular:6 },
];

/* ---------- STATE ---------- */
let state = {
  filter: 'all',
  subcat: 'all',          // active sub-category (within the current category)
  brand: 'all',
  search: '',
  sort: 'alpha',
  cart: {},
  favorites: [],
  recentlyViewed: [],
  diet: [], // active dietary filters
  selectedCity: '',
  view: 'grid',
  user: null, // logged-in customer
  recurringOrder: null, // { active, items, setupAt, nextDelivery, total }
};

/* ---------- PRODUCT SUBCATEGORY OVERRIDES (admin-managed) ---------- */
let _productSubcatCache = null;
function getProductSubcatOverrides() {
  if (_productSubcatCache) return _productSubcatCache;
  try { _productSubcatCache = JSON.parse(localStorage.getItem('balasi_product_subcats') || '{}') || {}; }
  catch (e) { _productSubcatCache = {}; }
  return _productSubcatCache;
}
function clearProductSubcatCache() { _productSubcatCache = null; }
/* Resolve a product's effective subcategory id: admin override → static field → default map */
function productSubcat(p) {
  if (!p) return null;
  const overrides = getProductSubcatOverrides();
  if (Object.prototype.hasOwnProperty.call(overrides, p.id)) return overrides[p.id] || null;
  if (p.subcat) return p.subcat;
  return DEFAULT_PRODUCT_SUBCAT_BY_ID[p.id] || null;
}
window.addEventListener('storage', e => {
  if (e.key !== 'balasi_product_subcats') return;
  _productSubcatCache = null;
  if (typeof renderSubcatStrip === 'function') renderSubcatStrip();
  if (typeof renderProducts === 'function') renderProducts();
});

/* ---------- DIETARY ATTRIBUTES (auto-tagged from product data) ---------- */
const DIET_LABELS = {
  kosher:   { label:'כשר',         icon:'✡️', color:'#1e5ba8' },
  vegan:    { label:'טבעוני',      icon:'🌱', color:'#1b7a3d' },
  veggie:   { label:'צמחוני',      icon:'🥗', color:'#3a6b54' },
  glutenFree: { label:'ללא גלוטן', icon:'🌾', color:'#9a6f1d' },
  lactoseFree:{ label:'ללא לקטוז', icon:'🥛', color:'#8a6238' },
  sugarFree:{ label:'ללא סוכר',    icon:'🍃', color:'#2c4538' },
};

/* Auto-derive dietary attributes from product category & name */
function getDietTags(p) {
  const tags = ['kosher']; // assume all kosher (Israeli context)
  const n = p.name.toLowerCase();
  const c = p.cat;

  // Vegan: produce, plant-based, healthy category items, water, juices
  if (c === 'fruits' || c === 'healthy' ||
      /טבעוני|סויה|שיבולת שועל|קוקוס|שקדים|אגוזים|ענבים|תפוחים|בננות|תפוזים|מים|תפוזים|תפוחים/.test(n) ||
      /קולה|סודה|מיץ/.test(n)) tags.push('vegan');

  // Vegetarian (more inclusive than vegan)
  if (tags.includes('vegan') || c === 'dairy' || c === 'bakery' ||
      /גבינה|חלב|יוגורט|חמאה/.test(n)) tags.push('veggie');

  // Lactose-free: drinks, snacks (most), no dairy
  if (c !== 'dairy' && !/חלב|גבינה|יוגורט|חמאה|רוגלך|קרואסון|שוקולד חלב|פרה/.test(n)) {
    tags.push('lactoseFree');
  }
  // explicitly lactose-free items
  if (/סויה|אלפרו|שיבולת שועל|טבעוני|קוקוס/.test(n)) {
    if (!tags.includes('lactoseFree')) tags.push('lactoseFree');
  }

  // Gluten-free: no wheat/bread/pasta items
  if (!/חיטה|לחם|לחמני|פסטה|קרואסון|ביסלי|רוגלך|בורקס|מאפה|עוגי|במבה|דוריטוס/.test(n) &&
      c !== 'bakery' && c !== 'meals') {
    tags.push('glutenFree');
  }

  // Sugar-free (zero/light items)
  if (/זירו|דיאט|ללא סוכר/.test(n)) tags.push('sugarFree');

  return tags;
}

/* ---------- CURATED BUNDLES ---------- */
const BUNDLES = [
  {
    id:'starter',
    name:'סטארטר משרדי',
    desc:'חבילת התחלה למשרד עד 10 עובדים — קפה, חטיפים, מים וכלים חד-פעמיים',
    icon:'🎁',
    color:'#1b7a3d',
    items:[1, 11, 20, 31, 90, 93], // קפסולות נספרסו, מים, במבה, שוקולד פרה, כוסות, מפיות
    qtyMap:{ 1:2, 11:1, 20:5, 31:5, 90:2, 93:2 },
    discount:10,
    badge:'הפופולרי ביותר'
  },
  {
    id:'breakfast',
    name:'ארוחת בוקר לישיבה',
    desc:'מאפים טריים, פירות, יוגורט וקפה — מושלם לישיבות הנהלה ולפגישות בוקר',
    icon:'🥐',
    color:'#e8804a',
    items:[1, 41, 40, 60, 50, 52, 13],
    qtyMap:{ 1:1, 41:8, 40:1, 60:1, 50:2, 52:8, 13:2 },
    discount:8,
    badge:'מומלץ לישיבות'
  },
  {
    id:'rosh-hashana',
    name:'סל ראש השנה',
    desc:'חבילה חגיגית לראש השנה — תפוחים, רוגלך, ענבים, יין סודה ומתוקים',
    icon:'🍎',
    color:'#9a6f1d',
    items:[62, 65, 40, 30, 17, 41],
    qtyMap:{ 62:3, 65:2, 40:2, 30:5, 17:2, 41:6 },
    discount:12,
    badge:'מהדורה מוגבלת'
  },
  {
    id:'healthy',
    name:'משרד בריא',
    desc:'אופציות בריאות וטבעוניות — חלב צמחי, חטיפי בריאות, פירות וירקות',
    icon:'🌱',
    color:'#155f30',
    items:[83, 80, 60, 85, 51, 82],
    qtyMap:{ 83:2, 80:10, 60:1, 85:2, 51:2, 82:6 },
    discount:5,
    badge:'בריאות וטעם'
  },
  {
    id:'cleaning',
    name:'מטבחון נקי',
    desc:'מארז ניקיון מלא למטבחון משרדי — סבון, מגבונים, נייר טואלט, שקיות זבל',
    icon:'🧼',
    color:'#1e5ba8',
    items:[100, 101, 102, 103, 105, 96],
    qtyMap:{ 100:2, 101:1, 102:1, 103:1, 105:1, 96:1 },
    discount:7,
    badge:'מארז חודשי'
  },
  {
    id:'meeting',
    name:'מגש פגישה',
    desc:'הכל לפגישת לקוחות חשובה — סנדוויצ\'ים, סלטים, מים, קפה ועוגיות',
    icon:'🥪',
    color:'#a23d20',
    items:[72, 70, 11, 1, 42, 60],
    qtyMap:{ 72:6, 70:6, 11:1, 1:1, 42:1, 60:1 },
    discount:8,
    badge:'מהיר ומכובד'
  },
];

/* Load persisted state from localStorage */
function loadPersistedState() {
  try {
    const fav = JSON.parse(localStorage.getItem('balasi_favorites') || '[]');
    state.favorites = Array.isArray(fav) ? fav : [];
    const rv = JSON.parse(localStorage.getItem('balasi_recently_viewed') || '[]');
    state.recentlyViewed = Array.isArray(rv) ? rv : [];
    state.user = JSON.parse(localStorage.getItem('balasi_user') || 'null');
    state.recurringOrder = JSON.parse(localStorage.getItem('balasi_recurring') || 'null');
    // Restore cart — keys are stringified ints, normalize to numeric IDs
    const rawCart = JSON.parse(localStorage.getItem('balasi_cart') || '{}');
    if (rawCart && typeof rawCart === 'object') {
      const cart = {};
      Object.entries(rawCart).forEach(([k, v]) => {
        const id = Number(k);
        const qty = Number(v);
        // Drop entries that no longer correspond to a real product (e.g. catalog change)
        if (!isNaN(id) && qty > 0 && PRODUCTS.find(p => p.id === id)) cart[id] = qty;
      });
      state.cart = cart;
    }
  } catch (e) {}
}

function saveCart() {
  try { localStorage.setItem('balasi_cart', JSON.stringify(state.cart)); }
  catch (e) { /* quota exceeded — silently drop, cart will only live in-memory */ }
}

/* Format a Date as YYYY-MM-DD in Israel local time, regardless of the browser's timezone.
   Falls back to local date components if Intl isn't available. */
function formatIsraelDate(date) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
  } catch (e) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

function saveUser() {
  try { localStorage.setItem('balasi_user', JSON.stringify(state.user)); } catch (e) {}
}

/* Save/Load returning customer profile (used for auto-fill + recognition by email) */
function getCustomerProfiles() {
  try { return JSON.parse(localStorage.getItem('balasi_profiles') || '{}'); } catch (e) { return {}; }
}
function saveCustomerProfile(email, profile) {
  if (!email) return;
  try {
    const profiles = getCustomerProfiles();
    profiles[email.toLowerCase()] = { ...(profiles[email.toLowerCase()] || {}), ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem('balasi_profiles', JSON.stringify(profiles));
  } catch (e) {}
}

/* ----------------------------------------------------------------
   PER-CUSTOMER ORDER HISTORY
   Storage shape: { "<email-lowercased>": [ orderPayload, orderPayload, ... ] }
   Each entry mirrors the sitePayload pushed to balasi_pending_orders so we can
   show real previous orders to the customer in the account portal.
   ---------------------------------------------------------------- */
function getAllCustomerOrders() {
  try { return JSON.parse(localStorage.getItem('balasi_customer_orders') || '{}') || {}; }
  catch (e) { return {}; }
}
function saveCustomerOrder(email, payload) {
  if (!email || !payload) return;
  try {
    const all = getAllCustomerOrders();
    const key = email.toLowerCase();
    if (!Array.isArray(all[key])) all[key] = [];
    // Skip if this orderNumber is already saved (idempotent)
    if (!all[key].some(o => o && o.orderNumber === payload.orderNumber)) {
      all[key].unshift(payload); // newest first
    }
    // Keep last 50 to avoid bloating localStorage
    if (all[key].length > 50) all[key] = all[key].slice(0, 50);
    localStorage.setItem('balasi_customer_orders', JSON.stringify(all));
  } catch (e) {}
}
function getCustomerOrders(email) {
  if (!email) return [];
  const all = getAllCustomerOrders();
  return all[email.toLowerCase()] || [];
}
/* Migration: pull orders for the currently-logged-in user from BOTH the
   admin-side stores so historical orders (made before per-customer storage
   existed) still show up. Idempotent — safe to call repeatedly.

   Source 1: `balasi_pending_orders` — orders still awaiting admin processing,
             match by customer.email.
   Source 2: `admin_orders` — orders the admin has already accepted/processed,
             match by joining admin_customers.email → admin_orders.customerId. */
function migrateOrdersFromAdminQueue(email) {
  if (!email) return;
  const lower = email.trim().toLowerCase();

  // --- Source 1: pending queue (matches by email directly) ---
  try {
    const queue = JSON.parse(localStorage.getItem('balasi_pending_orders') || '[]');
    queue.forEach(o => {
      if (o && o.customer && o.customer.email
          && o.customer.email.trim().toLowerCase() === lower) {
        saveCustomerOrder(email, o);
      }
    });
  } catch (e) {}

  // --- Source 2: admin_orders (linked by customerId, looked up via email) ---
  try {
    const adminCustomers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
    if (!Array.isArray(adminCustomers) || adminCustomers.length === 0) return;

    // Find every customer record matching this email (a person can be listed
    // under several companies; collect all matching customer IDs)
    const matchingIds = adminCustomers
      .filter(c => c && c.email && c.email.trim().toLowerCase() === lower)
      .map(c => c.id);
    if (matchingIds.length === 0) return;

    const adminOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
    if (!Array.isArray(adminOrders)) return;

    adminOrders.forEach(o => {
      if (!o || !matchingIds.includes(o.customerId)) return;

      // Convert admin order → customer-portal payload shape
      const timestamp = o.date
        ? new Date(o.date + 'T12:00:00').toISOString()
        : new Date().toISOString();
      // Enrich items with name when the catalog has a matching pid
      const items = Array.isArray(o.items) ? o.items.map(it => {
        const p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(x => x.id === it.pid) : null;
        return {
          pid: it.pid,
          name: p ? p.name : ('פריט ' + it.pid),
          qty: it.qty || 1,
          price: p ? p.price : 0,
          unit: p ? p.unit : '',
          lineTotal: (p ? p.price : 0) * (it.qty || 1)
        };
      }) : [];
      const cust = adminCustomers.find(c => c && c.id === o.customerId) || {};
      const payload = {
        orderNumber: o.orderNumber || ('ADM-' + o.id),
        timestamp,
        total: o.total || 0,
        status: o.orderStatus || 'delivered',
        items,
        customer: { email, contactName: cust.name || '' },
        notes: o.notes || '',
        source: 'admin'
      };
      saveCustomerOrder(email, payload);
    });
  } catch (e) {}
}
/* Look up all customer accounts (= customer numbers) the logged-in user has access to.
   Returns an array of { customerNumber, label, payTerms, companyId, companyName, isPrimary }
   sorted with primary account first. Used to show a dropdown at checkout instead of free text. */
function getCustomerAccountsForEmail(email) {
  if (!email) return [];
  const lower = email.trim().toLowerCase();
  const accountsOut = [];
  const seen = new Set(); // dedupe by companyId+customerNumber

  try {
    const adminCustomers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
    const adminCompanies = JSON.parse(localStorage.getItem('admin_companies') || '[]');
    let customer = adminCustomers.find(c => c.email && c.email.trim().toLowerCase() === lower);

    // Fallback: try matching by name pattern (David Balasi etc.) when email doesn't match
    // — this handles cases where the user's logged-in email differs from the admin record
    if (!customer && typeof state !== 'undefined' && state.user) {
      const userName = (state.user.name || '').trim().toLowerCase();
      const userCompany = (state.user.company || '').trim().toLowerCase();
      if (userCompany) {
        // Try to find a company by name and grab any customer linked to it
        const company = adminCompanies.find(c => (c.name || '').trim().toLowerCase() === userCompany);
        if (company) {
          customer = adminCustomers.find(c =>
            c.companyId === company.id ||
            (Array.isArray(c.accessList) && c.accessList.some(a => a.companyId === company.id))
          );
          if (!customer) {
            // No customer record yet, but we found the company — synthesize one access entry
            customer = { companyId: company.id, accessList: [{ companyId: company.id }] };
          }
        }
      }
    }

    if (customer) {
      // Build the list of accessible (company, account) pairs.
      // Modern customers have accessList; legacy ones have a single companyId.
      const access = (Array.isArray(customer.accessList) && customer.accessList.length)
        ? customer.accessList
        : (customer.companyId ? [{ companyId: customer.companyId }] : []);

      // Track which companies we've already expanded — so multiple accessList
      // entries to the same company don't cause duplicate processing.
      const expandedCompanies = new Set();
      access.forEach(entry => {
        const company = adminCompanies.find(c => c.id === entry.companyId);
        if (!company) return;
        const allAccounts = company.accounts || [];

        // Decide which accounts the user can see:
        //   • If the user's entry points to a RESTRICTED account → only that one
        //     (e.g., a "fruits-only" sub-account where the owner explicitly limits the user)
        //   • Otherwise → all accounts of the company that aren't restricted from this user
        //     (auto-imported customers get accessList[*].accountId by default,
        //      but they should still see all their company's accounts)
        const myAccount = entry.accountId ? allAccounts.find(a => a.id === entry.accountId) : null;
        const isExplicitlyRestricted = myAccount && myAccount.restricted === true;

        let visible;
        if (isExplicitlyRestricted) {
          visible = [myAccount];
        } else {
          if (expandedCompanies.has(company.id)) return; // already pushed full list once
          expandedCompanies.add(company.id);
          // Show all accounts of the company except those marked restricted
          // (to which this specific user is not assigned).
          visible = allAccounts.filter(a => {
            if (!a.restricted) return true;
            // Only include restricted accounts that this user explicitly has access to
            return access.some(e => e.companyId === company.id && e.accountId === a.id);
          });
        }

        visible.forEach(a => {
          const key = `${company.id}|${a.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          accountsOut.push({
            accountId:      a.id,
            customerNumber: a.customerNumber || '',
            label:          a.label || 'חשבון ראשי',
            payTerms:       a.payTerms || '',
            companyId:      company.id,
            companyName:    company.name || '',
            isPrimary:      !!a.isPrimary
          });
        });
      });
    }

    // Fallback: customer not yet in admin DB but logged in via public site
    // → use the customerNumber from state.user and the saved profile so the
    // dropdown still has at least one identifying option.
    if (!accountsOut.length && typeof state !== 'undefined' && state.user && state.user.email && state.user.email.toLowerCase() === lower) {
      const cn = state.user.customerNumber;
      if (cn) {
        accountsOut.push({
          customerNumber: cn,
          label:          'החשבון שלכם',
          payTerms:       '',
          companyId:      null,
          companyName:    state.user.company || '',
          isPrimary:      true
        });
      }
    }

    // Additional fallback: look in saved customer profiles (saved on prior orders)
    if (!accountsOut.length) {
      const profiles = (typeof getCustomerProfiles === 'function') ? getCustomerProfiles() : {};
      const p = profiles[lower];
      if (p && p.customerNumber) {
        accountsOut.push({
          customerNumber: p.customerNumber,
          label:          'החשבון שלכם',
          payTerms:       p.payment || '',
          companyId:      null,
          companyName:    p.companyName || '',
          isPrimary:      true
        });
      }
    }
  } catch (e) { /* ignore — return what we have */ }

  accountsOut.sort((a,b) => (b.isPrimary - a.isPrimary));
  return accountsOut;
}

function findProfileByEmail(email) {
  if (!email) return null;
  const lower = email.toLowerCase();

  // Primary source: public-site profiles saved on order completion
  const profiles = getCustomerProfiles();
  if (profiles[lower]) return profiles[lower];

  // Fallback: admin database (customers + companies)
  // This handles cases where:
  //   1. The customer ordered before the profile-saving feature was built
  //   2. Admin manually approved or imported the customer
  //   3. The customer was added directly via the admin panel
  try {
    const adminCustomers = JSON.parse(localStorage.getItem('admin_customers') || '[]');
    const customer = adminCustomers.find(c =>
      c.email && c.email.toLowerCase() === lower
    );
    if (!customer) return null;

    const companyId = customer.companyId
      || (Array.isArray(customer.accessList) ? customer.accessList[0]?.companyId : null);
    if (!companyId) return null;

    const adminCompanies = JSON.parse(localStorage.getItem('admin_companies') || '[]');
    const company = adminCompanies.find(c => c.id === companyId);
    if (!company) return null;

    // Pick primary branch and account for default address & customer number
    const branch = (company.branches || []).find(b => b.isPrimary)
                || (company.branches || [])[0] || {};
    const account = (company.accounts || []).find(a => a.isPrimary)
                 || (company.accounts || [])[0] || {};

    // Map admin payment terms to checkout-form values
    const paymentMap = { net30:'net30', credit:'credit' };
    const payment = paymentMap[account.payTerms] || '';

    return {
      companyName:    company.name || '',
      taxId:          company.taxId || '',
      invoiceName:    company.name || '',
      customerNumber: account.customerNumber || customer.customerNumber || '',
      contactName:    customer.name || '',
      contactRole:    customer.role || '',
      phone:          customer.phone || company.phone || '',
      email:          customer.email,
      street:         branch.address || company.address || '',
      city:           company.city || '',
      zip:            company.zip || '',
      floor:          '',
      payment,
      _source: 'admin' // marker so we know where data came from
    };
  } catch (e) {
    return null;
  }
}

function saveRecurringOrder() {
  try { localStorage.setItem('balasi_recurring', JSON.stringify(state.recurringOrder)); } catch (e) {}
}

function saveFavorites() {
  try { localStorage.setItem('balasi_favorites', JSON.stringify(state.favorites)); } catch (e) {}
}
function saveRecentlyViewed() {
  try { localStorage.setItem('balasi_recently_viewed', JSON.stringify(state.recentlyViewed)); } catch (e) {}
}

/* ---------- STOCK STATUS ---------- */
/* Deterministic stock status based on product id (so it's stable across reloads) */
function getStockStatus(id) {
  // 8 of every 10 products are in stock, 1 is low, 1 is out
  const mod = id % 10;
  if (mod === 0) return { key:'out', label:'אזל מהמלאי' };
  if (mod === 7) return { key:'low', label:'מלאי קטן' };
  return { key:'in', label:'במלאי' };
}

/* ---------- WISHLIST / FAVORITES ---------- */
function isFavorite(id) { return state.favorites.includes(id); }

function toggleFavorite(id, ev) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); }
  const i = state.favorites.indexOf(id);
  const p = PRODUCTS.find(x => x.id === id);
  if (i === -1) {
    state.favorites.push(id);
    showToast(`💛 ${p ? p.name : 'מוצר'} נוסף למועדפים`);
  } else {
    state.favorites.splice(i, 1);
    showToast(`הוסר מהמועדפים`);
  }
  saveFavorites();
  // update all instances of the favorite icon
  document.querySelectorAll(`.card[data-id="${id}"] .card-fav`).forEach(el => {
    el.classList.toggle('active', isFavorite(id));
  });
}

/* ---------- RECENTLY VIEWED ---------- */
function trackRecentlyViewed(id) {
  state.recentlyViewed = state.recentlyViewed.filter(x => x !== id);
  state.recentlyViewed.unshift(id);
  state.recentlyViewed = state.recentlyViewed.slice(0, 8);
  saveRecentlyViewed();
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  const sec = document.getElementById('recently');
  const track = document.getElementById('recentlyTrack');
  if (!sec || !track) return;
  const hidden = getHiddenProductIds();
  const items = state.recentlyViewed
    .map(id => PRODUCTS.find(p => p.id === id))
    .filter(p => p && !hidden.has(p.id));
  if (items.length < 2) {
    sec.style.display = 'none';
    return;
  }
  sec.style.display = '';
  track.innerHTML = items.map(p => productCardHTML(p)).join('');
}

function clearRecentlyViewed() {
  state.recentlyViewed = [];
  saveRecentlyViewed();
  renderRecentlyViewed();
  showToast('היסטוריה נוקתה');
}

/* ---------- QUICK VIEW MODAL ---------- */
function openQuickView(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  // Block opening quick view for products the admin hid from the public site
  if (getHiddenProductIds().has(p.id)) return;
  trackRecentlyViewed(id);

  const stock = getStockStatus(p.id);
  const fav = isFavorite(p.id);
  const catName = CATEGORIES.find(c => c.id === p.cat)?.name || '';
  const tagClass = p.tag === 'נמכר' ? '' : (p.tag === 'חדש' ? 'new' : 'sale');
  const isOut = stock.key === 'out';

  const customImage = getProductImages()[p.id];
  const modal = document.getElementById('qvModalInner');
  modal.innerHTML = `
    <div class="qv-img${customImage ? ' has-photo' : ''}">
      ${p.tag ? `<span class="qv-tag ${tagClass}">${p.tag}</span>` : ''}
      <button class="qv-close" onclick="closeQuickView()" aria-label="סגור">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      ${customImage
        ? `<img class="qv-photo" src="${customImage}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display=''" /><span class="emoji" style="display:none">${p.icon}</span>`
        : `<span class="emoji">${p.icon}</span>`}
    </div>
    <div class="qv-content">
      <span class="qv-cat">${catName}${p.brand ? ` · ${p.brand}` : ''}</span>
      <h2 class="qv-name">${p.name}</h2>
      <span class="qv-stock ${stock.key}">${stock.label}</span>
      <p class="qv-desc">${p.desc || ''}</p>
      <div class="qv-meta">
        <div class="qv-meta-row"><span>יחידת מידה</span><b>${p.unit}</b></div>
        <div class="qv-meta-row"><span>קטגוריה</span><b>${catName}</b></div>
        ${p.brand ? `<div class="qv-meta-row"><span>יצרן</span><b>${p.brand}</b></div>` : ''}
        <div class="qv-meta-row"><span>מק"ט</span><b>BLS-${String(p.id).padStart(4,'0')}</b></div>
      </div>
      <div class="qv-price-row">
        <span class="qv-price">₪${p.price}</span>
        <span class="qv-unit">/ ${p.unit}</span>
      </div>
      <div class="qv-actions">
        ${isOut
          ? `<button class="btn btn-dark" disabled style="opacity:.5">אזל מהמלאי</button>`
          : `<button class="btn btn-dark" onclick="addToCart(${p.id});closeQuickView()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              הוסף לסל
            </button>`}
        <button class="qv-fav-btn ${fav ? 'active' : ''}" onclick="toggleFavorite(${p.id});refreshQVFav(${p.id})" aria-label="מועדפים" title="הוסף למועדפים">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div id="qvRecs" class="rec-strip" data-product-id="${p.id}"></div>
    </div>
  `;

  // Render smart recommendations within quick view
  setTimeout(() => {
    const qvRecs = document.getElementById('qvRecs');
    if (qvRecs) {
      renderRecommendationStrip(qvRecs, {
        source:'product',
        product:p,
        excludeIds:[p.id],
        subtitle:'מוצרים שמתאימים יחד עם ' + p.name
      });
    }
  }, 50);

  const bg = document.getElementById('qvModal');
  bg.classList.add('open');
  bg.onclick = (e) => { if (e.target === bg) closeQuickView(); };
  document.addEventListener('keydown', qvKeyHandler);
}

function refreshQVFav(id) {
  const btn = document.querySelector('.qv-fav-btn');
  if (btn) {
    const active = isFavorite(id);
    btn.classList.toggle('active', active);
    btn.querySelector('svg').setAttribute('fill', active ? 'currentColor' : 'none');
  }
}

function closeQuickView() {
  document.getElementById('qvModal').classList.remove('open');
  document.removeEventListener('keydown', qvKeyHandler);
}
function qvKeyHandler(e) { if (e.key === 'Escape') closeQuickView(); }

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadPersistedState();
  renderFilterChips();
  renderSideCats();
  renderSideBrands();
  renderDietFilters();
  renderCategoriesGrid();
  renderFeatured();
  renderSubcatStrip();
  renderProducts();
  renderRecentlyViewed();
  renderBundles();
  // Monthly deals — seed example promos on first ever load, then
  // render the rail (between personal rails and featured products).
  seedMonthlyDealsIfNeeded();
  renderMonthlyDeals();
  attachEvents();
  updateCartUI();
  updateLoginUI();
  initHeaderScroll();
  initCookieBanner();
  showWelcomeBackBanner();
  injectProductsJsonLd();
});

/* ---------- SEO: per-product schema.org/Product structured data ---------- */
/* Generates a single JSON-LD ItemList containing every product in the catalog
   (excluding admin-hidden items). Lets Google index prices and units. */
function injectProductsJsonLd() {
  try {
    const hidden = getHiddenProductIds();
    const visible = PRODUCTS.filter(p => !hidden.has(p.id));
    const customImages = getProductImages();
    const baseUrl = location.origin + location.pathname;
    const items = visible.map((p, i) => {
      const cat = CATEGORIES.find(c => c.id === p.cat)?.name || '';
      const itemImage = customImages[p.id] || `${location.origin}/logo.svg`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          description: p.desc || `${p.name} — ${p.unit}${p.brand ? ' · ' + p.brand : ''}`,
          sku: 'BLS-' + String(p.id).padStart(4, '0'),
          brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
          category: cat,
          image: itemImage,
          url: `${baseUrl}#product-${p.id}`,
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'ILS',
            availability: getStockStatus(p.id).key === 'out'
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: 'בלסי סטור' }
          }
        }
      };
    });
    const payload = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items
    };
    // Replace any existing tag, so re-running on category change stays clean
    let tag = document.getElementById('balasi-products-jsonld');
    if (!tag) {
      tag = document.createElement('script');
      tag.id = 'balasi-products-jsonld';
      tag.type = 'application/ld+json';
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(payload);
  } catch (e) { /* no-op — SEO is best-effort */ }
}

/* Welcome back banner — appears top of page for logged-in returning users */
function showWelcomeBackBanner() {
  if (!state.user) return;
  // Don't show if dismissed in this session
  if (sessionStorage.getItem('welcome_dismissed') === '1') return;
  // Don't show on first-time login (only on RETURN visits)
  const profile = findProfileByEmail(state.user.email);
  if (!profile || !profile.lastOrderAt) return;

  const banner = document.createElement('div');
  banner.id = 'welcomeBackBanner';
  banner.style.cssText = `
    position:relative;background:linear-gradient(135deg,var(--ink,#0d0d0b),var(--green-3,#0f4421));
    color:var(--paper,#fff7e0);padding:14px 22px;display:flex;align-items:center;gap:18px;
    font-size:13.5px;font-weight:500;letter-spacing:.02em;flex-wrap:wrap;justify-content:center;
  `;
  banner.innerHTML = `
    <span style="font-size:18px">👋</span>
    <span>ברוך שובך, <b style="color:var(--pop-soft,#fdebe0)">${state.user.name}</b>! נעים לראות אותך שוב.</span>
    <button onclick="openAccount()" style="background:var(--pop,#e8804a);color:var(--paper,#fff);border:0;padding:7px 16px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">לאזור האישי</button>
    <button onclick="openCart();setTimeout(openCheckout,400)" style="background:rgba(255,255,255,.12);color:var(--paper,#fff);border:0;padding:7px 16px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">הזמנה חדשה</button>
    <button onclick="dismissWelcomeBack()" style="background:none;border:0;color:rgba(255,255,255,.6);font-size:18px;cursor:pointer;padding:0 6px;line-height:1" aria-label="סגור">×</button>
  `;
  // Insert at top of body, after the announce bar
  const announce = document.querySelector('.announce');
  if (announce && announce.parentNode) {
    announce.parentNode.insertBefore(banner, announce.nextSibling);
  } else {
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

function dismissWelcomeBack() {
  document.getElementById('welcomeBackBanner')?.remove();
  try { sessionStorage.setItem('welcome_dismissed', '1'); } catch (e) {}
}

/* ---------- COOKIE CONSENT BANNER (granular) ---------- */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const reopen = document.querySelector('.cookie-reopen');
  if (!banner) return;
  let consent = null;
  try { consent = localStorage.getItem('balasi_cookie_consent'); } catch (e) {}
  if (!consent) {
    setTimeout(() => banner.classList.add('open'), 800);
  } else {
    // Show reopen button so user can change preferences
    if (reopen) reopen.classList.add('show');
  }
}

function setCookieConsent(prefs) {
  try {
    localStorage.setItem('balasi_cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('balasi_cookie_consent_date', new Date().toISOString());
  } catch (e) {}
  document.getElementById('cookieBanner').classList.remove('open');
  document.querySelector('.cookie-reopen')?.classList.add('show');
  // Apply consent (in production, would init/disable analytics here)
  applyCookieConsent(prefs);
}

/* ============================================================
   COOKIE-CONSENT GATE for analytics & marketing trackers
   ============================================================
   Israeli privacy regulations forbid loading non-essential
   trackers (GA, Pixel, Hotjar, etc.) before the user has given
   explicit consent via the cookie banner. This function is the
   ONLY place that should ever start a tracker — and it always
   checks the consent state first.

   To add a real GA / Pixel later:
   1. Drop the implementation inside the if-blocks below
   2. Do NOT add a <script src="..."> tag for the tracker
      anywhere else in the codebase
   3. The function will run automatically when the user accepts
      cookies or when a returning user with saved consent loads
      the page
   ============================================================ */
function applyCookieConsent(prefs) {
  if (!prefs || typeof prefs !== 'object') return;

  if (prefs.analytics && !window._balasiGaLoaded) {
    window._balasiGaLoaded = true;
    // === GOOGLE ANALYTICS — paste real GA snippet here ===
    // const s = document.createElement('script');
    // s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
    // s.async = true;
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){ dataLayer.push(arguments); }
    // gtag('js', new Date()); gtag('config', 'G-XXXXXXX');
    // analytics enabled — debug output suppressed in production
  }

  if (prefs.marketing && !window._balasiPixelLoaded) {
    window._balasiPixelLoaded = true;
    // === FACEBOOK PIXEL — paste real Pixel snippet here ===
    // !function(f,b,e,v,n,t,s) { ... } // standard Meta Pixel boilerplate
    // fbq('init', 'YOUR_PIXEL_ID'); fbq('track', 'PageView');
    // marketing pixel enabled — debug output suppressed in production
  }
}

/* On page load — restore saved consent and apply it.
   This makes returning visitors get their trackers on the
   second visit without seeing the banner again, while a brand
   new visitor sees the banner and nothing is loaded until they
   accept. */
(function autoApplyConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem('balasi_cookie_consent') || 'null');
    if (saved) applyCookieConsent(saved);
  } catch (e) {}
})();

function acceptCookies() {
  setCookieConsent({ essential:true, analytics:true, marketing:true });
  showToast('תודה! כל העוגיות מופעלות');
}

function declineCookies() {
  setCookieConsent({ essential:true, analytics:false, marketing:false });
  showToast('משתמשים רק בעוגיות הכרחיות');
}

function toggleCookiePrefs() {
  const prefs = document.getElementById('cookiePrefs');
  const customBtn = document.getElementById('cookieCustomBtn');
  const saveBtn = document.getElementById('cookieSaveBtn');
  if (prefs.style.display === 'none' || !prefs.style.display) {
    prefs.style.display = 'flex';
    customBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    // Pre-load existing settings if any
    try {
      const existing = JSON.parse(localStorage.getItem('balasi_cookie_consent') || 'null');
      if (existing) {
        document.getElementById('cpAnalytics').checked = !!existing.analytics;
        document.getElementById('cpMarketing').checked = !!existing.marketing;
      }
    } catch (e) {}
  } else {
    prefs.style.display = 'none';
    customBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
  }
}

function saveCookiePrefs() {
  const analytics = document.getElementById('cpAnalytics').checked;
  const marketing = document.getElementById('cpMarketing').checked;
  setCookieConsent({ essential:true, analytics, marketing });
  showToast('העדפות העוגיות שלך נשמרו');
}

function reopenCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const prefs = document.getElementById('cookiePrefs');
  const customBtn = document.getElementById('cookieCustomBtn');
  const saveBtn = document.getElementById('cookieSaveBtn');
  // Reset banner UI to preferences view
  prefs.style.display = 'flex';
  customBtn.style.display = 'none';
  saveBtn.style.display = 'inline-flex';
  // Pre-load existing settings
  try {
    const existing = JSON.parse(localStorage.getItem('balasi_cookie_consent') || 'null');
    if (existing) {
      document.getElementById('cpAnalytics').checked = !!existing.analytics;
      document.getElementById('cpMarketing').checked = !!existing.marketing;
    }
  } catch (e) {}
  banner.classList.add('open');
}

/* ---------- HEADER scroll ---------- */
function initHeaderScroll() {
  const header = document.getElementById('hdr');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
}

/* ---------- SEARCH OVERLAY ---------- */
function openSearch() {
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(() => document.getElementById('searchInput').focus(), 100);
}
function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('open');
}

/* ---------- SCROLL TO TOP (logo click) ---------- */
function scrollToTop(e) {
  if (e) e.preventDefault();
  window.scrollTo({ top:0, behavior:'smooth' });
}

/* ---------- CTA: start ordering ---------- */
function startOrdering() {
  const products = document.getElementById('products');
  if (!products) return;
  products.scrollIntoView({ behavior:'smooth', block:'start' });
  setTimeout(() => {
    const search = document.getElementById('searchInput');
    if (search) search.focus({ preventScroll:true });
  }, 700);
  showToast('בחרו קטגוריה או חפשו מוצר ולחצו על + כדי להוסיף לסל');
}

/* ---------- FILTER CHIPS (catalog) ---------- */
function renderFilterChips() {
  const bar = document.getElementById('filterChips');
  if (!bar) return;
  bar.innerHTML = CATEGORIES.map(c => `
    <button class="chip ${state.filter === c.id ? 'active' : ''}" data-cat="${c.id}" onclick="selectCategory('${c.id}')">${c.name}</button>
  `).join('');
}

function selectCategory(catId) {
  // Changing the parent category resets the active sub-category filter
  if (state.filter !== catId) state.subcat = 'all';
  state.filter = catId;
  document.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('active', ch.dataset.cat === catId));
  // Re-render the sidebar so the chosen category expands its subcategories
  // inline beneath it (accordion behaviour).
  renderSideCats();
  if (typeof renderSubcatStrip === 'function') renderSubcatStrip();
  renderProducts();
  document.getElementById('products').scrollIntoView({ behavior:'smooth', block:'start' });
  // Auto-close mobile filter sidebar after selection
  if (window.innerWidth <= 920) toggleFiltersMobile(false);
}

/* ---------- SUBCATEGORY SELECTION ---------- */
function selectSubcategory(subId) {
  state.subcat = subId || 'all';
  // Re-render sidebar so the active sub-item highlights correctly
  renderSideCats();
  if (typeof renderSubcatStrip === 'function') renderSubcatStrip();
  renderProducts();
}

function renderSubcatStrip() {
  const strip = document.getElementById('subcatStrip');
  const inner = document.getElementById('subcatStripInner');
  if (!strip || !inner) return;
  const subs = (typeof getSubcategoriesFor === 'function') ? getSubcategoriesFor(state.filter) : [];
  // Hide entirely when no parent category, no subs, or active search query
  if (!subs.length || (state.search && state.search.trim())) {
    strip.hidden = true; inner.innerHTML = ''; return;
  }
  const hidden = getHiddenProductIds();
  const inCat = PRODUCTS.filter(p => !hidden.has(p.id) && p.cat === state.filter);
  const countAll = inCat.length;
  const countBySub = subs.reduce((m, s) => {
    m[s.id] = inCat.filter(p => productSubcat(p) === s.id).length;
    return m;
  }, {});
  const chips = [
    `<button type="button" class="subcat-chip all-chip ${state.subcat === 'all' ? 'active' : ''}"
             data-sub="all" onclick="selectSubcategory('all')">
       <span class="sc-icon" aria-hidden="true">★</span>
       <span>הכל</span>
     </button>`
  ];
  subs.forEach(s => {
    const count = countBySub[s.id] || 0;
    if (!count) return;
    chips.push(
      `<button type="button" class="subcat-chip ${state.subcat === s.id ? 'active' : ''}"
               data-sub="${s.id}" onclick="selectSubcategory('${s.id}')">
         ${s.icon ? `<span class="sc-icon" aria-hidden="true">${s.icon}</span>` : ''}
         <span>${s.name}</span>
       </button>`
    );
  });
  inner.innerHTML = chips.join('');
  strip.hidden = false;
}

/* ---------- SIDEBAR: categories ---------- */
function renderSideCats() {
  const list = document.getElementById('sideCats');
  if (!list) return;
  const hidden = getHiddenProductIds();
  const visible = PRODUCTS.filter(p => !hidden.has(p.id));

  list.innerHTML = CATEGORIES.map(c => {
    const count = c.id === 'all'
      ? visible.length
      : visible.filter(p => p.cat === c.id).length;
    const subs = (typeof getSubcategoriesFor === 'function') ? getSubcategoriesFor(c.id) : [];
    const hasSubs = subs.length > 0;
    const isActive = state.filter === c.id;
    const isOpen = isActive && hasSubs; // expand when this is the active category

    // Header row
    let html = `<a class="aside-cat ${isActive ? 'active' : ''} ${hasSubs ? 'has-subs' : ''} ${isOpen ? 'open' : ''}"
                   data-cat="${c.id}" onclick="selectCategory('${c.id}')">
      <span class="ac-name"><span class="ac-icon">${c.icon}</span>${c.name}</span>
      ${hasSubs ? `<span class="ac-arrow" aria-hidden="true">▾</span>` : ''}
      
    </a>`;

    // Sub-list panel — present in DOM only when this category is open, so it
    // expands smoothly *below* the parent (not as a horizontal strip).
    if (isOpen) {
      const countBySub = subs.reduce((m, s) => {
        m[s.id] = visible.filter(p => p.cat === c.id && productSubcat(p) === s.id).length;
        return m;
      }, {});
      const allCount = visible.filter(p => p.cat === c.id).length;

      const subItems = [
        `<a class="aside-subcat all-sub ${state.subcat === 'all' ? 'active' : ''}"
            data-sub="all" onclick="selectSubcategory('all'); event.stopPropagation()">
            <span class="asc-name"><span class="asc-icon">★</span>הכל</span>
            
         </a>`
      ];
      subs.forEach(s => {
        const cnt = countBySub[s.id] || 0;
        if (!cnt) return; // hide empty subcategories
        subItems.push(
          `<a class="aside-subcat ${state.subcat === s.id ? 'active' : ''}"
              data-sub="${s.id}" onclick="selectSubcategory('${s.id}'); event.stopPropagation()">
              <span class="asc-name">${s.icon ? `<span class="asc-icon">${s.icon}</span>` : ''}${s.name}</span>
              
           </a>`
        );
      });
      html += `<div class="aside-subcats">${subItems.join('')}</div>`;
    }

    return html;
  }).join('');
}

/* ---------- SIDEBAR: brands (manufacturers) ---------- */
// Cached collator — avoids re-creating on every sort/filter (perf)
const HE_COLLATOR = new Intl.Collator('he', { sensitivity:'base', numeric:true });

function getBrands() {
  const hidden = getHiddenProductIds();
  const set = new Set();
  PRODUCTS.forEach(p => { if (p.brand && !hidden.has(p.id)) set.add(p.brand); });
  return Array.from(set).sort((a,b) => HE_COLLATOR.compare(a, b));
}

function renderSideBrands() {
  const list = document.getElementById('sideBrands');
  if (!list) return;
  const hidden = getHiddenProductIds();
  const visibleProducts = PRODUCTS.filter(p => !hidden.has(p.id));
  const brands = getBrands();
  // Filter brands to only show those relevant to current category
  const visible = state.filter === 'all'
    ? brands
    : brands.filter(b => visibleProducts.some(p => p.brand === b && p.cat === state.filter));

  const allCount = state.filter === 'all'
    ? visibleProducts.length
    : visibleProducts.filter(p => p.cat === state.filter).length;

  let html = `<a class="aside-brand ${state.brand === 'all' ? 'active' : ''}" data-brand="all" onclick="selectBrand('all')">
    <span class="ac-name">כל היצרנים</span>
    
  </a>`;
  html += visible.map(b => {
    const count = state.filter === 'all'
      ? visibleProducts.filter(p => p.brand === b).length
      : visibleProducts.filter(p => p.brand === b && p.cat === state.filter).length;
    return `<a class="aside-brand ${state.brand === b ? 'active' : ''}" data-brand="${b}" onclick="selectBrand('${b}')">
      <span class="ac-name">${b}</span>
      
    </a>`;
  }).join('');
  list.innerHTML = html;
}

function selectBrand(brand) {
  state.brand = brand;
  document.querySelectorAll('.aside-brand').forEach(a => a.classList.toggle('active', a.dataset.brand === brand));
  renderProducts();
  // Auto-close mobile filter sidebar after selection
  if (window.innerWidth <= 920) toggleFiltersMobile(false);
}

/* Mobile filter sidebar toggle */
function toggleFiltersMobile(force) {
  const aside = document.getElementById('catalogAside');
  if (!aside) return;
  if (typeof force === 'boolean') {
    aside.classList.toggle('open', force);
  } else {
    aside.classList.toggle('open');
  }
}

/* Update filter count badge */
function updateFilterCount() {
  const btn = document.getElementById('ftCount');
  if (!btn) return;
  let count = 0;
  if (state.filter !== 'all') count++;
  if (state.filter !== 'all' && state.subcat && state.subcat !== 'all') count++;
  if (state.brand !== 'all') count++;
  if (count > 0) {
    btn.textContent = count;
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
}

/* ---------- CATEGORIES GRID (editorial) ---------- */
function renderCategoriesGrid() {
  const grid = document.getElementById('catsGrid');
  grid.innerHTML = CATEGORIES.filter(c => c.id !== 'all').slice(0, 8).map((c, i) => `
    <div class="cat-edit cat-card" onclick="selectCategory('${c.id}')">
      <span class="ce-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="ce-icon">${c.icon}</span>
      <h3 class="ce-title">${c.name}</h3>
      <p class="ce-desc">${c.desc}</p>
      <span class="ce-arrow">←</span>
    </div>
  `).join('');
}

/* ---------- FEATURED CAROUSEL ---------- */
function renderFeatured() {
  const track = document.getElementById('featuredTrack');
  const hidden = getHiddenProductIds();
  const featured = PRODUCTS
    .filter(p => !hidden.has(p.id) && p.popular >= 7)
    .sort((a,b) => (b.popular||0) - (a.popular||0))
    .slice(0, 12);
  track.innerHTML = featured.map(p => productCardHTML(p)).join('');
}

function scrollCarousel(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: dir * 260, behavior:'smooth' });
}

/* ---------- SEARCH ---------- */
/* Read the list of product IDs the admin marked as hidden — items in this list
   are removed from the public catalog entirely (not shown as out-of-stock). */
function getHiddenProductIds() {
  try {
    const ids = JSON.parse(localStorage.getItem('balasi_hidden_products') || '[]');
    return Array.isArray(ids) ? new Set(ids) : new Set();
  } catch (e) { return new Set(); }
}

/* Read the admin-uploaded product images map { productId: dataUrl|httpsUrl }.
   Cached per render to avoid parsing the JSON for every card. */
let _productImagesCache = null;
function getProductImages() {
  if (_productImagesCache) return _productImagesCache;
  try { _productImagesCache = JSON.parse(localStorage.getItem('balasi_product_images') || '{}') || {}; }
  catch (e) { _productImagesCache = {}; }
  return _productImagesCache;
}
function clearProductImagesCache() { _productImagesCache = null; }
/* Refresh on storage event (admin in another tab) */
window.addEventListener('storage', e => {
  if (e.key === 'balasi_product_images' || e.key === 'balasi_hidden_products') {
    _productImagesCache = null;
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
    if (typeof renderMonthlyDeals === 'function') renderMonthlyDeals();
  }
  if (e.key === 'balasi_promotions') {
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
    if (typeof renderMonthlyDeals === 'function') renderMonthlyDeals();
  }
});

function getFilteredProducts() {
  const hidden = getHiddenProductIds();
  let list = PRODUCTS.filter(p => !hidden.has(p.id));

  if (state.filter !== 'all') {
    list = list.filter(p => p.cat === state.filter);
  }
  // Sub-category filter (only when a parent category is active)
  if (state.filter !== 'all' && state.subcat && state.subcat !== 'all') {
    list = list.filter(p => productSubcat(p) === state.subcat);
  }
  if (state.brand !== 'all') {
    list = list.filter(p => p.brand === state.brand);
  }
  // Dietary filters (must match ALL selected)
  if (state.diet && state.diet.length) {
    list = list.filter(p => {
      const tags = getDietTags(p);
      return state.diet.every(d => tags.includes(d));
    });
  }

  const q = state.search.trim();
  if (q) {
    const qLower = q.toLowerCase();
    const letters = qLower.replace(/\s+/g, '').split('');
    list = list.filter(p => {
      const name = p.name.toLowerCase();
      const desc = (p.desc || '').toLowerCase();
      const cat  = (CATEGORIES.find(c => c.id === p.cat)?.name || '').toLowerCase();
      const haystack = `${name} ${desc} ${cat}`;
      if (haystack.includes(qLower)) return true;
      let i = 0;
      for (const ch of name) {
        if (ch === letters[i]) i++;
        if (i >= letters.length) return true;
      }
      return false;
    });
  }

  const collator = HE_COLLATOR;
  switch (state.sort) {
    case 'alpha':       list.sort((a,b) => collator.compare(a.name, b.name)); break;
    case 'alpha-desc':  list.sort((a,b) => collator.compare(b.name, a.name)); break;
    case 'price-asc':   list.sort((a,b) => a.price - b.price); break;
    case 'price-desc':  list.sort((a,b) => b.price - a.price); break;
    case 'popular':     list.sort((a,b) => (b.popular || 0) - (a.popular || 0)); break;
  }
  return list;
}

/* ---------- PRODUCT CARD HTML ---------- */
function productCardHTML(p) {
  const inCart = state.cart[p.id] || 0;
  const tagClass = p.tag === 'נמכר' ? '' : (p.tag === 'חדש' ? 'new' : 'sale');
  const catName = CATEGORIES.find(c => c.id === p.cat)?.name || '';
  const stock = getStockStatus(p.id);
  const fav = isFavorite(p.id);
  const isOut = stock.key === 'out';
  const customImage = getProductImages()[p.id];
  const visualHTML = customImage
    ? `<img class="card-photo" src="${customImage}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display=''" /><span class="emoji" style="display:none">${p.icon}</span>`
    : `<span class="emoji">${p.icon}</span>`;
  // Promotion lookup — if a sale is active on this product or its category,
  // show the original price struck through and the discounted price beside it
  const promoInfo = getSiteProductPromo(p);
  const promoBadge = promoInfo ? getProductPromoBadge(p) : '';
  const priceHTML = promoInfo
    ? `<span class="card-price card-price-discounted">₪${promoInfo.finalPrice}</span>
       <span class="card-price-original">₪${promoInfo.originalPrice}</span>`
    : `<span class="card-price">₪${p.price}</span>`;
  // Bundle (Buy-N) badge — shown if the product participates in any active bundle
  const bundlePromo = getProductBundlePromo(p);
  const bundleBadge = bundlePromo
    ? `<span class="card-bundle-badge" title="${bundlePromo.name}">📦 ${bundlePromo.bundleMinQty} ב-₪${bundlePromo.bundlePrice}</span>`
    : '';
  return `
    <article class="card ${isOut ? 'out-of-stock' : ''} ${promoInfo || bundlePromo ? 'has-promo' : ''}" data-id="${p.id}">
      <div class="card-img${customImage ? ' has-photo' : ''}">
        ${p.tag ? `<span class="card-tag ${tagClass}">${p.tag}</span>` : ''}
        ${promoBadge ? `<span class="card-promo-badge">🏷️ ${promoBadge}</span>` : ''}
        ${bundleBadge}
        <button class="card-fav ${fav ? 'active' : ''}" onclick="toggleFavorite(${p.id}, event)" aria-label="הוסף למועדפים" title="מועדפים">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        ${visualHTML}
        <button class="card-quick" onclick="openQuickView(${p.id})" aria-label="הצגה מהירה">הצגה מהירה</button>
      </div>
      <div class="card-body">
        <span class="card-cat">${catName}${p.brand ? ` · <span class="card-brand">${p.brand}</span>` : ''}</span>
        <h3 class="card-name">${p.name}</h3>
        <span class="card-stock ${stock.key}">${stock.label}</span>
        <span class="card-unit">${p.unit}${isVatExempt(p) ? ' · <b style="color:var(--green-2)">פטור ממע״מ</b>' : ''}</span>
        ${isOut ? `
          <button class="notify-when-back ${isNotifySubscribed(p.id) ? 'subscribed' : ''}" onclick="toggleStockNotify(${p.id}, this, event)" type="button"
                  aria-label="הודיעו לי כשחוזר למלאי">
            ${isNotifySubscribed(p.id) ? '✓ נודיע לכם כשחוזר' : '🔔 הודיעו לי כשחוזר למלאי'}
          </button>` : ''}
        <div class="card-foot">
          <div class="card-price-wrap">${priceHTML}</div>
          ${isOut
            ? `<button class="card-add" disabled aria-label="המוצר אזל מהמלאי" title="אזל מהמלאי">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </button>`
            : (inCart > 0
              ? qtyControlHTML(p.id, inCart)
              : `<button class="card-add" onclick="addToCart(${p.id}, this)" title="הוסף לסל" aria-label="הוסף ${p.name} לסל">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>`)
          }
        </div>
      </div>
    </article>
  `;
}

/* ---------- "NOTIFY WHEN BACK IN STOCK" SUBSCRIPTIONS ---------- */
function getStockNotifySubs() {
  try { return JSON.parse(localStorage.getItem('balasi_stock_notify') || '[]'); }
  catch (e) { return []; }
}
function isNotifySubscribed(id) {
  return getStockNotifySubs().includes(id);
}
function toggleStockNotify(id, btn, ev) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); }
  const subs = new Set(getStockNotifySubs());
  const p = PRODUCTS.find(x => x.id === id);
  if (subs.has(id)) {
    subs.delete(id);
    if (btn) {
      btn.classList.remove('subscribed');
      btn.textContent = '🔔 הודיעו לי כשחוזר למלאי';
    }
    showToast(`לא תקבלו עדכון על ${p?.name || 'המוצר'}`);
  } else {
    subs.add(id);
    if (btn) {
      btn.classList.add('subscribed');
      btn.textContent = '✓ נודיע לכם כשחוזר';
    }
    if (state.user?.email) {
      showToast(`✓ נודיע לכם במייל ${state.user.email} כש"${p?.name || 'המוצר'}" יחזור למלאי`);
    } else {
      showToast(`✓ נודיע לכם כש"${p?.name || 'המוצר'}" יחזור למלאי. כדאי להתחבר כדי שנדע איפה להגיע אליכם`);
    }
  }
  try { localStorage.setItem('balasi_stock_notify', JSON.stringify(Array.from(subs))); }
  catch (e) { /* quota */ }
}

function qtyControlHTML(id, qty) {
  const p = PRODUCTS.find(x => x.id === id);
  const productLabel = p ? p.name : 'המוצר';
  return `<div class="card-qty show" role="group" aria-label="כמות של ${productLabel}">
    <button type="button" onclick="changeQty(${id}, -1)" aria-label="הסר יחידה אחת מ-${productLabel}">−</button>
    <span aria-live="polite" aria-atomic="true">${qty}</span>
    <button type="button" onclick="changeQty(${id}, 1)" aria-label="הוסף יחידה אחת ל-${productLabel}">+</button>
  </div>`;
}

/* ---------- RENDER PRODUCTS ---------- */
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const list = getFilteredProducts();
  const _rc = document.getElementById('resCount'); if (_rc) _rc.textContent = `${list.length} מוצרים`;

  // re-render brands sidebar (so counts update with category filter)
  renderSideBrands();

  // active filter chip indicator
  const filterChip = document.getElementById('cbFilter');
  let tags = [];
  if (state.filter !== 'all') {
    const cat = CATEGORIES.find(c => c.id === state.filter);
    tags.push(`<span class="ft-pill">${cat.icon} ${cat.name} <button onclick="selectCategory('all')" aria-label="נקה">✕</button></span>`);
  }
  if (state.filter !== 'all' && state.subcat && state.subcat !== 'all') {
    const sub = findSubcategory(state.filter, state.subcat);
    if (sub) {
      tags.push(`<span class="ft-pill">${sub.icon || ''} ${sub.name} <button onclick="selectSubcategory('all')" aria-label="נקה">✕</button></span>`);
    }
  }
  if (state.brand !== 'all') {
    tags.push(`<span class="ft-pill">יצרן: ${state.brand} <button onclick="selectBrand('all')" aria-label="נקה">✕</button></span>`);
  }
  if (tags.length) {
    filterChip.innerHTML = tags.join(' ');
    filterChip.classList.add('show');
  } else {
    filterChip.classList.remove('show');
  }
  updateFilterCount();

  if (!list.length) {
    grid.innerHTML = `<div class="empty-grid">
      <div class="ic">🔍</div>
      <h3>לא נמצאו מוצרים</h3>
      <p>נסו לחפש בשם אחר או לבחור קטגוריה אחרת</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p => productCardHTML(p)).join('');
}

function toggleView() {
  state.view = state.view === 'grid' ? 'list' : 'grid';
  document.getElementById('productsGrid').classList.toggle('list-view', state.view === 'list');
}

/* ---------- EVENTS ---------- */
function attachEvents() {
  const search = document.getElementById('searchInput');
  const sug    = document.getElementById('searchSuggest');

  // Debounced search — typing on every keystroke shouldn't re-render the whole catalog
  let searchTimer;
  search.addEventListener('input', e => {
    const v = e.target.value;
    state.search = v;
    // Render suggestions instantly (small list of 8) for responsiveness
    renderSuggestions(v);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (typeof renderSubcatStrip === 'function') renderSubcatStrip();
      renderProducts();
    }, 220);
  });
  search.addEventListener('focus', () => { if (state.search) renderSuggestions(state.search); });
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      closeSearch();
      document.getElementById('products').scrollIntoView({ behavior:'smooth' });
    }
    if (e.key === 'Escape') closeSearch();
  });

  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sort = e.target.value;
    renderProducts();
  });
}

function renderSuggestions(q) {
  const sug = document.getElementById('searchSuggest');
  if (!q.trim()) { sug.classList.remove('open'); return; }
  const list = getFilteredProducts().slice(0, 8);
  // Build the suggestion list with DOM nodes (not innerHTML) so user input is never interpreted as markup.
  // This eliminates the XSS vector when the highlight() helper interpolates the search term.
  while (sug.firstChild) sug.removeChild(sug.firstChild);
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 's-empty';
    empty.textContent = 'לא נמצאו מוצרים תואמים';
    sug.appendChild(empty);
  } else {
    list.forEach(p => {
      const row = document.createElement('div');
      row.className = 's-row';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.onclick = () => goToProduct(p.id);
      row.onkeydown = ev => { if (ev.key === 'Enter') goToProduct(p.id); };

      const info = document.createElement('div');
      info.className = 's-info';
      const nameB = document.createElement('b');
      appendHighlightedText(nameB, p.name, q);
      const meta = document.createElement('span');
      const catName = CATEGORIES.find(c => c.id === p.cat)?.name || '';
      meta.textContent = `${p.icon} ${catName} · ${p.unit}`;
      info.appendChild(nameB);
      info.appendChild(meta);

      const price = document.createElement('div');
      price.className = 's-price';
      price.textContent = `₪${p.price}`;

      row.appendChild(info);
      row.appendChild(price);
      sug.appendChild(row);
    });
  }
  sug.classList.add('open');
}

/* Append text into `target` with the matching `q` substring wrapped in a styled <mark>.
   Uses textContent only — no innerHTML — so user input cannot become HTML. */
function appendHighlightedText(target, text, q) {
  if (!q) { target.textContent = text; return; }
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) { target.textContent = text; return; }
  target.appendChild(document.createTextNode(text.slice(0, idx)));
  const mark = document.createElement('mark');
  mark.style.cssText = 'background:#fff7e0;color:var(--brand);padding:0 2px;border-radius:3px';
  mark.textContent = text.slice(idx, idx + q.length);
  target.appendChild(mark);
  target.appendChild(document.createTextNode(text.slice(idx + q.length)));
}

function goToProduct(id) {
  closeSearch();
  document.getElementById('products').scrollIntoView({ behavior:'smooth' });
  setTimeout(() => {
    const el = document.querySelector(`#productsGrid .card[data-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior:'smooth', block:'center' });
      el.style.outline = '2px solid var(--gold)';
      el.style.outlineOffset = '4px';
      setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 2000);
    }
  }, 400);
}

/* ---------- CART ---------- */
function addToCart(id, btn) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  if (btn) {
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 350);
  }
  const p = PRODUCTS.find(x => x.id === id);
  showToast(`✓ ${p.name} נוסף לסל`);
  updateCartUI();
  updateProductCardQty(id);
  refreshAllRecommendations();
  // Fix: live-refresh open cart drawer
  if (document.getElementById('cartDrawer')?.classList.contains('open')) {
    renderCartDrawer();
  }
}

function changeQty(id, delta) {
  state.cart[id] = (state.cart[id] || 0) + delta;
  if (state.cart[id] <= 0) delete state.cart[id];
  saveCart();
  updateCartUI();
  updateProductCardQty(id);
  renderCartDrawer();
}

function removeFromCart(id) {
  delete state.cart[id];
  saveCart();
  updateCartUI();
  updateProductCardQty(id);
  renderCartDrawer();
}

/* Clear entire cart with confirmation dialog */
function clearCart() {
  const ids = Object.keys(state.cart).map(Number);
  if (!ids.length) return;
  const itemCount = Object.values(state.cart).reduce((s, q) => s + q, 0);
  const { subtotal } = getCartTotals();

  confirmDialog({
    title: 'ניקוי הסל',
    message: `
      <p>האם את/ה בטוח/ה שברצונך להסיר את <b>כל הפריטים</b> מהסל?</p>
      <div class="confirm-summary">
        <div class="cs-row"><span>פריטים בסל</span><b>${itemCount} פריטים</b></div>
        <div class="cs-row"><span>שווי הסל הנוכחי</span><b>₪${subtotal}</b></div>
      </div>
      <p class="confirm-note">הפעולה אינה הפיכה — לאחר ניקוי תצטרך להוסיף את המוצרים מחדש לסל.</p>
    `,
    confirmLabel: 'כן, נקה את הסל',
    cancelLabel: 'לא, השאר',
    danger: true,
    onConfirm: () => {
      state.cart = {};
      saveCart();
      updateCartUI();
      renderCartDrawer();
      // Refresh all visible product cards (remove qty controls, show "+" button)
      ids.forEach(id => updateProductCardQty(id));
      refreshAllRecommendations();
      showToast('הסל נוקה');
    }
  });
}

function updateProductCardQty(id) {
  // Update both featured and main grid card display
  document.querySelectorAll(`.card[data-id="${id}"]`).forEach(card => {
    const foot = card.querySelector('.card-foot');
    if (!foot) return;
    const qty = state.cart[id] || 0;
    const priceEl = foot.querySelector('.card-price');
    foot.innerHTML = '';
    foot.appendChild(priceEl);
    if (qty > 0) {
      foot.insertAdjacentHTML('beforeend', qtyControlHTML(id, qty));
    } else {
      foot.insertAdjacentHTML('beforeend', `
        <button class="card-add" onclick="addToCart(${id}, this)" title="הוסף לסל">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>`);
    }
  });
}

function getCartItems() {
  return Object.entries(state.cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === Number(id));
    if (!p) return null;
    // Apply product / category promotion (if any) to this line.
    // We attach the original price separately so the cart UI can show
    // both the strike-through original and the actual price charged.
    const promoInfo = getSiteProductPromo(p);
    if (promoInfo) {
      return {
        ...p, qty,
        originalPrice: promoInfo.originalPrice,
        price: promoInfo.finalPrice,
        promoBadge: getProductPromoBadge(p),
        appliedPromo: { id: promoInfo.promo.id, name: promoInfo.promo.name }
      };
    }
    return { ...p, qty, originalPrice: p.price };
  }).filter(Boolean);
}

/* Calculate cart totals.
   `opts.customer` — when known (e.g. typed into the checkout form),
   we use it to check first-order eligibility. If omitted, we fall
   back to `state.user` (a returning customer who is signed in).
   When neither is available we cannot apply the first-order discount
   automatically — the cart drawer will instead show a hint banner. */
function getCartTotals(opts) {
  const items = getCartItems();
  let subtotal = 0;          // Subtotal AFTER per-line product/category promos
  let originalSubtotal = 0;  // Subtotal BEFORE any promo (so we can show "saved X")
  let vatBase = 0;
  let exemptBase = 0;
  items.forEach(it => {
    const lineTotal = it.price * it.qty;
    const lineOriginal = (it.originalPrice || it.price) * it.qty;
    subtotal += lineTotal;
    originalSubtotal += lineOriginal;
    if (isVatExempt(it)) exemptBase += lineTotal;
    else vatBase += lineTotal;
  });
  const productPromoSaving = Math.round((originalSubtotal - subtotal) * 100) / 100;

  // BUNDLE discounts (Buy-N) — computed from ORIGINAL prices (not after
  // product/category discounts) so they don't double-discount.
  // Each matched bundle reduces the subtotal by its `savings` value.
  const bundleResults = siteCalcBundleDiscounts(items);
  const bundleSavings = bundleResults.reduce((s, b) => s + b.savings, 0);
  if (bundleSavings > 0) {
    subtotal = Math.round((subtotal - bundleSavings) * 100) / 100;
    // Distribute the bundle savings proportionally over taxable / exempt bases
    if (subtotal > 0 && (vatBase + exemptBase) > 0) {
      const ratio = subtotal / (vatBase + exemptBase);
      vatBase    = Math.round(vatBase * ratio * 100) / 100;
      exemptBase = Math.round(exemptBase * ratio * 100) / 100;
    }
  }

  // ORDER-LEVEL promotion (e.g., 5% off when subtotal > ₪800) — auto-applied.
  // The legacy "5% over ₪800" promo was retired on 2026-05-18 (see migration
  // above), but other order-threshold promos created later may still match.
  const orderPromo = siteGetOrderPromo(subtotal);
  const orderDiscount = orderPromo ? siteComputeDiscount(subtotal, orderPromo) : 0;

  // COUPON (typed at checkout) — applies to subtotal AFTER order-promo
  const couponCode = state.appliedCoupon || null;
  const coupon = couponCode ? siteValidateCoupon(couponCode) : null;
  const couponBaseSubtotal = subtotal - orderDiscount;
  const couponDiscount = coupon ? siteComputeDiscount(couponBaseSubtotal, coupon) : 0;

  // FIRST-ORDER DISCOUNT (5%) — applied on top of any product/order/coupon
  // discounts when the customer can be identified AND has no prior
  // non-cancelled order. Cart drawer (no customer info) falls back to
  // state.user; if neither is available the discount waits for checkout.
  const customerInfo = (opts && opts.customer)
    ? opts.customer
    : (state.user ? {
        email: state.user.email || '',
        customerNumber: state.user.customerNumber || '',
        taxId: state.user.taxId || ''
      } : null);
  const firstOrderEligible = customerInfo
    ? siteIsFirstOrderCustomer(customerInfo)
    : false;
  const firstOrderBase = subtotal - orderDiscount - couponDiscount;
  const firstOrderDiscount = (firstOrderEligible && firstOrderBase > 0)
    ? Math.round(firstOrderBase * (FIRST_ORDER_DISCOUNT_PCT / 100) * 100) / 100
    : 0;

  // Total discount applied at the order level (NOT counting product-line discounts)
  const orderLevelDiscount = Math.round((orderDiscount + couponDiscount + firstOrderDiscount) * 100) / 100;
  // Distribute order-level discount proportionally over taxable / exempt bases
  if (orderLevelDiscount > 0 && subtotal > 0) {
    const ratio = (subtotal - orderLevelDiscount) / subtotal;
    vatBase    = Math.round(vatBase * ratio * 100) / 100;
    exemptBase = Math.round(exemptBase * ratio * 100) / 100;
  }
  const subtotalAfter = subtotal - orderLevelDiscount;

  const shipping = (subtotalAfter >= 650 || subtotalAfter === 0) ? 0 : 26;
  // Shipping is always taxable.
  // ISRAELI VAT LAW: all amounts must be precise to the agora (0.01₪).
  // VAT calculated on the exact taxable base, then total = subtotal + shipping + VAT, all at 0.01.
  const vat = Math.round((vatBase + shipping) * VAT_RATE * 100) / 100;
  const total = Math.round((subtotalAfter + shipping + vat) * 100) / 100;
  const count = items.reduce((s, it) => s + it.qty, 0);

  return {
    items, subtotal: subtotalAfter, originalSubtotal, shipping, vat, total, count,
    vatBase, exemptBase,
    productPromoSaving,
    bundlePromos:  bundleResults.length ? bundleResults.map(b => ({
      id: b.promo.id, name: b.promo.name, bundles: b.bundles, savings: b.savings,
      bundleMinQty: b.promo.bundleMinQty, bundlePrice: b.promo.bundlePrice
    })) : [],
    bundleSavings,
    orderPromo:    orderPromo  ? { id: orderPromo.id,  name: orderPromo.name,  amount: orderDiscount }  : null,
    couponPromo:   coupon      ? { id: coupon.id,     name: coupon.name,     amount: couponDiscount, code: coupon.couponCode } : null,
    firstOrderPromo: firstOrderDiscount > 0
      ? { name: 'הנחת הזמנה ראשונה', amount: firstOrderDiscount, pct: FIRST_ORDER_DISCOUNT_PCT }
      : null,
    firstOrderEligible,
    totalSaved:    Math.round((productPromoSaving + bundleSavings + orderLevelDiscount) * 100) / 100
  };
}

/* Apply or clear a coupon code from the checkout form. Returns the
   validated promotion (or null) so the caller can show a confirmation. */
function applyCoupon(code) {
  if (!code) {
    state.appliedCoupon = null;
    if (typeof renderCartDrawer === 'function') renderCartDrawer();
    return null;
  }
  const promo = siteValidateCoupon(code);
  if (!promo) {
    state.appliedCoupon = null;
    return null;
  }
  state.appliedCoupon = String(code).trim().toUpperCase();
  if (typeof renderCartDrawer === 'function') renderCartDrawer();
  return promo;
}

function getMinForCity(city) {
  return SPECIAL_MIN_CITIES.includes(city) ? SPECIAL_MIN_AMOUNT : REGULAR_MIN_AMOUNT;
}

function updateCartUI() {
  const { count } = getCartTotals();
  document.getElementById('cartBadge').textContent = count;
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function renderCartDrawer() {
  const { items, subtotal, shipping, vat, total, count } = getCartTotals();
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  document.getElementById('cartCount').textContent = `${count} פריטים`;

  if (!items.length) {
    body.innerHTML = `<div class="cart-empty">
      <div class="ic">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </div>
      <h3>הסל ריק</h3>
      <p>הוסיפו מוצרים מהקטלוג כדי להתחיל הזמנה</p>
    </div>`;
    foot.style.display = 'none';
    return;
  }

  body.innerHTML = `
    <div class="cart-actions">
      <button class="cart-clear-btn" onclick="clearCart()" aria-label="נקה את הסל">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>ניקוי הסל</span>
      </button>
    </div>
  ` + items.map(it => `
    <div class="ci-row">
      <div class="ci-img">${it.icon}</div>
      <div class="ci-info">
        <b>${it.name}</b>
        <div class="sm">${it.unit}</div>
        <div class="ci-qty">
          <button onclick="changeQty(${it.id},-1)" aria-label="הפחת">−</button>
          <span>${it.qty}</span>
          <button onclick="changeQty(${it.id},1)" aria-label="הוסף">+</button>
        </div>
      </div>
      <div class="ci-r">
        <div class="ci-price">₪${it.price * it.qty}</div>
        <button class="ci-rm" onclick="removeFromCart(${it.id})">הסר</button>
      </div>
    </div>
  `).join('') + '<div id="cartRecs" class="rec-strip"></div>';
  foot.style.display = 'block';

  // Render smart recommendations strip
  const cartRecs = document.getElementById('cartRecs');
  if (cartRecs) {
    renderRecommendationStrip(cartRecs, {
      source:'cart',
      subtitle:'מוצרים שמשלימים את ההזמנה שלכם'
    });
  }

  // Free shipping progress bar
  const FREE_SHIP = 650;
  const minWarn = document.getElementById('minWarn');
  let warnHtml = '';

  // Free shipping progress (always shown)
  if (subtotal >= FREE_SHIP) {
    warnHtml += `<div class="ship-progress qualified">
      <div class="ship-progress-row">
        <span class="ship-progress-text">משלוח חינם זכאי לך! 🎉</span>
        <span class="ship-progress-icon">✓</span>
      </div>
      <div class="ship-bar"><div class="ship-bar-fill" style="width:100%"></div></div>
    </div>`;
  } else {
    const remaining = FREE_SHIP - subtotal;
    const percent = Math.min(100, Math.round((subtotal / FREE_SHIP) * 100));
    warnHtml += `<div class="ship-progress">
      <div class="ship-progress-row">
        <span class="ship-progress-text">עוד <b>₪${remaining}</b> ויש לך משלוח חינם</span>
        <span class="ship-progress-icon">🚚</span>
      </div>
      <div class="ship-bar"><div class="ship-bar-fill" style="width:${percent}%"></div></div>
    </div>`;
  }

  // Min order warnings (after shipping bar)
  const regMin = REGULAR_MIN_AMOUNT;
  if (subtotal < regMin) {
    warnHtml += `<div class="min-warning">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div><b>מינימום הזמנה ₪${regMin}</b>חסרים ₪${regMin - subtotal} ברוב הערים. ברמת השרון/הוד השרון המינימום ₪${SPECIAL_MIN_AMOUNT}.</div>
    </div>`;
  } else if (subtotal < SPECIAL_MIN_AMOUNT) {
    warnHtml += `<div class="min-warning ok">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <div><b>שימו לב:</b> ברמת השרון/הוד השרון מינימום ₪${SPECIAL_MIN_AMOUNT}. כעת חסרים ₪${SPECIAL_MIN_AMOUNT - subtotal}.</div>
    </div>`;
  }

  minWarn.innerHTML = warnHtml;

  document.getElementById('subtotal').textContent = `₪${subtotal}`;
  document.getElementById('shipping').textContent = shipping === 0 ? 'חינם' : `₪${shipping}`;
  // VAT label updates if exempt items are present
  const totalsAll = getCartTotals();
  const exemptBase = totalsAll.exemptBase;
  const vatLabel = document.querySelector('#cartFoot .totals .t-row:not(.promo-line):nth-of-type(3) span:first-child');
  if (vatLabel) {
    vatLabel.textContent = exemptBase > 0
      ? `מע"מ (18%, פטור ₪${exemptBase})`
      : 'מע"מ (18%)';
  }
  document.getElementById('vat').textContent = `₪${vat}`;
  document.getElementById('grandTotal').textContent = `₪${total}`;

  // ========== Promotion lines ==========
  // Per-product / per-category savings (already baked into subtotal, but
  // surfaced here so the customer sees how much they're saving)
  const savingLine = document.getElementById('promoSavingLine');
  if (savingLine) {
    if (totalsAll.productPromoSaving > 0) {
      savingLine.style.display = '';
      document.getElementById('promoSavingAmount').textContent = `−₪${totalsAll.productPromoSaving}`;
    } else savingLine.style.display = 'none';
  }
  // Bundle promotions (Buy-N) — one row per matched bundle
  const bundleLinesWrap = document.getElementById('bundlePromoLines');
  if (bundleLinesWrap) {
    if (totalsAll.bundlePromos && totalsAll.bundlePromos.length) {
      bundleLinesWrap.innerHTML = totalsAll.bundlePromos.map(b => `
        <div class="t-row promo-line">
          <span>📦 ${b.name} (×${b.bundles})</span>
          <span style="color:#1b7a3d;font-weight:700">−₪${b.savings}</span>
        </div>
      `).join('');
    } else {
      bundleLinesWrap.innerHTML = '';
    }
  }
  // Order-threshold promotion (e.g. 5% off when subtotal > ₪800)
  const orderLine = document.getElementById('orderPromoLine');
  if (orderLine) {
    if (totalsAll.orderPromo) {
      orderLine.style.display = '';
      document.getElementById('orderPromoLabel').textContent = totalsAll.orderPromo.name || 'הנחת סף הזמנה';
      document.getElementById('orderPromoAmount').textContent = `−₪${totalsAll.orderPromo.amount}`;
    } else orderLine.style.display = 'none';
  }
  // First-order discount line + green confirmation banner.
  // Yellow hint banner shows when we can't yet confirm (anonymous visitor).
  const firstOrderLine    = document.getElementById('firstOrderPromoLine');
  const firstOrderHint    = document.getElementById('firstOrderHintBanner');
  const firstOrderApplied = document.getElementById('firstOrderAppliedBanner');
  if (firstOrderLine && firstOrderHint && firstOrderApplied) {
    if (totalsAll.firstOrderPromo) {
      firstOrderLine.style.display = '';
      document.getElementById('firstOrderPromoLabel').textContent =
        `${totalsAll.firstOrderPromo.name} — ${totalsAll.firstOrderPromo.pct}%`;
      document.getElementById('firstOrderPromoAmount').textContent =
        `−₪${totalsAll.firstOrderPromo.amount}`;
      firstOrderApplied.style.display = '';
      firstOrderHint.style.display = 'none';
    } else {
      firstOrderLine.style.display = 'none';
      firstOrderApplied.style.display = 'none';
      // Show the hint only to truly anonymous visitors (no signed-in user)
      firstOrderHint.style.display = (state.user && state.user.email) ? 'none' : '';
    }
  }
  // Coupon
  const couponLine = document.getElementById('couponPromoLine');
  if (couponLine) {
    if (totalsAll.couponPromo) {
      couponLine.style.display = '';
      document.getElementById('couponPromoLabel').textContent = `קופון "${totalsAll.couponPromo.code}"`;
      document.getElementById('couponPromoAmount').textContent = `−₪${totalsAll.couponPromo.amount}`;
    } else couponLine.style.display = 'none';
  }
  // Coupon input — sync field with current state
  const couponInput = document.getElementById('couponCodeInput');
  const couponMsg   = document.getElementById('couponMsg');
  if (couponInput) {
    couponInput.value = state.appliedCoupon || '';
    if (couponMsg) {
      // SECURITY: build via DOM not innerHTML — avoids XSS from user-typed coupon code
      couponMsg.textContent = '';
      if (totalsAll.couponPromo) {
        const ok = document.createElement('span');
        ok.style.cssText = 'color:#1b7a3d;font-weight:700';
        ok.textContent = `✓ ${totalsAll.couponPromo.name} הוחל`;
        const sep = document.createTextNode(' · ');
        const link = document.createElement('a');
        link.href = '#'; link.textContent = 'הסר';
        link.addEventListener('click', (e) => { e.preventDefault(); removeCoupon(); });
        couponMsg.append(ok, sep, link);
      } else if (state.appliedCoupon) {
        const warn = document.createElement('span');
        warn.style.color = '#a14a2c';
        warn.textContent = `⚠️ הקוד "${state.appliedCoupon}" לא תקף או פג תוקף`;
        couponMsg.appendChild(warn);
      }
    }
  }
}

/* Cart-drawer button handler: read the coupon input and try to apply it */
function applyCouponFromCart() {
  const inp = document.getElementById('couponCodeInput');
  if (!inp) return;
  const code = inp.value.trim();
  if (!code) {
    showToast('יש להקליד קוד קופון');
    return;
  }
  const promo = applyCoupon(code);
  if (promo) {
    showToast(`✓ קופון "${promo.couponCode}" הוחל — ${promo.name}`);
  } else {
    showToast('הקוד לא תקף או פג תוקף', 'error');
  }
}

function removeCoupon() {
  applyCoupon(null);
  showToast('הקופון הוסר');
}

/* ---------- TOAST ---------- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  // A11Y: announce to screen-readers via the global aria-live region
  const sr = document.getElementById('srAnnouncer');
  if (sr) { sr.textContent = ''; setTimeout(() => { sr.textContent = msg; }, 50); }
}

/* ---------- CHECKOUT ---------- */
function openCheckout() {
  const { items, subtotal } = getCartTotals();
  if (!items.length) {
    showToast('הסל ריק — הוסיפו מוצרים תחילה');
    return;
  }
  if (subtotal < REGULAR_MIN_AMOUNT) {
    showToast(`מינימום הזמנה ₪${REGULAR_MIN_AMOUNT}. חסרים עוד ₪${REGULAR_MIN_AMOUNT - subtotal}`);
    return;
  }
  renderOrderSummary();
  closeCart();
  document.getElementById('checkoutModal').classList.add('open');
  prefillCheckoutForm();
  attachEmailLookupListener();
  attachFirstOrderRecalcListeners();
  // Re-render summary after prefill so a logged-in returning customer
  // doesn't see the discount line erroneously.
  renderOrderSummary();
  // Set min date for the specific-date picker (today, in YYYY-MM-DD format)
  const dateInput = document.getElementById('specificDateInput');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
    // Default to tomorrow as a reasonable starting point
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (!dateInput.value) {
      dateInput.value = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
    }
  }
}

/* Show/hide the specific-date picker when user picks "תאריך ספציפי".
   Also toggle 'required' so the form validates correctly. */
function onDeliveryDateChange(value) {
  const wrap = document.getElementById('specificDateField');
  const input = document.getElementById('specificDateInput');
  if (!wrap || !input) return;
  if (value === 'specific') {
    wrap.style.display = '';
    input.required = true;
    setTimeout(() => input.focus(), 50);
  } else {
    wrap.style.display = 'none';
    input.required = false;
  }
}

/* Reveal/hide the שוטף+30 payment card. Hidden by default so new
   customers default to credit card; only customers who actively look
   for net-30 terms will see it. */
function toggleNet30() {
  const btn  = document.getElementById('net30Toggle');
  const card = document.getElementById('net30Card');
  const notice = document.getElementById('net30Notice');
  if (!btn || !card) return;
  const isOpen = !card.hidden;
  if (isOpen) {
    // Closing — if net30 was selected, fall back to credit so the
    // form still has a valid selection.
    const radio = card.querySelector('input[type=radio]');
    if (radio && radio.checked) {
      const creditRadio = document.querySelector('input[name="payment"][value="credit"]');
      if (creditRadio) creditRadio.checked = true;
    }
    card.hidden = true;
    if (notice) notice.hidden = true; // always reset on close, regardless of prior state
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'לקוחות עסקיים גדולים — תנאי תשלום מיוחדים ›';
  } else {
    card.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    btn.textContent = 'הסתר אפשרות זו ‹';
  }
}

/* Show/hide the "subject to approval" notice when net30 is selected. */
function onNet30Change(radio) {
  const notice = document.getElementById('net30Notice');
  if (!notice) return;
  notice.hidden = !radio.checked;
}

/* When any other payment option is picked, hide the net30 notice. */
document.addEventListener('change', function(e) {
  if (e.target && e.target.name === 'payment' && e.target.value !== 'net30') {
    const notice = document.getElementById('net30Notice');
    if (notice) notice.hidden = true;
  }
});

/* Pre-fill the checkout form from logged-in user's saved profile */
function prefillCheckoutForm() {
  if (!state.user || !state.user.email) {
    // Even when not logged in, reset the customerNumber field to a free input
    swapCustomerNumberToInput();
    return;
  }
  const profile = findProfileByEmail(state.user.email);

  // Always check for accounts — even if no profile exists yet, the user may
  // be a returning customer whose company has multiple customer numbers.
  const accounts = getCustomerAccountsForEmail(state.user.email);
  swapCustomerNumberFieldByAccounts(accounts, profile?.customerNumber);

  if (!profile) return;
  fillCheckoutFieldsFromProfile(profile, true);
}

/* Replace the customerNumber input with a styled select listing the accounts
   available to this user. Always shows the dropdown when there is at least
   one identified account (so the user clearly sees their customer number)
   plus an "אחר / חדש" option for typing a different one if needed. */
function swapCustomerNumberFieldByAccounts(accounts, preferredValue) {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const wrapField = form.querySelector('[name="customerNumber"]')?.closest('.field');
  if (!wrapField) return;

  // No accounts at all → keep text input
  if (!accounts || !accounts.length) {
    swapCustomerNumberToInput(preferredValue || '');
    return;
  }

  // Group accounts by company (in case user has access to multiple companies)
  const byCompany = {};
  accounts.forEach(a => {
    const k = a.companyName || '—';
    if (!byCompany[k]) byCompany[k] = [];
    byCompany[k].push(a);
  });

  const optionsHtml = Object.entries(byCompany).map(([cName, accs]) => {
    // Wrap in optgroup only if user has access to multiple companies
    const useGroup = Object.keys(byCompany).length > 1;
    const opts = accs.map(a => {
      const label = `${a.customerNumber} — ${a.label}` + (a.isPrimary ? ' (ראשי)' : '');
      const sel = preferredValue && a.customerNumber === preferredValue ? 'selected' : '';
      // The select VALUE is a composite token "accountId|companyId|customerNumber"
      // so the admin can match the chosen account exactly — even if two accounts
      // share the same customerNumber, or if a customerNumber is empty.
      const composite = `${a.accountId || ''}|${a.companyId || ''}|${a.customerNumber || ''}`;
      return `<option value="${composite}" data-customer-number="${a.customerNumber}" data-account-label="${a.label}" ${sel}>${label}</option>`;
    }).join('');
    return useGroup ? `<optgroup label="${cName}">${opts}</optgroup>` : opts;
  }).join('');

  // Default: primary account if no preferred value
  const defaultVal = preferredValue || accounts.find(a => a.isPrimary)?.customerNumber || accounts[0].customerNumber;
  const multiCompany = Object.keys(byCompany).length > 1;
  const headerHint = multiCompany
    ? `${accounts.length} חשבונות זמינים ב-${Object.keys(byCompany).length} חברות`
    : `${accounts.length} ${accounts.length === 1 ? 'חשבון רשום בחברה שלכם' : 'חשבונות זמינים בחברה שלכם'}`;

  // Find the composite token that matches our default customerNumber
  const defaultAcc = accounts.find(a => a.customerNumber === defaultVal) || accounts[0];
  const defaultComposite = `${defaultAcc.accountId || ''}|${defaultAcc.companyId || ''}|${defaultAcc.customerNumber || ''}`;

  wrapField.innerHTML = `
    <label>מספר לקוח <span class="muted">(${multiCompany ? 'לפי החברות שלכם' : 'לפי החברה שלכם'})</span></label>
    <select name="customerAccount" class="cust-num-select" onchange="onCustomerNumberChange(this.value)">
      ${optionsHtml}
      <option value="__OTHER__">+ הזן מספר אחר ידנית</option>
    </select>
    <input type="hidden" name="customerNumber" value="${defaultAcc.customerNumber || ''}" />
    <input type="hidden" name="accountId" value="${defaultAcc.accountId || ''}" />
    <input type="hidden" name="companyAdminId" value="${defaultAcc.companyId || ''}" />
    <input type="hidden" name="accountLabel" value="${defaultAcc.label || ''}" />
    <div class="field-hint">${headerHint}</div>
  `;
  // Apply default value
  const sel = wrapField.querySelector('select');
  if (sel) sel.value = defaultComposite;
}

function swapCustomerNumberToInput(value) {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const existing = form.querySelector('[name="customerNumber"]');
  if (!existing) return;
  // If already an input, just set its value
  if (existing.tagName === 'INPUT') {
    if (value) existing.value = value;
    return;
  }
  // Replace select back with input
  const wrap = existing.closest('.field');
  if (!wrap) return;
  wrap.innerHTML = `
    <label>מספר לקוח <span class="muted">(אם יש)</span></label>
    <input type="text" name="customerNumber" placeholder="לדוגמה 12345" value="${value || ''}" />
  `;
}

/* When user picks an account from the dropdown, optionally update other fields
   (e.g., payment method based on account's pay terms). The composite parameter
   has the format "accountId|companyId|customerNumber". */
function onCustomerNumberChange(composite) {
  // Special: "+ הזן מספר אחר ידנית" → swap back to free text input
  if (composite === '__OTHER__') {
    swapCustomerNumberToInput('');
    setTimeout(() => {
      const inp = document.querySelector('#checkoutForm [name="customerNumber"]');
      if (inp && inp.tagName === 'INPUT') inp.focus();
    }, 60);
    return;
  }

  // Parse composite "accountId|companyId|customerNumber"
  const parts = String(composite).split('|');
  const accountId = parts[0] || '';
  const companyId = parts[1] || '';
  const customerNumberFromComposite = parts[2] || '';

  // Read the LABEL straight off the selected option element — guaranteed correct.
  const sel = document.querySelector('#checkoutForm [name="customerAccount"]');
  const selectedOpt = sel?.options[sel.selectedIndex];
  const labelFromOption = selectedOpt?.dataset.accountLabel || '';
  const cnFromOption = selectedOpt?.dataset.customerNumber || customerNumberFromComposite;

  // ALWAYS update the hidden fields from the parsed composite — even if the
  // accounts list lookup fails. This guarantees the admin gets the user's choice.
  const setHidden = (name, val) => {
    const el = document.querySelector(`#checkoutForm [name="${name}"]`);
    if (el) el.value = val;
  };
  setHidden('customerNumber', cnFromOption);
  setHidden('accountId',      accountId);
  setHidden('companyAdminId', companyId);
  setHidden('accountLabel',   labelFromOption);

  // CASCADE REFRESH: when the user picks a different account/company in the dropdown,
  // ALL company-derived fields must be reloaded fresh from the admin DB.
  // Without this, switching from "Hi-Tech Lab" to "david balasi" leaves the OLD
  // taxId, company name, and delivery address in the form — and they end up on
  // the resulting invoice. This is critical for multi-company contacts.
  try {
    const adminCompanies = JSON.parse(localStorage.getItem('admin_companies') || '[]');
    const company = adminCompanies.find(c => String(c.id) === String(companyId));
    if (company) {
      const setVis = (name, val) => {
        const el = document.querySelector(`#checkoutForm [name="${name}"]`);
        if (!el) return;
        if (el.tagName === 'SELECT') {
          if (Array.from(el.options).some(o => o.value === val)) el.value = val;
        } else {
          el.value = (val == null) ? '' : val;
        }
      };
      setVis('companyName', company.name);
      setVis('taxId',       company.taxId);
      setVis('invoiceName', company.name);
      const branch = (company.branches || []).find(b => b.isPrimary) || (company.branches || [])[0];
      if (branch) {
        let street = branch.address || '';
        let city   = branch.city || '';
        if (!city && street.includes(',')) {
          const parts = street.split(',');
          street = parts[0].trim();
          city   = parts.slice(1).join(',').trim();
        }
        setVis('street', street);
        setVis('city',   city);
        setVis('zip',    branch.zip);
      }
    }
  } catch (e) { /* non-fatal — fields just won't refresh */ }

  // Optional: update payment method based on account's pay terms
  if (!state.user || !state.user.email) return;
  const accounts = getCustomerAccountsForEmail(state.user.email);
  const acc = accounts.find(a => String(a.accountId) === accountId);
  if (!acc) return;
  // Map admin pay terms to checkout-form payment values
  const paymentMap = { net30:'net30', credit:'credit', net45:'net30', net60:'net30' };
  const payment = paymentMap[acc.payTerms];
  if (payment) {
    selectPaymentRadio(payment);
  }
  showToast(`חשבון ${acc.label} נבחר`);
}

/* Select a payment-method radio by value. If selecting net30, also
   reveal the toggled card and the "subject to approval" notice so the
   selection is actually visible on the form. */
function selectPaymentRadio(value) {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const radio = form.querySelector(`input[name="payment"][value="${value}"]`);
  if (!radio) return;
  radio.checked = true;
  if (value === 'net30') {
    const card = document.getElementById('net30Card');
    const btn  = document.getElementById('net30Toggle');
    const notice = document.getElementById('net30Notice');
    if (card)   card.hidden = false;
    if (btn)  { btn.setAttribute('aria-expanded', 'true'); btn.textContent = 'הסתר אפשרות זו ‹'; }
    if (notice) notice.hidden = false;
  } else {
    const notice = document.getElementById('net30Notice');
    if (notice) notice.hidden = true;
  }
}

function fillCheckoutFieldsFromProfile(profile, showBanner) {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const setVal = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el && (val !== undefined && val !== null && val !== '')) el.value = val;
  };
  setVal('companyName',   profile.companyName);
  setVal('taxId',         profile.taxId);
  setVal('invoiceName',   profile.invoiceName);
  setVal('customerNumber',profile.customerNumber);
  setVal('contactName',   profile.contactName);
  setVal('contactRole',   profile.contactRole);
  setVal('phone',         profile.phone);
  setVal('email',         profile.email);
  setVal('street',        profile.street);
  setVal('city',          profile.city);
  setVal('zip',           profile.zip);
  setVal('floor',         profile.floor);
  if (profile.payment) selectPaymentRadio(profile.payment);

  if (showBanner) showAutofillBanner(profile);
}

function showAutofillBanner(profile) {
  const body = document.getElementById('checkoutBody');
  if (!body) return;
  // Remove old banner if exists
  const old = document.getElementById('autofillBanner');
  if (old) old.remove();
  const fromAdmin = profile && profile._source === 'admin';
  const banner = document.createElement('div');
  banner.id = 'autofillBanner';
  banner.style.cssText = `
    background:linear-gradient(135deg,var(--green-bg,#e3f2e8),var(--cream-2,#fff8e1));
    border-right:3px solid var(--green-2,#155f30);
    padding:12px 14px;margin:0 0 18px;display:flex;align-items:flex-start;gap:10px;
    font-size:13px;color:var(--ink);line-height:1.55;
  `;
  const subtitle = fromAdmin
    ? 'זוהית ממאגר הלקוחות שלנו. מילאנו עבורך את הפרטים — אפשר לערוך כל שדה.'
    : 'מילאנו עבורך פרטים שזכרנו מההזמנה האחרונה. אפשר לערוך כל שדה.';
  banner.innerHTML = `
    <span style="font-size:18px">⚡</span>
    <div style="flex:1">
      <b>${fromAdmin ? 'זיהינו אותך ממאגר הלקוחות' : 'השלמה אוטומטית מהפעם הקודמת'}</b>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">${subtitle}</div>
    </div>
    <button onclick="clearCheckoutAutofill()" style="background:none;border:0;color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;text-decoration:underline">נקה</button>
  `;
  const form = body.querySelector('#checkoutForm');
  if (form) form.insertBefore(banner, form.firstChild);
}

function clearCheckoutAutofill() {
  const form = document.getElementById('checkoutForm');
  if (form) form.reset();
  document.getElementById('autofillBanner')?.remove();
}

/* Email lookup: when user types a known email, offer to auto-fill */
function attachEmailLookupListener() {
  const emailInput = document.querySelector('#checkoutForm [name="email"]');
  if (!emailInput) return;
  let suggestionEl = null;
  emailInput.addEventListener('blur', () => {
    const v = (emailInput.value || '').trim().toLowerCase();
    if (!v || !v.includes('@')) return;
    // If the email matches a saved profile we haven't auto-filled from already
    const profile = findProfileByEmail(v);
    if (!profile) return;
    // If form already has the company name from this profile, skip
    const compInput = document.querySelector('#checkoutForm [name="companyName"]');
    if (compInput && compInput.value === profile.companyName) return;
    if (suggestionEl) suggestionEl.remove();
    suggestionEl = document.createElement('div');
    suggestionEl.style.cssText = `
      background:var(--green-bg,#e3f2e8);border:1.5px solid var(--green,#1b7a3d);
      padding:10px 14px;margin-top:6px;font-size:12.5px;display:flex;align-items:center;gap:10px;
    `;
    suggestionEl.innerHTML = `
      <span style="font-size:16px">👋</span>
      <div style="flex:1">
        <b>זיהינו אותך!</b><br>
        <span style="color:var(--muted)">דוא"ל זה שייך ל<b>${profile.companyName}</b>. למלא את שאר הפרטים?</span>
      </div>
      <button type="button" id="acceptAutofillBtn" style="background:var(--green,#1b7a3d);color:#fff;border:0;padding:7px 14px;font-size:11.5px;font-weight:700;letter-spacing:.04em;cursor:pointer">השלם פרטים</button>
      <button type="button" id="dismissAutofillBtn" style="background:none;border:0;color:var(--muted);font-size:11px;cursor:pointer">לא תודה</button>
    `;
    emailInput.parentElement.appendChild(suggestionEl);
    document.getElementById('acceptAutofillBtn').onclick = () => {
      fillCheckoutFieldsFromProfile(profile, true);
      // Also offer the customerNumber dropdown if the company has multiple accounts
      const accounts = getCustomerAccountsForEmail(v);
      swapCustomerNumberFieldByAccounts(accounts, profile.customerNumber);
      suggestionEl.remove();
      suggestionEl = null;
    };
    document.getElementById('dismissAutofillBtn').onclick = () => {
      suggestionEl.remove();
      suggestionEl = null;
    };
  });
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

function onCityChange() {
  const sel = document.getElementById('cityField');
  state.selectedCity = sel.value;
  validateCityMin();
  // Surface the minimum-order banner inline so the user sees the implication of choosing the city
  const banner = document.getElementById('cityMinBanner');
  if (banner && state.selectedCity) {
    const min = getMinForCity(state.selectedCity);
    const { subtotal } = getCartTotals();
    if (subtotal >= min) {
      banner.className = 'city-min-banner ok';
      banner.textContent = `✓ ב${state.selectedCity}: מינימום הזמנה ₪${min} — הסל עומד בדרישה (₪${subtotal})`;
    } else {
      banner.className = 'city-min-banner warn';
      banner.textContent = `⚠️ ב${state.selectedCity} מינימום הזמנה ₪${min}. חסרים ₪${min - subtotal} כדי להשלים את ההזמנה`;
    }
    banner.style.display = '';
  } else if (banner) {
    banner.style.display = 'none';
  }
}

function validateCityMin() {
  const { subtotal } = getCartTotals();
  const sel = document.getElementById('cityField');
  if (!state.selectedCity) return true;
  const min = getMinForCity(state.selectedCity);
  const fieldEl = sel.closest('.field');
  if (subtotal < min) {
    fieldEl.classList.add('error');
    const errEl = fieldEl.querySelector('.err');
    if (errEl) errEl.textContent =
      `ב${state.selectedCity} מינימום הזמנה ₪${min}. סכום נוכחי ₪${subtotal}, חסרים ₪${min - subtotal}`;
    return false;
  }
  fieldEl.classList.remove('error');
  return true;
}

/* Pull the customer-identifying fields from whichever values the user has
   typed into the checkout form. Returns null until they've filled at least
   one identifier — that's how we avoid showing the discount prematurely. */
function getCheckoutCustomerInfo() {
  const form = document.getElementById('checkoutForm');
  if (!form) return null;
  const email          = (form.querySelector('[name="email"]')?.value || '').trim().toLowerCase();
  const customerNumber = (form.querySelector('[name="customerNumber"]')?.value || '').trim();
  const taxId          = (form.querySelector('[name="taxId"]')?.value || '').trim();
  if (!email && !customerNumber && !taxId) return null;
  return { email, customerNumber, taxId };
}

function renderOrderSummary() {
  // Pass form-typed customer info so the 5% first-order line shows up live
  // as soon as the user has entered email / customerNumber / taxId.
  const customer = getCheckoutCustomerInfo();
  const totals = getCartTotals({ customer });
  const { items, total, subtotal, shipping, vat, firstOrderPromo, orderPromo, couponPromo } = totals;

  // Item lines
  const itemsHtml = items.map(it => `
    <div><span>${it.icon} ${it.name} × ${it.qty}</span><span>₪${it.price * it.qty}</span></div>
  `).join('');

  // Build promotion lines (only those that actually apply)
  const promoLines = [];
  if (orderPromo) {
    promoLines.push(
      `<div style="color:#1b7a3d;font-weight:700"><span>${orderPromo.name}</span><span>−₪${orderPromo.amount}</span></div>`
    );
  }
  if (firstOrderPromo) {
    promoLines.push(
      `<div style="color:#1b7a3d;font-weight:700"><span>${firstOrderPromo.name} — ${firstOrderPromo.pct}%</span><span>−₪${firstOrderPromo.amount}</span></div>`
    );
  }
  if (couponPromo) {
    promoLines.push(
      `<div style="color:#1b7a3d;font-weight:700"><span>קופון "${couponPromo.code}"</span><span>−₪${couponPromo.amount}</span></div>`
    );
  }

  const breakdown = `
    <div style="border-top:1px solid var(--line,#e0dccd);padding-top:8px;margin-top:8px">
      <div><span>סכום ביניים</span><span>₪${subtotal}</span></div>
      ${promoLines.join('')}
      <div><span>משלוח</span><span>${shipping === 0 ? 'חינם' : '₪' + shipping}</span></div>
      <div><span>מע"מ (18%)</span><span>₪${vat}</span></div>
    </div>
  `;

  document.getElementById('orderSummary').innerHTML = itemsHtml + breakdown;
  document.getElementById('orderTotal').textContent = `₪${total}`;

  // Green "applied" banner above the summary block.
  // Insert/remove dynamically so existing layout is untouched when not needed.
  const summaryBox = document.querySelector('#checkoutBody .summary');
  let banner = document.getElementById('checkoutFirstOrderBanner');
  if (firstOrderPromo) {
    if (!banner && summaryBox) {
      banner = document.createElement('div');
      banner.id = 'checkoutFirstOrderBanner';
      banner.className = 'first-order-applied';
      banner.innerHTML = '<span class="foa-icon" aria-hidden="true">✨</span>' +
                         '<span class="foa-text">ההזמנה הראשונה שלך — <b>5% הנחה</b> הוחלו אוטומטית</span>';
      summaryBox.insertBefore(banner, summaryBox.firstChild);
    }
  } else if (banner) {
    banner.remove();
  }
}

/* Re-render the checkout summary whenever the customer types into any of
   the fields that affect first-order eligibility. Wired up once, when the
   checkout modal opens. */
function attachFirstOrderRecalcListeners() {
  const form = document.getElementById('checkoutForm');
  if (!form || form.dataset.firstOrderHook === '1') return;
  ['email', 'customerNumber', 'taxId'].forEach(name => {
    const el = form.querySelector(`[name="${name}"]`);
    if (!el) return;
    el.addEventListener('input', () => renderOrderSummary());
    el.addEventListener('change', () => renderOrderSummary());
    el.addEventListener('blur', () => renderOrderSummary());
  });
  form.dataset.firstOrderHook = '1';
}

/* The verbatim text shown next to the marketing-consent checkbox —
   stored on every accepted consent so the legal record is self-contained. */
const MARKETING_CONSENT_TEXT = 'אני מסכים/ה לקבל דיוור פרסומי על מבצעים, מוצרים חדשים והטבות במייל';

/* Build a consent-evidence record for a single agreement event.
   Designed to be self-contained: we capture the exact version of
   each document, the verbatim text shown, browser fingerprint data,
   and a precise timestamp. This is what we'd need in a future dispute
   to prove the customer actually agreed.
   `marketingConsent` is captured SEPARATELY from terms — required by
   תיקון 40 לחוק התקשורת which mandates an opt-in (not pre-checked)
   checkbox specifically for promotional emails. */
function buildConsentEvidence({ orderNumber, email, marketingConsent }) {
  return {
    orderNumber,
    email,
    consentedAt: new Date().toISOString(),
    termsVersion:   TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    consentText:    CONSENT_TEXT,
    // Marketing-emails consent recorded as its own field with its own
    // text, so revoking marketing consent later doesn't affect the
    // separate (and required) terms-and-privacy consent.
    marketing: {
      granted: !!marketingConsent,
      text:    marketingConsent ? MARKETING_CONSENT_TEXT : null,
      grantedAt: marketingConsent ? new Date().toISOString() : null
    },
    // Browser fingerprint — these are NOT a strong identifier, but they
    // help corroborate the claim that this device was used at this time.
    userAgent:  (navigator.userAgent || '').slice(0, 500),
    language:   navigator.language || '',
    timezone:   (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
    screen:     (typeof screen !== 'undefined') ? `${screen.width}x${screen.height}` : '',
    referrer:   (document.referrer || '').slice(0, 200),
    pageUrl:    (location.href || '').slice(0, 300),
    // IP address can only be captured server-side; placeholder kept so
    // when a real backend lands, we know where to fill it in.
    ipAddress:  null
  };
}

/* Append a consent record to a long-lived log that survives even if the
   related order is later deleted. Israeli privacy law requires we be able
   to prove consent for as long as the data is retained. */
function appendConsentLog(record) {
  try {
    const log = JSON.parse(localStorage.getItem('balasi_consent_log') || '[]');
    log.push(record);
    // Soft cap to avoid bloating localStorage indefinitely (keep last 10,000)
    const trimmed = log.length > 10000 ? log.slice(-10000) : log;
    localStorage.setItem('balasi_consent_log', JSON.stringify(trimmed));
  } catch (err) {
    console.warn('[consent] failed to append to log', err);
  }
}

function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  let valid = true;
  form.querySelectorAll('.field').forEach(f => f.classList.remove('error'));

  ['companyName','taxId','invoiceName','contactName','phone','email','street','city','deliveryDate','payment'].forEach(name => {
    const input = form.querySelector(`[name="${name}"]`);
    if (input && !input.value.trim()) { input.closest('.field').classList.add('error'); valid = false; }
  });
  if (data.taxId && !/^\d{8,9}$/.test(data.taxId)) { form.querySelector('[name="taxId"]').closest('.field').classList.add('error'); valid = false; }
  if (data.phone && !/^0\d{8,9}$/.test(data.phone)) { form.querySelector('[name="phone"]').closest('.field').classList.add('error'); valid = false; }
  if (data.email && !/.+@.+\..+/.test(data.email)) { form.querySelector('[name="email"]').closest('.field').classList.add('error'); valid = false; }
  if (!form.querySelector('[name="terms"]').checked) { showToast('יש לאשר את תנאי השימוש'); valid = false; }

  const { subtotal } = getCartTotals();
  if (data.city) {
    const min = getMinForCity(data.city);
    if (subtotal < min) {
      const cityField = form.querySelector('[name="city"]').closest('.field');
      cityField.classList.add('error');
      cityField.querySelector('.err').textContent = `ב${data.city} מינימום הזמנה ₪${min}. סכום נוכחי ₪${subtotal}, חסרים ₪${min - subtotal}`;
      valid = false;
      showToast(`מינימום הזמנה ב${data.city} הוא ₪${min}`);
    }
  }

  if (!valid) {
    document.querySelector('.field.error')?.scrollIntoView({ behavior:'smooth', block:'center' });
    showToast('יש להשלים את השדות המסומנים');
    return;
  }

  const orderNum = 'BLS-' + Date.now().toString().slice(-8);
  // Pass the form-typed customer info so first-order eligibility is
  // re-evaluated authoritatively at submit time (not via stale UI state).
  const cartTotals = getCartTotals({
    customer: {
      email: (data.email || '').trim().toLowerCase(),
      customerNumber: (data.customerNumber || '').trim(),
      taxId: (data.taxId || '').trim()
    }
  });
  const { total, items } = cartTotals;

  // === SAVE/UPDATE CUSTOMER PROFILE for future auto-fill + recognition ===
  const profile = {
    companyName: data.companyName,
    taxId: data.taxId,
    invoiceName: data.invoiceName,
    customerNumber: data.customerNumber || (state.user?.customerNumber || ''),
    contactName: data.contactName,
    contactRole: data.contactRole || '',
    phone: data.phone,
    email: data.email,
    street: data.street,
    city: data.city,
    zip: data.zip || '',
    floor: data.floor || '',
    payment: data.payment,
    lastOrderAt: new Date().toISOString()
  };
  saveCustomerProfile(data.email, profile);

  // If user wasn't logged in but is now placing an order, log them in automatically
  if (!state.user || state.user.email !== data.email) {
    state.user = {
      email: data.email,
      name: data.contactName || data.email.split('@')[0],
      customerNumber: profile.customerNumber,
      company: data.companyName,
      loggedAt: new Date().toISOString()
    };
    saveUser();
    updateLoginUI();
  }

  // === PUSH ORDER TO ADMIN QUEUE ===
  try {
    const queue = JSON.parse(localStorage.getItem('balasi_pending_orders') || '[]');
    const sitePayload = {
      orderNumber: orderNum,
      timestamp: new Date().toISOString(),
      customer: {
        companyName: data.companyName,
        taxId: data.taxId,
        invoiceName: data.invoiceName,
        contactName: data.contactName,
        contactRole: data.contactRole || '',
        phone: data.phone,
        email: data.email,
        customerNumber: data.customerNumber || null,
        accountId: data.accountId || null,         // exact account the customer picked
        accountLabel: data.accountLabel || null,   // human-readable label (e.g., "מוצרי מזון")
        companyAdminId: data.companyAdminId || null // company id in admin DB (when known)
      },
      delivery: {
        street: data.street,
        city: data.city,
        zip: data.zip || '',
        floor: data.floor || '',
        notes: data.deliveryNotes || '',
        // If user picked "specific", use the actual date they entered; otherwise the keyword
        date: (data.deliveryDate === 'specific' && data.specificDate) ? data.specificDate : data.deliveryDate,
        dateOption: data.deliveryDate, // keep the original choice for display purposes
        time: data.deliveryTime || ''
      },
      payment: {
        method: data.payment,
        po: data.po || ''
      },
      substitutionPref: data.substitutionPref || 'allow',  // 'allow' = ok to substitute, 'remove' = just remove if missing
      items: items.map(it => ({
        pid: it.id,
        name: it.name,
        unit: it.unit,
        qty: it.qty,
        price: it.price,                              // The DISCOUNTED price actually charged
        originalPrice: it.originalPrice || it.price,  // Original (pre-promo) for record
        lineTotal: it.price * it.qty,
        cat: it.cat,                                  // category for VAT exempt detection
        vatExempt: typeof it.vatExempt === 'boolean' ? it.vatExempt : (it.cat === 'fruits'),
        appliedPromo: it.appliedPromo || null         // Which promo discounted this line, if any
      })),
      // Promotion summary (snapshot frozen at order time so admin can audit later)
      promotions: {
        productSavings: cartTotals.productPromoSaving || 0,
        bundlePromos:   cartTotals.bundlePromos || [],
        bundleSavings:  cartTotals.bundleSavings || 0,
        orderPromo:     cartTotals.orderPromo  || null,
        couponPromo:    cartTotals.couponPromo || null,
        firstOrderPromo: cartTotals.firstOrderPromo || null, // 5% הנחת הזמנה ראשונה
        totalSaved:     cartTotals.totalSaved  || 0
      },
      total: total,
      notes: data.orderNotes || '',
      recurring: !!data.recurring,
      source: 'web',
      loggedInUser: state.user ? { email: state.user.email, name: state.user.name } : null,
      // Legal evidence that the customer actively agreed to terms+privacy
      // at the moment of this order. Required by Israeli law as proof.
      // Marketing consent captured separately (תיקון 40 לחוק התקשורת).
      consent: buildConsentEvidence({
        orderNumber: orderNum,
        email: data.email,
        marketingConsent: !!data.marketingConsent
      })
    };
    // Persist a separate consent log that survives even if this order is
    // later deleted from the queue. Long-term retention is a legal requirement.
    appendConsentLog(sitePayload.consent);
    queue.push(sitePayload);
    localStorage.setItem('balasi_pending_orders', JSON.stringify(queue));

    // === SAVE TO PER-CUSTOMER ORDER HISTORY (so the customer can see "Previous orders" in their account) ===
    try { saveCustomerOrder(data.email, sitePayload); } catch (histErr) { /* non-fatal */ }

    // Live notify the admin if it's open in another tab
    try {
      const ch = new BroadcastChannel('balasi-orders');
      ch.postMessage({ type:'new-order', orderNumber:orderNum, total, customer:data.companyName });
      ch.close();
    } catch (chErr) { /* BroadcastChannel not supported — fallback works via localStorage */ }
  } catch (err) {
    // Order accepted but failed to queue locally for admin sync — most likely localStorage quota
    showToast('הזמנתך נשלחה אך תידרש סנכרון ידני בצד המערכת', 'error');
  }

  // If recurring checkbox is set — save the recurring order
  if (data.recurring) {
    const next = new Date();
    next.setDate(next.getDate() + 7);
    state.recurringOrder = {
      active: true,
      items: items.map(it => ({ pid: it.id, qty: it.qty })),
      setupAt: new Date().toISOString(),
      // Use Asia/Jerusalem timezone for the local YYYY-MM-DD string —
      // toISOString() returns UTC which can be one day off in the morning/evening.
      nextDelivery: formatIsraelDate(next),
      total: total,
      orderNumber: orderNum,
      city: data.city,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email
    };
    saveRecurringOrder();
  }

  document.getElementById('checkoutBody').innerHTML = `
    <div class="success">
      <div class="s-ic">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h3>תודה רבה! ההזמנה התקבלה</h3>
      <p>נציג שלנו ייצור איתכם קשר תוך 24 שעות לאישור פרטי המשלוח</p>
      <div class="order-num">${orderNum}</div>
      <p style="margin-top:18px">סכום ההזמנה: <b style="color:var(--ink);font-size:17px">₪${total}</b></p>
      <p style="margin-top:6px;font-size:13px">פרטי ההזמנה נשלחו ל-<b>${data.email}</b></p>
      <div class="success-info">
        <h5>מה הלאה?</h5>
        <ul>
          <li>נציג יחזור אליכם תוך 24 שעות לאישור</li>
          <li>ההזמנה תיארז ותישלח תוך 24-48 שעות</li>
          <li>חשבונית מס תישלח עם המשלוח</li>
          <li>משלוח לעיר: <b>${data.city}</b></li>
          ${data.recurring ? '<li>ההזמנה הוגדרה כקבועה — תישלח כל שבוע אוטומטית</li>' : ''}
        </ul>
      </div>
    </div>
  `;
  document.querySelector('.modal-foot').innerHTML = `
    <button class="btn btn-primary" onclick="resetOrder()" style="margin:0 auto">סיום וחזרה לחנות</button>
  `;
  state.cart = {};
  saveCart();
  updateCartUI();
}

function resetOrder() {
  closeCheckout();
  setTimeout(() => location.reload(), 300);
}

/* ================================================================
   CUSTOMER LOGIN + PORTAL
   ================================================================ */

function updateLoginUI() {
  const loginBtn = document.getElementById('loginBtn');
  const accountBtn = document.getElementById('accountBtn');
  if (!loginBtn || !accountBtn) return;
  if (state.user) {
    loginBtn.style.display = 'none';
    accountBtn.style.display = 'inline-flex';
    const initial = (state.user.name || state.user.email || 'מ').trim()[0];
    accountBtn.querySelector('.acct-initial').textContent = initial;
    accountBtn.querySelector('.acct-name').textContent = state.user.name || 'אזור אישי';
  } else {
    loginBtn.style.display = 'inline-flex';
    accountBtn.style.display = 'none';
    state._userHistory = null; // clear cached history on logout
  }
  updatePersonalizedSection();
}

function openLogin() {
  const m = document.getElementById('loginModal');
  if (!m) return;
  m.classList.add('open');
  setTimeout(() => document.getElementById('loginEmail')?.focus(), 100);
}
function closeLogin() {
  document.getElementById('loginModal')?.classList.remove('open');
}

function doLogin(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (!data.email || !data.email.includes('@')) {
    showToast('נא להזין דוא"ל תקין');
    return;
  }
  // Mock auth — in production this would verify with backend
  state.user = {
    email: data.email,
    name: data.email.split('@')[0],
    customerNumber: data.customerNumber || ('C-' + Math.floor(1000 + Math.random() * 9000)),
    company: data.company || '',
    loggedAt: new Date().toISOString()
  };
  saveUser();
  updateLoginUI();
  closeLogin();
  showToast('ברוכים הבאים, ' + state.user.name + '!');
}

function doLogout() {
  if (!confirm('להתנתק?')) return;
  state.user = null;
  saveUser();
  updateLoginUI();
  // Remove the "welcome back" banner of the previous user (it belongs to their session)
  document.getElementById('welcomeBackBanner')?.remove();
  // Clear the session-dismissed flag so a future login can show the banner again
  try { sessionStorage.removeItem('welcome_dismissed'); } catch (e) {}
  document.getElementById('accountModal')?.classList.remove('open');
  showToast('התנתקת בהצלחה');
}

function openAccount() {
  if (!state.user) { openLogin(); return; }
  renderAccountPortal();
  renderAccountRecs();
  document.getElementById('accountModal').classList.add('open');
}
function closeAccount() {
  document.getElementById('accountModal').classList.remove('open');
}

/* ----------------------------------------------------------------
   ORDER TRACKING TIMELINE  (restored — required by renderAccountPortal)
   ---------------------------------------------------------------- */
const TRACKING_STAGES = [
  { key:'pending',     label:'התקבלה' },
  { key:'confirmed',   label:'אושרה' },
  { key:'preparing',   label:'נארזת' },
  { key:'in-delivery', label:'במשלוח' },
  { key:'delivered',   label:'נמסרה' }
];

function renderTrackingTimeline(currentStage, compact) {
  const stages = TRACKING_STAGES;
  const currentIdx = stages.findIndex(s => s.key === currentStage);
  const idx = currentIdx === -1 ? stages.length - 1 : currentIdx;
  return `
    <div class="track ${compact ? 'track-compact' : ''}">
      ${stages.map((s, i) => {
        const isDone = i < idx;
        const isCurrent = i === idx;
        return `
          <div class="track-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
            <div class="track-dot">${isDone ? '✓' : (i + 1)}</div>
            <span class="track-label">${s.label}</span>
          </div>
          ${i < stages.length - 1 ? `<div class="track-line ${i < idx ? 'done' : ''}"></div>` : ''}
        `;
      }).join('')}
    </div>
  `;
}

/* Reactivate a previously-cancelled recurring order  (restored) */
function reactivateRecurringOrder() {
  if (!state.recurringOrder) {
    showToast('לא נמצאה הזמנה קבועה. בצעו הזמנה חדשה וסמנו "הפיכת ההזמנה לקבועה"');
    return;
  }
  const next = new Date();
  next.setDate(next.getDate() + 7);
  state.recurringOrder = {
    ...state.recurringOrder,
    active: true,
    nextDelivery: (typeof formatIsraelDate === 'function' ? formatIsraelDate(next) : next.toISOString().split('T')[0]),
    cancelledAt: null,
    reactivatedAt: new Date().toISOString()
  };
  if (typeof saveRecurringOrder === 'function') saveRecurringOrder();
  showToast('ההזמנה הקבועה הופעלה מחדש');
  if (document.getElementById('accountModal')?.classList.contains('open')) {
    renderAccountPortal();
  }
}

/* Track in-memory whether the customer asked to expand the orders list */
let _accountShowAllOrders = false;

function renderAccountPortal() {
  const wrap = document.getElementById('accountBody');
  if (!wrap) return;

  // One-time pull from admin queue so legacy orders (made before per-customer
  // storage existed) are surfaced too. Idempotent.
  try { migrateOrdersFromAdminQueue(state.user.email); } catch (e) {}

  // === REAL orders for this customer (newest first) ===
  const allOrders = getCustomerOrders(state.user.email);

  // Status resolution order (most-authoritative first):
  //   1. Pending admin queue — live status the admin is editing right now.
  //   2. Processed admin orders (admin_orders) — orderStatus the admin set.
  //   3. The status saved on the customer-side payload itself.
  //   4. Default 'delivered' (the order is no longer tracked anywhere).
  let adminQueue = [], adminOrders = [];
  try { adminQueue  = JSON.parse(localStorage.getItem('balasi_pending_orders') || '[]'); } catch (e) {}
  try { adminOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]'); } catch (e) {}
  function statusFor(orderNumber, fallback) {
    const liveRec = adminQueue.find(o => o && o.orderNumber === orderNumber);
    if (liveRec) return liveRec.status || 'pending';
    const procRec = adminOrders.find(o => o && o.orderNumber === orderNumber);
    if (procRec) return procRec.orderStatus || 'confirmed';
    return fallback || 'delivered';
  }

  // Normalize each saved order into the shape the UI consumes
  const orders = allOrders.map(o => {
    const ts = o.timestamp ? new Date(o.timestamp) : null;
    const dateStr = ts ? ts.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
    const itemsCount = Array.isArray(o.items) ? o.items.reduce((s,i) => s + (i.qty || 1), 0) : 0;
    return {
      num: o.orderNumber || '—',
      date: dateStr,
      timestamp: o.timestamp || null,
      total: o.total || 0,
      items: itemsCount,
      status: statusFor(o.orderNumber, o.status)
    };
  });

  // Orders in the last 30 days
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const ordersThisMonth = orders.filter(o => o.timestamp && new Date(o.timestamp).getTime() >= monthAgo).length;

  // How many to display in the "Recent orders" section
  const PREVIEW = 5;
  const displayedOrders = _accountShowAllOrders ? orders : orders.slice(0, PREVIEW);
  const hasMoreOrders = orders.length > PREVIEW;
  const recurringActive = isRecurringActive();
  const ro = state.recurringOrder;

  wrap.innerHTML = `
    <!-- Hero -->
    <div class="acct-hero">
      <div class="acct-hero-avatar">${(state.user.name || 'מ')[0]}</div>
      <div>
        <span class="acct-hello">שלום, ${state.user.name}</span>
        <h2>אזור אישי</h2>
        <p class="acct-meta">${state.user.company ? state.user.company + ' · ' : ''}מספר לקוח: <b>${state.user.customerNumber}</b></p>
      </div>
      <button class="acct-logout" onclick="doLogout()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        התנתק
      </button>
    </div>

    <!-- Quick stats -->
    <div class="acct-stats">
      <div class="acct-stat">
        <span class="acct-stat-label">הזמנות החודש</span>
        <b>${ordersThisMonth}</b>
      </div>
      <div class="acct-stat">
        <span class="acct-stat-label">מועדפים</span>
        <b>${state.favorites.length}</b>
      </div>
      <div class="acct-stat">
        <span class="acct-stat-label">הזמנה קבועה</span>
        <b style="color:${recurringActive ? 'var(--green-2)' : 'var(--muted)'}">${recurringActive ? 'פעיל' : 'לא פעיל'}</b>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="acct-section">
      <div class="acct-section-head">
        <h3>הזמנות קודמות</h3>
        ${hasMoreOrders ? `<button class="acct-link" onclick="toggleAccountOrders()">${_accountShowAllOrders ? 'הצג פחות ←' : 'היסטוריה מלאה (' + orders.length + ') ←'}</button>` : ''}
      </div>
      ${orders.length === 0 ? `
        <div class="acct-empty">
          <div class="acct-empty-icon">📦</div>
          <p class="acct-empty-title">עדיין אין לכם הזמנות</p>
          <p class="acct-empty-text">לאחר ביצוע ההזמנה הראשונה — כל ההזמנות שלכם יופיעו כאן עם מצב המשלוח, פירוט הפריטים והאפשרות להזמין שוב בקליק.</p>
          <button class="btn btn-dark btn-sm" style="margin-top:14px" onclick="closeAccount();startOrdering()">בצעו הזמנה ראשונה ←</button>
        </div>
      ` : `
      <div class="acct-orders">
        ${displayedOrders.map(o => `
          <div class="acct-order">
            <div class="ao-l">
              <b>${o.num}</b>
              <span>${o.date} · ${o.items} פריטים · ₪${o.total}</span>
            </div>
            <div class="ao-r" style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-light btn-sm" onclick="openOrderView('${o.num}')">צפה</button>
              <button class="btn btn-dark btn-sm" onclick="reorderFrom('${o.num}')">הזמן שוב</button>
            </div>
          </div>
        `).join('')}
      </div>`}
    </div>

    <!-- Recurring order section (active or canceled with reactivate option) -->
    ${ro ? `
      <div class="acct-section">
        <div class="acct-section-head">
          <h3>הזמנה קבועה שבועית</h3>
          ${recurringActive
            ? '<span class="recurring-pill recurring-pill-active">🟢 פעילה</span>'
            : '<span class="recurring-pill recurring-pill-inactive">⏸ מבוטלת</span>'}
        </div>
        <div class="recurring-card ${recurringActive ? 'active' : 'inactive'}">
          ${recurringActive ? `
            <div class="rec-info">
              <div class="rec-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span><b>אספקה הבאה:</b> ${formatRecurringDate(ro.nextDelivery)}</span>
              </div>
              <div class="rec-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span><b>${(ro.items || []).reduce((s,i) => s + i.qty, 0)} פריטים</b> · סכום משוער ₪${ro.total || 0}</span>
              </div>
              <div class="rec-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span><b>אזור משלוח:</b> ${ro.city || '—'}</span>
              </div>
            </div>
            <div class="rec-actions">
              <button class="btn btn-ghost btn-sm" onclick="showToast('בדמו: כאן ניתן יהיה לערוך את הפריטים בהזמנה הקבועה')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ערוך פריטים
              </button>
              <button class="btn btn-cancel-recurring btn-sm" onclick="cancelRecurringOrder()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                ביטול הזמנה קבועה
              </button>
            </div>
          ` : `
            <div class="rec-cancelled">
              <p><b>ההזמנה הקבועה מבוטלת.</b> בוטלה בתאריך ${formatRecurringDate(ro.cancelledAt?.split('T')[0])}.</p>
              <p class="rec-hint">להפעלה מחדש לחצו על הכפתור — נחדש את אותה הזמנה לאספקה שבועית.</p>
              <div class="rec-actions" style="margin-top:12px">
                <button class="btn btn-dark btn-sm" onclick="reactivateRecurringOrder()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  הפעל הזמנה קבועה מחדש
                </button>
              </div>
            </div>
          `}
        </div>
      </div>
    ` : ''}

    <!-- Smart recommendations -->
    <div class="acct-section">
      <div class="acct-section-head"><h3>מומלץ עבורכם</h3></div>
      <div id="acctRecs" class="rec-strip rec-strip-light"></div>
    </div>

    <!-- Quick actions -->
    <div class="acct-section">
      <div class="acct-section-head"><h3>פעולות מהירות</h3></div>
      <div class="acct-actions">
        <button class="acct-action" onclick="closeAccount();startOrdering()">
          <span>🛒</span><b>הזמנה חדשה</b><span>גלוש בקטלוג והזמן</span>
        </button>
        <button class="acct-action" onclick="closeAccount();document.getElementById('bundles')?.scrollIntoView({behavior:'smooth'})">
          <span>🎁</span><b>חבילות מוכנות</b><span>חסכו זמן עם סלים מוכנים</span>
        </button>
        <button class="acct-action" onclick="closeAccount();document.getElementById('faq')?.scrollIntoView({behavior:'smooth'})">
          <span>❓</span><b>שאלות נפוצות</b><span>תשובות לשאלות הכי שכיחות</span>
        </button>
        <button class="acct-action" onclick="openWhatsApp()">
          <span>💬</span><b>צור קשר</b><span>שירות לקוחות בווטסאפ</span>
        </button>
      </div>
    </div>
  `;
}

function toggleAccountOrders() {
  _accountShowAllOrders = !_accountShowAllOrders;
  renderAccountPortal();
  renderAccountRecs();
}

function reorderFrom(num) {
  const orders = getCustomerOrders(state.user?.email);
  const order = orders.find(o => o && o.orderNumber === num);
  if (!order || !Array.isArray(order.items)) {
    showToast('לא נמצאו פרטי ההזמנה לשחזור');
    return;
  }
  let added = 0, skipped = 0;
  order.items.forEach(it => {
    if (!it.pid) return;
    // Only re-add products still present in the current catalog
    const p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(x => x.id === it.pid) : null;
    if (!p) { skipped++; return; }
    state.cart[it.pid] = (state.cart[it.pid] || 0) + (it.qty || 1);
    added++;
  });
  if (added === 0) {
    showToast('הפריטים מההזמנה הזו לא זמינים יותר בקטלוג');
    return;
  }
  saveCart();
  updateCartUI();
  showToast(`✓ ${added} פריטים מההזמנה נוספו לסל${skipped ? ' (' + skipped + ' לא זמינים)' : ''}`);
  closeAccount();
  setTimeout(() => openCart(), 400);
}

/* Render account portal recommendations after DOM update */
function renderAccountRecs() {
  setTimeout(() => {
    const acctRecs = document.getElementById('acctRecs');
    if (acctRecs) {
      renderRecommendationStrip(acctRecs, {
        source:'general',
        limit:6,
        title:'מומלץ עבורכם',
        subtitle:'בחירות חכמות לפי ההיסטוריה והעדפות שלכם'
      });
    }
  }, 60);
}

/* ================================================================
   GENERIC CONFIRMATION DIALOG
   ================================================================ */
function confirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const bg = document.getElementById('confirmModal');
  if (!bg) return;
  document.getElementById('confirmTitle').textContent = title || 'האם להמשיך?';
  document.getElementById('confirmMessage').innerHTML = message || '';
  const cBtn = document.getElementById('confirmYes');
  const xBtn = document.getElementById('confirmNo');
  cBtn.textContent = confirmLabel || 'אישור';
  xBtn.textContent = cancelLabel || 'ביטול';
  cBtn.classList.toggle('confirm-btn-danger', !!danger);
  cBtn.onclick = () => { closeConfirm(); if (onConfirm) onConfirm(); };
  xBtn.onclick = () => { closeConfirm(); if (onCancel) onCancel(); };
  bg.onclick = (e) => { if (e.target === bg) closeConfirm(); };
  bg.classList.add('open');
  setTimeout(() => xBtn.focus(), 80);
}
function closeConfirm() {
  document.getElementById('confirmModal')?.classList.remove('open');
}

/* ================================================================
   RECURRING ORDER MANAGEMENT
   ================================================================ */
function isRecurringActive() {
  return !!(state.recurringOrder && state.recurringOrder.active);
}

function cancelRecurringOrder() {
  if (!isRecurringActive()) return;
  const ro = state.recurringOrder;
  const itemCount = (ro.items || []).reduce((s, it) => s + it.qty, 0);
  const totalDisplay = ro.total ? `₪${ro.total}` : '—';

  confirmDialog({
    title: 'ביטול הזמנה קבועה שבועית',
    message: `
      <p>אתם בטוחים שברצונכם לבטל את ההזמנה הקבועה השבועית?</p>
      <div class="confirm-summary">
        <div class="cs-row"><span>פריטים בהזמנה</span><b>${itemCount} פריטים</b></div>
        <div class="cs-row"><span>סכום משוער</span><b>${totalDisplay}</b></div>
        <div></div>
      </div>
    `,
    onConfirm: function () {
      state.recurringOrder = { active: false, items: [], total: 0 };
      try { localStorage.setItem('balasi_recurring', JSON.stringify(state.recurringOrder)); } catch (e) {}
      if (typeof showToast === 'function') showToast('ההזמנה הקבועה בוטלה');
      if (typeof renderRecurringOrder === 'function') renderRecurringOrder();
    }
  });
}

/* ---------- SAFETY STUBS — prevent ReferenceError on init ---------- */
/* These are no-ops that exist only to prevent the page from breaking
   if the corresponding feature was removed but still called from init. */
if (typeof renderDietFilters !== 'function') {
  window.renderDietFilters = function () { /* no-op */ };
}
if (typeof renderBundles !== 'function') {
  window.renderBundles = function () { /* no-op */ };
}
if (typeof toggleDiet !== 'function') {
  window.toggleDiet = function () { /* no-op */ };
}
/* ========== RESTORED FUNCTIONS FROM BACKUP ========== */

function openWhatsApp(context) {
  const phone = '972501234567'; // Israel WhatsApp business number
  let msg = 'שלום, אני מעוניין לקבל מידע על מוצרים בבלסי סטור';
  if (context === 'order') msg = 'שלום, אני רוצה לקבל סיוע בהזמנה באתר';
  if (context === 'support') msg = 'שלום, אני זקוק לסיוע משירות הלקוחות';
  if (state.user) msg += ` (לקוח ${state.user.customerNumber})`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener');
}


function closePhotoReorder() {
  document.getElementById('photoReorderModal').classList.remove('open');
  // Reset analyzing state
  _prPhotos = [];
  _prDetected = [];
}


function confirmPhotoOrder() {
  if (!_prDetected.length) {
    showToast('אין פריטים להוסיף', 'error');
    return;
  }
  let added = 0;
  _prDetected.forEach(d => {
    state.cart[d.id] = (state.cart[d.id] || 0) + d.qty;
    added += d.qty;
  });
  updateCartUI();
  // Update visible product cards
  _prDetected.forEach(d => updateProductCardQty(d.id));

  closePhotoReorder();
  closeAccount();
  showToast(`✓ ${added} פריטים נוספו לסל מתוך הזיהוי`);
  setTimeout(() => openCart(), 400);
}


function addEntireRoutine() {
  const h = getUserHistory();
  if (!h) return;
  let added = 0;
  h.routine.forEach(it => {
    const stock = getStockStatus(it.pid);
    if (stock.key === 'out') return;
    state.cart[it.pid] = (state.cart[it.pid] || 0) + it.qty;
    added += it.qty;
    updateProductCardQty(it.pid);
  });
  updateCartUI();
  renderRoutineRail();
  refreshAllRecommendations();
  showToast(`✓ ${added} פריטים מהשגרה שלכם נוספו לסל`);
  setTimeout(() => openCart(), 600);
}


function startPhotoAnalysis() {
  setPhotoStep(2);

  // Reset checklist & progress
  document.querySelectorAll('.pr-checklist .pr-check').forEach(c => c.classList.remove('active', 'done'));
  document.getElementById('prProgress').style.width = '0%';
  document.getElementById('prAnalyzeTitle').textContent = 'מעלה תמונות...';
  document.getElementById('prAnalyzeSub').textContent = 'מתחבר לשירות הזיהוי';

  const stages = [
    { delay:0,    pct:8,   check:1, title:'מעלה תמונות...', sub:`מעבד ${_prPhotos.length} תמונות מהמכשיר` },
    { delay:1200, pct:30,  check:1, done:[1], title:'סורק מדפים...', sub:'מזהה גבולות מוצרים ואזורים בתמונה' },
    { delay:2200, pct:55,  check:2, done:[1,2], title:'מזהה מוצרים...', sub:'משווה לקטלוג ולמלאי הבסיסי' },
    { delay:3300, pct:78,  check:3, done:[1,2,3], title:'מחשב חוסרים...', sub:'משווה להיסטוריית הזמנות וכמויות רגילות' },
    { delay:4200, pct:95,  check:4, done:[1,2,3], title:'מסיים...', sub:'בונה את ההצעה הסופית' },
    { delay:4800, pct:100, check:4, done:[1,2,3,4], title:'הניתוח הושלם!', sub:'התוצאות מוכנות', complete:true },
  ];

  stages.forEach(s => {
    setTimeout(() => {
      document.getElementById('prProgress').style.width = s.pct + '%';
      document.getElementById('prAnalyzeTitle').textContent = s.title;
      document.getElementById('prAnalyzeSub').textContent = s.sub;
      // Update checklist
      document.querySelectorAll('.pr-checklist .pr-check').forEach(c => {
        const n = Number(c.dataset.c);
        c.classList.remove('active', 'done');
        if ((s.done || []).includes(n)) c.classList.add('done');
        else if (n === s.check) c.classList.add('active');
      });
      if (s.complete) {
        setTimeout(() => showPhotoResults(), 600);
      }
    }, s.delay);
  });
}


function scrollPersonalRail(railId, dir) {
  const el = document.getElementById(railId);
  if (!el) return;
  el.scrollBy({ left: dir * 280, behavior:'smooth' });
}


function addBundleToCart(bundleId) {
  const b = BUNDLES.find(x => x.id === bundleId);
  if (!b) return;
  let added = 0;
  b.items.forEach(pid => {
    const qty = b.qtyMap[pid] || 1;
    if (PRODUCTS.find(x => x.id === pid)) {
      state.cart[pid] = (state.cart[pid] || 0) + qty;
      added += qty;
    }
  });
  updateCartUI();
  document.querySelectorAll('.card[data-id]').forEach(card => {
    const id = Number(card.dataset.id);
    if (b.items.includes(id)) updateProductCardQty(id);
  });
  showToast(`✓ ${b.name} נוסף לסל (${added} פריטים)`);
}


function addRoutineItem(pid, qty) {
  state.cart[pid] = (state.cart[pid] || 0) + qty;
  updateCartUI();
  updateProductCardQty(pid);
  renderRoutineRail();
  refreshAllRecommendations();
  const p = PRODUCTS.find(x => x.id === pid);
  showToast(`✓ ${qty}× ${p.name} נוסף לסל`);
}


function changePhotoQty(idx, delta) {
  if (!_prDetected[idx]) return;
  _prDetected[idx].qty = Math.max(1, _prDetected[idx].qty + delta);
  renderPhotoResults();
}


function formatRecurringDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', { day:'2-digit', month:'long', year:'numeric' });
}



function renderDietFilters() {
  const wrap = document.getElementById('sideDiet');
  if (!wrap) return;
  wrap.innerHTML = Object.entries(DIET_LABELS).map(([key, info]) => `
    <label class="diet-chip ${state.diet.includes(key) ? 'active' : ''}" data-diet="${key}">
      <input type="checkbox" ${state.diet.includes(key) ? 'checked' : ''} onchange="toggleDiet('${key}')" />
      <span class="dc-icon" style="color:${info.color}">${info.icon}</span>
      <span class="dc-label">${info.label}</span>
    </label>
  `).join('');
}


function renderBundles() {
  const grid = document.getElementById('bundlesGrid');
  if (!grid) return;
  grid.innerHTML = BUNDLES.map(b => {
    const totalBefore = b.items.reduce((s, pid) => {
      const p = PRODUCTS.find(x => x.id === pid);
      const q = b.qtyMap[pid] || 1;
      return s + (p ? p.price * q : 0);
    }, 0);
    const totalAfter = Math.round(totalBefore * (1 - b.discount / 100));
    const itemCount = b.items.length;
    return `
      <article class="bundle-card" data-id="${b.id}">
        ${b.badge ? `<span class="bundle-badge">${b.badge}</span>` : ''}
        <div class="bundle-icon" style="background:${b.color}15;color:${b.color}">${b.icon}</div>
        <h3 class="bundle-name">${b.name}</h3>
        <p class="bundle-desc">${b.desc}</p>
        <div class="bundle-items">
          ${b.items.slice(0, 4).map(pid => {
            const p = PRODUCTS.find(x => x.id === pid);
            return p ? `<span class="bundle-emoji">${p.icon}</span>` : '';
          }).join('')}
          ${itemCount > 4 ? `<span class="bundle-more">+${itemCount - 4}</span>` : ''}
        </div>
        <div class="bundle-foot">
          <div class="bundle-price">
            <span class="bundle-price-old">₪${totalBefore}</span>
            <b class="bundle-price-new">₪${totalAfter}</b>
            <span class="bundle-discount">-${b.discount}%</span>
          </div>
          <button class="btn btn-dark btn-sm" onclick="addBundleToCart('${b.id}')">הוסף לסל</button>
        </div>
      </article>
    `;
  }).join('');
}


/* ================================================================
   MONTHLY DEALS — "מבצעי החודש"
   ----------------------------------------------------------------
   Picks 6 promoted products to feature in the public-site rail.
   • Uses the existing `balasi_promotions` system as the source of
     truth for discounts (so prices, cart-line items, and admin all
     stay consistent). Deals tagged with monthlyDeal:true are
     treated as the canonical monthly-deal set; if none exist, we
     auto-pick the top-6 popular products with ANY active promo.
   • The dedicated admin panel ("מבצעי החודש") writes promos with
     monthlyDeal:true, which gives it priority over auto-pick.
   • If there are no candidates at all, the section hides itself.
   ================================================================ */

const MONTHLY_DEALS_SEED_FLAG = 'balasi_monthly_deals_seeded_v1';

/* End-of-current-month (YYYY-MM-DD) — used as default expiry for seed
   data and as the label that appears next to the section title.
   NOTE: we format from local-date parts (NOT toISOString) — toISOString
   converts to UTC and in Israel (UTC+2/+3) the local midnight of "31st"
   becomes UTC "30th", causing an off-by-one end-of-month bug. */
function _endOfThisMonth() {
  const d = new Date();
  const eom = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return _formatLocalDate(eom);
}

/* Format a Date as YYYY-MM-DD using LOCAL date parts (avoids UTC drift). */
function _formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* Run once: drop 6 example promos into balasi_promotions so the
   section isn't empty on a fresh install. Safe to call repeatedly —
   the seed flag prevents duplicates and admin edits are preserved.
   If admin has ever run (admin_promotions key exists), we skip seeding
   here because admin's own seedPromotions() already includes the 6
   monthly-deal promos and owns the data via syncPromotionsToPublicSite. */
function seedMonthlyDealsIfNeeded() {
  try {
    if (localStorage.getItem(MONTHLY_DEALS_SEED_FLAG) === '1') return;
    if (localStorage.getItem('admin_promotions')) {
      localStorage.setItem(MONTHLY_DEALS_SEED_FLAG, '1');
      return;
    }
    const promos = getSitePromotions();
    const eom = _endOfThisMonth();
    // Local-date (avoids UTC offset bug around midnight in Israel).
    const today = _formatLocalDate(new Date());
    const nextId = () => (promos.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1);
    const seeds = [
      { productId: 1,  pct: 15, name: 'מבצע החודש — קפסולות נספרסו' },     // popular:9, ₪84
      { productId: 11, pct: 20, name: 'מבצע החודש — מים נביעות 0.5L' },   // popular:9, ₪28
      { productId: 20, pct: 10, name: 'מבצע החודש — במבה אסם' },          // popular:10, ₪6
      { productId: 22, pct: 15, name: 'מבצע החודש — דוריטוס גבינה' },    // popular:8, ₪8
      { productId: 12, pct: 18, name: 'מבצע החודש — קוקה קולה זירו' },   // popular:8, ₪42
      { productId: 21, pct: 12, name: 'מבצע החודש — ביסלי גריל' },        // popular:9, ₪5
    ];
    seeds.forEach((s, idx) => {
      promos.push({
        id: nextId() + idx,
        name: s.name,
        type: 'product',
        target: { productId: s.productId },
        discountType: 'percent',
        discountValue: s.pct,
        startDate: today,
        endDate: eom,
        active: true,
        usageCount: 0,
        createdAt: today,
        monthlyDeal: true,
        monthlyDealOrder: idx
      });
    });
    localStorage.setItem('balasi_promotions', JSON.stringify(promos));
    localStorage.setItem(MONTHLY_DEALS_SEED_FLAG, '1');
  } catch (e) { console.warn('seedMonthlyDealsIfNeeded failed', e); }
}

/* Read the current monthly-deal set. Returns an array of products
   (max 6) sorted by popularity then by discount value, both desc.
   Manual deals (monthlyDeal:true on a promo) take precedence — if
   any exist, ONLY those are shown, in their stored order. Otherwise
   we auto-pick the top-6 popular discounted products. */
function getMonthlyDeals() {
  const hidden = getHiddenProductIds();
  const active = getSitePromotions().filter(isSitePromoActive);

  // Path 1 — manual monthly-deal promos exist → use them in order
  const manual = active
    .filter(p => p.monthlyDeal === true && p.type === 'product' && p.target?.productId)
    .sort((a, b) => (a.monthlyDealOrder || 0) - (b.monthlyDealOrder || 0));
  if (manual.length) {
    const seen = new Set();
    const out = [];
    for (const promo of manual) {
      const pid = promo.target.productId;
      if (seen.has(pid) || hidden.has(pid)) continue;
      const prod = PRODUCTS.find(x => x.id === pid);
      if (!prod) continue;
      seen.add(pid);
      out.push(prod);
      if (out.length >= 6) break;
    }
    if (out.length) return out;
  }

  // Path 2 — auto-pick: any product with an active discount, sorted by
  // popular desc, then by discount value desc.
  const candidates = PRODUCTS
    .filter(p => !hidden.has(p.id))
    .map(p => {
      const info = getSiteProductPromo(p);
      return info ? { p, discount: info.discount } : null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      if ((b.p.popular || 0) !== (a.p.popular || 0)) {
        return (b.p.popular || 0) - (a.p.popular || 0);
      }
      return b.discount - a.discount;
    })
    .slice(0, 6)
    .map(x => x.p);
  return candidates;
}

/* Render the monthly-deals rail. Reuses productCardHTML() so the
   cards look identical to the rest of the catalog and inherit the
   existing promo badge / strikethrough-price treatment for free. */
function renderMonthlyDeals() {
  const track = document.getElementById('dealsTrack');
  if (!track) return;
  const section = document.getElementById('monthly-deals');
  const deals = getMonthlyDeals();

  if (!deals.length) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';
  track.innerHTML = deals.map(p => productCardHTML(p)).join('');

  // Update the expiry label with the earliest end date among the
  // displayed monthly-deal promos (the section ends when the soonest
  // monthly deal does). We deliberately look at monthlyDeal-flagged
  // promos only — not getSiteProductPromo(), which would return the
  // single highest-discount promo per product and could pick a
  // different (non-monthly-deal) promo with a different end date,
  // causing the public label to disagree with the admin panel.
  const label = document.getElementById('dealsExpiryLabel');
  if (label) {
    const dealIds = new Set(deals.map(p => p.id));
    const ends = getSitePromotions()
      .filter(p => p.monthlyDeal === true && isSitePromoActive(p))
      .filter(p => p.type === 'product' && dealIds.has(p.target?.productId))
      .map(p => p.endDate)
      .filter(Boolean)
      .sort();
    if (ends[0]) {
      const [y, m, d] = ends[0].split('-');
      label.textContent = `בתוקף עד ${d}.${m}`;
    } else {
      // No monthly-deal endDate found — leave the label empty rather
      // than show "בתוקף עד" with no date (which reads as broken UX).
      label.textContent = '';
    }
  }
}


function toggleDiet(key) {
  const i = state.diet.indexOf(key);
  if (i === -1) state.diet.push(key);
  else state.diet.splice(i, 1);
  renderDietFilters();
  renderProducts();
  updateFilterCount();
}


/* ================================================================
   ORDER VIEW + EDIT MODAL
   ----------------------------------------------------------------
   Lets a logged-in customer drill into a previous order, see exactly
   which items it contained, and optionally adjust quantities, remove
   items, or add new ones before copying everything to the cart.
   State is in-memory only; the saved order in balasi_customer_orders
   is never mutated.
   ================================================================ */
let _ovOrder = null;
let _ovMode = 'view';
let _ovItems = [];
let _ovShowAdd = false;
let _ovAddQuery = '';

function openOrderView(orderNumber) {
  if (!state.user) { openLogin(); return; }
  const orders = getCustomerOrders(state.user.email);
  const order = orders.find(o => o && o.orderNumber === orderNumber);
  if (!order) { showToast('לא ניתן לטעון את ההזמנה'); return; }

  _ovOrder = order;
  _ovMode = 'view';
  _ovShowAdd = false;
  _ovAddQuery = '';

  _ovItems = (order.items || []).map(it => {
    const p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(x => x.id === it.pid) : null;
    return {
      pid: it.pid,
      name: p ? p.name : (it.name || ('פריט ' + it.pid)),
      icon: p ? p.icon : '📦',
      unit: p ? p.unit : (it.unit || ''),
      price: p ? p.price : (it.price || 0),
      originalQty: it.qty || 1,
      qty: it.qty || 1,
      removed: false,
      available: !!p
    };
  });

  renderOrderView();
  document.getElementById('orderViewModal')?.classList.add('open');
}

function closeOrderView() {
  document.getElementById('orderViewModal')?.classList.remove('open');
  _ovOrder = null; _ovItems = []; _ovShowAdd = false; _ovAddQuery = '';
}

function _ovActiveItems() {
  return _ovItems.filter(it => it.available && !it.removed && it.qty > 0);
}

function _ovTotals() {
  const items = _ovActiveItems();
  const subtotal = items.reduce((s, it) => s + (it.price * it.qty), 0);
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  return { subtotal, itemCount };
}

function _ovEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderOrderView() {
  const wrap = document.getElementById('orderViewBody');
  if (!wrap || !_ovOrder) return;

  const ts = _ovOrder.timestamp ? new Date(_ovOrder.timestamp) : null;
  const dateStr = ts ? ts.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
  const statusLabel = (() => {
    const s = _ovOrder.status || 'delivered';
    const found = (typeof TRACKING_STAGES !== 'undefined') ? TRACKING_STAGES.find(x => x.key === s) : null;
    return found ? found.label : s;
  })();

  const totals = _ovTotals();
  const originalTotal = _ovOrder.total || 0;
  const isEdit = _ovMode === 'edit';

  const itemsHtml = _ovItems.map((it, idx) => {
    const classes = ['ov-item'];
    if (!it.available) classes.push('unavailable');
    if (it.removed) classes.push('removed');
    const lineTotal = it.available && !it.removed ? (it.price * it.qty) : 0;
    return `
      <div class="${classes.join(' ')}">
        <div class="ov-item-icon">${_ovEscape(it.icon)}</div>
        <div class="ov-item-body">
          <div class="ov-item-name">${_ovEscape(it.name)}${!it.available ? '<span class="ov-unavail-pill">לא זמין כעת</span>' : ''}</div>
          <div class="ov-item-meta">${it.unit ? _ovEscape(it.unit) + ' · ' : ''}₪${it.price} ליחידה</div>
        </div>
        ${isEdit && it.available ? (it.removed ? `
          <button class="ov-restore" onclick="ovRestoreItem(${idx})">החזר</button>
        ` : `
          <div class="ov-qty-ctrl" role="group" aria-label="כמות עבור ${_ovEscape(it.name)}">
            <button onclick="ovChangeQty(${idx}, -1)" aria-label="הפחת">−</button>
            <input type="number" min="1" value="${it.qty}" onchange="ovSetQty(${idx}, this.value)" aria-label="כמות" />
            <button onclick="ovChangeQty(${idx}, 1)" aria-label="הוסף">+</button>
          </div>
          <button class="ov-remove" onclick="ovRemoveItem(${idx})" aria-label="הסר פריט" title="הסר">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        `) : `
          <div class="ov-item-qty">${it.qty} ×</div>
          <div class="ov-item-line">₪${lineTotal}</div>
        `}
      </div>
    `;
  }).join('');

  const addHtml = isEdit ? `
    <div class="ov-add-wrap">
      ${!_ovShowAdd ? `
        <button class="ov-add-toggle" onclick="ovToggleAdd()">+ הוסף מוצר נוסף להזמנה</button>
      ` : `
        <div class="ov-add-panel">
          <input class="ov-add-search" type="search" placeholder="חפש מוצר לפי שם..."
                 value="${_ovEscape(_ovAddQuery)}"
                 oninput="ovUpdateAddQuery(this.value)" autofocus />
          <div class="ov-add-results">${_renderOvAddResults()}</div>
          <div style="display:flex;justify-content:flex-end;margin-top:10px">
            <button class="btn btn-ghost btn-sm" onclick="ovToggleAdd()">סגור</button>
          </div>
        </div>
      `}
    </div>
  ` : '';

  const actionsHtml = isEdit ? `
    <div class="ov-actions">
      <button class="btn btn-ghost btn-sm" onclick="ovExitEdit()">בטל עריכה</button>
      <button class="btn btn-dark" onclick="ovCopyToCart()" ${totals.itemCount === 0 ? 'disabled' : ''}>
        שלח את ההזמנה לסל ←
      </button>
    </div>
  ` : `
    <div class="ov-actions">
      <button class="btn btn-ghost btn-sm" onclick="closeOrderView()">סגור</button>
      <button class="btn btn-light btn-sm" onclick="ovEnterEdit()">העתק והתאם</button>
      <button class="btn btn-dark" onclick="ovCopyToCart()" ${totals.itemCount === 0 ? 'disabled' : ''}>
        העתק לסל כפי שהוא ←
      </button>
    </div>
  `;

  wrap.innerHTML = `
    <div class="ov-hero">
      <div class="ov-hero-num">הזמנה ${_ovEscape(_ovOrder.orderNumber)}</div>
      <div class="ov-hero-meta">${dateStr} · ${_ovEscape(statusLabel)} · <b>${(_ovOrder.items || []).length}</b> פריטים · סכום מקורי <b>₪${originalTotal}</b></div>
    </div>

    <div class="ov-section">
      <div class="ov-section-head">
        <h3>${isEdit ? 'התאם את ההזמנה' : 'פירוט פריטים'}</h3>
        <span class="ov-hint">${isEdit ? 'שנה כמויות, הסר פריטים או הוסף חדשים' : 'לחץ "העתק והתאם" כדי לערוך'}</span>
      </div>
      <div class="ov-items">${itemsHtml}</div>
      ${addHtml}
    </div>

    <div class="ov-section">
      <div class="ov-totals">
        ${isEdit ? `
          <div class="ov-totals-row"><span>סכום מקורי</span><b>₪${originalTotal}</b></div>
          <div class="ov-totals-row"><span>${totals.itemCount} פריטים בסה"כ</span><b></b></div>
        ` : ''}
        <div class="ov-totals-grand">
          <span>${isEdit ? 'סכום מעודכן (לפני משלוח ומע"מ)' : 'סה"כ ההזמנה'}</span>
          <b>₪${isEdit ? totals.subtotal : originalTotal}</b>
        </div>
      </div>
    </div>

    ${actionsHtml}
  `;
}

function ovEnterEdit() { _ovMode = 'edit'; renderOrderView(); }
function ovExitEdit() {
  _ovItems.forEach(it => { it.qty = it.originalQty; it.removed = false; });
  _ovShowAdd = false; _ovAddQuery = '';
  _ovMode = 'view';
  renderOrderView();
}
function ovChangeQty(idx, delta) {
  const it = _ovItems[idx]; if (!it) return;
  it.qty = Math.max(1, (it.qty || 1) + delta);
  renderOrderView();
}
function ovSetQty(idx, raw) {
  const it = _ovItems[idx]; if (!it) return;
  const n = parseInt(raw, 10);
  it.qty = (isNaN(n) || n < 1) ? 1 : n;
  renderOrderView();
}
function ovRemoveItem(idx) {
  const it = _ovItems[idx]; if (!it) return;
  it.removed = true;
  renderOrderView();
}
function ovRestoreItem(idx) {
  const it = _ovItems[idx]; if (!it) return;
  it.removed = false;
  renderOrderView();
}
function ovToggleAdd() {
  _ovShowAdd = !_ovShowAdd;
  if (!_ovShowAdd) _ovAddQuery = '';
  renderOrderView();
}
function ovUpdateAddQuery(v) {
  _ovAddQuery = v || '';
  const results = document.querySelector('.ov-add-results');
  if (results) results.innerHTML = _renderOvAddResults();
}

function _renderOvAddResults() {
  if (typeof PRODUCTS === 'undefined') return '';
  const q = (_ovAddQuery || '').trim().toLowerCase();
  const presentIds = new Set(_ovItems.filter(it => !it.removed).map(it => it.pid));
  const hiddenIds = (typeof getHiddenProductIds === 'function') ? getHiddenProductIds() : new Set();
  let pool = PRODUCTS.filter(p => !presentIds.has(p.id) && !hiddenIds.has(p.id));
  if (q) pool = pool.filter(p => (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
  pool = pool.slice(0, 30);
  if (pool.length === 0) {
    return '<div class="ov-add-empty">לא נמצאו מוצרים מתאימים</div>';
  }
  return pool.map(p => `
    <div class="ov-add-row" onclick="ovAddProduct(${p.id})">
      <span class="ov-add-icon">${_ovEscape(p.icon || '📦')}</span>
      <span class="ov-add-name">${_ovEscape(p.name)}</span>
      <span class="ov-add-price">₪${p.price}</span>
    </div>
  `).join('');
}

function ovAddProduct(pid) {
  if (typeof PRODUCTS === 'undefined') return;
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  const existing = _ovItems.find(it => it.pid === pid);
  if (existing) {
    existing.removed = false;
    if (!existing.qty || existing.qty < 1) existing.qty = 1;
  } else {
    _ovItems.push({
      pid: p.id, name: p.name, icon: p.icon, unit: p.unit, price: p.price,
      originalQty: 0, qty: 1, removed: false, available: true
    });
  }
  showToast(`✓ ${p.name} נוסף להזמנה`);
  renderOrderView();
}

function ovCopyToCart() {
  const active = _ovActiveItems();
  if (active.length === 0) { showToast('אין פריטים זמינים להעתקה'); return; }
  let added = 0, skipped = 0;
  active.forEach(it => {
    if (!it.available) { skipped++; return; }
    state.cart[it.pid] = (state.cart[it.pid] || 0) + it.qty;
    added += it.qty;
  });
  if (typeof saveCart === 'function') saveCart();
  if (typeof updateCartUI === 'function') updateCartUI();
  document.querySelectorAll('.card[data-id]').forEach(card => {
    if (typeof updateProductCardQty === 'function') updateProductCardQty(Number(card.dataset.id));
  });
  showToast(`✓ ${added} פריטים מההזמנה נוספו לסל${skipped ? ' (' + skipped + ' לא זמינים)' : ''}`);
  closeOrderView();
  if (typeof closeAccount === 'function') closeAccount();
  setTimeout(() => { if (typeof openCart === 'function') openCart(); }, 300);
}


/* ---------- Additional safety stubs (auto-added) ----------
   AUDIT-MARKER-2026-05-08 */
if (typeof updatePersonalizedSection !== 'function') {
  window.updatePersonalizedSection = function () { /* no-op */ };
}
if (typeof renderRecommendationStrip !== 'function') {
  window.renderRecommendationStrip = function () { /* no-op */ };
}
if (typeof renderSubcatStrip !== 'function') {
  window.renderSubcatStrip = function () { /* no-op */ };
}
