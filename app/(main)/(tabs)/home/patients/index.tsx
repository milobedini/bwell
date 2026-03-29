import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { renderErrorToast } from '@/components/toast/toastOptions';
import type { ActionMenuItem } from '@/components/ui/ActionMenu';
import ActionMenu from '@/components/ui/ActionMenu';
import { Colors } from '@/constants/Colors';
import { useAddRemoveTherapist, useAllPatients } from '@/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { pickClientAndCompose } from '@/utils/mail';
import type { AuthUser } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

const PatientRow = ({
  patient,
  isClient,
  onMenuPress
}: {
  patient: AuthUser;
  isClient: boolean;
  onMenuPress: (id: string) => void;
}) => {
  const handlePress = useCallback(() => onMenuPress(patient._id), [onMenuPress, patient._id]);

  return (
    <View
      className="mb-1 flex-row items-center justify-between rounded-xl px-4 py-4"
      style={{ backgroundColor: Colors.chip.darkCard }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: isClient ? Colors.tint.info : Colors.tint.teal }}
        >
          <Icon
            name={isClient ? 'star' : 'account'}
            size={20}
            color={isClient ? Colors.primary.info : Colors.sway.bright}
          />
        </View>
        <View>
          <ThemedText type="default">{patient.name || patient.username}</ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            {patient.email}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity
        onPress={handlePress}
        className="h-9 w-9 items-center justify-center rounded-lg active:opacity-70"
        style={{ backgroundColor: Colors.chip.darkCardAlt }}
        hitSlop={8}
      >
        <Icon name="dots-vertical" size={18} color={Colors.sway.darkGrey} />
      </TouchableOpacity>
    </View>
  );
};

const MemoPatientRow = React.memo(PatientRow);

const AllPatients = () => {
  const user = useAuthStore((s) => s.user);
  const { data: patients, isPending, isError } = useAllPatients();
  const addRemoveTherapist = useAddRemoveTherapist();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patients?.find((p) => p._id === selectedPatientId),
    [patients, selectedPatientId]
  );
  const isClient = selectedPatient?.therapist === user?._id;

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectedPatientId(null);
  }, []);

  const handleMenuPress = useCallback((id: string) => {
    setSelectedPatientId(id);
    setMenuOpen(true);
  }, []);

  const handleAddRemoveClient = useCallback(() => {
    if (selectedPatient?._id && user?._id) {
      addRemoveTherapist.mutate(
        { patientId: selectedPatient._id, therapistId: user._id },
        { onSuccess: closeMenu, onError: closeMenu }
      );
    }
  }, [addRemoveTherapist, closeMenu, selectedPatient?._id, user?._id]);

  const handleEmailPatient = useCallback(async () => {
    if (!selectedPatient?.email) return;
    try {
      await pickClientAndCompose({
        recipients: [selectedPatient.email],
        subject: '',
        body: ''
      });
    } catch (error) {
      renderErrorToast(error);
    }
    closeMenu();
  }, [closeMenu, selectedPatient?.email]);

  const actions: ActionMenuItem[] = useMemo(
    () => [
      {
        icon: isClient ? 'star-off' : 'star',
        label: isClient ? 'Remove as client' : 'Add as client',
        onPress: handleAddRemoveClient,
        variant: isClient ? ('destructive' as const) : ('default' as const),
        ...(isClient && {
          confirmTitle: 'Remove client?',
          confirmDescription: 'This will remove the therapist-client relationship. The patient record will remain.',
          confirmLabel: 'Remove'
        })
      },
      {
        icon: 'email-outline',
        label: 'Email patient',
        onPress: handleEmailPatient
      }
    ],
    [handleAddRemoveClient, handleEmailPatient, isClient]
  );

  const renderItem = useCallback(
    ({ item }: { item: AuthUser }) => {
      const patientIsClient = item.therapist === user?._id;
      return <MemoPatientRow patient={item} isClient={patientIsClient} onMenuPress={handleMenuPress} />;
    },
    [handleMenuPress, user?._id]
  );

  const keyExtractor = useCallback((item: AuthUser) => item._id, []);

  if (isPending) return <LoadingIndicator marginBottom={0} />;
  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  if (!patients || !patients.length) return <ErrorComponent errorType={ErrorTypes.NO_CONTENT} />;

  return (
    <ContentContainer>
      <FlatList
        data={patients}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerClassName="gap-2 px-1 pt-2"
      />

      <ActionMenu
        visible={menuOpen}
        onDismiss={closeMenu}
        title={selectedPatient?.name || selectedPatient?.username}
        subtitle={selectedPatient?.email}
        actions={actions}
      />
    </ContentContainer>
  );
};

export default AllPatients;
