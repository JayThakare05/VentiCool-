const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // Default to index.html for root
  let decodedUrl = decodeURIComponent(req.url);
  let filePath = decodedUrl === '/' ? '/index.html' : decodedUrl;

  // Remove query strings
  filePath = filePath.split('?')[0];

  // Build absolute path
  const absPath = path.join(__dirname, filePath);

  // Get extension and MIME type
  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(absPath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 — Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 — Internal Server Error</h1>');
      }
      return;
    }

    const { range } = req.headers;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(absPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': stats.size,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(absPath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✦ VentiCool server is live!`);
  console.log(`  ➜ http://localhost:${PORT}\n`);
});
