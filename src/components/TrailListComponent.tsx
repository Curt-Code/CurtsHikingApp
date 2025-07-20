import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { Trail } from './MapComponent';

/**
 * Props for the TrailListComponent
 * Simplified to remove distance filtering complexity
 */
interface TrailListComponentProps {
  trails: Trail[];  // Array of trails to display
  onTrailSelect: (trail: Trail) => void;  // Callback when a trail is selected
  selectedTrail?: Trail | null;  // Currently selected trail (optional)
}

/**
 * TrailListComponent - Displays a list of trails with their details
 * Simplified version without distance-based filtering
 */
const TrailListComponent: React.FC<TrailListComponentProps> = ({
  trails,
  onTrailSelect,
  selectedTrail,
}) => {

  return (
    <View style={styles.container}>
      {/* Header with trail count */}
      <View style={styles.header}>
        <Text style={styles.title}>Trails Found ({trails.length})</Text>
        <Text style={styles.subtitle}>
          {trails.length === 0 ? 'No trails loaded yet' : 'Tap a trail to view on map'}
        </Text>
      </View>

      {/* Trail list */}
      <ScrollView style={styles.trailList} showsVerticalScrollIndicator={true}>
        {trails.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No trails found
            </Text>
            <Text style={styles.emptySubtext}>
              Try tapping the map or use the "Get Location" button to load trails
            </Text>
          </View>
        ) : (
          trails.map((trail, index) => (
            <TouchableOpacity
              key={`trail-${trail.OBJECTID}-${index}`}
              style={[
                styles.trailItem,
                selectedTrail?.OBJECTID === trail.OBJECTID && styles.selectedTrailItem,
              ]}
              onPress={() => onTrailSelect(trail)}
            >
              {/* Trail header with name */}
              <View style={styles.trailHeader}>
                <Text style={styles.trailName}>{trail.TRAIL_NAME || 'Unnamed Trail'}</Text>
              </View>
              
              {/* Trail details */}
              <View style={styles.trailDetails}>
                <View style={styles.trailInfo}>
                  <Text style={styles.trailLength}>
                    {trail.SEGMENT_LE ? `${trail.SEGMENT_LE.toFixed(1)} miles` : 'Length unknown'}
                  </Text>
                  <Text style={styles.trailId}>
                    {trail.TRAIL_NO ? `Trail #${trail.TRAIL_NO}` : `ID: ${trail.OBJECTID}`}
                  </Text>
                  <Text style={styles.trailType}>
                    {trail.TRAIL_TYPE || 'Unknown type'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  trailList: {
    flex: 1,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  trailItem: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTrailItem: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
  },
  trailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  trailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  trailDistance: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  trailDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trailLength: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  trailId: {
    fontSize: 12,
    color: '#999',
  },
  trailType: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default TrailListComponent;