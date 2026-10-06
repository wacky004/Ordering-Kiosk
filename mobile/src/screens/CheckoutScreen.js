import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colors, money } from '../theme';
import { useKiosk } from '../store';

export default function CheckoutScreen({ onPlaced, onBack }) {
  const { cart, points, quote, placeOrder } = useKiosk();
  const [orderType, setOrderType] = useState('dine-in');
  const [payment, setPayment] = useState('card');
  const [senior, setSenior] = useState(false);
  const [redeem, setRedeem] = useState(0);
  const [placing, setPlacing] = useState(false);

  const totals = useMemo(
    () => quote({ redeemPoints: redeem, seniorCount: senior ? 1 : 0 }),
    [quote, redeem, senior]
  );

  const maxRedeem = totals.maxRedeemable;

  const confirm = () => {
    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder({
        orderType,
        paymentMethod: payment,
        seniorCount: senior ? 1 : 0,
        redeemPoints: redeem,
      });
      setPlacing(false);
      onPlaced(order);
    }, 900);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Your order</Text>
          {cart.map((line) => (
            <View key={line.key} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {line.qty}× {line.name}
              </Text>
              <Text style={styles.itemPrice}>
                {money((line.price + line.options.reduce((s, o) => s + o.delta, 0)) * line.qty)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. How would you like it?</Text>
          <View style={styles.rowChoices}>
            {[
              { key: 'dine-in', label: '🍽️ Dine-in' },
              { key: 'takeout', label: '🥡 Take-out' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.choice, orderType === option.key && styles.choiceActive]}
                onPress={() => setOrderType(option.key)}
              >
                <Text style={orderType === option.key ? styles.choiceTextActive : styles.choiceText}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Senior / PWD discount</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Apply Senior/PWD (VAT-exempt + 20%)</Text>
            <Switch value={senior} onValueChange={setSenior} trackColor={{ true: colors.red }} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Redeem points</Text>
          <Text style={styles.hint}>
            You have {points} points. 100 points = ₱10. Max here: {maxRedeem}
          </Text>
          <View style={styles.rowChoices}>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => setRedeem((value) => Math.max(0, value - 100))}
            >
              <Text style={styles.stepperText}>− 100</Text>
            </TouchableOpacity>
            <Text style={styles.redeemValue}>{redeem} pts</Text>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => setRedeem((value) => Math.min(maxRedeem, value + 100))}
            >
              <Text style={styles.stepperText}>+ 100</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>5. Payment method</Text>
          <View style={styles.rowChoices}>
            {[
              { key: 'card', label: '💳 Card' },
              { key: 'gcash', label: '📱 GCash' },
              { key: 'cash', label: '💵 Cash' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.choice, payment === option.key && styles.choiceActive]}
                onPress={() => setPayment(option.key)}
              >
                <Text style={payment === option.key ? styles.choiceTextActive : styles.choiceText}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Simulated payment - no real money is charged.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order summary</Text>
          <Row label="Subtotal" value={money(totals.subtotal)} />
          {senior ? <Row label="Senior/PWD" value={'-' + money(totals.seniorDiscount)} /> : null}
          <Row label={`Points (${totals.redeemPoints})`} value={'-' + money(totals.pointsDiscount)} />
          <Row label={senior ? 'VAT-exempt sales' : 'VAT (12%)'} value={money(senior ? totals.vatExemptSales : totals.vatAmount)} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{money(totals.total)}</Text>
          </View>
          <Text style={styles.points}>You will earn +{totals.pointsEarned} points</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primary} onPress={confirm} disabled={placing}>
          <Text style={styles.primaryText}>{placing ? 'Processing…' : `Pay ${money(totals.total)}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={onBack}>
          <Text style={styles.ghostText}>Back to cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 12, paddingBottom: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: { fontWeight: '800', fontSize: 16, color: colors.ink, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  itemName: { flex: 1, color: colors.ink },
  itemPrice: { fontWeight: '700', color: colors.ink },
  rowChoices: { flexDirection: 'row', flexWrap: 'wrap' },
  choice: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  choiceActive: { borderColor: colors.red, backgroundColor: colors.redSoft },
  choiceText: { fontWeight: '700', color: colors.ink },
  choiceTextActive: { fontWeight: '800', color: colors.redDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flex: 1, color: colors.ink, marginRight: 12 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6 },
  stepper: {
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  stepperText: { fontWeight: '800', color: colors.ink },
  redeemValue: { fontWeight: '800', fontSize: 16, marginHorizontal: 12, alignSelf: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { color: colors.muted },
  summaryValue: { color: colors.ink, fontWeight: '600' },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: colors.line,
    marginTop: 8,
    paddingTop: 10,
  },
  grandLabel: { fontWeight: '800', fontSize: 18 },
  grandValue: { fontWeight: '800', fontSize: 18, color: colors.red },
  points: { color: colors.green, fontWeight: '700', marginTop: 8 },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card, padding: 16 },
  primary: { backgroundColor: colors.red, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ghost: { paddingVertical: 12, alignItems: 'center' },
  ghostText: { color: colors.muted, fontWeight: '700' },
});
