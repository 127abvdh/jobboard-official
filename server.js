
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');

function getUsers() {
  try { return JSON.parse(fs.readFileSync(usersFile, 'utf-8')); } 
  catch { return []; }
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.url === '/') {
    res.writeHead(200);
    res.end(`<html><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1>💼 JobBoard</h1><p><a href="/signup" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">Sign Up</a> <a href="/login" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">Login</a></p></body></html>`);
  }
  else if (req.url === '/signup') {
    res.writeHead(200);
    res.end(`<html><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:300px"><h1 style="color:#667eea">Sign Up</h1><form method="POST" action="/api/signup"><input type="text" name="username" placeholder="Username" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="email" name="email" placeholder="Email" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="password" name="password" placeholder="Password" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><select name="role" required style="width:100%;padding:10px;margin:10px 0"><option>Freelancer</option><option>Client</option></select><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer">Sign Up</button></form></div></body></html>`);
  }
  else if (req.url === '/login') {
    res.writeHead(200);
    res.end(`<html><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:300px"><h1 style="color:#667eea">Login</h1><form method="POST" action="/api/login"><input type="email" name="email" placeholder="Email" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="password" name="password" placeholder="Password" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer">Login</button></form></div></body></html>`);
  }
  else if (req.url === '/dashboard') {
    res.writeHead(200);
    res.end(`<html><body style="background:#f5f5f5;font-family:Arial;padding:20px"><h1 style="color:#667eea">Dashboard</h1><p>Welcome!</p><p><a href="/">Home</a></p></body></html>`);
  }
  else if (req.url === '/api/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const username = params.get('username');
        const email = params.get('email');
        const password = params.get('password');
        const role = params.get('role');

        let users = getUsers();
        if (users.find(u => u.email === email)) {
          res.writeHead(200);
          res.end(`<html><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1>User exists!</h1><p><a href="/signup" style="color:white">Back</a></p></body></html>`);
          return;
        }

        users.push({ username, email, password, role });
        saveUsers(users);

        res.writeHead(302, { 'Location': '/dashboard' });
        res.end();
      } catch(e) {
        res.writeHead(500);
        res.end('Error');
      }
    });
  }
  else if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const email = params.get('email');
        const password = params.get('password');

        let users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
          res.writeHead(200);
          res.end(`<html><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1>Wrong password!</h1><p><a href="/login" style="color:white">Back</a></p></body></html>`);
          return;
        }

        res.writeHead(302, { 'Location': '/dashboard' });
        res.end();
      } catch(e) {
        res.writeHead(500);
        res.end('Error');
      }
    });
  }
  else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0');
