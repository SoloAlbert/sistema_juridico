import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';

export default function CasosDisponiblesPage() {
  const navigate = useNavigate();

  const [casos, setCasos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    id_especialidad: null,
    urgencia: null,
    modalidad: null
  });

  const urgencias = [
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' }
  ];

  const modalidades = [
    { label: 'En línea', value: 'en_linea' },
    { label: 'Presencial', value: 'presencial' },
    { label: 'Indistinto', value: 'indistinto' }
  ];

  useEffect(() => {
    cargarEspecialidades();
    obtenerCasos();
  }, []);

  const cargarEspecialidades = async () => {
    try {
      const { data } = await api.get('/especialidades');
      setEspecialidades(
        data.data.map((item) => ({
          label: item.nombre,
          value: item.id_especialidad
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerCasos = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};

      if (filtros.id_especialidad) params.id_especialidad = filtros.id_especialidad;
      if (filtros.urgencia) params.urgencia = filtros.urgencia;
      if (filtros.modalidad) params.modalidad = filtros.modalidad;

      const { data } = await api.get('/casos/disponibles', { params });
      setCasos(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener casos disponibles');
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

  const aplicarFiltros = () => {
    obtenerCasos();
  };

  const limpiarFiltros = () => {
    const nuevos = {
      id_especialidad: null,
      urgencia: null,
      modalidad: null
    };
    setFiltros(nuevos);

    setTimeout(() => {
      obtenerCasos();
    }, 0);
  };

  const urgenciaBody = (row) => {
    let severity = 'info';
    if (row.urgencia === 'alta') severity = 'danger';
    if (row.urgencia === 'media') severity = 'warning';
    if (row.urgencia === 'baja') severity = 'success';

    return <Tag value={row.urgencia} severity={severity} />;
  };

  const modalidadBody = (row) => {
    return <Tag value={row.modalidad_preferida} severity="contrast" />;
  };

  const postuladoBody = (row) => {
    return row.ya_postulado ? (
      <Tag value="Ya postulado" severity="success" />
    ) : (
      <Tag value="Disponible" severity="warning" />
    );
  };

  const accionesBody = (row) => {
    return (
      <Button
        label="Ver detalle"
        icon="pi pi-eye"
        size="small"
        onClick={() => navigate(`/abogado/casos-disponibles/${row.id_caso}`)}
      />
    );
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      <Card title="Casos disponibles" className="shadow-2 mb-4">
        <div className="grid">
          <div className="col-12 md:col-4">
            <label className="block mb-2">Especialidad</label>
            <Dropdown
              value={filtros.id_especialidad}
              options={especialidades}
              onChange={(e) => handleFiltroChange('id_especialidad', e.value)}
              className="w-full"
              placeholder="Todas"
              showClear
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="block mb-2">Urgencia</label>
            <Dropdown
              value={filtros.urgencia}
              options={urgencias}
              onChange={(e) => handleFiltroChange('urgencia', e.value)}
              className="w-full"
              placeholder="Todas"
              showClear
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

          <div className="col-12 flex gap-2">
            <Button label="Aplicar filtros" icon="pi pi-filter" onClick={aplicarFiltros} />
            <Button label="Limpiar" icon="pi pi-times" outlined onClick={limpiarFiltros} />
          </div>
        </div>
      </Card>

      <Card className="shadow-2">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <DataTable
          value={casos}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No hay casos disponibles"
        >
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Título" />
          <Column field="especialidad" header="Especialidad" />
          <Column header="Urgencia" body={urgenciaBody} />
          <Column header="Modalidad" body={modalidadBody} />
          <Column field="ciudad" header="Ciudad" />
          <Column header="Estado" body={postuladoBody} />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}