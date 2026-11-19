import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import BottomNav from '../components/BottomNav.js';
import BrandHeader from '../components/BrandHeader.js';
import PrimaryButton from '../components/PrimaryButton.js';
import { formatNaira } from '../lib/format.js';
import { theme } from '../lib/theme.js';
import { useAuth } from '../providers/AuthProvider.js';

export default function OrdersScreen() {
  const { ready, user, request } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState('');
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await request('/orders');
      setOrders(result.orders);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!ready || !user) return undefined;
    let active = true;
    request('/orders')
      .then((result) => {
        if (active) {
          setOrders(result.orders);
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
  }, [ready, request, user]);

  if (ready && !user) return <Redirect href="/login" />;

  async function continuePayment(order) {
    setActiveOrder(order._id);
    setError('');
    try {
      const initialized = await request('/payments/initialize', {
        method: 'POST',
        body: { orderId: order._id },
      });
      await WebBrowser.openBrowserAsync(initialized.authorizationUrl);
      const result = await request('/payments/verify', {
        method: 'POST',
        body: { reference: initialized.reference },
      });
      if (result.payment.status === 'success') {
        Alert.alert('Payment confirmed', 'Your order is now being prepared.');
        await loadOrders();
      } else {
        setError('Payment is still pending. Try again after completing checkout.');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActiveOrder('');
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <BrandHeader title="Order history" />
        {loading ? (
          <ActivityIndicator color={theme.colors.gold} style={styles.loader} />
        ) : orders.length ? (
          <ScrollView contentContainerStyle={styles.list}>
            {orders.map((order) => (
              <View key={order._id} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.orderNumber}>ORDER · {order._id.slice(-8).toUpperCase()}</Text>
                  <Text style={[styles.status, order.status === 'paid' && styles.paid]}>
                    {order.status.replaceAll('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.items}>
                  {order.items.map((item) => `${item.quantity} × ${item.name}`).join('  ·  ')}
                </Text>
                <View style={styles.row}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.total}>{formatNaira(order.totalMinor)}</Text>
                </View>
                {order.status === 'pending_payment' ? (
                  <PrimaryButton
                    loading={activeOrder === order._id}
                    onPress={() => continuePayment(order)}
                    title="Continue payment"
                  />
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyHeading}>No orders yet.</Text>
            <Text style={styles.date}>Your order history will appear here.</Text>
          </View>
        )}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!loading && error ? (
          <Pressable accessibilityRole="button" onPress={loadOrders}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        ) : null}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    gap: 13,
    padding: 17,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  orderNumber: {
    color: theme.colors.ink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  status: {
    color: theme.colors.gold,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  paid: {
    color: theme.colors.success,
  },
  date: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  items: {
    color: theme.colors.charcoal,
    fontSize: 13,
    lineHeight: 20,
  },
  totalLabel: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  total: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  empty: {
    gap: 10,
    paddingVertical: 36,
  },
  emptyHeading: {
    color: theme.colors.ink,
    fontFamily: 'Georgia',
    fontSize: 27,
  },
  error: {
    marginTop: 14,
    color: theme.colors.danger,
    fontSize: 13,
  },
  retry: {
    marginTop: 10,
    color: theme.colors.ink,
    fontWeight: '700',
  },
});
