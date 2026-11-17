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

// IMPORTANTE: Servir archivos estáticos (para que se vean las fotos subidas en la carpeta public)
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. PARTE DEL LOGIN ---
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: Arial; margin: 40px;">
      <form action="/login" method="POST">
        <h2>Iniciar Sesión</h2>
        <input type="text" name="usuario" placeholder="Usuario o Correo" required style="padding: 8px;"><br><br>
        <input type="password" name="password" placeholder="Contraseña" required style="padding: 8px;"><br><br>
        <button type="submit" style="padding: 8px 15px; background: #007bff; color: white; border: none; cursor: pointer;">Entrar</button>
      </form>
    </div>
  `);
});

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
        <div style="font-family: Arial; margin: 40px;">
          <h1>¡Acceso concedido!</h1>
          <p>Bienvenido, <strong>${row.nombre}</strong> (Rol: ${row.rol})</p>
          ${row.rol === 'admin' ? '<p><a href="/admin">Ir al panel de administración</a></p>' : ''}
          <br>
          <a href="/">Cerrar sesión</a>
        </div>
      `);
    } else {
      res.send(`
        <div style="font-family: Arial; margin: 40px;">
          <h1>Usuario o contraseña incorrectos</h1>
          <br>
          <a href="/">Volver a intentar</a>
        </div>
      `);
    }
  });
});

// --- 2. CONECTAR EL PANEL DE ADMINISTRADOR ---
// Aquí montamos el módulo de admin bajo la ruta '/admin'
app.use('/admin', adminRoutes);

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});