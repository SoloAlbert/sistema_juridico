import DashboardLayout from '../../layouts/DashboardLayout';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import AbogadoMenu from '../../components/AbogadoMenu';

export default function AbogadoDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <AbogadoMenu />

      <div className="mb-4">
        <h1 className="m-0">Panel del Abogado</h1>
        <p className="text-700">Gestiona tu perfil, explora casos, conversa con clientes y revisa ingresos.</p>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Mi Perfil</h3>
              <Tag value="Profesional" severity="info" />
            </div>
            <p className="text-700">Edita tu información, experiencia y especialidades.</p>
            <Button
              label="Editar perfil"
              icon="pi pi-user-edit"
              className="mt-2"
              onClick={() => navigate('/abogado/mi-perfil')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <div className="flex justify-content-between align-items-center mb-3">
              <h3 className="m-0">Casos Disponibles</h3>
              <Tag value="Marketplace" severity="success" />
            </div>
            <p className="text-700">Explora asuntos legales publicados por clientes.</p>
            <Button
              label="Ver casos"
              icon="pi pi-search"
              className="mt-2"
              onClick={() => navigate('/abogado/casos-disponibles')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="m-0 mb-3">Ingresos</h3>
            <p className="text-700">Consulta pagos, comisiones y neto generado.</p>
            <Button
              label="Ver ingresos"
              icon="pi pi-wallet"
              className="mt-2"
              outlined
              onClick={() => navigate('/abogado/ingresos')}
            />
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="m-0 mb-3">Conversaciones</h3>
            <p className="text-700">Habla con tus clientes y gestiona citas.</p>
            <Button
              label="Abrir conversaciones"
              icon="pi pi-comments"
              className="mt-2"
              outlined
              onClick={() => navigate('/abogado/conversaciones')}
            />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}