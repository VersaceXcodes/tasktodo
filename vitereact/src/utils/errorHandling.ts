/**
 * Error handling utilities for TaskTodo app
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  timestamp: Date;
  userId?: string;
}

export class TaskTodoError extends Error {
  public code: string;
  public timestamp: Date;
  public userId?: string;

  constructor(message: string, code = 'UNKNOWN_ERROR', userId?: string) {
    super(message);
    this.name = 'TaskTodoError';
    this.code = code;
    this.timestamp = new Date();
    this.userId = userId;
  }
}

export const errorHandler = {
  log: (error: Error | TaskTodoError) => {
    console.error('[TaskTodo Error]', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...(error instanceof TaskTodoError && {
        code: error.code,
        userId: error.userId
      })
    });
  },

  handle: (error: unknown, context = 'Unknown') => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    errorHandler.log(errorObj);
    
    // In development, show more details
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${context}:`, errorObj);
    }
    
    return {
      success: false,
      error: errorObj.message,
      code: error instanceof TaskTodoError ? error.code : 'UNKNOWN_ERROR'
    };
  },

  async withErrorHandling<T>(
    fn: () => Promise<T>,
    context = 'Operation'
  ): Promise<{ success: true; data: T } | { success: false; error: string; code: string }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return errorHandler.handle(error, context);
    }
  }
};

export default errorHandler;