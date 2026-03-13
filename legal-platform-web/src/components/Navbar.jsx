import { Link, useNavigate } from 'react-router-dom';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const items = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      command: () => navigate('/')
    }
  ];

  if (isAuthenticated && user?.role === 'cliente') {
    items.push({
      label: 'Panel Cliente',
      icon: 'pi pi-user',
      command: () => navigate('/cliente')
    });
  }

  if (isAuthenticated && user?.role === 'abogado') {
    items.push({
      label: 'Panel Abogado',
      icon: 'pi pi-briefcase',
      command: () => navigate('/abogado')
    });
  }

  const start = (
    <Link to="/" className="text-xl font-bold no-underline text-900">
      Legal Platform
    </Link>
  );

  const end = !isAuthenticated ? (
    <div className="flex gap-2">
      <Button
        label="Login"
        icon="pi pi-sign-in"
        outlined
        onClick={() => navigate('/login')}
      />
      <Button
        label="Registro"
        icon="pi pi-user-plus"
        onClick={() => navigate('/register')}
      />
    </div>
  ) : (
    <div className="flex align-items-center gap-3">
      <span className="font-medium">{user?.nombre}</span>
      <Tag value={user?.role} severity={user?.role === 'abogado' ? 'info' : 'success'} />
      <Button
        label="Salir"
        icon="pi pi-sign-out"
        severity="danger"
        outlined
        onClick={() => {
          logout();
          navigate('/login');
        }}
      />
    </div>
  );

  return <Menubar model={items} start={start} end={end} />;
}