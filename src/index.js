import { useEffect, useRef, useState } from '@wordpress/element';
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, RangeControl, SelectControl } from '@wordpress/components';

registerBlockType('my-block/google-map', {
    title: 'Ace Google Map Block',
    icon: 'location-alt',
    category: 'widgets',
    attributes: {
        lat: { type: 'number', default: 51.5074 }, // Default to London
        lng: { type: 'number', default: -0.1278 },
        address: { type: 'string', default: '' },
        streetViewHeading: { type: 'number', default: 0 },
        streetViewPitch: { type: 'number', default: 0 },
        isStreetView: { type: 'boolean', default: false },
        zoom: { type: 'number', default: 8 },
        mapStyle: { type: 'string', default: '' },
    },
    edit: ({ attributes, setAttributes }) => {
        const {
            lat,
            lng,
            address,
            streetViewHeading,
            streetViewPitch,
            isStreetView,
            zoom,
            mapStyle,
        } = attributes;

        const mapRef = useRef(null);
        const searchRef = useRef(null); // Ref for the location search input
        const [map, setMap] = useState(null);
        const [marker, setMarker] = useState(null);
        const [panorama, setPanorama] = useState(null);

        const geocoder = new google.maps.Geocoder(); // To reverse geocode when clicking on the map

        // Reverse geocode function to get address when clicking on map
        const reverseGeocode = (lat, lng) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setAttributes({ address: results[0].formatted_address });
                }
            });
        };

        const setupStreetViewListeners = (streetViewPanorama) => {
            const handlePositionChange = () => {
                const svLocation = streetViewPanorama.getPosition();
                if (svLocation) {
                    setAttributes({
                        lat: svLocation.lat(),
                        lng: svLocation.lng(),
                    });
                }
            };

            const handlePovChange = () => {
                const svPov = streetViewPanorama.getPov();
                setAttributes({
                    streetViewHeading: svPov.heading,
                    streetViewPitch: svPov.pitch,
                });
            };

            streetViewPanorama.addListener('position_changed', handlePositionChange);
            streetViewPanorama.addListener('pov_changed', handlePovChange);
        };

        useEffect(() => {
            if (mapRef.current && !map) {
                const googleMap = new google.maps.Map(mapRef.current, {
                    zoom: zoom,
                    center: { lat, lng },
                    styles: aceMapBlock.styles[mapStyle] || null,
                });
                setMap(googleMap);

                const mapMarker = new google.maps.Marker({
                    position: { lat, lng },
                    map: googleMap,
                    draggable: true,
                });
                setMarker(mapMarker);

                const streetViewPanorama = googleMap.getStreetView();
                setPanorama(streetViewPanorama);

                // Listen for Street View visibility changes and update the checkbox accordingly
                streetViewPanorama.addListener('visible_changed', function () {
                    const isVisible = streetViewPanorama.getVisible();
                    setAttributes({ isStreetView: isVisible }); // Automatically toggle the "Is Street View?" checkbox
                });

                if (isStreetView) {
                    streetViewPanorama.setPosition({ lat, lng });
                    streetViewPanorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                    streetViewPanorama.setVisible(true);
                    setupStreetViewListeners(streetViewPanorama);
                }

                // Listen for clicks on the map to update the marker and coordinates
                googleMap.addListener('click', (e) => {
                    const clickedLat = e.latLng.lat();
                    const clickedLng = e.latLng.lng();
                    mapMarker.setPosition({ lat: clickedLat, lng: clickedLng });

                    // Reverse geocode to get the address for the clicked location
                    reverseGeocode(clickedLat, clickedLng);

                    setAttributes({ lat: clickedLat, lng: clickedLng, isStreetView: false });
                    streetViewPanorama.setVisible(false); // Exit Street View if a pin is placed
                });

                // Listen for zoom changes on the map to update the zoom attribute
                googleMap.addListener('zoom_changed', () => {
                    setAttributes({ zoom: googleMap.getZoom() });
                });

                if (searchRef.current) {
                    const autocomplete = new google.maps.places.Autocomplete(searchRef.current);
                    autocomplete.bindTo('bounds', googleMap);

                    // Listen for place selection and update the UI accordingly
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();

                        if (!place.geometry || !place.geometry.location) {
                            return;
                        }

                        const newLat = place.geometry.location.lat();
                        const newLng = place.geometry.location.lng();

                        // Update the map center and marker position
                        googleMap.setCenter({ lat: newLat, lng: newLng });
                        mapMarker.setPosition({ lat: newLat, lng: newLng });

                        // Set the address and coordinates from Places Autocomplete (priority to the selected place address)
                        setAttributes({
                            lat: newLat,
                            lng: newLng,
                            address: place.formatted_address || '',  // Always use the selected Places address
                            isStreetView: isStreetView // Keep current street view state
                        });

                        // Update Street View if it's active
                        if (isStreetView) {
                            streetViewPanorama.setPosition({ lat: newLat, lng: newLng });
                            streetViewPanorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                            streetViewPanorama.setVisible(true);  // Ensure Street View remains visible
                        }
                    });
                }
            }
        }, [mapRef, map, mapStyle]);

        useEffect(() => {
            if (map) {
                map.setZoom(zoom);
            }
        }, [zoom]);

        useEffect(() => {
            if (map) {
                map.setOptions({ styles: aceMapBlock.styles[mapStyle] || null });
            }
        }, [mapStyle]);

        return (
            <>
                <InspectorControls>
                    <PanelBody title="Map Settings">
                        <TextControl
                            label="Latitude"
                            value={lat}
                            onChange={(value) => setAttributes({ lat: parseFloat(value) })}
                        />
                        <TextControl
                            label="Longitude"
                            value={lng}
                            onChange={(value) => setAttributes({ lng: parseFloat(value) })}
                        />
                        <TextControl
                            label="Address"
                            value={address}
                            disabled // Make the address field read-only
                        />
                        <RangeControl
                            label="Zoom Level"
                            value={zoom}
                            onChange={(value) => setAttributes({ zoom: value })}
                            min={1}
                            max={20}
                        />
                        <ToggleControl
                            label="Is Street View?"
                            checked={isStreetView}
                            onChange={() => {
                                if (panorama) {
                                    if (isStreetView) {
                                        panorama.setVisible(false); // Switch back to the map view
                                    } else {
                                        panorama.setPosition({ lat, lng });
                                        panorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                                        panorama.setVisible(true); // Enter Street View
                                        setupStreetViewListeners(panorama);
                                    }
                                }
                                setAttributes({ isStreetView: !isStreetView });
                            }}
                        />
                        {isStreetView && (
                            <>
                                <TextControl
                                    label="Street View Heading"
                                    value={streetViewHeading}
                                    onChange={(value) => setAttributes({ streetViewHeading: parseFloat(value) })}
                                />
                                <TextControl
                                    label="Street View Pitch"
                                    value={streetViewPitch}
                                    onChange={(value) => setAttributes({ streetViewPitch: parseFloat(value) })}
                                />
                            </>
                        )}
                        <SelectControl
                            label="Map Style"
                            value={mapStyle}
                            options={[
                                { label: 'Default', value: '' },
                                ...Object.keys(aceMapBlock.styles).map(style => ({ label: style, value: style }))
                            ]}
                            onChange={(value) => setAttributes({ mapStyle: value })}
                        />
                    </PanelBody>
                </InspectorControls>
                <div>
                    {/* Location search input */}
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search for a location"
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '10px',
                        }}
                    />
                    {/* Map */}
                    <div
                        ref={mapRef}
                        style={{ width: '100%', height: '600px', backgroundColor: '#e5e5e5' }}
                    ></div>
                </div>
            </>
        );
    },
    save: ({ attributes }) => {
        const { lat, lng, address, streetViewHeading, streetViewPitch, isStreetView, zoom, mapStyle } = attributes;
    
        return (
            <div>
                <div
                    className="google-map"
                    data-lat={lat}
                    data-lng={lng}
                    data-sv-heading={streetViewHeading}
                    data-sv-pitch={streetViewPitch}
                    data-is-street-view={isStreetView}
                    data-zoom={zoom}
                    data-map-style={mapStyle}
                    style={{ width: '100%', height: '600px' }}
                ></div>
                <p>{address}</p>
            </div>
        );
    },
});