const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const adminRoutes = require('./admin');

const app = express();
const port = 3000;

// Configuración de Pug como motor de plantillas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Conexión a la base de datos Database.db
const dbPath = path.join(__dirname, 'Database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos Database.db');
  }
});

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', adminRoutes);

// Ruta GET principal: muestra el formulario de login usando index.pug
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Iniciar Sesión' });
});

// Ruta POST para procesar las credenciales
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const sql = 'select * from usuarios where (nombre = ? or correo = ?) and password = ?';

  db.get(sql, [usuario, usuario, password], (err, row) => {
    if (err) {
      return res.render('error', { titulo: 'Error', mensaje: 'Error en la base de datos' });
    }
    if (!row) {
      return res.render('error', { titulo: 'Error', mensaje: 'Usuario o contraseña incorrectos' });
    }
    if (row.rol === 'admin') {
      return res.redirect('/admin');
    }
    res.render('bienvenida', { titulo: 'Bienvenida', usuario: row });
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});