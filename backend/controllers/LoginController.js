import bcrypt from 'bcryptjs';
import db from '../database.js'; 
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    // Los datos ya están validados y sanitizados por el middleware de Zod
    const { nombre, apellido, email, contraseña, telefono } = req.body;

    try {
        const [rows] = await db.query('SELECT id FROM usuarios_registrados WHERE email = ?', [email]);
        if (rows.length) return res.status(409).json({ error: "El usuario ya existe" });

        const hashedPassword = await bcrypt.hash(contraseña, 10);
        // Rol por defecto es 'usuario'
        await db.query(
            'INSERT INTO usuarios_registrados (nombre, apellido, email, contraseña, telefono, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, hashedPassword, telefono, 'usuario']
        );

        res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
      console.error(error); 
      res.status(500).json({ error: "Error interno del servidor" });
  }
  
};


export const login = async (req, res) => {
    const { email, contraseña } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM usuarios_registrados WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: "Credenciales inválidas" });

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(contraseña, user.contraseña);
        if (!passwordMatch) return res.status(401).json({ error: "Credenciales inválidas" });

        // Incluir el rol en el token JWT
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email,
            rol: user.rol || 'usuario'
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 60 * 60 * 1000,
            path: '/'
        });

        const userInfo = {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            telefono: user.telefono,
            rol: user.rol || 'usuario'
        };

        res.status(200).json({ 
            message: 'Login exitoso',
            user: userInfo
        }); 
    } catch (error) {
        console.error("Error al hacer login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}



export const verificarToken = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ authenticated: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ authenticated: true, user: decoded });
    } catch (error) {
        res.status(403).json({ authenticated: false, message: 'Token invalid or expired' });
    }
};


export const getCurrentUser = async (req, res) => {
    try {
      const token = req.cookies.access_token;
      if (!token) return res.status(401).json({ authenticated: false });
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.status(200).json({
        authenticated: true,
        user: { 
            id: decoded.id, 
            email: decoded.email,
            rol: decoded.rol || 'usuario'
        }
      });
    } catch (error) {
      res.status(401).json({ authenticated: false });
    }
  };


  export const logout = (req, res) => {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true, 
      sameSite: 'None',
    });
    res.status(200).json({ message: 'Sesión cerrada' });
  };
  


export default {
    login,
    register,
    verificarToken,
    logout,
    getCurrentUser
};
 