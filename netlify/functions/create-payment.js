// netlify/functions/create-payment.js
// Serverless function to create Midtrans Snap token
// Environment variables needed in Netlify:
//   MIDTRANS_SERVER_KEY = SB-Mid-server-xxxx (sandbox) or Mid-server-xxxx (production)
//   MIDTRANS_IS_PRODUCTION = false (sandbox) or true (production)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  try {
    const { orderId, amount, customerName, customerEmail, customerPhone, itemName } = JSON.parse(event.body);

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (!serverKey) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ message: 'Midtrans server key not configured. Add MIDTRANS_SERVER_KEY to Netlify environment variables.' })
      };
    }

    const baseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount),
      },
      customer_details: {
        first_name: customerName.split(' ')[0],
        last_name: customerName.split(' ').slice(1).join(' ') || '-',
        email: customerEmail,
        phone: customerPhone,
      },
      item_details: [{
        id: 'stay',
        price: Math.round(amount),
        quantity: 1,
        name: itemName.slice(0, 50),
      }],
      enabled_payments: [
        'gopay', 'shopeepay', 'other_qris',
        'bca_va', 'bni_va', 'bri_va', 'permata_va',
        'credit_card', 'akulaku'
      ],
      callbacks: {
        finish: process.env.URL + '/booking-confirm.html',
      }
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: CORS,
        body: JSON.stringify({ message: data.error_messages?.join(', ') || 'Midtrans error' })
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ token: data.token, redirect_url: data.redirect_url })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ message: err.message })
    };
  }
};
