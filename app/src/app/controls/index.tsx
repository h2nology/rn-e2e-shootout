// A8：开关、滑块、日期选择器
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { DateField } from '@/components/date-field';
import { Button, Label, Screen } from '@/components/ui';

export default function Controls() {
  const [on, setOn] = useState(false);
  const [slider, setSlider] = useState(0);
  const [date, setDate] = useState('2026-12-01');
  return (
    <Screen>
      <View style={styles.row}>
        <Label>Switch</Label>
        <Switch testID="control-switch" value={on} onValueChange={setOn} />
      </View>
      <Label>{`Slider: ${slider}`}</Label>
      <Slider
        testID="control-slider"
        minimumValue={0}
        maximumValue={100}
        step={25}
        value={slider}
        onValueChange={(v) => setSlider(Math.round(v))}
        style={{ height: 40 }}
      />
      <Label>Date</Label>
      <DateField value={date} onChange={setDate} />
      <Button
        testID="control-submit"
        title="Submit"
        onPress={() =>
          router.push({ pathname: '/controls/result', params: { switch: on ? 'on' : 'off', slider: String(slider), date } })
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } });
