<?php
/**
 * Plugin Name:       Ace Google Map Block
 * Description:       The modern way to handle Google Maps within Wordpress.
 * Requires at least: 6.6
 * Requires PHP:      7.2
 * Version:           0.421
 * Author:            Shane Rounce
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ace-map-block
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

function create_block_ace_map_block_block_init() {
    register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_ace_map_block_block_init' );

function ace_map_block_register_settings() {
    register_setting('ace_map_block_settings', 'ace_map_block_api_key');
    register_setting('ace_map_block_settings', 'ace_map_block_default_city');
}
add_action('admin_init', 'ace_map_block_register_settings');

function ace_map_block_add_admin_menu() {
    add_options_page('Google Maps Block Settings', 'Google Maps Block', 'manage_options', 'ace-map-block-settings', 'ace_map_block_settings_page');
}
add_action('admin_menu', 'ace_map_block_add_admin_menu');

function ace_map_block_settings_page() {
    ?>
    <div class="wrap">
        <h1>Google Maps Block Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('ace_map_block_settings');
            do_settings_sections('ace_map_block_settings');
            ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Google Maps API Key</th>
                    <td><input type="text" name="ace_map_block_api_key" value="<?php echo esc_attr(get_option('ace_map_block_api_key')); ?>" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row">Default City</th>
                    <td><input type="text" name="ace_map_block_default_city" value="<?php echo esc_attr(get_option('ace_map_block_default_city')); ?>" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

function ace_map_block_enqueue_google_maps_scripts($is_editor = false) {
    $api_key = get_option('ace_map_block_api_key');
    if ($api_key) {
        $url = 'https://maps.googleapis.com/maps/api/js?key=' . esc_attr($api_key);
        if ($is_editor) {
            $url .= '&libraries=places';
        }
        wp_enqueue_script(
            'google-maps-api',
            $url,
            array(),
            null,
            true
        );
    } else {
        error_log('Google Maps API key is not set.');
        return;
    }

    $script_handle = $is_editor ? 'ace-map-block-editor-js' : 'ace-map-block-frontend';
    $script_file = $is_editor ? 'build/index.js' : 'build/view.js';
    $dependencies = $is_editor ? array('wp-blocks', 'wp-element', 'wp-editor') : array('google-maps-api');
    
    wp_enqueue_script(
        $script_handle,
        plugins_url($script_file, __FILE__),
        $dependencies,
        filemtime(plugin_dir_path(__FILE__) . $script_file),
        true
    );
}

add_action('enqueue_block_editor_assets', function() {
    ace_map_block_enqueue_google_maps_scripts(true);
});

add_action('wp_enqueue_scripts', 'ace_map_block_enqueue_google_maps_scripts');