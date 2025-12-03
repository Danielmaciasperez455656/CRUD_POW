const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const productRoutes = require('./src/routes/productRoutes');

const app = express();
dotenv.config();

// Configuración
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middlewares (Para entender los datos del formulario)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Archivos estáticos (CSS)
app.use(express.static(path.join(__dirname, 'src/public')));

// Rutas
app.use('/', productRoutes);

// Iniciar servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});