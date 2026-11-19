import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../lib/theme.js';

export default function BrandHeader({ title, action, onAction }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.brand}>VESTORA</Text>
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction ?? (() => router.push(action === 'Bag' ? '/cart' : '/profile'))}
          style={styles.action}
        >
          <Text style={styles.actionText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brand: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    marginTop: 4,
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 24,
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
  },
  actionText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
});
