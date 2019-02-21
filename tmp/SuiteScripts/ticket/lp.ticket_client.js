function tkt_openNewJobRecord(data)
{
    console.log('Hello World.');
    alert('A new way to create a new Job/Sales Order.');
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