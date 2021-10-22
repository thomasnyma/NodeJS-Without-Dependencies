/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = (string) => {
    if (typeof(string) == 'string' && string.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hash;
    } else return false;
};

// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = (string) => {
    try {
        const object = JSON.parse(string);
        return object;
    } catch (e) {
        return {};
    }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (stringLength) => {
    stringLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength : false;
    if (stringLength) {
        // Define all possible characters
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        let string = '';
        for (let i = 1; i <= stringLength; i++) {
            // Get a random character from the possible characters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            string += randomCharacter;      
        }

        // Return the final string
        return string;
    } else return false;
};

// Export the module
module.exports = helpers;