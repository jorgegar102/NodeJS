const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const adminRoutes = require('./admin');

const app = express();

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

app.use(express.urlencoded({ extended: true }));
app.use(adminRoutes);

// Ruta GET principal: muestra el formulario de login usando index.pug
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Iniciar Sesión' });
});

// Ruta POST para procesar las credenciales
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  
  const query = 'SELECT * FROM usuarios WHERE (nombre = ? COLLATE NOCASE OR correo = ? COLLATE NOCASE) AND password = ?';

  db.get(query, [usuario, usuario, password], (err, row) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err.message);
      return res.status(500).send('<h1>Error interno del servidor</h1>');
    }

    if (row) {
      res.render('bienvenida', {
        titulo: '¡Acceso concedido!',
        usuario: row
      });
    } else {
      res.render('error', {
        titulo: 'Error de acceso'
      });
    }
  });
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
