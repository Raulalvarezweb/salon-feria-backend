
const express = require('express');
const config = require('./config/env');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');


const authRoutes = require ('./routes/auth');
const usersRoutes = require('./routes/users');
const designRoutes = require ('./routes/design');
const fileRoutes = require('./routes/file');
const informationRoutes = require ('./routes/information');
const offersRoutes = require ('./routes/offers');
const videoRoutes = require ('./routes/video');

const app = express();
app.set('trust proxy', 1); // Render y Vercel están delante como proxy

app.use(cookieParser());
const corsOptions = {
  // Dominios permitidos: localhost para desarrollo + los definidos en FRONTEND_URL
  origin: ['http://localhost:4200', 'http://localhost:3000', ...config.frontendUrls],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
  credentials: true, // Permitir cookies y encabezados de autenticación
};

app.use(cors(corsOptions));

// Maneja solicitudes OPTIONS automáticamente
app.options('*', cors(corsOptions));
app.use(express.json());

// Proxy de imágenes (evita problemas de CORS al pintar en <canvas>).
// Solo permite descargar desde hosts conocidos para no ser un proxy abierto.
const allowedProxyHosts = new Set(
  [config.supabaseUrl, ...config.frontendUrls]
    .filter(Boolean)
    .map((u) => { try { return new URL(u).host; } catch { return null; } })
    .filter(Boolean)
);

app.get('/proxy', async (req, res) => {
  const { url } = req.query;
  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).send('URL no válida');
  }
  if (target.protocol !== 'https:' || !allowedProxyHosts.has(target.host)) {
    return res.status(403).send('Host no permitido');
  }
  try {
    const response = await axios.get(target.href, { responseType: 'arraybuffer', timeout: 15000 });
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error al cargar la imagen');
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/design', designRoutes);
app.use('/file', fileRoutes);
app.use('/information', informationRoutes);
app.use('/offers', offersRoutes);
app.use('/video', videoRoutes);

const PORT = config.port;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

