const http = require('http');

// Create server
const server = http.createServer((req, res) => {
    res.end('Hello World');
});

// Initiate server for requests
server.listen(3000, '127.0.0.1', () => {
    console.log('Server is running on port 3000');
});
