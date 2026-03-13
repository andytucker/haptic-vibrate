<?php
/**
 * Fired during plugin deactivation.
 *
 * @package Haptic_Vibrate
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
class Haptic_Vibrate_Deactivator {

	/**
	 * Deactivate the plugin.
	 *
	 * @since 1.0.0
	 */
	public static function deactivate() {
	}
}
