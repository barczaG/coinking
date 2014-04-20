define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/home/payModalTemplate.html',
	], function($, _, Backbone, payModalTemplate){

		var View = Backbone.View.extend({


			initialize:function(options){
				var that=this;
				this.setElement($(".modal-container"));
				
				this.render();

			},

			events:{
				"click #pay-submit":"newKing",
				"click #pay-emulate":"emulate"
			},

			//Emulate payment for easier testing
			emulate:function(e){
				var that = this;
				$.getJSON('/app/emulatePayment',{kingId:that.paymentData.kingId,value:that.paymentData.price},function(data){
					$(e.target).button('loading');
				})
			},
			
			//Register the new king
			newKing:function(e){
				var that=this;
				that.paymentPending=false;
				that.paymentFinished=false;
				$(e.target).button('loading');
				$.post('/app/registerKing',$("#pay-form").serialize(),function(data){
					that.paymentData=data;
					that.kingId=data.kingId;
					//Show transaction details
					$('#pay-amount').text(data.price);
					$('#pay-adr').text(data.address);
					$('#pay-adr-img').attr('src',data.qr);
					$('.pay-step1').slideUp('normal',function(){
						$('.pay-step2').slideDown('normal');
					});
					$(e.target).button('reset');
					poll();
				})

				//Long polling function for real time payment status
				function poll(){
					$.ajax({ url: "/app/paymentstatus",
						data:{kingId:that.kingId}, 
						success: function(data){

							//Handle pending status
							if(data.status=="pending"){
								//On the first confirmation we go to step3
								if(!that.paymentPending){
									$('.pay-step2').slideUp('normal',function(){
										$('.pay-step3').slideDown('normal');
									});
								}
								//Update confirmations
								$('#pay-confirmations').text(data.confirmations);
								that.paymentPending=true;
							}
							
							//If we are finished go to step4 then reload the app
							if(data.status=="finished"){
								$('.pay-step3').slideUp('normal',function(){
									$('.pay-step4').slideDown('normal');
								});
								setTimeout(function(){
									window.location.hash="";
									window.location.reload();
									//window.app.router.navigate('',{trigger:true});								
								},3*1000);
								that.paymentFinished=true;
							}
							

						}, 
						dataType: "json",
						//Long polling handling 
						complete: function(){
							if(!that.paymentFinished){
								poll();
							}
						}, 
						timeout: 30000 
					});
				};
			},
			

			render: function(){

				var data = {
					_: _ 
				};

				//var compiledTemplate = _.template( poiTemplate, data );
				var compiledTemplate=payModalTemplate;
				this.$el.html(compiledTemplate);
				$('.modal').modal({backdrop:'static',keyboard:false});
				$('.modal').on('hidden.bs.modal', function () {
					window.app.router.navigate('');
				})

			}

		});

return View;

});




