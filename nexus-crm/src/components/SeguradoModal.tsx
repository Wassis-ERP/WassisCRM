import React, { useState } from 'react'
import { X, User, Shield, Phone, Mail, MapPin, Hash } from 'lucide-react'
import type { Segurado } from '../contexts/seguradosCore'

interface SeguradoModalProps {
  isOpen: boolean
  onClose: () => void
  segurado?: Segurado | null
  onSave: (data: Partial<Segurado>) => void | Promise<void>
}

export default function SeguradoModal({ isOpen, onClose, segurado, onSave }: SeguradoModalProps) {
  const [formData, setFormData] = useState<Partial<Segurado>>(() => {
    if (segurado) return segurado
    return {
      nome: '',
      documento: '',
      tipo: 'PF',
      email: '',
      telefone: '',
      chatwootId: '',
      endereco: '',
      status: 'Ativo',
    }
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <User size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {segurado ? 'Editar Segurado' : 'Novo Segurado'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo / Razão Social</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>

              {/* Tipo e Documento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'PF' | 'PJ' })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                >
                  <option value="PF">Pessoa Física (CPF)</option>
                  <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{formData.tipo === 'PF' ? 'CPF' : 'CNPJ'}</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              {/* Email e Telefone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                    placeholder="(00) 0 0000-0000"
                  />
                </div>
              </div>

              {/* ChatWoot ID e Endereço */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ChatWoot ID</label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.chatwootId}
                    onChange={(e) => setFormData({ ...formData, chatwootId: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                    placeholder="#CW-0000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade / UF</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
                    placeholder="Cidade, UF"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
