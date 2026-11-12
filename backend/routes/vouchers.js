/* ============================================================
   routes/vouchers.js — Admin + Public Voucher API
   ============================================================ */
const express  = require('express');
const router   = express.Router();
const Voucher  = require('../models/Voucher');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// ── Helper ────────────────────────────────────────────────────
function ok(res, data, status)  { res.status(status || 200).json({ success: true,  ...data }); }
function err(res, msg, status)  { res.status(status || 400).json({ success: false, message: msg }); }

/* ============================================================
   ADMIN ROUTES  —  semua butuh token + admin role
   ============================================================ */

// GET /api/admin/vouchers  — list semua voucher
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const { search, type, status } = req.query;
    let query = {};
    if (search)          query.$or = [{ code: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }];
    if (type)            query.type     = type;
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const vouchers = await Voucher.find(query).sort({ createdAt: -1 }).lean();
    const stats = {
      total:      vouchers.length,
      active:     vouchers.filter(v => v.isActive).length,
      inactive:   vouchers.filter(v => !v.isActive).length,
      totalUsage: vouchers.reduce((s, v) => s + (v.quotaUsed || 0), 0),
    };
    ok(res, { vouchers: vouchers.map(v => ({ ...v, usageHistory: undefined })), stats });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/admin/vouchers  — buat voucher baru
router.post('/admin', auth, adminOnly, async (req, res) => {
  try {
    const { code, name, type, value } = req.body;
    if (!code || !name || !type || value == null) return err(res, 'Field code, name, type, value wajib diisi');
    if (await Voucher.findOne({ code: code.toUpperCase() })) return err(res, 'Kode voucher sudah digunakan');

    const voucher = await Voucher.create({ ...req.body, code: code.toUpperCase(), quotaUsed: 0 });
    ok(res, { voucher }, 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/admin/vouchers/:id  — update voucher
router.put('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { ...req.body, code: req.body.code?.toUpperCase() },
      { new: true, runValidators: true }
    );
    if (!voucher) return err(res, 'Voucher tidak ditemukan', 404);
    ok(res, { voucher });
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/admin/vouchers/:id
router.delete('/admin/:id', auth, adminOnly, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return err(res, 'Voucher tidak ditemukan', 404);
    ok(res, { message: 'Voucher berhasil dihapus' });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/admin/vouchers/:id/usage  — riwayat pemakaian
router.get('/admin/:id/usage', auth, adminOnly, async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('usageHistory.userId', 'name email')
      .populate('usageHistory.orderId', 'invoice');
    if (!voucher) return err(res, 'Voucher tidak ditemukan', 404);
    ok(res, { usage: voucher.usageHistory });
  } catch (e) { err(res, e.message, 500); }
});

/* ============================================================
   PUBLIC ROUTES  —  tidak butuh auth
   ============================================================ */

// GET /api/vouchers  — voucher aktif untuk halaman /promo
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
    })
    .select('-usageHistory')
    .sort({ isFeatured: -1, createdAt: -1 })
    .lean();
    ok(res, { vouchers });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/vouchers/validate  — validasi voucher di checkout
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || subtotal == null) return err(res, 'code dan subtotal wajib diisi');

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });
    if (!voucher) return err(res, 'Kode voucher tidak ditemukan atau tidak aktif');

    const result = voucher.checkValidity(req.user._id, subtotal);
    if (!result.valid) return err(res, result.reason);

    const discount = voucher.calcDiscount(subtotal);
    ok(res, {
      voucher: {
        id:       voucher._id,
        code:     voucher.code,
        name:     voucher.name,
        type:     voucher.type,
        value:    voucher.value,
      },
      discount,
      finalAmount: subtotal - discount,
    });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
