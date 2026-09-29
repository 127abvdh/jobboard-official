const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = 'mongodb+srv://azam71farahani_db_user:VnI4CipodA1GMfgV@cluster0.zrmkmdc.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected')).catch(err => console.error('❌ Error:', err));

// ========== SCHEMAS ==========

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: String,
  role: { type: String, enum: ['freelancer', 'client'], required: true },
  avatar: String,
  bio: String,
  skills: [String],
  cryptoWallet: String,
  totalEarnings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  rating: { type: Number, default: 5 },
  reviews: [String],
  createdAt: { type: Date, default: Date.now }
});

const gigSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  price: Number,
  freelancerId: mongoose.Schema.Types.ObjectId,
  freelancerName: String,
  freelancerRating: Number,
  deliveryTime: String,
  status: { type: String, default: 'active' },
  orders: { type: Number, default: 0 },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  gigId: mongoose.Schema.Types.ObjectId,
  freelancerId: mongoose.Schema.Types.ObjectId,
  clientId: mongoose.Schema.Types.ObjectId,
  gigTitle: String,
  price: Number,
  platformFee: Number,
  freelancerEarnings: Number,
  status: { type: String, default: 'pending' },
  description: String,
  paymentStatus: { type: String, default: 'unpaid' },
  transactionId: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const User = mongoose.model('User', userSchema);
const Gig = mongoose.model('Gig', gigSchema);
const Order = mongoose.model('Order', orderSchema);

// ========== AUTH ==========

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, 'secret_jobboard', { expiresIn: '30d' });
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id, role: user.role }, 'secret_jobboard', { expiresIn: '30d' });
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== GIGS (Freelancer) ==========

app.post('/api/gigs/create', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, 'secret_jobboard');
    const user = await User.findById(decoded.userId);
    
    if (user.role !== 'freelancer') return res.status(400).json({ error: 'Only freelancers can create gigs' });

    const { title, description, category, price, deliveryTime } = req.body;

    const gig = new Gig({
      title,
      description,
      category,
      price,
      deliveryTime,
      freelancerId: user._id,
      freelancerName: user.username,
      freelancerRating: user.rating
    });

    await gig.save();
    res.json({ success: true, gigId: gig._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/gigs', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: 'active' };

    if (category) query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const gigs = await Gig.find(query).limit(50);
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/gigs/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    const freelancer = await User.findById(gig.freelancerId).select('-password');
    res.json({ gig, freelancer });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== ORDERS ==========

app.post('/api/orders/create', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, 'secret_jobboard');
    const client = await User.findById(decoded.userId);
    
    if (client.role !== 'client') return res.status(400).json({ error: 'Only clients can order' });

    const { gigId, description } = req.body;
    const gig = await Gig.findById(gigId);

    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const platformFee = gig.price * 0.20; // 20% commission
    const freelancerEarnings = gig.price * 0.80; // 80% to freelancer

    const order = new Order({
      gigId,
      freelancerId: gig.freelancerId,
      clientId: client._id,
      gigTitle: gig.title,
      price: gig.price,
      platformFee,
      freelancerEarnings,
      description
    });

    await order.save();
    await Gig.updateOne({ _id: gigId }, { $inc: { orders: 1 } });

    res.json({ success: true, orderId: order._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/orders/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, 'secret_jobboard');
    const orders = await Order.find({
      $or: [{ freelancerId: decoded.userId }, { clientId: decoded.userId }]
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/orders/:id/complete', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, 'secret_jobboard');
    const order = await Order.findById(req.params.id);

    if (order.freelancerId.toString() !== decoded.userId) {
      return res.status(400).json({ error: 'Only freelancer can complete' });
    }

    await Order.updateOne(
      { _id: req.params.id },
      { status: 'completed', completedAt: new Date() }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== PAYMENT (Simulated) ==========

app.post('/api/payment/confirm', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, 'secret_jobboard');
    const { orderId, cryptoWallet } = req.body;
    const order = await Order.findById(orderId);

    if (order.clientId.toString() !== decoded.userId) {
      return res.status(400).json({ error: 'Only client can pay' });
    }

    await Order.updateOne(
      { _id: orderId },
      { paymentStatus: 'paid', transactionId: crypto.randomBytes(16).toString('hex') }
    );

    // Update earnings
    await User.updateOne(
      { _id: order.freelancerId },
      { $inc: { totalEarnings: order.freelancerEarnings } }
    );

    await User.updateOne(
      { _id: order.clientId },
      { $inc: { totalSpent: order.price } }
    );

    res.json({
      success: true,
      message: 'Payment confirmed! Send crypto to admin wallet to complete.',
      adminWallet: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      amount: order.price,
      freelancerEarnings: order.freelancerEarnings,
      platformEarnings: order.platformFee
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== DASHBOARD ==========

app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, 'secret_jobboard');
    const user = await User.findById(decoded.userId).select('-password');
    
    let dashboardData = {
      user,
      role: decoded.role
    };

    if (decoded.role === 'freelancer') {
      const gigs = await Gig.find({ freelancerId: user._id });
      const orders = await Order.find({ freelancerId: user._id });
      dashboardData = {
        ...dashboardData,
        gigs,
        orders,
        totalOrders: orders.length,
        activeOrders: orders.filter(o => o.status === 'pending').length
      };
    } else {
      const orders = await Order.find({ clientId: user._id });
      dashboardData = {
        ...dashboardData,
        orders,
        totalOrders: orders.length,
        activeOrders: orders.filter(o => o.status === 'pending').length
      };
    }

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== FRONTEND ==========

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JobBoard - Freelance Marketplace</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .navbar { background: white; padding: 20px; border-radius: 10px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .navbar h1 { color: #667eea; }
    .navbar a { color: white; background: #667eea; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-left: 10px; }
    .hero { background: white; padding: 60px 40px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 40px; }
    .hero h1 { color: #333; font-size: 48px; margin-bottom: 20px; }
    .hero p { color: #666; font-size: 18px; margin-bottom: 30px; }
    .buttons { display: flex; gap: 15px; justify-content: center; margin-bottom: 40px; }
    .btn { padding: 15px 40px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; text-decoration: none; }
    .btn-primary { background: #667eea; color: white; }
    .btn-secondary { background: #764ba2; color: white; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .feature { background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; }
    .feature h3 { color: #667eea; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="navbar">
      <h1>💼 JobBoard</h1>
      <div>
        <a href="/signup.html">Sign Up</a>
        <a href="/login.html">Login</a>
      </div>
    </div>
    <div class="hero">
      <h1>Freelance Marketplace</h1>
      <p>Connect with freelancers. Get work done. Earn money.</p>
      <div class="buttons">
        <a href="/signup.html" class="btn btn-primary">Start Now</a>
        <a href="/browse.html" class="btn btn-secondary">Browse Gigs</a>
      </div>
      <div class="features">
        <div class="feature">
          <h3>💰 Earn Money</h3>
          <p>Freelancers earn 80% of project value</p>
        </div>
        <div class="feature">
          <h3>🔒 Secure</h3>
          <p>Escrow payment system</p>
        </div>
        <div class="feature">
          <h3>⭐ Rated</h3>
          <p>Build reputation & reviews</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);
});

app.get('/signup.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sign Up - JobBoard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI'; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .form { background: white; padding: 40px; border-radius: 10px; width: 90%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .form h1 { color: #667eea; margin-bottom: 30px; text-align: center; }
    .group { margin-bottom: 20px; }
    .group label { display: block; margin-bottom: 8px; font-weight: bold; }
    .group input, .group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; }
    .btn { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
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
        <label>I am a:</label>
        <select id="role" required>
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>
      </div>
      <button type="submit" class="btn">Sign Up</button>
    </form>
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await fetch('/api/auth/signup', {
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
        window.location.href = '/dashboard.html';
      } else {
        alert(data.error);
      }
    });
  </script>
</body>
</html>`);
});

app.get('/login.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Login - JobBoard</title>
  <style>
    body { font-family: 'Segoe UI'; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .form { background: white; padding: 40px; border-radius: 10px; width: 90%; max-width: 400px; }
    .form h1 { color: #667eea; margin-bottom: 30px; text-align: center; }
    .group { margin-bottom: 20px; }
    .group label { display: block; margin-bottom: 8px; font-weight: bold; }
    .group input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; }
    .btn { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
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
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const res = await fetch('/api/auth/login', {
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
        window.location.href = '/dashboard.html';
      } else {
        alert(data.error);
      }
    });
  </script>
</body>
</html>`);
});

app.get('/dashboard.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Dashboard - JobBoard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI'; background: #f5f5f5; }
    .navbar { background: #667eea; color: white; padding: 20px; text-align: center; }
    .container { max-width: 1200px; margin: 20px auto; padding: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat { background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat h3 { color: #667eea; }
    .stat p { font-size: 28px; font-weight: bold; color: #333; }
    .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #667eea; color: white; }
    .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; }
    .btn-danger { background: #dc3545; }
  </style>
</head>
<body>
  <div class="navbar"><h1>💼 Dashboard</h1></div>
  <div class="container">
    <div class="stats">
      <div class="stat">
        <h3>Total Earnings</h3>
        <p id="earnings">\$0</p>
      </div>
      <div class="stat">
        <h3>Active Orders</h3>
        <p id="active">0</p>
      </div>
      <div class="stat">
        <h3>Total Orders</h3>
        <p id="total">0</p>
      </div>
    </div>

    <div class="section">
      <h2>Orders</h2>
      <table id="orders">
        <thead><tr><th>Gig</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>

    <button class="btn btn-danger" onclick="logout()">Logout</button>
  </div>
  <script>
    async function load() {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dashboard', { headers: { 'Authorization': 'Bearer ' + token } });
      const data = await res.json();
      document.getElementById('earnings').textContent = '\$' + Math.round(data.user.totalEarnings * 100) / 100;
      document.getElementById('active').textContent = data.activeOrders;
      document.getElementById('total').textContent = data.totalOrders;
      data.orders.forEach(o => {
        document.querySelector('#orders tbody').innerHTML += '<tr><td>' + o.gigTitle + '</td><td>\$' + o.price + '</td><td>' + o.status + '</td><td><button class="btn" onclick="complete(\'' + o._id + '\')">Complete</button></td></tr>';
      });
    }
    async function complete(orderId) {
      const token = localStorage.getItem('token');
      await fetch('/api/orders/' + orderId + '/complete', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      load();
    }
    function logout() { localStorage.removeItem('token'); window.location.href = '/'; }
    load();
  </script>
</body>
</html>`);
});

app.get('/browse.html', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Browse Gigs - JobBoard</title>
  <style>
    body { font-family: 'Segoe UI'; background: #f5f5f5; }
    .navbar { background: #667eea; color: white; padding: 20px; text-align: center; }
    .container { max-width: 1200px; margin: 20px auto; padding: 20px; }
    .gigs { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .gig { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; }
    .gig h3 { color: #667eea; }
    .gig p { color: #666; margin: 10px 0; }
    .price { font-size: 20px; font-weight: bold; color: #333; }
    .rating { color: #ffc107; }
  </style>
</head>
<body>
  <div class="navbar"><h1>💼 Browse Gigs</h1></div>
  <div class="container">
    <div class="gigs" id="gigs"></div>
  </div>
  <script>
    async function load() {
      const res = await fetch('/api/gigs');
      const gigs = await res.json();
      gigs.forEach(gig => {
        document.getElementById('gigs').innerHTML += '<div class="gig"><h3>' + gig.title + '</h3><p>' + gig.description.substring(0, 100) + '...</p><p class="rating">⭐ ' + gig.freelancerRating + '</p><p class="price">\$' + gig.price + '</p></div>';
      });
    }
    load();
  </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('🚀 JobBoard Live!');
});
