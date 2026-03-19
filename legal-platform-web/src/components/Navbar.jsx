import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const panelPath = user?.role === 'abogado'
    ? '/abogado'
    : user?.role === 'cliente'
      ? '/cliente'
      : user?.role === 'admin'
        ? '/admin'
        : '/';

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

        
      </div>
    </header>
  );
}
