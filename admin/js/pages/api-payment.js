const API_BASE_URL  = 'https://api.namaweb.id/v1';
const API_TOKEN_VAL = 'nw_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const WEBHOOK_URL   = 'https://namaweb.id/api/webhook/payment';

function renderApiPayment() {
  const html = `
    <div class="page-header">
      <div>
        <div class="page-title">API Pembayaran</div>
        <div class="page-subtitle">Dokumentasi dan konfigurasi API integrasi pembayaran</div>
      </div>
    </div>

    <!-- Config Cards -->
    <div class="grid-2 mb-24">

      <!-- Credentials -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px"><i class="fa-solid fa-key" style="color:var(--accent-light);margin-right:8px"></i>Kredensial API</div>

        <div class="form-group">
          <label class="form-label">Base URL</label>
          <div style="display:flex;gap:8px">
            <input type="text" class="form-control" value="${API_BASE_URL}" readonly id="apiBaseUrl">
            <button class="btn btn-outline btn-icon" title="Salin" onclick="copyToClipboard('${API_BASE_URL}',this)"><i class="fa-solid fa-copy"></i></button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">API Token</label>
          <div style="display:flex;gap:8px">
            <div class="input-group" style="flex:1">
              <input type="password" class="form-control" value="${API_TOKEN_VAL}" readonly id="apiTokenField">
              <button class="input-group-btn" onclick="toggleField('apiTokenField')" title="Tampilkan"><i class="fa-solid fa-eye"></i></button>
            </div>
            <button class="btn btn-outline btn-icon" title="Salin" onclick="copyToClipboard('${API_TOKEN_VAL}',this)"><i class="fa-solid fa-copy"></i></button>
          </div>
          <div class="form-hint">Jangan bagikan token ini kepada siapapun.</div>
        </div>

        <div class="form-group">
          <label class="form-label">Webhook URL</label>
          <div style="display:flex;gap:8px">
            <input type="text" class="form-control" value="${WEBHOOK_URL}" readonly id="webhookUrlField">
            <button class="btn btn-outline btn-icon" title="Salin" onclick="copyToClipboard('${WEBHOOK_URL}',this)"><i class="fa-solid fa-copy"></i></button>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:8px;margin-top:8px">
          <span style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--success)">
            <span class="status-dot online"></span>API Terhubung
          </span>
          <span style="font-size:11px;color:var(--text-muted)">Latensi: 84ms</span>
        </div>

        <button class="btn btn-danger" style="margin-top:16px;width:100%" onclick="confirmRegenToken()">
          <i class="fa-solid fa-rotate-right"></i> Generate Ulang Token
        </button>
      </div>

      <!-- Docs -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px"><i class="fa-solid fa-book" style="color:var(--accent-light);margin-right:8px"></i>Contoh Request</div>

        <div class="code-header">
          <span class="code-lang">POST /orders</span>
          <button class="btn btn-ghost btn-xs" onclick="copyToClipboard(document.getElementById('codeReq').innerText,this)"><i class="fa-solid fa-copy"></i> Salin</button>
        </div>
        <div class="code-block" id="codeReq">curl -X POST ${API_BASE_URL}/orders \\
  -H "Authorization: Bearer {API_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_id": "PROD-001",
    "customer_email": "user@example.com",
    "payment_method": "qris",
    "quantity": 1
  }'</div>

        <div style="margin-top:16px">
          <div class="code-header">
            <span class="code-lang">Response 201</span>
            <button class="btn btn-ghost btn-xs" onclick="copyToClipboard(document.getElementById('codeRes').innerText,this)"><i class="fa-solid fa-copy"></i> Salin</button>
          </div>
          <div class="code-block" id="codeRes" style="color:#86EFAC">{
  "success": true,
  "data": {
    "invoice": "INV-20260625-XXXXX",
    "product": "CapCut Pro – 30 Hari",
    "total": 21281,
    "status": "pending",
    "payment_url": "https://payment.example.com/pay/xxx",
    "expired_at": "2026-06-25T16:32:00Z"
  }
}</div>
        </div>
      </div>
    </div>

    <!-- API Logs -->
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">Log Request API</div><div class="card-subtitle">Riwayat request API terbaru</div></div>
        <button class="btn btn-outline btn-sm" onclick="showToast('success','Log diperbarui!')"><i class="fa-solid fa-rotate"></i></button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Waktu</th><th>Method</th><th>Endpoint</th><th>Status</th><th>Durasi</th></tr></thead>
          <tbody>
            ${API_LOGS.map(l => {
              const isOk = l.status < 300;
              const isWarn = l.status >= 400 && l.status < 500;
              const cls = isOk ? 'badge-success' : isWarn ? 'badge-warning' : 'badge-error';
              const mClr = l.method === 'POST' ? 'var(--accent-light)' : l.method === 'GET' ? 'var(--success)' : 'var(--warning)';
              return `<tr>
                <td style="font-size:12px;color:var(--text-muted)">${l.time}</td>
                <td><span style="color:${mClr};font-weight:700;font-size:12px">${l.method}</span></td>
                <td style="font-family:monospace;font-size:12px;color:var(--text-secondary)">${l.endpoint}</td>
                <td><span class="badge ${cls}">${l.status}</span></td>
                <td style="font-size:12px;color:var(--text-muted)">${l.duration}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('pageContent').innerHTML = html;
}

function toggleField(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function confirmRegenToken() {
  openModal('⚠️ Generate Ulang Token',
    `<div class="alert alert-danger" style="margin-bottom:12px">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span><strong>Peringatan!</strong> Generate ulang token akan membatalkan token yang sedang aktif. Semua integrasi yang menggunakan token lama akan berhenti berfungsi.</span>
    </div>
    <p style="font-size:13px;color:var(--text-secondary)">Pastikan Anda sudah menyimpan token baru dan memperbarui semua konfigurasi sebelum melanjutkan.</p>`,
    `<button class="btn btn-outline" onclick="closeModal()">Batal</button>
     <button class="btn btn-danger" onclick="closeModal();regenToken()"><i class="fa-solid fa-rotate-right"></i> Ya, Generate Ulang</button>`
  );
}

function regenToken() {
  showToast('success', 'Token baru berhasil digenerate! Simpan token Anda.');
}
