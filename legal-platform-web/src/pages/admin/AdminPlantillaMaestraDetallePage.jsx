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
import { InputTextarea } from 'primereact/inputtextarea';

export default function AdminPlantillaMaestraDetallePage() {
  const { id } = useParams();

  const [maestra, setMaestra] = useState(null);
  const [bloquesHtml, setBloquesHtml] = useState([]);
  const [estructura, setEstructura] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarTodo();
  }, [id]);

  const cargarTodo = async () => {
    try {
      setLoading(true);

      const [maestraRes, bloquesRes] = await Promise.all([
        api.get(`/admin/plantillas-maestras/${id}`),
        api.get('/admin/bloques-html')
      ]);

      const item = maestraRes.data.data;
      setMaestra(item);
      setBloquesHtml((bloquesRes.data.data || []).filter((b) => b.activo));

      let estructuraBase = [];
      try {
        estructuraBase =
          typeof item.estructura_bloques_json === 'string'
            ? JSON.parse(item.estructura_bloques_json)
            : item.estructura_bloques_json || [];
      } catch {
        estructuraBase = [];
      }

      setEstructura(Array.isArray(estructuraBase) ? estructuraBase : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar plantilla maestra');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setMaestra((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarBloque = (bloque) => {
    setEstructura((prev) => [
      ...prev,
      {
        tipo: 'bloque',
        id_bloque: bloque.id_bloque,
        nombre: bloque.nombre,
        html_base: bloque.html_base
      }
    ]);
  };

  const agregarLibre = () => {
    setEstructura((prev) => [
      ...prev,
      {
        tipo: 'html_libre',
        nombre: 'Bloque libre',
        html_base: '<p>Nuevo bloque...</p>'
      }
    ]);
  };

  const mover = (index, direccion) => {
    setEstructura((prev) => {
      const copia = [...prev];
      const nuevoIndex = index + direccion;
      if (nuevoIndex < 0 || nuevoIndex >= copia.length) return copia;
      [copia[index], copia[nuevoIndex]] = [copia[nuevoIndex], copia[index]];
      return copia;
    });
  };

  const quitar = (index) => {
    setEstructura((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarItem = (index, field, value) => {
    setEstructura((prev) => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        [field]: value
      };
      return copia;
    });
  };

  const guardar = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.put(`/admin/plantillas-maestras/${id}`, {
        ...maestra,
        estructura_bloques_json: estructura
      });

      setSuccess(data.message || 'Plantilla maestra actualizada');
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar plantilla maestra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading || !maestra ? (
        <Card><p>Cargando plantilla maestra...</p></Card>
      ) : (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <Card title="Datos base" className="shadow-2 mb-4">
              <div className="grid">
                <div className="col-12">
                  <label className="block mb-2">Nombre</label>
                  <InputText
                    value={maestra.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Slug</label>
                  <InputText
                    value={maestra.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Descripción</label>
                  <InputText
                    value={maestra.descripcion || ''}
                    onChange={(e) => handleChange('descripcion', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Categoría</label>
                  <InputText
                    value={maestra.categoria || ''}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <div className="flex align-items-center gap-2">
                    <Checkbox
                      checked={!!maestra.activo}
                      onChange={(e) => handleChange('activo', e.checked)}
                    />
                    <label>Activa</label>
                  </div>
                </div>

                <div className="col-12">
                  <Button
                    label={saving ? 'Guardando...' : 'Guardar maestra'}
                    icon="pi pi-save"
                    loading={saving}
                    onClick={guardar}
                  />
                </div>
              </div>
            </Card>

            <Card title="Bloques reutilizables" className="shadow-2">
              <div className="flex flex-column gap-2">
                <Button
                  type="button"
                  label="Agregar HTML libre"
                  icon="pi pi-plus"
                  outlined
                  onClick={agregarLibre}
                />

                {bloquesHtml.map((bloque) => (
                  <Button
                    key={bloque.id_bloque}
                    type="button"
                    label={bloque.nombre}
                    icon="pi pi-plus"
                    outlined
                    onClick={() => agregarBloque(bloque)}
                  />
                ))}
              </div>
            </Card>
          </div>

          <div className="col-12 lg:col-8">
            <Card title="Builder de la plantilla maestra" className="shadow-2">
              {estructura.length === 0 ? (
                <p>No hay bloques agregados todavía.</p>
              ) : (
                estructura.map((item, index) => (
                  <div key={index} className="surface-50 border-round p-3 mb-3">
                    <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                      <div>
                        <strong>{item.nombre || `Bloque ${index + 1}`}</strong>
                        <div className="text-600 text-sm">{item.tipo}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" icon="pi pi-arrow-up" outlined size="small" onClick={() => mover(index, -1)} />
                        <Button type="button" icon="pi pi-arrow-down" outlined size="small" onClick={() => mover(index, 1)} />
                        <Button type="button" icon="pi pi-trash" severity="danger" outlined size="small" onClick={() => quitar(index)} />
                      </div>
                    </div>

                    <div className="grid">
                      <div className="col-12 md:col-4">
                        <label className="block mb-2">Nombre</label>
                        <InputText
                          value={item.nombre || ''}
                          onChange={(e) => actualizarItem(index, 'nombre', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="col-12 md:col-8">
                        <label className="block mb-2">HTML</label>
                        <InputTextarea
                          value={item.html_base || ''}
                          onChange={(e) => actualizarItem(index, 'html_base', e.target.value)}
                          rows={6}
                          className="w-full font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}