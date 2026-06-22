Select estilizado da marca — para filtros (ramo, status, ano) e formulários.

```jsx
<Select label="Ramo" placeholder="Todos os ramos" options={[
  { value: 'auto', label: 'Auto' },
  { value: 'vida', label: 'Vida' },
  { value: 'saude', label: 'Saúde' },
]} />
```

Passe `options` `[{value,label}]` ou children `<option>`. Tem chevron próprio e ring de foco azul.
