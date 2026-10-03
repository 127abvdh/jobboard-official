const http = require('http');
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JobBoard</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; }
.navbar { background: rgba(0,0,0,0.3); padding: 20px; text-align: center; }
.navbar h1 { font-size: 32px; }
.container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
.hero { text-align: center; padding: 60px 20px; }
.hero h1 { font-size: 48px; margin-bottom: 20px; }
.hero p { font-size: 18px; margin-bottom: 30px; }
.buttons { display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; }
.btn { padding: 15px 40px; background: white; color: #667eea; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; text-decoration: none; font-size: 16px; }
.btn:hover { background: #f0f0f0; }
.btn-secondary { background: rgba(255,255,255,0.2); color: white; }
.btn-secondary:hover { background: rgba(255,255,255,0.3); }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 40px; }
.feature { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center; }
.feature h3 { margin-bottom: 10px; }
</style>
</head>
<body>
<div class="navbar">
  <h1>💼 JobBoard</h1>
</div>
<div class="container">
  <div class="hero">
    <h1>Freelance Marketplace</h1>
    <p>Connect with freelancers or find work. Earn money.</p>
    <div class="buttons">
      <button class="btn" onclick="showSignup()">Sign Up</button>
      <button class="btn btn-secondary" onclick="showLogin()">Login</button>
    </div>
  </div>
  <div class="features">
    <div class="feature">
      <h3>👤 For Freelancers</h3>
      <p>Find jobs and earn money by doing work</p>
    </div>
    <div class="feature">
      <h3>🏢 For Clients</h3>
      <p>Post jobs and find talented freelancers</p>
    </div>
    <div class="feature">
      <h3>💰 Get Paid</h3>
      <p>Secure payments and instant withdrawals</p>
    </div>
  </div>
</div>
<script>
function showSignup() {
  alert('Sign Up coming soon!');
}
function showLogin() {
  alert('Login coming soon!');
}
</script>
</body>
</html>`;
  
  res.end(html);
}).listen(PORT, '0.0.0.0');
