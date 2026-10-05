require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const articlesHandler = require('./api/articles');
const articleByIdHandler = require('./api/articles/[id]');
const seedHandler = require('./api/articles/seed');
const deskHandler = require('./api/desk');
const deskByIdHandler = require('./api/desk/[id]');
const portfoliosHandler = require('./api/portfolios');
const portfoliosByIdHandler = require('./api/portfolios/[id]');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

function enhanceRes(res) {
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };
  res.json = function (data) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify(data));
  };
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        req.body = {};
        return resolve();
      }
      try {
        req.body = JSON.parse(body);
      } catch (err) {
        req.body = {};
      }
      resolve();
    });
    req.on('error', () => {
      req.body = {};
      resolve();
    });
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function handleRequest(req, res) {
  enhanceRes(res);
  await parseBody(req);

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  req.query = parsedUrl.query || {};

  // API Routing
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/articles' || pathname === '/api/articles/') {
      return articlesHandler(req, res);
    }
    if (pathname === '/api/articles/seed' || pathname === '/api/articles/seed/') {
      return seedHandler(req, res);
    }
    let match = pathname.match(/^\/api\/articles\/([^/]+)$/);
    if (match) {
      req.query.id = decodeURIComponent(match[1]);
      return articleByIdHandler(req, res);
    }

    if (pathname === '/api/desk' || pathname === '/api/desk/') {
      return deskHandler(req, res);
    }
    match = pathname.match(/^\/api\/desk\/([^/]+)$/);
    if (match) {
      req.query.id = decodeURIComponent(match[1]);
      return deskByIdHandler(req, res);
    }

    if (pathname === '/api/portfolios' || pathname === '/api/portfolios/') {
      return portfoliosHandler(req, res);
    }
    match = pathname.match(/^\/api\/portfolios\/([^/]+)$/);
    if (match) {
      req.query.id = decodeURIComponent(match[1]);
      return portfoliosByIdHandler(req, res);
    }

    return res.status(404).json({ error: 'Not found' });
  }

  // Static File Serving
  let filePath = pathname === '/' ? '/index.html' : pathname;
  let targetPath = path.join(__dirname, filePath);

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(__dirname, 'index.html');
  }

  try {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(targetPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
}

function tryListen(port) {
  const currentServer = http.createServer(handleRequest);
  currentServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT) {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      tryListen(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  currentServer.listen(port, () => {
    console.log(`Kindling production server running at http://localhost:${port}`);
    console.log(`Supabase URL: ${process.env.SUPABASE_URL || 'Not set'}`);
  });
}

tryListen(DEFAULT_PORT);
