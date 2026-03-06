# Release Checklist

Use this checklist before publishing a new version of `WP Haptic Vibrate`.

## Quality and testing

- [ ] Activate the plugin on a real WordPress install.
- [ ] Save settings successfully from the admin page.
- [ ] Verify selector-based rules on the frontend.
- [ ] Verify plugin-class rules on the frontend.
- [ ] Verify Android haptics on a supported mobile browser.
- [ ] Verify iOS Safari fallback on iOS 17.4+.
- [ ] Verify desktop debug mode audio and visual fallback.
- [ ] Verify uninstall removes the `wp_haptic_vibrate_settings` option.

## Versioning and docs

- [ ] Update `Version:` in `wp-haptic-vibrate.php`.
- [ ] Update `WP_HAPTIC_VIBRATE_VERSION` in `wp-haptic-vibrate.php`.
- [ ] Update `Stable tag:` and changelog entries in `readme.txt`.
- [ ] Update `CHANGELOG.md`.
- [ ] Review `README.md` if user-facing behavior changed.

## Packaging and release

- [ ] Run Composer install.
- [ ] Run PHPCS.
- [ ] Rebuild `dist/wp-haptic-vibrate.zip`.
- [ ] Confirm the ZIP excludes local tooling and temporary files.
- [ ] Commit the release changes.
- [ ] Push `main`.
- [ ] Create a GitHub Release if you want a downloadable release artifact.
