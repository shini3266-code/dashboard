export interface Memo {
    id: string
    title: string
    content: string
    category: string
    linked_symbol?: string
    pinned: boolean
    created_at: string
    updated_at: string
  }
  
  export interface Category {
    id: string
    name: string
    color: string
  }
  
  export const DEFAULT_COLORS = [
    '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#64748b'
  ]
  