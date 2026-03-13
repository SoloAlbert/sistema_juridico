import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';

export default function DetallePlantillaPage() {
  const { id } = useParams();

  const [plantilla, setPlantilla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingComprar, setLoadingComprar] = useState(false);
  const [loadingGenerar, setLoadingGenerar] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [comprada, setComprada] = useState(false);

  const [tituloDocumento, setTituloDocumento] = useState('');
  const [formatoSalida, setFormatoSalida] = useState('pdf');
  const [variables, setVariables] = useState({});

  const [visiblePreview, setVisiblePreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    cargarTodo();
  }, [id]);

  const cargarTodo = async () => {
    await Promise.all([obtenerDetalle(), verificarCompra()]);
  };

  const obtenerDetalle = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/plantillas/${id}`);
      setPlantilla(data.data);

      const iniciales = {};
      (data.data.variables || []).forEach((v) => {
        if (v.tipo_campo === 'checkbox') {
          iniciales[v.nombre_variable] = false;
        } else {
          iniciales[v.nombre_variable] = null;
        }
      });
      setVariables(iniciales);

      if (!tituloDocumento) {
        setTituloDocumento(data.data.titulo);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const verificarCompra = async () => {
    try {
      const { data } = await api.get('/plantillas/mis-compras');
      const existe = (data.data || []).some(
        (item) => Number(item.id_plantilla) === Number(id) && item.estatus_pago === 'pagado'
      );
      setComprada(existe);
    } catch (err) {
      console.error(err);
    }
  };

  const comprarPlantilla = async () => {
    try {
      setLoadingComprar(true);
      setError('');
      setSuccess('');

      const { data } = await api.post(`/plantillas/${id}/comprar`);
      setSuccess(data.message || 'Plantilla comprada correctamente');
      setComprada(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al comprar plantilla');
    } finally {
      setLoadingComprar(false);
    }
  };

  const generarDocumento = async (e) => {
    e.preventDefault();

    try {
      setLoadingGenerar(true);
      setError('');
      setSuccess('');

      const payload = {
        titulo_documento: tituloDocumento,
        datos_capturados_json: variables,
        formato_salida: formatoSalida
      };

      const { data } = await api.post(`/plantillas/${id}/generar`, payload);

      setSuccess(`${data.message || 'Documento generado'} | Ruta: ${data.data.ruta_archivo_generado}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar documento');
    } finally {
      setLoadingGenerar(false);
    }
  };

  const verPreview = async () => {
    try {
      setLoadingPreview(true);
      setError('');
      setSuccess('');

      const payload = {
        datos_capturados_json: variables
      };

      const { data } = await api.post(`/plantillas/${id}/preview`, payload);

      setPreviewHtml(data.data.html || '');
      setVisiblePreview(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const setVariable = (name, value) => {
    setVariables((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const obtenerOpcionesSelect = (campo) => {
    if (!campo.configuracion_json) return [];

    let config = campo.configuracion_json;

    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch {
        return [];
      }
    }

    if (!config || !Array.isArray(config.options)) {
      return [];
    }

    return config.options.map((item) => ({
      label: item.label,
      value: item.value
    }));
  };

  const renderCampo = (campo) => {
    const valor = variables[campo.nombre_variable];

    switch (campo.tipo_campo) {
      case 'textarea':
        return (
          <InputTextarea
            value={valor || ''}
            onChange={(e) => setVariable(campo.nombre_variable, e.target.value)}
            rows={4}
            className="w-full"
          />
        );

      case 'fecha':
        return (
          <Calendar
            value={valor || null}
            onChange={(e) => setVariable(campo.nombre_variable, e.value)}
            className="w-full"
            dateFormat="dd/mm/yy"
            showIcon
          />
        );

      case 'checkbox':
        return (
          <div className="flex align-items-center h-full">
            <Checkbox
              checked={!!valor}
              onChange={(e) => setVariable(campo.nombre_variable, e.checked)}
            />
          </div>
        );

      case 'select': {
        const opciones = obtenerOpcionesSelect(campo);

        return (
          <Dropdown
            value={valor || null}
            options={opciones}
            onChange={(e) => setVariable(campo.nombre_variable, e.value)}
            className="w-full"
            placeholder="Selecciona una opción"
            showClear
          />
        );
      }

      case 'numero':
        return (
          <InputText
            value={valor || ''}
            onChange={(e) => setVariable(campo.nombre_variable, e.target.value)}
            className="w-full"
            keyfilter="num"
          />
        );

      default:
        return (
          <InputText
            value={valor || ''}
            onChange={(e) => setVariable(campo.nombre_variable, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading ? (
        <Card><p>Cargando plantilla...</p></Card>
      ) : plantilla ? (
        <>
          <div className="grid">
            <div className="col-12 lg:col-5">
              <Card title={plantilla.titulo} className="shadow-2 mb-4">
                <div className="mb-3">
                  <Tag value={plantilla.tipo_archivo_salida} severity="info" className="mr-2" />
                  <Tag value={plantilla.categoria} severity="success" />
                </div>

                <p><strong>Especialidad:</strong> {plantilla.especialidad}</p>
                <p><strong>Precio:</strong> ${Number(plantilla.precio || 0).toFixed(2)} {plantilla.moneda}</p>
                <p><strong>Versión:</strong> {plantilla.version_actual}</p>
                <p><strong>Descripción corta:</strong> {plantilla.descripcion_corta || '-'}</p>

                <Divider />

                <p><strong>Descripción detallada:</strong></p>
                <p>{plantilla.descripcion_larga || '-'}</p>

                <Divider />

                {!comprada ? (
                  <Button
                    label={loadingComprar ? 'Comprando...' : 'Comprar plantilla'}
                    icon="pi pi-shopping-cart"
                    loading={loadingComprar}
                    onClick={comprarPlantilla}
                  />
                ) : (
                  <Tag value="Ya comprada" severity="success" />
                )}
              </Card>
            </div>

            <div className="col-12 lg:col-7">
              <Card title="Generar documento" className="shadow-2">
                {!comprada ? (
                  <p>Compra la plantilla para poder generar documentos.</p>
                ) : (
                  <form onSubmit={generarDocumento} className="grid">
                    <div className="col-12 md:col-8">
                      <label className="block mb-2">Título del documento</label>
                      <InputText
                        value={tituloDocumento}
                        onChange={(e) => setTituloDocumento(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-4">
                      <label className="block mb-2">Formato de salida</label>
                      <Dropdown
                        value={formatoSalida}
                        options={[
                          { label: 'PDF', value: 'pdf' },
                          { label: 'DOCX', value: 'docx' }
                        ]}
                        onChange={(e) => setFormatoSalida(e.value)}
                        className="w-full"
                      />
                    </div>

                    {(plantilla.variables || []).map((campo) => (
                      <div key={campo.id_variable} className="col-12 md:col-6">
                        <label className="block mb-2">
                          {campo.label_campo} {campo.requerido ? '*' : ''}
                        </label>
                        {renderCampo(campo)}

                        <div className="mt-2">
                          {campo.ayuda && <small className="text-600 block">{campo.ayuda}</small>}

                          {campo.tipo_campo === 'select' && obtenerOpcionesSelect(campo).length === 0 && (
                            <small className="text-orange-500 block">
                              Este campo select no tiene opciones válidas en configuracion_json.
                            </small>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="col-12 flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        label={loadingPreview ? 'Generando preview...' : 'Ver preview'}
                        icon="pi pi-eye"
                        outlined
                        loading={loadingPreview}
                        onClick={verPreview}
                      />

                      <Button
                        type="submit"
                        label={loadingGenerar ? 'Generando...' : 'Generar documento'}
                        icon="pi pi-file"
                        loading={loadingGenerar}
                      />
                    </div>
                  </form>
                )}
              </Card>
            </div>
          </div>

          <Dialog
            header="Vista previa del documento"
            visible={visiblePreview}
            style={{ width: '90vw', maxWidth: '1100px' }}
            onHide={() => setVisiblePreview(false)}
            maximizable
          >
            {previewHtml ? (
              <iframe
                title="preview-documento"
                srcDoc={previewHtml}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <p>No se pudo generar la vista previa.</p>
            )}
          </Dialog>
        </>
      ) : null}
    </DashboardLayout>
  );
}