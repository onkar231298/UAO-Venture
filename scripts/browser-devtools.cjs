const http = require('node:http');

// Discover Chromium over a raw loopback request. Some workspace fetch wrappers
// route arbitrary localhost ports to an app preview instead of the debug server.
exports.getDevToolsPages = (port) => new Promise((resolve, reject) => {
  const request = http.get({ hostname: '127.0.0.1', port: Number(port), path: '/json/list' }, response => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { body += chunk; });
    response.on('end', () => {
      try {
        if (response.statusCode !== 200) throw new Error(`DevTools discovery returned ${response.statusCode}`);
        resolve(JSON.parse(body));
      } catch (error) { reject(error); }
    });
  });
  request.setTimeout(10000, () => request.destroy(new Error('DevTools discovery timed out')));
  request.on('error', reject);
});
