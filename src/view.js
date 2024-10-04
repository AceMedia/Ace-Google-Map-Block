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

        console.log('Map Style:', mapStyle);
        console.log('Available Styles:', aceMapBlock.styles);

        const mapOptions = {
            zoom: zoom,
            center: { lat: initialLat, lng: initialLng },
            styles: aceMapBlock.styles[mapStyle] || null,
        };

        const map = new google.maps.Map(mapElement, mapOptions);

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

        // Track the last position to prevent redundant updates
    });
});