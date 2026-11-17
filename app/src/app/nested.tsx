// A25：纵向列表中嵌套横向轮播
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, Label } from '@/components/ui';

const SLIDES = Array.from({ length: 10 }, (_, i) => i + 1);
const SECTIONS = ['header-1', 'header-2', 'carousel', 'footer-1', 'footer-2', 'footer-3'];

export default function Nested() {
  const [result, setResult] = useState('');
  return (
    <FlatList
      testID="nested-list"
      data={SECTIONS}
      keyExtractor={(s) => s}
      ListHeaderComponent={<Label testID="carousel-result" style={{ padding: 16 }}>{result}</Label>}
      renderItem={({ item }) =>
        item === 'carousel' ? (
          <FlatList
            testID="carousel"
            horizontal
            data={SLIDES}
            keyExtractor={(n) => String(n)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            renderItem={({ item: n }) => (
              <Pressable testID={`carousel-slide-${n}`} style={styles.slide} onPress={() => setResult(`Slide ${n}`)}>
                <Text style={styles.slideText}>{`Slide ${n}`}</Text>
              </Pressable>
            )}
          />
        ) : (
          <View style={styles.block}>
            <Text style={styles.blockText}>{item}</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  slide: { width: 240, height: 160, borderRadius: 12, backgroundColor: '#EEF5FD', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary },
  slideText: { fontSize: 20 },
  block: { height: 140, margin: 16, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  blockText: { color: colors.muted },
});
