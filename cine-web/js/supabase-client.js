const SUPABASE_URL = 'https://uetqhvbwdxpdufuywhzw.supabase.co';  
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldHFodmJ3ZHhwZHVmdXl3aHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTUzOTUsImV4cCI6MjA5MzA5MTM5NX0.42_IjlOm0sHoSbMxmGzh5_b8TVFMrEv14FaHdMhSfCg'

const { createClient } = window.supabase;
var supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Cliente de Supabase inicializado');