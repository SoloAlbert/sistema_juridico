import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

export default function AdminTipoDocumentoDetallePage() {
  const { id } = useParams();

  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargar();
  }, [id]);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/tipos-documento/${id}`);
      setTipo(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar tipo de documento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setTipo((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const guardar = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.put(`/admin/tipos-documento/${id}`, tipo);
      setSuccess(data.message || 'Tipo actualizado correctamente');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar tipo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading || !tipo ? (
        <Card><p>Cargando tipo de documento...</p></Card>
      ) : (
        <Card title="Editar tipo de documento" className="shadow-2">
          <div className="grid">
            <div className="col-12">
              <label className="block mb-2">Nombre</label>
              <InputText
                value={tipo.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12">
              <label className="block mb-2">Slug</label>
              <InputText
                value={tipo.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12">
              <label className="block mb-2">Descripción</label>
              <InputText
                value={tipo.descripcion || ''}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="col-12">
              <div className="flex align-items-center gap-2">
                <Checkbox
                  checked={!!tipo.activo}
                  onChange={(e) => handleChange('activo', e.checked)}
                />
                <label>Activo</label>
              </div>
            </div>

            <div className="col-12">
              <Button
                label={saving ? 'Guardando...' : 'Guardar cambios'}
                icon="pi pi-save"
                loading={saving}
                onClick={guardar}
              />
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}