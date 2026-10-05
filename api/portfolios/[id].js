const {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  readJson
} = require('../_supabase');

module.exports = async function handler(req, res) {
  try {
    const id = String(req.query.id || '');
    if (!id) return sendJson(res, 400, { error: 'Missing portfolio id.' });

    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('kindling_portfolios')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return sendJson(res, 404, { error: 'Portfolio not found.' });
      let images = [];
      if (data.link) {
        try {
          const parsed = JSON.parse(data.link);
          if (Array.isArray(parsed.images)) images = parsed.images;
        } catch (_) {}
      }
      return sendJson(res, 200, { portfolio: { ...data, images } });
    }

    if (req.method === 'DELETE') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const { error } = await supabase
        .from('kindling_portfolios')
        .delete()
        .eq('id', id);
      if (error) throw error;

      return sendJson(res, 200, { success: true });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const body = await readJson(req);
      const updates = {};
      if (body.title !== undefined) updates.title = String(body.title).trim();
      if (body.description !== undefined) updates.description = String(body.description).trim();
      if (body.content !== undefined) updates.content = String(body.content).trim();
      if (body.text !== undefined && body.content === undefined) updates.content = String(body.text).trim();
      if (body.image !== undefined) updates.image = body.image;
      if (body.link !== undefined) updates.link = body.link;
      if (Array.isArray(body.images)) {
        try { updates.link = JSON.stringify({ images: body.images }); } catch (_) {}
      }

      const { data, error } = await supabase
        .from('kindling_portfolios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return sendJson(res, 200, { portfolio: data });
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('Error in /api/portfolios/[id]:', error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
