# 🎬 CineCbba - Sistema de Gestión de Cines

Aplicación web completa para la gestión de cines, desarrollada como proyecto final del Taller de Base de Datos.  
Incluye cartelera, compra de entradas, cambio de asientos, administración de películas y reportes.

---

## 🛠️ Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL (Supabase)
- **Frontend:** HTML, CSS, JavaScript vanilla (sin frameworks)
- **Estilos:** CSS personalizado (responsive)

---

## 📂 Estructura del proyecto

```
cine-web/
├── backend/
│   ├── src/
│   │   ├── config/database.js       → conexión a Supabase
│   │   ├── controllers/             → lógica de negocio
│   │   ├── routes/                  → endpoints de la API
│   │   ├── middlewares/auth.js      → (placeholder para autenticación)
│   │   └── app.js                   → configuración de Express
│   ├── public/                      → frontend (HTML, CSS, JS)
│   │   ├── css/styles.css
│   │   ├── js/ (todos los scripts)
│   │   └── *.html
│   ├── .env                         → variables de entorno (NO subir)
│   ├── .env.example                 → plantilla de variables
│   ├── package.json
│   └── server.js                    → punto de entrada
└── (opcional) docker-compose.yml
```

---

## 🚀 Instalación y configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd cine-web/backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar las variables de entorno

**Crea el archivo `.env`** a partir de la plantilla `.env.example`:

```bash
cp .env.example .env
```

Luego, edita `.env` con tus credenciales reales:

```
PORT=5000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

> ⚠️ **Importante:** El archivo `.env` **no debe subirse a GitHub**. Solo compartimos el `.env.example` para que otros sepan qué variables necesitan.  
> Las claves reales se pasan por canales seguros (WhatsApp, Slack, etc.)

### 4. (Opcional) Crear la función RPC en Supabase

Para el reporte de película más exitosa, necesitas ejecutar en el SQL Editor de Supabase el siguiente script (ya lo tienes en el proyecto, pero si no, aquí está):

```sql
CREATE OR REPLACE FUNCTION reporte_pelicula_exitosa(p_mes INTEGER, p_anio INTEGER)
RETURNS TABLE (
    id_sucursal     INTEGER,
    sucursal_nombre TEXT,
    id_sala         INTEGER,
    nombresala      TEXT,
    id_pelicula     INTEGER,
    tituloesp       TEXT,
    genero          TEXT,
    duracion        TEXT,
    total_entradas  BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id_sucursal,
        c.nombrecine::TEXT,
        sa.id_sala,
        sa.nombresala,
        p.id_pelicula,
        p.tituloesp,
        g.nombregenero::TEXT,
        CONCAT(p.duracionhoras, 'h ', p.duracionmin, 'm')::TEXT,
        COUNT(e.id_entrada)
    FROM entrada e
    JOIN factura   f  ON e.id_factura   = f.id_factura
    JOIN funcion   fn ON e.id_funcion   = fn.id_funcion
    JOIN pelicula  p  ON fn.id_pelicula = p.id_pelicula
    JOIN genero    g  ON p.id_genero    = g.id_genero
    JOIN sala      sa ON fn.id_sala     = sa.id_sala
    JOIN sucursal  s  ON sa.id_sucursal = s.id_sucursal
    JOIN cine      c  ON s.id_cine      = c.id_cine
    WHERE EXTRACT(MONTH FROM f.fecha_hora) = p_mes
      AND EXTRACT(YEAR  FROM f.fecha_hora) = p_anio
    GROUP BY s.id_sucursal, c.nombrecine, sa.id_sala, sa.nombresala,
             p.id_pelicula, p.tituloesp, g.nombregenero,
             p.duracionhoras, p.duracionmin
    ORDER BY s.id_sucursal, sa.id_sala, total_entradas DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## ▶️ Ejecutar la aplicación

```bash
npm start
```

O en modo desarrollo (con autorecarga):
```bash
npm run dev
```

Abre tu navegador en: [http://localhost:5000](http://localhost:5000)

---

## 🌐 Uso de la aplicación

- **Cartelera (`/`):** Muestra funciones futuras con filtro por sucursal.
- **Comprar entradas (`/compra.html`):** Selecciona asientos y compra (crea cliente si no existe).
- **Mis entradas (`/mis-entradas.html`):** Consulta todas tus entradas por CI.
- **Cambiar asiento (`/cambiar-asiento.html`):** Cambia el asiento de una entrada existente.
- **Administración (`/admin.html`):**
  - CRUD de películas (agregar, editar, eliminar).
  - Reporte de película más exitosa por mes/año.
  - Reporte de cliente más frecuente por trimestre.
  - Reporte de turnos trabajados por un cajero en un mes/año.

---

## 🗄️ Base de datos

El proyecto está conectado a **Supabase** (PostgreSQL).  
Las tablas principales son: `pelicula`, `funcion`, `entrada`, `factura`, `cliente`, `cajero`, `sucursal`, `sala`, `genero`, `asignacion_cajero_turno`.

Las relaciones y restricciones están definidas en el script SQL que acompaña el proyecto (no incluido en este README).

---

## 🧪 Posibles problemas y soluciones

| Problema | Solución |
|----------|----------|
| Error `structure of query does not match function result type` | Verifica que la función `reporte_pelicula_exitosa` existe y tiene las columnas correctas. |
| Los géneros no aparecen en el select | Asegúrate de tener datos en la tabla `genero`. Si no, inserta algunos con SQL. |
| El select de cajeros está vacío | Inserta cajeros en la tabla `cajero` manualmente o con el script de inserción. |
| No se pueden comprar entradas | Revisa que la función tenga `precio` y `id_sala` correctos, y que haya asientos disponibles. |
| Error 500 en reportes | Verifica las credenciales de Supabase en `.env` y que la conexión sea exitosa. |

---

## 👥 Créditos

- **Chalco Soliz Marcela**
- **Coca Pereira Andrea**
- **Mercado Apaza Valentina**

Docente: *Boris Marcelo Calancha Navia*  
Materia: *Taller de Base de Datos* – Gestión 1/2026

---

## 📄 Licencia

Este proyecto es de uso académico. No está destinado para producción comercial sin previa autorización.

