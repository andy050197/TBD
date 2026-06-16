const supabase = require('../config/database');

exports.venderEntradas = async (req, res) => {
  const { id_funcion, asientos, cliente, canal } = req.body;
  // cliente: { ci, nombre, apellido, email, telefono }
  // asientos: array de id_asiento
  // canal: 'web' o 'caja'

  try {
    // 1. Buscar o crear cliente
    let id_cliente;
    const { data: clienteExistente } = await supabase
      .from('cliente')
      .select('id_cliente')
      .eq('ci', cliente.ci)
      .maybeSingle();

    if (clienteExistente) {
      id_cliente = clienteExistente.id_cliente;
    } else {
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from('cliente')
        .insert([{
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          ci: cliente.ci,
          email: cliente.email || null,
          telefono: cliente.telefono || null
        }])
        .select()
        .single();
      if (errCliente) throw errCliente;
      id_cliente = nuevoCliente.id_cliente;
    }

    // 2. Obtener precio de la función
    const { data: funcion, error: errFunc } = await supabase
      .from('funcion')
      .select('precio')
      .eq('id_funcion', id_funcion)
      .single();
    if (errFunc) throw errFunc;
    const precioUnitario = funcion.precio;

    // 3. Crear factura
    const total = asientos.length * precioUnitario;
    const { data: factura, error: errFactura } = await supabase
      .from('factura')
      .insert([{
        id_cliente,
        canal,
        total_pagado: total,
        fecha_hora: new Date().toISOString()
      }])
      .select()
      .single();
    if (errFactura) throw errFactura;

    // 4. Insertar entradas
    const entradas = asientos.map(id_asiento => ({
      id_funcion,
      id_asiento,
      precio: precioUnitario,
      fechacompra: new Date().toISOString().split('T')[0],
      id_factura: factura.id_factura,
      id_cliente
    }));

    const { data: entradasInsertadas, error: errEntradas } = await supabase
      .from('entrada')
      .insert(entradas)
      .select();
    if (errEntradas) throw errEntradas;

    res.status(201).json({
      factura: factura,
      entradas: entradasInsertadas
    });
  } catch (err) {
    console.error('Error en venta:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.obtenerEntradasPorCI = async (req, res) => {
  const { ci } = req.query;
  if (!ci) {
    return res.status(400).json({ error: 'Se requiere CI' });
  }

  try {
    const { data: cliente, error: errCliente } = await supabase
      .from('cliente')
      .select('id_cliente, nombre, apellido')
      .eq('ci', ci)
      .maybeSingle();
    if (errCliente) throw errCliente;
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { data: entradas, error: errEntradas } = await supabase
      .from('entrada')
      .select(`
        id_entrada,
        precio,
        fechacompra,
        id_asiento,
        funcion:id_funcion (
          id_funcion,
          fecha,
          horainicio,
          precio ,
          pelicula:id_pelicula (
            tituloesp
          ),
          sala:id_sala (
            nombresala,
            sucursal:id_sucursal (
              direccion
            )
          )
        ),
        factura:id_factura (
          total_pagado,
          canal
        )
      `)
      .eq('factura.id_cliente', cliente.id_cliente)
      .order('fechacompra', { ascending: false });

    if (errEntradas) throw errEntradas;

    res.json({
      cliente,
      entradas
    });
  } catch (err) {
    console.error('Error obteniendo entradas por CI:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.cambiarAsiento = async (req, res) => {
  const { id_entrada, id_asiento_nuevo } = req.body;
  try {
    // Verificar que la entrada existe
    const { data: entrada, error: errEntrada } = await supabase
      .from('entrada')
      .select('id_entrada, id_asiento, id_funcion')
      .eq('id_entrada', id_entrada)
      .single();
    if (errEntrada) throw errEntrada;

    // Registrar cambio en bitácora
    const { error: errCambio } = await supabase
      .from('cambio_asiento')
      .insert([{
        id_entrada: id_entrada,
        id_asiento: id_asiento_nuevo,
        fechacambio: new Date().toISOString().split('T')[0]
      }]);
    if (errCambio) throw errCambio;

    // Actualizar entrada con nuevo asiento
    const { data: updated, error: errUpdate } = await supabase
      .from('entrada')
      .update({ id_asiento: id_asiento_nuevo })
      .eq('id_entrada', id_entrada)
      .select();
    if (errUpdate) throw errUpdate;

    res.json(updated[0]);
  } catch (err) {
    console.error('Error cambiando asiento:', err);
    res.status(500).json({ error: err.message });
  }
};