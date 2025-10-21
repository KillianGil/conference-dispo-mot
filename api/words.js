import { kv } from '@vercel/kv';

// Cette vérification cruciale s'assure que la connexion à la base de données est possible.
if (!kv) {
  // Si cette erreur apparaît, cela signifie que Vercel n'a pas pu installer @vercel/kv.
  // La présence du fichier package.json résout ce problème.
  throw new Error('Configuration Error: The Vercel KV store is not available.');
}

export default async function handler(req, res) {
  // Permet à votre application de parler à l'API, même en développement local.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      console.error('VERCEL_KV_POST_ERROR:', error);
      return res.status(500).json({ 
        error: 'Failed to add word to the database.',
        details: error.message 
      });
    }
  } else if (req.method === 'GET') {
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
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

