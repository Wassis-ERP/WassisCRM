import React, { useMemo, useState } from 'react'
import {
  X, User, Shield, Phone, Mail, MapPin, Hash, Building2, Globe, IdCard,
  CalendarDays, Briefcase, Users, ShieldCheck, AlertCircle,
} from 'lucide-react'
import type {
  EstadoCivil,
  PorteEmpresa,
  Segurado,
  SexoPessoa,
  StatusPessoa,
} from '../contexts/seguradosCore'
import { useIsDocumentoUnique, useProdutoresLookup } from '../hooks/useSegurados'
import {
  formatDocumento,
  isValidDocumento,
  onlyDigits,
} from '../utils/documento'

interface SeguradoModalProps {
  isOpen: boolean
  onClose: () => void
  segurado?: Segurado | null
  onSave: (data: Partial<Segurado>) => void | Promise<void>
}

const STATUS_OPTIONS: Array<{ value: StatusPessoa; label: string }> = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Inativo', label: 'Inativo' },
  { value: 'Prospecto', label: 'Prospecto' },
]

const SEXO_OPTIONS: Array<{ value: SexoPessoa; label: string }> = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
]

const ESTADO_CIVIL_OPTIONS: Array<{ value: EstadoCivil; label: string }> = [
  { value: 'Solteiro', label: 'Solteiro(a)' },
  { value: 'Casado', label: 'Casado(a)' },
  { value: 'Divorciado', label: 'Divorciado(a)' },
  { value: 'Viuvo', label: 'Viúvo(a)' },
  { value: 'UniaoEstavel', label: 'União Estável' },
]

const PORTE_OPTIONS: Array<{ value: PorteEmpresa; label: string }> = [
  { value: 'MEI', label: 'MEI' },
  { value: 'Microempresa', label: 'Microempresa' },
  { value: 'PequenoPorte', label: 'Pequeno Porte' },
  { value: 'MedioPorte', label: 'Médio Porte' },
  { value: 'GrandePorte', label: 'Grande Porte' },
]

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-accent-primary">
        <Icon size={16} />
        <h3 className="text-xs font-black uppercase tracking-widest">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  span,
  hint,
  error,
  children,
}: {
  label: string
  span?: 1 | 2
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${span === 2 ? 'md:col-span-2' : ''}`}>
      <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-signal-danger flex items-center gap-1 ml-1">
          <AlertCircle size={12} /> {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-fg-4 ml-1">{hint}</p>
      ) : null}
    </div>
  )
}

const baseInput =
  'w-full px-4 py-3 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium'

function defaultForm(seg?: Segurado | null): Partial<Segurado> {
  if (seg) {
    return {
      ...seg,
      // Garante defaults caso o cadastro venha legado sem esses campos.
      status: seg.status ?? 'Ativo',
      lgpdAutorizado: seg.lgpdAutorizado ?? false,
    }
  }
  return {
    tipo: 'PF',
    nome: '',
    documento: '',
    status: 'Ativo',
    lgpdAutorizado: false,
    email: '',
    telefone: '',
    chatwootId: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    produtorId: null,
    gerenteId: null,
  }
}

export default function SeguradoModal({
  isOpen,
  onClose,
  segurado,
  onSave,
}: SeguradoModalProps) {
  const [formData, setFormData] = useState<Partial<Segurado>>(() => defaultForm(segurado))
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isDocumentoUnique = useIsDocumentoUnique()
  const { options: produtorOptions } = useProdutoresLookup()

  const tipo = formData.tipo ?? 'PF'

  const documentoErro = useMemo(() => {
    const doc = formData.documento ?? ''
    if (!doc) return 'Documento é obrigatório'
    if (!isValidDocumento(doc, tipo)) {
      return tipo === 'PF' ? 'CPF inválido' : 'CNPJ inválido'
    }
    if (!isDocumentoUnique(doc, segurado?.id)) {
      return 'Já existe outro cadastro com este documento'
    }
    return null
  }, [formData.documento, tipo, isDocumentoUnique, segurado?.id])

  const nomeErro = !formData.nome?.trim() ? 'Nome é obrigatório' : null
  const lgpdErro = !formData.lgpdAutorizado
    ? 'É necessário registrar a autorização LGPD'
    : null

  if (!isOpen) return null

  const update = <K extends keyof Segurado>(key: K, value: Segurado[K] | undefined) => {
    setFormData((prev) => ({ ...prev, [key]: value as Segurado[K] }))
  }

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ nome: true, documento: true, lgpd: true })
    if (nomeErro || documentoErro || lgpdErro) return
    setSubmitting(true)
    try {
      // Normaliza documento ao salvar (mantém máscara para exibição, mas a
      // unicidade trabalha com dígitos).
      await onSave({
        ...formData,
        documento: formatDocumento(onlyDigits(formData.documento ?? ''), tipo),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleTipoChange = (next: 'PF' | 'PJ') => {
    setFormData((prev) => {
      // Reformata documento conforme novo tipo e limpa campos do tipo anterior.
      const docDigits = onlyDigits(prev.documento ?? '')
      const refreshed: Partial<Segurado> = {
        ...prev,
        tipo: next,
        documento: formatDocumento(docDigits, next),
      }
      if (next === 'PF') {
        refreshed.nomeFantasia = undefined
        refreshed.cnae = undefined
        refreshed.porte = undefined
        refreshed.site = undefined
      } else {
        refreshed.dataNascimento = undefined
        refreshed.sexo = undefined
        refreshed.estadoCivil = undefined
      }
      return refreshed
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-3xl rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight">
                {segurado ? 'Editar Segurado' : 'Novo Segurado'}
              </h2>
              <p className="text-xs text-fg-3 mt-0.5">
                Cadastro unificado de pessoa (PF/PJ) — PRD v1.0
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-8">
            {/* 1) Identificação ----------------------------------------- */}
            <Section title="Identificação" icon={IdCard}>
              <Field label="Tipo">
                <select
                  value={tipo}
                  onChange={(e) => handleTipoChange(e.target.value as 'PF' | 'PJ')}
                  className={baseInput}
                >
                  <option value="PF">Pessoa Física (CPF)</option>
                  <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={formData.status ?? 'Ativo'}
                  onChange={(e) => update('status', e.target.value as StatusPessoa)}
                  className={baseInput}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>

              <Field
                label={tipo === 'PF' ? 'Nome completo' : 'Razão social'}
                span={2}
                error={touched.nome ? nomeErro ?? undefined : undefined}
              >
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    type="text"
                    required
                    value={formData.nome ?? ''}
                    onBlur={() => markTouched('nome')}
                    onChange={(e) => update('nome', e.target.value)}
                    className={`${baseInput} pl-10`}
                    placeholder={tipo === 'PF' ? 'Ex: Maria da Silva' : 'Ex: Acme Comércio Ltda.'}
                  />
                </div>
              </Field>

              {tipo === 'PJ' && (
                <Field label="Nome fantasia" span={2}>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                    <input
                      type="text"
                      value={formData.nomeFantasia ?? ''}
                      onChange={(e) => update('nomeFantasia', e.target.value)}
                      className={`${baseInput} pl-10`}
                      placeholder="Ex: Acme Tech"
                    />
                  </div>
                </Field>
              )}

              <Field
                label={tipo === 'PF' ? 'CPF' : 'CNPJ'}
                error={touched.documento ? documentoErro ?? undefined : undefined}
              >
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    type="text"
                    required
                    value={formData.documento ?? ''}
                    onBlur={() => markTouched('documento')}
                    onChange={(e) =>
                      update('documento', formatDocumento(e.target.value, tipo))
                    }
                    className={`${baseInput} pl-10`}
                    placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    inputMode="numeric"
                  />
                </div>
              </Field>

              <Field label="ChatWoot ID">
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    type="text"
                    value={formData.chatwootId ?? ''}
                    onChange={(e) => update('chatwootId', e.target.value)}
                    className={`${baseInput} pl-10`}
                    placeholder="#CW-0000"
                  />
                </div>
              </Field>

              <Field
                label="LGPD — autorização de uso de dados"
                span={2}
                error={touched.lgpd ? lgpdErro ?? undefined : undefined}
              >
                <label className="flex items-start gap-3 px-4 py-3 bg-bg-surface-2 border border-border-1 rounded-[6px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.lgpdAutorizado}
                    onChange={(e) => {
                      update('lgpdAutorizado', e.target.checked)
                      markTouched('lgpd')
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-border-2 text-accent-primary focus:ring-accent-primary"
                  />
                  <span className="text-xs text-fg-2 leading-relaxed">
                    A pessoa autorizou previamente o uso de seus dados pessoais
                    conforme a LGPD. A data da autorização é registrada
                    automaticamente no momento do cadastro.
                  </span>
                </label>
              </Field>
            </Section>

            {/* 2) Contato ---------------------------------------------- */}
            <Section title="Contato" icon={Phone}>
              <Field label="E-mail">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    type="email"
                    value={formData.email ?? ''}
                    onChange={(e) => update('email', e.target.value)}
                    className={`${baseInput} pl-10`}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </Field>

              <Field label="Telefone / WhatsApp">
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                  <input
                    type="text"
                    value={formData.telefone ?? ''}
                    onChange={(e) => update('telefone', e.target.value)}
                    className={`${baseInput} pl-10`}
                    placeholder="(00) 0 0000-0000"
                  />
                </div>
              </Field>
            </Section>

            {/* 3) Endereço --------------------------------------------- */}
            <Section title="Endereço" icon={MapPin}>
              <Field label="CEP">
                <input
                  type="text"
                  value={formData.cep ?? ''}
                  onChange={(e) => update('cep', e.target.value)}
                  className={baseInput}
                  placeholder="00000-000"
                />
              </Field>
              <Field label="Logradouro">
                <input
                  type="text"
                  value={formData.logradouro ?? ''}
                  onChange={(e) => update('logradouro', e.target.value)}
                  className={baseInput}
                  placeholder="Rua, avenida, etc."
                />
              </Field>
              <Field label="Número">
                <input
                  type="text"
                  value={formData.numero ?? ''}
                  onChange={(e) => update('numero', e.target.value)}
                  className={baseInput}
                  placeholder="123"
                />
              </Field>
              <Field label="Complemento">
                <input
                  type="text"
                  value={formData.complemento ?? ''}
                  onChange={(e) => update('complemento', e.target.value)}
                  className={baseInput}
                  placeholder="Apto, sala, bloco..."
                />
              </Field>
              <Field label="Bairro">
                <input
                  type="text"
                  value={formData.bairro ?? ''}
                  onChange={(e) => update('bairro', e.target.value)}
                  className={baseInput}
                  placeholder="Bairro"
                />
              </Field>
              <Field label="Cidade">
                <input
                  type="text"
                  value={formData.cidade ?? ''}
                  onChange={(e) => update('cidade', e.target.value)}
                  className={baseInput}
                  placeholder="Cidade"
                />
              </Field>
              <Field label="UF">
                <input
                  type="text"
                  value={formData.estado ?? ''}
                  onChange={(e) => update('estado', e.target.value.toUpperCase().slice(0, 2))}
                  className={baseInput}
                  placeholder="SP"
                  maxLength={2}
                />
              </Field>
            </Section>

            {/* 4) Atribuição ------------------------------------------- */}
            <Section title="Atribuição" icon={Users}>
              <Field label="Produtor responsável">
                <select
                  value={formData.produtorId ?? ''}
                  onChange={(e) => update('produtorId', e.target.value || null)}
                  className={baseInput}
                >
                  <option value="">Sem atribuição</option>
                  {produtorOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </Field>
              <Field label="Gerente de contas">
                <select
                  value={formData.gerenteId ?? ''}
                  onChange={(e) => update('gerenteId', e.target.value || null)}
                  className={baseInput}
                >
                  <option value="">Sem atribuição</option>
                  {produtorOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </Field>
            </Section>

            {/* 5) Bloco PF --------------------------------------------- */}
            {tipo === 'PF' && (
              <Section title="Dados Pessoais (PF)" icon={CalendarDays}>
                <Field label="Data de nascimento">
                  <input
                    type="date"
                    value={formData.dataNascimento ?? ''}
                    onChange={(e) => update('dataNascimento', e.target.value)}
                    className={baseInput}
                  />
                </Field>
                <Field label="Sexo">
                  <select
                    value={formData.sexo ?? ''}
                    onChange={(e) =>
                      update('sexo', (e.target.value || undefined) as SexoPessoa | undefined)
                    }
                    className={baseInput}
                  >
                    <option value="">Não informado</option>
                    {SEXO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Estado civil" span={2}>
                  <select
                    value={formData.estadoCivil ?? ''}
                    onChange={(e) =>
                      update(
                        'estadoCivil',
                        (e.target.value || undefined) as EstadoCivil | undefined,
                      )
                    }
                    className={baseInput}
                  >
                    <option value="">Não informado</option>
                    {ESTADO_CIVIL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </Section>
            )}

            {/* 6) Bloco PJ --------------------------------------------- */}
            {tipo === 'PJ' && (
              <Section title="Dados da Empresa (PJ)" icon={Briefcase}>
                <Field label="CNAE principal">
                  <input
                    type="text"
                    value={formData.cnae ?? ''}
                    onChange={(e) => update('cnae', e.target.value)}
                    className={baseInput}
                    placeholder="0000-0/00"
                  />
                </Field>
                <Field label="Porte">
                  <select
                    value={formData.porte ?? ''}
                    onChange={(e) =>
                      update(
                        'porte',
                        (e.target.value || undefined) as PorteEmpresa | undefined,
                      )
                    }
                    className={baseInput}
                  >
                    <option value="">Não informado</option>
                    {PORTE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Site" span={2}>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
                    <input
                      type="url"
                      value={formData.site ?? ''}
                      onChange={(e) => update('site', e.target.value)}
                      className={`${baseInput} pl-10`}
                      placeholder="https://exemplo.com.br"
                    />
                  </div>
                </Field>
              </Section>
            )}
          </div>

          <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] text-fg-3">
              <ShieldCheck size={14} className="text-accent-primary" />
              Dados sensíveis tratados conforme LGPD.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
