// =============================================
// FUNCIONES AUXILIARES
// =============================================

function formatearFecha(fecha) {
    if (!fecha) return 'No disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatearHora(hora) {
    if (!hora) return 'No disponible';
    if (typeof hora === 'string' && hora.includes(':')) {
        return hora.substring(0, 5);
    }
    return hora;
}

function formatearMoneda(monto) {
    return `Bs. ${parseFloat(monto).toFixed(2)}`;
}

function mostrarAlerta(elementoId, mensaje, tipo = 'error') {
    const alertaDiv = document.getElementById(elementoId);
    if (alertaDiv) {
        alertaDiv.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
        setTimeout(() => {
            alertaDiv.innerHTML = '';
        }, 5000);
    } else {
        if (tipo === 'error') alert('❌ ' + mensaje);
        else alert('✅ ' + mensaje);
    }
}

function validarCI(ci) {
    const ciStr = String(ci).trim();
    return /^\d{4,10}$/.test(ciStr);
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function obtenerParametroURL(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}

const API_BASE = 'http://localhost:5000/api';

// Función genérica para llamadas a la API
async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en la solicitud');
    }
    return response.json();
}