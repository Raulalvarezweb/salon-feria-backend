// config/storage.js
// Almacenamiento de archivos en Supabase Storage (sustituye a Google Drive).
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseKey, supabaseBucket } = require('./env');

const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'missing', {
  auth: { persistSession: false },
});

const safeName = (name = 'archivo') =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');

/**
 * Sube un archivo recibido por multer a Supabase Storage.
 * @param {Object} file - Archivo de multer ({ path, originalname, mimetype }).
 * @param {string} folderName - Carpeta dentro del bucket.
 * @returns {Promise<{fileId: string, webViewLink: string}>}
 */
const uploadFile = async (file, folderName) => {
  const filePath = `${folderName}/${uuidv4()}-${safeName(file.originalname)}`;
  const { error } = await supabase.storage
    .from(supabaseBucket)
    .upload(filePath, fs.readFileSync(file.path), { contentType: file.mimetype, upsert: false });

  if (error) {
    console.error('Error subiendo archivo a Supabase:', error.message);
    throw new Error('Failed to upload file');
  }

  const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);
  return { fileId: filePath, webViewLink: data.publicUrl };
};

/**
 * Elimina un archivo del bucket. No falla si no existe.
 * @param {string|null} fileId - Ruta del archivo dentro del bucket.
 */
const deleteFile = async (fileId) => {
  if (!fileId) return;
  const { error } = await supabase.storage.from(supabaseBucket).remove([fileId]);
  if (error) console.error('Error eliminando archivo de Supabase:', error.message);
};

/**
 * Obtiene la ruta interna del archivo a partir de su URL pública
 * (también funciona si la URL va precedida del proxy).
 * @param {string} url
 * @returns {string|null}
 */
const getFileIdFromUrl = (url) => {
  if (!url) return null;
  const marker = `/object/public/${supabaseBucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
};

module.exports = { supabase, uploadFile, deleteFile, getFileIdFromUrl };
