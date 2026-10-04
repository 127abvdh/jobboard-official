
const http = require('http');
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>JobBoard</title>
<style>
body { margin:0; padding:20px; font-family:Arial; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; min-height:100vh; }
.nav { background:rgba(0,0,0,0.3); padding:20px; text-align:center; border-radius:10px; margin-bottom:30px; }
.nav h1 { margin:0; font-size:40px; }
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
<div class="nav"><h1>💼 JobBoard</h1></div>
<div class="hero">
<h2>Freelance Marketplace</h2>
<p>Connect with freelancers. Get work done. Earn money.</p>
<div class="buttons">
<button>Sign Up</button>
<button>Login</button>
</div>
</div>
<div class="features">
<div class="feature"><h3>👤 Freelancers</h3><p>Find jobs and earn</p></div>
<div class="feature"><h3>🏢 Clients</h3><p>Find talented workers</p></div>
<div class="feature"><h3>💰 Payments</h3><p>Secure and instant</p></div>
</div>
</body>
</html>
  `);
}).listen(PORT, '0.0.0.0');
