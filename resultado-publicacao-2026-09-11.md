# Consolidação do frontend e integração existente — 11/09/2026

O frontend revisado e o contrato DBML/instruções v3.1 foram salvos no commit `7380c9f`. A conciliação incorpora as correções de segurança/publicação de Dev e o acesso HTTP a Segurados/Oportunidades presente em main, sem implementar backend.

## Compatibilidade preservada

- O modo mock mantém multicalculo, cinco cotações, apresentação/PDF, proposta manual e proposta por importação.
- O modo API conserva listagem, detalhe, cadastro e edição dos campos já atendidos pelos endpoints existentes de Segurados e Oportunidades; movimentação de etapa, conclusão e reabertura continuam usando HTTP.
- `backendDomainApi.ts` traduz os DTOs HTTP legados para os tipos canônicos. Campos aposentados (`nome`, `status`, `pipeline_id`, `metadata` em oportunidades; `created_by` em segurados) não retornam a `database.ts`.
- No PUT de oportunidade, seguradora, vigências, follow-up, produção e referências legadas recebidas são preservados. Nenhum novo campo de negócio é introduzido em JSON.
- Grupo, corretora e etapa obrigatórios são conferidos; respostas incompletas não fabricam identificadores. O fim da vigência não é tratado como previsão de fechamento.

## Pendências da equipe de backend

O DTO remoto é anterior ao DBML v3.1. A auditoria estrutural do frontend não significa que essa API já implemente o novo contrato.

| Recorte | Limitação atual no modo API |
| --- | --- |
| Segurados | Celular e WhatsApp separados, telefone secundário, identificação complementar, CNH, profissão/renda, país e data do consentimento ainda não têm campos correspondentes no DTO. Gravação com esses valores é bloqueada antes do envio. |
| Novos leads | A API tem um único nome e não recebe os contatos próprios do lead. O cadastro conectado orienta usar um segurado previamente cadastrado. O fluxo completo permanece disponível no mock. |
| Oportunidades | Prioridade, previsão de fechamento, comissão estimada em valor, campanha, observações internas e contexto da perda dependem da evolução do DTO. Escritas incompatíveis são bloqueadas; os campos do editor sem suporte ficam desabilitados. |
| Renovação | O vínculo legado recebido permanece intacto; criar ou alterar o vínculo exige suporte canônico no backend. |
| Multicalculo e demais módulos | Continuam demonstrativos em memória, conforme escopo frontend. Esta publicação não cria persistência remota para eles. |

Os avisos são explícitos: nenhum campo não suportado é descartado silenciosamente com confirmação de sucesso. Configurações remotas já publicadas foram incorporadas; nenhum arquivo de ambiente local foi substituído.

## Verificação

Resultados finais e estado da publicação são registrados no micro-plano `.codex/plans/micro-plano-publicacao-consolidada-2026-09-11.md`. A publicação em main aciona o workflow existente de homologação; não há disparo manual para produção.
