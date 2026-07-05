// POST /api/create-order
// Body: { amount: <integer, paise>, currency?: "INR", receipt?: string }
// Returns: { order_id, amount, currency }
//
// Creating the order server-side (instead of trusting an amount typed
// in the browser) is what stops a customer from tampering with the
// price before checkout opens.

const Razorpay = require('razorpay');

// TODO: replace with your actual GitHub Pages origin if different
// (e.g. a custom domain), or set ALLOWED_ORIGIN as an env var instead.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://travelog7733.github.io';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(401).json({ error: 'Razorpay credentials not configured on server' });
  }

  try {
    const { amount, currency, receipt } = req.body || {};
    const amountInPaise = Math.round(Number(amount));

    if (!amountInPaise || Number.isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1.00)' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    const isAuthError = err.statusCode === 401;
    return res.status(isAuthError ? 401 : 500).json({
      error: isAuthError ? 'Razorpay authentication failed' : 'Failed to create order',
    });
  }
};
