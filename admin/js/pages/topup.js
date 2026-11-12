function renderTopUp() {
  const html = `
    <div class="page-header">
      <div>
        <div class="page-title">Top Up Saldo</div>
        <div class="page-subtitle">Kelola dan tambahkan saldo akun Anda</div>
      </div>
    </div>

    <div class="grid-2-3 mb-24" style="grid-template-columns:1fr 1.4fr">

      <!-- Left: Saldo + Form -->
      <div style="display:flex;flex-direction:column;gap:16px">

        <!-- Saldo Card -->
        <div style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);border-radius:16px;padding:24px;color:#fff;position:relative;overflow:hidden">
          <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;opacity:0.75">Saldo Aktif</div>
          <div style="font-size:36px;font-weight:800;margin:8px 0">Rp 0</div>
          <div style="font-size:13px;opacity:0.75">admin@namaweb.id</div>
          <div style="position:absolute;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.07);top:-40px;right:-40px"></div>
          <div style="position:absolute;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.05);bottom:-30px;right:80px"></div>
        </div>

        <!-- Form Top Up -->
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Buat Top Up Baru</div>
          <div class="form-group">
            <label class="form-label">Nominal Top Up</label>
            <div class="input-group">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px">Rp</span>
              <input type="number" class="form-control" placeholder="0" style="padding-left:36px" id="topupAmount">
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
            ${[50000,100000,200000,500000,1000000].map(n=>`
              <button class="btn btn-outline btn-sm" onclick="setTopupAmount(${n})">${formatRp(n)}</button>`).join('')}
          </div>
          <div class="form-group">
            <label class="form-label">Metode Pembayaran</label>
            <select class="form-control" id="topupMethod">
              <option value="">-- Pilih metode --</option>
              <option>Transfer BCA</option>
              <option>Transfer Mandiri</option>
              <option>Transfer BNI</option>
              <option>QRIS</option>
              <option>GoPay</option>
              <option>OVO</option>
              <option>ShopeePay</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Catatan (opsional)</label>
            <input type="text" class="form-control" placeholder="Catatan top up..." id="topupNote">
          </div>
          <button class="btn btn-primary" style="width:100%" onclick="submitTopUp()">
            <i class="fa-solid fa-plus"></i> Buat Transaksi Top Up
          </button>
        </div>
      </div>

      <!-- Right: History -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Riwayat Top Up</div>
            <div class="card-subtitle">Histori transaksi top up saldo</div>
          </div>
        </div>
        <!-- Filters -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
          <div style="flex:1;min-width:180px;position:relative">
            <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i>
            <input type="text" class="form-control" placeholder="Cari ID, referensi..." style="padding-left:32px">
          </div>
          <input type="date" class="form-control" style="width:140px">
          <input type="date" class="form-control" style="width:140px">
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID Top Up</th><th>Nominal</th><th>Metode</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>
              ${TOPUP_HISTORY.map(t => `
                <tr>
                  <td><span style="color:var(--accent-light);font-weight:600;font-size:12px">${t.id}</span></td>
                  <td class="td-strong">${formatRp(t.amount)}</td>
                  <td><span style="font-size:12px;color:var(--text-secondary)">${t.method}</span></td>
                  <td>${statusBadge(t.status)}</td>
                  <td style="font-size:12px;color:var(--text-muted)">${t.date}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('pageContent').innerHTML = html;
}

function setTopupAmount(n) {
  const el = document.getElementById('topupAmount');
  if (el) el.value = n;
}

function submitTopUp() {
  const amount = document.getElementById('topupAmount')?.value;
  const method = document.getElementById('topupMethod')?.value;
  if (!amount || amount <= 0) { showToast('error','Masukkan nominal top up yang valid!'); return; }
  if (!method)                { showToast('error','Pilih metode pembayaran!');            return; }
  openModal('Konfirmasi Top Up',
    `<div style="display:grid;gap:12px;font-size:13px">
      <div class="d-flex justify-between"><span class="text-muted">Nominal</span><strong class="text-primary">${formatRp(+amount)}</strong></div>
      <div class="d-flex justify-between"><span class="text-muted">Metode</span><span class="text-primary">${method}</span></div>
      <div class="d-flex justify-between"><span class="text-muted">Status awal</span>${statusBadge('pending')}</div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Batal</button>
     <button class="btn btn-primary" onclick="closeModal();showToast('success','Transaksi top up berhasil dibuat!')">Konfirmasi</button>`
  );
}
