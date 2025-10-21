import { kv } from '@vercel/kv';

if (!kv) {
  throw new Error('Configuration Error: The Vercel KV store is not available.');
}

export default async function handler(req, res) {
  // Set aggressive no-cache headers to prevent Vercel's edge caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Standard CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'DELETE') {
    try {
      await kv.del('words');
      return res.status(200).json({ success: true, message: 'All words have been deleted.' });
    } catch (error) {
      console.error('VERCEL_KV_DELETE_ERROR:', error);
      return res.status(500).json({ 
        error: 'Failed to delete words from the database.',
        details: error.message 
      });
    }
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
      console.error('VERCEL_KV_POST_ERROR:', error);
      return res.status(500).json({ 
        error: 'Failed to add word to the database.',
        details: error.message 
      });
    }
  }
  
  if (req.method === 'GET') {
    try {
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));
      return res.status(200).json(words);
    } catch (error) {
      console.error('VERCEL_KV_GET_ERROR:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve words from the database.',
        details: error.message 
      });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

