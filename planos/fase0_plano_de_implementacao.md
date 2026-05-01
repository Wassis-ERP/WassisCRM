# Plano de Implementação - Fase 0: Segurança e Fundações de Acesso

O objetivo central desta fase é estabelecer as bases sólidas de autenticação e proteção de rotas do Gestor Wassis (CRM) antes de conectarmos as lógicas vitais de negócio e módulos de pipelines. Garantiremos que a aplicação saiba exatamente "quem" está operando o sistema.

## 1. Mudanças Técnicas Propostas

### 1.1. SDK do Supabase
Vamos configurar o cliente do Supabase para comunicação direta com o backend auth e dados.
- **[NOVO]** `nexus-crm/src/lib/supabase.ts`: Arquivo de inicialização do `supabase-js`, injetando as variáveis de ambiente (URL e `anon_key`).

### 1.2. Gerenciamento de Estado e Autenticação
Construir o gerenciador de sessão que encapsulará os retornos do Supabase e distribuirá o contexto para a aplicação.
- **[NOVO]** `nexus-crm/src/contexts/AuthContext.tsx`: Criação de um Provider usando React Context para escutar logs e mudanças via `supabase.auth.onAuthStateChange`.
- **[NOVO]** `nexus-crm/src/hooks/useAuth.ts`: Hook padronizado para fácil injeção `const { user, session, logout } = useAuth();` dentro dos componentes.

### 1.3. Controle e Bloqueio de Acesso (Rotas Protegidas)
Assegurar que rotas internas jamais sejam acessadas ou pintadas em tela caso não conste uma sessão válida ativa.
- **[NOVO]** `nexus-crm/src/components/layout/PrivateRoute.tsx`: Componente guardião que intercepta renderização de componentes filhos, validando se `user !== null`, redirecionando caso contrário para `/login`.
- **[MODIFICAR]** `nexus-crm/src/App.tsx`: Envolver as páginas do dashboard e menus (`/dashboard`, `/segurados`, etc.) dentro do `<PrivateRoute>`.

### 1.4. Login UI (Premium & Acessível)
- **[NOVO]** `nexus-crm/src/pages/LoginPage.tsx`: Construção de uma interface de Autenticação super limpa e profissional, adotando boas práticas e cores da identidade atual (`background-dark/light`), inputs polidos, validações de erros nativos (ex: E-mail não encontrado) e micro-interações de feedback.

### 1.5. Modelagem Base de Permissões (RBAC)
- **[NOVO]** `nexus-crm/src/types/auth.ts`: Tipagem forte de regras (`Role = 'admin' | 'corretor'`), e mapeamento inicial nos metadados da sessão, deixando a base pronta para restrições modulares (ex: esconder campo de faturamento do corretor).

---

## 2. Perguntas em Aberto

> [!CAUTION]
> **A. Integração Real x Mock Bypass:** Nas nossas conversas anteriores vi que construímos um "bypass" do Supabase dentro de `.Arquivo/wassis`. Na implementação agora desta *Fase 0* pro `nexus-crm`, nós **vamos integrar o Supabase Realmente** ou devo implementar o modo *Bypass/Mock* para acelerar o desenvolvimento de tela ainda sem banco?

> [!IMPORTANT]
> **B. Credenciais `.env`:** Você já obteve o `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` lá do seu Dashboard do Supabase? Se formos pro Real Auth, precisaremos criar um arquivo `.env` para o start da aplicação.

> [!NOTE]
> **C. Telas e Tipologia de Login:** O acesso será fornecido apenas por `E-mail` e `Senha`, concorda? Devemos prever algum tipo de "Esqueci minha senha" nesta versão alfa inicial ou pulamos para não travar?

---

## 3. Plano de Validação

1. **Testar Bloqueio:** Entrar no CRM sem sessão em aba anônima e comprovar que acessar `localhost:5173/dashboard` repulsa o usuário diretamente e prontamente para `/login`.
2. **Testar Autenticação:** Digitar credenciais válidas e garantir que a re-conexão salva o token persistindo no `localStorage`, não deslogando em `Refresh (F5)`.
3. **Testar Deslogue:** Clicar no botão 'Sair' e validar o re-roteamento automático e a limpeza de variáveis do contexto.
