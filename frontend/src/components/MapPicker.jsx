// frontend/src/components/MapPicker.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon assets missing in Vite build environment
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Inner component to capture Leaflet map click and drag events
function LocationMarker({ position, setPosition, onGeocode }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onGeocode(lat, lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          onGeocode(lat, lng);
        },
      }}
    />
  );
}

export default function MapPicker({ onLocationSelect, defaultLat = 20.296059, defaultLng = 85.824539 }) {
  const [position, setPosition] = useState([defaultLat, defaultLng]);
  const [loading, setLoading] = useState(false);

  // Attempt user browser geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          handleReverseGeocode(latitude, longitude);
        },
        (err) => {
          console.log("Geolocation access denied or unavailable, using defaults.");
          // Geocode defaults
          handleReverseGeocode(defaultLat, defaultLng);
        }
      );
    } else {
      handleReverseGeocode(defaultLat, defaultLng);
    }
  }, []);

  const handleReverseGeocode = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const addressData = response.data.address || {};
      
      // Extract state & clean district name for DB matching (e.g. "Khordha District" -> "Khordha")
      const state = addressData.state || '';
      let district = addressData.county || addressData.district || addressData.state_district || '';
      district = district.replace(/\b(district|county|subdivision)\b/gi, '').trim();

      // Format address line
      const road = addressData.road || '';
      const neighborhood = addressData.neighbourhood || addressData.suburb || '';
      const city = addressData.city || addressData.town || addressData.village || '';
      const formattedAddress = [road, neighborhood, city].filter(Boolean).join(', ');

      onLocationSelect({
        state,
        district,
        address: formattedAddress,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      });
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-gray-300 shadow-inner">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          setPosition={setPosition}
          onGeocode={handleReverseGeocode}
        />
      </MapContainer>
      
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-2">
            <span className="w-6 h-6 border-2 border-gov-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-gov-800">Geocoding Pin Location...</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded shadow text-[10px] text-gray-500 font-semibold z-[1000]">
        📍 Click map or drag marker to select location
      </div>
    </div>
  );
}
