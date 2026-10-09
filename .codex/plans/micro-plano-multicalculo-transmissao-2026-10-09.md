# Multicálculo — integridade da transmissão Auto (09/10/2026)

## Escopo e fontes
Governada/contratual. Pedido do usuário: corrigir as lacunas identificadas enquanto Renato aprofunda a investigação SegFy. Referência: instruções/DBML v3.1, decisão 23 e de-para `aggerCoverageMap.ts`. Os contextos de mercado não estão disponíveis neste checkout. O ZIP SegFy é evidência parcial, não contrato de API.

## Decisão sobre legado
Refatorar o envio existente no WAssisBE sem apresentar `quotes.quote_requests` como implementação de `erp.calculos`. Um snapshot tipado de transmissão será persistido junto da solicitação legada, preservando condutor, datas e preferências; não altera o DBML nem substitui as tabelas canônicas. A ligação das telas ao backend exige a etapa canônica abaixo. Nenhum backend será implementado neste repositório frontend.

## Etapas
- [x] Backend: snapshot de transmissão criado por solicitação, validação, persistência relacional e transporte até o adaptador; sem endpoint de edição.
- [x] Backend: impedir substituição silenciosa por segurado/data corrente/coberturas padrão; códigos sem de-para retornam restrição local.
- [x] Backend: distinguir aceite do agregador de resultado concluído e aceitar identidade explícita de seguradora/produto.
- [~] Testes adicionados e continuidade documentada; suíte final bloqueada pelo Controle de Aplicativos do Windows. PostgreSQL/OCR real pendentes.
- [ ] Etapa posterior: serviços canônicos sobre `calculos`, `calc_*`, `calculo_coberturas`, `calculo_execucoes`, `cotacoes` e pagamentos, com escopo e idempotência.
- [ ] Etapa posterior: conectar hooks do frontend às APIs canônicas e persistir apresentações, após contrato disponível.

## Contrato e aceite deste recorte
`POST /api/quotes/requests` recebe extensão aditiva `autoSubmission`; GET devolve o snapshot persistido. Não inventar payload SegFy. Versões com pessoas, datas e limites distintos não podem transmitir o mesmo pedido por defaults. Bônus zero e cobertura zero são valores explícitos. Ausência de snapshot ou mapeamento impede chamada externa segura, sem apagar histórico.

Os tipos `database.ts` já descrevem o domínio canônico e permanecem inalterados; o DTO transitório não deve ser acrescentado como tabela de negócio do frontend. `useCalculos` continua simulado até a etapa canônica estar pronta. Comparativo existente e impressão não equivalem a compartilhamento público ou PDF armazenado.

## Verificação
Backend: restore locked, build Release, auditoria NuGet e modelo EF sem divergência. Testes iniciais encontraram duas falhas (formato DateOnly e coleção EF fixa), corrigidas; reexecução impedida pelo Windows, não considerada aprovada. PostgreSQL real pendente. Frontend apenas documental neste recorte; sem alteração de tela/hook/tipo, dispensando build e navegador. Prompt de continuidade entregue exclusivamente no chat. A remoção incidental de ImageSharp e a conversão OCR para PPM estão registradas no plano técnico do backend; homologação pendente.
