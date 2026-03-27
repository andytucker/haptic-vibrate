# Haptic Vibrate

**WordPress Plugin** — Add haptic (vibration) feedback to any element on your site using the browser's native [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

---

## Features

- 🎯 **CSS-selector rules** — Map any CSS selector to a vibration pattern
- 🏷️ **Pattern classes** — Every rule gets an auto-generated class like `.haptic-vibrate-heartbeat`
- ⚡ **19 built-in presets** — Aligned to Apple Human Interface Guidelines (UIImpactFeedbackGenerator, UINotificationFeedbackGenerator, UISelectionFeedbackGenerator)
- 🎚️ **Per-rule intensity** — Slider from 0–1 with preset-based defaults; iOS uses PWM modulation for variable weight
- 🛠 **Custom patterns** — Enter any comma-separated millisecond sequence
- 📱 **Cross-platform haptics** — Android Vibration API, iOS Safari 17.4+ PWM intensity, Firefox Android v129+ switch fallback
- 🖥 **Desktop debug mode** — Visual ripple + audio beep on browsers without haptic support
- 👆 **Automatic interaction listening** — Rules respond to pointer, touch, click, and keyboard activation automatically
- ↕️ **Drag-and-drop rule ordering**
- 🌍 **Translation-ready** (POT file included)

---

## Installation

1. Upload the `haptic-vibrate` folder to `/wp-content/plugins/`
2. Activate the plugin via the **Plugins** screen in WordPress
3. Go to **Settings → Haptic Vibrate** to configure rules

---

## Usage

### Using a CSS Selector

In the admin page, click **Add Rule** and enter a CSS selector like `.my-button` or `#cta-link`.
Choose a vibration preset (or enter a custom pattern) and save settings.

### Using the Generated Pattern Class

1. Create or edit a rule.
2. Copy the **Pattern Class** shown for that rule, such as `.haptic-vibrate-heartbeat`.
3. Add the class to any HTML element:
   ```html
	<button class="haptic-vibrate-heartbeat">Click me</button>
   ```

Preset-based classes are stable. Custom patterns receive numbered classes such as `.haptic-vibrate-custom-1`.

### Custom Patterns

Select **Custom…** from the preset dropdown and enter comma-separated millisecond values:

```
200,100,200,100,400
```

Odd-indexed values are *pause* durations; even-indexed values are *vibration* durations — following the standard [Vibration API pattern](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API#vibration_patterns).

### Desktop Debug Mode

Enable **Desktop Debug Mode** in the sidebar to get feedback on desktop browsers:

- 🔊 **Audio** — a short tone burst matching the vibration pattern
- 💥 **Visual** — a cyan ripple ring around the triggered element

### Mobile Platform Support

- **Android / WebView** — uses the native browser Vibration API for raw pattern playback
- **iOS Safari 17.4+** — uses PWM-modulated switch haptics that map intensity to toggle frequency, producing light-to-heavy feedback weights aligned with Apple’s UIImpactFeedbackGenerator
- **Firefox Android v129+** — automatic switch-based fallback for devices that dropped the Vibration API
- **Desktop browsers** — can use the plugin's debug mode for audio + visual confirmation during testing

---

## Built-in Presets

| Key | Pattern (ms) | Intensity | HIG Mapping |
|---|---|---|---|
| `light` | `10` | 0.4 | UIImpactFeedbackGenerator .light |
| `medium` | `20` | 0.7 | UIImpactFeedbackGenerator .medium |
| `heavy` | `40` | 1.0 | UIImpactFeedbackGenerator .heavy |
| `soft` | `10` | 0.3 | UIImpactFeedbackGenerator .soft |
| `rigid` | `20` | 0.9 | UIImpactFeedbackGenerator .rigid |
| `selection` | `8` | 0.25 | UISelectionFeedbackGenerator |
| `single_short` | `200` | 0.7 | — |
| `single_long` | `600` | 0.7 | — |
| `double_tap` | `100, 60, 100` | 0.7 | — |
| `triple_tap` | `100, 60, 100, 60, 100` | 0.7 | — |
| `heartbeat` | `100, 100, 300, 600` | 0.7 | — |
| `buzz` | `500` | 0.7 | — |
| `rumble` | `200, 100, 200, 100, 200` | 0.7 | — |
| `notification` | `50, 50, 100` | 0.7 | — |
| `success` | `100, 50, 200` | 0.6 | UINotificationFeedbackGenerator .success |
| `warning` | `30, 30, 30` | 0.8 | UINotificationFeedbackGenerator .warning |
| `error` | `300, 100, 300, 100, 300` | 1.0 | UINotificationFeedbackGenerator .error |
| `sos` | Morse SOS | 0.7 | — |
| `custom` | user-defined | adjustable | — |

---

## Requirements

- WordPress 5.9 or higher
- PHP 7.4 or higher
- A mobile browser or Android WebView that supports the [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)

---

## License

GPL v2 or later — see [LICENSE](LICENSE).
