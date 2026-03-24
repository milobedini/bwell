# Therapist Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-button therapist home screen with a triage-based dashboard showing client status grouped by urgency, with a stat strip for instant orientation.

**Architecture:** New BE endpoint `GET /user/therapist/dashboard` aggregates client data into three triage buckets (needs attention, completed this week, no activity) with pre-computed stats. FE renders via a `useTherapistDashboard` hook feeding into `TherapistDashboard` → `StatStrip` + `TriageBucket` → `ClientCard` component hierarchy. Profile screen is updated to house the relocated client/patient navigation buttons.

**Tech Stack:** Expo/React Native, NativeWind, TanStack Query, Zustand, Axios, Node/Express, MongoDB, `@milobedini/shared-types`

**Spec:** `docs/superpowers/specs/2026-03-24-therapist-home-dashboard-design.md`

---

## File Structure

### Backend (`../cbt/`)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/controllers/therapistDashboard.controller.ts` | Aggregation logic for dashboard endpoint |
| Create | `src/routes/therapistDashboard.routes.ts` | Route definition for `GET /user/therapist/dashboard` |
| Modify | `src/routes/index.ts` | Register new dashboard route |
| Create | `src/tests/therapistDashboard.test.ts` | Integration tests for dashboard endpoint |

### Shared Types (`../cbt/shared-types/`)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/types.ts` | Add `TherapistDashboardResponse` and related types |

### Frontend (`./`)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `hooks/useTherapistDashboard.ts` | `useQuery` hook for dashboard endpoint |
| Create | `components/home/dashboard/StatStrip.tsx` | Four tappable stat pills |
| Create | `components/home/dashboard/ClientCard.tsx` | Individual client card with score, delta, dots, progress |
| Create | `components/home/dashboard/TriageBucket.tsx` | Section header + list of ClientCards |
| Create | `components/home/TherapistDashboard.tsx` | Main dashboard assembling StatStrip + TriageBuckets |
| Modify | `components/home/VerifiedTherapistHome.tsx` | Replace two-button layout with `<TherapistDashboard />` |
| Modify | `app/(main)/(tabs)/profile/index.tsx` | Remove placeholder + patient history, add client nav buttons |

---

## Task 1: Define Shared Types

**Files:**
- Modify: `../cbt/shared-types/src/types.ts`

- [ ] **Step 1: Add dashboard response types to shared-types**

Add these types at the end of `../cbt/shared-types/src/types.ts`:

```typescript
export type DashboardScorePreview = {
  moduleTitle: string;
  moduleId: string;
  score: number;
  band: string;
  scoreBandLabel: string;
  submittedAt: string;
};

export type DashboardAssignmentSummary = {
  total: number;
  completed: number;
  overdue: number;
};

export type DashboardClientItem = {
  patient: Pick<User, '_id' | 'username' | 'email' | 'name'>;
  latestScore: DashboardScorePreview | null;
  previousScore: { score: number } | null;
  assignments: DashboardAssignmentSummary;
  lastActive: string | null;
  reasons: Array<'severe_score' | 'worsening' | 'overdue'>;
};

export type DashboardStats = {
  totalClients: number;
  needsAttention: number;
  submittedThisWeek: number;
  overdueAssignments: number;
};

export type TherapistDashboardResponse = {
  weekStart: string;
  stats: DashboardStats;
  needsAttention: DashboardClientItem[];
  completedThisWeek: DashboardClientItem[];
  noActivity: DashboardClientItem[];
};
```

- [ ] **Step 2: Verify types compile**

Run: `cd ../cbt/shared-types && npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Publish shared-types**

Run: `cd ../cbt/shared-types && npm version patch && npm publish`
Expected: New version published to npm.

- [ ] **Step 4: Update FE shared-types**

Run: `cd /Users/milobedini/Documents/git/bwell && npm run update-types`
Expected: `@milobedini/shared-types` updated to latest version in `package.json`.

- [ ] **Step 5: Commit**

```bash
cd ../cbt/shared-types && git add . && git commit -m "feat: add TherapistDashboardResponse types"
```

---

## Task 2: Build Backend Dashboard Endpoint

**Files:**
- Create: `../cbt/src/controllers/therapistDashboard.controller.ts`
- Create: `../cbt/src/routes/therapistDashboard.routes.ts`
- Modify: `../cbt/src/routes/index.ts`

- [ ] **Step 1: Create the dashboard controller**

Create `../cbt/src/controllers/therapistDashboard.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import ModuleAttempt from '../models/ModuleAttempt';
import ModuleAssignment from '../models/ModuleAssignment';
import Module from '../models/Module';
import {
  DashboardClientItem,
  DashboardStats,
  TherapistDashboardResponse
} from '@milobedini/shared-types';

// Monday-Sunday week boundaries
const getWeekBounds = (): { weekStart: Date; weekEnd: Date } => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { weekStart, weekEnd };
};

// Thresholds for "severe/moderately severe" per questionnaire
const SEVERE_THRESHOLDS: Record<string, number> = {
  'PHQ-9': 15,
  'GAD-7': 10,
  'PDSS': 9
};

const isSevereScore = (moduleTitle: string, score: number): boolean => {
  const threshold = SEVERE_THRESHOLDS[moduleTitle];
  return threshold !== undefined && score >= threshold;
};

export const getTherapistDashboard = async (req: Request, res: Response) => {
  try {
    const therapistId = req.user!._id;
    const { weekStart, weekEnd } = getWeekBounds();

    // 1. Get therapist's clients
    const clients = await User.find({ assignedTherapist: therapistId })
      .select('_id username email name createdAt')
      .lean();

    if (clients.length === 0) {
      const emptyResponse: TherapistDashboardResponse = {
        weekStart: weekStart.toISOString(),
        stats: { totalClients: 0, needsAttention: 0, submittedThisWeek: 0, overdueAssignments: 0 },
        needsAttention: [],
        completedThisWeek: [],
        noActivity: []
      };
      return res.json(emptyResponse);
    }

    const clientIds = clients.map((c) => c._id);

    // 2. Get all submitted attempts this week for these clients
    const weekAttempts = await ModuleAttempt.find({
      user: { $in: clientIds },
      status: 'submitted',
      completedAt: { $gte: weekStart, $lt: weekEnd }
    })
      .populate('module', 'title type')
      .sort({ completedAt: -1 })
      .lean();

    // 3. Get latest scored attempt per client (any time, for current score)
    const latestScoredAttempts = await ModuleAttempt.aggregate([
      {
        $match: {
          user: { $in: clientIds },
          status: 'submitted',
          moduleType: 'questionnaire',
          totalScore: { $ne: null }
        }
      },
      { $sort: { completedAt: -1 } },
      {
        $group: {
          _id: { user: '$user', module: '$module' },
          latestAttempt: { $first: '$$ROOT' }
        }
      }
    ]);

    // 4. Get second-latest scored attempt per client+module (for delta)
    const previousScoredAttempts = await ModuleAttempt.aggregate([
      {
        $match: {
          user: { $in: clientIds },
          status: 'submitted',
          moduleType: 'questionnaire',
          totalScore: { $ne: null }
        }
      },
      { $sort: { completedAt: -1 } },
      {
        $group: {
          _id: { user: '$user', module: '$module' },
          attempts: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          previousAttempt: { $arrayElemAt: ['$attempts', 1] }
        }
      },
      { $match: { previousAttempt: { $ne: null } } }
    ]);

    // 5. Get active assignments for these clients
    const assignments = await ModuleAssignment.find({
      patient: { $in: clientIds },
      status: { $in: ['assigned', 'in_progress'] }
    })
      .populate('module', 'title')
      .lean();

    // Build lookup maps
    const moduleCache = new Map<string, string>();
    for (const a of latestScoredAttempts) {
      const mod = await Module.findById(a._id.module).select('title').lean();
      if (mod) moduleCache.set(a._id.module.toString(), mod.title);
    }

    // 6. Build per-client dashboard items
    const needsAttention: DashboardClientItem[] = [];
    const completedThisWeek: DashboardClientItem[] = [];
    const noActivity: DashboardClientItem[] = [];
    let totalOverdue = 0;

    for (const client of clients) {
      const cid = client._id.toString();

      // Client's week attempts
      const clientWeekAttempts = weekAttempts.filter(
        (a) => a.user.toString() === cid
      );

      // Latest scored attempt (most recent questionnaire across all modules)
      const clientLatestScored = latestScoredAttempts
        .filter((a) => a._id.user.toString() === cid)
        .sort((a, b) =>
          new Date(b.latestAttempt.completedAt).getTime() -
          new Date(a.latestAttempt.completedAt).getTime()
        )[0];

      // Previous score for same module (for delta)
      const clientPreviousScored = clientLatestScored
        ? previousScoredAttempts.find(
            (a) =>
              a._id.user.toString() === cid &&
              a._id.module.toString() === clientLatestScored._id.module.toString()
          )
        : null;

      // Assignments
      const clientAssignments = assignments.filter(
        (a) => a.patient.toString() === cid
      );
      const now = new Date();
      const overdueAssignments = clientAssignments.filter(
        (a) => a.dueAt && new Date(a.dueAt) < now
      );
      const completedAssignmentIds = new Set(
        clientWeekAttempts
          .filter((a) => a.assignment)
          .map((a) => a.assignment!.toString())
      );
      const completedCount = clientAssignments.filter((a) =>
        completedAssignmentIds.has(a._id.toString())
      ).length;

      totalOverdue += overdueAssignments.length;

      // Build latest score preview
      const latestScore = clientLatestScored
        ? {
            moduleTitle: moduleCache.get(clientLatestScored._id.module.toString()) || '',
            moduleId: clientLatestScored._id.module.toString(),
            score: clientLatestScored.latestAttempt.totalScore,
            band: clientLatestScored.latestAttempt.band?.label || '',
            scoreBandLabel: clientLatestScored.latestAttempt.scoreBandLabel || '',
            submittedAt: clientLatestScored.latestAttempt.completedAt.toISOString()
          }
        : null;

      const previousScore = clientPreviousScored?.previousAttempt
        ? { score: clientPreviousScored.previousAttempt.totalScore }
        : null;

      // Last active = most recent submission or account creation
      const lastSubmission = await ModuleAttempt.findOne({
        user: client._id,
        status: 'submitted'
      })
        .sort({ completedAt: -1 })
        .select('completedAt')
        .lean();

      const lastActive = lastSubmission?.completedAt?.toISOString() ||
        (client as any).createdAt?.toISOString() || null;

      // Determine reasons for attention
      const reasons: Array<'severe_score' | 'worsening' | 'overdue'> = [];
      if (latestScore && isSevereScore(latestScore.moduleTitle, latestScore.score)) {
        reasons.push('severe_score');
      }
      if (latestScore && previousScore && latestScore.score > previousScore.score) {
        reasons.push('worsening');
      }
      if (overdueAssignments.length > 0) {
        reasons.push('overdue');
      }

      const item: DashboardClientItem = {
        patient: {
          _id: client._id.toString(),
          username: client.username,
          email: client.email,
          name: client.name
        },
        latestScore,
        previousScore,
        assignments: {
          total: clientAssignments.length,
          completed: completedCount,
          overdue: overdueAssignments.length
        },
        lastActive,
        reasons
      };

      // Bucket assignment (highest priority wins)
      if (reasons.length > 0) {
        needsAttention.push(item);
      } else if (clientWeekAttempts.length > 0) {
        completedThisWeek.push(item);
      } else {
        noActivity.push(item);
      }
    }

    // Sort buckets
    // Needs attention: severe first, then by overdue count desc, then last active desc
    needsAttention.sort((a, b) => {
      const aSevere = a.reasons.includes('severe_score') ? 1 : 0;
      const bSevere = b.reasons.includes('severe_score') ? 1 : 0;
      if (bSevere !== aSevere) return bSevere - aSevere;
      if (b.assignments.overdue !== a.assignments.overdue)
        return b.assignments.overdue - a.assignments.overdue;
      return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
    });

    // Completed: most recent submission first
    completedThisWeek.sort((a, b) =>
      new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime()
    );

    // No activity: longest gap first
    noActivity.sort((a, b) =>
      new Date(a.lastActive || 0).getTime() - new Date(b.lastActive || 0).getTime()
    );

    const stats: DashboardStats = {
      totalClients: clients.length,
      needsAttention: needsAttention.length,
      submittedThisWeek: completedThisWeek.length + needsAttention.filter(
        (c) => weekAttempts.some((a) => a.user.toString() === c.patient._id.toString())
      ).length,
      overdueAssignments: totalOverdue
    };

    const response: TherapistDashboardResponse = {
      weekStart: weekStart.toISOString(),
      stats,
      needsAttention,
      completedThisWeek,
      noActivity
    };

    res.json(response);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
};
```

- [ ] **Step 2: Create the route file**

Create `../cbt/src/routes/therapistDashboard.routes.ts`:

```typescript
import { Router } from 'express';
import { getTherapistDashboard } from '../controllers/therapistDashboard.controller';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

router.get('/user/therapist/dashboard', requireAuth, requireRole('therapist'), getTherapistDashboard);

export default router;
```

Note: Check `../cbt/src/middleware/` for the exact middleware names — they may be `authenticate` / `authorise` instead. Follow the pattern used in existing route files like `therapistAttempts.routes.ts`.

- [ ] **Step 3: Register the route**

In `../cbt/src/routes/index.ts`, import and register the new route following the existing pattern:

```typescript
import therapistDashboardRoutes from './therapistDashboard.routes';
// ... add to router.use() or app.use() following existing pattern
```

- [ ] **Step 4: Test the endpoint manually**

Start the BE server and test with curl or the app's API client:

```bash
curl -b cookies.txt http://localhost:3000/api/user/therapist/dashboard | jq
```

Expected: JSON response matching `TherapistDashboardResponse` shape with correct bucket grouping.

- [ ] **Step 5: Commit**

```bash
cd ../cbt && git add . && git commit -m "feat: add therapist dashboard endpoint"
```

---

## Task 3: Build ClientCard Component

**Files:**
- Create: `components/home/dashboard/ClientCard.tsx`

- [ ] **Step 1: Create the dashboard directory**

```bash
mkdir -p components/home/dashboard
```

- [ ] **Step 2: Create ClientCard component**

Create `components/home/dashboard/ClientCard.tsx`:

```typescript
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DashboardClientItem } from '@milobedini/shared-types';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { formatRelativeTime } from '@/utils/date';

const getLeftBorderColor = (item: DashboardClientItem): string => {
  if (item.reasons.includes('severe_score')) return Colors.primary.error;
  if (item.reasons.includes('worsening') || item.reasons.includes('overdue'))
    return Colors.primary.warning;
  if (item.assignments.completed > 0 && item.reasons.length === 0)
    return Colors.sway.bright;
  return Colors.chip.dotInactive;
};

const getScoreBadgeStyle = (band: string) => {
  const lower = band.toLowerCase();
  if (lower.includes('severe'))
    return { bg: Colors.tint.error, text: Colors.primary.error };
  if (lower.includes('moderate'))
    return { bg: Colors.tint.info, text: Colors.primary.warning };
  if (lower.includes('mild'))
    return { bg: Colors.tint.teal, text: Colors.sway.bright };
  return { bg: 'rgba(166,173,187,0.1)', text: Colors.sway.darkGrey };
};

type ScoreDeltaProps = {
  current: number;
  previous: number | null;
};

const ScoreDelta = ({ current, previous }: ScoreDeltaProps) => {
  if (previous === null) return null;
  const diff = current - previous;
  if (diff === 0) {
    return (
      <ThemedText type="smallBold" style={{ color: Colors.sway.darkGrey }}>
        — 0
      </ThemedText>
    );
  }
  const isUp = diff > 0;
  return (
    <ThemedText
      type="smallBold"
      style={{ color: isUp ? Colors.primary.error : Colors.primary.success }}
    >
      {isUp ? '▲' : '▼'} {Math.abs(diff)}
    </ThemedText>
  );
};

type AssignmentDotsProps = {
  total: number;
  completed: number;
  overdue: number;
};

const AssignmentDots = ({ total, completed, overdue }: AssignmentDotsProps) => {
  const dots: Array<'done' | 'overdue' | 'pending'> = [];
  for (let i = 0; i < completed; i++) dots.push('done');
  for (let i = 0; i < overdue; i++) dots.push('overdue');
  const pending = total - completed - overdue;
  for (let i = 0; i < Math.max(0, pending); i++) dots.push('pending');

  return (
    <View className="flex-row items-center gap-1.5">
      {dots.map((status, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor:
              status === 'done'
                ? Colors.sway.bright
                : status === 'overdue'
                  ? Colors.primary.error
                  : Colors.chip.dotInactive,
            ...(status === 'overdue' && {
              shadowColor: Colors.primary.error,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 3
            })
          }}
        />
      ))}
    </View>
  );
};

type ProgressBarProps = {
  completed: number;
  total: number;
};

const ProgressBar = ({ completed, total }: ProgressBarProps) => {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const fillColor =
    pct === 0
      ? Colors.primary.error
      : pct < 50
        ? Colors.primary.warning
        : Colors.sway.bright;

  return (
    <View
      style={{
        width: 80,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.chip.darkCardDeep
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 2,
          backgroundColor: pct > 0 ? fillColor : 'transparent'
        }}
      />
    </View>
  );
};

type ClientCardProps = {
  item: DashboardClientItem;
};

const ClientCard = memo(({ item }: ClientCardProps) => {
  const router = useRouter();
  const borderColor = getLeftBorderColor(item);
  const { latestScore, previousScore, assignments } = item;
  const scoreBadge = latestScore
    ? getScoreBadgeStyle(latestScore.scoreBandLabel)
    : null;

  const displayName = item.patient.name
    ? `${item.patient.name.first} ${item.patient.name.last}`
    : item.patient.username;

  return (
    <Pressable
      onPress={() =>
        router.push(`/home/clients/${item.patient._id}`)
      }
      style={({ pressed }) => ({
        backgroundColor: pressed ? Colors.chip.darkCardAlt : Colors.chip.darkCard,
        borderRadius: 14,
        padding: 14,
        paddingBottom: 12,
        marginBottom: 8,
        borderLeftWidth: 3.5,
        borderLeftColor: borderColor
      })}
    >
      {/* Top row: name + last active */}
      <View className="flex-row items-start justify-between">
        <ThemedText type="default" style={{ fontWeight: '700', fontSize: 16 }}>
          {displayName}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {item.lastActive ? formatRelativeTime(item.lastActive) : 'Never'}
        </ThemedText>
      </View>

      {/* Middle row: score badge + delta + assignment dots */}
      <View className="mt-2 flex-row items-center gap-3">
        {latestScore && scoreBadge ? (
          <View
            style={{
              backgroundColor: scoreBadge.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}
          >
            <ThemedText
              type="smallBold"
              style={{ color: scoreBadge.text }}
            >
              {latestScore.moduleTitle}: {latestScore.score}
            </ThemedText>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: 'rgba(166,173,187,0.1)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8
            }}
          >
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
              No scores
            </ThemedText>
          </View>
        )}
        {latestScore && (
          <ScoreDelta
            current={latestScore.score}
            previous={previousScore?.score ?? null}
          />
        )}
        <View className="ml-auto">
          <AssignmentDots
            total={assignments.total}
            completed={assignments.completed}
            overdue={assignments.overdue}
          />
        </View>
      </View>

      {/* Bottom row: completion text + progress bar */}
      <View className="mt-1.5 flex-row items-center justify-between">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
            {assignments.completed}
          </ThemedText>
          /{assignments.total} completed
          {assignments.overdue > 0 && (
            <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
              {' '}· {assignments.overdue} overdue
            </ThemedText>
          )}
          {assignments.total > 0 &&
            assignments.completed === assignments.total && ' ✓'}
        </ThemedText>
        <ProgressBar
          completed={assignments.completed}
          total={assignments.total}
        />
      </View>
    </Pressable>
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
```

- [ ] **Step 3: Check `formatRelativeTime` utility exists**

Grep for `formatRelativeTime` in `utils/`. If it doesn't exist, create it in `utils/date.ts`:

```typescript
export const formatRelativeTime = (isoDate: string): string => {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};
```

Check if a similar function already exists before creating — the codebase may have `formatDate` or `timeAgo` in `utils/`.

- [ ] **Step 4: Verify the component renders without errors**

Import it temporarily in `VerifiedTherapistHome` with mock data to check it renders. Remove after verification.

- [ ] **Step 5: Commit**

```bash
git add components/home/dashboard/ utils/
git commit -m "feat: add ClientCard dashboard component"
```

---

## Task 4: Build StatStrip Component

**Files:**
- Create: `components/home/dashboard/StatStrip.tsx`

- [ ] **Step 1: Create StatStrip component**

Create `components/home/dashboard/StatStrip.tsx`:

```typescript
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { DashboardStats } from '@milobedini/shared-types';

type StatPillProps = {
  value: number;
  label: string;
  color: string;
  onPress: () => void;
};

const StatPill = memo(({ value, label, color, onPress }: StatPillProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flex: 1,
      backgroundColor: pressed ? Colors.chip.darkCardAlt : Colors.chip.darkCard,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center'
    })}
  >
    <ThemedText
      type="subtitle"
      style={{ color, lineHeight: 28 }}
    >
      {value}
    </ThemedText>
    <ThemedText
      type="small"
      style={{
        color: Colors.sway.darkGrey,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2
      }}
    >
      {label}
    </ThemedText>
  </Pressable>
));

StatPill.displayName = 'StatPill';

type StatStripProps = {
  stats: DashboardStats;
  onScrollToBucket: (bucket: 'attention' | 'completed' | 'inactive' | 'top') => void;
};

const StatStrip = memo(({ stats, onScrollToBucket }: StatStripProps) => (
  <View className="my-4 flex-row gap-2">
    <StatPill
      value={stats.totalClients}
      label="Clients"
      color={Colors.sway.darkGrey}
      onPress={() => onScrollToBucket('top')}
    />
    <StatPill
      value={stats.needsAttention}
      label="Attention"
      color={Colors.primary.error}
      onPress={() => onScrollToBucket('attention')}
    />
    <StatPill
      value={stats.submittedThisWeek}
      label="Submitted"
      color={Colors.sway.bright}
      onPress={() => onScrollToBucket('completed')}
    />
    <StatPill
      value={stats.overdueAssignments}
      label="Overdue"
      color={Colors.primary.warning}
      onPress={() => onScrollToBucket('attention')}
    />
  </View>
));

StatStrip.displayName = 'StatStrip';

export default StatStrip;
```

- [ ] **Step 2: Commit**

```bash
git add components/home/dashboard/StatStrip.tsx
git commit -m "feat: add StatStrip dashboard component"
```

---

## Task 5: Build TriageBucket Component

**Files:**
- Create: `components/home/dashboard/TriageBucket.tsx`

- [ ] **Step 1: Create TriageBucket component**

Create `components/home/dashboard/TriageBucket.tsx`:

```typescript
import { forwardRef, memo } from 'react';
import { View } from 'react-native';
import { DashboardClientItem } from '@milobedini/shared-types';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import ClientCard from './ClientCard';

type BucketType = 'attention' | 'completed' | 'inactive';

const BUCKET_CONFIG: Record<BucketType, { dotColor: string; label: string }> = {
  attention: { dotColor: Colors.primary.error, label: 'NEEDS ATTENTION' },
  completed: { dotColor: Colors.sway.bright, label: 'COMPLETED THIS WEEK' },
  inactive: { dotColor: Colors.sway.darkGrey, label: 'NO ACTIVITY' }
};

type TriageBucketProps = {
  type: BucketType;
  items: DashboardClientItem[];
};

const TriageBucket = memo(
  forwardRef<View, TriageBucketProps>(({ type, items }, ref) => {
    if (items.length === 0) return null;

    const config = BUCKET_CONFIG[type];

    return (
      <View ref={ref} className="mt-5">
        {/* Section header */}
        <View className="mb-2.5 flex-row items-center gap-2 py-1.5">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: config.dotColor
            }}
          />
          <ThemedText
            type="small"
            style={{
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: Colors.sway.darkGrey
            }}
          >
            {config.label}
          </ThemedText>
          <View
            style={{
              marginLeft: 'auto',
              backgroundColor: 'rgba(166,173,187,0.12)',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10
            }}
          >
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
              {items.length}
            </ThemedText>
          </View>
        </View>

        {/* Client cards */}
        {items.map((item) => (
          <ClientCard key={item.patient._id} item={item} />
        ))}
      </View>
    );
  })
);

TriageBucket.displayName = 'TriageBucket';

export default TriageBucket;
```

- [ ] **Step 2: Commit**

```bash
git add components/home/dashboard/TriageBucket.tsx
git commit -m "feat: add TriageBucket dashboard component"
```

---

## Task 6: Build Dashboard Hook

**Files:**
- Create: `hooks/useTherapistDashboard.ts`

- [ ] **Step 1: Create the hook**

Create `hooks/useTherapistDashboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { TherapistDashboardResponse } from '@milobedini/shared-types';
import { api } from '@/api/api';
import { useIsLoggedIn } from '@/stores/authStore';

export const useTherapistDashboard = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<TherapistDashboardResponse>({
    queryKey: ['therapist', 'dashboard'],
    queryFn: async (): Promise<TherapistDashboardResponse> => {
      const { data } = await api.get<TherapistDashboardResponse>(
        '/user/therapist/dashboard'
      );
      return data;
    },
    enabled: isLoggedIn
  });
};
```

Note: No `staleTime` override needed — uses the project default of 1 hour from `QueryClient` config in `app/_layout.tsx`.

- [ ] **Step 2: Commit**

```bash
git add hooks/useTherapistDashboard.ts
git commit -m "feat: add useTherapistDashboard hook"
```

---

## Task 7: Build TherapistDashboard and Integrate

**Files:**
- Create: `components/home/TherapistDashboard.tsx`
- Modify: `components/home/VerifiedTherapistHome.tsx`

- [ ] **Step 1: Create TherapistDashboard component**

Create `components/home/TherapistDashboard.tsx`:

```typescript
import { useCallback, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingIndicator } from '@/components/LoadingScreen';
import { Colors } from '@/constants/Colors';
import { useTherapistDashboard } from '@/hooks/useTherapistDashboard';
import StatStrip from './dashboard/StatStrip';
import TriageBucket from './dashboard/TriageBucket';
import { useRouter } from 'expo-router';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const formatWeekStart = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

type Props = {
  firstName: string;
};

const TherapistDashboard = ({ firstName }: Props) => {
  const router = useRouter();
  const { data, isPending, isError, refetch, isFetching } =
    useTherapistDashboard();

  const scrollRef = useRef<ScrollView>(null);
  const attentionRef = useRef<View>(null);
  const completedRef = useRef<View>(null);
  const inactiveRef = useRef<View>(null);

  const handleScrollToBucket = useCallback(
    (bucket: 'attention' | 'completed' | 'inactive' | 'top') => {
      const refMap = {
        attention: attentionRef,
        completed: completedRef,
        inactive: inactiveRef,
        top: null
      };
      const target = refMap[bucket];
      if (!target || !target.current) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
      target.current.measureLayout(
        scrollRef.current as any,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y, animated: true });
        },
        () => {}
      );
    },
    []
  );

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError || !data) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Could not load dashboard"
        subtitle="Pull down to retry"
      />
    );
  }

  // Zero clients empty state
  if (data.stats.totalClients === 0) {
    return (
      <View className="flex-1 px-4">
        <View className="py-2">
          <ThemedText type="subtitle">{getGreeting()}, {firstName}</ThemedText>
        </View>
        <EmptyState
          icon="account-group-outline"
          title="No clients yet"
          subtitle="Browse patients to add your first client"
          action={{
            label: 'Browse patients',
            onPress: () => router.push('/home/patients')
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor={Colors.sway.bright}
        />
      }
    >
      {/* Greeting */}
      <View className="py-2">
        <ThemedText type="subtitle">
          {getGreeting()}, {firstName}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
          Week of {formatWeekStart(data.weekStart)}
        </ThemedText>
      </View>

      {/* Stat pills */}
      <StatStrip stats={data.stats} onScrollToBucket={handleScrollToBucket} />

      {/* Zero assignments banner */}
      {data.stats.totalClients > 0 &&
        data.needsAttention.length === 0 &&
        data.completedThisWeek.length === 0 &&
        data.noActivity.every((c) => c.assignments.total === 0) && (
          <Pressable
            onPress={() => router.push('/home/clients')}
            style={{
              backgroundColor: Colors.tint.teal,
              borderRadius: 12,
              padding: 14,
              marginBottom: 8
            }}
          >
            <ThemedText type="smallBold" style={{ color: Colors.sway.bright }}>
              Assign homework to get started
            </ThemedText>
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, marginTop: 2 }}>
              Tap to view your clients and create assignments
            </ThemedText>
          </Pressable>
        )}

      {/* Triage buckets */}
      <TriageBucket ref={attentionRef} type="attention" items={data.needsAttention} />
      <TriageBucket ref={completedRef} type="completed" items={data.completedThisWeek} />
      <TriageBucket ref={inactiveRef} type="inactive" items={data.noActivity} />

      {/* Bottom spacing */}
      <View className="h-8" />
    </ScrollView>
  );
};

export default TherapistDashboard;
```

- [ ] **Step 2: Update VerifiedTherapistHome**

Replace the contents of `components/home/VerifiedTherapistHome.tsx`:

```typescript
import { useProfile } from '@/hooks/useUsers';
import { HomeScreen } from './HomeScreen';
import TherapistDashboard from './TherapistDashboard';

const VerifiedTherapistHome = () => {
  const { data: profile } = useProfile();
  const firstName = profile?.name?.first || profile?.username || '';

  const content = <TherapistDashboard firstName={firstName} />;

  return <HomeScreen content={content} />;
};

export default VerifiedTherapistHome;
```

- [ ] **Step 3: Verify the dashboard loads in the app**

Start the BE and FE dev servers. Log in as a verified therapist. The home tab should show the dashboard instead of two buttons.

Run: `npx expo start`
Expected: Dashboard renders with greeting, stat pills, and triage buckets. If no data, empty state shows.

- [ ] **Step 4: Commit**

```bash
git add components/home/TherapistDashboard.tsx components/home/VerifiedTherapistHome.tsx
git commit -m "feat: integrate therapist dashboard into home screen"
```

---

## Task 8: Update Profile Screen

**Files:**
- Modify: `app/(main)/(tabs)/profile/index.tsx`

- [ ] **Step 1: Update the profile screen**

In `app/(main)/(tabs)/profile/index.tsx`, make these changes:

1. Remove the standalone "Patient history" `Link` + `SecondaryButton` (lines 64-67)
2. Remove the "Another button" `SecondaryButton` (line 69)
3. Add two therapist-gated buttons before "Log Out":

```typescript
{therapist && (
  <>
    <Link href={'/home/clients'} asChild>
      <SecondaryButton title="Your Clients" />
    </Link>
    <Link href={'/home/patients'} asChild>
      <SecondaryButton title="All Patients" />
    </Link>
  </>
)}
```

The result should be: Profile Details → Divider → Your Clients (therapist) → All Patients (therapist) → Log Out.

- [ ] **Step 2: Verify in the app**

Navigate to the Profile tab as a therapist. Confirm:
- "Patient history" button is gone
- "Another button" is gone
- "Your Clients" and "All Patients" buttons appear
- Both navigate correctly
- Patient users only see Profile Details + Log Out

- [ ] **Step 3: Run validation**

```bash
npx eslint --fix .
npx prettier --write .
npm run lint
```

Expected: All checks pass.

- [ ] **Step 4: Commit**

```bash
git add app/(main)/(tabs)/profile/index.tsx
git commit -m "feat: update profile screen with client navigation, remove placeholders"
```

---

## Task 9: Final Validation and Polish

**Files:**
- All files from previous tasks

- [ ] **Step 1: Test empty states**

Test each empty state scenario:
1. Therapist with 0 clients → "No clients yet" with CTA
2. Therapist with clients but 0 assignments → all in "No Activity"
3. All clients completed → only "Completed This Week" bucket visible

- [ ] **Step 2: Test stat pill scroll-to-bucket**

Tap each stat pill and verify it scrolls to the correct bucket section.

- [ ] **Step 3: Test pull-to-refresh**

Pull down on the dashboard. Verify the refresh spinner appears and data reloads.

- [ ] **Step 4: Test client card navigation**

Tap a client card. Verify it navigates to `/home/clients/[id]` (existing timeline screen).

- [ ] **Step 5: Run full validation**

```bash
npx eslint --fix .
npx prettier --write .
npm run lint
```

Expected: All checks pass.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add .
git commit -m "fix: dashboard polish and validation fixes"
```
