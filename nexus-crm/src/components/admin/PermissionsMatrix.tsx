import { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Plus, Pencil, Trash2, Lock, X } from 'lucide-react';
import { usePerfisAdmin, type PermField, type PermissionRow } from '../../hooks/usePerfisAdmin';

/**
 * AUTORIA de perfis de acesso (D18). Colunas = perfis (pré-configurados + criados);
 * linhas = módulos; cada célula tem os toggles de CRUD (role_permissions por perfil).
 * A APLICAÇÃO das permissões (runtime/RLS) é do backend — ver relatório de hand-off.
 */
export function PermissionsMatrix() {
  const {
    perfis,
    permissions,
    modules,
    isLoading,
    isSaving,
    createPerfil,
    renamePerfil,
    removePerfil,
    togglePermission,
  } = usePerfisAdmin();

  const permFor = (perfilId: string, module: string): PermissionRow | undefined =>
    permissions.find((p) => p.perfil_id === perfilId && p.module === module);

  // O perfil-sistema "Master" representa acesso total — bloqueado para edição.
  const isLocked = (nome: string, sistema: boolean) => sistema && nome === 'Master';

  const [nameDialog, setNameDialog] = useState<{ mode: 'create' | 'rename'; id?: string; value: string } | null>(null);

  const handleCreate = () => setNameDialog({ mode: 'create', value: '' });
  const handleRename = (id: string, atual: string) => setNameDialog({ mode: 'rename', id, value: atual });

  const submitName = async (nome: string) => {
    const trimmed = nome.trim();
    if (!trimmed || !nameDialog) return;
    try {
      if (nameDialog.mode === 'create') await createPerfil(trimmed);
      else if (nameDialog.id) await renamePerfil({ id: nameDialog.id, nome: trimmed });
      setNameDialog(null);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao salvar perfil');
    }
  };

  const handleRemove = async (id: string, nome: string) => {
    if (!window.confirm(`Inativar o perfil "${nome}"?`)) return;
    try {
      await removePerfil(id);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao inativar perfil');
    }
  };

  const handleToggle = async (perm: PermissionRow, field: PermField) => {
    try {
      await togglePermission({ id: perm.id, field, value: !perm[field] });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Erro ao atualizar permissão');
    }
  };

  if (isLoading) return <div className="text-center py-10 text-fg-3">Carregando perfis e permissões...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="bg-signal-warning/10 border border-signal-warning/30 p-4 rounded-[8px] flex gap-3 items-start flex-1">
          <Shield className="text-signal-warning shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-signal-warning uppercase tracking-tight">Perfis de acesso</h4>
            <p className="text-xs text-fg-3 mt-1 leading-relaxed">
              Defina o que cada <strong>perfil</strong> pode fazer por módulo. Os perfis-sistema
              (Master, Gestor, Produtor, Operador) não podem ser excluídos. A <strong>aplicação</strong>{' '}
              destas permissões (em runtime e RLS) é responsabilidade do backend.
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] whitespace-nowrap disabled:opacity-50"
        >
          <Plus size={18} /> Novo Perfil
        </button>
      </div>

      <div className="bg-bg-surface rounded-[8px] border border-border-1 overflow-hidden shadow-[var(--shadow-1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-2 border-b border-border-1">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-fg-4 sticky left-0 bg-bg-surface-2">
                  Módulo
                </th>
                {perfis.map((perfil) => (
                  <th key={perfil.id} className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-fg-2">{perfil.nome}</span>
                      {perfil.sistema ? (
                        <span title="Perfil do sistema (não excluível)" className="text-fg-4">
                          <Lock size={12} />
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <button
                            onClick={() => handleRename(perfil.id, perfil.nome)}
                            className="text-fg-4 hover:text-accent-primary transition-colors"
                            title="Renomear"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleRemove(perfil.id, perfil.nome)}
                            className="text-fg-4 hover:text-signal-danger transition-colors"
                            title="Inativar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {perfis.length === 0 && (
                  <th className="px-6 py-5 text-fg-4 text-xs font-medium">Nenhum perfil</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1">
              {modules.map((module) => (
                <tr key={module} className="group hover:bg-bg-surface-2 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-bg-surface group-hover:bg-bg-surface-2">
                    <span className="text-sm font-bold text-fg-1 uppercase tracking-tight">{module}</span>
                  </td>
                  {perfis.map((perfil) => {
                    const perm = permFor(perfil.id, module);
                    const locked = isLocked(perfil.nome, perfil.sistema);
                    if (!perm) return <td key={perfil.id} className="px-6 py-4 text-center text-fg-4">-</td>;
                    return (
                      <td key={perfil.id} className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-center">
                          <div className="flex gap-1.5">
                            <PermissionBadge label="Ler" active={perm.can_read} disabled={isSaving || locked} onClick={() => handleToggle(perm, 'can_read')} />
                            <PermissionBadge label="Criar" active={perm.can_create} disabled={isSaving || locked} onClick={() => handleToggle(perm, 'can_create')} />
                          </div>
                          <div className="flex gap-1.5">
                            <PermissionBadge label="Edit" active={perm.can_update} disabled={isSaving || locked} onClick={() => handleToggle(perm, 'can_update')} />
                            <PermissionBadge label="Del" active={perm.can_delete} disabled={isSaving || locked} onClick={() => handleToggle(perm, 'can_delete')} />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {nameDialog && (
        <PerfilNameDialog
          mode={nameDialog.mode}
          initial={nameDialog.value}
          isSaving={isSaving}
          onClose={() => setNameDialog(null)}
          onSubmit={submitName}
        />
      )}
    </div>
  );
}

function PerfilNameDialog({
  mode,
  initial,
  isSaving,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'rename';
  initial: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (nome: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-md rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <h2 className="text-lg font-black text-fg-1 uppercase tracking-tight">
            {mode === 'create' ? 'Novo Perfil' : 'Renomear Perfil'}
          </h2>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Nome do perfil</label>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(value); }}
            placeholder="Ex: Financeiro, Atendimento..."
            className="mt-1.5 w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium"
          />
        </div>
        <div className="px-6 py-5 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
          <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(value)}
            disabled={isSaving || !value.trim()}
            className="px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PermissionBadge({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all flex items-center gap-1 border ${
        active
          ? 'bg-accent-primary-soft text-accent-primary border-accent-primary/20'
          : 'bg-bg-surface-2 text-fg-4 border-border-1'
      } ${disabled ? 'opacity-80 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
    >
      {active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      {label}
    </button>
  );
}
