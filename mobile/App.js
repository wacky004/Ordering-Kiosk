import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KioskProvider, useKiosk } from './src/store';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import { colors, money } from './src/theme';

const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 48;

function KioskShell() {
  const { cartCount, points } = useKiosk();
  const [tab, setTab] = useState('menu');
  const [screen, setScreen] = useState('cart');

  const goToCart = () => {
    setTab('cart');
    setScreen('cart');
  };

  const handlePlaced = (order) => {
    setTab('orders');
    Alert.alert(
      'Order placed',
      `${order.code} · ${money(order.totals.total)}\nYou earned ${order.totals.pointsEarned} points.`
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.brand}>McDonald's</Text>
          <Text style={styles.brandSub}>ORDER KIOSK · MOBILE</Text>
        </View>
        <View style={styles.pointsChip}>
          <Text style={styles.pointsText}>🏅 {points}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'menu' ? <MenuScreen /> : null}
        {tab === 'cart'
          ? screen === 'cart'
            ? <CartScreen onCheckout={() => setScreen('checkout')} />
            : <CheckoutScreen onPlaced={handlePlaced} onBack={() => setScreen('cart')} />
          : null}
        {tab === 'orders' ? <OrdersScreen /> : null}
      </View>

      <View style={styles.tabBar}>
        <Tab label="Menu" icon="🍔" active={tab === 'menu'} onPress={() => setTab('menu')} />
        <Tab
          label="Cart"
          icon="🛒"
          badge={cartCount}
          active={tab === 'cart'}
          onPress={goToCart}
        />
        <Tab label="Orders" icon="🧾" active={tab === 'orders'} onPress={() => setTab('orders')} />
      </View>
    </View>
  );
}

function Tab({ label, icon, active, onPress, badge }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <View>
        <Text style={[styles.tabIcon, active && styles.tabActive]}>{icon}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.tabLabel, active && styles.tabActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  return (
    <KioskProvider>
      <KioskShell />
    </KioskProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: TOP_INSET },
  header: {
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#e8ac00', fontWeight: '800', fontSize: 24 },
  headerText: { flex: 1, marginLeft: 10 },
  brand: { color: '#fff', fontWeight: '800', fontSize: 18 },
  brandSub: { color: colors.yellow, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  pointsChip: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pointsText: { color: '#4a3300', fontWeight: '800' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 2 },
  tabActive: { opacity: 1, color: colors.red },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: colors.red,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
