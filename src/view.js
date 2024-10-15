document.addEventListener('DOMContentLoaded', function() {
    const maps = document.querySelectorAll('.google-map');

    maps.forEach(mapElement => {
        const initialLat = parseFloat(mapElement.dataset.lat);
        const initialLng = parseFloat(mapElement.dataset.lng);
        const isStreetView = mapElement.dataset.isStreetView === 'true';
        const streetViewHeading = parseFloat(mapElement.dataset.svHeading);
        const streetViewPitch = parseFloat(mapElement.dataset.svPitch);
        const zoom = parseInt(mapElement.dataset.zoom, 10) || 10;
        const mapStyle = mapElement.dataset.mapStyle;

        // New data attributes for disabling controls
        const disableMovement = mapElement.dataset.disableMovement === 'true';
        const disableZoom = mapElement.dataset.disableZoom === 'true';
        const disableLabels = mapElement.dataset.disableLabels === 'true';
        const disableUIButtons = mapElement.dataset.disableUiButtons === 'true'; // Disable UI buttons

        // Retrieve the existing map style
        let currentStyle = aceMapBlock.styles[mapStyle] || [];

        // If disableLabels is true, extend the current style to remove labels
        if (disableLabels) {
            currentStyle = [
                ...currentStyle,
                {
                    "featureType": "all",
                    "elementType": "labels",
                    "stylers": [{ "visibility": "off" }]
                }
            ];
        }

        console.log('Map Style:', mapStyle);
        console.log('Modified Style with Disabled Labels:', currentStyle);

        // Initialize the map with options based on the block's attributes
        const mapOptions = {
            zoom: zoom,
            center: { lat: initialLat, lng: initialLng },
            styles: currentStyle,            // Apply the modified style
            draggable: !disableMovement,     // Disable map movement if true
            zoomControl: !disableZoom,       // Disable zoom controls if true
            disableDefaultUI: disableUIButtons, // Disable UI buttons if true
        };

        const map = new google.maps.Map(mapElement, mapOptions);

        // Add a marker at the initial lat/lng
        const marker = new google.maps.Marker({
            position: { lat: initialLat, lng: initialLng },
            map: map,
        });

        // Set up Street View
        const panorama = new google.maps.StreetViewPanorama(mapElement, {
            position: { lat: initialLat, lng: initialLng },
            pov: { heading: streetViewHeading, pitch: streetViewPitch },
            visible: isStreetView,  // Set initial visibility based on block data
        });

        // Conditionally enable Street View only if it's enabled
        if (isStreetView) {
            map.setStreetView(panorama);
        }

        // Toggle checkbox when switching between Street View and Map View via UI
        panorama.addListener('visible_changed', function () {
            const isVisible = panorama.getVisible();
            if (window.toggleStreetViewCheckbox) {
                window.toggleStreetViewCheckbox(isVisible);  // Update the Street View checkbox
            }

            // If Street View is hidden, reset the map center
            if (!isVisible) {
                map.setCenter(marker.getPosition());
            }
        });
    });
});
