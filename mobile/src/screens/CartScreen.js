import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, money } from '../theme';
import { unitPrice } from '../pricing';
import { useKiosk } from '../store';

export default function CartScreen({ onCheckout }) {
  const { cart, cartSubtotal, setQty, clearCart } = useKiosk();

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
        <Text style={styles.emptyHint}>Add something delicious from the menu.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {cart.map((line) => (
          <View key={line.key} style={styles.line}>
            <Text style={styles.icon}>{line.icon}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{line.name}</Text>
              {line.options.length ? (
                <Text style={styles.options}>{line.options.map((o) => o.name).join(' · ')}</Text>
              ) : null}
              <Text style={styles.unit}>{money(unitPrice(line.price, line.options))} each</Text>
            </View>
            <View style={styles.qty}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(line.key, line.qty - 1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{line.qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(line.key, line.qty + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{money(cartSubtotal)}</Text>
        </View>
        <Text style={styles.points}>You will earn {Math.floor(cartSubtotal)} points</Text>
        <TouchableOpacity style={styles.primary} onPress={onCheckout}>
          <Text style={styles.primaryText}>Proceed to Checkout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={clearCart}>
          <Text style={styles.ghostText}>Clear cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontWeight: '800', fontSize: 18, color: colors.ink, marginTop: 10 },
  emptyHint: { color: colors.muted, marginTop: 4 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: { fontSize: 26, marginRight: 10 },
  info: { flex: 1 },
  name: { fontWeight: '800', color: colors.ink },
  options: { color: colors.muted, fontSize: 12 },
  unit: { color: colors.muted, fontSize: 12 },
  qty: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '800', color: colors.ink },
  qtyValue: { marginHorizontal: 12, fontWeight: '800', fontSize: 16 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
    padding: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.muted, fontWeight: '700' },
  totalValue: { fontWeight: '800', fontSize: 18, color: colors.ink },
  points: { color: colors.green, marginTop: 4, fontWeight: '700' },
  primary: {
    backgroundColor: colors.red,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ghost: { paddingVertical: 12, alignItems: 'center' },
  ghostText: { color: colors.muted, fontWeight: '700' },
});
