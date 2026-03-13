<?php
/**
 * Haptic Vibrate
 *
 * @package           Haptic_Vibrate
 * @author            Victor Pilyasinsky
 * @copyright         2024 Victor Pilyasinsky
 * @license           GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       Haptic Vibrate
 * Plugin URI:        https://github.com/andytucker/wp-haptic-vibrate
 * Description:       Enable mobile haptic vibration feedback on any element via CSS class selectors. Includes an admin pattern builder, presets, and a desktop debug mode with visual/audio feedback.
 * Version:           1.0.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            Victor Pilyasinsky
 * Author URI:        https://github.com/andytucker
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       haptic-vibrate
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HAPTIC_VIBRATE_VERSION', '1.0.0' );
define( 'HAPTIC_VIBRATE_PLUGIN_FILE', __FILE__ );
define( 'HAPTIC_VIBRATE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HAPTIC_VIBRATE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

function haptic_vibrate_activate_plugin() {
	require_once HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-activator.php';
	Haptic_Vibrate_Activator::activate();
}
register_activation_hook( __FILE__, 'haptic_vibrate_activate_plugin' );

function haptic_vibrate_deactivate_plugin() {
	require_once HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-deactivator.php';
	Haptic_Vibrate_Deactivator::deactivate();
}
register_deactivation_hook( __FILE__, 'haptic_vibrate_deactivate_plugin' );

require_once HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-plugin.php';

function haptic_vibrate_run_plugin() {
	$plugin = new Haptic_Vibrate();
	$plugin->run();
}
haptic_vibrate_run_plugin();
