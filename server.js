/**
 * MelbJS Server.
 */

var port = process.env.PORT || 8001;

var app = require('./app');
app.listen(port);
console.log('Server runnning on port ' + port);

/*
// Using cluster for server management.
var cluster = require('cluster');
cluster('./app')
	.set('socket path', 'tmp/socks')
	.use(cluster.logger('tmp/logs'))
	.use(cluster.stats())
	.use(cluster.pidfiles('tmp/pids'))
	.use(cluster.cli())
	.use(cluster.repl(8888))
	.in('development').use(cluster.debug())
	.listen(port);
*/