export interface GeminiInlineData {
  mime_type: string
  data: string // base64, no data: prefix
}

export interface GeminiPart {
  text?: string
  inline_data?: GeminiInlineData
}

export interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export interface GeminiRequest {
  contents: GeminiContent[]
  systemInstruction?: {
    parts: Array<{ text: string }>
  }
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
}

export interface GeminiSSEChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
      role?: string
    }
    finishReason?: string
  }>
}

export interface ChatAttachment {
  type: 'image' | 'audio'
  name: string
  mimeType: string
  data: string // base64
  previewUrl?: string // object URL for local preview
}

export interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: ChatAttachment[]
  isStreaming?: boolean
}

export interface ChatRequestBody {
  message: string
  attachments?: Array<{
    type: 'image' | 'audio'
    mimeType: string
    data: string
  }>
  context: {
    balance: number
    totalIncome: number
    totalExpenses: number
    topCategories: Array<{ name: string; amount: number; percentage: number }>
  }
  history?: GeminiContent[]
}
