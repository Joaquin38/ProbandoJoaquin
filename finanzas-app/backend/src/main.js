const http = require('http');

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.url === '/salud') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, servicio: 'finanzas-backend', version: '0.1.0' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ mensaje: 'Backend inicial en construcción' }));
});

server.listen(port, () => {
  console.log(`finanzas-backend escuchando en http://localhost:${port}`);
});
