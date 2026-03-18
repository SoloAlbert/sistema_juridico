import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

export default function NotificacionesAbogadoPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [resumen, setResumen] = useState({
    total: 0,
    no_leidas: 0,
    citas: 0,
    mensajes: 0,
    pagos: 0,
    casos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/notificaciones');
      setNotificaciones(data.data || []);
      setResumen((prev) => ({
        ...prev,
        ...(data.resumen || {})
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const marcarLeida = async (id) => {
    try {
      setInfo('');
      await api.patch(`/notificaciones/${id}/leer`);
      setInfo('Notificacion actualizada');
      await cargarNotificaciones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar notificacion');
    }
  };

  const marcarTodas = async () => {
    try {
      setInfo('');
      await api.patch('/notificaciones/leer-todas');
      setInfo('Todas las notificaciones fueron marcadas como leidas');
      await cargarNotificaciones();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar notificaciones');
    }
  };

  const formatoFecha = (valor) => {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(fecha);
  };

  const tipoBody = (row) => {
    const severities = {
      sistema: 'contrast',
      pago: 'success',
      cita: 'info',
      mensaje: 'warning',
      caso: 'secondary'
    };

    return <Tag value={row.tipo_notificacion} severity={severities[row.tipo_notificacion] || 'info'} />;
  };

  const estadoBody = (row) => (
    <Tag value={row.leida ? 'leida' : 'pendiente'} severity={row.leida ? 'success' : 'warning'} />
  );

  const accionesBody = (row) => (
    <Button
      size="small"
      label={row.leida ? 'Leida' : 'Marcar leida'}
      outlined
      disabled={!!row.leida}
      onClick={() => marcarLeida(row.id_notificacion)}
    />
  );

  const tarjeta = (titulo, valor) => (
    <div className="col-12 md:col-6 lg:col-2">
      <Card className="shadow-2 h-full">
        <div className="text-600 text-sm mb-2">{titulo}</div>
        <div className="text-2xl font-semibold">{valor}</div>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {info && <Message severity="success" text={info} className="w-full mb-3" />}

      <div className="mb-4">
        <h1 className="m-0">Notificaciones</h1>
        <p className="text-700">Alertas de casos, mensajes, pagos, citas y revisiones del sistema.</p>
      </div>

      <div className="grid mb-3">
        {tarjeta('Total', resumen.total || 0)}
        {tarjeta('No leidas', resumen.no_leidas || 0)}
        {tarjeta('Mensajes', resumen.mensajes || 0)}
        {tarjeta('Citas', resumen.citas || 0)}
        {tarjeta('Pagos', resumen.pagos || 0)}
        {tarjeta('Casos', resumen.casos || 0)}
      </div>

      <Card title="Bandeja" className="shadow-2">
        <div className="flex justify-content-end mb-3">
          <Button
            label="Marcar todas como leidas"
            icon="pi pi-check"
            outlined
            onClick={marcarTodas}
            disabled={!resumen.no_leidas}
          />
        </div>

        <DataTable
          value={notificaciones}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes notificaciones"
          rowClassName={(row) => (!row.leida ? 'surface-50' : '')}
        >
          <Column header="Tipo" body={tipoBody} />
          <Column field="titulo" header="Titulo" />
          <Column field="mensaje" header="Mensaje" />
          <Column field="created_at" header="Fecha" body={(row) => formatoFecha(row.created_at)} />
          <Column header="Estado" body={estadoBody} />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}
