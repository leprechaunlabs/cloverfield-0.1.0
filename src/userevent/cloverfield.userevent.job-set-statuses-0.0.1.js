var statuses = {
    "artwork" : {
        "id" : "custbody_lp_status_artwork_setup",
        "value" : function (value) {
            var status_value = null;

            if (!value) {
                status_value = 6;
            }

            return status_value;
        }
    },
    "approval" : {
        "id" : "custbody_lp_status_approval_request",
        "value" : function (value) {
            var status_value = null;

            if (!value) {
                status_value = 3;
            }

            return status_value;
        }
    },
    "payment" : {
        "id" : "custbody_lp_status_payment",
        "value" : function (value) {
            var status_value = null;

            if (!value || (customer && value == 6) || (customer && customer.getFieldText('terms').includes('Net') && value != 1)) {
                if (!customer) {
                    status_value = 6;
                } else {
                    if (customer.getFieldText('terms').includes('Net')) {
                        status_value = 1;
                    } else if (customer.getFieldText('terms') == 'CC ON FILE') {
                        status_value = 2;
                    } else if (customer.getFieldText('terms') == 'Credit Card') {
                        status_value = 4;
                    }
                }
            }

            return status_value;
        }
    }
};

for (var status in statuses) {
    var status_current = nlapiGetFieldValue(statuses[status].id);
    status_value = statuses[status].value(status_current);

    if (status_value) {
        record.setFieldValue(statuses[status].id, status_value);
        updated = true;
    }
}