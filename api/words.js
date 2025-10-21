import { kv } from '@vercel/kv';

if (!kv) {
  throw new Error('Configuration Error: The Vercel KV store is not available.');
}

export default async function handler(req, res) {
  // En-têtes pour empêcher la mise en cache agressive de Vercel
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // En-têtes CORS standards
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Logique de Suppression ---
  if (req.method === 'DELETE') {
    try {
      await kv.del('words');
      return res.status(200).json({ success: true, message: 'All words deleted.' });
    } catch (error) {
      console.error('VERCEL_KV_DELETE_ERROR:', error);
      return res.status(500).json({ error: 'Failed to delete words.', details: error.message });
    }
  }

  // --- Logique d'Ajout ---
  if (req.method === 'POST') {
    try {
      const { text, x, y, color } = req.body;
      if (!text || x === undefined || y === undefined || !color) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      const wordData = { text, x, y, color, timestamp: Date.now() };
      await kv.lpush('words', JSON.stringify(wordData));
      
      // **LA SOLUTION EST ICI**
      // Après l'ajout, on récupère et on renvoie immédiatement la liste complète.
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));

      // On renvoie la liste mise à jour, qui devient la source de vérité.
      return res.status(201).json(words);

    } catch (error) {
      console.error('VERCEL_KV_POST_ERROR:', error);
      return res.status(500).json({ error: 'Failed to add word.', details: error.message });
    }
  }
  
  // --- Logique de Récupération ---
  if (req.method === 'GET') {
    try {
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));
      return res.status(200).json(words);
    } catch (error) {
      console.error('VERCEL_KV_GET_ERROR:', error);
      return res.status(500).json({ error: 'Failed to retrieve words.', details: error.message });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

