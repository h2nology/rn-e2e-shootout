// A8 日期选择器（Web）：浏览器原生 <input type="date">（scenarios.md S8）
import { createElement } from 'react';

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return createElement('input', {
    type: 'date',
    'data-testid': 'control-date',
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    style: { fontSize: 16, padding: 10, borderRadius: 8, border: '1px solid #D0D7DE' },
  });
}
