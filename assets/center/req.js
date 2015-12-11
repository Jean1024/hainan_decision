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
	function _getParam(param) {
		var str = '';
		for (var i in param) {
			str += '&'+i+'='+ encodeURIComponent(param[i]);
		}
		return str;
	}
	function request(url, method, params, callback){
		var arr_url = URL.parse(url);
		var is_noencrypt = params.noencrypt;
		delete params.noencrypt;
		var data_send = JSON.stringify(params);

		var req_opt = {
			hostname: arr_url.hostname,
			port: arr_url.port,
			method: method || 'POST',
			path: arr_url.pathname + (method == 'GET'? '?'+_getParam(params):''),
			headers: {
				'Content-Type': 'application/json',
				'charset': 'utf-8'
			}
		};
		var req = require('http').request(req_opt, function(res){
			// res.setEncoding('utf8');
			var content = '';
			res.on('data', function(chunk){
				content += chunk;
			}).on('end', function(){
				var data = content;
				if(!data){
					callback && callback(new Error('no data'));
				}else{
					try{
						var data_obj = JSON.parse(data);
						callback && callback(null, data_obj);
					}catch(e){
						return callback && callback(null, data);
					}
				}
			});
		}).on('error', function(e){
			callback && callback(e);
		});
		if (method == 'POST') {
			req.write(data_send);
		}
		req.end();
	}
	function require_old(url, params, callback){
		var arr_url = URL.parse(url);
		var is_noencrypt = params.noencrypt;
		delete params.noencrypt;
		var data_send = JSON.stringify(params);
		if(!is_noencrypt){
			data_send = encrypt(data_send);
		}

		var req_opt = {
			hostname: arr_url.hostname,
			port: arr_url.port,
			method: 'POST',
			path: arr_url.pathname ,
		};
		var req = require('http').request(req_opt, function(res){
			// res.setEncoding('utf8');
			var chunks =[], len = 0;
			res.on('data', function(chunk){
				chunks.push(chunk);
				len += chunk.length;
			}).on('end', function(){
				var bf = Buffer.concat(chunks, len);
				if(!is_noencrypt){
					var data = encrypt(bf);
				}else{
					var data = bf.toString();
				}

				if(!data){
					callback && callback(new Error('no data'));
				}else{
					try{
						var data_obj = JSON.parse(data);
						callback && callback(null, data_obj);
					}catch(e){
						return callback && callback(null, data);
					}
				}
			});
		}).on('error', function(e){
			callback && callback(e);
		});
		req.write(data_send);
		req.end();
	}
	request.get = function(url, params, callback) {
		request(url, 'GET', params, callback);
	}
	request.post = function(url, params, callback) {
		request(url, 'POST', params, callback);
	}
	window.request = request;
	window.require_old = require_old;
}();
