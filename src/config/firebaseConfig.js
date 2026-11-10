// config/firebaseConfig.js
const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Las credenciales de la cuenta de servicio se leen de:
 *  - FIREBASE_SERVICE_ACCOUNT: el contenido del JSON (recomendado en Render), o
 *  - FIREBASE_SERVICE_ACCOUNT_PATH: ruta a un archivo JSON (cómodo en local).
 */
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return require(require('path').resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
  }
  throw new Error('Falta FIREBASE_SERVICE_ACCOUNT o FIREBASE_SERVICE_ACCOUNT_PATH');
}

admin.initializeApp({
  credential: admin.credential.cert(loadServiceAccount()),
});

const db = admin.firestore();

module.exports = { admin, db };
