<?php

// Check for plugin updates
function ace_check_for_plugin_update( $transient ) {
    $plugin_slug = 'acemedia-Google-Map-Block';
    $plugin_data = get_plugin_data( __FILE__ );
    $current_version = $plugin_data['Version'];
    
    // Correctly get the slug with path
    $plugin_slug_with_path = plugin_basename( __FILE__ );

    // GitHub API for the latest release
    $github_api_url = 'https://api.github.com/repos/AceMedia/Ace-Google-Map-Block/releases/latest';

    // Your GitHub Personal Access Token
    $access_token = 'your_personal_access_token';  // Replace with your actual token

    // Add the Authorization header with the token to avoid rate-limiting
    $args = array(
        'headers' => array(
            'Authorization' => 'token ' . $access_token
        )
    );

    // Fetch release info from GitHub with authentication
    $response = wp_remote_get( $github_api_url, $args );

    if ( is_wp_error( $response ) ) {
        return $transient;
    }

    $release_info = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( isset( $release_info['tag_name'] ) ) {
        $new_version = ltrim( $release_info['tag_name'], 'v' );

        // Compare current version with the new version
        if ( version_compare( $current_version, $new_version, '<' ) ) {
            // Manually set the redirected download URL
            $final_zip_url = 'https://codeload.github.com/AceMedia/Ace-Google-Map-Block/legacy.zip/refs/tags/v' . $new_version;

            // Update transient with new version info
            $transient->response[$plugin_slug_with_path] = (object) array(
                'slug'        => $plugin_slug,
                'new_version' => $new_version,
                'url'         => $release_info['html_url'],
                'package'     => $final_zip_url,  // Use the final zip URL
            );
        }
    }

    // Debug output to verify plugin slug and update data
    echo '<pre style="margin-left: 200px;">';
    print_r($transient->response[$plugin_slug_with_path]);
    echo '</pre>';
    
    return $transient;
}
add_filter( 'pre_set_site_transient_update_plugins', 'acemedia_check_for_plugin_update' );

// Display plugin update info
function ace_plugin_update_info( $false, $action, $response ) {
    if ( isset( $response->slug ) && $response->slug === 'acemedia-Google-Map-Block' ) {
        $response->tested = '6.7';
        $response->requires = '5.6';
        $response->requires_php = '7.4';
    }
    return $false;
}
add_filter( 'plugins_api', 'acemedia_plugin_update_info', 10, 3 );

