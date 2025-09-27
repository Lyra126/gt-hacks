import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');


const TimelineItem = ({ item, index, isExpanded, onToggle }) => {
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
    outputRange: [0, 200], // adjust based on content
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.timelineItem}>
      {/* Timeline Line */}
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: item.color }]} />
        {/* Line to the next item */}
        {<View style={styles.timelineLine} />}
      </View>
      
      {/* Content */}
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
          <View style={styles.explanationContent}>
            <Text style={styles.explanationText}>{item.explanation}</Text>
            {item.details && (
              <View style={styles.detailsContainer}>
                {item.details.map((detail, idx) => (
                  <Text key={idx} style={styles.detailItem}>• {detail}</Text>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const InteractiveTimeline = () => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.timelineTitle}>Project Timeline</Text>
      
      <View style={styles.timeline}>
        {timelineData.map((item, index) => (
          <TimelineItem
            key={index}
            item={item}
            index={index}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleExpanded(index)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Full data lives OUTSIDE the component
const timelineData= [
  {
    date: "Jan 2024",
    title: "Project Kickoff",
    subtitle: "Initial planning phase",
    color: "#4A90E2",
    explanation: "Gathered requirements, set up environment, established goals.",
    details: [
      "Requirement gathering",
      "Team onboarding",
      "Tech stack selection",
      "Timeline creation"
    ]
  },
  {
    date: "Feb 2024",
    title: "Design Phase",
    subtitle: "UI/UX design and prototyping",
    color: "#F39C12",
    explanation: "Comprehensive designs and prototypes.",
    details: [
      "User research",
      "Wireframes",
      "Mockups",
      "Prototypes"
    ]
  },
  {
    date: "Mar 2024",
    title: "Development Sprint 1",
    subtitle: "Core functionality implementation",
    color: "#27AE60",
    explanation: "Implemented core features.",
    details: [
      "Auth system",
      "Navigation",
      "DB schema",
      "API development"
    ]
  },
  {
    date: "Apr 2024",
    title: "Testing & Refinement",
    subtitle: "QA and bug fixes",
    color: "#E74C3C",
    explanation: "Testing and bug fixing.",
    details: [
      "Unit tests",
      "Optimization",
      "Bug fixes",
      "UAT"
    ]
  },
  {
    date: "May 2024",
    title: "Launch",
    subtitle: "Production deployment",
    color: "#9B59B6",
    explanation: "Launched and monitored adoption.",
    details: [
      "Deployment",
      "Onboarding",
      "Monitoring",
      "Feedback"
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  timelineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30,
    textAlign: 'center',
  },
  timeline: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
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
    backgroundColor: '#e1e8ed',
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
    color: '#2c3e50',
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
    fontSize: 12,
    color: '#7f8c8d',
  },
  expandableContent: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 12,
  },
  explanationContent: {
    padding: 16,
  },
  explanationText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
    paddingLeft: 8,
  },
});

export default InteractiveTimeline;
