function job_send_to_lpflow (event) {

    var record = nlapiLoadRecord('salesorder', nlapiGetRecordId());

    var action = nlapiGetFieldValue('custbody_lp_lpflow_action');
    nlapiLogExecution('DEBUG', )
    var status_inventory = record.getFieldValue('custbody_lp_status_stock');

    nlapiLogExecution('DEBUG', 'Inventory Status Text', nlapiGetFieldText('custbody_lp_status_stock'));
    nlapiLogExecution('DEBUG', 'Inventory Status Value', status_inventory);

    if ((event == 'create' || action == 3) && (status_inventory != 2)) {
        var company = nlapiLoadConfiguration('companyinformation');
        var id_account = company.getFieldValue('companyid');

        nlapiLogExecution('DEBUG', 'Company Account ID', id_account);

        if (record) {
            var customer = nlapiLoadRecord('customer', record.getFieldValue('entity'));
            nlapiLogExecution('DEBUG', 'Customer', JSON.stringify(customer));

            var job = {
                'id' : record.getId(),
                'ref_number' : record.getFieldValue('tranid'),
                'order_number' : record.getFieldValue('otherrefnum'),
                'record' : record,
                'customer' : customer,
                'jobdocs' : lpGetJobDocs( record )
            };

            var domain = null;

            if (id_account == '4976131_SB1') {
                domain = 'https://lpflow.ngrok.io/ns/jobs/add';
            } else if (id_account == '4976131') {
                domain = 'https://lpflow.leprechaunpromotions.com/ns/jobs/add';
            }

            var response = nlapiRequestURL(domain, JSON.stringify(job), {'Accept' : 'application/json', 'Content-Type' : 'application/json; charset=utf-8'});
            var data = response.getBody();
            nlapiLogExecution('DEBUG', 'LP Flow Response', data);

            if (data != 'Tunnel lpflow.ngrok.io not found') {
                data = JSON.parse(data);
            }

            record.setFieldValue('custbody_lp_status_artwork_setup', 2);
            nlapiSubmitRecord(record);

            nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
        }
    }
}

function devJobDocuments(event) {
    var record = nlapiLoadRecord('salesorder', nlapiGetRecordId());
    var count = record.getLineItemCount('recmachcustrecord_lp_job_document_job');
    nlapiLogExecution('DEBUG', 'Job Documents Count', count);

    for (var c = 1; c <= count; c++) {
        record.selectLineItem('recmachcustrecord_lp_job_document_job', c);
        var id = record.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'id');
        nlapiLogExecution('DEBUG', 'Job Document ID', id);

        var jobdoc = nlapiLoadRecord('customrecord_lp_job_documents', id);
        nlapiLogExecution('DEBUG', 'Job Document', JSON.stringify(jobdoc));

        var fileRecID1 = record.getCurrentLineItemValue('recmachcustrecord_lp_job_document_job', 'custrecord_lp_job_document_resource_ns');
        nlapiLogExecution('DEBUG', 'File Record ID from Job Document Sublist', fileRecID1);

        var fileRecID2 = jobdoc.getFieldValue('custrecord_lp_job_document_resource_ns');
        nlapiLogExecution('DEBUG', 'File Record ID from Job Document Record', fileRecID2);

        var fileRec = nlapiLoadFile(fileRecID1);
        fileRec.setIsOnline(true);
        nlapiSubmitFile(fileRec);
        nlapiLogExecution('DEBUG', 'Online Status for File Record ' + fileRecID1, fileRec.isOnline());
    }
}

function lpGetJobDocs ( job ) {

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