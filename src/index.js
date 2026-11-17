const express = require('express');
const app = express();

// Middleware para leer los datos del formulario enviados por POST
app.use(express.urlencoded({ extended: true }));

// Ruta GET para mostrar el formulario directamente en el navegador
app.get('/', (req, res) => {
  res.send(`
    <form action="/login" method="POST">
      <h2>Iniciar Sesión</h2>
      <input type="text" name="usuario" placeholder="Usuario" required><br><br>
      <input type="password" name="password" placeholder="Contraseña" required><br><br>
      <button type="submit">Entrar</button>
    </form>
  `);
});

// Ruta POST para procesar las credenciales
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  
  if (usuario === 'admin' && password === '1234') {
    res.send('<h1>¡Acceso concedido!</h1>');
  } else {
    res.send('<h1>Usuario o contraseña incorrectos</h1>');
  }
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
