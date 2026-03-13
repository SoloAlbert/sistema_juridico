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
    }
  ];

  return <Menubar model={items} className="mb-4" />;
}