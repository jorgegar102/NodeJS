const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const adminRoutes = require('./admin');

const app = express();

// Conexión a la base de datos Database.db
const dbPath = path.join(__dirname, 'Database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos Database.db');
  }
});

// Middleware para leer los datos del formulario enviados por POST
app.use(express.urlencoded({ extended: true }));

// Integración de las rutas del panel de administración
app.use(adminRoutes);

// Ruta GET para mostrar el formulario directamente en el navegador
app.get('/', (req, res) => {
  res.send(`
    <form action="/login" method="POST">
      <h2>Iniciar Sesión</h2>
      <input type="text" name="usuario" placeholder="Usuario o Correo" required><br><br>
      <input type="password" name="password" placeholder="Contraseña" required><br><br>
      <button type="submit">Entrar</button>
    </form>
  `);
});

// Ruta POST para procesar las credenciales
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  
  // Consultamos si existe el usuario con esa contraseña (comprobando por nombre o por correo)
  const query = 'SELECT * FROM usuarios WHERE (nombre = ? COLLATE NOCASE OR correo = ? COLLATE NOCASE) AND password = ?';

  db.get(query, [usuario, usuario, password], (err, row) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).send('<h1>Error interno del servidor</h1>');
    }

    if (row) {
      res.send(`
        <h1>¡Acceso concedido!</h1>
        <p>Bienvenido, <strong>${row.nombre}</strong> (Rol: ${row.rol})</p>
        ${row.rol === 'admin' ? '<p><a href="/admin">Ir al panel de administración</a></p>' : ''}
        <br>
        <a href="/">Cerrar sesión</a>
      `);
    } else {
      res.send(`
        <h1>Usuario o contraseña incorrectos</h1>
        <br>
        <a href="/">Volver a intentar</a>
      `);
    }
  });
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
