<?php
/**
 * Fired during plugin activation.
 *
 * @package Haptic_Vibrate
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
class Haptic_Vibrate_Activator {

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
			'rules'      => array(),
			'debug_mode' => false,
		);

		$legacy_options = get_option( 'wp_haptic_vibrate_settings' );

		if ( false === get_option( 'haptic_vibrate_settings', false ) ) {
			if ( false !== $legacy_options ) {
				add_option( 'haptic_vibrate_settings', $legacy_options );
			} else {
				add_option( 'haptic_vibrate_settings', $default_options );
			}
		}
	}
}
