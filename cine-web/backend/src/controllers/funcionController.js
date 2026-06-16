const supabase = require('../config/database');

exports.listarFunciones = async (req, res) => {
  const { sucursal_id } = req.query;
  let query = supabase
    .from('funcion')
    .select(`
      id_funcion,
      fecha,
      diasemana,
      horainicio,
      precio,
      sala:id_sala (
        nombresala,
        cantidadbutaca,
        id_sucursal,
        sucursal:id_sucursal (
          direccion
        )
      ),
      pelicula:id_pelicula (
        id_pelicula,
        tituloesp,
        duracionhoras,
        duracionmin,
        calificacion,
        tituloorig,
        poster_url
      )
    `)
    .gte('fecha', new Date().toISOString().split('T')[0])
    .order('fecha', { ascending: true })
    .order('horainicio', { ascending: true });

  if (sucursal_id) {
    query = query.eq('sala.id_sucursal', parseInt(sucursal_id));
  }

  try {
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error listando funciones:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerFuncion = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('funcion')
      .select(`
        id_funcion,
        fecha,
        diasemana,
        horainicio,
        precio,
        sala:id_sala (
          id_sala,
          nombresala,
          cantidadbutaca,
          id_sucursal
        ),
        pelicula:id_pelicula (
          tituloesp,
          duracionhoras,
          duracionmin,
          calificacion
        )
      `)
      .eq('id_funcion', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error obteniendo función:', err);
    res.status(500).json({ error: err.message });
  }
};
// Obtener asientos ocupados de una función
exports.obtenerAsientosOcupados = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('entrada')
      .select('id_asiento')
      .eq('id_funcion', id);
    if (error) throw error;
    res.json(data.map(e => e.id_asiento));
  } catch (err) {
    console.error('Error obteniendo asientos ocupados:', err);
    res.status(500).json({ error: err.message });
  }
};