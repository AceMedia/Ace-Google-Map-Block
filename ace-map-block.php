<?php
/**
 * Plugin Name:       Ace Google Map Block
 * Description:       The modern way to handle Google Maps within Wordpress.
 * Requires at least: 6.6
 * Requires PHP:      7.2
 * Version:           0.420
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

// include_once plugin_dir_path( __FILE__ ) . 'update.php';

function create_block_ace_map_block_block_init() {
    register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_ace_map_block_block_init' );

function ace_map_block_register_settings() {
    // Register settings
    register_setting('ace_map_block_settings', 'ace_map_block_api_key');
    register_setting('ace_map_block_settings', 'ace_map_block_default_city');
    register_setting('ace_map_block_settings', 'ace_map_block_disable_zoom');
    register_setting('ace_map_block_settings', 'ace_map_block_disable_labels');
    register_setting('ace_map_block_settings', 'ace_map_block_disable_ui_buttons');
    register_setting('ace_map_block_settings', 'ace_map_block_disable_movement');

    // Section for API Key and Default City
    add_settings_section(
        'ace_map_block_api_section', // Section ID
        'API Settings',              // Section Title
        '__return_false',            // Callback (optional, can be set to NULL or false)
        'ace_map_block_settings'     // Page slug (matches form action target)
    );

    // API Key field
    add_settings_field(
        'ace_map_block_api_key',                  // Field ID
        'Google Maps API Key',                    // Field Title
        'ace_map_block_render_api_key_field',     // Callback to render the field
        'ace_map_block_settings',                 // Page slug (same as form target)
        'ace_map_block_api_section'               // Section ID
    );

    // Default City field
    add_settings_field(
        'ace_map_block_default_city',
        'Default City',
        'ace_map_block_render_default_city_field',
        'ace_map_block_settings',
        'ace_map_block_defaults_section'
    );

    // Section for Map Defaults
    add_settings_section(
        'ace_map_block_defaults_section',
        'Map Default Settings',
        '__return_false',
        'ace_map_block_settings'
    );

    // Disable Zoom field
    add_settings_field(
        'ace_map_block_disable_zoom',
        'Disable Zoom',
        'ace_map_block_render_disable_zoom_field',
        'ace_map_block_settings',
        'ace_map_block_defaults_section'
    );

    // Disable Labels field
    add_settings_field(
        'ace_map_block_disable_labels',
        'Disable Labels',
        'ace_map_block_render_disable_labels_field',
        'ace_map_block_settings',
        'ace_map_block_defaults_section'
    );

    // Disable UI Buttons field
    add_settings_field(
        'ace_map_block_disable_ui_buttons',
        'Disable UI Buttons',
        'ace_map_block_render_disable_ui_buttons_field',
        'ace_map_block_settings',
        'ace_map_block_defaults_section'
    );

    // Disable Map Movement field
    add_settings_field(
        'ace_map_block_disable_movement',
        'Disable Map Movement',
        'ace_map_block_render_disable_movement_field',
        'ace_map_block_settings',
        'ace_map_block_defaults_section'
    );
}
add_action('admin_init', 'ace_map_block_register_settings');

// Render API Key field
function ace_map_block_render_api_key_field() {
    $api_key = get_option('ace_map_block_api_key');
    echo '<input type="text" name="ace_map_block_api_key" value="' . esc_attr($api_key) . '" class="regular-text" />';
}

// Render Default City field
function ace_map_block_render_default_city_field() {
    $default_city = get_option('ace_map_block_default_city');
    echo '<input type="text" name="ace_map_block_default_city" value="' . esc_attr($default_city) . '" class="regular-text" />';
}

// Render Disable Zoom field
function ace_map_block_render_disable_zoom_field() {
    $disable_zoom = get_option('ace_map_block_disable_zoom');
    echo '<input type="checkbox" name="ace_map_block_disable_zoom" value="1" ' . checked(1, $disable_zoom, false) . ' />';
}

// Render Disable Labels field
function ace_map_block_render_disable_labels_field() {
    $disable_labels = get_option('ace_map_block_disable_labels');
    echo '<input type="checkbox" name="ace_map_block_disable_labels" value="1" ' . checked(1, $disable_labels, false) . ' />';
}

// Render Disable UI Buttons field
function ace_map_block_render_disable_ui_buttons_field() {
    $disable_ui_buttons = get_option('ace_map_block_disable_ui_buttons');
    echo '<input type="checkbox" name="ace_map_block_disable_ui_buttons" value="1" ' . checked(1, $disable_ui_buttons, false) . ' />';
}

// Render Disable Map Movement field
function ace_map_block_render_disable_movement_field() {
    $disable_movement = get_option('ace_map_block_disable_movement');
    echo '<input type="checkbox" name="ace_map_block_disable_movement" value="1" ' . checked(1, $disable_movement, false) . ' />';
}


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
            do_settings_sections('ace_map_block_settings'); // This outputs all sections and their fields
            submit_button();
            ?>
        </form>
    </div>
    <?php
}



function ace_map_block_enqueue_google_maps_scripts($is_editor = false) {
    $api_key = get_option('ace_map_block_api_key');
    $disable_zoom = get_option('ace_map_block_disable_zoom');
    $disable_labels = get_option('ace_map_block_disable_labels');
    $disable_ui_buttons = get_option('ace_map_block_disable_ui_buttons');
    $disable_movement = get_option('ace_map_block_disable_movement');

    if ($api_key) {
        $url = 'https://maps.googleapis.com/maps/api/js?key=' . esc_attr($api_key) . '&libraries=places'; // Ensure this is loaded only once

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

    wp_localize_script(
        $script_handle,
        'aceMapBlockDefaults',
        array(
            'disableZoom' => (bool) get_option('ace_map_block_disable_zoom', false),
            'disableLabels' => (bool) get_option('ace_map_block_disable_labels', false),
            'disableUIButtons' => (bool) get_option('ace_map_block_disable_ui_buttons', false),
            'disableMovement' => (bool) get_option('ace_map_block_disable_movement', false),
        )
    );


    // Localize styles if needed
    $styles = array();
    $styles_dirs = array(
        plugin_dir_path(__FILE__) . 'styles/',
        wp_upload_dir()['basedir'] . '/map-styles/'
    );

    foreach ($styles_dirs as $styles_dir) {
        if (is_dir($styles_dir)) {
            $files = scandir($styles_dir);
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                    $style_name = pathinfo($file, PATHINFO_FILENAME);
                    $style_content = file_get_contents($styles_dir . $file);
                    $styles[$style_name] = json_decode($style_content, true);
                }
            }
        }
    }

    wp_localize_script($script_handle, 'aceMapBlock', array(
        'apiKey' => $api_key,
        'styles' => $styles,
    ));
}



add_action('enqueue_block_editor_assets', function() {
    ace_map_block_enqueue_google_maps_scripts(true);
});

add_action('wp_enqueue_scripts', 'ace_map_block_enqueue_google_maps_scripts');


function ace_map_block_traverse_blocks( $blocks, &$maps_data ) {
    foreach ( $blocks as $block ) {
        if ( 'my-block/google-map' === $block['blockName'] ) { // Correct block name
            // Extract block attributes, prioritize block-level settings over global defaults
            $attributes = $block['attrs'];

            // Organized attributes in a more logical order
            $map_entry = array(
                'latitude' => isset( $attributes['lat'] ) ? $attributes['lat'] : '',
                'longitude' => isset( $attributes['lng'] ) ? $attributes['lng'] : '',
                'address' => isset( $attributes['address'] ) ? $attributes['address'] : '',
                'zoom' => isset( $attributes['zoom'] ) ? $attributes['zoom'] : 8,
                'mapStyle' => isset( $attributes['mapStyle'] ) ? $attributes['mapStyle'] : 'default',
                'isStreetView' => isset( $attributes['isStreetView'] ) ? (bool) $attributes['isStreetView'] : false,
                'streetViewHeading' => isset( $attributes['streetViewHeading'] ) ? $attributes['streetViewHeading'] : 0,
                'streetViewPitch' => isset( $attributes['streetViewPitch'] ) ? $attributes['streetViewPitch'] : 0,
                'disableMovement' => isset( $attributes['disableMovement'] ) ? (bool) $attributes['disableMovement'] : (bool)get_option( 'ace_map_block_disable_movement', true ),
                'disableZoom' => isset( $attributes['disableZoom'] ) ? (bool) $attributes['disableZoom'] : (bool)get_option( 'ace_map_block_disable_zoom', false ),
                'disableLabels' => isset( $attributes['disableLabels'] ) ? (bool) $attributes['disableLabels'] : (bool)get_option( 'ace_map_block_disable_labels', false ),
                'disableUIButtons' => isset( $attributes['disableUIButtons'] ) ? (bool) $attributes['disableUIButtons'] : (bool)get_option( 'ace_map_block_disable_ui_buttons', true ),
                'mapIsImage' => isset( $attributes['mapIsImage'] ) ? (bool) $attributes['mapIsImage'] : false,
                'mapAsBackground' => isset( $attributes['mapAsBackground'] ) ? (bool) $attributes['mapAsBackground'] : false,
                'showMarker' => isset( $attributes['showMarker'] ) ? (bool) $attributes['showMarker'] : true,
            );

            // Add map entry to maps_data
            $maps_data[] = $map_entry;
        }

        // If there are inner blocks, recursively traverse them
        if ( ! empty( $block['innerBlocks'] ) ) {
            ace_map_block_traverse_blocks( $block['innerBlocks'], $maps_data );
        }
    }
}

function ace_map_block_save_post( $post_id ) {
    // Check if the post is valid and not autosaving
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }

    // Check if this is a valid request
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    // Get all block data from the post content
    $post_content = get_post_field( 'post_content', $post_id );
    $blocks = parse_blocks( $post_content );

    $maps_data = array();
    ace_map_block_traverse_blocks( $blocks, $maps_data ); // Traverse the blocks

    // Save the map data as post meta
    if ( ! empty( $maps_data ) ) {
        update_post_meta( $post_id, '_ace_google_map_data', $maps_data );
    } else {
        delete_post_meta( $post_id, '_ace_google_map_data' ); // Clean up if no maps exist
    }
}


add_action('save_post', 'ace_map_block_save_post');



add_action('rest_api_init', 'ace_map_block_register_rest_route');

function ace_map_block_register_rest_route() {
    register_rest_route('ace-map/v1', '/maps/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'ace_map_block_get_maps_data',
        'permission_callback' => '__return_true', // Make this publicly accessible
    ));

    // New route for listing all posts with map data
    register_rest_route('ace-map/v1', '/maps', array(
        'methods' => 'GET',
        'callback' => 'ace_map_block_get_maps_data',
        'permission_callback' => '__return_true', // Make this publicly accessible
    ));
}

function ace_map_process_maps_data( &$maps_data ) {
    foreach ( $maps_data as &$map ) {
        if ( ! empty( $map['isStreetView'] ) ) {
            // Unset unnecessary fields for Street View API response
            unset(
                $map['disableZoom'],
                $map['disableLabels'],
                $map['disableUIButtons'],
                $map['mapIsImage'],
                $map['showMarker']
            );
        }

        if ( ! empty( $map['mapIsImage'] ) ) {
            // Build the static map image URL
            $api_key = get_option( 'ace_map_block_api_key' );

            $map['imageUrl'] = sprintf(
                'https://maps.googleapis.com/maps/api/staticmap?center=%s,%s&zoom=%d&size=600x400&key=%s%s',
                $map['latitude'],
                $map['longitude'],
                $map['zoom'] ?? 8,  // Use the default zoom if not set
                $api_key,  // Your Google Maps API key
                ! empty( $map['showMarker'] ) ? '&markers=color:red%7C' . $map['latitude'] . ',' . $map['longitude'] : ''
            );

            // Unset unnecessary fields for Image API response
            unset(
                $map['mapStyle'],
                $map['disableLabels'],
                $map['disableUIButtons'],
                $map['disableZoom'],
                $map['disableMovement'],
                $map['isStreetView']
            );
        }
    }
}

function ace_map_block_get_maps_data( $data ) {
    // Check if a post ID is provided in the request
    $post_id = isset( $data['id'] ) ? (int) $data['id'] : null;

    // If no post ID is provided, list all posts with map data
    if ( is_null( $post_id ) ) {
        // Query all posts that have map data saved in meta
        $args = array(
            'post_type' => 'any', // Or specify your custom post type
            'meta_query' => array(
                array(
                    'key'     => '_ace_google_map_data', // The meta key for map data
                    'compare' => 'EXISTS', // Ensures only posts with map data are returned
                ),
            ),
        );

        $posts    = get_posts( $args );
        $response = array();

        // Loop through each post
        foreach ( $posts as $post ) {
            $maps_data = get_post_meta( $post->ID, '_ace_google_map_data', true );

            if ( ! empty( $maps_data ) ) {
                // Process map data to remove unnecessary fields
                ace_map_process_maps_data( $maps_data );

                // Prepare the response data for each post
                $response[] = array(
                    'id'    => $post->ID,
                    'title' => get_the_title( $post->ID ),
                    'link'  => get_permalink( $post->ID ),
                    'maps'  => $maps_data, // Include the processed map data
                );
            }
        }

        // If no posts with maps found, return a WP_Error
        if ( empty( $response ) ) {
            return new WP_Error( 'no_maps', 'No posts with map data found', array( 'status' => 404 ) );
        }

        return rest_ensure_response( $response );
    }

    // Handle single post data if a post ID is provided
    $maps_data = get_post_meta( $post_id, '_ace_google_map_data', true );

    print_r($maps_data);    

    if ( empty( $maps_data ) ) {
        return new WP_Error( 'no_maps', 'No map data found', array( 'status' => 404 ) );
    }

    // Process the map data to remove unnecessary fields
    ace_map_process_maps_data( $maps_data );

    return rest_ensure_response( $maps_data );
}

