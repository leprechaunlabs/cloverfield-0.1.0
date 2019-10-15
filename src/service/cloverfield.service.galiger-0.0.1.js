var LPCLV;
if (!LPCLV) { LPCLV = {}; }
if (!LPCLV.services) { LPCLV.services = {}; }

LPCLV.services.Galiger = {
    'init': function () {
        nlapiLogExecution('DEBUG', 'Cross Library Execution Test', 'This is a test to see if you can call scripts across libraries');
    }
};