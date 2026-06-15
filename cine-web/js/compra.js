// =============================================
// COMPRA DE ENTRADAS
// =============================================

let funcionActual = null;
let salaActual = null;
let asientosDisponibles = [];
let asientosSeleccionados = [];
let clienteActual = null;

document.addEventListener('DOMContentLoaded', async () => {
    const idFuncion = obtenerParametroURL('id_funcion');
    
    if (!idFuncion) {
        mostrarAlerta('alerta-container', 'No se especificó una función. Redirigiendo a la cartelera...', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    await cargarFuncion(parseInt(idFuncion));
    await cargarAsientosOcupados();
    renderizarMapaAsientos();
    
    document.getElementById('btn-comprar').addEventListener('click', realizarCompra);
});

async function cargarFuncion(idFuncion) {
    const { data, error } = await supabase
        .from('funcion')
        .select(`
            id_funcion,
            fecha,
            horainicio,
            precio,
            id_sala,
            pelicula:id_pelicula (
                tituloesp,
                duracionhoras,
                duracionmin,
                calificacion
            ),
            sala:id_sala (
                id_sala,
                nombresala,
                cantidadbutaca
            )
        `)
        .eq('id_funcion', idFuncion)
        .single();
    
    if (error || !data) {
        mostrarAlerta('alerta-container', 'Error al cargar la función', 'error');
        return;
    }
    
    funcionActual = data;
    salaActual = data.sala;
    
    const infoDiv = document.getElementById('info-funcion');
    infoDiv.innerHTML = `
        <h3>🎬 ${data.pelicula?.tituloesp || 'Película'}</h3>
        <p><strong>📅 Fecha:</strong> ${formatearFecha(data.fecha)}</p>
        <p><strong>⏰ Hora:</strong> ${formatearHora(data.horainicio)}</p>
        <p><strong>🏢 Sala:</strong> ${salaActual?.nombresala || 'Sala'}</p>
        <p><strong>💰 Precio por entrada:</strong> ${formatearMoneda(data.precio)}</p>
    `;
    
    document.getElementById('precio-unitario').textContent = formatearMoneda(data.precio);
    actualizarResumen();
}

async function cargarAsientosOcupados() {
    if (!funcionActual) return;
    
    const { data, error } = await supabase
        .from('entrada')
        .select('id_asiento')
        .eq('id_funcion', funcionActual.id_funcion);
    
    if (error) {
        console.error('Error cargando asientos ocupados:', error);
        return;
    }
    
    asientosDisponibles = [];
    const ocupadosIds = new Set(data.map(e => e.id_asiento));
    
    // Generar asientos para la sala (suponiendo capacidad máxima)
    const capacidad = salaActual?.cantidadbutaca || 50;
    const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const asientosPorFila = 10;
    
    for (let i = 0; i < filas.length && i * asientosPorFila < capacidad; i++) {
        for (let j = 1; j <= asientosPorFila && (i * asientosPorFila + j) <= capacidad; j++) {
            const idAsiento = i * asientosPorFila + j;
            asientosDisponibles.push({
                id: idAsiento,
                fila: filas[i],
                numero: j,
                ocupado: ocupadosIds.has(idAsiento)
            });
        }
    }
}

function renderizarMapaAsientos() {
    const container = document.getElementById('mapa-asientos-container');
    if (!container) return;
    
    container.innerHTML = '<div class="pantalla">🎬 PANTALLA</div>';
    
    // Agrupar por fila
    const asientosPorFila = {};
    asientosDisponibles.forEach(asiento => {
        if (!asientosPorFila[asiento.fila]) {
            asientosPorFila[asiento.fila] = [];
        }
        asientosPorFila[asiento.fila].push(asiento);
    });
    
    for (const [fila, asientos] of Object.entries(asientosPorFila)) {
        const filaDiv = document.createElement('div');
        filaDiv.className = 'fila';
        filaDiv.innerHTML = `<span style="width: 30px; font-weight: bold;">${fila}</span>`;
        
        asientos.forEach(asiento => {
            const asientoDiv = document.createElement('div');
            asientoDiv.className = 'asiento';
            if (asiento.ocupado) {
                asientoDiv.classList.add('ocupado');
            }
            if (asientosSeleccionados.includes(asiento.id)) {
                asientoDiv.classList.add('seleccionado');
            }
            asientoDiv.textContent = asiento.numero;
            asientoDiv.title = `Asiento ${asiento.fila}${asiento.numero}`;
            
            if (!asiento.ocupado) {
                asientoDiv.addEventListener('click', () => toggleAsiento(asiento.id));
            }
            
            filaDiv.appendChild(asientoDiv);
        });
        
        container.appendChild(filaDiv);
    }
}

function toggleAsiento(idAsiento) {
    const index = asientosSeleccionados.indexOf(idAsiento);
    if (index === -1) {
        if (asientosSeleccionados.length >= 10) {
            mostrarAlerta('alerta-container', 'Máximo 10 entradas por compra', 'error');
            return;
        }
        asientosSeleccionados.push(idAsiento);
    } else {
        asientosSeleccionados.splice(index, 1);
    }
    
    renderizarMapaAsientos();
    actualizarResumen();
}

function actualizarResumen() {
    const cantidad = asientosSeleccionados.length;
    const precioUnitario = funcionActual?.precio || 0;
    const total = cantidad * precioUnitario;
    
    document.getElementById('cantidad-entradas').textContent = cantidad;
    document.getElementById('total-pagar').textContent = formatearMoneda(total);
    
    const asientosText = asientosSeleccionados.map(id => {
        const asiento = asientosDisponibles.find(a => a.id === id);
        return asiento ? `${asiento.fila}${asiento.numero}` : id;
    }).join(', ');
    
    document.getElementById('asientos-seleccionados').textContent = asientosText || 'Ninguno';
}

async function realizarCompra() {
    if (asientosSeleccionados.length === 0) {
        mostrarAlerta('alerta-container', 'Selecciona al menos un asiento', 'error');
        return;
    }
    
    const ci = document.getElementById('ci').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    
    if (!ci || !nombre || !apellido) {
        mostrarAlerta('alerta-container', 'Completa los datos del cliente (CI, Nombre, Apellido)', 'error');
        return;
    }
    
    if (!validarCI(ci)) {
        mostrarAlerta('alerta-container', 'CI inválido (debe tener 4-10 dígitos)', 'error');
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    
    // Buscar o crear cliente
    let idCliente;
    const { data: clienteExistente } = await supabase
        .from('cliente')
        .select('id_cliente')
        .eq('ci', ci)
        .maybeSingle();
    
    if (clienteExistente) {
        idCliente = clienteExistente.id_cliente;
    } else {
        const { data: nuevoCliente, error: errorCliente } = await supabase
            .from('cliente')
            .insert([
                { nombre, apellido, ci, email, telefono }
            ])
            .select()
            .single();
        
        if (errorCliente) {
            mostrarAlerta('alerta-container', 'Error al registrar cliente', 'error');
            return;
        }
        idCliente = nuevoCliente.id_cliente;
    }
    
    // Crear factura
    const totalPagado = asientosSeleccionados.length * funcionActual.precio;
    const { data: factura, error: errorFactura } = await supabase
        .from('factura')
        .insert([
            { id_cliente: idCliente, canal: 'web', total_pagado: totalPagado, fecha_hora: new Date().toISOString() }
        ])
        .select()
        .single();
    
    if (errorFactura) {
        mostrarAlerta('alerta-container', 'Error al crear factura', 'error');
        return;
    }
    
    // Insertar entradas
    const entradas = asientosSeleccionados.map(idAsiento => ({
        id_funcion: funcionActual.id_funcion,
        id_asiento: idAsiento,
        precio: funcionActual.precio,
        fechacompra: new Date().toISOString().split('T')[0],
        id_factura: factura.id_factura
    }));
    
    const { error: errorEntradas } = await supabase
        .from('entrada')
        .insert(entradas);
    
    if (errorEntradas) {
        mostrarAlerta('alerta-container', `Error al registrar entradas: ${errorEntradas.message}`, 'error');
        return;
    }
    
    mostrarAlerta('alerta-container', `✅ Compra exitosa! Se generaron ${asientosSeleccionados.length} entradas.`, 'exito');
    
    // Limpiar selección
    asientosSeleccionados = [];
    actualizarResumen();
    await cargarAsientosOcupados();
    renderizarMapaAsientos();
}