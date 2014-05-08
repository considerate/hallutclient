var network = require('hallutnetwork');
var sht1x = require('sht1x');
var co = require('co');
var wait = require('co-wait');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json').toString());

co(function* () {
	var run = true;
	var client = network.open({
		port: config.port,
		host: config.host
	}, {
		data: function(type, data) {
			console.log('Server says', type, data);
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

		process.on('exit', function(code) {
			//Close all sensors on crash.
			sensor.close();
		});

		var interval = config.readInterval /* ms */;
		while(run) {
			var start = new Date();

			var temperature = yield sensor.measure(sht1x.TEMPERATURE);
			temperature = sht1x.convertToCelcius(temperature);
			yield client.write('temperature', {
				celcius: temperature
			});

			var elapsedTime = new Date() - start;
			if(elapsedTime < interval) {
				// elapsedTime + sleepTime should be equal to interval
				wait(interval - elapsedTime);
			} else if(elapsedTime > interval) {
				// TODO: Inform developer of too small interval value.
			} // else, don't do anything special...
		}
		yield sensor.close();
	});
})();





