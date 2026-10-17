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

function getUser(req) {
  const cookie = req.headers.cookie || '';
  if (cookie.includes('user=')) {
    return decodeURIComponent(cookie.split('user=')[1].split(';')[0]);
  }
  return null;
}

function getUserRole(req) {
  const cookie = req.headers.cookie || '';
  if (cookie.includes('role=')) {
    return decodeURIComponent(cookie.split('role=')[1].split(';')[0]);
  }
  return null;
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // ============ HOME PAGE ============
  if (req.url === '/') {
    const user = getUser(req);
    let homeHtml = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: 0; padding: 0; }</style></head><body>
    <div style="padding: 50px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <h1 style="font-size: 48px; margin: 20px 0;">💼 جاب‌برد</h1>
      <p style="font-size: 24px; margin: 20px 0;">بازار کار فریلنسری ایران</p>
      <p style="font-size: 18px; margin: 30px 0;">`;
    
    if (user) {
      homeHtml += `<a href="/dashboard" style="background: white; color: #667eea; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; cursor: pointer; font-weight: bold;">📊 داشبورد</a>
        <a href="/logout" style="background: #FF6B6B; color: white; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; cursor: pointer; font-weight: bold;">خروج</a>`;
    } else {
      homeHtml += `<a href="/signup" style="background: white; color: #667eea; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; cursor: pointer; font-weight: bold;">ثبت‌نام</a>
        <a href="/login" style="background: white; color: #667eea; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px; cursor: pointer; font-weight: bold;">ورود</a>`;
    }
    
    homeHtml += `</p>
      <p style="font-size: 18px; margin: 20px 0;">
        <a href="/admin-login" style="background: #FF6B6B; color: white; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; cursor: pointer; font-weight: bold;">🔐 ادمین</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(homeHtml);
  }

  // ============ SIGNUP ============
  else if (req.url === '/signup') {
    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: #667eea; }</style></head><body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
    <div style="background: white; color: #333; padding: 40px; border-radius: 10px; width: 100%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="color: #667eea; font-size: 32px; margin-top: 0;">ثبت‌نام</h1>
      <form method="POST" action="/api/signup">
        <input type="text" name="username" placeholder="نام کاربری" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <input type="email" name="email" placeholder="ایمیل" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <input type="password" name="password" placeholder="رمز عبور" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <select name="role" required style="width: 100%; padding: 12px; margin: 15px 0; font-size: 16px; box-sizing: border-box; border-radius: 5px; border: 1px solid #ddd;">
          <option value="">-- نقش را انتخاب کنید --</option>
          <option value="فریلنسر">🎯 فریلنسر (خدمات ارائه می‌دهم)</option>
          <option value="کارفرما">💼 کارفرما (کار می‌دهم)</option>
        </select>
        <button style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; margin-top: 20px;">ثبت‌نام</button>
      </form>
      <p style="text-align: center; margin-top: 20px; font-size: 16px;">
        <a href="/login" style="color: #667eea; text-decoration: none;">قبلاً ثبت‌نام کردید؟ وارد شوید</a>
      </p>
      <p style="text-align: center; margin-top: 10px;">
        <a href="/" style="color: #666; text-decoration: none;">← بازگشت</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ LOGIN ============
  else if (req.url === '/login') {
    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: #667eea; }</style></head><body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
    <div style="background: white; color: #333; padding: 40px; border-radius: 10px; width: 100%; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="color: #667eea; font-size: 32px; margin-top: 0;">ورود</h1>
      <form method="POST" action="/api/login">
        <input type="email" name="email" placeholder="ایمیل" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <input type="password" name="password" placeholder="رمز عبور" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <button style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; margin-top: 20px;">ورود</button>
      </form>
      <p style="text-align: center; margin-top: 20px; font-size: 16px;">
        <a href="/signup" style="color: #667eea; text-decoration: none;">هنوز ثبت‌نام نکردید؟ ثبت‌نام کنید</a>
      </p>
      <p style="text-align: center; margin-top: 10px;">
        <a href="/" style="color: #666; text-decoration: none;">← بازگشت</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ API SIGNUP ============
  else if (req.url === '/api/signup' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const users = read(usersFile);
      const exists = users.find(u => u.email === params.get('email'));
      
      if (exists) {
        res.writeHead(200);
        res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; }</style></head><body style="background: red; color: white; text-align: center; padding: 50px;"><h1 style="font-size: 36px;">❌ خطا</h1><p style="font-size: 20px;">این ایمیل قبلاً ثبت شده است!</p><p><a href="/login" style="color: white; font-size: 16px;">وارد شوید</a> یا <a href="/signup" style="color: white; font-size: 16px;">ثبت‌نام دوباره</a></p></body></html>`);
      } else {
        users.push({
          username: params.get('username'),
          email: params.get('email'),
          password: params.get('password'),
          role: params.get('role'),
          createdAt: new Date().toISOString()
        });
        write(usersFile, users);
        res.writeHead(302, { 'Location': '/login' });
        res.end();
      }
    });
  }

  // ============ API LOGIN ============
  else if (req.url === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const users = read(usersFile);
      const user = users.find(u => u.email === params.get('email') && u.password === params.get('password'));
      
      if (user) {
        res.writeHead(302, {
          'Location': '/dashboard',
          'Set-Cookie': [
            `user=${encodeURIComponent(user.username)}; path=/; Max-Age=86400`,
            `role=${encodeURIComponent(user.role)}; path=/; Max-Age=86400`
          ]
        });
      } else {
        res.writeHead(200);
        res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; }</style></head><body style="background: red; color: white; text-align: center; padding: 50px;"><h1 style="font-size: 36px;">❌ خطا</h1><p style="font-size: 20px;">ایمیل یا رمز عبور اشتباه است!</p><p><a href="/login" style="color: white; font-size: 16px;">دوباره تلاش کنید</a></p></body></html>`);
      }
      res.end();
    });
  }

  // ============ DASHBOARD ============
  else if (req.url === '/dashboard') {
    const user = getUser(req);
    const role = getUserRole(req);
    
    if (!user) {
      res.writeHead(302, { 'Location': '/login' });
      res.end();
      return;
    }

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: #f5f5f5; margin: 0; padding: 20px; }</style></head><body>
    <div style="max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <div>
          <h1 style="color: #667eea; font-size: 36px; margin: 0;">📊 داشبورد</h1>
          <p style="color: #666; font-size: 18px; margin: 5px 0;">خوش آمدید، ${user}!</p>
          <p style="color: #999; font-size: 16px;">نقش: ${role === 'فریلنسر' ? '🎯 فریلنسر' : '💼 کارفرما'}</p>
        </div>
        <a href="/logout" style="background: #FF6B6B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;">خروج</a>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <a href="/browse-gigs" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-decoration: none; text-align: center; font-size: 18px; cursor: pointer; transition: transform 0.3s;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">💼</h3>
          <p style="margin: 0;">مرور پروژه‌ها</p>
        </a>
        ${role === 'فریلنسر' ? `<a href="/create-gig" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-decoration: none; text-align: center; font-size: 18px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">➕</h3>
          <p style="margin: 0;">ایجاد خدمت جدید</p>
        </a>` : ''}
        <a href="/orders" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-decoration: none; text-align: center; font-size: 18px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">📦</h3>
          <p style="margin: 0;">سفارش‌های من</p>
        </a>
        <a href="/wallet" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-decoration: none; text-align: center; font-size: 18px; cursor: pointer;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">💰</h3>
          <p style="margin: 0;">کیف پول</p>
        </a>
      </div>

      <p style="text-align: center; color: #666; font-size: 16px;">
        <a href="/admin-login" style="color: #FF6B6B; text-decoration: none;">🔐 ادمین</a> | <a href="/" style="color: #667eea; text-decoration: none;">← صفحه اصلی</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ BROWSE GIGS ============
  else if (req.url === '/browse-gigs') {
    const user = getUser(req);
    if (!user) {
      res.writeHead(302, { 'Location': '/login' });
      res.end();
      return;
    }

    const gigs = read(gigsFile);
    let gigsHtml = '';
    gigs.forEach(g => {
      gigsHtml += `<div style="background: white; padding: 20px; margin: 15px 0; border-radius: 10px; border-right: 4px solid #667eea;">
        <h3 style="color: #667eea; margin-top: 0;">${g.title}</h3>
        <p style="color: #666; font-size: 16px;">توسط: ${g.freelancer}</p>
        <p style="font-size: 16px; color: #333;">${g.description || 'توضیح ندارد'}</p>
        <p style="font-size: 18px; color: #FF6B6B; font-weight: bold;">${Math.floor(g.price * 10000).toLocaleString('fa-IR')} تومان</p>
        <form method="POST" action="/api/order" style="margin-top: 15px;">
          <input type="hidden" name="gigId" value="${g.id}">
          <button type="submit" style="background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">سفارش دادن</button>
        </form>
      </div>`;
    });

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: #f5f5f5; margin: 0; padding: 20px; }</style></head><body>
    <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
      <h1 style="color: #667eea; font-size: 32px;">💼 پروژه‌های موجود</h1>
      <p style="font-size: 16px; color: #666;">کل پروژه‌ها: ${gigs.length}</p>
      ${gigsHtml || '<p style="color: #999; font-size: 18px; text-align: center; padding: 40px;">هنوز پروژه‌ای موجود نیست!</p>'}
      <p style="margin-top: 30px; text-align: center;">
        <a href="/dashboard" style="color: #667eea; font-size: 16px; text-decoration: none;">← بازگشت به داشبورد</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ CREATE GIG ============
  else if (req.url === '/create-gig') {
    const user = getUser(req);
    if (!user) {
      res.writeHead(302, { 'Location': '/login' });
      res.end();
      return;
    }

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: #667eea; }</style></head><body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
    <div style="background: white; color: #333; padding: 40px; border-radius: 10px; width: 100%; max-width: 500px;">
      <h1 style="color: #667eea; font-size: 32px; margin-top: 0;">➕ ایجاد خدمت جدید</h1>
      <form method="POST" action="/api/create-gig">
        <input type="text" name="title" placeholder="عنوان خدمت" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <textarea name="description" placeholder="توضیح خدمت" style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px; height: 100px;"></textarea>
        <input type="number" name="price" placeholder="قیمت (تومان)" required style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #ddd; font-size: 16px; box-sizing: border-box; border-radius: 5px;">
        <button type="submit" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; margin-top: 20px;">ایجاد خدمت</button>
      </form>
      <p style="text-align: center; margin-top: 20px;">
        <a href="/dashboard" style="color: #667eea; text-decoration: none; font-size: 16px;">← بازگشت</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ API CREATE GIG ============
  else if (req.url === '/api/create-gig' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const user = getUser(req);
      const gigs = read(gigsFile);
      gigs.push({
        id: Date.now(),
        title: params.get('title'),
        description: params.get('description'),
        price: parseFloat(params.get('price')) / 10000,
        freelancer: user
      });
      write(gigsFile, gigs);
      res.writeHead(302, { 'Location': '/dashboard' });
      res.end();
    });
  }

  // ============ ORDERS ============
  else if (req.url === '/orders') {
    const user = getUser(req);
    if (!user) {
      res.writeHead(302, { 'Location': '/login' });
      res.end();
      return;
    }

    const orders = read(ordersFile);
    let ordersHtml = '';
    orders.forEach(o => {
      if (o.freelancer === user || o.employer === user) {
        ordersHtml += `<div style="background: white; padding: 20px; margin: 15px 0; border-radius: 10px; border-right: 4px solid ${o.status === 'completed' ? 'green' : '#FF6B6B'};">
          <h3 style="color: #667eea; margin-top: 0;">${o.gigTitle}</h3>
          <p style="font-size: 16px;"><strong>فریلنسر:</strong> ${o.freelancer}</p>
          <p style="font-size: 16px;"><strong>کارفرما:</strong> ${o.employer}</p>
          <p style="font-size: 18px; color: #FF6B6B;"><strong>${Math.floor(o.price * 10000).toLocaleString('fa-IR')} تومان</strong></p>
          <p style="font-size: 16px;"><strong>وضعیت:</strong> <span style="color: ${o.status === 'completed' ? 'green' : 'orange'}">${o.status === 'completed' ? '✅ تکمیل شده' : '⏳ در حال انجام'}</span></p>
        </div>`;
      }
    });

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: #f5f5f5; margin: 0; padding: 20px; }</style></head><body>
    <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
      <h1 style="color: #667eea; font-size: 32px;">📦 سفارش‌های من</h1>
      ${ordersHtml || '<p style="color: #999; font-size: 18px; text-align: center; padding: 40px;">هنوز سفارشی نیست!</p>'}
      <p style="margin-top: 30px; text-align: center;">
        <a href="/dashboard" style="color: #667eea; font-size: 16px; text-decoration: none;">← بازگشت</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ API ORDER ============
  else if (req.url === '/api/order' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const gigs = read(gigsFile);
      const gig = gigs.find(g => g.id == params.get('gigId'));
      const employer = getUser(req);
      
      if (gig) {
        const orders = read(ordersFile);
        orders.push({
          id: Date.now(),
          gigId: gig.id,
          gigTitle: gig.title,
          price: gig.price,
          freelancer: gig.freelancer,
          employer: employer,
          status: 'active'
        });
        write(ordersFile, orders);
      }
      res.writeHead(302, { 'Location': '/orders' });
      res.end();
    });
  }

  // ============ WALLET ============
  else if (req.url === '/wallet') {
    const user = getUser(req);
    if (!user) {
      res.writeHead(302, { 'Location': '/login' });
      res.end();
      return;
    }

    const orders = read(ordersFile);
    let earnings = 0;
    orders.forEach(o => {
      if (o.freelancer === user && o.status === 'completed') {
        earnings += o.price * 0.8;
      }
    });

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }</style></head><body style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
    <div style="background: white; color: #333; padding: 40px; border-radius: 10px; width: 100%; max-width: 500px; text-align: center;">
      <h1 style="color: #667eea; font-size: 32px; margin-top: 0;">💰 کیف پول</h1>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
        <p style="font-size: 18px; margin: 0;">موجودی کل</p>
        <h2 style="font-size: 36px; margin: 10px 0;">${Math.floor(earnings * 10000).toLocaleString('fa-IR')} تومان</h2>
      </div>
      <p style="font-size: 16px; color: #666;">سفارش‌های تکمیل شده: ${orders.filter(o => o.freelancer === user && o.status === 'completed').length}</p>
      <p style="margin-top: 30px; text-align: center;">
        <a href="/dashboard" style="color: #667eea; font-size: 16px; text-decoration: none;">← بازگشت</a>
      </p>
    </div>
    </body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ ADMIN LOGIN ============
  else if (req.url === '/admin-login') {
    if (isAdminAuthenticated(req)) {
      res.writeHead(302, { 'Location': '/admin' });
      res.end();
    } else {
      res.writeHead(200);
      res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; font-size: 18px; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:350px"><h1 style="color:#FF6B6B;font-size:32px">🔐 ادمین لاگین</h1><form method="POST" action="/api/admin-login"><input type="text" name="username" placeholder="نام کاربری" required style="width:100%;padding:12px;margin:15px 0;border:1px solid #ddd;font-size:16px;box-sizing:border-box;border-radius:5px"><input type="password" name="password" placeholder="رمز عبور" required style="width:100%;padding:12px;margin:15px 0;border:1px solid #ddd;font-size:16px;box-sizing:border-box;border-radius:5px"><button style="width:100%;padding:12px;background:#FF6B6B;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:16px">ورود ادمین</button></form><p style="margin-top:20px"><a href="/" style="color:#667eea;font-size:16px">بازگشت</a></p></div></body></html>`);
    }
  }

  // ============ API ADMIN LOGIN ============
  else if (req.url === '/api/admin-login' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      if (params.get('username') === ADMIN_USERNAME && params.get('password') === ADMIN_PASSWORD) {
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

    const totalUsers = users.length;
    const totalFreelancers = users.filter(u => u.role === 'فریلنسر').length;
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    let totalRevenue = 0;
    completedOrders.forEach(o => {
      totalRevenue += o.price * 0.2;
    });

    const html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; background: #f0f0f0; margin: 0; padding: 20px; font-size: 18px; }.container { max-width: 1200px; margin: 0 auto; }.header { background: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }.header h1 { color: #FF6B6B; margin: 0; font-size: 36px; }.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px; }.stat-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }.stat-card h3 { color: #667eea; margin: 0 0 10px 0; font-size: 32px; }.stat-card p { color: #666; margin: 0; font-size: 16px; }.menu { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }.menu h2 { font-size: 24px; }.menu a { display: inline-block; background: #667eea; color: white; padding: 12px 25px; margin: 8px; text-decoration: none; border-radius: 5px; font-size: 16px; cursor: pointer; }.menu a:hover { background: #FF6B6B; }.menu a.logout { background: #FF6B6B; }</style></head><body><div class="container"><div class="header"><h1>🎛️ پنل ادمین</h1><p style="margin: 5px 0; font-size: 18px; color: #666;">کنترل کامل سایت</p></div><div class="stats"><div class="stat-card"><h3>${totalUsers}</h3><p>کل کاربران</p></div><div class="stat-card"><h3>${totalFreelancers}</h3><p>فریلنسرها</p></div><div class="stat-card"><h3>${gigs.length}</h3><p>کل خدمات</p></div><div class="stat-card"><h3>${totalOrders}</h3><p>کل سفارش‌ها</p></div><div class="stat-card"><h3>${completedOrders}</h3><p>سفارش‌های تکمیل</p></div><div class="stat-card"><h3>${Math.floor(totalRevenue * 10000).toLocaleString('fa-IR')} تومان</h3><p>درآمد کل</p></div></div><div class="menu"><h2>منو ادمین</h2><a href="/admin/users">👥 کاربران</a><a href="/admin/gigs">💼 خدمات</a><a href="/admin/orders">📦 سفارش‌ها</a><a href="/logout" class="logout">خروج</a></div></div></body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  // ============ LOGOUT ============
  else if (req.url === '/logout') {
    res.writeHead(302, {
      'Location': '/',
      'Set-Cookie': [
        'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC;',
        'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC;',
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
console.log(`🚀 JobBoard سایت کامل درحال اجرا است روی پورت ${PORT}`);
console.log(`🌐 سایت: https://jobboard-official.ir`);
console.log(`👤 Admin: https://jobboard-official.ir/admin-login (admin/admin)`);
