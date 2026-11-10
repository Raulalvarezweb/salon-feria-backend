// Configuración centralizada a partir de variables de entorno.
require('dotenv').config();

const required = ['SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`[config] Faltan variables de entorno: ${missing.join(', ')}`);
}

const splitList = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

module.exports = {
  port: process.env.PORT || 3000,
  // Orígenes del frontend permitidos por CORS (separados por comas)
  frontendUrls: splitList(process.env.FRONTEND_URL),
  // Base pública del proxy de imágenes tal y como la ve el navegador.
  // En producción el frontend reenvía /api/* al backend, así que por defecto es relativa.
  proxyBaseUrl: process.env.PROXY_BASE_URL || '/api/proxy',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseBucket: process.env.SUPABASE_BUCKET || 'palacio-ferias',
};
