import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';

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
      setResumen((prev) => ({
        ...prev,
        ...(data.resumen || {})
      }));
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

  const formatoFecha = (valor) => {
    if (!valor) return '-';
    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(fecha);
  };

  const tarjetaResumen = (titulo, valor, nota) => (
    <div className="col-12 md:col-6 lg:col-4 xl:col-2">
      <Card className="shadow-2 h-full">
        <div className="text-600 text-sm mb-2">{titulo}</div>
        <div className="text-2xl font-bold mb-2">{valor}</div>
        <small className="text-500">{nota}</small>
      </Card>
    </div>
  );

  const estadoBody = (row) => {
    let severity = 'info';
    if (row.estatus_pago === 'pagado') severity = 'success';
    if (row.estatus_pago === 'pendiente') severity = 'warning';
    if (row.estatus_pago === 'fallido') severity = 'danger';
    if (row.estatus_pago === 'reembolsado') severity = 'secondary';
    if (row.estatus_pago === 'retenido') severity = 'contrast';

    return <Tag value={row.estatus_pago} severity={severity} />;
  };

  const casoBody = (row) => (
    <div>
      <div className="font-semibold">{row.folio_caso || `Caso #${row.id_caso}`}</div>
      <small className="text-600">{row.titulo || '-'}</small>
    </div>
  );

  return (
    <DashboardLayout>
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <div className="mb-4">
        <h1 className="m-0">Ingresos y comisiones</h1>
        <p className="text-700">
          Resumen de cobros, retenciones, comision de plataforma y saldo pendiente por liberar.
        </p>
      </div>

      <div className="grid mb-3">
        {tarjetaResumen('Total pagos', resumen.total_pagos || 0, 'Cobros registrados')}
        {tarjetaResumen('Total cobrado', formatoMoneda(resumen.total_facturado), 'Monto bruto pagado por clientes')}
        {tarjetaResumen('Tu comision', formatoMoneda(resumen.total_comisiones), 'Retencion/plataforma acumulada')}
        {tarjetaResumen('Neto liberado', formatoMoneda(resumen.total_neto), 'Disponible como ingreso real')}
        {tarjetaResumen('Monto retenido', formatoMoneda(resumen.total_retenido), 'Pagos detenidos temporalmente')}
        {tarjetaResumen('Saldo pendiente', formatoMoneda(resumen.saldo_pendiente), 'Pendiente por confirmar o liberar')}
      </div>

      <Card className="shadow-2 mb-3">
        <div className="grid">
          <div className="col-12 md:col-4">
            <div className="text-sm text-600 mb-2">Cobrado por clientes</div>
            <div className="text-xl font-semibold">{formatoMoneda(resumen.total_facturado)}</div>
          </div>
          <div className="col-12 md:col-4">
            <div className="text-sm text-600 mb-2">Menos comision y retenido</div>
            <div className="text-xl font-semibold">
              {formatoMoneda(Number(resumen.total_comisiones || 0) + Number(resumen.total_retenido || 0))}
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="text-sm text-600 mb-2">Resultado para abogado</div>
            <div className="text-xl font-semibold">
              {formatoMoneda(Number(resumen.total_neto || 0) + Number(resumen.saldo_pendiente || 0))}
            </div>
          </div>
        </div>
        <Divider />
        <small className="text-600">
          El neto liberado refleja pagos completados. El saldo pendiente incluye movimientos en estatus pendiente o retenido.
        </small>
      </Card>

      <Card title="Historial de ingresos" className="shadow-2">
        <DataTable
          value={ingresos}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes ingresos registrados"
        >
          <Column header="Caso" body={casoBody} />
          <Column field="monto_bruto" header="Monto bruto" body={(row) => formatoMoneda(row.monto_bruto)} />
          <Column field="monto_comision" header="Comision" body={(row) => formatoMoneda(row.monto_comision)} />
          <Column field="monto_neto_abogado" header="Neto" body={(row) => formatoMoneda(row.monto_neto_abogado)} />
          <Column field="monto_liberado" header="Liberado" body={(row) => formatoMoneda(row.monto_liberado)} />
          <Column field="porcentaje_comision" header="% comision" body={(row) => `${Number(row.porcentaje_comision || 0)}%`} />
          <Column field="fecha_pago" header="Fecha pago" body={(row) => formatoFecha(row.fecha_pago)} />
          <Column header="Estado" body={estadoBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}
