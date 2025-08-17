import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientActiveAssignments from '@/components/assignments/PatientActiveAssignments';
import PatientCompletedAssignments from '@/components/assignments/PatientCompletedAssignments';
import TherapistActiveAssignments from '@/components/assignments/TherapistActiveAssignments';
import TherapistLatestAttempts from '@/components/attempts/TherapistLatestAttempts';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const AssignmentsHome = () => {
  const { top } = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const renderedTabs = () => {
    const therapist = isTherapist(user?.roles);
    const patient = isPatient(user?.roles);

    if (patient)
      return (
        <>
          <Tab.Screen
            name="patient-active-assignments"
            component={PatientActiveAssignments}
            options={{
              title: 'Active',
              tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" color={color} size={24} />
            }}
          />
          <Tab.Screen
            name="patient-completed-assignments"
            component={PatientCompletedAssignments}
            options={{
              title: 'Completed',
              tabBarIcon: ({ color }) => <Ionicons name="clipboard" color={color} size={24} />
            }}
          />
        </>
      );

    if (therapist)
      return (
        <>
          <Tab.Screen
            name="therapist-active-assignments"
            component={TherapistActiveAssignments}
            options={{
              title: 'Assignments',
              tabBarIcon: ({ color }) => <Ionicons name="clipboard" color={color} size={24} />
            }}
          />
          <Tab.Screen
            name="therapist-latest-attempts"
            component={TherapistLatestAttempts}
            options={{
              title: 'Submissions',
              tabBarIcon: ({ color }) => <Ionicons name="document-text" color={color} size={24} />
            }}
          />
        </>
      );

    return <Tab.Screen name="unauthorised">{() => <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} />}</Tab.Screen>;
  };

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
      {renderedTabs()}
    </Tab.Navigator>
  );
};

export default AssignmentsHome;
