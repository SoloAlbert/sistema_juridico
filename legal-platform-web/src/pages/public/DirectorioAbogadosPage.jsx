import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import { useAuth } from '../../context/AuthContext';

import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { Message } from 'primereact/message';

export default function DirectorioAbogadosPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [abogados, setAbogados] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    especialidad: null,
    ciudad: '',
    modalidad: null
  });

  const modalidades = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'En línea', value: 'en_linea' },
    { label: 'Ambas', value: 'ambas' }
  ];

  useEffect(() => {
    cargarCatalogos();
    obtenerAbogados();
  }, []);

  const cargarCatalogos = async () => {
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

  const obtenerAbogados = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filtros.especialidad) params.especialidad = filtros.especialidad;
      if (filtros.ciudad?.trim()) params.ciudad = filtros.ciudad.trim();
      if (filtros.modalidad) params.modalidad = filtros.modalidad;

      const { data } = await api.get('/abogados/publicos', { params });
      setAbogados(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar abogados');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (name, value) => {
    setFiltros((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      especialidad: null,
      ciudad: '',
      modalidad: null
    });

    setTimeout(() => {
      api.get('/abogados/publicos')
        .then(({ data }) => setAbogados(data.data || []))
        .catch(() => setError('Error al limpiar filtros'));
    }, 0);
  };

  const contenido = (
      <div className="p-4 md:p-6">
        <div className="mb-4">
          <h1 className="m-0">Directorio de abogados</h1>
          <p className="text-700">
            Explora perfiles profesionales, compara experiencia y revisa reseñas antes de contratar.
          </p>
        </div>

        <Card className="shadow-2 mb-4">
          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="block mb-2">Especialidad</label>
              <Dropdown
                value={filtros.especialidad}
                options={especialidades}
                onChange={(e) => handleFiltroChange('especialidad', e.value)}
                className="w-full"
                placeholder="Todas"
                showClear
              />
            </div>

            <div className="col-12 md:col-4">
              <label className="block mb-2">Ciudad</label>
              <InputText
                value={filtros.ciudad}
                onChange={(e) => handleFiltroChange('ciudad', e.target.value)}
                className="w-full"
                placeholder="Ej. Celaya"
              />
            </div>

            <div className="col-12 md:col-4">
              <label className="block mb-2">Modalidad</label>
              <Dropdown
                value={filtros.modalidad}
                options={modalidades}
                onChange={(e) => handleFiltroChange('modalidad', e.value)}
                className="w-full"
                placeholder="Todas"
                showClear
              />
            </div>

            <div className="col-12 flex gap-2 flex-wrap">
              <Button label="Buscar" icon="pi pi-search" onClick={obtenerAbogados} />
              <Button label="Limpiar" icon="pi pi-times" outlined onClick={limpiarFiltros} />
            </div>
          </div>
        </Card>

        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <div className="grid">
          {loading ? (
            <div className="col-12">
              <Card className="shadow-2">
                <p>Cargando abogados...</p>
              </Card>
            </div>
          ) : abogados.length === 0 ? (
            <div className="col-12">
              <Card className="shadow-2">
                <p>No se encontraron abogados con esos filtros.</p>
              </Card>
            </div>
          ) : (
            abogados.map((item) => (
              <div key={item.id_abogado} className="col-12 md:col-6 lg:col-4">
                <Card className="shadow-2 h-full">
                  <div className="flex justify-content-between align-items-start mb-3">
                    <div>
                      <h3 className="m-0">
                        {item.nombre} {item.apellido_paterno || ''} {item.apellido_materno || ''}
                      </h3>
                      <p className="text-700 mt-2 mb-0">{item.nombre_despacho || 'Abogado independiente'}</p>
                    </div>
                    <Tag value={item.modalidad_atencion} severity="info" />
                  </div>

                  <p className="text-700">{item.biografia_corta || 'Perfil profesional en construcción.'}</p>

                  <div className="mb-3">
                    <p className="m-0"><strong>Experiencia:</strong> {item.anos_experiencia} años</p>
                    <p className="m-0"><strong>Consulta:</strong> ${Number(item.precio_consulta_base || 0).toFixed(2)} {item.moneda}</p>
                    <p className="m-0"><strong>Ciudad:</strong> {item.ciudad || '-'}</p>
                    <p className="m-0"><strong>Cumplimiento:</strong> {Number(item.reputacion_cumplimiento || 100).toFixed(0)}/100</p>
                    <p className="m-0"><strong>Estatus operativo:</strong> {item.estatus_cumplimiento || 'normal'}</p>
                  </div>

                  <div className="flex align-items-center gap-2 mb-3">
                    <Rating value={Number(item.rating_promedio || 0)} readOnly cancel={false} />
                    <span className="text-700">({item.total_resenas || 0})</span>
                  </div>

                  <Button
                    label="Ver perfil"
                    icon="pi pi-eye"
                    className="w-full"
                    onClick={() => navigate(`/abogados/${item.id_abogado}`)}
                  />
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
  );

  if (isAuthenticated && user?.role === 'cliente') {
    return (
      <DashboardLayout>
        <ClienteMenu />
        {contenido}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen surface-ground">
      <Navbar />
      {contenido}
    </div>
  );
}
