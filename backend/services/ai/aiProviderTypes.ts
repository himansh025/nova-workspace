export interface AIModelCapability {
  textGeneration: boolean;
  streaming: boolean;
  multimodal?: boolean;
  longContext?: boolean;
  functionCalling?: boolean;
  codeExecution?: boolean;
}

export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  capabilities: AIModelCapability;
  isDefault?: boolean;
}

export interface AIChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateOptions {
  model: string;
  systemInstruction?: string;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface GenerateResult {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
  durationMs: number;
}

export interface StreamChunk {
  text: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIProvider {
  readonly name: string;
  generate(apiKey: string, options: GenerateOptions): Promise<GenerateResult>;
  generateStream(apiKey: string, options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown>;
  validateCredentials(apiKey: string): Promise<{ valid: boolean; error?: string }>;
  listModels(apiKey?: string): Promise<AIModelInfo[]>;
}
