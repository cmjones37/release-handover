'use strict';

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const PROMPTS = require('./lib/prompts');

const PORT    = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('\n  Missing ANTHROPIC_API_KEY. Create a .env file with:\n');
  console.error('  ANTHROPIC_API_KEY=sk-ant-...\n');
  console.error('  Then start with: node --env-file=.env server.js\n');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/generate') {
    return handleGenerate(req, res);
  }

  const urlPath  = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, urlPath);
  const ext      = path.extname(filePath);
  const mime     = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

function handleGenerate(req, res) {
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return jsonError(res, 400, 'Invalid JSON'); }

    const { prdText, stakeholder } = parsed;
    if (!prdText || !stakeholder || !PROMPTS[stakeholder]) {
      return jsonError(res, 400, 'Missing or invalid prdText / stakeholder');
    }

    const payload = JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      messages:   [{ role: 'user', content: PROMPTS[stakeholder](prdText) }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'Content-Length':    Buffer.byteLength(payload),
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', chunk => { data += chunk; });
      apiRes.on('end', () => {
        if (apiRes.statusCode !== 200) {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          return res.end(data);
        }
        let body;
        try { body = JSON.parse(data); }
        catch { return jsonError(res, 500, 'Failed to parse API response'); }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content: body.content[0].text }));
      });
    });

    apiReq.setTimeout(45000, () => {
      apiReq.destroy();
      jsonError(res, 504, 'Request timed out');
    });

    apiReq.on('error', (err) => jsonError(res, 500, err.message));
    apiReq.write(payload);
    apiReq.end();
  });
}

function jsonError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

server.listen(PORT, () => {
  console.log(`\n  Release Handover → http://localhost:${PORT}\n`);
});
