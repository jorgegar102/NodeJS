const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pug = require('pug');

const publicDir = path.join(__dirname, 'public');
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, publicDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const dbPath = path.join(__dirname, 'Database.db');
const db = new sqlite3.Database(dbPath);

const renderVista = (nombreVista, datos = {}) => {
  return pug.renderFile(path.join(viewsDir, `${nombreVista}.pug`), datos);
};

// Menú principal con botones de Usuarios y Grupos
router.get('/', (req, res) => {
  res.send(renderVista('admin', { titulo: 'Admin' }));
});

// ==================== USUARIOS ====================

router.get('/usuarios', (req, res) => {
  const sqlUsuarios = `
    select u.*, g.nombre as nombre_grupo
    from usuarios u
    left join grupos g on u.id_grupo = g.id_grupo
  `;

  db.all(sqlUsuarios, [], (err, usuarios = []) => {
    if (err) return res.status(500).send('Error al cargar usuarios: ' + err.message);

    db.all('select * from grupos', [], (errG, grupos = []) => {
      if (errG) return res.status(500).send('Error al cargar grupos: ' + errG.message);

      const idEditar = req.query.editar;
      if (!idEditar) {
        return res.send(renderVista('usuarios', {
          titulo: 'Usuarios',
          usuarios,
          grupos,
          usuarioEditar: null
        }));
      }

      db.get('select * from usuarios where id_usuario = ?', [idEditar], (errU, usuarioEditar) => {
        if (errU) return res.status(500).send('Error al buscar usuario: ' + errU.message);
        res.send(renderVista('usuarios', {
          titulo: 'Usuarios',
          usuarios,
          grupos,
          usuarioEditar: usuarioEditar || null
        }));
      });
    });
  });
});

router.post('/usuarios/crear', upload.single('foto'), (req, res) => {
  const { nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, rol, id_grupo } = req.body;
  const foto = req.file ? req.file.filename : null;
  const rolFinal = rol === 'admin' ? 'admin' : 'usuario';
  const grupoFinal = id_grupo && id_grupo !== '' ? id_grupo : null;

  const sql = `insert into usuarios (nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, foto, id_grupo, rol)
               values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, foto, grupoFinal, rolFinal], err => {
    if (err) return res.status(400).send('Error al crear usuario: ' + err.message);
    res.redirect('/admin/usuarios');
  });
});

router.post('/usuarios/editar/:id', upload.single('foto'), (req, res) => {
  const id = req.params.id;
  const { nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, rol, id_grupo } = req.body;

  db.get('select * from usuarios where id_usuario = ?', [id], (err, actual) => {
    if (err || !actual) return res.status(404).send('Usuario no encontrado');

    const nuevaFoto = req.file ? req.file.filename : actual.foto;
    const nuevaPassword = password && password.trim() !== '' ? password : actual.password;
    const rolFinal = rol === 'admin' ? 'admin' : 'usuario';
    const grupoFinal = id_grupo && id_grupo !== '' ? id_grupo : null;

    const sql = `update usuarios
                 set nombre = ?, apellido1 = ?, apellido2 = ?, fecha_nacimiento = ?,
                     correo = ?, password = ?, telefono = ?, edad = ?, foto = ?, id_grupo = ?, rol = ?
                 where id_usuario = ?`;

    db.run(sql, [nombre, apellido1, apellido2, fecha_nacimiento, correo, nuevaPassword, telefono, edad, nuevaFoto, grupoFinal, rolFinal, id], errUp => {
      if (errUp) return res.status(400).send('Error al actualizar usuario: ' + errUp.message);
      res.redirect('/admin/usuarios');
    });
  });
});

router.get('/usuarios/eliminar/:id', (req, res) => {
  db.run('delete from usuarios where id_usuario = ?', [req.params.id], err => {
    if (err) return res.status(400).send('Error al borrar usuario: ' + err.message);
    res.redirect('/admin/usuarios');
  });
});

// ==================== GRUPOS ====================

router.get('/grupos', (req, res) => {
  db.all('select * from grupos', [], (err, grupos = []) => {
    if (err) return res.status(500).send('Error al cargar grupos: ' + err.message);

    const idEditar = req.query.editar;
    if (!idEditar) {
      return res.send(renderVista('grupos', {
        titulo: 'Grupos',
        grupos,
        grupoEditar: null
      }));
    }

    db.get('select * from grupos where id_grupo = ?', [idEditar], (errG, grupoEditar) => {
      if (errG) return res.status(500).send('Error al buscar grupo: ' + errG.message);
      res.send(renderVista('grupos', {
        titulo: 'Grupos',
        grupos,
        grupoEditar: grupoEditar || null
      }));
    });
  });
});

router.post('/grupos/crear', (req, res) => {
  const { nombre, descripcion } = req.body;
  db.run('insert into grupos (nombre, descripcion) values (?, ?)', [nombre, descripcion], err => {
    if (err) return res.status(400).send('Error al crear grupo: ' + err.message);
    res.redirect('/admin/grupos');
  });
});

router.post('/grupos/editar/:id', (req, res) => {
  const { nombre, descripcion } = req.body;
  db.run('update grupos set nombre = ?, descripcion = ? where id_grupo = ?', [nombre, descripcion, req.params.id], err => {
    if (err) return res.status(400).send('Error al actualizar grupo: ' + err.message);
    res.redirect('/admin/grupos');
  });
});

router.get('/grupos/eliminar/:id', (req, res) => {
  db.run('delete from grupos where id_grupo = ?', [req.params.id], err => {
    if (err) return res.status(400).send('Error al borrar grupo: ' + err.message);
    res.redirect('/admin/grupos');
  });
});

module.exports = router;