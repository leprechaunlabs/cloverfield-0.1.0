var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.docs = {
    mu: {
        transfer: function (type, id) {
            var domain = LPCLV.lib.functions.get.domain();

            var data = {
                init: 'Starting Mass Update Transfer Script.',
                record: {
                    type: type,
                    id: id
                },
                runscope: {
                    trigger: nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_9581590_7434878')
                }
            };

            // Unable to get RunScope inspection working properly. Will disable until later.
            // This might be related to it using Promises which is not supported by SuiteScript 1.0
            var rs = LPCLV.services.RunScope();

            rs.trigger(nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_9581590_7434878'));

            // load the Job Document Record
            var job = nlapiLoadRecord(type, id);
            data.doc = job;

            // Check if it is associated with a Sales Order
            var jobID = job.getFieldValue('custrecord_lp_job_document_job');
            data.job = {};
            data.job.id = jobID;
            data.job.transdate = {
                value: job.getFieldValue('custrecord_lp_job_document_lpf_transdate'),
                text: job.getFieldText('custrecord_lp_job_document_lpf_transdate')
            };

            if (jobID) {
                // Has a Job ID

                data.response = nlapiRequestURL(
                    domain + '/ns/jobs/documents/transfer/digitalocean',
                    JSON.stringify(data),
                    {
                        'Accept' : 'application/json',
                        'Content-Type' : 'application/json; charset=utf-8'
                    }
                );
            } else if (jobID === null) {
                // Orphaned

                var response = nlapiRequestURL(
                    domain + '/ns/jobs/documents/remove/orphaned',
                    JSON.stringify(data),
                    {
                        'Accept' : 'application/json',
                        'Content-Type' : 'application/json; charset=utf-8'
                    }
                );
            }

            // What does a Job Document from a deleted Sales Order look like
            // Should check statuses so we aren't sending over Jobs that are Cancelled or Deleted

            // Get the ID of the Folder the Document was in and then determine if it is empty.
            // If Empty it can be deleted

            rs.submit.inspect(nlapiGetContext().getSetting('SCRIPT', 'custscript_clv_9581590_7434665'), data);

            /*
            Check if the NS File is associated with any other Job Documents.
            If not than it can be deleted from the File Cabinet
            Could also check if the parent Folder is empty and delete at this point
            Empty Job Document Folder deletion should be done as a separate garbage collection process
            */
        }
    }
};