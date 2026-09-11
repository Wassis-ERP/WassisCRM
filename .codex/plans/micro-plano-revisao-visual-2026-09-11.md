# Revisão visual das divergências — 11/09/2026

Escopo governado/documental: transformar o relatório de 10/09 em HTML independente, sem alterar aplicação, configuração ou contrato. Modo visual Read; herdar W.Assis. Finalidade e composição delimitadas pelo pedido: destacar divergências e priorizar atenção.

Fontes: relatório original, instruções/DBML v3.0 (especialmente D12/D18, expansão v2.0 e pessoa_contato), database.ts, platform.ts e hooks de permissões. Não é uma nova auditoria geral nem investigação de incidentes.

## Execução
- [x] HTML com prioridades recomendadas, evidência atual × contrato, impacto potencial e critério de conclusão.
- [x] Inventário completo por tabela, preservando os números e limites do relatório.
- [x] Validar navegação, filtros, desktop 1440 e mobile 390; abrir resultado.

## Decisões
- Legado mantido temporariamente; nenhuma correção funcional neste recorte.
- Risco de integração não equivale a falha de runtime comprovada.
- Campos opcionais/propostos não se tornam automaticamente exigências de UI.
- Priorização editorial: vínculos obrigatórios, permissões e ciclo de acesso; depois nomes e cadastros; decisão de chassi; documentação e ausências esperadas.
- database.ts mantém as divergências já registradas no relatório. Hand-off único permanece parcial; sem endpoints novos.

## Entrega e verificação
- `revisao-front-dbml-visual.html`: documento independente em modo Read, com 11 recomendações, filtros de prioridade, detalhes expansíveis e inventário extraído do relatório original.
- Inventário conferido automaticamente: 11 tabelas, 94 ausentes e 22 extras. Contagem não equivale a novas exigências de UI.
- Conferência adicional: `usePermission.ts` restringe Action a CRUD; `PermissionsMatrix.tsx` descreve autoria CRUD. `pessoa_contato.pf_id` obrigatório no front e opcional no DBML; comentário do DBML explicita resolução atual por join. Parte das adições é proposta segundo as instruções v2.0/v3.0.
- Playwright: cinco filtros, abertura de detalhes e inventário funcionando; 11 recomendações / 11 tabelas; zero erros JS. Desktop 1440×1000 e mobile 390×844, zoom 100%, sem overflow horizontal; screenshots light/dark inspecionados. Evidência: `output/revisao/qa.json` e PNGs.
- Sem testes/build da aplicação: alteração documental independente, sem código executado pelo nexus-crm. Fontes Google têm fallback local; links de evidências dependem da estrutura do repositório.
