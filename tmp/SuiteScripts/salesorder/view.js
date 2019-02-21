function setStatusDefaults(event)
{
    nlapiLogExecution('DEBUG', 'Transaction ID', nlapiGetFieldValue('tranid'));
    if (nlapiGetFieldValue('tranid') !== 'To Be Generated') {
        nlapiLogExecution('DEBUG', 'Artwork Setup Status', JSON.stringify(nlapiGetFieldValue('custbody_lp_artwork_setup_status')));
        nlapiSetFieldValue('custbody_lp_artwork_setup_status', 6);
        /*
        if (JSON.stringify(nlapiGetFieldValue('custbody_lp_artwork_setup_status')) == null) {
            record.setFieldValue('custbody_lp_artwork_setup_status', 6);
        }
        */

        //nlapiSubmitRecord(nlapiGetNewRecord(), true);
    }
}

function existingJob(event)
{
    nlapiLogExecution('DEBUG', 'Document Referrer', document.referrer);
}