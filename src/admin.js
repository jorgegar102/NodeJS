const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Asegurarse de que la carpeta public existe
const uploadDir = path.join(__dirname, 'public');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para las fotos de perfil
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Conexión a la base de datos SQLite
const dbPath = path.join(__dirname, 'Database.db');
const db = new sqlite3.Database(dbPath);

// ==========================================
// 1. PANEL PRINCIPAL DE ADMINISTRACIÓN
// ==========================================
router.get('/', (req, res) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; margin: 40px; max-width: 800px;">
            <h1>Panel de Administración</h1>
            <p>Bienvenido. Selecciona qué sección deseas gestionar:</p>
            <hr style="margin: 20px 0;">
            
            <div style="display: flex; gap: 20px;">
                <a href="/admin/usuarios" style="text-decoration: none; background: #007bff; color: white; padding: 15px 25px; border-radius: 8px; font-size: 18px; font-weight: bold;">👥 Gestionar Usuarios</a>
                <a href="/admin/grupos" style="text-decoration: none; background: #28a745; color: white; padding: 15px 25px; border-radius: 8px; font-size: 18px; font-weight: bold;">📂 Gestionar Grupos</a>
            </div>

            <br><br><br>
            <a href="/" style="color: #dc3545; text-decoration: none; font-weight: bold;">← Cerrar sesión / Volver al Login</a>
        </div>
    `);
});

// ==========================================
// 2. GESTIÓN DE USUARIOS (Alta, Baja, Listado)
// ==========================================
router.get('/usuarios', (req, res) => {
    db.all("SELECT * FROM usuarios", [], (err, usuarios) => {
        db.all("SELECT * FROM grupos", [], (errG, grupos) => {
            
            let html = `
                <div style="font-family: Arial, sans-serif; margin: 30px; max-width: 950px;">
                    <h1>Gestión de Usuarios</h1>
                    <a href="/admin" style="text-decoration: none; color: #007bff; font-weight: bold;">← Volver al Panel Principal</a>
                    <hr>

                    <h3>Dar de Alta a un Nuevo Usuario</h3>
                    <form action="/admin/usuarios/crear" method="POST" enctype="multipart/form-data" style="background: #f9f9f9; padding: 20px; border-radius: 8px; display: grid; gap: 10px; max-width: 500px;">
                        <input type="text" name="nombre" placeholder="Nombre" required style="padding: 8px;">
                        <input type="text" name="apellido1" placeholder="Primer Apellido" required style="padding: 8px;">
                        <input type="text" name="apellido2" placeholder="Segundo Apellido" required style="padding: 8px;">
                        <input type="date" name="fecha_nacimiento" required style="padding: 8px;">
                        <input type="email" name="correo" placeholder="Correo electrónico" required style="padding: 8px;">
                        <input type="password" name="password" placeholder="Contraseña" required style="padding: 8px;">
                        <input type="text" name="telefono" placeholder="Teléfono" required style="padding: 8px;">
                        <input type="number" name="edad" placeholder="Edad" required style="padding: 8px;">
                        
                        <label style="font-weight: bold; font-size: 14px;">Foto de perfil:</label>
                        <input type="file" name="foto" accept="image/png, image/jpeg" style="padding: 8px;">
                        
                        <label style="font-weight: bold; font-size: 14px;">Grupo asignado:</label>
                        <select name="id_grupo" required style="padding: 8px;">
            `;

            if (grupos && grupos.length > 0) {
                grupos.forEach(g => {
                    html += `<option value="${g.id_grupo || g.id}">${g.nombre}</option>`;
                });
            } else {
                html += `<option value="">Crea un grupo primero</option>`;
            }

            html += `
                        </select>
                        <button type="submit" style="background: #007bff; color: white; border: none; padding: 10px; cursor: pointer; border-radius: 4px; font-weight: bold;">Registrar Usuario</button>
                    </form>

                    <hr style="margin: 30px 0;">

                    <h3>Listado de Usuarios Registrados</h3>
                    <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <tr style="background: #eee;">
                            <th>Foto</th>
                            <th>Nombre y Apellidos</th>
                            <th>Contacto</th>
                            <th>Edad / Nacimiento</th>
                            <th>Grupo ID</th>
                            <th>Acciones</th>
                        </tr>
            `;

            if (usuarios && usuarios.length > 0) {
                usuarios.forEach(u => {
                    let fotoSrc = u.foto ? '/' + u.foto : '';
                    let userId = u.id_usuario || u.id;
                    html += `
                        <tr>
                            <td>${u.foto ? `<img src="${fotoSrc}" width="40" height="40" style="border-radius: 50%; object-fit: cover;">` : 'Sin foto'}</td>
                            <td><strong>${u.nombre || ''}</strong> ${u.apellido1 || ''} ${u.apellido2 || ''}</td>
                            <td>${u.correo || ''} <br><small>${u.telefono || ''}</small></td>
                            <td>${u.edad || 'N/A'} años <br><small>${u.fecha_nacimiento || ''}</small></td>
                            <td>${u.id_grupo || 'Sin grupo'}</td>
                            <td>
                                <a href="/admin/usuarios/eliminar/${userId}" onclick="return confirm('¿Seguro que deseas dar de baja a este usuario?');" style="color: red; text-decoration: none; font-weight: bold;">Dar de Baja</a>
                            </td>
                        </tr>
                    `;
                });
            } else {
                html += `<tr><td colspan="6">No hay usuarios registrados.</td></tr>`;
            }

            html += `
                    </table>
                </div>
            `;
            res.send(html);
        });
    });
});

// POST: Procesar Alta de Usuario con Multer
router.post('/usuarios/crear', upload.single('foto'), (req, res) => {
    const { nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, id_grupo } = req.body;
    const fotoNombre = req.file ? req.file.filename : null;
    const rolPorDefecto = 'usuario';

    const query = `INSERT INTO usuarios (nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, foto, id_grupo, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [nombre, apellido1, apellido2, fecha_nacimiento, correo, password, telefono, edad, fotoNombre, id_grupo, rolPorDefecto], (err) => {
        if (err) {
            return res.status(400).send("Error al dar de alta al usuario: " + err.message);
        }
        res.redirect('/admin/usuarios');
    });
});

// GET: Dar de Baja (Eliminar) Usuario corregido
router.get('/usuarios/eliminar/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM usuarios WHERE id_usuario = ?`, [id], (err) => {
        if (err) {
            return res.status(400).send("Error al eliminar usuario: " + err.message);
        }
        res.redirect('/admin/usuarios');
    });
});


// ==========================================
// 3. GESTIÓN DE GRUPOS (Alta, Baja, Listado)
// ==========================================
router.get('/grupos', (req, res) => {
    db.all("SELECT * FROM grupos", [], (err, grupos) => {
        let html = `
            <div style="font-family: Arial, sans-serif; margin: 30px; max-width: 800px;">
                <h1>Gestión de Grupos</h1>
                <a href="/admin" style="text-decoration: none; color: #007bff; font-weight: bold;">← Volver al Panel Principal</a>
                <hr>

                <h3>Crear Nuevo Grupo</h3>
                <form action="/admin/grupos/crear" method="POST" style="background: #f9f9f9; padding: 20px; border-radius: 8px; display: flex; gap: 10px; max-width: 600px;">
                    <input type="text" name="nombre" placeholder="Nombre del grupo" required style="padding: 8px; flex: 1;">
                    <input type="text" name="descripcion" placeholder="Descripción" required style="padding: 8px; flex: 1;">
                    <button type="submit" style="background: #28a745; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px; font-weight: bold;">Crear Grupo</button>
                </form>

                <hr style="margin: 30px 0;">

                <h3>Listado de Grupos</h3>
                <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse; text-align: left;">
                    <tr style="background: #eee;">
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                    </tr>
        `;

        if (grupos && grupos.length > 0) {
            grupos.forEach(g => {
                let grupoId = g.id_grupo || g.id;
                html += `
                    <tr>
                        <td>${grupoId}</td>
                        <td><strong>${g.nombre}</strong></td>
                        <td>${g.descripcion}</td>
                        <td>
                            <a href="/admin/grupos/eliminar/${grupoId}" onclick="return confirm('¿Seguro que deseas eliminar este grupo?');" style="color: red; text-decoration: none; font-weight: bold;">Dar de Baja</a>
                        </td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="4">No hay grupos creados todavía.</td></tr>`;
        }

        html += `
                </table>
            </div>
        `;
        res.send(html);
    });
});

// POST: Procesar Creación de Grupo
router.post('/grupos/crear', (req, res) => {
    const { nombre, descripcion } = req.body;
    const query = `INSERT INTO grupos (nombre, descripcion) VALUES (?, ?)`;
    
    db.run(query, [nombre, descripcion], (err) => {
        if (err) {
            return res.status(400).send("Error al crear el grupo: " + err.message);
        }
        res.redirect('/admin/grupos');
    });
});

// GET: Dar de Baja (Eliminar) Grupo
router.get('/grupos/eliminar/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM grupos WHERE id_grupo = ?`, [id], (err) => {
        if (err) {
            return res.status(400).send("Error al eliminar grupo: " + err.message);
        }
        res.redirect('/admin/grupos');
    });
});

module.exports = router;