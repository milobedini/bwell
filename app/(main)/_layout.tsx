import { Slot, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function MainLayout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  if (!user) router.replace('/(auth)/login');

  return <Slot />;
}
