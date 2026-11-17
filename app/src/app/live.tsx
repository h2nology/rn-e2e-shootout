// A14：每 1 秒轮询服务端，同时保持 WebSocket 长连接（服务端每 500 ms 推送）
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Button, colors, Label, Screen } from '@/components/ui';
import { api, API_URL } from '@/lib/api';

export default function Live() {
  const [poll, setPoll] = useState(0);
  const [ws, setWs] = useState(0);
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      api.poll().then((r) => setPoll(r.tick), () => {});
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws`);
    socket.onmessage = (e) => {
      try {
        setWs(JSON.parse(String(e.data)).n);
      } catch {}
    };
    return () => socket.close();
  }, []);

  return (
    <Screen>
      <Label testID="live-poll">{`Last poll: ${poll}`}</Label>
      <Label testID="live-ws">{`WS: ${ws}`}</Label>
      <TextInput testID="live-name" style={styles.input} value={name} onChangeText={setName} autoCorrect={false} />
      <Button testID="live-submit" title="Submit" onPress={() => api.greet(name).then((r) => setGreeting(r.greeting))} />
      <Label testID="live-greeting">{greeting}</Label>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16 },
});
