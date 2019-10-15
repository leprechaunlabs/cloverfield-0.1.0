var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.form = {
    add: {
        btnRunscopeInspect: function (event, form) {
            var exContext = nlapiGetContext().getExecutionContext();

            if (exContext === 'userinterface') {
                form.setScript('customscript_clv_6048547_9428122');
                form.addButton('custpage_clv_7078273_9343230', 'Inspect with Runscope', 'LPCLV.job.form.submit.inspectRunscope()');
            }
        }
    }
};