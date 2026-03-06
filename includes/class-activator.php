<?php
/**
 * Fired during plugin activation.
 *
 * @package WP_Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Fired during plugin activation.
 *
 * Sets up the default plugin options so the settings page works
 * out of the box immediately after activation.
 */
class WP_Haptic_Vibrate_Activator {

	/**
	 * Set up default plugin options on activation.
	 *
	 * Stores the default settings in the database so the settings page
	 * works immediately after activation without any additional configuration.
	 *
	 * @since 1.0.0
	 */
	public static function activate() {
		$default_options = array(
			'rules'        => array(),
			'debug_mode'   => false,
			'plugin_class' => 'haptic-vibrate',
		);

		if ( ! get_option( 'wp_haptic_vibrate_settings' ) ) {
			add_option( 'wp_haptic_vibrate_settings', $default_options );
		}
	}
}
