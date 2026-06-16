const express = require('express');
const router = express.Router();
const cajeroController = require('../controllers/cajeroController');

router.get('/', cajeroController.listarCajeros);

module.exports = router;