const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const gigsFile = path.join(dataDir, 'gigs.json');
const ordersFile = path.join(dataDir, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ data/ folder created');
}

// Ensure JSON files exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, '[]', 'utf-8');
  console.log('✅ users.json created');
}
if (!fs.existsSync(gigsFile)) {
  fs.writeFileSync(gigsFile, '[]', 'utf-8');
  console.log('✅ gigs.json created');
}
if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, '[]', 'utf-8');
  console.log('✅ orders.json created');
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    console.error('Error reading file:', file, error);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing file:', file, error);
  }
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    let users = readJSON(usersFile);
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now(),
      username,
      email,
      password: hashedPassword,
      role,
      totalEarnings: 0,
      totalSpent: 0,
      rating: 5,
      createdAt: new Date()
    };
    users.push(newUser);
    writeJSON(usersFile, users);

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, 'secret_jobboard', { expiresIn: '30d' });
    res.json({ success: true, token, role: newUser.role });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let users = readJSON(usersFile);
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, 'secret_jobboard', { expiresIn: '30d' });
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, 'secret_jobboard');
    let users = readJSON(usersFile);
    let orders = readJSON(ordersFile);

    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userOrders = orders.filter(o => o.freelancerId === decoded.userId || o.clientId === decoded.userId);
    const activeOrders = userOrders.filter(o => o.status === 'pending').length;

    res.json({
      user: { username: user.username, email: user.email, totalEarnings: user.totalEarnings },
      role: decoded.role,
      totalOrders: userOrders.length,
      activeOrders,
      orders: userOrders
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JobBoard</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI';background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh}.container{max-width:1200px;margin:0 auto;padding:20px}.navbar{background:white;padding:20px;border-radius:10px;margin-bottom:40px;display:flex;justify-content:space-between;align-items:center}.navbar h1{color:#667eea}.navbar a{color:white;background:#667eea;padding:10px 20px;border-radius:5px;text-decoration:none;margin-left:10px}.hero{background:white;padding:60px 40px;border-radius:10px;text-align:center}.hero h1{color:#333;font-size:48px;margin-bottom:20px}.hero p{color:#666;font-size:18px;margin-bottom:30px}.buttons{display:flex;gap:15px;justify-content:center}.btn{padding:15px 40px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;text-decoration:none}.btn-primary{background:#667eea;color:white}</style></head><body><div class="container"><div class="navbar"><h1>💼 JobBoard</h1><div><a href="/signup.html">Sign Up</a><a href="/login.html">Login</a></div></div><div class="hero"><h1>Freelance Marketplace</h1><p>Connect with freelancers. Get work done. Earn money.</p><div class="buttons"><a href="/signup.html" class="btn btn-primary">Start Now</a></div></div></div></body></html>`);
});

app.get('/signup.html', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sign Up</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI';background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}.form{background:white;padding:40px;border-radius:10px;width:90%;max-width:400px}.form h1{color:#667eea;margin-bottom:30px;text-align:center}.group{margin-bottom:20px}.group label{display:block;margin-bottom:8px;font-weight:bold}.group input,.group select{width:100%;padding:12px;border:1px solid #ddd;border-radius:5px}.btn{width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold}.link{text-align:center;margin-top:15px}.link a{color:#667eea;text-decoration:none}</style></head><body><div class="form"><h1>Create Account</h1><form id="form"><div class="group"><label>Username:</label><input type="text" id="username" required></div><div class="group"><label>Email:</label><input type="email" id="email" required></div><div class="group"><label>Password:</label><input type="password" id="password" required></div><div class="group"><label>Role:</label><select id="role" required><option value="freelancer">Freelancer</option><option value="client">Client</option></select></div><button type="submit" class="btn">Sign Up</button></form><div class="link">Already have account? <a href="/login.html">Login</a></div></div><script>document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();const res=await fetch('/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('username').value,email:document.getElementById('email').value,password:document.getElementById('password').value,role:document.getElementById('role').value})});const data=await res.json();if(data.success){localStorage.setItem('token',data.token);window.location.href='/dashboard.html'}else{alert(data.error)}});</script></body></html>`);
});

app.get('/login.html', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Login</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI';background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center}.form{background:white;padding:40px;border-radius:10px;width:90%;max-width:400px}.form h1{color:#667eea;margin-bottom:30px;text-align:center}.group{margin-bottom:20px}.group label{display:block;margin-bottom:8px;font-weight:bold}.group input{width:100%;padding:12px;border:1px solid #ddd;border-radius:5px}.btn{width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold}</style></head><body><div class="form"><h1>Login</h1><form id="form"><div class="group"><label>Email:</label><input type="email" id="email" required></div><div class="group"><label>Password:</label><input type="password" id="password" required></div><button type="submit" class="btn">Login</button></form></div><script>document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('password').value})});const data=await res.json();if(data.success){localStorage.setItem('token',data.token);window.location.href='/dashboard.html'}else{alert(data.error)}});</script></body></html>`);
});

app.get('/dashboard.html', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dashboard</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI';background:#f5f5f5}.navbar{background:#667eea;color:white;padding:20px;text-align:center}.container{max-width:1200px;margin:20px auto;padding:20px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px}.stat{background:white;padding:20px;border-radius:10px;text-align:center}.stat h3{color:#667eea}.stat p{font-size:28px;font-weight:bold}.section{background:white;padding:20px;border-radius:10px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}th{background:#667eea;color:white}.btn{background:#dc3545;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;margin-top:20px}</style></head><body><div class="navbar"><h1>Dashboard</h1></div><div class="container"><div class="stats"><div class="stat"><h3>Total Earnings</h3><p id="earnings">$0</p></div><div class="stat"><h3>Active Orders</h3><p id="active">0</p></div><div class="stat"><h3>Total Orders</h3><p id="total">0</p></div></div><div class="section"><h2>Orders</h2><table id="orders"><thead><tr><th>Gig</th><th>Price</th><th>Status</th></tr></thead><tbody></tbody></table></div><button class="btn" onclick="logout()">Logout</button></div><script>async function load(){const token=localStorage.getItem('token');const res=await fetch('/api/dashboard',{headers:{'Authorization':'Bearer '+token}});const data=await res.json();document.getElementById('earnings').textContent='$'+Math.round(data.user.totalEarnings*100)/100;document.getElementById('active').textContent=data.activeOrders;document.getElementById('total').textContent=data.totalOrders;if(data.orders&&data.orders.length>0){data.orders.forEach(o=>{document.querySelector('#orders tbody').innerHTML+='<tr><td>'+o.gigTitle+'</td><td>$'+o.price+'</td><td>'+o.status+'</td></tr>'})}else{document.querySelector('#orders tbody').innerHTML='<tr><td colspan="3">No orders yet</td></tr>'}}function logout(){localStorage.removeItem('token');window.location.href='/'}load();</script></body></html>`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JobBoard Running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Server stable and ready!`);
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('CRITICAL ERROR:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});
