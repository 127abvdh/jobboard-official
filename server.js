const http = require('http');

const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<h1>JobBoard</h1>');
  res.write('<p>Platform Online</p>');
  res.end();
}).listen(PORT, '0.0.0.0');
