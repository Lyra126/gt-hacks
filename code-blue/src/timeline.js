import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const accentColor = "#3498db";
const completeColor = "#27ae60";
const pendingColor = "#bdc3c7";

// This component is now a "dumb" component that just renders what it's given
const TimelineItem = ({ item, index, isExpanded, onToggle, taskStatus, onTaskToggle, totalItems }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animation]);

  const completedTasks = taskStatus[index]?.filter(Boolean).length || 0;
  const totalTasks = item.tasks?.length || 0;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let stepColor = pendingColor;
  if (completedTasks === totalTasks && totalTasks > 0) {
    stepColor = completeColor;
  } else if (completedTasks > 0) {
    stepColor = accentColor;
  }

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120 + (item.tasks?.length || 0) * 48],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: stepColor }]} />
        {index < totalItems - 1 && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.contentColumn}>
        <TouchableOpacity
          style={[styles.itemHeader, { borderLeftColor: stepColor }]}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <View style={styles.headerContent}>
            <Text style={styles.itemDate}>{item.date}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
          </View>
          <View style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            <Text style={styles.expandIconText}>▼</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: ((width - 80) * completionRate / 100), backgroundColor: stepColor }]} />
          </View>
          <Text style={[styles.progressText, stepColor === completeColor && { color: completeColor }]}>{completionRate}% Complete</Text>
        </View>
        <Animated.View style={[styles.expandableContent, { maxHeight, opacity }]}>
          <View style={styles.tasksContainer}>
            {item.tasks?.map((task, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.taskRow}
                onPress={() => onTaskToggle(index, idx)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  taskStatus[index]?.[idx] && { backgroundColor: stepColor, borderColor: stepColor }
                ]}>
                  {taskStatus[index]?.[idx] && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

// MODIFIED COMPONENT: It now receives 'timelineData' as a prop
const ClinicalTrialTimeline = ({ trialTitle, timelineData, savedProgress, onProgressChange }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [taskStatus, setTaskStatus] = useState([]);

  // This effect loads saved progress or initializes task statuses
  useEffect(() => {
    if (timelineData) {
      if (savedProgress && savedProgress.taskStatus) {
        // Load saved progress
        setTaskStatus(savedProgress.taskStatus);
        if (savedProgress.expandedItems) {
          setExpandedItems(new Set(savedProgress.expandedItems));
        }
      } else {
        // Initialize with default values
        setTaskStatus(timelineData.map(item => Array(item.tasks?.length || 0).fill(false)));
      }
    }
  }, [timelineData, savedProgress]);

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
    
    // Save progress
    if (onProgressChange) {
      onProgressChange({
        taskStatus,
        expandedItems: Array.from(newExpanded)
      });
    }
  };

  const toggleTask = (stepIdx, taskIdx) => {
    setTaskStatus(prev => {
      const updated = prev.map(arr => [...arr]);
      updated[stepIdx][taskIdx] = !updated[stepIdx][taskIdx];
      
      // Save progress
      if (onProgressChange) {
        onProgressChange({
          taskStatus: updated,
          expandedItems: Array.from(expandedItems)
        });
      }
      
      return updated;
    });
  };
  
  // Render a message if no data is available
  if (!timelineData || timelineData.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No timeline data available for this trial.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.timelineTitle}>{'Timeline'}</Text>
      <View style={styles.timeline}>
        {timelineData.map((item, index) => (
          <TimelineItem
            key={index}
            item={item}
            index={index}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleExpanded(index)}
            taskStatus={taskStatus}
            onTaskToggle={toggleTask}
            totalItems={timelineData.length}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fb',
    padding: 20,
  },
  timelineTitle: {
    marginTop: 50,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 30,
    textAlign: 'center',
  },
  timeline: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  timelineColumn: {
    alignItems: 'center',
    marginRight: 15,
    width: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#d0e6f7',
    marginTop: 8,
    minHeight: 60,
  },
  contentColumn: {
    flex: 1,
  },
  itemHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#2980b9',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  itemDate: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  expandIcon: {
    marginLeft: 10,
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  expandIconText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e1e8ed',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 2,
    fontWeight: '600',
  },
  expandableContent: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 12,
  },
  tasksContainer: {
    padding: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#b2bec3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxTick: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  taskTitle: {
    fontSize: 15,
    color: '#34495e',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f4f8fb',
  },
  noDataText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default ClinicalTrialTimeline;