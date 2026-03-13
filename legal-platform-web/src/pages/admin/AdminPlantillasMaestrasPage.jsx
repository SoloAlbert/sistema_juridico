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
import { Checkbox } from 'primereact/checkbox';

export default function AdminPlantillasMaestrasPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
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
    activo: true
  });

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/plantillas-maestras');
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar plantillas maestras');
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

  const crear = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.post('/admin/plantillas-maestras', {
        ...form,
        estructura_bloques_json: []
      });

      setSuccess(data.message || 'Plantilla maestra creada');
      setVisible(false);
      setForm({
        nombre: '',
        slug: '',
        descripcion: '',
        categoria: '',
        activo: true
      });
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear plantilla maestra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <Card title="Plantillas maestras" className="shadow-2">
        <div className="flex justify-content-end mb-3">
          <Button label="Nueva plantilla maestra" icon="pi pi-plus" onClick={() => setVisible(true)} />
        </div>

        <DataTable value={items} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column field="nombre" header="Nombre" />
          <Column field="slug" header="Slug" />
          <Column field="categoria" header="Categoría" />
          <Column field="descripcion" header="Descripción" />
          <Column
            header="Activo"
            body={(row) => (
              <Tag value={row.activo ? 'Activo' : 'Inactivo'} severity={row.activo ? 'success' : 'danger'} />
            )}
          />
          <Column
            header="Acciones"
            body={(row) => (
              <Button
                label="Editar"
                icon="pi pi-pencil"
                size="small"
                onClick={() => navigate(`/admin/plantillas-maestras/${row.id_plantilla_maestra}`)}
              />
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        header="Nueva plantilla maestra"
        visible={visible}
        style={{ width: '40rem' }}
        onHide={() => setVisible(false)}
      >
        <form onSubmit={crear} className="grid">
          <div className="col-12">
            <label className="block mb-2">Nombre</label>
            <InputText
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Slug</label>
            <InputText
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              className="w-full"
            />
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
            <label className="block mb-2">Categoría</label>
            <InputText
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <div className="flex align-items-center gap-2">
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
              label={saving ? 'Guardando...' : 'Crear'}
              icon="pi pi-save"
              loading={saving}
            />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}