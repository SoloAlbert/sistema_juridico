import { Menubar } from 'primereact/menubar';
import { useNavigate } from 'react-router-dom';

export default function ClienteMenu() {
  const navigate = useNavigate();

  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => navigate('/cliente')
    },
    {
      label: 'Crear Caso',
      icon: 'pi pi-plus-circle',
      command: () => navigate('/cliente/crear-caso')
    },
    {
      label: 'Buscar Abogados',
      icon: 'pi pi-search',
      command: () => navigate('/abogados')
    },
    {
      label: 'Mis Casos',
      icon: 'pi pi-briefcase',
      command: () => navigate('/cliente/mis-casos')
    },
    {
      label: 'Mis Pagos',
      icon: 'pi pi-wallet',
      command: () => navigate('/cliente/mis-pagos')
    },
    {
      label: 'Conversaciones',
      icon: 'pi pi-comments',
      command: () => navigate('/cliente/conversaciones')
    },
    {
      label: 'Citas',
      icon: 'pi pi-calendar',
      command: () => navigate('/cliente/citas')
    }
  ];

  return <Menubar model={items} className="mb-4" />;
}
