import { useEffect, useRef, useState } from '@wordpress/element';
import { registerBlockType } from '@wordpress/blocks';
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, RangeControl, SelectControl } from '@wordpress/components';

const ALLOWED_BLOCKS = [ 'core/paragraph', 'core/heading', 'core/image' ];


registerBlockType('acemedia/google-map', {
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
        disableMovement: { type: 'boolean', default: !!aceMapBlockDefaults.disableMovement },
        disableZoom: { type: 'boolean', default: !!aceMapBlockDefaults.disableZoom },
        disableLabels: { type: 'boolean', default: !!aceMapBlockDefaults.disableLabels },
        disableUIButtons: { type: 'boolean', default: !!aceMapBlockDefaults.disableUIButtons },
        mapAsBackground: { type: 'boolean', default: false },
        showMarker: { type: 'boolean', default: true }, // New attribute for marker visibility
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
            mapAsBackground, // New attribute for background mode
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
            // Set defaults from plugin settings if not explicitly set
            if (disableZoom === undefined) {
                setAttributes({ disableZoom: !!aceMapBlockDefaults.disableZoom });
            }
            if (disableLabels === undefined) {
                setAttributes({ disableLabels: !!aceMapBlockDefaults.disableLabels });
            }
            if (disableUIButtons === undefined) {
                setAttributes({ disableUIButtons: !!aceMapBlockDefaults.disableUIButtons });
            }
            if (disableMovement === undefined) {
                setAttributes({ disableMovement: !!aceMapBlockDefaults.disableMovement });
            }
        }, []);
        
    
        useEffect(() => {
            // Initialize the map if it hasn't been initialized yet
            if (mapRef.current && !map) {
                const googleMap = new google.maps.Map(mapRef.current, {
                    zoomControl: !disableZoom,
                    center: { lat, lng },
                    styles: disableLabels
                        ? [...(aceMapBlock.styles[mapStyle] || []), { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
                        : aceMapBlock.styles[mapStyle] || null,
                    disableDefaultUI: disableUIButtons,
                });
                setMap(googleMap);
        
                const mapMarker = new google.maps.Marker({
                    position: { lat, lng },
                    map: googleMap,
                    draggable: true,
                });
                setMarker(mapMarker);
        
                googleMap.addListener('click', (e) => {
                    const clickedLat = e.latLng.lat();
                    const clickedLng = e.latLng.lng();
                    mapMarker.setPosition({ lat: clickedLat, lng: clickedLng });
                    setAttributes({ lat: clickedLat, lng: clickedLng });
                    reverseGeocode(clickedLat, clickedLng);
                });
        
                googleMap.addListener('zoom_changed', () => {
                    setAttributes({ zoom: googleMap.getZoom() });
                });
        
                // Initialize the Places Autocomplete service
                const inputElement = document.querySelector('.autocomplete-search');

                console.log("Input element found:", inputElement);
        
                if (inputElement) {
                    console.log("Input element found:", inputElement);
        
                    // Initialize the Google Places Autocomplete
                    const autocomplete = new google.maps.places.Autocomplete(inputElement);
                    autocomplete.bindTo('bounds', googleMap); // Bind autocomplete to the current map bounds
        
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        console.log('Autocomplete place changed:', place);
        
                        if (!place.geometry) {
                            console.log('No geometry available for this place');
                            return;
                        }
        
                        // Update map and marker with new place
                        const newLat = place.geometry.location.lat();
                        const newLng = place.geometry.location.lng();
                        googleMap.setCenter({ lat: newLat, lng: newLng });
                        mapMarker.setPosition({ lat: newLat, lng: newLng });
        
                        // Update block attributes with the new place information
                        setAttributes({
                            lat: newLat,
                            lng: newLng,
                            address: place.formatted_address || '',
                        });
        
                        console.log(`New Coordinates: Lat ${newLat}, Lng ${newLng}, Address: ${place.formatted_address}`);
                    });
                } else {
                    console.log("Could not find the input element with class '.autocomplete-search'");
                }
            }
        }, [map, lat, lng, zoom, mapStyle, disableZoom, disableLabels, disableUIButtons]);
        
        
        
        useEffect(() => {
            // Reinitialize the map when toggling the "Map as Background" or Street View
            if (mapRef.current && mapAsBackground !== null) {
                const googleMap = new google.maps.Map(mapRef.current, {
                    zoom: zoom,
                    center: { lat, lng },
                    styles: disableLabels ? [...(aceMapBlock.styles[mapStyle] || []), { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] }] : aceMapBlock.styles[mapStyle] || null,
                    draggable: !disableMovement,
                    zoomControl: !disableZoom,
                    disableDefaultUI: disableUIButtons,
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
                    const blockElement = mapRef.current.closest('.wp-block[data-block]');                    
                    // Check if the block has the 'is-selected' class
                    if (!blockElement || !blockElement.classList.contains('is-selected')) {
                        console.log('Block is not selected');
                        return; // Do nothing if the block is not selected
                    }
                    console.log('Block is selected');
        
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
        
                if (isStreetView) {
                    streetViewPanorama.setPosition({ lat, lng });
                    streetViewPanorama.setPov({ heading: streetViewHeading, pitch: streetViewPitch });
                    streetViewPanorama.setVisible(true);
                    setupStreetViewListeners(streetViewPanorama);
                }
        
                // Initialize the Places Autocomplete service for the search input
                const inputElement = document.querySelector('.autocomplete-search');
                if (inputElement) {
                    console.log("Input element found:", inputElement);
        
                    const autocomplete = new google.maps.places.Autocomplete(inputElement);
                    autocomplete.bindTo('bounds', googleMap); // Bind autocomplete to the current map bounds
        
                    autocomplete.addListener('place_changed', () => {
                        const place = autocomplete.getPlace();
                        console.log('Autocomplete place changed:', place);
        
                        if (!place.geometry) {
                            console.log('No geometry available for this place');
                            return;
                        }
        
                        // Update map and marker with new place
                        const newLat = place.geometry.location.lat();
                        const newLng = place.geometry.location.lng();
                        googleMap.setCenter({ lat: newLat, lng: newLng });
                        mapMarker.setPosition({ lat: newLat, lng: newLng });
        
                        // Update block attributes with the new place information
                        setAttributes({
                            lat: newLat,
                            lng: newLng,
                            address: place.formatted_address || '',
                        });
        
                        console.log(`New Coordinates: Lat ${newLat}, Lng ${newLng}, Address: ${place.formatted_address}`);
                    });
                } else {
                    console.log("Could not find the input element with class '.autocomplete-search'");
                }
            }
        }, [mapAsBackground, isStreetView]);
        
    
        useEffect(() => {
            if (map) {
                map.setOptions({
                    draggable: !disableMovement,
                    zoomControl: !disableZoom, // Zoom control is handled solely by "Disable Zoom"
                    disableDefaultUI: disableUIButtons, // Disable the UI buttons if set
                    styles: disableLabels ? [...(aceMapBlock.styles[mapStyle] || []), { featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] }] : aceMapBlock.styles[mapStyle] || null,
                });
                map.setCenter({ lat, lng });
                map.setZoom(zoom);
            }
    
            if (marker) {
                marker.setPosition({ lat, lng });
            }
        }, [lat, lng, zoom, mapStyle, disableMovement, disableZoom, disableLabels, disableUIButtons]);
            


        return (
            <>
                <InspectorControls>
    <PanelBody title="Map Settings">
        <TextControl 
            label="Latitude" 
            value={lat !== undefined ? lat : 51.5074} 
            onChange={(value) => setAttributes({ lat: parseFloat(value) })} 
        />
        <TextControl 
            label="Longitude" 
            value={lng !== undefined ? lng : -0.1278} 
            onChange={(value) => setAttributes({ lng: parseFloat(value) })} 
        />
        <TextControl 
            label="Address" 
            value={address} 
            disabled 
        />
        <ToggleControl
            label="Show Marker"
            checked={attributes.showMarker !== undefined ? attributes.showMarker : true}
            onChange={(value) => setAttributes({ showMarker: value })}
        />
        <RangeControl 
            label="Zoom Level" 
            value={zoom !== undefined ? zoom : 8} 
            onChange={(value) => setAttributes({ zoom: value })} 
            min={1} max={20} 
        />
        <ToggleControl 
            label="Map as Image" 
            checked={mapIsImage !== undefined ? mapIsImage : false} 
            onChange={(value) => setAttributes({ mapIsImage: value })} 
        />
        <ToggleControl 
            label="Map as Background" 
            checked={mapAsBackground !== undefined ? mapAsBackground : false} 
            onChange={(value) => setAttributes({ mapAsBackground: value })} 
        />
        {!mapIsImage && (
            <>
                <ToggleControl 
                    label="Is Street View?" 
                    checked={isStreetView !== undefined ? isStreetView : false} 
                    onChange={() => {
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
                    }} 
                />
                {isStreetView && (
                    <>
                        <TextControl 
                            label="Street View Heading" 
                            value={streetViewHeading !== undefined ? streetViewHeading : 0} 
                            onChange={(value) => setAttributes({ streetViewHeading: parseFloat(value) })} 
                        />
                        <TextControl 
                            label="Street View Pitch" 
                            value={streetViewPitch !== undefined ? streetViewPitch : 0} 
                            onChange={(value) => setAttributes({ streetViewPitch: parseFloat(value) })} 
                        />
                    </>
                )}
                <SelectControl 
                    label="Map Style" 
                    value={mapStyle !== undefined ? mapStyle : ''} 
                    options={[{ label: 'Default', value: '' }, ...Object.keys(aceMapBlock.styles).map(style => ({ label: style, value: style }))]} 
                    onChange={(value) => setAttributes({ mapStyle: value })} 
                />
                <ToggleControl 
                    label="Disable Map Movement" 
                    checked={disableMovement !== undefined ? disableMovement : !!aceMapBlockDefaults.disableMovement} 
                    onChange={(value) => setAttributes({ disableMovement: value })} 
                />
                <ToggleControl 
                    label="Disable Zoom" 
                    checked={disableZoom !== undefined ? disableZoom : !!aceMapBlockDefaults.disableZoom} 
                    onChange={(value) => setAttributes({ disableZoom: value })} 
                />
                <ToggleControl 
                    label="Disable Labels" 
                    checked={disableLabels !== undefined ? disableLabels : !!aceMapBlockDefaults.disableLabels} 
                    onChange={(value) => setAttributes({ disableLabels: value })} 
                />
                <ToggleControl 
                    label="Disable UI Buttons" 
                    checked={disableUIButtons !== undefined ? disableUIButtons : !!aceMapBlockDefaults.disableUIButtons} 
                    onChange={(value) => setAttributes({ disableUIButtons: value })} 
                />
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
                            <input
    ref={searchRef}
    className="autocomplete-search"
    type="text"
    placeholder="Search for a location"
    style={{
        width: '50%',
        padding: '8px',
        top: '10px',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '100',
        display: isSelected ? 'block' : 'none', // Toggle visibility based on isSelected
    }}
/>
                            <div ref={mapRef} style={{ width: '100%', height: '600px', backgroundColor: '#e5e5e5' }}></div>
                        </>
                    )}
                </div>
            </>
        );
    },    
    save: ({ attributes }) => {
        const {
            lat = 51.5074, // Fallback to default values if not set
            lng = -0.1278,
            streetViewHeading = 0,
            streetViewPitch = 0,
            isStreetView = false,
            zoom = 8,
            mapStyle = '',
            mapIsImage = false,
            disableMovement = !!aceMapBlockDefaults.disableMovement, // Use defaults if not explicitly set
            disableZoom = !!aceMapBlockDefaults.disableZoom,
            disableLabels = !!aceMapBlockDefaults.disableLabels,
            disableUIButtons = !!aceMapBlockDefaults.disableUIButtons,
            mapAsBackground = false,
            showMarker = true // Default value for marker visibility
        } = attributes;

        // If an attribute is undefined, fallback to the default values for rendering
        const actualDisableMovement = disableMovement !== undefined ? disableMovement : !!aceMapBlockDefaults.disableMovement;
        const actualDisableZoom = disableZoom !== undefined ? disableZoom : !!aceMapBlockDefaults.disableZoom;
        const actualDisableLabels = disableLabels !== undefined ? disableLabels : !!aceMapBlockDefaults.disableLabels;
        const actualDisableUIButtons = disableUIButtons !== undefined ? disableUIButtons : !!aceMapBlockDefaults.disableUIButtons;
    
    
        // Generate the appropriate classes and data attributes based on the map settings
        const mapClasses = [
            'google-map',
            disableMovement ? 'disable-movement' : '',
            disableZoom ? 'disable-zoom' : '',
            disableLabels ? 'disable-labels' : '',
            disableUIButtons ? 'disable-ui' : '',
        ]
        .filter(Boolean)
        .join(' ');
    
        const mapAttributes = {
            'data-lat': lat || 0,
            'data-lng': lng || 0,
            'data-sv-heading': streetViewHeading || 0,
            'data-sv-pitch': streetViewPitch || 0,
            'data-is-street-view': isStreetView ? 'true' : 'false',
            'data-zoom': zoom || 8,
            'data-map-style': mapStyle || 'default',
            'data-disable-movement': actualDisableMovement ? 'true' : 'false',
            'data-disable-zoom': actualDisableZoom ? 'true' : 'false',
            'data-disable-labels': actualDisableLabels ? 'true' : 'false',
            'data-disable-ui-buttons': actualDisableUIButtons ? 'true' : 'false',
            'data-show-marker': showMarker ? 'true' : 'false',
        };
    
        return mapIsImage ? (
            <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=600x400${showMarker ? `&markers=color:red%7C${lat},${lng}` : ''}&key=${aceMapBlock.apiKey}`}
                alt="Google Map"
            />
        ) : (
            <div style={{ position: 'relative', width: '100%', height: '600px' }}>
                <div
                    className={mapClasses}
                    {...mapAttributes}
                    style={{ position: mapAsBackground ? 'absolute' : 'relative', top: 0, left: 0, width: '100%', height: '100%' }}
                ></div>
                {mapAsBackground && (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <InnerBlocks.Content />
                    </div>
                )}
            </div>
        );
    }
    
    
});
