var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.services) { LPCLV.services = {}; }

LPCLV.services.RunScope = function () {
    return new Runscope;
};

LPCLV.services.RunScope2 = function (settings) {
    return Runscope2.new(settings);
};

var Runscope2 = {
    'settings': {
        'env': nlapiGetContext().getEnvironment(),
        'event': null
    },
    'new': function (settings) {
        var rs = Object.create(this);

        if (settings.hasOwnProperty('event')) {
            rs.settings.event = settings.event;
        }

        return rs;
    },
    'trigger': function (url, allow_production) {
        if (url && (this.settings.env == 'SANDBOX' || (this.settings.env == 'PRODUCTION' && allow_production))) {
            var trigger = nlapiRequestURL(
                url,
                null,
                {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            );

            return JSON.parse(trigger.getBody());
        }
    },
    'submit': {
        'settings': {
            'env': nlapiGetContext().getEnvironment()
        },
        'inspect': function (url, data, allow_production) {
            nlapiLogExecution('DEBUG', 'Inspect Settings', JSON.stringify(this.settings));
            if (url && (this.settings.env == 'SANDBOX' || (this.settings.env == 'PRODUCTION' && allow_production))) {
                nlapiRequestURL(
                    url,
                    JSON.stringify(data),
                    {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                );
            }
        }
    }
};

var Runscope = function () {

    var settings = {
        'env': nlapiGetContext().getEnvironment()
    };

    this.run = function (url, allow_production) {
        if (url && (settings.env == 'SANDBOX' || (settings.env == 'PRODUCTION' && allow_production))) {
            var trigger = nlapiRequestURL(
                url,
                null,
                {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            );

            return JSON.parse(trigger.getBody());
        }
    };

    this.trigger = function (url, allow_production) {
        return this.run(url, allow_production);
    };

    this.submit = {
        'inspect': function (url, data, allow_production) {
            if (url && (settings.env == 'SANDBOX' || (settings.env == 'PRODUCTION' && allow_production))) {
                nlapiRequestURL(
                    url,
                    JSON.stringify(data),
                    {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                );
            }
        }
    };

    this.test = {
        alert: function (msg) {
            alert(msg);
        }
    }
};