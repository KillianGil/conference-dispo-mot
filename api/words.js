import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Allow requests from all origins for development and production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { text, x, y, color } = req.body;
      if (!text || x === undefined || y === undefined || !color) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      const wordData = { text, x, y, color, timestamp: Date.now() };
      await kv.lpush('words', JSON.stringify(wordData));
      return res.status(201).json({ success: true, word: wordData });
    } catch (error) {
      // Log the detailed error for debugging on Vercel
      console.error('VERCEL_KV_POST_ERROR:', error);
      // Send a more informative error response
      return res.status(500).json({ 
        error: 'Failed to communicate with the database during POST.',
        details: error.message 
      });
    }
  } else if (req.method === 'GET') {
    try {
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));
      return res.status(200).json(words);
    } catch (error) {
      // Log the detailed error for debugging on Vercel
      console.error('VERCEL_KV_GET_ERROR:', error);
      // Send a more informative error response
      return res.status(500).json({ 
        error: 'Failed to communicate with the database during GET.',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

