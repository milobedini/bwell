import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import FabGroup from '@/components/ui/fab/FabGroup';
import FabTrigger from '@/components/ui/fab/FabTrigger';
import useGetFabOptions, { FabOptionsVariant } from '@/components/ui/fab/useGetFabOptions';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAllPatients } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';

const AllPatients = () => {
  const user = useAuthStore((s) => s.user);

  const { data: patients, isPending, isError } = useAllPatients();

  const [openFab, setOpenFab] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patients?.find((p) => p._id === selectedPatientId),
    [patients, selectedPatientId]
  );
  const isClient = selectedPatient?.therapist === user?._id;

  const closeMenu = useCallback(() => {
    setOpenFab(false);
    setSelectedPatientId(null);
  }, []);

  const actions = useGetFabOptions({
    variant: FabOptionsVariant.PATIENTS,
    closeMenu,
    selectedEntity: selectedPatient,
    isClient
  });

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!patients || !patients.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <>
      <ScrollContainer>
        {patients.map((patient) => {
          const isClient = patient?.therapist === user?._id;

          return (
            <View
              key={patient._id}
              className="mb-4 flex-row items-center justify-between rounded-md border-b border-sway-lightGrey pb-4"
            >
              <View className="mr-2 flex-1">
                <ThemedText type="smallTitle">{patient.email}</ThemedText>
                <View className="flex-row gap-2">
                  <ThemedText>{patient.username}</ThemedText>
                  {isClient && <IconSymbol name="star.fill" color={Colors.primary.info} />}
                </View>
              </View>
              <FabTrigger
                onPress={() => {
                  setSelectedPatientId(patient._id);
                  setOpenFab(true);
                }}
                icon="dots-horizontal"
              />
            </View>
          );
        })}
      </ScrollContainer>
      <FabGroup
        visible={selectedPatientId !== null}
        open={openFab}
        onOpenChange={setOpenFab}
        onDismiss={closeMenu}
        actions={actions}
      />
    </>
  );
};

export default AllPatients;
