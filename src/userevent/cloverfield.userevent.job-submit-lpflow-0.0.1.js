var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.beforeSubmit = {
    sendtoLPFlow: function (event) {
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

        var action = nlapiGetFieldValue('custbody_lp_lpflow_action');
        var job = nlapiGetNewRecord();

        if ((event == 'create' || action == 3) && (job.getFieldValue('custbody_lp_status_stock') != 2)) {

            var job = {
                'id' : _job.getId(),
                'ref_number' : _job.getFieldValue('tranid'),
                'order_number' : _job.getFieldValue('otherrefnum'),
                'record' : _job,
                'customer' : nlapiLoadRecord('customer', _job.getFieldValue('entity')),
                'jobdocs' : lpcloverGetJobDocs( _job )
            };

            var response = nlapiRequestURL(
                lpcloverGetDomain(),
                JSON.stringify(job),
                {
                    'Accept' : 'application/json',
                    'Content-Type' : 'application/json; charset=utf-8'
                }
            );

            var data = response.getBody();
            nlapiLogExecution('DEBUG', 'LP Flow Response', data);

            if (data != 'Tunnel lpflow.ngrok.io not found') {
                data = JSON.parse(data);
            }

            _job.setFieldValue('custbody_lp_status_artwork_setup', 2);
            nlapiSubmitRecord(_job);
        }
    }
};