// ===== MODAL =====
function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalFooter').innerHTML = footerHTML;
  document.getElementById('modalBackdrop').classList.add('open');
}
function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
}

// Close modal on backdrop click
document.getElementById('modalBackdrop').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
});

// ===== TOAST =====
function showToast(type = 'success', message = '', duration = 3000) {
  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', warning:'fa-triangle-exclamation', info:'fa-circle-info' };
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info}"></i>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(el);
  setTimeout(() => el.style.opacity = '0', duration - 300);
  setTimeout(() => el.remove(), duration);
}

// ===== BADGE HELPERS =====
function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status, cls: 'badge-gray', icon: 'fa-circle' };
  return `<span class="badge ${s.cls}"><i class="fa-solid ${s.icon}"></i>${s.label}</span>`;
}
function changeBadge(current, prev) {
  if (prev === 0) return '<span class="stat-change up"><i class="fa-solid fa-arrow-up"></i>Baru</span>';
  const pct = (((current - prev) / prev) * 100).toFixed(1);
  const up  = current >= prev;
  return `<span class="stat-change ${up ? 'up' : 'down'}">
    <i class="fa-solid fa-arrow-${up ? 'up' : 'down'}"></i>${Math.abs(pct)}%
  </span>`;
}

// ===== FORMAT HELPERS =====
function formatRp(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }
function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function timeAgo(str) {
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs/24);
  if (days < 7)  return `${days} hari lalu`;
  const weeks = Math.floor(days/7);
  return `${weeks} minggu lalu`;
}

// ===== SKELETON LOADER =====
function renderSkeleton(rows = 4, cols = 4) {
  let html = '<div style="display:grid;gap:16px;">';
  html += `<div class="skeleton" style="height:80px;border-radius:12px;margin-bottom:8px;"></div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;">`;
  for (let i = 0; i < cols; i++) html += `<div class="skeleton" style="height:100px;border-radius:12px;"></div>`;
  html += '</div>';
  for (let r = 0; r < rows; r++) {
    html += `<div class="skeleton skeleton-h" style="width:${80 - r*10}%;height:14px;"></div>`;
  }
  html += '</div>';
  return html;
}

// ===== STAT CARD =====
function statCard({ label, value, icon, color, note, prev, format = 'currency', warning = '' }) {
  const displayVal = format === 'currency' ? formatRp(value) : value.toLocaleString('id-ID');
  const change = prev !== undefined ? changeBadge(value, prev) : '';
  const warnHTML = warning ? `<span class="stat-note text-warning"><i class="fa-solid fa-triangle-exclamation"></i> ${warning}</span>` : '';
  return `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-label">${label}</div>
        <div class="stat-icon ${color}"><i class="fa-solid ${icon}"></i></div>
      </div>
      <div class="stat-value">${displayVal}</div>
      <div class="stat-footer">${change}<span class="stat-note">${note || ''}</span>${warnHTML}</div>
    </div>
  `;
}

// ===== PAGINATION =====
function renderPagination(current, total, perPage, totalItems, onPageClick) {
  const totalPages = Math.ceil(totalItems / perPage);
  let pages = '';
  for (let i = 1; i <= totalPages; i++) {
    pages += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="${onPageClick}(${i})">${i}</button>`;
  }
  const from = (current - 1) * perPage + 1;
  const to   = Math.min(current * perPage, totalItems);
  return `
    <div class="pagination">
      <span class="pagination-info">Menampilkan ${from}–${to} dari ${totalItems} data</span>
      <div class="pagination-btns">
        <button class="page-btn" onclick="${onPageClick}(${Math.max(1,current-1)})" ${current<=1?'disabled':''}>
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        ${pages}
        <button class="page-btn" onclick="${onPageClick}(${Math.min(totalPages,current+1)})" ${current>=totalPages?'disabled':''}>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

// ===== SWITCH TOGGLE =====
function switchToggle(id, checked, onchange) {
  return `
    <label class="switch">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} onchange="${onchange}">
      <span class="switch-track"></span>
    </label>
  `;
}

// ===== COPY TO CLIPBOARD =====
function copyToClipboard(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
    btnEl.style.color = 'var(--success)';
    setTimeout(() => { btnEl.innerHTML = orig; btnEl.style.color = ''; }, 2000);
    showToast('success', 'Berhasil disalin!');
  }).catch(() => showToast('error', 'Gagal menyalin.'));
}

// ===== CONFIRM MODAL =====
function confirmAction(title, msg, onConfirm, danger = true) {
  openModal(
    title,
    `<div class="alert ${danger ? 'alert-danger' : 'alert-warning'}">
      <i class="fa-solid fa-${danger ? 'triangle-exclamation' : 'circle-info'}"></i>
      <span>${msg}</span>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Batal</button>
     <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="closeModal();${onConfirm}">Ya, Lanjutkan</button>`
  );
}

// ===== RENDER PRODUCT THUMBNAIL =====
function productThumb(icon, bg = 'var(--accent-subtle)') {
  return `<div class="product-thumb" style="background:${bg}"><i class="${icon}" style="color:var(--accent-light)"></i></div>`;
}

// ===== LOADING OVERLAY =====
function showLoading(elId) {
  const el = document.getElementById(elId);
  if (el) el.innerHTML = renderSkeleton();
}

// ===== RANK NUMBER CLASS =====
function rankClass(n) {
  return n === 1 ? 'gold' : n === 2 ? 'silver' : n === 3 ? 'bronze' : '';
}

// ===== TABLE FILTER HELPER =====
function filterTable(query, data, fields) {
  const q = query.toLowerCase().trim();
  if (!q) return data;
  return data.filter(row => fields.some(f => String(row[f] || '').toLowerCase().includes(q)));
}
