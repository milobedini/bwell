# Profile Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the profile tab from a settings dump into a role-aware personal dashboard with identity header, relationship card, stats strip, and grouped settings for both patients and therapists.

**Architecture:** Single scrollable screen (refresh in place, no new routes). New `GET /user/profile-stats` BE endpoint for patient stats. Therapist stats reuse existing `/user/therapist/dashboard`. Six new FE components composed in the rewritten profile screen, one removed component (`ProfileDetails`), one new hook (`useProfileStats`).

**Tech Stack:** Expo/React Native, NativeWind, react-native-paper, TanStack Query, Zustand, Node/Express + MongoDB (BE), Luxon (BE date handling), `@milobedini/shared-types`

---

## File Map

### Backend (`../cbt/`)

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/controllers/profileStatsController.ts` | Handler for `GET /user/profile-stats` |
| Modify | `src/routes/userRoute.ts` | Add route for profile-stats |
| Modify | `src/shared-types/types.ts` | Add `PatientProfileStatsResponse` type |

### Frontend (`./`)

| Action | File | Purpose |
|--------|------|---------|
| Create | `components/profile/ProfileHeader.tsx` | Left-aligned identity header |
| Create | `components/profile/ProfileHeader.test.tsx` | Tests for identity header |
| Create | `components/profile/TherapistCard.tsx` | Patient's therapist relationship card |
| Create | `components/profile/TherapistCard.test.tsx` | Tests for therapist card |
| Create | `components/profile/ClientsSummaryCard.tsx` | Therapist's client avatars + count |
| Create | `components/profile/ClientsSummaryCard.test.tsx` | Tests for clients summary |
| Create | `components/profile/ProfileStatsStrip.tsx` | Role-aware stats strip |
| Create | `components/profile/ProfileStatsStrip.test.tsx` | Tests for stats strip |
| Create | `components/profile/SettingsGroup.tsx` | Reusable grouped inset list |
| Create | `components/profile/SettingsRow.tsx` | Single settings row with icon + chevron |
| Create | `components/profile/SettingsRow.test.tsx` | Tests for settings row |
| Create | `hooks/useProfileStats.ts` | Fetches patient profile stats |
| Create | `hooks/useProfileStats.test.tsx` | Tests for profile stats hook |
| Modify | `app/(main)/(tabs)/profile/index.tsx` | Rewrite to compose new components |
| Delete | `components/profile/ProfileDetails.tsx` | Replaced by new components |

---

## Task 1: Add `PatientProfileStatsResponse` to shared types

**Files:**
- Modify: `../cbt/src/shared-types/types.ts` (append after line 949)

- [ ] **Step 1: Add the type definition**

Open `../cbt/src/shared-types/types.ts` and append at the end:

```typescript

// ==================================
// API: Patient Profile Stats
// ==================================

export type PatientProfileStatsResponse = {
  latestScore: {
    moduleTitle: string
    score: number
    band: string
    trend: 'improving' | 'worsening' | 'stable'
  } | null
  sessionsThisWeek: number
  assignmentsDue: number
}
```

- [ ] **Step 2: Build shared types**

Run: `cd ../cbt/src/shared-types && npm run build`
Expected: Clean build, `dist/types.d.ts` includes `PatientProfileStatsResponse`

- [ ] **Step 3: Publish shared types**

Run: `cd ../cbt && npm run publish`
Expected: New version published to npm

- [ ] **Step 4: Update FE types**

Run: `npm run update-types` (from bwell root)
Expected: `@milobedini/shared-types` updated in `package.json` and `node_modules`

- [ ] **Step 5: Commit BE changes**

```bash
cd ../cbt
git add src/shared-types/types.ts
git commit -m "feat(shared-types): add PatientProfileStatsResponse type"
```

---

## Task 2: Create `GET /user/profile-stats` BE endpoint

**Files:**
- Create: `../cbt/src/controllers/profileStatsController.ts`
- Modify: `../cbt/src/routes/userRoute.ts`

- [ ] **Step 1: Create the controller**

Create `../cbt/src/controllers/profileStatsController.ts`:

```typescript
import { Request, Response } from 'express'
import { DateTime } from 'luxon'
import ModuleAttempt from '../models/moduleAttemptModel'
import ModuleAssignment from '../models/moduleAssignmentModel'
import { errorHandler } from '../utils/errorHandler'
import type { PatientProfileStatsResponse } from '../shared-types/types'

const LONDON_TZ = 'Europe/London'

const getWeekStart = (): Date => {
  const now = DateTime.now().setZone(LONDON_TZ)
  return now.startOf('week').toUTC().toJSDate() // Monday 00:00
}

export const getProfileStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const weekStart = getWeekStart()

    // Latest questionnaire score
    const latestAttempt = await ModuleAttempt.findOne({
      user: userId,
      status: 'submitted',
      moduleType: 'questionnaire',
      totalScore: { $ne: null },
    })
      .sort({ completedAt: -1 })
      .populate('module', 'title')
      .lean()

    let latestScore: PatientProfileStatsResponse['latestScore'] = null

    if (latestAttempt) {
      // Find previous score for the same module to determine trend
      const previousAttempt = await ModuleAttempt.findOne({
        user: userId,
        module: latestAttempt.module,
        status: 'submitted',
        moduleType: 'questionnaire',
        totalScore: { $ne: null },
        _id: { $ne: latestAttempt._id },
      })
        .sort({ completedAt: -1 })
        .lean()

      let trend: 'improving' | 'worsening' | 'stable' = 'stable'
      if (previousAttempt?.totalScore != null && latestAttempt.totalScore != null) {
        if (latestAttempt.totalScore < previousAttempt.totalScore) trend = 'improving'
        else if (latestAttempt.totalScore > previousAttempt.totalScore) trend = 'worsening'
      }

      const mod = latestAttempt.module as unknown as { title: string }
      latestScore = {
        moduleTitle: mod.title,
        score: latestAttempt.totalScore!,
        band: latestAttempt.scoreBandLabel ?? 'unknown',
        trend,
      }
    }

    // Sessions completed this week
    const sessionsThisWeek = await ModuleAttempt.countDocuments({
      user: userId,
      status: 'submitted',
      completedAt: { $gte: weekStart },
    })

    // Active assignments due
    const assignmentsDue = await ModuleAssignment.countDocuments({
      user: userId,
      status: { $in: ['assigned', 'in_progress'] },
    })

    const response: PatientProfileStatsResponse = {
      latestScore,
      sessionsThisWeek,
      assignmentsDue,
    }

    res.status(200).json(response)
  } catch (error) {
    errorHandler(res, error)
  }
}
```

- [ ] **Step 2: Add route**

In `../cbt/src/routes/userRoute.ts`, add the import at the top:

```typescript
import { getProfileStats } from "../controllers/profileStatsController";
```

Add the route after the `/score-trends` line (after line 45):

```typescript
router.get("/profile-stats", getProfileStats);
```

- [ ] **Step 3: Verify BE compiles**

Run: `cd ../cbt && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Test endpoint manually**

Start the BE (`cd ../cbt && npm run dev`), then:

Run: `curl -s http://localhost:3000/api/user/profile-stats --cookie <session-cookie> | jq .`
Expected: JSON response matching `PatientProfileStatsResponse` shape

- [ ] **Step 5: Commit**

```bash
cd ../cbt
git add src/controllers/profileStatsController.ts src/routes/userRoute.ts
git commit -m "feat(api): add GET /user/profile-stats endpoint for patient profile dashboard"
```

---

## Task 3: Create `SettingsRow` component

**Files:**
- Create: `components/profile/SettingsRow.tsx`
- Create: `components/profile/SettingsRow.test.tsx`

- [ ] **Step 1: Write the test**

Create `components/profile/SettingsRow.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import SettingsRow from './SettingsRow';

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name, ...props }: { name: string }) => <Text {...props}>{name}</Text>
  };
});

describe('SettingsRow', () => {
  it('renders label and icon', () => {
    render(<SettingsRow icon="pencil" label="Edit Name" onPress={jest.fn()} />);

    expect(screen.getByText('Edit Name')).toBeTruthy();
    expect(screen.getByText('pencil')).toBeTruthy();
  });

  it('renders trailing value when provided', () => {
    render(<SettingsRow icon="email" label="Email" value="test@example.com" />);

    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('renders chevron when onPress is provided', () => {
    render(<SettingsRow icon="pencil" label="Edit Name" onPress={jest.fn()} />);

    expect(screen.getByText('chevron-right')).toBeTruthy();
  });

  it('does not render chevron when no onPress', () => {
    render(<SettingsRow icon="email" label="Email" value="test@example.com" />);

    expect(screen.queryByText('chevron-right')).toBeNull();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<SettingsRow icon="pencil" label="Edit Name" onPress={onPress} />);

    fireEvent.press(screen.getByText('Edit Name'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies destructive styling when variant is destructive', () => {
    render(<SettingsRow icon="logout" label="Log Out" variant="destructive" onPress={jest.fn()} />);

    const label = screen.getByText('Log Out');
    expect(label.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FF6D5E' })])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/profile/SettingsRow.test.tsx --no-coverage`
Expected: FAIL — `Cannot find module './SettingsRow'`

- [ ] **Step 3: Implement SettingsRow**

Create `components/profile/SettingsRow.tsx`:

```tsx
import { Pressable, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';

type SettingsRowProps = {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  variant?: 'default' | 'destructive';
};

const SettingsRow = ({ icon, label, value, onPress, variant = 'default' }: SettingsRowProps) => {
  const isDestructive = variant === 'destructive';
  const color = isDestructive ? Colors.primary.error : Colors.sway.darkGrey;
  const labelColor = isDestructive ? Colors.primary.error : Colors.sway.lightGrey;

  const content = (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <ThemedText type="default" style={{ color: labelColor, flex: 1, fontSize: 15 }}>
        {label}
      </ThemedText>
      {value && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {value}
        </ThemedText>
      )}
      {onPress && !value && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.sway.darkGrey} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70" accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return content;
};

export default SettingsRow;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/profile/SettingsRow.test.tsx --no-coverage`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/SettingsRow.tsx components/profile/SettingsRow.test.tsx
git commit -m "feat(profile): add SettingsRow component"
```

---

## Task 4: Create `SettingsGroup` component

**Files:**
- Create: `components/profile/SettingsGroup.tsx`

- [ ] **Step 1: Implement SettingsGroup**

Create `components/profile/SettingsGroup.tsx`:

```tsx
import { type ReactNode } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

type SettingsGroupProps = {
  title?: string;
  children: ReactNode;
};

const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
  return (
    <View className="mb-5">
      {title && (
        <ThemedText
          type="small"
          style={{
            color: Colors.sway.darkGrey,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 8,
            paddingLeft: 4
          }}
        >
          {title}
        </ThemedText>
      )}
      <View className="overflow-hidden rounded-xl bg-chip-darkCard">
        {children}
      </View>
    </View>
  );
};

export default SettingsGroup;
```

No dedicated test file — this is a thin layout wrapper. It will be tested through the profile screen integration.

- [ ] **Step 2: Commit**

```bash
git add components/profile/SettingsGroup.tsx
git commit -m "feat(profile): add SettingsGroup layout component"
```

---

## Task 5: Create `ProfileHeader` component

**Files:**
- Create: `components/profile/ProfileHeader.tsx`
- Create: `components/profile/ProfileHeader.test.tsx`

- [ ] **Step 1: Write the test**

Create `components/profile/ProfileHeader.test.tsx`:

```tsx
import type { ProfileResponse } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import ProfileHeader from './ProfileHeader';

const makeProfile = (overrides: Partial<ProfileResponse> = {}): ProfileResponse => ({
  _id: 'u1',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['patient'],
  isVerifiedTherapist: false,
  patients: [],
  therapist: null,
  ...overrides
});

describe('ProfileHeader', () => {
  it('renders name when available', () => {
    render(<ProfileHeader profile={makeProfile({ name: 'John Smith' })} />);

    expect(screen.getByText('John Smith')).toBeTruthy();
    expect(screen.getByText('@testuser')).toBeTruthy();
  });

  it('falls back to username when no name', () => {
    render(<ProfileHeader profile={makeProfile()} />);

    expect(screen.getByText('testuser')).toBeTruthy();
  });

  it('shows initials in avatar', () => {
    render(<ProfileHeader profile={makeProfile({ name: 'John Smith' })} />);

    expect(screen.getByText('JS')).toBeTruthy();
  });

  it('shows single initial for username fallback', () => {
    render(<ProfileHeader profile={makeProfile()} />);

    expect(screen.getByText('T')).toBeTruthy();
  });

  it('displays patient role badge', () => {
    render(<ProfileHeader profile={makeProfile({ roles: ['patient'] })} />);

    expect(screen.getByText('Patient')).toBeTruthy();
  });

  it('displays therapist role with verified badge', () => {
    render(
      <ProfileHeader
        profile={makeProfile({ roles: ['therapist'], isVerifiedTherapist: true })}
      />
    );

    expect(screen.getByText('Therapist')).toBeTruthy();
    expect(screen.getByText('Verified BWell Therapist')).toBeTruthy();
  });

  it('displays pending verification for unverified therapist', () => {
    render(
      <ProfileHeader
        profile={makeProfile({ roles: ['therapist'], isVerifiedTherapist: false })}
      />
    );

    expect(screen.getByText('Pending Verification')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/profile/ProfileHeader.test.tsx --no-coverage`
Expected: FAIL — `Cannot find module './ProfileHeader'`

- [ ] **Step 3: Implement ProfileHeader**

Create `components/profile/ProfileHeader.tsx`:

```tsx
import { useMemo } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { isTherapist } from '@/utils/userRoles';
import { displayUserRoles } from '@/utils/userRoles';
import type { ProfileResponse } from '@milobedini/shared-types';

type ProfileHeaderProps = {
  profile: ProfileResponse;
};

const getInitials = (name?: string, username?: string): string => {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return (username?.[0] ?? '?').toUpperCase();
};

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const initials = useMemo(
    () => getInitials(profile.name, profile.username),
    [profile.name, profile.username]
  );
  const hasName = !!profile.name;
  const showTherapist = isTherapist(profile.roles);
  const isVerified = profile.isVerifiedTherapist;

  return (
    <View className="mb-6 flex-row items-center gap-4">
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: showTherapist ? '#7c3aed' : Colors.sway.bright
        }}
      >
        <ThemedText
          type="default"
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: showTherapist ? '#ffffff' : Colors.sway.dark
          }}
        >
          {initials}
        </ThemedText>
      </View>

      <View className="flex-1">
        <ThemedText type="smallTitle" style={{ color: Colors.sway.lightGrey }}>
          {hasName ? profile.name : profile.username}
        </ThemedText>

        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {hasName ? `@${profile.username}` : ''}{hasName ? ' · ' : ''}
          <ThemedText
            type="small"
            style={{ color: showTherapist ? '#a78bfa' : Colors.sway.bright }}
          >
            {displayUserRoles(profile.roles).split(', ').map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}
          </ThemedText>
        </ThemedText>

        {showTherapist && (
          <View className="mt-1 flex-row items-center gap-1">
            <ThemedText
              type="small"
              style={{
                color: isVerified ? Colors.sway.bright : Colors.primary.warning,
                fontSize: 12
              }}
            >
              {isVerified ? '✓ Verified BWell Therapist' : 'Pending Verification'}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
};

export default ProfileHeader;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/profile/ProfileHeader.test.tsx --no-coverage`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/ProfileHeader.tsx components/profile/ProfileHeader.test.tsx
git commit -m "feat(profile): add ProfileHeader component with role-aware identity display"
```

---

## Task 6: Create `TherapistCard` component

**Files:**
- Create: `components/profile/TherapistCard.tsx`
- Create: `components/profile/TherapistCard.test.tsx`

- [ ] **Step 1: Write the test**

Create `components/profile/TherapistCard.test.tsx`:

```tsx
import type { User } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import TherapistCard from './TherapistCard';

describe('TherapistCard', () => {
  const therapist: User = {
    _id: 't1',
    username: 'drchen',
    email: 'drchen@nhs.net',
    name: 'Dr. Rebecca Chen'
  };

  it('renders therapist name and label', () => {
    render(<TherapistCard therapist={therapist} />);

    expect(screen.getByText('Your Therapist')).toBeTruthy();
    expect(screen.getByText('Dr. Rebecca Chen')).toBeTruthy();
  });

  it('renders therapist initials in avatar', () => {
    render(<TherapistCard therapist={therapist} />);

    expect(screen.getByText('DR')).toBeTruthy();
  });

  it('falls back to username when no name', () => {
    render(<TherapistCard therapist={{ ...therapist, name: undefined }} />);

    expect(screen.getByText('drchen')).toBeTruthy();
  });

  it('renders empty state when no therapist', () => {
    render(<TherapistCard therapist={null} />);

    expect(screen.getByText('No therapist assigned')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/profile/TherapistCard.test.tsx --no-coverage`
Expected: FAIL — `Cannot find module './TherapistCard'`

- [ ] **Step 3: Implement TherapistCard**

Create `components/profile/TherapistCard.tsx`:

```tsx
import { useMemo } from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import type { User } from '@milobedini/shared-types';

type TherapistCardProps = {
  therapist: User | null;
};

const getInitials = (name?: string, username?: string): string => {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return (username?.[0] ?? '?').toUpperCase();
};

const TherapistCard = ({ therapist }: TherapistCardProps) => {
  const initials = useMemo(
    () => (therapist ? getInitials(therapist.name, therapist.username) : ''),
    [therapist?.name, therapist?.username]
  );

  if (!therapist) {
    return (
      <View className="mb-4 rounded-xl bg-chip-darkCard p-4">
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons
            name="account-off"
            size={24}
            color={Colors.sway.darkGrey}
          />
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            No therapist assigned
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4 flex-row items-center gap-3.5 rounded-xl bg-chip-darkCard p-4">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: '#7c3aed' }}
      >
        <ThemedText
          type="default"
          style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}
        >
          {initials}
        </ThemedText>
      </View>

      <View className="flex-1">
        <ThemedText
          type="small"
          style={{
            color: Colors.sway.darkGrey,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: 11,
            marginBottom: 2
          }}
        >
          Your Therapist
        </ThemedText>
        <ThemedText type="default" style={{ color: Colors.sway.lightGrey, fontSize: 16, fontWeight: '600' }}>
          {therapist.name ?? therapist.username}
        </ThemedText>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.sway.darkGrey} />
    </View>
  );
};

export default TherapistCard;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/profile/TherapistCard.test.tsx --no-coverage`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/TherapistCard.tsx components/profile/TherapistCard.test.tsx
git commit -m "feat(profile): add TherapistCard component with empty state"
```

---

## Task 7: Create `ClientsSummaryCard` component

**Files:**
- Create: `components/profile/ClientsSummaryCard.tsx`
- Create: `components/profile/ClientsSummaryCard.test.tsx`

- [ ] **Step 1: Write the test**

Create `components/profile/ClientsSummaryCard.test.tsx`:

```tsx
import type { AuthUser } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ClientsSummaryCard from './ClientsSummaryCard';

const makeClient = (id: string, name: string): AuthUser => ({
  _id: id,
  username: name.toLowerCase().replace(' ', ''),
  email: `${name.toLowerCase().replace(' ', '')}@example.com`,
  name,
  roles: ['patient']
});

describe('ClientsSummaryCard', () => {
  it('renders client count', () => {
    const clients = [makeClient('1', 'Alice Brown'), makeClient('2', 'Bob Chen')];
    render(<ClientsSummaryCard clients={clients} onPress={jest.fn()} />);

    expect(screen.getByText('2 active clients')).toBeTruthy();
  });

  it('renders initials for up to 4 clients', () => {
    const clients = [
      makeClient('1', 'Alice Brown'),
      makeClient('2', 'Bob Chen'),
      makeClient('3', 'Carol Davis'),
      makeClient('4', 'Dan Evans'),
      makeClient('5', 'Eve Foster')
    ];
    render(<ClientsSummaryCard clients={clients} onPress={jest.fn()} />);

    expect(screen.getByText('AB')).toBeTruthy();
    expect(screen.getByText('BC')).toBeTruthy();
    expect(screen.getByText('CD')).toBeTruthy();
    expect(screen.getByText('DE')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  it('renders empty state when no clients', () => {
    render(<ClientsSummaryCard clients={[]} onPress={jest.fn()} />);

    expect(screen.getByText('No clients yet')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const clients = [makeClient('1', 'Alice Brown')];
    render(<ClientsSummaryCard clients={clients} onPress={onPress} />);

    fireEvent.press(screen.getByText('Your Clients'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses singular for 1 client', () => {
    const clients = [makeClient('1', 'Alice Brown')];
    render(<ClientsSummaryCard clients={clients} onPress={jest.fn()} />);

    expect(screen.getByText('1 active client')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/profile/ClientsSummaryCard.test.tsx --no-coverage`
Expected: FAIL — `Cannot find module './ClientsSummaryCard'`

- [ ] **Step 3: Implement ClientsSummaryCard**

Create `components/profile/ClientsSummaryCard.tsx`:

```tsx
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import type { AuthUser } from '@milobedini/shared-types';

type ClientsSummaryCardProps = {
  clients: AuthUser[];
  onPress: () => void;
};

const AVATAR_COLOURS = ['#18cdba', '#5b8def', '#f4a261', '#e76f9a', '#a78bfa'];
const MAX_AVATARS = 4;

const getInitials = (name?: string, username?: string): string => {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return (username?.[0] ?? '?').toUpperCase();
};

const ClientsSummaryCard = ({ clients, onPress }: ClientsSummaryCardProps) => {
  const displayClients = useMemo(() => clients.slice(0, MAX_AVATARS), [clients]);
  const overflow = clients.length - MAX_AVATARS;

  if (clients.length === 0) {
    return (
      <Pressable
        onPress={onPress}
        className="mb-4 rounded-xl bg-chip-darkCard p-4 active:opacity-70"
        accessibilityRole="button"
      >
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons
            name="account-group-outline"
            size={24}
            color={Colors.sway.darkGrey}
          />
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            No clients yet
          </ThemedText>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-xl bg-chip-darkCard p-4 active:opacity-70"
      accessibilityRole="button"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <ThemedText
          type="small"
          style={{
            color: Colors.sway.darkGrey,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: 11
          }}
        >
          Your Clients
        </ThemedText>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.sway.darkGrey} />
      </View>

      <View className="mb-3 flex-row">
        {displayClients.map((client, i) => (
          <View
            key={client._id}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{
              backgroundColor: AVATAR_COLOURS[i % AVATAR_COLOURS.length],
              marginLeft: i > 0 ? -8 : 0,
              borderWidth: 2,
              borderColor: Colors.chip.darkCard,
              zIndex: MAX_AVATARS - i
            }}
          >
            <ThemedText
              type="small"
              style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}
            >
              {getInitials(client.name, client.username)}
            </ThemedText>
          </View>
        ))}
        {overflow > 0 && (
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{
              backgroundColor: Colors.chip.pill,
              marginLeft: -8,
              borderWidth: 2,
              borderColor: Colors.chip.darkCard
            }}
          >
            <ThemedText
              type="small"
              style={{ fontSize: 12, fontWeight: '600', color: Colors.sway.darkGrey }}
            >
              +{overflow}
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText type="small" style={{ color: Colors.sway.lightGrey, fontSize: 14 }}>
        {clients.length} active {clients.length === 1 ? 'client' : 'clients'}
      </ThemedText>
    </Pressable>
  );
};

export default ClientsSummaryCard;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/profile/ClientsSummaryCard.test.tsx --no-coverage`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/ClientsSummaryCard.tsx components/profile/ClientsSummaryCard.test.tsx
git commit -m "feat(profile): add ClientsSummaryCard with avatar stack and empty state"
```

---

## Task 8: Create `useProfileStats` hook

**Files:**
- Create: `hooks/useProfileStats.ts`
- Create: `hooks/useProfileStats.test.tsx`

- [ ] **Step 1: Write the test**

Create `hooks/useProfileStats.test.tsx`:

```tsx
import { api } from '@/api/api';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import type { PatientProfileStatsResponse } from '@milobedini/shared-types';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useProfileStats } from './useProfileStats';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('@/hooks/useUsers', () => ({
  useIsLoggedIn: jest.fn()
}));

const { useIsLoggedIn } = require('@/hooks/useUsers');

const mockStats: PatientProfileStatsResponse = {
  latestScore: {
    moduleTitle: 'PHQ-9',
    score: 8,
    band: 'mild',
    trend: 'improving'
  },
  sessionsThisWeek: 4,
  assignmentsDue: 2
};

describe('useProfileStats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches profile stats when logged in', async () => {
    useIsLoggedIn.mockReturnValue(true);
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(() => useProfileStats(), {
      wrapper: createQueryClientWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/profile-stats');
    expect(result.current.data).toEqual(mockStats);
  });

  it('does not fetch when not logged in', () => {
    useIsLoggedIn.mockReturnValue(false);

    const { result } = renderHook(() => useProfileStats(), {
      wrapper: createQueryClientWrapper()
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.get).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest hooks/useProfileStats.test.tsx --no-coverage`
Expected: FAIL — `Cannot find module './useProfileStats'`

- [ ] **Step 3: Implement useProfileStats**

Create `hooks/useProfileStats.ts`:

```typescript
import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { PatientProfileStatsResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const useProfileStats = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<PatientProfileStatsResponse>({
    queryKey: ['profile', 'stats'],
    queryFn: async (): Promise<PatientProfileStatsResponse> => {
      const { data } = await api.get<PatientProfileStatsResponse>('/user/profile-stats');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5 // 5 minutes — stats change more frequently than profile
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest hooks/useProfileStats.test.tsx --no-coverage`
Expected: All 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useProfileStats.ts hooks/useProfileStats.test.tsx
git commit -m "feat(profile): add useProfileStats hook for patient dashboard stats"
```

---

## Task 9: Create `ProfileStatsStrip` component

**Files:**
- Create: `components/profile/ProfileStatsStrip.tsx`
- Create: `components/profile/ProfileStatsStrip.test.tsx`

- [ ] **Step 1: Write the test**

Create `components/profile/ProfileStatsStrip.test.tsx`:

```tsx
import type { PatientProfileStatsResponse, DashboardStats } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import ProfileStatsStrip from './ProfileStatsStrip';

describe('ProfileStatsStrip', () => {
  describe('patient variant', () => {
    const stats: PatientProfileStatsResponse = {
      latestScore: { moduleTitle: 'PHQ-9', score: 8, band: 'mild', trend: 'improving' },
      sessionsThisWeek: 4,
      assignmentsDue: 2
    };

    it('renders all three patient metrics', () => {
      render(<ProfileStatsStrip variant="patient" stats={stats} />);

      expect(screen.getByText('PHQ-9')).toBeTruthy();
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('↓ mild')).toBeTruthy();
      expect(screen.getByText('4')).toBeTruthy();
      expect(screen.getByText('sessions')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('assignments')).toBeTruthy();
    });

    it('renders dashes when no score data', () => {
      const emptyStats: PatientProfileStatsResponse = {
        latestScore: null,
        sessionsThisWeek: 0,
        assignmentsDue: 0
      };
      render(<ProfileStatsStrip variant="patient" stats={emptyStats} />);

      expect(screen.getByText('—')).toBeTruthy();
    });

    it('shows worsening trend indicator', () => {
      const worseningStats: PatientProfileStatsResponse = {
        ...stats,
        latestScore: { moduleTitle: 'PHQ-9', score: 15, band: 'severe', trend: 'worsening' }
      };
      render(<ProfileStatsStrip variant="patient" stats={worseningStats} />);

      expect(screen.getByText('↑ severe')).toBeTruthy();
    });
  });

  describe('therapist variant', () => {
    const stats: DashboardStats = {
      totalClients: 8,
      needsAttention: 3,
      submittedThisWeek: 5,
      overdueAssignments: 2
    };

    it('renders all four therapist metrics', () => {
      render(<ProfileStatsStrip variant="therapist" stats={stats} />);

      expect(screen.getByText('Clients')).toBeTruthy();
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('Attention')).toBeTruthy();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('Submitted')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('Overdue')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('renders loading state', () => {
    render(<ProfileStatsStrip variant="patient" stats={null} isLoading />);

    expect(screen.getByTestId('stats-loading')).toBeTruthy();
  });

  it('renders error state with retry', () => {
    const onRetry = jest.fn();
    render(<ProfileStatsStrip variant="patient" stats={null} isError onRetry={onRetry} />);

    expect(screen.getByText('Unable to load')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/profile/ProfileStatsStrip.test.tsx --no-coverage`
Expected: FAIL — `Cannot find module './ProfileStatsStrip'`

- [ ] **Step 3: Implement ProfileStatsStrip**

Create `components/profile/ProfileStatsStrip.tsx`:

```tsx
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import type { DashboardStats, PatientProfileStatsResponse } from '@milobedini/shared-types';

type PatientStatsProps = {
  variant: 'patient';
  stats: PatientProfileStatsResponse | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

type TherapistStatsProps = {
  variant: 'therapist';
  stats: DashboardStats | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

type ProfileStatsStripProps = PatientStatsProps | TherapistStatsProps;

type StatCell = {
  label: string;
  value: string;
  subtitle: string;
  color: string;
};

const getTrendArrow = (trend: 'improving' | 'worsening' | 'stable'): string => {
  if (trend === 'improving') return '↓';
  if (trend === 'worsening') return '↑';
  return '→';
};

const getScoreColour = (trend: 'improving' | 'worsening' | 'stable'): string => {
  if (trend === 'improving') return Colors.primary.success;
  if (trend === 'worsening') return Colors.primary.error;
  return Colors.sway.lightGrey;
};

const buildPatientCells = (stats: PatientProfileStatsResponse): StatCell[] => {
  const scoreCell: StatCell = stats.latestScore
    ? {
        label: stats.latestScore.moduleTitle,
        value: String(stats.latestScore.score),
        subtitle: `${getTrendArrow(stats.latestScore.trend)} ${stats.latestScore.band}`,
        color: getScoreColour(stats.latestScore.trend)
      }
    : {
        label: 'Score',
        value: '—',
        subtitle: '',
        color: Colors.sway.darkGrey
      };

  return [
    scoreCell,
    {
      label: 'This Week',
      value: String(stats.sessionsThisWeek),
      subtitle: 'sessions',
      color: Colors.sway.lightGrey
    },
    {
      label: 'Due',
      value: String(stats.assignmentsDue),
      subtitle: 'assignments',
      color: stats.assignmentsDue > 0 ? Colors.primary.warning : Colors.sway.lightGrey
    }
  ];
};

const buildTherapistCells = (stats: DashboardStats): StatCell[] => [
  {
    label: 'Clients',
    value: String(stats.totalClients),
    subtitle: 'total',
    color: Colors.sway.lightGrey
  },
  {
    label: 'Attention',
    value: String(stats.needsAttention),
    subtitle: 'flagged',
    color: stats.needsAttention > 0 ? Colors.primary.error : Colors.sway.lightGrey
  },
  {
    label: 'Submitted',
    value: String(stats.submittedThisWeek),
    subtitle: 'this week',
    color: Colors.sway.bright
  },
  {
    label: 'Overdue',
    value: String(stats.overdueAssignments),
    subtitle: 'assignments',
    color: stats.overdueAssignments > 0 ? Colors.primary.warning : Colors.sway.lightGrey
  }
];

const ProfileStatsStrip = (props: ProfileStatsStripProps) => {
  const { stats, isLoading, isError, onRetry } = props;

  if (isLoading) {
    return (
      <View className="mb-6 items-center rounded-xl bg-chip-darkCard px-5 py-4" testID="stats-loading">
        <ActivityIndicator color={Colors.sway.bright} />
      </View>
    );
  }

  if (isError || !stats) {
    return (
      <Pressable
        onPress={onRetry}
        className="mb-6 items-center rounded-xl bg-chip-darkCard px-5 py-4 active:opacity-70"
      >
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          Unable to load
        </ThemedText>
      </Pressable>
    );
  }

  const cells =
    props.variant === 'patient'
      ? buildPatientCells(props.stats as PatientProfileStatsResponse)
      : buildTherapistCells(props.stats as DashboardStats);

  return (
    <View className="mb-6 rounded-xl bg-chip-darkCard px-3 py-4">
      <View className="flex-row items-center justify-around">
        {cells.map((cell, i) => (
          <View key={cell.label} className="flex-row items-center">
            {i > 0 && (
              <View
                className="mx-1 self-stretch"
                style={{ width: 1, backgroundColor: 'rgba(166,173,187,0.15)' }}
              />
            )}
            <View className="items-center px-1">
              <ThemedText
                type="small"
                style={{
                  color: Colors.sway.darkGrey,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: 11,
                  marginBottom: 4
                }}
              >
                {cell.label}
              </ThemedText>
              <ThemedText
                type="default"
                style={{ fontSize: 24, fontWeight: '700', color: cell.color }}
              >
                {cell.value}
              </ThemedText>
              {cell.subtitle !== '' && (
                <ThemedText type="small" style={{ color: cell.color, fontSize: 11 }}>
                  {cell.subtitle}
                </ThemedText>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProfileStatsStrip;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/profile/ProfileStatsStrip.test.tsx --no-coverage`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/profile/ProfileStatsStrip.tsx components/profile/ProfileStatsStrip.test.tsx
git commit -m "feat(profile): add ProfileStatsStrip with patient and therapist variants"
```

---

## Task 10: Rewrite profile screen and remove `ProfileDetails`

**Files:**
- Modify: `app/(main)/(tabs)/profile/index.tsx`
- Delete: `components/profile/ProfileDetails.tsx`

- [ ] **Step 1: Rewrite the profile screen**

Replace the contents of `app/(main)/(tabs)/profile/index.tsx` with:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import Constants from 'expo-constants';

import Container from '@/components/Container';
import { ErrorComponent } from '@/components/ErrorComponent';
import LoadingIndicator from '@/components/LoadingIndicator';
import ChangePasswordDialog from '@/components/profile/ChangePasswordDialog';
import ClientsSummaryCard from '@/components/profile/ClientsSummaryCard';
import EditNameDialog from '@/components/profile/EditNameDialog';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStatsStrip from '@/components/profile/ProfileStatsStrip';
import SettingsGroup from '@/components/profile/SettingsGroup';
import SettingsRow from '@/components/profile/SettingsRow';
import TherapistCard from '@/components/profile/TherapistCard';
import { useLogout } from '@/hooks/useAuth';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useTherapistDashboard } from '@/hooks/useTherapistDashboard';
import { useProfile, useClients } from '@/hooks/useUsers';
import { isPatient, isTherapist } from '@/utils/userRoles';

const ProfileScreen = () => {
  const { data: profile, isPending, isError } = useProfile();
  const { mutate: logout } = useLogout();

  const showPatient = useMemo(() => isPatient(profile?.roles), [profile?.roles]);
  const showTherapist = useMemo(() => isTherapist(profile?.roles), [profile?.roles]);

  // Patient stats
  const {
    data: patientStats,
    isPending: patientStatsLoading,
    isError: patientStatsError,
    refetch: refetchPatientStats
  } = useProfileStats();

  // Therapist stats (reuse existing dashboard hook)
  const { data: dashboardData } = useTherapistDashboard();

  // Therapist clients (for avatar stack)
  const { data: clients } = useClients();

  // Dialog state
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  if (isPending) return <LoadingIndicator />;
  if (isError || !profile) return <ErrorComponent />;

  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <Container>
      <ScrollView className="flex-1 px-4">
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
        >
          {/* Identity Header */}
          <View className="mt-6">
            <ProfileHeader profile={profile} />
          </View>

          {/* Relationship Card */}
          {showPatient && <TherapistCard therapist={profile.therapist} />}
          {showTherapist && (
            <Link href="/(main)/(tabs)/patients" asChild push withAnchor>
              <ClientsSummaryCard
                clients={clients ?? []}
                onPress={() => {}}
              />
            </Link>
          )}

          {/* Stats Strip */}
          {showPatient && (
            <ProfileStatsStrip
              variant="patient"
              stats={patientStats ?? null}
              isLoading={patientStatsLoading}
              isError={patientStatsError}
              onRetry={() => refetchPatientStats()}
            />
          )}
          {showTherapist && dashboardData && (
            <ProfileStatsStrip
              variant="therapist"
              stats={dashboardData.stats}
            />
          )}

          {/* Settings: Account */}
          <SettingsGroup title="Account">
            <SettingsRow
              icon="pencil-outline"
              label="Edit Name"
              onPress={() => setEditNameVisible(true)}
            />
            <View style={{ height: 1, backgroundColor: 'rgba(166,173,187,0.1)' }} />
            <SettingsRow
              icon="lock-outline"
              label="Change Password"
              onPress={() => setChangePasswordVisible(true)}
            />
            <View style={{ height: 1, backgroundColor: 'rgba(166,173,187,0.1)' }} />
            <SettingsRow
              icon="email-outline"
              label="Email"
              value={profile.email}
            />
          </SettingsGroup>

          {/* Settings: Client Management (therapist only) */}
          {showTherapist && (
            <SettingsGroup title="Client Management">
              <Link href="/(main)/(tabs)/profile/patients" asChild>
                <SettingsRow
                  icon="account-group-outline"
                  label="All Patients"
                  onPress={() => {}}
                />
              </Link>
            </SettingsGroup>
          )}

          {/* Settings: Support */}
          <SettingsGroup title="Support">
            <SettingsRow icon="help-circle-outline" label="Help & FAQ" />
            <View style={{ height: 1, backgroundColor: 'rgba(166,173,187,0.1)' }} />
            <SettingsRow icon="message-outline" label="Send Feedback" />
            <View style={{ height: 1, backgroundColor: 'rgba(166,173,187,0.1)' }} />
            <SettingsRow
              icon="information-outline"
              label="About"
              value={`v${appVersion}`}
            />
          </SettingsGroup>

          {/* Settings: Danger Zone */}
          <SettingsGroup>
            <SettingsRow
              icon="logout"
              label="Log Out"
              variant="destructive"
              onPress={handleLogout}
            />
          </SettingsGroup>

          <View className="h-8" />
        </MotiView>
      </ScrollView>

      <EditNameDialog visible={editNameVisible} onDismiss={() => setEditNameVisible(false)} />
      <ChangePasswordDialog visible={changePasswordVisible} onDismiss={() => setChangePasswordVisible(false)} />
    </Container>
  );
};

export default ProfileScreen;
```

- [ ] **Step 2: Delete ProfileDetails**

Run: `rm components/profile/ProfileDetails.tsx`

- [ ] **Step 3: Verify no remaining imports of ProfileDetails**

Run: `npx grep -r "ProfileDetails" --include="*.tsx" --include="*.ts" .`
Expected: No results (or only this plan file)

- [ ] **Step 4: Run linting**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: All tests pass, no regressions

- [ ] **Step 6: Commit**

```bash
git add app/\(main\)/\(tabs\)/profile/index.tsx
git rm components/profile/ProfileDetails.tsx
git commit -m "feat(profile): redesign profile screen with dashboard layout

Replace flat button list with role-aware sections: identity header,
relationship card, stats strip, and grouped settings."
```

---

## Task 11: Visual verification

**Files:** None (manual testing)

- [ ] **Step 1: Start dev server**

Run: `npx expo start`

- [ ] **Step 2: Test patient profile**

Log in as a patient. Verify:
- Identity header shows name/username with initials avatar
- Therapist card shows assigned therapist (or empty state)
- Stats strip shows score, sessions, and assignments (or dashes for new user)
- Settings groups are properly grouped with icons and chevrons
- Edit Name dialog opens from settings row
- Change Password dialog opens from settings row
- Email is displayed (not editable)
- Log Out works and is red/destructive styled

- [ ] **Step 3: Test therapist profile**

Log in as a therapist. Verify:
- Identity header shows purple avatar with verification badge
- Clients summary card shows avatar stack with count
- Stats strip shows 4 therapist metrics from dashboard data
- Client Management section shows "All Patients" row
- All Patients navigation works

- [ ] **Step 4: Test empty states**

Log in as a new patient with no data. Verify:
- Stats strip shows dashes with prompt text
- Therapist card shows "No therapist assigned"

- [ ] **Step 5: Commit any fixes**

If any visual issues were found and fixed, commit them:

```bash
git add -A
git commit -m "fix(profile): visual adjustments from manual testing"
```
