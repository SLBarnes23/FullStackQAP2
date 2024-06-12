const http = require('http');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Define/extend an EventEmitter class
class MyEmitter extends EventEmitter {};
// Initialize a new emitter object
const myEmitter = new MyEmitter();

// Function to get formatted current date
const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Function to write logs to a daily file
const writeLogToFile = (message) => {
    const logDirectory = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory);
    }
    const logFile = path.join(logDirectory, `${getCurrentDate()}.log`);
    fs.appendFile(logFile, `${message}\n`, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
};

// Function to log messages to console and file
const logEvent = (message) => {
    console.log(message);
    writeLogToFile(message);
};

// Function to serve HTML files with menu
const serveFileWithMenu = (res, filePath) => {
    fs.readFile(path.join(__dirname, 'views', 'menu.html'), 'utf8', (menuErr, menuData) => {
        if (menuErr) {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('<h1>500 Server Error</h1><p>Could not read menu file</p>');
            logEvent('Error reading menu file');
            return;
        }

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                myEmitter.emit('fileError', filePath);
                res.writeHead(500, {'Content-Type': 'text/html'});
                res.end('<h1>500 Server Error</h1><p>Could not read file</p>');
            } else {
                myEmitter.emit('fileRead', filePath);
                const contentWithMenu = data.replace('<!--MENU-->', menuData);
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(contentWithMenu);
            }
        });
    });
};

// Create server
const server = http.createServer((req, res) => {
    const url = req.url; // Get the requested URL
    logEvent(`Received request for: ${url}`);

    if (url === '/styles.css') {
        fs.readFile(path.join(__dirname, 'views', 'styles.css'), (err, data) => {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/css'});
                res.end('/* Could not read CSS file */');
            } else {
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.end(data);
            }
        });
        return;
    }

    switch(url) {
        case '/about':
            myEmitter.emit('routeAccess', 'About');
            serveFileWithMenu(res, path.join(__dirname, 'views', 'about.html'));
            break;
        case '/contact':
            myEmitter.emit('routeAccess', 'Contact');
            serveFileWithMenu(res, path.join(__dirname, 'views', 'contact.html'));
            break;
        case '/products':
            myEmitter.emit('routeAccess', 'Products');
            serveFileWithMenu(res, path.join(__dirname, 'views', 'products.html'));
            break;
        case '/subscribe':
            myEmitter.emit('routeAccess', 'Subscribe');
            serveFileWithMenu(res, path.join(__dirname, 'views', 'subscribe.html'));
            break;
        case '/':
            serveFileWithMenu(res, path.join(__dirname, 'views', 'index.html'));
            break;
        case '/favicon.ico':
            res.writeHead(204, {'Content-Type': 'image/x-icon'});
            res.end();
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('<h1>404 Not Found</h1><p>Page not found</p>');
            myEmitter.emit('statusCode', 404);
    }
});

// Log HTTP status codes
myEmitter.on('statusCode', (code) => {
    logEvent(`HTTP Status Code: ${code}`);
});

// Log access to specific routes
myEmitter.on('routeAccess', (route) => {
    logEvent(`Accessed route: ${route}`);
});

// Log successful file reads
myEmitter.on('fileRead', (filePath) => {
    logEvent(`Successfully read file: ${filePath}`);
});

// Log file read errors
myEmitter.on('fileError', (filePath) => {
    logEvent(`Error reading file: ${filePath}`);
});

// Initiate server for requests
server.listen(5000, '127.0.0.1', () => {
    logEvent('Server is running on port 5000');
});
