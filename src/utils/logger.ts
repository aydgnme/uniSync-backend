export const logger = {
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error || '');
    if (error?.stack) {
      console.error(`[${timestamp}] [ERROR] Stack:`, error.stack);
    }
  },
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] [INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${timestamp}] [DEBUG] ${message}`, data || '');
    }
  },
  http: (method: string, path: string, statusCode: number, duration: number) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] [HTTP] ${method} ${path} ${statusCode} ${duration}ms`);
  },
  sql: (query: string, params?: any) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${timestamp}] [SQL] ${query}`, params || '');
    }
  },
  performance: (operation: string, duration: number) => {
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] [PERFORMANCE] ${operation} took ${duration}ms`);
  }
}; 