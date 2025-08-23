import { useCallback, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModulePicker from '@/components/module/ModulePicker';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import FabGroup from '@/components/ui/fab/FabGroup';
import FabTrigger from '@/components/ui/fab/FabTrigger';
import useGetFabOptions, { FabOptionsVariant } from '@/components/ui/fab/useGetFabOptions';
import { useClients } from '@/hooks/useUsers';
import type { AuthUser } from '@milobedini/shared-types';

const AllClients = () => {
  const { data: clients, isPending, isError } = useClients();

  const [openFab, setOpenFab] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPatient, setPickerPatient] = useState<AuthUser | null>();

  const selectedClient = useMemo(() => clients?.find((p) => p._id === selectedClientId), [clients, selectedClientId]);
  const closeMenu = useCallback(() => {
    setOpenFab(false);
    setSelectedClientId(null);
  }, []);

  const actions = useGetFabOptions({
    variant: FabOptionsVariant.CLIENTS,
    closeMenu,
    selectedEntity: selectedClient,
    openModulePicker: () => {
      setPickerPatient(selectedClient);
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
          <Link asChild href={'/home/patients'}>
            <ThemedButton>View all patients</ThemedButton>
          </Link>
        </ContentContainer>
      </Container>
    );

  return (
    <Container>
      <FlatList
        data={clients}
        keyExtractor={(item) => item._id}
        contentContainerClassName="px-2"
        renderItem={({ item: client }) => (
          <Link
            key={client._id}
            href={{
              pathname: '/home/clients/[id]',
              params: {
                id: client._id,
                headerTitle: client.name || client.username
              }
            }}
            push
            asChild
          >
            <TouchableOpacity className="mb-4 flex-row items-center justify-between rounded-md border-b border-sway-lightGrey pb-4">
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
            </TouchableOpacity>
          </Link>
        )}
      ></FlatList>

      <FabGroup
        visible={selectedClientId !== null}
        open={openFab}
        onOpenChange={setOpenFab}
        onDismiss={closeMenu}
        actions={actions}
      />
      {pickerPatient && (
        <ModulePicker
          visible={pickerOpen}
          onDismiss={() => {
            setPickerOpen(false);
            setSelectedClientId(null);
          }}
          patient={pickerPatient}
        />
      )}
    </Container>
  );
};

export default AllClients;
