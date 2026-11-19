import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomNav from '../components/BottomNav.js';
import BrandHeader from '../components/BrandHeader.js';
import PrimaryButton from '../components/PrimaryButton.js';
import Screen from '../components/Screen.js';
import { formatNaira } from '../lib/format.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';
import { useCart } from '../providers/CartProvider.js';

export default function CartScreen() {
  const { ready: authReady, user } = useAuth();
  const { items, ready, subtotalMinor, setQuantity } = useCart();
  if (authReady && !user) return <Redirect href="/login" />;

  if (!ready) return <ActivityIndicator color={theme.colors.gold} style={styles.loader} />;

  return (
    <View style={styles.page}>
      <Screen scroll>
        <BrandHeader title="Your bag" />
        {!items.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyHeading}>Your bag is waiting.</Text>
            <Text style={styles.emptyCopy}>Explore independent pieces and save your favourites here.</Text>
            <PrimaryButton onPress={() => router.replace('/catalog')} title="Discover pieces" />
          </View>
        ) : (
          <>
            <View style={styles.items}>
              {items.map(({ key, product, quantity, size, color }) => (
                <View key={key} style={styles.item}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.vendor}>{product.vendorName}</Text>
                    <Text style={styles.name}>{product.name}</Text>
                    {size || color ? (
                      <Text style={styles.variant}>{[size, color].filter(Boolean).join(' · ')}</Text>
                    ) : null}
                    <Text style={styles.price}>{formatNaira(product.priceMinor * quantity)}</Text>
                  </View>
                  <View style={styles.quantity}>
                    <Pressable
                      accessibilityLabel="Decrease quantity"
                      accessibilityRole="button"
                      onPress={() => setQuantity(key, quantity - 1)}
                      style={styles.quantityButton}
                    >
                      <Text style={styles.quantityText}>−</Text>
                    </Pressable>
                    <Text style={styles.count}>{quantity}</Text>
                    <Pressable
                      accessibilityLabel="Increase quantity"
                      accessibilityRole="button"
                      onPress={() => setQuantity(key, quantity + 1)}
                      style={styles.quantityButton}
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatNaira(subtotalMinor)}</Text>
              </View>
              <Text style={styles.note}>Final amount is recalculated by the server before payment.</Text>
              <PrimaryButton onPress={() => router.push('/checkout')} title="Continue to checkout" />
            </View>
          </>
        )}
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loader: {
    flex: 1,
  },
  empty: {
    gap: 14,
    paddingVertical: 44,
  },
  emptyHeading: {
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 29,
  },
  emptyCopy: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  items: {
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderColor: theme.colors.line,
  },
  itemInfo: {
    flex: 1,
    gap: 5,
  },
  vendor: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  variant: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  price: {
    marginTop: 3,
    color: theme.colors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },
  quantityText: {
    color: theme.colors.ink,
    fontSize: 18,
  },
  count: {
    minWidth: 14,
    textAlign: 'center',
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  summary: {
    gap: 14,
    marginTop: 22,
    padding: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  summaryValue: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  note: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
