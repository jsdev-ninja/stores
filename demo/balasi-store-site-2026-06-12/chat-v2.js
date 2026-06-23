/* בלסי Chat Widget v3 — refined design + better search */
(function () {
  'use strict';
  var WA = '972501234567';
  var EMAIL = 'balasistore5@gmail.com';

  var FAQ = [
    { keys: ['מינימום', 'הזמנה קטנה', 'כמה צריך', 'מינימלי'],
      reply: 'מינימום הזמנה אצלנו: 500 ₪ לפני מע"מ ✅\nמתחת לסכום זה — דמי משלוח 26 ₪.\nמשלוח חינם להזמנות מעל 650 ₪ 🚚' },
    { keys: ['תוך כמה זמן', 'כמה זמן לוקח', 'מתי אקבל', 'מתי תגיע', 'מתי המשלוח', 'זמן אספקה', 'מהירות משלוח', 'עד מתי מגיע', 'ימי אספקה', 'תוך כמה', 'מהר', 'דחוף', 'מהירה'],
      reply: 'זמני האספקה שלנו ⚡\n\n📦 הזמנות שמתקבלות עד 10:00 — יישלחו עוד באותו היום\n📦 הזמנות אחרי 10:00 — יישלחו ביום העסקים הבא\n\n🚚 זמני הגעה:\n• מרכז (תל אביב, רמת גן, פתח תקווה, רעננה ועוד): **תוך 24 שעות** מהמשלוח\n• שאר האזורים: 2-3 ימי עסקים\n\nרוצה לוודא זמן הגעה לעיר שלך? שלח/י לי בוואטסאפ את הכתובת.', escalate: true },
    { keys: ['משלוח לאן', 'אזורי', 'איפה מגיעים', 'מגיעים', 'איזה ערים', 'מספקים', 'מספק', 'לספק', 'אספקה ל', 'משלוחים ל', 'תל אביב', 'רמת גן', 'פתח תקווה', 'גבעתיים', 'רמת השרון', 'הוד השרון', 'בני ברק', 'גבעת שמואל', 'רעננה', 'רענה', 'הרצליה', 'הרצליה', 'כפר סבא', 'גבעת', 'ראשון', 'חולון', 'בת ים', 'נתניה', 'אבן יהודה', 'גן יבנה', 'אזור', 'יהוד', 'אור יהודה', 'קריית אונו', 'מודיעין', 'עיר', 'עירייה', 'באיזור', 'באזור'],
      reply: 'אנחנו מספקים בכל מרכז הארץ 🇮🇱\n\n📍 ערים בהן אנו פועלים:\n• תל אביב, רמת גן, גבעתיים, פתח תקווה\n• רמת השרון, הוד השרון, רעננה, הרצליה\n• בני ברק, גבעת שמואל, כפר סבא\n\n⏱ זמן אספקה: עד 24 שעות בימי עסקים\n🚚 משלוח חינם להזמנות מעל 650 ₪\n\nרוצה לוודא שאנחנו מגיעים לעיר שלך? שלח/י לנו בוואטסאפ את הכתובת המדויקת.', escalate: true },
    { keys: ['ההזמנה לא הגיע', 'איפה ההזמנה', 'מתי תגיע', 'סטטוס', 'מעקב'],
      reply: 'אשמח לבדוק את סטטוס ההזמנה שלך 📦\nאנא שלח/י לי בוואטסאפ את מספר ההזמנה או מספר הלקוח, ונחזור אליך מיד.', escalate: true },
    { keys: ['חשבון', 'להירשם', 'לקוח חדש', 'הרשמה', 'פתיחת חשבון'],
      reply: 'פתיחת חשבון לקוח אצלנו פשוטה ומהירה 🚀\n\nשלח/י לנו בוואטסאפ:\n• שם חברה מלא\n• ח.פ / ע.מ\n• כתובת למשלוח\n• שם איש קשר וטלפון\n\nנקים לך חשבון תוך יום עסקים אחד.', escalate: true },
    { keys: ['החזרה', 'להחזיר', 'פגום', 'מקולקל', 'לא טוב'],
      reply: 'מצטערים על אי הנעימות 🙏\nמוצרי מזון לא ניתנים להחזרה אלא אם הגיעו פגומים. במקרה כזה — נחליף תוך 48 שעות.\nשלח/י לנו תמונה של המוצר ואת מספר ההזמנה ונטפל מיד.', escalate: true },
    { keys: ['ביטול', 'לבטל', 'מבטל'],
      reply: 'ניתן לבטל הזמנה עד שעה לפני ארגון המשלוח.\nאם זה דחוף — אנא צור איתנו קשר מיידית בוואטסאפ עם מספר ההזמנה.', escalate: true },
    { keys: ['שעות', 'מתי פתוח', 'מתי פעיל', 'שעות פעילות'],
      reply: 'שעות הפעילות שלנו 🕐\n📅 ראשון–חמישי: 08:00–15:00\n📅 שישי-שבת: סגור\n\nוואטסאפ זמין גם מחוץ לשעות לצרכים דחופים.' },
    { keys: ['כשרות', 'כשר', 'בד"ץ', 'רבנות', 'מהדרין', 'בדץ'],
      reply: 'כל המוצרים שלנו עוברים בקרת כשרות מקורית ✡️\nניתן לבקש פירוט כשרות לכל מוצר ספציפי. הזן את שם המוצר ואשלח את האישור המתאים.', escalate: true },
    { keys: ['תשלום', 'לשלם', 'אשראי', 'העברה', 'שוטף', 'חיוב'],
      reply: 'אופציות התשלום שלנו 💳\n• שוטף+30 (ללקוחות עם חשבון פעיל)\n• כרטיס אשראי\n• העברה בנקאית\nלפתיחת אשראי לעסק — נדרשת הקמת חשבון לקוח חד-פעמית.' },
    { keys: ['הנחה', 'מבצע', 'זול', 'חיסכון', 'מבצעים'],
      reply: 'מבצעים והנחות מתעדכנים בקטלוג המוצרים.\nאני לא מוסמך לאשר הנחות מיוזמתי — אך אעביר את בקשתך לצוות המכירות שיחזרו אליך תוך 24 שעות.', escalate: true },
    { keys: ['נציג', 'אדם', 'בן אדם', 'לדבר', 'טלפון'],
      reply: 'בוודאי, אעביר אותך לנציג שלנו 👨‍💼\nהדרך הכי מהירה היא וואטסאפ — נחזור אליך תוך זמן קצר. אפשר גם במייל.', escalate: true },
    { keys: ['פרטי', 'משק בית', 'פרטיים'],
      reply: 'אנחנו עובדים רק עם עסקים (B2B) — לא מוכרים ללקוחות פרטיים.\nאם יש לך עסק או משרד — נשמח לעזור! 🏢' },
    { keys: ['תודה', 'תנקיו', 'thanks', 'אחלה'],
      reply: 'בשמחה! 😊 כאן בכל שאלה נוספת. יש משהו נוסף שאוכל לעזור בו?' },
    { keys: ['שלום', 'היי', 'הי ', 'בוקר טוב', 'ערב טוב', 'שבת שלום', 'הלו'],
      reply: 'שלום וברוך/ה הבא/ה! 👋\nשמי בלסי, נציג השירות הדיגיטלי של בלסי סטור. במה אוכל לעזור היום?' }
  ];

  function findReply(text) {
    var lower = text.toLowerCase();
    var best = null, bestLen = 0;
    for (var i = 0; i < FAQ.length; i++) {
      for (var j = 0; j < FAQ[i].keys.length; j++) {
        var k = FAQ[i].keys[j].toLowerCase();
        if (lower.indexOf(k) !== -1 && k.length > bestLen) {
          best = FAQ[i];
          bestLen = k.length;
        }
      }
    }
    return best;
  }

  // Improved product search — handles partial matches, multiple words
  function searchProducts(query) {
    if (typeof PRODUCTS === 'undefined') return [];
    var raw = query.toLowerCase().trim();
    if (raw.length < 2) return [];

    // Strip question phrases
    var cleaned = raw
      .replace(/האם יש לכם|האם יש לך|יש לכם|יש לך|יש לכן|האם יש|האם קיים|מחפש|מחפשת|רוצה|מחיר של|כמה עולה|יש את|מוכרים|אתם מוכרים|מציעים|תן לי|אני צריך|אני צריכה|תמכור|תראה לי/g, '')
      .replace(/[?!.,]/g, '')
      .trim();

    // Hebrew stop words to ignore (too common to be useful)
    var STOP_WORDS = ['את','של','על','אם','כן','לא','אך','גם','כל','יש','אין','עם','בלי','זה','זו','מה','איך','איפה','מתי','למה','כי','אבל','אז','כך','כמו','בין','אחרי','לפני','עד','מן','אל','שלי','שלך','שלו','שלה','שלנו','שלכם'];

    var words = cleaned.split(/\s+/).filter(function (w) {
      return w.length >= 3 && STOP_WORDS.indexOf(w) === -1;
    });
    if (!words.length) return [];

    var scored = [];
    for (var i = 0; i < PRODUCTS.length; i++) {
      var p = PRODUCTS[i];
      var name = (p.name || '').toLowerCase();
      var brand = (p.brand || '').toLowerCase();
      var desc = (p.desc || '').toLowerCase();

      var score = 0;
      var matched = false;
      for (var j = 0; j < words.length; j++) {
        var w = words[j];
        if (name.indexOf(w) !== -1) { score += w.length * 3; matched = true; }
        else if (brand.indexOf(w) !== -1) { score += w.length * 2; matched = true; }
        else if (desc.indexOf(w) !== -1) { score += w.length; matched = true; }
      }
      if (matched) {
        score += (p.popular || 0) * 0.1;
        scored.push({ p: p, s: score });
      }
    }
    scored = scored.filter(function (x) { return x.s >= 3; });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, 4).map(function (x) { return x.p; });
  }


  function injectStyle() {
    if (document.getElementById('bls-chat-style')) return;
    var s = document.createElement('style');
    s.id = 'bls-chat-style';
    s.textContent =
      '@keyframes blsBounce {0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}' +
      '@keyframes blsFadeIn {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes blsPulse {0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}' +
      '#bls-chat-fab-v2{font-family:Heebo,Assistant,sans-serif}' +
      '#bls-chat-fab-v2:hover{transform:translateY(-4px) scale(1.06) !important;box-shadow:0 12px 32px rgba(27,122,61,.55) !important}' +
      '.bls-pulse-dot{animation:blsPulse 2s infinite}' +
      '.bls-msg-anim{animation:blsFadeIn .3s ease both}' +
      '.bls-typing span{width:7px;height:7px;background:#9a948a;border-radius:50%;display:inline-block;animation:blsBounce 1.4s infinite ease-in-out both}' +
      '.bls-typing span:nth-child(1){animation-delay:-.32s}' +
      '.bls-typing span:nth-child(2){animation-delay:-.16s}' +
      '.bls-quick-btn{background:#fff;border:1px solid #1b7a3d;color:#1b7a3d;padding:7px 12px;border-radius:18px;font-size:12.5px;cursor:pointer;font-family:inherit;transition:all .2s}' +
      '.bls-quick-btn:hover{background:#1b7a3d;color:#fff}' +
      '#bls-chat-win-v2 input:focus{border-color:#1b7a3d !important;box-shadow:0 0 0 3px rgba(27,122,61,.12) !important}' +
      '#bls-msgs-v2::-webkit-scrollbar{width:6px}' +
      '#bls-msgs-v2::-webkit-scrollbar-thumb{background:#d8d3c3;border-radius:3px}' +
      '@media (max-width:600px){#bls-chat-fab-v2{bottom:78px !important;left:14px !important;width:50px !important;height:50px !important}#bls-chat-win-v2{bottom:140px !important;left:8px !important;right:8px !important;width:auto !important;max-width:none !important;height:calc(100vh - 160px) !important}}';
    document.head.appendChild(s);
  }

  function init() {
    if (document.getElementById('bls-chat-fab-v2')) return;
    injectStyle();

    var fab = document.createElement('button');
    fab.id = 'bls-chat-fab-v2';
    fab.setAttribute('aria-label', 'פתח צ\'אט');
    fab.style.cssText = 'position:fixed;bottom:88px;left:22px;z-index:85;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1b7a3d 0%,#0f4421 100%);color:#fff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(27,122,61,.45);display:flex;align-items:center;justify-content:center;transition:all .25s ease';
    fab.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.13 2 11.2c0 2.79 1.36 5.31 3.55 7.04L4 22l4.05-1.95c1.21.31 2.52.45 3.95.45 5.52 0 10-4.13 10-9.3S17.52 2 12 2z"/></svg>' +
      '<span class="bls-pulse-dot" style="position:absolute;top:-4px;right:-4px;width:22px;height:22px;background:#e8804a;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff">1</span>';
    document.body.appendChild(fab);

    var win = document.createElement('div');
    win.id = 'bls-chat-win-v2';
    win.style.cssText = 'position:fixed;bottom:160px;left:22px;z-index:95;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 200px);background:#fdfaf3;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.28),0 4px 16px rgba(0,0,0,.1);display:none;flex-direction:column;overflow:hidden;font-family:Heebo,Assistant,sans-serif;direction:rtl;animation:blsFadeIn .3s ease';
    win.innerHTML =
      '<div style="background:linear-gradient(135deg,#1b7a3d 0%,#0f4421 100%);color:#fff;padding:18px 20px;display:flex;align-items:center;gap:12px;position:relative">' +
        '<div style="width:46px;height:46px;border-radius:50%;background:#fff;color:#1b7a3d;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;position:relative;flex-shrink:0">ב<span style="position:absolute;bottom:-2px;left:-2px;width:13px;height:13px;background:#4ade80;border-radius:50%;border:2.5px solid #fff"></span></div>' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:16px;line-height:1.2">בלסי</div><div style="font-size:12px;opacity:.9;margin-top:2px">שירות לקוחות · אונליין</div></div>' +
        '<button id="bls-close-v2" style="background:rgba(255,255,255,.18);border:none;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .2s" onmouseover="this.style.background=\'rgba(255,255,255,.3)\'" onmouseout="this.style.background=\'rgba(255,255,255,.18)\'">✕</button>' +
      '</div>' +
      '<div id="bls-msgs-v2" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#fdfaf3 0%,#f7f4ee 100%);scroll-behavior:smooth"></div>' +
      '<div style="padding:12px 14px;background:#fff;border-top:1px solid #f0ebdf;display:flex;gap:8px;align-items:center">' +
        '<input id="bls-inp-v2" type="text" placeholder="הקלד/י הודעה..." style="flex:1;border:1.5px solid #e6e0d0;background:#fdfaf3;border-radius:22px;padding:10px 18px;outline:none;direction:rtl;font-family:inherit;font-size:14px;transition:all .2s">' +
        '<button id="bls-send-v2" style="background:linear-gradient(135deg,#1b7a3d,#155f30);color:#fff;border:none;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(27,122,61,.3);transition:all .2s" onmouseover="this.style.transform=\'scale(1.08)\'" onmouseout="this.style.transform=\'none\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style="transform:scaleX(-1)"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>' +
      '</div>' +
      '<div style="text-align:center;font-size:10.5px;color:#9a948a;padding:7px 12px 9px;background:#fff;border-top:1px solid #f7f4ee">🔒 השיחה מאובטחת · בלסי סטור</div>';
    document.body.appendChild(win);

    function addMsg(text, isUser) {
      var msgs = document.getElementById('bls-msgs-v2');
      var m = document.createElement('div');
      m.className = 'bls-msg-anim';
      m.style.cssText = 'max-width:85%;padding:11px 15px;border-radius:18px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;' +
        (isUser
          ? 'background:linear-gradient(135deg,#1b7a3d,#155f30);color:#fff;align-self:flex-end;border-bottom-left-radius:5px;box-shadow:0 2px 8px rgba(27,122,61,.18)'
          : 'background:#fff;color:#1f1d18;align-self:flex-start;border:1px solid #e6e0d0;border-bottom-right-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.04)');
      m.textContent = text;
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function addQuick(items) {
      var msgs = document.getElementById('bls-msgs-v2');
      var box = document.createElement('div');
      box.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px';
      items.forEach(function (txt) {
        var b = document.createElement('button');
        b.className = 'bls-quick-btn';
        b.textContent = txt;
        b.onclick = function () {
          document.getElementById('bls-inp-v2').value = txt;
          send();
        };
        box.appendChild(b);
      });
      msgs.appendChild(box);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function showTyping() {
      var msgs = document.getElementById('bls-msgs-v2');
      var t = document.createElement('div');
      t.id = 'bls-typing-v2';
      t.className = 'bls-typing bls-msg-anim';
      t.style.cssText = 'display:inline-flex;gap:5px;padding:13px 18px;background:#fff;border:1px solid #e6e0d0;border-radius:18px;border-bottom-right-radius:5px;align-self:flex-start;align-items:center';
      t.innerHTML = '<span></span><span></span><span></span>';
      msgs.appendChild(t);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function hideTyping() {
      var t = document.getElementById('bls-typing-v2');
      if (t) t.remove();
    }

    function addEscalation() {
      var msgs = document.getElementById('bls-msgs-v2');
      var box = document.createElement('div');
      box.className = 'bls-msg-anim';
      box.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-self:stretch;margin-top:4px';
      var wa = document.createElement('a');
      wa.href = 'https://wa.me/' + WA;
      wa.target = '_blank';
      wa.style.cssText = 'background:#fff;border:1.5px solid #e6e0d0;border-radius:14px;padding:12px 16px;text-decoration:none;color:#1f1d18;font-size:13.5px;font-weight:600;display:flex;align-items:center;gap:12px;transition:all .2s';
      wa.onmouseover = function () { wa.style.background = '#f7f4ee'; wa.style.borderColor = '#1b7a3d'; };
      wa.onmouseout = function () { wa.style.background = '#fff'; wa.style.borderColor = '#e6e0d0'; };
      wa.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487 2.981 1.288 2.981.859 3.518.806.537-.054 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0012.05 0z"/></svg>פנייה בוואטסאפ — מענה מהיר';
      var em = document.createElement('a');
      em.href = 'mailto:' + EMAIL;
      em.style.cssText = wa.style.cssText;
      em.onmouseover = wa.onmouseover;
      em.onmouseout = wa.onmouseout;
      em.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#e8804a"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>שליחת מייל';
      box.appendChild(wa);
      box.appendChild(em);
      msgs.appendChild(box);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function addProds(products) {
      var msgs = document.getElementById('bls-msgs-v2');
      products.forEach(function (p) {
        var c = document.createElement('div');
        c.className = 'bls-msg-anim';
        c.style.cssText = 'background:#fff;border:1px solid #e6e0d0;border-radius:14px;padding:12px;display:flex;align-items:center;gap:11px;align-self:stretch;transition:all .2s;cursor:default';
        c.onmouseover = function () { c.style.borderColor = '#1b7a3d'; c.style.boxShadow = '0 4px 12px rgba(27,122,61,.1)'; c.style.transform = 'translateY(-1px)'; };
        c.onmouseout = function () { c.style.borderColor = '#e6e0d0'; c.style.boxShadow = 'none'; c.style.transform = 'none'; };
        c.innerHTML = '<div style="font-size:26px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f7f4ee,#efeae0);border-radius:11px;flex-shrink:0">' + (p.icon || '📦') + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:600;font-size:13.5px;color:#0d0d0b;line-height:1.3;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.name + '</div>' +
            '<div style="font-size:11.5px;color:#6b665e">' + (p.brand ? p.brand + ' · ' : '') + (p.unit || '') + ' · <b style="color:#1b7a3d;font-size:13px">₪' + (p.price || '') + '</b></div>' +
          '</div>';
        var btn = document.createElement('button');
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
        btn.style.cssText = 'background:linear-gradient(135deg,#e8804a,#d16a35);color:#fff;border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 10px rgba(232,128,74,.3);transition:all .2s';
        btn.onmouseover = function () { btn.style.transform = 'scale(1.08)'; };
        btn.onmouseout = function () { btn.style.transform = 'none'; };
        btn.onclick = function () {
          if (typeof window.addToCart === 'function') {
            window.addToCart(p.id);
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            btn.style.background = 'linear-gradient(135deg,#1b7a3d,#155f30)';
            btn.style.boxShadow = '0 3px 10px rgba(27,122,61,.3)';
            btn.disabled = true;
          }
        };
        c.appendChild(btn);
        msgs.appendChild(c);
      });
      msgs.scrollTop = msgs.scrollHeight;
    }

    function send() {
      var inp = document.getElementById('bls-inp-v2');
      var text = inp.value.trim();
      if (!text) return;
      addMsg(text, true);
      inp.value = '';
      showTyping();
      setTimeout(function () {
        hideTyping();
        // Try product search FIRST - so even if FAQ keyword is present, products take priority
        var products = searchProducts(text);
        var faqItem = findReply(text);

        if (products.length > 0 && (!faqItem || products[0])) {
          // If we found products AND user query looks product-y, show products
          var isProductQuery = /יש לכם|יש לך|מחפש|רוצה|מחיר|כמה עולה|מוכרים|מציעים|אני צריך|תמכור|תראה לי/i.test(text);
          if (isProductQuery || !faqItem) {
            addMsg('מצאתי ' + products.length + ' מוצרים שמתאימים 👇', false);
            addProds(products);
            return;
          }
        }

        if (faqItem) {
          addMsg(faqItem.reply, false);
          if (faqItem.escalate) addEscalation();
        } else if (products.length > 0) {
          addMsg('מצאתי ' + products.length + ' מוצרים שמתאימים 👇', false);
          addProds(products);
        } else {
          addMsg('לא הצלחתי להבין את הבקשה. אעביר אותך לצוות השירות שלנו:', false);
          addEscalation();
        }
      }, 600);
    }

    var opened = false;
    fab.onclick = function () {
      var w = document.getElementById('bls-chat-win-v2');
      var isOpen = w.style.display === 'flex';
      w.style.display = isOpen ? 'none' : 'flex';
      // hide badge after first open
      var badge = fab.querySelector('span');
      if (badge && !isOpen) badge.style.display = 'none';
      if (!isOpen && !opened) {
        opened = true;
        setTimeout(function () {
          addMsg('שלום וברוך/ה הבא/ה לבלסי סטור! 👋\nשמי בלסי, נציג השירות הדיגיטלי.\nבמה אוכל לעזור היום?', false);
          addQuick(['מחפש קפה', 'מחפש חטיפים', 'מה המינימום?', 'אזורי משלוח']);
        }, 400);
      }
    };
    document.getElementById('bls-close-v2').onclick = function () { win.style.display = 'none'; };
    document.getElementById('bls-send-v2').onclick = send;
    document.getElementById('bls-inp-v2').onkeydown = function (e) {
      if (e.key === 'Enter') send();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
