<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package Haptic_Vibrate
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Remove plugin settings from the database.
delete_option( 'haptic_vibrate_settings' );
delete_option( 'wp_haptic_vibrate_settings' );
