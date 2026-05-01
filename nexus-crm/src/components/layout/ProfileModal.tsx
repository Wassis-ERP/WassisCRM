import { X, Camera, Lock, User, Save } from 'lucide-react'
import { useState } from 'react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal para atualização de perfil do usuário.
 * Permite alterar foto, nome e senha.
 */
export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    name: 'Renato Silva',
    password: '',
    confirmPassword: ''
  })
  const [avatar, setAvatar] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui viria a lógica de salvar no Supabase
    console.log('Salvando perfil:', { ...formData, avatar })
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Meu Perfil</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg border-4 border-white dark:border-slate-800">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  'RS'
                )}
              </div>
              <label 
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={24} />
              </label>
              <input 
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Clique para alterar a foto</p>
          </div>

          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-primary focus:outline-none transition-all"
                  placeholder="Seu nome"
                  required
                />
              </div>
            </div>

            {/* Nova Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Alterar Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-primary focus:outline-none transition-all"
                  placeholder="Nova senha (deixe em branco para não alterar)"
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            {formData.password && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-primary focus:outline-none transition-all"
                    placeholder="Repita a nova senha"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Save size={18} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
