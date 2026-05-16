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
          created_at: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string | null
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
          created_at: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string | null
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
          color: string
          created_at: string
          id: string
          is_loss_eligible: boolean
          is_win_eligible: boolean
          name: string
          order: number
          pipeline_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_loss_eligible?: boolean
          is_win_eligible?: boolean
          name: string
          order?: number
          pipeline_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_loss_eligible?: boolean
          is_win_eligible?: boolean
          name?: string
          order?: number
          pipeline_id?: string
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
          created_at: string
          id: string
          is_active: boolean
          lost_label: string
          module: Database["public"]["Enums"]["pipeline_module"]
          name: string
          tenant_id: string
          updated_at: string
          won_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lost_label?: string
          module: Database["public"]["Enums"]["pipeline_module"]
          name: string
          tenant_id: string
          updated_at?: string
          won_label?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lost_label?: string
          module?: Database["public"]["Enums"]["pipeline_module"]
          name?: string
          tenant_id?: string
          updated_at?: string
          won_label?: string
        }
        Relationships: [
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
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
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
          comissao_padrao: number
          created_at: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean
          comissao_padrao?: number
          created_at?: string
          id?: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean
          comissao_padrao?: number
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      seguradoras: {
        Row: {
          ativo: boolean
          codigo_susep: string | null
          created_at: string
          id: string
          nome: string
          tenant_id: string | null
        }
        Insert: {
          ativo?: boolean
          codigo_susep?: string | null
          created_at?: string
          id?: string
          nome: string
          tenant_id?: string | null
        }
        Update: {
          ativo?: boolean
          codigo_susep?: string | null
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segurados_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_vendedor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "visualizador"
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
      app_role: ["admin", "vendedor", "visualizador"],
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
