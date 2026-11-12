const mongoose = require('mongoose');
const TgOrder = require('../models/TgOrder');
const TgUser = require('../models/TgUser');
const Product = require('../../backend/models/Product');
const { generateOrderId } = require('../utils/idGenerator');
const depositService = require('./depositService');

async function createOrder(tgUser, productId, variantId, qty, paymentMethod) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(productId).session(session);
    if (!product || !product.isActive) throw new Error('Product not available');
    
    const variant = product.variants.id(variantId);
    if (!variant || !variant.isActive) throw new Error('Variant not available');
    if (variant.stock !== -1 && variant.stock < qty) throw new Error('Insufficient stock');
    
    const totalPrice = variant.price * qty;
    
    let orderStatus = 'pending';
    let deposit = null;

    if (paymentMethod === 'balance') {
      if (tgUser.balance < totalPrice) throw new Error('Insufficient balance');
      tgUser.balance -= totalPrice;
      tgUser.total_orders += 1;
      tgUser.total_spending += totalPrice;
      await tgUser.save({ session });
      
      if (variant.stock !== -1) variant.stock -= qty;
      await product.save({ session });
      
      orderStatus = 'success';
    }

    const orderId = generateOrderId();
    const order = new TgOrder({
      order_id: orderId,
      user_id: tgUser._id,
      telegram_id: tgUser.telegram_id,
      product_id: product._id,
      product_name: product.name,
      variant_id: variant._id,
      variant_name: variant.name,
      quantity: qty,
      unit_price: variant.price,
      total_price: totalPrice,
      payment_method: paymentMethod,
      status: orderStatus
    });
    
    await order.save({ session });

    if (paymentMethod === 'qris') {
      deposit = await depositService.createDeposit(tgUser, totalPrice, orderId, session);
    }

    await session.commitTransaction();
    session.endSession();
    return { success: true, order, deposit };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, error: error.message };
  }
}

async function getUserOrders(telegram_id, page = 1, limit = 5) {
  const skip = (page - 1) * limit;
  const orders = await TgOrder.find({ telegram_id }).sort({ created_at: -1 }).skip(skip).limit(limit);
  const total = await TgOrder.countDocuments({ telegram_id });
  return { orders, totalPages: Math.ceil(total / limit) };
}

module.exports = { createOrder, getUserOrders };
