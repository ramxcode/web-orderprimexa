const TgDeposit = require('../models/TgDeposit');
const TgUser = require('../models/TgUser');
const paymentService = require('./paymentService');
const { generateDepositId } = require('../utils/idGenerator');

async function createDeposit(tgUser, amount, idempotencyKey = null, session = null) {
  const depositId = generateDepositId();
  const paymentRes = await paymentService.generateQRIS(amount, depositId);
  
  if (!paymentRes || !paymentRes.transaction_id) {
    throw new Error('Failed to generate QRIS');
  }

  const deposit = new TgDeposit({
    deposit_id: depositId,
    user_id: tgUser._id,
    telegram_id: tgUser.telegram_id,
    amount,
    payment_reference: paymentRes.transaction_id,
    qris_url: paymentRes.qris_url,
    expired_at: paymentRes.expired_at,
    idempotency_key: idempotencyKey || paymentRes.transaction_id
  });
  
  if (session) {
    await deposit.save({ session });
  } else {
    await deposit.save();
  }
  
  return deposit;
}

async function checkDepositStatus(depositId) {
  const deposit = await TgDeposit.findOne({ deposit_id: depositId });
  if (!deposit) throw new Error('Deposit not found');
  if (deposit.status !== 'pending') return deposit;
  
  const statusRes = await paymentService.checkPaymentStatus(deposit.payment_reference);
  if (!statusRes) return deposit;

  if (statusRes.status === 'settlement' || statusRes.status === 'success') {
    deposit.status = 'paid';
    deposit.paid_at = new Date();
    await deposit.save();

    const user = await TgUser.findById(deposit.user_id);
    if (user) {
      user.balance += deposit.amount;
      await user.save();
    }
  } else if (statusRes.status === 'expire') {
    deposit.status = 'expired';
    await deposit.save();
  } else if (statusRes.status === 'cancel' || statusRes.status === 'failed') {
    deposit.status = 'cancelled';
    await deposit.save();
  }
  
  return deposit;
}

async function getUserDeposits(telegram_id, page = 1, limit = 5) {
  const skip = (page - 1) * limit;
  const deposits = await TgDeposit.find({ telegram_id }).sort({ created_at: -1 }).skip(skip).limit(limit);
  const total = await TgDeposit.countDocuments({ telegram_id });
  return { deposits, totalPages: Math.ceil(total / limit) };
}

module.exports = { createDeposit, checkDepositStatus, getUserDeposits };
