var url = require('url'),
    path = require('path');

var cgi = require("cgi");

var configDefaults;

var perlConfigPath = __dirname + '/node-gitweb/gitweb_config.perl',
    gitwebCgiPath = __dirname + '/node-gitweb/gitweb.cgi';

module.exports = function (config) {
    config = config || {};
    config.__proto__ = configDefaults;

    // The Environment configuration for the 'gitweb' CGI spawn
    var env = {
        // The Config File just reads all of it's configuration
        // from environment variables that are set below
        GITWEB_CONFIG_SYSTEM: perlConfigPath
    };

    // Extend the 'env' with the user-defined config properties.
    for (var prop in config) {
        env['NODE_GITWEB_'+prop.toUpperCase()] = config[prop];
    }

    return function (req, res, next) {
        try {
            require('cgi')(gitwebCgiPath, {
                mountPoint: req.url,
                env: env,
                stderr: process.stderr
            })(req, res, next);
        } catch (e) {
            console.log("cgi fata", e.toString());
        }
    };
};

// The default 'config' options to use.
configDefaults = {
    projectroot: process.env.HOME,
    get homelink() {
        return this.projectroot;
    },
    sitename: "GitWeb powered by Node",
    version: "1.7.9",
    max_depth: "100",

    pathinfo: 1,

    avatar_default: 'gravatar',
    avatar_override: 0
};
