export const config = {
  tokenTypes: {
    access: 'access',
    refresh: 'refresh'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessTokenExpiresIn: '24h',
    refreshTokenExpiresIn: '7d'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
} as const; 