function inspectRecord(event, form, request)
{
    if (request.getParameter('ticket')) {
        var record = nlapiGetNewRecord();
        var ticket = nlapiLoadRecord('supportcase', request.getParameter('ticket'));
        var customer = nlapiLoadRecord('customer', ticket.getFieldValue('company'));
        //var file = nlapiCreateFile(Date.now(), 'JSON', JSON.stringify(request));
        //file.setFolder(717);
        //nlapiSubmitFile(file);
        var status_strip = {
            "order" : {
                "color" : {
                    "background" : "lemonchiffon",
                    "text" : "black"
                },
                "text" : "New"
            },
            "artwork" : {
                "color" : {
                    "background" : "lemonchiffon",
                    "text" : "Pending"
                },
                "text" : "Pending"
            },
            "payment" : {
                "color" : {
                    "background" : "white",
                    "text" : "black"
                },
                "text" : null
            },
            "approval" : {
                "color" : {
                    "background" : "lemonchiffon",
                    "text" : "black"
                },
                "text" : "Pending"
            },
            "tracking" : {
                "color" : {
                    "background" : "lemonchiffon",
                    "text" : "black"
                },
                "text" : "Pending"
            }
        };

        nlapiLogExecution('DEBUG', 'Ticket', JSON.stringify(ticket));
        nlapiLogExecution('DEBUG', 'Customer', JSON.stringify(customer));

        record.setFieldValue('entity', customer.getId());
        record.setFieldValue('custbody_lp_job_ticket', ticket.getId());
        record.setFieldText('tobeemailed', ticket.getFieldValue('email'));

        // set Default Shipping Address
        var addresses_total = customer.getLineItemCount('addressbook');
        nlapiLogExecution('DEBUG', 'Total Addresses', addresses_total);

        for (var a = 1; a <= addresses_total; a++) {
            if (customer.getLineItemValue('addressbook', 'defaultshipping', a) == 'T') {
                record.setFieldValue('shipaddresslist', customer.getLineItemValue('addressbook', 'id', a));
            }
        }

        // set Payment
        //record.setFieldValue('terms', customer.getFieldValue('terms')); no need to set Terms because this is sourced from the Entity
        if (customer.getFieldText('terms') != 'Credit Card') {
            record.setFieldValue('custbody_lp_status_payment', 'T');
            status_strip.payment.color.background = 'seagreen';
            status_strip.payment.color.text = 'white';
            status_strip.payment.text = 'Received';
        } else {
            status_strip.payment.color.background = 'red';
            status_strip.payment.color.text = 'white';
            status_strip.payment.text = 'Credit Card';
        }

        status_strip.tracking.color.background = 'seagreen';
        status_strip.tracking.color.text = 'white';
        status_strip.tracking.text = '1ZX20W700391558819';

        nlapiLogExecution('DEBUG', 'Status Strip', JSON.stringify(status_strip));
    }
}
