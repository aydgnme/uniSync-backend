export const logger = {
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
}; 