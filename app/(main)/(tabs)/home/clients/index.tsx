import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModulePicker from '@/components/module/ModulePicker';
import ScrollContainer from '@/components/ScrollContainer';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import FabGroup from '@/components/ui/fab/FabGroup';
import FabTrigger from '@/components/ui/fab/FabTrigger';
import useGetFabOptions, { FabOptionsVariant } from '@/components/ui/fab/useGetFabOptions';
import { useClients } from '@/hooks/useUsers';

const AllClients = () => {
  const { data: clients, isPending, isError } = useClients();
  const router = useRouter();

  const [openFab, setOpenFab] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPatientId, setPickerPatientId] = useState<string>('');

  const selectedClient = useMemo(() => clients?.find((p) => p._id === selectedClientId), [clients, selectedClientId]);
  const closeMenu = useCallback(() => {
    setOpenFab(false);
    setSelectedClientId(null);
  }, []);

  const actions = useGetFabOptions({
    variant: FabOptionsVariant.CLIENTS,
    closeMenu,
    selectedEntity: selectedClient,
    openModulePicker: (id) => {
      setPickerPatientId(id);
      setPickerOpen(true);
    }
  });

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!clients) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;
  if (!clients.length)
    return (
      <Container>
        <ContentContainer className="mt-4 gap-4">
          <ThemedText type="subtitle">You have no clients (yet!)</ThemedText>
          <ThemedButton onPress={() => router.replace('/home/patients')}>View all patients</ThemedButton>
        </ContentContainer>
      </Container>
    );

  return (
    <>
      <ScrollContainer>
        {clients.map((client) => (
          <View
            key={client._id}
            className="mb-4 flex-row items-center justify-between rounded-md border-b border-sway-lightGrey pb-4"
          >
            <View>
              <ThemedText type="smallTitle">{client.email}</ThemedText>
              <ThemedText>{client.username}</ThemedText>
            </View>
            <FabTrigger
              onPress={() => {
                setSelectedClientId(client._id);
                setOpenFab(true);
              }}
              icon="dots-horizontal"
            />
          </View>
        ))}
      </ScrollContainer>
      <FabGroup
        visible={selectedClientId !== null}
        open={openFab}
        onOpenChange={setOpenFab}
        onDismiss={closeMenu}
        actions={actions}
      />
      <ModulePicker
        visible={pickerOpen}
        onDismiss={() => {
          setPickerOpen(false);
          setSelectedClientId(null);
        }}
        patientId={pickerPatientId}
      />
    </>
  );
};

export default AllClients;
