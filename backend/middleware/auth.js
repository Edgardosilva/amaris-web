import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
  try {
    // Intentar obtener token de cookies o de headers
    let token = req.cookies.access_token;
    
    // Si no hay token en cookies, intentar obtenerlo del header Authorization
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'No estás autenticado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ error: 'No estás autenticado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
