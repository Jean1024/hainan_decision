!function(){
	var URL = require('url');
	var KEY = new Buffer('Crackers and the thief will suffer misfortune');
	function encrypt(str){
		str = new Buffer(str);
		var len_key = KEY.length;
		var result_code = [];
		var pos = 0;
		for(var i = 0, j = str.length; i<j; i++){
			var code = str[i] ^ KEY[pos];
			result_code.push(code);
			if(++pos == len_key){
				pos = 0;
			}
		}
		return new Buffer(result_code);
	}
	function request(url, params, callback){
		var arr_url = URL.parse(url);
		var is_noencrypt = params.noencrypt;
		delete params.noencrypt;
		var data_send = JSON.stringify(params);
		if(!is_noencrypt){
			data_send = encrypt(data_send);
		}
		
		// console.log(data_send);
		var req = require('http').request({
			hostname: arr_url.hostname,
			port: 80,
			method: 'POST',
			path: arr_url.pathname,
		}, function(res){
			// res.setEncoding('utf8');
			var chunks =[];
			res.on('data', function(chunk){
				chunks.push(chunk);
			}).on('end', function(){
				var buffer = Buffer.concat(chunks);
				if(!is_noencrypt){
					var data = encrypt(buffer);
				}else{
					var data = buffer.toString();
				}
				
				console.log(data.toString());
				if(!data){
					callback && callback(new Error('no data'));
				}else{
					try{
						var data_obj = JSON.parse(data);
						console.log(data_obj);
						callback && callback(null, data_obj);
					}catch(e){
						console.log(e);
						return callback && callback(null, data);
					}
					
				}
			});
		}).on('error', function(e){
			callback && callback(e);
		});
		console.log(data_send);
		req.write(data_send);
		req.end();
	}
	window.request = request;
}();