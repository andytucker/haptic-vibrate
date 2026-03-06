/**
 * WP Haptic Vibrate – Public JavaScript
 *
 * Reads the wpHapticPublic configuration injected by PHP and attaches
 * event listeners that trigger vibration (or debug feedback) on matching
 * elements according to the admin-defined rules.
 *
 * No dependencies – pure vanilla ES5 for maximum compatibility.
 */
/* global wpHapticPublic */
(function () {
	'use strict';

	// Safety guard in case the localized object wasn't output.
	if ( typeof wpHapticPublic === 'undefined' ) { return; }

	var rules     = wpHapticPublic.rules     || [];
	var debugMode = wpHapticPublic.debugMode || false;

	// ── Vibration support detection ──────────────────────────────────────
	var canVibrate = !! (
		navigator.vibrate      ||
		navigator.webkitVibrate ||
		navigator.mozVibrate    ||
		navigator.msVibrate
	);

	// Normalise the method name.
	if ( ! navigator.vibrate && navigator.webkitVibrate ) {
		navigator.vibrate = navigator.webkitVibrate.bind( navigator );
	} else if ( ! navigator.vibrate && navigator.mozVibrate ) {
		navigator.vibrate = navigator.mozVibrate.bind( navigator );
	} else if ( ! navigator.vibrate && navigator.msVibrate ) {
		navigator.vibrate = navigator.msVibrate.bind( navigator );
	}

	// ── AudioContext (lazy, for debug mode) ──────────────────────────────
	var _audioCtx = null;
	function getAudioContext() {
		if ( ! _audioCtx ) {
			try {
				_audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) { /* unavailable */ }
		}
		return _audioCtx;
	}

	/**
	 * Play a tone burst matching the vibration pattern.
	 *
	 * @param {number[]} pattern Array of ms values.
	 */
	function playDebugAudio( pattern ) {
		var ctx = getAudioContext();
		if ( ! ctx ) { return; }

		var now    = ctx.currentTime;
		var offset = 0;

		pattern.forEach( function ( ms, idx ) {
			if ( idx % 2 === 0 ) {
				var osc  = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.connect( gain );
				gain.connect( ctx.destination );
				osc.type            = 'sine';
				osc.frequency.value = 440;
				gain.gain.setValueAtTime( 0.25, now + offset / 1000 );
				gain.gain.exponentialRampToValueAtTime(
					0.0001,
					now + ( offset + ms ) / 1000
				);
				osc.start( now + offset / 1000 );
				osc.stop(  now + ( offset + ms ) / 1000 );
			}
			offset += ms;
		} );
	}

	/**
	 * Apply a CSS ripple class to the element for the duration of the pattern.
	 *
	 * @param {Element} el      Target element.
	 * @param {number[]} pattern Vibration pattern.
	 */
	function playDebugVisual( el, pattern ) {
		var total = pattern.reduce( function ( a, b ) { return a + b; }, 0 );
		el.classList.add( 'haptic-debug-ripple' );
		setTimeout( function () {
			el.classList.remove( 'haptic-debug-ripple' );
		}, Math.max( total, 300 ) );
	}

	/**
	 * Fire the pattern on the given element.
	 *
	 * @param {Element}  el      The element that was interacted with.
	 * @param {number[]} pattern The vibration pattern.
	 */
	function triggerHaptic( el, pattern ) {
		if ( ! pattern || pattern.length === 0 ) { return; }

		if ( canVibrate ) {
			navigator.vibrate( pattern );
		} else if ( debugMode ) {
			playDebugAudio( pattern );
			playDebugVisual( el, pattern );
		}
	}

	// ── Attach event listeners ──────────────────────────────────────────
	rules.forEach( function ( rule ) {
		if ( ! rule.selectors || rule.selectors.length === 0 ) { return; }

		var combined = rule.selectors.join( ', ' );
		var pattern  = rule.pattern  || [ 200 ];
		var trigger  = rule.trigger  || 'click';

		// Use event delegation from document.body so dynamically inserted
		// elements are also covered.
		document.body.addEventListener( trigger, function ( e ) {
			// Walk up the DOM to see if the event target matches the selector.
			var el = e.target;
			while ( el && el !== document.body ) {
				try {
					if ( el.matches( combined ) ) {
						triggerHaptic( el, pattern );
						return;
					}
				} catch (err) { /* invalid selector */ }
				el = el.parentElement;
			}
		}, { passive: true } );
	} );

}());
