import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import ClienteMenu from '../../components/ClienteMenu';

export default function ClienteDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <ClienteMenu />

      <div className="mb-4">
        <h1 className="m-0">Panel del Cliente</h1>
        <p className="text-700">Administra tus casos, pagos, conversaciones, citas y cierre de servicios.</p>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Crear Caso</h3>
              <Tag value="Nuevo" severity="success" />
            </div>
            <p className="text-700">Publica un nuevo asunto legal y recibe postulaciones.</p>
            <Button
              label="Ir a crear caso"
              icon="pi pi-plus"
              className="mt-2"
              onClick={() => navigate('/cliente/crear-caso')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="m-0 mb-3">Mis Casos</h3>
            <p className="text-700">Consulta tus casos activos, finalizados y sus postulaciones.</p>
            <Button
              label="Ver mis casos"
              icon="pi pi-list"
              className="mt-2"
              outlined
              onClick={() => navigate('/cliente/mis-casos')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="m-0 mb-3">Buscar Abogados</h3>
            <p className="text-700">Explora perfiles verificados y compara experiencia antes de contratar.</p>
            <Button
              label="Ir al directorio"
              icon="pi pi-search"
              className="mt-2"
              outlined
              onClick={() => navigate('/abogados')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="m-0 mb-3">Mis Pagos</h3>
            <p className="text-700">Revisa pagos registrados y estatus financieros.</p>
            <Button
              label="Ver pagos"
              icon="pi pi-wallet"
              className="mt-2"
              outlined
              onClick={() => navigate('/cliente/mis-pagos')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="m-0 mb-3">Conversaciones</h3>
            <p className="text-700">Habla con tu abogado y organiza citas dentro de la plataforma.</p>
            <Button
              label="Abrir conversaciones"
              icon="pi pi-comments"
              className="mt-2"
              outlined
              onClick={() => navigate('/cliente/conversaciones')}
            />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
