// Check for plugin updates
function ace_check_for_plugin_update( $transient ) {
    $plugin_slug = 'Ace-Google-Map-Block';  // Make sure this slug is unique for each plugin
    $plugin_data = get_plugin_data( __FILE__ );
    $current_version = $plugin_data['Version'];

    // URL of your GitHub repository's latest release
    $github_api_url = 'https://api.github.com/repos/AceMedia/Ace-Google-Map-Block/releases/latest';

    // Fetch release info from GitHub
    $response = wp_remote_get( $github_api_url );
    print_r($response);

    if ( is_wp_error( $response ) ) {
        return $transient;
    }

    $release_info = json_decode( wp_remote_retrieve_body( $response ), true );
    
    if ( isset( $release_info['tag_name'] ) && version_compare( $current_version, $release_info['tag_name'], '<' ) ) {
        $plugin_slug_with_path = plugin_basename( __FILE__ );
        $transient->response[$plugin_slug_with_path] = (object) array(
            'slug'        => $plugin_slug,
            'new_version' => $release_info['tag_name'],
            'url'         => $release_info['html_url'],
            'package'     => $release_info['zipball_url'],
        );
    }

    return $transient;
}
add_filter( 'pre_set_site_transient_update_plugins', 'ace_check_for_plugin_update' );

// Display plugin update info
function ace_plugin_update_info( $false, $action, $response ) {
    if ( isset( $response->slug ) && $response->slug === 'your-plugin-slug' ) {
        $response->tested = '6.7';
        $response->requires = '5.6';
        $response->requires_php = '7.4';
    }
    return $false;
}
add_filter( 'plugins_api', 'ace_plugin_update_info', 10, 3 );
