import { kv } from '@vercel/kv';

if (!kv) {
  console.error("CRITICAL: Vercel KV store is not available. Check package.json and Vercel integrations.");
  throw new Error('Configuration Error: The Vercel KV store is not available.');
}

export default async function handler(req, res) {
  console.log(`[${new Date().toISOString()}] Received request: ${req.method} ${req.url}`);

  // En-têtes pour empêcher la mise en cache agressive de Vercel
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store'); // Important pour Vercel Edge

  // En-têtes CORS standards
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS preflight request.");
    return res.status(200).end();
  }

  if (req.method === 'DELETE') {
    try {
      console.log("Attempting to delete 'words' key...");
      await kv.del('words');
      console.log("'words' key deleted successfully.");
      return res.status(200).json({ success: true, message: 'All words deleted.' });
    } catch (error) {
      console.error('VERCEL_KV_DELETE_ERROR:', error);
      return res.status(500).json({ error: 'Failed to delete words.', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log("Processing POST request with body:", req.body);
      const { text, x, y, color } = req.body;
      if (!text || x === undefined || y === undefined || !color) {
        console.warn("POST request rejected due to missing fields.");
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      const wordData = { text, x, y, color, timestamp: Date.now() };

      console.log("Attempting to lpush to 'words' key:", wordData);
      await kv.lpush('words', JSON.stringify(wordData));
      console.log("lpush successful. Fetching updated list...");

      // Récupérer la liste complète après l'ajout
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));
      console.log(`Returning updated list with ${words.length} words after POST.`);

      // Renvoyer la liste complète avec le statut 201 (Created)
      return res.status(201).json(words);

    } catch (error) {
      console.error('VERCEL_KV_POST_ERROR:', error);
      return res.status(500).json({ error: 'Failed to add word.', details: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      console.log("Attempting to lrange 'words' key for GET...");
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => JSON.parse(word));
      console.log(`Returning list with ${words.length} words for GET.`);
      return res.status(200).json(words);
    } catch (error) {
      console.error('VERCEL_KV_GET_ERROR:', error);
      return res.status(500).json({ error: 'Failed to retrieve words.', details: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
  console.log(`Method ${req.method} Not Allowed.`);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
