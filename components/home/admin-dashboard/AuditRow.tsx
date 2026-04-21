import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import type { AdminAuditEvent, AuditedAction } from '@milobedini/shared-types';

const ACTION_LABEL: Record<AuditedAction, string> = {
  'therapist.verified': 'therapist.verified',
  'therapist.unverified': 'therapist.unverified',
  'user.viewed': 'user.viewed',
  'patient.attemptsViewed': 'patient.attemptsViewed',
  'module.created': 'module.created',
  'admin.loggedIn': 'admin.loggedIn'
};

const HIGH_SALIENCE_ACTIONS: Set<AuditedAction> = new Set([
  'therapist.verified',
  'therapist.unverified',
  'module.created'
]);

const formatTimeAgo = (iso: string, now: Date = new Date()): string => {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60_000));
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
};

const shortenId = (id: string): string => (id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-3)}` : id);

const buildSummary = (event: AdminAuditEvent): string => {
  const actor = event.actor.username;
  const parts: string[] = [actor];

  const contextTier =
    event.context && typeof event.context === 'object' && 'tier' in event.context
      ? String((event.context as Record<string, unknown>).tier)
      : null;

  switch (event.action) {
    case 'therapist.verified':
    case 'therapist.unverified': {
      const who = event.actor.name ?? shortenId(event.resourceId ?? event.actorId);
      parts.push(who);
      if (contextTier) parts.push(`tier=${contextTier}`);
      break;
    }
    case 'user.viewed':
    case 'patient.attemptsViewed': {
      if (event.resourceId) parts.push(`user ${shortenId(event.resourceId)}`);
      break;
    }
    case 'module.created': {
      if (event.resourceType) parts.push(event.resourceType);
      if (event.resourceId) parts.push(shortenId(event.resourceId));
      break;
    }
    case 'admin.loggedIn':
      break;
    default:
      if (event.resourceType) parts.push(event.resourceType);
      break;
  }

  if (event.outcome === 'failure' && event.context && 'reason' in event.context) {
    const reason = (event.context as Record<string, unknown>).reason;
    if (typeof reason === 'string') parts.push(reason);
  }

  return parts.join(' · ');
};

const actionColor = (event: AdminAuditEvent): string => {
  if (event.outcome === 'failure') return Colors.primary.error;
  if (HIGH_SALIENCE_ACTIONS.has(event.action)) return Colors.sway.bright;
  return Colors.sway.darkGrey;
};

const actionLabel = (event: AdminAuditEvent): string => {
  const base = ACTION_LABEL[event.action] ?? event.action;
  return event.outcome === 'failure' ? `${base} · failed` : base;
};

type Props = {
  event: AdminAuditEvent;
  isLast?: boolean;
};

const AuditRow = memo(({ event, isLast }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const hasContext = !!event.context && Object.keys(event.context).length > 0;

  return (
    <Pressable
      onPress={() => hasContext && setExpanded((prev) => !prev)}
      className="px-4 py-3 active:opacity-80"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: Colors.divider.light
      }}
      accessibilityRole={hasContext ? 'button' : undefined}
      accessibilityLabel={`Audit event ${event.action} at ${event.at}`}
    >
      <View className="flex-row items-center justify-between">
        <ThemedText type="smallBold" style={{ color: actionColor(event), fontSize: 12, letterSpacing: 0.2 }}>
          {actionLabel(event)}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 11 }}>
          {formatTimeAgo(event.at)}
        </ThemedText>
      </View>
      <ThemedText type="small" style={{ color: Colors.sway.lightGrey, marginTop: 4, fontSize: 12 }}>
        {buildSummary(event)}
      </ThemedText>
      {expanded && hasContext && (
        <View
          className="mt-2 rounded-lg px-3 py-2"
          style={{ backgroundColor: Colors.chip.darkCardDeep, borderWidth: 1, borderColor: Colors.divider.light }}
        >
          <ThemedText
            type="small"
            style={{ color: Colors.sway.darkGrey, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}
          >
            Context
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: Colors.sway.lightGrey, fontSize: 11, marginTop: 4, fontFamily: 'Lato-Regular' }}
          >
            {JSON.stringify(event.context, null, 2)}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
});

AuditRow.displayName = 'AuditRow';

export default AuditRow;
