import { useMemo, useState, type FormEvent } from 'react'
import { Link2 } from 'lucide-react'
import { useSegurados } from '../hooks/useSegurados'
import type { PessoaContato } from '../contexts/seguradosCore'
import AppModal from './modals/AppModal'

export interface PessoaContatoFormValue {
  contatoId: string
  nome: string; cargo: string; departamento: string; email: string; telefone: string; celular: string; observacoes: string
  principal: boolean; ativo: boolean
}
interface Props {
  isOpen: boolean; onClose: () => void; pessoaAtualId: string; ladoAtual: 'PF' | 'PJ'
  vinculo?: PessoaContato | null; idsJaVinculados: string[]
  onSubmit: (value: PessoaContatoFormValue) => Promise<void> | void
}
const fields = [['nome','Nome do contato'],['cargo','Cargo'],['departamento','Departamento'],['email','Email'],['telefone','Telefone'],['celular','Celular'],['observacoes','Observações']] as const
const inputClass = 'w-full mt-1 px-3 py-2.5 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-md text-sm focus:outline-2 focus:outline-accent-primary'

export default function PessoaContatoModal({isOpen,onClose,pessoaAtualId,ladoAtual,vinculo,idsJaVinculados,onSubmit}:Props) {
  const {data:rows}=useSegurados()
  const options=useMemo(()=>{
    const current=rows?.find(r=>r.id===pessoaAtualId)
    return (rows??[]).filter(r=>r.tipo!==ladoAtual&&r.filial_id===current?.filial_id&&!idsJaVinculados.includes(r.id))
  },[rows,pessoaAtualId,ladoAtual,idsJaVinculados])
  const [form,setForm]=useState<PessoaContatoFormValue>({
    contatoId:(ladoAtual==='PJ'?vinculo?.pfId:vinculo?.pjId)??'',
    nome:vinculo?.nome??'',cargo:vinculo?.cargo??'',departamento:vinculo?.departamento??'',email:vinculo?.dadosProprios?.email??'',telefone:vinculo?.dadosProprios?.telefone??'',celular:vinculo?.dadosProprios?.celular??'',observacoes:vinculo?.observacoes??'',principal:vinculo?.principal??false,ativo:vinculo?.ativo??true,
  })
  const [saving,setSaving]=useState(false);const [error,setError]=useState('')
  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('')
    if(ladoAtual==='PF'&&!form.contatoId){setError('Selecione a empresa.');return}
    if(ladoAtual==='PJ'&&!form.contatoId&&!form.nome.trim()){setError('Informe o nome do contato ou vincule uma pessoa física.');return}
    setSaving(true)
    try{await onSubmit(form);onClose()}catch(e){setError(e instanceof Error?e.message:'Erro ao salvar contato.')}finally{setSaving(false)}
  }
  return <AppModal isOpen={isOpen} onClose={onClose} title={vinculo?'Editar contato':ladoAtual==='PJ'?'Adicionar contato à empresa':'Vincular pessoa a uma empresa'} icon={<Link2 size={18}/>} size="lg" isDismissDisabled={saving}>
    <form onSubmit={submit}>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto">
        <label className="sm:col-span-2 text-xs font-bold text-fg-3">{ladoAtual==='PJ'?'Pessoa física vinculada (opcional)':'Empresa'}
          <select aria-label={ladoAtual==='PJ'?'Pessoa física vinculada (opcional)':'Empresa'} value={form.contatoId} disabled={!!vinculo} onChange={e=>setForm({...form,contatoId:e.target.value})} className={inputClass}>
            <option value="">{ladoAtual==='PJ'?'Sem cadastro PF vinculado':'Selecione a empresa'}</option>
            {vinculo&&form.contatoId&&<option value={form.contatoId}>{ladoAtual==='PJ'?vinculo.pfNome:vinculo.pjNome}</option>}
            {options.map(r=><option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </label>
        {ladoAtual==='PJ'&&<p className="sm:col-span-2 text-xs text-fg-3">Os dados abaixo são deste contato na empresa. Campos vazios usam os dados da pessoa vinculada, quando houver.</p>}
        {fields.map(([key,label])=><label key={key} className={'text-xs font-bold text-fg-3 '+(key==='observacoes'?'sm:col-span-2':'')}>{label}
          <input type={key==='email'?'email':'text'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className={inputClass}/>
        </label>)}
        <label className="text-sm text-fg-2 flex gap-2"><input type="checkbox" checked={form.principal} disabled={!form.ativo} onChange={e=>setForm({...form,principal:e.target.checked})}/>Contato principal</label>
        <label className="text-sm text-fg-2 flex gap-2"><input type="checkbox" checked={form.ativo} onChange={e=>setForm({...form,ativo:e.target.checked,principal:e.target.checked&&form.principal})}/>Contato ativo</label>
        {error&&<p role="alert" className="sm:col-span-2 text-sm text-signal-danger">{error}</p>}
      </div>
      <div className="p-5 border-t border-border-1 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-md text-fg-2 hover:bg-bg-surface-2">Cancelar</button>
        <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-accent-primary text-fg-on-brand hover:bg-accent-primary-hover disabled:opacity-50">{saving?'Salvando…':'Salvar contato'}</button>
      </div>
    </form>
  </AppModal>
}
