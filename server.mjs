import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = Number(process.env.PORT || 5173);
const root = process.cwd();

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

createServer(async (req, res) => {
  try {
    const raw = req.url?.split('?')[0] || '/';
    const filePath = raw === '/' ? '/index.html' : raw;
    const full = join(root, filePath);
    const data = await readFile(full);
    res.writeHead(200, { 'content-type': mime[extname(full)] || 'text/plain; charset=utf-8' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Aqua Box dev server running at http://0.0.0.0:${PORT}`);
});
