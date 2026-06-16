const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
const peliculasRoutes = require('./routes/peliculas');
const funcionesRoutes = require('./routes/funciones');
const ventasRoutes = require('./routes/ventas');
const cajerosRoutes = require('./routes/cajeros');
const reportesRoutes = require('./routes/reportes');

app.use('/api/peliculas', peliculasRoutes);
app.use('/api/funciones', funcionesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/cajeros', cajerosRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;