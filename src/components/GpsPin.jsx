// components/GpsPin.jsx
import React, { useState } from 'react';
import { LocationService } from '../services/location';

export default function GpsPin({ onPin, label = "Pin Location" }) {
  const [pinning, setPinning] = useState(false);
  const [location, setLocation] = useState(null);

  const handlePin = async () => {
    setPinning(true);
    
    try {
      const loc = await LocationService.getCurrentLocation();
      setLocation(loc);
      onPin(loc);
      alert(`📍 Location pinned: ${loc.lat}, ${loc.lng}`);
    } catch (error) {
      alert('Failed to get location: ' + error.message);
    } finally {
      setPinning(false);
    }
  };

  return (
    <div className="gps-pin" onClick={handlePin}>
      <i className="fas fa-map-marker-alt" style={{ color: '#EF4444' }}></i>
      <div>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: '0.72rem', fontWeight: 400 }}>
          {location 
            ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : 'Tap to pin exact GPS location'}
        </div>
      </div>
      {pinning && <i className="fas fa-spinner fa-spin"></i>}
    </div>
  );
}