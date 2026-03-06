/**
 * WP Haptic Vibrate – shared haptic core.
 *
 * Mirrors the browser-haptic method model while keeping WordPress-friendly,
 * no-build browser compatibility.
 */
(function (window, document, navigator) {
	'use strict';

	if (!window || !document || !navigator) {
		return;
	}

	var PRESETS = {
		light: 10,
		medium: 20,
		heavy: 40,
		success: [10, 50, 10],
		warning: [30, 30, 30],
		error: [50, 30, 50, 30, 50]
	};

	var pendingTimeouts = [];
	var lastIOSFallbackAt = 0;
	var MAX_SEGMENTS = 12;
	var MAX_SEGMENT_MS = 1000;
	var MAX_TOTAL_MS = 5000;
	var IOS_MIN_GAP_MS = 60;

	function hasDOM() {
		return !!(document && document.body);
	}

	function hasVibrationAPI() {
		return !!(navigator && typeof navigator.vibrate === 'function');
	}

	function getUserAgent() {
		return navigator.userAgent || navigator.vendor || '';
	}

	function isIOSDevice() {
		var ua = getUserAgent();
		var platform = navigator.platform || '';
		var maxTouchPoints = navigator.maxTouchPoints || 0;

		return /iPad|iPhone|iPod/.test(ua) || ('MacIntel' === platform && maxTouchPoints > 1);
	}

	function getIOSVersion() {
		var ua = getUserAgent();
		var match = ua.match(/OS (\d+)[_.](\d+)(?:[_.](\d+))?/i);

		if (!match) {
			return null;
		}

		return {
			major: parseInt(match[1], 10) || 0,
			minor: parseInt(match[2], 10) || 0,
			patch: parseInt(match[3] || '0', 10) || 0
		};
	}

	function isIOSVersionAtLeast(requiredMajor, requiredMinor) {
		var version = getIOSVersion();

		if (!version) {
			return false;
		}

		if (version.major > requiredMajor) {
			return true;
		}

		if (version.major < requiredMajor) {
			return false;
		}

		return version.minor >= requiredMinor;
	}

	function isLikelyIOSSafari() {
		var ua = getUserAgent();

		if (!isIOSDevice()) {
			return false;
		}

		if (!/WebKit/i.test(ua)) {
			return false;
		}

		if (/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser|SamsungBrowser)/i.test(ua)) {
			return false;
		}

		return isIOSVersionAtLeast(17, 4);
	}

	function hasIOSHapticFallback() {
		return hasDOM() && isLikelyIOSSafari();
	}

	function normalizePattern(pattern) {
		var list = Array.isArray(pattern) ? pattern.slice(0) : [pattern];
		var normalized = [];
		var total = 0;
		var i;

		for (i = 0; i < list.length && normalized.length < MAX_SEGMENTS; i++) {
			var value = parseInt(list[i], 10);

			if (!isFinite(value) || value <= 0) {
				continue;
			}

			value = Math.min(value, MAX_SEGMENT_MS);

			if ((total + value) > MAX_TOTAL_MS) {
				break;
			}

			normalized.push(value);
			total += value;
		}

		return normalized.length ? normalized : [10];
	}

	function clearPendingTimeouts() {
		while (pendingTimeouts.length) {
			window.clearTimeout(pendingTimeouts.pop());
		}
	}

	function cancel() {
		clearPendingTimeouts();

		if (hasVibrationAPI()) {
			try {
				navigator.vibrate(0);
			} catch (error) {
				// No-op.
			}
		}
	}

	function fireIOSSwitch() {
		var now = Date.now();
		var label;
		var input;

		if (!hasIOSHapticFallback()) {
			return false;
		}

		if ((now - lastIOSFallbackAt) < IOS_MIN_GAP_MS) {
			return false;
		}

		lastIOSFallbackAt = now;

		try {
			label = document.createElement('label');
			label.setAttribute('aria-hidden', 'true');
			label.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;opacity:0;pointer-events:none;';

			input = document.createElement('input');
			input.type = 'checkbox';
			input.setAttribute('switch', '');

			label.appendChild(input);
			document.body.appendChild(label);

			if (typeof input.click === 'function') {
				input.click();
			} else if (typeof label.click === 'function') {
				label.click();
			}

			document.body.removeChild(label);
			return true;
		} catch (error) {
			if (label && label.parentNode) {
				label.parentNode.removeChild(label);
			}

			return false;
		}
	}

	function playIOSPattern(pattern) {
		var normalized = normalizePattern(pattern);
		var delay = 0;
		var pulseCount = 0;
		var i;

		cancel();

		for (i = 0; i < normalized.length && pulseCount < 6; i += 2) {
			var vibrateMs = normalized[i] || 0;
			var pauseMs = normalized[i + 1] || 0;

			if (vibrateMs > 0) {
				pendingTimeouts.push(window.setTimeout(fireIOSSwitch, delay));
				pulseCount++;
			}

			delay += Math.max(vibrateMs, IOS_MIN_GAP_MS) + Math.max(pauseMs, IOS_MIN_GAP_MS);
		}

		return pulseCount > 0;
	}

	function vibrate(pattern) {
		var normalized = normalizePattern(pattern);

		cancel();

		if (hasVibrationAPI()) {
			try {
				navigator.vibrate(1 === normalized.length ? normalized[0] : normalized);
				return true;
			} catch (error) {
				return false;
			}
		}

		if (hasIOSHapticFallback()) {
			return playIOSPattern(normalized);
		}

		return false;
	}

	function light() {
		return vibrate(PRESETS.light);
	}

	function medium() {
		return vibrate(PRESETS.medium);
	}

	function heavy() {
		return vibrate(PRESETS.heavy);
	}

	function success() {
		return vibrate(PRESETS.success);
	}

	function warning() {
		return vibrate(PRESETS.warning);
	}

	function error() {
		return vibrate(PRESETS.error);
	}

	function isSupported() {
		return hasVibrationAPI() || hasIOSHapticFallback();
	}

	window.WPHapticCore = {
		hasVibration: hasVibrationAPI,
		hasIOSHapticFallback: hasIOSHapticFallback,
		isSupported: isSupported,
		vibrate: vibrate,
		light: light,
		medium: medium,
		heavy: heavy,
		success: success,
		warning: warning,
		error: error,
		cancel: cancel,
		presets: PRESETS
	};
}(window, document, navigator));