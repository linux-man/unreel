/*****************************************************************
** Author: Asvin Goel, goel@telematique.eu
**
** csv2chart.js is a plugin for reveal.js allowing to integrate
** Chart.js in reveal.js
**
** Version: 0.1
**
** License: MIT license (see LICENSE.md)
**
******************************************************************/

var RevealChart = window.RevealChart || (function(){
	function parseJSON(str) {
	    var json;
	    try {
        	json = JSON.parse(str);
	    } catch (e) {
        	return null;
    		}
            return json;
	}

	/*
	* Recursively merge properties of two objects
	*/
	function mergeRecursive(obj1, obj2) {

	  for (var p in obj2) {
	    try {
	      // Property in destination object set; update its value.
	      if ( obj2[p].constructor==Object ) {
	        obj1[p] = mergeRecursive(obj1[p], obj2[p]);

	      } else {
	        obj1[p] = obj2[p];

	      }

	    } catch(e) {
	      // Property in destination object not set; create it and set its value.
	      obj1[p] = obj2[p];

	    }
	  }

	  return obj1;
	}


	function createChart(canvas, CSV, comments) {
		canvas.chart = null;
		var ctx = canvas.getContext("2d");
		var chartOptions = { responsive: true };
		var chartData = { labels: null, datasets: []};
		if ( comments !== null ) for (var j = 0; j < comments.length; j++ ){
			comments[j] = comments[j].replace(/<!--/,'');
			comments[j] = comments[j].replace(/-->/,'');
			var config = parseJSON(comments[j]);
			if ( config ) {
				if ( config.data ) {
					mergeRecursive( chartData, config.data);
				}
				if ( config.options ) {
					mergeRecursive( chartOptions, config.options);
				}
			}
		}

		var lines = CSV.split('\n').filter(function(v){return v!==''});
		// if labels are not defined, get them from first line
		if ( chartData.labels === null && lines.length > 0 ) {
			chartData.labels = lines[0].split(',');
			chartData.labels.shift();
			lines.shift();
		}
		// get data values
		for (var j = 0; j < lines.length; j++ ){
			if (chartData.datasets.length <= j) chartData.datasets[j] = {};
			chartData.datasets[j].data =  lines[j].split(','); //.filter(function(v){return v!==''});
			chartData.datasets[j].label = chartData.datasets[j].data[0];
			chartData.datasets[j].data.shift();
			for (var k = 0; k < chartData.datasets[j].data.length; k++ ){
				chartData.datasets[j].data[k] = Number(chartData.datasets[j].data[k]);
			}
		}

		// add chart options
		var config = chartConfig[canvas.getAttribute("data-chart")];
		if ( config ) {
			for (var j = 0; j < chartData.datasets.length; j++ ){
				for (var attrname in config) {
					if ( !chartData.datasets[j][attrname]  ) {
						chartData.datasets[j][attrname] = config[attrname][j%config[attrname].length];
					}
				}
			}
		}

		canvas.chart = new Chart(ctx, { type: canvas.getAttribute("data-chart"), data: chartData, options: chartOptions });

	}

	var initializeCharts = function(el){//cl
		var parentEl = el || document;
		// Get all canvases
		var canvases;
		canvases = parentEl.querySelectorAll("div[data-chart]");//cl
		if(canvases.length > 0) {
			parentEl.querySelectorAll("canvas[data-chart]").forEach((e) => {e.remove();});
			canvases.forEach((e) => {
				e.style.display = "none";
				let d = document.createElement('canvas');
				let attrs = e.attributes
				for(let i = attrs.length - 1; i >= 0; i--) d.setAttribute(attrs[i].name, attrs[i].value);
				d.style.display = "block";
				if(!d.hasAttribute("width")) d.setAttribute("width", d.style.width.replace("px", ""));
				if(!d.hasAttribute("height")) d.setAttribute("height", d.style.height.replace("px", ""));
				d.innerHTML = e.innerHTML;
				e.parentNode.insertBefore(d, e);
			})
		}
		canvases = parentEl.querySelectorAll("canvas[data-chart]");//cl
		for (var i = 0; i < canvases.length; i++ ){
			var json = canvases[i].innerHTML.trim().replace(/\n/g, "");
			if(parseJSON(json)) createChart(canvases[i], "", [json]);//cl
			else {
				var CSV = canvases[i].innerHTML.trim();
				var comments = CSV.match(/<!--[\s\S]*?-->/g);
				CSV = CSV.replace(/<!--[\s\S]*?-->/g,'').replace(/^\s*\n/gm, "")
				if ( ! canvases[i].hasAttribute("data-chart-src") ) {
					createChart(canvases[i], CSV, comments);
				}
				else {
					var canvas = canvases[i];
					var xhr = new XMLHttpRequest();
					xhr.onload = function() {
						if (xhr.readyState === 4) {
							createChart(canvas, xhr.responseText, comments);
						}
						else {
							console.warn( 'Failed to get file ' + canvas.getAttribute("data-chart-src") +". ReadyState: " + xhr.readyState + ", Status: " + xhr.status);
						}
					};

					xhr.open( 'GET', canvas.getAttribute("data-chart-src"), false );
					try {
						xhr.send();
					}
					catch ( error ) {
						console.warn( 'Failed to get file ' + canvas.getAttribute("data-chart-src") + '. Make sure that the presentation and the file are served by a HTTP server and the file can be found there. ' + error );
					}
				}

			}
		}
	}

	// check if chart option is given or not
	var chartConfig = Reveal.getConfig().chart || {};

	// set global chart options
	var config = chartConfig["defaults"];
	if ( config ) {
		mergeRecursive(Chart.defaults, config);
	}

	Reveal.addEventListener('ready', function(){
		initializeCharts();
		Reveal.addEventListener('slidechanged', function(){
			initializeCharts(Reveal.getCurrentSlide());//cl
			/*var canvases = Reveal.getCurrentSlide().querySelectorAll("canvas[data-chart]");
			for (var i = 0; i < canvases.length; i++ ){
				if ( canvases[i].chart ){
					// bug redraw canvas - animation doesn't work here
					canvases[i].chart.render();
				}
			}*/

		});
	});
	return {initalizeCharts: initializeCharts};//cl
})();
