function getJob(jobinfo)
{
    nlapiLogExecution('DEBUG', 'RESTlet (Encoded)', JSON.stringify(jobinfo));

    if (jobinfo.id) {
        return nlapiLoadRecord('salesorder', jobinfo.id);
    }
}

function lpf_ReceiveArtSetupStatus ( status )
{
    nlapiLogExecution('DEBUG', 'Art Setup Status', JSON.stringify( status ));

    var job = null;

    if ( status.hasOwnProperty( 'job_id' ) ) {
        job = nlapiLoadRecord( 'salesorder', status.job_id );
    }

    if ( job ) {

        job.setFieldValue('custbody_lp_status_artwork_setup', 1);

        customer = nlapiLoadRecord('customer', job.getFieldValue('entity'));

        if (customer.getFieldValue('custentity_lp_approval_requirement') == 'F') {
            job.setFieldValue('custbody_lp_status_approval_request', 1);
            //job.setFieldValue('orderstatus', 'B');
        } else {
            job.setFieldValue('custbody_lp_status_approval_request', 4);
        }

        if (job.getFieldValue('custbody_lp_status_payment') == '4') {
            job.setFieldValue('custbody_lp_status_payment', '5');
        }

        if ( status.hasOwnProperty('urls') ) {

            if ( status.urls.hasOwnProperty( 'approval' ) ) {
                job.setFieldValue('custbody_lp_approval_request', status.urls.approval );
            }

            if ( status.urls.hasOwnProperty( 'proof' ) ) {
                job.selectNewLineItem('recmachcustrecord_lp_job_document_job');
                job.setCurrentLineItemValue('recmachcustrecord_lp_job_document_job','custrecord_lp_job_document_type', 3);
                job.setCurrentLineItemValue('recmachcustrecord_lp_job_document_job','custrecord_lp_job_document_resource_lpf', status.urls.proof);
                job.commitLineItem('recmachcustrecord_lp_job_document_job');
            }
        }

        nlapiSubmitRecord(job);

        return job;
    }
}

function lpf_ReceiveApprovalResponse( approval )
{
    nlapiLogExecution('DEBUG', 'Approval Response', JSON.stringify(approval));
    var job = null;

    if ( approval.hasOwnProperty('job') ) {
        job = nlapiLoadRecord('salesorder', approval.job.id );
    }

    if (job) {
        nlapiLogExecution('DEBUG', 'Job', JSON.stringify(job));

        if (approval.hasOwnProperty('revision') && Array.isArray(approval.revision) && approval.revision.length == 0) {

            job.setFieldValue('custbody_lp_status_approval_request', 1);
            if (job.getFieldValue('orderstatus') == 'A') {
                job.setFieldValue('orderstatus', 'B');
            }

        } else if (approval.hasOwnProperty('revision') && !Array.isArray(approval.revision)) {

            job.setFieldValue('custbody_lp_status_approval_request', 2);
            //job.setFieldValue('orderstatus', 'A');

            var task = nlapiCreateRecord('task');
            task.setFieldValue('company', job.getFieldValue('entity'));
            task.setFieldValue('transaction', job.getId());
            task.setFieldValue('title', 'Revision Request for Job ' + job.getFieldValue('tranid'));
            task.setFieldValue('custevent_lp_type_task', '1');

            var message = approval.revision;

            task.setFieldValue('message', message);

            nlapiSubmitRecord(task);
        }

        if (job.getFieldValue('custbody_lp_status_payment') == '5') {
            job.setFieldValue('custbody_lp_status_payment', '3');
        }

        nlapiSubmitRecord(job);
    }

    return job;
}