const path = require('path');

module.exports = {
  uploadDir: path.join(__dirname, '../uploads'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif']
};