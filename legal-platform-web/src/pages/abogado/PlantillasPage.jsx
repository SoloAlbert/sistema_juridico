import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';

export default function PlantillasPage() {
  const navigate = useNavigate();

  const [plantillas, setPlantillas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    id_especialidad: null
  });

  useEffect(() => {
    cargarEspecialidades();
    obtenerPlantillas();
  }, []);

  const cargarEspecialidades = async () => {
    try {
      const { data } = await api.get('/especialidades');
      setEspecialidades(
        (data.data || []).map((item) => ({
          label: item.nombre,
          value: item.id_especialidad
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerPlantillas = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filtros.id_especialidad) params.id_especialidad = filtros.id_especialidad;

      const { data } = await api.get('/plantillas', { params });
      setPlantillas(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      <Card title="Catálogo de plantillas legales" className="shadow-2 mb-4">
        <div className="grid">
          <div className="col-12 md:col-6">
            <label className="block mb-2">Especialidad</label>
            <Dropdown
              value={filtros.id_especialidad}
              options={especialidades}
              onChange={(e) => setFiltros({ id_especialidad: e.value })}
              className="w-full"
              placeholder="Todas"
              showClear
            />
          </div>

          <div className="col-12 md:col-6 flex align-items-end gap-2">
            <Button label="Buscar" icon="pi pi-search" onClick={obtenerPlantillas} />
            <Button
              label="Limpiar"
              icon="pi pi-times"
              outlined
              onClick={() => {
                setFiltros({ id_especialidad: null });
                setTimeout(() => obtenerPlantillas(), 0);
              }}
            />
          </div>
        </div>
      </Card>

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <div className="grid">
        {loading ? (
          <div className="col-12">
            <Card><p>Cargando plantillas...</p></Card>
          </div>
        ) : plantillas.length === 0 ? (
          <div className="col-12">
            <Card><p>No hay plantillas disponibles.</p></Card>
          </div>
        ) : (
          plantillas.map((item) => (
            <div key={item.id_plantilla} className="col-12 md:col-6 lg:col-4">
              <Card className="shadow-2 h-full">
                <div className="flex justify-content-between align-items-start mb-3">
                  <h3 className="m-0">{item.titulo}</h3>
                  <Tag value={item.tipo_archivo_salida} severity="info" />
                </div>

                <p className="text-700">{item.descripcion_corta || '-'}</p>

                <div className="mb-3">
                  <p className="m-0"><strong>Categoría:</strong> {item.categoria}</p>
                  <p className="m-0"><strong>Especialidad:</strong> {item.especialidad}</p>
                  <p className="m-0"><strong>Precio:</strong> ${Number(item.precio || 0).toFixed(2)} {item.moneda}</p>
                </div>

                <Button
                  label="Ver detalle"
                  icon="pi pi-eye"
                  className="w-full"
                  onClick={() => navigate(`/abogado/plantillas/${item.id_plantilla}`)}
                />
              </Card>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}