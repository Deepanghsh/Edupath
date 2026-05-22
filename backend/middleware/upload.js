const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── LOCAL STORAGE (default when USE_CLOUDINARY=false) ────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `marksheet-${unique}${path.extname(file.originalname)}`);
  },
});

// ── CLOUDINARY STORAGE (when USE_CLOUDINARY=true) ───────────────────────────
let cloudinaryStorage;
if (process.env.USE_CLOUDINARY === 'true') {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         'edupath_marksheets',
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
      resource_type:  'auto',
    },
  });
}

// ── FILE FILTER ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: process.env.USE_CLOUDINARY === 'true' ? cloudinaryStorage : localStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

module.exports = upload;
