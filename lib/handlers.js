/*
 * Request handlers
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define the handlers
const handlers = {};

// Users handler
handlers.users = (data, callback) => {
    const acceptedMethods = ['post', 'get', 'put', 'delete'];
    if (acceptedMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else callback(405);
};

// Container for submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
    // Check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if (err) {
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the uaser object
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true,
                    }

                    // Store the user
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) callback(200);
                        else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create the user'});
                        }
                    });
                } else callback(500, {'Error': 'Could not hash the user\'s password'});
            } else callback(400, {'Error': 'A user with that phone number already exists'});
        });
    } else callback(400, {'Error': 'Missing required fields'});
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let authenticated users access their own object
handlers._users.get = (data, callback) => {
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove the hashed password
                delete data.hashedPassword;
                callback(200, data);
            } else callback(404);
        });
    } else callback(400, {'Error': 'Missing required field'});
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password, tosAgreement (at least one of these must be specified)
// @TODO Only let authenticated users access their own object
handlers._users.put = (data, callback) => {
    // Check for the required field
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone number is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            // Lookup the user
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    // Update the fields necessary
                    if (firstName) userData.firstName = firstName;
                    if (lastName) userData.lastName = lastName;
                    if (password) userData.hashedPassword = helpers.hash(password);
                } else callback(400, {'Error': 'The specified user doesn\'t exist'});

                // Store the new updates
                _data.update('users', phone, userData, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        console.log(err);
                        callback(500, {'Error': 'Could not update the user'});
                    }
                })
            });
        } else callback(400, {'Error': 'Missing fields to update'});
    } else callback(400, {'Error': 'Missing required fields'});
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Only let authenticated users access their own object
// @TODO Cleanup (delete) any related data
handlers._users.delete = (data, callback) => {
    // Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                _data.delete('users', phone, (err) => {
                    if (!err) callback(200);
                    else callback(500, {'Error': 'Could not delete the specified user'});
                });
            } else callback(404);
        });
    } else callback(400, {'Error': 'Missing required field'});
};

// Tokens handler
handlers.tokens = (data, callback) => {
    const acceptedMethods = ['post', 'get', 'put', 'delete'];
    if (acceptedMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else callback(405);
};

// Container for submethods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        // Lookup the user who matches the phone number
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                // Hash the password and compare it to the stored password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // Create a new token with a random name and set expiration date 1 our in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone': phone,
                        'tokenId': tokenId,
                        'expires': expires,
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) callback(200, tokenObject);
                        else callback(500, {'Error': 'Could not create the new token'});
                    });
                } else callback(400, {'Error': 'Password did not match the user\'s stored password'});
            } else callback(400, {'Error': 'Could not find the specified user'});
        });
    } else callback(400, {'Error': 'Missing required fields'});
};

// Tokens - get
handlers._tokens.get = (data, callback) => {
    
};

// Tokens - put
handlers._tokens.put = (data, callback) => {
    
};

// Tokens - delete
handlers._tokens.delete = (data, callback) => {
    
};

// Ping handler
handlers.ping = (data, callback) => {
    // Callback a HTTP status code
    callback(200);
};

// Not fouhnd handler
handlers.notFound = (data, callback) => {
    // Callback a HTTP status code
    callback(404);
};

// Export the module
module.exports = handlers;