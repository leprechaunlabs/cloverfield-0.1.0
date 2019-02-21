/**
 *
 * @appliedtorecord employee
 */
function pageInit(type)
{
    alert('Hello World');

    nlapiSetFieldValue('cust')
}

function saveRecord_rlcs()
{
    var strType = nlapiGetRecordType();
    nlapiLogExecution('DEBUG', 'Record type of current record', strType);
    return true;
}