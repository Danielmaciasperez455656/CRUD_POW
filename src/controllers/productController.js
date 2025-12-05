const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

const ITEMS_PER_PAGE = 8;

const controller = {};

function deleteFileIfExists(filepath) {
    if (!filepath) return;
    const full = path.join(__dirname, '..', 'public', filepath);
    if (fs.existsSync(full)) {
        try { fs.unlinkSync(full); } catch (e) { /* ignore */ }
    }
}

controller.list = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || ITEMS_PER_PAGE);
        const offset = (page - 1) * limit;

        const sort = req.query.sort || 'id';
        const order = (req.query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const allowedSort = ['id','nombre','precio','cantidad'];
        const orderBy = allowedSort.includes(sort) ? sort : 'id';
        const search = req.query.q ? `%${req.query.q}%` : '%';

        const [countRows] = await pool.query(
            'SELECT COUNT(*) AS total FROM productos WHERE nombre LIKE ?',
            [search]
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        const [rows] = await pool.query(
            `SELECT * FROM productos WHERE nombre LIKE ? ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`,
            [search, limit, offset]
        );

        const [[{ total_productos }]] = await pool.query('SELECT COUNT(*) AS total_productos FROM productos');
        const [[{ valor_total }]] = await pool.query('SELECT IFNULL(SUM(precio * cantidad),0) AS valor_total FROM productos');
        const [mostStockRows] = await pool.query('SELECT nombre, cantidad FROM productos ORDER BY cantidad DESC LIMIT 3');

        res.render('index', {
            data: rows,
            pagination: { page, totalPages, limit, total },
            query: { q: req.query.q || '', sort: orderBy, order },
            stats: {
                total_productos,
                valor_total,
                top_stock: mostStockRows
            }
        });
    } catch (err) {
        console.error('Error al listar productos:', err);
        res.redirect('/?message=error&reason=server');
    }
};

// manejo de imagen
controller.save = async (req, res) => {
    const { nombre, precio, cantidad } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    if (!nombre || nombre.trim().length < 2) {
        if (imagen) deleteFileIfExists(imagen);
        return res.redirect('/?message=error&reason=invalid_name');
    }
    const p = parseFloat(precio);
    const c = parseInt(cantidad);
    if (isNaN(p) || p <= 0) {
        if (imagen) deleteFileIfExists(imagen);
        return res.redirect('/?message=error&reason=invalid_price');
    }
    if (isNaN(c) || c < 0) {
        if (imagen) deleteFileIfExists(imagen);
        return res.redirect('/?message=error&reason=invalid_qty');
    }

    try {
        await pool.query(
            'INSERT INTO productos (nombre, precio, cantidad, imagen) VALUES (?, ?, ?, ?)',
            [nombre.trim(), p, c, imagen]
        );
        res.redirect('/?message=success&op=create');
    } catch (err) {
        console.error('Error al guardar el producto:', err);
        if (imagen) deleteFileIfExists(imagen);
        res.redirect('/?message=error&reason=server');
    }
};

controller.edit = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.redirect('/?message=error&reason=invalid_id');
    try {
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
        if (!rows.length) return res.redirect('/?message=error&reason=not_found');
        res.render('edit', { data: rows[0] });
    } catch (err) {
        console.error('Error al obtener producto para edición:', err);
        res.redirect('/?message=error&reason=server');
    }
};

controller.update = async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;
    if (!id || isNaN(id)) return res.redirect('/?message=error&reason=invalid_id');
    if (!nombre || nombre.trim().length < 2) return res.redirect('/?message=error&reason=invalid_name');
    const p = parseFloat(precio);
    const c = parseInt(cantidad);
    if (isNaN(p) || p <= 0) return res.redirect('/?message=error&reason=invalid_price');
    if (isNaN(c) || c < 0) return res.redirect('/?message=error&reason=invalid_qty');

    try {
        const [rows] = await pool.query('SELECT imagen FROM productos WHERE id = ?', [id]);
        if (!rows.length) return res.redirect('/?message=error&reason=not_found');

        const oldImg = rows[0].imagen;
        const newImg = req.file ? `/uploads/${req.file.filename}` : oldImg;

        await pool.query(
            'UPDATE productos SET nombre = ?, precio = ?, cantidad = ?, imagen = ? WHERE id = ?',
            [nombre.trim(), p, c, newImg, id]
        );

        if (req.file && oldImg) deleteFileIfExists(oldImg);

        res.redirect('/?message=success&op=update');
    } catch (err) {
        console.error('Error al actualizar el producto:', err);
        if (req.file) deleteFileIfExists(`/uploads/${req.file.filename}`);
        res.redirect('/?message=error&reason=server');
    }
};

controller.delete = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.redirect('/?message=error&reason=invalid_id');

    try {
        const [rows] = await pool.query('SELECT imagen FROM productos WHERE id = ?', [id]);
        if (!rows.length) return res.redirect('/?message=error&reason=not_found');

        const img = rows[0].imagen;
        await pool.query('DELETE FROM productos WHERE id = ?', [id]);

        if (img) deleteFileIfExists(img);

        res.redirect('/?message=success&op=delete');
    } catch (err) {
        console.error('Error al eliminar el producto:', err);
        res.redirect('/?message=error&reason=server');
    }
};

module.exports = controller;
