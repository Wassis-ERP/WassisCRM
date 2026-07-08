export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      anexos: {
        Row: {
          arquivo_url: string
          cobranca_id: string | null
          created_at: string
          emissao_id: string | null
          id: string
          nome: string
          oportunidade_id: string | null
          pos_venda_id: string | null
          sinistro_id: string | null
          tamanho: number | null
          tenant_id: string | null
          tipo: string | null
          uploaded_by: string
        }
        Insert: {
          arquivo_url: string
          cobranca_id?: string | null
          created_at?: string
          emissao_id?: string | null
          id?: string
          nome: string
          oportunidade_id?: string | null
          pos_venda_id?: string | null
          sinistro_id?: string | null
          tamanho?: number | null
          tenant_id?: string | null
          tipo?: string | null
          uploaded_by: string
        }
        Update: {
          arquivo_url?: string
          cobranca_id?: string | null
          created_at?: string
          emissao_id?: string | null
          id?: string
          nome?: string
          oportunidade_id?: string | null
          pos_venda_id?: string | null
          sinistro_id?: string | null
          tamanho?: number | null
          tenant_id?: string | null
          tipo?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "financeiro_cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_emissao_id_fkey"
            columns: ["emissao_id"]
            isOneToOne: false
            referencedRelation: "emissoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_pos_venda_id_fkey"
            columns: ["pos_venda_id"]
            isOneToOne: false
            referencedRelation: "pos_vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_sinistro_id_fkey"
            columns: ["sinistro_id"]
            isOneToOne: false
            referencedRelation: "sinistros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anexos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          cobranca_id: string | null
          created_at: string
          descricao: string | null
          emissao_id: string | null
          id: string
          oportunidade_id: string | null
          pos_venda_id: string | null
          sinistro_id: string | null
          tenant_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          cobranca_id?: string | null
          created_at?: string
          descricao?: string | null
          emissao_id?: string | null
          id?: string
          oportunidade_id?: string | null
          pos_venda_id?: string | null
          sinistro_id?: string | null
          tenant_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          cobranca_id?: string | null
          created_at?: string
          descricao?: string | null
          emissao_id?: string | null
          id?: string
          oportunidade_id?: string | null
          pos_venda_id?: string | null
          sinistro_id?: string | null
          tenant_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "financeiro_cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_emissao_id_fkey"
            columns: ["emissao_id"]
            isOneToOne: false
            referencedRelation: "emissoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_pos_venda_id_fkey"
            columns: ["pos_venda_id"]
            isOneToOne: false
            referencedRelation: "pos_vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_sinistro_id_fkey"
            columns: ["sinistro_id"]
            isOneToOne: false
            referencedRelation: "sinistros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coberturas_catalogo: {
        Row: {
          ativo: boolean
          capital_lmi_padrao: number | null
          carencia_dias: number | null
          caracteristica: string | null
          codigo: string | null
          codigo_susep: string | null
          descricao: string | null
          franquia_padrao: number | null
          id: string
          modalidade: string | null
          nome: string
          obrigatoria: boolean
          ordem: number | null
          ramo_id: string
          tipo_cobertura: string | null
          tipo_risco: string | null
        }
        Insert: {
          ativo?: boolean
          capital_lmi_padrao?: number | null
          carencia_dias?: number | null
          caracteristica?: string | null
          codigo?: string | null
          codigo_susep?: string | null
          descricao?: string | null
          franquia_padrao?: number | null
          id?: string
          modalidade?: string | null
          nome: string
          obrigatoria?: boolean
          ordem?: number | null
          ramo_id: string
          tipo_cobertura?: string | null
          tipo_risco?: string | null
        }
        Update: {
          ativo?: boolean
          capital_lmi_padrao?: number | null
          carencia_dias?: number | null
          caracteristica?: string | null
          codigo?: string | null
          codigo_susep?: string | null
          descricao?: string | null
          franquia_padrao?: number | null
          id?: string
          modalidade?: string | null
          nome?: string
          obrigatoria?: boolean
          ordem?: number | null
          ramo_id?: string
          tipo_cobertura?: string | null
          tipo_risco?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coberturas_catalogo_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_definicoes: {
        Row: {
          agrupamento: string | null
          ajuda: string | null
          ativo: boolean
          chave: string
          entidade_tipo: string
          filial_id: string | null
          formato: string | null
          id: string
          mascara: string | null
          max_valor: number | null
          min_valor: number | null
          nome: string
          obrigatorio: boolean
          ordem: number | null
          placeholder: string | null
          tamanho_max: number | null
          tenant_id: string
          tipo_dado: string
          visivel_em_listagem: boolean
        }
        Insert: {
          agrupamento?: string | null
          ajuda?: string | null
          ativo?: boolean
          chave: string
          entidade_tipo: string
          filial_id?: string | null
          formato?: string | null
          id?: string
          mascara?: string | null
          max_valor?: number | null
          min_valor?: number | null
          nome: string
          obrigatorio?: boolean
          ordem?: number | null
          placeholder?: string | null
          tamanho_max?: number | null
          tenant_id: string
          tipo_dado: string
          visivel_em_listagem?: boolean
        }
        Update: {
          agrupamento?: string | null
          ajuda?: string | null
          ativo?: boolean
          chave?: string
          entidade_tipo?: string
          filial_id?: string | null
          formato?: string | null
          id?: string
          mascara?: string | null
          max_valor?: number | null
          min_valor?: number | null
          nome?: string
          obrigatorio?: boolean
          ordem?: number | null
          placeholder?: string | null
          tamanho_max?: number | null
          tenant_id?: string
          tipo_dado?: string
          visivel_em_listagem?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "campo_definicoes_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campo_definicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campo_opcoes: {
        Row: {
          ativo: boolean
          campo_definicao_id: string
          id: string
          ordem: number | null
          rotulo: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          campo_definicao_id: string
          id?: string
          ordem?: number | null
          rotulo: string
          valor: string
        }
        Update: {
          ativo?: boolean
          campo_definicao_id?: string
          id?: string
          ordem?: number | null
          rotulo?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "campo_opcoes_campo_definicao_id_fkey"
            columns: ["campo_definicao_id"]
            isOneToOne: false
            referencedRelation: "campo_definicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      emissoes: {
        Row: {
          concluded_at: string | null
          created_at: string
          id: string
          metadata: Json
          observacoes: string | null
          oportunidade_id: string
          pipeline_id: string | null
          proximo_followup: string | null
          responsavel_id: string
          stage_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          concluded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          observacoes?: string | null
          oportunidade_id: string
          pipeline_id?: string | null
          proximo_followup?: string | null
          responsavel_id: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          concluded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          observacoes?: string | null
          oportunidade_id?: string
          pipeline_id?: string | null
          proximo_followup?: string | null
          responsavel_id?: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emissoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissoes_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissoes_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento_grades: {
        Row: {
          ativo: boolean
          base_calculo: string | null
          considera_adicional_fracionamento: boolean
          considera_iof: boolean
          id: string
          nome: string
          observacoes: string | null
          percentual_default: number | null
          qtd_parcelas: number
          ramo_id: string
          seguradora_id: string
          tipo: string
          vitalicio: boolean
        }
        Insert: {
          ativo?: boolean
          base_calculo?: string | null
          considera_adicional_fracionamento?: boolean
          considera_iof?: boolean
          id?: string
          nome: string
          observacoes?: string | null
          percentual_default?: number | null
          qtd_parcelas: number
          ramo_id: string
          seguradora_id: string
          tipo: string
          vitalicio?: boolean
        }
        Update: {
          ativo?: boolean
          base_calculo?: string | null
          considera_adicional_fracionamento?: boolean
          considera_iof?: boolean
          id?: string
          nome?: string
          observacoes?: string | null
          percentual_default?: number | null
          qtd_parcelas?: number
          ramo_id?: string
          seguradora_id?: string
          tipo?: string
          vitalicio?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_grades_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_grades_seguradora_id_fkey"
            columns: ["seguradora_id"]
            isOneToOne: false
            referencedRelation: "seguradoras"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento_grade_parcelas: {
        Row: {
          ativo: boolean
          dias_apos_vencimento: number | null
          grade_id: string
          id: string
          numero: number
          percentual: number | null
          percentual_sobre: string | null
        }
        Insert: {
          ativo?: boolean
          dias_apos_vencimento?: number | null
          grade_id: string
          id?: string
          numero: number
          percentual?: number | null
          percentual_sobre?: string | null
        }
        Update: {
          ativo?: boolean
          dias_apos_vencimento?: number | null
          grade_id?: string
          id?: string
          numero?: number
          percentual?: number | null
          percentual_sobre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_grade_parcelas_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "recebimento_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      repasse_regras: {
        Row: {
          ativo: boolean
          base: string
          filial_id: string | null
          fim_vigencia: string | null
          gatilho: string
          id: string
          inicio_vigencia: string | null
          limite_parcelas: number | null
          observacoes: string | null
          papel: string
          percentual: number | null
          prioridade: number
          produtor_id: string | null
          qtd_parcelas: number | null
          ramo_id: string | null
          tenant_id: string
          tipo_documento: string | null
          valor_fixo: number | null
        }
        Insert: {
          ativo?: boolean
          base: string
          filial_id?: string | null
          fim_vigencia?: string | null
          gatilho: string
          id?: string
          inicio_vigencia?: string | null
          limite_parcelas?: number | null
          observacoes?: string | null
          papel: string
          percentual?: number | null
          prioridade?: number
          produtor_id?: string | null
          qtd_parcelas?: number | null
          ramo_id?: string | null
          tenant_id: string
          tipo_documento?: string | null
          valor_fixo?: number | null
        }
        Update: {
          ativo?: boolean
          base?: string
          filial_id?: string | null
          fim_vigencia?: string | null
          gatilho?: string
          id?: string
          inicio_vigencia?: string | null
          limite_parcelas?: number | null
          observacoes?: string | null
          papel?: string
          percentual?: number | null
          prioridade?: number
          produtor_id?: string | null
          qtd_parcelas?: number | null
          ramo_id?: string | null
          tenant_id?: string
          tipo_documento?: string | null
          valor_fixo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repasse_regras_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_regras_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_regras_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repasse_regras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_cobrancas: {
        Row: {
          concluded_at: string | null
          created_at: string
          id: string
          metadata: Json
          observacoes: string | null
          oportunidade_id: string
          pipeline_id: string | null
          proximo_followup: string | null
          responsavel_id: string
          stage_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          concluded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          observacoes?: string | null
          oportunidade_id: string
          pipeline_id?: string | null
          proximo_followup?: string | null
          responsavel_id: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          concluded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          observacoes?: string | null
          oportunidade_id?: string
          pipeline_id?: string | null
          proximo_followup?: string | null
          responsavel_id?: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_cobrancas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_cobrancas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perda: {
        Row: {
          ativo: boolean
          categoria: string | null
          id: string
          nome: string
          ordem: number | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          id?: string
          nome: string
          ordem?: number | null
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivos_perda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          agenciamento: number | null
          comissao_percentual: number | null
          concluded_at: string | null
          created_at: string
          filial_id: string | null
          id: string
          indicador: string | null
          metadata: Json
          motivo_perda_id: string | null
          nome: string
          observacoes: string | null
          origem_id: string | null
          pipeline_id: string | null
          premio_liquido: number | null
          producao: number | null
          proximo_followup: string | null
          ramo_id: string | null
          responsavel_id: string
          segurado_id: string | null
          seguradora_id: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          tenant_id: string | null
          tipo_contato: boolean | null
          tipo_negocio: Database["public"]["Enums"]["tipo_negocio"] | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          agenciamento?: number | null
          comissao_percentual?: number | null
          concluded_at?: string | null
          created_at?: string
          filial_id?: string | null
          id?: string
          indicador?: string | null
          metadata?: Json
          motivo_perda_id?: string | null
          nome: string
          observacoes?: string | null
          origem_id?: string | null
          pipeline_id?: string | null
          premio_liquido?: number | null
          producao?: number | null
          proximo_followup?: string | null
          ramo_id?: string | null
          responsavel_id: string
          segurado_id?: string | null
          seguradora_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          tipo_contato?: boolean | null
          tipo_negocio?: Database["public"]["Enums"]["tipo_negocio"] | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          agenciamento?: number | null
          comissao_percentual?: number | null
          concluded_at?: string | null
          created_at?: string
          filial_id?: string | null
          id?: string
          indicador?: string | null
          metadata?: Json
          motivo_perda_id?: string | null
          nome?: string
          observacoes?: string | null
          origem_id?: string | null
          pipeline_id?: string | null
          premio_liquido?: number | null
          producao?: number | null
          proximo_followup?: string | null
          ramo_id?: string | null
          responsavel_id?: string
          segurado_id?: string | null
          seguradora_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          tipo_contato?: boolean | null
          tipo_negocio?: Database["public"]["Enums"]["tipo_negocio"] | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_motivo_perda_id_fkey"
            columns: ["motivo_perda_id"]
            isOneToOne: false
            referencedRelation: "motivos_perda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_ramo_id_fkey"
            columns: ["ramo_id"]
            isOneToOne: false
            referencedRelation: "ramos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_segurado_id_fkey"
            columns: ["segurado_id"]
            isOneToOne: false
            referencedRelation: "segurados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_seguradora_id_fkey"
            columns: ["seguradora_id"]
            isOneToOne: false
            referencedRelation: "seguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      origens: {
        Row: {
          ativo: boolean
          id: string
          nome: string
          ordem: number | null
          tenant_id: string
          tipo: string | null
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
          ordem?: number | null
          tenant_id: string
          tipo?: string | null
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
          ordem?: number | null
          tenant_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "origens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          ativo: boolean
          codigo: string | null
          cor: string | null
          finaliza_com_perda: boolean
          finaliza_com_sucesso: boolean
          id: string
          nome: string
          ordem: number
          pipeline_id: string
          probabilidade: number | null
          sla_dias: number | null
          tipo_stage: string | null
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          cor?: string | null
          finaliza_com_perda?: boolean
          finaliza_com_sucesso?: boolean
          id?: string
          nome: string
          ordem?: number
          pipeline_id: string
          probabilidade?: number | null
          sla_dias?: number | null
          tipo_stage?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          cor?: string | null
          finaliza_com_perda?: boolean
          finaliza_com_sucesso?: boolean
          id?: string
          nome?: string
          ordem?: number
          pipeline_id?: string
          probabilidade?: number | null
          sla_dias?: number | null
          tipo_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          ativo: boolean
          descricao: string | null
          entidade_tipo: string
          filial_id: string | null
          id: string
          modelo_fabrica: boolean
          nome: string
          ordem: number | null
          permite_customizacao: boolean
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          entidade_tipo: string
          filial_id?: string | null
          id?: string
          modelo_fabrica?: boolean
          nome: string
          ordem?: number | null
          permite_customizacao?: boolean
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          entidade_tipo?: string
          filial_id?: string | null
          id?: string
          modelo_fabrica?: boolean
          nome?: string
          ordem?: number | null
          permite_customizacao?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_vendas: {
        Row: {
          concluded_at: string | null
          created_at: string
          id: string
          metadata: Json
          observacoes: string | null
          oportunidade_id: string
          pipeline_id: string | null
          proximo_followup: string | null
          responsavel_id: string
          stage_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          concluded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          observacoes?: string | null
          oportunidade_id: string
          pipeline_id?: string | null
          proximo_followup?: string | null
          responsavel_id: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          concluded_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          observacoes?: string | null
          oportunidade_id?: string
          pipeline_id?: string | null
          proximo_followup?: string | null
          responsavel_id?: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_vendas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_vendas_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_vendas_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_vendas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ramos: {
        Row: {
          ativo: boolean
          codigo_susep: string | null
          exige_coberturas: boolean
          exige_item: boolean
          forma_calculo: string | null
          grupo_operacional: string
          id: string
          is_monthly: boolean
          nome: string
          observacoes: string | null
          ordem: number | null
          permite_endosso: boolean
          renovavel: boolean
          risk_type: string
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          codigo_susep?: string | null
          exige_coberturas?: boolean
          exige_item?: boolean
          forma_calculo?: string | null
          grupo_operacional?: string
          id?: string
          is_monthly?: boolean
          nome: string
          observacoes?: string | null
          ordem?: number | null
          permite_endosso?: boolean
          renovavel?: boolean
          risk_type?: string
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          codigo_susep?: string | null
          exige_coberturas?: boolean
          exige_item?: boolean
          forma_calculo?: string | null
          grupo_operacional?: string
          id?: string
          is_monthly?: boolean
          nome?: string
          observacoes?: string | null
          ordem?: number | null
          permite_endosso?: boolean
          renovavel?: boolean
          risk_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ramos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          module: string
          perfil_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          perfil_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          perfil_id?: string
        }
        Relationships: []
      }
      seguradoras: {
        Row: {
          ativo: boolean
          aceita_busca_automatica: boolean
          aceita_importacao_pdf: boolean
          cnpj: string | null
          codigo_interno: string | null
          codigo_susep: string | null
          email: string | null
          id: string
          nome: string
          nome_curto: string | null
          observacoes: string | null
          portal_url: string | null
          site: string | null
          telefone_assistencia: string | null
          telefone_sac: string | null
          tenant_id: string
        }
        Insert: {
          ativo?: boolean
          aceita_busca_automatica?: boolean
          aceita_importacao_pdf?: boolean
          cnpj?: string | null
          codigo_interno?: string | null
          codigo_susep?: string | null
          email?: string | null
          id?: string
          nome: string
          nome_curto?: string | null
          observacoes?: string | null
          portal_url?: string | null
          site?: string | null
          telefone_assistencia?: string | null
          telefone_sac?: string | null
          tenant_id: string
        }
        Update: {
          ativo?: boolean
          aceita_busca_automatica?: boolean
          aceita_importacao_pdf?: boolean
          cnpj?: string | null
          codigo_interno?: string | null
          codigo_susep?: string | null
          email?: string | null
          id?: string
          nome?: string
          nome_curto?: string | null
          observacoes?: string | null
          portal_url?: string | null
          site?: string | null
          telefone_assistencia?: string | null
          telefone_sac?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguradoras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      segurados: {
        Row: {
          bairro: string | null
          cep: string | null
          chatwoot_id: string | null
          cidade: string | null
          cnae: string | null
          complemento: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          estado_civil: Database["public"]["Enums"]["estado_civil"] | null
          filial_id: string | null
          gerente_id: string | null
          id: string
          lgpd_autorizado: boolean
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          porte: Database["public"]["Enums"]["porte_empresa"] | null
          produtor_id: string | null
          sexo: Database["public"]["Enums"]["sexo_pessoa"] | null
          site: string | null
          status: Database["public"]["Enums"]["status_pessoa"]
          telefone: string | null
          tenant_id: string | null
          tipo: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          chatwoot_id?: string | null
          cidade?: string | null
          cnae?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          filial_id?: string | null
          gerente_id?: string | null
          id?: string
          lgpd_autorizado?: boolean
          logradouro?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          porte?: Database["public"]["Enums"]["porte_empresa"] | null
          produtor_id?: string | null
          sexo?: Database["public"]["Enums"]["sexo_pessoa"] | null
          site?: string | null
          status?: Database["public"]["Enums"]["status_pessoa"]
          telefone?: string | null
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          chatwoot_id?: string | null
          cidade?: string | null
          cnae?: string | null
          complemento?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          estado_civil?: Database["public"]["Enums"]["estado_civil"] | null
          filial_id?: string | null
          gerente_id?: string | null
          id?: string
          lgpd_autorizado?: boolean
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          porte?: Database["public"]["Enums"]["porte_empresa"] | null
          produtor_id?: string | null
          sexo?: Database["public"]["Enums"]["sexo_pessoa"] | null
          site?: string | null
          status?: Database["public"]["Enums"]["status_pessoa"]
          telefone?: string | null
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_pessoa"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "segurados_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segurados_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segurados_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoa_contato: {
        Row: {
          cargo: string | null
          created_at: string
          id: string
          pf_id: string
          pj_id: string
          principal: boolean
          tenant_id: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          id?: string
          pf_id: string
          pj_id: string
          principal?: boolean
          tenant_id?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          id?: string
          pf_id?: string
          pj_id?: string
          principal?: boolean
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoa_contato_pj_id_fkey"
            columns: ["pj_id"]
            isOneToOne: false
            referencedRelation: "segurados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_contato_pf_id_fkey"
            columns: ["pf_id"]
            isOneToOne: false
            referencedRelation: "segurados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_contato_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sinistros: {
        Row: {
          concluded_at: string | null
          created_at: string
          data_aviso: string | null
          data_sinistro: string | null
          id: string
          metadata: Json
          numero_sinistro: string | null
          observacoes: string | null
          oportunidade_id: string
          pipeline_id: string | null
          responsavel_id: string
          stage_id: string | null
          status: Database["public"]["Enums"]["card_status"]
          tenant_id: string | null
          tipo_sinistro: Database["public"]["Enums"]["tipo_sinistro"] | null
          updated_at: string
          valor_indenizacao: number | null
          valor_prejuizo: number | null
        }
        Insert: {
          concluded_at?: string | null
          created_at?: string
          data_aviso?: string | null
          data_sinistro?: string | null
          id?: string
          metadata?: Json
          numero_sinistro?: string | null
          observacoes?: string | null
          oportunidade_id: string
          pipeline_id?: string | null
          responsavel_id: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          tipo_sinistro?: Database["public"]["Enums"]["tipo_sinistro"] | null
          updated_at?: string
          valor_indenizacao?: number | null
          valor_prejuizo?: number | null
        }
        Update: {
          concluded_at?: string | null
          created_at?: string
          data_aviso?: string | null
          data_sinistro?: string | null
          id?: string
          metadata?: Json
          numero_sinistro?: string | null
          observacoes?: string | null
          oportunidade_id?: string
          pipeline_id?: string | null
          responsavel_id?: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          tenant_id?: string | null
          tipo_sinistro?: Database["public"]["Enums"]["tipo_sinistro"] | null
          updated_at?: string
          valor_indenizacao?: number | null
          valor_prejuizo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sinistros_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistros_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistros_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinistros_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_team_members: {
        Args: never
        Returns: {
          avatar_url: string
          corretoras_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          perfil_principal: string | null
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      card_status: "pending" | "won" | "lost"
      estado_civil:
        | "Solteiro"
        | "Casado"
        | "Divorciado"
        | "Viuvo"
        | "UniaoEstavel"
      pipeline_module:
        | "comercial"
        | "emissao"
        | "pos_venda"
        | "financeiro"
        | "sinistro"
      porte_empresa:
        | "MEI"
        | "Microempresa"
        | "PequenoPorte"
        | "MedioPorte"
        | "GrandePorte"
      sexo_pessoa: "M" | "F" | "Outro"
      status_pessoa: "Ativo" | "Inativo" | "Prospecto"
      tipo_negocio: "novo" | "renovacao" | "endosso"
      tipo_pessoa: "PF" | "PJ"
      tipo_sinistro:
        | "colisao"
        | "roubo_furto"
        | "incendio"
        | "alagamento"
        | "outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_status: ["pending", "won", "lost"],
      estado_civil: [
        "Solteiro",
        "Casado",
        "Divorciado",
        "Viuvo",
        "UniaoEstavel",
      ],
      pipeline_module: [
        "comercial",
        "emissao",
        "pos_venda",
        "financeiro",
        "sinistro",
      ],
      porte_empresa: [
        "MEI",
        "Microempresa",
        "PequenoPorte",
        "MedioPorte",
        "GrandePorte",
      ],
      sexo_pessoa: ["M", "F", "Outro"],
      status_pessoa: ["Ativo", "Inativo", "Prospecto"],
      tipo_negocio: ["novo", "renovacao", "endosso"],
      tipo_pessoa: ["PF", "PJ"],
      tipo_sinistro: [
        "colisao",
        "roubo_furto",
        "incendio",
        "alagamento",
        "outros",
      ],
    },
  },
} as const
