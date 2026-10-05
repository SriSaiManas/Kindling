const { createClient } = require('@supabase/supabase-js');

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL and SUPABASE_SECRET_KEY environment variables.');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

const ACCOUNTS = [
  { username:'alvin', password:'Alvin123', role:'admin' },
  { username:'yasha', password:'Yasha123', role:'admin' },
  { username:'brittney', password:'Brittney123', role:'contributor' },
  { username:'marcus', password:'Marcus123', role:'contributor' },
  { username:'priya', password:'Priya123', role:'contributor' }
];

function getRequestUser(req) {
  const username = String(req.headers['x-kindling-username'] || '').trim().toLowerCase();
  const password = String(req.headers['x-kindling-password'] || '');
  return ACCOUNTS.find(a => a.username === username && a.password === password) || null;
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

function sortArticles(rows) {
  return rows
    .map(row => row.article)
    .sort((a,b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

async function getArticles(supabase) {
  const { data, error } = await supabase
    .from('kindling_articles')
    .select('id, article, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return sortArticles(data || []);
}

async function seedIfEmpty(supabase) {
  const { count, error } = await supabase
    .from('kindling_articles')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  if (count === 0) {
    const seed = {
      id: 'seed-bangalore-1',
      title: "How Jakkur Lake Became a Model for Community Waters",
      tag: "water commons",
      punchline: "wetlands and wastewater",
      excerpt: "Ten years ago, Jakkur Lake was choked with debris. Today, it stands as Bangalore's circular water triumph.",
      body: "## The return of the pelicans\n\nTen years ago, Jakkur Lake was choked with construction debris and untamed runoff. Today, it stands as one of Bangalore's most celebrated circular-water success stories — not because of top-down municipal decree alone, but through relentless neighborhood stewardship and an integrated natural wetland design.\n\nTreated water from the secondary STP flows first into a 4-hectare constructed wetland of typha reeds, water hyacinth and alligator weed before spilling into the main lake basin. The vegetation absorbs surplus nitrates and phosphates, yielding clean water that recharges open wells across the northern peri-urban belt.\n\n# The community behind the bund\n\nEvery Saturday at dawn, volunteers from Jalaposhan Trust walk the 4.2 km perimeter bund. School groups tally bird counts — over 190 species documented, including spot-billed pelicans and painted storks — while local fishermen maintain a regulated catch quota that prevents toxic algal blooms.\n\n_Sustainability is not a technology you buy;_ it is a social habit built around shared commons. When neighborhoods take ownership of their catchment, Bangalore’s historic cascading tank system begins to breathe again.",
      color: "linear-gradient(155deg,#b0492f,#1c1916)",
      icon: "spark",
      author: "Alvin",
      authorRole: "admin",
      date: "today",
      createdAt: 1700000000000,
      image: null,
      images: [],
      draft: false
    };

    const { error: insertError } = await supabase
      .from('kindling_articles')
      .insert({ id: seed.id, article: seed, created_at: seed.createdAt });

    if (insertError && insertError.code !== '23505') throw insertError;
  }
}

module.exports = {
  getSupabaseAdmin,
  getRequestUser,
  sendJson,
  readJson,
  getArticles,
  seedIfEmpty
};
