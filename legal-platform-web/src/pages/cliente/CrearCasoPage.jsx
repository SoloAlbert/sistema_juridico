import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { FileUpload } from 'primereact/fileupload';

export default function CrearCasoPage() {
  const [especialidades, setEspecialidades] = useState([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [archivos, setArchivos] = useState([]);

  const [form, setForm] = useState({
    id_especialidad: null,
    titulo: '',
    descripcion: '',
    urgencia: 'media',
    presupuesto_min: '',
    presupuesto_max: '',
    modalidad_preferida: 'indistinto',
    ciudad: '',
    estado_republica: '',
    fecha_limite_respuesta: null
  });

  const urgencias = [
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' }
  ];

  const modalidades = [
    { label: 'Indistinto', value: 'indistinto' },
    { label: 'En línea', value: 'en_linea' },
    { label: 'Presencial', value: 'presencial' }
  ];

  useEffect(() => {
    obtenerEspecialidades();
  }, []);

  const obtenerEspecialidades = async () => {
    try {
      const { data } = await api.get('/especialidades');
      const opciones = data.data.map((item) => ({
        label: item.nombre,
        value: item.id_especialidad
      }));
      setEspecialidades(opciones);
    } catch (err) {
      setError('No se pudieron cargar las especialidades');
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const formatearFechaMySQL = (fecha) => {
    if (!fecha) return null;
    const pad = (n) => String(n).padStart(2, '0');

    const year = fecha.getFullYear();
    const month = pad(fecha.getMonth() + 1);
    const day = pad(fecha.getDate());
    const hours = pad(fecha.getHours());
    const minutes = pad(fecha.getMinutes());
    const seconds = pad(fecha.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingSubmit(true);

    try {
      const payload = {
        ...form,
        presupuesto_min: form.presupuesto_min ? Number(form.presupuesto_min) : null,
        presupuesto_max: form.presupuesto_max ? Number(form.presupuesto_max) : null,
        fecha_limite_respuesta: formatearFechaMySQL(form.fecha_limite_respuesta)
      };

      const { data } = await api.post('/cliente/casos', payload);
      const idCaso = data.data?.id_caso;

      if (idCaso && archivos.length > 0) {
        const formData = new FormData();

        archivos.forEach((file) => {
          formData.append('archivos', file);
        });

        await api.post(`/cliente/casos/${idCaso}/archivos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setSuccess(
        `Caso creado correctamente. Folio: ${data.data.folio_caso}${
          archivos.length ? ` | Archivos subidos: ${archivos.length}` : ''
        }`
      );

      setForm({
        id_especialidad: null,
        titulo: '',
        descripcion: '',
        urgencia: 'media',
        presupuesto_min: '',
        presupuesto_max: '',
        modalidad_preferida: 'indistinto',
        ciudad: '',
        estado_republica: '',
        fecha_limite_respuesta: null
      });
      setArchivos([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear caso');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <DashboardLayout>
      <ClienteMenu />

      <Card title="Crear nuevo caso" className="shadow-2">
        <form onSubmit={handleSubmit} className="grid">
          <div className="col-12 md:col-6">
            <label className="block mb-2">Especialidad</label>
            <Dropdown
              value={form.id_especialidad}
              options={especialidades}
              onChange={(e) => handleChange('id_especialidad', e.value)}
              placeholder={loadingEspecialidades ? 'Cargando...' : 'Selecciona una especialidad'}
              className="w-full"
              disabled={loadingEspecialidades}
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Título del caso</label>
            <InputText
              value={form.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              className="w-full"
              placeholder="Ej. Despido injustificado"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Descripción</label>
            <InputTextarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={6}
              className="w-full"
              placeholder="Describe tu situación legal"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Urgencia</label>
            <Dropdown
              value={form.urgencia}
              options={urgencias}
              onChange={(e) => handleChange('urgencia', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Presupuesto mínimo</label>
            <InputText
              value={form.presupuesto_min}
              onChange={(e) => handleChange('presupuesto_min', e.target.value)}
              className="w-full"
              keyfilter="money"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Presupuesto máximo</label>
            <InputText
              value={form.presupuesto_max}
              onChange={(e) => handleChange('presupuesto_max', e.target.value)}
              className="w-full"
              keyfilter="money"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Modalidad preferida</label>
            <Dropdown
              value={form.modalidad_preferida}
              options={modalidades}
              onChange={(e) => handleChange('modalidad_preferida', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Ciudad</label>
            <InputText
              value={form.ciudad}
              onChange={(e) => handleChange('ciudad', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Estado</label>
            <InputText
              value={form.estado_republica}
              onChange={(e) => handleChange('estado_republica', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Fecha límite de respuesta</label>
            <Calendar
              value={form.fecha_limite_respuesta}
              onChange={(e) => handleChange('fecha_limite_respuesta', e.value)}
              showTime
              hourFormat="24"
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Archivos del caso</label>
            <FileUpload
              mode="advanced"
              name="archivos"
              multiple
              customUpload
              auto={false}
              chooseLabel="Seleccionar archivos"
              uploadOptions={{ style: { display: 'none' } }}
              cancelOptions={{ style: { display: 'none' } }}
              onSelect={(e) => {
                setArchivos((prev) => [...prev, ...(e.files || [])]);
              }}
              onRemove={(e) => {
                setArchivos((prev) => prev.filter((item) => item.name !== e.file.name));
              }}
              emptyTemplate={<p className="m-0">Puedes adjuntar PDF, imágenes o Word.</p>}
            />
            {archivos.length > 0 && (
              <small className="text-600 block mt-2">
                Archivos seleccionados: {archivos.length}
              </small>
            )}
          </div>

          <div className="col-12">
            {error && <Message severity="error" text={error} className="w-full mb-3" />}
            {success && <Message severity="success" text={success} className="w-full mb-3" />}
          </div>

          <div className="col-12">
            <Button
              type="submit"
              label={loadingSubmit ? 'Guardando...' : 'Crear caso'}
              icon="pi pi-save"
              loading={loadingSubmit}
            />
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}
