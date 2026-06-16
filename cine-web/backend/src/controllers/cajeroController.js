const supabase = require('../config/database');

exports.listarCajeros = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cajero')
      .select('id_cajero, nombres, apellidos')
      .order('nombres');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error listando cajeros:', err);
    res.status(500).json({ error: err.message });
  }
};