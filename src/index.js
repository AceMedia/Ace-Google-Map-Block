import { useEffect, useRef, useState } from '@wordpress/element';
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, RangeControl, SelectControl } from '@wordpress/components';

const ALLOWED_BLOCKS = [ 'core/paragraph', 'core/heading', 'core/image' ];

const defaultSettings = typeof aceMapBlockDefaults !== 'undefined' ? aceMapBlockDefaults : {
    disableZoom: false,
    disableLabels: false,
    disableUIButtons: false,
    disableMovement: false
};

registerBlockType('my-block/google-map', {
    title: 'Google Map',
    icon: 'location-alt',
    category: 'widgets',
    attributes: {
        lat: { type: 'number', default: 51.5074 },
        lng: { type: 'number', default: -0.1278 },
        address: { type: 'string', default: '' },
        streetViewHeading: { type: 'number', default: 0 },
        streetViewPitch: { type: 'number', default: 0 },
        isStreetView: { type: 'boolean', default: false },
        zoom: { type: 'number', default: 8 },
        mapStyle: { type: 'string', default: '' },
        mapIsImage: { type: 'boolean', default: false },
        disableMovement: { type: 'boolean', default: !!defaultSettings.disableMovement },
        disableZoom: { type: 'boolean', default: !!defaultSettings.disableZoom },
        disableLabels: { type: 'boolean', default: !!defaultSettings.disableLabels },
        disableUIButtons: { type: 'boolean', default: !!defaultSettings.disableUIButtons },
        mapAsBackground: { type: 'boolean', default: false }, // New attribute for background mode
    },
    edit: ({ attributes, setAttributes, isSelected }) => {
        const {
            lat,
            lng,
            address,
            streetViewHeading,
            streetViewPitch,
            isStreetView,
            zoom,
            mapStyle,
            mapIsImage,
            disableMovement,
            disableZoom,
            disableLabels,
            disableUIButtons,
            mapAsBackground, // New attribute
        } = attributes;



        const mapRef = useRef(null);
        const searchRef = useRef(null); // Ref for the location search input
        const [map, setMap] = useState(null);
        const [marker, setMarker] = useState(null);
        const [panorama, setPanorama] = useState(null);

        const blockProps = useBlockProps();

        const geocoder = new google.maps.Geocoder();

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
            // Initialize the map if it hasn't been initialized yet
            if (mapRef.current && !map) {
                // Create the map only once
                const googleMap = new google.maps.Map(mapRef.current, {
                    zoom: zoom,
                    center: { lat, lng },
                    styles: aceMapBlock.styles[mapStyle] || null,
                });
                setMap(googleMap);
        
                // Create a draggable marker and set its initial position
                const mapMarker = new google.maps.Marker({
                    position: { lat, lng },
                    map: googleMap,
                    draggable: true,
                });
                setMarker(mapMarker);
        
                // Add event listeners for marker drag and map click
                mapMarker.addListener('dragend', () => {
                    const newLat = mapMarker.getPosition().lat();
                    const newLng = mapMarker.getPosition().lng();
                    setAttributes({ lat: newLat, lng: newLng });
                    reverseGeocode(newLat, newLng);
                });
        
                googleMap.addListener('click', (e) => {
                    if (!isSelected) {
                        // Select the block if it's not already selected
                        return; // Do nothing if the block is not selected
                    }
                    const clickedLat = e.latLng.lat();
                    const clickedLng = e.latLng.lng();
                    mapMarker.setPosition({ lat: clickedLat, lng: clickedLng });
                    setAttributes({ lat: clickedLat, lng: clickedLng });
                    reverseGeocode(clickedLat, clickedLng);
                });
        
                googleMap.addListener('zoom_changed', () => {
                    setAttributes({ zoom: googleMap.getZoom() });
                });
        
                if (searchRef.current) {
                    const autocomplete = new google.maps.places.Autocomplete(searchRef.current);
                    autocomplete.bindTo('bounds', googleMap);
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        if (!place.geometry || !place.geometry.location) {
                            return;
                        }
                        const newLat = place.geometry.location.lat();
                        const newLng = place.geometry.location.lng();
                        googleMap.setCenter({ lat: newLat, lng: newLng });
                        mapMarker.setPosition({ lat: newLat, lng: newLng });
                        setAttributes({
                            lat: newLat,
                            lng: newLng,
                            address: place.formatted_address || '',
                        });
                    });
                }
        
                const streetViewPanorama = googleMap.getStreetView();
                setPanorama(streetViewPanorama);
        
                streetViewPanorama.addListener('visible_changed', () => {
                    const isVisible = streetViewPanorama.getVisible();
                    setAttributes({ isStreetView: isVisible });
                });
        
                if (isStreetView) {
                    streetViewPanorama.setPosition({ lat, lng });
                    streetViewPanorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                    streetViewPanorama.setVisible(true);
                    setupStreetViewListeners(streetViewPanorama);
                }
            }
        }, []);
        
        useEffect(() => {
            // Update the map and marker without reinitializing them
            if (map) {
                map.setOptions({
                    styles: aceMapBlock.styles[mapStyle] || null,
                    draggable: !disableMovement,
                    zoomControl: !disableZoom,
                    disableDefaultUI: disableLabels,
                });
                map.setCenter({ lat, lng });
                map.setZoom(zoom);
            }
        
            if (marker) {
                marker.setPosition({ lat, lng });
            }
        }, [map, marker, lat, lng, zoom, mapStyle, disableMovement, disableZoom, disableLabels]);
        
        useEffect(() => {
            if (mapRef.current) {
                // Reinitialize the map when toggling the "Map as Background" or Street View
                const googleMap = new google.maps.Map(mapRef.current, {
                    zoom: zoom,
                    center: { lat, lng },
                    styles: aceMapBlock.styles[mapStyle] || null,
                    draggable: !disableMovement,
                    zoomControl: !disableZoom,
                    disableDefaultUI: disableLabels,
                });
                setMap(googleMap);
        
                const mapMarker = new google.maps.Marker({
                    position: { lat, lng },
                    map: googleMap,
                    draggable: true,
                });
                setMarker(mapMarker);
        
                // Handle marker drag end event
                mapMarker.addListener('dragend', () => {
                    const newLat = mapMarker.getPosition().lat();
                    const newLng = mapMarker.getPosition().lng();
                    setAttributes({ lat: newLat, lng: newLng });
                    reverseGeocode(newLat, newLng);
                });
        
                // Handle map click event
                googleMap.addListener('click', (e) => {
                    if (!isSelected) return; // Only allow marker movement when block is selected
                    const clickedLat = e.latLng.lat();
                    const clickedLng = e.latLng.lng();
                    mapMarker.setPosition({ lat: clickedLat, lng: clickedLng });
                    setAttributes({ lat: clickedLat, lng: clickedLng });
                    reverseGeocode(clickedLat, clickedLng);
                });
        
                googleMap.addListener('zoom_changed', () => {
                    setAttributes({ zoom: googleMap.getZoom() });
                });
        
                const streetViewPanorama = googleMap.getStreetView();
                setPanorama(streetViewPanorama);
        
                // Set the proper mode for background or non-background
                if (mapAsBackground) {
                    googleMap.setOptions({ draggable: false, disableDefaultUI: true }); // Disable interactions for background mode
                } else {
                    googleMap.setOptions({ draggable: true, disableDefaultUI: false }); // Enable interactions when not in background mode
                }
        
                // Handle Street View mode
                if (isStreetView) {
                    streetViewPanorama.setPosition({ lat, lng });
                    streetViewPanorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                    streetViewPanorama.setVisible(true); // Enable Street View
                    setupStreetViewListeners(streetViewPanorama);
                } else {
                    streetViewPanorama.setVisible(false); // Disable Street View
                }
            }
        }, [mapAsBackground, isStreetView, mapStyle, zoom, lat, lng, streetViewHeading, streetViewPitch, disableMovement, disableZoom, disableLabels, isSelected]);
        
        

        // Dynamically update map controls and settings
        useEffect(() => { if (map) map.setOptions({ zoomControl: !disableZoom }); }, [disableZoom, map]);
        useEffect(() => { if (map) map.setOptions({ draggable: !disableMovement }); }, [disableMovement, map]);
        useEffect(() => { if (map) map.setOptions({ disableDefaultUI: disableUIButtons }); }, [disableUIButtons, map]);
        useEffect(() => { if (map) map.setOptions({ styles: aceMapBlock.styles[mapStyle] || null }); }, [mapStyle, map]);
        useEffect(() => { if (map) map.setZoom(zoom); }, [zoom, map]);
        useEffect(() => {
            if (map) {
                let currentStyle = aceMapBlock.styles[mapStyle] || [];
                if (disableLabels) {
                    currentStyle = [
                        ...currentStyle,
                        { "featureType": "all", "elementType": "labels", "stylers": [{ "visibility": "off" }] }
                    ];
                }
                map.setOptions({ styles: currentStyle });
            }
        }, [mapStyle, disableLabels, map]);

        return (
            <>
                <InspectorControls>
                    <PanelBody title="Map Settings">
                        <TextControl label="Latitude" value={lat} onChange={(value) => setAttributes({ lat: parseFloat(value) })} />
                        <TextControl label="Longitude" value={lng} onChange={(value) => setAttributes({ lng: parseFloat(value) })} />
                        <TextControl label="Address" value={address} disabled />
                        <RangeControl label="Zoom Level" value={zoom} onChange={(value) => setAttributes({ zoom: value })} min={1} max={20} />
                        <ToggleControl label="Map as Image" checked={mapIsImage} onChange={(value) => setAttributes({ mapIsImage: value })} />
                        <ToggleControl label="Map as Background" checked={mapAsBackground} onChange={(value) => setAttributes({ mapAsBackground: value })} />
                        {!mapIsImage && (
                            <>
                                <ToggleControl label="Is Street View?" checked={isStreetView} onChange={() => {
                                    if (panorama) {
                                        if (isStreetView) panorama.setVisible(false);
                                        else {
                                            panorama.setPosition({ lat, lng });
                                            panorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                                            panorama.setVisible(true);
                                            setupStreetViewListeners(panorama);
                                        }
                                    }
                                    setAttributes({ isStreetView: !isStreetView });
                                }} />
                                {isStreetView && (
                                    <>
                                        <TextControl label="Street View Heading" value={streetViewHeading} onChange={(value) => setAttributes({ streetViewHeading: parseFloat(value) })} />
                                        <TextControl label="Street View Pitch" value={streetViewPitch} onChange={(value) => setAttributes({ streetViewPitch: parseFloat(value) })} />
                                    </>
                                )}
                                <SelectControl label="Map Style" value={mapStyle} options={[{ label: 'Default', value: '' }, ...Object.keys(aceMapBlock.styles).map(style => ({ label: style, value: style }))]} onChange={(value) => setAttributes({ mapStyle: value })} />
                                <ToggleControl label="Disable Map Movement" checked={disableMovement} onChange={(value) => setAttributes({ disableMovement: value })} />
                                <ToggleControl label="Disable Zoom" checked={disableZoom} onChange={(value) => setAttributes({ disableZoom: value })} />
                                <ToggleControl label="Disable Labels" checked={disableLabels} onChange={(value) => setAttributes({ disableLabels: value })} />
                                <ToggleControl label="Disable UI Buttons" checked={disableUIButtons} onChange={(value) => setAttributes({ disableUIButtons: value })} />
                            </>
                        )}
                    </PanelBody>
                </InspectorControls>

                <div {...blockProps} style={{ position: 'relative', width: '100%', height: '600px' }}>
                    {!mapIsImage && mapAsBackground && (
                        <div ref={mapRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}></div>
                    )}
                    {mapAsBackground && (
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <InnerBlocks allowedBlocks={ALLOWED_BLOCKS} />
                        </div>
                    )}
                    {!mapAsBackground && (
                        <>
 {isSelected && (
            <input
                ref={searchRef}
                type="text"
                placeholder="Search for a location"
                style={{
                    width: '50%',
                    padding: '8px',
                    top: '10px',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: '100'
                }}
            />
        )}     
        
                               <div ref={mapRef} style={{ width: '100%', height: '600px', backgroundColor: '#e5e5e5' }}></div>
                        </>
                    )}
                </div>
            </>
        );
    },
    save: ({ attributes }) => {
        const { lat, lng, streetViewHeading, streetViewPitch, isStreetView, zoom, mapStyle, mapIsImage, disableMovement, disableZoom, disableLabels, disableUIButtons, mapAsBackground } = attributes;

        return mapIsImage ? (
            <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=600x400&markers=color:red%7C${lat},${lng}&key=${aceMapBlock.apiKey}`} alt="Google Map" />
        ) : (
            <div style={{ position: 'relative', width: '100%', height: '600px' }}>
                <div className="google-map" data-lat={lat || 0} data-lng={lng || 0} data-sv-heading={streetViewHeading || 0} data-sv-pitch={streetViewPitch || 0} data-is-street-view={isStreetView ? 'true' : 'false'} data-zoom={zoom || 8} data-map-style={mapStyle || 'default'} data-disable-movement={disableMovement ? 'true' : 'false'} data-disable-zoom={disableZoom ? 'true' : 'false'} data-disable-labels={disableLabels ? 'true' : 'false'} data-disable-ui-buttons={disableUIButtons ? 'true' : 'false'} style={{ position: mapAsBackground ? 'absolute' : 'relative', top: 0, left: 0, width: '100%', height: '100%' }}></div>
                {mapAsBackground && <div style={{ position: 'relative', zIndex: 2 }}><InnerBlocks.Content /></div>}
            </div>
        );
    }
});
