---
sidebar_position: 4
title: להזמנה בתנאי תשלום אין כפתור "אשר → תעודת משלוח"
---

# להזמנה בתנאי תשלום אין כפתור "אשר → תעודת משלוח"

| | |
|---|---|
| **חנות** | בלסי (balasistore) — החנות עצמה **לא** מוגדרת `external` |
| **לקוחות מושפעים** | כל לקוח/ארגון שאצלו `paymentType === "external"` (B2B תנאי תשלום) — **לא ברמת החנות** |
| **סטטוס** | 🔎 שורש הבעיה נמצא · תיקון של שורה אחת מוצע למטה · **ממתין לאישור פיליפ** (נוגע ללוגיקת סטטוס התשלום בקופה) |
| **דווח ע"י** | דוד (בעל האפליקציה), הזמנה `AzCLghN46jKLip66FeFs`, 26 ביוני 2026 |

## בשורה אחת

ללקוח בתנאי תשלום חיצוניים, חלון פרטי ההזמנה **לא מציג** את הכפתור
**"✓ אשר → תעודת משלוח"**, ולכן המנהל לא יכול לאשר את ההזמנה ותעודת המשלוח
לא נוצרת לעולם.

## התסמין

בחלון פרטי ההזמנה המנהל רואה רק: ביטול, צור לינק חיוב, עריכה, מצב ליקוט, סגירה —
**אבל לא את כפתור האישור** — למרות שזו בבירור הזמנה בתנאי תשלום
(`אופן תשלום: external`, סטטוס `pending`).

## שורש הבעיה — `paymentType` ו-`paymentStatus` לא מסכימים

הכפתור מותנה ב-**`paymentStatus`**, אבל הערך נקבע מ**תנאי שונה (וצר יותר)** מזה
שקובע את **`paymentType`**.

**1. התנאי לכפתור** — `OrderDetailsModal.tsx:39` / `:225`:

```ts
const APPROVABLE_PAYMENT_STATUSES = ["pending_j5", "completed", "external"];
// ...
if (order.status === "pending" && APPROVABLE_PAYMENT_STATUSES.includes(order.paymentStatus ?? "")) {
  // מציג "✓ אשר → תעודת משלוח"
}
```

כלומר הכפתור צריך **`order.paymentStatus === "external"`** (במקרה של תנאי תשלום).

**2. היכן ההזמנה נוצרת** — `CheckoutPage.tsx`:

```ts
// שורה 238 — סטטוס התשלום בודק רק את החנות:
paymentStatus: store.paymentType === "external" ? "external" : "pending",

// שורות 272–288 — אופן התשלום בודק חנות או ארגון או פרופיל:
if (
  store.paymentType === "external" ||
  profileOrganization?.paymentType === "external" ||
  profile?.paymentType === "external"
) {
  newOrder.status = "pending";
  newOrder.paymentType = "external";   // ← אופן התשלום תוקן ל-"external"
  await appApi.orders.order({ order: newOrder });   // אבל paymentStatus עדיין "pending"
  return;
}
```

**חוסר ההתאמה:** כשרק **הארגון/הפרופיל** הוא external (והחנות לא), ההזמנה מקבלת
`paymentType: "external"` (שורה 278) אבל `paymentStatus` כבר נקבע ל-`"pending"`
בשורה 238 ו**לא מתוקן** בתוך ענף ה-external.

התוצאה ללקוחות תנאי-תשלום של בלסי:

| שדה | ערך | נכון? |
|---|---|---|
| `order.paymentType` | `"external"` | ✅ |
| `order.paymentStatus` | `"pending"` | ❌ צריך להיות `"external"` |

`"pending"` **לא** נמצא ב-`APPROVABLE_PAYMENT_STATUSES` → הכפתור מוסתר →
תעודת המשלוח לא נוצרת. יצירת תעודת המשלוח עצמה תקינה: ברגע שההזמנה מגיעה ל-`completed`,
`completeOrder.ts` יוצר את התעודה עבור `paymentType === "external"`. פשוט ההזמנה
**לא מגיעה** ל-`completed` כי אי אפשר לאשר אותה.

## התיקון המוצע (שורה אחת)

בתוך ענף ה-external ב-`CheckoutPage.tsx` (ליד `newOrder.paymentType = "external"`),
לתקן גם את הסטטוס כך שיתאים לאופן התשלום:

```ts
  newOrder.status = "pending";
  newOrder.paymentType = "external";
  newOrder.paymentStatus = "external";   // ← להוסיף: לשמור על סטטוס תואם לאופן התשלום
```

כך `paymentType` ו-`paymentStatus` נקבעים מ**אותו** תנאי (חנות או ארגון או פרופיל
external), בדיוק כפי שהכוונה. הכפתור יופיע אז לכל הזמנה בתנאי תשלום, וזרימת
האישור → `completeOrder` → תעודת משלוח הקיימת תתפוס משם בלי שינוי.

## סיכון

- **נמוך / מתוחם.** משפיע רק על ענף הקופה שכבר נבחר עבור הזמנות external (לא רץ
  עבור הזמנות J5/כרטיס — אלו חוזרות בשורה 290). רק משנה שדה שאחרת נשאר בערך
  ברירת-מחדל שגוי.
- ללא שינוי סכמה, ללא bump ל-`@jsdev_ninja/core`, ללא שינוי בצד שרת.
- לא כולל מיגרציה להזמנות תקועות קיימות — ראו למטה.

## קוד אחאי באותו דפוס (לא שונה כאן)

מסלולי "צור הזמנה" של האדמין משתמשים ב**אותו תנאי מבוסס-חנות בלבד** עבור
`paymentStatus`, כך שהזמנה שאדמין יוצר ללקוח תנאי-תשלום בחנות לא-external תקבל את
אותו חוסר התאמה:

- `useAdminCreateOrderModal.ts:135`
- `AdminCreateOrderPage.tsx:143`

אם רוצים שגם הזמנות external שנוצרו ע"י אדמין יהיו ניתנות לאישור, שני אלו צריכים
לאמץ את אותו תנאי מודע-לארגון/פרופיל. (הושאר מחוץ לתיקון המינימלי — פיליפ יחליט על
ההיקף.)

## עדיין פתוח / לשים לב

- **הזמנות תקועות קיימות** (שכבר נוצרו עם `paymentType: external` +
  `paymentStatus: pending`, למשל `AzCLghN46jKLip66FeFs`) לא יתוקנו ע"י שינוי הקוד —
  הן צריכות תיקון שדה חד-פעמי (`paymentStatus → "external"`) או backfill קטן. מומלץ
  לרשום ולתקן אותן ברגע שהתיקון מאושר.
- כדאי לשקול helper משותף `isExternalOrder({ store, org, profile })` כדי שהסטטוס
  והאופן לא יוכלו להיפרד שוב בין שלושת המקומות.
