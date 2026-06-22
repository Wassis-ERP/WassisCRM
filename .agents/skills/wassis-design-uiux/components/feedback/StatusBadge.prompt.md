Pílula de status — para indicar estado de apólices, oportunidades e cobranças. Usa SEMPRE tom semântico, nunca cor de ramo.

```jsx
<StatusBadge status="Ativa" />
<StatusBadge status="Pendente" />
<StatusBadge status="Atrasada" />
<StatusBadge status="Renovar" tone="warning" />
```

O tom é inferido do texto (Ativo→success, Pendente→warning, Atrasada→danger…); passe `tone` para forçar. `dot={false}` esconde o ponto.
