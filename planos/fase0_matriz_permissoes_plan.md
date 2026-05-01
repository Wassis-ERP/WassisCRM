# Plano de Implementação: Matriz de Permissões Granular (Fase 0 - Complemento)

Este plano detalha a transição de um modelo simples de "Admin vs Corretor" para uma **Matriz de Capacidades** (Capability Matrix), permitindo controle total sobre o que cada usuário pode fazer em cada módulo do CRM.

## 1. Mudanças no Banco de Dados (Supabase)

### 1.1. Nova Tabela: `public.user_permissions`
Esta tabela será o motor da matriz solicitada.
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `module` (text): Nome do módulo (comercial, financeiro, sinistros, emissao, pos_venda, admin).
- `can_read` (boolean, default: false)
- `can_create` (boolean, default: false)
- `can_update` (boolean, default: false)
- `can_delete` (boolean, default: false)
- `created_at`, `updated_at`

### 1.2. Row Level Security (RLS)
Configuraremos políticas para que:
1. Somente administradores possam alterar esta tabela.
2. Cada usuário possa ler suas próprias permissões (para alimentar o front-end).

---

## 2. Mudanças no Front-end (React)

### 2.1. Tipagem (`src/types/auth.ts`)
Atualizaremos os tipos para suportar o mapa de permissões:
```typescript
export interface ModulePermission {
  module: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions: ModulePermission[];
}
```

### 2.2. Contexto (`src/contexts/AuthContext.tsx`)
O provider agora fará uma query adicional na tabela `user_permissions` logo após o login e armazenará isso em memória para acesso instantâneo.

### 2.3. Hook de Segurança (`src/hooks/usePermission.ts`)
Criaremos uma ferramenta simples para ser usada nos componentes:
```typescript
const { can } = usePermission('financeiro');

// No JSX:
{can('delete') && <Button>Excluir Registro</Button>}
```

---

## 3. Perguntas e Decisões

> [!IMPORTANT]
> **A. Módulos Iniciais:** Além de 'comercial', 'financeiro', 'sinistros', 'emissao' e 'pos_venda', existe algum outro módulo vital que deve constar na matriz inicial?
> 
> **B. Templates de Perfil:** Se você contratar 10 corretores, quer marcar as caixas um por um ou prefere que eu crie "Templates" (ex: Qualquer 'Corretor' já nasce com leitura/escrita no comercial, mas nada no financeiro)?

## 4. Plano de Verificação

1. **SQL Test**: Verificar se uma tentativa de ler o financeiro por um usuário sem a flag `can_read` retorna vazio.
2. **UI Test**: Logar como Corretor e ver se o menu "Financeiro" ou o botão "Excluir" desaparecem visualmente da interface.
