/**
 * Balance & Topup History Routes
 * GET /api/balance/history  — riwayat penggunaan saldo (pembelian via saldo)
 * GET /api/topup/history    — riwayat topup saldo
 */
const router = require("express").Router();
const auth   = require("../middleware/auth");
const Order  = require("../models/Order");

// GET /api/balance/history
// Riwayat penggunaan saldo (order yang dibayar via saldo, milik user ini)
router.get("/balance/history", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({
      userId,
      paymentMethod: { $in: ["balance", "Balance", "saldo", "Saldo"] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("orderId productName items total status createdAt paymentMethod")
      .lean();

    const transactions = orders.map(o => {
      const item = o.items && o.items[0] ? o.items[0] : {};
      return {
        type:        "out",
        amount:      o.total || 0,
        description: "Pembelian: " + (item.productName || o.productName || o.orderId),
        orderId:     o.orderId,
        status:      o.status,
        createdAt:   o.createdAt,
      };
    });

    res.json({ success: true, transactions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/topup/history
// Riwayat topup saldo
router.get("/topup/history", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    let transactions = [];
    try {
      const TgDeposit = require("../models/TgDeposit");
      const deposits = await TgDeposit.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      transactions = deposits.map(d => ({
        type:        "in",
        amount:      d.amount || 0,
        description: "Top Up Saldo" + (d.method ? " via " + d.method : ""),
        status:      d.status || "completed",
        createdAt:   d.createdAt,
      }));
    } catch (_) {}

    res.json({ success: true, transactions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
