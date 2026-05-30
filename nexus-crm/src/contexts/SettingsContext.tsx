import React, { useState, useEffect } from 'react'
import { SettingsContext, defaultPermissions, type Permissions, type Produtor, type Pipeline } from './settingsCore'

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [produtores, setProdutores] = useState<Produtor[]>(() => {
    const saved = localStorage.getItem('nexus-crm-produtores')
    if (saved) {
      const parsed = JSON.parse(saved) as unknown
      // Garantir que todos tenham permissões (migração)
      return Array.isArray(parsed)
        ? parsed.map((p) => {
            const pp = p as Partial<Produtor> & { permissions?: Permissions }
            return {
              ...pp,
              permissions: pp.permissions || defaultPermissions,
            } as Produtor
          })
        : []
    }
    return [
      { id: '1', nome: 'Vinícius Assis', email: 'vinicius@wassis.com.br', telefone: '(11) 9 4317-8911', status: 'Ativo', permissions: { ...defaultPermissions, configuracoes: { view: true, edit: true } } },
      { id: '2', nome: 'Hicila Fernandes', email: 'hicila@wassis.com.br', telefone: '(11) 4522-2000', status: 'Ativo', permissions: defaultPermissions },
      { id: '3', nome: 'Carlos Santos', email: 'carlos@wassis.com.br', telefone: '(11) 9 8877-6655', status: 'Ativo', permissions: defaultPermissions },
    ]
  })

  const [pipelines, setPipelines] = useState<Pipeline[]>(() => {
    const saved = localStorage.getItem('nexus-crm-pipelines')
    return saved ? JSON.parse(saved) : [
      { 
        id: '1', 
        name: 'Vendas de Seguros', 
        type: 'venda',
        steps: [
          { id: '1', name: 'Prospecção', color: 'bg-slate-400' },
          { id: '2', name: 'Cotação', color: 'bg-accent-primary' },
          { id: '3', name: 'Negociação', color: 'bg-amber-500' },
          { id: '4', name: 'Fechamento', color: 'bg-emerald-500' },
        ]
      },
      { 
        id: '2', 
        name: 'Pós-Venda Renovação', 
        type: 'pos-venda',
        steps: [
          { id: '5', name: 'Renovação Pendente', color: 'bg-blue-400' },
          { id: '6', name: 'Cálculo Realizado', color: 'bg-indigo-500' },
          { id: '7', name: 'Aguardando Cliente', color: 'bg-purple-500' },
          { id: '8', name: 'Emitido', color: 'bg-teal-500' },
        ]
      }
    ]
  })

  const [ramos, setRamos] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus-crm-ramos')
    return saved ? JSON.parse(saved) : ['Auto', 'Residencial', 'Empresarial', 'Vida', 'Saúde', 'RC Profissional']
  })

  const [seguradoras, setSeguradoras] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus-crm-seguradoras')
    return saved ? JSON.parse(saved) : ['Porto Seguro', 'Allianz', 'Azul', 'Bradesco', 'Liberty', 'Sompo', 'Tokio Marine']
  })

  const [origens, setOrigens] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus-crm-origens')
    return saved ? JSON.parse(saved) : ['Indicação', 'Google Search', 'Instagram', 'Landing Page', 'Tráfego Pago', 'Mailing']
  })

  const [motivosPerda, setMotivosPerda] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus-crm-motivos-perda')
    return saved ? JSON.parse(saved) : ['Preço Alto', 'Falta de Cobertura', 'Fechou com Concorrência', 'Sem Interesse no Momento', 'Dados incorretos']
  })

  useEffect(() => { localStorage.setItem('nexus-crm-produtores', JSON.stringify(produtores)) }, [produtores])
  useEffect(() => { localStorage.setItem('nexus-crm-pipelines', JSON.stringify(pipelines)) }, [pipelines])
  useEffect(() => { localStorage.setItem('nexus-crm-ramos', JSON.stringify(ramos)) }, [ramos])
  useEffect(() => { localStorage.setItem('nexus-crm-seguradoras', JSON.stringify(seguradoras)) }, [seguradoras])
  useEffect(() => { localStorage.setItem('nexus-crm-origens', JSON.stringify(origens)) }, [origens])
  useEffect(() => { localStorage.setItem('nexus-crm-motivos-perda', JSON.stringify(motivosPerda)) }, [motivosPerda])

  return (
    <SettingsContext.Provider value={{
      produtores, pipelines, ramos, seguradoras, origens, motivosPerda,
      addProdutor: (p) => setProdutores([...produtores, { ...p, id: crypto.randomUUID(), permissions: p.permissions || defaultPermissions } as Produtor]),
      updateProdutor: (id, p) => setProdutores(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } as Produtor : prod)),
      removeProdutor: (id) => setProdutores(produtores.filter(p => p.id !== id)),
      addPipeline: (p) => setPipelines([...pipelines, { ...p, id: crypto.randomUUID() }]),
      updatePipeline: (id, p) => setPipelines(pipelines.map(prev => prev.id === id ? { ...prev, ...p } : prev)),
      removePipeline: (id) => setPipelines(pipelines.filter(p => p.id !== id)),
      addRamo: (r) => setRamos([...ramos, r]),
      removeRamo: (r) => setRamos(ramos.filter(prev => prev !== r)),
      addSeguradora: (s) => setSeguradoras([...seguradoras, s]),
      removeSeguradora: (s) => setSeguradoras(seguradoras.filter(prev => prev !== s)),
      addOrigem: (o) => setOrigens([...origens, o]),
      removeOrigem: (o) => setOrigens(origens.filter(prev => prev !== o)),
      addMotivoPerda: (m) => setMotivosPerda([...motivosPerda, m]),
      removeMotivoPerda: (m) => setMotivosPerda(motivosPerda.filter(prev => prev !== m)),
    }}>
      {children}
    </SettingsContext.Provider>
  )
}
