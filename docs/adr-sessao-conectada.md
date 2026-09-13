# ADR — sessão do CRM conectado

Data: 13/09/2026. Decisão transitória: conservar bearer no localStorage com JWT curto de homologação; planejar sessão HttpOnly com o provedor definitivo. O mecanismo de HML é exclusivo de Staging e opt-in; não é login de PRD.

| Opção | Benefício | Custo/risco |
|---|---|---|
| JWT localStorage | Compatível com SPA/API em origens separadas | XSS lê token; CSP/validade curta reduzem exposição, não eliminam o risco. Logout local não revoga cópia. |
| Cookie HttpOnly/Secure | JavaScript não lê o segredo | Exige emissão/revogação, SameSite/Domain/CORS, CSRF e testes entre origens. XSS ainda executa ações autenticadas. |
| BFF e cookie de sessão | Tokens do provedor ficam no servidor | Novo componente operacional, store de sessão, proxy, CSRF e configuração de deploy. |

Não trocar Authorization por cookie sem sessão persistida, refresh/revogação e provedor definido. BFF agora exigiria arquitetura e infraestrutura adicionais. Alvo: OIDC Authorization Code + PKCE no BFF, cookie host-only HttpOnly Secure, SameSite adequado, CSRF, sessão revogável e vínculos tenant/corretora/filial/roles resolvidos no servidor.

Mitigações: JWT HML de no máximo 15 minutos, sem refresh; claims ausentes não vêm de snapshot antigo; resposta inválida/401 elimina sessão; timeout/cancelamento; erro sem corpo bruto; links HTTP(S) validados; avatar remoto usa iniciais; CSP restrita; fontes locais; HSTS. Snapshot serve à apresentação, nunca ao enforcement. Não colocar tokens em logs/traces.

Antes de PRD: selecionar provedor, implementar sessões/revogação/MFA conforme política, testar CSRF/CORS/logout/expiração e RBAC persistido. Os 15 minutos aplicam-se ao mecanismo de Staging; Development conserva autenticação local e nunca deve ser publicado como autenticação real.
