const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const gigsFile = path.join(dataDir, 'gigs.json');
const ordersFile = path.join(dataDir, 'orders.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
if (!fs.existsSync(gigsFile)) fs.writeFileSync(gigsFile, '[]');
if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, '[]');

function read(file) { try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; } }
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.url === '/') {
    res.writeHead(200);
    res.end(`<html><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1>💼 JobBoard</h1><p>Freelance Marketplace</p><p><a href="/signup" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">Sign Up</a> <a href="/login" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">Login</a></p></body></html>`);
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
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'User';
    res.writeHead(200);
    res.end(`<html><body style="background:#f5f5f5;font-family:Arial;padding:20px"><div style="background:white;padding:20px;border-radius:10px;margin-bottom:20px"><h1 style="color:#667eea">Dashboard</h1><p>Welcome, ${user}!</p></div><div style="background:white;padding:20px;border-radius:10px"><h3>Gigs</h3><p><a href="/browse-gigs" style="color:#667eea">Browse All Gigs</a></p><p><a href="/my-gigs" style="color:#667eea">My Gigs</a></p><p><a href="/create-gig" style="color:#667eea">Create New Gig</a></p><p><a href="/orders" style="color:#667eea">My Orders</a></p><p><a href="/wallet" style="color:#667eea">💰 Wallet</a></p><p><a href="/" style="color:#667eea">Home</a></p></div></body></html>`);
  }

  else if (req.url === '/browse-gigs') {
    const gigs = read(gigsFile);
    let html = `<html><body style="background:#f5f5f5;font-family:Arial;padding:20px"><h1 style="color:#667eea">Available Gigs</h1>`;
    gigs.forEach(g => {
      html += `<div style="background:white;padding:20px;margin:10px 0;border-radius:10px"><h3>${g.title}</h3><p>${g.description}</p><p style="font-weight:bold">Price: $${g.price}</p><p>By: ${g.freelancer}</p><form method="POST" action="/api/order" style="display:inline"><input type="hidden" name="gigId" value="${g.id}"><button style="background:#667eea;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer">Order Now</button></form></div>`;
    });
    html += `<p><a href="/dashboard" style="color:#667eea">Back</a></p></body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  else if (req.url === '/create-gig') {
    res.writeHead(200);
    res.end(`<html><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:400px"><h1 style="color:#667eea">Create Gig</h1><form method="POST" action="/api/create-gig"><input type="text" name="title" placeholder="Gig Title" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><textarea name="description" placeholder="Description" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"></textarea><input type="number" name="price" placeholder="Price ($)" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer">Create Gig</button></form><p><a href="/dashboard" style="color:#667eea">Back</a></p></div></body></html>`);
  }

  else if (req.url === '/wallet') {
    const users = read(usersFile);
    const orders = read(ordersFile);
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'User';
    
    let earnings = 0;
    orders.forEach(o => {
      if (o.freelancer === user && o.status === 'completed') {
        earnings += o.price * 0.8;
      }
    });
    
    res.writeHead(200);
    res.end(`<html><body style="background:#f5f5f5;font-family:Arial;padding:20px"><div style="background:white;padding:30px;border-radius:10px;text-align:center"><h1 style="color:#667eea">💰 Your Wallet</h1><h2 style="font-size:48px;color:#667eea">$${earnings.toFixed(2)}</h2><p style="font-size:18px">Total Earnings</p><button style="background:#667eea;color:white;padding:10px 30px;border:none;border-radius:5px;cursor:pointer;font-size:16px">Withdraw to Wise</button><p><a href="/dashboard" style="color:#667eea">Back</a></p></div></body></html>`);
  }

  else if (req.url === '/orders') {
    const orders = read(ordersFile);
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'User';
    
    let html = `<html><body style="background:#f5f5f5;font-family:Arial;padding:20px"><h1 style="color:#667eea">My Orders</h1>`;
    orders.filter(o => o.freelancer === user || o.client === user).forEach(o => {
      html += `<div style="background:white;padding:20px;margin:10px 0;border-radius:10px"><h3>${o.gigTitle}</h3><p>Price: $${o.price}</p><p>Status: ${o.status}</p></div>`;
    });
    html += `<p><a href="/dashboard" style="color:#667eea">Back</a></p></body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  else if (req.url === '/api/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const users = read(usersFile);
      if (users.find(u => u.email === params.get('email'))) {
        res.writeHead(200);
        res.end(`<html><body style="color:red;text-align:center;padding:50px"><h1>User exists!</h1><p><a href="/signup">Back</a></p></body></html>`);
      } else {
        users.push({ username: params.get('username'), email: params.get('email'), password: params.get('password'), role: params.get('role'), earnings: 0 });
        write(usersFile, users);
        res.writeHead(302, { 'Location': '/dashboard', 'Set-Cookie': `user=${params.get('username')}` });
        res.end();
      }
    });
  }

  else if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const users = read(usersFile);
      const user = users.find(u => u.email === params.get('email') && u.password === params.get('password'));
      if (!user) {
        res.writeHead(200);
        res.end(`<html><body style="color:red;text-align:center;padding:50px"><h1>Wrong credentials!</h1><p><a href="/login">Back</a></p></body></html>`);
      } else {
        res.writeHead(302, { 'Location': '/dashboard', 'Set-Cookie': `user=${user.username}` });
        res.end();
      }
    });
  }

  else if (req.url === '/api/create-gig' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const gigs = read(gigsFile);
      const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'Unknown';
      gigs.push({ id: Date.now(), title: params.get('title'), description: params.get('description'), price: parseFloat(params.get('price')), freelancer: user });
      write(gigsFile, gigs);
      res.writeHead(302, { 'Location': '/dashboard' });
      res.end();
    });
  }

  else if (req.url === '/api/order' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const gigs = read(gigsFile);
      const gig = gigs.find(g => g.id == params.get('gigId'));
      if (gig) {
        const orders = read(ordersFile);
        const client = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'Unknown';
        orders.push({ id: Date.now(), gigId: gig.id, gigTitle: gig.title, price: gig.price, freelancer: gig.freelancer, client: client, status: 'active' });
        write(ordersFile, orders);
      }
      res.writeHead(302, { 'Location': '/browse-gigs' });
      res.end();
    });
  }

  else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0');
