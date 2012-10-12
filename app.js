/**
 * MelbJS App.
 */

var express = require('express');
var stylus = require('stylus');
var twitface = require('twitface');
var app = express.createServer();

// Configuration

app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());

	// Stylus (compiled css).
	app.use(stylus.middleware({
		src: __dirname + '/views',
		dest: __dirname + '/public',
	}));

	app.use(app.router);
	app.use(express.static(__dirname + '/public'));

	// Default to Jade templates.
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Load event data from Lanyrd
var lanyrd = require('lanyrd-scraper');
var moment = require('moment');

// Start by scraping this month. We may need to add a month and rescrape it the event has already happened.
var scrapeDate = moment();
var months = 'january february march april may june july august september october november december'.split(' ');

var eventData;
var lanyrdUrl;
var avatars = {};
var scrape = function() {
	lanyrdUrl = 'http://lanyrd.com/' + scrapeDate.year() + '/melbjs-' + months[scrapeDate.month()];

	lanyrd.scrape(lanyrdUrl, function(err, data) {
		var melbJsDateAt10pm;
		var speakers;

		if (data) {
			melbJsDateAt10pm = moment(new Date(data.startDate)).hours(22).toDate();

			if (new Date() < melbJsDateAt10pm) {
				// Create an array of speakers' Twitter handles
				speakers = data.speakers.filter(function(speaker){
						return speaker.twitterHandle !== undefined;
					}).map(function(speaker){
						return speaker.twitterHandle.toLowerCase();
					});

				// Load avatar URLs and populate the 'avatars' hash
				twitface.load(speakers, 'reasonably_small', function(err, urls) {
					if (err) {
						return;
					}

					urls.forEach(function(url, i) {
						var speakerName = speakers[i];
						avatars[speakerName] = url;
					});
				});

				eventData = data;
			} else {
				// Set the scrape date to the first of next month
				scrapeDate = moment().date(1).add('months', 1);
				scrape();
			}
		} else {
			// If scraping fails, try again in 30 seconds
			setTimeout(scrape, 1000 * 30);
		}
	});
}

// Scrape event details every 30 minutes
scrape();
setInterval(scrape, 1000 * 60 * 30);

// Routes

app.get('/', function(req, res) {
	//var articles = require('./articles');

	res.render('index', {
		title: 'MelbJS',
		lanyrdUrl: lanyrdUrl,
		event: eventData,
		avatars: avatars//,
		//articles: articles
	});
	
});

app.get('/scrape', function(req, res) {
	scrape();
	res.send('Refreshing event data from Lanyrd.');
});

module.exports = app;