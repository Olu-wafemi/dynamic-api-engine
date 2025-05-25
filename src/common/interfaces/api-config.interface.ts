export interface ApiConfig {
  name: string;
  method: 'POST';
  body: Record<string, any>;
  customValidation: string;
}

export interface ExecutionData {
  body: Record<string, any>;
}
