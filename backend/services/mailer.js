const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || user.includes('gmail.com') === false) {
    console.warn('⚠️  GMAIL_USER / GMAIL_APP_PASSWORD belum diset — email tidak aktif');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Template email verifikasi
 */
function verifyEmailTemplate({ storeName, userName, userEmail, verifyUrl }) {
  return {
    subject: `Verifikasi Email Akun Anda - ${storeName}`,
    html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Email</title>
</head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);border-radius:16px 16px 0 0;padding:28px 32px;text-align:left;">
              <p style="color:rgba(255,255,255,0.9);font-size:20px;font-weight:800;margin:0;letter-spacing:-0.3px;">${storeName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#16213e;border-radius:0 0 16px 16px;padding:36px 32px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:64px;height:64px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:16px;text-align:center;vertical-align:middle;font-size:28px;line-height:64px;">
                          ✉️
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Title -->
              <h1 style="color:#f1f5f9;font-size:22px;font-weight:800;text-align:center;margin:0 0 12px;">Verifikasi Email Akun</h1>
              <p style="color:#94a3b8;font-size:14px;text-align:center;line-height:1.6;margin:0 0 28px;">
                Halo <strong style="color:#f1f5f9;">${userName}</strong>, verifikasi email Anda untuk<br>
                mengaktifkan akun dan mulai berbelanja.
              </p>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0;">
                      Klik tombol di bawah ini untuk memverifikasi email akun
                      <strong style="color:#818cf8;">${userEmail}</strong>.
                      Link ini berlaku selama <strong style="color:#f1f5f9;">24 jam</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 48px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                  Verifikasi Email
                </a>
              </div>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="color:#fb923c;font-size:13px;line-height:1.6;margin:0;">
                      Jika Anda tidak merasa membuat akun ini, abaikan email ini.
                      Tidak ada perubahan apa pun sampai Anda menekan tombol verifikasi.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="color:#64748b;font-size:12px;line-height:1.7;margin:0 0 28px;">
                Jika tombol tidak bekerja, salin link berikut ke browser Anda:<br>
                <span style="color:#818cf8;word-break:break-all;font-size:11px;">${verifyUrl}</span>
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 20px;">

              <!-- Footer -->
              <p style="color:#475569;font-size:12px;text-align:center;line-height:1.7;margin:0;">
                Email ini dikirim karena Anda mendaftar akun di <strong style="color:#64748b;">${storeName}</strong>.<br>
                Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.<br><br>
                © ${new Date().getFullYear()} ${storeName}. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

/**
 * Kirim email verifikasi
 */
async function sendVerificationEmail({ to, userName, verifyUrl }) {
  const t = getTransporter();
  if (!t) return false;

  const storeName = process.env.STORE_NAME || 'Primexa';
  const { subject, html } = verifyEmailTemplate({ storeName, userName, userEmail: to, verifyUrl });

  try {
    await t.sendMail({
      from: `"${storeName}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email verifikasi terkirim ke: ${to}`);
    return true;
  } catch(e) {
    console.error('❌ Gagal kirim email:', e.message);
    return false;
  }
}

/**
 * Template email order sukses dengan kredensial
 */
function orderSuccessTemplate({ storeName, storeUrl, orderId, productName, variantName, price, subtotal, total, paymentMethod, paidAt, credentials, credentialNotes, customerName, transactionPin }) {
  const dateStr = paidAt ? new Date(paidAt).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-';
  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  // Buat baris-baris kredensial dari teks multi-baris
  const credLines = (credentials || '').trim().split('\n').filter(Boolean);
  const credHtml = credLines.length
    ? credLines.map(line => {
        const [key, ...rest] = line.split(':');
        const val = rest.join(':').trim();
        return val
          ? `<tr>
              <td style="color:#94a3b8;font-size:13px;padding:6px 0;width:120px;vertical-align:top;">${key.trim()}</td>
              <td style="color:#f1f5f9;font-size:14px;font-weight:600;padding:6px 0;word-break:break-all;">${val}</td>
            </tr>`
          : `<tr><td colspan="2" style="color:#f1f5f9;font-size:13px;padding:4px 0;word-break:break-all;">${line}</td></tr>`;
      }).join('')
    : `<tr><td colspan="2" style="color:#94a3b8;font-size:13px;padding:4px 0;">Data akun akan dikirim segera oleh admin.</td></tr>`;

  return {
    subject: `[${orderId}] Pesanan Sukses Diproses - ${storeName}`,
    html: `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pesanan Berhasil</title></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);border-radius:16px 16px 0 0;padding:24px 32px;">
            <p style="color:rgba(255,255,255,0.9);font-size:18px;font-weight:800;margin:0;">${storeName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#16213e;border-radius:0 0 16px 16px;padding:32px;">

            <!-- Icon + Title -->
            <div style="text-align:center;margin-bottom:24px;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;"><tr><td width="64" height="64" style="width:64px;height:64px;min-width:64px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:32px;text-align:center;vertical-align:middle;overflow:hidden;font-size:22px;line-height:64px;mso-line-height-rule:exactly;">&#9989;</td></tr></table>

              <h1 style="color:#f1f5f9;font-size:22px;font-weight:800;margin:0 0 8px;">Pesanan Berhasil!</h1>
              <p style="color:#94a3b8;font-size:14px;margin:0;">Terima kasih atas pembelian Anda. Pesanan telah selesai diproses dan data produk sudah tersedia.</p>
            </div>

            <!-- Transaction ID -->
            <div style="background:#0f172a;border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:20px;">
              <span style="color:#64748b;font-size:12px;">Transaction ID: </span>
              <span style="color:#818cf8;font-size:13px;font-weight:700;">${orderId}</span>
            </div>

            <!-- Order Summary -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;margin-bottom:20px;">
              <tr><td style="padding:20px 24px;">
                <p style="color:#f1f5f9;font-size:14px;font-weight:700;margin:0 0 14px;">📋 Detail Pesanan</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#94a3b8;font-size:13px;padding:5px 0;width:140px;">Produk</td>
                    <td style="color:#f1f5f9;font-size:13px;font-weight:600;padding:5px 0;">${productName}${variantName ? ' — ' + variantName : ''}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Metode Pembayaran</td>
                    <td style="color:#f1f5f9;font-size:13px;padding:5px 0;">${paymentMethod || '-'}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Tanggal</td>
                    <td style="color:#f1f5f9;font-size:13px;padding:5px 0;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:13px;padding:5px 0;">Subtotal</td>
                    <td style="color:#f1f5f9;font-size:13px;padding:5px 0;">${fmtRp(subtotal || total)}</td>
                  </tr>
                  <tr>
                    <td style="color:#94a3b8;font-size:13px;padding:5px 0;font-weight:700;">Total Dibayar</td>
                    <td style="color:#6366f1;font-size:14px;font-weight:800;padding:5px 0;">${fmtRp(total)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Credentials -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);border-radius:12px;margin-bottom:20px;border:1px solid rgba(99,102,241,0.3);">
              <tr><td style="padding:20px 24px;">
                <p style="color:#f1f5f9;font-size:14px;font-weight:700;margin:0 0 4px;">🔐 Data Akun / Kredensial</p>
                <p style="color:#64748b;font-size:12px;margin:0 0 16px;">Simpan data ini dengan aman. Jangan bagikan ke orang lain.</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${credHtml}
                </table>
                ${credentialNotes ? `<div style="margin-top:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:8px;padding:10px 14px;">
                  <p style="color:#fbbf24;font-size:12px;margin:0;">ℹ️ ${credentialNotes}</p>
                </div>` : ''}
              </td></tr>
            </table>

            <!-- PIN AKSES INVOICE -->
            ${transactionPin ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:12px;margin-bottom:20px;border:1px solid rgba(99,102,241,0.4);">
              <tr><td style="padding:24px;text-align:center;">
                <p style="color:#818cf8;font-size:13px;font-weight:700;letter-spacing:1px;margin:0 0 12px;">🔐 PIN AKSES INVOICE</p>
                <div style="display:inline-flex;gap:8px;justify-content:center;margin-bottom:14px;">
                  ${transactionPin.split('').map(d => `<span style="display:inline-block;width:40px;height:48px;background:#1e1b4b;border:2px solid rgba(99,102,241,0.5);border-radius:8px;font-size:24px;font-weight:900;color:#f1f5f9;line-height:48px;text-align:center;">${d}</span>`).join('')}
                </div>
                <p style="color:#94a3b8;font-size:12px;margin:0 0 8px;">Gunakan PIN ini untuk membuka detail pesanan dan data akun Anda.</p>
                <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:8px;padding:10px 14px;margin-top:10px;">
                  <p style="color:#fbbf24;font-size:11px;margin:0;">⚠️ Jangan berikan PIN ini kepada orang lain. PIN digunakan untuk mengakses data produk pada invoice Anda.</p>
                </div>
              </td></tr>
            </table>` : ''}

            <!-- CTA Button -->
            <div style="text-align:center;margin-bottom:16px;">
              <a href="${storeUrl}/invoice/${orderId}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;">📄 Lihat Invoice</a>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
              <p style="color:#64748b;font-size:12px;margin:0;">ℹ️ Detail produk dan data akun/lisensi dapat Anda akses melalui halaman invoice menggunakan PIN di atas.</p>
            </div>

            <p style="color:#64748b;font-size:12px;text-align:center;margin:0 0 8px;">Butuh bantuan? <a href="${storeUrl}/contact" style="color:#818cf8;text-decoration:none;">Hubungi Support</a></p>

            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:20px 0;">
            <p style="color:#475569;font-size:11px;text-align:center;line-height:1.7;margin:0;">
              Email ini dikirim karena Anda melakukan transaksi di ${storeName}.<br>
              Jika Anda tidak melakukan transaksi ini, abaikan email ini.<br><br>
              © ${new Date().getFullYear()} ${storeName}. All rights reserved.
            </p>

          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

/**
 * Kirim email order sukses + kredensial
 */
async function sendOrderSuccessEmail({ to, orderId, productName, variantName, price, subtotal, total, paymentMethod, paidAt, credentials, credentialNotes, customerName, transactionPin }) {
  const t = getTransporter();
  if (!t) return false;
  if (!to) return false;

  const storeName = process.env.STORE_NAME || 'Primexa';
  const storeUrl  = process.env.STORE_URL  || 'http://localhost:5500';

  const { subject, html } = orderSuccessTemplate({ storeName, storeUrl, orderId, productName, variantName, price, subtotal, total, paymentMethod, paidAt, credentials, credentialNotes, customerName, transactionPin });

  try {
    await t.sendMail({
      from: `"${storeName}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email order sukses + kredensial terkirim ke: ${to}`);
    return true;
  } catch(e) {
    console.error('❌ Gagal kirim email order:', e.message);
    return false;
  }
}

module.exports = { sendVerificationEmail, sendOrderSuccessEmail, sendPendingPaymentEmail, sendFailedOrderEmail, sendExpiredOrderEmail };


/**
 * Kirim email "Pesanan Gagal" ketika transaksi final FAILED
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.orderId
 * @param {string} opts.productName
 * @param {string} opts.variantName
 * @param {number} opts.productPrice
 * @param {number} opts.totalPayment
 * @param {string} opts.paymentMethod
 * @param {string} opts.productImage    - absolute HTTPS URL (opsional)
 * @param {string} opts.customerName
 */
async function sendFailedOrderEmail({ to, orderId, productName, variantName, productPrice, totalPayment, paymentMethod, productImage, customerName }) {
  const t = getTransporter();
  if (!t || !to) return false;

  const storeName  = process.env.STORE_NAME || 'Primexa';
  const storeUrl   = process.env.STORE_URL   || 'http://localhost:5500';
  const supportUrl = process.env.SUPPORT_URL || process.env.WA_URL || (storeUrl + '/contact');
  const shopUrl    = process.env.SHOP_URL    || storeUrl;

  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const esc   = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // WhatsApp deep-link with pre-filled message (no sensitive data)
  const waBase = process.env.WA_URL || '';
  const waNumber = process.env.WA_NUMBER || '';
  let ctaSupport = supportUrl;
  if (waNumber) {
    const waMsg = encodeURIComponent(`Halo Admin, saya ingin menanyakan transaksi yang gagal.\n\nTransaction ID: ${orderId}`);
    ctaSupport = `https://wa.me/${waNumber.replace(/\D/g,'')}?text=${waMsg}`;
  } else if (waBase && waBase.includes('wa.me')) {
    ctaSupport = waBase;
  }

  const imgHtml = productImage
    ? `<img src="${esc(productImage)}" width="44" height="44" style="width:44px;height:44px;border-radius:8px;object-fit:cover;display:block;" alt="${esc(productName)}">`
    : `<div style="width:44px;height:44px;background:#2d1b1b;border-radius:8px;display:inline-block;line-height:44px;text-align:center;font-size:22px;">🏷️</div>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pesanan Gagal - ${esc(orderId)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:24px 0;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header / Branding -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f172a,#1e2d4a);border-radius:16px 16px 0 0;padding:24px 32px;">
          <div style="font-size:20px;font-weight:800;color:#f1f5f9;line-height:1.3;">${esc(storeName)}</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#131c30;border-radius:0 0 16px 16px;padding:36px 28px;">

          <!-- Error Icon + Status -->
          <div style="text-align:center;margin-bottom:22px;">
            <div style="width:68px;height:68px;background:rgba(239,68,68,.15);border:2px solid rgba(239,68,68,.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:18px;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:22px;color:#fff;line-height:44px;text-align:center;">✕</div>
            </div>
            <h1 style="color:#f1f5f9;font-size:26px;font-weight:800;margin:0 0 10px;line-height:1.25;">Pesanan Gagal<br>Diproses</h1>
            <p style="color:#64748b;font-size:14px;margin:0;">Mohon maaf, pesanan Anda tidak dapat diproses.</p>
          </div>

          <!-- Transaction ID pill -->
          <div style="text-align:center;margin-bottom:22px;">
            <span style="display:inline-block;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:20px;padding:7px 18px;font-size:13px;color:#fca5a5;">
              Transaction ID: <strong>${esc(orderId)}</strong>
            </span>
          </div>

          <!-- Order Detail Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;margin-bottom:22px;">
            <tr><td style="padding:20px 22px;">

              <!-- Product row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:14px;">${imgHtml}</td>
                  <td valign="top">
                    <div style="color:#f1f5f9;font-size:15px;font-weight:700;line-height:1.3;">${esc(variantName || productName)}</div>
                    <div style="color:#64748b;font-size:13px;margin-top:3px;">${esc(variantName ? productName : '')}</div>
                  </td>
                  <td valign="top" align="right" style="white-space:nowrap;padding-left:10px;">
                    <div style="color:#94a3b8;font-size:14px;font-weight:700;">${fmtRp(productPrice || totalPayment)}</div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid #1e2d4a;margin-bottom:14px;"></div>

              <!-- Payment Method -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td><span style="color:#64748b;font-size:13px;">Metode Pembayaran</span></td>
                  <td align="right"><span style="color:#f1f5f9;font-size:13px;font-weight:600;">${esc(paymentMethod || '—')}</span></td>
                </tr>
              </table>

              <!-- Status -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td><span style="color:#64748b;font-size:13px;">Status Pesanan</span></td>
                  <td align="right"><span style="color:#ef4444;font-size:13px;font-weight:700;">✕ Gagal</span></td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid #1e2d4a;margin-bottom:14px;"></div>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><span style="color:#f1f5f9;font-size:14px;font-weight:700;">Total Pembayaran</span></td>
                  <td align="right"><span style="color:#f1f5f9;font-size:17px;font-weight:800;">${fmtRp(totalPayment)}</span></td>
                </tr>
              </table>

            </td></tr>
          </table>

          <!-- Hubungi Support CTA -->
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${esc(ctaSupport)}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:14px 48px;border-radius:12px;font-size:16px;font-weight:700;width:80%;max-width:320px;box-sizing:border-box;">Hubungi Support</a>
          </div>

          <!-- Kembali ke Toko -->
          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 22px;">
            Ingin mencoba lagi? <a href="${esc(shopUrl)}" style="color:#60a5fa;text-decoration:none;font-weight:600;">Kembali ke Toko</a>
          </p>

          <!-- Divider -->
          <div style="border-top:1px solid #1e2d4a;margin-bottom:16px;"></div>

          <!-- Apology -->
          <p style="color:#475569;font-size:13px;text-align:center;margin:0;">Kami mohon maaf atas ketidaknyamanan ini.</p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 28px;text-align:center;">
          <p style="color:#334155;font-size:12px;line-height:1.7;margin:0 0 6px;">
            Email ini dikirim karena Anda melakukan transaksi di ${esc(storeName)}.<br>
            Jika Anda tidak melakukan transaksi ini, abaikan email ini.
          </p>
          <p style="color:#1e293b;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} ${esc(storeName)}. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    await t.sendMail({
      from: `"${storeName}" <${process.env.GMAIL_USER}>`,
      to,
      subject: `[${orderId}] Pesanan Gagal - ${storeName}`,
      html,
    });
    console.log(`📧 [Email][Payment Failed] TRX ${orderId} email sent to: ${to}`);
    return true;
  } catch (e) {
    console.error(`❌ [Email][Payment Failed] TRX ${orderId} email failed:`, e.message);
    return false;
  }
}

/**
 * Kirim email notifikasi pembayaran kedaluwarsa
 */
async function sendExpiredOrderEmail({ to, orderId, productName, variantName, totalPayment, customerName }) {
  const t = getTransporter();
  if (!t || !to) return false;

  const storeName = process.env.STORE_NAME || 'Primexa';
  const storeUrl  = process.env.STORE_URL  || 'http://localhost:5500';
  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);border-radius:16px 16px 0 0;padding:28px 32px;">
          <p style="color:rgba(255,255,255,0.9);font-size:20px;font-weight:800;margin:0;">${esc(storeName)}</p>
        </td></tr>
        <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:32px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="font-size:48px;">⏰</span>
          </div>
          <h2 style="color:#f1f5f9;font-size:22px;font-weight:800;text-align:center;margin:0 0 8px;">Pembayaran Kedaluwarsa</h2>
          <p style="color:#94a3b8;font-size:14px;text-align:center;margin:0 0 24px;">
            Halo${customerName ? ', <strong style="color:#f1f5f9;">' + esc(customerName) + '</strong>' : ''}!
            Pesanan <strong style="color:#fbbf24;">${esc(orderId)}</strong> kedaluwarsa karena pembayaran tidak diselesaikan tepat waktu.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;margin-bottom:20px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;margin:0 0 10px;">RINGKASAN PESANAN</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#94a3b8;font-size:13px;">${esc(productName)}${variantName ? ' — ' + esc(variantName) : ''}</td>
                  <td align="right" style="color:#f1f5f9;font-size:13px;font-weight:700;">${fmtRp(totalPayment)}</td>
                </tr>
                <tr><td colspan="2" style="padding-top:10px;">
                  <span style="background:rgba(220,38,38,0.15);color:#f87171;font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;">Kedaluwarsa</span>
                </td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:14px 18px;">
              <p style="color:#fbbf24;font-size:13px;margin:0;line-height:1.6;">
                ⚠️ <strong>Pesanan tidak diproses.</strong> Jika masih ingin membeli, silakan buat pesanan baru.
              </p>
            </td></tr>
          </table>
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${storeUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;">🛒 Beli Lagi</a>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin:0 0 16px;">
            Butuh bantuan? <a href="${storeUrl}/contact" style="color:#818cf8;text-decoration:none;">Hubungi Support</a>
          </p>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:16px 0;">
          <p style="color:#475569;font-size:11px;text-align:center;line-height:1.7;margin:0;">
            Email ini dikirim karena Anda melakukan transaksi di ${esc(storeName)}.<br>
            © ${new Date().getFullYear()} ${esc(storeName)}. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await t.sendMail({
      from: `"${storeName}" <${process.env.GMAIL_USER}>`,
      to,
      subject: `[${orderId}] Pembayaran Kedaluwarsa - ${storeName}`,
      html,
    });
    console.log(`📧 [Email][Expired] TRX ${orderId} sent to: ${to}`);
    return true;
  } catch (e) {
    console.error(`❌ [Email][Expired] TRX ${orderId} failed:`, e.message);
    return false;
  }
}

/**
 * Kirim email "Menunggu Pembayaran" setelah transaksi berhasil dibuat
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.orderId
 * @param {string} opts.productName
 * @param {string} opts.variantName
 * @param {number} opts.productPrice
 * @param {number} opts.totalPayment
 * @param {string} opts.paymentMethod
 * @param {Date}   opts.expiresAt       - deadline pembayaran
 * @param {string} opts.productImage    - URL image produk (opsional)
 * @param {string} opts.customerName
 */
async function sendPendingPaymentEmail({ to, orderId, productName, variantName, productPrice, totalPayment, paymentMethod, expiresAt, productImage, customerName }) {
  const t = getTransporter();
  if (!t || !to) return false;

  const storeName = process.env.STORE_NAME || 'Primexa';
  const storeUrl  = process.env.STORE_URL  || 'http://localhost:5500';
  const supportUrl = process.env.SUPPORT_URL || process.env.WA_URL || (storeUrl + '/contact');
  const invoiceUrl = `${storeUrl}/invoice/${orderId}`;

  const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  const esc   = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // Format deadline dalam WIB
  let deadlineStr = '';
  if (expiresAt) {
    const d = new Date(expiresAt);
    deadlineStr = d.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) + ' WIB';
  }

  const imgHtml = productImage
    ? `<img src="${esc(productImage)}" width="40" height="40" style="width:40px;height:40px;border-radius:8px;object-fit:cover;display:block;" alt="${esc(productName)}">`
    : `<div style="width:40px;height:40px;background:#1e2d4a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:40px;text-align:center;">🏷️</div>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Menunggu Pembayaran - ${esc(orderId)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:24px 0;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header / Branding -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f172a,#1e2d4a);border-radius:16px 16px 0 0;padding:24px 32px;">
          <div style="font-size:20px;font-weight:800;color:#f1f5f9;line-height:1.3;">${esc(storeName)}</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#131c30;border-radius:0 0 16px 16px;padding:36px 32px;">

          <!-- Clock Icon + Status -->
          <div style="text-align:center;margin-bottom:28px;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;"><tr><td width="64" height="64" style="width:64px;height:64px;min-width:64px;background:#1e2d4a;border-radius:32px;text-align:center;vertical-align:middle;overflow:hidden;font-size:22px;line-height:64px;mso-line-height-rule:exactly;">&#128336;</td></tr></table>

            <h1 style="color:#f1f5f9;font-size:24px;font-weight:800;margin:0 0 10px;">Menunggu Pembayaran</h1>
            <p style="color:#64748b;font-size:14px;margin:0;line-height:1.6;">
              Pesanan <strong style="color:#818cf8;">${esc(orderId)}</strong> telah dibuat<br>dan menunggu pembayaran.
            </p>
          </div>

          <!-- Order Summary Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;margin-bottom:14px;">
            <tr><td style="padding:20px 24px;">
              <p style="color:#64748b;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 16px;">Ringkasan Pesanan</p>

              <!-- Product Row -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="48" valign="top" style="padding-right:14px;">${imgHtml}</td>
                  <td valign="top">
                    <div style="color:#f1f5f9;font-size:15px;font-weight:700;">${esc(productName)}</div>
                    <div style="color:#64748b;font-size:13px;margin-top:2px;">${esc(variantName || '')}</div>
                  </td>
                  <td valign="top" align="right" style="white-space:nowrap;">
                    <div style="color:#94a3b8;font-size:14px;font-weight:600;">${fmtRp(productPrice || totalPayment)}</div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid #1e2d4a;margin-bottom:14px;"></div>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><span style="color:#f1f5f9;font-size:14px;font-weight:700;">Total Pembayaran</span></td>
                  <td align="right"><span style="color:#60a5fa;font-size:18px;font-weight:800;">${fmtRp(totalPayment)}</span></td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Payment Method Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:14px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td><span style="color:#64748b;font-size:13px;">Metode Pembayaran:</span></td>
                  <td align="right"><span style="color:#f1f5f9;font-size:13px;font-weight:700;">${esc(paymentMethod || '—')}</span></td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:22px;">
            <a href="${invoiceUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:15px 48px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:.3px;">Bayar Sekarang</a>
          </div>

          ${deadlineStr ? `
          <!-- Deadline Warning -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:14px 18px;">
              <span style="color:#f59e0b;font-size:13px;line-height:1.6;">
                ⚠ <strong>Perhatian:</strong> Selesaikan pembayaran sebelum <strong>${deadlineStr}</strong> atau pesanan akan dibatalkan secara otomatis.
              </span>
            </td></tr>
          </table>` : ''}

          <!-- Divider -->
          <div style="border-top:1px solid #1e2d4a;margin-bottom:18px;"></div>

          <!-- Support -->
          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 8px;">
            Butuh bantuan? <a href="${esc(supportUrl)}" style="color:#60a5fa;text-decoration:none;font-weight:600;">Hubungi Support</a>
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 32px;text-align:center;">
          <p style="color:#334155;font-size:12px;line-height:1.7;margin:0 0 6px;">
            Email ini dikirim karena Anda melakukan transaksi di ${esc(storeName)}.<br>
            Jika Anda tidak melakukan transaksi ini, abaikan email ini.
          </p>
          <p style="color:#1e293b;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} ${esc(storeName)}. All rights reserved.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    await t.sendMail({
      from: `"${storeName}" <${process.env.GMAIL_USER}>`,
      to,
      subject: `[${orderId}] Menunggu Pembayaran - ${storeName}`,
      html,
    });
    console.log(`📧 [Email][Pending Payment] TRX ${orderId} email sent to: ${to}`);
    return true;
  } catch (e) {
    console.error(`❌ [Email][Pending Payment] TRX ${orderId} email failed:`, e.message);
    return false;
  }
}

