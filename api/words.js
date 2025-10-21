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
      
      // Add the new word to the 'words' list in Vercel KV. No limit.
      await kv.lpush('words', JSON.stringify(wordData));
      
      return res.status(201).json({ success: true, word: wordData });
    } catch (error) {
      console.error('Error adding word:', error);
      return res.status(500).json({ error: 'Failed to add word.' });
    }
  } else if (req.method === 'GET') {
    try {
      // Retrieve all words from the list.
      // lrange with -1 means "up to the last element".
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));
      
      return res.status(200).json(words);
    } catch (error) {
      console.error('Error fetching words:', error);
      return res.status(500).json({ error: 'Failed to fetch words.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}