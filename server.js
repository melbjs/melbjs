/**
 * MelbJS Server.
 */

var cluster = require('cluster');

var port = process.env.PORT || 8001;

// Using cluster for server management.
cluster('./app')
	.set('socket path', 'tmp/socks')
	.use(cluster.logger('tmp/logs'))
	.use(cluster.stats())
	.use(cluster.pidfiles('tmp/pids'))
	.use(cluster.cli())
	.use(cluster.repl(8888))
	.in('development').use(cluster.debug())
	.listen(port);