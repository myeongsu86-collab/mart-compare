const fetch = require('node-fetch');

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

const MARTS = ['이마트', '홈플러스', '롯데마트'];
const MART_MAP = {
  '이마트': ['이마트', 'SSG.COM', 'ssg', '이마트몰'],
  '홈플러스': ['홈플러스', 'homeplus', '홈플러스 익스프레스'],
  '롯데마트': ['롯데마트', 'lottemart', '롯데슈퍼', '롯데마트제타'],
};

async function searchNaver(query) {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=30&sort=sim`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    }
  });
  const data = await res.json();
  return data.items || [];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const query = req.query.q || '계란';

  try {
    const queries = [query, ...MARTS.map(m => `${m} ${query}`)];
    const results = await Promise.all(queries.map(q => searchNaver(q)));
    const allItems = results.flat();

    const seen = new Set();
    const filtered = [];

    for (const item of allItems) {
      if (seen.has(item.productId)) continue;
      const mallLower = item.mallName.toLowerCase();
      let martName = null;
      for (const [mart, keywords] of Object.entries(MART_MAP)) {
        if (keywords.some(k => item.mallName.includes(k) || mallLower.includes(k.toLowerCase()))) {
          martName = mart;
          break;
        }
      }
      if (martName) {
        seen.add(item.productId);
        filtered.push({ ...item, martName });
      }
    }

    res.json({ items: filtered });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
