(function () {
	'use strict';

	var Haptic = window.WPHapticCore || null;
	var MAX_PULSE_WIDTH = 40;
	var PRESS_DEBOUNCE_MS = 450;
	var CLASS_PREFIX = 'haptic-vibrate-';
	var PRESETS = {
		light: [10],
		medium: [20],
		heavy: [40],
		single_short: [200],
		single_long: [600],
		double_tap: [100, 60, 100],
		triple_tap: [100, 60, 100, 60, 100],
		heartbeat: [100, 100, 300, 600],
		buzz: [500],
		rumble: [200, 100, 200, 100, 200],
		notification: [50, 50, 100],
		success: [100, 50, 200],
		warning: [30, 30, 30],
		error: [300, 100, 300, 100, 300],
		custom: []
	};
	var audioContext = null;

	function $(selector, root) {
		return (root || document).querySelector(selector);
	}

	function $all(selector, root) {
		return Array.prototype.slice.call((root || document).querySelectorAll(selector));
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

	function getEffectivePattern(pattern) {
		if (Haptic && typeof Haptic.normalizePattern === 'function') {
			return Haptic.normalizePattern(pattern);
		}

		return Array.isArray(pattern) ? pattern.slice() : [pattern];
	}

	function formatPatternText(pattern) {
		return '[' + pattern.join(', ') + '] ms';
	}

	function patternsMatch(first, second) {
		return first.join(',') === second.join(',');
	}

	function describeEffectivePattern(rawPattern, effectivePattern) {
		if (patternsMatch(rawPattern, effectivePattern)) {
			return formatPatternText(effectivePattern);
		}

		return formatPatternText(effectivePattern) + ' (normalized from ' + formatPatternText(rawPattern) + ')';
	}

	function totalDuration(pattern) {
		return pattern.reduce(function (sum, value) {
			return sum + value;
		}, 0);
	}

	function buildRuleClassName(preset) {
		if (preset === 'custom') {
			return CLASS_PREFIX + 'custom-1';
		}

		return CLASS_PREFIX + (preset || 'single_short');
	}

	function renderPatternBadge(container, pattern) {
		var max = Math.max.apply(null, pattern.concat([600]));
		container.innerHTML = '';

		pattern.forEach(function (ms, index) {
			var pulse = document.createElement('span');
			var width = Math.max(4, Math.round((ms / max) * MAX_PULSE_WIDTH));
			pulse.className = 'haptic-pattern-badge__pulse' + (index % 2 ? ' haptic-pattern-badge__pause' : '');
			pulse.style.width = width + 'px';
			container.appendChild(pulse);
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

	function addRippleToElements(elements, duration) {
		elements.forEach(function (element) {
			addRipple(element, duration);
		});
	}

	function setStatus(kind, message) {
		var status = $('#demo-status');
		if (!status) {
			return;
		}

		status.className = 'demo-status';
		if (kind) {
			status.classList.add(kind);
		}
		status.textContent = message;
	}

	function describeSupport() {
		if (!Haptic) {
			return {
				kind: 'is-info',
				message: 'The haptic core did not load, so the page is running as a visual preview only.'
			};
		}

		if (typeof Haptic.hasVibration === 'function' && Haptic.hasVibration()) {
			return {
				kind: 'is-success',
				message: 'Native vibration support detected. Demo tests should fire real haptics on this device.'
			};
		}

		if (typeof Haptic.hasIOSHapticFallback === 'function' && Haptic.hasIOSHapticFallback()) {
			return {
				kind: 'is-info',
				message: 'iOS Safari fallback detected. Effects may still be subtler than Android vibration.'
			};
		}

		return {
			kind: 'is-info',
			message: 'This browser does not expose web haptics here. Desktop Debug Mode will use ripple and audio feedback.'
		};
	}

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
			}, { passive: true });
		} else {
			element.addEventListener('touchstart', function (event) {
				lastPressAt = Date.now();
				handler(event);
			}, { passive: true });
		}

		element.addEventListener('click', function (event) {
			if ((Date.now() - lastPressAt) < PRESS_DEBOUNCE_MS) {
				return;
			}

			handler(event);
		});
	}

	function getCurrentRulePattern() {
		var preset = $('#demo-preset').value;

		if (preset === 'custom') {
			return parsePatternString($('#demo-custom-pattern').value);
		}

		return getPatternByName(preset);
	}

	function getSandboxMatches(selector) {
		var sandbox = $('#demo-sandbox');

		if (!selector) {
			return [];
		}

		try {
			return $all(selector, sandbox);
		} catch (error) {
			return null;
		}
	}

	function triggerPattern(pattern, options) {
		var effectivePattern = getEffectivePattern(pattern);
		var duration = totalDuration(effectivePattern);
		var debugMode = $('#demo-debug-mode').checked;
		var supported = Haptic && typeof Haptic.vibrate === 'function' && Haptic.vibrate(effectivePattern);
		var describedPattern = describeEffectivePattern(pattern, effectivePattern);

		options = options || {};

		if (supported) {
			setStatus('is-success', options.statusMessage || ('Pattern fired on this device: ' + describedPattern));
		} else if (debugMode) {
			playDebugAudio(effectivePattern);
			setStatus('is-info', options.statusMessage || ('Debug mode simulated the pattern with ripple/audio: ' + describedPattern));
		} else {
			setStatus('is-error', 'No haptic support detected here. Turn on Desktop Debug Mode to preview the result.');
		}

		if (options.primaryTarget) {
			addRipple(options.primaryTarget, duration);
		}
		if (options.targets && options.targets.length) {
			addRippleToElements(options.targets, duration);
		}
	}

	function updateRulePreview() {
		var selector = $('#demo-selector').value.trim();
		var preset = $('#demo-preset').value;
		var className = buildRuleClassName(preset);
		var pattern = getEffectivePattern(getCurrentRulePattern());
		var matches = getSandboxMatches(selector);
		var selectorToken = selector.replace(/^\./, '') || 'cta-button';

		$('#demo-generated-class').value = className;
		$('#demo-custom-wrap').classList.toggle('haptic-hidden', preset !== 'custom');
		renderPatternBadge($('#demo-pattern-badge'), pattern);
		$('#demo-generated-snippet').textContent = '<button class="' + className + ' ' + selectorToken + '">Buy now</button>';

		if (!selector) {
			$('#demo-selector-meta').textContent = 'Enter a selector to preview where this rule would apply.';
		} else if (matches === null) {
			$('#demo-selector-meta').textContent = 'That selector is invalid. Try something simple like .cta-button or .menu-link.';
		} else if (matches.length) {
			$('#demo-selector-meta').textContent = matches.length + ' sandbox element' + (matches.length === 1 ? '' : 's') + ' currently ' + (matches.length === 1 ? 'matches' : 'match') + ' this selector.';
		} else {
			$('#demo-selector-meta').textContent = 'No sandbox elements currently match this selector, but the rule is still valid.';
		}
	}

	function initRuleDemo() {
		$('#demo-preset').addEventListener('change', updateRulePreview);
		$('#demo-custom-pattern').addEventListener('input', updateRulePreview);
		$('#demo-selector').addEventListener('input', updateRulePreview);

		bindPressInteraction($('#demo-rule-test'), function () {
			var selector = $('#demo-selector').value.trim();
			var matches = getSandboxMatches(selector);
			var pattern = getCurrentRulePattern();
			var describedPattern = describeEffectivePattern(pattern, getEffectivePattern(pattern));

			if (matches === null) {
				setStatus('is-error', 'That selector is invalid, so the demo cannot test it against the sandbox.');
				return;
			}

			triggerPattern(pattern, {
				primaryTarget: $('#demo-rule-test'),
				targets: matches || [],
				statusMessage: matches && matches.length
					? 'Tested ' + describedPattern + ' against ' + matches.length + ' matching sandbox element' + (matches.length === 1 ? '' : 's') + '.'
					: 'Tested ' + describedPattern + '. No current sandbox elements match this selector.'
			});
		});
	}

	function initSandbox() {
		$all('.demo-target-card', $('#demo-sandbox')).forEach(function (card) {
			bindPressInteraction(card, function (event) {
				var target = event.currentTarget;
				var selector = $('#demo-selector').value.trim();
				var matches = getSandboxMatches(selector);
				var pattern = getCurrentRulePattern();

				if (!Array.isArray(matches) || matches.indexOf(target) === -1) {
					setStatus('is-info', 'This sample element does not match the current selector rule.');
					addRipple(target, 400);
					return;
				}

				triggerPattern(pattern, {
					primaryTarget: target,
					statusMessage: 'This element matches ' + selector + ' and fired ' + describeEffectivePattern(pattern, getEffectivePattern(pattern)) + '.'
				});
			});
		});
	}

	function initSidebarTester() {
		$('#demo-debug-mode').addEventListener('change', function () {
			$('#demo-debug-preview').classList.toggle('is-visible', this.checked);
			setStatus('', this.checked ? 'Desktop Debug Mode is on. The demo will use ripple and audio fallback when needed.' : 'Desktop Debug Mode is off. The demo now relies on native haptic support only.');
		});

		$('#demo-tester-preset').addEventListener('change', function () {
			$('#demo-tester-custom-wrap').classList.toggle('haptic-hidden', this.value !== 'custom');
		});

		bindPressInteraction($('#demo-tester-btn'), function () {
			var preset = $('#demo-tester-preset').value;
			var pattern = preset === 'custom' ? parsePatternString($('#demo-tester-custom').value) : getPatternByName(preset);
			var testerStatus = $('#demo-tester-status');
			var describedPattern = describeEffectivePattern(pattern, getEffectivePattern(pattern));

			triggerPattern(pattern, {
				primaryTarget: $('#demo-tester-btn')
			});

			testerStatus.className = 'haptic-tester-status is-info';
			testerStatus.textContent = 'Tester preview: ' + describedPattern;

			window.setTimeout(function () {
				testerStatus.className = 'haptic-tester-status';
				testerStatus.textContent = '';
			}, 5000);
		});
	}

	initRuleDemo();
	initSandbox();
	initSidebarTester();
	updateRulePreview();

	var support = describeSupport();
	setStatus(support.kind, support.message);
}());
