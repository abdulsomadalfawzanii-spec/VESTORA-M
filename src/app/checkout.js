import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import BrandHeader from '../components/BrandHeader.js';
import Field from '../components/Field.js';
import PrimaryButton from '../components/PrimaryButton.js';
import Screen from '../components/Screen.js';
import { formatNaira } from '../lib/format.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';
import { useCart } from '../providers/CartProvider.js';

export default function CheckoutScreen() {
  const { ready, user, request } = useAuth();
  const { items, ready: cartReady, subtotalMinor, clearCart } = useCart();
  const [recipient, setRecipient] = useState(null);
  const [phone, setPhone] = useState(null);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && !user) return <Redirect href="/login" />;
  if (cartReady && items.length === 0 && !orderId) return <Redirect href="/cart" />;
  if (!cartReady) return <ActivityIndicator color={theme.colors.gold} style={styles.loader} />;

  if (orderId) {
    return (
      <Screen scroll>
        <BrandHeader title="Order placed" />
        <Text style={styles.heading}>Your order is reserved.</Text>
        <Text style={styles.description}>
          Order {orderId}. Payment is not confirmed yet; continue from your order history.
        </Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          onPress={() => router.replace('/orders')}
          style={styles.button}
          title="View order history"
        />
      </Screen>
    );
  }

  async function submit() {
    setError('');
    setLoading(true);
    let order;
    try {
      const created = await request('/orders', {
        method: 'POST',
        body: {
          items: items.map(({ product, quantity, size, color }) => ({
            productId: product._id,
            quantity,
            size,
            color,
          })),
          deliveryAddress: {
            recipient: recipient ?? user?.name ?? '',
            phone: phone ?? user?.phone ?? '',
            addressLine,
            city,
            state,
          },
        },
      });
      order = created.order;
      setOrderId(order._id);
      clearCart();

      const initialized = await request('/payments/initialize', {
        method: 'POST',
        body: { orderId: order._id },
      });
      await WebBrowser.openBrowserAsync(initialized.authorizationUrl);
      const verified = await request('/payments/verify', {
        method: 'POST',
        body: { reference: initialized.reference },
      });

      if (verified.payment.status !== 'success') {
        throw new Error('Payment has not been confirmed yet. You can retry from Order history.');
      }

      Alert.alert('Payment confirmed', 'Your order is now being prepared.');
      router.replace('/orders');
    } catch (requestError) {
      setError(
        order
          ? `Order ${order._id} was created, but checkout is not confirmed. ${requestError.message} You can continue payment from Order history.`
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <BrandHeader title="Delivery & payment" action="Bag" />
      <Text style={styles.heading}>Where should it go?</Text>
      <Text style={styles.description}>
        Paystack will securely collect payment. VESTORA never receives or stores your card details.
      </Text>
      <View style={styles.form}>
        <Field
          label="Recipient"
          onChangeText={setRecipient}
          value={recipient ?? user?.name ?? ''}
        />
        <Field
          autoComplete="tel"
          keyboardType="phone-pad"
          label="Phone"
          onChangeText={setPhone}
          value={phone ?? user?.phone ?? ''}
        />
        <Field label="Address" onChangeText={setAddressLine} value={addressLine} />
        <Field label="City" onChangeText={setCity} value={city} />
        <Field label="State" onChangeText={setState} value={state} />
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Order total</Text>
        <Text style={styles.summaryValue}>{formatNaira(subtotalMinor)}</Text>
        <Text style={styles.note}>
          The server recalculates the total from current product prices and stock.
        </Text>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton
        loading={loading}
        onPress={submit}
        style={styles.button}
        title="Continue to secure payment"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
  heading: {
    marginTop: 16,
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 30,
  },
  description: {
    marginTop: 8,
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  form: {
    gap: 14,
    marginTop: 22,
  },
  summary: {
    gap: 7,
    marginTop: 20,
    padding: 17,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  summaryLabel: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  summaryValue: {
    color: theme.colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  note: {
    color: theme.colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  error: {
    marginTop: 16,
    color: theme.colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    marginTop: 18,
  },
});
