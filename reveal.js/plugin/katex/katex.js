(function() {
	// Load KaTeX's JS and CSS
	loadKaTeX(function() {
		// Display math elements
		renderMathInElement(document.querySelector('.reveal'), {
			delimiters: [
				{left: '\\[', right: '\\]', display: true},
				{left: '$$', right: '$$', display: true},
				{left: '$', right: '$', display: false},
		        {left: '\\(', right: '\\)', display: false}
			]
		});
	});

	// Load KaTeX's script and style
	function loadKaTeX(callback) {
		// Document's head
		var head = document.getElementsByTagName('head')[0];

		// Load the CSS
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'plugin/katex/lib/katex.min.css';
		head.appendChild(link);

		// Check whether script is loaded
		function jsLoaded() {
			// Fire the callback only once
			if (callback !== null) {
				callback();
				callback = null;
			}
		}

		// Load the JS
		var script = document.createElement('script');
		script.type = 'text/javascript';

		script.onload = jsLoaded;

		script.onreadystatechange = function() {
			if (this.readyState == 'complete')
				jsLoaded();
		};

		script.src = 'plugin/katex/lib/katex.min.js';
		head.appendChild(script);
	}
})();
