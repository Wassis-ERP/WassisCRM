/**
 * Mapa de cor por ramo de seguro — baseado no Manual da Marca W.Assis (pág. 18).
 * Cada ramo recebe uma cor oficial que pode ser usada em badges, bordas de card,
 * headers de módulo, decorações de onda etc.
 *
 * O lookup é tolerante a variações ("Residência", "residencial", "RESIDENCIA")
 * via normalização (lowercase + remoção de diacríticos + matching parcial).
 */

export interface RamoTheme {
  key: string;
  color: string;
  cssVar: string;
  label: string;
}

export const RAMO_THEMES: RamoTheme[] = [
  { key: 'saude',        color: '#005938', cssVar: 'var(--color-module-saude)',        label: 'Saúde' },
  { key: 'vida',         color: '#FF5400', cssVar: 'var(--color-module-vida)',         label: 'Vida' },
  { key: 'auto',         color: '#004FC2', cssVar: 'var(--color-module-auto)',         label: 'Auto' },
  { key: 'moto',         color: '#053D96', cssVar: 'var(--color-module-moto)',         label: 'Moto' },
  { key: 'residencia',   color: '#5C4091', cssVar: 'var(--color-module-residencia)',   label: 'Residência' },
  { key: 'empresarial',  color: '#AB120D', cssVar: 'var(--color-module-empresarial)',  label: 'Empresarial' },
  { key: 'portateis',    color: '#303030', cssVar: 'var(--color-module-portateis)',    label: 'Portáteis' },
  { key: 'previdencia',  color: '#F09957', cssVar: 'var(--color-module-previdencia)',  label: 'Previdência' },
];

export const DEFAULT_RAMO_COLOR = '#6B7280';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Resolve a cor de um ramo a partir do nome (livre, vindo do banco).
 * Faz matching parcial — "Seguro Auto", "Auto Frota", "auto" → cor de Auto.
 */
export function getRamoColor(ramoName?: string | null): string {
  if (!ramoName) return DEFAULT_RAMO_COLOR;
  const normalized = normalize(ramoName);
  const match = RAMO_THEMES.find(t => normalized.includes(t.key));
  return match?.color ?? DEFAULT_RAMO_COLOR;
}

export function getRamoTheme(ramoName?: string | null): RamoTheme | undefined {
  if (!ramoName) return undefined;
  const normalized = normalize(ramoName);
  return RAMO_THEMES.find(t => normalized.includes(t.key));
}

/**
 * Cor de acento por pipeline_module (Comercial/Emissão/Pós-Venda/Financeiro/Sinistro).
 * Usado como cor de header da tela de Kanban. Mapeamento livre, escolhido para
 * manter a marca consistente com a paleta secundária do manual.
 */
export const PIPELINE_MODULE_COLORS: Record<string, string> = {
  comercial:  '#004FC2', // azul primário
  emissao:    '#053D96', // azul escuro
  pos_venda:  '#005938', // verde Saúde
  financeiro: '#F09957', // pêssego Previdência
  sinistro:   '#AB120D', // vermelho Empresarial
};

export function getPipelineModuleColor(module?: string | null): string {
  if (!module) return '#004FC2';
  return PIPELINE_MODULE_COLORS[module] ?? '#004FC2';
}
