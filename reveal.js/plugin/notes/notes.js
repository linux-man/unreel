/**
 * Handles opening of and synchronization with the reveal.js
 * notes window.
 *
 * Handshake process:
 * 1. This window posts 'connect' to notes window
 *    - Includes URL of presentation to show
 * 2. Notes window responds with 'connected' when it is available
 * 3. This window proceeds to send the current presentation state
 *    to the notes window
 */
var RevealNotes = (function() {

    var connected = false;//cl

	function openNotes( notesFilePath ) {

		if( !notesFilePath ) {
			var jsFileLocation = document.querySelector('script[src$="notes.js"]').src;  // this js file path
			jsFileLocation = jsFileLocation.replace(/notes\.js(\?.*)?$/, '');   // the js folder path
			notesFilePath = jsFileLocation + 'notes.html';
		}

		var notesPopup = window.open( notesFilePath, 'reveal.js - Notes', 'width=1100,height=700' );

		/**
		 * Connect to the notes window through a postmessage handshake.
		 * Using postmessage enables us to work in situations where the
		 * origins differ, such as a presentation being opened from the
		 * file system.
		 */
		function connect() {
			// Keep trying to connect until we get a 'connected' message back
			var connectInterval = setInterval( function() {
				var timings = [];//cl
				var defaultTiming = Reveal.getConfig().defaultTiming;
				if (defaultTiming == undefined || defaultTiming == null) timings = null;
				else {
					var slides = Reveal.getSlides();
					for ( var i in slides ) {
						var slide = slides[i];
						var timing = defaultTiming;
						if( slide.hasAttribute( 'data-timing' )) {
							var t = slide.getAttribute( 'data-timing' );
							timing = parseInt(t);
							if( isNaN(timing) ) {
								console.warn("Could not parse timing '" + t + "' of slide " + i + "; using default of " + defaultTiming);
								timing = defaultTiming;
							}
						}
						timings.push(timing);
					}//cl
				}

				notesPopup.postMessage( JSON.stringify( {
					namespace: 'reveal-notes',
					type: 'connect',
					url: window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search,
					state: Reveal.getState(),
					timings: timings,//cl
					slidePastCount: Reveal.getSlidePastCount(),//cl
					defaultTiming: Reveal.getConfig().defaultTiming//cl
				} ), '*' );
			}, 500 );

			window.addEventListener( 'message', function( event ) {
				var data = JSON.parse( event.data );
				if( data && data.namespace === 'reveal-notes' && data.type === 'disconnected' ) connected = false;//cl
				if( data && data.namespace === 'reveal-notes' && data.type === 'connected' ) {
					clearInterval( connectInterval );
					connected = true;//cl
					onConnected();
				}
			} );
		}

		/**
		 * Posts the current slide data to the notes window
		 */
		function post( event ) {

			var slideElement = Reveal.getCurrentSlide(),
				notesElement = slideElement.querySelector( 'aside.notes' ),
				fragmentElement = slideElement.querySelector( '.current-fragment' );

			var messageData = {
				namespace: 'reveal-notes',
				type: 'state',
				notes: '',
				markdown: false,
				whitespace: 'normal',
				state: Reveal.getState(),
				slidePastCount: Reveal.getSlidePastCount()//cl
			};

			// Look for notes defined in a slide attribute
			if( slideElement.hasAttribute( 'data-notes' ) ) {
				messageData.notes = slideElement.getAttribute( 'data-notes' );
				messageData.whitespace = 'pre-wrap';
			}

			// Look for notes defined in a fragment
			if( fragmentElement ) {
				var fragmentNotes = fragmentElement.querySelector( 'aside.notes' );
				if( fragmentNotes ) {
					notesElement = fragmentNotes;
				}
				else if( fragmentElement.hasAttribute( 'data-notes' ) ) {
					messageData.notes = fragmentElement.getAttribute( 'data-notes' );
					messageData.whitespace = 'pre-wrap';

					// In case there are slide notes
					notesElement = null;
				}
			}

			// Look for notes defined in an aside element
			if( notesElement ) {
				messageData.notes = notesElement.innerHTML;
				messageData.markdown = typeof notesElement.getAttribute( 'data-markdown' ) === 'string';
			}

			notesPopup.postMessage( JSON.stringify( messageData ), '*' );

		}

		/**
		 * Called once we have established a connection to the notes
		 * window.
		 */
		function onConnected() {

			// Monitor events that trigger a change in state
			Reveal.addEventListener( 'slidechanged', post );
			Reveal.addEventListener( 'fragmentshown', post );
			Reveal.addEventListener( 'fragmenthidden', post );
			Reveal.addEventListener( 'overviewhidden', post );
			Reveal.addEventListener( 'overviewshown', post );
			Reveal.addEventListener( 'paused', post );
			Reveal.addEventListener( 'resumed', post );

			// Post the initial state
			post();

		}

		connect();

	}

	if( !/receiver/i.test( window.location.search ) ) {

		// If the there's a 'notes' query set, open directly
		if( window.location.search.match( /(\?|\&)notes/gi ) !== null ) {
			openNotes();
		}

		// Open the notes when the 's' key is hit
		document.addEventListener( 'keydown', function( event ) {
			// Disregard the event if the target is editable or a
			// modifier is present
		var activeElementIsCE = document.activeElement && document.activeElement.contentEditable !== 'inherit';//cl
  		var activeElementIsInput = document.activeElement && document.activeElement.tagName && /input|textarea/i.test( document.activeElement.tagName );
  		var activeElementIsNotes = document.activeElement && document.activeElement.className && /speaker-notes/i.test( document.activeElement.className);

      if( activeElementIsCE || activeElementIsInput || activeElementIsNotes || (event.shiftKey && event.keyCode !== 32) || event.altKey || event.ctrlKey || event.metaKey ) return;

			// Disregard the event if keyboard is disabled
			if ( Reveal.getConfig().keyboard === false ) return;

			if( event.keyCode === 83 && !connected) {//cl
				event.preventDefault();
				openNotes();
			}
		}, false );

		// Show our keyboard shortcut in the reveal.js help overlay
		if( window.Reveal ) Reveal.registerKeyboardShortcut( 'S', 'Speaker notes view' );

	}

	return { open: openNotes };

})();
