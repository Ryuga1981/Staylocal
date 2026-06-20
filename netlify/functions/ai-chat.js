// netlify/functions/ai-chat.js
// Proxies chat messages to Claude API — keeps API key server-side

exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method not allowed' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Netlify environment variables.' })
    };
  }

  try {
    const { messages, listingContext } = JSON.parse(event.body);

    const systemPrompt = `You are StayLocal AI — a friendly, knowledgeable local travel guide for Southeast Asia, built into the StayLocal rental platform.

Your personality: warm, specific, practical, culturally aware. You speak like a well-travelled local friend, not a generic chatbot.

${listingContext ? `The guest is currently viewing this listing:\n${listingContext}\n` : ''}

You help guests with:
- Local recommendations (restaurants, activities, transport, hidden gems)
- Practical info (check-in tips, local customs, weather, currency)
- Neighborhood info and what to do near the listing
- Trip planning advice for SEA destinations
- Cultural tips (Ramadan, local holidays, etiquette)
- Getting around (Grab, GoJek, local transport)

For Indonesian listings: give prices in Rupiah (IDR). For Thai listings: Baht (THB).
Be specific — mention real place names, actual prices where you know them, realistic travel times.
Keep responses concise (3-5 sentences or a short list). Never make up booking details.
If asked about availability or pricing, say to check the listing page directly.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status, headers: CORS,
        body: JSON.stringify({ error: data.error?.message || 'Claude API error' })
      };
    }

    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ reply: data.content[0].text })
    };

  } catch (err) {
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: err.message })
    };
  }
};
