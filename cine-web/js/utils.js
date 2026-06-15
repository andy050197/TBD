// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Formatear fecha a dd/mm/yyyy
function formatearFecha(fecha) {
    if (!fecha) return 'No disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Formatear hora (HH:MM)
function formatearHora(hora) {
    if (!hora) return 'No disponible';
    if (typeof hora === 'string' && hora.includes(':')) {
        return hora.substring(0, 5);
    }
    return hora;
}

// Formatear moneda (Bolivianos)
function formatearMoneda(monto) {
    return `Bs. ${parseFloat(monto).toFixed(2)}`;
}

// Mostrar alerta en el DOM
function mostrarAlerta(elementoId, mensaje, tipo = 'error') {
    const alertaDiv = document.getElementById(elementoId);
    if (alertaDiv) {
        alertaDiv.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
        setTimeout(() => {
            alertaDiv.innerHTML = '';
        }, 5000);
    } else {
        // Si no existe el elemento, usar alert nativo
        if (tipo === 'error') {
            alert('❌ ' + mensaje);
        } else {
            alert('✅ ' + mensaje);
        }
    }
}

// Validar CI (cédula de identidad boliviana - formato básico)
function validarCI(ci) {
    const ciStr = String(ci).trim();
    return /^\d{4,10}$/.test(ciStr);
}

// Validar email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Generar ID temporal (para demostración)
function generarIdTemporal() {
    return Math.floor(Math.random() * 1000000);
}

// Mostrar loading
function mostrarLoading(elementoId, mostrar = true) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
        if (mostrar) {
            elemento.innerHTML = '<div class="loading">⏳ Cargando...</div>';
        }
    }
}

// Obtener parámetros de URL
function obtenerParametroURL(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}