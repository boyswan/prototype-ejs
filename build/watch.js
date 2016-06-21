const chokidar = require('chokidar');
const exec = require('child_process').exec;

const args = process.argv.slice(2);

const task = function() {
  exec(args.slice(1).join(' '), function(err, stdout, stderr) {
    if (err) return console.error(err);
    console.log(stdout);
  });
}
const watcher = chokidar.watch(args[0], { persistent: true });

watcher.on('ready', function() {
  watcher.on('add', task);
  watcher.on('change', task);
});

console.log('👁  👁')
