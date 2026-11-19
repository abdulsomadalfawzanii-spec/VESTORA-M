import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../providers/AuthProvider.js';
import { theme } from '../lib/theme.js';

export default function IndexScreen() {
  const { ready, user } = useAuth();
  if (ready) return <Redirect href={user ? '/catalog' : '/login'} />;

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.colors.gold} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});
