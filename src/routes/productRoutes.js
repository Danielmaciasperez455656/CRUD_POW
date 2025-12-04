const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura carpeta de uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Config multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, name);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.test(ext));
    }
});

router.get('/', productController.list);
router.get('/create', (req, res) => res.render('create'));
router.post('/add', upload.single('imagen'), productController.save);
router.get('/update/:id', productController.edit);
router.post('/update/:id', upload.single('imagen'), productController.update);
// Cambiamos a POST para borrar
router.post('/delete/:id', productController.delete);

module.exports = router;
