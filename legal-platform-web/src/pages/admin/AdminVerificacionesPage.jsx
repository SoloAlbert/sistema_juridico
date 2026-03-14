import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';

export default function AdminVerificacionesPage() {
  const [items, setItems] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visible, setVisible] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const res = await api.get('/admin/verificaciones');
      setItems(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar verificaciones');
    }
  };

  const abrirDetalle = async (idAbogado) => {
    try {
      const res = await api.get(`/admin/verificaciones/${idAbogado}`);
      setDetalle(res.data.data);
      setObservaciones('');
      setVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar detalle');
    }
  };

  const revisarDocumento = async (idDocumento, estatus) => {
    try {
      setError('');
      setSuccess('');

      const res = await api.post(`/admin/verificaciones/documentos/${idDocumento}/revisar`, {
        estatus_revision: estatus,
        observaciones_revision: observaciones
      });

      setSuccess(res.data.message || 'Documento revisado');
      await abrirDetalle(detalle.verificacion.id_abogado);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al revisar documento');
    }
  };

  const tagEstado = (valor) => {
    let severity = 'secondary';
    if (valor === 'verificado') severity = 'success';
    if (valor === 'pendiente') severity = 'warning';
    if (valor === 'observado') severity = 'info';
    if (valor === 'rechazado') severity = 'danger';
    return <Tag value={valor} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <Card title="Revisión de abogados" className="shadow-2">
        <DataTable value={items} paginator rows={10} responsiveLayout="scroll">
          <Column field="id_abogado" header="ID abogado" />
          <Column
            header="Nombre"
            body={(row) => `${row.nombre || ''} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim()}
          />
          <Column field="email" header="Email" />
          <Column header="Identidad" body={(row) => tagEstado(row.estatus_identidad)} />
          <Column header="Cédula" body={(row) => tagEstado(row.estatus_cedula)} />
          <Column header="General" body={(row) => tagEstado(row.estatus_general)} />
          <Column
            header="Badge"
            body={(row) => (
              <Tag value={row.badge_verificado ? 'Verificado' : 'Sin badge'} severity={row.badge_verificado ? 'success' : 'warning'} />
            )}
          />
          <Column
            header="Acción"
            body={(row) => (
              <Button
                label="Revisar"
                icon="pi pi-eye"
                onClick={() => abrirDetalle(row.id_abogado)}
              />
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        header="Detalle de verificación"
        visible={visible}
        style={{ width: '75rem' }}
        onHide={() => setVisible(false)}
      >
        {detalle && (
          <div>
            <div className="mb-3">
              <h3 className="mt-0">
                {detalle.verificacion.nombre} {detalle.verificacion.apellido_paterno} {detalle.verificacion.apellido_materno}
              </h3>
              <p className="mb-1">{detalle.verificacion.email}</p>
            </div>

            <div className="mb-3">
              <label className="block mb-2">Observaciones para esta revisión</label>
              <InputTextarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex flex-column gap-3">
              {detalle.documentos.map((doc) => (
                <div key={doc.id_documento_verificacion} className="surface-50 border-round p-3">
                  <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <div className="font-semibold">{doc.tipo_documento}</div>
                      <small className="text-600">{doc.nombre_original}</small>
                      {doc.observaciones_revision && (
                        <div className="mt-2">{doc.observaciones_revision}</div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap align-items-center">
                      {tagEstado(doc.estatus_revision)}
                      <a href={`http://localhost:3000${doc.ruta_archivo}`} target="_blank" rel="noreferrer">
                        Ver archivo
                      </a>
                      <Button label="Aprobar" size="small" onClick={() => revisarDocumento(doc.id_documento_verificacion, 'aprobado')} />
                      <Button label="Observar" size="small" severity="info" onClick={() => revisarDocumento(doc.id_documento_verificacion, 'observado')} />
                      <Button label="Rechazar" size="small" severity="danger" onClick={() => revisarDocumento(doc.id_documento_verificacion, 'rechazado')} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}