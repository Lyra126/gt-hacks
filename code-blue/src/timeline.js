import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, StyleSheet } from 'react-native';

const timelineData = [
  {
    date: "Step 1",
    title: "Sign Up",
    subtitle: "Create your volunteer profile",
    color: "#3498db",
    tasks: [
      "Enter personal info",
      "Verify email",
      "Upload ID",
      "Agree to terms"
    ]
  },
  {
    date: "Step 2",
    title: "Eligibility Screening",
    subtitle: "Answer screening questions",
    color: "#27ae60",
    tasks: [
      "Complete health survey",
      "Upload medical records",
      "Schedule screening call"
    ]
  },
  {
    date: "Step 3",
    title: "Trial Matching",
    subtitle: "Get matched with trials",
    color: "#9b59b6",
    tasks: [
      "Review trial options",
      "Select preferred trials",
      "Submit interest"
    ]
  },
  {
    date: "Step 4",
    title: "Enrollment",
    subtitle: "Finalize enrollment",
    color: "#e67e22",
    tasks: [
      "Sign consent forms",
      "Schedule first visit",
      "Confirm participation"
    ]
  }
];

const TimelineItem = ({ item, index, isExpanded, onToggle, taskStatus, onTaskToggle }) => {
  const [animation] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120 + item.tasks.length * 32], // adjust based on tasks
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const completedTasks = taskStatus[index].filter(Boolean).length;
  const totalTasks = item.tasks.length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
        {index < timelineData.length - 1 && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.contentColumn}>
        <TouchableOpacity
          style={[styles.itemHeader, { borderLeftColor: item.color }]}
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
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${completionRate}%`, backgroundColor: item.color }]} />
          </View>
          <Text style={styles.progressText}>{completionRate}% Complete</Text>
        </View>
        {/* Expandable Content */}
        <Animated.View
          style={[
            styles.expandableContent,
            {
              maxHeight,
              opacity,
            }
          ]}
        >
          <View style={styles.tasksContainer}>
            {item.tasks.map((task, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.taskRow}
                onPress={() => onTaskToggle(index, idx)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  taskStatus[index][idx] && { backgroundColor: item.color, borderColor: item.color }
                ]}>
                  {taskStatus[index][idx] && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.taskText}>{task}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const ClinicalTrialTimeline = () => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  // Track completion status for each task in each step
  const [taskStatus, setTaskStatus] = useState(
    timelineData.map(item => Array(item.tasks.length).fill(false))
  );

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const toggleTask = (stepIdx, taskIdx) => {
    setTaskStatus(prev => {
      const updated = prev.map(arr => [...arr]);
      updated[stepIdx][taskIdx] = !updated[stepIdx][taskIdx];
      return updated;
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.timelineTitle}>Clinical Trial Volunteer Timeline</Text>
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
  taskText: {
    fontSize: 15,
    color: '#34495e',
  },
});

export default ClinicalTrialTimeline;