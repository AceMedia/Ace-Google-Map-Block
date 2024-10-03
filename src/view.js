document.addEventListener('DOMContentLoaded', function() {
    const maps = document.querySelectorAll('.google-map');

    maps.forEach(mapElement => {
        const initialLat = parseFloat(mapElement.dataset.lat);
        const initialLng = parseFloat(mapElement.dataset.lng);
        const isStreetView = mapElement.dataset.isStreetView === 'true';
        const streetViewHeading = parseFloat(mapElement.dataset.svHeading);
        const streetViewPitch = parseFloat(mapElement.dataset.svPitch);

        const map = new google.maps.Map(mapElement, {
            zoom: 10,
            center: { lat: initialLat, lng: initialLng },
        });

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
        let lastLat = initialLat;
        let lastLng = initialLng;

        // Ensure updates only happen on explicit Street View interaction
        panorama.addListener('position_changed', function() {
            const svPosition = panorama.getPosition();
            if (svPosition && (svPosition.lat() !== lastLat || svPosition.lng() !== lastLng)) {
                lastLat = svPosition.lat();
                lastLng = svPosition.lng();

                // Update the address only if the user explicitly moves in Street View
                if (window.updateStreetViewAddress) {
                    window.updateStreetViewAddress(lastLat, lastLng);
                }
            }
        });

        // Handle selecting a new place and updating the map/Street View
        const placeSelectHandler = (newLat, newLng) => {
            lastLat = newLat;
            lastLng = newLng;

            map.setCenter({ lat: newLat, lng: newLng });
            marker.setPosition({ lat: newLat, lng: newLng });

            // Only update Street View if it's visible
            if (panorama.getVisible()) {
                panorama.setPosition({ lat: newLat, lng: newLng });
            }
        };

        // Bind this handler to the autocomplete functionality in your block editor
        window.onPlaceSelected = placeSelectHandler;
    });
});
