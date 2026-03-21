import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ModulePicker from '@/components/module/ModulePicker';
import { ThemedText } from '@/components/ThemedText';
import { renderErrorToast } from '@/components/toast/toastOptions';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import EmptyState from '@/components/ui/EmptyState';
import { Colors } from '@/constants/Colors';
import { useAddRemoveTherapist, useClients } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { pickClientAndCompose } from '@/utils/mail';
import type { AuthUser } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

const ClientRow = ({ client, onMenuPress }: { client: AuthUser; onMenuPress: (id: string) => void }) => (
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
    <TouchableOpacity
      className="mb-1 flex-row items-center justify-between rounded-xl px-4 py-4 active:opacity-80"
      style={{ backgroundColor: Colors.chip.darkCard }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.tint.teal }}
        >
          <Icon name="account" size={20} color={Colors.sway.bright} />
        </View>
        <View>
          <ThemedText type="default">{client.name || client.username}</ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {client.email}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onMenuPress(client._id);
        }}
        className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
        style={{ backgroundColor: Colors.chip.darkCardAlt }}
        hitSlop={8}
      >
        <Icon name="dots-vertical" size={18} color={Colors.sway.darkGrey} />
      </TouchableOpacity>
    </TouchableOpacity>
  </Link>
);

const MemoClientRow = React.memo(ClientRow);

const AllClients = () => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: clients, isPending, isError } = useClients();
  const addRemoveTherapist = useAddRemoveTherapist();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPatient, setPickerPatient] = useState<AuthUser | null>();

  const selectedClient = useMemo(() => clients?.find((p) => p._id === selectedClientId), [clients, selectedClientId]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectedClientId(null);
  }, []);

  const handleMenuPress = useCallback((id: string) => {
    setSelectedClientId(id);
    setMenuOpen(true);
  }, []);

  const handleRemoveClient = useCallback(() => {
    if (selectedClient?._id && user?._id) {
      addRemoveTherapist.mutate(
        { patientId: selectedClient._id, therapistId: user._id },
        { onSuccess: closeMenu, onError: closeMenu }
      );
    }
  }, [addRemoveTherapist, closeMenu, selectedClient?._id, user?._id]);

  const handleCreateAssignment = useCallback(() => {
    if (selectedClient) {
      setPickerPatient(selectedClient);
      setMenuOpen(false);
      setPickerOpen(true);
    }
  }, [selectedClient]);

  const handleEmailClient = useCallback(async () => {
    if (!selectedClient?.email) return;
    try {
      await pickClientAndCompose({
        recipients: [selectedClient.email],
        subject: '',
        body: ''
      });
    } catch (error) {
      renderErrorToast(error);
    }
    closeMenu();
  }, [closeMenu, selectedClient?.email]);

  const actions: ActionMenuItem[] = useMemo(
    () => [
      {
        icon: 'clipboard-plus-outline',
        label: 'Create assignment',
        onPress: handleCreateAssignment
      },
      {
        icon: 'email-outline',
        label: 'Email client',
        onPress: handleEmailClient
      },
      {
        icon: 'account-off-outline',
        label: 'Remove as client',
        onPress: handleRemoveClient,
        variant: 'destructive' as const
      }
    ],
    [handleCreateAssignment, handleEmailClient, handleRemoveClient]
  );

  const renderItem = useCallback(
    ({ item }: { item: AuthUser }) => <MemoClientRow client={item} onMenuPress={handleMenuPress} />,
    [handleMenuPress]
  );

  const keyExtractor = useCallback((item: AuthUser) => item._id, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!clients) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;
  if (!clients.length)
    return (
      <ContentContainer>
        <EmptyState
          icon="account-group-outline"
          title="No clients yet"
          action={{ label: 'View all patients', onPress: () => router.push('/home/patients') }}
        />
      </ContentContainer>
    );

  return (
    <ContentContainer>
      <FlatList
        data={clients}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerClassName="gap-2 px-1 pt-2"
      />

      <ActionMenu
        visible={menuOpen}
        onDismiss={closeMenu}
        title={selectedClient?.name || selectedClient?.username}
        subtitle={selectedClient?.email}
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
    </ContentContainer>
  );
};

export default AllClients;
