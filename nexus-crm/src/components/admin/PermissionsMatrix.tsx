import { usePermissionsAdmin } from '../../hooks/usePermissionsAdmin';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import type { Role, ModulePermission } from '../../types/auth';

const ROLES: Role[] = ['admin', 'vendedor', 'visualizador'];

export function PermissionsMatrix() {
  const { permissions, updatePermission, isUpdating, isLoading } = usePermissionsAdmin();

  // Agrupar permissões por módulo para facilitar a renderização da matriz
  const modules = Array.from(new Set(permissions.map(p => p.module)));

  const handleToggle = async (permissionId: string, field: keyof ModulePermission, currentValue: boolean) => {
    try {
      await updatePermission({ id: permissionId, field, value: !currentValue });
    } catch (err) {
      console.error('Erro ao atualizar permissão:', err);
    }
  };

  if (isLoading) return <div className="text-center py-10 text-fg-3">Carregando matriz de permissões...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-signal-warning/10 border border-signal-warning/30 p-4 rounded-[14px] flex gap-3 items-start">
        <Shield className="text-signal-warning shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-bold text-signal-warning uppercase tracking-tight">Aviso de Segurança</h4>
          <p className="text-xs text-fg-3 mt-1 leading-relaxed">
            Alterações nesta matriz afetam <strong>todos</strong> os usuários vinculados ao cargo selecionado. 
            Use com cautela para garantir a conformidade com a LGPD e o sigilo de dados.
          </p>
        </div>
      </div>

      <div className="bg-bg-surface rounded-[14px] border border-border-1 overflow-hidden shadow-[var(--shadow-1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-2 border-b border-border-1">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-fg-4">Módulo / Funcionalidade</th>
                {ROLES.map(role => (
                  <th key={role} className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-fg-4">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1">
              {modules.map(module => (
                <tr key={module} className="group hover:bg-bg-surface-2 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-fg-1 uppercase tracking-tight">{module}</span>
                      <span className="text-[10px] text-fg-4 font-medium">Permissões de CRUD</span>
                    </div>
                  </td>
                  {ROLES.map(role => {
                    const perm = permissions.find(p => p.module === module && p.role === role);
                    if (!perm) return <td key={role} className="px-6 py-4 text-center text-fg-4">-</td>;

                    return (
                      <td key={role} className="px-6 py-4">
                        <div className="flex flex-col gap-2 items-center">
                          {/* Ações: Ver, Criar, Editar, Excluir */}
                          <div className="flex gap-1.5">
                            <PermissionBadge 
                              label="Ler" 
                              active={perm.can_read} 
                              disabled={isUpdating || role === 'admin'} 
                              onClick={() => handleToggle(perm.id, 'can_read', perm.can_read)} 
                            />
                            <PermissionBadge 
                              label="Criar" 
                              active={perm.can_create} 
                              disabled={isUpdating || role === 'admin'} 
                              onClick={() => handleToggle(perm.id, 'can_create', perm.can_create)} 
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <PermissionBadge 
                              label="Edit" 
                              active={perm.can_update} 
                              disabled={isUpdating || role === 'admin'} 
                              onClick={() => handleToggle(perm.id, 'can_update', perm.can_update)} 
                            />
                            <PermissionBadge 
                              label="Del" 
                              active={perm.can_delete} 
                              disabled={isUpdating || role === 'admin'} 
                              onClick={() => handleToggle(perm.id, 'can_delete', perm.can_delete)} 
                            />
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
    </div>
  );
}

function PermissionBadge({ label, active, onClick, disabled }: { 
  label: string, 
  active: boolean, 
  onClick: () => void,
  disabled?: boolean 
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
