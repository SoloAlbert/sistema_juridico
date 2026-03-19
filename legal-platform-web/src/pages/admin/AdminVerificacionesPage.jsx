import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';
import { toAbsoluteUrl } from '../../config/runtime';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

const SEP_CEDULA_URL = 'https://www.gob.mx/cedulaprofesional';

function esPdf(doc) {
  const mime = String(doc?.mime_type || '').toLowerCase();
  const ruta = String(doc?.ruta_archivo || '').toLowerCase();
  return mime.includes('pdf') || ruta.endsWith('.pdf');
}

export default function AdminVerificacionesPage() {
  const [items, setItems] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [visible, setVisible] = useState(false);
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [visibleDocumento, setVisibleDocumento] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [cedulaForm, setCedulaForm] = useState({
    cedula_validacion_estatus: 'sin_validar',
    cedula_validacion_fuente: 'SEP / Registro Nacional de Profesionistas',
    cedula_validacion_nombre: '',
    cedula_validacion_institucion: '',
    cedula_validacion_carrera: '',
    cedula_validacion_anio: '',
    cedula_validacion_detalle: ''
  });
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
      const verificacion = res.data.data?.verificacion || {};
      setCedulaForm({
        cedula_validacion_estatus: verificacion.cedula_validacion_estatus || 'sin_validar',
        cedula_validacion_fuente: verificacion.cedula_validacion_fuente || 'SEP / Registro Nacional de Profesionistas',
        cedula_validacion_nombre: verificacion.cedula_validacion_nombre || '',
        cedula_validacion_institucion: verificacion.cedula_validacion_institucion || '',
        cedula_validacion_carrera: verificacion.cedula_validacion_carrera || '',
        cedula_validacion_anio: verificacion.cedula_validacion_anio || '',
        cedula_validacion_detalle: verificacion.cedula_validacion_detalle || ''
      });
      setVisible(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar detalle');
    }
  };

  const abrirDocumento = (doc) => {
    setDocumentoActivo(doc);
    setObservaciones(doc?.observaciones_revision || '');
    setVisibleDocumento(true);
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
      setVisibleDocumento(false);
      await abrirDetalle(detalle.verificacion.id_abogado);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al revisar documento');
    }
  };

  const guardarValidacionCedula = async () => {
    try {
      setError('');
      setSuccess('');

      const res = await api.post(`/admin/verificaciones/${detalle.verificacion.id_abogado}/cedula-validacion`, cedulaForm);
      setSuccess(res.data.message || 'Validacion de cedula guardada');
      await abrirDetalle(detalle.verificacion.id_abogado);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar validacion de cedula');
    }
  };

  const abrirConsultaSep = () => {
    window.open(SEP_CEDULA_URL, '_blank', 'noopener,noreferrer');
  };

  const copiarCedula = async () => {
    try {
      const cedula = detalle?.verificacion?.numero_cedula_reportada || '';
      if (!cedula) return;
      await navigator.clipboard.writeText(cedula);
      setSuccess('Cedula copiada para consulta en SEP');
    } catch {
      setError('No fue posible copiar la cedula');
    }
  };

  const tagEstado = (valor) => {
    let severity = 'secondary';
    if (valor === 'verificado' || valor === 'aprobado') severity = 'success';
    if (valor === 'valida' || valor === 'coincide') severity = 'success';
    if (valor === 'pendiente') severity = 'warning';
    if (valor === 'observado') severity = 'info';
    if (valor === 'rechazado') severity = 'danger';
    if (valor === 'inconsistente' || valor === 'no_encontrada') severity = 'danger';
    return <Tag value={valor} severity={severity} />;
  };

  const tagBooleano = (valor) => {
    if (valor === null || valor === undefined) return <Tag value="Sin revisar" severity="secondary" />;
    return <Tag value={valor ? 'Coincide' : 'No coincide'} severity={valor ? 'success' : 'danger'} />;
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <Card title="Revision de abogados" className="shadow-2">
        <DataTable value={items} paginator rows={10} responsiveLayout="scroll">
          <Column field="id_abogado" header="ID abogado" />
          <Column
            header="Nombre"
            body={(row) => `${row.nombre || ''} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim()}
          />
          <Column field="email" header="Email" />
          <Column header="Identidad" body={(row) => tagEstado(row.estatus_identidad)} />
          <Column header="Cedula" body={(row) => tagEstado(row.estatus_cedula)} />
          <Column header="Consistencia" body={(row) => tagEstado(row.validacion_datos_estatus)} />
          <Column header="Cedula oficial" body={(row) => tagEstado(row.cedula_validacion_estatus)} />
          <Column header="General" body={(row) => tagEstado(row.estatus_general)} />
          <Column
            header="Badge"
            body={(row) => (
              <Tag value={row.badge_verificado ? 'Verificado' : 'Sin badge'} severity={row.badge_verificado ? 'success' : 'warning'} />
            )}
          />
          <Column
            header="Accion"
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
        header="Detalle de verificacion"
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

            <div className="grid mb-4">
              <div className="col-12 lg:col-6">
                <Card title="Consistencia automatica" className="shadow-1">
                  <div className="flex flex-column gap-3">
                    <div className="flex justify-content-between align-items-center">
                      <span>Estatus</span>
                      {tagEstado(detalle.verificacion.validacion_datos_estatus)}
                    </div>
                    <div className="flex justify-content-between align-items-center">
                      <span>Nombre</span>
                      {tagBooleano(detalle.verificacion.coincidencia_nombre)}
                    </div>
                    <div className="flex justify-content-between align-items-center">
                      <span>Apellidos</span>
                      {tagBooleano(detalle.verificacion.coincidencia_apellidos)}
                    </div>
                    <div className="flex justify-content-between align-items-center">
                      <span>Cedula vs perfil</span>
                      {tagBooleano(detalle.verificacion.coincidencia_cedula)}
                    </div>
                    <div className="text-700 line-height-3">
                      {detalle.verificacion.validacion_datos_detalle || 'Sin evaluacion automatica.'}
                    </div>
                    <div className="text-sm text-600">
                      Capturado: {detalle.verificacion.datos_nombre || '-'} {detalle.verificacion.datos_apellido_paterno || ''} {detalle.verificacion.datos_apellido_materno || ''}
                    </div>
                    <div className="text-sm text-600">CURP: {detalle.verificacion.curp || '-'}</div>
                    <div className="text-sm text-600">Clave elector: {detalle.verificacion.clave_elector || '-'}</div>
                    <div className="text-sm text-600">Cedula reportada: {detalle.verificacion.numero_cedula_reportada || '-'}</div>
                  </div>
                </Card>
              </div>

              <div className="col-12 lg:col-6">
                <Card title="Validacion oficial de cedula" className="shadow-1">
                  <div className="mb-3 text-700 line-height-3">
                    <br />
                    1. Copia la cédula reportada.
                    <br />
                    2. Abre el portal oficial de SEP.
                    <br />
                    3. Consulta la cédula y compara nombre, institución y carrera.
                    <br />
                    4. Guarda aquí el resultado oficial.
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    <Button label="Abrir portal SEP" icon="pi pi-external-link" outlined onClick={abrirConsultaSep} />
                    <Button
                      label="Copiar cedula reportada"
                      icon="pi pi-copy"
                      outlined
                      onClick={copiarCedula}
                      disabled={!detalle.verificacion.numero_cedula_reportada}
                    />
                  </div>

                  <div className="mb-3 text-sm text-600">
                    Cedula reportada por el abogado: {detalle.verificacion.numero_cedula_reportada || '-'}
                  </div>

                  <div className="grid formgrid">
                    <div className="col-12">
                      <label className="block mb-2">Estatus</label>
                      <Dropdown
                        value={cedulaForm.cedula_validacion_estatus}
                        options={[
                          { label: 'Sin validar', value: 'sin_validar' },
                          { label: 'Pendiente', value: 'pendiente' },
                          { label: 'Valida', value: 'valida' },
                          { label: 'Inconsistente', value: 'inconsistente' },
                          { label: 'No encontrada', value: 'no_encontrada' }
                        ]}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_estatus: e.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-12">
                      <label className="block mb-2">Fuente</label>
                      <InputText
                        value={cedulaForm.cedula_validacion_fuente}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_fuente: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-12">
                      <label className="block mb-2">Nombre encontrado</label>
                      <InputText
                        value={cedulaForm.cedula_validacion_nombre}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_nombre: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Institucion</label>
                      <InputText
                        value={cedulaForm.cedula_validacion_institucion}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_institucion: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Carrera</label>
                      <InputText
                        value={cedulaForm.cedula_validacion_carrera}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_carrera: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-12 md:col-4">
                      <label className="block mb-2">Año</label>
                      <InputText
                        value={cedulaForm.cedula_validacion_anio}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_anio: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="col-12">
                      <label className="block mb-2">Detalle</label>
                      <InputTextarea
                        value={cedulaForm.cedula_validacion_detalle}
                        onChange={(e) => setCedulaForm((prev) => ({ ...prev, cedula_validacion_detalle: e.target.value }))}
                        rows={4}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Button label="Guardar validacion de cedula" className="mt-3" onClick={guardarValidacionCedula} />
                </Card>
              </div>
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
                      <Button
                        label="Aprobar"
                        size="small"
                        onClick={() => revisarDocumento(doc.id_documento_verificacion, 'aprobado')}
                      />
                      <Button
                        label="Observar"
                        size="small"
                        severity="info"
                        onClick={() => abrirDocumento(doc)}
                      />
                      <Button
                        label="Rechazar"
                        size="small"
                        severity="danger"
                        onClick={() => revisarDocumento(doc.id_documento_verificacion, 'rechazado')}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        header={documentoActivo ? `Documento: ${documentoActivo.nombre_original}` : 'Documento'}
        visible={visibleDocumento}
        style={{ width: '80rem' }}
        onHide={() => setVisibleDocumento(false)}
      >
        {documentoActivo && (
          <div className="grid">
            <div className="col-12 lg:col-8">
              {esPdf(documentoActivo) ? (
                <iframe
                  src={toAbsoluteUrl(documentoActivo.ruta_archivo)}
                  title="visor-documento-verificacion"
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (
                <img
                  src={toAbsoluteUrl(documentoActivo.ruta_archivo)}
                  alt={documentoActivo.nombre_original}
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              )}
            </div>

            <div className="col-12 lg:col-4">
              <div className="mb-3">
                <div className="font-semibold mb-2">{documentoActivo.tipo_documento}</div>
                <small className="text-600">{documentoActivo.nombre_original}</small>
              </div>

              <div className="mb-3">
                <label className="block mb-2">Observaciones para esta revision</label>
                <InputTextarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={5}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  label="Aprobar"
                  onClick={() => revisarDocumento(documentoActivo.id_documento_verificacion, 'aprobado')}
                />
                <Button
                  label="Marcar observado"
                  severity="info"
                  onClick={() => revisarDocumento(documentoActivo.id_documento_verificacion, 'observado')}
                />
                <Button
                  label="Rechazar"
                  severity="danger"
                  onClick={() => revisarDocumento(documentoActivo.id_documento_verificacion, 'rechazado')}
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
