=== Haptic Vibrate ===
Contributors: andytucker
Tags: vibration, haptic, mobile, ux, frontend
Requires at least: 5.9
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add haptic feedback to site elements using CSS selectors or auto-generated pattern classes, with a modern admin UI and desktop debug mode.

== Description ==

Haptic Vibrate lets you map CSS selectors or generated pattern classes to vibration patterns supported by mobile browsers.

Features include:

* CSS selector-based vibration rules
* Auto-generated per-pattern classes for easy theme or block integration
* Built-in presets plus custom patterns
* Android vibration support and iOS Safari 17.4+ pulse fallback
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

Yes, on iOS Safari 17.4+ the plugin uses a pulse-style fallback inspired by browser-haptic when the Vibration API is unavailable.

= Does this work on desktop browsers? =

Desktop browsers generally do not support mobile haptics, but you can enable Desktop Debug Mode for visual and audio feedback while testing.

= What happens on uninstall? =

Uninstalling the plugin removes the saved `haptic_vibrate_settings` option from the database.

== Changelog ==

= 1.0.0 =
* Initial public release.
* Added selector rules, generated pattern classes, haptic presets, desktop debug mode, and cross-platform haptic core.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
