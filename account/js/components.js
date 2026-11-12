/* ============================================================
   ACCOUNT COMPONENTS.JS — Reusable UI Components
   ============================================================ */

// ── Toast ─────────────────────────────────────────────────────
function acctToast(type, message, duration) {
  duration = duration || 3500;
  var container = document.getElementById('acctToastContainer');
  if (!container) return;
  var icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  var colors = { success:'#22c55e', error:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
  var id = 'toast_' + Date.now();
  var el = document.createElement('div');
  el.id = id;
  el.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 18px;background:var(--card-bg);border:1px solid var(--border);border-left:4px solid ' + (colors[type]||'#3b82f6') + ';border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);margin-bottom:10px;min-width:280px;max-width:360px;transform:translateX(120%);transition:transform .3s cubic-bezier(.4,0,.2,1);';
  el.innerHTML = '<i class="fa-solid ' + (icons[type]||'fa-circle-info') + '" style="color:' + (colors[type]||'#3b82f6') + ';font-size:16px;flex-shrink:0;"></i>' +
    '<span style="font-size:13px;font-weight:600;color:var(--text);flex:1;">' + message + '</span>' +
    '<button onclick="document.getElementById(\'' + id + '\').remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:14px;"><i class="fa-solid fa-xmark"></i></button>';
  container.appendChild(el);
  requestAnimationFrame(function() { el.style.transform = 'translateX(0)'; });
  setTimeout(function() {
    el.style.transform = 'translateX(120%)';
    setTimeout(function() { if (el.parentNode) el.remove(); }, 300);
  }, duration);
}

// ── Modal ─────────────────────────────────────────────────────
function acctModal(title, content, footer, opts) {
  opts = opts || {};
  var existing = document.getElementById('acctModalOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'acctModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:acctFadeIn .2s ease;';
  overlay.innerHTML = '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:16px;width:100%;max-width:' + (opts.maxWidth||'480px') + ';box-shadow:0 24px 64px rgba(0,0,0,.4);animation:acctSlideUp .25s ease;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border);">' +
      '<div style="font-size:16px;font-weight:800;color:var(--text);">' + title + '</div>' +
      '<button onclick="acctCloseModal()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:4px;"><i class="fa-solid fa-xmark"></i></button>' +
    '</div>' +
    '<div style="padding:24px;">' + content + '</div>' +
    (footer ? '<div style="display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--border);">' + footer + '</div>' : '') +
  '</div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) acctCloseModal(); });
  document.body.appendChild(overlay);
}

function acctCloseModal() {
  var el = document.getElementById('acctModalOverlay');
  if (el) el.remove();
}

// ── Confirm ───────────────────────────────────────────────────
function acctConfirm(title, message, onConfirm, danger) {
  var btnStyle = danger
    ? 'padding:10px 20px;background:#ef4444;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;'
    : 'padding:10px 20px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;';
  acctModal(title,
    '<p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin:0;">' + message + '</p>',
    '<button onclick="acctCloseModal()" style="padding:10px 20px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Batal</button>' +
    '<button onclick="acctCloseModal();(' + onConfirm.toString() + ')()" style="' + btnStyle + '">' + (danger ? 'Ya, Lanjutkan' : 'Konfirmasi') + '</button>'
  );
}

// ── Loading Skeleton ──────────────────────────────────────────
function acctSkeleton(height, radius) {
  return '<div class="acct-skeleton" style="height:' + (height||'80px') + ';border-radius:' + (radius||'12px') + ';background:var(--skeleton-bg);animation:acctPulse 1.5s ease-in-out infinite;"></div>';
}

// ── Empty State ───────────────────────────────────────────────
function acctEmptyState(icon, title, subtitle, btnLabel, btnAction) {
  return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;text-align:center;">' +
    '<div style="width:72px;height:72px;border-radius:50%;background:rgba(99,102,241,.08);display:flex;align-items:center;justify-content:center;margin-bottom:20px;">' +
      '<i class="fa-solid ' + icon + '" style="font-size:28px;color:var(--text-muted);"></i>' +
    '</div>' +
    '<div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;">' + title + '</div>' +
    (subtitle ? '<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">' + subtitle + '</div>' : '') +
    (btnLabel ? '<button onclick="' + btnAction + '" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">' +
      '<i class="fa-solid fa-store" style="font-size:13px;"></i>' + btnLabel + '</button>' : '') +
  '</div>';
}

// ── Clipboard ─────────────────────────────────────────────────
function acctCopy(text, el) {
  navigator.clipboard.writeText(text).then(function() {
    acctToast('success', 'Berhasil disalin!', 2000);
    if (el) {
      var orig = el.innerHTML;
      el.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(function() { el.innerHTML = orig; }, 1500);
    }
  }).catch(function() { acctToast('error', 'Gagal menyalin'); });
}

// ── Page Loading ──────────────────────────────────────────────
function acctPageLoading() {
  var el = document.getElementById('acctPageContent');
  if (el) el.innerHTML = '<div style="padding:20px;display:flex;flex-direction:column;gap:16px;">' +
    acctSkeleton('180px','16px') + acctSkeleton('280px','16px') + acctSkeleton('200px','16px') +
  '</div>';
}

// ── Update sidebar stats ──────────────────────────────────────
function acctUpdateSidebarBalance(balance) {
  var el = document.getElementById('acctSidebarBalance');
  if (el) el.textContent = acctFmtRp(balance);
}
