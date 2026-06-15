// =============================================
// CONFIGURACIÓN DE SUPABASE
// =============================================

// Reemplaza estos valores con los de tu proyecto en Supabase
const SUPABASE_URL = 'https://uetqhvbwdxpdufuywhzw.supabase.co';  // ← CAMBIAR
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldHFodmJ3ZHhwZHVmdXl3aHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTUzOTUsImV4cCI6MjA5MzA5MTM5NX0.42_IjlOm0sHoSbMxmGzh5_b8TVFMrEv14FaHdMhSfCg ';           // ← CAMBIAR

// Inicializar cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Cliente de Supabase inicializado');