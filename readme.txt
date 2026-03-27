=== Haptic Vibrate ===
Contributors: andytucker
Tags: vibration, haptic, mobile, ux, frontend
Requires at least: 5.9
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add haptic feedback to site elements using CSS selectors or auto-generated pattern classes, with intensity control, Apple HIG-aligned presets, and desktop debug mode.

== Description ==

Haptic Vibrate lets you map CSS selectors or generated pattern classes to vibration patterns supported by mobile browsers.

Features include:

* CSS selector-based vibration rules
* Auto-generated per-pattern classes for easy theme or block integration
* 19 built-in presets aligned to Apple Human Interface Guidelines
* Per-rule intensity control (0–1 scale) with PWM modulation on iOS
* Custom comma-separated millisecond patterns
* Android vibration support via the native Vibration API
* iOS Safari 17.4+ haptic feedback with intensity-aware PWM modulation
* Firefox Android v129+ fallback for devices that dropped the Vibration API
* Desktop debug mode with audio and visual feedback
* Automatic interaction listening for clicks, taps, and keyboard activation
* Drag-and-drop admin rule ordering
* Translation-ready text domain and POT file

== Installation ==

1. Upload the `haptic-vibrate` folder to the `/wp-content/plugins/` directory, or upload the plugin ZIP through WordPress.
2. Activate the plugin through the **Plugins** menu in WordPress.
3. Go to **Settings > Haptic Vibrate**.
4. Add one or more vibration rules and save your settings.

== Frequently Asked Questions ==

= Does this work on iPhone? =

Yes, on iOS Safari 17.4+ the plugin uses a PWM-modulated switch fallback that supports variable intensity. Presets are aligned to Apple's UIImpactFeedbackGenerator and UINotificationFeedbackGenerator weight levels.

= Does this work on desktop browsers? =

Desktop browsers generally do not support mobile haptics, but you can enable Desktop Debug Mode for visual and audio feedback while testing.

= What happens on uninstall? =

Uninstalling the plugin removes the saved `haptic_vibrate_settings` option from the database.

== Changelog ==

= 1.1.0 =
* Added PWM intensity modulation for iOS Safari — varies haptic weight instead of binary on/off.
* Added per-rule intensity slider (0–1) in the admin UI.
* Added 3 new Apple HIG-aligned presets: Soft, Rigid, Selection.
* All presets now carry an intensity value mapped to Apple feedback generators.
* Added Firefox Android v129+ fallback for devices that dropped the Vibration API.
* Persistent iOS switch element eliminates per-pulse DOM churn.

= 1.0.0 =
* Initial public release.
* Added selector rules, generated pattern classes, haptic presets, desktop debug mode, and cross-platform haptic core.

== Upgrade Notice ==

= 1.1.0 =
iOS haptics now support variable intensity. Three new presets added. Firefox Android fallback included.

= 1.0.0 =
Initial release.
