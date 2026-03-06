<?php
/**
 * Fired during plugin deactivation.
 *
 * @package WP_Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Fired during plugin deactivation.
 *
 * All of the functions required to run when the plugin is deactivated.
 * Settings are preserved so they are available if the plugin is re-activated.
 */
class WP_Haptic_Vibrate_Deactivator {

	/**
	 * Deactivate the plugin.
	 *
	 * Settings are intentionally kept so the user does not lose their configuration.
	 *
	 * @since 1.0.0
	 */
	public static function deactivate() {
		// Intentionally left blank – settings are preserved on deactivation.
	}
}
