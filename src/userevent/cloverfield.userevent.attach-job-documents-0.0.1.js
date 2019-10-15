var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.docs = {
    create: {
        beforeLoad: function (action, form, request) {
            var record = nlapiGetNewRecord();
            var trigger = null;
            var env = nlapiGetContext().getEnvironment();
            var ticket = request.getParameter('ticket');
            var inspect = {
                'env': env,
                'ticket': ticket,
                'urls': {
                    'request': request.getURL()
                },
            };

            // turn on the Create Job Documents Inspector
            if (env == 'SANDBOX' || (env == 'PRODUCTION' && nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_enable_inspection_prod') == 'T')) {
                trigger = nlapiRequestURL(
                    'https://api.runscope.com/radar/b7c869d4-45bc-4f9c-b92d-0bb4d9e7380b/trigger',
                    null,
                    {
                        'Accept' : 'application/json',
                        'Content-Type' : 'application/json; charset=utf-8'
                    }
                );

                inspect.trigger = JSON.parse(trigger.getBody());
            }

            if (ticket) {
                var search = nlapiLoadSearch(null, 'customsearch_clv_tickets_msgs_in_attach');
                search.addFilter(new nlobjSearchFilter('internalid', 'case', 'is', '5806'));
                var messages = search.runSearch();

                var documents = [];

                messages.forEachResult(function (message) {
                    var id = message.getValue(new nlobjSearchColumn('internalid', 'attachments'));
                    var attachment = nlapiLoadFile(id);

                    documents.push({
                        'name': attachment.getName(),
                        'type': attachment.getType()
                    });

                    record.selectNewLineItem('recmachcustrecord_lp_job_document_job');
                    record.setCurrentLineItemValue('recmachcustrecord_lp_job_document_job','custrecord_lp_job_document_resource_ns', id);
                    record.setCurrentLineItemValue('recmachcustrecord_lp_job_document_job','custrecord_lp_job_document_type', '7');
                    record.commitLineItem('recmachcustrecord_lp_job_document_job');

                    return true;
                });

                inspect.documents = documents;
            }

            if (trigger) {
                var url = nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_url_inspect_env');

                if (url) {
                    inspect.urls.inspection = url;

                    nlapiRequestURL(
                        nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_url_inspect_env'),
                        JSON.stringify(inspect),
                        {
                            'Accept' : 'application/json',
                            'Content-Type' : 'application/json; charset=utf-8'
                        }
                    );
                }
            }
        },
        afterSubmit: function (action) {
            // this will send Job Documents to DigitalOcean
            // this should probably be pushed to LP Flow
            return this.afterSubmit(action);
        }
    },
    beforeLoad: function (action, form, request) {
        nlapiLogExecution('DEBUG', 'Executed Method', 'LPCLV.job.docs.create.beforeLoad');

        if (request) {
            nlapiLogExecution('DEBUG', 'Executed Method Request', request.getURL());
        }
    },
    afterSubmit: function (event) {}
};