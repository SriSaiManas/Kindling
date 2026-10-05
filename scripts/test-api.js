require('dotenv').config();
const articlesHandler = require('../api/articles');
const deleteHandler = require('../api/articles/[id]');

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; }
  };
}

async function test() {
  console.log('--- TEST 1: GET /api/articles ---');
  const reqGet = { method: 'GET', headers: {}, body: {} };
  const resGet = mockRes();
  await articlesHandler(reqGet, resGet);
  console.log('GET status:', resGet.statusCode);
  console.log('Articles count in database:', resGet.data.articles ? resGet.data.articles.length : 0);
  if (resGet.statusCode !== 200) throw new Error('GET failed: ' + JSON.stringify(resGet.data));

  console.log('\n--- TEST 2: POST /api/articles (publish test article) ---');
  const testArticle = {
    title: 'Automated Test Article',
    body: 'Testing production setup for Supabase and Vercel integration.',
    tag: 'system test',
    punchline: 'test running'
  };
  const reqPost = {
    method: 'POST',
    headers: {
      'x-kindling-username': 'alvin',
      'x-kindling-password': 'Alvin123'
    },
    body: testArticle
  };
  const resPost = mockRes();
  await articlesHandler(reqPost, resPost);
  console.log('POST status:', resPost.statusCode);
  const createdId = resPost.data.article ? resPost.data.article.id : null;
  console.log('Created article ID in Supabase:', createdId);
  if (resPost.statusCode !== 201 || !createdId) throw new Error('POST failed: ' + JSON.stringify(resPost.data));

  console.log('\n--- TEST 3: DELETE /api/articles/[id] (delete test article) ---');
  const reqDel = {
    method: 'DELETE',
    headers: {
      'x-kindling-username': 'alvin',
      'x-kindling-password': 'Alvin123'
    },
    query: { id: createdId }
  };
  const resDel = mockRes();
  await deleteHandler(reqDel, resDel);
  console.log('DELETE status:', resDel.statusCode);
  if (resDel.statusCode !== 200) throw new Error('DELETE failed: ' + JSON.stringify(resDel.data));

  console.log('\nAll API operations successfully verified against Supabase production database!');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
