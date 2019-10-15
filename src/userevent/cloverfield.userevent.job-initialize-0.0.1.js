var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, 'includes', {
        value: function(search, start) {
            if (typeof start !== 'number') {
                start = 0
            }

            if (start + search.length > this.length) {
                return false
            } else {
                return this.indexOf(search, start) !== -1
            }
        }
    })
}

LPCLV.job.initialize = {
    create: {
        beforeLoad: function (event, form, request) {

            var data = {
                'inspect': {}
            };
            var rs = LPCLV.services.RunScope();
            rs.run(nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_1557434631_1557434878'));

            var env = nlapiGetContext().getEnvironment();
            var ticket_id = request.getParameter('ticket') || 32548;
            var uuid = UUIDjs.create();
            data.inspect.uuid = uuid.toString().replace(new RegExp('-', 'g'), '');
            data.inspect.ticket = {
                'id': ticket_id
            };

            nlapiLogExecution('DEBUG', 'Inspect Headers', JSON.stringify(request.getAllParameters()));

            if (ticket_id) {

                try {

                    var ticket = nlapiLoadRecord('supportcase', ticket_id);
                    data.inspect.ticket.record = ticket;

                } catch (e) {

                    data.inspect.exception = {
                        'code': 'CLV_TICKET_NOT_FOUND',
                        'details': 'No Ticket was found for the supplied Record ID',
                        'frames': e.getStackTrace(),
                        'event': e.getUserEvent()
                    };

                    var time = new Date();

                    var dsn = LPCLV.lib.functions.get.config('SENTRY', 'DSN');

                    data.inspect.configuration = {
                        'dsn': dsn.value
                    };

                    function pad(number) {
                        if (number < 10) {
                            return '0' + number;
                        }
                        return number;
                    }

                    nlapiRequestURL(
                        'https://sentry.io/api/1438671/store/',
                        JSON.stringify({
                            'event_id': UUIDjs.create().toString().replace(new RegExp('-', 'g'), ''),
                            'timestamp': time.getUTCFullYear()
                                         + '-' + pad(time.getUTCMonth() + 1)
                                         + '-' + pad(time.getUTCDate())
                                         + 'T' + pad(time.getUTCHours())
                                         + ':' + pad(time.getUTCMinutes())
                                         + ':' + pad(time.getUTCSeconds()),
                            'level': 'error',
                            'transaction': e.getUserEvent(),
                            'server_name': '',
                            'sdk': {
                                'name': 'cloverfield/galiger',
                                'version': '0.0.1'
                            },
                            'environment': nlapiGetContext().getEnvironment(),
                            'platform': 'javascript',
                            'user': {
                                'id': nlapiGetContext().getUser(),
                                'username': nlapiGetContext().getName(),
                                'email': nlapiGetContext().getEmail()
                            },
                            'exception': {
                                'values': [
                                    {
                                        'type': 'CLV_TICKET_NOT_FOUND',
                                        'value': 'No Ticket was found for the supplied Record ID'
                                    }
                                ]
                            }
                        }),
                        {
                            'X-Sentry-Auth': 'Sentry ' + [
                                'sentry_version=7',
                                'sentry_client=galiger/0.0.1',
                                'sentry_timestamp=' + Math.floor(time.getTime() / 1000),
                                'sentry_key=2ce2a4146d124687aae92ad7b32fc1bb'
                            ].join(', ')
                        }
                    );
                }

                if (ticket) {
                    nlapiSetFieldValue('custbody_lp_ticket_id', ticket.getId());
                    var customer_id = ticket.getFieldValue('company');
                    var customer = nlapiLoadRecord('customer', customer_id);

                    nlapiSetFieldValue('subsidiary', '2');
                    nlapiSetFieldValue('location', '1');
                    nlapiSetFieldValue('otherrefnum', ticket.getFieldValue('custevent_lp_order_number'));
                    nlapiSetFieldValue('custbody_lp_production_priority', ticket.getFieldValue('custevent_lp_production_priority'));
                    nlapiSetFieldValue('custbody_lp_email_approval', ticket.getFieldValue('email'));

                    if (customer) {
                        nlapiSetFieldValue('entity', customer.getId());

                        /** set Default Shipping/Billing Address **/

                            // get total Shipping and Billing Addresses associated with the identified Customer
                        var addresses_total = customer.getLineItemCount('addressbook');

                        // loop through Shipping/Billing Addresses to locate default Shipping Address
                        for (var a = 1; a <= addresses_total; a++) {
                            if (customer.getLineItemValue('addressbook', 'defaultshipping', a) == 'T') {
                                nlapiSetFieldValue('shipaddresslist', customer.getLineItemValue('addressbook', 'id', a));
                            }

                            if (customer.getLineItemValue('addressbook', 'defaultbilling', a) == 'T') {
                                nlapiSetFieldValue('billaddresslist', customer.getLineItemValue('addressbook', 'id', a));
                            }
                        }
                    }
                }
            }

            rs.submit.inspect(nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_1557434631_1557434665'), data);
        }
    }
};