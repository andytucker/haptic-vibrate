# Changelog

All notable changes to `Haptic Vibrate` will be documented in this file.

## [1.1.0] - 2026-03-27

### Added

- PWM intensity modulation for iOS Safari — `requestAnimationFrame`-based toggle loop varies switch interval from 16 ms (full) to 200 ms (off) for granular haptic weight.
- Per-rule intensity slider (0–1, step 0.05) in the admin UI, with automatic sync to preset defaults.
- Three new Apple HIG-aligned presets: **Soft** (0.3), **Rigid** (0.9), **Selection** (0.25).
- All presets now carry an `intensity` value mapped to Apple UIImpactFeedbackGenerator / UINotificationFeedbackGenerator / UISelectionFeedbackGenerator weights.
- Firefox Android v129+ fallback — detects touch devices that dropped the Vibration API and uses switch-based haptics.
- Persistent iOS switch element — created once and reused, eliminating per-pulse DOM creation overhead.
- Updated GitHub Pages demo with intensity slider, new preset buttons, and iOS/Firefox platform detection.

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
