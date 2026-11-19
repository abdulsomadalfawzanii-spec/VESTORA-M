import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { theme } from '../lib/theme.js';

const items = [
  { label: 'Discover', route: '/catalog' },
  { label: 'Bag', route: '/cart' },
  { label: 'Orders', route: '/orders' },
  { label: 'Sell', route: '/vendor' },
  { label: 'Profile', route: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <View style={styles.nav}>
      {items.map(({ label, route }) => {
        const active = pathname === route || pathname.startsWith(`${route}/`);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={route}
            onPress={() => router.replace(route)}
            style={styles.item}
          >
            <Text style={[styles.label, active && styles.active]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  item: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  active: {
    color: theme.colors.ink,
    fontWeight: '800',
  },
});
