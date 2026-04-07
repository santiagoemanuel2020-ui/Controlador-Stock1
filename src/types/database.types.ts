/**
 * Types generados para la base de datos de Supabase.
 * Estos reflejan el schema de las tablas que vamos a crear.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          created_at?: string
        }
      }
      access_codes: {
        Row: {
          id: string
          code: string
          max_uses: number
          used_count: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          max_uses?: number
          used_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          max_uses?: number
          used_count?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          price: number
          stock: number
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          price?: number
          stock?: number
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          price?: number
          stock?: number
          category?: string
          created_at?: string
        }
      }
      movements: {
        Row: {
          id: string
          product_id: string
          user_id: string
          quantity: number
          type: 'in' | 'out'
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          quantity: number
          type: 'in' | 'out'
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          quantity?: number
          type?: 'in' | 'out'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_code_usage: {
        Args: { code_id: string }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
