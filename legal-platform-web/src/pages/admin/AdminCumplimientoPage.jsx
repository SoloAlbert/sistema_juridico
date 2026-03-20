import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';

export default function AdminCumplimientoPage() {
  const [data, setData] = useState({ alertas: [], disputas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [resoluciones, setResoluciones] = useState({});

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/cumplimiento');
      setData(data.data || { alertas: [], disputas: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar cumplimiento');
    } finally {
      setLoading(false);
    }
  };

  const resolverAlerta = async (row, estatus_alerta) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = resoluciones[`alerta_${row.id_cumplimiento_alerta}`] || {};
      const { data } = await api.patch(`/admin/cumplimiento/alertas/${row.id_cumplimiento_alerta}`, {
        estatus_alerta,
        monto_multa: payload.monto_multa || 0
      });
      setSuccess(data.message || 'Alerta actualizada');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al resolver alerta');
    } finally {
      setSaving(false);
    }
  };

  const resolverDisputa = async (row, estatus_disputa) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = resoluciones[`disputa_${row.id_disputa}`] || {};
      const { data } = await api.patch(`/admin/cumplimiento/disputas/${row.id_disputa}`, {
        estatus_disputa,
        resolucion: payload.resolucion || ''
      });
      setSuccess(data.message || 'Disputa actualizada');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al resolver disputa');
    } finally {
      setSaving(false);
    }
  };

  const nombre = (row, prefijo) =>
    `${row[`${prefijo}_nombre`] || ''} ${row[`${prefijo}_apellido_paterno`] || ''} ${row[`${prefijo}_apellido_materno`] || ''}`.trim() || '-';

  return (
    <DashboardLayout>
      <AdminMenu />

      <div className="mb-4">
        <h1 className="m-0">Cumplimiento y disputas</h1>
        <p className="text-700">Gestiona evasiones de pago, contacto externo, incumplimiento y cierre de disputas. Cada resolucion recalcula la reputacion del abogado.</p>
      </div>

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <TabView>
        <TabPanel header={`Alertas (${data.alertas.length})`}>
          <Card className="shadow-2">
            <DataTable value={data.alertas} loading={loading} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay alertas registradas">
              <Column field="id_cumplimiento_alerta" header="ID" />
              <Column field="id_caso" header="Caso" />
              <Column header="Reportado" body={(row) => nombre(row, 'reportado')} />
              <Column field="tipo_alerta" header="Tipo" />
              <Column field="motivo" header="Motivo" />
              <Column header="Estatus" body={(row) => <Tag value={row.estatus_alerta} severity={row.estatus_alerta === 'confirmada' ? 'danger' : row.estatus_alerta === 'descartada' ? 'success' : 'warning'} />} />
              <Column header="Cumplimiento" body={(row) => `${Number(row.reputacion_cumplimiento || 100).toFixed(0)}/100 · ${row.estatus_cumplimiento || 'normal'}`} />
              <Column
                header="Acciones"
                body={(row) => (
                  <div className="flex flex-column gap-2" style={{ minWidth: '16rem' }}>
                    <InputNumber
                      value={resoluciones[`alerta_${row.id_cumplimiento_alerta}`]?.monto_multa || 0}
                      onValueChange={(e) => setResoluciones((prev) => ({
                        ...prev,
                        [`alerta_${row.id_cumplimiento_alerta}`]: {
                          ...prev[`alerta_${row.id_cumplimiento_alerta}`],
                          monto_multa: e.value || 0
                        }
                      }))}
                      mode="currency"
                      currency="MXN"
                      locale="es-MX"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button size="small" label="Confirmar" severity="danger" onClick={() => resolverAlerta(row, 'confirmada')} loading={saving} />
                      <Button size="small" label="Descartar" outlined onClick={() => resolverAlerta(row, 'descartada')} loading={saving} />
                      <Button size="small" label="Cerrar" outlined onClick={() => resolverAlerta(row, 'cumplida')} loading={saving} />
                    </div>
                  </div>
                )}
              />
            </DataTable>
          </Card>
        </TabPanel>

        <TabPanel header={`Disputas (${data.disputas.length})`}>
          <Card className="shadow-2">
            <DataTable value={data.disputas} loading={loading} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay disputas registradas">
              <Column field="id_disputa" header="ID" />
              <Column field="id_caso" header="Caso" />
              <Column header="Reportante" body={(row) => nombre(row, 'reportante')} />
              <Column field="tipo_disputa" header="Tipo" />
              <Column field="motivo" header="Motivo" />
              <Column header="Estatus" body={(row) => <Tag value={row.estatus_disputa} severity={row.estatus_disputa === 'cerrada' ? 'success' : row.estatus_disputa === 'en_revision' ? 'warning' : 'danger'} />} />
              <Column header="Cumplimiento" body={(row) => `${Number(row.reputacion_cumplimiento || 100).toFixed(0)}/100 · ${row.estatus_cumplimiento || 'normal'}`} />
              <Column
                header="Acciones"
                body={(row) => (
                  <div className="flex flex-column gap-2" style={{ minWidth: '18rem' }}>
                    <InputTextarea
                      value={resoluciones[`disputa_${row.id_disputa}`]?.resolucion || ''}
                      onChange={(e) => setResoluciones((prev) => ({
                        ...prev,
                        [`disputa_${row.id_disputa}`]: {
                          ...prev[`disputa_${row.id_disputa}`],
                          resolucion: e.target.value
                        }
                      }))}
                      rows={3}
                      className="w-full"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button size="small" label="Revision" severity="warning" onClick={() => resolverDisputa(row, 'en_revision')} loading={saving} />
                      <Button size="small" label="Cliente" severity="success" onClick={() => resolverDisputa(row, 'resuelta_cliente')} loading={saving} />
                      <Button size="small" label="Abogado" outlined onClick={() => resolverDisputa(row, 'resuelta_abogado')} loading={saving} />
                      <Button size="small" label="Cerrar" outlined onClick={() => resolverDisputa(row, 'cerrada')} loading={saving} />
                    </div>
                  </div>
                )}
              />
            </DataTable>
          </Card>
        </TabPanel>
      </TabView>
    </DashboardLayout>
  );
}
