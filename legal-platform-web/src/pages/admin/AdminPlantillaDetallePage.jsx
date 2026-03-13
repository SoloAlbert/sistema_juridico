import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { FileUpload } from 'primereact/fileupload';

import { Editor } from 'primereact/editor';
import { Divider } from 'primereact/divider';


export default function AdminPlantillaDetallePage() {
  const { id } = useParams();

  const [plantilla, setPlantilla] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlantilla, setSavingPlantilla] = useState(false);
  const [savingVariables, setSavingVariables] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formPlantilla, setFormPlantilla] = useState(null);
  const [variables, setVariables] = useState([]);
  const [formVersion, setFormVersion] = useState({
  numero_version: '',
  contenido_base: '',
  ruta_archivo_base: '',
  html_preview_base: '',
  notas_cambios: '',
  es_actual: true
});
const [estructuraBloques, setEstructuraBloques] = useState([]);
  const [bloquesHtml, setBloquesHtml] = useState([]);

const [plantillasMaestras, setPlantillasMaestras] = useState([]);
const [idMaestraSeleccionada, setIdMaestraSeleccionada] = useState(null);

const [tiposDocumento, setTiposDocumento] = useState([]);
const [idTipoDocumentoSugerido, setIdTipoDocumentoSugerido] = useState(null);

  useEffect(() => {
    cargarTodo();
  }, [id]);

  const insertarPlaceholderEnPreview = (placeholder) => {
  setFormVersion((prev) => ({
    ...prev,
    html_preview_base: `${prev.html_preview_base || ''}${prev.html_preview_base ? '\n' : ''}{{${placeholder}}}`
  }));
};

const placeholdersSugeridos = variables
  .map((item) => item.nombre_variable)
  .filter(Boolean);

const cargarPlantillaMaestraEnBuilder = () => {
  const encontrada = plantillasMaestras.find(
    (item) => Number(item.id_plantilla_maestra) === Number(idMaestraSeleccionada)
  );

  if (!encontrada) return;

  let estructura = [];
  try {
    estructura =
      typeof encontrada.estructura_bloques_json === 'string'
        ? JSON.parse(encontrada.estructura_bloques_json)
        : encontrada.estructura_bloques_json || [];
  } catch {
    estructura = [];
  }

  setEstructuraBloques(Array.isArray(estructura) ? estructura : []);
};

  const safeJsonParse = (valor) => {
    try {
      return JSON.parse(valor);
    } catch {
      return null;
    }
  };

  const cargarTodo = async () => {
    try {
      setLoading(true);

      const [catalogosRes, plantillaRes, bloquesRes, maestrasRes, tiposRes] = await Promise.all([
  api.get('/admin/plantillas/catalogos'),
  api.get(`/admin/plantillas/${id}`),
  api.get('/admin/bloques-html'),
  api.get('/admin/plantillas-maestras'),
  api.get('/admin/tipos-documento')
]);

setTiposDocumento(
  (tiposRes.data.data || []).filter((item) => item.activo).map((item) => ({
    label: item.nombre,
    value: item.id_tipo_documento
  }))
);

setBloquesHtml((bloquesRes.data.data || []).filter((item) => item.activo));
setPlantillasMaestras((maestrasRes.data.data || []).filter((item) => item.activo));

      setCategorias(
        (catalogosRes.data.data.categorias || []).map((item) => ({
          label: item.nombre,
          value: item.id_categoria_plantilla
        }))
      );

      setEspecialidades(
        (catalogosRes.data.data.especialidades || []).map((item) => ({
          label: item.nombre,
          value: item.id_especialidad
        }))
      );

      const data = plantillaRes.data.data;
      setPlantilla(data);

      setFormPlantilla({
        id_tipo_documento: data.id_tipo_documento || null,
        id_categoria_plantilla: data.id_categoria_plantilla,
        id_especialidad: data.id_especialidad,
        titulo: data.titulo,
        slug: data.slug,
        descripcion_corta: data.descripcion_corta || '',
        descripcion_larga: data.descripcion_larga || '',
        precio: Number(data.precio || 0),
        moneda: data.moneda || 'MXN',
        version_actual: data.version_actual || '1.0',
        tipo_archivo_salida: data.tipo_archivo_salida || 'pdf',
        requiere_revision_manual: !!data.requiere_revision_manual,
        activo: !!data.activo
      });

      setVariables(
        (data.variables || []).map((item) => ({
          nombre_variable: item.nombre_variable || '',
          label_campo: item.label_campo || '',
          tipo_campo: item.tipo_campo || 'texto',
          placeholder: item.placeholder || '',
          ayuda: item.ayuda || '',
          requerido: !!item.requerido,
          orden: Number(item.orden || 0),
          configuracion_json: item.configuracion_json ? safeJsonParse(item.configuracion_json) : null
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar plantilla admin');
    } finally {
      setLoading(false);
    }
  };
  
  const versionActual = (data.versiones || []).find((item) => item.es_actual);

if (versionActual?.estructura_bloques_json) {
  try {
    const estructura =
      typeof versionActual.estructura_bloques_json === 'string'
        ? JSON.parse(versionActual.estructura_bloques_json)
        : versionActual.estructura_bloques_json;

    setEstructuraBloques(Array.isArray(estructura) ? estructura : []);
  } catch {
    setEstructuraBloques([]);
  }
} else {
  setEstructuraBloques([]);
}

  const insertarBloqueHtml = (htmlBloque) => {
  setFormVersion((prev) => ({
    ...prev,
    html_preview_base: `${prev.html_preview_base || ''}\n${htmlBloque || ''}`.trim()
  }));
};

  const setFormValue = (name, value) => {
    setFormPlantilla((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarPlantilla = async () => {
    try {
      setSavingPlantilla(true);
      setError('');
      setSuccess('');

      const { data } = await api.put(`/admin/plantillas/${id}`, formPlantilla);
      setSuccess(data.message || 'Plantilla actualizada');
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar plantilla');
    } finally {
      setSavingPlantilla(false);
    }
  };

  const aplicarSugerenciasPorTipo = async () => {
    try {
      setError('');
      setSuccess('');

      const idTipo = formPlantilla?.id_tipo_documento;
      if (!idTipo) {
        setError('Primero selecciona un tipo de documento');
        return;
      }

      const { data } = await api.get(`/admin/tipos-documento/${idTipo}/sugerencia`);
      const sugerencia = data.data?.sugerencia;

      if (!sugerencia) {
        setError('Este tipo de documento todavia no tiene sugerencias configuradas');
        return;
      }

      let bloques = [];
      let variablesSugeridas = [];

      try {
        bloques = sugerencia.bloques_sugeridos_json
          ? JSON.parse(sugerencia.bloques_sugeridos_json)
          : [];
      } catch {
        bloques = [];
      }

      try {
        variablesSugeridas = sugerencia.variables_sugeridas_json
          ? JSON.parse(sugerencia.variables_sugeridas_json)
          : [];
      } catch {
        variablesSugeridas = [];
      }

      if (Array.isArray(bloques) && bloques.length > 0) {
        setEstructuraBloques(bloques);
      }

      if (Array.isArray(variablesSugeridas) && variablesSugeridas.length > 0) {
        setVariables(variablesSugeridas);
      }

      if (sugerencia.id_plantilla_maestra) {
        setIdMaestraSeleccionada(sugerencia.id_plantilla_maestra);
      }

      setSuccess('Sugerencias aplicadas correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aplicar sugerencias');
    }
  };

  const agregarVariable = () => {
    setVariables((prev) => [
      ...prev,
      {
        nombre_variable: '',
        label_campo: '',
        tipo_campo: 'texto',
        placeholder: '',
        ayuda: '',
        requerido: true,
        orden: prev.length + 1,
        configuracion_json: null
      }
    ]);
  };

  const actualizarVariable = (index, field, value) => {
    setVariables((prev) => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        [field]: value
      };
      return copia;
    });
  };

  const quitarVariable = (index) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const guardarVariables = async () => {
  try {
    setSavingVariables(true);
    setError('');
    setSuccess('');

    const payload = variables.map((item, index) => {
      let configNormalizada = null;

      if (item.configuracion_json) {
        if (typeof item.configuracion_json === 'string') {
          try {
            configNormalizada = JSON.parse(item.configuracion_json);
          } catch {
            throw new Error(
              `La configuración JSON de la variable "${item.nombre_variable || index + 1}" no es válida`
            );
          }
        } else {
          configNormalizada = item.configuracion_json;
        }
      }

      return {
        ...item,
        orden: Number(item.orden || index + 1),
        configuracion_json: configNormalizada
      };
    });

    const { data } = await api.post(`/admin/plantillas/${id}/variables`, {
      variables: payload
    });

    setSuccess(data.message || 'Variables guardadas');
    await cargarTodo();
  } catch (err) {
    setError(err.response?.data?.message || err.message || 'Error al guardar variables');
  } finally {
    setSavingVariables(false);
  }
};

  const guardarVersion = async () => {
    try {
      setSavingVersion(true);
      setError('');
      setSuccess('');

    const { data } = await api.post(`/admin/plantillas/${id}/versiones`, {
      ...formVersion,
      estructura_bloques_json: estructuraBloques
    });
      setSuccess(data.message || 'Versión creada');
      setFormVersion({
  numero_version: '',
  contenido_base: '',
  ruta_archivo_base: '',
  html_preview_base: '',
  notas_cambios: '',
  es_actual: true
});
      setEstructuraBloques([]);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear versión');
    } finally {
      setSavingVersion(false);
    }
  };

  const subirArchivoVersion = async (idVersion, file) => {
    try {
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('archivo', file);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:3003/api/admin/plantillas/${id}/versiones/${idVersion}/upload-docx`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al subir archivo');
      }

      setSuccess(data.message || 'Archivo subido correctamente');
      await cargarTodo();
    } catch (err) {
      setError(err.message || 'Error al subir archivo');
    }
  };

  const agregarBloqueAEstructura = (bloque) => {
  setEstructuraBloques((prev) => [
    ...prev,
    {
      tipo: 'bloque',
      id_bloque: bloque.id_bloque,
      nombre: bloque.nombre,
      html_base: bloque.html_base
    }
  ]);
};

const agregarHtmlLibreAEstructura = () => {
  setEstructuraBloques((prev) => [
    ...prev,
    {
      tipo: 'html_libre',
      nombre: 'Bloque libre',
      html_base: '<p>Nuevo bloque libre...</p>'
    }
  ]);
};

const moverBloque = (index, direccion) => {
  setEstructuraBloques((prev) => {
    const copia = [...prev];
    const nuevoIndex = index + direccion;

    if (nuevoIndex < 0 || nuevoIndex >= copia.length) {
      return copia;
    }

    [copia[index], copia[nuevoIndex]] = [copia[nuevoIndex], copia[index]];
    return copia;
  });
};

const quitarBloqueDeEstructura = (index) => {
  setEstructuraBloques((prev) => prev.filter((_, i) => i !== index));
};

const actualizarBloqueEstructura = (index, field, value) => {
  setEstructuraBloques((prev) => {
    const copia = [...prev];
    copia[index] = {
      ...copia[index],
      [field]: value
    };
    return copia;
  });
};
  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading || !formPlantilla ? (
        <Card><p>Cargando plantilla...</p></Card>
      ) : (
        <TabView>
          <TabPanel header="Plantilla">
            <Card className="shadow-2">
              <div className="grid">
                <div className="col-12">
                  <div className="surface-50 border-round p-3">
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <h4 className="m-0">Sugerencias inteligentes</h4>
                        <small className="text-600">
                          Usa el tipo de documento para cargar estructura y variables sugeridas.
                        </small>
                      </div>

                      <Button
                        type="button"
                        label="Aplicar sugerencias del tipo"
                        icon="pi pi-bolt"
                        outlined
                        onClick={aplicarSugerenciasPorTipo}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Categoría</label>
                  <Dropdown
                    value={formPlantilla.id_categoria_plantilla}
                    options={categorias}
                    onChange={(e) => setFormValue('id_categoria_plantilla', e.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Tipo de documento</label>
                  <Dropdown
                    value={formPlantilla.id_tipo_documento}
                    options={tiposDocumento}
                    onChange={(e) => setFormValue('id_tipo_documento', e.value)}
                    className="w-full"
                    placeholder="Selecciona un tipo"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Especialidad</label>
                  <Dropdown
                    value={formPlantilla.id_especialidad}
                    options={especialidades}
                    onChange={(e) => setFormValue('id_especialidad', e.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Título</label>
                  <InputText
                    value={formPlantilla.titulo}
                    onChange={(e) => setFormValue('titulo', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Slug</label>
                  <InputText
                    value={formPlantilla.slug}
                    onChange={(e) => setFormValue('slug', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Descripción corta</label>
                  <InputText
                    value={formPlantilla.descripcion_corta}
                    onChange={(e) => setFormValue('descripcion_corta', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Descripción larga</label>
                  <InputTextarea
                    value={formPlantilla.descripcion_larga}
                    onChange={(e) => setFormValue('descripcion_larga', e.target.value)}
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-4">
                  <label className="block mb-2">Precio</label>
                  <InputNumber
                    value={formPlantilla.precio}
                    onValueChange={(e) => setFormValue('precio', e.value || 0)}
                    mode="currency"
                    currency="MXN"
                    locale="es-MX"
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-4">
                  <label className="block mb-2">Moneda</label>
                  <InputText
                    value={formPlantilla.moneda}
                    onChange={(e) => setFormValue('moneda', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-4">
                  <label className="block mb-2">Versión actual</label>
                  <InputText
                    value={formPlantilla.version_actual}
                    onChange={(e) => setFormValue('version_actual', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Formato salida</label>
                  <Dropdown
                    value={formPlantilla.tipo_archivo_salida}
                    options={[
                      { label: 'PDF', value: 'pdf' },
                      { label: 'DOCX', value: 'docx' },
                      { label: 'Ambos', value: 'ambos' }
                    ]}
                    onChange={(e) => setFormValue('tipo_archivo_salida', e.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-3 flex align-items-center">
                  <div className="flex align-items-center gap-2 mt-4">
                    <Checkbox
                      checked={formPlantilla.requiere_revision_manual}
                      onChange={(e) => setFormValue('requiere_revision_manual', e.checked)}
                    />
                    <label>Revisión manual</label>
                  </div>
                </div>

                <div className="col-12 md:col-3 flex align-items-center">
                  <div className="flex align-items-center gap-2 mt-4">
                    <Checkbox
                      checked={formPlantilla.activo}
                      onChange={(e) => setFormValue('activo', e.checked)}
                    />
                    <label>Activa</label>
                  </div>
                </div>

                <div className="col-12">
                  <Button
                    label={savingPlantilla ? 'Guardando...' : 'Guardar plantilla'}
                    icon="pi pi-save"
                    loading={savingPlantilla}
                    onClick={guardarPlantilla}
                  />
                </div>
              </div>
            </Card>
          </TabPanel>

          <TabPanel header="Variables">
            <Card className="shadow-2">
              {variables.map((item, index) => (
                <div key={index} className="surface-50 border-round p-3 mb-3">
                  <div className="grid">
                    <div className="col-12 md:col-3">
                      <label className="block mb-2">Variable</label>
                      <InputText
                        value={item.nombre_variable}
                        onChange={(e) => actualizarVariable(index, 'nombre_variable', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-3">
                      <label className="block mb-2">Label</label>
                      <InputText
                        value={item.label_campo}
                        onChange={(e) => actualizarVariable(index, 'label_campo', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-2">
                      <label className="block mb-2">Tipo</label>
                      <Dropdown
                        value={item.tipo_campo}
                        options={[
                          { label: 'Texto', value: 'texto' },
                          { label: 'Número', value: 'numero' },
                          { label: 'Fecha', value: 'fecha' },
                          { label: 'Textarea', value: 'textarea' },
                          { label: 'Select', value: 'select' },
                          { label: 'Checkbox', value: 'checkbox' }
                        ]}
                        onChange={(e) => actualizarVariable(index, 'tipo_campo', e.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-2">
                      <label className="block mb-2">Orden</label>
                      <InputNumber
                        value={item.orden}
                        onValueChange={(e) => actualizarVariable(index, 'orden', e.value || 0)}
                        useGrouping={false}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-2 flex align-items-end">
                      <Button
                        label="Quitar"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={() => quitarVariable(index)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Placeholder</label>
                      <InputText
                        value={item.placeholder}
                        onChange={(e) => actualizarVariable(index, 'placeholder', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Ayuda</label>
                      <InputText
                        value={item.ayuda}
                        onChange={(e) => actualizarVariable(index, 'ayuda', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Configuración JSON</label>
                      <InputTextarea
  value={
    item.configuracion_json
      ? JSON.stringify(item.configuracion_json, null, 2)
      : ''
  }
  onChange={(e) => {
    actualizarVariable(index, 'configuracion_json', e.target.value);
  }}
  rows={5}
  className="w-full"
/>
                    </div>

                    <div className="col-12 md:col-6 flex align-items-center">
                      <div className="flex align-items-center gap-2 mt-4">
                        <Checkbox
                          checked={item.requerido}
                          onChange={(e) => actualizarVariable(index, 'requerido', e.checked)}
                        />
                        <label>Requerido</label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 flex-wrap">
                <Button
                  label="Agregar variable"
                  icon="pi pi-plus"
                  outlined
                  onClick={agregarVariable}
                />
                <Button
                  label={savingVariables ? 'Guardando...' : 'Guardar variables'}
                  icon="pi pi-save"
                  loading={savingVariables}
                  onClick={guardarVariables}
                />
              </div>
            </Card>
          </TabPanel>

          <TabPanel header="Versiones">
            <Card className="shadow-2 mb-4">
              <div className="grid">
                <div className="col-12 md:col-4">
                  <label className="block mb-2">Número de versión</label>
                  <InputText
                    value={formVersion.numero_version}
                    onChange={(e) => setFormVersion((p) => ({ ...p, numero_version: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-8">
                  <label className="block mb-2">Ruta archivo base DOCX (opcional)</label>
                  <InputText
                    value={formVersion.ruta_archivo_base}
                    onChange={(e) => setFormVersion((p) => ({ ...p, ruta_archivo_base: e.target.value }))}
                    className="w-full"
                    placeholder="/plantillas_base/archivo.docx"
                  />
                </div>

                <div className="col-12 lg:col-8">
  <label className="block mb-2">Editor visual de preview HTML</label>
  <Editor
    value={formVersion.html_preview_base}
    onTextChange={(e) =>
      setFormVersion((p) => ({
        ...p,
        html_preview_base: e.htmlValue || ''
      }))
    }
    style={{ height: '320px' }}
  />
  <small className="text-600 block mt-2">
    Aquí puedes diseñar la vista previa del documento. Los placeholders se escriben como {'{{nombre_variable}}'}.
  </small>
</div>

<div className="col-12 lg:col-4">
  <div className="surface-50 border-round p-3 h-full">
    <h4 className="mt-0 mb-3">Placeholders disponibles</h4>

    {placeholdersSugeridos.length === 0 ? (
      <p className="text-700 m-0">
        Aún no has definido variables para esta plantilla.
      </p>
    ) : (
      <div className="flex flex-column gap-2">
        {placeholdersSugeridos.map((item) => (
          <Button
            key={item}
            type="button"
            label={`{{${item}}}`}
            icon="pi pi-plus"
            outlined
            size="small"
            onClick={() => insertarPlaceholderEnPreview(item)}
          />
        ))}
      </div>
    )}

    <Divider />

    <h4 className="mt-0 mb-2">Ejemplo rápido</h4>
    <div className="text-sm text-700 line-height-3">
      <div>{'<h1>Contrato</h1>'}</div>
      <div>{'<p>Yo, {{nombre}}, declaro...</p>'}</div>
      <div>{'<p>Firmado en {{ciudad}}.</p>'}</div>
    </div>
  </div>
</div>

<div className="col-12">
  <div className="surface-50 border-round p-3">
    <h4 className="mt-0 mb-3">Bloques HTML reutilizables</h4>

    {bloquesHtml.length === 0 ? (
      <p className="text-700 m-0">No hay bloques activos disponibles.</p>
    ) : (
      <div className="grid">
        {bloquesHtml.map((bloque) => (
          <div key={bloque.id_bloque} className="col-12 md:col-6 lg:col-4">
            <div className="surface-card border-1 surface-border border-round p-3 h-full">
              <h5 className="mt-0 mb-2">{bloque.nombre}</h5>
              <p className="text-700 text-sm">{bloque.descripcion || '-'}</p>
              <p className="text-600 text-sm"><strong>Categoría:</strong> {bloque.categoria || '-'}</p>

              <Button
                type="button"
                label="Agregar al builder"
                icon="pi pi-plus"
                outlined
                size="small"
                onClick={() => agregarBloqueAEstructura(bloque)}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>

<div className="col-12">
  <div className="surface-50 border-round p-3">
    <h4 className="mt-0 mb-3">Cargar plantilla maestra</h4>

    <div className="flex gap-2 flex-wrap">
      <Dropdown
        value={idMaestraSeleccionada}
        options={plantillasMaestras.map((item) => ({
          label: item.nombre,
          value: item.id_plantilla_maestra
        }))}
        onChange={(e) => setIdMaestraSeleccionada(e.value)}
        placeholder="Selecciona una plantilla maestra"
        className="w-full md:w-20rem"
      />

      <Button
        type="button"
        label="Cargar en builder"
        icon="pi pi-download"
        outlined
        onClick={cargarPlantillaMaestraEnBuilder}
      />
    </div>
  </div>
</div>

<div className="col-12">
  <div className="surface-50 border-round p-3">
    <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 className="m-0">Builder de documento por bloques</h4>
      <Button
        type="button"
        label="Agregar HTML libre"
        icon="pi pi-plus"
        outlined
        onClick={agregarHtmlLibreAEstructura}
      />
    </div>

    {estructuraBloques.length === 0 ? (
      <p className="text-700 m-0">Todavía no has agregado bloques a esta versión.</p>
    ) : (
      estructuraBloques.map((item, index) => (
        <div key={index} className="surface-card border-1 surface-border border-round p-3 mb-3">
          <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <strong>{item.nombre || `Bloque ${index + 1}`}</strong>
              <div className="text-600 text-sm">{item.tipo}</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                icon="pi pi-arrow-up"
                outlined
                size="small"
                onClick={() => moverBloque(index, -1)}
              />
              <Button
                type="button"
                icon="pi pi-arrow-down"
                outlined
                size="small"
                onClick={() => moverBloque(index, 1)}
              />
              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                onClick={() => quitarBloqueDeEstructura(index)}
              />
            </div>
          </div>

          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="block mb-2">Nombre visible</label>
              <InputText
                value={item.nombre || ''}
                onChange={(e) => actualizarBloqueEstructura(index, 'nombre', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-8">
              <label className="block mb-2">HTML del bloque</label>
              <InputTextarea
                value={item.html_base || ''}
                onChange={(e) => actualizarBloqueEstructura(index, 'html_base', e.target.value)}
                rows={6}
                className="w-full font-mono"
              />
            </div>
          </div>
        </div>
      ))
    )}
  </div>
</div>

<div className="col-12">
  <label className="block mb-2">HTML fuente</label>
  <InputTextarea
    value={formVersion.html_preview_base}
    onChange={(e) =>
      setFormVersion((p) => ({
        ...p,
        html_preview_base: e.target.value
      }))
    }
    rows={8}
    className="w-full font-mono"
    placeholder="<h1>Contrato</h1><p>Yo, {{nombre}}, declaro...</p>"
  />
  <small className="text-600 block mt-2">
  ajustar manualmente el HTML si necesitas mayor control.
  </small>
</div>

                <div className="col-12">
                  <label className="block mb-2">Contenido base (opcional)</label>
                  <InputTextarea
                    value={formVersion.contenido_base}
                    onChange={(e) => setFormVersion((p) => ({ ...p, contenido_base: e.target.value }))}
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Notas de cambios</label>
                  <InputTextarea
                    value={formVersion.notas_cambios}
                    onChange={(e) => setFormVersion((p) => ({ ...p, notas_cambios: e.target.value }))}
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <div className="flex align-items-center gap-2">
                    <Checkbox
                      checked={formVersion.es_actual}
                      onChange={(e) => setFormVersion((p) => ({ ...p, es_actual: e.checked }))}
                    />
                    <label>Marcar como versión actual</label>
                  </div>
                </div>

                <div className="col-12">
                  <Button
                    label={savingVersion ? 'Guardando...' : 'Crear versión'}
                    icon="pi pi-save"
                    loading={savingVersion}
                    onClick={guardarVersion}
                  />
                </div>
              </div>
            </Card>

            <Card className="shadow-2">
              <h3 className="mt-0">Historial de versiones</h3>
              {(plantilla?.versiones || []).length === 0 ? (
                <p>No hay versiones registradas.</p>
              ) : (
                plantilla.versiones.map((item) => (
                  <div key={item.id_version} className="surface-50 border-round p-3 mb-3">
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                      <div>
                        <p className="m-0"><strong>Versión:</strong> {item.numero_version}</p>
                        <p className="m-0"><strong>Ruta base:</strong> {item.ruta_archivo_base || '-'}</p>
                        <p className="m-0"><strong>Notas:</strong> {item.notas_cambios || '-'}</p>
                        <p className="m-0"><strong>Preview específico:</strong> {item.html_preview_base ? 'Sí' : 'No'}
</p>
                      </div>
                      {item.es_actual ? (
                        <Tag value="Actual" severity="success" />
                      ) : (
                        <Tag value="Histórica" severity="info" />
                      )}
                    </div>

                    <div className="grid">
                      <div className="col-12 md:col-8">
                        <FileUpload
                          mode="basic"
                          name="archivo"
                          accept=".docx"
                          auto={false}
                          chooseLabel="Seleccionar DOCX"
                          customUpload
                          uploadHandler={(e) => {
                            const archivo = e.files?.[0];
                            if (archivo) {
                              subirArchivoVersion(item.id_version, archivo);
                            }
                          }}
                        />
                      </div>

                      <div className="col-12 md:col-4 flex align-items-center">
                        {item.ruta_archivo_base ? (
                          <a
                            href={`http://localhost:3003${item.ruta_archivo_base}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary"
                          >
                            Ver archivo actual
                          </a>
                        ) : (
                          <span className="text-600">Sin archivo base</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </TabPanel>
        </TabView>
      )}
    </DashboardLayout>
  );
}
