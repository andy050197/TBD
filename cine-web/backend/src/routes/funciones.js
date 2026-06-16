const express = require('express');
const router = express.Router();
const funcionController = require('../controllers/funcionController');

router.get('/', funcionController.listarFunciones);
router.get('/:id', funcionController.obtenerFuncion);
router.get('/:id/asientos-ocupados', funcionController.obtenerAsientosOcupados);
module.exports = router;
