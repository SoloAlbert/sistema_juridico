import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { FileUpload } from 'primereact/fileupload';
import { Dropdown } from 'primereact/dropdown';

export default function MiVerificacionPage() {
  const [data, setData] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('identificacion_oficial');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileRef = useRef(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const res = await api.get('/abogado/verificacion/mi-verificacion');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar verificación');
    }
  };

  const subirArchivo = async (event) => {
    try {
      setError('');
      setSuccess('');

      const archivo = event.files?.[0];
      if (!archivo) return;

      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('tipo_documento', tipoDocumento);

      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3000/api/abogado/verificacion/mi-verificacion/documentos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Error al subir archivo');
      }

      setSuccess(json.message || 'Documento subido correctamente');
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al subir documento');
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
      <AbogadoMenu />

      <div className="mb-4">
        <h1 className="m-0">Mi verificación</h1>
        <p className="text-700">Sube tus documentos para validar tu perfil profesional.</p>
      </div>

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {data && (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <Card title="Estado general" className="shadow-2 mb-4">
              <div className="flex flex-column gap-3">
                <div className="flex justify-content-between align-items-center">
                  <span>Identidad</span>
                  {tagEstado(data.verificacion.estatus_identidad)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Cédula</span>
                  {tagEstado(data.verificacion.estatus_cedula)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>General</span>
                  {tagEstado(data.verificacion.estatus_general)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Badge</span>
                  <Tag value={data.verificacion.badge_verificado ? 'Sí' : 'No'} severity={data.verificacion.badge_verificado ? 'success' : 'warning'} />
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Completado</span>
                  <Tag value={`${Number(data.verificacion.porcentaje_completado || 0).toFixed(0)}%`} severity="info" />
                </div>
              </div>
            </Card>

            <Card title="Subir documento" className="shadow-2">
              <div className="mb-3">
                <label className="block mb-2">Tipo de documento</label>
                <Dropdown
                  value={tipoDocumento}
                  options={[
                    { label: 'Identificación oficial', value: 'identificacion_oficial' },
                    { label: 'Cédula profesional', value: 'cedula_profesional' },
                    { label: 'Comprobante de domicilio', value: 'comprobante_domicilio' },
                    { label: 'Constancia fiscal', value: 'constancia_fiscal' },
                    { label: 'Selfie validación', value: 'selfie_validacion' },
                    { label: 'Documento despacho', value: 'documento_despacho' },
                    { label: 'Otro', value: 'otro' }
                  ]}
                  onChange={(e) => setTipoDocumento(e.value)}
                  className="w-full"
                />
              </div>

              <FileUpload
                ref={fileRef}
                mode="basic"
                name="archivo"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                customUpload
                auto={false}
                chooseLabel="Seleccionar archivo"
                uploadHandler={subirArchivo}
              />
            </Card>
          </div>

          <div className="col-12 lg:col-8">
            <Card title="Documentos enviados" className="shadow-2">
              {!data.documentos?.length ? (
                <p>No has enviado documentos todavía.</p>
              ) : (
                <div className="flex flex-column gap-3">
                  {data.documentos.map((doc) => (
                    <div key={doc.id_documento_verificacion} className="surface-50 border-round p-3">
                      <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <div className="font-semibold">{doc.tipo_documento}</div>
                          <small className="text-600">{doc.nombre_original}</small>
                          {doc.observaciones_revision && (
                            <div className="mt-2 text-700">{doc.observaciones_revision}</div>
                          )}
                        </div>

                        <div className="flex flex-column align-items-end gap-2">
                          {tagEstado(doc.estatus_revision)}
                          <a href={`http://localhost:3000${doc.ruta_archivo}`} target="_blank" rel="noreferrer">
                            Ver archivo
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}