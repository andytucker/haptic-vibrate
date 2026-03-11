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
		sos: [100, 30, 100, 30, 100, 200, 200, 30, 200, 30, 200, 200, 100, 30, 100, 30, 100],
		notification: [50, 50, 100],
		success: [100, 50, 200],
		warning: [30, 30, 30],
		error: [300, 100, 300, 100, 300],
		custom: []
	};

	var audioContext = null;
	var dragSource = null;
	var ruleIndex = 0;

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

	function buildRuleClassName(preset, index) {
		if (preset === 'custom') {
			return CLASS_PREFIX + 'custom-' + (index + 1);
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
				message: 'Haptic core did not load. The interface still works as a visual walkthrough, but patterns cannot fire.'
			};
		}

		if (typeof Haptic.hasVibration === 'function' && Haptic.hasVibration()) {
			return {
				kind: 'is-success',
				message: 'Native vibration API detected. Inline rule tests and sidebar presets should trigger real haptics on supported hardware.'
			};
		}

		if (typeof Haptic.hasIOSHapticFallback === 'function' && Haptic.hasIOSHapticFallback()) {
			return {
				kind: 'is-info',
				message: 'iOS Safari fallback detected. Web haptics can still be browser-limited, so debug mode is useful for consistent previews.'
			};
		}

		return {
			kind: 'is-info',
			message: 'This browser does not expose web haptics here. Desktop Debug Mode will use ripple and audio feedback instead.'
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

	function getSandboxMatches(selector) {
		var sandbox = $('#demo-sandbox');

		if (!sandbox || !selector) {
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
		var describedPattern = describeEffectivePattern(pattern, effectivePattern);
		var supported = Haptic && typeof Haptic.vibrate === 'function' && Haptic.vibrate(effectivePattern);

		options = options || {};

		if (supported) {
			setStatus('is-success', options.statusMessage || ('Pattern fired on this device: ' + describedPattern));
		} else if (debugMode) {
			playDebugAudio(effectivePattern);
			setStatus('is-info', options.statusMessage || ('Debug mode simulated the pattern with ripple/audio: ' + describedPattern));
		} else {
			setStatus('is-error', 'No haptic support detected here. Turn on Desktop Debug Mode to preview the result.');
		}

		if (options.targets && options.targets.length) {
			addRippleToElements(options.targets, duration);
		}

		if (options.primaryTarget) {
			addRipple(options.primaryTarget, duration);
		}
	}

	function getRowIndex(row) {
		var index = parseInt(row.getAttribute('data-index'), 10);
		return isNaN(index) ? 0 : index;
	}

	function resolveRowPattern(row) {
		var preset = $('.haptic-rule__preset', row).value;

		if (preset === 'custom') {
			return parsePatternString($('.haptic-rule__custom-pattern', row).value);
		}

		return getPatternByName(preset);
	}

	function updateGeneratedSnippet() {
		var firstRow = $('.haptic-rule', $('#demo-rules-list'));
		var snippet = $('#demo-generated-snippet');
		var selectorInput;
		var classPreview;
		var selectorToken;

		if (!firstRow || !snippet) {
			return;
		}

		selectorInput = $('.haptic-rule__selector', firstRow);
		classPreview = $('.haptic-rule__class-preview', firstRow);
		selectorToken = selectorInput.value.trim().replace(/^\./, '') || 'cta-button';
		snippet.textContent = '<button class="' + classPreview.value + ' ' + selectorToken + '">Buy now</button>';
	}

	function refreshRuleRow(row) {
		var preset = $('.haptic-rule__preset', row).value;
		var customWrap = $('.haptic-field--custom', row);
		var classPreview = $('.haptic-rule__class-preview', row);
		var selector = $('.haptic-rule__selector', row).value.trim();
		var matchMeta = $('.haptic-rule__meta', row);
		var badgeWrap = $('.haptic-pattern-badge', row);
		var pattern = getEffectivePattern(resolveRowPattern(row));
		var matches = getSandboxMatches(selector);

		customWrap.classList.toggle('haptic-hidden', preset !== 'custom');
		classPreview.value = buildRuleClassName(preset, getRowIndex(row));

		if (!badgeWrap) {
			badgeWrap = document.createElement('span');
			badgeWrap.className = 'haptic-pattern-badge';
			$('.haptic-field--preset', row).appendChild(badgeWrap);
		}

		renderPatternBadge(badgeWrap, pattern);

		if (!selector) {
			matchMeta.textContent = 'Enter a selector to preview matches in the sandbox.';
		} else if (matches === null) {
			matchMeta.textContent = 'That selector is invalid. Try a simple class like .cta-button or .menu-link.';
		} else if (matches.length) {
			matchMeta.textContent = matches.length + ' sandbox element' + (matches.length === 1 ? '' : 's') + ' currently match this rule.';
		} else {
			matchMeta.textContent = 'No sandbox elements currently match this selector, but the rule is still valid.';
		}

		updateGeneratedSnippet();
	}

	function syncRuleRows() {
		$all('.haptic-rule', $('#demo-rules-list')).forEach(function (row, index) {
			row.setAttribute('data-index', String(index));
			refreshRuleRow(row);
		});

		ruleIndex = $all('.haptic-rule', $('#demo-rules-list')).length;
		$('#demo-rules-empty').classList.toggle('haptic-hidden', ruleIndex !== 0);
	}

	function buildNewRuleRow() {
		var template = $('#demo-rule-template');
		var html = template.innerHTML.replace(/\{\{INDEX\}\}/g, String(ruleIndex));
		var wrapper = document.createElement('div');
		wrapper.innerHTML = html.trim();
		return wrapper.firstElementChild;
	}

	function bindRuleRow(row) {
		$('.haptic-rule__preset', row).addEventListener('change', function () {
			refreshRuleRow(row);
		});

		$('.haptic-rule__custom-pattern', row).addEventListener('input', function () {
			refreshRuleRow(row);
		});

		$('.haptic-rule__selector', row).addEventListener('input', function () {
			refreshRuleRow(row);
		});

		$('.haptic-rule__remove-btn', row).addEventListener('click', function () {
			row.remove();
			syncRuleRows();
			setStatus('is-info', 'Rule removed from the demo interface. In the real plugin, you would save to persist the change.');
		});

		bindPressInteraction($('.haptic-rule__test-btn', row), function () {
			var selector = $('.haptic-rule__selector', row).value.trim();
			var matches = getSandboxMatches(selector);
			var pattern = resolveRowPattern(row);
			var description = describeEffectivePattern(pattern, getEffectivePattern(pattern));

			if (matches === null) {
				setStatus('is-error', 'The selector for this rule is invalid, so the demo cannot test it against the sandbox.');
				return;
			}

			triggerPattern(pattern, {
				primaryTarget: $('.haptic-rule__test-btn', row),
				targets: matches || [],
				statusMessage: matches && matches.length
					? 'Tested ' + description + ' against ' + matches.length + ' matching sandbox element' + (matches.length === 1 ? '' : 's') + '.'
					: 'Tested ' + description + '. No current sandbox elements match this selector.'
			});
		});
	}

	function addRuleRow() {
		var row = buildNewRuleRow();
		$('#demo-rules-list').appendChild(row);
		bindRuleRow(row);
		ruleIndex += 1;
		syncRuleRows();
		row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		$('.haptic-rule__selector', row).focus();
		setStatus('is-info', 'Added a new demo rule. Adjust the selector and preset, then test it inline.');
	}

	function initRuleRows() {
		$all('.haptic-rule', $('#demo-rules-list')).forEach(function (row) {
			bindRuleRow(row);
			refreshRuleRow(row);
		});

		ruleIndex = $all('.haptic-rule', $('#demo-rules-list')).length;
	}

	function initDragAndDrop() {
		var list = $('#demo-rules-list');

		list.addEventListener('dragstart', function (event) {
			var row = event.target.closest('.haptic-rule');
			if (!row) {
				return;
			}

			dragSource = row;
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', '');
			window.setTimeout(function () {
				row.classList.add('haptic-rule--dragging');
			}, 0);
		});

		list.addEventListener('dragover', function (event) {
			var row = event.target.closest('.haptic-rule');
			var rect;
			var midpoint;

			event.preventDefault();
			if (!row || row === dragSource) {
				return;
			}

			rect = row.getBoundingClientRect();
			midpoint = rect.top + rect.height / 2;

			if (event.clientY < midpoint) {
				list.insertBefore(dragSource, row);
			} else {
				list.insertBefore(dragSource, row.nextSibling);
			}
		});

		list.addEventListener('dragend', function () {
			if (!dragSource) {
				return;
			}

			dragSource.classList.remove('haptic-rule--dragging');
			dragSource = null;
			syncRuleRows();
			setStatus('is-info', 'Rule order updated. The real plugin saves this layout when you submit settings.');
		});

		list.addEventListener('mousedown', function (event) {
			var handle = event.target.closest('.haptic-rule__handle');
			if (!handle) {
				return;
			}

			handle.closest('.haptic-rule').setAttribute('draggable', 'true');
		});

		list.addEventListener('mouseup', function (event) {
			var handle = event.target.closest('.haptic-rule__handle');
			if (!handle) {
				return;
			}

			handle.closest('.haptic-rule').removeAttribute('draggable');
		});
	}

	function initSandbox() {
		$all('.demo-target-card', $('#demo-sandbox')).forEach(function (card) {
			bindPressInteraction(card, function (event) {
				var target = event.currentTarget;
				var matchedRows = $all('.haptic-rule', $('#demo-rules-list')).filter(function (row) {
					var selector = $('.haptic-rule__selector', row).value.trim();
					var matches = getSandboxMatches(selector);
					return Array.isArray(matches) && matches.indexOf(target) !== -1;
				});
				var row;
				var pattern;

				if (!matchedRows.length) {
					setStatus('is-info', 'This sandbox element does not currently match any demo rules.');
					addRipple(target, 400);
					return;
				}

				row = matchedRows[0];
				pattern = resolveRowPattern(row);
				triggerPattern(pattern, {
					primaryTarget: target,
					statusMessage: 'Sandbox interaction matched ' + $('.haptic-rule__selector', row).value.trim() + ' and fired ' + describeEffectivePattern(pattern, getEffectivePattern(pattern)) + '.'
				});
			});
		});
	}

	function initSidebar() {
		$('#demo-debug-mode').addEventListener('change', function () {
			$('#demo-debug-preview').classList.toggle('is-visible', this.checked);
			setStatus('', this.checked ? 'Desktop Debug Mode is on. Tests will use ripple/audio fallback when needed.' : 'Desktop Debug Mode is off. Tests now rely on native haptic support only.');
		});

		$('#demo-tester-preset').addEventListener('change', function () {
			$('#demo-tester-custom-wrap').classList.toggle('haptic-hidden', this.value !== 'custom');
		});

		bindPressInteraction($('#demo-tester-btn'), function () {
			var preset = $('#demo-tester-preset').value;
			var pattern = preset === 'custom' ? parsePatternString($('#demo-tester-custom').value) : getPatternByName(preset);
			var effectivePattern = getEffectivePattern(pattern);
			var describedPattern = describeEffectivePattern(pattern, effectivePattern);
			var testerStatus = $('#demo-tester-status');

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

		$('#demo-save-btn').addEventListener('click', function () {
			setStatus('is-info', 'Demo only: the real plugin saves rules, debug mode, and preset choices through the WordPress settings page.');
			addRipple(this, 700);
		});
	}

	function initAddRule() {
		$('#demo-add-rule').addEventListener('click', function () {
			addRuleRow();
		});
	}

	initRuleRows();
	initDragAndDrop();
	initSandbox();
	initSidebar();
	initAddRule();
	updateGeneratedSnippet();

	var support = describeSupport();
	setStatus(support.kind, support.message);
}());
