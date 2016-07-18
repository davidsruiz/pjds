Object.prototype.assignAttr = function (obj) {for (var attrname in obj) { this[attrname] = obj[attrname] }};
Object.prototype.size = function (obj) {return Object.keys(this).length};

// helpers
var log = m => console.log(m);
