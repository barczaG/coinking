// Filename: router.js
define([
	'jquery',
	'underscore',
	'backbone',
	'views/home/HomeView',
	'views/home/PayModalView',
	], function($, _, Backbone,HomeView,PayModalView){
		var AppRouter = Backbone.Router.extend({
			routes: {
			// Define some URL routes
			'/login': 'showProjects',
			'pay': 'pay',

			// Default
			'*actions': 'defaultAction'
		}
	});

		var initialize = function(){
			var app_router = new AppRouter;
			window.app.router=app_router;
			console.log(window.app);
			//DEfault route
			app_router.on('route:defaultAction', function(actions){
				window.app.homeView = new HomeView();
				console.log('No route:', actions);
			});
			//Make pay dialog accessible from url
			app_router.on('route:pay', function(actions){
				if(!window.app.homeView){
					window.app.homeView = new HomeView({
						//Wait till homeview renders
						cb:function(){
							var orderView = new PayModalView();
						}
					});
				}
				else{
					var orderView = new PayModalView();
				}
				
			});

			Backbone.history.start();
		};
		return {
			initialize: initialize
		};
	});