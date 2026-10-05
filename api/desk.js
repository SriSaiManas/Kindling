const {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  readJson,
  getDesk
} = require('./_supabase');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const desk = await getDesk(supabase);
      return sendJson(res, 200, { desk });
    }

    if (req.method === 'POST') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const body = await readJson(req);
      const name = String(body.name || '').trim();
      if (!name) {
        return sendJson(res, 400, { error: 'Name is required.' });
      }

      const description = String(body.description || body.bio || '').trim();
      const image = body.image || null;
      const created_at = Number(body.created_at) || Date.now();

      const { data, error } = await supabase
        .from('kindling_desk')
        .insert({
          name,
          description,
          image,
          created_at
        })
        .select()
        .single();

      if (error) throw error;

      const desk = await getDesk(supabase);
      return sendJson(res, 201, { member: data, desk });
    }

    if (req.method === 'DELETE') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required.' });
      if (user.role !== 'admin') return sendJson(res, 403, { error: 'Admin permission required.' });

      const body = await readJson(req);
      const id = String(req.query.id || body.id || '');
      if (!id) return sendJson(res, 400, { error: 'Missing desk member id.' });

      // Clean up child portfolios first
      await supabase.from('kindling_portfolios').delete().eq('desk_id', id);

      const { error } = await supabase.from('kindling_desk').delete().eq('id', id);
      if (error) throw error;

      const desk = await getDesk(supabase);
      return sendJson(res, 200, { desk });
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('Error in /api/desk:', error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
