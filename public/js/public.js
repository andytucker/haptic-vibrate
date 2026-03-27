/**
 * Haptic Vibrate – Public JavaScript
 *
 * Reads the hapticVibratePublic configuration injected by PHP and attaches
 * interaction listeners that trigger vibration (or debug feedback) on matching
 * elements according to the admin-defined rules.
 *
 * No dependencies – pure vanilla ES5 for maximum compatibility.
 */
/* global hapticVibratePublic, WPHapticCore */
(function () {
	'use strict';

	if ( typeof hapticVibratePublic === 'undefined' ) { return; }

	var rules     = hapticVibratePublic.rules     || [];
	var debugMode = hapticVibratePublic.debugMode || false;
	var PRESS_DEBOUNCE_MS = 450;
	var Haptic = window.WPHapticCore || null;
	var lastInteractionAt = 0;

	function getEffectivePattern( pattern ) {
		if ( Haptic && typeof Haptic.normalizePattern === 'function' ) {
			return Haptic.normalizePattern( pattern );
		}

		return Array.isArray( pattern ) ? pattern.slice() : [ pattern ];
	}

	var _audioCtx = null;
	function getAudioContext() {
		if ( ! _audioCtx ) {
			try {
				_audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) {}
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
	function triggerHaptic( el, pattern, intensity ) {
		var effectivePattern = getEffectivePattern( pattern );

		if ( ! effectivePattern || effectivePattern.length === 0 ) { return; }

		if ( Haptic && Haptic.vibrate( effectivePattern, intensity ) ) {
			return;
		}

		if ( debugMode ) {
			playDebugAudio( effectivePattern );
			playDebugVisual( el, effectivePattern );
		}
	}

	function shouldHandleEvent( event ) {
		if ( ! event ) {
			return false;
		}

		if ( 'keydown' === event.type ) {
			return 'Enter' === event.key || ' ' === event.key || 'Spacebar' === event.key;
		}

		if ( 'click' === event.type ) {
			return ( Date.now() - lastInteractionAt ) >= PRESS_DEBOUNCE_MS;
		}

		return true;
	}

	function markInteraction( event ) {
		if ( event && 'click' !== event.type ) {
			lastInteractionAt = Date.now();
		}
	}

	function findMatchingRule( target ) {
		var current = target;
		var ruleIndex;

		while ( current && current !== document.body ) {
			for ( ruleIndex = 0; ruleIndex < rules.length; ruleIndex++ ) {
				var rule = rules[ ruleIndex ];
				var combined;

				if ( ! rule.selectors || rule.selectors.length === 0 ) {
					continue;
				}

				combined = rule.selectors.join( ', ' );

				try {
					if ( current.matches( combined ) ) {
						return {
							element: current,
							rule: rule
						};
					}
				} catch (err) {}
			}

			current = current.parentElement;
		}

		return null;
	}

	function handleInteraction( event ) {
		var match;

		if ( ! shouldHandleEvent( event ) ) {
			return;
		}

		match = findMatchingRule( event.target );

		if ( ! match ) {
			return;
		}

		markInteraction( event );
		triggerHaptic( match.element, match.rule.pattern || [ 200 ], match.rule.intensity );
	}

	if ( window.PointerEvent ) {
		document.body.addEventListener( 'pointerdown', handleInteraction, { passive: true } );
	} else {
		document.body.addEventListener( 'touchstart', handleInteraction, { passive: true } );
		document.body.addEventListener( 'mousedown', handleInteraction, { passive: true } );
	}

	document.body.addEventListener( 'click', handleInteraction, { passive: true } );
	document.body.addEventListener( 'keydown', handleInteraction );

}());
