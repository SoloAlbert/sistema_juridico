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
      label: 'Bitácora',
      icon: 'pi pi-history',
      command: () => navigate('/admin/bitacora')
   }
  ];

  return <Menubar model={items} className="mb-4" />;
}