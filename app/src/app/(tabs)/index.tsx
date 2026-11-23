// Home：A2 列表、A3 防抖搜索、A5 长列表、A6 新增 / 删除、A12 左滑删除 / 下拉刷新 / 长按菜单、A16 错误重试
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { ConfirmModal } from '@/components/confirm-modal';
import { Button, colors, Label } from '@/components/ui';
import { api, type Item } from '@/lib/api';
import { items as itemStore, useStore } from '@/lib/store';

const SEARCH_DEBOUNCE_MS = 300;
// 行高固定（styles.row）。FlatList 用 getItemLayout 而不是实测布局计算渲染窗口：
// 52 dp 在 Android（2.625x）上是 136.5 px，实测行高按像素取整在 51 / 52 dp 间交替，
// 渲染窗口边缘的一行会被无限反复增删（findings.md：S6 FlatList 反复增删）。
const ROW_HEIGHT = 52;

function useDebouncedSearch(query: string) {
  const [results, setResults] = useState<Item[] | null>(null);
  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .items(query)
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);
  return results;
}

function Row({
  item,
  onDelete,
  onLongPress,
}: {
  item: Item & { pending?: boolean };
  onDelete: (id: number) => void;
  onLongPress: (id: number) => void;
}) {
  const id = item.pending ? 'pending' : String(item.id);
  return (
    <Swipeable
      friction={1}
      rightThreshold={40}
      renderRightActions={() => (
        <Pressable testID={`swipe-delete-${id}`} style={styles.swipeDelete} onPress={() => itemStore.remove(item.id)}>
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </Pressable>
      )}>
      <View style={styles.row}>
        <Pressable
          testID={`item-row-${id}`}
          style={styles.rowMain}
          onPress={() => !item.pending && router.push(`/item/${item.id}`)}
          onLongPress={() => onLongPress(item.id)}
          delayLongPress={500}>
          <Text style={styles.rowTitle}>{item.title}</Text>
        </Pressable>
        <Pressable testID={`item-delete-${id}`} hitSlop={8} onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteIcon}>✕</Text>
        </Pressable>
      </View>
    </Swipeable>
  );
}

export default function Home() {
  const { items, status } = useStore((s) => s);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const searchResults = useDebouncedSearch(query);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!loadedOnce.current) {
      loadedOnce.current = true;
      itemStore.load();
    }
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await itemStore.load();
    setRefreshing(false);
  }

  const data = searchResults ?? items;

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          testID="search-input"
          style={styles.search}
          placeholder="Search"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button testID="add-item-button" title="Add" onPress={() => router.push('/add')} />
        <Button testID="list-reload" title="Reload" onPress={() => itemStore.load()} />
      </View>
      <View style={styles.meta}>
        <Label testID="list-top-title">{`Top: ${data[0]?.title ?? ''}`}</Label>
        {searchResults && <Label testID="search-count">{`${searchResults.length} results`}</Label>}
      </View>

      {status === 'error' && !searchResults ? (
        <View testID="error-view" style={styles.center}>
          <Label>Something went wrong</Label>
          <Button testID="error-retry" title="Retry" onPress={() => itemStore.load()} />
        </View>
      ) : status === 'loading' && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator testID="list-loading" size="large" />
        </View>
      ) : (
        <FlatList
          testID="item-list"
          data={data}
          keyExtractor={(i) => String(i.id)}
          getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
          renderItem={({ item }) => <Row item={item} onDelete={setConfirmId} onLongPress={setMenuId} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <ConfirmModal
        visible={confirmId !== null}
        message="Delete this item?"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) itemStore.remove(confirmId);
          setConfirmId(null);
        }}
      />

      <Modal transparent visible={menuId !== null} animationType="none" onRequestClose={() => setMenuId(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuId(null)}>
          <View style={styles.menu}>
            <Button
              testID="menu-pin"
              title="Pin"
              onPress={() => {
                if (menuId !== null) itemStore.pin(menuId);
                setMenuId(null);
              }}
            />
            <Button testID="menu-cancel" title="Cancel" onPress={() => setMenuId(null)} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { flexDirection: 'row', gap: 8, padding: 12, alignItems: 'center' },
  search: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, fontSize: 16 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: ROW_HEIGHT,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowMain: { flex: 1, height: '100%', justifyContent: 'center' },
  rowTitle: { fontSize: 16 },
  deleteIcon: { fontSize: 18, color: colors.muted, paddingHorizontal: 8 },
  swipeDelete: { backgroundColor: colors.danger, justifyContent: 'center', width: 90, alignItems: 'center' },
  swipeDeleteText: { color: 'white', fontWeight: '600' },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menu: { backgroundColor: 'white', padding: 16, borderRadius: 12, gap: 10, width: '60%' },
});
