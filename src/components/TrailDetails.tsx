import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Trail } from './MapComponent';

/**
 * Safely format a number to a fixed decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places
 * @returns Formatted string or 'Unknown' if invalid
 */
const safeToFixed = (value: any, decimals: number = 1): string => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(decimals);
  }
  return value?.toString() || 'Unknown';
};

/**
 * Props for the TrailDetails component
 */
interface TrailDetailsProps {
  trail: Trail | null;
  visible: boolean;
  onClose: () => void;
  onStartHike?: (trail: Trail) => void;
}

/**
 * TrailDetails - Modal component that displays detailed information about a selected trail
 */
const TrailDetails: React.FC<TrailDetailsProps> = ({ trail, visible, onClose, onStartHike }) => {
  if (!trail) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.trailName}>{trail.TRAIL_NAME}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Trail Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Essential Trail Information */}
            <View style={styles.section}>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Trail Length:</Text>
                <Text style={styles.value}>{safeToFixed(trail.SEGMENT_LE, 1)} miles</Text>
              </View>
              
              {trail.coordinates.length > 0 && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Start Coordinates:</Text>
                    <Text style={styles.value}>
                      {safeToFixed(trail.coordinates[0][1], 6)}, {safeToFixed(trail.coordinates[0][0], 6)}
                    </Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>End Coordinates:</Text>
                    <Text style={styles.value}>
                      {safeToFixed(trail.coordinates[trail.coordinates.length - 1][1], 6)}, {safeToFixed(trail.coordinates[trail.coordinates.length - 1][0], 6)}
                    </Text>
                  </View>
                </>
              )}
            </View>

          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.startHikeButton} onPress={() => onStartHike && onStartHike(trail)}>
                <Text style={styles.startHikeButtonText}>🥾 Start Hike</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton2} onPress={onClose}>
                <Text style={styles.closeButtonText2}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent', // Remove dark overlay
    justifyContent: 'flex-end', // Position at bottom
    alignItems: 'center',
    paddingBottom: 20, // Add some padding from bottom
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '95%',
    height: '40%', // Smaller modal height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  trailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  startHikeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  startHikeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton2: {
    backgroundColor: '#757575',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  closeButtonText2: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TrailDetails;