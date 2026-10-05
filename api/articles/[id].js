const {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  getArticles
} = require('../_supabase');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'DELETE') {
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }

    const user = getRequestUser(req);
    if (!user) return sendJson(res, 401, { error: 'Login required.' });
    if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

    const id = String(req.query.id || '');
    if (!id) return sendJson(res, 400, { error: 'Missing article id.' });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('kindling_articles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return sendJson(res, 200, { articles: await getArticles(supabase) });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
