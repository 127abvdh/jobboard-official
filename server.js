const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const gigsFile = path.join(dataDir, 'gigs.json');
const ordersFile = path.join(dataDir, 'orders.json');
const withdrawalsFile = path.join(dataDir, 'withdrawals.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
[usersFile, gigsFile, ordersFile, withdrawalsFile].forEach(f => {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '[]');
});

function read(file) { try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return []; } }
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

const basestyle = `direction: rtl; font-family: 'Tahoma', 'Verdana', sans-serif; text-align: right;`;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.url === '/') {
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;text-align:center;padding:50px"><h1>💼 جاب‌برد</h1><p>بازار کار فریلنسری ایران</p><p><a href="/signup" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">ثبت‌نام</a> <a href="/login" style="color:white;background:white;color:#667eea;padding:10px 20px;text-decoration:none;border-radius:5px;margin:10px">ورود</a></p></body></html>`);
  }

  else if (req.url === '/signup') {
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:300px"><h1 style="color:#667eea">ثبت‌نام</h1><form method="POST" action="/api/signup"><input type="text" name="username" placeholder="نام کاربری" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="email" name="email" placeholder="ایمیل" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="password" name="password" placeholder="رمز عبور" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><select name="role" required style="width:100%;padding:10px;margin:10px 0"><option>فریلنسر</option><option>کارفرما</option></select><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer">ثبت‌نام</button></form></div></body></html>`);
  }

  else if (req.url === '/login') {
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:300px"><h1 style="color:#667eea">ورود</h1><form method="POST" action="/api/login"><input type="email" name="email" placeholder="ایمیل" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="password" name="password" placeholder="رمز عبور" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer">ورود</button></form></div></body></html>`);
  }

  else if (req.url === '/dashboard') {
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#f5f5f5;font-family:Tahoma;padding:20px"><div style="background:white;padding:20px;border-radius:10px;margin-bottom:20px"><h1 style="color:#667eea">داشبورد</h1><p>خوش آمدید، ${user}!</p></div><div style="background:white;padding:20px;border-radius:10px"><h3>منو</h3><p><a href="/browse-gigs" style="color:#667eea">مرور پروژه‌ها</a></p><p><a href="/create-gig" style="color:#667eea">ایجاد پروژه جدید</a></p><p><a href="/orders" style="color:#667eea">سفارش‌های من</a></p><p><a href="/wallet" style="color:#667eea">💰 کیف پول</a></p><p><a href="/zibal-settings" style="color:#667eea">⚙️ تنظیمات زیبال</a></p><p><a href="/logout" style="color:red">خروج</a></p></div></body></html>`);
  }

  else if (req.url === '/wallet') {
    const orders = read(ordersFile);
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
    
    let earnings = 0;
    orders.forEach(o => {
      if (o.freelancer === user && o.status === 'completed') {
        earnings += o.price * 0.8;
      }
    });

    const withdrawals = read(withdrawalsFile);
    const userWithdrawals = withdrawals.filter(w => w.freelancer === user);
    let withdrawn = 0;
    userWithdrawals.forEach(w => withdrawn += w.amount);
    
    const balance = earnings - withdrawn;
    
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#f5f5f5;font-family:Tahoma;padding:20px"><div style="background:white;padding:30px;border-radius:10px;text-align:center"><h1 style="color:#667eea">💰 کیف پول من</h1><h2 style="font-size:48px;color:#667eea">${Math.floor(balance * 10000).toLocaleString('fa-IR')} تومان</h2><p>موجودی کل</p><hr><p>درآمد کل: ${Math.floor(earnings * 10000).toLocaleString('fa-IR')} تومان</p><p>برداشت شده: ${Math.floor(withdrawn * 10000).toLocaleString('fa-IR')} تومان</p><hr><button onclick="location.href='/withdraw'" style="background:#667eea;color:white;padding:10px 30px;border:none;border-radius:5px;cursor:pointer;font-size:16px;margin:20px 0">برداشت به زیبال</button><p><a href="/dashboard" style="color:#667eea">بازگشت</a></p></div></body></html>`);
  }

  else if (req.url === '/zibal-settings') {
    const users = read(usersFile);
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
    const currentUser = users.find(u => u.username === user);
    
    const zibalInfo = currentUser && currentUser.zibalInfo ? currentUser.zibalInfo : {};
    
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:400px"><h1 style="color:#667eea">⚙️ تنظیمات زیبال</h1><p>اطلاعات حساب زیبال خود را وارد کنید</p><form method="POST" action="/api/zibal-settings"><input type="text" name="zibal_name" placeholder="نام کامل (روی حساب زیبال)" value="${zibalInfo.name || ''}" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="email" name="zibal_email" placeholder="ایمیل زیبال" value="${zibalInfo.email || ''}" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><input type="text" name="zibal_phone" placeholder="شماره تلفن" value="${zibalInfo.phone || ''}" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold">ذخیره</button></form><p><a href="/dashboard" style="color:#667eea">بازگشت</a></p></div></body></html>`);
  }

  else if (req.url === '/withdraw') {
    const orders = read(ordersFile);
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
    const users = read(usersFile);
    const currentUser = users.find(u => u.username === user);
    
    if (!currentUser || !currentUser.zibalInfo) {
      res.writeHead(200);
      res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:red;color:white;text-align:center;padding:50px"><h1>خطا!</h1><p>ابتدا اطلاعات زیبال خود را تنظیم کنید!</p><p><a href="/zibal-settings" style="color:white">رفتن به تنظیمات</a></p></body></html>`);
      return;
    }
    
    let earnings = 0;
    orders.forEach(o => {
      if (o.freelancer === user && o.status === 'completed') {
        earnings += o.price * 0.8;
      }
    });

    const withdrawals = read(withdrawalsFile);
    const userWithdrawals = withdrawals.filter(w => w.freelancer === user);
    let withdrawn = 0;
    userWithdrawals.forEach(w => withdrawn += w.amount);
    
    const balance = earnings - withdrawn;
    
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:400px"><h1 style="color:#667eea">برداشت به زیبال</h1><p>موجودی دسترس: <strong>${Math.floor(balance * 10000).toLocaleString('fa-IR')} تومان</strong></p><form method="POST" action="/api/withdraw"><input type="number" name="amount" placeholder="مبلغ (تومان)" min="1000" max="${Math.floor(balance * 10000)}" step="1000" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><p style="color:red;font-size:12px">کمینه: 1,000 تومان | بیشینه: ${Math.floor(balance * 10000).toLocaleString('fa-IR')} تومان</p><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold">برداشت</button></form><p><a href="/wallet" style="color:#667eea">بازگشت</a></p></div></body></html>`);
  }

  else if (req.url === '/browse-gigs') {
    const gigs = read(gigsFile);
    let html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#f5f5f5;font-family:Tahoma;padding:20px"><h1 style="color:#667eea">پروژه‌های موجود</h1>`;
    if (gigs.length === 0) html += `<p>هیچ پروژه‌ای موجود نیست</p>`;
    gigs.forEach(g => {
      html += `<div style="background:white;padding:20px;margin:10px 0;border-radius:10px"><h3>${g.title}</h3><p>${g.description}</p><p style="font-weight:bold">قیمت: ${Math.floor(g.price * 10000).toLocaleString('fa-IR')} تومان</p><p>توسط: ${g.freelancer}</p><form method="POST" action="/api/order" style="display:inline"><input type="hidden" name="gigId" value="${g.id}"><button style="background:#667eea;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer">سفارش دادن</button></form></div>`;
    });
    html += `<p><a href="/dashboard" style="color:#667eea">بازگشت</a></p></body></html>`;
    res.writeHead(200);
    res.end(html);
  }

  else if (req.url === '/create-gig') {
    res.writeHead(200);
    res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#667eea;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="background:white;color:#333;padding:40px;border-radius:10px;width:400px"><h1 style="color:#667eea">ایجاد پروژه</h1><form method="POST" action="/api/create-gig"><input type="text" name="title" placeholder="عنوان پروژه" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><textarea name="description" placeholder="توضیحات" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"></textarea><input type="number" name="price" placeholder="قیمت (تومان)" required style="width:100%;padding:10px;margin:10px 0;border:1px solid #ddd"><button style="width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer">ایجاد پروژه</button></form><p><a href="/dashboard" style="color:#667eea">بازگشت</a></p></div></body></html>`);
  }

  else if (req.url === '/orders') {
    const orders = read(ordersFile);
    const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
    const myOrders = orders.filter(o => o.freelancer === user || o.employer === user);
    let html = `<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:#f5f5f5;font-family:Tahoma;padding:20px"><h1 style="color:#667eea">سفارش‌های من</h1>`;
    if (myOrders.length === 0) html += `<p>سفارشی موجود نیست</p>`;
    myOrders.forEach(o => {
      let status = o.status === 'completed' ? '✅ تکمیل شده' : o.status === 'active' ? '⏳ در حال انجام' : 'نامعلوم';
      html += `<div style="background:white;padding:20px;margin:10px 0;border-radius:10px"><h3>${o.gigTitle}</h3><p>قیمت: ${Math.floor(o.price * 10000).toLocaleString('fa-IR')} تومان</p><p>فریلنسر: ${o.freelancer} | کارفرما: ${o.employer}</p><p>وضعیت: ${status}</p>`;
      if (o.freelancer === user && o.status === 'active') {
        html += `<form method="POST" action="/api/complete-order" style="display:inline"><input type="hidden" name="orderId" value="${o.id}"><button style="background:green;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer">تکمیل</button></form>`;
      }
      html += `</div>`;
    });
    html += `<p><a href="/dashboard" style="color:#667eea">بازگشت</a></p></body></html>`;
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
        res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="color:red;text-align:center;padding:50px"><h1>خطا!</h1><p>این ایمیل قبلاً ثبت شده است!</p><p><a href="/login">ورود</a></p></body></html>`);
      } else {
        users.push({ username: params.get('username'), email: params.get('email'), password: params.get('password'), role: params.get('role') });
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
        res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="color:red;text-align:center;padding:50px"><h1>ایمیل یا رمز عبور غلط است!</h1><p><a href="/login">بازگشت</a></p></body></html>`);
      } else {
        res.writeHead(302, { 'Location': '/dashboard', 'Set-Cookie': `user=${user.username}` });
        res.end();
      }
    });
  }

  else if (req.url === '/api/zibal-settings' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const users = read(usersFile);
      const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
      const userObj = users.find(u => u.username === user);
      if (userObj) {
        userObj.zibalInfo = {
          name: params.get('zibal_name'),
          email: params.get('zibal_email'),
          phone: params.get('zibal_phone')
        };
        write(usersFile, users);
      }
      res.writeHead(302, { 'Location': '/dashboard' });
      res.end();
    });
  }

  else if (req.url === '/api/withdraw' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const amount = parseFloat(params.get('amount'));
      const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'کاربر';
      
      const withdrawals = read(withdrawalsFile);
      withdrawals.push({
        id: Date.now(),
        freelancer: user,
        amount: amount / 10000,
        status: 'pending',
        date: new Date().toISOString(),
        note: 'برداشت به زیبال (در حال بررسی)'
      });
      write(withdrawalsFile, withdrawals);
      
      res.writeHead(200);
      res.end(`<html><head><meta charset="utf-8"><style>body { direction: rtl; font-family: Tahoma; }</style></head><body style="background:green;color:white;text-align:center;padding:50px"><h1>موفق!</h1><p>درخواست برداشت ${amount.toLocaleString('fa-IR')} تومان ثبت شد!</p><p>وضعیت: در حال بررسی (معمولاً 1-3 روز کاری)</p><p><a href="/wallet" style="color:white">بازگشت به کیف پول</a></p></body></html>`);
    });
  }

  else if (req.url === '/api/create-gig' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const gigs = read(gigsFile);
      const user = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'نامشخص';
      gigs.push({ id: Date.now(), title: params.get('title'), description: params.get('description'), price: parseFloat(params.get('price')) / 10000, freelancer: user });
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
        const employer = req.headers.cookie ? decodeURIComponent(req.headers.cookie.split('user=')[1]) : 'نامشخص';
        orders.push({ id: Date.now(), gigId: gig.id, gigTitle: gig.title, price: gig.price, freelancer: gig.freelancer, employer: employer, status: 'active' });
        write(ordersFile, orders);
      }
      res.writeHead(302, { 'Location': '/browse-gigs' });
      res.end();
    });
  }

  else if (req.url === '/api/complete-order' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const orders = read(ordersFile);
      const order = orders.find(o => o.id == params.get('orderId'));
      if (order) {
        order.status = 'completed';
        write(ordersFile, orders);
      }
      res.writeHead(302, { 'Location': '/orders' });
      res.end();
    });
  }

  else if (req.url === '/logout') {
    res.writeHead(302, { 'Location': '/', 'Set-Cookie': 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC;' });
    res.end();
  }

  else {
    res.writeHead(404);
    res.end('صفحه پیدا نشد');
  }
});

server.listen(PORT, '0.0.0.0');
console.log(`🚀 JobBoard فارسی درحال اجرا است روی پورت ${PORT}`);
