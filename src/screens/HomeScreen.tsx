import React, { useState, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
// Using built-in geolocation instead
import MapComponent, { Trail, MapComponentRef } from '../components/MapComponent';
import TrailListComponent from '../components/TrailListComponent';
import TrailDetails from '../components/TrailDetails';
import HikeTracker from '../components/HikeTracker';

/**
 * Interface for location data structure
 */
interface Location {
  latitude: number;
  longitude: number;
  heading?: number;
}

const HomeScreen: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [statusMessage, setStatusMessage] = useState('Getting your location...');
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [showTrailDetails, setShowTrailDetails] = useState(false);
  const [detailsTrail, setDetailsTrail] = useState<Trail | null>(null);
  const [showHikeTracker, setShowHikeTracker] = useState(false);
  const [hikeTrail, setHikeTrail] = useState<Trail | null>(null);
  const [isHiking, setIsHiking] = useState(false);
  
  // Create a ref to access MapComponent methods
  const mapRef = useRef<MapComponentRef>(null);
  const locationWatchRef = useRef<number | null>(null);

  /**
   * Request location permission from the user (Android and iOS)
   * iOS permissions are handled in Info.plist, but we still need to request at runtime
   * @returns Promise<boolean> - true if permission granted
   */
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to location to show nearby trails.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else if (Platform.OS === 'ios') {
      // iOS: Permission is requested automatically when first calling location services
      // The Info.plist descriptions will be shown to the user
      // We return true here because the actual permission check happens in the Geolocation calls
      return true;
    }
    return true;
  };

  /**
   * Get the user's current location using GPS
   * Falls back to Pocatello, Idaho if GPS fails
   */
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setStatusMessage('Location permission denied');
      return;
    }

    setStatusMessage('Getting your location...');
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setStatusMessage('Location found!');
      },
      (error) => {
        console.error('Location error:', error);
        
        // Handle different types of location errors
        let errorMessage = 'Failed to get location. Using demo location.';
        if (error.code === 1) {
          errorMessage = 'Location permission denied. Using demo location.';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Using demo location.';
        } else if (error.code === 3) {
          errorMessage = 'Location timeout. Using demo location.';
        }
        
        setStatusMessage(errorMessage);
        
        // Fallback to Pocatello, Idaho if GPS fails
        setLocation({
          latitude: 42.8746, // Pocatello, Idaho latitude
          longitude: -112.4440, // Pocatello, Idaho longitude
          heading: 0,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };


  /**
   * Handle trail selection from the trail list
   * @param trail - The selected trail object
   */
  const handleTrailSelect = (trail: Trail) => {
    setSelectedTrail(trail);
    setStatusMessage(`Selected: ${trail.TRAIL_NAME}`);
    setShowTrailList(false); // Automatically return to map view when trail is selected
  };

  /**
   * Handle trail tap to show details
   * @param trail - The trail to show details for
   */
  const handleTrailTap = (trail: Trail) => {
    setDetailsTrail(trail);
    setShowTrailDetails(true);
    setSelectedTrail(trail); // Also highlight the trail on map
    setStatusMessage(`Viewing details: ${trail.TRAIL_NAME}`);
  };

  /**
   * Close the trail details modal
   */
  const closeTrailDetails = () => {
    setShowTrailDetails(false);
    setDetailsTrail(null);
  };

  /**
   * Start hiking on a trail
   */
  const handleStartHike = (trail: Trail) => {
    setHikeTrail(trail);
    setShowHikeTracker(true);
    setShowTrailDetails(false);
    setIsHiking(true);
    setStatusMessage(`Starting hike on ${trail.TRAIL_NAME}`);
    
    // Enable camera following when starting hike
    if (mapRef.current) {
      mapRef.current.setFollowUser(true);
    }
  };

  /**
   * Close the hike tracker modal
   */
  const closeHikeTracker = () => {
    setShowHikeTracker(false);
    setHikeTrail(null);
    setIsHiking(false);
    
    // Disable camera following when stopping hike
    if (mapRef.current) {
      mapRef.current.setFollowUser(false);
    }
  };

  /**
   * Handle location updates from the hike tracker
   */
  const handleHikeLocationUpdate = (newLocation: [number, number]) => {
    setLocation({
      longitude: newLocation[0],
      latitude: newLocation[1],
      heading: location?.heading || 0, // Keep existing heading if available
    });
    
    // Enable follow user mode when hiking
    if (mapRef.current && isHiking) {
      mapRef.current.setFollowUser(true);
    }
  };


  

  /**
   * Handle trails loaded from the map component
   * This is called whenever the map component successfully queries trails
   * @param loadedTrails - Array of trails loaded from the map
   */
  const handleTrailsLoaded = (loadedTrails: Trail[]) => {
    setTrails(loadedTrails);
    if (loadedTrails.length === 0) {
      setStatusMessage('No trails found in selected area');
    } else {
      setStatusMessage(`Found ${loadedTrails.length} trails in selected area`);
    }
  };

  /**
   * Center the map on the user's current location
   */
  const centerMapOnLocation = () => {
    if (location && mapRef.current) {
      // Center the map on user location
      setStatusMessage('Centering map on your location...');
      mapRef.current.centerOnLocation([location.longitude, location.latitude]);
    } else {
      // Get location first, then center
      getCurrentLocation();
    }
  };

  /**
   * Start live location tracking
   */
  const startLiveLocationTracking = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setStatusMessage('Location permission denied');
      return;
    }

    setStatusMessage('Starting live location tracking...');
    
    // Start watching location with heading
    locationWatchRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;
        setLocation({ 
          latitude, 
          longitude, 
          heading: heading !== null && heading !== undefined ? heading : 0 
        });
        setStatusMessage('Location tracking active');
      },
      (error) => {
        console.error('Location error:', error);
        
        // Handle different types of location errors
        let errorMessage = 'Location tracking error. Using demo location.';
        if (error.code === 1) {
          errorMessage = 'Location permission denied. Using demo location.';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Using demo location.';
        } else if (error.code === 3) {
          errorMessage = 'Location timeout. Using demo location.';
        }
        
        setStatusMessage(errorMessage);
        
        // Fallback to Pocatello, Idaho if GPS fails
        setLocation({
          latitude: 42.8746,
          longitude: -112.4440,
          heading: 0,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 10, // Update every 10 meters
      }
    );
  };

  // Start live location tracking when component mounts
  React.useEffect(() => {
    startLiveLocationTracking();
    
    // Cleanup function
    return () => {
      if (locationWatchRef.current) {
        Geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hiking App</Text>
        <Text style={styles.subtitle}>Trail Explorer</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.centerButtonContainer}>
          <TouchableOpacity style={styles.centerButton} onPress={centerMapOnLocation}>
            <Text style={styles.centerButtonText}>📍 Center Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapAndTrailsContainer}>
          {/* Map takes up more space */}
          <View style={styles.mapContainer}>
            <MapComponent 
              ref={mapRef}
              style={styles.map}
              initialCenter={location ? [location.longitude, location.latitude] : [-112.4440, 42.8746]}
              initialZoom={location ? 12 : 10}
              onTrailPress={handleTrailTap}
              selectedTrail={selectedTrail}
              onTrailsLoaded={handleTrailsLoaded}
              enableLiveUpdates={liveUpdatesEnabled}
              userLocation={location ? [location.longitude, location.latitude] : null}
              userHeading={location?.heading || 0}
              followUser={isHiking}
            />
          </View>
          
          {/* Live Trail List - Under the map */}
          <View style={styles.liveTrailList}>
            <View style={styles.liveTrailHeader}>
              <Text style={styles.liveTrailTitle}>Trails in View ({trails.length})</Text>
              <Text style={styles.liveTrailStatus}>
                🔄 Live | {statusMessage}
              </Text>
            </View>
            
            <TrailListComponent
              trails={trails}
              onTrailSelect={handleTrailTap}
              selectedTrail={selectedTrail}
            />
          </View>
        </View>
      </View>
      
      {/* Trail Details Modal */}
      <TrailDetails
        trail={detailsTrail}
        visible={showTrailDetails}
        onClose={closeTrailDetails}
        onStartHike={handleStartHike}
      />
      
      {/* Hike Tracker Modal */}
      <HikeTracker
        trail={hikeTrail}
        visible={showHikeTracker}
        onClose={closeHikeTracker}
        onLocationUpdate={handleHikeLocationUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  centerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapAndTrailsContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  mapContainer: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  liveTrailList: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  liveTrailHeader: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  liveTrailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  liveTrailStatus: {
    fontSize: 12,
    color: '#666',
  },
});

export default HomeScreen;