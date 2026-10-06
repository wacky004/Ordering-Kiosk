import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, money } from '../theme';
import { unitPrice } from '../pricing';
import { useKiosk } from '../store';

export default function ProductModal({ item, visible, onClose }) {
  const { optionsByCategory, addToCart } = useKiosk();
  const groups = optionsByCategory[item?.category] || [];
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState(() => {
    const initial = {};
    (optionsByCategory[item?.category] || []).forEach((group) => {
      if (group.type === 'single') {
        const first = group.choices[0];
        if (first) initial[`${group.name}:${first.name}`] = true;
      }
    });
    return initial;
  });

  const chosen = useMemo(() => {
    const result = [];
    groups.forEach((group) => {
      group.choices.forEach((choice) => {
        if (selected[`${group.name}:${choice.name}`]) {
          result.push({ name: choice.name, group: group.name, delta: choice.delta });
        }
      });
    });
    return result;
  }, [groups, selected]);

  if (!item) return null;

  const total = unitPrice(item.price, chosen) * qty;

  const toggle = (group, choice) => {
    setSelected((current) => {
      const key = `${group.name}:${choice.name}`;
      if (group.type === 'single') {
        const next = { ...current };
        group.choices.forEach((c) => delete next[`${group.name}:${c.name}`]);
        next[key] = true;
        return next;
      }
      return { ...current, [key]: !current[key] };
    });
  };

  const confirm = () => {
    addToCart(item, chosen, qty);
    setQty(1);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>{item.desc}</Text>

            {groups.map((group) => (
              <View key={group.name} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupHint}>
                    {group.type === 'single' ? 'Choose one' : 'Choose any'}
                  </Text>
                </View>
                <View style={styles.choices}>
                  {group.choices.map((choice) => {
                    const active = Boolean(selected[`${group.name}:${choice.name}`]);
                    return (
                      <TouchableOpacity
                        key={choice.name}
                        style={[styles.choice, active && styles.choiceActive]}
                        onPress={() => toggle(group, choice)}
                      >
                        <Text style={[styles.choiceName, active && styles.choiceNameActive]}>
                          {choice.name}
                        </Text>
                        <Text style={styles.choiceDelta}>
                          {choice.delta ? `+${money(choice.delta)}` : 'Included'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.primary} onPress={confirm}>
            <Text style={styles.primaryText}>Add to Order · {money(total)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghost} onPress={onClose}>
            <Text style={styles.ghostText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  icon: { fontSize: 46, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: colors.ink },
  desc: { color: colors.muted, textAlign: 'center', marginBottom: 12 },
  group: { marginTop: 14 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  groupName: { fontWeight: '800', color: colors.ink },
  groupHint: { color: colors.muted, fontSize: 12 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  choice: {
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 110,
  },
  choiceActive: { borderColor: colors.red, backgroundColor: colors.redSoft },
  choiceName: { fontWeight: '700', color: colors.ink },
  choiceNameActive: { color: colors.redDark },
  choiceDelta: { color: colors.muted, fontSize: 12 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  qtyBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 24, fontWeight: '800', color: colors.ink },
  qtyValue: { fontSize: 20, fontWeight: '800', marginHorizontal: 22 },
  primary: {
    backgroundColor: colors.red,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ghost: { paddingVertical: 12, alignItems: 'center' },
  ghostText: { color: colors.muted, fontWeight: '700' },
});
