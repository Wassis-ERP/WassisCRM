import { apiRequest } from './apiClient';
import {
  clearBackendSession,
  getBackendAccessToken,
  getBackendCurrentUser,
  loginToBackend,
  type BackendLoginResponse,
} from './backendSession';

type BackendError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  stack?: string;
};

type QueryResult<T = any> = {
  data: T | any;
  error: BackendError | null;
  count?: number | null;
};

type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

const asBackendError = (error: unknown): BackendError => ({
  message: error instanceof Error ? error.message : 'Falha ao chamar o WAssisBE.',
});

type BackendSession = {
  access_token: string;
  expires_at?: number;
  user: Awaited<ReturnType<typeof getBackendUserFromMe>>;
};

class BackendQueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private operation: QueryOperation = 'select';
  private selection = '*';
  private filters: Array<{ operator: string; column: string; value: unknown }> = [];
  private modifiers: Record<string, unknown> = {};
  private payload: unknown;
  private expectsSingle = false;
  private readonly table: string;

  constructor(table: string) {
    this.table = table;
  }

  select(selection = '*', options?: Record<string, unknown>): this {
    this.operation = 'select';
    this.selection = selection;
    this.modifiers.selectOptions = options;
    return this;
  }

  insert(payload: unknown): this {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: unknown): this {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload: unknown, options?: Record<string, unknown>): this {
    this.operation = 'upsert';
    this.payload = payload;
    this.modifiers.upsertOptions = options;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  single(): this {
    this.expectsSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.expectsSingle = true;
    this.modifiers.maybeSingle = true;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ operator: 'eq', column, value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ operator: 'neq', column, value });
    return this;
  }

  in(column: string, value: unknown): this {
    this.filters.push({ operator: 'in', column, value });
    return this;
  }

  ilike(column: string, value: unknown): this {
    this.filters.push({ operator: 'ilike', column, value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ operator: 'gte', column, value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ operator: 'lte', column, value });
    return this;
  }

  contains(column: string, value: unknown): this {
    this.filters.push({ operator: 'contains', column, value });
    return this;
  }

  or(expression: string): this {
    this.modifiers.or = expression;
    return this;
  }

  order(column: string, options?: Record<string, unknown>): this {
    this.modifiers.order = { column, options };
    return this;
  }

  limit(count: number): this {
    this.modifiers.limit = count;
    return this;
  }

  range(from: number, to: number): this {
    this.modifiers.range = { from, to };
    return this;
  }

  async execute(): Promise<QueryResult<T>> {
    try {
      const data = await apiRequest<T>('/api/data-gateway/query', {
        method: 'POST',
        accessToken: getBackendAccessToken(),
        body: {
          table: this.table,
          operation: this.operation,
          selection: this.selection,
          filters: this.filters,
          modifiers: this.modifiers,
          payload: this.payload,
          single: this.expectsSingle,
        },
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: asBackendError(error) };
    }
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const session = await loginToBackend(email, password);
        return { data: { user: toBackendUser(session), session: toBackendSession(session) }, error: null };
      } catch (error) {
        return { data: { user: null, session: null }, error: asBackendError(error) };
      }
    },

    async signOut() {
      clearBackendSession();
      notifyAuthSubscribers(null);
      return { error: null };
    },

    async getSession() {
      const accessToken = getBackendAccessToken();
      return {
        data: {
          session: accessToken
            ? {
                access_token: accessToken,
                user: await getBackendUserFromMe(),
              }
            : null,
        },
        error: null,
      };
    },

    async refreshSession() {
      return this.getSession();
    },

    async getUser() {
      return { data: { user: await getBackendUserFromMe() }, error: null };
    },

    onAuthStateChange(callback: (_event: string, session: BackendSession | null) => void) {
      authSubscribers.add(callback);
      void this.getSession().then(({ data }) => callback('INITIAL_SESSION', data.session));
      return {
        data: {
          subscription: {
            unsubscribe: () => authSubscribers.delete(callback),
          },
        },
      };
    },
  },

  from<T = any>(table: string) {
    return new BackendQueryBuilder<T>(table);
  },

  async rpc<T = any>(name: string, params?: Record<string, unknown>): Promise<QueryResult<T>> {
    try {
      const data = await apiRequest<T>(`/api/data-gateway/rpc/${name}`, {
        method: 'POST',
        accessToken: getBackendAccessToken(),
        body: params ?? {},
      });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: asBackendError(error) };
    }
  },

  functions: {
    async invoke<T = any>(name: string, options?: { body?: unknown }): Promise<QueryResult<T>> {
      try {
        const data = await apiRequest<T>(`/api/functions/${name}`, {
          method: 'POST',
          accessToken: getBackendAccessToken(),
          body: options?.body ?? {},
        });
        return { data, error: null };
      } catch (error) {
        return { data: null, error: asBackendError(error) };
      }
    },
  },
};

const authSubscribers = new Set<(_event: string, session: BackendSession | null) => void>();

function notifyAuthSubscribers(session: BackendSession | null) {
  authSubscribers.forEach(callback => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
}

function toBackendUser(session: BackendLoginResponse) {
  return {
    id: session.userId,
    email: '',
    created_at: new Date().toISOString(),
    app_metadata: {
      tenant_id: session.tenantId,
      brokerage_id: session.brokerageId,
      seller_id: session.sellerId,
      user_type: session.userType,
      roles: session.roles,
    },
  };
}

function toBackendSession(session: BackendLoginResponse) {
  return {
    access_token: session.accessToken,
    expires_at: Math.floor(new Date(session.expiresAtUtc).getTime() / 1000),
    user: toBackendUser(session),
  };
}

async function getBackendUserFromMe() {
  const token = getBackendAccessToken();
  if (!token) {
    return null;
  }

  try {
    const me = await getBackendCurrentUser();
    return {
      id: me.userId ?? '',
      email: '',
      created_at: new Date().toISOString(),
      app_metadata: {
        tenant_id: me.tenantId,
        brokerage_id: me.brokerageId,
        seller_id: me.sellerId,
        user_type: me.userType,
        roles: me.roles,
      },
    };
  } catch {
    clearBackendSession();
    return null;
  }
}
