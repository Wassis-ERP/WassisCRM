# Gestão administrativa conectada — 14/09/2026

## Objetivo

Conectar ao WAssisBE as telas já desenhadas para organização, corretoras, usuários, perfis e permissões, removendo o uso do banco em memória desses fluxos quando `VITE_DATA_MODE=backend`.

## Entregue na branch `codex/admin-management-foundation`

- Nova guia **Empresa e Indicadores** em Configurações > Organização.
- Edição dos dados do tenant/grupo pelo endpoint administrativo.
- Indicadores de usuários, convites, corretoras, segurados e oportunidades.
- `Equipe e Acessos` consulta e grava usuários reais no PostgreSQL.
- Ativação e inativação administrativa.
- Vínculo M:N entre usuário e corretoras, com perfil por corretora, vigência e principal.
- Matriz de permissões e perfis cadastráveis conectada ao backend.
- CRUD de Corretoras/Filiais conectado ao backend.
- O modo memória continua disponível apenas em desenvolvimento local; builds implantáveis permanecem fail-closed.

## Decisões preservadas

- `tenant` é o grupo/organização cliente do SaaS.
- `filial` é a corretora/unidade de isolamento.
- Não existe papel global de negócio: o perfil é definido em `profile_filiais` por corretora.
- `perfis.nivel_acesso` é descritivo; permissões efetivas vêm de `role_permissions`.
- As ações ler/criar/editar/excluir/exportar/gerenciar são independentes.
- Escopos válidos: `GRUPO`, `CORRETORA` e `PROPRIO`.

## Limites desta fase

O cadastro cria um `profile` persistente com convite pendente, mas não provisiona credencial nem envia e-mail. O provedor de identidade ainda precisa implementar convite, aceite, expiração, MFA, revogação e sincronização de status. Por isso a interface usa **Adicionar Usuário** e informa que a entrega do convite depende do provedor.

Em 15/09, o indicador foi rotulado **Usuários pendentes** e esclarece que o convite ainda não foi enviado. Se a consulta da empresa ou dos indicadores falhar, a guia exibe erro e opção de nova tentativa, sem converter falha em zero ou sucesso visual. O adapter preserva `perfis.tenant_id` e rejeita escopos de permissão desconhecidos, em vez de transformá-los em `CORRETORA`.

A matriz agora é persistida, mas a autorização de todos os módulos ainda deve ser resolvida e aplicada pelo backend. Esconder um botão no CRM não constitui enforcement.

## Validação local

```powershell
npm test -- --run
$env:VITE_AUTH_MODE='backend'
$env:VITE_DATA_MODE='backend'
$env:VITE_API_BASE_URL='https://api20-hml.wassis.com.br'
npm run build
```

O build pode informar avisos já existentes sobre `VITE_BUILD_SHA` e resolução das fontes no build; eles não impediram a geração do bundle e devem ser tratados em uma etapa própria.

## Estado de verificação em 15/09/2026

`node_modules\.bin\tsc.cmd -b`, `node_modules\.bin\vitest.cmd run` (333 testes), ESLint focado nos arquivos modificados e build Vite com `VITE_AUTH_MODE=backend`, `VITE_DATA_MODE=backend` e URL HTTPS passaram na árvore final. Build sem esses valores foi recusado pelo gate fail-closed, como esperado. Playwright da jornada administrativa com API/PostgreSQL descartáveis ainda não foi executado nesta máquina; não substituir isso por teste de adapter. As demais telas demonstrativas permanecem pendentes de integração real. O contrato de `database.ts` para estas entidades foi comparado ao DBML v3.1: `profiles`, `profile_filiais`, `perfis` e `role_permissions` usam os nomes/ações/escopos vigentes, enquanto a autorização efetiva continua responsabilidade do BE.
