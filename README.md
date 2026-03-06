# WP Haptic Vibrate

**WordPress Plugin** — Add haptic (vibration) feedback to any element on your site using the browser's native [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

---

## Features

- 🎯 **CSS-selector rules** — Map any CSS selector to a vibration pattern
- 📳 **Plugin class** — Drop the configurable plugin class onto any HTML element
- ⚡ **15 built-in presets** — Light, Medium, Heavy, Single Short, Double Tap, Heartbeat, SOS, Success, Warning, Error, and more
- 🛠 **Custom patterns** — Enter any comma-separated millisecond sequence
- 📱 **Cross-platform haptics** — Android uses the Vibration API; iOS Safari 17.4+ uses a switch-based haptic fallback
- 🖥 **Desktop debug mode** — Visual ripple + audio beep on browsers without haptic support
- 🔁 **Multiple trigger events** — Click/Tap, Mouse Down, Touch Start
- ↕️ **Drag-and-drop rule ordering**
- 🌍 **Translation-ready** (POT file included)

---

## Installation

1. Upload the `wp-haptic-vibrate` folder to `/wp-content/plugins/`
2. Activate the plugin via the **Plugins** screen in WordPress
3. Go to **Settings → Haptic Vibrate** to configure rules

---

## Usage

### Using a CSS Selector

In the admin page, click **Add Rule** and enter a CSS selector like `.my-button` or `#cta-link`.
Choose a vibration preset (or enter a custom pattern) and select the trigger event. Save Settings.

### Using the Plugin Class

1. Set the **Plugin Class** name (default: `haptic-vibrate`) in the sidebar
2. Create a rule and check **Use Plugin Class**
3. Add the class to any HTML element:
   ```html
   <button class="haptic-vibrate">Click me</button>
   ```

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
- **iOS Safari 17.4+** — uses a browser-haptic-style switch fallback for pulse-based haptic feedback when the Vibration API is unavailable
- **Desktop browsers** — can use the plugin's debug mode for audio + visual confirmation during testing

---

## Built-in Presets

| Key | Pattern (ms) | Description |
|---|---|---|
| `light` | `10` | Very short tap |
| `medium` | `20` | Medium tap |
| `heavy` | `40` | Strong tap |
| `single_short` | `200` | Quick tap |
| `single_long` | `600` | Long buzz |
| `double_tap` | `100, 60, 100` | Two quick taps |
| `triple_tap` | `100, 60, 100, 60, 100` | Three quick taps |
| `heartbeat` | `100, 100, 300, 600` | Heartbeat rhythm |
| `buzz` | `500` | Half-second buzz |
| `rumble` | `200, 100, 200, 100, 200` | Triple rumble |
| `notification` | `50, 50, 100` | Gentle notification |
| `success` | `100, 50, 200` | Success confirmation |
| `warning` | `30, 30, 30` | Triple warning tap |
| `error` | `300, 100, 300, 100, 300` | Error alert |
| `sos` | Morse SOS | Emergency pattern |
| `custom` | user-defined | Your own pattern |

---

## Requirements

- WordPress 5.9 or higher
- PHP 7.4 or higher
- A mobile browser or Android WebView that supports the [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)

---

## License

GPL v2 or later — see [LICENSE](LICENSE).

---

## Development

This repository now includes WordPress-oriented project metadata and coding standards tooling:

- `readme.txt` — WordPress-style plugin readme
- `composer.json` — development dependencies for PHPCS/WPCS
- `.phpcs.xml.dist` — WordPress Coding Standards configuration
- `CHANGELOG.md` — release notes

### Recommended local setup

1. Install Composer dependencies.
2. Run PHPCS before packaging or publishing.
3. Update `readme.txt`, the plugin header version, and `CHANGELOG.md` for each release.
4. Rebuild the plugin ZIP after release changes.

### Release checklist

- Verify activation, admin settings, frontend behavior, and uninstall in a real WordPress install.
- Update `Version:` in `wp-haptic-vibrate.php`.
- Update `Stable tag:` and changelog entries in `readme.txt`.
- Update `CHANGELOG.md`.
- Rebuild `dist/wp-haptic-vibrate.zip`.
