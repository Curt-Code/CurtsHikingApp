import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Trail } from './MapComponent';

interface TrailsListProps {
  trails: Trail[];
  onTrailPress?: (trail: Trail) => void;
  selectedTrail?: Trail | null;
}

const TrailsList: React.FC<TrailsListProps> = ({ trails, onTrailPress, selectedTrail }) => {
  const renderTrailItem = ({ item }: { item: Trail }) => (
    <TouchableOpacity
      style={[
        styles.trailItem,
        selectedTrail?.OBJECTID === item.OBJECTID && styles.selectedTrailItem
      ]}
      onPress={() => onTrailPress && onTrailPress(item)}
    >
      <View style={styles.trailContent}>
        <Text style={styles.trailName}>{item.TRAIL_NAME}</Text>
        <Text style={styles.trailDetails}>
          Trail #{item.TRAIL_NO} • {item.TRAIL_TYPE}
        </Text>
        <Text style={styles.segmentLength}>
          Segment Length: {item.SEGMENT_LE.toFixed(1)} miles
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (trails.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No trails found</Text>
        <Text style={styles.emptySubText}>Tap the map to query trails in that area</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Trails Found ({trails.length})</Text>
      <FlatList
        data={trails}
        renderItem={renderTrailItem}
        keyExtractor={(item) => item.OBJECTID.toString()}
        showsVerticalScrollIndicator={false}
        style={styles.list}
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
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  list: {
    flex: 1,
  },
  trailItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedTrailItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  trailContent: {
    flex: 1,
  },
  trailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  trailDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  segmentLength: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default TrailsList;