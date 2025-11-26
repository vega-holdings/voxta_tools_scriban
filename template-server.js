/**
 * Voxta Template Editor - File Server Bridge
 *
 * A simple Node.js server that provides API access to template files
 * Run with: node template-server.js
 *
 * Endpoints:
 *   GET  /api/templates/:path     - Read a template file
 *   PUT  /api/templates/:path     - Write a template file
 *   GET  /api/templates           - List all templates
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5385;
const BASE_DIR = __dirname;

// CORS headers for cross-origin requests from the main Voxta app
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

// Template directories to scan
const TEMPLATE_DIRS = [
    'Resources/Prompts/Default/en',
    'Resources/Modules/ChainOfThought/en',
    'Resources/Modules/Continuations/en',
    'Resources/Formatting'
];

// Recursively get all .scriban files in a directory
function getScribanFiles(dir, baseDir = dir) {
    const files = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...getScribanFiles(fullPath, baseDir));
            } else if (entry.name.endsWith('.scriban')) {
                const relativePath = path.relative(BASE_DIR, fullPath).replace(/\\/g, '/');
                files.push(relativePath);
            }
        }
    } catch (e) {
        console.error(`Error scanning ${dir}:`, e.message);
    }
    return files;
}

// List all templates
function listTemplates() {
    const templates = [];
    for (const dir of TEMPLATE_DIRS) {
        const fullDir = path.join(BASE_DIR, dir);
        templates.push(...getScribanFiles(fullDir));
    }
    return templates;
}

// Read a template file
function readTemplate(templatePath) {
    const fullPath = path.join(BASE_DIR, templatePath);

    // Security: ensure path is within BASE_DIR
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(BASE_DIR)) {
        throw new Error('Invalid path');
    }

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    return fs.readFileSync(fullPath, 'utf-8');
}

// Write a template file
function writeTemplate(templatePath, content) {
    const fullPath = path.join(BASE_DIR, templatePath);

    // Security: ensure path is within BASE_DIR
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(BASE_DIR)) {
        throw new Error('Invalid path');
    }

    // Create backup before writing
    if (fs.existsSync(fullPath)) {
        const backupDir = path.join(BASE_DIR, 'Data/TemplateBackups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = templatePath.replace(/\//g, '_') + '.' + timestamp + '.bak';
        const backupPath = path.join(backupDir, backupName);
        fs.copyFileSync(fullPath, backupPath);
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, CORS_HEADERS);
        res.end();
        return;
    }

    try {
        // GET /api/templates - List all templates
        if (req.method === 'GET' && pathname === '/api/templates') {
            const templates = listTemplates();
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify({ templates }));
            return;
        }

        // GET /api/templates/* - Read a template
        if (req.method === 'GET' && pathname.startsWith('/api/templates/')) {
            const templatePath = decodeURIComponent(pathname.slice('/api/templates/'.length));
            const content = readTemplate(templatePath);

            if (content === null) {
                res.writeHead(404, CORS_HEADERS);
                res.end(JSON.stringify({ error: 'Template not found' }));
                return;
            }

            res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(content);
            return;
        }

        // PUT /api/templates/* - Write a template
        if (req.method === 'PUT' && pathname.startsWith('/api/templates/')) {
            const templatePath = decodeURIComponent(pathname.slice('/api/templates/'.length));
            const body = await parseBody(req);

            if (!body.content) {
                res.writeHead(400, CORS_HEADERS);
                res.end(JSON.stringify({ error: 'Missing content' }));
                return;
            }

            writeTemplate(templatePath, body.content);
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify({ success: true }));
            return;
        }

        // Health check
        if (req.method === 'GET' && pathname === '/health') {
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify({ status: 'ok', baseDir: BASE_DIR }));
            return;
        }

        // 404 for everything else
        res.writeHead(404, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Not found' }));

    } catch (e) {
        console.error('Error:', e);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: e.message }));
    }
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Voxta Template Editor - File Server                ║
╠════════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                 ║
║  Base directory: ${BASE_DIR.substring(0, 40).padEnd(40)}║
║                                                            ║
║  Endpoints:                                                ║
║    GET  /api/templates         - List all templates        ║
║    GET  /api/templates/:path   - Read a template           ║
║    PUT  /api/templates/:path   - Write a template          ║
║    GET  /health                - Health check              ║
║                                                            ║
║  Press Ctrl+C to stop                                      ║
╚════════════════════════════════════════════════════════════╝
`);
    console.log('Templates found:', listTemplates().length);
});
