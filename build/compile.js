var fs = require('fs');
var ejs = require('ejs');

var output = ejs.render(fs.readFileSync(__dirname + '/../src/views/layout.ejs', 'utf8'), {}, { filename: 'src/views/index' });
fs.writeFileSync(__dirname + '/../public/index.html', output);
