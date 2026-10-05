const {
  getSupabaseAdmin,
  sendJson,
  seedIfEmpty,
  getArticles
} = require('../_supabase');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }

    const supabase = getSupabaseAdmin();
    await seedIfEmpty(supabase);
    return sendJson(res, 200, { articles: await getArticles(supabase) });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
