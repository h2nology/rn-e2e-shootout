// 条目详情（S6、S7、S21 深链接 rnshootout://item/<id>）
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Label, Screen } from '@/components/ui';
import { api, type Item } from '@/lib/api';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setItem(null);
    api.item(Number(id)).then(setItem, () => setError(true));
  }, [id]);
  return (
    <Screen>
      {item ? (
        <Label testID="item-detail-title" style={{ fontSize: 22, fontWeight: '600' }}>
          {item.title}
        </Label>
      ) : error ? (
        <Label testID="item-detail-error">Not found</Label>
      ) : (
        <ActivityIndicator testID="item-detail-loading" />
      )}
    </Screen>
  );
}
