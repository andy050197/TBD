const supabase = require('../config/database');

exports.listarSucursales = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sucursal')
            .select('id_sucursal, direccion')
            .order('id_sucursal');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};