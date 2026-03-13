import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <AdminMenu />

      <div className="mb-4">
        <h1 className="m-0">Panel Admin</h1>
        <p className="text-700">Gestiona plantillas, versiones y variables del sistema.</p>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4">
          <Card className="shadow-2">
            <h3 className="mt-0">Plantillas legales</h3>
            <p className="text-700">Crea, edita, activa y versiona machotes.</p>
            <Button
              label="Ir a plantillas"
              icon="pi pi-file-edit"
              onClick={() => navigate('/admin/plantillas')}
            />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}