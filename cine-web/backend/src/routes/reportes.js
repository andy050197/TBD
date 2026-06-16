const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/pelicula-exitosa', reporteController.peliculaExitosa);
router.get('/cliente-frecuente', reporteController.clienteFrecuente);
router.get('/turnos-cajero', reporteController.turnosCajero);

module.exports = router;