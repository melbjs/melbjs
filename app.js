/**
 * MelbJS App.
 */

var express = require('express'),
	stylus = require('stylus'),
	twitface = require('twitface'),
	lanyrd = require('lanyrd-scraper'),
	moment = require('moment');

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
// Start by scraping this month. We may need to add a month and rescrape it the event has already happened.
var scrapeDate = moment(),
	months = 'january february march april may june july august september october november december'.split(' '),
	eventData,
	nextEventData,
	lanyrdUrl,
	avatars = {};

var scrape = function() {
	lanyrdUrl = '/' + scrapeDate.year() + '/melbjs-' + months[scrapeDate.month()];
	
	var nextScrapeDate = moment(scrapeDate).add('months', 1),
		nextLanyrdUrl = '/' + nextScrapeDate.year() + '/melbjs-' + months[nextScrapeDate.month()];

	lanyrd.scrape(lanyrdUrl, function(err, data) {
		var melbJsDateAt10pm;

		if (data) {
			melbJsDateAt10pm = moment(new Date(data.startDate)).hours(22).toDate();

			if (new Date() < melbJsDateAt10pm) {
				eventData = parseEvent(data);
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

	lanyrd.scrape(nextLanyrdUrl, function(err, data) {
		nextEventData = parseEvent(data);
	});
};

var parseEvent = function(data) {
	data.speakers = data.speakers.filter(function(speaker){
		return speaker.twitterHandle !== undefined;
	}).map(function(speaker){
		return speaker.twitterHandle.toLowerCase();
	});

	data.sessions = data.sessions.filter(function(session){
		return session.title !== 'TBA';
	});

	loadAvatars(data.speakers);
	return data;
};

var loadAvatars = function(speakers) {
	twitface.load(speakers, 'reasonably_small', function(err, urls) {
		if (err) {
			return;
		}

		urls.forEach(function(url, i) {
			var speakerName = speakers[i];
			avatars[speakerName] = url;
		});
	});
};

// Scrape event details every 30 minutes
scrape();
setInterval(scrape, 1000 * 60 * 30);

// Routes

app.get('/', function(req, res) {
	res.render('index', {
		title: 'MelbJS',
		lanyrdUrl: lanyrdUrl,
		event: eventData,
		avatars: avatars
	});
});

app.get('/welcome', function(req, res) {
	res.render('welcome', {
		title: 'Welcome to MelbJS',
		event: eventData,
		nextEvent: nextEventData,
		avatars: avatars
	});
});

app.get('/scrape', function(req, res) {
	scrape();
	res.send('Refreshing event data from Lanyrd.');
});

module.exports = app;