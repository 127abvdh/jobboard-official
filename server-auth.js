const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');

function getUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>JobBoard</title>
<style>
body { margin:0; padding:20px; font-family:Arial; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; min-height:100vh; }
.nav { background:rgba(0,0,0,0.3); padding:20px; text-align:center; border-radius:10px; margin-bottom:30px; display:flex; justify-content:space-between; align-items:center; }
.nav h1 { margin:0; }
.nav a { color:white; background:rgba(255,255,255,0.2); padding:10px 20px; text-decoration:none; border-radius:5px; margin-left:10px; }
.hero { text-align:center; padding:40px; background:rgba(255,255,255,0.1); border-radius:10px; }
.hero h2 { font-size:32px; margin:0 0 15px 0; }
.buttons { margin:30px 0; }
button { padding:12px 30px; margin:10px; background:white; color:#667eea; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:16px; }
button:hover { background:#f0f0f0; }
.features { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-top:30px; }
.feature { background:rgba(255,255,255,0.1); padding:20px; border-radius:10px; text-align:center; }
</style>
</head>
<body>
<div class="nav">
  <h1>💼 JobBoard</h1>
  <div>
    <a href="/signup">Sign Up</a>
    <a href="/login">Login</a>
  </div>
</div>
<div class="hero">
  <h2>Freelance Marketplace</h2>
  <p>Connect with freelancers. Get work done. Earn money.</p>
</div>
<div class="features">
  <div class="feature"><h3>👤 Freelancers</h3><p>Find jobs and earn</p></div>
  <div class="feature"><h3>🏢 Clients</h3><p>Find talented workers</p></div>
  <div class="feature"><h3>💰 Payments</h3><p>Secure and instant</p></div>
</div>
</body>
</html>
    `);
  }

  else if (req.url === '/signup' && req.method === 'GET') {
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Sign Up</title>
<style>
body { margin:0; padding:20px; font-family:Arial; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; min-height:100vh; display:flex; align-items:center; justify-content:center; }
.form { background:white; color:#333; padding:40px; border-radius:10px; width:100%; max-width:400px; }
.form h1 { margin:0 0 30px 0; color:#667eea; }
.group { margin-bottom:20px; }
.group label { display:block; margin-bottom:8px; font-weight:bold; }
.group input, .group select { width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:16px; }
.btn { width:100%; padding:12px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:16px; }
.btn:hover { background:#5568d3; }
.link { text-align:center; margin-top:15px; }
.link a { color:#667eea; text-decoration:none; }
</style>
</head>
<body>
<div class="form">
  <h1>Create Account</h1>
  <form id="form">
    <div class="group">
      <label>Username:</label>
      <input type="text" id="username" required>
    </div>
    <div class="group">
      <label>Email:</label>
      <input type="email" id="email" required>
    </div>
    <div class="group">
      <label>Password:</label>
      <input type="password" id="password" required>
    </div>
    <div class="group">
      <label>Role:</label>
      <select id="role" required>
        <option value="freelancer">Freelancer</option>
        <option value="client">Client</option>
      </select>
    </div>
    <button type="submit" class="btn">Sign Up</button>
  </form>
  <div class="link">Already have account? <a href="/login">Login</a></div>
</div>
<script>
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      role: document.getElementById('role').value
    })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    window.location.href = '/dashboard';
  } else {
    alert(data.error);
  }
});
</script>
</body>
</html>
    `);
  }

  else if (req.url === '/login' && req.method === 'GET') {
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Login</title>
<style>
body { margin:0; padding:20px; font-family:Arial; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; min-height:100vh; display:flex; align-items:center; justify-content:center; }
.form { background:white; color:#333; padding:40px; border-radius:10px; width:100%; max-width:400px; }
.form h1 { margin:0 0 30px 0; color:#667eea; }
.group { margin-bottom:20px; }
.group label { display:block; margin-bottom:8px; font-weight:bold; }
.group input { width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:16px; }
.btn { width:100%; padding:12px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:16px; }
.btn:hover { background:#5568d3; }
.link { text-align:center; margin-top:15px; }
.link a { color:#667eea; text-decoration:none; }
</style>
</head>
<body>
<div class="form">
  <h1>Login</h1>
  <form id="form">
    <div class="group">
      <label>Email:</label>
      <input type="email" id="email" required>
    </div>
    <div class="group">
      <label>Password:</label>
      <input type="password" id="password" required>
    </div>
    <button type="submit" class="btn">Login</button>
  </form>
  <div class="link">No account? <a href="/signup">Sign Up</a></div>
</div>
<script>
document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    window.location.href = '/dashboard';
  } else {
    alert(data.error);
  }
});
</script>
</body>
</html>
    `);
  }

  else if (req.url === '/dashboard' && req.method === 'GET') {
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Dashboard</title>
<style>
body { margin:0; padding:20px; font-family:Arial; background:#f5f5f5; }
.nav { background:#667eea; color:white; padding:20px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; }
.nav h1 { margin:0; }
.logout { background:white; color:#667eea; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; }
.container { background:white; padding:30px; border-radius:10px; }
.stats { display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-bottom:30px; }
.stat { background:#f5f5f5; padding:20px; border-radius:10px; text-align:center; }
.stat h3 { margin:0; color:#667eea; }
.stat p { font-size:24px; font-weight:bold; }
</style>
</head>
<body>
<div class="nav">
  <h1>Dashboard</h1>
  <button class="logout" onclick="logout()">Logout</button>
</div>
<div class="container">
  <h2>Welcome, <span id="username">User</span>!</h2>
  <div class="stats">
    <div class="stat">
      <h3>Total Earnings</h3>
      <p>$0</p>
    </div>
    <div class="stat">
      <h3>Active Orders</h3>
      <p>0</p>
    </div>
    <div class="stat">
      <h3>Total Jobs</h3>
      <p>0</p>
    </div>
  </div>
  <p>Dashboard content coming soon...</p>
</div>
<script>
document.getElementById('username').textContent = localStorage.getItem('username') || 'User';
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = '/';
}
</script>
</body>
</html>
    `);
  }

  else if (req.url === '/api/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { username, email, password, role } = JSON.parse(body);
        let users = getUsers();

        if (users.find(u => u.email === email || u.username === username)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'User already exists' }));
          return;
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        users.push({ id: Date.now(), username, email, password: hashedPassword, role });
        saveUsers(users);

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, token: 'token_' + Date.now(), username }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
  }

  else if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        let users = getUsers();
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        const user = users.find(u => u.email === email && u.password === hashedPassword);

        if (!user) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, token: 'token_' + Date.now(), username: user.username }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Server error' }));
      }
    });
  }

  else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, '0.0.0.0');
