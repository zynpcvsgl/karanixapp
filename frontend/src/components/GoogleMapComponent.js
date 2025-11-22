import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Istanbul center as default
const defaultCenter = {
  lat: 41.0082,
  lng: 28.9784
};

const GoogleMapComponent = ({ passengers = [], vehiclePosition = null, operationRoute = [] }) => {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  // Google Maps API key - Replace with your actual key
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

  useEffect(() => {
    // Adjust map bounds to show all markers
    if (map && (passengers.length > 0 || vehiclePosition)) {
      const bounds = new window.google.maps.LatLngBounds();
      
      passengers.forEach((pax) => {
        if (pax.pickup_point && pax.pickup_point.lat && pax.pickup_point.lng) {
          bounds.extend({
            lat: pax.pickup_point.lat,
            lng: pax.pickup_point.lng
          });
        }
      });
      
      if (vehiclePosition) {
        bounds.extend({
          lat: vehiclePosition.lat,
          lng: vehiclePosition.lng
        });
      }
      
      map.fitBounds(bounds);
    }
  }, [map, passengers, vehiclePosition]);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Custom marker icons
  const vehicleIcon = {
    path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 0,
    scale: 6,
    fillColor: '#3B82F6',
    fillOpacity: 1,
    strokeColor: '#1E40AF',
    strokeWeight: 2,
    rotation: vehiclePosition?.heading || 0
  };

  const passengerIcon = (status) => {
    const color = status === 'checked_in' ? '#10B981' : '#F59E0B';
    return {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    };
  };

  const polylineOptions = {
    strokeColor: '#3B82F6',
    strokeOpacity: 0.6,
    strokeWeight: 3
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true
        }}
      >
        {/* Passenger Pickup Markers */}
        {passengers.map((pax) => {
          if (!pax.pickup_point || !pax.pickup_point.lat || !pax.pickup_point.lng) {
            return null;
          }
          
          return (
            <Marker
              key={pax.pax_id}
              position={{
                lat: pax.pickup_point.lat,
                lng: pax.pickup_point.lng
              }}
              icon={passengerIcon(pax.status)}
              title={`${pax.name} - ${pax.seat_no}`}
              label={{
                text: pax.seat_no,
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            />
          );
        })}

        {/* Vehicle Position Marker */}
        {vehiclePosition && vehiclePosition.lat && vehiclePosition.lng && (
          <Marker
            position={{
              lat: vehiclePosition.lat,
              lng: vehiclePosition.lng
            }}
            icon={vehicleIcon}
            title={`Vehicle - Speed: ${vehiclePosition.speed} km/h`}
            zIndex={1000}
          />
        )}

        {/* Operation Route Polyline */}
        {operationRoute && operationRoute.length > 1 && (
          <Polyline
            path={operationRoute.map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }))}
            options={polylineOptions}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapComponent;
