var request = require('request');
var priceStep=0.001;
var events = require('events'),
util = require('util');
var emitter=new events.EventEmitter;
var _self=module.exports = {


	_config: {},

	//Load the frontend app
	index:function(req,res){
		return res.view({_layoutFile:'../app.ejs'});
	},

	//Listking json for Homeview
	listKings:function(req,res){
		//Only list kings with confirmed payments
		King.find({status:"finished"}).sort("createdAt desc").exec(function(err,kings){
			if(err) throw err;
			res.send({
				currentPrice: (kings.length+1) * priceStep,
				kings:kings
			});
		})
	},

	//Long polling backend call
	//Todo change this to socket.io
	paymentStatus:function(req,res){
		var kingId=req.query.kingId;
		console.log(kingId+":pending");
		emitter.on(kingId+":pending",function(confirmations){
			res.send({status:"pending",confirmations:confirmations});
		})
		emitter.on(kingId+":finished",function(confirmations){
			res.send({status:"finished"});
		})
	},


	//This handles the block chain push request
	//TODO: Add some security ip checking etc
	bcCallback:function(req,res){
		console.log(req.query);
		if(req.query.secret !== "verysecret"){
			res.forbidden();
			return false;
		}
		async.waterfall([
			function(cb){
				King.findOne(req.query.king_id,function(err,king){
					if(!king.id){
						return res.send("Noking");
					}else{
						cb(err,king)
					}
				})
			},
			function(king,cb){
				var btc=parseInt(req.query.value)/100000000;
				if(btc != king.price) res.send({status:"Price not equals"});

				var confirm = parseInt(req.query.confirmations)
				if(req.query.confirmations < 6){
					King.update({
						id:req.query.king_id
					},{
						status:"pending",
						confirmations:confirm
					},function(err,king){
						if(err) throw err;
						console.log("Bc callback",king);
						console.log("emit",king[0].id+":pending");
						emitter.emit(king[0].id+":pending",confirm);
						res.send("pending");
					})

				}else{
					King.update({
						id:req.query.king_id
					},{
						status:"finished",
						confirmations:confirm
					},function(err,king){
						if(err) throw err;
						emitter.emit(king[0].id+":finished",confirm);
						console.log("Bc callback finished",king)
						res.send("*ok*");
					})
				}
			}
			])


},
//Emulate payment for easier testing
//Makes a new confirmation in every 3 seconds till 6 confirmations
emulatePayment:function(req,res){
	var confirmations=1;
	nextConfirm();

	function nextConfirm(){


		request({
			url:"http://takker.me:2337/app/bccallback",
			qs:{
				anonymous:"false",
				shared:"false",
				king_id:req.query.kingId,
				destination_address:"191VyNkgrdQ9mwsCwXanMMgkN8zuomJb34",
				confirmations:confirmations,
				test:"true",
				secret:"verysecret",
				value:req.query.value,
				transaction_hash:"46aeadd31d3f5c08d3c035b5c32f6bcb1c252ddc2be998c5881f9aa11eba748f"

			},
			json:true
		},function(error,response,body){
			if (!error && response.statusCode == 200) {
				res.send({status:"ok"});
				if(confirmations != 6){
					confirmations++;
					setTimeout(nextConfirm,3*1000);
				}
			}
		})
	}

},

//Here comes the king
registerKing:function(req,res){
		//Get the price
		async.waterfall([
			function(cb){
				_self.getCurrentPrice(function(price){
					cb(null,price)
				})
			},
			//Insert the new king
			function(price,cb){
				King.create({
					name: req.body.name,
					words: req.body.words,
					status:"notPaid",
					price:price
				}).done(function(err, king) {

					if (err) {
						throw(err);

					}else {

						console.log("King created:", king);
						cb(null,king);

					}
				});
			},
			function(king,cb){
				//Generate unique address for the transaction
				_self.generateAddress(king.id,function(data){
					console.log(data);
					//Generate qr code for the address
					_self.addressToQr(data.input_address,function(url){
						//Return the final stuff
						res.send({
							address:data.input_address,
							qr:url,
							price:king.price,
							kingId:king.id
						})
					})
				})
			}
			])
		
		
		

	},
	//Generate unique address using blochain api
	generateAddress:function(kingId,cb){
		request({
			url:"https://blockchain.info/api/receive",
			qs:{
				method:"create",
				address:"15cagx6SwWoTXbKgJzuPK5eGiD1ALtBK7j",
				callback:"http://takker.me:2337/app/bccallback?secret=verysecret&king_id="+kingId,
			},
			json:true
		},function(error,response,body){
			if (!error && response.statusCode == 200) {
				//console.log(body);
				//res.send({address:body.input_address});
				cb(body);
			}
		})
	},
	//Calculate the price to be the king, with every king the price incrased by 0.001 BTC
	getCurrentPrice:function(cb){
		King.find({status:"finished"}).exec(function(err,kings){
			if(err) throw err;
			cb((kings.length+1) * priceStep);
		})
	},

	
	//Making qrcode dataurl 
	addressToQr:function(address,cb){
		var QRCode = require('qrcode');
		//var address = "lol";
		QRCode.toDataURL(address,function(err,url){
			//res.send(url)
			cb(url);
		});
	}


};
