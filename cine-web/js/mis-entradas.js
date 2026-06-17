// =============================================
// MIS ENTRADAS - CONSULTAR POR CI
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-buscar').addEventListener('click', buscarEntradas);
    document.getElementById('ci').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarEntradas();
    });
});

async function buscarEntradas() {
    const ci = document.getElementById('ci').value.trim();
    const container = document.getElementById('entradas-container');
    if (!ci) {
        mostrarAlerta('alerta-container', 'Ingresa tu número de CI', 'error');
        return;
    }
    if (!validarCI(ci)) {
        mostrarAlerta('alerta-container', 'CI inválido (debe tener 4-10 dígitos)', 'error');
        return;
    }
    container.innerHTML = '<div class="loading"> Buscando tus entradas...</div>';

    try {
        const data = await apiFetch(`/ventas/mis-entradas?ci=${ci}`);
        if (!data || !data.entradas || data.entradas.length === 0) {
            container.innerHTML = '<p class="alert-info"> No tienes entradas registradas.</p>';
            return;
        }
        const { cliente, entradas } = data;
        let html = `
            <div class="card">
                <h3>👤 Cliente: ${cliente.nombre} ${cliente.apellido}</h3>
                <p><strong>CI:</strong> ${ci}</p>
                <p><strong>Total de entradas:</strong> ${entradas.length}</p>
            </div>
        `;
        entradas.forEach(entrada => {
            const funcion = entrada.funcion;
            const pelicula = funcion?.pelicula;
            const sala = funcion?.sala;
            html += `
                <div class="card">
                    <h3>🎬 ${pelicula?.tituloesp || 'Película'}</h3>
                    <p><strong> N° Entrada:</strong> ${entrada.id_entrada}</p>
                    <p><strong> Asiento:</strong> ${entrada.id_asiento}</p>
                    <p><strong> Fecha función:</strong> ${formatearFecha(funcion?.fecha)}</p>
                    <p><strong> Hora:</strong> ${formatearHora(funcion?.horainicio)}</p>
                    <p><strong> Sala:</strong> ${sala?.nombresala || 'N/A'}</p>
                    <p><strong> Sucursal:</strong> ${sala?.sucursal?.direccion || ''}</p>
                    <p><strong> Precio pagado:</strong> ${formatearMoneda(entrada.precio)}</p>
                    <p><strong> Canal:</strong> ${entrada.factura?.canal?.toUpperCase() || 'N/A'}</p>
                    <p><strong> Fecha compra:</strong> ${formatearFecha(entrada.fechacompra)}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p class="alert-error"> Error: ${error.message}</p>`;
    }
}