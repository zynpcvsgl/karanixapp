import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px' // Harita yüklenemezse alanın çökmemesi için
};

// İstanbul varsayılan merkez
const defaultCenter = {
  lat: 41.0082,
  lng: 28.9784
};

const GoogleMapComponent = ({ passengers = [], vehiclePosition = null, operationRoute = [] }) => {
  const [map, setMap] = useState(null);
  
  // .env dosyasından API anahtarını al
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Google Maps API Yükleyici (LoadScript yerine bunu kullanıyoruz)
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    // Eğer anahtar "YOUR_..." ise boş göndererek yüklemeyi engelle (Crash önler)
    googleMapsApiKey: apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' ? apiKey : ''
  });

  useEffect(() => {
    // Harita sınırlarını (bounds) ayarla
    if (isLoaded && map && (passengers.length > 0 || vehiclePosition)) {
      const bounds = new window.google.maps.LatLngBounds();
      
      let hasPoints = false;

      passengers.forEach((pax) => {
        if (pax.pickup_point && pax.pickup_point.lat && pax.pickup_point.lng) {
          bounds.extend({
            lat: pax.pickup_point.lat,
            lng: pax.pickup_point.lng
          });
          hasPoints = true;
        }
      });
      
      if (vehiclePosition && vehiclePosition.lat) {
        bounds.extend({
          lat: vehiclePosition.lat,
          lng: vehiclePosition.lng
        });
        hasPoints = true;
      }
      
      if (hasPoints) {
        map.fitBounds(bounds);
      }
    }
  }, [isLoaded, map, passengers, vehiclePosition]);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Marker ikonları
  const vehicleIcon = isLoaded ? {
    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 6,
    fillColor: '#3B82F6',
    fillOpacity: 1,
    strokeColor: '#1E40AF',
    strokeWeight: 2,
    rotation: vehiclePosition?.heading || 0
  } : null;

  const getPassengerIcon = (status) => {
    if (!isLoaded) return null;
    const color = status === 'checked_in' ? '#10B981' : '#F59E0B';
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
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

  // HATA DURUMU: API Anahtarı yoksa veya yüklenemediyse
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || loadError) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-100 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
        <p className="font-medium">Harita Yüklenemedi</p>
        <p className="text-sm mt-1">API Anahtarı eksik veya hatalı.</p>
      </div>
    );
  }

  // YÜKLENİYOR DURUMU
  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true
      }}
    >
      {/* Yolcu Durakları */}
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
            icon={getPassengerIcon(pax.status)}
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

      {/* Araç Konumu */}
      {vehiclePosition && vehiclePosition.lat && vehiclePosition.lng && (
        <Marker
          position={{
            lat: vehiclePosition.lat,
            lng: vehiclePosition.lng
          }}
          icon={vehicleIcon}
          title={`Hız: ${vehiclePosition.speed || 0} km/s`}
          zIndex={1000}
        />
      )}

      {/* Rota Çizgisi */}
      {operationRoute && operationRoute.length > 1 && (
        <Polyline
          path={operationRoute.map(coord => ({
            lat: coord[1], // MongoDB GeoJSON [lng, lat] tutar, Google Maps {lat, lng} ister
            lng: coord[0]
          }))}
          options={polylineOptions}
        />
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;