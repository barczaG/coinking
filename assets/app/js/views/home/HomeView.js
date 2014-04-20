define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/home/homeTemplate.html',
	], function($, _, Backbone, homeTemplate,OrderView){

		var HomeView = Backbone.View.extend({
			el: $("body"),

			
			initialize:function(options){
				var that = this;
				//Get the kings from db
				$.getJSON('/app/listKings',function(data){
					if(data.kings.length == 0){
						data.kings.push({name:"There is no king currently",words:""});
					}
					that.render(data);
					//Fire callback
					if(options){
						options.cb();
					}
					
				})
			},

			events:{
				"click #pay":"pay"
			},

			pay:function(e){
				e.preventDefault();
				console.log(window.app);
				window.app.router.navigate('pay',{trigger:true});
			},

			

			render: function(data){
				var that = this;
				//Pass underscore to template
				var templateData = {
					_:_,
					data:data
				}

				var compiledTemplate = _.template( homeTemplate, templateData );
				//var compiledTemplate=homeTemplate;
				this.$el.html(compiledTemplate);

			},
			

		});

		return HomeView;

	});


