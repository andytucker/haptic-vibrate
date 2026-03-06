(function () {
	'use strict';

	var Haptic = window.WPHapticCore || null;
	var MAX_PULSE_WIDTH = 44;
	// Keep this above the delayed synthetic click window so touch input on Android
	// fires haptics immediately without double-triggering on the follow-up click.
	var PRESS_DEBOUNCE_MS = 450;
	var PRESETS = {
		light: [10],
		notification: [50, 50, 100],
		double_tap: [100, 60, 100],
		heartbeat: [100, 100, 300, 600],
		success: [100, 50, 200],
		warning: [30, 30, 30],
		error: [300, 100, 300, 100, 300]
	};
	var audioContext = null;

	function $(selector) {
		return document.querySelector(selector);
	}

	function $all(selector) {
		return Array.prototype.slice.call(document.querySelectorAll(selector));
	}

	function getAudioContext() {
		if (!audioContext) {
			try {
				audioContext = new (window.AudioContext || window.webkitAudioContext)();
			} catch (error) {
				audioContext = null;
			}
		}

		return audioContext;
	}

	function parsePatternString(raw) {
		var parts = String(raw || '').split(',');
		var pattern = [];

		parts.forEach(function (part) {
			var value = parseInt(part.trim(), 10);
			if (isFinite(value) && value > 0) {
				pattern.push(value);
			}
		});

		return pattern.length ? pattern : [200];
	}

	function getPatternByName(name) {
		return PRESETS[name] ? PRESETS[name].slice() : [200];
	}

	function resolveCurrentRulePattern() {
		var preset = $('#demo-preset').value;
		if (preset === 'custom') {
			return parsePatternString($('#demo-custom-pattern').value);
		}

		return getPatternByName(preset);
	}

	function totalDuration(pattern) {
		return pattern.reduce(function (sum, value) {
			return sum + value;
		}, 0);
	}

	function renderPatternBadge(pattern) {
		var wrap = $('#demo-pattern-badge');
		var max = Math.max.apply(null, pattern.concat([600]));
		wrap.innerHTML = '';

		pattern.forEach(function (ms, index) {
			var pulse = document.createElement('span');
			var width = Math.max(6, Math.round((ms / max) * MAX_PULSE_WIDTH));
			pulse.className = 'demo-pattern-badge__pulse' + (index % 2 ? ' demo-pattern-badge__pause' : '');
			pulse.style.width = width + 'px';
			wrap.appendChild(pulse);
		});
	}

	function playDebugAudio(pattern) {
		var ctx = getAudioContext();
		var now;
		var offset = 0;

		if (!ctx) {
			return false;
		}

		now = ctx.currentTime;

		pattern.forEach(function (ms, index) {
			if (index % 2 === 0) {
				var osc = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.type = 'sine';
				osc.frequency.value = 440;
				gain.gain.setValueAtTime(0.22, now + offset / 1000);
				gain.gain.exponentialRampToValueAtTime(0.0001, now + (offset + ms) / 1000);
				osc.start(now + offset / 1000);
				osc.stop(now + (offset + ms) / 1000);
			}

			offset += ms;
		});

		return true;
	}

	function addRipple(element, duration) {
		if (!element) {
			return;
		}

		element.classList.remove('is-ripple');
		void element.offsetWidth;
		element.classList.add('is-ripple');

		window.setTimeout(function () {
			element.classList.remove('is-ripple');
		}, Math.max(duration, 700));
	}

	function setStatus(kind, message) {
		var status = $('#demo-status');
		status.className = 'demo-status';
		if (kind) {
			status.classList.add(kind);
		}
		status.textContent = message;
	}

	/**
	 * Bind immediate touch/pen input while suppressing the follow-up click event
	 * that many mobile browsers dispatch for the same interaction.
	 *
	 * @param {Element} element Target control.
	 * @param {Function} handler Handler invoked for the interaction.
	 */
	function bindPressInteraction(element, handler) {
		var lastPressAt = 0;

		if (!element || typeof handler !== 'function') {
			return;
		}

		if (window.PointerEvent) {
			element.addEventListener('pointerdown', function (event) {
				if (event.pointerType === 'mouse') {
					return;
				}

				lastPressAt = Date.now();
				handler(event);
			}, {
				passive: true
			});
		} else {
			element.addEventListener('touchstart', function (event) {
				lastPressAt = Date.now();
				handler(event);
			}, {
				passive: true
			});
		}

		element.addEventListener('click', function (event) {
			if ((Date.now() - lastPressAt) < PRESS_DEBOUNCE_MS) {
				return;
			}

			handler(event);
		});
	}

	function triggerPattern(pattern, options) {
		var debugMode = $('#demo-debug-mode').checked;
		var duration = totalDuration(pattern);
		var supported = Haptic && typeof Haptic.vibrate === 'function' && Haptic.vibrate(pattern);

		options = options || {};

		if (supported) {
			setStatus('is-success', 'Pattern fired on this device: [' + pattern.join(', ') + '] ms');
		} else if (debugMode) {
			playDebugAudio(pattern);
			setStatus('is-info', 'Debug mode simulated the pattern with ripple/audio: [' + pattern.join(', ') + '] ms');
		} else {
			setStatus('is-error', 'No haptic support detected here. Turn on Desktop Debug Mode to preview the result.');
		}

		if (options.rippleTarget) {
			addRipple(options.rippleTarget, duration);
		}
		if (options.secondaryRippleTarget) {
			addRipple(options.secondaryRippleTarget, duration);
		}
	}

	function updateRuleBuilderUI() {
		var preset = $('#demo-preset').value;
		var customWrap = $('#demo-custom-wrap');
		var selectorValue = $('#demo-selector').value || '.cta-button';
		$('#demo-rule-target').textContent = selectorValue + ' example';
		customWrap.style.display = preset === 'custom' ? '' : 'none';
		renderPatternBadge(resolveCurrentRulePattern());
	}

	function updatePluginClassUI() {
		var className = ($('#demo-plugin-class').value || 'haptic-vibrate').replace(/^\.+/, '');
		var isEnabled = $('#demo-use-plugin-class').checked;
		var chipRow = document.querySelector('.demo-chip-row');
		$('#demo-class-chip-name').textContent = className;
		if (chipRow) {
			chipRow.classList.toggle('is-disabled', !isEnabled);
		}
	}

	function handleDemoButton(source) {
		var pattern;

		if (source === 'rule-builder') {
			pattern = resolveCurrentRulePattern();
			triggerPattern(pattern, {
				rippleTarget: $('#demo-rule-target')
			});
			return;
		}

		if (source === 'plugin-class') {
			if (!$('#demo-use-plugin-class').checked) {
				setStatus('is-info', 'The plugin class example is currently turned off. Enable it to simulate class-based targeting.');
				return;
			}
			pattern = resolveCurrentRulePattern();
			triggerPattern(pattern, {
				rippleTarget: $('#demo-plugin-target')
			});
			return;
		}

		if (source === 'debug-mode') {
			pattern = resolveCurrentRulePattern();
			triggerPattern(pattern, {
				rippleTarget: $('#demo-debug-preview')
			});
		}
	}

	function handleRuleTargetPress() {
		triggerPattern(resolveCurrentRulePattern(), {
			rippleTarget: $('#demo-rule-target')
		});
	}

	function handlePluginTargetPress() {
		if (!$('#demo-use-plugin-class').checked) {
			setStatus('is-info', 'The plugin class example is currently turned off. Enable it to simulate class-based targeting.');
			return;
		}

		triggerPattern(resolveCurrentRulePattern(), {
			rippleTarget: $('#demo-plugin-target')
		});
	}

	function bindEvents() {
		$('#demo-preset').addEventListener('change', updateRuleBuilderUI);
		$('#demo-custom-pattern').addEventListener('input', function () {
			renderPatternBadge(resolveCurrentRulePattern());
		});
		$('#demo-selector').addEventListener('input', updateRuleBuilderUI);
		$('#demo-plugin-class').addEventListener('input', updatePluginClassUI);
		$('#demo-use-plugin-class').addEventListener('change', function () {
			updatePluginClassUI();
			setStatus('', this.checked ? 'Plugin class targeting is enabled in the example.' : 'Plugin class targeting is disabled in the example.');
		});
		$('#demo-debug-mode').addEventListener('change', function () {
			setStatus('', this.checked ? 'Desktop Debug Mode is on. Test buttons will use ripple/audio fallback when needed.' : 'Desktop Debug Mode is off. Live tests will rely on native haptic support only.');
		});

		$all('.demo-test-btn').forEach(function (button) {
			bindPressInteraction(button, function () {
				handleDemoButton(button.getAttribute('data-demo-source'));
			});
		});

		$all('[data-demo-pattern]').forEach(function (button) {
			bindPressInteraction(button, function () {
				var pattern = getPatternByName(button.getAttribute('data-demo-pattern'));
				triggerPattern(pattern, {
					rippleTarget: button,
					secondaryRippleTarget: $('#demo-rule-target')
				});
				renderPatternBadge(pattern);
			});
		});

		bindPressInteraction($('#demo-rule-target'), handleRuleTargetPress);
		bindPressInteraction($('#demo-plugin-target'), handlePluginTargetPress);
	}

	updateRuleBuilderUI();
	updatePluginClassUI();
	bindEvents();
}());
