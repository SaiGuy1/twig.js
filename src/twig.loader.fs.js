module.exports = function(Twig) {
    'use strict';

    var fs, path;

    try {
    	// require lib dependencies at runtime
    	fs = require('fs');
    	path = require('path');
    } catch (e) {
    	// NOTE: this is in a try/catch to avoid errors cross platform
    }

    Twig.Templates.registerLoader('fs', function(location, params, callback, error_callback) {
        var template,
            data = null,
            precompiled = params.precompiled,
            parser = this.parsers[params.parser] || this.parser.twig;

        if (!fs || !path) {
            throw new Twig.Error('Unsupported platform: Unable to load from file ' +
                                 'because there is no "fs" or "path" implementation');
        }

        var loadTemplateFn = function(err, data) {
            if (err) {
                if (typeof error_callback === 'function') {
                    error_callback(err);
                }
                return;
            }

            if (precompiled === true) {
                data = JSON.parse(data);
            }

            params.data = data;
            params.path = params.path || location;

            // template is in data
            template = parser.call(this, params);

            if (typeof callback === 'function') {
                callback(template);
            }
        };
        params.path = params.path || location;

        if (Array.isArray(params.path)) {
            for (var i = 0; i < params.path.length; i++) {
                try {
                    if (fs.statSync(params.path[i]).isFile()) {
                        data = fs.readFileSync(params.path[i], 'utf8');
                        loadTemplateFn(undefined, data);
                        return template
                    }
                } catch (e) {}
            }
            throw new Twig.Error('Unable to find template file ' + params.path);
        } else if (params.async) {
            fs.stat(params.path, function (err, stats) {
                if (err || !stats.isFile()) {
                    throw new Twig.Error('Unable to find template file ' + params.path);
                }
                fs.readFile(params.path, 'utf8', loadTemplateFn);
            });
            // TODO: return deferred promise
            return true;
        } else {
            try {
                if (!fs.statSync(params.path).isFile()) {
                    throw new Twig.Error('Unable to find template file ' + params.path);
                }
            } catch (err) {
                throw new Twig.Error('Unable to find template file ' + params.path);
            }
            data = fs.readFileSync(params.path, 'utf8');
            loadTemplateFn(undefined, data);
            return template
        }
    });

};
