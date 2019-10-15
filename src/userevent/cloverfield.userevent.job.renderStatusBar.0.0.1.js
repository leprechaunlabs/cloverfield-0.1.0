var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.job) { LPCLV.job = {}; }

LPCLV.job.statuses = [
    "order",
    'stock',
    "artwork",
    "payment",
    "approval",
    "tracking"
];

LPCLV.job.statusBar = {
    get: {
        _status: function (status, colors) {
            if (typeof status === 'string' && status) {
                return {
                    colors: {
                        background: colors[status].background,
                        text: colors[status].text
                    },
                    text: status
                };
            } else if (typeof status === 'object' && status.hasOwnProperty('format') && status.hasOwnProperty('text')) {
                return {
                    colors: {
                        background: colors[status.format].background,
                        text: colors[status.format].text
                    },
                    text: status.text
                };
            }

            if (!status) {
                return {
                    colors: {
                        background: LPCLV.lib.functions.get.color.background('attention'),
                        text: LPCLV.lib.functions.get.color.text('attention')
                    },
                    text: 'No Data'
                }
            }
        },
        status: function (status) {
            if (status === 'order') {
                return this.statusOrder();
            } else if (status === 'stock') {
                return this.statusStock();
            } else if (status === 'artwork') {
                return this.statusArtwork();
            } else if (status === 'payment') {
                return this.statusPayment();
            } else if (status === 'approval') {
                return this.statusApproval();
            } else if (status === 'tracking') {
                return this.statusTracking();
            } else {
                return null;
            }
        },
        statusOrder: function () {
            var status = nlapiGetNewRecord().getFieldText('custbody_lp_status_job_hold');

            if (nlapiGetFieldValue('orderstatus') === 'G') {
                status = 'Completed'
            } else if (!status && nlapiGetFieldValue('orderstatus') !== 'G') {
                status = 'In Progress'
            } else if (status && nlapiGetFieldValue('orderstatus') !== 'G') {
                status = {
                    format: 'hold',
                    text: status,
                }
            }

            return this._status(status, {
                'In Progress': LPCLV.lib.functions.get.colors('pending'),
                Completed: LPCLV.lib.functions.get.colors('ready'),
                hold: LPCLV.lib.functions.get.colors('attention')
            });
        },
        statusStock: function () {
            var status = nlapiGetNewRecord().getFieldText('custbody_lp_status_stock');

            if (status) {
                // remove the Stock: portion from the status string
                status = status.substring(6);
            } else {
                var items_total = nlapiGetNewRecord().getLineItemCount('item');

                for (var i = 1; i <= items_total; i++) {
                    if (nlapiGetNewRecord().getLineItemValue('item', 'quantitybackordered', i) > 0) {
                        status = 'Issue:Unresolved';
                        break;
                    }
                }

                if (!status) {
                    status = 'Available';
                }
            }

            return this._status(status, {
                "Available": LPCLV.lib.functions.get.colors('ready'),
                "Issue:Unresolved": LPCLV.lib.functions.get.colors('attention'),
                "Issue:Resolved": LPCLV.lib.functions.get.colors('ready')
            });
        },
        statusArtwork: function () {
            var status = nlapiGetNewRecord().getFieldText('custbody_lp_status_artwork_setup');

            if (status) {
                return this._status(status, {
                    "Completed" : LPCLV.lib.functions.get.colors('ready'),
                    "Processing" : LPCLV.lib.functions.get.colors('pending'),
                    "Revising" : LPCLV.lib.functions.get.colors('pending'),
                    "Issue" : LPCLV.lib.functions.get.colors('attention'),
                    "Transferred" : LPCLV.lib.functions.get.colors('pending'),
                    "Pending Transfer" : LPCLV.lib.functions.get.colors('initialize'),
                });
            }
        },
        statusPayment: function () {
            var status = nlapiGetNewRecord().getFieldText('custbody_lp_status_payment');

            return this._status(status, {
                "Net Terms" : LPCLV.lib.functions.get.colors('ready'),
                "On File" : LPCLV.lib.functions.get.colors('ready'),
                "Received" : LPCLV.lib.functions.get.colors('ready'),
                "Pending Request" : LPCLV.lib.functions.get.colors('initialize'),
                "Pending Response" : LPCLV.lib.functions.get.colors('attention'),
                "No Customer" : LPCLV.lib.functions.get.colors('initialize')
            });
        },
        statusApproval: function () {
            var status = nlapiGetNewRecord().getFieldText('custbody_lp_status_approval_request');

            return this._status(status, {
                "Approved" : LPCLV.lib.functions.get.colors('ready'),
                "Revision Requested" : LPCLV.lib.functions.get.colors('attention'),
                "Pending Request" : LPCLV.lib.functions.get.colors('initialize'),
                "Pending Response" : LPCLV.lib.functions.get.colors('pending')
            });
        },
        statusTracking: function () {
            var status = null;
            var tracking = nlapiGetNewRecord().getFieldValue('linkedtrackingnumbers');
            if (tracking) {
                tracking = tracking.split(' ');
                status = {
                    format: 'tracking',
                    text: tracking[0]
                }
            } else {
                status = "Not Available";
            }

            return this._status(status, {
                "tracking" : LPCLV.lib.functions.get.colors('ready'),
                "Not Available" : LPCLV.lib.functions.get.colors('initialize'),
            });
        },
    },
    statuses: []
};

LPCLV.job.beforeLoad = {
    renderStatusBar: function (event, form) {
        if ((event == 'view' || event == 'edit') && nlapiGetFieldValue('orderstatus') !== 'C') {
            // Loop through the sections we want to render
            // TODO: Add the ability to enable and disable various statuses
            for (var s = 0, statuses = {}, headers = [], status; s < LPCLV.job.statuses.length; s++) {
                status = LPCLV.job.statusBar.get.status(LPCLV.job.statuses[s]);
                if (status) {
                    // status converted to a string and then back to an object in order to break the reference to the
                    // original status object. this was causing all previously set statuses to update to match the current
                    statuses[LPCLV.job.statuses[s]] = JSON.parse(JSON.stringify(status));
                    headers.push('<td style="padding: 5px; text-transform: capitalize;" width="' + (100 / LPCLV.job.statuses.length) + '%">' + LPCLV.job.statuses[s] + '</td>');
                }
            }

            for (var field in statuses) {
                if (statuses.hasOwnProperty(field)) {
                    LPCLV.job.statusBar.statuses.push('<td style="padding: 5px; background-color: ' + statuses[field].colors.background + '; color: ' + statuses[field].colors.text + ';">' + statuses[field].text + '</td>');
                }
            }

            var statusBar = form.addField('custpage_job_status_dashboard', 'inlinehtml').setLayoutType('outsideabove');

            statusBar.setDefaultValue(
                '<table style="table-layout: fixed; font-size: 20px; overflow: hidden; padding: 20px 0" width="100%">\n' +
                '    <thead style="background-color: ' + LPCLV.lib.functions.get.color.background('header') + '">\n' +
                /*'    <tr><td colspan="5" style="padding: 5px; background-color: #D1E1D7; font-size: 13px; font-weight: bold; color: #8CB49A;">Status Bar</td></tr>\n' +*/
                '       <tr style="font-size: 16px; font-weight: bold;">\n' + headers.join('\n') + '</tr>\n' +
                '    </thead>\n' +
                '    <tbody>\n' +
                '       <tr>\n' + LPCLV.job.statusBar.statuses.join('\n') + '</tr>\n' +
                '    </tbody>\n' +
                '</table>'
            );
        }
    }
};