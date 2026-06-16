const supabase = require('../config/database');

exports.listarPeliculas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pelicula')
      .select('*')
      .order('tituloesp');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error listando películas:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerPelicula = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('pelicula')
      .select('*')
      .eq('id_pelicula', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error obteniendo película:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.crearPelicula = async (req, res) => {
  const pelicula = req.body;
  try {
    const { data, error } = await supabase
      .from('pelicula')
      .insert([pelicula])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error creando película:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarPelicula = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from('pelicula')
      .update(updates)
      .eq('id_pelicula', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Error actualizando película:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.eliminarPelicula = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('pelicula')
      .delete()
      .eq('id_pelicula', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error('Error eliminando película:', err);
    res.status(500).json({ error: err.message });
  }
};

// Extra: obtener géneros
exports.listarGeneros = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('genero')
      .select('id_genero, nombregenero')
      .order('nombregenero');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error listando géneros:', err);
    res.status(500).json({ error: err.message });
  }
};