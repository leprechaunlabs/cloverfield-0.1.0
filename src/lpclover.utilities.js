function lpcloverPostJob ( event )
{
    var config = lpcloverGetJobConfig();
    var action = null;
    var job = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());

    if ( config.hasOwnProperty('action') ) {
        action = config.action;
    }

    if ((event == 'create' || action == 3) && (job.getFieldValue() != 2)) {
        var _job = {
            'id' : job.getId(),
            'ref_number' : job.getFieldValue('tranid'),
            'order_number' : job.getFieldValue('otherrefnum'),
            'record' : job,
            'customer' : nlapiLoadRecord('customer', job.getFieldValue('entity')),
            'jobdocs' : lpcloverGetJobDocs( job )
        };

        var company = nlapiLoadConfiguration('companyinformation');
        var id_account = company.getFieldValue('companyid');
        var domain = null;

        if (id_account == '4976131_SB1') {
            domain = 'https://lpflow.ngrok.io/ns/jobs/add';
        } else if (id_account == '4976131') {
            domain = 'https://lpflow.leprechaunpromotions.com/ns/jobs/add';
        }

        var response = nlapiRequestURL(
            domain,
            JSON.stringify(_job),
            {
                'Accept' : 'application/json',
                'Content-Type' : 'application/json; charset=utf-8'
            }
        );

        var data = response.getBody();
        nlapiLogExecution('DEBUG', 'LP Flow Response', data);

        if (data != 'Tunnel lpflow.ngrok.io not found') {
            data = JSON.parse(data);
        }

        job.setFieldValue('custbody_lp_status_artwork_setup', 2);
    }

}

function lpcloverGetJobDocs ( job )
{
    var count = job.getLineItemCount('recmachcustrecord_lp_job_document_job');
    var jobdocs = [];

    for (var c = 1; c <= count; c++) {
        job.selectLineItem('recmachcustrecord_lp_job_document_job', c);
        var id = job.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'id');
        nlapiLogExecution('DEBUG', 'Job Document ID', id);

        var jobdoc_id = job.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'custrecord_lp_job_document_resource_ns');
        nlapiLogExecution('DEBUG', 'File Record ID from Job Document Sublist', jobdoc_id);

        if (jobdoc_id) {
            var jobdoc = nlapiLoadFile(jobdoc_id);
            jobdoc.setIsOnline(true);
            nlapiSubmitFile(jobdoc);
            nlapiLogExecution('DEBUG', 'Online Status for File Record ' + jobdoc_id, jobdoc.isOnline());

            jobdocs.push({
                'id_file': jobdoc_id,
                'id_lp_job_document': id,
                'type_document': job.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'custrecord_lp_job_document_type'),
                'name': jobdoc.getName(),
                'url': jobdoc.getURL(),
                'type_format': jobdoc.getType(),
                'size': jobdoc.getSize(),
                'folder': jobdoc.getFolder()
            });
        }
    }

    return jobdocs;
}