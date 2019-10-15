function lpcloverCreateNotificationEvent (notification)
{
    var _notification = nlapiCreateRecord('customrecord_lp_job_notifications');

    _notification.setFieldValue('custrecord_lp_notification_job', 184);
    _notification.setFieldValue('custrecord_lp_notification_type', 2);
    _notification.setFieldValue('custrecord_lp_notification_status', 1);

    nlapiSubmitRecord(_notification);
}