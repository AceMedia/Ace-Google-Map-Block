document.addEventListener("DOMContentLoaded",(function(){document.querySelectorAll(".google-map").forEach((e=>{const t=parseFloat(e.dataset.lat),a=parseFloat(e.dataset.lng),o="true"===e.dataset.isStreetView,s=parseFloat(e.dataset.svHeading),l=parseFloat(e.dataset.svPitch),i=parseInt(e.dataset.zoom,10)||10,n=e.dataset.mapStyle,r="true"===e.dataset.disableMovement,d="true"===e.dataset.disableZoom,g="true"===e.dataset.disableLabels,p="true"===e.dataset.disableUiButtons,c="true"===e.dataset.showMarker;let m=aceMapBlock.styles[n]||[];g&&(m=[...m,{featureType:"all",elementType:"labels",stylers:[{visibility:"off"}]}]);const b={zoom:i,center:{lat:t,lng:a},styles:m,draggable:!r,zoomControl:!d,disableDefaultUI:p},u=new google.maps.Map(e,b);let w;c&&(w=new google.maps.Marker({position:{lat:t,lng:a},map:u}));const h=new google.maps.StreetViewPanorama(e,{position:{lat:t,lng:a},pov:{heading:s,pitch:l},visible:o});o&&u.setStreetView(h),h.addListener("visible_changed",(function(){const e=h.getVisible();window.toggleStreetViewCheckbox&&window.toggleStreetViewCheckbox(e),!e&&w&&u.setCenter(w.getPosition())}))}))}));