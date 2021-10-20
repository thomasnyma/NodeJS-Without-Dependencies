/*
 * Primary file for the API
 *
 */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

// The server should respond to all requests with a string
const server = http.createServer((req, res) => {

    // Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Choose which handler to use
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        const data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        };

        // Route the request to the specified handler
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler or default to an empty string
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log('Returning this response: ', statusCode, payloadString);
            // console.log(`Request received on path: ${trimmedPath}`);
            // console.log(`Request received with method: ${method}`);
            // console.log('Request received with these query string parameters: ', queryStringObject);
            // console.log('Request received with these headers: ', headers);
            // console.log('Request received with this payload: ', buffer);
        });
    });
});

// Start the server and have it listen to port 3000
server.listen(config.port, () => {
    console.log(`The server is listening on port ${config.port} in ${config.envName} mode`);
});

// Define the handlers
const handlers = {};

// Sample handler
handlers.sample = (data, callback) => {
    // Callback a HTTP status code and a payload object
    callback(406, {'name' : 'sample handler'});
};

// Not fouhnd handler
handlers.notFound = (data, callback) => {
    // Callback a HTTP status code
    callback(404);
};

// Define a request router
const router = {
    'sample' : handlers.sample
};