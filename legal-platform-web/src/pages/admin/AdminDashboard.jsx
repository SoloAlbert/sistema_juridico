import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';

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
        <p className="text-700">Resumen operativo y comercial de la plataforma jurídica.</p>
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
                <h3 className="mt-0">Abogados en vivo</h3>
                <h1 className="mb-2">{data.kpis.total_abogados_en_vivo}</h1>
                <small className="text-600">Con ultimo acceso en los ultimos 10 minutos</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Plantillas</h3>
                <h1 className="mb-2">{data.kpis.total_plantillas}</h1>
                <small className="text-600">Total registradas</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-3">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Documentos generados</h3>
                <h1 className="mb-2">{data.kpis.total_documentos_generados}</h1>
                <small className="text-600">Acumulado general</small>
              </Card>
            </div>
          </div>

          <div className="grid mt-2">
            <div className="col-12 md:col-6 lg:col-4">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Compras últimas 30 días</h3>
                <h1 className="mb-2">{data.ultimos_30_dias.compras}</h1>
                <small className="text-600">Plantillas compradas recientemente</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-4">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Ingresos últimos 30 días</h3>
                <h1 className="mb-2">${Number(data.ultimos_30_dias.ingresos || 0).toFixed(2)}</h1>
                <small className="text-600">Ingresos recientes por plantillas</small>
              </Card>
            </div>

            <div className="col-12 md:col-6 lg:col-4">
              <Card className="shadow-2 h-full">
                <h3 className="mt-0">Docs últimos 30 días</h3>
                <h1 className="mb-2">{data.ultimos_30_dias.documentos_generados}</h1>
                <small className="text-600">Documentos generados recientemente</small>
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
              <Card title="Reseñas y calidad" className="shadow-2 h-full">
                <div className="flex flex-column gap-3">
                  <div className="flex justify-content-between align-items-center">
                    <span>Total reseñas</span>
                    <Tag value={data.kpis.total_resenas} severity="info" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Promedio general</span>
                    <Tag value={Number(data.kpis.promedio_calificacion || 0).toFixed(2)} severity="success" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Reseñas 30 días</span>
                    <Tag value={data.ultimos_30_dias.resenas} severity="warning" />
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <span>Promedio 30 días</span>
                    <Tag value={Number(data.ultimos_30_dias.promedio_calificacion || 0).toFixed(2)} severity="success" />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid mt-2">
            <div className="col-12 lg:col-6">
              <Card title="Top plantillas más compradas" className="shadow-2 h-full">
                {!data.top_plantillas_compradas?.length ? (
                  <p>No hay compras registradas todavía.</p>
                ) : (
                  <div className="flex flex-column gap-3">
                    {data.top_plantillas_compradas.map((item, index) => (
                      <div key={item.id_plantilla} className="surface-50 border-round p-3">
                        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <div className="font-semibold">
                              {index + 1}. {item.titulo}
                            </div>
                            <small className="text-600">{item.slug}</small>
                          </div>
                          <div className="text-right">
                            <div><strong>{item.total_compras}</strong> compras</div>
                            <small className="text-600">${Number(item.ingresos || 0).toFixed(2)}</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="Top plantillas por documentos generados" className="shadow-2 h-full">
                {!data.top_plantillas_documentos?.length ? (
                  <p>No hay documentos generados todavía.</p>
                ) : (
                  <div className="flex flex-column gap-3">
                    {data.top_plantillas_documentos.map((item, index) => (
                      <div key={item.id_plantilla} className="surface-50 border-round p-3">
                        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <div className="font-semibold">
                              {index + 1}. {item.titulo}
                            </div>
                            <small className="text-600">{item.slug}</small>
                          </div>
                          <div className="text-right">
                            <div><strong>{item.total_documentos}</strong> documentos</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div className="grid mt-2">
            <div className="col-12">
              <Card title="Actividad admin reciente" className="shadow-2">
                {!data.actividad_reciente?.length ? (
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
