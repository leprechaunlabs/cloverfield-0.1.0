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
    var response = {
        'status': null,
        'message': null
    };

    if ( approval.hasOwnProperty('job') && approval.job.hasOwnProperty('id') ) {
        try {
            job = nlapiLoadRecord('salesorder', approval.job.id );

            nlapiLogExecution('DEBUG', 'Job', JSON.stringify(job));

            if (approval.hasOwnProperty('revision') && approval.revision === false) {

                job.setFieldValue('custbody_lp_status_approval_request', 1);

            } else if (approval.hasOwnProperty('revision') && approval.revision) {

                job.setFieldValue('custbody_lp_status_approval_request', 2);

                var task = nlapiCreateRecord('task');
                task.setFieldValue('company', job.getFieldValue('entity'));
                task.setFieldValue('transaction', job.getId());
                task.setFieldValue('title', 'Revision Request for Job ' + job.getFieldValue('tranid'));
                task.setFieldValue('custevent_lp_type_task', '1');
                task.setFieldValue('message', approval.revision);
                nlapiSubmitRecord(task);
            }

            // Assumes if we've made it this far then Payment has been submitted
            if (job.getFieldValue('custbody_lp_status_payment') == '5') {
                job.setFieldValue('custbody_lp_status_payment', '3');
            }

            nlapiSubmitRecord(job);
            response.status = 'success';
            response.message = 'Job Review Response was successfully received by NetSuite.';

        } catch (e) {
            response.status = 'error';
            response.message = 'The submitted Job ID could not be found in NetSuite.';
        }
    } else {
        response.status = 'error';
        response.message = 'The Job Review data is missing critical data.';
    }

    return response;
}