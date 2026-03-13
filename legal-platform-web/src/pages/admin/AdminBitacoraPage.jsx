import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';

export default function AdminBitacoraPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const [filtros, setFiltros] = useState({
    modulo: null,
    entidad: null,
    accion: null
  });

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filtros.modulo) params.modulo = filtros.modulo;
      if (filtros.entidad) params.entidad = filtros.entidad;
      if (filtros.accion) params.accion = filtros.accion;

      const { data } = await api.get('/admin/bitacora', { params });
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar bitácora');
    } finally {
      setLoading(false);
    }
  };

  const usuarioBody = (row) =>
    `${row.nombre || ''} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim();

  const accionBody = (row) => {
    let severity = 'info';
    if (row.accion === 'crear') severity = 'success';
    if (row.accion === 'actualizar') severity = 'warning';
    if (row.accion === 'clonar') severity = 'contrast';
    if (row.accion === 'guardar_sugerencia') severity = 'secondary';

    return <Tag value={row.accion} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <Card title="Bitácora admin" className="shadow-2 mb-4">
        <div className="grid">
          <div className="col-12 md:col-3">
            <label className="block mb-2">Módulo</label>
            <Dropdown
              value={filtros.modulo}
              options={[
                { label: 'Plantillas', value: 'plantillas' },
                { label: 'Bloques HTML', value: 'bloques_html' },
                { label: 'Plantillas maestras', value: 'plantillas_maestras' },
                { label: 'Tipos documento', value: 'tipos_documento' }
              ]}
              onChange={(e) => setFiltros((p) => ({ ...p, modulo: e.value }))}
              className="w-full"
              showClear
              placeholder="Todos"
            />
          </div>

          <div className="col-12 md:col-3">
            <label className="block mb-2">Entidad</label>
            <Dropdown
              value={filtros.entidad}
              options={[
                { label: 'Plantillas legales', value: 'plantillas_legales' },
                { label: 'Bloques HTML', value: 'plantilla_bloques_html' },
                { label: 'Plantillas maestras', value: 'plantilla_maestra_html' },
                { label: 'Sugerencias tipo', value: 'tipos_documento_sugerencias' },
                { label: 'Tipos documento', value: 'tipos_documento' }
              ]}
              onChange={(e) => setFiltros((p) => ({ ...p, entidad: e.value }))}
              className="w-full"
              showClear
              placeholder="Todas"
            />
          </div>

          <div className="col-12 md:col-3">
            <label className="block mb-2">Acción</label>
            <Dropdown
              value={filtros.accion}
              options={[
                { label: 'Crear', value: 'crear' },
                { label: 'Actualizar', value: 'actualizar' },
                { label: 'Clonar', value: 'clonar' },
                { label: 'Guardar sugerencia', value: 'guardar_sugerencia' }
              ]}
              onChange={(e) => setFiltros((p) => ({ ...p, accion: e.value }))}
              className="w-full"
              showClear
              placeholder="Todas"
            />
          </div>

          <div className="col-12 md:col-3 flex align-items-end">
            <Button label="Filtrar" icon="pi pi-filter" onClick={cargar} />
          </div>
        </div>
      </Card>

      <Card className="shadow-2">
        <DataTable value={items} loading={loading} paginator rows={15} responsiveLayout="scroll">
          <Column field="id_bitacora" header="ID" />
          <Column header="Usuario" body={usuarioBody} />
          <Column field="modulo" header="Módulo" />
          <Column field="entidad" header="Entidad" />
          <Column field="id_entidad" header="ID entidad" />
          <Column header="Acción" body={accionBody} />
          <Column field="descripcion" header="Descripción" />
          <Column field="created_at" header="Fecha" />
          <Column
            header="Detalle"
            body={(row) => (
              <Button
                label="Ver"
                icon="pi pi-eye"
                size="small"
                outlined
                onClick={() => {
                  setDetalle(row);
                  setVisible(true);
                }}
              />
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        header="Detalle de bitácora"
        visible={visible}
        style={{ width: '70rem' }}
        onHide={() => setVisible(false)}
      >
        {detalle ? (
          <div className="grid">
            <div className="col-12">
              <p><strong>Descripción:</strong> {detalle.descripcion}</p>
              <p><strong>IP:</strong> {detalle.ip_address || '-'}</p>
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2"><strong>Datos antes</strong></label>
              <pre className="surface-100 p-3 border-round overflow-auto">
                {detalle.datos_antes_json || 'Sin datos antes'}
              </pre>
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2"><strong>Datos después</strong></label>
              <pre className="surface-100 p-3 border-round overflow-auto">
                {detalle.datos_despues_json || 'Sin datos después'}
              </pre>
            </div>
          </div>
        ) : null}
      </Dialog>
    </DashboardLayout>
  );
}