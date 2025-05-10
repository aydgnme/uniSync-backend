export const multipartOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum number of files
  },
  attachFieldsToBody: true,
  onFile: (part: any) => {
    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(part.mimetype)) {
      throw new Error('Invalid file type');
    }
  }
}; 