const axios = require('axios');
const { getConfig } = require('./configService');

async function generateQRIS(amount, orderId) {
  const config = getConfig();
  try {
    const res = await axios.post('https://v1-api.paygomerch.biz.id/qris/create', {
      amount,
      order_id: orderId
    }, {
      headers: {
        'Authorization': `Bearer ${config.paygomerchApiKey}`
      }
    });
    return res.data;
  } catch (err) {
    console.error('PayGomerch create error:', err.response?.data || err.message);
    return null;
  }
}

async function checkPaymentStatus(transactionId) {
  const config = getConfig();
  try {
    const res = await axios.post('https://v1-api.paygomerch.biz.id/qris/status', {
      transaction_id: transactionId
    }, {
      headers: {
        'Authorization': `Bearer ${config.paygomerchApiKey}`
      }
    });
    return res.data;
  } catch (err) {
    console.error('PayGomerch status error:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { generateQRIS, checkPaymentStatus };
