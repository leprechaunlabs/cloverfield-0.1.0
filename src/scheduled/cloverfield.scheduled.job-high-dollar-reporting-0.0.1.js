var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.report = {
    'xHighDollar': function (event) {
        var env = nlapiGetContext().getEnvironment();
        var note_type = LPCLV.lib.functions.get.note_type_id('Production Note');

        var data = {
            'event': event
        };

        var rs = LPCLV.services.RunScope();

        data.rs = rs;
        data.trigger = rs.trigger('https://api.runscope.com/radar/33c612ef-87b2-4ae7-b7f1-299a32482c41/trigger');

        data.note_type_id = note_type;

        var s = nlapiLoadSearch(null, 'customsearch_clv_1557856073');
        var jobs = s.runSearch();
        data.jobs = [];

        jobs.forEachResult( function (job) {
            var _job = {};

            try {
                _job.record = nlapiLoadRecord('salesorder', job.getValue('internalid'));

                _job.id = job.getValue('internalid');
                _job.ref_number = job.getValue('tranid');
                _job.dates = {
                    'ship': job.getValue('shipdate')
                };
                _job.customer = {
                    'id': job.getValue('entity'),
                    'name': job.getText('entity')
                };

                _job.statuses = {
                    'approval': job.getText('custbody_lp_status_approval_request'),
                    'stock': job.getText('custbody_lp_status_stock')
                };

                _job.amount = job.getValue('amount');

                var notes = [];

                var refineSearchNotes = {
                    'filters': [
                        new nlobjSearchFilter('notetype', null, 'is', note_type),
                        new nlobjSearchFilter('internalid', 'transaction', 'is', job.getValue('internalid')),
                        new nlobjSearchFilter('mainline', 'transaction', 'is', 'T')
                    ],
                    'columns': [
                        new nlobjSearchColumn('internalid'),
                        new nlobjSearchColumn('title'),
                        new nlobjSearchColumn('note'),
                        new nlobjSearchColumn('author'),
                        new nlobjSearchColumn('notedate'),
                    ]
                };

                refineSearchNotes.columns.push(refineSearchNotes.columns[4].setSort(true));

                var searchNotes = nlapiSearchRecord('note', null, refineSearchNotes.filters, refineSearchNotes.columns);

                if (searchNotes) {
                    searchNotes.forEach( function (_note) {
                        notes.push({
                            'title': _note.getValue('title'),
                            'note': _note.getValue('note'),
                            'created': _note.getValue('notedate'),
                            'author': _note.getText('author'),
                        });
                    });
                }

                _job.notes = notes;

            } catch (e) {
                nlapiLogExecution('ERROR', e.getCode(), e.getDetails());
            }

            data.jobs.push(_job);

            return true;
        });

        data.domain = LPCLV.lib.functions.get.domain();

        try {
            if (data.domain) {
                var response = nlapiRequestURL(
                    data.domain + '/ns/reports/xHighDollar',
                    JSON.stringify(data.jobs),
                    {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                );

                data.response = JSON.parse(response.getBody());
            } else {
                var errNoDomain = nlapiCreateError('CLV_NO_DOMAIN', 'Domain could not be determined.');
                nlapiLogExecution('ERROR', errNoDomain.getCode(), errNoDomain.getDetails());
            }
        } catch (e) {
            // catch network error
        }

        rs.submit.inspect('https://api.runscope.com/radar/inbound/cfcfcde2-dc43-4a4f-b6e7-aa54fd8c34a3', data);
    }
};