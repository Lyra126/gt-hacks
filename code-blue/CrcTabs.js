import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import CrcDashboard from './src/CrcDashboard';
import ClinicalTrialsCRC from './src/clinicalTrialsCRC';

const Tab = createBottomTabNavigator();

export default function CrcTabs({route}) {
  const email = route.params?.email;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'CrcDashboard') iconName = focused ? 'medkit' : 'medkit-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#32ae48',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="CrcDashboard">
        {props => <CrcDashboard />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
