const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.post('/', ventaController.venderEntradas);
router.get('/mis-entradas', ventaController.obtenerEntradasPorCI);
router.put('/cambiar-asiento', ventaController.cambiarAsiento);

module.exports = router;