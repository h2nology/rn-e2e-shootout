import { useLocalSearchParams } from 'expo-router';
import { Label, Screen } from '@/components/ui';

export default function ControlsResult() {
  const p = useLocalSearchParams<{ switch: string; slider: string; date: string }>();
  return (
    <Screen>
      <Label testID="control-result">{`switch=${p.switch} slider=${p.slider} date=${p.date}`}</Label>
    </Screen>
  );
}
