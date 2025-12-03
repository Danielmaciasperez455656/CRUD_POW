// src/controllers/productController.js

const pool = require('../config/db'); // Importación directa del Pool de Conexiones

const controller = {};

// 1. LEER (Read) - Lista todos los productos
controller.list = async (req, res) => {
    try {
        // Ejecuta la consulta SQL para obtener todos los productos
        const [rows] = await pool.query('SELECT * FROM productos ORDER BY id DESC');
        
        // Renderiza la vista 'index.ejs' y le pasa los datos
        res.render('index', { data: rows });
    } catch (err) {
        console.error('Error al listar productos:', err);
        // Manejo de errores genérico: redirige a la página principal con mensaje de error
        res.redirect('/?message=error'); 
    }
};

// 2. CREAR (Create) - Guarda un nuevo producto
controller.save = async (req, res) => {
    const { nombre, precio, cantidad } = req.body;
    
    // 💡 Consejo: Aquí iría la validación de datos antes de la BD
    
    try {
        // Ejecuta la consulta SQL parametrizada (segura contra inyección SQL)
        await pool.query('INSERT INTO productos (nombre, precio, cantidad) VALUES (?, ?, ?)', [nombre, precio, cantidad]);
        
        // Redirige al listado con un mensaje de éxito para SweetAlert
        res.redirect('/?message=success&op=create');
    } catch (err) {
        console.error('Error al guardar el producto:', err);
        res.redirect('/?message=error');
    }
};

// 3. OBTENER PARA EDITAR (Read Single) - Muestra el formulario con datos
controller.edit = async (req, res) => {
    const { id } = req.params;
    try {
        // Busca el producto específico por ID
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
        
        // Renderiza la vista 'edit.ejs' y le pasa el primer (y único) resultado
        res.render('edit', { data: rows[0] });
    } catch (err) {
        console.error('Error al obtener producto para edición:', err);
        res.redirect('/?message=error');
    }
};

// 4. ACTUALIZAR (Update Logic) - Procesa la actualización
controller.update = async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;
    
    try {
        // Ejecuta la consulta SQL de actualización
        await pool.query('UPDATE productos SET nombre = ?, precio = ?, cantidad = ? WHERE id = ?', [nombre, precio, cantidad, id]);
        
        // Redirige al listado con un mensaje de éxito para SweetAlert
        res.redirect('/?message=success&op=update');
    } catch (err) {
        console.error('Error al actualizar el producto:', err);
        res.redirect('/?message=error');
    }
};

// 5. ELIMINAR (Delete)
controller.delete = async (req, res) => {
    const { id } = req.params;
    try {
        // Ejecuta la consulta SQL de eliminación
        await pool.query('DELETE FROM productos WHERE id = ?', [id]);
        
        // Redirige al listado con un mensaje de éxito para SweetAlert
        res.redirect('/?message=success&op=delete');
    } catch (err) {
        console.error('Error al eliminar el producto:', err);
        res.redirect('/?message=error');
    }
};

module.exports = controller;