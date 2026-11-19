import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import BottomNav from '../components/BottomNav.js';
import BrandHeader from '../components/BrandHeader.js';
import Field from '../components/Field.js';
import PrimaryButton from '../components/PrimaryButton.js';
import Screen from '../components/Screen.js';
import { formatNaira } from '../lib/format.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';

const blankProduct = {
  name: '',
  description: '',
  category: '',
  brand: '',
  priceNaira: '',
  stock: '0',
  sizes: '',
  colors: '',
  imageUrls: [],
};

function splitOptions(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function VendorScreen() {
  const { ready: authReady, user, request } = useAuth();
  const isAuthenticated = Boolean(user);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [shopName, setShopName] = useState(null);
  const [description, setDescription] = useState(null);
  const [contactPhone, setContactPhone] = useState(null);
  const [pickupAddressLine, setPickupAddressLine] = useState(null);
  const [pickupCity, setPickupCity] = useState(null);
  const [pickupState, setPickupState] = useState(null);
  const [productForm, setProductForm] = useState(blankProduct);
  const [selectedImages, setSelectedImages] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadVendor = useCallback(async () => {
    const result = await request('/vendors/me');
    setVendor(result.vendor);
    if (result.vendor?.status === 'approved') {
      const listing = await request('/vendors/me/products');
      setProducts(listing.products);
    } else {
      setProducts([]);
    }
    return result.vendor;
  }, [request]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return undefined;
    let active = true;
    request('/vendors/me')
      .then(async (result) => {
        if (!active) return;
        setVendor(result.vendor);
        if (result.vendor?.status === 'approved') {
          const listing = await request('/vendors/me/products');
          if (active) setProducts(listing.products);
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
  }, [authReady, isAuthenticated, request, user?.id]);

  if (authReady && !user) return <Redirect href="/login" />;

  async function submitApplication() {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await request('/vendors/apply', {
        method: 'POST',
        body: {
          shopName: shopName ?? vendor?.shopName ?? '',
          description: description ?? vendor?.description ?? '',
          contactPhone: contactPhone ?? vendor?.contactPhone ?? user?.phone ?? '',
          pickupAddressLine: pickupAddressLine ?? vendor?.pickupAddressLine ?? '',
          pickupCity: pickupCity ?? vendor?.pickupCity ?? '',
          pickupState: pickupState ?? vendor?.pickupState ?? '',
        },
      });
      setVendor(result.vendor);
      const listing = await request('/vendors/me/products');
      setProducts(listing.products);
      setNotice('Your shop is active. You can publish products now.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshStatus() {
    setLoading(true);
    setError('');
    try {
      await loadVendor();
      setNotice('Shop status refreshed.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function chooseImages() {
    setError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Allow VESTORA access to your photos to add product images.');
        return;
      }
      const remaining = 8 - productForm.imageUrls.length;
      if (remaining <= 0) {
        setError('A product can have up to eight photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.85,
      });
      if (!result.canceled) setSelectedImages(result.assets.slice(0, remaining));
    } catch (pickerError) {
      setError(pickerError.message);
    }
  }

  function startEditing(product) {
    setEditingId(product._id);
    setSelectedImages([]);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand ?? '',
      priceNaira: (product.priceMinor / 100).toFixed(2),
      stock: String(product.stock),
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      imageUrls: product.imageUrls,
    });
  }

  function resetProductForm() {
    setEditingId('');
    setSelectedImages([]);
    setProductForm(blankProduct);
  }

  async function saveProduct() {
    const priceMinor = Math.round(Number(productForm.priceNaira) * 100);
    const stock = Number(productForm.stock);
    if (
      !Number.isSafeInteger(priceMinor) ||
      priceMinor < 1 ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError('Enter a valid product price and whole-number stock quantity.');
      return;
    }
    if (productForm.imageUrls.length + selectedImages.length > 8) {
      setError('A product can have up to eight photos.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const imageUrls = [...productForm.imageUrls];
      for (const [index, asset] of selectedImages.entries()) {
        if (asset.fileSize > 5 * 1024 * 1024) {
          throw new Error('Each photo must be 5 MB or smaller.');
        }
        const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = asset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
        const upload = new FormData();
        upload.append('image', {
          uri: asset.uri,
          name: asset.fileName || `product-${Date.now()}-${index}.${extension}`,
          type: mimeType,
        });
        const uploaded = await request('/uploads/images', { method: 'POST', body: upload });
        imageUrls.push(uploaded.imageUrl);
      }

      const product = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category.trim(),
        brand: productForm.brand.trim(),
        priceMinor,
        stock,
        sizes: splitOptions(productForm.sizes),
        colors: splitOptions(productForm.colors),
        imageUrls,
      };
      await request(
        editingId ? `/products/${editingId}` : '/products',
        { method: editingId ? 'PATCH' : 'POST', body: product },
      );
      await loadVendor();
      resetProductForm();
      setNotice(editingId ? 'Product changes saved.' : 'Product published to your shop.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await request(`/products/${product._id}`, {
        method: 'PATCH',
        body: { isActive: !product.isActive },
      });
      setProducts((current) => current.map((item) => item._id === product._id ? result.product : item));
      setNotice(result.product.isActive ? 'Listing is live.' : 'Listing has been paused.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.body}>
        <Screen scroll>
          <BrandHeader title="Vendor studio" />
          {loading ? (
            <ActivityIndicator color={theme.colors.gold} style={styles.loader} />
          ) : user?.role === 'admin' ? (
            <View style={styles.messageCard}>
              <Text style={styles.heading}>Administrator account</Text>
              <Text style={styles.copy}>Sign in with a customer account to create a vendor shop.</Text>
            </View>
          ) : vendor?.status === 'pending' ? (
            <View style={styles.messageCard}>
              <Text style={styles.eyebrow}>ACTIVATING SHOP</Text>
              <Text style={styles.heading}>Getting {vendor.shopName} ready.</Text>
              <Text style={styles.copy}>Shop activation is automatic. Refresh to continue publishing products.</Text>
              <PrimaryButton loading={saving} onPress={refreshStatus} style={styles.action} title="Refresh access" />
            </View>
          ) : vendor?.status === 'approved' ? (
            <View style={styles.sections}>
              <View style={styles.messageCard}>
                <Text style={styles.eyebrow}>{vendor.shopName.toUpperCase()}</Text>
                <Text style={styles.heading}>Add a piece to your shop.</Text>
                <Text style={styles.copy}>Product photos are uploaded securely. Prices are entered in naira.</Text>
              </View>
              <View style={styles.form}>
                <Field label="Product name" maxLength={160} onChangeText={(value) => setProductForm((current) => ({ ...current, name: value }))} value={productForm.name} />
                <Field label="Category" maxLength={80} onChangeText={(value) => setProductForm((current) => ({ ...current, category: value }))} placeholder="Dresses, tops, bags..." value={productForm.category} />
                <Field label="Brand (optional)" maxLength={120} onChangeText={(value) => setProductForm((current) => ({ ...current, brand: value }))} placeholder="Label or designer" value={productForm.brand} />
                <Field keyboardType="decimal-pad" label="Price (NGN)" onChangeText={(value) => setProductForm((current) => ({ ...current, priceNaira: value }))} value={productForm.priceNaira} />
                <Field keyboardType="number-pad" label="Stock" onChangeText={(value) => setProductForm((current) => ({ ...current, stock: value }))} value={productForm.stock} />
                <Field label="Description" maxLength={4000} multiline onChangeText={(value) => setProductForm((current) => ({ ...current, description: value }))} value={productForm.description} />
                <Field label="Sizes (comma-separated)" onChangeText={(value) => setProductForm((current) => ({ ...current, sizes: value }))} placeholder="XS, S, M, L" value={productForm.sizes} />
                <Field label="Colours (comma-separated)" onChangeText={(value) => setProductForm((current) => ({ ...current, colors: value }))} placeholder="Black, cream, rust" value={productForm.colors} />
                <PrimaryButton onPress={chooseImages} secondary title={`Choose photos (${productForm.imageUrls.length + selectedImages.length}/8)`} />
                {productForm.imageUrls.length > 0 ? (
                  <View style={styles.photoRow}>
                    {productForm.imageUrls.map((url) => (
                      <View key={url} style={styles.photo}>
                        <Image source={{ uri: url }} style={styles.photoImage} />
                        <Pressable accessibilityLabel="Remove product photo" onPress={() => setProductForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((image) => image !== url) }))} style={styles.removePhoto}>
                          <Text style={styles.removePhotoText}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
                {selectedImages.length > 0 ? <Text style={styles.copy}>{selectedImages.length} new photos selected</Text> : null}
                <PrimaryButton loading={saving} onPress={saveProduct} title={editingId ? 'Save product' : 'Publish product'} />
                {editingId ? <PrimaryButton onPress={resetProductForm} secondary title="Cancel editing" /> : null}
              </View>
              <View style={styles.productList}>
                <Text style={styles.listHeading}>Your products ({products.length})</Text>
                {products.map((product) => (
                  <View key={product._id} style={styles.productCard}>
                    {product.imageUrls[0] ? <Image source={{ uri: product.imageUrls[0] }} style={styles.productImage} /> : <View style={[styles.productImage, styles.imagePlaceholder]}><Text style={styles.mark}>V</Text></View>}
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.copy}>{product.category} · {formatNaira(product.priceMinor)} · Stock {product.stock}</Text>
                      <View style={styles.productActions}>
                        <Pressable accessibilityRole="button" onPress={() => startEditing(product)}>
                          <Text style={styles.actionText}>Edit</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" disabled={saving} onPress={() => toggleProduct(product)}>
                          <Text style={styles.actionText}>{product.isActive ? 'Pause listing' : 'Publish listing'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
                {products.length === 0 ? <Text style={styles.copy}>Your published products will appear here.</Text> : null}
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.eyebrow}>{vendor?.status === 'rejected' ? 'UPDATE YOUR APPLICATION' : 'START SELLING'}</Text>
              <Text style={styles.heading}>Tell us about your shop.</Text>
              {vendor?.rejectionReason ? <Text style={styles.error}>Review note: {vendor.rejectionReason}</Text> : null}
              <Field label="Shop name" maxLength={120} onChangeText={setShopName} value={shopName ?? vendor?.shopName ?? ''} />
              <Field label="About your shop" maxLength={1000} multiline onChangeText={setDescription} value={description ?? vendor?.description ?? ''} />
              <Field autoComplete="tel" keyboardType="phone-pad" label="Contact phone" maxLength={32} onChangeText={setContactPhone} value={contactPhone ?? vendor?.contactPhone ?? user?.phone ?? ''} />
              <Field label="Pickup street address" maxLength={240} onChangeText={setPickupAddressLine} value={pickupAddressLine ?? vendor?.pickupAddressLine ?? ''} />
              <Field label="Pickup city" maxLength={100} onChangeText={setPickupCity} value={pickupCity ?? vendor?.pickupCity ?? ''} />
              <Field label="Pickup state" maxLength={100} onChangeText={setPickupState} value={pickupState ?? vendor?.pickupState ?? ''} />
              <Text style={styles.copy}>Your shop activates automatically after you submit your details.</Text>
              <PrimaryButton loading={saving} onPress={submitApplication} title="Create shop and start selling" />
            </View>
          )}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </Screen>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  body: {
    flex: 1,
  },
  loader: {
    marginTop: 36,
  },
  sections: {
    gap: 16,
    paddingBottom: 20,
  },
  messageCard: {
    gap: 10,
    padding: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  eyebrow: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heading: {
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 27,
    lineHeight: 34,
  },
  copy: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  form: {
    gap: 14,
    padding: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  action: {
    marginTop: 6,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photo: {
    position: 'relative',
  },
  photoImage: {
    width: 68,
    height: 82,
    borderRadius: 10,
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.ink,
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 21,
  },
  productList: {
    gap: 12,
    padding: 18,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  listHeading: {
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 24,
  },
  productCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: theme.colors.line,
  },
  productImage: {
    width: 64,
    height: 78,
    borderRadius: 9,
    backgroundColor: '#E9E4DA',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: theme.colors.gold,
    fontFamily: 'Georgia',
    fontSize: 30,
  },
  productDetails: {
    flex: 1,
    gap: 6,
  },
  productName: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  productActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 3,
  },
  actionText: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  error: {
    marginTop: 12,
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  notice: {
    marginTop: 12,
    color: theme.colors.success,
    fontSize: 13,
  },
});
