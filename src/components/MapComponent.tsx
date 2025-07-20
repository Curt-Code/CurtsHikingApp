import React, { useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';

interface Trail {
  id: number;
  BMP: number;
  EMP: number;
  OBJECTID: number;
  SEGMENT_LE: number;
  Shape_Length: number;
  SHAPELEN: number;
  TRAIL_CN: number;
  TRAIL_NAME: string;
  TRAIL_NO: string;
  TRAIL_TYPE: string;
  coordinates: number[][];
}

interface MapComponentProps {
  style?: any;
  initialCenter?: [number, number];
  initialZoom?: number;
  onTrailPress?: (trail: Trail) => void;
  selectedTrail?: Trail | null;
  onTrailsLoaded?: (trails: Trail[]) => void;
  enableLiveUpdates?: boolean; // New prop to enable/disable live updates
  userLocation?: [number, number] | null; // User's current location
  followUser?: boolean; // Whether to follow user location
  userHeading?: number; // User's heading in degrees
}

// Interface for the ref that can be used to call methods from parent components
interface MapComponentRef {
  queryTrails: () => Promise<void>;
  getCurrentTrails: () => Trail[];
  centerOnLocation: (location: [number, number]) => void;
  setFollowUser: (follow: boolean) => void;
}


// Helper function to calculate the center point of a trail
const calculateTrailCenter = (coordinates: number[][]): [number, number] => {
  if (coordinates.length === 0) {
    return [0, 0];
  }
  
  const sumLng = coordinates.reduce((sum, coord) => sum + coord[0], 0);
  const sumLat = coordinates.reduce((sum, coord) => sum + coord[1], 0);
  
  return [sumLng / coordinates.length, sumLat / coordinates.length];
};

// Helper function to calculate bounding box for better zoom fitting
const calculateTrailBounds = (coordinates: number[][]) => {
  if (coordinates.length === 0) {
    return {
      ne: [0, 0] as [number, number],
      sw: [0, 0] as [number, number]
    };
  }
  
  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];
  
  coordinates.forEach(coord => {
    minLng = Math.min(minLng, coord[0]);
    maxLng = Math.max(maxLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLat = Math.max(maxLat, coord[1]);
  });
  
  return {
    ne: [maxLng, maxLat] as [number, number],
    sw: [minLng, minLat] as [number, number]
  };
};

// Helper function to calculate bounding box for a radius around a point
const calculateRadiusBounds = (centerLng: number, centerLat: number, radiusMiles: number) => {
  // Convert miles to degrees (approximate)
  // 1 degree latitude ≈ 69 miles
  // 1 degree longitude ≈ 69 * cos(latitude) miles
  const latDegrees = radiusMiles / 69;
  const lngDegrees = radiusMiles / (69 * Math.cos(centerLat * Math.PI / 180));
  
  return {
    ne: [centerLng + lngDegrees, centerLat + latDegrees] as [number, number],
    sw: [centerLng - lngDegrees, centerLat - latDegrees] as [number, number]
  };
};

const MapComponent = React.forwardRef<MapComponentRef, MapComponentProps>(({ 
  style, 
  initialCenter = [-112.4440, 42.8746], // Default to Pocatello, Idaho
  initialZoom = 10,
  onTrailPress,
  selectedTrail,
  onTrailsLoaded,
  enableLiveUpdates = false, // Default to false for backward compatibility
  userLocation = null,
  followUser = false,
  userHeading = 0
}, ref) => {
  const mapRef = useRef<Mapbox.MapView>(null);
  const [trails, setTrails] = React.useState<Trail[]>([]);
  const [isFollowingUser, setIsFollowingUser] = React.useState(followUser);
  
  // Camera configuration state for controlling map view
  const [cameraConfig, setCameraConfig] = React.useState({
    centerCoordinate: initialCenter,
    zoomLevel: initialZoom,
    animationDuration: 1000
  });
  
  // Throttling state for camera movements
  const [isQuerying, setIsQuerying] = React.useState(false);
  const queryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose methods to parent component via ref
  // This allows the parent to call queryTrails() and getCurrentTrails() directly
  React.useImperativeHandle(ref, () => ({
    queryTrails: queryTrails,
    getCurrentTrails: () => trails,
    centerOnLocation: (location: [number, number]) => {
      setCameraConfig({
        centerCoordinate: location,
        zoomLevel: 14,
        animationDuration: 1000
      });
    },
    setFollowUser: (follow: boolean) => {
      setIsFollowingUser(follow);
    },
  }));

  const handleTrailPress = (trail: Trail) => {
    if (onTrailPress) {
      onTrailPress(trail);
    }
  };
  
  /**
   * Throttled version of queryTrails for live updates
   * Prevents excessive API calls when the camera moves frequently
   */
  const throttledQueryTrails = () => {
    console.log('🔄 throttledQueryTrails called, enableLiveUpdates:', enableLiveUpdates, 'isQuerying:', isQuerying);
    
    if (!enableLiveUpdates || isQuerying) {
      console.log('🚫 Skipping query - live updates disabled or already querying');
      return;
    }
    
    // Clear any pending query
    if (queryTimeoutRef.current) {
      clearTimeout(queryTimeoutRef.current);
      console.log('🔄 Cleared previous timeout');
    }
    
    // Set a timeout to query trails after camera movement stops
    queryTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Camera movement stopped, querying trails...');
      setIsQuerying(true);
      queryTrails().finally(() => {
        setIsQuerying(false);
      });
    }, 150); // Wait only 150ms after camera stops moving - much faster!
  };
  
  /**
   * Handle region change events (when map viewport changes)
   * Triggers live trail updates when camera moves
   */
  const handleRegionDidChange = (feature: any) => {
    console.log('🗺️ Region changed event fired, enableLiveUpdates:', enableLiveUpdates);
    if (enableLiveUpdates) {
      console.log('📍 Map region changed, scheduling trail query...');
      throttledQueryTrails();
    }
  };

  
  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Main function to query trails from the Mapbox vector layer
   * This function attempts multiple approaches to find trail data:
   * 1. Query specific trail layers by ID
   * 2. Query all layers and filter for trail-like features
   * 3. Fall back to sample data if nothing is found
   */
  const queryTrails = async () => {
    if (!mapRef.current) {
      console.log('❌ MapRef not available - map not loaded yet');
      return;
    }

    try {
      console.log('🔍 Starting trail query process...');
      
      // Step 1: Try querying specific trail layer IDs
      // These should match the layer IDs in your Mapbox style
      const possibleLayerIds = [
        'trailLines',        // This is the ID we defined in the LineLayer
        'trails',           // Common fallback layer name
        'TrailsExport-dk9q4d'  // This is your source layer ID from Mapbox Studio
      ];

      let allTrails: Trail[] = [];

      // Try each possible layer ID
      for (const layerId of possibleLayerIds) {
        try {
          console.log(`🎯 Trying layer ID: "${layerId}"`);
          
          // Query all features in a large rectangle to get all visible features
          // Note: This only gets features currently visible in the map viewport
          const featureCollection = await mapRef.current.queryRenderedFeaturesInRect(
            [0, 0, 1000, 1000], // Large rectangle covering most of the screen
            null, // No filter expression - get all features
            [layerId] // Specify which layer to query
          );

          if (featureCollection && featureCollection.features) {
            console.log(`✅ Found ${featureCollection.features.length} features in layer "${layerId}"`);

            if (featureCollection.features.length > 0) {
              // Convert each feature to our Trail interface
              const trailFeatures: Trail[] = featureCollection.features.map((feature: any, index: number) => {
                console.log(`📊 Feature ${index + 1} properties:`, feature.properties);
                
                // Map the feature properties to our Trail interface
                // Using fallback values if properties are missing
                return {
                  id: feature.properties?.id || index + 1,
                  BMP: feature.properties?.BMP || 0,
                  EMP: feature.properties?.EMP || 0,
                  OBJECTID: feature.properties?.OBJECTID || index + 1,
                  SEGMENT_LE: feature.properties?.SEGMENT_LE || 0,
                  Shape_Length: feature.properties?.Shape_Length || 0,
                  SHAPELEN: feature.properties?.SHAPELEN || 0,
                  TRAIL_CN: feature.properties?.TRAIL_CN || 0,
                  TRAIL_NAME: feature.properties?.TRAIL_NAME || `Trail ${index + 1}`,
                  TRAIL_NO: feature.properties?.TRAIL_NO || '',
                  TRAIL_TYPE: feature.properties?.TRAIL_TYPE || '',
                  coordinates: feature.geometry?.coordinates || []
                };
              });

              allTrails = [...allTrails, ...trailFeatures];
              // If we found trails in this layer, we can stop looking
              break;
            }
          }
        } catch (layerError) {
          console.log(`❌ Layer "${layerId}" not found or error:`, layerError);
        }
      }

      // Step 2: If no trails found in specific layers, try querying all layers with strict trail criteria
      if (allTrails.length === 0) {
        console.log('🔍 No trails found in specific layers, trying all layers with strict criteria...');
        try {
          const allFeatures = await mapRef.current.queryRenderedFeaturesInRect(
            [0, 0, 1000, 1000],
            null,
            null // Query all layers
          );
          
          console.log(`📊 Found ${allFeatures.features.length} total features across all layers`);
          
          // Filter for features that are ACTUALLY trails with much stricter criteria
          const potentialTrails = allFeatures.features.filter((feature: any) => {
            const props = feature.properties || {};
            
            // Must be a LineString (not Point or Polygon)
            if (feature.geometry?.type !== 'LineString') {
              return false;
            }
            
            // Must have specific trail properties, not just generic "name" or "length"
            const hasSpecificTrailProperty = Object.keys(props).some(key => 
              key.toLowerCase().includes('trail_name') || 
              key.toLowerCase().includes('trail_no') ||
              key.toLowerCase().includes('trail_type') ||
              key.toLowerCase().includes('trail_cn') ||
              key.toLowerCase().includes('segment_le')
            );
            
            // OR must have TRAIL_NAME property specifically
            const hasTrailNameProperty = props.hasOwnProperty('TRAIL_NAME');
            
            // Exclude obvious road/street features
            const isNotRoad = !Object.keys(props).some(key => 
              key.toLowerCase().includes('road') ||
              key.toLowerCase().includes('street') ||
              key.toLowerCase().includes('highway') ||
              key.toLowerCase().includes('route')
            );
            
            return (hasSpecificTrailProperty || hasTrailNameProperty) && isNotRoad;
          });

          console.log(`🎯 Found ${potentialTrails.length} actual trail features with strict criteria`);

          allTrails = potentialTrails.map((feature: any, index: number) => {
            console.log(`📊 Validated trail ${index + 1} properties:`, feature.properties);
            return {
              id: feature.properties?.id || index + 1,
              BMP: feature.properties?.BMP || 0,
              EMP: feature.properties?.EMP || 0,
              OBJECTID: feature.properties?.OBJECTID || index + 1,
              SEGMENT_LE: feature.properties?.SEGMENT_LE || 0,
              Shape_Length: feature.properties?.Shape_Length || 0,
              SHAPELEN: feature.properties?.SHAPELEN || 0,
              TRAIL_CN: feature.properties?.TRAIL_CN || 0,
              TRAIL_NAME: feature.properties?.TRAIL_NAME || `Trail ${index + 1}`,
              TRAIL_NO: feature.properties?.TRAIL_NO || '',
              TRAIL_TYPE: feature.properties?.TRAIL_TYPE || '',
              coordinates: feature.geometry?.coordinates || []
            };
          });
        } catch (allFeaturesError) {
          console.log('❌ Error querying all features:', allFeaturesError);
        }
      }

      // Step 3: Update state with found trails
      console.log(`🎉 Total trails found: ${allTrails.length}`);
      setTrails(allTrails);
      if (onTrailsLoaded) {
        onTrailsLoaded(allTrails);
      }
    } catch (error) {
      console.log('❌ Error in queryTrails:', error);
      // No fallback - just return empty trails array
      // This prevents fake trails from being created when there are no actual trails
      console.log('🔧 No trails found, returning empty array');
      setTrails([]);
      if (onTrailsLoaded) {
        onTrailsLoaded([]);
      }
    }
  };

  /**
   * Handle map load event
   * Automatically query trails when the map finishes loading.
   */
  const handleMapLoad = () => {
    console.log('📍 Map loaded, querying trails in 1 second...');
    setTimeout(() => {
      queryTrails();
    }, 1000); // Give the map time to fully load
  };

  // Query trails within a radius around a clicked point
  const queryTrailsInRadius = async (centerLng: number, centerLat: number, radiusMiles: number = 50) => {
    if (!mapRef.current) return;

    try {
      console.log(`Querying trails within ${radiusMiles} miles of [${centerLng}, ${centerLat}]`);
      
      // Calculate bounding box for the radius
      const bounds = calculateRadiusBounds(centerLng, centerLat, radiusMiles);
      
      // Convert coordinates to screen points for querying
      const neScreen = await mapRef.current.getPointInView(bounds.ne);
      const swScreen = await mapRef.current.getPointInView(bounds.sw);
      
      // Create rectangle from screen points
      const queryRect = [
        Math.min(neScreen[0], swScreen[0]),
        Math.min(neScreen[1], swScreen[1]),
        Math.max(neScreen[0], swScreen[0]),
        Math.max(neScreen[1], swScreen[1])
      ];

      console.log('Query bounds:', bounds);
      console.log('Query rectangle:', queryRect);

      // Query features in the calculated rectangle
      const featureCollection = await mapRef.current.queryRenderedFeaturesInRect(
        queryRect as [number, number, number, number],
        null,
        ['trailLines']
      );

      if (featureCollection && featureCollection.features) {
        console.log(`Found ${featureCollection.features.length} trails in radius`);

        const radiusTrails: Trail[] = featureCollection.features.map((feature: any, index: number) => {
          return {
            id: feature.properties?.id || index + 1,
            BMP: feature.properties?.BMP || 0,
            EMP: feature.properties?.EMP || 0,
            OBJECTID: feature.properties?.OBJECTID || index + 1,
            SEGMENT_LE: feature.properties?.SEGMENT_LE || 0,
            Shape_Length: feature.properties?.Shape_Length || 0,
            SHAPELEN: feature.properties?.SHAPELEN || 0,
            TRAIL_CN: feature.properties?.TRAIL_CN || 0,
            TRAIL_NAME: feature.properties?.TRAIL_NAME || `Trail ${index + 1}`,
            TRAIL_NO: feature.properties?.TRAIL_NO || '',
            TRAIL_TYPE: feature.properties?.TRAIL_TYPE || '',
            coordinates: feature.geometry?.coordinates || []
          };
        });

        // Filter trails that are actually within the radius (more precise check)
        const filteredTrails = radiusTrails.filter(trail => {
          if (trail.coordinates.length === 0) return false;
          
          // Check if any part of the trail is within the radius
          return trail.coordinates.some(coord => {
            const distance = getDistanceInMiles(centerLat, centerLng, coord[1], coord[0]);
            return distance <= radiusMiles;
          });
        });

        console.log(`${filteredTrails.length} trails within ${radiusMiles} mile radius`);
        setTrails(filteredTrails);
        if (onTrailsLoaded) {
          onTrailsLoaded(filteredTrails);
        }
      } else {
        console.log('No trails found in radius');
        setTrails([]);
        if (onTrailsLoaded) {
          onTrailsLoaded([]);
        }
      }
    } catch (error) {
      console.log('Error querying trails in radius:', error);
    }
  };

  // Calculate distance between two points in miles using Haversine formula
  const getDistanceInMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Handle map taps to query trails in radius or select trails
  const handleMapPress = async (event: any) => {
    if (!mapRef.current) return;

    try {
      const { coordinates } = event.geometry;
      const [lng, lat] = coordinates;
      
      console.log(`Map clicked at: [${lng}, ${lat}]`);
      
      // Enhanced iOS-friendly trail detection with multiple fallback approaches
      let clickedFeatures = null;
      
      // Method 1: Try larger rectangle query first (most reliable on iOS)
      try {
        const tolerance = 50; // Increased tolerance for better iOS touch detection
        const x = event.properties?.screenPointX || 0;
        const y = event.properties?.screenPointY || 0;
        
        console.log(`🎯 Trying rectangle query at screen point [${x}, ${y}] with tolerance ${tolerance}`);
        
        clickedFeatures = await mapRef.current.queryRenderedFeaturesInRect(
          [x - tolerance, y - tolerance, x + tolerance, y + tolerance],
          null,
          ['trailHitbox', 'trailLines']
        );
        console.log(`🎯 Rectangle query found ${clickedFeatures?.features?.length || 0} features`);
      } catch (rectError) {
        console.log('Rectangle query failed:', rectError);
      }
      
      // Method 2: If rectangle fails, try point query
      if (!clickedFeatures || clickedFeatures.features.length === 0) {
        try {
          const x = event.properties?.screenPointX || 0;
          const y = event.properties?.screenPointY || 0;
          
          console.log(`🎯 Trying point query at screen point [${x}, ${y}]`);
          
          clickedFeatures = await mapRef.current.queryRenderedFeaturesAtPoint(
            [x, y],
            null,
            ['trailHitbox', 'trailLines']
          );
          console.log(`🎯 Point query found ${clickedFeatures?.features?.length || 0} features`);
        } catch (pointError) {
          console.log('Point query failed:', pointError);
        }
      }
      
      // Method 3: Fallback to querying all trail layers without filter
      if (!clickedFeatures || clickedFeatures.features.length === 0) {
        try {
          const tolerance = 40;
          const x = event.properties?.screenPointX || 0;
          const y = event.properties?.screenPointY || 0;
          
          console.log(`🎯 Trying fallback query without layer filter`);
          
          clickedFeatures = await mapRef.current.queryRenderedFeaturesInRect(
            [x - tolerance, y - tolerance, x + tolerance, y + tolerance],
            null,
            null // No layer filter - query all layers
          );
          
          // Filter for LineString features that could be trails
          if (clickedFeatures && clickedFeatures.features) {
            clickedFeatures.features = clickedFeatures.features.filter((feature: any) => 
              feature.geometry?.type === 'LineString'
            );
          }
          
          console.log(`🎯 Fallback query found ${clickedFeatures?.features?.length || 0} line features`);
        } catch (fallbackError) {
          console.log('Fallback query failed:', fallbackError);
        }
      }
      
      if (clickedFeatures && clickedFeatures.features.length > 0) {
        console.log('🎯 Trail clicked!', clickedFeatures.features[0].properties);
        
        // Convert the clicked feature to our Trail interface
        const feature = clickedFeatures.features[0];
        const clickedTrail: Trail = {
          id: feature.properties?.id || Date.now(),
          BMP: feature.properties?.BMP || 0,
          EMP: feature.properties?.EMP || 0,
          OBJECTID: feature.properties?.OBJECTID || Date.now(),
          SEGMENT_LE: feature.properties?.SEGMENT_LE || 0,
          Shape_Length: feature.properties?.Shape_Length || 0,
          SHAPELEN: feature.properties?.SHAPELEN || 0,
          TRAIL_CN: feature.properties?.TRAIL_CN || 0,
          TRAIL_NAME: feature.properties?.TRAIL_NAME || 'Unknown Trail',
          TRAIL_NO: feature.properties?.TRAIL_NO || '',
          TRAIL_TYPE: feature.properties?.TRAIL_TYPE || '',
          coordinates: feature.geometry?.coordinates || []
        };
        
        // Call the trail press handler
        if (onTrailPress) {
          onTrailPress(clickedTrail);
        }
      } else {
        // No trail clicked, query trails within 50 miles of the clicked point
        await queryTrailsInRadius(lng, lat, 50);
      }
      
    } catch (error) {
      console.log('Error handling map press:', error);
    }
  };

  /**
   * Zoom the map to focus on a selected trail
   * @param trail - The trail to zoom to
   */
  const zoomToTrail = (trail: Trail) => {
    if (!trail.coordinates.length) {
      console.log('❌ Cannot zoom to trail - no coordinates available');
      return;
    }

    try {
      console.log(`🔍 Zooming to trail: ${trail.TRAIL_NAME}`);
      
      // Calculate the center point of the trail
      const center = calculateTrailCenter(trail.coordinates);
      
      // Update the camera state to focus on the trail
      // We'll use the Camera component in the JSX instead of direct method calls
      setCameraConfig({
        centerCoordinate: center,
        zoomLevel: 14,
        animationDuration: 1000
      });
      
      console.log('📍 Camera updated to focus on trail');
    } catch (error) {
      console.error('❌ Error setting camera for trail:', error);
      // Don't crash the app if zooming fails
    }
  };

  React.useEffect(() => {
    if (selectedTrail) {
      zoomToTrail(selectedTrail);
    }
  }, [selectedTrail]);

  const createTrailGeoJSON = (trail: Trail) => ({
    type: 'Feature' as const,
    properties: {
      id: trail.id,
      OBJECTID: trail.OBJECTID,
      TRAIL_NAME: trail.TRAIL_NAME,
      TRAIL_NO: trail.TRAIL_NO,
      SEGMENT_LE: trail.SEGMENT_LE,
      TRAIL_TYPE: trail.TRAIL_TYPE
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: trail.coordinates
    }
  });

  // Function to get all trails and list them by name and segment length
  const getAllTrails = (): { name: string; segmentLength: number }[] => {
    return trails.map(trail => ({
      name: trail.TRAIL_NAME,
      segmentLength: trail.SEGMENT_LE
    }));
  };

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView 
        styleURL="mapbox://styles/mapbox/streets-v12" 
        style={{ flex: 1 }}
        ref={mapRef}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        attributionEnabled={false}
        logoEnabled={false}
        onDidFinishLoadingMap={handleMapLoad}
        onPress={handleMapPress}
        onRegionDidChange={handleRegionDidChange}
      >
        <Mapbox.Camera 
          centerCoordinate={cameraConfig.centerCoordinate} 
          zoomLevel={cameraConfig.zoomLevel} 
          animationDuration={cameraConfig.animationDuration}
          followUserLocation={isFollowingUser}
          followUserMode={isFollowingUser ? 'compass' : 'normal'}
          followZoomLevel={16}
        />
        
        <Mapbox.VectorSource id="trailsSource" url="mapbox://curtmapapps.dy8hydlg">
          {/* Wider invisible layer for better hitbox detection - enhanced for iOS */}
          <Mapbox.LineLayer
            id="trailHitbox"
            sourceLayerID="TrailsExport-dk9q4d"
            style={{ 
              lineColor: 'rgba(0,0,0,0.01)', // Slightly visible for better iOS detection
              lineWidth: 40, // Much larger hitbox for iOS touch detection
              lineOpacity: 0.01, // Barely visible but not completely transparent
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
          {/* Visible trail lines */}
          <Mapbox.LineLayer
            id="trailLines"
            sourceLayerID="TrailsExport-dk9q4d"
            style={{ lineColor: 'green', lineWidth: 2 }}
          />
        </Mapbox.VectorSource>
        
        {/* Highlighted selected trail */}
        {selectedTrail && selectedTrail.coordinates.length > 0 && (
          <Mapbox.ShapeSource
            id="selectedTrailSource"
            shape={createTrailGeoJSON(selectedTrail)}
          >
            <Mapbox.LineLayer
              id="selectedTrailLine"
              style={{
                lineColor: '#FF0000', // Red color for selected trail
                lineWidth: 4,
                lineOpacity: 0.8,
              }}
            />
          </Mapbox.ShapeSource>
        )}
        
        {/* User location marker with arrow */}
        {userLocation && (
          <Mapbox.PointAnnotation
            id="userLocation"
            coordinate={userLocation}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationArrow} />
            </View>
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>
    </View>
  );
});

// Add display name for debugging
MapComponent.displayName = 'MapComponent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  userLocationArrow: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3, // Android shadow
    // iOS shadow properties are handled by shadowColor, shadowOffset, shadowOpacity, shadowRadius
  },
});

export default MapComponent;
export type { Trail, MapComponentRef };