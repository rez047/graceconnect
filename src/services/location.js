// services/location.js
import { Geolocation } from '@capacitor/geolocation';

export class LocationService {
  /**
   * Get current location
   */
  static async getCurrentLocation() {
    try {
      // Request permission
      const permission = await Geolocation.requestPermission();
      
      if (permission.location !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (error) {
      throw new Error('Failed to get location: ' + error.message);
    }
  }

  /**
   * Watch location updates
   */
  static async watchLocation(callback) {
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          callback(null, err);
          return;
        }
        
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      }
    );

    return watchId;
  }

  /**
   * Stop watching location
   */
  static async stopWatching(watchId) {
    await Geolocation.clearWatch({ id: watchId });
  }

  /**
   * Open maps app with coordinates
   */
  static async openInMaps(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_system');
  }
}