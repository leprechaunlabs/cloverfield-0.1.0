function lpcloverGetJob ( job )
{
    var _job = null;
    var _customer = null;

    try {
        nlapiLogExecution('DEBUG', 'Job Information', JSON.stringify( job.id ));

        if (job.id) {
            _job = nlapiLoadRecord('salesorder', job.id);

            if (_job) {
                _customer = nlapiLoadRecord('customer', _job.getFieldValue('entity'));
            }
        }

        return {
            'job' : _job,
            'customer' : _customer
        }
    } catch ( e ) {

        nlapiLogExecution('DEBUG', 'Error Retrieving Job', JSON.stringify( e ));
        return {}
    }
}