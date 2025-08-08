import { useState } from 'react';
import { View } from 'react-native';
import { Menu } from 'react-native-paper';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import IconButton from '@/components/ui/IconButton';
import { Colors } from '@/constants/Colors';
import { useAllPatients } from '@/hooks/useUsers';

const AllPatients = () => {
  const { data: patients, isPending, isError } = useAllPatients();
  const [openMenuPatientId, setOpenMenuPatientId] = useState<string | null>(null);

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!patients || !patients.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ScrollContainer>
      {patients?.map((patient) => (
        <View key={patient._id} className="mb-4 border-b border-sway-lightGrey py-2">
          <Menu
            visible={openMenuPatientId === patient._id}
            onDismiss={() => setOpenMenuPatientId(null)}
            contentStyle={{
              backgroundColor: Colors.sway.lightGrey,
              left: '100%'
            }}
            anchor={
              <>
                <ThemedText type="smallTitle">{patient.email}</ThemedText>
                <View className="w-full flex-row items-center justify-between">
                  <ThemedText>{patient.username}</ThemedText>
                  <IconButton name="chevron.down.circle.fill" onPress={() => setOpenMenuPatientId(patient._id)} />
                </View>
              </>
            }
            anchorPosition="top"
          >
            <Menu.Item
              title={`Accept ${patient.username}`}
              // style={{ borderBottomWidth: 1 }}
            />
          </Menu>
        </View>
      ))}
    </ScrollContainer>
  );
};

export default AllPatients;
