import { createServer } from 'http';
import { parse } from 'url';
import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const PORT = 3001;
const UPLOAD_DIR = './public/uploads';
const PUBLIC_DIR = './public';

async function handler(req, res) {
  const { pathname } = parse(req.url);
  
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { filename, contentType, base64 } = JSON.parse(body);
        const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error('Invalid base64');
        
        const ext = extname(filename) || '.' + contentType.split('/')[1];
        const safeName = `${Date.now()}_${randomUUID()}${ext}`;
        
        if (!existsSync(UPLOAD_DIR)) {
          await mkdir(UPLOAD_DIR, { recursive: true });
        }
        
        const buffer = Buffer.from(matches[2], 'base64');
        await writeFile(join(UPLOAD_DIR, safeName), buffer);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: `/uploads/${safeName}` }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  
  let filePath = join(PUBLIC_DIR, pathname);
  
  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }
  } catch {}
  
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}

createServer(handler).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Uploads available at http://localhost:${PORT}/uploads/`);
});