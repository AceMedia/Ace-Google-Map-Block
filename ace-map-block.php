<?php
/**
 * Plugin Name:       Ace Map Block
 * Description:       Example block scaffolded with Create Block tool.
 * Requires at least: 6.6
 * Requires PHP:      7.2
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ace-map-block
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function create_block_ace_map_block_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_ace_map_block_block_init' );


// Create Options Page for API Key and Default Settings
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
            <?php settings_fields('ace_map_block_settings'); ?>
            <?php do_settings_sections('ace_map_block_settings'); ?>
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


// Enqueue Google Maps API with Places Library in the block editor
function ace_map_block_enqueue_google_maps_editor() {
    $api_key = get_option('ace_map_block_api_key'); // Assuming API key is stored in options
    if ($api_key) {
        wp_enqueue_script(
            'google-maps-api',
            'https://maps.googleapis.com/maps/api/js?key=' . esc_attr($api_key) . '&libraries=places', // Load the Places library
            array(),
            null,
            true
        );
    }
    // Enqueue the block editor script
    wp_enqueue_script(
        'ace-map-block-editor-js',
        plugins_url('build/index.js', __FILE__),
        array('wp-blocks', 'wp-element', 'wp-editor'),
        filemtime(plugin_dir_path(__FILE__) . 'build/index.js')
    );
}
add_action('enqueue_block_editor_assets', 'ace_map_block_enqueue_google_maps_editor'); // For block editor (admin)

// Enqueue Google Maps API for the frontend (without Places Library)
function ace_map_block_enqueue_google_maps_frontend() {
    $api_key = get_option('ace_map_block_api_key'); // Assuming API key is stored in options
    if ($api_key) {
        wp_enqueue_script(
            'google-maps-api',
            'https://maps.googleapis.com/maps/api/js?key=' . esc_attr($api_key), // No need for Places library on the frontend
            array(),
            null,
            true
        );
    }
    // Enqueue the frontend script for rendering the map
    wp_enqueue_script(
        'ace-map-block-frontend',
        plugins_url('build/view.js', __FILE__),
        array('google-maps-api'), // Ensure Google Maps API is loaded first
        filemtime(plugin_dir_path(__FILE__) . 'build/view.js'),
        true
    );
}
add_action('wp_enqueue_scripts', 'ace_map_block_enqueue_google_maps_frontend'); // For frontend
