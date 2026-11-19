import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import BottomNav from '../components/BottomNav.js';
import BrandHeader from '../components/BrandHeader.js';
import ProductCard from '../components/ProductCard.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';

const categories = ['All', 'Dresses', 'Tops', 'Bottoms', 'Bags', 'Shoes'];

export default function CatalogScreen() {
  const { ready, user, request } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'All') params.set('category', category.toLowerCase());
      const result = await request(`/products?${params.toString()}`);
      setProducts(result.items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [category, query, request]);

  useEffect(() => {
    if (!ready || !user) return undefined;
    let active = true;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'All') params.set('category', category.toLowerCase());
    request(`/products?${params.toString()}`)
      .then((result) => {
        if (active) {
          setProducts(result.items);
          setError('');
        }
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
  }, [category, query, ready, request, user]);

  if (ready && !user) return <Redirect href="/login" />;

  return (
    <View style={styles.page}>
      <FlatList
        contentContainerStyle={styles.list}
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        refreshing={loading}
        onRefresh={loadProducts}
        ListHeaderComponent={
          <View>
            <BrandHeader action="Bag" title="Discover" />
            <Text style={styles.eyebrow}>INDEPENDENT FASHION</Text>
            <Text style={styles.heading}>Pieces with a point of view.</Text>
            <Text style={styles.copy}>Find something that feels entirely your own.</Text>
            <TextInput
              accessibilityLabel="Search fashion"
              onChangeText={setSearchText}
              onSubmitEditing={() => {
                setLoading(true);
                setQuery(searchText);
              }}
              placeholder="Search designers, pieces, categories"
              placeholderTextColor={theme.colors.muted}
              returnKeyType="search"
              style={styles.search}
              value={searchText}
            />
            <View style={styles.categories}>
              {categories.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === category }}
                  key={item}
                  onPress={() => {
                    setLoading(true);
                    setCategory(item);
                  }}
                  style={[styles.category, item === category && styles.selectedCategory]}
                >
                  <Text style={[styles.categoryText, item === category && styles.selectedCategoryText]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            {error ? (
              <View style={styles.errorBox}>
                <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={loadProducts}>
                  <Text style={styles.retry}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
            {loading && products.length === 0 ? (
              <ActivityIndicator color={theme.colors.gold} style={styles.loading} />
            ) : null}
            {!loading && !error && products.length === 0 ? (
              <Text style={styles.empty}>No pieces found. Try another search.</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        ListFooterComponent={<View style={styles.bottomSpace} />}
      />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  eyebrow: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heading: {
    marginTop: 8,
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 34,
    lineHeight: 40,
  },
  copy: {
    marginTop: 8,
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  search: {
    height: 50,
    marginTop: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    color: theme.colors.ink,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  category: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  selectedCategory: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  categoryText: {
    color: theme.colors.charcoal,
    fontSize: 11,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  errorBox: {
    gap: 10,
    marginVertical: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF0EE',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  retry: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  loading: {
    marginVertical: 30,
  },
  empty: {
    paddingVertical: 24,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  bottomSpace: {
    height: 20,
  },
});
