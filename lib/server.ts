const http = require('http')
const httpProxy = require('http-proxy')
//
// Create your proxy server and set the target in the options.
//
const proxy = httpProxy.createProxyServer({})

//
// Create your target server
//
http.createServer(function (req, res) {
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  // res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, null, 2));
  // res.end();
  proxy.web(req, res, { target: 'http://yapi.sankuai.com', changeOrigin: true });
}).listen(9000);
