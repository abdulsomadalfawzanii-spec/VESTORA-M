import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { formatNaira } from '../lib/format.js';
import { theme } from '../lib/theme.js';

export default function ProductCard({ product }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatNaira(product.priceMinor)}`}
      onPress={() => router.push(`/product/${product._id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {product.imageUrls?.[0] ? (
        <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.mark}>V</Text>
        </View>
      )}
      <Text numberOfLines={1} style={styles.vendor}>{product.vendorName}</Text>
      <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{formatNaira(product.priceMinor)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    paddingBottom: 14,
  },
  pressed: {
    opacity: 0.82,
  },
  image: {
    width: '100%',
    aspectRatio: 0.78,
    borderRadius: 15,
    backgroundColor: '#E9E4DA',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: theme.colors.gold,
    fontFamily: 'Georgia',
    fontSize: 64,
  },
  vendor: {
    marginTop: 12,
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  name: {
    minHeight: 38,
    marginTop: 4,
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  price: {
    marginTop: 5,
    color: theme.colors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
});
