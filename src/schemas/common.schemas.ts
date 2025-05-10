export const commonSchemas = {
  Error: {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string' },
      code: { type: 'string' },
      statusCode: { type: 'number' }
    }
  },
  Success: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      success: { type: 'boolean' }
    }
  }
}; 