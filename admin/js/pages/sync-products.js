function renderSyncProducts() {
  const html = `
    <div class="page-header">
      <div>
        <div class="page-title">Sync Produk</div>
        <div class="page-subtitle">Sinkronisasi produk dari supplier</div>
      </div>
      <span class="badge badge-warning" style="font-size:12px;padding:6px 14px">
        <i class="fa-solid fa-hammer"></i> Dalam Pengembangan
      </span>
    </div>

    <!-- Under Development Card -->
    <div class="card" style="min-height:500px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;position:relative;overflow:hidden">

      <!-- Background glow -->
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none"></div>

      <!-- Animated icon -->
      <div style="position:relative;margin-bottom:32px">
        <div style="width:100px;height:100px;border-radius:50%;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;font-size:42px;color:var(--accent-light);animation:devPulse 2.5s ease-in-out infinite">
          <i class="fa-solid fa-rotate"></i>
        </div>
        <div style="position:absolute;top:-6px;right:-6px;width:28px;height:28px;border-radius:50%;background:var(--warning-bg);border:2px solid var(--bg-card);display:flex;align-items:center;justify-content:center;color:var(--warning);font-size:12px">
          <i class="fa-solid fa-hammer"></i>
        </div>
      </div>

      <!-- Title -->
      <h2 style="font-size:26px;font-weight:800;color:var(--text-primary);margin-bottom:12px">Fitur Sedang Dikembangkan</h2>
      <p style="font-size:14px;color:var(--text-muted);max-width:460px;line-height:1.7;margin-bottom:36px">
        Fitur <strong style="color:var(--text-secondary)">Sync Produk</strong> sedang dalam proses pengembangan.
        Fitur ini akan memungkinkan Anda menyinkronkan produk, harga, dan stok langsung dari supplier secara otomatis.
      </p>

      <!-- Feature preview chips -->
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:40px">
        ${[
          { icon:'fa-database',     label:'Sync dari Supplier' },
          { icon:'fa-tag',          label:'Update Harga Otomatis' },
          { icon:'fa-boxes-stacked',label:'Sinkronisasi Stok' },
          { icon:'fa-clock-rotate-left', label:'Jadwal Sync Berkala' },
          { icon:'fa-bell',         label:'Notifikasi Perubahan' },
        ].map(f => `
          <div style="display:flex;align-items:center;gap:7px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:99px;padding:7px 14px;font-size:12px;color:var(--text-secondary)">
            <i class="fa-solid ${f.icon}" style="color:var(--accent-light);font-size:11px"></i>${f.label}
          </div>`).join('')}
      </div>

      <!-- Progress bar -->
      <div style="width:100%;max-width:380px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:8px">
          <span>Progress Pengembangan</span>
          <span style="color:var(--accent-light);font-weight:700">35%</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar blue" style="width:35%;animation:devFill 1.5s ease-out both"></div>
        </div>
      </div>
      <p style="font-size:12px;color:var(--text-muted)">Estimasi selesai: segera tersedia</p>

      <!-- Notify button -->
      <div style="margin-top:32px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-primary" onclick="showToast('success','Anda akan diberitahu saat fitur ini tersedia!')">
          <i class="fa-solid fa-bell"></i> Beritahu Saya
        </button>
        <button class="btn btn-outline" onclick="navigate('dashboard')">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Dashboard
        </button>
      </div>
    </div>

    <style>
      @keyframes devPulse {
        0%,100% { transform:scale(1); box-shadow:0 0 0 0 rgba(59,130,246,0.15); }
        50%      { transform:scale(1.06); box-shadow:0 0 0 16px rgba(59,130,246,0); }
      }
      @keyframes devFill {
        from { width:0% }
        to   { width:35% }
      }
    </style>
  `;

  document.getElementById('pageContent').innerHTML = html;
}
