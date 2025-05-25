export interface ExecutionRequest {
  apiName: string;
  requestBody: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface ExecutionStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
  lastExecuted: Date;
}
