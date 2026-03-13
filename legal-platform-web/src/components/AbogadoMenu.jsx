import { Menubar } from 'primereact/menubar';
import { useNavigate } from 'react-router-dom';

export default function AbogadoMenu() {
  const navigate = useNavigate();

  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => navigate('/abogado')
    },
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user-edit',
      command: () => navigate('/abogado/mi-perfil')
    },
    {
      label: 'Casos Disponibles',
      icon: 'pi pi-briefcase',
      command: () => navigate('/abogado/casos-disponibles')
    },
    {
      label: 'Plantillas',
      icon: 'pi pi-file-edit',
      command: () => navigate('/abogado/plantillas')
    },
    {
      label: 'Mis Compras',
      icon: 'pi pi-shopping-cart',
      command: () => navigate('/abogado/plantillas/compras')
    },
    {
      label: 'Mis Documentos',
      icon: 'pi pi-folder-open',
      command: () => navigate('/abogado/documentos')
    },
    {
      label: 'Ingresos',
      icon: 'pi pi-wallet',
      command: () => navigate('/abogado/ingresos')
    },
    {
      label: 'Conversaciones',
      icon: 'pi pi-comments',
      command: () => navigate('/abogado/conversaciones')
    },
    {
      label: 'Citas',
      icon: 'pi pi-calendar',
      command: () => navigate('/abogado/citas')
    }
  ];

  return <Menubar model={items} className="mb-4" />;
}