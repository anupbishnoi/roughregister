var fs = require('fs'),
  npm = require('npm'),
  path = require('path'),
  noop = function(){};

var log = console.log.bind(console);
var root = path.join(__dirname, '..');

npm.load(function () {
  log('starting');
  walkRecursive(root, function (dir) {
    log('npm install', dir);
    npm.prefix = dir;
    npm.commands.install(noop);
  });
});

function walkRecursive(dir, fn) {
  // log('entering', dir);
  if (dir !== root && fs.existsSync(path.join(dir, 'package.json'))) {
    fn(dir);
  }
  var subdirs = fs.readdirSync(dir);
  subdirs.forEach(function (subdir) {
    if (subdir[0] === '.') return;
    if (!fs.statSync(path.join(dir, subdir)).isDirectory()) return;
    if (subdir === 'node_modules') return;
    walkRecursive(path.join(dir, subdir), fn);
  });
}