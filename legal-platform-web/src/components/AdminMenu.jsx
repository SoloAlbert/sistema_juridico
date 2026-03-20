import { Menubar } from 'primereact/menubar';
import { useNavigate } from 'react-router-dom';

export default function AdminMenu() {
  const navigate = useNavigate();

  const items = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => navigate('/admin')
    },
    {
      label: 'Plantillas',
      icon: 'pi pi-file-edit',
      command: () => navigate('/admin/plantillas')
    },
    {
      label: 'Bloques HTML',
      icon: 'pi pi-th-large',
      command: () => navigate('/admin/bloques-html')
    },
    {
      label: 'Plantillas maestras',
      icon: 'pi pi-clone',
      command: () => navigate('/admin/plantillas-maestras')
    },
    {
      label: 'Tipos de documento',
      icon: 'pi pi-sitemap',
      command: () => navigate('/admin/tipos-documento')
    },
    {
      label: 'Verificaciones',
      icon: 'pi pi-verified',
      command: () => navigate('/admin/verificaciones')
    },
    {
      label: 'Cumplimiento',
      icon: 'pi pi-shield',
      command: () => navigate('/admin/cumplimiento')
    },
    {
      label: 'Bitacora',
      icon: 'pi pi-history',
      command: () => navigate('/admin/bitacora')
    },
    {
      label: 'Papelera',
      icon: 'pi pi-trash',
      command: () => navigate('/admin/papelera')
    }
  ];

  return <Menubar model={items} className="mb-4" />;
}
