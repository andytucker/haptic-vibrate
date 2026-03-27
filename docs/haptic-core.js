/**
 * Haptic Vibrate – shared haptic core.
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
		light:     { pattern: 10,                    intensity: 0.4 },
		medium:    { pattern: 20,                    intensity: 0.7 },
		heavy:     { pattern: 40,                    intensity: 1.0 },
		soft:      { pattern: 10,                    intensity: 0.3 },
		rigid:     { pattern: 20,                    intensity: 0.9 },
		selection: { pattern: 8,                     intensity: 0.25 },
		success:   { pattern: [10, 50, 10],          intensity: 0.6 },
		warning:   { pattern: [30, 30, 30],          intensity: 0.8 },
		error:     { pattern: [50, 30, 50, 30, 50],  intensity: 1.0 }
	};

	var DEFAULT_INTENSITY = 0.7;
	var pendingTimeouts = [];
	var lastIOSFallbackAt = 0;
	var iosSwitch = null;
	var iosSwitchLabel = null;
	var pwmRafId = null;
	var MAX_SEGMENTS = 12;
	var MAX_SEGMENT_MS = 1000;
	var MAX_TOTAL_MS = 5000;
	var IOS_MIN_GAP_MS = 60;
	var PWM_TOGGLE_MIN = 16;
	var PWM_TOGGLE_MAX = 184;

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

		if (pwmRafId) {
			cancelAnimationFrame(pwmRafId);
			pwmRafId = null;
		}

		if (hasVibrationAPI()) {
			try {
				navigator.vibrate(0);
			} catch (error) {
				// No-op.
			}
		}
	}

	function ensureIOSSwitch() {
		if (iosSwitch && iosSwitchLabel && iosSwitchLabel.parentNode) {
			return true;
		}

		if (!hasDOM()) {
			return false;
		}

		try {
			iosSwitchLabel = document.createElement('label');
			iosSwitchLabel.setAttribute('aria-hidden', 'true');
			iosSwitchLabel.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0;opacity:0;pointer-events:none;';

			iosSwitch = document.createElement('input');
			iosSwitch.type = 'checkbox';
			iosSwitch.setAttribute('switch', '');

			iosSwitchLabel.appendChild(iosSwitch);
			document.body.appendChild(iosSwitchLabel);
			return true;
		} catch (error) {
			iosSwitch = null;
			iosSwitchLabel = null;
			return false;
		}
	}

	function fireIOSSwitch() {
		var now = Date.now();

		if (!hasIOSHapticFallback()) {
			return false;
		}

		if ((now - lastIOSFallbackAt) < IOS_MIN_GAP_MS) {
			return false;
		}

		lastIOSFallbackAt = now;

		if (!ensureIOSSwitch()) {
			return false;
		}

		try {
			if (typeof iosSwitch.click === 'function') {
				iosSwitch.click();
			} else if (typeof iosSwitchLabel.click === 'function') {
				iosSwitchLabel.click();
			}
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * PWM intensity modulation for iOS.
	 *
	 * Toggles the switch element at a rate proportional to the desired intensity.
	 * Higher intensity = shorter interval between toggles = more haptic clicks
	 * per unit time = perceived heavier vibration.
	 *
	 * @param {number} durationMs Total duration of this vibration segment.
	 * @param {number} intensity  0-1, where 1 is maximum haptic strength.
	 */
	function fireIOSWithIntensity(durationMs, intensity) {
		var clampedIntensity = Math.max(0, Math.min(1, intensity));
		var toggleInterval = PWM_TOGGLE_MIN + PWM_TOGGLE_MAX * (1 - clampedIntensity);
		var startTime;
		var lastToggleTime = 0;

		if (!ensureIOSSwitch()) {
			return false;
		}

		if (pwmRafId) {
			cancelAnimationFrame(pwmRafId);
			pwmRafId = null;
		}

		startTime = performance.now();
		lastToggleTime = 0;

		function tick(now) {
			var elapsed = now - startTime;
			var sinceLast = now - lastToggleTime;

			if (elapsed >= durationMs) {
				pwmRafId = null;
				return;
			}

			if (sinceLast >= toggleInterval) {
				lastToggleTime = now;
				try {
					iosSwitch.click();
				} catch (e) {
					pwmRafId = null;
					return;
				}
			}

			pwmRafId = requestAnimationFrame(tick);
		}

		pwmRafId = requestAnimationFrame(tick);
		return true;
	}

	function playIOSPattern(pattern, intensity) {
		var normalized = normalizePattern(pattern);
		var effectiveIntensity = typeof intensity === 'number' ? intensity : DEFAULT_INTENSITY;
		var delay = 0;
		var pulseCount = 0;
		var i;

		cancel();

		for (i = 0; i < normalized.length && pulseCount < 6; i += 2) {
			var vibrateMs = normalized[i] || 0;
			var pauseMs = normalized[i + 1] || 0;

			if (vibrateMs > 0) {
				if (vibrateMs >= PWM_TOGGLE_MIN * 3) {
					// Long enough segment for PWM modulation.
					(function (d, ms, inten) {
						if (0 === d) {
							fireIOSWithIntensity(ms, inten);
						} else {
							pendingTimeouts.push(window.setTimeout(function () {
								fireIOSWithIntensity(ms, inten);
							}, d));
						}
					})(delay, vibrateMs, effectiveIntensity);
				} else {
					// Very short segment — single click is sufficient.
					if (0 === delay) {
						fireIOSSwitch();
					} else {
						pendingTimeouts.push(window.setTimeout(fireIOSSwitch, delay));
					}
				}
				pulseCount++;
			}

			delay += Math.max(vibrateMs, IOS_MIN_GAP_MS) + Math.max(pauseMs, IOS_MIN_GAP_MS);
		}

		return pulseCount > 0;
	}

	/**
	 * Detect touch-capable non-iOS devices where Vibration API is absent.
	 * Covers Firefox Android v129+ which dropped the API.
	 */
	function isTouchDeviceWithoutVibration() {
		if (hasVibrationAPI() || isIOSDevice()) {
			return false;
		}
		return 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
	}

	function vibrate(pattern, intensity) {
		var normalized = normalizePattern(pattern);
		var effectiveIntensity = typeof intensity === 'number' ? intensity : DEFAULT_INTENSITY;

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
			return playIOSPattern(normalized, effectiveIntensity);
		}

		// Firefox Android v129+ and similar: attempt switch fallback on touch devices.
		if (isTouchDeviceWithoutVibration() && hasDOM()) {
			if (ensureIOSSwitch()) {
				return playIOSPattern(normalized, effectiveIntensity);
			}
		}

		return false;
	}

	function light() {
		return vibrate(PRESETS.light.pattern, PRESETS.light.intensity);
	}

	function medium() {
		return vibrate(PRESETS.medium.pattern, PRESETS.medium.intensity);
	}

	function heavy() {
		return vibrate(PRESETS.heavy.pattern, PRESETS.heavy.intensity);
	}

	function soft() {
		return vibrate(PRESETS.soft.pattern, PRESETS.soft.intensity);
	}

	function rigid() {
		return vibrate(PRESETS.rigid.pattern, PRESETS.rigid.intensity);
	}

	function selection() {
		return vibrate(PRESETS.selection.pattern, PRESETS.selection.intensity);
	}

	function success() {
		return vibrate(PRESETS.success.pattern, PRESETS.success.intensity);
	}

	function warning() {
		return vibrate(PRESETS.warning.pattern, PRESETS.warning.intensity);
	}

	function error() {
		return vibrate(PRESETS.error.pattern, PRESETS.error.intensity);
	}

	function isSupported() {
		return hasVibrationAPI() || hasIOSHapticFallback() || isTouchDeviceWithoutVibration();
	}

	window.WPHapticCore = {
		hasVibration: hasVibrationAPI,
		hasIOSHapticFallback: hasIOSHapticFallback,
		isSupported: isSupported,
		normalizePattern: normalizePattern,
		vibrate: vibrate,
		light: light,
		medium: medium,
		heavy: heavy,
		soft: soft,
		rigid: rigid,
		selection: selection,
		success: success,
		warning: warning,
		error: error,
		cancel: cancel,
		presets: PRESETS
	};
}(window, document, navigator));