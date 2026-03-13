<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @package Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, registers settings,
 * and enqueues the admin-specific stylesheet and JavaScript.
 */
class Haptic_Vibrate_Admin {

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
	 * Option key used to store settings.
	 *
	 * @since  1.0.0
	 * @var    string
	 */
	const OPTION_KEY = 'haptic_vibrate_settings';
	const LEGACY_OPTION_KEY = 'wp_haptic_vibrate_settings';

	/**
	 * Built-in vibration pattern presets.
	 *
	 * Each entry: [ label, pattern (array of ms values) ].
	 *
	 * @since  1.0.0
	 * @var    array
	 */
	public static $presets = array(
		'light'         => array( 'label' => 'Light',         'pattern' => array( 10 ) ),
		'medium'        => array( 'label' => 'Medium',        'pattern' => array( 20 ) ),
		'heavy'         => array( 'label' => 'Heavy',         'pattern' => array( 40 ) ),
		'single_short'  => array( 'label' => 'Single Short',  'pattern' => array( 200 ) ),
		'single_long'   => array( 'label' => 'Single Long',   'pattern' => array( 600 ) ),
		'double_tap'    => array( 'label' => 'Double Tap',    'pattern' => array( 100, 60, 100 ) ),
		'triple_tap'    => array( 'label' => 'Triple Tap',    'pattern' => array( 100, 60, 100, 60, 100 ) ),
		'heartbeat'     => array( 'label' => 'Heartbeat',     'pattern' => array( 100, 100, 300, 600 ) ),
		'buzz'          => array( 'label' => 'Buzz',          'pattern' => array( 500 ) ),
		'rumble'        => array( 'label' => 'Rumble',        'pattern' => array( 200, 100, 200, 100, 200 ) ),
		'sos'           => array( 'label' => 'SOS',           'pattern' => array( 100, 30, 100, 30, 100, 200, 200, 30, 200, 30, 200, 200, 100, 30, 100, 30, 100 ) ),
		'notification'  => array( 'label' => 'Notification',  'pattern' => array( 50, 50, 100 ) ),
		'success'       => array( 'label' => 'Success',       'pattern' => array( 100, 50, 200 ) ),
		'warning'       => array( 'label' => 'Warning',       'pattern' => array( 30, 30, 30 ) ),
		'error'         => array( 'label' => 'Error',         'pattern' => array( 300, 100, 300, 100, 300 ) ),
		'custom'        => array( 'label' => 'Custom…',       'pattern' => array() ),
	);

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since 1.0.0
	 * @param string $plugin_name The name of this plugin.
	 * @param string $version     The version of this plugin.
	 */
	public function __construct( $plugin_name, $version ) {
		$this->plugin_name = $plugin_name;
		$this->version     = $version;
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since 1.0.0
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public function enqueue_styles( $hook_suffix ) {
		if ( ! $this->is_plugin_page( $hook_suffix ) ) {
			return;
		}

		$style_path = HAPTIC_VIBRATE_PLUGIN_DIR . 'admin/css/admin.css';
		$style_ver  = file_exists( $style_path ) ? (string) filemtime( $style_path ) : $this->version;

		wp_enqueue_style(
			$this->plugin_name . '-admin',
			HAPTIC_VIBRATE_PLUGIN_URL . 'admin/css/admin.css',
			array(),
			$style_ver,
			'all'
		);
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since 1.0.0
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public function enqueue_scripts( $hook_suffix ) {
		if ( ! $this->is_plugin_page( $hook_suffix ) ) {
			return;
		}

		$core_path  = HAPTIC_VIBRATE_PLUGIN_DIR . 'assets/js/haptic-core.js';
		$admin_path = HAPTIC_VIBRATE_PLUGIN_DIR . 'admin/js/admin.js';
		$core_ver   = file_exists( $core_path ) ? (string) filemtime( $core_path ) : $this->version;
		$admin_ver  = file_exists( $admin_path ) ? (string) filemtime( $admin_path ) : $this->version;

		wp_enqueue_script(
			$this->plugin_name . '-haptic-core',
			HAPTIC_VIBRATE_PLUGIN_URL . 'assets/js/haptic-core.js',
			array(),
			$core_ver,
			true
		);

		wp_enqueue_script(
			$this->plugin_name . '-admin',
			HAPTIC_VIBRATE_PLUGIN_URL . 'admin/js/admin.js',
			array( 'jquery', $this->plugin_name . '-haptic-core' ),
			$admin_ver,
			true
		);

		wp_localize_script(
			$this->plugin_name . '-admin',
			'hapticVibrateAdmin',
			array(
				'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( 'haptic_vibrate_test_pattern' ),
				'presets'  => self::$presets,
				'i18n'     => array(
					'patternPlaceholder' => __( 'e.g. 200,100,200', 'haptic-vibrate' ),
					'addRule'            => __( 'Add Rule', 'haptic-vibrate' ),
					'removeRule'         => __( 'Remove', 'haptic-vibrate' ),
					'testPattern'        => __( 'Test Pattern', 'haptic-vibrate' ),
					'noVibration'        => __( 'Vibration API not supported in this browser.', 'haptic-vibrate' ),
					'confirmRemove'      => __( 'Remove this rule?', 'haptic-vibrate' ),
				),
			)
		);
	}

	/**
	 * Add an options page under the Settings submenu.
	 *
	 * @since 1.0.0
	 */
	public function add_plugin_admin_menu() {
		add_options_page(
			__( 'Haptic Vibrate', 'haptic-vibrate' ),
			__( 'Haptic Vibrate', 'haptic-vibrate' ),
			'manage_options',
			$this->plugin_name,
			array( $this, 'display_plugin_admin_page' )
		);
	}

	/**
	 * Register plugin settings via the Settings API.
	 *
	 * @since 1.0.0
	 */
	public function register_settings() {
		register_setting(
			'haptic_vibrate_group',
			self::OPTION_KEY,
			array(
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
			)
		);
	}

	/**
	 * Sanitize the settings before saving.
	 *
	 * @since 1.0.0
	 * @param  array $input Raw settings from the form.
	 * @return array        Sanitised settings.
	 */
	public function sanitize_settings( $input ) {
		$output = array(
			'debug_mode' => ! empty( $input['debug_mode'] ),
			'rules'      => array(),
		);

		if ( ! empty( $input['rules'] ) && is_array( $input['rules'] ) ) {
			foreach ( array_values( $input['rules'] ) as $index => $rule ) {
				$selector      = isset( $rule['selector'] ) ? sanitize_text_field( $rule['selector'] ) : '';
				$preset        = isset( $rule['preset'] ) ? sanitize_key( $rule['preset'] ) : 'single_short';
				$custom_raw    = isset( $rule['custom_pattern'] ) ? sanitize_text_field( $rule['custom_pattern'] ) : '';

				// Resolve the final pattern array.
				if ( 'custom' === $preset ) {
					$pattern = $this->parse_pattern_string( $custom_raw );
				} elseif ( isset( self::$presets[ $preset ] ) ) {
					$pattern = self::$presets[ $preset ]['pattern'];
				} else {
					$pattern = array( 200 );
				}

				if ( empty( $selector ) && 'custom' === $preset && empty( $custom_raw ) ) {
					continue;
				}

				$output['rules'][] = array(
					'selector'       => $selector,
					'preset'         => $preset,
					'custom_pattern' => $custom_raw,
					'pattern'        => $pattern,
					'class_name'     => $this->get_rule_class_name(
						array(
							'preset' => $preset,
						),
						$index
					),
				);
			}
		}

		return $output;
	}

	/**
	 * Parse a comma-separated pattern string into an array of positive integers.
	 *
	 * @since 1.0.0
	 * @param  string $raw Comma-separated string of millisecond values.
	 * @return array       Array of positive integers.
	 */
	private function parse_pattern_string( $raw ) {
		$parts   = explode( ',', $raw );
		$pattern = array();
		foreach ( $parts as $part ) {
			$val = absint( trim( $part ) );
			if ( $val > 0 ) {
				$pattern[] = $val;
			}
		}
		return $pattern ?: array( 200 );
	}

	/**
	 * AJAX handler – verify nonce, then echo JSON with the requested pattern.
	 * (Used only for admin testing; actual vibration is client-side.)
	 *
	 * @since 1.0.0
	 */
	public function ajax_test_pattern() {
		check_ajax_referer( 'haptic_vibrate_test_pattern', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorised.', 'haptic-vibrate' ) ), 403 );
		}

		$preset     = isset( $_POST['preset'] ) ? sanitize_key( wp_unslash( $_POST['preset'] ) ) : 'single_short';
		$custom_raw = isset( $_POST['custom_pattern'] ) ? sanitize_text_field( wp_unslash( $_POST['custom_pattern'] ) ) : '';

		if ( 'custom' === $preset ) {
			$pattern = $this->parse_pattern_string( $custom_raw );
		} elseif ( isset( self::$presets[ $preset ] ) ) {
			$pattern = self::$presets[ $preset ]['pattern'];
		} else {
			$pattern = array( 200 );
		}

		wp_send_json_success( array( 'pattern' => $pattern ) );
	}

	/**
	 * Render the admin settings page.
	 *
	 * @since 1.0.0
	 */
	public function display_plugin_admin_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$settings = get_option( self::OPTION_KEY, get_option( self::LEGACY_OPTION_KEY, array() ) );
		$settings = wp_parse_args(
			$settings,
			array(
				'debug_mode' => false,
				'rules'      => array(),
			)
		);
		include HAPTIC_VIBRATE_PLUGIN_DIR . 'admin/partials/admin-display.php';
	}

	/**
	 * Build the generated class name for a rule.
	 *
	 * @since 1.0.0
	 * @param array $rule  Rule data.
	 * @param int   $index Rule index.
	 * @return string
	 */
	private function get_rule_class_name( $rule, $index ) {
		$preset = isset( $rule['preset'] ) ? sanitize_key( $rule['preset'] ) : 'single_short';

		if ( 'custom' === $preset ) {
			return 'haptic-vibrate-custom-' . ( absint( $index ) + 1 );
		}

		if ( ! isset( self::$presets[ $preset ] ) ) {
			$preset = 'single_short';
		}

		return 'haptic-vibrate-' . $preset;
	}

	/**
	 * Render a single rule row (used both in the page and the JS template).
	 *
	 * @since 1.0.0
	 * @param int|string $haptic_vibrate_index Row index (may be the literal string '{{INDEX}}' for the JS template).
	 * @param array      $haptic_vibrate_rule  Existing rule data, or empty array for a blank row.
	 */
	public function render_rule_row( $haptic_vibrate_index, $haptic_vibrate_rule ) {
		$selector       = isset( $haptic_vibrate_rule['selector'] ) ? $haptic_vibrate_rule['selector'] : '';
		$preset         = isset( $haptic_vibrate_rule['preset'] ) ? $haptic_vibrate_rule['preset'] : 'single_short';
		$custom_pattern = isset( $haptic_vibrate_rule['custom_pattern'] ) ? $haptic_vibrate_rule['custom_pattern'] : '';
		$opt            = self::OPTION_KEY;
		$idx            = (string) $haptic_vibrate_index;
		$custom_class   = 'custom' !== $preset ? ' haptic-hidden' : '';
		$class_name     = $this->get_rule_class_name( $haptic_vibrate_rule, absint( $haptic_vibrate_index ) );
		?>
		<div class="haptic-rule" data-index="<?php echo esc_attr( $idx ); ?>">
			<div class="haptic-rule__handle" aria-hidden="true" title="<?php esc_attr_e( 'Drag to reorder', 'haptic-vibrate' ); ?>">
				<span class="dashicons dashicons-menu"></span>
			</div>
			<div class="haptic-rule__fields">

				<!-- Row 1: selector / generated class -->
				<div class="haptic-rule__row haptic-rule__row--selector">
					<div class="haptic-field haptic-field--grow">
						<label class="haptic-field__label">
							<?php esc_html_e( 'CSS Selector', 'haptic-vibrate' ); ?>
						</label>
						<input
							type="text"
							name="<?php echo esc_attr( $opt ); ?>[rules][<?php echo esc_attr( $idx ); ?>][selector]"
							value="<?php echo esc_attr( $selector ); ?>"
							class="haptic-input haptic-rule__selector"
							placeholder=".my-button, #cta"
							spellcheck="false"
						/>
					</div>
					<div class="haptic-field haptic-field--class-preview">
						<label class="haptic-field__label">
							<?php esc_html_e( 'Pattern Class', 'haptic-vibrate' ); ?>
						</label>
						<div class="haptic-field__input-wrap haptic-field__input-wrap--prefix">
							<span class="haptic-field__prefix">.</span>
							<input
								type="text"
								value="<?php echo esc_attr( $class_name ); ?>"
								class="haptic-input haptic-rule__class-preview"
								data-preview-for="<?php echo esc_attr( $idx ); ?>"
								readonly
								aria-readonly="true"
								spellcheck="false"
							/>
						</div>
					</div>
				</div>

				<!-- Row 2: preset + custom pattern + test -->
				<div class="haptic-rule__row">
					<div class="haptic-field haptic-field--preset">
						<label class="haptic-field__label">
							<?php esc_html_e( 'Pattern Preset', 'haptic-vibrate' ); ?>
						</label>
						<select
							name="<?php echo esc_attr( $opt ); ?>[rules][<?php echo esc_attr( $idx ); ?>][preset]"
							class="haptic-select haptic-rule__preset"
						>
							<?php foreach ( self::$presets as $haptic_vibrate_key => $haptic_vibrate_preset ) : ?>
								<option
									value="<?php echo esc_attr( $haptic_vibrate_key ); ?>"
									data-pattern="<?php echo esc_attr( implode( ',', $haptic_vibrate_preset['pattern'] ) ); ?>"
									<?php selected( $preset, $haptic_vibrate_key ); ?>
								>
									<?php echo esc_html( $haptic_vibrate_preset['label'] ); ?>
								</option>
							<?php endforeach; ?>
						</select>
					</div>

					<div class="haptic-field haptic-field--custom<?php echo esc_attr( $custom_class ); ?>">
						<label class="haptic-field__label">
							<?php esc_html_e( 'Custom Pattern (ms)', 'haptic-vibrate' ); ?>
						</label>
						<input
							type="text"
							name="<?php echo esc_attr( $opt ); ?>[rules][<?php echo esc_attr( $idx ); ?>][custom_pattern]"
							value="<?php echo esc_attr( $custom_pattern ); ?>"
							class="haptic-input haptic-rule__custom-pattern"
							placeholder="200,100,200"
							spellcheck="false"
						/>
					</div>

					<!-- Inline test button for this rule's pattern -->
					<div class="haptic-field haptic-field--test">
						<label class="haptic-field__label haptic-invisible" aria-hidden="true">&nbsp;</label>
						<button
							type="button"
							class="haptic-btn haptic-btn--ghost haptic-rule__test-btn"
							title="<?php esc_attr_e( 'Test this pattern', 'haptic-vibrate' ); ?>"
						>
							<span class="dashicons dashicons-controls-play"></span>
						</button>
					</div>
				</div>

			</div><!-- /.haptic-rule__fields -->
			<div class="haptic-rule__remove">
				<button
					type="button"
					class="haptic-btn haptic-btn--danger haptic-btn--icon haptic-rule__remove-btn"
					title="<?php esc_attr_e( 'Remove rule', 'haptic-vibrate' ); ?>"
				>
					<span class="dashicons dashicons-trash"></span>
				</button>
			</div>
		</div><!-- /.haptic-rule -->
		<?php
	}

	/**
	 * Check whether the current admin page belongs to this plugin.
	 *
	 * @since 1.0.0
	 * @param  string $hook_suffix Current admin page hook.
	 * @return bool
	 */
	private function is_plugin_page( $hook_suffix ) {
		return false !== strpos( $hook_suffix, $this->plugin_name );
	}
}
