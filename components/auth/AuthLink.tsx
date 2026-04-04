import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';

type AuthLinkProps = {
  href: string;
  label: string;
  testID?: string;
};

const AuthLink = ({ href, label, testID }: AuthLinkProps) => (
  <View
    style={{
      alignItems: 'center',
      flexDirection: 'row',
      alignSelf: 'center'
    }}
  >
    <Link href={href as '/(auth)/login'} asChild>
      <Pressable testID={testID}>
        <Text
          style={{
            fontWeight: '700',
            fontSize: 16,
            color: Colors.sway.authLink,
            marginLeft: 8
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  </View>
);

export default AuthLink;
