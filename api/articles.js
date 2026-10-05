const crypto = require('crypto');
const {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  readJson,
  getArticles,
  seedIfEmpty
} = require('./_supabase');

module.exports = async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      await seedIfEmpty(supabase);
      return sendJson(res, 200, { articles: await getArticles(supabase) });
    }

    if (req.method === 'POST') {
      const user = getRequestUser(req);
      if (!user) return sendJson(res, 401, { error: 'Login required to publish.' });

      const article = await readJson(req);
      if (!article.title || !article.body) {
        return sendJson(res, 400, { error: 'Title and body are required.' });
      }

      article.id = crypto.randomUUID();
      const enteredAuthor = (typeof article.author === 'string' && article.author.trim()) || '';
      article.author = enteredAuthor || (
        user.username === 'alvin' ? 'Alvin' :
        user.username === 'yasha' ? 'Yasha' :
        user.username === 'brittney' ? 'Brittney' :
        user.username === 'marcus' ? 'Marcus' : 'Priya'
      );
      article.uploader = user.username;
      article.authorRole = user.role;
      article.createdAt = Number(article.createdAt) || Date.now();
      article.draft = false;

      const { error } = await supabase.from('kindling_articles').insert({
        id: article.id,
        article,
        created_at: article.createdAt
      });

      if (error) throw error;

      return sendJson(res, 201, { article, articles: await getArticles(supabase) });
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error.message || 'Server error.' });
  }
};
