import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Editor } from 'primereact/editor';

export default function AdminBloqueHtmlDetallePage() {
  const { id } = useParams();

  const [bloque, setBloque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarBloque();
  }, [id]);

  const cargarBloque = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/bloques-html/${id}`);
      setBloque(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar bloque');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setBloque((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardarBloque = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.put(`/admin/bloques-html/${id}`, bloque);
      setSuccess(data.message || 'Bloque actualizado');
      await cargarBloque();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar bloque');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading || !bloque ? (
        <Card><p>Cargando bloque...</p></Card>
      ) : (
        <Card title="Editar bloque HTML" className="shadow-2">
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="block mb-2">Nombre</label>
              <InputText
                value={bloque.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2">Slug</label>
              <InputText
                value={bloque.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2">Categoría</label>
              <InputText
                value={bloque.categoria || ''}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6 flex align-items-center">
              <div className="flex align-items-center gap-2 mt-4">
                <Checkbox
                  checked={!!bloque.activo}
                  onChange={(e) => handleChange('activo', e.checked)}
                />
                <label>Activo</label>
              </div>
            </div>

            <div className="col-12">
              <label className="block mb-2">Descripción</label>
              <InputText
                value={bloque.descripcion || ''}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12 lg:col-8">
              <label className="block mb-2">Editor visual</label>
              <Editor
                value={bloque.html_base || ''}
                onTextChange={(e) => handleChange('html_base', e.htmlValue || '')}
                style={{ height: '320px' }}
              />
            </div>

            <div className="col-12 lg:col-4">
              <label className="block mb-2">HTML fuente</label>
              <InputTextarea
                value={bloque.html_base || ''}
                onChange={(e) => handleChange('html_base', e.target.value)}
                rows={16}
                className="w-full font-mono"
              />
            </div>

            <div className="col-12">
              <Button
                label={saving ? 'Guardando...' : 'Guardar bloque'}
                icon="pi pi-save"
                loading={saving}
                onClick={guardarBloque}
              />
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}