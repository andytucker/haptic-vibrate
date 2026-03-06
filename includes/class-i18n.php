<?php
/**
 * Define the internationalisation functionality.
 *
 * @package WP_Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalisation files for this plugin so
 * that it is ready for translation.
 */
class WP_Haptic_Vibrate_I18n {

	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since 1.0.0
	 */
	public function load_plugin_textdomain() {
		load_plugin_textdomain(
			'wp-haptic-vibrate',
			false,
			dirname( dirname( plugin_basename( WP_HAPTIC_VIBRATE_PLUGIN_FILE ) ) ) . '/languages/'
		);
	}
}
