var path = require('path'),
  dirty = require('dirty');

var db = exports.db = dirty(path.join(__dirname, 'write.db'));

exports.find = function (key, fn) {
  var found;
  db.forEach(function (k, val) {
    if (key === k) {
      found = true;
      fn(null, val);
      return false;
    }
  });
  if (!found) fn(null, undefined);
};
