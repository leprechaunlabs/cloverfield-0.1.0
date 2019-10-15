function lpcloverSetInventoryStatus ()
{
    nlapiLogExecution('DEBUG', 'Inventory Status Event', 'Begin Inventory Status Inspection');
    var config = lpcloverGetJobConfig();

    var job = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());

    var updated = false;

    var items_total = job.getLineItemCount('item');

    var status_stock_current = job.getFieldValue('custbody_lp_status_stock');
    nlapiLogExecution('DEBUG', 'Current Inventory Status', job.getFieldText('custbody_lp_status_stock'));

    var status_stock_set = 'available';

    for (var i = 1; i <= items_total; i++) {
        if (job.getLineItemValue('item', 'quantitybackordered', i) > 0) {
            status_stock_set = 'issue';
            break;
        }
    }

    if (status_stock_set === 'available') {

        if (status_stock_current == null || status_stock_current === '') {
            job.setFieldValue('custbody_lp_status_stock', '1');
            updated = true;
        } else if (status_stock_current == '2') {
            job.setFieldValue('custbody_lp_status_stock', '3');
            config = lpcloverSetJobConfig(config,'action', '3');
            updated = true;
        }

    } else if (status_stock_set === 'issue' && status_stock_current !== '2') {

        job.setFieldValue('custbody_lp_status_stock', '2');
        updated = true;

        var task = nlapiCreateRecord('task');
        task.setFieldValue('custevent_lp_type_task', '2');

        task.setFieldValue('assigned', lpcloverGetAgent('inventory').getId());

        task.setFieldValue('company', job.getFieldValue('entity'));
        task.setFieldValue('transaction', job.getId());
        task.setFieldValue('title', 'Stock Issue Alert for Job ' + job.getFieldValue('tranid'));
        task.setFieldValue('message', 'A Stock Issue has been detected for Job ' + job.getFieldValue('tranid') + '. Please contact the Customer to discuss alternate options.' );

        nlapiSubmitRecord(task);

        try {
            var company = nlapiLoadConfiguration('companyinformation');
            var id_account = company.getFieldValue('companyid');
            var recipient = {};

            if (id_account == '4976131_SB1') {
                recipient.email = 'miquel@mobrazilliance.com';
                recipient.name = 'Brazilliance';
            } else if (id_account == '4976131') {
                recipient.email = job.getFieldValue('custbody_lp_email_approval');
                recipient.name = (job.getFieldText('entity')).slice(6);
            }

            var message = nlapiRequestURL(
                'https://mandrillapp.com/api/1.0/messages/send-template.json',
                JSON.stringify({
                    "key" : lpcloverConfig.services.mandrill.api_key,
                    "template_name" : "job-stock-issue-alert",
                    "template_content" : [
                        {
                            "name" : "reference-ids",
                            "content" : "Job " + job.getFieldValue('tranid') + " | PO " + job.getFieldValue('otherrefnum')
                        },
                    ],
                    "message" : {
                        "subject" : "Stock Issue Warning for Job " + job.getFieldValue('tranid') + " | PO " + job.getFieldValue('otherrefnum'),
                        "from_email" : "customercare@leprechaunpromotions.com",
                        "from_name" : "Leprechaun Promotions",
                        "to" : [
                            {
                                "email" : recipient.email,
                                "name" : recipient.name
                            }
                        ],
                        "headers" : {
                            "Reply-To" : "customercare@leprechaunpromotions.com"
                        },
                        "track_opens" : true,
                        "track_clicks" : true,
                        "preserve_recipients" : false,
                        "view_content_link" : true
                    }
                }),
                {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            );

            nlapiLogExecution('DEBUG', 'Mandrill Message Status', JSON.stringify(message.getBody()));
        } catch (e) {
            nlapiLogExecution('DEBUG', 'Error', JSON.stringify(e));
        }
    }

    lpCloverSaveJobConfig(config);

    if (updated) {
        nlapiLogExecution('DEBUG', 'Inventory Status Event', 'Update Inventory Status');
        nlapiSubmitRecord(job, true, true);
        nlapiLogExecution('DEBUG', 'Updated Inventory Status', job.getFieldText('custbody_lp_status_stock'));
    } else {
        nlapiLogExecution('DEBUG', 'Inventory Status Event', 'No Update Necessary. Status has not changed.');
    }
}

function lpcloverPostJob ( event )
{
    var config = lpcloverGetJobConfig();
    var action = null;
    var _job = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());

    if ( config.hasOwnProperty('action') ) {
        action = config.action;
    }

    if ((event == 'create' || action == 3) && (_job.getFieldValue('custbody_lp_status_stock') != 2)) {

        var job = {
            'id' : _job.getId(),
            'ref_number' : _job.getFieldValue('tranid'),
            'order_number' : _job.getFieldValue('otherrefnum'),
            'record' : _job,
            'job': _job,
            'customer' : nlapiLoadRecord('customer', _job.getFieldValue('entity')),
            'jobdocs' : lpcloverGetJobDocs( _job )
        };

        var response = nlapiRequestURL(
            lpcloverGetDomain(),
            JSON.stringify(job),
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

        _job.setFieldValue('custbody_lp_status_artwork_setup', 2);
        nlapiSubmitRecord(_job);
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

function lpcloverGetDomain ()
{
    var domain = null;
    var company = nlapiLoadConfiguration('companyinformation');
    var id_account = company.getFieldValue('companyid');

    if (id_account == '4976131_SB1') {
        domain = 'https://lpflow.ngrok.io/ns/jobs/add';
    } else if (id_account == '4976131') {
        domain = 'https://lpflow.leprechaunpromotions.com/ns/jobs/add';
    }

    return domain;
}

function lpcloverReloadJob ()
{
    // delete tmp config
    nlapiSetRedirectURL('RECORD', nlapiGetRecordType(), nlapiGetRecordId(), false);
}

function lpcloverGetJobConfig ()
{
    var _config = nlapiLoadFile('SuiteScripts/cloverfield/tmp/config.' + nlapiGetRecordId() + '.json');
    nlapiLogExecution('DEBUG', 'Sales Order Configuration', _config.getValue());

    return JSON.parse(_config.getValue());
}

function lpcloverSetJobConfig (config, setting, value)
{
    config[setting] = value;
    return config;
}

function lpCloverSaveJobConfig (config)
{
    var file = nlapiCreateFile('config.' + nlapiGetRecordId() + '.json', 'JSON', JSON.stringify(config));
    file.setFolder(lpcloverGetFolderJobConfigTemp().getId());
    nlapiSubmitFile(file);
}

function lpcloverAddJobConfig ()
{
    var config = {};

    if (nlapiGetFieldValue('custbody_lp_lpflow_action')) {
        config.action = nlapiGetFieldValue('custbody_lp_lpflow_action');
    }

    var file = nlapiCreateFile('config.' + nlapiGetRecordId() + '.json', 'JSON', JSON.stringify(config));
    file.setFolder(lpcloverGetFolderJobConfigTemp().getId());
    nlapiSubmitFile(file);
}

function lpcloverGetFolderJobConfigTemp () {
    var folder = null;
    var folder_name = 'tmp';
    var folder_cloverfield = lpcloverGetFolderCloverfield();

    var search_folder = {
        "filters" : [
            new nlobjSearchFilter('name', null, 'is', [folder_name]),
            new nlobjSearchFilter('parent', null, 'is', [folder_cloverfield.getId()])
        ],
        "columns" : [
            new nlobjSearchColumn('internalid')
        ]
    };

    folder = nlapiSearchRecord('folder', null, search_folder.filters, search_folder.columns);

    if (folder === null) {
        folder = nlapiCreateRecord('folder');
        folder.setFieldValue('name', folder_name);
        folder.setFieldValue('parent', folder_cloverfield.getId());
        nlapiSubmitRecord(folder);
    } else {
        folder = nlapiLoadRecord('folder', folder[0].getId());
    }

    return folder;
}

function lpcloverGetFolderCloverfield () {
    var folder = null;
    var folder_name = 'cloverfield';
    var folder_suitescripts = lpcloverGetFolderSuiteScripts();

    var search_folder = {
        "filters" : [
            new nlobjSearchFilter('name', null, 'is', [folder_name]),
            new nlobjSearchFilter('parent', null, 'is', [folder_suitescripts.getId()])
        ],
        "columns" : [
            new nlobjSearchColumn('internalid')
        ]
    };

    folder = nlapiSearchRecord('folder', null, search_folder.filters, search_folder.columns);

    if (folder === null) {
        folder = nlapiCreateRecord('folder');
        folder.setFieldValue('name', folder_name);
        folder.setFieldValue('parent', folder_suitescripts.getId());
        nlapiSubmitRecord(folder);
    } else {
        folder = nlapiLoadRecord('folder', folder[0].getId());
    }

    return folder;
}

function lpcloverGetFolderSuiteScripts () {
    var folder = null;
    var folder_name = 'SuiteScripts';

    var search_folder = {
        "filters" : [
            new nlobjSearchFilter('name', null, 'is', [folder_name]),
            new nlobjSearchFilter('istoplevel', null, 'is', ["T"])
        ],
        "columns" : [
            new nlobjSearchColumn('internalid')
        ]
    };

    folder = nlapiSearchRecord('folder', null, search_folder.filters, search_folder.columns);

    if (folder === null) {
        folder = nlapiCreateRecord('folder');
        folder.setFieldValue('name', folder_name);
        nlapiSubmitRecord(folder);
    } else {
        folder = nlapiLoadRecord('folder', folder[0].getId());
    }

    return folder;
}

function lpcloverGetAgent ( type )
{
    var types = {
        'inventory' : 'custentity_lp_rr_assign_stock'
    };

    var agent = null;

    var agents = lpcloverGetAgents( type );

    if (agents) {
        agent = agents[0].getId();
    } else {
        agents = lpcloverResetAgents( type );
        agent = agents[0].getId();
    }

    agent = nlapiLoadRecord('employee', agent);
    agent.setFieldValue(types[type], 'T');
    nlapiSubmitRecord(agent);

    return agent;
}

function lpcloverGetAgents ( type )
{
    var types = {
        'inventory' : 'custentity_lp_rr_assign_stock'
    };

    var search = {
        'filters' : [
            new nlobjSearchFilter('role', null, 'is', ['Customer Care']),
            new nlobjSearchFilter('issupportrole', 'role', 'is', ['T']),
            new nlobjSearchFilter('custentity_lp_rr_config_assign_available', null, 'is', ['T']),
            new nlobjSearchFilter(types[type], null, 'is', ['F']),
        ],
        'columns' : [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('firstname'),
            new nlobjSearchColumn('lastname')
        ]
    };

    agents = nlapiSearchRecord('employee', null, search.filters, search.columns);

    return agents;
}

function lpcloverResetAgents ( type )
{
    var types = {
        'inventory' : 'custentity_lp_rr_assign_stock'
    };

    var search = {
        "filters" : [
            new nlobjSearchFilter('role', null, 'is', ['Customer Care']),
            new nlobjSearchFilter('issupportrole', 'role', 'is', ['T']),
            new nlobjSearchFilter('custentity_lp_rr_config_assign_available', null, 'is', ['T']),
            new nlobjSearchFilter(types[type], null, 'is', ['T']),
        ],
        "columns" : [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('firstname'),
            new nlobjSearchColumn('lastname')
        ]
    };

    agents = nlapiSearchRecord('employee', null, search.filters, search.columns);

    if (agents) {
        for (var a = 0; a < agents.length; a++) {
            var agent = nlapiLoadRecord('employee', agents[a].getId());
            agent.setFieldValue(types[type], 'F');
            nlapiSubmitRecord(agent);
        }
    }

    return lpcloverGetAgents( type );
}