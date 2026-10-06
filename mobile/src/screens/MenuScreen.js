import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, money } from '../theme';
import { useKiosk } from '../store';
import ProductModal from '../components/ProductModal';

export default function MenuScreen() {
  const { menu } = useKiosk();
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(menu.map((item) => item.category)))],
    [menu]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return menu.filter((item) => {
      const inCategory = category === 'All' || item.category === category;
      const matches =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.desc.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle);
      return inCategory && matches;
    });
  }, [menu, category, query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search the menu, e.g. Big Mac, fries..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsContent}
      >
        {categories.map((name) => (
          <TouchableOpacity
            key={name}
            style={[styles.chip, category === name && styles.chipActive]}
            onPress={() => setCategory(name)}
          >
            <Text style={[styles.chipText, category === name && styles.chipTextActive]}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setActive(item)}>
            <View style={styles.media}>
              <Text style={styles.emoji}>{item.icon}</Text>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.foot}>
              <Text style={styles.price}>{money(item.price)}</Text>
              <View style={styles.addBtn}>
                <Text style={styles.addBtnText}>+</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <ProductModal item={active} visible={Boolean(active)} onClose={() => setActive(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    color: colors.ink,
  },
  chips: { marginTop: 10, maxHeight: 48 },
  chipsContent: { paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { fontWeight: '700', color: colors.ink },
  chipTextActive: { color: '#fff' },
  list: { paddingTop: 12, paddingBottom: 24 },
  row: { justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '48.5%',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  media: {
    aspectRatio: 4 / 3,
    backgroundColor: '#fff5e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 44 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#4a3300' },
  name: { fontWeight: '800', color: colors.ink, paddingHorizontal: 10, paddingTop: 8, minHeight: 40 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  price: { color: colors.red, fontWeight: '800', fontSize: 16 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26 },
});
