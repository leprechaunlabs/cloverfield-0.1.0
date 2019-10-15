function lpcloverRescheduleJob (job)
{
    nlapiLogExecution('DEBUG', 'Reschedule Job Data', JSON.stringify(job));

    var record = nlapiLoadRecord('salesorder', job.id);

    nlapiLogExecution('DEBUG', 'Record', JSON.stringify(record));

    record.setFieldValue('shipdate', job.dates.rescheduled.ship);
    record.setFieldValue('custbody_lp_shipping_arrival_date', job.dates.rescheduled.arrive);

    try {
        var company = nlapiLoadConfiguration('companyinformation');
        var id_account = company.getFieldValue('companyid');
        var recipient = {};

        if (id_account == '4976131_SB1') {
            recipient.email = 'miquel@mobrazilliance.com';
            recipient.name = 'Brazilliance';
        } else if (id_account == '4976131') {
            recipient.email = record.getFieldValue('custbody_lp_email_approval');
            recipient.name = (record.getFieldText('entity')).slice(6);
        }

        var message = nlapiRequestURL(
            'https://mandrillapp.com/api/1.0/messages/send-template.json',
            JSON.stringify({
                "key" : lpcloverConfig.services.mandrill.api_key,
                "template_name" : "proof-non-approval-ship-date-rescheduled",
                "template_content" : [
                    {
                        "name" : "reference-ids",
                        "content" : "Job " + record.getFieldValue('tranid') + " | PO " + record.getFieldValue('otherrefnum')
                    },
                    {
                        "name" : "ref-number",
                        "content" : record.getFieldValue('tranid')
                    },
                    {
                        "name" : "order-number",
                        "content" : record.getFieldValue('otherrefnum')
                    },
                    {
                        "name" : "ship-date-original",
                        "content" : job.dates.original.ship
                    },
                    {
                        "name" : "ship-date-rescheduled",
                        "content" : job.dates.rescheduled.ship
                    },
                    {
                        'name' : 'approval-url',
                        'content' : '<div style="line-height: 24px;"><a href="' + record.getFieldValue('custbody_lp_approval_request') + '" style="color: #ffffff; text-decoration: none;"><singleline>Click to View Proof</singleline></a>'
                    }
                ],
                "message" : {
                    "subject" : "SHIP DATE RESCHEDULED for Job " + record.getFieldValue('tranid') + " | PO " + record.getFieldValue('otherrefnum'),
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

    nlapiSubmitRecord(record);

    return {
        'success' : 'Job ' + record.getFieldValue('tranid') + ' was successfully rescheduled.',
        'mandrill' : message.getBody()
    };
}