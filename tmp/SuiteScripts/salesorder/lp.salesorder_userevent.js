function getDashboardSection(section, record)
{
    var swatches = {
        "dark" : {
            "keyword" : "black",
            "hex" : "#000"
        },
        "light" : {
            "keyword" : "white",
            "hex" : "#fff"
        }
    };

    var colors = {
        "default" : {
            "background" : swatches.light,
            "text" : swatches.dark
        },
        "header" : {},
        "ready" : {
            "background" : {
                "keyword" : "seagreen",
                "hex" : "#2e8b57"
            },
            "text" : swatches.light
        },
        "pending" : {
            "background" : {
                "keyword" : "lemonchiffon",
                "hex" : "#2e8b57"
            },
            "text" : swatches.dark
        },
        "attention" : {
            "background" : {
                "keyword" : "red",
                "hex" : "#2e8b57"
            },
            "text" : swatches.light
        },
        "initialize" : {
            "background" : {
                "keyword" : "blue",
                "hex" : "#2e8b57"
            },
            "text" : swatches.light
        }
    };

    var fields = {
        "order" : function (record) {
            var status = null;

            if (record.getFieldValue('tranid') == 'To Be Generated') {
                status = 'New Job';
            } else {
                status = 'Completed';

                var items_total = record.getLineItemCount('item');

                for (var i = 1; i <= items_total; i++) {
                    if (record.getLineItemValue('item', 'quantitybackordered', i) > 0) {
                        status = 'Stock Issue';
                        break;
                    }
                }
            }

            return status;
        },
        "artwork" : [
            "custbody_lp_status_artwork_setup"
        ],
        "payment" : [
            "custbody_lp_status_payment"
        ],
        "approval" : [
            "custbody_lp_status_approval_request"
        ],
        "tracking" : function (record) {
            var status = null;
            var tracking = record.getFieldValue('linkedtrackingnumbers');

            if (tracking) {
                tracking = tracking.split(' ');
                status = {
                    "option" : "Tracking",
                    "value" : tracking[0]
                }
            } else {
                status = "Not Available";
            }

            return status;
        }
    };

    var statuses = {
        "order" : {
            "Completed" : colors.ready,
            "New Job" : colors.initialize,
            "Stock Issue" : colors.attention,
            "Hold" : colors.attention
        },
        "artwork" : {
            "Completed" : colors.ready,
            "Processing" : colors.pending,
            "Revising" : colors.pending,
            "Issue" : colors.attention,
            "Transferred" : colors.pending,
            "Pending Transfer" : colors.initialize
        },
        "payment" : {
            "Net Terms" : colors.ready,
            "On File" : colors.ready,
            "Received" : colors.ready,
            "Pending Request" : colors.initialize,
            "Pending Response" : colors.attention,
            "No Customer" : colors.initialize
        },
        "approval" : {
            "Approved" : colors.ready,
            "Revision Requested" : colors.attention,
            "Pending Request" : colors.initialize,
            "Pending Response" : colors.pending
        },
        "tracking" : {
            "Shipping Today" : colors.ready,
            "Did Not Ship" : colors.attention,
            "Not Available" : colors.initialize,
            "Tracking" : colors.ready
        }
    };

    var dashboardSection = {
        "color" : {
            "background" : colors.default.background,
            "text" : colors.default.text
        },
        "text" : "–"
    };

    var fieldText = null;

    if (Array.isArray(fields[section]) && fields[section].length) {
        for (var f = 0; f < fields[section].length; f++) {
            fieldText = record.getFieldText(fields[section][f]);

            if (fieldText in statuses[section]) {
                dashboardSection = {
                    "color" : statuses[section][fieldText],
                    "text" : fieldText
                };
                break;
            }
        }
    } else if (typeof fields[section] === 'function') {
        fieldText = fields[section](record);

        if (typeof fieldText === 'string') {
            if (fieldText in statuses[section]) {
                dashboardSection = {
                    "color" : statuses[section][fieldText],
                    "text" : fieldText
                };
            }
        } else if (typeof fieldText === 'object' && fieldText !== null) {
            if (fieldText.option in statuses[section]) {
                dashboardSection = {
                    "color" : statuses[section][fieldText.option],
                    "text" : fieldText.value
                };
            }
        }
    }

    return dashboardSection;
}

function job_addStatusStrip(type, form)
{
    var record = nlapiGetNewRecord();

    var sections = [
        "order",
        "artwork",
        "payment",
        "approval",
        "tracking"
    ];

    for (var s = 0, status_strip = {}; s < sections.length; s++) {
        status_strip[sections[s]] = getDashboardSection(sections[s], record);
    }

    // setup Customer Service View
    var dashboard_status = form.addField('custpage__job_status_dashboard', 'inlinehtml').setLayoutType('outsideabove');

    dashboard_status.setDefaultValue(
        '<table style="width: 97vw; font-size: 20px; overflow: hidden; padding: 20px 0">\n' +
        '    <thead style="background-color: lightgray">\n' +
        /*'    <tr><td colspan="5" style="padding: 5px; background-color: #D1E1D7; font-size: 13px; font-weight: bold; color: #8CB49A;">Status Bar</td></tr>\n' +*/
        '    <tr style="font-size: 16px; font-weight: bold;">\n' +
        '        <td style="width: 20%; padding: 5px;">Order</td>\n' +
        '        <td style="width: 20%; padding: 5px;">Artwork</td>\n' +
        '        <td style="width: 20%; padding: 5px;">Payment</td>\n' +
        '        <td style="width: 20%; padding: 5px;">Approval</td>\n' +
        '        <td style="width: 20%; padding: 5px;">Tracking</td>\n' +
        '    </tr>\n' +
        '    </thead>\n' +
        '    <tbody>\n' +
        '    <tr>\n' +
        '        <td style="padding: 5px; background-color: ' + status_strip.order.color.background.keyword + '; color: ' + status_strip.order.color.text.keyword + '">' + status_strip.order.text + '</td>\n' +
        '        <td style="padding: 5px; background-color: ' + status_strip.artwork.color.background.keyword + '; color: ' + status_strip.artwork.color.text.keyword + '">' + status_strip.artwork.text + '</td>\n' +
        '        <td style="padding: 5px; background-color: ' + status_strip.payment.color.background.keyword + '; color: ' + status_strip.payment.color.text.keyword + '">' + status_strip.payment.text + '</td>\n' +
        '        <td style="padding: 5px; background-color: ' + status_strip.approval.color.background.keyword + '; color: ' + status_strip.approval.color.text.keyword + '">' + status_strip.approval.text + '</td>\n' +
        '        <td style="padding: 5px; background-color: ' + status_strip.tracking.color.background.keyword + '; color: ' + status_strip.tracking.color.text.keyword + '">' + status_strip.tracking.text + '</td>\n' +
        '    </tr>\n' +
        '    </tbody>\n' +
        '</table>'
    );
}

function job_new(event, form, request)
{
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

    var context = nlapiGetContext().getExecutionContext();
    nlapiLogExecution('DEBUG', 'Execution Context', context);

    nlapiLogExecution('DEBUG', 'Request', request);
    //nlapiLogExecution('DEBUG', 'Request Test', request_test);

    var record = null;
    var ticket = null;
    var ticketID = null;
    var customer = null;
    var customerID = null;
    var updated = false;

    var statuses = {
        "artwork" : {
            "id" : "custbody_lp_status_artwork_setup",
            "value" : function (value) {
                var status_value = null;

                if (!value) {
                    status_value = 6;
                }

                return status_value;
            }
        },
        "approval" : {
            "id" : "custbody_lp_status_approval_request",
            "value" : function (value) {
                var status_value = null;

                if (!value) {
                    status_value = 3;
                }

                return status_value;
            }
        },
        "payment" : {
            "id" : "custbody_lp_status_payment",
            "value" : function (value) {
                var status_value = null;

                if (!value || (customer && value == 6)) {
                    if (!customer) {
                        status_value = 6;
                    } else {
                        if (customer.getFieldText('terms').includes('Net')) {
                            status_value = 1;
                        } else if (customer.getFieldText('terms') == 'CC ON FILE') {
                            status_value = 2;
                        } else if (customer.getFieldText('terms') == 'Credit Card') {
                            status_value = 4;
                        }
                    }
                }

                return status_value;
            }
        }
    };

    if (event == 'create') {
        record = nlapiGetNewRecord();

        if (context == 'userinterface') {
            ticketID = request.getParameter('ticket');
            ticket = nlapiLoadRecord('supportcase', ticketID);
        }

        if (ticket) {
            customerID = ticket.getFieldValue('company');
            customer = nlapiLoadRecord('customer', customerID);
        }
    } else {
        record = nlapiLoadRecord('salesorder', nlapiGetRecordId());
        ticketID = nlapiGetFieldValue('custbody_lp_ticket_id');
        customerID = nlapiGetFieldValue('entity');

        if (ticketID) {
            ticket = nlapiLoadRecord('supportcase', ticketID);
        }

        if (customerID) {
            customer = nlapiLoadRecord('customer', customerID);
        }
    }

    if (ticket) {
        nlapiSetFieldValue('custbody_lp_ticket_id', ticket.getId());

        // set the Customer for this Sales Order to the Customer from the Primary Ticket
        if (customer) {
            nlapiSetFieldValue('entity', customer.getId());

            /** set Default Shipping/Billing Address **/

                // get total Shipping and Billing Addresses associated with the identified Customer
            var addresses_total = customer.getLineItemCount('addressbook');

            // loop through Shipping/Billing Addresses to locate default Shipping Address
            for (var a = 1; a <= addresses_total; a++) {
                if (customer.getLineItemValue('addressbook', 'defaultshipping', a) == 'T') {
                    nlapiSetFieldValue('shipaddresslist', customer.getLineItemValue('addressbook', 'id', a));
                } else if (customer.getLineItemValue('addressbook', 'defaultbilling', a) == 'T') {
                    nlapiSetFieldValue('billaddresslist', customer.getLineItemValue('addressbook', 'id', a));
                }
            }
        }

        // find all Messages linked to Ticket
        var filters = [
            new nlobjSearchFilter('internalid', 'case', 'is', ticket.getId()),
            new nlobjSearchFilter('hasattachment', null, 'is', true),
            new nlobjSearchFilter('isincoming', null, 'is', true),
        ];

        var columns = [
            new nlobjSearchColumn('messagedate'),
            new nlobjSearchColumn('authoremail'),
            new nlobjSearchColumn('recipientemail'),
            new nlobjSearchColumn('hasattachment'),
            new nlobjSearchColumn('isincoming'),
            new nlobjSearchColumn('internalid', 'attachments')
        ];

        var messages = nlapiSearchRecord('message', null, filters, columns);

        if (messages) {
            messages.forEach(function (data) {
                nlapiLogExecution('DEBUG', 'Search Data', JSON.stringify(data));
                nlapiLogExecution('DEBUG', 'Message Attachment ID', data.getValue(columns[5]));
                record.selectNewLineItem('recmachcustrecord_lp_job_document_job');
                record.setCurrentLineItemValue('recmachcustrecord_lp_job_document_job','custrecord_lp_job_document_resource_ns', data.getValue(columns[5]));
                record.commitLineItem('recmachcustrecord_lp_job_document_job');
            });
        }
    } else {
        // hide the Ticket field
    }

    for (var status in statuses) {
        var status_current = nlapiGetFieldValue(statuses[status].id);
        status_value = statuses[status].value(status_current);

        if (status_value) {
            record.setFieldValue(statuses[status].id, status_value);
            updated = true;
        }
    }

    if (updated && event != 'create') {
        nlapiLogExecution('DEBUG', 'Resubmitting Record');
        var id = nlapiSubmitRecord(record, true, true);

        var mode = false;
        if (event == 'edit') {
            mode = true;
        }

        nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), id, mode);
    }
}