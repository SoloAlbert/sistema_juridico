const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const register = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      telefono,
      password,
      role
    } = req.body;

    if (!nombre || !email || !password || !role) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre, email, password y role son obligatorios'
      });
    }

    if (!['abogado', 'cliente'].includes(role)) {
      return res.status(400).json({
        ok: false,
        message: 'El role debe ser abogado o cliente'
      });
    }

    const [existingUsers] = await connection.query(
      'SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'El correo ya está registrado'
      });
    }

    const [roles] = await connection.query(
      'SELECT id_role FROM roles WHERE nombre = ? LIMIT 1',
      [role]
    );

    if (roles.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Rol no encontrado en la base de datos'
      });
    }

    const id_role = roles[0].id_role;
    const password_hash = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO usuarios 
      (id_role, nombre, apellido_paterno, apellido_materno, email, telefono, password_hash, estatus_cuenta, email_verificado, telefono_verificado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'activo', 0, 0)`,
      [
        id_role,
        nombre,
        apellido_paterno || null,
        apellido_materno || null,
        email,
        telefono || null,
        password_hash
      ]
    );

    const id_usuario = userResult.insertId;

    if (role === 'abogado') {
      await connection.query(
        `INSERT INTO abogados 
        (id_usuario, anos_experiencia, modalidad_atencion, consulta_gratuita, precio_consulta_base, moneda, estatus_verificacion, acepta_nuevos_casos)
        VALUES (?, 0, 'ambas', 0, 0.00, 'MXN', 'pendiente', 1)`,
        [id_usuario]
      );
    }

    if (role === 'cliente') {
      await connection.query(
        `INSERT INTO clientes (id_usuario)
         VALUES (?)`,
        [id_usuario]
      );
    }

    await connection.commit();

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente',
      data: {
        id_usuario,
        email,
        role
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en register:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno al registrar usuario'
    });
  } finally {
    connection.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Email y password son obligatorios'
      });
    }

    const [users] = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre,
        u.apellido_paterno,
        u.apellido_materno,
        u.email,
        u.password_hash,
        u.estatus_cuenta,
        r.nombre AS role
      FROM usuarios u
      INNER JOIN roles r ON r.id_role = u.id_role
      WHERE u.email = ?
      LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    if (user.estatus_cuenta !== 'activo') {
      return res.status(403).json({
        ok: false,
        message: 'La cuenta no está activa'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await pool.query(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id_usuario = ?',
      [user.id_usuario]
    );

    return res.json({
      ok: true,
      message: 'Login correcto',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        apellido_paterno: user.apellido_paterno,
        apellido_materno: user.apellido_materno,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno al iniciar sesión'
    });
  }
};

module.exports = {
  register,
  login
};