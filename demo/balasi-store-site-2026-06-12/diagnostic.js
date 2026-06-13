/* ============================================================
   בלסי - Diagnostic tool — shows JS errors visibly on page
   ============================================================ */
(function () {
  'use strict';

  var errors = [];
  var info = [];

  // Catch all uncaught errors
  window.addEventListener('error', function (e) {
    errors.push({
      msg: e.message,
      file: (e.filename || '').split('/').pop(),
      line: e.lineno,
      col: e.colno
    });
    showPanel();
  });

  window.addEventListener('unhandledrejection', function (e) {
    errors.push({
      msg: 'Promise rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason),
      file: 'async',
      line: 0
    });
    showPanel();
  });

  function makePanel() {
    var p = document.getElementById('bls-diag');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'bls-diag';
    p.style.cssText = 'position:fixed;top:80px;right:10px;z-index:99999;width:380px;max-height:70vh;overflow:auto;background:#fff;border:2px solid #c00;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;direction:ltr;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    document.body && document.body.appendChild(p);
    return p;
  }

  function showPanel() {
    if (!document.body) {
      setTimeout(showPanel, 200);
      return;
    }
    var p = makePanel();
    var html = '<button onclick="document.getElementById(\'bls-diag\').remove()" style="float:right;background:#c00;color:#fff;border:0;padding:4px 8px;cursor:pointer;border-radius:4px">×</button>';
    html += '<h3 style="color:#c00;margin:0 0 8px;font-size:13px">🔧 בלסי Diagnostic</h3>';
    html += '<div><b>Errors (' + errors.length + '):</b><br>';
    errors.forEach(function (e, i) {
      html += '<div style="background:#fee;padding:6px;margin:4px 0;border-radius:4px"><b>' + (i+1) + '.</b> ' + e.msg + '<br><small>' + e.file + ':' + e.line + '</small></div>';
    });
    if (errors.length === 0) html += '<div style="color:#0a0">No JS errors caught ✓</div>';
    html += '</div>';
    html += '<div style="margin-top:8px"><b>Info:</b><br>';
    info.forEach(function (line) { html += line + '<br>'; });
    html += '</div>';
    p.innerHTML = html;
  }

  // Run checks after page loaded
  function runChecks() {
    info = [];
    info.push('typeof PRODUCTS = ' + typeof PRODUCTS + (typeof PRODUCTS !== 'undefined' ? ' (' + PRODUCTS.length + ' items)' : ''));
    info.push('typeof state = ' + typeof state);
    info.push('typeof addToCart = ' + typeof addToCart);
    info.push('typeof openWhatsApp = ' + typeof openWhatsApp);
    info.push('typeof renderProducts = ' + typeof renderProducts);
    info.push('typeof renderCategoriesGrid = ' + typeof renderCategoriesGrid);
    info.push('typeof initCookieBanner = ' + typeof initCookieBanner);
    info.push('typeof renderDietFilters = ' + typeof renderDietFilters);
    info.push('typeof renderBundles = ' + typeof renderBundles);
    info.push('---');
    var products_div = document.getElementById('products');
    info.push('#products element: ' + (products_div ? 'exists' : 'MISSING'));
    if (products_div) {
      info.push('  children: ' + products_div.children.length);
    }
    var cats = document.getElementById('catGrid');
    info.push('#catGrid: ' + (cats ? cats.children.length + ' children' : 'MISSING'));
    var cart = document.getElementById('cartBtn') || document.querySelector('[onclick*="openCart"]');
    info.push('cart button: ' + (cart ? 'exists' : 'MISSING'));
    var a11y = document.getElementById('a11yFab');
    info.push('a11y button: ' + (a11y ? 'exists' : 'MISSING'));
    var wa = document.querySelector('.wa-float');
    info.push('wa button: ' + (wa ? 'exists' : 'MISSING'));
    var chat = document.getElementById('blsChatFab');
    info.push('chat button: ' + (chat ? 'exists' : 'MISSING'));
    showPanel();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(runChecks, 500);
  } else {
    window.addEventListener('load', function () { setTimeout(runChecks, 500); });
  }
})();
