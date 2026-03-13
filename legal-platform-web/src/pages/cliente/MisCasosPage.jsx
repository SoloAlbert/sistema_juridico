import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function MisCasosPage() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerCasos();
  }, []);

  const obtenerCasos = async () => {
    try {
      const { data } = await api.get('/casos/mis-casos');
      setCasos(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener casos');
    } finally {
      setLoading(false);
    }
  };

  const estadoBody = (row) => {
    let severity = 'info';

    if (row.estado === 'publicado') severity = 'warning';
    if (row.estado === 'asignado') severity = 'info';
    if (row.estado === 'en_proceso') severity = 'success';
    if (row.estado === 'finalizado') severity = 'secondary';
    if (row.estado === 'cancelado') severity = 'danger';

    return <Tag value={row.estado} severity={severity} />;
  };

  const postulacionesBody = (row) => {
    return <Tag value={row.total_postulaciones} severity="contrast" />;
  };

  const accionesBody = (row) => {
    return (
      <Button
        label="Ver detalle"
        icon="pi pi-eye"
        size="small"
        onClick={() => navigate(`/cliente/mis-casos/${row.id_caso}`)}
      />
    );
  };

  return (
    <DashboardLayout>
      <ClienteMenu />

      <Card title="Mis casos" className="shadow-2">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <DataTable
          value={casos}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes casos registrados"
        >
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Título" />
          <Column field="especialidad" header="Especialidad" />
          <Column field="urgencia" header="Urgencia" />
          <Column header="Estado" body={estadoBody} />
          <Column header="Postulaciones" body={postulacionesBody} />
          <Column field="ciudad" header="Ciudad" />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}