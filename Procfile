const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>JobBoard</title>
      <style>
        body { 
          font-family: Arial; 
          background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); 
          color: white; 
          text-align: center; 
          padding: 50px; 
          min-height: 100vh;
        }
        h1 { font-size: 48px; margin-bottom: 20px; }
        p { font-size: 18px; margin-bottom: 30px; }
        a { 
          color: white; 
          background: rgba(0,0,0,0.3); 
          padding: 12px 25px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 10px; 
          display: inline-block;
        }
        a:hover { background: rgba(0,0,0,0.5); }
      </style>
    </head>
    <body>
      <h1>💼 JobBoard</h1>
      <p>Freelance Marketplace - Coming Soon</p>
      <a href="/signup">Sign Up</a>
      <a href="/login">Login</a>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
