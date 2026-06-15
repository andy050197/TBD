// =============================================
// CARTELERA - CARGAR PELÍCULAS Y FUNCIONES
// =============================================

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await cargarSucursales();
    await cargarCartelera();
    
    document.getElementById('sucursal').addEventListener('change', () => {
        cargarCartelera();
    });
});

// Cargar lista de sucursales para el filtro
async function cargarSucursales() {
    const { data, error } = await supabase
        .from('sucursal')
        .select('id_sucursal, nombre, direccion');
    
    if (error) {
        console.error('Error cargando sucursales:', error);
        return;
    }
    
    const select = document.getElementById('sucursal');
    if (data && data.length > 0) {
        data.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.id_sucursal;
            option.textContent = `${sucursal.nombre || 'Sucursal'} - ${sucursal.direccion}`;
            select.appendChild(option);
        });
    }
}

// Cargar cartelera completa
async function cargarCartelera() {
    const sucursalId = document.getElementById('sucursal').value;
    const container = document.getElementById('cartelera-container');
    container.innerHTML = '<div class="loading">⏳ Cargando funciones...</div>';
    
    // Obtener fecha actual en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];
    
    // Consulta para obtener funciones con detalles de película y sala
    let query = supabase
        .from('funcion')
        .select(`
            id_funcion,
            fecha,
            horainicio,
            precio,
            sala: id_sala (
                nombresala,
                cantidadbutaca,
                id_sucursal
            ),
            pelicula: id_pelicula (
                id_pelicula,
                tituloesp,
                duracionhoras,
                duracionmin,
                calificacion,
                tituloorig
            )
        `)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })
        .order('horainicio', { ascending: true });
    
    if (sucursalId) {
        query = query.eq('sala.id_sucursal', parseInt(sucursalId));
    }
    
    const { data, error } = await query;
    
    if (error) {
        container.innerHTML = '<p class="alert-error">❌ Error cargando la cartelera</p>';
        console.error('Error:', error);
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="alert-info">🎬 No hay funciones disponibles para mostrar. Vuelve más tarde.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    data.forEach(funcion => {
        const pelicula = funcion.pelicula;
        const sala = funcion.sala;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>🎬 ${pelicula?.tituloesp || 'Sin título'}</h3>
            ${pelicula?.tituloorig ? `<p><strong>🎞️ Título original:</strong> ${pelicula.tituloorig}</p>` : ''}
            <p><strong>📅 Fecha:</strong> ${formatearFecha(funcion.fecha)}</p>
            <p><strong>⏰ Hora:</strong> ${formatearHora(funcion.horainicio)}</p>
            <p><strong>⏱️ Duración:</strong> ${pelicula?.duracionhoras || 0}h ${pelicula?.duracionmin || 0}m</p>
            <p><strong>⭐ Calificación:</strong> ${pelicula?.calificacion || 'No especificada'}</p>
            <p><strong>🏢 Sala:</strong> ${sala?.nombresala || 'Sin sala'}</p>
            <p><strong>💰 Precio:</strong> ${formatearMoneda(funcion.precio)}</p>
            <a href="compra.html?id_funcion=${funcion.id_funcion}" class="btn btn-primario" style="margin-top: 10px; display: inline-block;">🎟️ Comprar entrada</a>
        `;
        container.appendChild(card);
    });
}