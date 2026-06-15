// =============================================
// CAMBIAR ASIENTO
// =============================================

let entradaActual = null;
let funcionActual = null;
let asientosDisponibles = [];
let asientosOcupados = [];
let nuevoAsientoSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-buscar').addEventListener('click', buscarEntrada);
    document.getElementById('btn-cambiar').addEventListener('click', confirmarCambio);
});

async function buscarEntrada() {
    const idEntrada = parseInt(document.getElementById('id_entrada').value);
    const ci = document.getElementById('ci').value.trim();
    
    if (!idEntrada || !ci) {
        mostrarAlerta('alerta-container', 'Ingresa el número de entrada y tu CI', 'error');
        return;
    }
    
    if (!validarCI(ci)) {
        mostrarAlerta('alerta-container', 'CI inválido', 'error');
        return;
    }
    
    const infoDiv = document.getElementById('info-entrada');
    infoDiv.innerHTML = '<div class="loading">⏳ Verificando entrada...</div>';
    document.getElementById('cambio-container').style.display = 'none';
    
    // Buscar cliente por CI
    const { data: cliente } = await supabase
        .from('cliente')
        .select('id_cliente')
        .eq('ci', ci)
        .maybeSingle();
    
    if (!cliente) {
        infoDiv.innerHTML = '<p class="alert-error">❌ No se encontró un cliente con ese CI</p>';
        return;
    }
    
    // Buscar entrada
    const { data: entrada, error } = await supabase
        .from('entrada')
        .select(`
            id_entrada,
            precio,
            id_asiento,
            id_funcion,
            id_factura,
            funcion:id_funcion (
                id_funcion,
                fecha,
                horainicio,
                precio as precio_funcion,
                pelicula:id_pelicula (
                    tituloesp
                ),
                sala:id_sala (
                    id_sala,
                    nombresala,
                    cantidadbutaca
                )
            ),
            factura:id_factura (
                id_cliente
            )
        `)
        .eq('id_entrada', idEntrada)
        .eq('factura.id_cliente', cliente.id_cliente)
        .maybeSingle();
    
    if (error || !entrada) {
        infoDiv.innerHTML = '<p class="alert-error">❌ No se encontró la entrada. Verifica el número y tu CI.</p>';
        return;
    }
    
    entradaActual = entrada;
    funcionActual = entrada.funcion;
    
    infoDiv.innerHTML = `
        <div class="card">
            <h3>🎫 Entrada #${entradaActual.id_entrada}</h3>
            <p><strong>🎬 Película:</strong> ${funcionActual?.pelicula?.tituloesp || 'N/A'}</p>
            <p><strong>📅 Fecha función:</strong> ${formatearFecha(funcionActual?.fecha)}</p>
            <p><strong>⏰ Hora:</strong> ${formatearHora(funcionActual?.horainicio)}</p>
            <p><strong>🏢 Sala:</strong> ${funcionActual?.sala?.nombresala || 'N/A'}</p>
            <p><strong>🪑 Asiento actual:</strong> ${entradaActual.id_asiento}</p>
        </div>
    `;
    
    await cargarAsientosFuncion();
    renderizarAsientosDisponibles();
    document.getElementById('cambio-container').style.display = 'block';
}

async function cargarAsientosFuncion() {
    if (!funcionActual) return;
    
    // Obtener asientos ocupados
    const { data: ocupados } = await supabase
        .from('entrada')
        .select('id_asiento')
        .eq('id_funcion', funcionActual.id_funcion);
    
    asientosOcupados = ocupados?.map(o => o.id_asiento) || [];
    
    // Generar asientos disponibles
    asientosDisponibles = [];
    const capacidad = funcionActual.sala?.cantidadbutaca || 50;
    const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const asientosPorFila = 10;
    
    for (let i = 0; i < filas.length && i * asientosPorFila < capacidad; i++) {
        for (let j = 1; j <= asientosPorFila && (i * asientosPorFila + j) <= capacidad; j++) {
            const idAsiento = i * asientosPorFila + j;
            asientosDisponibles.push({
                id: idAsiento,
                fila: filas[i],
                numero: j,
                ocupado: asientosOcupados.includes(idAsiento) && idAsiento !== entradaActual.id_asiento
            });
        }
    }
}

function renderizarAsientosDisponibles() {
    const container = document.getElementById('nuevos-asientos-container');
    container.innerHTML = '<div class="pantalla">🎬 PANTALLA</div>';
    
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
            if (nuevoAsientoSeleccionado === asiento.id) {
                asientoDiv.classList.add('seleccionado');
            }
            asientoDiv.textContent = asiento.numero;
            
            if (!asiento.ocupado) {
                asientoDiv.addEventListener('click', () => {
                    nuevoAsientoSeleccionado = asiento.id;
                    renderizarAsientosDisponibles();
                });
            }
            
            filaDiv.appendChild(asientoDiv);
        });
        container.appendChild(filaDiv);
    }
}

async function confirmarCambio() {
    if (!nuevoAsientoSeleccionado) {
        mostrarAlerta('alerta-container', 'Selecciona un nuevo asiento', 'error');
        return;
    }
    
    if (nuevoAsientoSeleccionado === entradaActual.id_asiento) {
        mostrarAlerta('alerta-container', 'El nuevo asiento debe ser diferente al actual', 'error');
        return;
    }
    
    // Registrar cambio de asiento
    const { error: errorCambio } = await supabase
        .from('cambio_asiento')
        .insert([
            { identrada: entradaActual.id_entrada, id_asientonuevo: nuevoAsientoSeleccionado, fechacambio: new Date().toISOString().split('T')[0] }
        ]);
    
    if (errorCambio) {
        mostrarAlerta('alerta-container', `Error al cambiar asiento: ${errorCambio.message}`, 'error');
        return;
    }
    
    // Actualizar la entrada con el nuevo asiento
    const { error: errorUpdate } = await supabase
        .from('entrada')
        .update({ id_asiento: nuevoAsientoSeleccionado })
        .eq('id_entrada', entradaActual.id_entrada);
    
    if (errorUpdate) {
        mostrarAlerta('alerta-container', 'Error al actualizar el asiento', 'error');
        return;
    }
    
    mostrarAlerta('alerta-container', `✅ Asiento cambiado exitosamente al asiento ${nuevoAsientoSeleccionado}`, 'exito');
    
    // Resetear estado
    nuevoAsientoSeleccionado = null;
    entradaActual = null;
    document.getElementById('id_entrada').value = '';
    document.getElementById('ci').value = '';
    document.getElementById('info-entrada').innerHTML = '';
    document.getElementById('cambio-container').style.display = 'none';
}