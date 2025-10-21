let mots = [];

export default function handler(req,res){
  if(req.method === 'POST'){
    const { text, x, y, color } = req.body;
    if(text && x!==undefined && y!==undefined && color){
      mots.push({ text, x, y, color });
    }
    res.status(200).json({ success:true });
  } else if(req.method === 'GET'){
    res.status(200).json(mots);
  } else {
    res.status(405).end();
  }
}