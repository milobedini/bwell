import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BWellLogo } from '@/components/brand/Imagery';
import Container from '@/components/Container';
import ContentContainer from '@/components/ContentContainer';
import ErrorComponent, { ErrorTypes } from '@/components/ErrorComponent';
import { LoadingIndicator } from '@/components/LoadingScreen';
import ThemedButton from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { useProfile } from '@/hooks/useUsers';
import { isAdmin, isTherapist, isVerifiedTherapist } from '@/utils/userRoles';

/* 
DESIGN

1) Patients
HOME
- Assignments - in progress first (continue where you left off, attempt/assignment), then sorted by earliest dueAt -> CTA continue or start
- Attempts - attempts with status=started
- Due soon badge, assignments due within 72hr
PROGRAMS
- Programs-Modules: show current stuff, as well as meta information relevant to user. If enrolment and disabled, email therapist
ASSIGNMENTS
- Top tabs of active or completed
- Row containing title, program, due at (countdown), progression chip. CTA continue or start
PROFILE
- History screen, showing completed attempts
- Ability to filter by module, program, dates
- CTA leads to snapshot of attempt etc.
- Eventually add insights screen, which shows score over time, completion rate of assignments etc.

2) Therapists
HOME
- Big Pending badge if pending verification.
- Assignments due this week for patients
- Most recent attempts - maybe since last user session only
- Patients needing attention (severe scores)
- CTAs - View clients, see latest attempts
CLIENTS
- List name, email, badges for active assignments. Search by name etc. CTA client detail.
- Client detail - latest submitted attempts (by module), filtered by user. Assignments for the client with status chips.
    link to timeline per user per module
PROGRAMS-MODULES
- Should be able to assign clients from here as well
ASSIGNMENTS
- Similar to patient, but show's the therapists patients.
PROFILE
- Verification badge, number of clients, assignments outstanding

3) Admin
HOME
- System stats: user count, therapist count, unverified therapists, attempts last 7 days. Verify therapists dialog.
  In the future, create module/manage program
USERS
- Big list, filterable. Verify therapists, assign/unassign therapists
PROGRAM-MODULES
- As is, just a view of them
*/

export default function Home() {
  const { data: user, isPending, isError } = useProfile();
  const router = useRouter();

  if (isPending) return <LoadingIndicator marginBottom={0} />;

  if (isError) return <ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />;

  if (!user && !isPending) return <ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} redirectLogin />;

  if (isAdmin(user.roles))
    return (
      <Container>
        <ContentContainer>
          <ThemedText>Admin home</ThemedText>
          <View className="mt-auto items-center">
            <BWellLogo />
          </View>
        </ContentContainer>
      </Container>
    );

  if (isVerifiedTherapist(user))
    return (
      <Container>
        <ContentContainer>
          <ThemedText>Verified therapist home</ThemedText>
          <ThemedButton className="mb-4" onPress={() => router.push('/home/clients')}>
            Your clients
          </ThemedButton>
          <ThemedButton onPress={() => router.push('/home/patients')}>All patients</ThemedButton>
          <View className="mt-auto items-center">
            <BWellLogo />
          </View>
        </ContentContainer>
      </Container>
    );

  if (isTherapist(user.roles))
    return (
      <Container>
        <ContentContainer>
          <ThemedText type="title" className="mt-4">
            You are awaiting BWell verification
          </ThemedText>
          <View className="mt-auto items-center">
            <BWellLogo />
          </View>
        </ContentContainer>
      </Container>
    );

  return (
    <Container>
      <ContentContainer>
        <ThemedText>Patient home</ThemedText>
        <View className="mt-auto items-center">
          <BWellLogo />
        </View>
      </ContentContainer>
    </Container>
  );
}
