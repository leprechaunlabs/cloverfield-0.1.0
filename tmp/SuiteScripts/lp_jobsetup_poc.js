function beforeLoad_ues(type, form)
{
    //var companyField = form.getField('company');
    //var data = {
    //    company: companyField
    //};
    var id = nlapiGetRecordId();
    var customer = nlapiGetFieldValue('company');
    var ticket = '&apos;{&quot;id&quot;: ' + id + ',&quot;customer&quot;: ' + customer + '}&apos;';
    //var str_ticket = JSON.stringify(ticket);
    nlapiLogExecution('DEBUG', 'Ticket Details', ticket);
    form.setScript('customscript_lp_tickets_ui_buttons');
    //nlapiLogExecution('DEBUG', 'Button Function', 'buttonFunction("' + JSON.stringify(ticket) + '")');
    form.addButton('custpage_lp_create_job', 'Create New Job', 'createNewSalesOrderRecord(' + ticket + ')');
}

function createNewSalesOrderRecord(data)
{
    console.log('Hello World.');
    alert('You are going to create a Job/Sales Order.');
    var ticket = JSON.parse(data);
    console.log(ticket);
    //nlapiLogExecution('DEBUG', 'Ticket', JSON.stringify(nlapiGetNewRecord()));
    //var customer = nlapiGetFieldValue('company');
    //nlapiLogExecution('DEBUG', 'Ticket', ticket);
    //nlapiLogExecution('DEBUG', 'Company ID for New Sales Order', id);
    //var job = nlapiCreateRecord('salesorder', {recordmode: 'dynamic', entity: 328});
    //nlapiLogExecution('DEBUG', 'Job', JSON.stringify(job));
    //nlapiLogExecution('DEBUG', 'Job Entity (Value)', job.getFieldValue('entity'));
    //nlapiLogExecution('DEBUG', 'Job Entity (Text)', job.getFieldText('entity'));

    window.open(nlapiResolveURL('RECORD', 'salesorder', null, 'edit') + '&ticket=' + ticket.id);
}

function beforeSubmit_ues(type)
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

    if (company.toUpperCase().includes('TEST CUSTOMER')) {

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