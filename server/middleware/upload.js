const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const inventoryDir = path.join(uploadsDir, 'inventory');
const thumbnailsDir = path.join(uploadsDir, 'inventory', 'thumbnails');

[uploadsDir, inventoryDir, thumbnailsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, inventoryDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-randomstring-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `img-${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

// Create multer upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit (as requested by user)
        files: 5 // Max 5 images per item
    }
});

/**
 * Optimize and resize uploaded image
 * @param {string} filePath - Path to original image
 * @returns {Promise<void>}
 */
async function optimizeImage(filePath) {
    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        
        // Resize if width > 1200px (maintain aspect ratio)
        if (metadata.width > 1200) {
            await image
                .resize(1200, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .jpeg({ quality: 85, progressive: true })
                .toFile(filePath + '.tmp');
            
            // Replace original with optimized
            fs.renameSync(filePath + '.tmp', filePath);
        }
        
        // Generate thumbnail (200x200)
        const filename = path.basename(filePath);
        const thumbnailPath = path.join(thumbnailsDir, filename);
        
        await sharp(filePath)
            .resize(200, 200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
            
    } catch (error) {
        console.error('Image optimization error:', error);
        // Don't throw - allow upload to proceed even if optimization fails
    }
}

/**
 * Middleware to handle image optimization after upload
 */
function processUploadedImages(req, res, next) {
    if (!req.files || req.files.length === 0) {
        return next();
    }
    
    // Optimize all uploaded images
    const optimizePromises = req.files.map(file => 
        optimizeImage(file.path)
    );
    
    Promise.all(optimizePromises)
        .then(() => next())
        .catch(err => {
            console.error('Image processing error:', err);
            // Continue anyway - optimization is not critical
            next();
        });
}

/**
 * Delete image files from filesystem
 * @param {string[]} imagePaths - Array of image paths to delete
 */
function deleteImages(imagePaths) {
    if (!Array.isArray(imagePaths)) return;
    
    imagePaths.forEach(imagePath => {
        if (!imagePath) return;
        
        try {
            // Delete main image
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
            
            // Delete thumbnail
            const filename = path.basename(imagePath);
            const thumbnailPath = path.join(thumbnailsDir, filename);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    });
}

module.exports = {
    upload,
    processUploadedImages,
    optimizeImage,
    deleteImages
};
