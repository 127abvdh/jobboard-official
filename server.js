const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const gigsFile = path.join(dataDir, 'gigs.json');
const ordersFile = path.join(dataDir, 'orders.json');
const withdrawalsFile = path.join(dataDir, 'withdrawals.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
[usersFile, gigsFile, ordersFile, withdrawalsFile].forEach(f => {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
});

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const ADMIN_SECRET = 'jobboard_admin_2026';

function read(file) { try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; } }
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

function isAdminAuthenticated(req) {
  const cookie = req.headers.cookie || '';
  return cookie.includes(`admin_token=${ADMIN_SECRET}`);
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.url === '/') {
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 20px; }</style></head><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1 style="font-size:48px;margin:20px 0">💼 جاب‌برد</h1><p style="font-size:24px;margin:20px 0">بازار کار فریلنسری ایران</p><p style="margin:20px 0"><a href="/admin-login" style="color:white;background:#FF6B6B;padding:15px 30px;text-decoration:none;border-radius:5px;margin:10px;font-size:18px;display:inline-block;cursor:pointer">🔐 ادمین</a></p></body></html>`);
  }

  else if (req.url === '/admin-login') {
    if (isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin' });
      res.end();
    } else {
      res.writeHead(200);
      res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:350px"><h1 style="color:#FF6B6B;font-size:32px">🔐 ادمین لاگین</h1><form method="POST" action="/api/admin-login"><input type="text" name="username" placeholder="نام کاربری" required style="width:100%;padding:12px;margin:15px 0;border:1px solid #ddd;font-size:16px;box-sizing:border-box;border-radius:5px"><input type="password" name="password" placeholder="رمز عبور" required style="width:100%;padding:12px;margin:15px 0;border:1px solid #ddd;font-size:16px;box-sizing:border-box;border-radius:5px"><button style="width:100%;padding:12px;background:#FF6B6B;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:16px">ورود ادمین</button></form><p style="margin-top:20px"><a href="/" style="color:#667eea;font-size:16px">بازگشت</a></p></div></body></html>`);
    }
  }

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
        res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; }</style></head><body style="background:red;color:white;text-align:center;padding:50px"><h1 style="font-size:36px">❌ خطا</h1><p style="font-size:20px">نام کاربری یا رمز عبور اشتباه است!</p><p><a href="/admin-login" style="color:white;font-size:16px">دوباره تلاش کنید</a></p></body></html>`);
      }
      res.end();
    });
  }

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

    const totalUsers = users.length;
    const totalFreelancers = users.filter(u => u.role === 'فریلنسر').length;
    const totalEmployers = users.filter(u => u.role === 'کارفرما').length;
    const totalGigs = gigs.length;
    const activeGigs = gigs.filter(g => g.status !== 'closed').length;
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    let totalRevenue = 0;
    completedOrders.forEach(o => {
      totalRevenue += o.price * 0.2;
    });
    
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
    let pendingAmount = 0;
    pendingWithdrawals.forEach(w => {
      pendingAmount += w.amount;
    });

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; background: #f0f0f0; margin: 0; padding: 20px; font-size: 18px; }.container { max-width: 1200px; margin: 0 auto; }.header { background: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }.header h1 { color: #FF6B6B; margin: 0; font-size: 36px; }.header p { font-size: 18px; color: #666; }.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }.stat-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }.stat-card h3 { color: #667eea; margin: 0 0 10px 0; font-size: 32px; }.stat-card p { color: #666; margin: 0; font-size: 16px; }.menu { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }.menu h2 { font-size: 24px; }.menu a { display: inline-block; background: #667eea; color: white; padding: 12px 25px; margin: 8px; text-decoration: none; border-radius: 5px; font-size: 16px; cursor: pointer; }.menu a:hover { background: #FF6B6B; }.menu a.logout { background: #FF6B6B; }</style></head><body><div class="container"><div class="header"><h1>🎛️ پنل ادمین - جاب‌برد</h1><p>خوش آمدید! اینجا کنترل کامل سایت است.</p></div><div class="stats"><div class="stat-card"><h3>${totalUsers}</h3><p>کل کاربران</p></div><div class="stat-card"><h3>${totalFreelancers}</h3><p>فریلنسرها</p></div><div class="stat-card"><h3>${totalEmployers}</h3><p>کارفرمایان</p></div><div class="stat-card"><h3>${totalGigs}</h3><p>کل پروژه‌ها</p></div><div class="stat-card"><h3>${activeGigs}</h3><p>پروژه‌های فعال</p></div><div class="stat-card"><h3>${totalOrders}</h3><p>کل سفارش‌ها</p></div><div class="stat-card"><h3>${completedOrders}</h3><p>سفارش‌های تکمیل شده</p></div><div class="stat-card"><h3>${Math.floor(totalRevenue * 10000).toLocaleString('fa-IR')} تومان</h3><p>درآمد کل (20%)</p></div><div class="stat-card"><h3>${pendingWithdrawals.length}</h3><p>درخواست برداشت</p></div><div class="stat-card"><h3>${Math.floor(pendingAmount * 10000).toLocaleString('fa-IR')} تومان</h3><p>میزان برداشت در انتظار</p></div></div><div class="menu"><h2>منو ادمین</h2><a href="/admin/users">👥 مدیریت کاربران</a><a href="/admin/projects">💼 مدیریت پروژه‌ها</a><a href="/admin/orders">📦 مدیریت سفارش‌ها</a><a href="/admin/revenue">💰 درآمد و برداشت</a><a href="/logout" class="logout">خروج</a></div></div></body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  else if (req.url === '/logout') {
    res.writeHead(302, {
      'Location': '/',
      'Set-Cookie': 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
    });
    res.end();
  }

  else {
    res.writeHead(404);
    res.end('صفحه پیدا نشد');
  }
});

server.listen(PORT, '0.0.0.0');
console.log(`🚀 JobBoard Admin Panel درحال اجرا است روی پورت ${PORT}`);
console.log(`📊 Admin Panel: https://jobboard-official.ir/admin-login`);
console.log(`👤 Admin Username: admin`);
console.log(`🔐 Admin Password: admin`);
