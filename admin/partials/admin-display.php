<?php
/**
 * Provides the admin settings page view for the plugin.
 *
 * @package WP_Haptic_Vibrate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="haptic-wrap">

	<!-- ── Page Header ─────────────────────────────────────────────── -->
	<div class="haptic-header">
		<div class="haptic-header__inner">
			<span class="haptic-header__icon" aria-hidden="true">📳</span>
			<div>
				<h1 class="haptic-header__title">
					<?php esc_html_e( 'WP Haptic Vibrate', 'wp-haptic-vibrate' ); ?>
				</h1>
				<p class="haptic-header__subtitle">
					<?php esc_html_e( 'Add haptic vibration feedback to any element on your site.', 'wp-haptic-vibrate' ); ?>
				</p>
			</div>
		</div>
	</div>

	<?php settings_errors( 'wp_haptic_vibrate_settings' ); ?>

	<form method="post" action="options.php" id="haptic-settings-form">
		<?php settings_fields( 'wp_haptic_vibrate_group' ); ?>

		<div class="haptic-grid">

			<!-- ── Left column ──────────────────────────────────────── -->
			<div class="haptic-col haptic-col--main">

				<!-- Vibration Rules Card -->
				<div class="haptic-card" id="haptic-rules-card">
					<div class="haptic-card__header">
						<h2 class="haptic-card__title">
							<span class="dashicons dashicons-admin-links" aria-hidden="true"></span>
							<?php esc_html_e( 'Vibration Rules', 'wp-haptic-vibrate' ); ?>
						</h2>
						<p class="haptic-card__desc">
							<?php
							esc_html_e(
								'Map CSS selectors or generated pattern classes to vibration patterns. Each rule listens for common user interactions on matching elements.',
								'wp-haptic-vibrate'
							);
							?>
						</p>
					</div>

					<div class="haptic-card__body">

						<!-- Rules list -->
						<div id="haptic-rules-list" class="haptic-rules-list">
							<?php if ( ! empty( $settings['rules'] ) ) : ?>
								<?php foreach ( $settings['rules'] as $index => $rule ) : ?>
									<?php
									$this->render_rule_row( $index, $rule );
									?>
								<?php endforeach; ?>
							<?php else : ?>
								<div class="haptic-rules-empty" id="haptic-rules-empty">
									<span class="haptic-rules-empty__icon" aria-hidden="true">🎯</span>
									<p><?php esc_html_e( 'No rules yet. Click "Add Rule" to get started.', 'wp-haptic-vibrate' ); ?></p>
								</div>
							<?php endif; ?>
						</div>

						<!-- Add Rule button -->
						<div class="haptic-rules-actions">
							<button type="button" id="haptic-add-rule" class="haptic-btn haptic-btn--primary">
								<span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span>
								<?php esc_html_e( 'Add Rule', 'wp-haptic-vibrate' ); ?>
							</button>
						</div>

					</div><!-- /.haptic-card__body -->
				</div><!-- /#haptic-rules-card -->

			</div><!-- /.haptic-col--main -->

			<!-- ── Right column ─────────────────────────────────────── -->
			<div class="haptic-col haptic-col--sidebar">

				<!-- Debug Mode Card -->
				<div class="haptic-card haptic-card--compact" id="haptic-debug-card">
					<div class="haptic-card__header">
						<h2 class="haptic-card__title">
							<span class="dashicons dashicons-desktop" aria-hidden="true"></span>
							<?php esc_html_e( 'Desktop Debug Mode', 'wp-haptic-vibrate' ); ?>
						</h2>
					</div>
					<div class="haptic-card__body">
						<p class="haptic-field__help">
							<?php
							esc_html_e(
								'When enabled, desktop browsers that don\'t support the Vibration API receive a visual ripple effect and a short audio beep instead. Useful for testing without a mobile device.',
								'wp-haptic-vibrate'
							);
							?>
						</p>

						<label class="haptic-toggle" for="haptic-debug-mode">
							<input
								type="checkbox"
								id="haptic-debug-mode"
								name="<?php echo esc_attr( WP_Haptic_Vibrate_Admin::OPTION_KEY ); ?>[debug_mode]"
								value="1"
								<?php checked( ! empty( $settings['debug_mode'] ) ); ?>
							/>
							<span class="haptic-toggle__track" aria-hidden="true"></span>
							<span class="haptic-toggle__label">
								<?php esc_html_e( 'Enable debug mode', 'wp-haptic-vibrate' ); ?>
							</span>
						</label>

						<div class="haptic-debug-preview" id="haptic-debug-preview" aria-hidden="true">
							<div class="haptic-ripple-demo">
								<div class="haptic-ripple-demo__circle"></div>
								<span><?php esc_html_e( 'Visual ripple preview', 'wp-haptic-vibrate' ); ?></span>
							</div>
						</div>
					</div>
				</div>

				<!-- Pattern Tester Card -->
				<div class="haptic-card haptic-card--compact" id="haptic-tester-card">
					<div class="haptic-card__header">
						<h2 class="haptic-card__title">
							<span class="dashicons dashicons-controls-play" aria-hidden="true"></span>
							<?php esc_html_e( 'Pattern Tester', 'wp-haptic-vibrate' ); ?>
						</h2>
					</div>
					<div class="haptic-card__body">
						<p class="haptic-field__help">
							<?php esc_html_e( 'Quickly preview any pattern on this device.', 'wp-haptic-vibrate' ); ?>
						</p>

						<div class="haptic-field">
							<label for="haptic-tester-preset" class="haptic-field__label">
								<?php esc_html_e( 'Preset', 'wp-haptic-vibrate' ); ?>
							</label>
							<select id="haptic-tester-preset" class="haptic-select">
								<?php foreach ( WP_Haptic_Vibrate_Admin::$presets as $key => $preset ) : ?>
									<option value="<?php echo esc_attr( $key ); ?>">
										<?php echo esc_html( $preset['label'] ); ?>
									</option>
								<?php endforeach; ?>
							</select>
						</div>

						<div class="haptic-field" id="haptic-tester-custom-wrap" style="display:none;">
							<label for="haptic-tester-custom" class="haptic-field__label">
								<?php esc_html_e( 'Custom pattern (ms, comma-separated)', 'wp-haptic-vibrate' ); ?>
							</label>
							<input
								type="text"
								id="haptic-tester-custom"
								class="haptic-input"
								placeholder="200,100,200"
							/>
						</div>

						<button type="button" id="haptic-tester-btn" class="haptic-btn haptic-btn--accent haptic-btn--full">
							<span class="dashicons dashicons-controls-play" aria-hidden="true"></span>
							<?php esc_html_e( 'Test Pattern', 'wp-haptic-vibrate' ); ?>
						</button>

						<div id="haptic-tester-status" class="haptic-tester-status" role="status" aria-live="polite"></div>
					</div>
				</div>

				<!-- Save Changes -->
				<div class="haptic-card haptic-card--compact haptic-card--save">
					<div class="haptic-card__body">
						<?php submit_button( __( 'Save Settings', 'wp-haptic-vibrate' ), 'haptic-btn haptic-btn--primary haptic-btn--full haptic-save-btn', 'submit', false ); ?>
					</div>
				</div>

			</div><!-- /.haptic-col--sidebar -->

		</div><!-- /.haptic-grid -->

	</form><!-- /#haptic-settings-form -->

</div><!-- /.haptic-wrap -->

<!-- Rule row template (hidden) – cloned by JS -->
<script type="text/html" id="haptic-rule-template">
	<?php $this->render_rule_row( '{{INDEX}}', array() ); ?>
</script>
<?php
