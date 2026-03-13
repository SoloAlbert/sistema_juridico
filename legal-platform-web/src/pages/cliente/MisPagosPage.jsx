import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';

export default function MisPagosPage() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerPagos();
  }, []);

  const obtenerPagos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/pagos/mis-pagos');
      setPagos(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener pagos');
    } finally {
      setLoading(false);
    }
  };

  const estadoBody = (row) => {
    let severity = 'info';
    if (row.estatus_pago === 'pagado') severity = 'success';
    if (row.estatus_pago === 'pendiente') severity = 'warning';
    if (row.estatus_pago === 'fallido') severity = 'danger';
    if (row.estatus_pago === 'reembolsado') severity = 'secondary';
    if (row.estatus_pago === 'retenido') severity = 'contrast';

    return <Tag value={row.estatus_pago} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <ClienteMenu />

      <Card title="Mis pagos" className="shadow-2">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <DataTable
          value={pagos}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes pagos registrados"
        >
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Caso" />
          <Column field="metodo_pago" header="Método" />
          <Column field="monto_bruto" header="Monto" />
          <Column field="monto_comision" header="Comisión" />
          <Column field="monto_neto_abogado" header="Neto abogado" />
          <Column header="Estado" body={estadoBody} />
          <Column field="fecha_pago" header="Fecha pago" />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}