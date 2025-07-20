import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Trail } from './MapComponent';

interface HikeTrackerProps {
  trail: Trail | null;
  visible: boolean;
  onClose: () => void;
  onLocationUpdate?: (location: [number, number]) => void;
}

interface HikeData {
  startTime: number;
  endTime?: number;
  elapsedTime: number;
  distance: number;
  locations: [number, number][];
  isActive: boolean;
  isPaused: boolean;
}

const HikeTracker: React.FC<HikeTrackerProps> = ({ 
  trail, 
  visible, 
  onClose, 
  onLocationUpdate 
}) => {
  const [hikeData, setHikeData] = useState<HikeData>({
    startTime: 0,
    elapsedTime: 0,
    distance: 0,
    locations: [],
    isActive: false,
    isPaused: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<number | null>(null);

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Convert meters to miles
  const metersToMiles = (meters: number): number => {
    return meters * 0.000621371;
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the hike
  const startHike = () => {
    const startTime = Date.now();
    setHikeData(prev => ({
      ...prev,
      startTime,
      isActive: true,
      isPaused: false,
      elapsedTime: 0,
      distance: 0,
      locations: [],
    }));

    // Start location tracking
    locationWatchRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation: [number, number] = [longitude, latitude];
        
        setHikeData(prev => {
          const newLocations = [...prev.locations, newLocation];
          let newDistance = prev.distance;
          
          // Calculate distance if we have a previous location
          if (prev.locations.length > 0) {
            const lastLocation = prev.locations[prev.locations.length - 1];
            const distanceMeters = calculateDistance(
              lastLocation[1], lastLocation[0], 
              latitude, longitude
            );
            newDistance += distanceMeters;
          }
          
          return {
            ...prev,
            locations: newLocations,
            distance: newDistance,
          };
        });

        // Notify parent component of location update
        if (onLocationUpdate) {
          onLocationUpdate(newLocation);
        }
      },
      (error) => {
        console.log('Location error:', error);
        
        // Handle different types of location errors for iOS compatibility
        if (error.code === 1) {
          console.log('Location permission denied during hike tracking');
        } else if (error.code === 2) {
          console.log('Location unavailable during hike tracking');
        } else if (error.code === 3) {
          console.log('Location timeout during hike tracking');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
        distanceFilter: 5, // Update every 5 meters
      }
    );

    // Start timer
    timerRef.current = setInterval(() => {
      setHikeData(prev => {
        if (!prev.isPaused && prev.isActive) {
          return {
            ...prev,
            elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
          };
        }
        return prev;
      });
    }, 1000);
  };

  // Pause/Resume hike
  const togglePause = () => {
    setHikeData(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  // Stop hike
  const stopHike = () => {
    Alert.alert(
      'Stop Hike',
      'Are you sure you want to stop this hike?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: () => {
            setHikeData(prev => ({
              ...prev,
              isActive: false,
              isPaused: false,
              endTime: Date.now(),
            }));
            
            // Clean up
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (locationWatchRef.current) {
              Geolocation.clearWatch(locationWatchRef.current);
              locationWatchRef.current = null;
            }
          }
        }
      ]
    );
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (locationWatchRef.current) {
        Geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  // Close modal and clean up
  const handleClose = () => {
    if (hikeData.isActive) {
      Alert.alert(
        'Active Hike',
        'You have an active hike. Stop it before closing?',
        [
          { text: 'Keep Hiking', style: 'cancel' },
          { 
            text: 'Stop & Close', 
            style: 'destructive',
            onPress: () => {
              stopHike();
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  if (!trail) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header with handle bar */}
          <View style={styles.header}>
            <View style={styles.handleBar} />
            <Text style={styles.trailName}>{trail.TRAIL_NAME}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{formatTime(hikeData.elapsedTime)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{metersToMiles(hikeData.distance).toFixed(2)} mi</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Pace</Text>
              <Text style={styles.statValue}>
                {hikeData.distance > 0 && hikeData.elapsedTime > 0
                  ? `${(hikeData.elapsedTime / 60 / metersToMiles(hikeData.distance)).toFixed(1)} min/mi`
                  : '0.0 min/mi'}
              </Text>
            </View>
          </View>

          {/* Trail Info */}
          <View style={styles.trailInfo}>
            <Text style={styles.trailLength}>Trail Length: {trail.SEGMENT_LE.toFixed(1)} miles</Text>
            <Text style={styles.trailType}>Type: {trail.TRAIL_TYPE}</Text>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {!hikeData.isActive ? 'Ready to start hiking' : 
               hikeData.isPaused ? 'Hike paused' : 'Hiking in progress...'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!hikeData.isActive ? (
              <TouchableOpacity style={styles.startButton} onPress={startHike}>
                <Text style={styles.startButtonText}>🥾 Start Hike</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeControls}>
                <TouchableOpacity 
                  style={[styles.controlButton, hikeData.isPaused ? styles.resumeButton : styles.pauseButton]} 
                  onPress={togglePause}
                >
                  <Text style={styles.controlButtonText}>
                    {hikeData.isPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopButton} onPress={stopHike}>
                  <Text style={styles.stopButtonText}>⏹️ Stop</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Position modal at bottom
    backgroundColor: 'transparent', // No dimming background
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%', // Limit height to 60% of screen
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
  },
  handleBar: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  trailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  trailInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  trailLength: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  trailType: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controls: {
    padding: 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HikeTracker;