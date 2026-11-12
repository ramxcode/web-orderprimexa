const express  = require("express");
const https    = require("https");
const Config   = require("../models/Config");
const auth     = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();
const GATEPAY_HOST = "gatepay.biz.id";

// ── Helper: call GatePay API ──────────────────────────────────
const crypto = require("crypto");
function callGatePay(method, path, body, apiKey, idempotencyKey) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    // Generate Idempotency-Key: gunakan yang diberikan, atau auto-generate
    const idemKey = idempotencyKey || crypto.randomUUID();
    const opts = {
      hostname: GATEPAY_HOST,
      port: 443,
      path,
      method,
      headers: {
        "x-api-key":    apiKey,
        "content-type": "application/json",
        "accept":       "application/json",
        "Idempotency-Key": idemKey,
        ...(postData ? { "content-length": Buffer.byteLength(postData) } : {}),
      },
    };
    const req = https.request(opts, res => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) return reject(new Error(parsed.message || parsed.error || "GatePay error " + res.statusCode));
          resolve(parsed);
        } catch (e) {
          reject(new Error("Invalid JSON from GatePay: " + data.slice(0, 200)));
        }
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ── GET /settings — Ambil API key & settings tersimpan ──────
router.get("/settings", auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: "gatepay_api_key" });
    const set = await Config.findOne({ key: "gatepay_settings" });
    const apiKey = cfg?.value || "";
    const masked = apiKey
      ? apiKey.slice(0, 8) + "•".repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4)
      : "";
    res.json({ success: true, data: { hasKey: !!apiKey, apiKey: masked, settings: set?.value || {} } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /settings — Simpan API key & webhook secret ─────────
router.post("/settings", auth, adminOnly, async (req, res) => {
  try {
    const { apiKey, webhookSecret } = req.body;
    if (!apiKey && !webhookSecret) return res.status(400).json({ success: false, message: "API Key atau Webhook Secret wajib diisi" });
    if (apiKey) {
      await Config.findOneAndUpdate(
        { key: "gatepay_api_key" },
        { key: "gatepay_api_key", value: apiKey },
        { upsert: true }
      );
    }
    if (webhookSecret) {
      await Config.findOneAndUpdate(
        { key: "gatepay_webhook_secret" },
        { key: "gatepay_webhook_secret", value: webhookSecret },
        { upsert: true }
      );
    }
    res.json({ success: true, message: "Pengaturan GatePay berhasil disimpan" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});


// ── POST /test — Cek koneksi ──────────────────────────────────
router.post("/test", auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: "gatepay_api_key" });
    if (!cfg?.value) return res.status(400).json({ success: false, message: "API Key belum diatur" });
    // Test auth: kirim amount di bawah minimum (1) ke endpoint buat transaksi
    // Key valid → 400 (amount invalid) = koneksi OK
    // Key invalid → 401 = gagal
    try {
      await callGatePay("POST", "/api/qrisgatepay/v1/payments", { amount: 1 }, cfg.value);
    } catch (e) {
      const msg = (e.message || '').toLowerCase();
      // Hanya re-throw jika jelas error autentikasi
      if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('unauthenticated') || msg.includes('forbidden') || msg.includes('error 401') || msg.includes('error 403')) {
        throw e;
      }
      // Error lain (400 amount invalid/minimal, dll) berarti key valid, koneksi OK
    }
    res.json({ success: true, message: "Koneksi ke GatePay berhasil! API Key valid." });
  } catch (e) {
    res.status(500).json({ success: false, message: "Gagal: " + e.message });
  }
});

// ── POST /orders — Buat transaksi baru (GatePay QRIS) ────────
router.post("/orders", auth, adminOnly, async (req, res) => {
  try {
    const { amount, order_id, note, admin_mode, expiry_minutes } = req.body;
    if (!amount || amount < 500) return res.status(400).json({ success: false, message: "amount wajib diisi (min. 500)" });
    const cfg = await Config.findOne({ key: "gatepay_api_key" });
    if (!cfg?.value) return res.status(400).json({ success: false, message: "API Key GatePay belum diatur" });
    const payload = { amount: Number(amount) };
    if (order_id)        payload.order_id        = order_id;
    if (note)            payload.note            = note;
    if (admin_mode)      payload.admin_mode      = admin_mode;
    if (expiry_minutes)  payload.expiry_minutes  = Number(expiry_minutes);
    const result = await callGatePay("POST", "/api/qrisgatepay/v1/payments", payload, cfg.value, order_id || crypto.randomUUID());
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /orders/:id — Cek status transaksi ───────────────────
router.get("/orders/:id", auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: "gatepay_api_key" });
    if (!cfg?.value) return res.status(400).json({ success: false, message: "API Key belum diatur" });
    const result = await callGatePay("GET", "/api/qrisgatepay/v1/payments/" + req.params.id, null, cfg.value);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /orders/:id/cancel — Batalkan transaksi ─────────────
router.post("/orders/:id/cancel", auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: "gatepay_api_key" });
    if (!cfg?.value) return res.status(400).json({ success: false, message: "API Key belum diatur" });
    const body = {};
    if (req.body && req.body.reason) body.reason = req.body.reason;
    const result = await callGatePay("POST", "/api/qrisgatepay/v1/payments/" + req.params.id + "/cancel", body, cfg.value);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /transactions — Daftar transaksi GatePay dari DB ─────
router.get("/transactions", auth, adminOnly, async (req, res) => {
  try {
    const Order = require("../models/Order");
    // Cari orders yang dibayar via GatePay / Orderkuota / QRIS
    const orders = await Order.find({
      $or: [
        { paymentMethod: { $regex: /gatepay/i } },
        { paymentMethod: { $regex: /orderkuota/i } },
        { paymentRef:    { $regex: /^ord_/i } },
        { paymentMethod: { $regex: /^qris/i } },
      ]
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

    // Normalisasi status agar sesuai format tabel (settlement / pending / expire / cancel)
    const statusMap = {
      paid:       'settlement',
      completed:  'settlement',
      processing: 'settlement',
      pending:    'pending',
      expired:    'expire',
      cancelled:  'cancel',
      refunded:   'cancel',
    };

    const transactions = orders.map(function(o) {
      return {
        id:           o.orderId      || String(o._id).slice(-8).toUpperCase(),
        reference:    o.paymentRef   || '',
        time:         o.createdAt    ? new Date(o.createdAt).toLocaleString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-',
        amount:       o.total        || 0,
        payment_type: 'qris',
        status:       statusMap[o.status] || o.status || 'pending',
        issuer:       o.customerName || o.customerEmail || '',
      };
    });

    res.json({ success: true, data: { transactions } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /webhook — Terima notifikasi dari GatePay (HMAC verified) ──
router.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Ambil raw body untuk verifikasi signature
    const rawBody = typeof req.body === 'string' ? req.body
                  : Buffer.isBuffer(req.body) ? req.body.toString('utf8')
                  : JSON.stringify(req.body);
    const payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
                  ? JSON.parse(rawBody)
                  : req.body;

    const sig = (req.headers['x-gatepay-signature'] || '').replace(/^v1=/, '');
    const ts  = req.headers['x-gatepay-timestamp']  || '';
    const eventName = req.headers['x-gatepay-event'] || payload.event || '';
    const eventId   = req.headers['x-gatepay-event-id'] || '';

    console.log("[GatePay Webhook]", eventName, "eventId:", eventId, JSON.stringify(payload).slice(0, 500));

    // Verifikasi HMAC signature jika webhook_secret dikonfigurasi
    const whCfg = await Config.findOne({ key: "gatepay_webhook_secret" });
    if (whCfg?.value && sig && ts) {
      const crypto = require('crypto');
      const expected = crypto.createHmac('sha256', whCfg.value)
        .update(ts + '.' + rawBody)
        .digest('hex');
      if (sig !== expected) {
        console.warn("[GatePay Webhook] Signature mismatch — rejected");
        return res.status(400).json({ received: false, message: "Invalid signature" });
      }
    }

    // Proses berdasarkan event
    const Order = require("../models/Order");
    const data = payload.data || {};
    const ref = data.reference || data.order_id || payload.reference || '';

    if (!ref) {
      return res.status(200).json({ received: true }); // no ref, nothing to update
    }

    if (eventName === 'payment.paid') {
      const order = await Order.findOneAndUpdate(
        { $or: [{ paymentRef: ref }, { orderId: ref }], status: { $nin: ['paid', 'completed', 'processing'] } },
        { status: 'paid', paidAt: new Date() },
        { new: true }
      );
      if (order) {
        console.log("[GatePay Webhook] Order", order.orderId, "→ paid");
        // Auto-fulfill (kirim akun ke customer)
        const { autoFulfillOrder } = require('./orders');
        if (typeof autoFulfillOrder === 'function') {
          setImmediate(() => autoFulfillOrder(order));
        }
      }
    } else if (eventName === 'payment.expired') {
      await Order.findOneAndUpdate(
        { $or: [{ paymentRef: ref }, { orderId: ref }], status: { $nin: ['paid', 'completed', 'processing'] } },
        { status: 'cancelled' }
      );
    } else if (eventName === 'payment.cancelled') {
      await Order.findOneAndUpdate(
        { $or: [{ paymentRef: ref }, { orderId: ref }], status: { $nin: ['paid', 'completed', 'processing'] } },
        { status: 'cancelled' }
      );
    }

    res.status(200).json({ received: true });
  } catch (e) {
    console.error("[GatePay Webhook] Error:", e.message);
    res.status(200).json({ received: true }); // always 2xx per docs
  }
});

module.exports = router;