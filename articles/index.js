var path = require('path');
var fs = require('fs');

var articles = [];

var files = fs.readdirSync(__dirname).reverse();
files.forEach(function(file) {
	// Avoid filenames starting with . (e.g. .svn, etc).
	if (file != 'index.js' && file.indexOf('.') !== 0) {
		var article = require(path.join(__dirname, file));
		articles.push(article);
	}
});

// Sort articles using a custom sort, by `article.date`.

module.exports = articles;