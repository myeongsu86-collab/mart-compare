const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function supabaseRequest(method, table, body, query) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    if (method === 'GET' && query) {
      url.searchParams.set('select', '*');
      url.searchParams.set('post_id', `eq.${query}`);
      url.searchParams.set('order', 'created_at.asc');
    }
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : '',
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { post_id } = req.query;
      if (!post_id) return res.status(400).json({ error: 'post_id가 필요합니다.' });
      const data = await supabaseRequest('GET', 'comments', null, post_id);
      return res.json(data);
    }
    if (req.method === 'POST') {
      const { post_id, nickname, content } = req.body;
      if (!post_id || !nickname || !content) return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
      const data = await supabaseRequest('POST', 'comments', { post_id, nickname, content }, null);
      return res.json(data);
    }
  } catch(e) {
    return res.status(500).json({
