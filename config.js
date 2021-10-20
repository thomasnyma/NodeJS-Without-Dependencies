/*
 * Configuration variables
 *
 */

// Container for all the environments
const environments = {};

// Staging environment (default)
environments.staging = {
    'port' : 3000,
    'envName' : 'staging'
};

// Production environment
environments.production = {
    'port' : 5000,
    'envName' : 'production'
};

// Determine which environment was passed as a CLI argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if current environment exists, if not default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;