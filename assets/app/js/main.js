
require.config({
	urlArgs: "bust=" + Math.random(),
	paths: {
		jquery: "//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min",
		underscore: '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
		backbone: '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min'
	}

});

require([

	'app',
	], function(App){
		App.initialize();
	});