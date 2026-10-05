const {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  readJson,
  getPortfolios
} = require('./_supabase');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const desk_id = req.query.desk_id ? String(req.query.desk_id) : null;
      const portfolios = await getPortfolios(supabase, desk_id);
      return sendJson(res, 200, { portfolios });
    }

    if (req.method === 'POST') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const body = await readJson(req);
      const desk_id = body.desk_id;
      if (!desk_id) return sendJson(res, 400, { error: 'desk_id is required.' });

      const title = String(body.title || 'About Me').trim();
      const description = String(body.description || body.bio || '').trim();
      const content = String(body.content || body.text || '').trim();
      const image = body.image || null;

      let link = body.link || '';
      if (Array.isArray(body.images)) {
        try { link = JSON.stringify({ images: body.images }); } catch (_) {}
      }

      const created_at = Number(body.created_at) || Date.now();

      // Check if a portfolio already exists for this desk_id
      const { data: existing } = await supabase
        .from('kindling_portfolios')
        .select('id')
        .eq('desk_id', desk_id)
        .limit(1);

      let resultPortfolio;
      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('kindling_portfolios')
          .update({
            title,
            description,
            content,
            image,
            link
          })
          .eq('id', existing[0].id)
          .select()
          .single();
        if (error) throw error;
        resultPortfolio = data;
      } else {
        const { data, error } = await supabase
          .from('kindling_portfolios')
          .insert({
            desk_id,
            title,
            description,
            content,
            image,
            link,
            created_at
          })
          .select()
          .single();
        if (error) throw error;
        resultPortfolio = data;
      }

      const portfolios = await getPortfolios(supabase, desk_id);
      return sendJson(res, 201, { portfolio: resultPortfolio, portfolios });
    }

    if (req.method === 'DELETE') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const body = await readJson(req);
      const id = String(req.query.id || body.id || '');
      const desk_id = String(req.query.desk_id || body.desk_id || '');

      if (!id && !desk_id) {
        return sendJson(res, 400, { error: 'Missing portfolio id or desk_id.' });
      }

      let query = supabase.from('kindling_portfolios').delete();
      if (id) {
        query = query.eq('id', id);
      } else if (desk_id) {
        query = query.eq('desk_id', desk_id);
      }

      const { error } = await query;
      if (error) throw error;

      return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('Error in /api/portfolios:', error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
