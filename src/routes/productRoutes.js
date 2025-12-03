const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Definimos las rutas y las vinculamos al controlador
router.get('/', productController.list);
router.get('/create', (req, res) => res.render('create')); // Renderiza form crear
router.post('/add', productController.save);
router.get('/update/:id', productController.edit);
router.post('/update/:id', productController.update);
router.get('/delete/:id', productController.delete);

module.exports = router;