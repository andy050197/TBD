// =============================================
// CARTELERA - CARGAR PELÍCULAS Y FUNCIONES
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarSucursales();
    await cargarCartelera();
    document.getElementById('sucursal').addEventListener('change', cargarCartelera);
});

async function cargarSucursales() {
       try {
        const sucursales = await apiFetch('/sucursales');
        const select = document.getElementById('sucursal');
        select.innerHTML = '<option value="">Todas las sucursales</option>';
        sucursales.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id_sucursal;
            option.textContent = `Sucursal ${s.id_sucursal} - ${s.direccion}`;
            select.appendChild(option);
        });
        } catch (error) {
        console.error('Error cargando sucursales:', error);
         }
    }

async function cargarCartelera() {
    const sucursalId = document.getElementById('sucursal').value;
    const container = document.getElementById('cartelera-container');
    container.innerHTML = '<div class="loading"> Cargando funciones...</div>';

    try {
        let url = '/funciones';
        if (sucursalId) url += `?sucursal_id=${sucursalId}`;
        const data = await apiFetch(url);
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="alert-info"> No hay funciones disponibles.</p>';
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
                <p><strong> Fecha:</strong> ${formatearFecha(funcion.fecha)}</p>
                <p><strong> Hora:</strong> ${formatearHora(funcion.horainicio)}</p>
                <p><strong> Duración:</strong> ${pelicula?.duracionhoras || 0}h ${pelicula?.duracionmin || 0}m</p>
                <p><strong> Calificación:</strong> ${pelicula?.calificacion || 'No especificada'}</p>
                <p><strong> Sala:</strong> ${sala?.nombresala || 'Sin sala'}</p>
                <p><strong> Precio:</strong> ${formatearMoneda(funcion.precio)}</p>
                <a href="compra.html?id_funcion=${funcion.id_funcion}" class="btn btn-primario" style="margin-top: 10px; display: inline-block;">🎟️ Comprar entrada</a>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = `<p class="alert-error"> Error cargando la cartelera: ${error.message}</p>`;
        console.error(error);
    }
}