# Changelog

All notable changes to `WP Haptic Vibrate` will be documented in this file.

## [Unreleased]

### Changed

- Replaced the old global plugin-class toggle with auto-generated per-rule pattern classes such as `.haptic-vibrate-heartbeat`.
- Simplified rule configuration by removing per-rule trigger selection and listening to common user interactions automatically.
- Refined the admin layout with cleaner right-column spacing, unified button styling, and improved rule-row previews.

## [1.0.0] - 2026-03-06

### Added

- Initial plugin bootstrap, lifecycle hooks, and loader structure.
- Modern admin settings page with repeatable vibration rules.
- Selector-based targeting and plugin-class targeting.
- Desktop debug mode with audio and visual fallbacks.
- Shared browser-haptic-style core for Android vibration and iOS Safari pulse fallback.
- Installable plugin archive generation and WordPress-style metadata files.
