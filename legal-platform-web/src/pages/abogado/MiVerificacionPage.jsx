import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';
import { API_BASE_URL, toAbsoluteUrl } from '../../config/runtime';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { FileUpload } from 'primereact/fileupload';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

export default function MiVerificacionPage() {
  const [data, setData] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState('identificacion_oficial');
  const [datosForm, setDatosForm] = useState({
    datos_nombre: '',
    datos_apellido_paterno: '',
    datos_apellido_materno: '',
    curp: '',
    clave_elector: '',
    numero_cedula_reportada: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingDatos, setSavingDatos] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const res = await api.get('/abogado/verificacion/mi-verificacion');
      setData(res.data.data);
      setDatosForm({
        datos_nombre: res.data.data?.verificacion?.datos_nombre || '',
        datos_apellido_paterno: res.data.data?.verificacion?.datos_apellido_paterno || '',
        datos_apellido_materno: res.data.data?.verificacion?.datos_apellido_materno || '',
        curp: res.data.data?.verificacion?.curp || '',
        clave_elector: res.data.data?.verificacion?.clave_elector || '',
        numero_cedula_reportada: res.data.data?.verificacion?.numero_cedula_reportada || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar verificacion');
    }
  };

  const guardarDatos = async () => {
    try {
      setSavingDatos(true);
      setError('');
      setSuccess('');

      const res = await api.put('/abogado/verificacion/mi-verificacion/datos', datosForm);
      setSuccess(res.data.message || 'Datos de validacion guardados');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar datos de validacion');
    } finally {
      setSavingDatos(false);
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

      const response = await fetch(`${API_BASE_URL}/abogado/verificacion/mi-verificacion/documentos`, {
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
      fileRef.current?.clear();
      await cargar();
    } catch (err) {
      setError(err.message || 'Error al subir documento');
      fileRef.current?.clear();
    }
  };

  const tagEstado = (valor) => {
    let severity = 'secondary';
    if (valor === 'verificado') severity = 'success';
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
      <AbogadoMenu />

      <div className="mb-4">
        <h1 className="m-0">Mi verificacion</h1>
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
                  <span>Cedula</span>
                  {tagEstado(data.verificacion.estatus_cedula)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>General</span>
                  {tagEstado(data.verificacion.estatus_general)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Badge</span>
                  <Tag value={data.verificacion.badge_verificado ? 'Si' : 'No'} severity={data.verificacion.badge_verificado ? 'success' : 'warning'} />
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Completado</span>
                  <Tag value={`${Number(data.verificacion.porcentaje_completado || 0).toFixed(0)}%`} severity="info" />
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Consistencia datos</span>
                  {tagEstado(data.verificacion.validacion_datos_estatus)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Validacion cedula</span>
                  {tagEstado(data.verificacion.cedula_validacion_estatus)}
                </div>
              </div>
            </Card>

            <Card title="Datos para validacion automatica" className="shadow-2 mb-4">
              <div className="mb-3 text-700 line-height-3">
              Sirve para comparar lo que capturas contra tu perfil y dejar listo lo que el admin revisara con la SEP.
              </div>

              <div className="grid formgrid">
                <div className="col-12">
                  <label className="block mb-2">Nombre(s) como aparece en identificacion</label>
                  <InputText
                    value={datosForm.datos_nombre}
                    onChange={(e) => setDatosForm((prev) => ({ ...prev, datos_nombre: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block mb-2">Apellido paterno</label>
                  <InputText
                    value={datosForm.datos_apellido_paterno}
                    onChange={(e) => setDatosForm((prev) => ({ ...prev, datos_apellido_paterno: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block mb-2">Apellido materno</label>
                  <InputText
                    value={datosForm.datos_apellido_materno}
                    onChange={(e) => setDatosForm((prev) => ({ ...prev, datos_apellido_materno: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block mb-2">CURP</label>
                  <InputText
                    value={datosForm.curp}
                    onChange={(e) => setDatosForm((prev) => ({ ...prev, curp: e.target.value.toUpperCase() }))}
                    className="w-full"
                    maxLength={18}
                  />
                </div>
                <div className="col-12 md:col-6">
                  <label className="block mb-2">Clave de elector</label>
                  <InputText
                    value={datosForm.clave_elector}
                    onChange={(e) => setDatosForm((prev) => ({ ...prev, clave_elector: e.target.value.toUpperCase() }))}
                    className="w-full"
                  />
                </div>
                <div className="col-12">
                  <label className="block mb-2">Numero de cedula reportada</label>
                  <InputText
                    value={datosForm.numero_cedula_reportada}
                    onChange={(e) => setDatosForm((prev) => ({ ...prev, numero_cedula_reportada: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-3 text-700 line-height-3">
                {data.verificacion.validacion_datos_detalle || 'Aun no hay evaluacion.'}
              </div>

              <div className="flex flex-column gap-2 mt-3">
                <div className="flex justify-content-between align-items-center">
                  <span>Nombre vs perfil</span>
                  {tagBooleano(data.verificacion.coincidencia_nombre)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Apellidos vs perfil</span>
                  {tagBooleano(data.verificacion.coincidencia_apellidos)}
                </div>
                <div className="flex justify-content-between align-items-center">
                  <span>Cedula capturada vs perfil</span>
                  {tagBooleano(data.verificacion.coincidencia_cedula)}
                </div>
              </div>

              <Button
                label={savingDatos ? 'Guardando...' : 'Guardar datos de validacion'}
                className="mt-3"
                onClick={guardarDatos}
                disabled={savingDatos}
              />
            </Card>

            <Card title="Subir documento" className="shadow-2">
              <div className="mb-3">
                <label className="block mb-2">Tipo de documento</label>
                <Dropdown
                  value={tipoDocumento}
                  options={[
                    { label: 'Identificacion oficial', value: 'identificacion_oficial' },
                    { label: 'Cedula profesional', value: 'cedula_profesional' },
                    { label: 'Comprobante de domicilio', value: 'comprobante_domicilio' },
                    { label: 'Constancia fiscal', value: 'constancia_fiscal' },
                    { label: 'Selfie validacion', value: 'selfie_validacion' },
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
                <p>No has enviado documentos todavia.</p>
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
                          <a href={toAbsoluteUrl(doc.ruta_archivo)} target="_blank" rel="noreferrer">
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
