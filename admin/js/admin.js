/**
 * Haptic Vibrate – Admin JavaScript
 *
 * Handles:
 *  - Dynamic rule rows (add / remove / reorder via drag-and-drop)
 *  - Preset selector → custom pattern field visibility
 *  - Generated per-pattern class previews
 *  - Inline pattern tester (Web Vibration API + AudioContext fallback)
 *  - Standalone Pattern Tester card
 *  - Debug-mode toggle preview
 */

/* global hapticVibrateAdmin, WPHapticCore, jQuery */
(function ($) {
	'use strict';

	var MAX_PULSE_WIDTH  = 40;
	var MAX_PATTERN_MS   = 1000;
	var CLASS_PREFIX     = 'haptic-vibrate-';
	var Haptic = window.WPHapticCore || null;

	function getEffectivePattern( pattern ) {
		if ( Haptic && typeof Haptic.normalizePattern === 'function' ) {
			return Haptic.normalizePattern( pattern );
		}

		return Array.isArray( pattern ) ? pattern.slice() : [ pattern ];
	}

	function formatPatternText( pattern ) {
		return '[' + pattern.join( ', ' ) + '] ms';
	}

	function patternsMatch( first, second ) {
		return first.join( ',' ) === second.join( ',' );
	}

	function describeEffectivePattern( rawPattern, effectivePattern ) {
		if ( patternsMatch( rawPattern, effectivePattern ) ) {
			return formatPatternText( effectivePattern );
		}

		return formatPatternText( effectivePattern ) + ' (normalized from ' + formatPatternText( rawPattern ) + ')';
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
				osc.stop( now + ( offset + ms ) / 1000 );
			}
			offset += ms;
		} );
	}

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

	function triggerPattern( pattern, debugMode, $elements, intensity ) {
		var effectivePattern = getEffectivePattern( pattern );

		if ( effectivePattern.length === 0 ) { return; }

		if ( Haptic && Haptic.vibrate( effectivePattern, intensity ) ) {
			return;
		}

		if ( debugMode ) {
			playDebugAudio( effectivePattern );
			if ( $elements && $elements.length ) {
				playDebugVisual( $elements, effectivePattern );
			}
		}
	}

	function buildPatternBadge( pattern ) {
		var $badge = $( '<span class="haptic-pattern-badge" aria-hidden="true"></span>' );
		var total  = Math.max.apply( null, pattern ) || MAX_PATTERN_MS;

		pattern.forEach( function ( ms, idx ) {
			var width = Math.max( 4, Math.round( ( ms / total ) * MAX_PULSE_WIDTH ) );
			var $bar  = $( '<span class="haptic-pattern-badge__pulse"></span>' );
			$bar.css( { width: width + 'px' } );
			if ( idx % 2 !== 0 ) {
				$bar.css( { background: 'transparent', border: 'none' } );
			}
			$badge.append( $bar );
		} );

		return $badge;
	}

	function parsePatternString( str ) {
		var parts = ( str || '' ).split( ',' );
		var pattern = [];

		parts.forEach( function ( p ) {
			var v = parseInt( p.trim(), 10 );
			if ( v > 0 ) {
				pattern.push( v );
			}
		} );

		return pattern.length ? pattern : [ 200 ];
	}

	function getRowIndex( $row ) {
		var index = parseInt( $row.attr( 'data-index' ), 10 );

		return isNaN( index ) ? 0 : index;
	}

	function buildRuleClassName( preset, index ) {
		if ( preset === 'custom' ) {
			return CLASS_PREFIX + 'custom-' + ( index + 1 );
		}

		return CLASS_PREFIX + ( preset || 'single_short' );
	}

	function refreshClassPreview( $row ) {
		var preset = $row.find( '.haptic-rule__preset' ).val();
		var className = buildRuleClassName( preset, getRowIndex( $row ) );

		$row.find( '.haptic-rule__class-preview' ).val( className ).attr( 'value', className );
	}

	var $rulesList   = $( '#haptic-rules-list' );
	var $emptyNotice = $( '#haptic-rules-empty' );
	var ruleIndex    = 0;

	function refreshRuleIndex() {
		$rulesList.find( '.haptic-rule' ).each( function () {
			var idx = parseInt( $( this ).data( 'index' ), 10 );
			if ( ! isNaN( idx ) && idx >= ruleIndex ) {
				ruleIndex = idx + 1;
			}
		} );
	}

	function toggleEmptyNotice() {
		var hasRules = $rulesList.find( '.haptic-rule' ).length > 0;
		$emptyNotice.toggle( ! hasRules );
	}

	function resolveRowPattern( $row ) {
		var preset = $row.find( '.haptic-rule__preset' ).val();

		if ( preset === 'custom' ) {
			return parsePatternString( $row.find( '.haptic-rule__custom-pattern' ).val() );
		}

		if ( hapticVibrateAdmin.presets[ preset ] ) {
			return hapticVibrateAdmin.presets[ preset ].pattern;
		}

		return [ 200 ];
	}

	function resolveRowIntensity( $row ) {
		var $slider = $row.find( '.haptic-rule__intensity' );
		if ( $slider.length ) {
			return parseFloat( $slider.val() ) || 0.7;
		}
		return 0.7;
	}

	function updateIntensityFromPreset( $row ) {
		var preset = $row.find( '.haptic-rule__preset' ).val();
		var $slider = $row.find( '.haptic-rule__intensity' );
		var $label  = $row.find( '.haptic-rule__intensity-value' );
		var intensity;

		if ( hapticVibrateAdmin.presets[ preset ] && typeof hapticVibrateAdmin.presets[ preset ].intensity === 'number' ) {
			intensity = hapticVibrateAdmin.presets[ preset ].intensity;
		} else {
			intensity = 0.7;
		}

		if ( $slider.length ) {
			$slider.val( intensity );
		}
		if ( $label.length ) {
			$label.text( Math.round( intensity * 100 ) + '%' );
		}
	}

	function refreshRowBadge( $row ) {
		var pattern = getEffectivePattern( resolveRowPattern( $row ) );
		var $wrap   = $row.find( '.haptic-rule__preset' ).closest( '.haptic-field--preset' );

		$wrap.find( '.haptic-pattern-badge' ).remove();
		$wrap.append( buildPatternBadge( pattern ) );
		refreshClassPreview( $row );
	}

	function showInlineFeedback( $row, pattern ) {
		var $btn = $row.find( '.haptic-rule__test-btn' );
		var total = getEffectivePattern( pattern ).reduce( function ( a, b ) { return a + b; }, 0 );

		$btn.addClass( 'haptic-btn--loading' );
		setTimeout( function () {
			$btn.removeClass( 'haptic-btn--loading' );
		}, Math.max( total, 400 ) );
	}

	function syncRuleRows() {
		$rulesList.find( '.haptic-rule' ).each( function ( i ) {
			var $row = $( this );

			$row.attr( 'data-index', i );
			$row.find( '[name]' ).each( function () {
				var $field = $( this );
				$field.attr(
					'name',
					$field.attr( 'name' ).replace( /\[rules\]\[[^\]]+\]/, '[rules][' + i + ']' )
				);
			} );

			refreshRowBadge( $row );
		} );

		ruleIndex = $rulesList.find( '.haptic-rule' ).length;
	}

	function bindRuleRow( $row ) {
		refreshClassPreview( $row );

		$row.on( 'change', '.haptic-rule__preset', function () {
			var preset  = $( this ).val();
			var $custom = $row.find( '.haptic-field--custom' );
			$custom.toggleClass( 'haptic-hidden', preset !== 'custom' );
			updateIntensityFromPreset( $row );
			refreshRowBadge( $row );
		} );

		$row.on( 'input', '.haptic-rule__custom-pattern', function () {
			refreshRowBadge( $row );
		} );

		$row.on( 'change input', '.haptic-rule__selector', function () {
			refreshClassPreview( $row );
		} );

		$row.on( 'input', '.haptic-rule__intensity', function () {
			var val = parseFloat( $( this ).val() ) || 0;
			$row.find( '.haptic-rule__intensity-value' ).text( Math.round( val * 100 ) + '%' );
		} );

		$row.on( 'click', '.haptic-rule__remove-btn', function () {
			if ( window.confirm( hapticVibrateAdmin.i18n.confirmRemove ) ) {
				$row.remove();
				syncRuleRows();
				toggleEmptyNotice();
			}
		} );

		$row.on( 'click', '.haptic-rule__test-btn', function () {
			var pattern   = resolveRowPattern( $row );
			var intensity = resolveRowIntensity( $row );
			var debugMode = $( '#haptic-debug-mode' ).is( ':checked' );

			triggerPattern( pattern, debugMode, $( this ), intensity );
			showInlineFeedback( $row, pattern );
		} );
	}

	function addRuleRow() {
		var template = $( '#haptic-rule-template' ).html();
		var html = template.replace( /\{\{INDEX\}\}/g, ruleIndex );
		var $row = $( html );

		ruleIndex++;
		$emptyNotice.hide();
		$rulesList.append( $row );
		bindRuleRow( $row );
		syncRuleRows();

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
				var rect   = row.getBoundingClientRect();
				var midY   = rect.top + rect.height / 2;
				var parent = row.parentNode;

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
				syncRuleRows();
			}
		} );

		$rulesList.on( 'mousedown', '.haptic-rule__handle', function () {
			$( this ).closest( '.haptic-rule' ).attr( 'draggable', 'true' );
		} );

		$rulesList.on( 'mouseup', '.haptic-rule__handle', function () {
			$( this ).closest( '.haptic-rule' ).removeAttr( 'draggable' );
		} );
	}

	$( '#haptic-add-rule' ).on( 'click', function () {
		addRuleRow();
	} );

	$( '#haptic-debug-mode' ).on( 'change', function () {
		$( '#haptic-debug-preview' ).toggleClass( 'is-visible', this.checked );
	} );

	if ( $( '#haptic-debug-mode' ).is( ':checked' ) ) {
		$( '#haptic-debug-preview' ).addClass( 'is-visible' );
	}

	$( '#haptic-tester-preset' ).on( 'change', function () {
		$( '#haptic-tester-custom-wrap' ).toggle( this.value === 'custom' );
	} );

	$( '#haptic-tester-btn' ).on( 'click', function () {
		var $btn      = $( this );
		var $status   = $( '#haptic-tester-status' );
		var preset    = $( '#haptic-tester-preset' ).val();
		var customRaw = $( '#haptic-tester-custom' ).val();
		var debugMode = $( '#haptic-debug-mode' ).is( ':checked' );
		var pattern;

		if ( preset === 'custom' ) {
			pattern = parsePatternString( customRaw );
		} else if ( hapticVibrateAdmin.presets[ preset ] ) {
			pattern = hapticVibrateAdmin.presets[ preset ].pattern;
		} else {
			pattern = [ 200 ];
		}

		var effectivePattern = getEffectivePattern( pattern );
		var describedPattern = describeEffectivePattern( pattern, effectivePattern );

		if ( Haptic && Haptic.vibrate( effectivePattern, undefined ) ) {
			$status.removeClass( 'is-error is-info' ).addClass( 'is-success' ).text( '✓ Haptic fired: ' + describedPattern );
		} else if ( debugMode ) {
			playDebugAudio( effectivePattern );
			$status.removeClass( 'is-error is-success' ).addClass( 'is-info' ).text( '🔊 Debug: played audio for ' + describedPattern );
		} else {
			$status.removeClass( 'is-success is-info' ).addClass( 'is-error' ).text( '⚠ ' + hapticVibrateAdmin.i18n.noVibration );
		}

		$btn.addClass( 'haptic-btn--loading' );
		setTimeout( function () {
			$btn.removeClass( 'haptic-btn--loading' );
		}, Math.max( effectivePattern.reduce( function ( a, b ) { return a + b; }, 0 ), 500 ) );

		setTimeout( function () {
			$status.removeClass( 'is-success is-error is-info' ).text( '' );
		}, 5000 );
	} );

	refreshRuleIndex();
	initExistingRows();
	initDragAndDrop();
	toggleEmptyNotice();

}( jQuery ));
