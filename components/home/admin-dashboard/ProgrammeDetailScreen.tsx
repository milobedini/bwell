import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAdminProgrammeDetail } from '@/hooks/useAdminProgrammeDetail';
import { getModuleIcon } from '@/utils/moduleIcons';
import type { AdminProgrammeDetailResponse, CareTier, Instrument, ModuleType } from '@milobedini/shared-types';
import Icon from '@react-native-vector-icons/material-design-icons';

import CareTierBreakdown from './CareTierBreakdown';
import FreshnessRow from './FreshnessRow';
import OutcomeTriplet from './OutcomeTriplet';

type Instruments = AdminProgrammeDetailResponse['outcomesByInstrument'][number];

const INSTRUMENT_LABEL: Record<Instrument, string> = {
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
  pdss: 'PDSS'
};

const INSTRUMENT_CUTOFF_COPY: Record<Instrument, string> = {
  phq9: 'PHQ-9 ≥ 10',
  gad7: 'GAD-7 ≥ 8',
  pdss: 'PDSS ≥ 8'
};

const INSTRUMENT_DELTA_COPY: Record<Instrument, string | undefined> = {
  phq9: 'Δ ≥ 6 PHQ-9 points',
  gad7: 'Δ ≥ 4 GAD-7 points',
  pdss: undefined
};

const TIER_LABEL: Record<CareTier, string> = {
  self_help: 'Self-help',
  cbt_guided: 'CBT',
  pwp_guided: 'PWP'
};

const MODULE_TYPE_LABEL: Record<ModuleType, string> = {
  questionnaire: 'Questionnaire',
  reading: 'Reading',
  activity_diary: 'Activity diary',
  five_areas_model: 'Five areas',
  general_goals: 'General goals',
  weekly_goals: 'Weekly goals'
};

const anySuppressed = (instrument: Instruments): boolean => {
  const rows = instrument.byCareTier;
  return rows.some((r) => r.recovery.suppressed || r.reliableImprovement.suppressed || r.reliableRecovery.suppressed);
};

type SectionEyebrowProps = { children: string };
const SectionEyebrow = ({ children }: SectionEyebrowProps) => (
  <ThemedText
    type="small"
    style={{
      color: Colors.sway.darkGrey,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 8
    }}
  >
    {children}
  </ThemedText>
);

type StatCardProps = { label: string; value: string | number };
const StatCard = ({ label, value }: StatCardProps) => (
  <View
    className="flex-1 rounded-xl border p-3"
    style={{ backgroundColor: Colors.chip.darkCard, borderColor: Colors.divider.medium }}
  >
    <ThemedText
      type="small"
      style={{
        color: Colors.sway.darkGrey,
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase'
      }}
    >
      {label}
    </ThemedText>
    <ThemedText type="subtitle" style={{ color: Colors.sway.lightGrey, marginTop: 4 }}>
      {value}
    </ThemedText>
  </View>
);

type InstrumentBlockProps = { instrument: Instruments };
const InstrumentBlock = ({ instrument }: InstrumentBlockProps) => {
  const label = INSTRUMENT_LABEL[instrument.instrument] ?? instrument.instrument.toUpperCase();
  const cutoffLabel = INSTRUMENT_CUTOFF_COPY[instrument.instrument] ?? `${label} cutoff`;
  const deltaLabel = INSTRUMENT_DELTA_COPY[instrument.instrument];
  const suppressedCellExists = anySuppressed(instrument);

  const metaParts: string[] = [
    label,
    `cutoff ${instrument.cutoff}`,
    instrument.reliableChangeDelta != null ? `Δ ≥ ${instrument.reliableChangeDelta}` : 'no Δ',
    'last 90 days'
  ];

  return (
    <View className="mt-5">
      <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey }}>
        {label} outcomes
      </ThemedText>
      <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2, fontSize: 12 }}>
        {metaParts.join(' · ')}
      </ThemedText>

      <View className="mt-4">
        <OutcomeTriplet
          recovery={instrument.overall.recovery}
          reliableImprovement={instrument.overall.reliableImprovement}
          reliableRecovery={instrument.overall.reliableRecovery}
          cutoffLabel={cutoffLabel}
          reliableChangeDeltaLabel={deltaLabel}
        />
      </View>

      <View className="mt-4">
        <ThemedText
          type="small"
          style={{
            color: Colors.sway.darkGrey,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: 'uppercase'
          }}
        >
          By care tier
        </ThemedText>
        <CareTierBreakdown rows={instrument.byCareTier} />
        {suppressedCellExists && (
          <View
            className="mt-2 rounded-lg border px-3 py-2"
            style={{ backgroundColor: Colors.chip.darkCardDeep, borderColor: Colors.divider.light }}
          >
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11, lineHeight: 16 }}>
              Cells with fewer than 5 patients are suppressed to protect patient privacy (k-anonymity). Enrolment is
              visible below.
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};

type WorkSectionProps = { work: AdminProgrammeDetailResponse['work'] };
const WorkSection = ({ work }: WorkSectionProps) => {
  const totalByType = work.byType.reduce((sum, row) => sum + row.count, 0);
  return (
    <View className="mt-6">
      <SectionEyebrow>Work · last 7 days</SectionEyebrow>
      <View className="flex-row gap-2">
        <StatCard label="Completed" value={work.completedAttemptsLast7d} />
        <StatCard label="Stalled 7d+" value={work.stalledAttempts7d} />
      </View>
      {work.byType.length > 0 && totalByType > 0 && (
        <View
          className="mt-3 overflow-hidden rounded-xl border"
          style={{ backgroundColor: Colors.chip.darkCard, borderColor: Colors.divider.medium }}
        >
          {work.byType.map((row, index) => {
            const isLast = index === work.byType.length - 1;
            return (
              <View
                key={row.moduleType}
                className="flex-row items-center px-4 py-3"
                style={{
                  borderBottomWidth: isLast ? 0 : 1,
                  borderColor: Colors.divider.light
                }}
              >
                <Icon
                  name={getModuleIcon(row.moduleType)}
                  size={18}
                  color={Colors.sway.darkGrey}
                  style={{ marginRight: 10 }}
                />
                <ThemedText type="smallBold" style={{ color: Colors.sway.lightGrey, flex: 1 }}>
                  {MODULE_TYPE_LABEL[row.moduleType] ?? row.moduleType}
                </ThemedText>
                <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey, lineHeight: 22 }}>
                  {row.count}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

type EnrolmentSectionProps = { enrolment: AdminProgrammeDetailResponse['enrolment'] };
const EnrolmentSection = ({ enrolment }: EnrolmentSectionProps) => {
  return (
    <View className="mt-6">
      <SectionEyebrow>Enrolment</SectionEyebrow>
      <View className="flex-row gap-2">
        <StatCard label="Total" value={enrolment.total} />
        {enrolment.byCareTier.map((row) => (
          <StatCard key={row.careTier} label={TIER_LABEL[row.careTier]} value={row.count} />
        ))}
      </View>
    </View>
  );
};

type Props = {
  programmeId: string;
};

const ProgrammeDetailScreen = ({ programmeId }: Props) => {
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch, isRefetching } = useAdminProgrammeDetail(programmeId);

  if (isPending) {
    return (
      <View className="flex-1 bg-sway-dark" style={{ paddingTop: insets.top }}>
        <LoadingIndicator marginBottom={0} />
      </View>
    );
  }

  if (isError || !data) {
    return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;
  }

  return (
    <View className="flex-1 bg-sway-dark" testID="admin-programme-detail">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.sway.bright} />}
      >
        <ContentContainer>
          <View className="py-2">
            <ThemedText
              type="small"
              style={{
                color: Colors.sway.darkGrey,
                fontSize: 11,
                letterSpacing: 0.8,
                textTransform: 'uppercase'
              }}
            >
              Programme detail
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: Colors.sway.lightGrey, marginTop: 4 }}>
              {data.programme.title}
            </ThemedText>
            {!!data.programme.description && (
              <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 6, lineHeight: 20 }}>
                {data.programme.description}
              </ThemedText>
            )}
            <View className="mt-3">
              <FreshnessRow asOf={data.asOf} rollupAsOf={data.rollupAsOf} privacyMode={data.privacyMode} />
            </View>
          </View>

          <EnrolmentSection enrolment={data.enrolment} />

          {data.outcomesByInstrument.length > 0 ? (
            data.outcomesByInstrument.map((instrument) => (
              <InstrumentBlock key={instrument.instrument} instrument={instrument} />
            ))
          ) : (
            <View className="mt-6">
              <SectionEyebrow>Clinical outcomes</SectionEyebrow>
              <View
                className="rounded-xl border px-4 py-4"
                style={{ backgroundColor: Colors.chip.darkCardDeep, borderColor: Colors.divider.light }}
              >
                <ThemedText type="small" style={{ color: Colors.sway.darkGrey, lineHeight: 20 }}>
                  No clinical instrument attached to this programme. Outcome rates are only computed for programmes with
                  an IAPT-aligned questionnaire.
                </ThemedText>
              </View>
            </View>
          )}

          <WorkSection work={data.work} />

          <View className="h-8" />
        </ContentContainer>
      </ScrollView>
    </View>
  );
};

export default ProgrammeDetailScreen;
