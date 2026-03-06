<?php
/**
 * The core plugin class.
 *
 * @package WP_Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The core plugin class.
 *
 * This is used to define internationalisation, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 */
class WP_Haptic_Vibrate {

	/**
	 * The loader that's responsible for maintaining and registering all hooks.
	 *
	 * @since  1.0.0
	 * @var    WP_Haptic_Vibrate_Loader $loader Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since  1.0.0
	 * @var    string $plugin_name The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since  1.0.0
	 * @var    string $version The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->version     = WP_HAPTIC_VIBRATE_VERSION;
		$this->plugin_name = 'wp-haptic-vibrate';

		$this->load_dependencies();
		$this->set_locale();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * @since 1.0.0
	 */
	private function load_dependencies() {
		require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-loader.php';
		require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-i18n.php';
		require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-activator.php';
		require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'includes/class-deactivator.php';
		require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'admin/class-admin.php';
		require_once WP_HAPTIC_VIBRATE_PLUGIN_DIR . 'public/class-public.php';

		$this->loader = new WP_Haptic_Vibrate_Loader();
	}

	/**
	 * Define the locale for this plugin for internationalisation.
	 *
	 * @since 1.0.0
	 */
	private function set_locale() {
		$plugin_i18n = new WP_Haptic_Vibrate_I18n();
		$this->loader->add_action( 'plugins_loaded', $plugin_i18n, 'load_plugin_textdomain' );
	}

	/**
	 * Register all of the hooks related to the admin area functionality.
	 *
	 * @since 1.0.0
	 */
	private function define_admin_hooks() {
		$plugin_admin = new WP_Haptic_Vibrate_Admin( $this->plugin_name, $this->version );

		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
		$this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );
		$this->loader->add_action( 'admin_menu', $plugin_admin, 'add_plugin_admin_menu' );
		$this->loader->add_action( 'admin_init', $plugin_admin, 'register_settings' );
		$this->loader->add_action( 'wp_ajax_haptic_test_pattern', $plugin_admin, 'ajax_test_pattern' );
	}

	/**
	 * Register all of the hooks related to the public-facing functionality.
	 *
	 * @since 1.0.0
	 */
	private function define_public_hooks() {
		$plugin_public = new WP_Haptic_Vibrate_Public( $this->plugin_name, $this->version );

		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_styles' );
		$this->loader->add_action( 'wp_enqueue_scripts', $plugin_public, 'enqueue_scripts' );
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since 1.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within WordPress.
	 *
	 * @since  1.0.0
	 * @return string The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since  1.0.0
	 * @return WP_Haptic_Vibrate_Loader Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since  1.0.0
	 * @return string The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
