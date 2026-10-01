const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  try {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.write('<!DOCTYPE html>');
    res.write('<html><head><title>JobBoard</title>');
    res.write('<style>body{font-family:Arial;background:#667eea;color:white;text-align:center;padding:50px;margin:0}h1{font-size:48px}a{background:#333;color:white;padding:10px 20px;text-decoration:none;margin:10px;border-radius:5px;display:inline-block}</style>');
    res.write('</head><body>');
    res.write('<h1>💼 JobBoard</h1>');
    res.write('<p>Freelance Marketplace</p>');
    res.write('<a href="#">Sign Up</a> <a href="#">Login</a>');
    res.write('</body></html>');
    res.end();
  } catch (e) {
    console.error(e);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log('OK');
});
