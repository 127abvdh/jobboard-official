const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JobBoard</title>
<style>
body {
  margin: 0;
  padding: 20px;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.container {
  text-align: center;
  max-width: 500px;
}
h1 {
  font-size: 48px;
  margin: 0 0 20px 0;
}
p {
  font-size: 18px;
  margin: 0 0 30px 0;
}
.status {
  background: rgba(255,255,255,0.2);
  padding: 15px;
  border-radius: 5px;
  font-weight: bold;
  margin-bottom: 20px;
}
.status.ok {
  background: rgba(0,255,0,0.2);
  color: #90EE90;
}
</style>
</head>
<body>
<div class="container">
  <h1>💼 JobBoard</h1>
  <p>Freelance Marketplace</p>
  <div class="status ok">✅ Server is Running</div>
  <p>Platform Ready</p>
</div>
</body>
</html>`;
    
    res.end(html);
  } catch (error) {
    res.writeHead(500);
    res.end('Error');
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
