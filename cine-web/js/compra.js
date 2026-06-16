// =============================================
// COMPRA DE ENTRADAS
// =============================================

let funcionActual = null;
let salaActual = null;
let asientosDisponibles = [];
let asientosSeleccionados = [];

document.addEventListener('DOMContentLoaded', async () => {
    const idFuncion = obtenerParametroURL('id_funcion');
    if (!idFuncion) {
        mostrarAlerta('alerta-container', 'No se especificó una función. Redirigiendo...', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }
    await cargarFuncion(parseInt(idFuncion));
    await cargarAsientosOcupados();
    renderizarMapaAsientos();
    document.getElementById('btn-comprar').addEventListener('click', realizarCompra);
});

async function cargarFuncion(idFuncion) {
    try {
        const data = await apiFetch(`/funciones/${idFuncion}`);
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
    } catch (error) {
        mostrarAlerta('alerta-container', `Error al cargar la función: ${error.message}`, 'error');
    }
}

async function cargarAsientosOcupados() {
    if (!funcionActual) return;
    try {
        const ocupadosIds = await apiFetch(`/funciones/${funcionActual.id_funcion}/asientos-ocupados`);
        const capacidad = salaActual?.cantidadbutaca || 50;
        asientosDisponibles = [];
        const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const asientosPorFila = 10;
        for (let i = 0; i < filas.length && i * asientosPorFila < capacidad; i++) {
            for (let j = 1; j <= asientosPorFila && (i * asientosPorFila + j) <= capacidad; j++) {
                const idAsiento = i * asientosPorFila + j;
                asientosDisponibles.push({
                    id: idAsiento,
                    fila: filas[i],
                    numero: j,
                    ocupado: ocupadosIds.includes(idAsiento)
                });
            }
        }
    } catch (error) {
        console.error('Error cargando asientos ocupados:', error);
    }
}

function renderizarMapaAsientos() {
    const container = document.getElementById('mapa-asientos-container');
    if (!container) return;
    container.innerHTML = '<div class="pantalla">🎬 PANTALLA</div>';
    const asientosPorFila = {};
    asientosDisponibles.forEach(asiento => {
        if (!asientosPorFila[asiento.fila]) asientosPorFila[asiento.fila] = [];
        asientosPorFila[asiento.fila].push(asiento);
    });
    for (const [fila, asientos] of Object.entries(asientosPorFila)) {
        const filaDiv = document.createElement('div');
        filaDiv.className = 'fila';
        filaDiv.innerHTML = `<span style="width: 30px; font-weight: bold;">${fila}</span>`;
        asientos.forEach(asiento => {
            const asientoDiv = document.createElement('div');
            asientoDiv.className = 'asiento';
            if (asiento.ocupado) asientoDiv.classList.add('ocupado');
            if (asientosSeleccionados.includes(asiento.id)) asientoDiv.classList.add('seleccionado');
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

    try {
        const resultado = await apiFetch('/ventas', {
            method: 'POST',
            body: JSON.stringify({
                id_funcion: funcionActual.id_funcion,
                asientos: asientosSeleccionados,
                cliente: { ci, nombre, apellido, email, telefono },
                canal: 'web'
            })
        });
        mostrarAlerta('alerta-container', `✅ Compra exitosa! Se generaron ${resultado.entradas.length} entradas.`, 'exito');
        asientosSeleccionados = [];
        actualizarResumen();
        await cargarAsientosOcupados();
        renderizarMapaAsientos();
    } catch (error) {
        mostrarAlerta('alerta-container', `❌ Error en la compra: ${error.message}`, 'error');
    }
}