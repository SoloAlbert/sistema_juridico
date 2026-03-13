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
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';

export default function AdminBloquesHtmlPage() {
  const navigate = useNavigate();

  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    categoria: '',
    html_base: '',
    activo: true
  });

  useEffect(() => {
    cargarBloques();
  }, []);

  const cargarBloques = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/bloques-html');
      setBloques(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar bloques');
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

  const crearBloque = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.post('/admin/bloques-html', form);
      setSuccess(data.message || 'Bloque creado correctamente');
      setVisible(false);
      setForm({
        nombre: '',
        slug: '',
        descripcion: '',
        categoria: '',
        html_base: '',
        activo: true
      });
      await cargarBloques();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear bloque');
    } finally {
      setSaving(false);
    }
  };

  const activoBody = (row) => (
    <Tag value={row.activo ? 'Activo' : 'Inactivo'} severity={row.activo ? 'success' : 'danger'} />
  );

  const accionesBody = (row) => (
    <div className="flex gap-2 flex-wrap">
      <Button
        label="Editar"
        icon="pi pi-pencil"
        size="small"
        onClick={() => navigate(`/admin/bloques-html/${row.id_bloque}`)}
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
            const { data } = await api.post(`/admin/bloques-html/${row.id_bloque}/clonar`);
            setSuccess(data.message || 'Bloque clonado');
            await cargarBloques();
          } catch (err) {
            setError(err.response?.data?.message || 'Error al clonar bloque');
          }
        }}
      />
      <Button
        label="Papelera"
        icon="pi pi-trash"
        size="small"
        severity="danger"
        outlined
        onClick={async () => {
          try {
            setError('');
            setSuccess('');
            const { data } = await api.post(`/admin/papelera/bloques/${row.id_bloque}/enviar`);
            setSuccess(data.message || 'Enviado a papelera');
            await cargarBloques();
          } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar a papelera');
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

      <Card title="Bloques HTML reutilizables" className="shadow-2">
        <div className="flex justify-content-end mb-3">
          <Button label="Nuevo bloque" icon="pi pi-plus" onClick={() => setVisible(true)} />
        </div>

        <DataTable value={bloques} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column field="nombre" header="Nombre" />
          <Column field="slug" header="Slug" />
          <Column field="categoria" header="Categoría" />
          <Column field="descripcion" header="Descripción" />
          <Column header="Activo" body={activoBody} />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>

      <Dialog
        header="Crear bloque HTML"
        visible={visible}
        style={{ width: '55rem' }}
        onHide={() => setVisible(false)}
      >
        <form onSubmit={crearBloque} className="grid">
          <div className="col-12 md:col-6">
            <label className="block mb-2">Nombre</label>
            <InputText
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
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

          <div className="col-12 md:col-6">
            <label className="block mb-2">Categoría</label>
            <InputText
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="w-full"
              placeholder="encabezado, firmas, clausulas..."
            />
          </div>

          <div className="col-12 md:col-6 flex align-items-center">
            <div className="flex align-items-center gap-2 mt-4">
              <Checkbox
                checked={form.activo}
                onChange={(e) => handleChange('activo', e.checked)}
              />
              <label>Activo</label>
            </div>
          </div>

          <div className="col-12">
            <label className="block mb-2">Descripción</label>
            <InputText
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">HTML base</label>
            <InputTextarea
              value={form.html_base}
              onChange={(e) => handleChange('html_base', e.target.value)}
              rows={10}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <Button
              type="submit"
              label={saving ? 'Guardando...' : 'Crear bloque'}
              icon="pi pi-save"
              loading={saving}
            />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
