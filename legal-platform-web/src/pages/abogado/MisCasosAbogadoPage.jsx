import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function MisCasosAbogadoPage() {
  const navigate = useNavigate();
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/casos/abogado/mis-casos');
      setCasos(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener mis casos');
    } finally {
      setLoading(false);
    }
  };

  const estadoCasoBody = (row) => {
    let severity = 'info';
    if (row.estado === 'asignado') severity = 'warning';
    if (row.estado === 'en_proceso') severity = 'success';
    if (row.estado === 'finalizado') severity = 'secondary';
    if (row.estado === 'cancelado') severity = 'danger';
    return <Tag value={row.estado} severity={severity} />;
  };

  const estadoServicioBody = (row) => {
    let severity = 'info';
    if (row.estado_servicio === 'pendiente_pago') severity = 'warning';
    if (row.estado_servicio === 'pagado') severity = 'info';
    if (row.estado_servicio === 'en_proceso') severity = 'success';
    if (row.estado_servicio === 'completado') severity = 'secondary';
    if (row.estado_servicio === 'cancelado') severity = 'danger';
    return <Tag value={row.estado_servicio} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      <Card title="Mis casos" className="shadow-2">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <DataTable
          value={casos}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes casos asignados"
        >
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Caso" />
          <Column field="especialidad" header="Especialidad" />
          <Column field="cliente_nombre" header="Cliente" body={(row) => `${row.cliente_nombre || ''} ${row.cliente_apellido_paterno || ''}`.trim()} />
          <Column header="Estado caso" body={estadoCasoBody} />
          <Column header="Estado servicio" body={estadoServicioBody} />
          <Column field="monto_acordado" header="Monto" body={(row) => `$${Number(row.monto_acordado || 0).toFixed(2)}`} />
          <Column
            header="Acciones"
            body={(row) => (
              <Button
                label="Gestionar"
                icon="pi pi-cog"
                size="small"
                onClick={() => navigate(`/abogado/mis-casos/${row.id_caso}`)}
              />
            )}
          />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}
