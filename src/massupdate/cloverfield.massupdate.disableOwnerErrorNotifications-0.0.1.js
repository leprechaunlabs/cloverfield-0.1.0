function lpcloverDisableOwnerErrorNotifications (record_type, record_id)
{
    /*var recordScript = nlapiLoadRecord(record_type, record_id);
    recordScript.setFieldValue('notifyowner', 'F');
    nlapiSubmitRecord(recordScript);*/

    nlapiSubmitField('script', record_id, 'notifyowner', 'F');
}