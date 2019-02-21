function tkt_matchCustomer(event)
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

    var record = nlapiGetNewRecord();
    nlapiLogExecution('DEBUG', 'Script Fired', true);
    nlapiLogExecution('DEBUG', 'Event', type);
    nlapiLogExecution('DEBUG', 'Record Data (Original)', JSON.stringify(record));

    // see if you can get field values without a record object

    var company = nlapiGetFieldText('company');
    nlapiLogExecution('DEBUG', 'Company Text', company);

    if (company.toUpperCase().includes('CUSTOMER')) {

        var email = nlapiGetFieldValue('email');
        nlapiLogExecution('DEBUG', 'Ticket Email', email);

        var domain = email.split('@')[1];
        nlapiLogExecution('DEBUG', 'Email Domain', domain);

        // search for domain
        var filters = new Array();
        filters[0] = new nlobjSearchFilter('custentity_lp_cx_email_domain', null, 'is', domain);

        var columns = new Array();
        columns[0] = new nlobjSearchColumn('entityid', null);
        columns[1] = new nlobjSearchColumn('companyname', null);
        columns[2] = new nlobjSearchColumn('custentity_lp_cx_email_domain', null);

        nlapiLogExecution('DEBUG', 'Searching for Customer by Email Domain');
        var customer = nlapiSearchRecord('customer', null, filters, columns);

        if (customer != null) {
            nlapiLogExecution('DEBUG', 'Customer', JSON.stringify(customer));
            nlapiSetFieldText('company', customer[0].getValue(columns[0]) + ' ' + customer[0].getValue(columns[1]));
            nlapiLogExecution('DEBUG', 'Record Data (Updated)', JSON.stringify(record));
        } else {
            nlapiLogExecution('DEBUG', 'No Customer was found with a matching Domain. Company remains set to the Anonymous Customer.');
        }

    } else {
        nlapiLogExecution('DEBUG', 'Customer was found by fully matched email address.');
    }
}

function tkt_addNewJobButton(type, form)
{
    var status_review = nlapiGetFieldValue('custevent_lp_status_review');
    nlapiLogExecution('DEBUG', 'Review Status', JSON.stringify(status_review));

    var status_issues = nlapiGetFieldValue('custevent_lp_status_issues');
    nlapiLogExecution('DEBUG', 'Issues Status', JSON.stringify(status_issues));

    if (status_review === '2' && (status_issues === '' || status_issues === null || status_issues === '2')) {
        var id = nlapiGetRecordId();
        var customer = nlapiGetFieldValue('company');
        var ticket = '&apos;{&quot;id&quot;: ' + id + ',&quot;customer&quot;: ' + customer + '}&apos;';
        //nlapiLogExecution('DEBUG', 'Ticket Details', ticket);
        form.setScript('customscript_lp_tkt_addnewjobbutton');
        form.addButton('custpage_lp_new_job_btn', 'Create New Job', 'tkt_openNewJobRecord(' + ticket + ')');
    }
}

function tkt_openNewJobRecord(data)
{
    var ticket = JSON.parse(data);
    window.open(nlapiResolveURL('RECORD', 'salesorder', null, 'edit') + '&ticket=' + ticket.id, '_self');
}

function tkt_routeToOrderManagement(type)
{
    var agent = nlapiGetFieldText('assigned');
    nlapiLogExecution('DEBUG', 'Assigned Agent/Group', agent);

    var status_review = nlapiGetFieldValue('custevent_lp_status_review');
    nlapiLogExecution('DEBUG', 'Routing Review Status', JSON.stringify(status_review));

    var status_issues = nlapiGetFieldValue('custevent_lp_status_issues');
    nlapiLogExecution('DEBUG', 'Routing Issues Status', JSON.stringify(status_issues));

    if (status_review === '2' && (status_issues === '' || status_issues === null || status_issues === '2') && agent !== 'Order Management') {
        nlapiLogExecution('DEBUG', 'Route Ticket', true);

        var search = {
            "filters" : [
                new nlobjSearchFilter('groupname', null, 'is', ["Order Management"])
            ],
            "columns" : [
                new nlobjSearchColumn('internalid', null),
                new nlobjSearchColumn('groupname', null),
                new nlobjSearchColumn('grouptype', null),
                new nlobjSearchColumn('owner', null)
            ]
        };

        var group = nlapiSearchRecord('entitygroup', null, search.filters, search.columns);

        if (group) {
            nlapiLogExecution('DEBUG', 'Order Management Group', group[0].getId());
            nlapiSetFieldValue('assigned', group[0].getId());
        }
    }
}

function lp_ticketReady(status_review, Status_issues)
{

}
/*
function lp_getInboxManagementEntity()
{
    var filters = new Array();
    filters[0] = new nlobjSearchFilter('groupname', null, 'is', 'Order Management');

    var columns = new Array();
    columns[0] = new nlobjSearchColumn('internalid');
    columns[1] = new nlobjSearchColumn('groupname';
    columns[2] = new nlobjSearchColumn('grouptype');
    columns[3] = new nlobjSearchColumn('owner');

    var group = nlapiSearchRecord('entitygroup', null, filters, columns);

    return group;
}
*/

function setForm(event)
{
    if (event == 'edit') {
        var profile = nlapiGetFieldText('profile');
        var form = nlapiGetFieldText('customform');

        if (profile == 'Orders') {
            if (form != 'LP Order Ticket') {
                nlapiSetFieldText('customform', 'LP Order Ticket');
                nlapiLogExecution('DEBUG', 'Customer Form for Ticket Changed to:', nlapiGetFieldText('customform'));
            }
        } else if (profile == 'Customer Care') {
            if (form != 'LP Customer Care Ticket') {
                nlapiSetFieldText('customform', 'LP Customer Care Ticket');
                nlapiLogExecution('DEBUG', 'Customer Form for Ticket Changed to:', nlapiGetFieldText('customform'));
            }
        }
    }
}