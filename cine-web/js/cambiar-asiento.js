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
    infoDiv.innerHTML = '<div class="loading"> Verificando entrada...</div>';
    document.getElementById('cambio-container').style.display = 'none';

    try {
        // Obtener entrada usando la API
        const data = await apiFetch(`/ventas/mis-entradas?ci=${ci}`);
        if (!data || !data.entradas) {
            infoDiv.innerHTML = '<p class="alert-error"> No se encontraron entradas para este CI.</p>';
            return;
        }
        const entrada = data.entradas.find(e => e.id_entrada === idEntrada);
        if (!entrada) {
            infoDiv.innerHTML = '<p class="alert-error"> No se encontró la entrada. Verifica el número.</p>';
            return;
        }
        entradaActual = entrada;
        funcionActual = entrada.funcion;

        infoDiv.innerHTML = `
            <div class="card">
                <h3>🎫 Entrada #${entradaActual.id_entrada}</h3>
                <p><strong> Película:</strong> ${funcionActual?.pelicula?.tituloesp || 'N/A'}</p>
                <p><strong> Fecha función:</strong> ${formatearFecha(funcionActual?.fecha)}</p>
                <p><strong> Hora:</strong> ${formatearHora(funcionActual?.horainicio)}</p>
                <p><strong> Sala:</strong> ${funcionActual?.sala?.nombresala || 'N/A'}</p>
                <p><strong> Asiento actual:</strong> ${entradaActual.id_asiento}</p>
            </div>
        `;

        await cargarAsientosFuncion();
        renderizarAsientosDisponibles();
        document.getElementById('cambio-container').style.display = 'block';
    } catch (error) {
        infoDiv.innerHTML = `<p class="alert-error"> Error: ${error.message}</p>`;
    }
}

async function cargarAsientosFuncion() {
    if (!funcionActual) return;
    try {
        const ocupadosIds = await apiFetch(`/funciones/${funcionActual.id_funcion}/asientos-ocupados`);
        const capacidad = funcionActual.sala?.cantidadbutaca || 50;
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
                    ocupado: ocupadosIds.includes(idAsiento) && idAsiento !== entradaActual.id_asiento
                });
            }
        }
    } catch (error) {
        console.error('Error cargando asientos:', error);
    }
}

function renderizarAsientosDisponibles() {
    const container = document.getElementById('nuevos-asientos-container');
    container.innerHTML = '<div class="pantalla"> PANTALLA</div>';
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
            if (nuevoAsientoSeleccionado === asiento.id) asientoDiv.classList.add('seleccionado');
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
    try {
        await apiFetch('/ventas/cambiar-asiento', {
            method: 'PUT',
            body: JSON.stringify({
                id_entrada: entradaActual.id_entrada,
                id_asiento_nuevo: nuevoAsientoSeleccionado
            })
        });
        mostrarAlerta('alerta-container', ` Asiento cambiado exitosamente al asiento ${nuevoAsientoSeleccionado}`, 'exito');
        nuevoAsientoSeleccionado = null;
        entradaActual = null;
        document.getElementById('id_entrada').value = '';
        document.getElementById('ci').value = '';
        document.getElementById('info-entrada').innerHTML = '';
        document.getElementById('cambio-container').style.display = 'none';
    } catch (error) {
        mostrarAlerta('alerta-container', ` Error al cambiar asiento: ${error.message}`, 'error');
    }
}