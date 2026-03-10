<?php
/**
 * WP Haptic Vibrate
 *
 * @package           WP_Haptic_Vibrate
 * @author            Victor Pilyasinsky
 * @copyright         2024 Victor Pilyasinsky
 * @license           GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       WP Haptic Vibrate
 * Plugin URI:        https://github.com/andytucker/wp-haptic-vibrate
 * Description:       Enable mobile haptic vibration feedback on any element via CSS class selectors. Includes an admin pattern builder, presets, and a desktop debug mode with visual/audio feedback.
 * Version:           1.0.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            Victor Pilyasinsky
 * Author URI:        https://github.com/andytucker
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       wp-haptic-vibrate
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WP_HAPTIC_VIBRATE_VERSION', '1.0.0' );
define( 'WP_HAPTIC_VIBRATE_PLUGIN_FILE', __FILE__ );
define( 'WP_HAPTIC_VIBRATE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WP_HAPTIC_VIBRATE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * The code that runs during plugin activation.
 */
function activate_wp_haptic_vibrate() {
	require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-activator.php';
	WP_Haptic_Vibrate_Activator::activate();
}
register_activation_hook( __FILE__, 'activate_wp_haptic_vibrate' );

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_wp_haptic_vibrate() {
	require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-deactivator.php';
	WP_Haptic_Vibrate_Deactivator::deactivate();
}
register_deactivation_hook( __FILE__, 'deactivate_wp_haptic_vibrate' );

/**
 * The core plugin class that coordinates everything.
 */
require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-plugin.php';

/**
 * Begins execution of the plugin.
 */
function run_wp_haptic_vibrate() {
	$plugin = new WP_Haptic_Vibrate();
	$plugin->run();
}
run_wp_haptic_vibrate();
