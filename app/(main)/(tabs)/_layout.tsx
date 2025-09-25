import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/utils/userRoles';
import Ionicons from '@react-native-vector-icons/ionicons';

import disabledIcon from '../../../assets/images/disabled-icon.png';
import icon from '../../../assets/images/icon.png';

export default function MainTabsLayout() {
  const user = useAuthStore((s) => s.user);
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
        tabBarInactiveTintColor: Colors.sway.lightGrey
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, focused }) => (
            <Image
              source={focused ? icon : disabledIcon}
              width={size * 2}
              height={size * 2}
              style={{
                width: size * 2,
                height: size * 2
              }}
            />
          )
        }}
      />
      <Tabs.Screen
        name="all-users"
        options={{
          title: 'All Users',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          href: isAdmin(user?.roles) ? undefined : null
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" color={color} size={size} />,
          href: isAdmin(user?.roles) ? null : undefined
        }}
      />
      <Tabs.Screen
        name="attempts"
        options={{
          title: 'Attempts',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" color={color} size={size} />,
          href: isAdmin(user?.roles) ? null : undefined
        }}
      />

      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />
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
