import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { FileUpload } from 'primereact/fileupload';

export default function MiPerfilAbogadoPage() {
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingEspecialidades, setSavingEspecialidades] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [perfil, setPerfil] = useState({
    cedula_profesional: '',
    universidad: '',
    nivel_academico: '',
    anos_experiencia: 0,
    descripcion_profesional: '',
    biografia_corta: '',
    nombre_despacho: '',
    sitio_web: '',
    linkedin_url: '',
    idiomas: '',
    modalidad_atencion: 'ambas',
    consulta_gratuita: false,
    precio_consulta_base: 0,
    moneda: 'MXN',
    acepta_nuevos_casos: true,
    estado: '',
    ciudad: ''
  });

  const [metaPerfil, setMetaPerfil] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
    foto_perfil: '',
    estatus_verificacion: 'pendiente',
    rating_promedio: 0,
    total_resenas: 0,
    total_casos: 0,
    total_ingresos: 0
  });

  const [catalogoEspecialidades, setCatalogoEspecialidades] = useState([]);
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState([]);

  const modalidades = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'En línea', value: 'en_linea' },
    { label: 'Ambas', value: 'ambas' }
  ];

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    await Promise.all([obtenerPerfil(), obtenerCatalogoEspecialidades()]);
  };

  const obtenerPerfil = async () => {
    try {
      setLoadingPerfil(true);
      const { data } = await api.get('/abogados/mi-perfil');
      const p = data.data;

      setPerfil({
        cedula_profesional: p.cedula_profesional || '',
        universidad: p.universidad || '',
        nivel_academico: p.nivel_academico || '',
        anos_experiencia: Number(p.anos_experiencia || 0),
        descripcion_profesional: p.descripcion_profesional || '',
        biografia_corta: p.biografia_corta || '',
        nombre_despacho: p.nombre_despacho || '',
        sitio_web: p.sitio_web || '',
        linkedin_url: p.linkedin_url || '',
        idiomas: p.idiomas || '',
        modalidad_atencion: p.modalidad_atencion || 'ambas',
        consulta_gratuita: !!p.consulta_gratuita,
        precio_consulta_base: Number(p.precio_consulta_base || 0),
        moneda: p.moneda || 'MXN',
        acepta_nuevos_casos: !!p.acepta_nuevos_casos,
        estado: p.estado || '',
        ciudad: p.ciudad || ''
      });

      setMetaPerfil({
        nombre: p.nombre || '',
        apellido_paterno: p.apellido_paterno || '',
        apellido_materno: p.apellido_materno || '',
        email: p.email || '',
        telefono: p.telefono || '',
        foto_perfil: p.foto_perfil || '',
        estatus_verificacion: p.estatus_verificacion || 'pendiente',
        rating_promedio: Number(p.rating_promedio || 0),
        total_resenas: Number(p.total_resenas || 0),
        total_casos: Number(p.total_casos || 0),
        total_ingresos: Number(p.total_ingresos || 0)
      });

      const seleccionadas = (p.especialidades || []).map((item) => ({
        id_especialidad: item.id_especialidad,
        principal: !!item.principal,
        anos_experiencia: Number(item.anos_experiencia || 0),
        descripcion: item.descripcion || '',
        nombre: item.nombre || ''
      }));

      setEspecialidadesSeleccionadas(seleccionadas);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar perfil');
    } finally {
      setLoadingPerfil(false);
    }
  };

  const obtenerCatalogoEspecialidades = async () => {
    try {
      setLoadingEspecialidades(true);
      const { data } = await api.get('/especialidades');
      setCatalogoEspecialidades(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar especialidades');
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const handlePerfilChange = (name, value) => {
    setPerfil((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSavingPerfil(true);

      await api.put('/abogados/mi-perfil', {
        ...perfil,
        anos_experiencia: Number(perfil.anos_experiencia || 0),
        precio_consulta_base: Number(perfil.precio_consulta_base || 0)
      });

      setSuccess('Perfil actualizado correctamente');
      await obtenerPerfil();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar perfil');
    } finally {
      setSavingPerfil(false);
    }
  };

  const opcionesEspecialidades = useMemo(() => {
    return catalogoEspecialidades.map((item) => ({
      label: item.nombre,
      value: item.id_especialidad
    }));
  }, [catalogoEspecialidades]);

  const agregarEspecialidad = () => {
    setEspecialidadesSeleccionadas((prev) => [
      ...prev,
      {
        id_especialidad: null,
        principal: prev.length === 0,
        anos_experiencia: 0,
        descripcion: '',
        nombre: ''
      }
    ]);
  };

  const quitarEspecialidad = (index) => {
    setEspecialidadesSeleccionadas((prev) => {
      const copia = [...prev];
      copia.splice(index, 1);

      if (copia.length > 0 && !copia.some((item) => item.principal)) {
        copia[0].principal = true;
      }

      return copia;
    });
  };

  const actualizarEspecialidad = (index, field, value) => {
    setEspecialidadesSeleccionadas((prev) => {
      const copia = [...prev];

      if (field === 'principal' && value === true) {
        copia.forEach((item, i) => {
          item.principal = i === index;
        });
      } else {
        copia[index] = {
          ...copia[index],
          [field]: value
        };
      }

      if (field === 'id_especialidad') {
        const encontrada = catalogoEspecialidades.find((e) => e.id_especialidad === value);
        copia[index].nombre = encontrada?.nombre || '';
      }

      return copia;
    });
  };

  const guardarEspecialidades = async () => {
    setError('');
    setSuccess('');

    const limpias = especialidadesSeleccionadas
      .filter((item) => item.id_especialidad)
      .map((item) => ({
        id_especialidad: item.id_especialidad,
        principal: !!item.principal,
        anos_experiencia: Number(item.anos_experiencia || 0),
        descripcion: item.descripcion || ''
      }));

    if (limpias.length === 0) {
      setError('Debes agregar al menos una especialidad válida');
      return;
    }

    if (!limpias.some((item) => item.principal)) {
      limpias[0].principal = true;
    }

    try {
      setSavingEspecialidades(true);

      await api.post('/abogados/mis-especialidades', {
        especialidades: limpias
      });

      setSuccess('Especialidades guardadas correctamente');
      await obtenerPerfil();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar especialidades');
    } finally {
      setSavingEspecialidades(false);
    }
  };

  const verificacionSeverity = (estatus) => {
    if (estatus === 'verificado') return 'success';
    if (estatus === 'rechazado') return 'danger';
    return 'warning';
  };

  const formatoMoneda = (valor) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(valor || 0));

  const subirFoto = async (e) => {
    const archivo = e.files?.[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append('foto', archivo);

    try {
      setError('');
      setSuccess('');
      await api.post('/abogados/mi-perfil/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Foto actualizada correctamente');
      await obtenerPerfil();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir foto');
    }
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <div className="grid">
        <div className="col-12 lg:col-4">
          <Card title="Resumen profesional" className="shadow-2 mb-4">
            {loadingPerfil ? (
              <p>Cargando perfil...</p>
            ) : (
              <>
                <div className="mb-3">
                  {metaPerfil.foto_perfil ? (
                    <img
                      src={`http://localhost:3003${metaPerfil.foto_perfil}`}
                      alt="Foto de perfil"
                      style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <div
                      className="surface-200 flex align-items-center justify-content-center"
                      style={{ width: '96px', height: '96px', borderRadius: '50%' }}
                    >
                      <i className="pi pi-user text-2xl" />
                    </div>
                  )}
                </div>

                <h2 className="mb-2">
                  {metaPerfil.nombre} {metaPerfil.apellido_paterno} {metaPerfil.apellido_materno}
                </h2>
                <p className="m-0 mb-2">{metaPerfil.email}</p>
                <p className="m-0 mb-3">{metaPerfil.telefono || '-'}</p>

                <FileUpload
                  mode="basic"
                  name="foto"
                  customUpload
                  auto
                  accept="image/*"
                  chooseLabel="Cambiar foto"
                  uploadHandler={subirFoto}
                  className="mb-3"
                />

                <div className="mb-3">
                  <Tag
                    value={metaPerfil.estatus_verificacion}
                    severity={verificacionSeverity(metaPerfil.estatus_verificacion)}
                  />
                </div>

                <div className="surface-100 border-round p-3">
                  <p className="m-0 mb-2">
                    <strong>Rating:</strong> {metaPerfil.rating_promedio}
                  </p>
                  <p className="m-0 mb-2">
                    <strong>Reseñas:</strong> {metaPerfil.total_resenas}
                  </p>
                  <p className="m-0 mb-2">
                    <strong>Casos:</strong> {metaPerfil.total_casos}
                  </p>
                  <p className="m-0">
                    <strong>Ingresos:</strong> {formatoMoneda(metaPerfil.total_ingresos)}
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>

        <div className="col-12 lg:col-8">
          <Card title="Mi perfil profesional" className="shadow-2 mb-4">
            <form onSubmit={guardarPerfil} className="grid">
              <div className="col-12 md:col-6">
                <label className="block mb-2">Cédula profesional</label>
                <InputText
                  value={perfil.cedula_profesional}
                  onChange={(e) => handlePerfilChange('cedula_profesional', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Universidad</label>
                <InputText
                  value={perfil.universidad}
                  onChange={(e) => handlePerfilChange('universidad', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Nivel académico</label>
                <InputText
                  value={perfil.nivel_academico}
                  onChange={(e) => handlePerfilChange('nivel_academico', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Años de experiencia</label>
                <InputNumber
                  value={perfil.anos_experiencia}
                  onValueChange={(e) => handlePerfilChange('anos_experiencia', e.value || 0)}
                  useGrouping={false}
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <label className="block mb-2">Biografía corta</label>
                <InputText
                  value={perfil.biografia_corta}
                  onChange={(e) => handlePerfilChange('biografia_corta', e.target.value)}
                  className="w-full"
                  placeholder="Una frase corta para tu perfil"
                />
              </div>

              <div className="col-12">
                <label className="block mb-2">Descripción profesional</label>
                <InputTextarea
                  value={perfil.descripcion_profesional}
                  onChange={(e) => handlePerfilChange('descripcion_profesional', e.target.value)}
                  rows={5}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Nombre del despacho</label>
                <InputText
                  value={perfil.nombre_despacho}
                  onChange={(e) => handlePerfilChange('nombre_despacho', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Sitio web</label>
                <InputText
                  value={perfil.sitio_web}
                  onChange={(e) => handlePerfilChange('sitio_web', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">LinkedIn</label>
                <InputText
                  value={perfil.linkedin_url}
                  onChange={(e) => handlePerfilChange('linkedin_url', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Idiomas</label>
                <InputText
                  value={perfil.idiomas}
                  onChange={(e) => handlePerfilChange('idiomas', e.target.value)}
                  className="w-full"
                  placeholder="Ej. Espanol, Ingles"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Modalidad de atención</label>
                <Dropdown
                  value={perfil.modalidad_atencion}
                  options={modalidades}
                  onChange={(e) => handlePerfilChange('modalidad_atencion', e.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Precio base de consulta</label>
                <InputNumber
                  value={perfil.precio_consulta_base}
                  onValueChange={(e) => handlePerfilChange('precio_consulta_base', e.value || 0)}
                  mode="currency"
                  currency="MXN"
                  locale="es-MX"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Moneda</label>
                <InputText
                  value={perfil.moneda}
                  onChange={(e) => handlePerfilChange('moneda', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Estado</label>
                <InputText
                  value={perfil.estado}
                  onChange={(e) => handlePerfilChange('estado', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block mb-2">Ciudad</label>
                <InputText
                  value={perfil.ciudad}
                  onChange={(e) => handlePerfilChange('ciudad', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <div className="flex align-items-center gap-2 mt-4">
                  <Checkbox
                    inputId="consulta_gratuita"
                    checked={perfil.consulta_gratuita}
                    onChange={(e) => handlePerfilChange('consulta_gratuita', e.checked)}
                  />
                  <label htmlFor="consulta_gratuita">Ofrezco consulta gratuita</label>
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="flex align-items-center gap-2 mt-4">
                  <Checkbox
                    inputId="acepta_nuevos_casos"
                    checked={perfil.acepta_nuevos_casos}
                    onChange={(e) => handlePerfilChange('acepta_nuevos_casos', e.checked)}
                  />
                  <label htmlFor="acepta_nuevos_casos">Aceptar nuevos casos</label>
                </div>
              </div>

              <div className="col-12">
                <Button
                  type="submit"
                  label={savingPerfil ? 'Guardando...' : 'Guardar perfil'}
                  icon="pi pi-save"
                  loading={savingPerfil}
                />
              </div>
            </form>
          </Card>

          <Card title="Mis especialidades" className="shadow-2">
            {loadingEspecialidades ? (
              <p>Cargando especialidades...</p>
            ) : (
              <>
                {especialidadesSeleccionadas.map((item, index) => (
                  <div key={index} className="surface-50 border-round p-3 mb-3">
                    <div className="grid">
                      <div className="col-12 md:col-5">
                        <label className="block mb-2">Especialidad</label>
                        <Dropdown
                          value={item.id_especialidad}
                          options={opcionesEspecialidades}
                          onChange={(e) => actualizarEspecialidad(index, 'id_especialidad', e.value)}
                          className="w-full"
                          placeholder="Selecciona una especialidad"
                        />
                      </div>

                      <div className="col-12 md:col-3">
                        <label className="block mb-2">Años de experiencia</label>
                        <InputNumber
                          value={item.anos_experiencia}
                          onValueChange={(e) =>
                            actualizarEspecialidad(index, 'anos_experiencia', e.value || 0)
                          }
                          useGrouping={false}
                          className="w-full"
                        />
                      </div>

                      <div className="col-12 md:col-2">
                        <label className="block mb-2">Principal</label>
                        <div className="flex align-items-center h-full">
                          <Checkbox
                            checked={item.principal}
                            onChange={(e) => actualizarEspecialidad(index, 'principal', e.checked)}
                          />
                        </div>
                      </div>

                      <div className="col-12 md:col-2 flex align-items-end">
                        <Button
                          type="button"
                          label="Quitar"
                          icon="pi pi-trash"
                          severity="danger"
                          outlined
                          onClick={() => quitarEspecialidad(index)}
                          className="w-full"
                        />
                      </div>

                      <div className="col-12">
                        <label className="block mb-2">Descripción</label>
                        <InputTextarea
                          value={item.descripcion}
                          onChange={(e) => actualizarEspecialidad(index, 'descripcion', e.target.value)}
                          rows={3}
                          className="w-full"
                          placeholder="Ej. divorcios, custodia, contratos civiles..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    label="Agregar especialidad"
                    icon="pi pi-plus"
                    outlined
                    onClick={agregarEspecialidad}
                  />

                  <Button
                    type="button"
                    label={savingEspecialidades ? 'Guardando...' : 'Guardar especialidades'}
                    icon="pi pi-save"
                    loading={savingEspecialidades}
                    onClick={guardarEspecialidades}
                  />
                </div>

                <Divider />

                <div>
                  <p className="m-0 text-700">
                    Marca solo una especialidad como principal para que el perfil tenga una identidad clara y no parezca buffet jurídico infinito.
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
