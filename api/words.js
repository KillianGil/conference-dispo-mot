import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // En-têtes pour empêcher la mise en cache
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'DELETE') {
      await kv.del('words');
      return res.status(200).json({ success: true, message: 'All words deleted.' });
    }

    if (req.method === 'POST') {
      const { text, x, y, color } = req.body;
      if (!text || x === undefined || y === undefined || !color) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      const wordData = { text, x, y, color, timestamp: Date.now() };
      await kv.rpush('words', JSON.stringify(wordData)); // Utiliser RPUSH pour ajouter à la fin
      
      return res.status(201).json({ success: true });
    }
    
    if (req.method === 'GET') {
      const wordsList = await kv.lrange('words', 0, -1);
      const words = wordsList.map(word => {
        try {
          // **CORRECTIF DE SÉCURITÉ**
          // On s'assure que chaque élément est un JSON valide avant de le parser.
          if (typeof word === 'string') {
            return JSON.parse(word);
          }
          return null; // Ignorer les données invalides
        } catch (e) {
          console.warn('Invalid data found in KV store, skipping:', word);
          return null; // Ignorer si le parsing échoue
        }
      }).filter(Boolean); // Filtrer tous les éléments nuls/invalides

      return res.status(200).json(words);
    }
    
    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error) {
    console.error(`[${req.method}_ERROR]:`, error);
    return res.status(500).json({ error: `Failed to process ${req.method} request.`, details: error.message });
  }
}

