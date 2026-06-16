const supabase = require('../config/database');

exports.peliculaExitosa = async (req, res) => {
  const { mes, anio } = req.query;
  if (!mes || !anio) {
    return res.status(400).json({ error: 'Faltan parámetros mes y año' });
  }

  try {
    const { data, error } = await supabase.rpc('reporte_pelicula_exitosa', {
      p_mes: parseInt(mes),
      p_anio: parseInt(anio)
    });

    if (error) {
      console.error('Error en RPC:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Error en reporte película exitosa:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.clienteFrecuente = async (req, res) => {
  const { trimestre, anio } = req.query;
  if (!trimestre || !anio) {
    return res.status(400).json({ error: 'Faltan parámetros trimestre y año' });
  }

  try {
    const mesInicio = (trimestre - 1) * 3 + 1;
    const mesFin = trimestre * 3;
    const fechaInicio = `${anio}-${String(mesInicio).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anio, mesFin, 0).getDate();
    const fechaFin = `${anio}-${String(mesFin).padStart(2, '0')}-${ultimoDia}`;

    const { data, error } = await supabase
      .from('entrada')
      .select(`
        id_entrada,
        factura:id_factura (
          id_cliente,
          cliente:id_cliente (
            id_cliente,
            nombre,
            apellido,
            ci
          )
        )
      `)
      .gte('fechacompra', fechaInicio)
      .lte('fechacompra', fechaFin);

    if (error) throw error;

    const clientes = {};
    data.forEach(entry => {
      const cliente = entry.factura?.cliente;
      if (cliente) {
        const id = cliente.id_cliente;
        if (!clientes[id]) {
          clientes[id] = {
            id_cliente: id,
            nombre: cliente.nombre || 'Anónimo',
            apellido: cliente.apellido || '',
            ci: cliente.ci || 'N/A',
            total_visitas: 0
          };
        }
        clientes[id].total_visitas++;
      }
    });

    const resultados = Object.values(clientes).sort((a, b) => b.total_visitas - a.total_visitas);
    res.json(resultados);
  } catch (err) {
    console.error('Error en cliente frecuente:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.turnosCajero = async (req, res) => {
  const { id_cajero, mes, anio } = req.query;
  if (!id_cajero || !mes || !anio) {
    return res.status(400).json({ error: 'Faltan parámetros id_cajero, mes y año' });
  }

  try {
    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    const { data, error } = await supabase
      .from('asignacion_cajero_turno')
      .select(`
        id_asignacion,
        fechaini,
        fechafin,
        registro,
        turno:id_turno (
          id_turno,
          nombreturno,
          horainicio,
          horafin
        )
      `)
      .eq('id_cajero', parseInt(id_cajero))
      .lte('fechaini', fechaFin)
      .gte('fechafin', fechaInicio);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error en turnos de cajero:', err);
    res.status(500).json({ error: err.message });
  }
};