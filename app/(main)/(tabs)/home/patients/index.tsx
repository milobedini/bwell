import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ScrollContainer from '@/components/ScrollContainer';
import { ThemedText } from '@/components/ThemedText';
import FabGroup from '@/components/ui/fab/FabGroup';
import FabTrigger from '@/components/ui/fab/FabTrigger';
import getPatientOptions from '@/components/ui/fab/getPatientOptions';
import { useAllPatients } from '@/hooks/useUsers';

const AllPatients = () => {
  const { data: patients, isPending, isError } = useAllPatients();
  const [openFab, setOpenFab] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patients?.find((p) => p._id === selectedPatientId),
    [patients, selectedPatientId]
  );
  const closeMenu = useCallback(() => {
    setOpenFab(false);
    setSelectedPatientId(null);
  }, []);

  const actions = useMemo(() => getPatientOptions(closeMenu, selectedPatient), [selectedPatient, closeMenu]);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!patients || !patients.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <>
      <ScrollContainer>
        {patients.map((patient) => (
          <View
            key={patient._id}
            className="mb-4 flex-row items-center justify-between rounded-md border-b border-sway-lightGrey pb-4"
          >
            <View>
              <ThemedText type="smallTitle">{patient.email}</ThemedText>
              <ThemedText>{patient.username}</ThemedText>
            </View>
            <FabTrigger
              onPress={() => {
                setSelectedPatientId(patient._id);
                setOpenFab(true);
              }}
            />
          </View>
        ))}
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
