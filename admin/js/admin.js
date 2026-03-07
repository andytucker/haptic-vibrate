/**
 * WP Haptic Vibrate – Admin JavaScript
 *
 * Handles:
 *  - Dynamic rule rows (add / remove / reorder via drag-and-drop)
 *  - Preset selector → custom pattern field visibility
 *  - Inline pattern tester (Web Vibration API + AudioContext fallback)
 *  - Standalone Pattern Tester card
 *  - Debug-mode toggle preview
 */

/* global wpHapticAdmin, WPHapticCore, jQuery */
(function ($) {
	'use strict';

	var MAX_PULSE_WIDTH  = 40;
	var MAX_PATTERN_MS   = 1000;
	var Haptic = window.WPHapticCore || null;

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
	 * Play a short tone burst matching the given pattern for desktop debug.
	 *
	 * @param {number[]} pattern Array of ms values (vibrate, pause, vibrate …).
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
				osc.type        = 'sine';
				osc.frequency.value = 440;
				gain.gain.setValueAtTime( 0.3, now + offset / 1000 );
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
	 * Fire a visual ripple on the element(s) matching the given selectors.
	 * Used for desktop debug feedback.
	 *
	 * @param {jQuery} $elements jQuery collection.
	 * @param {number[]} pattern Vibration pattern.
	 */
	function playDebugVisual( $elements, pattern ) {
		var total = pattern.reduce( function ( a, b ) { return a + b; }, 0 );
		$elements.each( function () {
			var $el = $( this );
			$el.addClass( 'haptic-debug-ripple' );
			setTimeout( function () {
				$el.removeClass( 'haptic-debug-ripple' );
			}, Math.max( total, 300 ) );
		} );
	}

	/**
	 * Attempt to vibrate; fall back to debug audio/visual if unavailable.
	 *
	 * @param {number[]} pattern      Vibration pattern.
	 * @param {boolean}  debugMode    Whether debug mode is active.
	 * @param {jQuery}   [$elements]  Elements to apply ripple to (optional).
	 */
	function triggerPattern( pattern, debugMode, $elements ) {
		if ( pattern.length === 0 ) { return; }

		if ( Haptic && Haptic.vibrate( pattern ) ) {
			return;
		}

		if ( debugMode ) {
			playDebugAudio( pattern );
			if ( $elements && $elements.length ) {
				playDebugVisual( $elements, pattern );
			}
		}
	}

	/**
	 * Render a tiny bar-chart representation of a vibration pattern.
	 *
	 * @param  {number[]} pattern Array of ms values.
	 * @return {jQuery}           Rendered badge element.
	 */
	function buildPatternBadge( pattern ) {
		var $badge = $( '<span class="haptic-pattern-badge" aria-hidden="true"></span>' );
		var total  = Math.max.apply( null, pattern ) || MAX_PATTERN_MS;

		pattern.forEach( function ( ms, idx ) {
			var width   = Math.max( 4, Math.round( ( ms / total ) * MAX_PULSE_WIDTH ) );
			var $bar    = $( '<span class="haptic-pattern-badge__pulse"></span>' );
			$bar.css( { width: width + 'px' } );
			if ( idx % 2 !== 0 ) {
				$bar.css( { background: 'transparent', border: 'none' } );
			}
			$badge.append( $bar );
		} );
		return $badge;
	}

	var $rulesList    = $( '#haptic-rules-list' );
	var $emptyNotice  = $( '#haptic-rules-empty' );
	var ruleIndex     = 0;

	/**
	 * Get the highest existing numeric index from the rendered rules so we can
	 * continue from it when adding new rows.
	 */
	function refreshRuleIndex() {
		$rulesList.find( '.haptic-rule' ).each( function () {
			var idx = parseInt( $( this ).data( 'index' ), 10 );
			if ( ! isNaN( idx ) && idx >= ruleIndex ) {
				ruleIndex = idx + 1;
			}
		} );
	}

	/** Show or hide the "no rules" placeholder. */
	function toggleEmptyNotice() {
		var hasRules = $rulesList.find( '.haptic-rule' ).length > 0;
		$emptyNotice.toggle( ! hasRules );
	}

	/**
	 * Attach live event listeners to a rule row.
	 *
	 * @param {jQuery} $row The rule row element.
	 */
	function bindRuleRow( $row ) {
		$row.on( 'change', '.haptic-rule__preset', function () {
			var $select  = $( this );
			var preset   = $select.val();
			var $custom  = $row.find( '.haptic-field--custom' );
			$custom.toggleClass( 'haptic-hidden', preset !== 'custom' );
			refreshRowBadge( $row );
		} );

		$row.on( 'input', '.haptic-rule__custom-pattern', function () {
			refreshRowBadge( $row );
		} );

		$row.on( 'click', '.haptic-rule__remove-btn', function () {
			if ( window.confirm( wpHapticAdmin.i18n.confirmRemove ) ) {
				$row.remove();
				toggleEmptyNotice();
			}
		} );

		$row.on( 'click', '.haptic-rule__test-btn', function () {
			var pattern = resolveRowPattern( $row );
			var debugMode = $( '#haptic-debug-mode' ).is( ':checked' );
			triggerPattern( pattern, debugMode, $( this ) );
			showInlineFeedback( $row, pattern, debugMode );
		} );
	}

	/**
	 * Parse the current preset/custom value of a row into a pattern array.
	 *
	 * @param  {jQuery}   $row
	 * @return {number[]}
	 */
	function resolveRowPattern( $row ) {
		var preset = $row.find( '.haptic-rule__preset' ).val();
		if ( preset === 'custom' ) {
			return parsePatternString( $row.find( '.haptic-rule__custom-pattern' ).val() );
		}
		if ( wpHapticAdmin.presets[ preset ] ) {
			return wpHapticAdmin.presets[ preset ].pattern;
		}
		return [ 200 ];
	}

	/** Parse a comma-separated ms string into an array of positive integers. */
	function parsePatternString( str ) {
		var parts = ( str || '' ).split( ',' );
		var pattern = [];
		parts.forEach( function ( p ) {
			var v = parseInt( p.trim(), 10 );
			if ( v > 0 ) { pattern.push( v ); }
		} );
		return pattern.length ? pattern : [ 200 ];
	}

	/**
	 * Render / update the pattern badge for a row.
	 *
	 * @param {jQuery} $row
	 */
	function refreshRowBadge( $row ) {
		var pattern = resolveRowPattern( $row );
		var $wrap   = $row.find( '.haptic-rule__preset' ).closest( '.haptic-field--preset' );
		$wrap.find( '.haptic-pattern-badge' ).remove();
		$wrap.append( buildPatternBadge( pattern ) );
	}

	/** Flash a tiny inline status message near the test button. */
	function showInlineFeedback( $row, pattern, debugMode ) {
		var $btn = $row.find( '.haptic-rule__test-btn' );
		$btn.addClass( 'haptic-btn--loading' );
		var total = pattern.reduce( function ( a, b ) { return a + b; }, 0 );
		setTimeout( function () {
			$btn.removeClass( 'haptic-btn--loading' );
		}, Math.max( total, 400 ) );
	}

	/** Add a fresh rule row from the template. */
	function addRuleRow() {
		var template = $( '#haptic-rule-template' ).html();
		var html = template.replace( /\{\{INDEX\}\}/g, ruleIndex );
		var $row = $( html );
		ruleIndex++;

		$emptyNotice.hide();
		$rulesList.append( $row );
		bindRuleRow( $row );
		refreshRowBadge( $row );

		$row[0].scrollIntoView( { behavior: 'smooth', block: 'nearest' } );
		$row.find( '.haptic-rule__selector' ).focus();
	}

	function initExistingRows() {
		$rulesList.find( '.haptic-rule' ).each( function () {
			bindRuleRow( $( this ) );
			refreshRowBadge( $( this ) );
		} );
	}

	var dragSrc = null;

	function initDragAndDrop() {
		$rulesList[0].addEventListener( 'dragstart', function ( e ) {
			var row = e.target.closest( '.haptic-rule' );
			if ( ! row ) { return; }
			dragSrc = row;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData( 'text/plain', '' );
			setTimeout( function () {
				row.classList.add( 'haptic-rule--dragging' );
			}, 0 );
		} );

		$rulesList[0].addEventListener( 'dragover', function ( e ) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			var row = e.target.closest( '.haptic-rule' );
			if ( row && row !== dragSrc ) {
				var rect    = row.getBoundingClientRect();
				var midY    = rect.top + rect.height / 2;
				var parent  = row.parentNode;
				if ( e.clientY < midY ) {
					parent.insertBefore( dragSrc, row );
				} else {
					parent.insertBefore( dragSrc, row.nextSibling );
				}
			}
		} );

		$rulesList[0].addEventListener( 'dragend', function () {
			if ( dragSrc ) {
				dragSrc.classList.remove( 'haptic-rule--dragging' );
				dragSrc = null;
				reindexRows();
			}
		} );

		$rulesList.on( 'mousedown', '.haptic-rule__handle', function () {
			var $row = $( this ).closest( '.haptic-rule' );
			$row.attr( 'draggable', 'true' );
		} );

		$rulesList.on( 'mouseup', '.haptic-rule__handle', function () {
			$( this ).closest( '.haptic-rule' ).removeAttr( 'draggable' );
		} );
	}

	/** Update data-index attributes after a reorder. */
	function reindexRows() {
		$rulesList.find( '.haptic-rule' ).each( function ( i ) {
			$( this ).attr( 'data-index', i );
		} );
	}

	$( '#haptic-add-rule' ).on( 'click', function () {
		addRuleRow();
	} );

	$( '#haptic-debug-mode' ).on( 'change', function () {
		var $preview = $( '#haptic-debug-preview' );
		$preview.toggleClass( 'is-visible', this.checked );
	} );

	if ( $( '#haptic-debug-mode' ).is( ':checked' ) ) {
		$( '#haptic-debug-preview' ).addClass( 'is-visible' );
	}

	$( '#haptic-tester-preset' ).on( 'change', function () {
		var $customWrap = $( '#haptic-tester-custom-wrap' );
		$customWrap.toggle( this.value === 'custom' );
	} );

	$( '#haptic-tester-btn' ).on( 'click', function () {
		var $btn        = $( this );
		var $status     = $( '#haptic-tester-status' );
		var preset      = $( '#haptic-tester-preset' ).val();
		var customRaw   = $( '#haptic-tester-custom' ).val();
		var debugMode   = $( '#haptic-debug-mode' ).is( ':checked' );

		var pattern;
		if ( preset === 'custom' ) {
			pattern = parsePatternString( customRaw );
		} else if ( wpHapticAdmin.presets[ preset ] ) {
			pattern = wpHapticAdmin.presets[ preset ].pattern;
		} else {
			pattern = [ 200 ];
		}

		if ( Haptic && Haptic.vibrate( pattern ) ) {
			$status
				.removeClass( 'is-error is-info' )
				.addClass( 'is-success' )
				.text( '✓ Haptic fired: [' + pattern.join( ', ' ) + '] ms' );
		} else if ( debugMode ) {
			playDebugAudio( pattern );
			$status
				.removeClass( 'is-error is-success' )
				.addClass( 'is-info' )
				.text( '🔊 Debug: played audio for [' + pattern.join( ', ' ) + '] ms' );
		} else {
			$status
				.removeClass( 'is-success is-info' )
				.addClass( 'is-error' )
				.text( '⚠ ' + wpHapticAdmin.i18n.noVibration );
		}

		$btn.addClass( 'haptic-btn--loading' );
		var total = pattern.reduce( function ( a, b ) { return a + b; }, 0 );
		setTimeout( function () {
			$btn.removeClass( 'haptic-btn--loading' );
		}, Math.max( total, 500 ) );

		setTimeout( function () {
			$status.removeClass( 'is-success is-error is-info' ).text( '' );
		}, 5000 );
	} );

	refreshRuleIndex();
	initExistingRows();
	initDragAndDrop();
	toggleEmptyNotice();

}( jQuery ));
