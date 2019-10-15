var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.form = {
    submit: {
        inspectRunscope: function () {
            var rs = LPCLV.services.RunScope();

            var record = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());

            // TODO: Move Runscope URLS to NetSuite parameters so they are not in codebase
            rs.trigger('https://api.runscope.com/radar/7ae01e16-db21-4622-ab6f-064ac22224f1/trigger');
            rs.submit.inspect('https://api.runscope.com/radar/inbound/4c234177-4946-4911-8333-5c356a295228', record);

            alert('Submitted to RunScope');
        }
    }
};
