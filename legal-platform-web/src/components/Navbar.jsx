import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const panelPath = user?.role === 'abogado'
    ? '/abogado'
    : user?.role === 'cliente'
      ? '/cliente'
      : user?.role === 'admin'
        ? '/admin'
        : '/';

  const cerrarSesion = () => {
    logout();
    navigate('/');
  };

  const mostrarAcceso = !isAuthenticated;
  const enLogin = location.pathname === '/login';
  const enRegistro = location.pathname === '/register';
  const enAuth = enLogin || enRegistro;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to={isAuthenticated ? panelPath : '/'} className="site-brand">
          <span className="site-brand__mark">LP</span>
          <span>
            <span className="site-brand__title">JuridicoService</span>
            <span className="site-brand__subtitle">Servicios legales con criterio y confianza</span>
          </span>
        </Link>

        <div className="flex align-items-center gap-2">
          {mostrarAcceso && !enAuth && (
            <Button
              label="Iniciar sesion"
              icon="pi pi-sign-in"
              className="site-header__login"
              onClick={() => navigate('/login')}
            />
          )}

          {mostrarAcceso && !enAuth && (
            <Button
              label="Crear cuenta"
              icon="pi pi-user-plus"
              outlined
              onClick={() => navigate('/register')}
            />
          )}

          {isAuthenticated && (
            <Button
              label="Cerrar sesion"
              icon="pi pi-sign-out"
              outlined
              severity="secondary"
              onClick={cerrarSesion}
            />
          )}
        </div>
      </div>
    </header>
  );
}
