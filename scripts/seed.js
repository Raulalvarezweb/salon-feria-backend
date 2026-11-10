/**
 * Crea los datos iniciales en Firestore:
 *  - Catálogo de stands y recepcionistas (colecciones `stand` y `model`)
 *  - Un usuario administrador
 *
 * Uso:  npm run seed
 * Necesita en el .env: FIREBASE_SERVICE_ACCOUNT(_PATH), FRONTEND_URL,
 *                      SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 * Es seguro ejecutarlo varias veces: no duplica datos.
 */
const bcrypt = require('bcryptjs');
const { admin, db } = require('../src/config/firebaseConfig');
const { frontendUrls } = require('../src/config/env');
const stands = require('./stands.json');

// Las imágenes de stands y recepcionistas están en /assets del frontend.
const assetsBase = `${(frontendUrls[0] || '').replace(/\/$/, '')}/assets`;

const box = ([x, y, width, height]) => ({ x, y, width, height });

async function seedStands() {
  for (const [i, s] of stands.entries()) {
    const [cx, counterTop, size] = s.recep;
    await db.collection('stand').doc(`stand${i + 1}`).set({
      url: { name: `Stand ${i + 1}`, fileUrl: `${assetsBase}/${s.file}` },
      standConfig: {
        bannerPosition: box(s.banner),
        logoPosition: box(s.logo),
        recepcionistPosition: box([cx - size / 2, counterTop - 0.75 * size, size, size]),
      },
      uploadedAt: admin.firestore.Timestamp.now(),
    });
  }
  console.log(`✔ ${stands.length} stands`);

  for (let i = 1; i <= 5; i++) {
    await db.collection('model').doc(`recepcionist${i}`).set({
      url: { name: `Recepcionista ${i}`, fileUrl: `${assetsBase}/recepcionist${i}.png` },
      uploadedAt: admin.firestore.Timestamp.now(),
    });
  }
  console.log('✔ 5 recepcionistas');
}

async function seedAdmin() {
  const { SEED_ADMIN_NAME: name = 'admin', SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    console.log('… sin SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD: no se crea el admin');
    return;
  }
  const existing = await db.collection('users').where('email', '==', email).get();
  const data = { name, email, rol: 'admin', password: await bcrypt.hash(password, 10) };
  if (existing.empty) {
    await db.collection('users').add({ ...data, createdAt: admin.firestore.Timestamp.now() });
    console.log(`✔ admin creado: ${email}`);
  } else {
    await existing.docs[0].ref.update(data);
    console.log(`✔ admin actualizado: ${email}`);
  }
}

(async () => {
  if (!frontendUrls.length) throw new Error('Define FRONTEND_URL en el .env (la URL de Vercel)');
  await seedStands();
  await seedAdmin();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
