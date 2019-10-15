var t_refine = {
    'columns': [
        new nlobjSearchColumn('internalid'),
        new nlobjSearchColumn('externalid'),
        new nlobjSearchColumn('name'),
        new nlobjSearchColumn('description'),
    ]
};
var t = nlapiSearchRecord('notetype', null, null, t_refine.columns);

data.note_types = [];

if (t) {
    t.forEach( function (type) {
        data.note_types.push(type);
    });
}