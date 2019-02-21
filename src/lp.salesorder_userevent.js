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

                if (!value || (customer && value == 6) || (customer && customer.getFieldText('terms').includes('Net') && value != 1)) {
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

        var folder = getJobDocumentsTempFolder();
        nlapiLogExecution('DEBUG', 'Job Documents Temp Folder', JSON.stringify(folder));

        if (context == 'userinterface') {
            ticketID = request.getParameter('ticket');

            if (ticketID) {
                ticket = nlapiLoadRecord('supportcase', ticketID);
            }
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

    if (ticket && event == 'create') {
        nlapiSetFieldValue('custbody_lp_ticket_id', ticket.getId());

        var folder = getJobDocumentsTempFolder();
        nlapiLogExecution('DEBUG', 'Job Documents Temp Folder', JSON.stringify(folder));

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

        nlapiSetFieldValue('otherrefnum', ticket.getFieldValue('custevent_lp_order_number'));
        nlapiSetFieldValue('custbody_lp_production_priority', ticket.getFieldValue('custevent_lp_production_priority'));
        nlapiSetFieldValue('custbody_lp_email_approval', ticket.getFieldValue('email'));

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

                var attachment = nlapiLoadFile(data.getValue(columns[5]));
                var document = nlapiCreateFile(attachment.getName(), attachment.getType(), attachment.getValue());
                document.setFolder(folder.getId());
                var document_id = nlapiSubmitFile(document);

                record.selectNewLineItem('recmachcustrecord_lp_job_document_job');
                record.setCurrentLineItemValue('recmachcustrecord_lp_job_document_job','custrecord_lp_job_document_resource_ns', document_id);
                record.commitLineItem('recmachcustrecord_lp_job_document_job');
            });
        }
    } else {
        // hide the Ticket field
    }

    nlapiSetFieldValue('subsidiary', 2);

    for (var status in statuses) {
        var status_current = nlapiGetFieldValue(statuses[status].id);
        status_value = statuses[status].value(status_current);

        if (status_value) {
            record.setFieldValue(statuses[status].id, status_value);
            updated = true;
        }
    }

    // move Attachments that weren't previously identified

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

function set_job_defaults() {
    nlapiSetFieldValue('shipdate', '');
}

function getJobDocumentsFolder() {
    var folder_jobdocs = null;
    var folder_name = 'Job Documents';

    var search_folder = {
        "filters" : [
            new nlobjSearchFilter('name', null, 'is', [folder_name]),
            new nlobjSearchFilter('istoplevel', null, 'is', ["T"])
        ],
        "columns" : [
            new nlobjSearchColumn('internalid')
        ]
    };

    folder_jobdocs = nlapiSearchRecord('folder', null, search_folder.filters, search_folder.columns);

    if (folder_jobdocs === null) {
        folder_jobdocs = nlapiCreateRecord('folder');
        folder_jobdocs.setFieldValue('name', folder_name);
        nlapiSubmitRecord(folder_jobdocs);
    } else {
        folder_jobdocs = nlapiLoadRecord('folder', folder_jobdocs[0].getId());
    }

    return folder_jobdocs;
}

function getJobDocumentsTempFolder() {
    var folder_jobdocstmp = null;
    var folder_name = '00-00000';
    var folder_jobdocs = getJobDocumentsFolder();

    var search_folder = {
        "filters" : [
            new nlobjSearchFilter('name', null, 'is', [folder_name]),
            new nlobjSearchFilter('parent', null, 'is', [folder_jobdocs.getId()])
        ],
        "columns" : [
            new nlobjSearchColumn('internalid')
        ]
    };

    folder_jobdocstmp = nlapiSearchRecord('folder', null, search_folder.filters, search_folder.columns);

    if (folder_jobdocstmp === null) {
        folder_jobdocstmp = nlapiCreateRecord('folder');
        folder_jobdocstmp.setFieldValue('name', folder_name);
        folder_jobdocstmp.setFieldValue('parent', folder_jobdocs.getId());
        nlapiSubmitRecord(folder_jobdocstmp);
    } else {
        folder_jobdocstmp = nlapiLoadRecord('folder', folder_jobdocstmp[0].getId());
    }

    return folder_jobdocstmp;
}

function getJobFolder (job_number) {
    var job_folder = null;
    var folder_jobdocs = getJobDocumentsFolder();

    var search_folder = {
        "filters" : [
            new nlobjSearchFilter('name', null, 'is', [job_number]),
            new nlobjSearchFilter('parent', null, 'is', [folder_jobdocs.getId()])
        ],
        "columns" : [
            new nlobjSearchColumn('internalid')
        ]
    };

    job_folder = nlapiSearchRecord('folder', null, search_folder.filters, search_folder.columns);

    if (job_folder === null) {
        job_folder = nlapiCreateRecord('folder');
        job_folder.setFieldValue('name', job_number);
        job_folder.setFieldValue('parent', folder_jobdocs.getId());
        nlapiSubmitRecord(job_folder);
    } else {
        job_folder = nlapiLoadRecord('folder', job_folder[0].getId());
    }

    return job_folder;
}

function lp_MoveJobDocumentsToJobFolder (event) {
    var record = nlapiLoadRecord('salesorder', nlapiGetRecordId());
    var job_folder = getJobFolder(record.getFieldValue('tranid'));
    var count = record.getLineItemCount('recmachcustrecord_lp_job_document_job');
    nlapiLogExecution('DEBUG', 'Job Documents Count', count);

    for (var c = 1; c <= count; c++) {
        record.selectLineItem('recmachcustrecord_lp_job_document_job', c);

        var id_jobdoc = record.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'custrecord_lp_job_document_resource_ns');
        nlapiLogExecution('DEBUG', 'File Record ID from Job Document Sublist', id_jobdoc);

        if (id_jobdoc) {
            var jobdoc = nlapiLoadFile(id_jobdoc);
            jobdoc.setFolder(job_folder.getId());
            nlapiSubmitFile(jobdoc);
        }
    }
}

function lpSubmitRevisionRequest (event) {
    var action = nlapiGetFieldValue('custbody_lp_lpflow_action');

    if (action == 1) {
        var resource = '/ns/jobs/rcv-revision';
        var job = nlapiGetNewRecord();

        nlapiLogExecution('DEBUG','Log Job on beforeSubmit', JSON.stringify(job));

        if (job) {
            var customer = nlapiLoadRecord('customer', job.getFieldValue('entity'));
            nlapiLogExecution('DEBUG', 'Customer', JSON.stringify(customer));

            var _job = {
                'id': job.getId(),
                'ref_number': job.getFieldValue('tranid'),
                'order_number': job.getFieldValue('otherrefnum'),
                'record': job,
                'customer': customer,
                'jobdocs': lpGetJobDocs(job)
            };

            var response = nlapiRequestURL(lpGetDomain(lpGetAccountNumber()) + resource, JSON.stringify(_job), {
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            });

            var rspn_body = response.getBody();
            nlapiLogExecution('DEBUG', 'LP Flow Response', rspn_body);

            job.setFieldValue('custbody_lp_status_artwork_setup', 3);
        }
    }
}

function lpSendRevisedApprovalRequest (event) {
    var action = nlapiGetFieldValue('custbody_lp_lpflow_action');

    if (action == 2) {
        var resource = '/ns/jobs/approvals/revision/send';
        var job = nlapiGetNewRecord();

        if (job) {
            var customer = nlapiLoadRecord('customer', job.getFieldValue('entity'));

            var _job = {
                'id': job.getId(),
                'ref_number': job.getFieldValue('tranid'),
                'order_number': job.getFieldValue('otherrefnum'),
                'record': job,
                'customer': customer
            };

            var rspn = nlapiRequestURL(lpGetDomain(lpGetAccountNumber()) + resource, JSON.stringify(_job), {
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            });

            var approval = rspn.getBody();

            approval = JSON.parse(approval);

            if (approval.hasOwnProperty('url')) {
                nlapiLogExecution('DEBUG', 'LP Flow Response', JSON.stringify(approval));
                job.setFieldValue('custbody_lp_status_approval_request', '4');
                job.setFieldValue('custbody_lp_approval_request', approval.url);
            }
        }
    }
}

function lpSendReminderApprovalRequest (event) {
    var action = nlapiGetFieldValue('custbody_lp_lpflow_action');

    if (action == 4) {
        var resource = '/ns/jobs/approvals/reminder/send';
        var job = nlapiGetNewRecord();

        if (job) {
            var customer = nlapiLoadRecord('customer', job.getFieldValue('entity'));

            var _job = {
                'id': job.getId(),
                'ref_number': job.getFieldValue('tranid'),
                'order_number': job.getFieldValue('otherrefnum'),
                'record': job,
                'customer': customer
            };

            var rspn = nlapiRequestURL(lpGetDomain(lpGetAccountNumber()) + resource, JSON.stringify(_job), {
                'Accept': 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            });

            var reminder = rspn.getBody();

            reminder = JSON.parse(reminder);

            if (reminder.hasOwnProperty('mandrill')) {
                nlapiLogExecution('DEBUG', 'LP Flow Response', JSON.stringify(reminder));
                job.setFieldValue('custbody_lp_status_approval_request', '4');
            }
        }
    }
}

function lpGetAccountNumber () {

    var account = null;

    var company = nlapiLoadConfiguration('companyinformation');
    account = company.getFieldValue('companyid');

    return account;
}

function lpGetDomain ( account ) {
    var domain = null;
    var account = lpGetAccountNumber();

    if (account == '4976131_SB1') {
        domain = 'https://lpflow.ngrok.io';
    } else if (account == '4976131') {
        domain = 'https://lpflow.leprechaunpromotions.com';
    }

    return domain;
}

function lpGetJobDocs ( job ) {

    var count = job.getLineItemCount('recmachcustrecord_lp_job_document_job');
    var jobdocs = [];

    for (var c = 1; c <= count; c++) {
        job.selectLineItem('recmachcustrecord_lp_job_document_job', c);
        var id = job.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'id');
        nlapiLogExecution('DEBUG', 'Job Document ID', id);

        var jobdoc_id = job.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'custrecord_lp_job_document_resource_ns');
        nlapiLogExecution('DEBUG', 'File Record ID from Job Document Sublist', jobdoc_id);

        if (jobdoc_id) {
            var jobdoc = nlapiLoadFile(jobdoc_id);
            jobdoc.setIsOnline(true);
            nlapiSubmitFile(jobdoc);
            nlapiLogExecution('DEBUG', 'Online Status for File Record ' + jobdoc_id, jobdoc.isOnline());

            jobdocs.push({
                'id_file': jobdoc_id,
                'id_lp_job_document': id,
                'type_document': job.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'custrecord_lp_job_document_type'),
                'name': jobdoc.getName(),
                'url': jobdoc.getURL(),
                'type_format': jobdoc.getType(),
                'size': jobdoc.getSize(),
                'folder': jobdoc.getFolder()
            });
        }
    }

    return jobdocs;
}