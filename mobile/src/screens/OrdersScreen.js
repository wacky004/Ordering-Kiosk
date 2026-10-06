import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, money, statusColors, statusIcons, statusLabels } from '../theme';
import { useKiosk } from '../store';

export default function OrdersScreen() {
  const { orders, advanceOrder, points } = useKiosk();
  const [detail, setDetail] = useState(null);

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🧾</Text>
        <Text style={styles.emptyText}>No orders yet.</Text>
        <Text style={styles.emptyHint}>Your order history will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pointsBar}>
        <Text style={styles.pointsText}>🏅 {points} points available</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {orders.map((order) => {
          const palette = statusColors[order.status];
          return (
            <TouchableOpacity key={order.id} style={styles.card} onPress={() => setDetail(order)}>
              <View style={styles.head}>
                <Text style={styles.code}>{order.code}</Text>
                <View style={[styles.status, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.statusText, { color: palette.fg }]}>
                    {statusIcons[order.status]} {statusLabels[order.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.items} numberOfLines={2}>
                {order.items.map((item) => `${item.qty}× ${item.name}`).join(', ')}
              </Text>
              <View style={styles.foot}>
                <Text style={styles.total}>{money(order.totals.total)}</Text>
                <Text style={styles.earned}>+{order.totals.pointsEarned} pts</Text>
              </View>
              {order.status !== 'completed' && order.status !== 'cancelled' ? (
                <TouchableOpacity
                  style={styles.advance}
                  onPress={(event) => {
                    event.stopPropagation();
                    advanceOrder(order.id);
                  }}
                >
                  <Text style={styles.advanceText}>Advance status (demo) →</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={Boolean(detail)} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ScrollView>
              {detail ? (
                <>
                  <Text style={styles.sheetTitle}>{detail.code}</Text>
                  <Text style={styles.sheetStatus}>
                    {statusIcons[detail.status]} {statusLabels[detail.status]}
                  </Text>
                  <View style={styles.divider} />
                  {detail.items.map((item, index) => (
                    <View key={index} style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>
                        {item.qty}× {item.name}
                        {item.options.length ? ` (${item.options.map((o) => o.name).join(', ')})` : ''}
                      </Text>
                      <Text style={styles.receiptValue}>{money(item.lineTotal)}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <ReceiptRow label="Subtotal" value={money(detail.totals.subtotal)} />
                  {detail.totals.seniorDiscount > 0 ? (
                    <ReceiptRow label="Senior/PWD" value={'-' + money(detail.totals.seniorDiscount)} />
                  ) : null}
                  <ReceiptRow label="Points discount" value={'-' + money(detail.totals.pointsDiscount)} />
                  <ReceiptRow
                    label={detail.totals.vatAmount > 0 ? 'VAT (12%)' : 'VAT-exempt'}
                    value={money(detail.totals.vatAmount)}
                  />
                  <View style={styles.grandRow}>
                    <Text style={styles.grandLabel}>TOTAL</Text>
                    <Text style={styles.grandValue}>{money(detail.totals.total)}</Text>
                  </View>
                  <Text style={styles.receiptFoot}>Thank you for dining with us!</Text>
                </>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.primary} onPress={() => setDetail(null)}>
              <Text style={styles.primaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pointsBar: { backgroundColor: colors.yellow, paddingVertical: 10, alignItems: 'center' },
  pointsText: { fontWeight: '800', color: '#4a3300' },
  list: { padding: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIcon: { fontSize: 52 },
  emptyText: { fontWeight: '800', fontSize: 18, color: colors.ink, marginTop: 10 },
  emptyHint: { color: colors.muted, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontWeight: '800', fontSize: 17, color: colors.ink },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontWeight: '800', fontSize: 11 },
  items: { color: colors.muted, marginTop: 6 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  total: { fontWeight: '800', color: colors.ink },
  earned: { color: colors.green, fontWeight: '700' },
  advance: { marginTop: 10, alignSelf: 'flex-start' },
  advanceText: { color: colors.red, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  sheetTitle: { fontWeight: '800', fontSize: 20, color: colors.ink },
  sheetStatus: { color: colors.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  receiptLabel: { color: colors.muted, flex: 1, marginRight: 8 },
  receiptValue: { color: colors.ink, fontWeight: '600' },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: colors.line,
    marginTop: 8,
    paddingTop: 10,
  },
  grandLabel: { fontWeight: '800', fontSize: 16 },
  grandValue: { fontWeight: '800', fontSize: 16, color: colors.red },
  receiptFoot: { textAlign: 'center', color: colors.muted, marginTop: 14 },
  primary: {
    backgroundColor: colors.red,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
});
