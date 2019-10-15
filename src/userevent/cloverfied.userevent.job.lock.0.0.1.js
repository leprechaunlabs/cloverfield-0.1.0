var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.lock = {
    beforeLoad: function (event, form) {
        nlapiLogExecution('DEBUG', 'Event', event);
        nlapiLogExecution('DEBUG', 'Execution Context', nlapiGetContext().getExecutionContext());
        nlapiLogExecution('DEBUG', 'Order Status', nlapiGetFieldValue('orderstatus'));
        if (event == 'view' && nlapiGetContext().getExecutionContext() === 'userinterface' && nlapiGetFieldValue('orderstatus') === 'G') {
            form.removeButton('edit');
        }
    }
};