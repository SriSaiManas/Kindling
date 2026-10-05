const {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  readJson,
  getDesk
} = require('../_supabase');

module.exports = async function handler(req, res) {
  try {
    const id = String(req.query.id || '');
    if (!id) return sendJson(res, 400, { error: 'Missing desk member id.' });

    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('kindling_desk')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return sendJson(res, 404, { error: 'Desk member not found.' });
      return sendJson(res, 200, { member: data });
    }

    if (req.method === 'DELETE') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      // Clean up child portfolios first
      await supabase.from('kindling_portfolios').delete().eq('desk_id', id);

      const { error } = await supabase.from('kindling_desk').delete().eq('id', id);
      if (error) throw error;

      const desk = await getDesk(supabase);
      return sendJson(res, 200, { desk });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const body = await readJson(req);
      const updates = {};
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.description !== undefined) updates.description = String(body.description).trim();
      if (body.bio !== undefined && body.description === undefined) updates.description = String(body.bio).trim();
      if (body.image !== undefined) updates.image = body.image;

      const { data, error } = await supabase
        .from('kindling_desk')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const desk = await getDesk(supabase);
      return sendJson(res, 200, { member: data, desk });
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('Error in /api/desk/[id]:', error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
