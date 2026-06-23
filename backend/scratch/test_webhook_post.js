const http = require('http');

const data = JSON.stringify({
  events: [
    {
      type: 'message',
      replyToken: 'nH743juhObXa1ba83ihG',
      message: {
        type: 'text',
        text: 'ราคา'
      },
      source: {
        userId: 'U76969e7df9c6b1bb388f820a70e0581a',
        type: 'user'
      }
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/webhook/line',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
