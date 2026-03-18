import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

export default function IngresosAbogadoPage() {
  const [ingresos, setIngresos] = useState([]);
  const [resumen, setResumen] = useState({
    total_pagos: 0,
    total_facturado: 0,
    total_comisiones: 0,
    total_neto: 0,
    total_retenido: 0,
    saldo_pendiente: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerIngresos();
  }, []);

  const obtenerIngresos = async () => {
    try {
      const { data } = await api.get('/pagos/mis-ingresos');
      setIngresos(data.data || []);
      setResumen(data.resumen || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener ingresos');
    } finally {
      setLoading(false);
    }
  };

  const formatoMoneda = (valor) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(valor || 0));

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
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <div className="grid mb-3">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="mt-0">Total pagos</h3>
            <p className="text-2xl font-bold m-0">{resumen.total_pagos || 0}</p>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="mt-0">Facturado</h3>
            <p className="text-2xl font-bold m-0">{formatoMoneda(resumen.total_facturado)}</p>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="mt-0">Comisiones</h3>
            <p className="text-2xl font-bold m-0">{formatoMoneda(resumen.total_comisiones)}</p>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="shadow-2">
            <h3 className="mt-0">Neto</h3>
            <p className="text-2xl font-bold m-0">{formatoMoneda(resumen.total_neto)}</p>
          </Card>
        </div>
      </div>

      <Card title="Historial de ingresos" className="shadow-2">
        <DataTable
          value={ingresos}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes ingresos registrados"
        >
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Caso" />
          <Column field="monto_bruto" header="Monto bruto" body={(row) => formatoMoneda(row.monto_bruto)} />
          <Column field="monto_comision" header="Comisión" body={(row) => formatoMoneda(row.monto_comision)} />
          <Column field="monto_neto_abogado" header="Neto" body={(row) => formatoMoneda(row.monto_neto_abogado)} />
          <Column field="fecha_pago" header="Fecha pago" />
          <Column header="Estado" body={estadoBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}
