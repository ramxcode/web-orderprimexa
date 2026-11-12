// ===== PENGATURAN BOT — TERHUBUNG KE MONGODB =====

// ── renderBotSettings ──────────────────────────────────────────
async function renderBotSettings() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Pengaturan Bot</div><div class="page-subtitle">Konfigurasi dan kelola bot Telegram Anda</div></div>
    </div>
    <div id="botSettingsBody"><div class="skeleton" style="height:500px;border-radius:16px;"></div></div>
  `;

  let status = {}, settings = {}, userCount = 0;
  try { const r = await api.bot.getStatus(); status = r; } catch(e) {}
  try { const r = await api.bot.getSettings(); settings = r.settings || {}; } catch(e) {}
  try { const r = await api.orders.getAll({ limit: 1 }); userCount = r.total || 0; } catch(e) {}

  const isRunning = status.isOnline;
  const username  = status.username || settings.username || 'NamaBot';
  const tokenMasked = status.tokenMasked || '(belum dikonfigurasi)';

  document.getElementById('botSettingsBody').innerHTML = `
    <div class="grid-2-3" style="grid-template-columns:1fr 1.2fr;gap:16px">

      <!-- Status Card -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Status Bot</div>
          <div style="display:flex;align-items:center;gap:12px;padding:14px;background:${isRunning?'var(--success-bg)':'var(--error-bg)'};border-radius:10px;border:1px solid ${isRunning?'var(--success-border)':'var(--error-border)'}">
            <span class="status-dot ${isRunning?'online':'offline'}" style="width:12px;height:12px"></span>
            <div>
              <div style="font-size:14px;font-weight:700;color:${isRunning?'var(--success)':'var(--error)'}">${isRunning?'Bot Berjalan':'Bot Mati'}</div>
              <div style="font-size:12px;color:var(--text-muted)">@${username.replace('@','')}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn-success btn-sm" onclick="botAction('start')" ${isRunning?'disabled':''}><i class="fa-solid fa-play"></i> Start</button>
            <button class="btn btn-danger btn-sm"  onclick="botAction('stop')"  ${!isRunning?'disabled':''}><i class="fa-solid fa-stop"></i> Stop</button>
            <button class="btn btn-warning btn-sm" onclick="botAction('restart')"><i class="fa-solid fa-rotate-right"></i> Restart</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:16px">Statistik Bot</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${[
              {label:'Bot ID',     val: status.id        || '-'},
              {label:'Username',   val: '@' + (username.replace('@','')||'-')},
              {label:'Status',     val: isRunning ? '🟢 Online' : '🔴 Offline'},
              {label:'Token',      val: tokenMasked},
            ].map(s=>`
              <div style="padding:12px;background:var(--bg-elevated);border-radius:9px;text-align:center">
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);word-break:break-all">${s.val}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${s.label}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Config Form -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Konfigurasi Token Bot</div>
        <div class="form-group">
          <label class="form-label">Bot Token</label>
          <div class="input-group">
            <input type="password" class="form-control" placeholder="Masukkan token dari @BotFather..." id="botTokenField">
            <button class="input-group-btn" onclick="toggleField('botTokenField')"><i class="fa-solid fa-eye"></i></button>
          </div>
          <div class="form-hint">Dapatkan token dari @BotFather di Telegram. Token akan disimpan aman di database.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Chat ID Test</label>
          <div class="input-group">
            <input type="text" class="form-control" placeholder="@username atau angka chat ID..." id="botTestChatId">
            <button class="input-group-btn btn btn-outline" onclick="botTestSend()" title="Kirim pesan test">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <div class="form-hint">Untuk menguji koneksi bot setelah token disimpan.</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" style="flex:1" id="botSaveTokenBtn" onclick="botSaveToken()">
            <i class="fa-solid fa-plug"></i> Hubungkan Bot
          </button>
          <button class="btn btn-outline" onclick="renderBotSettings()">
            <i class="fa-solid fa-rotate-right"></i> Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- ── Pengaturan Telegraf Bot ─────────────────────────── -->
    <div class="card" style="margin-top:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <div style="width:36px;height:36px;border-radius:9px;background:var(--accent)1a;display:flex;align-items:center;justify-content:center;font-size:16px">⚙️</div>
        <div>
          <div class="card-title">Pengaturan Telegraf Bot</div>
          <div style="font-size:12px;color:var(--text-muted)">Disimpan ke MongoDB — aktif otomatis saat backend restart</div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--border-color);margin:14px 0">

      <!-- Kontak Admin -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">Kontak Admin</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Admin IDs <span style="color:var(--text-muted);font-weight:400;font-size:11px">(pisah koma)</span></label>
          <input type="text" class="form-control" id="tg_adminIds" value="${(settings.adminIds||[]).join(', ')}" placeholder="123456789, 987654321">
          <div class="form-hint">ID Telegram admin untuk akses /admin. Cek via @userinfobot.</div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Username Admin Telegram</label>
          <div style="display:flex;align-items:center">
            <span style="padding:0 10px;height:40px;display:flex;align-items:center;background:var(--bg-elevated);border:1px solid var(--border-color);border-right:none;border-radius:8px 0 0 8px;color:var(--text-muted);font-size:14px;flex-shrink:0">@</span>
            <input type="text" class="form-control" id="tg_adminUsername" value="${settings.adminUsername||''}" placeholder="usernameadmin" style="border-radius:0 8px 8px 0">
          </div>
          <div class="form-hint">Untuk tombol Hubungi Admin di bot.</div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">WhatsApp Admin</label>
          <div style="display:flex;align-items:center">
            <span style="padding:0 12px;height:40px;display:flex;align-items:center;background:var(--bg-elevated);border:1px solid var(--border-color);border-right:none;border-radius:8px 0 0 8px;color:#25D366;font-size:16px;flex-shrink:0"><i class="fa-brands fa-whatsapp"></i></span>
            <input type="text" class="form-control" id="tg_adminWhatsapp" value="${settings.adminWhatsapp||''}" placeholder="628123456789" style="border-radius:0 8px 8px 0">
          </div>
          <div class="form-hint">Format internasional 628xxx.</div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Telegram Kontak Admin</label>
          <div style="display:flex;align-items:center">
            <span style="padding:0 12px;height:40px;display:flex;align-items:center;background:var(--bg-elevated);border:1px solid var(--border-color);border-right:none;border-radius:8px 0 0 8px;color:#0088CC;font-size:16px;flex-shrink:0"><i class="fa-brands fa-telegram"></i></span>
            <input type="text" class="form-control" id="tg_adminTelegram" value="${settings.adminTelegram||''}" placeholder="usernameadmin" style="border-radius:0 8px 8px 0">
          </div>
          <div class="form-hint">Untuk tombol Hubungi via Telegram.</div>
        </div>

      </div>

      <!-- Tampilan & Produk -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">Tampilan & Produk</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">

        <div class="form-group" style="margin-bottom:0;grid-column:1/-1">
          <label class="form-label">Banner Bot</label>
          <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
            ${settings.bannerUrl ? `
            <div style="position:relative;flex-shrink:0">
              <img src="${settings.bannerUrl}" alt="Banner" style="height:72px;border-radius:8px;border:1px solid var(--border-color);object-fit:cover;max-width:200px">
              <button onclick="document.getElementById('tg_bannerUrl').value='';this.closest('.form-group').querySelector('img')?.remove();this.remove();" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--error);color:#fff;border:none;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0"><i class="fa-solid fa-xmark"></i></button>
            </div>` : ''}
            <div style="flex:1;min-width:220px">
              <div style="display:flex;gap:8px;margin-bottom:6px">
                <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:8px;padding:0 12px;height:36px;font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;transition:background .15s" onmouseover="this.style.background='var(--accent-bg)'" onmouseout="this.style.background='var(--bg-elevated)'">
                  <i class="fa-solid fa-upload" style="font-size:12px"></i> Upload Gambar
                  <input type="file" accept="image/*" style="display:none" onchange="botBannerUpload(this)">
                </label>
                <span style="font-size:12px;color:var(--text-muted);align-self:center">atau paste URL:</span>
              </div>
              <input type="text" class="form-control" id="tg_bannerUrl" value="${settings.bannerUrl||''}" placeholder="https://example.com/banner.jpg">
              <div class="form-hint">Upload gambar atau isi URL. Kosongkan = tanpa banner. Maks. ~2MB (disimpan sebagai base64).</div>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Produk per Halaman</label>
          <input type="number" class="form-control" id="tg_productsPerPage" value="${settings.productsPerPage||9}" min="3" max="20">
          <div class="form-hint">Jumlah produk per halaman (3–20).</div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Bahasa Default</label>
          <select class="form-control" id="tg_defaultLanguage">
            <option value="id" ${(settings.defaultLanguage||'id')==='id'?'selected':''}>🇮🇩 Bahasa Indonesia</option>
            <option value="en" ${settings.defaultLanguage==='en'?'selected':''}>🇬🇧 English</option>
          </select>
          <div class="form-hint">Bahasa default untuk user baru bot.</div>
        </div>

      </div>

      <!-- Deposit & Pembayaran -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">Deposit & Pembayaran</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Minimum Deposit (Rp)</label>
          <input type="number" class="form-control" id="tg_minDeposit" value="${settings.minDeposit||10000}" min="1000">
          <div class="form-hint">Batas minimum top up via bot.</div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Maksimum Deposit (Rp)</label>
          <input type="number" class="form-control" id="tg_maxDeposit" value="${settings.maxDeposit||5000000}">
          <div class="form-hint">Batas maksimum top up via bot.</div>
        </div>

        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Kadaluwarsa QRIS (menit)</label>
          <input type="number" class="form-control" id="tg_paymentExpireMinutes" value="${settings.paymentExpireMinutes||30}" min="5" max="1440">
          <div class="form-hint">Berapa menit QR code berlaku.</div>
        </div>

      </div>

      <div class="form-group">
        <label class="form-label">PayGomerch API Key</label>
        <div class="input-group">
          <input type="password" class="form-control" id="tg_paygomerchApiKey" placeholder="gpk_live_xxx... (kosongkan jika tidak ingin mengubah)">
          <button class="input-group-btn" onclick="toggleField('tg_paygomerchApiKey')"><i class="fa-solid fa-eye"></i></button>
        </div>
        <div class="form-hint">API key PayGomerch untuk QRIS deposit. Kosongkan = tidak mengubah key tersimpan.</div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin-top:4px">
        <button class="btn btn-primary" id="tgSaveSettingsBtn" onclick="botSaveTelegrafSettings()">
          <i class="fa-solid fa-floppy-disk"></i> Simpan Pengaturan Bot
        </button>
        <span style="font-size:12px;color:var(--text-muted)"><i class="fa-solid fa-circle-info"></i> Bot akan reload otomatis dalam ~30 detik setelah simpan</span>
      </div>
    </div>
  `;
}

async function botAction(action) {
  const labels = { start:'Menjalankan bot...', stop:'Menghentikan bot...', restart:'Merestart bot...' };
  const ok     = { start:'Bot berhasil dijalankan!', stop:'Bot berhasil dihentikan!', restart:'Bot berhasil di-restart!' };
  showToast('info', labels[action] || 'Memproses...');
  try {
    await api.bot[action]();
    showToast('success', ok[action]);
    setTimeout(renderBotSettings, 800);
  } catch(e) {
    showToast('error', e.message || 'Gagal: ' + action);
  }
}

async function botSaveToken() {
  const token = (document.getElementById('botTokenField')?.value || '').trim();
  if (!token || token.length < 20) { showToast('error', 'Token tidak valid (terlalu pendek)'); return; }
  const btn = document.getElementById('botSaveTokenBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan...'; }
  try {
    const r = await api.bot.connect(token);
    showToast('success', r.message || 'Bot berhasil terhubung!');
    setTimeout(renderBotSettings, 800);
  } catch(e) {
    showToast('error', e.message || 'Gagal menghubungkan bot');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plug"></i> Hubungkan Bot'; }
  }
}

function botBannerUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    showToast('error', 'Ukuran gambar terlalu besar. Maksimum 3MB.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;           // data:image/...;base64,...
    document.getElementById('tg_bannerUrl').value = base64;

    // Tampilkan preview
    const fg = input.closest('.form-group');
    let prev = fg.querySelector('img.banner-preview');
    if (!prev) {
      prev = document.createElement('img');
      prev.className = 'banner-preview';
      prev.style.cssText = 'height:72px;border-radius:8px;border:1px solid var(--border-color);object-fit:cover;max-width:200px;display:block;margin-bottom:6px';
      fg.querySelector('div[style*="flex:1"]').prepend(prev);
    }
    prev.src = base64;
    showToast('success', 'Gambar dipilih. Klik "Simpan" untuk menyimpan.');
  };
  reader.readAsDataURL(file);
}

async function botSaveTelegrafSettings() {
  const btn = document.getElementById('tgSaveSettingsBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }
  try {
    const adminIdsRaw = (document.getElementById('tg_adminIds')?.value || '').trim();
    const payload = {
      adminIds             : adminIdsRaw ? adminIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
      adminUsername        : (document.getElementById('tg_adminUsername')?.value || '').trim().replace(/^@/, ''),
      adminWhatsapp        : (document.getElementById('tg_adminWhatsapp')?.value || '').trim(),
      adminTelegram        : (document.getElementById('tg_adminTelegram')?.value || '').trim().replace(/^@/, ''),
      bannerUrl            : (document.getElementById('tg_bannerUrl')?.value || '').trim(),
      productsPerPage      : parseInt(document.getElementById('tg_productsPerPage')?.value) || 9,
      minDeposit           : parseInt(document.getElementById('tg_minDeposit')?.value) || 10000,
      maxDeposit           : parseInt(document.getElementById('tg_maxDeposit')?.value) || 5000000,
      paymentExpireMinutes : parseInt(document.getElementById('tg_paymentExpireMinutes')?.value) || 30,
      defaultLanguage      : document.getElementById('tg_defaultLanguage')?.value || 'id',
    };
    const apiKey = (document.getElementById('tg_paygomerchApiKey')?.value || '').trim();
    if (apiKey) payload.paygomerchApiKey = apiKey;

    await api.bot.saveSettings(payload);
    showToast('success', 'Pengaturan bot berhasil disimpan! Restart bot agar perubahan aktif.');
  } catch(e) {
    showToast('error', e.message || 'Gagal menyimpan pengaturan');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengaturan Bot'; }
  }
}


async function botTestSend() {
  const chatId = (document.getElementById('botTestChatId')?.value || '').trim();
  if (!chatId) { showToast('error', 'Masukkan Chat ID atau @username'); return; }
  showToast('info', 'Mengirim pesan test...');
  try {
    const r = await api.bot.test(chatId);
    showToast('success', r.message || 'Pesan test berhasil dikirim!');
  } catch(e) {
    showToast('error', e.message || 'Gagal kirim pesan test');
  }
}

// ===== PESAN OTOMATIS — DARI MONGODB =====
async function renderBotMessages() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Pesan Otomatis</div><div class="page-subtitle">Kustomisasi pesan yang dikirimkan bot ke customer</div></div>
      <button class="btn btn-primary" id="saveMsgBtn" onclick="saveAllMessages()"><i class="fa-solid fa-floppy-disk"></i> Simpan Semua</button>
    </div>
    <div id="botMsgBody"><div class="skeleton" style="height:400px;border-radius:16px;"></div></div>
  `;

  let msgs = {};
  try { const r = await api.bot.getMessages(); msgs = r.messages || {}; } catch(e) {}

  const varHelp = `<div style="margin-top:8px;padding:10px;background:var(--bg-elevated);border-radius:8px;font-size:11px;color:var(--text-muted)">
    <span style="font-weight:600;color:var(--accent-light)">Variabel tersedia:</span>
    {nama_customer} {invoice} {produk} {total} {status} {nama_toko}
  </div>`;

  document.getElementById('botMsgBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      ${[
        { key:'welcome', label:'Pesan Selamat Datang',       icon:'fa-hand-wave',    color:'var(--accent-light)' },
        { key:'success', label:'Transaksi Berhasil',          icon:'fa-circle-check', color:'var(--success)' },
        { key:'failed',  label:'Transaksi Gagal',             icon:'fa-circle-xmark', color:'var(--error)' },
        { key:'pending', label:'Pembayaran Belum Selesai',    icon:'fa-clock',        color:'var(--warning)' },
      ].map(msg => `
        <div class="card">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <div style="width:36px;height:36px;border-radius:9px;background:${msg.color}1a;display:flex;align-items:center;justify-content:center;color:${msg.color}">
              <i class="fa-solid ${msg.icon}"></i>
            </div>
            <div class="card-title">${msg.label}</div>
          </div>
          <textarea class="form-control" rows="5" id="msg_${msg.key}" style="font-family:monospace;font-size:12px;line-height:1.6">${msgs[msg.key] || ''}</textarea>
          ${varHelp}
        </div>`).join('')}
    </div>
  `;
}

async function saveAllMessages() {
  const btn = document.getElementById('saveMsgBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...'; }
  try {
    await api.bot.saveMessages({
      welcome: document.getElementById('msg_welcome')?.value || '',
      success: document.getElementById('msg_success')?.value || '',
      failed:  document.getElementById('msg_failed')?.value  || '',
      pending: document.getElementById('msg_pending')?.value || '',
    });
    showToast('success', 'Semua pesan otomatis berhasil disimpan ke database!');
  } catch(e) {
    showToast('error', e.message || 'Gagal menyimpan pesan');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Semua'; }
  }
}

// ===== INTEGRASI BOT =====
async function renderBotIntegration() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Integrasi Bot</div><div class="page-subtitle">Hubungkan bot ke platform pesan</div></div>
    </div>
    <div id="botIntegBody"><div class="skeleton" style="height:300px;border-radius:16px;"></div></div>
  `;

  let status = {};
  try { status = await api.bot.getStatus(); } catch(e) {}

  const isOnline = status.isOnline;
  document.getElementById('botIntegBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="width:50px;height:50px;border-radius:12px;background:#0088CC22;display:flex;align-items:center;justify-content:center;font-size:22px;color:#0088CC;flex-shrink:0">
          <i class="fa-brands fa-telegram"></i>
        </div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:16px;font-weight:700;color:var(--text-primary)">Telegram</div>
          <div style="font-size:12px;color:var(--text-muted)">Bot: @${(status.username||'').replace('@','')||'Belum dikonfigurasi'} ${status.id ? '· ID: ' + status.id : ''}</div>
        </div>
        <span style="display:flex;align-items:center;gap:6px;background:${isOnline?'var(--success-bg)':'var(--error-bg)'};color:${isOnline?'var(--success)':'var(--error)'};padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600">
          <span class="status-dot ${isOnline?'online':'offline'}"></span>${isOnline?'Terhubung':'Tidak Aktif'}
        </span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline btn-sm" onclick="botTestQuick()"><i class="fa-solid fa-plug"></i> Test</button>
          <button class="btn btn-outline btn-sm" onclick="navigate('bot-settings')"><i class="fa-solid fa-key"></i> Konfigurasi</button>
        </div>
      </div>

      <div class="card" style="border-style:dashed;display:flex;align-items:center;justify-content:center;gap:10px;padding:24px;cursor:pointer;color:var(--text-muted)" onclick="showToast('info','Fitur segera hadir!')">
        <i class="fa-solid fa-plus-circle" style="font-size:20px"></i>
        <span style="font-size:14px;font-weight:600">Tambah Integrasi Platform</span>
      </div>
    </div>
  `;
}

async function botTestQuick() {
  const chatId = prompt('Masukkan Chat ID atau @username untuk test:');
  if (!chatId) return;
  try {
    await api.bot.test(chatId.trim());
    showToast('success', 'Pesan test berhasil dikirim!');
  } catch(e) {
    showToast('error', e.message || 'Gagal kirim pesan test');
  }
}

// ===== LOG AKTIVITAS — DARI MONGODB =====
async function renderBotLogs() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="page-header">
      <div><div class="page-title">Log Aktivitas</div><div class="page-subtitle">Riwayat aktivitas dan event bot</div></div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="renderBotLogs()"><i class="fa-solid fa-rotate"></i> Refresh</button>
      </div>
    </div>
    <div id="botLogBody"><div class="skeleton" style="height:400px;border-radius:16px;"></div></div>
  `;

  let logs = [];
  try { const r = await api.bot.getLogs(); logs = r.logs || []; } catch(e) {}

  if (!logs.length) {
    document.getElementById('botLogBody').innerHTML = `
      <div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
        <i class="fa-solid fa-inbox" style="font-size:32px;margin-bottom:12px;display:block"></i>
        <div style="font-size:15px;font-weight:600">Belum ada log aktivitas</div>
        <div style="font-size:13px;margin-top:6px">Log akan muncul saat bot aktif dan menerima pesan</div>
      </div>`;
    return;
  }

  document.getElementById('botLogBody').innerHTML = `
    <div class="card">
      ${logs.map((l, i) => {
        const dotCls  = l.status === 'success' ? 'online' : l.status === 'error' ? 'offline' : 'pending';
        const badge   = l.status === 'success' ? 'badge-success' : l.status === 'error' ? 'badge-error' : 'badge-info';
        return `
          <div class="log-row">
            <div class="log-time">${l.time}</div>
            <div class="log-dot status-dot ${dotCls}" style="margin-top:5px"></div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${l.type}</span>
                <span class="badge ${badge}" style="font-size:10px">${l.status}</span>
              </div>
              <div class="log-text">${l.msg}</div>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}
