import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { getInitials } from '@/utils/initials';
import type { AuthUser } from '@milobedini/shared-types';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type ClientsSummaryCardProps = {
  clients: AuthUser[];
  onPress: () => void;
};

const MINI_AVATAR = 32;
const MAX_VISIBLE = 4;
const OVERLAP = 10;

const AVATAR_COLOURS = [Colors.sway.bright, Colors.therapist.purple, Colors.diary.closeness, Colors.diary.moodCool];

const ClientsSummaryCard = ({ clients, onPress }: ClientsSummaryCardProps) => {
  const visibleClients = useMemo(() => clients.slice(0, MAX_VISIBLE), [clients]);
  const overflowCount = clients.length - MAX_VISIBLE;
  const stackWidth =
    visibleClients.length * (MINI_AVATAR - OVERLAP) + OVERLAP + (overflowCount > 0 ? MINI_AVATAR - OVERLAP : 0);

  if (clients.length === 0) {
    return (
      <View
        className="mx-4 rounded-2xl p-4"
        style={{
          backgroundColor: Colors.chip.darkCard,
          borderWidth: 1,
          borderColor: Colors.tint.neutral
        }}
      >
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons name="account-group-outline" size={24} color={Colors.sway.darkGrey} />
          <ThemedText type="default" style={{ color: Colors.sway.darkGrey }}>
            No clients yet
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={`View ${clients.length} clients`}
      testID="clients-summary-card"
    >
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: Colors.chip.darkCard,
          borderWidth: 1,
          borderColor: Colors.therapist.tintSubtle
        }}
      >
        <ThemedText
          type="small"
          style={{
            color: Colors.sway.darkGrey,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: 11
          }}
        >
          Your Clients
        </ThemedText>

        <View className="flex-row items-center justify-between">
          <View style={{ width: stackWidth, height: MINI_AVATAR }} className="flex-row">
            {visibleClients.map((client, index) => (
              <View
                key={client._id}
                style={{
                  position: 'absolute',
                  left: index * (MINI_AVATAR - OVERLAP),
                  width: MINI_AVATAR,
                  height: MINI_AVATAR,
                  borderRadius: MINI_AVATAR / 2,
                  backgroundColor: AVATAR_COLOURS[index % AVATAR_COLOURS.length],
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: Colors.chip.darkCard,
                  zIndex: MAX_VISIBLE - index
                }}
              >
                <ThemedText type="smallBold" style={{ color: Colors.primary.white, fontSize: 12 }}>
                  {getInitials(client.name ?? client.username)}
                </ThemedText>
              </View>
            ))}
            {overflowCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  left: MAX_VISIBLE * (MINI_AVATAR - OVERLAP),
                  width: MINI_AVATAR,
                  height: MINI_AVATAR,
                  borderRadius: MINI_AVATAR / 2,
                  backgroundColor: Colors.chip.darkCardAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: Colors.chip.darkCard
                }}
              >
                <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey, fontSize: 11 }}>
                  +{overflowCount}
                </ThemedText>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <ThemedText type="default" style={{ color: Colors.sway.lightGrey }}>
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </ThemedText>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.sway.darkGrey} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default ClientsSummaryCard;
