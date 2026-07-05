// GET /api/config
// Returns the public Razorpay Key ID so the static frontend never has
// to hardcode it in source. This is safe to expose — it is NOT the
// secret key. The Key Secret is only ever read server-side (see
// create-order.js and verify-payment.js) and is never sent to the browser.

// TODO: replace with your actual GitHub Pages origin if different
// (e.g. a custom domain), or set ALLOWED_ORIGIN as an env var instead.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://travelog7733.github.io';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(500).json({ error: 'Razorpay Key ID not configured on server' });
  }

  return res.status(200).json({ key_id: process.env.RAZORPAY_KEY_ID });
};
