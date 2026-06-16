// =============================================
// ADMINISTRACIÓN - REPORTES Y GESTIÓN DE PELÍCULAS
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCajeros();
    await cargarGeneros();
    await cargarListaPeliculas();
    
    // Eventos de reportes
    document.getElementById('btn-reporte1').addEventListener('click', reportePeliculaExitosa);
    document.getElementById('btn-reporte2').addEventListener('click', reporteClienteFrecuente);
    document.getElementById('btn-reporte3').addEventListener('click', reporteTurnosCajero);
    
    // Evento de agregar película
    document.getElementById('btn-agregar-pelicula').addEventListener('click', agregarPelicula);
});

// ============================================
// 1. GESTIÓN DE PELÍCULAS (CRUD)
// ============================================

// Cargar géneros para el select
async function cargarGeneros() {
    const { data, error } = await supabase
        .from('genero')
        .select('id_genero, nombregenero_')
        .order('nombregenero_');
    
    if (error) {
        console.error('Error cargando géneros:', error);
        return;
    }
    
    const select = document.getElementById('nuevo_genero');
    data.forEach(genero => {
        const option = document.createElement('option');
        option.value = genero.id_genero;
        option.textContent = genero.nombregenero_;
        select.appendChild(option);
    });
}

// Cargar lista de películas existentes
async function cargarListaPeliculas() {
    const container = document.getElementById('lista-peliculas-container');
    container.innerHTML = '<div class="loading">⏳ Cargando películas...</div>';
    
    const { data, error } = await supabase
        .from('pelicula')
        .select('id_pelicula, tituloesp, tituloorig, poster_url, anioproduccion, duracionhoras, duracionmin')
        .order('tituloesp');
    
    if (error) {
        container.innerHTML = '<p class="alert-error">❌ Error cargando películas</p>';
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="alert-info">📋 No hay películas registradas.</p>';
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
}

// Agregar nueva película
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
    
    // Validaciones
    if (!tituloesp || !tituloorig || !idiomaorig || !anioproduccion || !duracionhoras || !duracionmin || !id_genero) {
        mostrarAlerta('alerta-pelicula', 'Completa todos los campos obligatorios (*)', 'error');
        return;
    }
    
    // Si no hay URL de imagen, generar placeholder
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
        poster_url: poster_url
    };
    
    const { data, error } = await supabase
        .from('pelicula')
        .insert([nuevaPelicula])
        .select();
    
    if (error) {
        mostrarAlerta('alerta-pelicula', '❌ Error al agregar película: ' + error.message, 'error');
        return;
    }
    
    mostrarAlerta('alerta-pelicula', `✅ Película "${tituloesp}" agregada exitosamente`, 'exito');
    
    // Limpiar formulario
    document.getElementById('nuevo_titulo').value = '';
    document.getElementById('nuevo_titulo_orig').value = '';
    document.getElementById('nuevo_idioma').value = '';
    document.getElementById('nuevo_anio').value = '';
    document.getElementById('nuevo_duracion_h').value = '';
    document.getElementById('nuevo_duracion_m').value = '';
    document.getElementById('nuevo_genero').value = '';
    document.getElementById('nuevo_url').value = '';
    document.getElementById('nuevo_calificacion').value = 'ATP';
    
    // Recargar lista
    await cargarListaPeliculas();
}

// Eliminar película
async function eliminarPelicula(id_pelicula) {
    if (!confirm('¿Estás seguro de eliminar esta película? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const { error } = await supabase
        .from('pelicula')
        .delete()
        .eq('id_pelicula', id_pelicula);
    
    if (error) {
        mostrarAlerta('alerta-pelicula', '❌ Error al eliminar película: ' + error.message, 'error');
        return;
    }
    
    mostrarAlerta('alerta-pelicula', '✅ Película eliminada correctamente', 'exito');
    await cargarListaPeliculas();
}

// Editar película (muestra un prompt para cambiar la URL de la imagen)
async function editarPelicula(id_pelicula) {
    // Primero obtener datos actuales
    const { data, error } = await supabase
        .from('pelicula')
        .select('tituloesp, poster_url')
        .eq('id_pelicula', id_pelicula)
        .single();
    
    if (error) {
        mostrarAlerta('alerta-pelicula', '❌ Error al obtener datos de la película', 'error');
        return;
    }
    
    const nuevaUrl = prompt(
        `Editar póster de "${data.tituloesp}"\n\nURL actual: ${data.poster_url || 'Sin imagen'}\n\nIngresa la nueva URL de la imagen:`,
        data.poster_url || ''
    );
    
    if (nuevaUrl === null) return; // Canceló
    
    const { error: updateError } = await supabase
        .from('pelicula')
        .update({ poster_url: nuevaUrl || null })
        .eq('id_pelicula', id_pelicula);
    
    if (updateError) {
        mostrarAlerta('alerta-pelicula', '❌ Error al actualizar la imagen', 'error');
        return;
    }
    
    mostrarAlerta('alerta-pelicula', `✅ Imagen de "${data.tituloesp}" actualizada correctamente`, 'exito');
    await cargarListaPeliculas();
}

// ============================================
// 2. CAJEROS PARA REPORTE 3
// ============================================

async function cargarCajeros() {
    const { data, error } = await supabase
        .from('cajero')
        .select('id_cajero, nombres, apellidos')
        .order('nombres');
    
    if (error) {
        console.error('Error cargando cajeros:', error);
        return;
    }
    
    const select = document.getElementById('cajero_id');
    data.forEach(cajero => {
        const option = document.createElement('option');
        option.value = cajero.id_cajero;
        option.textContent = `${cajero.nombres} ${cajero.apellidos}`;
        select.appendChild(option);
    });
}

// ============================================
// 3. REPORTE 1: PELÍCULA MÁS EXITOSA
// ============================================

async function reportePeliculaExitosa() {
    const mes = document.getElementById('mes').value;
    const anio = document.getElementById('anio').value;
    const container = document.getElementById('reporte1-container');
    
    container.innerHTML = '<div class="loading">⏳ Generando reporte...</div>';
    
    try {
        const { data, error } = await supabase
            .from('entrada')
            .select(`
                id_entrada,
                funcion: id_funcion (
                    id_funcion,
                    fecha,
                    sala: id_sala (
                        id_sala,
                        nombresala,
                        sucursal: id_sucursal (
                            id_sucursal,
                            nombre
                        )
                    ),
                    pelicula: id_pelicula (
                        id_pelicula,
                        tituloesp,
                        duracionhoras,
                        duracionmin,
                        genero: id_genero (
                            nombregenero_
                        )
                    )
                ),
                factura: id_factura (
                    fecha_hora
                )
            `)
            .gte('factura.fecha_hora', `${anio}-${mes.padStart(2, '0')}-01`)
            .lte('factura.fecha_hora', `${anio}-${mes.padStart(2, '0')}-31`);
        
        if (error || !data || data.length === 0) {
            container.innerHTML = '<p class="alert-info">📊 No hay ventas registradas para este período.</p>';
            return;
        }
        
        // Agrupar por sucursal, sala, película
        const grupos = {};
        data.forEach(entrada => {
            const funcion = entrada.funcion;
            if (!funcion) return;
            const sala = funcion.sala;
            if (!sala) return;
            const pelicula = funcion.pelicula;
            if (!pelicula) return;
            const sucursal = sala.sucursal;
            
            const key = `${sucursal?.id_sucursal || '0'}|${sala.id_sala}|${pelicula.id_pelicula}`;
            if (!grupos[key]) {
                grupos[key] = {
                    sucursal: sucursal?.nombre || 'Sucursal ' + (sucursal?.id_sucursal || ''),
                    sala: sala.nombresala || 'Sala ' + sala.id_sala,
                    pelicula: pelicula.tituloesp || 'Sin título',
                    genero: pelicula.genero?.nombregenero_ || 'N/A',
                    duracion: `${pelicula.duracionhoras || 0}h ${pelicula.duracionmin || 0}m`,
                    total: 0
                };
            }
            grupos[key].total++;
        });
        
        const resultados = Object.values(grupos).sort((a, b) => b.total - a.total);
        
        let html = `
            <div class="card">
                <h4>📊 Top 10 películas más vistas (${mes}/${anio})</h4>
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
        
        resultados.slice(0, 10).forEach((item, index) => {
            html += `
                <tr>
                    <td data-label="#">${index + 1}</td>
                    <td data-label="Sucursal">${item.sucursal}</td>
                    <td data-label="Sala">${item.sala}</td>
                    <td data-label="Película"><strong>${item.pelicula}</strong></td>
                    <td data-label="Género">${item.genero}</td>
                    <td data-label="Duración">${item.duracion}</td>
                    <td data-label="Entradas">${item.total}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
        
    } catch (e) {
        container.innerHTML = '<p class="alert-error">❌ Error generando reporte</p>';
        console.error(e);
    }
}

// ============================================
// 4. REPORTE 2: CLIENTE MÁS FRECUENTE
// ============================================

async function reporteClienteFrecuente() {
    const trimestre = document.getElementById('trimestre').value;
    const anio = document.getElementById('anio2').value;
    const container = document.getElementById('reporte2-container');
    
    container.innerHTML = '<div class="loading">⏳ Generando reporte...</div>';
    
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
                factura: id_factura (
                    id_cliente,
                    cliente: id_cliente (
                        id_cliente,
                        nombre,
                        apellido,
                        ci
                    )
                )
            `)
            .gte('fechacompra', fechaInicio)
            .lte('fechacompra', fechaFin);
        
        if (error || !data || data.length === 0) {
            container.innerHTML = '<p class="alert-info">📊 No hay compras registradas en este período.</p>';
            return;
        }
        
        // Agrupar por cliente
        const clientes = {};
        data.forEach(entrada => {
            const cliente = entrada.factura?.cliente;
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
        
        if (resultados.length === 0) {
            container.innerHTML = '<p class="alert-info">📊 No se encontraron clientes.</p>';
            return;
        }
        
        const topCliente = resultados[0];
        
        let html = `
            <div class="card" style="background-color: var(--fondo-secundario);">
                <h3>🏆 Cliente más frecuente</h3>
                <p><strong>Nombre:</strong> ${topCliente.nombre} ${topCliente.apellido}</p>
                <p><strong>CI:</strong> ${topCliente.ci}</p>
                <p><strong>Total de visitas:</strong> ${topCliente.total_visitas}</p>
            </div>
            <h4>📋 Top 10 clientes</h4>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr><th>#</th><th>CI</th><th>Nombre</th><th>Visitas</th></tr>
                    </thead>
                    <tbody>
        `;
        
        resultados.slice(0, 10).forEach((cliente, index) => {
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
        
    } catch (e) {
        container.innerHTML = '<p class="alert-error">❌ Error generando reporte</p>';
        console.error(e);
    }
}

// ============================================
// 5. REPORTE 3: TURNOS DE CAJERO
// ============================================

async function reporteTurnosCajero() {
    const idCajero = document.getElementById('cajero_id').value;
    const mes = document.getElementById('mes3').value;
    const anio = document.getElementById('anio3').value;
    const container = document.getElementById('reporte3-container');
    
    if (!idCajero) {
        mostrarAlerta('alerta-container', 'Selecciona un cajero', 'error');
        return;
    }
    
    container.innerHTML = '<div class="loading">⏳ Generando reporte...</div>';
    
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
                turno: id_turno (
                    id_turno,
                    nombreturno,
                    horainicio,
                    horafin
                )
            `)
            .eq('id_cajero', parseInt(idCajero))
            .lte('fechaini', fechaFin)
            .gte('fechafin', fechaInicio);
        
        if (error) {
            container.innerHTML = '<p class="alert-error">❌ Error generando reporte</p>';
            return;
        }
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="alert-info">📊 No hay asignaciones de turno para este cajero en el período seleccionado.</p>';
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
        
    } catch (e) {
        container.innerHTML = '<p class="alert-error">❌ Error generando reporte</p>';
        console.error(e);
    }
}