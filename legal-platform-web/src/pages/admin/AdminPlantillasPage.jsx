import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';

export default function AdminPlantillasPage() {
  const navigate = useNavigate();

  const [plantillas, setPlantillas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    id_categoria_plantilla: null,
    id_especialidad: null,
    titulo: '',
    slug: '',
    descripcion_corta: '',
    descripcion_larga: '',
    precio: 0,
    moneda: 'MXN',
    version_actual: '1.0',
    tipo_archivo_salida: 'pdf',
    requiere_revision_manual: false,
    activo: true,
    estatus_publicacion: 'borrador'
  });

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      setLoading(true);

      const [catalogosRes, plantillasRes] = await Promise.all([
        api.get('/admin/plantillas/catalogos'),
        api.get('/admin/plantillas')
      ]);

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

      setPlantillas(plantillasRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos admin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const crearPlantilla = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.post('/admin/plantillas', form);

      setSuccess(data.message || 'Plantilla creada correctamente');
      setVisible(false);
      setForm({
        id_categoria_plantilla: null,
        id_especialidad: null,
        titulo: '',
        slug: '',
        descripcion_corta: '',
        descripcion_larga: '',
        precio: 0,
        moneda: 'MXN',
        version_actual: '1.0',
        tipo_archivo_salida: 'pdf',
        requiere_revision_manual: false,
        activo: true,
        estatus_publicacion: 'borrador'
      });

      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear plantilla');
    } finally {
      setSaving(false);
    }
  };

  const activoBody = (row) => (
    <Tag value={row.activo ? 'Activa' : 'Inactiva'} severity={row.activo ? 'success' : 'danger'} />
  );

  const estatusBody = (row) => {
    let severity = 'warning';
    if (row.estatus_publicacion === 'publicada') severity = 'success';
    if (row.estatus_publicacion === 'archivada') severity = 'secondary';

    return <Tag value={row.estatus_publicacion} severity={severity} />;
  };

  const accionesBody = (row) => (
    <div className="flex gap-2 flex-wrap">
      <Button
        label="Editar"
        icon="pi pi-pencil"
        size="small"
        onClick={() => navigate(`/admin/plantillas/${row.id_plantilla}`)}
      />
      <Button
        label="Clonar"
        icon="pi pi-copy"
        size="small"
        outlined
        onClick={async () => {
          try {
            setError('');
            setSuccess('');
            const { data } = await api.post(`/admin/plantillas/${row.id_plantilla}/clonar`);
            setSuccess(data.message || 'Plantilla clonada');
            await cargarTodo();
          } catch (err) {
            setError(err.response?.data?.message || 'Error al clonar plantilla');
          }
        }}
      />
    </div>
  );

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <Card title="Plantillas legales" className="shadow-2">
        <div className="flex justify-content-end mb-3">
          <Button label="Nueva plantilla" icon="pi pi-plus" onClick={() => setVisible(true)} />
        </div>

        <DataTable value={plantillas} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column field="titulo" header="Título" />
          <Column field="slug" header="Slug" />
          <Column field="categoria" header="Categoría" />
          <Column field="especialidad" header="Especialidad" />
          <Column field="precio" header="Precio" />
          <Column header="Publicación" body={estatusBody} />
          <Column field="version_actual" header="Versión actual" />
          <Column header="Activa" body={activoBody} />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>

      <Dialog
        header="Crear plantilla"
        visible={visible}
        style={{ width: '50rem' }}
        onHide={() => setVisible(false)}
      >
        <form onSubmit={crearPlantilla} className="grid">
          <div className="col-12 md:col-6">
            <label className="block mb-2">Categoría</label>
            <Dropdown
              value={form.id_categoria_plantilla}
              options={categorias}
              onChange={(e) => handleChange('id_categoria_plantilla', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Especialidad</label>
            <Dropdown
              value={form.id_especialidad}
              options={especialidades}
              onChange={(e) => handleChange('id_especialidad', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Título</label>
            <InputText
              value={form.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Slug</label>
            <InputText
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Descripción corta</label>
            <InputText
              value={form.descripcion_corta}
              onChange={(e) => handleChange('descripcion_corta', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Descripción larga</label>
            <InputTextarea
              value={form.descripcion_larga}
              onChange={(e) => handleChange('descripcion_larga', e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Precio</label>
            <InputNumber
              value={form.precio}
              onValueChange={(e) => handleChange('precio', e.value || 0)}
              mode="currency"
              currency="MXN"
              locale="es-MX"
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Moneda</label>
            <InputText
              value={form.moneda}
              onChange={(e) => handleChange('moneda', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Versión actual</label>
            <InputText
              value={form.version_actual}
              onChange={(e) => handleChange('version_actual', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Estatus publicación</label>
            <Dropdown
              value={form.estatus_publicacion}
              options={[
                { label: 'Borrador', value: 'borrador' },
                { label: 'Publicada', value: 'publicada' },
                { label: 'Archivada', value: 'archivada' }
              ]}
              onChange={(e) => handleChange('estatus_publicacion', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Formato salida</label>
            <Dropdown
              value={form.tipo_archivo_salida}
              options={[
                { label: 'PDF', value: 'pdf' },
                { label: 'DOCX', value: 'docx' },
                { label: 'Ambos', value: 'ambos' }
              ]}
              onChange={(e) => handleChange('tipo_archivo_salida', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-3 flex align-items-center">
            <div className="flex align-items-center gap-2 mt-4">
              <Checkbox
                checked={form.requiere_revision_manual}
                onChange={(e) => handleChange('requiere_revision_manual', e.checked)}
              />
              <label>Revisión manual</label>
            </div>
          </div>

          <div className="col-12 md:col-3 flex align-items-center">
            <div className="flex align-items-center gap-2 mt-4">
              <Checkbox
                checked={form.activo}
                onChange={(e) => handleChange('activo', e.checked)}
              />
              <label>Activa</label>
            </div>
          </div>

          <div className="col-12">
            <Button
              type="submit"
              label={saving ? 'Guardando...' : 'Crear plantilla'}
              icon="pi pi-save"
              loading={saving}
            />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
