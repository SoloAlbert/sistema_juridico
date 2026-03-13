import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const accionSeverity = (accion) => {
    if (accion === 'crear') return 'success';
    if (accion === 'actualizar') return 'warning';
    if (accion === 'clonar') return 'contrast';
    if (accion === 'guardar_sugerencia') return 'info';
    if (accion === 'enviar_papelera') return 'danger';
    if (accion === 'restaurar') return 'success';
    return 'secondary';
  };

  const nombreUsuario = (row) =>
    `${row.nombre || ''} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim();

  return (
    <DashboardLayout>
      <AdminMenu />

      <div className="mb-4">
        <h1 className="m-0">Dashboard admin</h1>
        <p className="text-700">Resumen operativo de la plataforma jurídica.</p>
      </div>

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      {loading ? (
        <Card><p>Cargando dashboard...</p></Card>
      ) : data ? (
        <>
          <div className="grid">
            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Abogados</h3>
                <h1 className="mb-2">{data.kpis.total_abogados}</h1>
                <small className="text-600">Usuarios con rol abogado</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Clientes</h3>
                <h1 className="mb-2">{data.kpis.total_clientes}</h1>
                <small className="text-600">Usuarios con rol cliente</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Plantillas</h3>
                <h1 className="mb-2">{data.kpis.total_plantillas}</h1>
                <small className="text-600">Total de plantillas registradas</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Documentos generados</h3>
                <h1 className="mb-2">{data.kpis.total_documentos_generados}</h1>
                <small className="text-600">Archivos generados por abogados</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Compras</h3>
                <h1 className="mb-2">{data.kpis.total_compras}</h1>
                <small className="text-600">Compras de plantillas</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Ingresos plantillas</h3>
                <h1 className="mb-2">${Number(data.kpis.ingresos_plantillas || 0).toFixed(2)}</h1>
                <small className="text-600">Ingresos acumulados por compras</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Bloques HTML</h3>
                <h1 className="mb-2">{data.kpis.total_bloques}</h1>
                <small className="text-600">Componentes reutilizables</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Plantillas maestras</h3>
                <h1 className="mb-2">{data.kpis.total_maestras}</h1>
                <small className="text-600">Estructuras base reutilizables</small>
              </Card>
            </div>
          </div>

          <div className="grid mt-2">
            <div className="col-12 lg:col-4">
              <Card title="Estado de plantillas" className="shadow-2 h-full">
                <div className="flex flex-column gap-3">
                  <div className="flex justify-content-between align-items-center">
                    <span>Publicadas</span>
                    <Tag value={data.plantillas.publicadas} severity="success" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Borradores</span>
                    <Tag value={data.plantillas.borradores} severity="warning" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Archivadas</span>
                    <Tag value={data.plantillas.archivadas} severity="secondary" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>En papelera</span>
                    <Tag value={data.plantillas.en_papelera} severity="danger" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Card title="Otros módulos" className="shadow-2 h-full">
                <div className="flex flex-column gap-3">
                  <div className="flex justify-content-between align-items-center">
                    <span>Bloques en papelera</span>
                    <Tag value={data.bloques.en_papelera} severity="danger" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Maestras en papelera</span>
                    <Tag value={data.maestras.en_papelera} severity="danger" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Tipos en papelera</span>
                    <Tag value={data.tipos_documento.en_papelera} severity="danger" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Tipos documento</span>
                    <Tag value={data.kpis.total_tipos_documento} severity="info" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Card title="Calidad y reseñas" className="shadow-2 h-full">
                <div className="flex flex-column gap-3">
                  <div className="flex justify-content-between align-items-center">
                    <span>Total reseñas</span>
                    <Tag value={data.kpis.total_resenas} severity="info" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Promedio</span>
                    <Tag value={Number(data.kpis.promedio_calificacion || 0).toFixed(2)} severity="success" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Admins</span>
                    <Tag value={data.kpis.total_admins} severity="contrast" />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid mt-2">
            <div className="col-12">
              <Card title="Actividad admin reciente" className="shadow-2">
                {data.actividad_reciente?.length === 0 ? (
                  <p>No hay actividad reciente.</p>
                ) : (
                  <div className="flex flex-column gap-3">
                    {data.actividad_reciente.map((item) => (
                      <div
                        key={item.id_bitacora}
                        className="surface-50 border-round p-3 flex justify-content-between align-items-center flex-wrap gap-2"
                      >
                        <div>
                          <div className="font-semibold">{item.descripcion}</div>
                          <small className="text-600">
                            {nombreUsuario(item)} · {item.modulo} · {item.entidad} · {item.created_at}
                          </small>
                        </div>

                        <Tag value={item.accion} severity={accionSeverity(item.accion)} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}