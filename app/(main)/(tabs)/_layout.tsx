import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin, isPatient, isTherapist } from '@/utils/userRoles';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import disabledIcon from '../../../assets/images/disabled-icon.png';
import icon from '../../../assets/images/icon.png';

export default function MainTabsLayout() {
  const user = useAuthStore((s) => s.user);
  const { bottom } = useSafeAreaInsets();

  const admin = isAdmin(user?.roles);
  const therapist = isTherapist(user?.roles);
  const patient = isPatient(user?.roles);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          backgroundColor: Colors.sway.dark,
          borderTopColor: Colors.sway.bright,
          paddingTop: 4,
          paddingBottom: bottom ? bottom / 2 : 8,
          height: 76 + bottom / 2,
          borderTopWidth: 2,
          shadowOpacity: 0.3,
          shadowColor: Colors.sway.white,
          shadowRadius: 36,
          shadowOffset: { width: 0, height: 6 }
        },
        tabBarActiveTintColor: Colors.sway.bright,
        tabBarInactiveTintColor: Colors.sway.lightGrey,
        sceneStyle: { backgroundColor: Colors.sway.dark }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: therapist ? 'Dashboard' : 'Home',
          tabBarIcon: ({ size, focused }) => (
            <Image
              source={focused ? icon : disabledIcon}
              contentFit="contain"
              style={{
                width: size * 2,
                height: size * 2
              }}
            />
          )
        }}
      />

      {/* Patient-only tabs */}
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text-clock" color={color} size={size} />
          ),
          href: patient ? undefined : null
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-line" color={color} size={size} />,
          href: patient ? undefined : null
        }}
      />

      {/* Therapist-only tabs */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />,
          href: therapist ? undefined : null
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-check" color={color} size={size} />,
          href: therapist ? undefined : null
        }}
      />

      {/* Admin-only tab */}
      <Tabs.Screen
        name="all-users"
        options={{
          title: 'All Users',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          href: admin ? undefined : null
        }}
      />

      {/* Programs — accessible via deep links but hidden from tab bar */}
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
          href: null
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
