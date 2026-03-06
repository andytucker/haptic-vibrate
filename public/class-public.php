<?php
/**
 * The public-facing functionality of the plugin.
 *
 * @package WP_Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The public-facing functionality of the plugin.
 *
 * Enqueues frontend CSS/JS only when there are active vibration rules
 * or debug mode is enabled, keeping the site lean.
 */
class WP_Haptic_Vibrate_Public {

	/**
	 * The ID of this plugin.
	 *
	 * @since  1.0.0
	 * @var    string $plugin_name The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since  1.0.0
	 * @var    string $version The current version of this plugin.
	 */
	private $version;

	/**
	 * Cached plugin settings.
	 *
	 * @since  1.0.0
	 * @var    array|false
	 */
	private $settings = null;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since 1.0.0
	 * @param string $plugin_name The name of the plugin.
	 * @param string $version     The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Register the stylesheets for the public-facing side of the site.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_styles() {
		$settings = $this->get_settings();

		if ( empty( $settings['rules'] ) && empty( $settings['debug_mode'] ) ) {
			return;
		}

		wp_enqueue_style(
			$this->plugin_name,
			WP_HAPTIC_VIBRATE_PLUGIN_URL . 'public/css/public.css',
			array(),
			$this->version,
			'all'
		);
	}

	/**
	 * Register the JavaScript for the public-facing side of the site.
	 *
	 * @since 1.0.0
	 */
	public function enqueue_scripts() {
		$settings = $this->get_settings();

		if ( empty( $settings['rules'] ) && empty( $settings['debug_mode'] ) ) {
			return;
		}

		wp_enqueue_script(
			$this->plugin_name,
			WP_HAPTIC_VIBRATE_PLUGIN_URL . 'public/js/public.js',
			array(),
			$this->version,
			true
		);

		// Build rules suitable for the frontend – only expose what JS needs.
		$frontend_rules = array_map(
			function ( $rule ) use ( $settings ) {
				$selectors = array();

				if ( ! empty( $rule['selector'] ) ) {
					$selectors[] = $rule['selector'];
				}

				if ( ! empty( $rule['use_plugin_class'] ) && ! empty( $settings['plugin_class'] ) ) {
					$selectors[] = '.' . $settings['plugin_class'];
				}

				return array(
					'selectors' => $selectors,
					'pattern'   => isset( $rule['pattern'] ) ? array_map( 'absint', $rule['pattern'] ) : array( 200 ),
					'trigger'   => isset( $rule['trigger'] ) ? $rule['trigger'] : 'click',
				);
			},
			(array) $settings['rules']
		);

		// Remove rules with no selectors.
		$frontend_rules = array_values(
			array_filter(
				$frontend_rules,
				function ( $r ) {
					return ! empty( $r['selectors'] );
				}
			)
		);

		wp_localize_script(
			$this->plugin_name,
			'wpHapticPublic',
			array(
				'rules'     => $frontend_rules,
				'debugMode' => ! empty( $settings['debug_mode'] ),
			)
		);
	}

	/**
	 * Retrieve and cache plugin settings.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_settings() {
		if ( null === $this->settings ) {
			$this->settings = wp_parse_args(
				(array) get_option( 'wp_haptic_vibrate_settings', array() ),
				array(
					'rules'        => array(),
					'debug_mode'   => false,
					'plugin_class' => 'haptic-vibrate',
				)
			);
		}
		return $this->settings;
	}
}
