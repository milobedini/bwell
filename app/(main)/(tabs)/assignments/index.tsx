import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ActiveAssignments from '@/components/assignments/ActiveAssignments';
import CompletedAssignments from '@/components/assignments/CompletedAssignments';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const AssignmentsHome = () => {
  const { top } = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: true,
        tabBarShowIcon: true,
        tabBarLabelStyle: {
          marginTop: 20,
          fontFamily: Fonts.Bold,
          color: 'white',
          textAlign: 'center'
        },
        tabBarContentContainerStyle: {
          alignItems: 'center'
        },
        tabBarIndicatorStyle: { backgroundColor: Colors.sway.bright },
        tabBarStyle: {
          paddingTop: top,
          height: 88 + top,
          borderTopWidth: 0,
          shadowOpacity: 0.3,
          shadowColor: '#34715D',
          shadowRadius: 36,
          shadowOffset: { width: 0, height: 6 },
          backgroundColor: 'rgb(43,59,91)'
        },
        tabBarActiveTintColor: Colors.sway.bright,
        tabBarInactiveTintColor: Colors.sway.lightGrey
      }}
    >
      <Tab.Screen
        name="active-assignments"
        component={ActiveAssignments}
        options={{
          title: 'Active',
          tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" color={color} size={24} />
        }}
      />
      <Tab.Screen
        name="completed-assignments"
        component={CompletedAssignments}
        options={{
          title: 'Completed',
          tabBarIcon: ({ color }) => <Ionicons name="clipboard" color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  );
};

export default AssignmentsHome;
