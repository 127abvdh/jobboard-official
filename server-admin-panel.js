const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const gigsFile = path.join(dataDir, 'gigs.json');
const ordersFile = path.join(dataDir, 'orders.json');
const withdrawalsFile = path.join(dataDir, 'withdrawals.json');
const adminFile = path.join(dataDir, 'admin.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
[usersFile, gigsFile, ordersFile, withdrawalsFile, adminFile].forEach(f => {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
});

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const ADMIN_SECRET = 'jobboard_admin_2026';

function read(file) { try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; } }
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function isAdminAuthenticated(req) {
  const cookie = req.headers.cookie || '';
  return cookie.includes(`admin_token=${ADMIN_SECRET}`);
}

function getUser(req) {
  const cookie = req.headers.cookie || '';
  if (cookie.includes('user=')) {
    return decodeURIComponent(cookie.split('user=')[1].split(';')[0]);
  }
  return 'کاربر';
}

const basestyle = `direction: rtl; font-family: 'Tahoma', 'Verdana', sans-serif; text-align: right;`;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // ============ HOME PAGE ============
  if (req.url === '/') {
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1>💼 جاب‌برد</h1><p>بازار کار فریلنسری ایران</p><p><a href="/signup" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">ثبت‌نام</a> <a href="/login" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">ورود</a> <a href="/admin-login" style="color:white;background:#FF6B6B;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">🔐 ادمین</a></p></body></html>`);
  }

  // ============ ADMIN LOGIN ============
  else if (req.url === '/admin-login') {
    if (isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin' });
      res.end();
    } else {
      res.writeHead(200);
      res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:300px"><h1 style="color:#FF6B6B">🔐 ادمین لاگین</h1><form method="POST" action="/api/admin-login"><input type="text" name="username" placeholder="نام کاربری" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="password" name="password" placeholder="رمز عبور" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><button style="width:100%;padding:10px;background:#FF6B6B;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold">ورود ادمین</button></form><p><a href="/" style="color:#667eea">بازگشت</a></p></div></body></html>`);
    }
  }

  // ============ API: ADMIN LOGIN ============
  else if (req.url === '/api/admin-login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const username = params.get('username');
      const password = params.get('password');

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.writeHead(302, {
          'Location': '/admin',
          'Set-Cookie': `admin_token=${ADMIN_SECRET}; path=/; Max-Age=86400`
        });
      } else {
        res.writeHead(200);
        res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:red;color:white;text-align:center;padding:50px"><h1>❌ خطا</h1><p>نام کاربری یا رمز عبور اشتباه است!</p><p><a href="/admin-login" style="color:white">دوباره تلاش کنید</a></p></body></html>`);
      }
      res.end();
    });
  }

  // ============ ADMIN DASHBOARD ============
  else if (req.url === '/admin') {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const users = read(usersFile);
    const gigs = read(gigsFile);
    const orders = read(ordersFile);
    const withdrawals = read(withdrawalsFile);

    // Calculate stats
    const totalUsers = users.length;
    const totalFreelancers = users.filter(u => u.role === 'فریلنسر').length;
    const totalEmployers = users.filter(u => u.role === 'کارفرما').length;
    const totalGigs = gigs.length;
    const activeGigs = gigs.filter(g => g.status !== 'closed').length;
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    let totalRevenue = 0;
    completedOrders.forEach(o => {
      totalRevenue += o.price * 0.2; // 20% commission
    });
    
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
    let pendingAmount = 0;
    pendingWithdrawals.forEach(w => {
      pendingAmount += w.amount;
    });

    const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { direction: rtl; font-family: Tahoma; background: #f0f0f0; margin: 0; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; }
.header { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.header h1 { color: #FF6B6B; margin: 0; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
.stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
.stat-card h3 { color: #667eea; margin: 0 0 10px 0; font-size: 24px; }
.stat-card p { color: #666; margin: 0; }
.menu { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
.menu a { display: inline-block; background: #667eea; color: white; padding: 10px 20px; margin: 5px; text-decoration: none; border-radius: 5px; }
.menu a:hover { background: #FF6B6B; }
.menu a.logout { background: #FF6B6B; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎛️ پنل ادمین - جاب‌برد</h1>
    <p>خوش آمدید! اینجا کنترل کامل سایت است.</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <h3>${totalUsers}</h3>
      <p>کل کاربران</p>
    </div>
    <div class="stat-card">
      <h3>${totalFreelancers}</h3>
      <p>فریلنسرها</p>
    </div>
    <div class="stat-card">
      <h3>${totalEmployers}</h3>
      <p>کارفرمایان</p>
    </div>
    <div class="stat-card">
      <h3>${totalGigs}</h3>
      <p>کل پروژه‌ها</p>
    </div>
    <div class="stat-card">
      <h3>${activeGigs}</h3>
      <p>پروژه‌های فعال</p>
    </div>
    <div class="stat-card">
      <h3>${totalOrders}</h3>
      <p>کل سفارش‌ها</p>
    </div>
    <div class="stat-card">
      <h3>${completedOrders}</h3>
      <p>سفارش‌های تکمیل شده</p>
    </div>
    <div class="stat-card">
      <h3>${Math.floor(totalRevenue * 10000).toLocaleString('fa-IR')} تومان</h3>
      <p>درآمد کل (20%)</p>
    </div>
    <div class="stat-card">
      <h3>${pendingWithdrawals.length}</h3>
      <p>درخواست برداشت در انتظار</p>
    </div>
    <div class="stat-card">
      <h3>${Math.floor(pendingAmount * 10000).toLocaleString('fa-IR')} تومان</h3>
      <p>میزان برداشت در انتظار</p>
    </div>
  </div>

  <div class="menu">
    <h2>منو ادمین</h2>
    <a href="/admin/users">👥 مدیریت کاربران</a>
    <a href="/admin/projects">💼 مدیریت پروژه‌ها</a>
    <a href="/admin/orders">📦 مدیریت سفارش‌ها</a>
    <a href="/admin/revenue">💰 درآمد و برداشت</a>
    <a href="/admin/settings">⚙️ تنظیمات</a>
    <a href="/logout" class="logout">خروج</a>
  </div>
</div>
</body>
</html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ ADMIN USERS MANAGEMENT ============
  else if (req.url === '/admin/users') {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const users = read(usersFile);
    let userRows = '';
    users.forEach(u => {
      userRows += `<tr>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.createdAt || 'نامشخص'}</td>
        <td><a href="/admin/delete-user/${u.username}" onclick="return confirm('آیا مطمئن هستید؟')" style="color:red;text-decoration:none">حذف</a></td>
      </tr>`;
    });

    const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { direction: rtl; font-family: Tahoma; background: #f0f0f0; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
th { background: #667eea; color: white; }
tr:hover { background: #f5f5f5; }
a { color: #667eea; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
  <h1>👥 مدیریت کاربران</h1>
  <p>کل کاربران: ${users.length}</p>
  <a href="/admin" style="background:#667eea;color:white;padding:10px 20px;border-radius:5px;display:inline-block;margin-bottom:20px">← بازگشت</a>
  <table>
    <thead>
      <tr>
        <th>نام کاربری</th>
        <th>ایمیل</th>
        <th>نقش</th>
        <th>تاریخ ایجاد</th>
        <th>عملیات</th>
      </tr>
    </thead>
    <tbody>
      ${userRows}
    </tbody>
  </table>
</div>
</body>
</html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ ADMIN PROJECTS MANAGEMENT ============
  else if (req.url === '/admin/projects') {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const gigs = read(gigsFile);
    let gigRows = '';
    gigs.forEach(g => {
      gigRows += `<tr>
        <td>${g.title}</td>
        <td>${g.freelancer}</td>
        <td>${Math.floor(g.price * 10000).toLocaleString('fa-IR')} تومان</td>
        <td>${g.description ? g.description.substring(0, 30) + '...' : 'بدون توضیح'}</td>
        <td><a href="/admin/delete-gig/${g.id}" onclick="return confirm('آیا مطمئن هستید؟')" style="color:red;text-decoration:none">حذف</a></td>
      </tr>`;
    });

    const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { direction: rtl; font-family: Tahoma; background: #f0f0f0; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
th { background: #667eea; color: white; }
tr:hover { background: #f5f5f5; }
</style>
</head>
<body>
<div class="container">
  <h1>💼 مدیریت پروژه‌ها</h1>
  <p>کل پروژه‌ها: ${gigs.length}</p>
  <a href="/admin" style="background:#667eea;color:white;padding:10px 20px;border-radius:5px;display:inline-block;margin-bottom:20px">← بازگشت</a>
  <table>
    <thead>
      <tr>
        <th>عنوان</th>
        <th>فریلنسر</th>
        <th>قیمت</th>
        <th>توضیح</th>
        <th>عملیات</th>
      </tr>
    </thead>
    <tbody>
      ${gigRows}
    </tbody>
  </table>
</div>
</body>
</html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ ADMIN ORDERS MANAGEMENT ============
  else if (req.url === '/admin/orders') {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const orders = read(ordersFile);
    let orderRows = '';
    orders.forEach(o => {
      const commission = Math.floor((o.price * 0.2) * 10000).toLocaleString('fa-IR');
      orderRows += `<tr>
        <td>${o.gigTitle}</td>
        <td>${o.freelancer}</td>
        <td>${o.employer}</td>
        <td>${Math.floor(o.price * 10000).toLocaleString('fa-IR')} تومان</td>
        <td>${commission} تومان</td>
        <td><span style="color:${o.status === 'completed' ? 'green' : 'orange'}">${o.status === 'completed' ? '✅ تکمیل' : '⏳ فعال'}</span></td>
      </tr>`;
    });

    const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { direction: rtl; font-family: Tahoma; background: #f0f0f0; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
th { background: #667eea; color: white; }
tr:hover { background: #f5f5f5; }
</style>
</head>
<body>
<div class="container">
  <h1>📦 مدیریت سفارش‌ها</h1>
  <p>کل سفارش‌ها: ${orders.length}</p>
  <a href="/admin" style="background:#667eea;color:white;padding:10px 20px;border-radius:5px;display:inline-block;margin-bottom:20px">← بازگشت</a>
  <table>
    <thead>
      <tr>
        <th>عنوان</th>
        <th>فریلنسر</th>
        <th>کارفرما</th>
        <th>قیمت</th>
        <th>کمیسیون (20%)</th>
        <th>وضعیت</th>
      </tr>
    </thead>
    <tbody>
      ${orderRows}
    </tbody>
  </table>
</div>
</body>
</html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ ADMIN REVENUE MANAGEMENT ============
  else if (req.url === '/admin/revenue') {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const orders = read(ordersFile);
    const withdrawals = read(withdrawalsFile);

    let totalRevenue = 0;
    orders.forEach(o => {
      if (o.status === 'completed') {
        totalRevenue += o.price * 0.2;
      }
    });

    let withdrawalRows = '';
    withdrawals.forEach(w => {
      withdrawalRows += `<tr>
        <td>${w.freelancer}</td>
        <td>${Math.floor(w.amount * 10000).toLocaleString('fa-IR')} تومان</td>
        <td><span style="color:${w.status === 'pending' ? 'orange' : 'green'}">${w.status === 'pending' ? '⏳ در انتظار' : '✅ تایید شده'}</span></td>
        <td>${new Date(w.date).toLocaleDateString('fa-IR')}</td>
        ${w.status === 'pending' ? `<td><a href="/admin/approve-withdrawal/${w.id}" style="color:green">تایید</a></td>` : '<td>-</td>'}
      </tr>`;
    });

    const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { direction: rtl; font-family: Tahoma; background: #f0f0f0; padding: 20px; }
.container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
.revenue-box { background: #667eea; color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
.revenue-box h2 { margin: 0; font-size: 40px; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { padding: 10px; text-align: right; border-bottom: 1px solid #ddd; }
th { background: #667eea; color: white; }
tr:hover { background: #f5f5f5; }
</style>
</head>
<body>
<div class="container">
  <h1>💰 درآمد و برداشت</h1>
  <a href="/admin" style="background:#667eea;color:white;padding:10px 20px;border-radius:5px;display:inline-block;margin-bottom:20px">← بازگشت</a>
  
  <div class="revenue-box">
    <p>درآمد کل (کمیسیون 20%)</p>
    <h2>${Math.floor(totalRevenue * 10000).toLocaleString('fa-IR')} تومان</h2>
  </div>

  <h3>درخواست‌های برداشت</h3>
  <table>
    <thead>
      <tr>
        <th>فریلنسر</th>
        <th>مبلغ</th>
        <th>وضعیت</th>
        <th>تاریخ</th>
        <th>عملیات</th>
      </tr>
    </thead>
    <tbody>
      ${withdrawalRows}
    </tbody>
  </table>
</div>
</body>
</html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ ADMIN SETTINGS ============
  else if (req.url === '/admin/settings') {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const html = `<html>
<head>
<meta charset="utf-8">
<style>
body { direction: rtl; font-family: Tahoma; background: #f0f0f0; padding: 20px; }
.container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
.setting { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
.setting label { display: block; margin-bottom: 5px; font-weight: bold; color: #667eea; }
.setting input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; }
button { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
button:hover { background: #FF6B6B; }
</style>
</head>
<body>
<div class="container">
  <h1>⚙️ تنظیمات</h1>
  <a href="/admin" style="color:#667eea">← بازگشت</a>
  
  <form method="POST" action="/api/save-settings">
    <div class="setting">
      <label>درصد کمیسیون</label>
      <input type="number" name="commission" value="20" min="1" max="100"> %
    </div>
    
    <div class="setting">
      <label>نام سایت</label>
      <input type="text" name="siteName" value="جاب‌برد">
    </div>
    
    <div class="setting">
      <label>ایمیل پشتیبانی</label>
      <input type="email" name="supportEmail" value="support@jobboard.ir">
    </div>
    
    <div class="setting">
      <label>توضیح سایت</label>
      <input type="text" name="siteDescription" value="بازار کار فریلنسری ایران">
    </div>
    
    <button type="submit">ذخیره تنظیمات</button>
  </form>
</div>
</body>
</html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ API: DELETE USER ============
  else if (req.url.startsWith('/admin/delete-user/')) {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const username = req.url.split('/').pop();
    const users = read(usersFile);
    const filtered = users.filter(u => u.username !== username);
    write(usersFile, filtered);

    res.writeHead(302, { 'Location': '/admin/users' });
    res.end();
  }

  // ============ API: DELETE GIG ============
  else if (req.url.startsWith('/admin/delete-gig/')) {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const gigId = parseInt(req.url.split('/').pop());
    const gigs = read(gigsFile);
    const filtered = gigs.filter(g => g.id !== gigId);
    write(gigsFile, filtered);

    res.writeHead(302, { 'Location': '/admin/projects' });
    res.end();
  }

  // ============ API: APPROVE WITHDRAWAL ============
  else if (req.url.startsWith('/admin/approve-withdrawal/')) {
    if (!isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin-login' });
      res.end();
      return;
    }

    const withdrawalId = parseInt(req.url.split('/').pop());
    const withdrawals = read(withdrawalsFile);
    const withdrawal = withdrawals.find(w => w.id == withdrawalId);
    if (withdrawal) {
      withdrawal.status = 'approved';
      write(withdrawalsFile, withdrawals);
    }

    res.writeHead(302, { 'Location': '/admin/revenue' });
    res.end();
  }

  // ============ API: SAVE SETTINGS ============
  else if (req.url === '/api/save-settings' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      // Settings can be saved here if needed
      res.writeHead(302, { 'Location': '/admin/settings' });
      res.end();
    });
  }

  // ============ LOGOUT ============
  else if (req.url === '/logout') {
    res.writeHead(302, {
      'Location': '/',
      'Set-Cookie': [
        'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC;',
        'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      ]
    });
    res.end();
  }

  else {
    res.writeHead(404);
    res.end('صفحه پیدا نشد');
  }
});

server.listen(PORT, '0.0.0.0');
console.log(`🚀 JobBoard با Admin Panel درحال اجرا است روی پورت ${PORT}`);
console.log(`📊 Admin Panel: http://localhost:${PORT}/admin-login`);
console.log(`👤 Admin Username: admin`);
console.log(`🔐 Admin Password: admin`);
