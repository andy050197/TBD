// =============================================
// ADMINISTRACIÓN - REPORTES Y GESTIÓN DE PELÍCULAS
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCajeros();
    await cargarGeneros();
    await cargarListaPeliculas();
    
    document.getElementById('btn-reporte1').addEventListener('click', reportePeliculaExitosa);
    document.getElementById('btn-reporte2').addEventListener('click', reporteClienteFrecuente);
    document.getElementById('btn-reporte3').addEventListener('click', reporteTurnosCajero);
    document.getElementById('btn-agregar-pelicula').addEventListener('click', agregarPelicula);
});

// ============================================
// 1. GESTIÓN DE PELÍCULAS (CRUD)
// ============================================

async function cargarGeneros() {
    try {
        const data = await apiFetch('/peliculas/generos');
        const select = document.getElementById('nuevo_genero');
        while (select.options.length > 1) select.remove(1);
        data.forEach(genero => {
            const option = document.createElement('option');
            option.value = genero.id_genero;
            option.textContent = genero.nombregenero;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando géneros:', error);
    }
}

async function cargarListaPeliculas() {
    const container = document.getElementById('lista-peliculas-container');
    container.innerHTML = '<div class="loading"> Cargando películas...</div>';

    try {
        const data = await apiFetch('/peliculas');
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="alert-info"> No hay películas registradas.</p>';
            return;
        }
        let html = `
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Año</th>
                            <th>Duración</th>
                            <th>Póster</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        data.forEach(pelicula => {
            const posterPreview = pelicula.poster_url 
                ? `<img src="${pelicula.poster_url}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://placehold.co/50x70/1F3A4D/white?text=❌'">`
                : `<div style="width: 50px; height: 70px; background: var(--fondo-secundario); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🎬</div>`;
            html += `
                <tr>
                    <td data-label="ID">${pelicula.id_pelicula}</td>
                    <td data-label="Título"><strong>${pelicula.tituloesp}</strong><br><small>${pelicula.tituloorig || ''}</small></td>
                    <td data-label="Año">${pelicula.anioproduccion}</td>
                    <td data-label="Duración">${pelicula.duracionhoras || 0}h ${pelicula.duracionmin || 0}m</td>
                    <td data-label="Póster">${posterPreview}</td>
                    <td data-label="Acciones" style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn btn-peligro" style="padding: 5px 10px; font-size: 0.8rem;" onclick="eliminarPelicula(${pelicula.id_pelicula})">🗑️ Eliminar</button>
                        <button class="btn btn-secundario" style="padding: 5px 10px; font-size: 0.8rem;" onclick="editarPelicula(${pelicula.id_pelicula})">✏️ Editar</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p class="alert-error"> Error cargando películas: ${error.message}</p>`;
    }
}

async function agregarPelicula() {
    const tituloesp = document.getElementById('nuevo_titulo').value.trim();
    const tituloorig = document.getElementById('nuevo_titulo_orig').value.trim();
    const idiomaorig = document.getElementById('nuevo_idioma').value.trim();
    const anioproduccion = parseInt(document.getElementById('nuevo_anio').value);
    const duracionhoras = parseInt(document.getElementById('nuevo_duracion_h').value);
    const duracionmin = parseInt(document.getElementById('nuevo_duracion_m').value);
    const id_genero = document.getElementById('nuevo_genero').value;
    const calificacion = document.getElementById('nuevo_calificacion').value;
    let poster_url = document.getElementById('nuevo_url').value.trim();

    if (!tituloesp || !tituloorig || !idiomaorig || !anioproduccion || !duracionhoras || !duracionmin || !id_genero) {
        mostrarAlerta('alerta-pelicula', 'Completa todos los campos obligatorios (*)', 'error');
        return;
    }

    if (!poster_url) {
        poster_url = `https://placehold.co/300x450/1F3A4D/white?text=${encodeURIComponent(tituloesp)}`;
    }

    const nuevaPelicula = {
        tituloesp,
        tituloorig,
        idiomaorig,
        subtitulosesp: 1,
        anioproduccion,
        url: poster_url,
        duracionhoras,
        duracionmin,
        calificacion,
        fechaestreno: new Date().toISOString().split('T')[0],
        id_genero: parseInt(id_genero),
        poster_url
    };

    try {
        await apiFetch('/peliculas', {
            method: 'POST',
            body: JSON.stringify(nuevaPelicula)
        });
        mostrarAlerta('alerta-pelicula', ` Película "${tituloesp}" agregada exitosamente`, 'exito');
        document.getElementById('nuevo_titulo').value = '';
        document.getElementById('nuevo_titulo_orig').value = '';
        document.getElementById('nuevo_idioma').value = '';
        document.getElementById('nuevo_anio').value = '';
        document.getElementById('nuevo_duracion_h').value = '';
        document.getElementById('nuevo_duracion_m').value = '';
        document.getElementById('nuevo_genero').value = '';
        document.getElementById('nuevo_url').value = '';
        document.getElementById('nuevo_calificacion').value = 'ATP';
        await cargarListaPeliculas();
    } catch (error) {
        mostrarAlerta('alerta-pelicula', ` Error al agregar película: ${error.message}`, 'error');
    }
}

async function eliminarPelicula(id_pelicula) {
    if (!confirm('¿Estás seguro de eliminar esta película?')) return;
    try {
        await apiFetch(`/peliculas/${id_pelicula}`, { method: 'DELETE' });
        mostrarAlerta('alerta-pelicula', ' Película eliminada correctamente', 'exito');
        await cargarListaPeliculas();
    } catch (error) {
        mostrarAlerta('alerta-pelicula', ` Error al eliminar: ${error.message}`, 'error');
    }
}

async function editarPelicula(id_pelicula) {
    try {
        const data = await apiFetch(`/peliculas/${id_pelicula}`);
        const nuevaUrl = prompt(
            `Editar póster de "${data.tituloesp}"\n\nURL actual: ${data.poster_url || 'Sin imagen'}\n\nIngresa la nueva URL:`,
            data.poster_url || ''
        );
        if (nuevaUrl === null) return;
        await apiFetch(`/peliculas/${id_pelicula}`, {
            method: 'PUT',
            body: JSON.stringify({ poster_url: nuevaUrl || null })
        });
        mostrarAlerta('alerta-pelicula', ' Imagen actualizada correctamente', 'exito');
        await cargarListaPeliculas();
    } catch (error) {
        mostrarAlerta('alerta-pelicula', ` Error al actualizar: ${error.message}`, 'error');
    }
}

// ============================================
// 2. CAJEROS
// ============================================

async function cargarCajeros() {
    try {
        const data = await apiFetch('/cajeros');
        const select = document.getElementById('cajero_id');
        while (select.options.length > 1) select.remove(1);
        data.forEach(cajero => {
            const option = document.createElement('option');
            option.value = cajero.id_cajero;
            option.textContent = `${cajero.nombres} ${cajero.apellidos}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando cajeros:', error);
    }
}

// ============================================
// 3. REPORTES
// ============================================

async function reportePeliculaExitosa() {
    const mes = document.getElementById('mes').value;
    const anio = document.getElementById('anio').value;
    const container = document.getElementById('reporte1-container');
    container.innerHTML = '<div class="loading"> Generando reporte...</div>';

    try {
        const data = await apiFetch(`/reportes/pelicula-exitosa?mes=${mes}&anio=${anio}`);
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="alert-info"> No hay ventas registradas para este período.</p>';
            return;
        }
        let html = `
            <div class="card">
                <h4> Películas más vistas (${mes}/${anio})</h4>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Sucursal</th>
                                <th>Sala</th>
                                <th>Película</th>
                                <th>Género</th>
                                <th>Duración</th>
                                <th>Entradas</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        data.forEach((item, index) => {
            html += `
                <tr>
                    <td data-label="#">${index + 1}</td>
                    <td data-label="Sucursal">${item.sucursal_nombre}</td>
                    <td data-label="Sala">${item.nombresala}</td>
                    <td data-label="Película"><strong>${item.tituloesp}</strong></td>
                    <td data-label="Género">${item.genero}</td>
                    <td data-label="Duración">${item.duracion}</td>
                    <td data-label="Entradas">${item.total_entradas}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p class="alert-error"> Error: ${error.message}</p>`;
    }
}

async function reporteClienteFrecuente() {
    const trimestre = document.getElementById('trimestre').value;
    const anio = document.getElementById('anio2').value;
    const container = document.getElementById('reporte2-container');
    container.innerHTML = '<div class="loading"> Generando reporte...</div>';

    try {
        const data = await apiFetch(`/reportes/cliente-frecuente?trimestre=${trimestre}&anio=${anio}`);
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="alert-info"> No hay compras registradas en este período.</p>';
            return;
        }
        const topCliente = data[0];
        let html = `
            <div class="card" style="background-color: var(--fondo-secundario);">
                <h3>🏆 Cliente más frecuente</h3>
                <p><strong>Nombre:</strong> ${topCliente.nombre} ${topCliente.apellido}</p>
                <p><strong>CI:</strong> ${topCliente.ci}</p>
                <p><strong>Total de visitas:</strong> ${topCliente.total_visitas}</p>
            </div>
            <h4> Top 10 clientes</h4>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr><th>#</th><th>CI</th><th>Nombre</th><th>Visitas</th></tr>
                    </thead>
                    <tbody>
        `;
        data.slice(0, 10).forEach((cliente, index) => {
            html += `
                <tr>
                    <td data-label="#">${index + 1}</td>
                    <td data-label="CI">${cliente.ci}</td>
                    <td data-label="Nombre">${cliente.nombre} ${cliente.apellido}</td>
                    <td data-label="Visitas">${cliente.total_visitas}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p class="alert-error"> Error: ${error.message}</p>`;
    }
}

async function reporteTurnosCajero() {
    const idCajero = document.getElementById('cajero_id').value;
    const mes = document.getElementById('mes3').value;
    const anio = document.getElementById('anio3').value;
    const container = document.getElementById('reporte3-container');

    if (!idCajero) {
        mostrarAlerta('alerta-container', 'Selecciona un cajero', 'error');
        return;
    }

    container.innerHTML = '<div class="loading"> Generando reporte...</div>';

    try {
        const data = await apiFetch(`/reportes/turnos-cajero?id_cajero=${idCajero}&mes=${mes}&anio=${anio}`);
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="alert-info"> No hay asignaciones de turno para este cajero en el período seleccionado.</p>';
            return;
        }
        let html = `
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Turno</th>
                            <th>Horario</th>
                            <th>Fecha inicio</th>
                            <th>Fecha fin</th>
                            <th>Registro</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        data.forEach(asignacion => {
            const turno = asignacion.turno;
            html += `
                <tr>
                    <td data-label="Turno"><strong>${turno?.nombreturno || 'N/A'}</strong></td>
                    <td data-label="Horario">${formatearHora(turno?.horainicio)} - ${formatearHora(turno?.horafin)}</td>
                    <td data-label="Fecha inicio">${formatearFecha(asignacion.fechaini)}</td>
                    <td data-label="Fecha fin">${formatearFecha(asignacion.fechafin)}</td>
                    <td data-label="Registro">${asignacion.registro || '-'}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p class="alert-error"> Error: ${error.message}</p>`;
    }
}