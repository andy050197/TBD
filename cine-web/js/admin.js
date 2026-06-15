// =============================================
// ADMINISTRACIÓN - REPORTES
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCajeros();
    
    document.getElementById('btn-reporte1').addEventListener('click', reportePeliculaExitosa);
    document.getElementById('btn-reporte2').addEventListener('click', reporteClienteFrecuente);
    document.getElementById('btn-reporte3').addEventListener('click', reporteTurnosCajero);
});

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

// Reporte 1: Película más exitosa por sucursal y sala
async function reportePeliculaExitosa() {
    const mes = document.getElementById('mes').value;
    const anio = document.getElementById('anio').value;
    const container = document.getElementById('reporte1-container');
    
    container.innerHTML = '<div class="loading">⏳ Generando reporte...</div>';
    
    // Consulta SQL compleja usando JOINs directos
    const { data, error } = await supabase
        .rpc('reporte_pelicula_exitosa', { p_mes: parseInt(mes), p_anio: parseInt(anio) });
    
    if (error) {
        // Si no existe la función RPC, usar consulta directa
        const query = `
            SELECT 
                s.id_sucursal,
                suc.nombre as sucursal_nombre,
                sa.idsala_ as id_sala,
                sa.nombresala,
                p.id_pelicula,
                p.tituloesp,
                g.nombregenero_ as genero,
                CONCAT(p.duracionhoras, 'h ', p.duracionmin, 'm') as duracion,
                COUNT(e.id_entrada) as total_entradas
            FROM entrada e
            JOIN factura f ON e.id_factura = f.id_factura
            JOIN funcion fn ON e.id_funcion = fn.id_funcion
            JOIN pelicula p ON fn.id_pelicula = p.id_pelicula
            JOIN genero g ON p.id_genero = g.id_genero
            JOIN sala sa ON fn.id_sala = sa.id_sala
            JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
            JOIN sucursal suc ON s.id_sucursal = suc.id_sucursal
            WHERE EXTRACT(MONTH FROM f.fecha_hora) = ${mes}
              AND EXTRACT(YEAR FROM f.fecha_hora) = ${anio}
            GROUP BY s.id_sucursal, suc.nombre, sa.idsala_, sa.nombresala, p.id_pelicula, p.tituloesp, g.nombregenero_, p.duracionhoras, p.duracionmin
            ORDER BY s.id_sucursal, sa.idsala_, total_entradas DESC
        `;
        
        const { data: directData, error: directError } = await supabase.rpc('exec_sql', { sql: query });
        
        if (directError) {
            container.innerHTML = '<p class="alert-error">❌ Error generando reporte. Asegúrate de que haya datos de ventas.</p>';
            return;
        }
        
        if (!directData || directData.length === 0) {
            container.innerHTML = '<p class="alert-info">📊 No hay ventas registradas para este período.</p>';
            return;
        }
        
        mostrarReporte1(directData);
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="alert-info">📊 No hay ventas registradas para este período.</p>';
        return;
    }
    
    mostrarReporte1(data);
}

function mostrarReporte1(data) {
    const container = document.getElementById('reporte1-container');
    
    let html = '<table><thead><tr>';
    html += '<th>Sucursal</th><th>Sala</th><th>Película</th><th>Género</th><th>Duración</th><th>Entradas vendidas</th>';
    html += '</tr></thead><tbody>';
    
    data.forEach(row => {
        html += `<tr>
            <td data-label="Sucursal">${row.sucursal_nombre || row.id_sucursal}</td>
            <td data-label="Sala">${row.nombresala || row.id_sala}</td>
            <td data-label="Película">${row.tituloesp}</td>
            <td data-label="Género">${row.genero || 'N/A'}</td>
            <td data-label="Duración">${row.duracion || 'N/A'}</td>
            <td data-label="Entradas">${row.total_entradas}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Reporte 2: Cliente más frecuente
async function reporteClienteFrecuente() {
    const trimestre = document.getElementById('trimestre').value;
    const anio = document.getElementById('anio2').value;
    const container = document.getElementById('reporte2-container');
    
    container.innerHTML = '<div class="loading">⏳ Generando reporte...</div>';
    
    const fechaInicio = `${anio}-${String((trimestre - 1) * 3 + 1).padStart(2, '0')}-01`;
    const fechaFin = `${anio}-${String(trimestre * 3).padStart(2, '0')}-31`;
    
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
    
    if (error) {
        container.innerHTML = '<p class="alert-error">❌ Error generando reporte</p>';
        return;
    }
    
    if (!data || data.length === 0) {
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
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    ci: cliente.ci,
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
        <div class="card">
            <h3>🏆 Cliente más frecuente</h3>
            <p><strong>Nombre:</strong> ${topCliente.nombre} ${topCliente.apellido}</p>
            <p><strong>CI:</strong> ${topCliente.ci}</p>
            <p><strong>Total de visitas:</strong> ${topCliente.total_visitas}</p>
        </div>
        <h4>Top 5 clientes</h4>
        <table>
            <thead>
                <tr><th>CI</th><th>Nombre</th><th>Visitas</th></tr>
            </thead>
            <tbody>
    `;
    
    resultados.slice(0, 5).forEach(cliente => {
        html += `<tr><td data-label="CI">${cliente.ci}</td><td data-label="Nombre">${cliente.nombre} ${cliente.apellido}</td><td data-label="Visitas">${cliente.total_visitas}</td></tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Reporte 3: Turnos trabajados por cajero
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
        <table>
            <thead>
                <tr><th>Turno</th><th>Horario</th><th>Fecha inicio</th><th>Fecha fin</th><th>Registro</th></tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(asignacion => {
        const turno = asignacion.turno;
        html += `<tr>
            <td data-label="Turno">${turno?.nombreturno || 'N/A'}</td>
            <td data-label="Horario">${formatearHora(turno?.horainicio)} - ${formatearHora(turno?.horafin)}</td>
            <td data-label="Fecha inicio">${formatearFecha(asignacion.fechaini)}</td>
            <td data-label="Fecha fin">${formatearFecha(asignacion.fechafin)}</td>
            <td data-label="Registro">${asignacion.registro || '-'}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}