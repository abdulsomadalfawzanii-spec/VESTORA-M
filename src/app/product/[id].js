import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav.js';
import BrandHeader from '../../components/BrandHeader.js';
import PrimaryButton from '../../components/PrimaryButton.js';
import { formatNaira } from '../../lib/format.js';
import { theme } from '../../lib/theme.js';
import { useAuth } from '../../providers/AuthProvider.js';
import { useCart } from '../../providers/CartProvider.js';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { ready, user, request } = useAuth();
  const { addItem, ready: cartReady } = useCart();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    request(`/products/${encodeURIComponent(id)}`)
      .then(({ product: result }) => {
        if (active) setProduct(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, request]);

  if (ready && !user) return <Redirect href="/login" />;
  if (loading) {
    return <ActivityIndicator color={theme.colors.gold} style={styles.loader} size="large" />;
  }
  if (!product) {
    return (
      <View style={styles.page}>
        <BrandHeader title="Piece unavailable" />
        <Text accessibilityRole="alert" style={styles.error}>{error || 'Product not found.'}</Text>
        <PrimaryButton onPress={() => router.back()} title="Go back" />
      </View>
    );
  }

  const variantsSelected =
    (!product.sizes.length || size) && (!product.colors.length || color);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader action="Bag" title="The details" />
        {product.imageUrls?.[0] ? (
          <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.mark}>V</Text>
          </View>
        )}
        <Text style={styles.vendor}>{product.brand ? `${product.brand} · ${product.vendorName}` : product.vendorName}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatNaira(product.priceMinor)}</Text>
        <Text style={styles.description}>{product.description}</Text>
        {product.sizes.length ? (
          <VariantPicker label="Choose a size" options={product.sizes} value={size} onSelect={setSize} />
        ) : null}
        {product.colors.length ? (
          <VariantPicker label="Choose a colour" options={product.colors} value={color} onSelect={setColor} />
        ) : null}
        <Text style={styles.stock}>
          {product.stock > 0 ? `${product.stock} available` : 'Currently out of stock'}
        </Text>
        <PrimaryButton
          disabled={!cartReady || !variantsSelected || product.stock < 1}
          loading={!cartReady}
          onPress={() => {
            addItem(product, { size, color });
            router.push('/cart');
          }}
          title="Add to bag"
        />
      </ScrollView>
      <BottomNav />
    </View>
  );
}

function VariantPicker({ label, options, value, onSelect }) {
  return (
    <View style={styles.variantGroup}>
      <Text style={styles.variantLabel}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: option === value }}
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.option, option === value && styles.optionSelected]}
          >
            <Text style={[styles.optionText, option === value && styles.optionTextSelected]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  loader: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  image: {
    width: '100%',
    aspectRatio: 0.82,
    borderRadius: 20,
    backgroundColor: '#E9E4DA',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: theme.colors.gold,
    fontFamily: 'Georgia',
    fontSize: 96,
  },
  vendor: {
    marginTop: 20,
    color: theme.colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  name: {
    marginTop: 6,
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 30,
    lineHeight: 36,
  },
  price: {
    marginTop: 9,
    color: theme.colors.charcoal,
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    marginTop: 16,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  variantGroup: {
    gap: 10,
    marginTop: 20,
  },
  variantLabel: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
  },
  optionSelected: {
    borderColor: theme.colors.ink,
    backgroundColor: theme.colors.ink,
  },
  optionText: {
    color: theme.colors.charcoal,
    fontSize: 12,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  stock: {
    marginVertical: 18,
    color: theme.colors.muted,
    fontSize: 12,
  },
  error: {
    color: theme.colors.danger,
    padding: 20,
  },
});
