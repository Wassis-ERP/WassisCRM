import React, { useMemo, useState } from 'react'
import { X, User, Shield, Phone, Mail, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react'
import type { Segurado } from '../contexts/seguradosCore'
import { useIsDocumentoUnique } from '../hooks/useSegurados'
import { formatDocumento, isValidDocumento, onlyDigits } from '../utils/documento'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Segurado>) => Promise<void> | void
}

const baseInput =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium'

/**
 * Modal de cadastro inicial — somente o essencial para identificar a pessoa.
 * Os demais campos (endereço, atribuição, dados específicos por tipo, etc.)
 * são preenchidos na tela de detalhe via `SeguradoModal` completo.
 */
export default function NovoSeguradoModal({ isOpen, onClose, onSave }: Props) {
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PF')
  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [lgpdAutorizado, setLgpdAutorizado] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const isDocumentoUnique = useIsDocumentoUnique()

  const documentoErro = useMemo(() => {
    if (!documento.trim()) return 'Documento é obrigatório'
    if (!isValidDocumento(documento, tipo)) {
      return tipo === 'PF' ? 'CPF inválido' : 'CNPJ inválido'
    }
    if (!isDocumentoUnique(documento)) {
      return 'Já existe outro cadastro com este documento'
    }
    return null
  }, [documento, tipo, isDocumentoUnique])

  const nomeErro = !nome.trim() ? 'Nome é obrigatório' : null
  const lgpdErro = !lgpdAutorizado ? 'É necessário registrar a autorização LGPD' : null

  if (!isOpen) return null

  const handleTipoChange = (next: 'PF' | 'PJ') => {
    setTipo(next)
    setDocumento(formatDocumento(onlyDigits(documento), next))
  }

  const reset = () => {
    setTipo('PF')
    setNome('')
    setDocumento('')
    setEmail('')
    setTelefone('')
    setLgpdAutorizado(false)
    setTouched({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ nome: true, documento: true, lgpd: true })
    if (nomeErro || documentoErro || lgpdErro) return
    setSubmitting(true)
    try {
      await onSave({
        tipo,
        nome: nome.trim(),
        documento: formatDocumento(onlyDigits(documento), tipo),
        email: email.trim() || undefined,
        telefone: telefone.trim() || undefined,
        status: 'Ativo',
        lgpdAutorizado: true,
      })
      reset()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Novo Segurado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cadastro inicial. Os demais dados podem ser preenchidos depois.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTipoChange('PF')}
                className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                  tipo === 'PF'
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40'
                }`}
              >
                Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('PJ')}
                className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                  tipo === 'PJ'
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40'
                }`}
              >
                Pessoa Jurídica
              </button>
            </div>

            {/* Nome */}
            <Field
              label={tipo === 'PF' ? 'Nome completo' : 'Razão social'}
              error={touched.nome ? nomeErro : null}
            >
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                  className={`${baseInput} pl-10`}
                  placeholder={tipo === 'PF' ? 'Ex: Maria da Silva' : 'Ex: Acme Comércio Ltda.'}
                />
              </div>
            </Field>

            {/* Documento */}
            <Field
              label={tipo === 'PF' ? 'CPF' : 'CNPJ'}
              error={touched.documento ? documentoErro : null}
            >
              <div className="relative">
                <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={documento}
                  onChange={(e) => setDocumento(formatDocumento(e.target.value, tipo))}
                  onBlur={() => setTouched((t) => ({ ...t, documento: true }))}
                  className={`${baseInput} pl-10`}
                  placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  inputMode="numeric"
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="E-mail (opcional)">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${baseInput} pl-10`}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </Field>

              <Field label="Telefone (opcional)">
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className={`${baseInput} pl-10`}
                    placeholder="(00) 0 0000-0000"
                  />
                </div>
              </Field>
            </div>

            {/* LGPD */}
            <Field error={touched.lgpd ? lgpdErro : null}>
              <label className="flex items-start gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={lgpdAutorizado}
                  onChange={(e) => {
                    setLgpdAutorizado(e.target.checked)
                    setTouched((t) => ({ ...t, lgpd: true }))
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Confirmo que a pessoa autorizou previamente o uso de seus dados
                  pessoais conforme a LGPD.
                </span>
              </label>
            </Field>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={14} className="text-primary" />
              Você poderá completar o cadastro em seguida.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : 'Criar segurado'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label?: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 ml-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}
