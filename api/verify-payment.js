// POST /api/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Returns: { success: true, payment_id } only if the signature is valid.
//
// This is the step that actually confirms a payment happened — never
// trust the frontend's "success" callback alone, since that can be
// spoofed. Recompute the signature server-side with the Key Secret
// and compare.

const crypto = require('crypto');

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

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(401).json({ error: 'Razorpay credentials not configured on server' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to avoid timing attacks.
    const expected = Buffer.from(expectedSignature, 'utf8');
    const received = Buffer.from(String(razorpay_signature), 'utf8');
    const isValid =
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Signature verification failed' });
    }

    // TODO: once you have a database, mark the booking/order as paid here
    // using razorpay_order_id / razorpay_payment_id as the reference.

    return res.status(200).json({ success: true, payment_id: razorpay_payment_id });
  } catch (err) {
    console.error('Signature verification error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
};
