var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.lib) { LPCLV.lib = {}; }
if (!LPCLV.lib.vars) { LPCLV.lib.vars = {}; }

LPCLV.lib.vars.swatches = {
    "dark" : {
        "keyword" : "black",
        "hex" : "#000"
    },
    "light" : {
        "keyword" : "white",
        "hex" : "#fff"
    },
    devgreen: {
        hex: 'd1e1d7'
    }
};

LPCLV.lib.vars.colors = {
    'default': {
        'background': LPCLV.lib.vars.swatches.light,
        'text': LPCLV.lib.vars.swatches.dark
    },
    'defaultInverse': {
        'background': LPCLV.lib.vars.swatches.dark,
        'text': LPCLV.lib.vars.swatches.light,
    },
    header: {
        background: LPCLV.lib.vars.swatches.devgreen,
        text: LPCLV.lib.vars.swatches.dark
    },
    ready: {
        background: {
            keyword: "seagreen",
            hex: "#2e8b57"
        },
        text: LPCLV.lib.vars.swatches.light
    },
    "pending" : {
        "background" : {
            "keyword" : "lemonchiffon",
            "hex" : "#2e8b57"
        },
        "text" : LPCLV.lib.vars.swatches.dark
    },
    "attention" : {
        "background" : {
            "keyword" : "red",
            "hex" : "#2e8b57"
        },
        "text" : LPCLV.lib.vars.swatches.light
    },
    "initialize" : {
        "background" : {
            "keyword" : "blue",
            "hex" : "#2e8b57"
        },
        "text" : LPCLV.lib.vars.swatches.light
    }
};

LPCLV.lib.functions = {
    'get': {
        'config': function (domain, key) {
            var data = {
                'inspect': {}
            };

            // CLV Domains and their NetSuite ID are predefined here
            // TODO: May consider running a Custom List Record search to reflect CLV Domains and determine ID
            // This CLV Domain search should only run if domain is a string
            var domains = {
                'SENTRY': 2,
                'MANDRILL': 3,
                'LP_FLOW': 1
            };

            var filters = [];

            var rs = LPCLV.services.RunScope();
            rs.run('https://api.runscope.com/radar/332163a7-5192-4b7b-977d-0b030348fcd6/trigger');

            // inspect the vaule of the domain variable in order to set a filter
            if (domain) {
                if (isNumeric(domain)) {  // if the domain is numeric we assume the ID has been passed
                    filters.push(new nlobjSearchFilter('custrecord_clv_1557544531_1557545508', null, 'is', domain));
                } else if (typeof domain === 'string') {  // if the domain is a string we have to find the ID
                    if (domains.hasOwnProperty(domain.toUpperCase())) {
                        filters.push(new nlobjSearchFilter('custrecord_clv_1557544531_1557545508', null, 'is', domains[domain.toUpperCase()]));
                    } else {
                        // throw an error that the Domain does not exist and log to NetSuite
                        // also log to some type of file that can report them to Central logger if possible to read Script Debug Logs
                    }
                }
            }

            if (key) {
                if (typeof key === 'string') {
                    filters.push(new nlobjSearchFilter('custrecord_clv_1557544531_1557545508', null, 'is', key))
                } else {
                    // throw an error that the Key must be a string data type
                }
            }

            data.inspect.filters = JSON.stringify(filters);

            var s = nlapiLoadSearch(null, 'customsearch_clv_1557546719');
            s.setFilters(filters);

            var configs = s.runSearch();
            var results = configs.getResults(0,1);

            var config = {
                'domain': results[0].getText(new nlobjSearchColumn('custrecord_clv_1557544531_1557545508')),
                'key': results[0].getValue(new nlobjSearchColumn('custrecord_clv_1557544531_1557545262')),
                'value': results[0].getValue(new nlobjSearchColumn('custrecord_clv_1557544531_1557545369')),
                'type': results[0].getText(new nlobjSearchColumn('custrecord_clv_1557544531_1557545861'))
            };

            data.inspect.search = {
                'result': config
            };

            rs.submit.inspect('https://api.runscope.com/radar/inbound/660922b4-bce9-4588-b3a1-c33734a77062', data);

            return config;
        },
        'domain': function () {
            var env = nlapiGetContext().getEnvironment();
            var domain = null;

            if (env == 'SANDBOX') {
                domain = 'https://lpflow.ngrok.io';
            } else if (env == 'PRODUCTION') {
                domain = 'https://lpflow.leprechaunpromotions.com';
            }

            return domain;
        },
        'note_type_id': function (type) {

            var id = null;

            var _search = {
                'columns': [
                    new nlobjSearchColumn('internalid'),
                    new nlobjSearchColumn('externalid'),
                    new nlobjSearchColumn('name'),
                    new nlobjSearchColumn('description'),
                ]
            };

            var t = nlapiSearchRecord('notetype', null, null, _search.columns);

            if (t) {
                t.forEach( function (_t) {
                    var _type = _t.getValue('name');

                    if (_type.toUpperCase() === type.toUpperCase()) {
                        id = _t.getValue('internalid');
                    }
                });
            }

            return id;
        },
        'username' : function (id) {
            var user = null;

            user = nlapiLoadRecord('employee', id);
            nlapiLogExecution('DEBUG', 'User ID', user.getFieldValue('entityid'));

            return user.getFieldValue('entityid');
        },
        color: {
            text: function (type, format) {
                return this._get('text', type, format);
            },
            background: function (type, format) {
                return this._get('background', type, format);
            },
            _get: function (layer, type, format) {
                var color = null;

                if (type == null) {
                    type = 'defaultInverse';
                }

                if (format == null) {
                    format = 'keyword';
                }

                if (LPCLV.lib.vars.colors.hasOwnProperty(type)) {

                    color = LPCLV.lib.vars.colors[type][layer];

                    if (color) {
                        if (typeof color === 'string') {
                            return color;
                        } else if (typeof color === 'object') {

                            if (format === 'keyword' && color.hasOwnProperty('keyword')) {

                                return color.keyword;

                            } else if (format === 'hex' && color.hasOwnProperty('hex')) {

                                if (color.hex.substring(0, 1) !== '#') {
                                    return '#' + color.hex;
                                } else {
                                    return color.hex;
                                }

                            } else if (!color.hasOwnProperty('keyword') && color.hasOwnProperty('hex')) {

                                if (color.hex.substring(0, 1) !== '#') {
                                    return '#' + color.hex;
                                } else {
                                    return color.hex;
                                }

                            } else {
                                color = null
                            }
                        } else {
                            color = null
                        }
                    }
                }

                if (!color) {
                    return LPCLV.lib.vars.colors.default[layer];
                }
            },
        },
        colors: function (type, format) {
            if (type == null) {
                type = 'defaultInverse';
            }

            if (format == null) {
                format = 'keyword';
            }

            return {
                background: LPCLV.lib.functions.get.color.background(type, format),
                text: LPCLV.lib.functions.get.color.text(type, format)
            };
        }
    }
};

function isNumeric (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}