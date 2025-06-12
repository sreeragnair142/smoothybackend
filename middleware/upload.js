const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Define upload directory and constraints
const uploadDir = path.join(__dirname, '../public/uploads');
const maxFileSize = 5 * 1024 * 1024; // 5MB
const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log(`Upload directory ensured at: ${uploadDir}`);
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// Call ensureUploadDir on module load
ensureUploadDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: maxFileSize },
  fileFilter: fileFilter
});

module.exports = upload;