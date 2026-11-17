const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión a la base de datos Database.db
const dbPath = path.join(__dirname, 'Database.db');
const db = new sqlite3.Database(dbPath);

// 1. Ruta GET: Muestra el panel con los datos actuales y formularios para añadir nuevos
router.get('/admin', (req, res) => {
    // Consultamos las tablas de usuarios y grupos
    db.all("SELECT * FROM usuarios", [], (err, usuarios) => {
        db.all("SELECT * FROM grupos", [], (errGr, grupos) => {
            
            let html = `
                <div style="font-family: Arial, sans-serif; margin: 30px; max-width: 800px;">
                    <h1>Panel de Administración</h1>
                    <p>Bienvenido. Desde aquí puedes gestionar usuarios y grupos.</p>
                    <hr>

                    <!-- SECCIÓN: CREAR GRUPO -->
                    <h2>Crear Nuevo Grupo</h2>
                    <form action="/admin/crear-grupo" method="POST" style="margin-bottom: 20px;">
                        <input type="text" name="nombre" placeholder="Nombre del grupo" required style="padding: 8px; width: 250px;">
                        <input type="text" name="descripcion" placeholder="Descripción" required style="padding: 8px; width: 250px;">
                        <button type="submit" style="padding: 8px 15px; background: #28a745; color: white; border: none; cursor: pointer;">Añadir Grupo</button>
                    </form>

                    <!-- SECCIÓN: CREAR USUARIO -->
                    <h2>Dar de Alta a Usuario</h2>
                    <form action="/admin/crear-usuario" method="POST" style="margin-bottom: 30px;">
                        <input type="text" name="nombre" placeholder="Nombre de usuario" required style="padding: 8px; width: 250px;">
                        <input type="text" name="id_grupo" placeholder="ID del grupo" required style="padding: 8px; width: 150px;">
                        <button type="submit" style="padding: 8px 15px; background: #007bff; color: white; border: none; cursor: pointer;">Añadir Usuario</button>
                    </form>
                    <hr>

                    <!-- LISTADOS -->
                    <h3>Grupos Existentes:</h3>
                    <ul>
            `;

            if (grupos && grupos.length > 0) {
                grupos.forEach(g => {
                    html += `<li>ID: ${g.id_grupo} - <strong>${g.nombre}</strong> (${g.descripcion})</li>`;
                });
            } else {
                html += `<li>No hay grupos creados.</li>`;
            }

            html += `</ul><h3>Usuarios Registrados:</h3><ul>`;

            if (usuarios && usuarios.length > 0) {
                usuarios.forEach(u => {
                    html += `<li><strong>${u.nombre}</strong> (Grupo ID: ${u.id_grupo})</li>`;
                });
            } else {
                html += `<li>No hay usuarios registrados.</li>`;
            }

            html += `
                    </ul>
                    <br><br>
                    <a href="/" style="text-decoration: none; background: #dc3545; color: white; padding: 10px 15px; border-radius: 5px;">Cerrar sesión</a>
                </div>
            `;

            res.send(html);
        });
    });
});

// 2. Ruta POST para procesar el formulario de crear grupo
router.post('/admin/crear-grupo', (req, res) => {
    const { nombre, descripcion } = req.body;
    const query = `INSERT INTO grupos (nombre, descripcion) VALUES (?, ?)`;
    
    db.run(query, [nombre, descripcion], (err) => {
        if (err) {
            return res.status(400).send("Error al crear el grupo: " + err.message);
        }
        res.redirect('/admin'); // Recarga el panel al terminar
    });
});

// 3. Ruta POST para procesar el formulario de crear usuario
router.post('/admin/crear-usuario', (req, res) => {
    const { nombre, id_grupo } = req.body;
    const query = `INSERT INTO usuarios (nombre, id_grupo) VALUES (?, ?)`;
    
    db.run(query, [nombre, id_grupo], (err) => {
        if (err) {
            return res.status(400).send("Error al crear el usuario: " + err.message);
        }
        res.redirect('/admin'); // Recarga el panel al terminar
    });
});

module.exports = router;