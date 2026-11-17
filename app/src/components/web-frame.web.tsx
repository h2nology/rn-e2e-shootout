import { createElement, useEffect } from 'react';

export function WebFrame({ uri, onMessage }: { uri: string; onMessage: (m: string) => void }) {
  useEffect(() => {
    const handler = (e: MessageEvent) => typeof e.data === 'string' && onMessage(e.data);
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);
  return createElement('iframe', { src: uri, 'data-testid': 'webview', style: { flex: 1, border: 0, width: '100%', height: '100%' } });
}
