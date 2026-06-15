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
    
    container.innerHTML = '<div class="loading">⏳ Buscando tus entradas...</div>';
    
    // Buscar cliente por CI
    const { data: cliente, error: errorCliente } = await supabase
        .from('cliente')
        .select('id_cliente, nombre, apellido')
        .eq('ci', ci)
        .maybeSingle();
    
    if (errorCliente || !cliente) {
        container.innerHTML = '<p class="alert-info">🔍 No se encontraron entradas para este CI.</p>';
        return;
    }
    
    // Buscar entradas del cliente
    const { data: entradas, error: errorEntradas } = await supabase
        .from('entrada')
        .select(`
            id_entrada,
            precio,
            fechacompra,
            id_asiento,
            funcion:id_funcion (
                id_funcion,
                fecha,
                horainicio,
                precio as precio_funcion,
                pelicula:id_pelicula (
                    tituloesp
                ),
                sala:id_sala (
                    nombresala,
                    sucursal:id_sucursal (
                        nombre,
                        direccion
                    )
                )
            ),
            factura: id_factura (
                total_pagado,
                canal
            )
        `)
        .eq('factura.id_cliente', cliente.id_cliente)
        .order('fechacompra', { ascending: false });
    
    if (errorEntradas || !entradas || entradas.length === 0) {
        container.innerHTML = '<p class="alert-info">🎫 No tienes entradas registradas.</p>';
        return;
    }
    
    // Mostrar información del cliente
    let html = `
        <div class="card">
            <h3>👤 Cliente: ${cliente.nombre} ${cliente.apellido}</h3>
            <p><strong>CI:</strong> ${ci}</p>
            <p><strong>Total de entradas:</strong> ${entradas.length}</p>
        </div>
    `;
    
    // Mostrar cada entrada
    entradas.forEach(entrada => {
        const funcion = entrada.funcion;
        const pelicula = funcion?.pelicula;
        const sala = funcion?.sala;
        const sucursal = sala?.sucursal;
        
        html += `
            <div class="card">
                <h3>🎬 ${pelicula?.tituloesp || 'Película'}</h3>
                <p><strong>🎟️ N° Entrada:</strong> ${entrada.id_entrada}</p>
                <p><strong>🪑 Asiento:</strong> ${entrada.id_asiento}</p>
                <p><strong>📅 Fecha función:</strong> ${formatearFecha(funcion?.fecha)}</p>
                <p><strong>⏰ Hora:</strong> ${formatearHora(funcion?.horainicio)}</p>
                <p><strong>🏢 Sala:</strong> ${sala?.nombresala || 'N/A'}</p>
                <p><strong>📍 Sucursal:</strong> ${sucursal?.nombre || 'N/A'} - ${sucursal?.direccion || ''}</p>
                <p><strong>💰 Precio pagado:</strong> ${formatearMoneda(entrada.precio)}</p>
                <p><strong>💳 Canal de compra:</strong> ${entrada.factura?.canal?.toUpperCase() || 'N/A'}</p>
                <p><strong>📅 Fecha compra:</strong> ${formatearFecha(entrada.fechacompra)}</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}