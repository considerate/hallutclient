var network = require('hallutnetwork');
var sht1x = require('sht1x');
var co = require('co');
var wait = require('co-wait');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json').toString());

co(function* () {
	var run = true;
	var client = yield network.open({
		port: config.port,
		host: config.host
	}, {
		data: function(type, data) {
			console.log('Server says', data);
		},
		close: function() {
			run = false;	
		}
	});

	sht1x.create(function* (sensor) {
		yield sensor.init({
			dataPin: 15,
			clockPin: 18
		});
		while(run) {
			var temperature = yield sensor.measure(sht1x.TEMPERATURE);
			temperature = sht1x.convertToCelcius(temperature);
			client.write('temperature', {
				celcius: temperature
			});
			wait(1000);
		}
		yield sensor.close();
	});
})();





