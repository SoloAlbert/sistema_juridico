import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';

export default function AbogadoDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    resumen: {
      casos_nuevos: 0,
      casos_asignados: 0,
      mensajes_sin_leer: 0,
      reuniones_proximas: 0,
      documentos_recientes: 0,
      ingresos: 0,
      notificaciones_no_leidas: 0,
      tareas_pendientes: 0
    },
    casos_nuevos: [],
    casos_asignados: [],
    proximas_reuniones: [],
    documentos_recientes: [],
    alertas: {
      casos_pendientes_pago: 0
    },
    cumplimiento: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/abogados/dashboard');
      setData(data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar dashboard del abogado');
    } finally {
      setLoading(false);
    }
  };

  const formatoMoneda = (value) => `$${Number(value || 0).toFixed(2)}`;

  const cumplimientoSeverity = (estatus) => {
    if (estatus === 'bloqueado') return 'danger';
    if (estatus === 'restringido') return 'danger';
    if (estatus === 'observado') return 'warning';
    return 'success';
  };

  const tarjetaResumen = (titulo, valor, severity = 'info', onClick = null) => (
    <div className="col-12 md:col-6 lg:col-3">
      <Card className="shadow-2 h-full">
        <div className="flex justify-content-between align-items-start gap-2 mb-3">
          <div>
            <div className="text-600 text-sm mb-2">{titulo}</div>
            <div className="text-3xl font-semibold">{valor}</div>
          </div>
          <Tag value={titulo} severity={severity} />
        </div>
        {onClick && (
          <Button label="Ver detalle" outlined size="small" onClick={onClick} />
        )}
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <AbogadoMenu />

      <div className="mb-4">
        <h1 className="m-0">Panel del abogado</h1>
        <p className="text-700">Casos, mensajes, citas, documentos, ingresos y alertas en un solo tablero.</p>
      </div>

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      {loading ? (
        <Card title="Cargando dashboard..." className="shadow-2" />
      ) : (
        <>
          <div className="grid">
            {tarjetaResumen('Casos nuevos', data.resumen?.casos_nuevos || 0, 'warning', () => navigate('/abogado/casos-disponibles'))}
            {tarjetaResumen('Casos asignados', data.resumen?.casos_asignados || 0, 'info', () => navigate('/abogado/mis-casos'))}
            {tarjetaResumen('Mensajes sin leer', data.resumen?.mensajes_sin_leer || 0, 'danger', () => navigate('/abogado/conversaciones'))}
            {tarjetaResumen('Reuniones proximas', data.resumen?.reuniones_proximas || 0, 'success', () => navigate('/abogado/citas'))}
            {tarjetaResumen('Documentos recientes', data.resumen?.documentos_recientes || 0, 'contrast', () => navigate('/abogado/documentos'))}
            {tarjetaResumen('Ingresos', formatoMoneda(data.resumen?.ingresos || 0), 'success', () => navigate('/abogado/ingresos'))}
            {tarjetaResumen('Notificaciones', data.resumen?.notificaciones_no_leidas || 0, 'warning', () => navigate('/abogado/notificaciones'))}
            {tarjetaResumen('Tareas pendientes', data.resumen?.tareas_pendientes || 0, 'warning')}
          </div>

          {(data.alertas?.casos_pendientes_pago || 0) > 0 && (
            <Message
              severity="warn"
              text={`Tienes ${data.alertas.casos_pendientes_pago} caso(s) asignado(s) pendiente(s) de pago del cliente.`}
              className="w-full mb-4"
            />
          )}

          {data.cumplimiento && (
            <Card title="Estado de cumplimiento" className="shadow-2 mb-4">
              <div className="flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                <div>
                  <div className="text-600 text-sm mb-2">Estatus operativo</div>
                  <div className="text-2xl font-semibold capitalize">{data.cumplimiento.estatus_cumplimiento}</div>
                </div>
                <Tag
                  value={`Score ${Number(data.cumplimiento.reputacion_cumplimiento || 100).toFixed(0)}/100`}
                  severity={cumplimientoSeverity(data.cumplimiento.estatus_cumplimiento)}
                />
              </div>

              <p className="m-0 mb-3 text-700">{data.cumplimiento.motivo}</p>

              <div className="grid">
                <div className="col-12 md:col-3">
                  <div className="surface-100 border-round p-3 h-full">
                    <div className="text-600 text-sm mb-1">Alertas activas</div>
                    <div className="text-2xl font-semibold">{data.cumplimiento.total_alertas_cumplimiento || 0}</div>
                  </div>
                </div>
                <div className="col-12 md:col-3">
                  <div className="surface-100 border-round p-3 h-full">
                    <div className="text-600 text-sm mb-1">Disputas abiertas</div>
                    <div className="text-2xl font-semibold">{data.cumplimiento.total_disputas_abiertas || 0}</div>
                  </div>
                </div>
                <div className="col-12 md:col-3">
                  <div className="surface-100 border-round p-3 h-full">
                    <div className="text-600 text-sm mb-1">Alertas de evasion</div>
                    <div className="text-2xl font-semibold">{data.cumplimiento.alertas_evasion_activas || 0}</div>
                  </div>
                </div>
                <div className="col-12 md:col-3">
                  <div className="surface-100 border-round p-3 h-full">
                    <div className="text-600 text-sm mb-1">Nuevos casos</div>
                    <div className="text-lg font-semibold">
                      {data.cumplimiento.cumplimiento_habilitado_casos ? 'Habilitado' : 'Restringido'}
                    </div>
                  </div>
                </div>
              </div>

              {!data.cumplimiento.cumplimiento_habilitado_casos && (
                <Message
                  severity="warn"
                  text="Mientras tu perfil este restringido o bloqueado no podras tomar nuevos casos. Resuelve tus alertas o disputas con administracion."
                  className="w-full mt-3"
                />
              )}
            </Card>
          )}

          <div className="grid">
            <div className="col-12 lg:col-6">
              <Card title="Casos nuevos" className="shadow-2 h-full">
                {(data.casos_nuevos || []).length === 0 ? (
                  <p>No hay casos nuevos para tus especialidades.</p>
                ) : (
                  data.casos_nuevos.map((item, index) => (
                    <div key={item.id_caso}>
                      <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                          <div className="font-semibold">{item.folio_caso}</div>
                          <div className="text-700">{item.titulo}</div>
                          <small className="text-600">
                            {item.ciudad || '-'}, {item.estado_republica || '-'} | {item.urgencia}
                          </small>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Tag value={item.urgencia} severity="warning" />
                          <Button size="small" label="Ver" outlined onClick={() => navigate('/abogado/casos-disponibles')} />
                        </div>
                      </div>
                      {index < data.casos_nuevos.length - 1 && <Divider />}
                    </div>
                  ))
                )}
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="Casos asignados" className="shadow-2 h-full">
                {(data.casos_asignados || []).length === 0 ? (
                  <p>No tienes casos asignados activos.</p>
                ) : (
                  data.casos_asignados.map((item, index) => (
                    <div key={item.id_caso}>
                      <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                          <div className="font-semibold">{item.folio_caso}</div>
                          <div className="text-700">{item.titulo}</div>
                          <small className="text-600">
                            {item.estado} | servicio {item.estado_servicio} | {formatoMoneda(item.monto_acordado)}
                          </small>
                        </div>
                        <Tag value={item.estado} severity={item.estado === 'en_proceso' ? 'success' : 'info'} />
                      </div>
                      {index < data.casos_asignados.length - 1 && <Divider />}
                    </div>
                  ))
                )}
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="Proximas reuniones" className="shadow-2 h-full">
                {(data.proximas_reuniones || []).length === 0 ? (
                  <p>No hay reuniones proximas.</p>
                ) : (
                  data.proximas_reuniones.map((item, index) => (
                    <div key={item.id_cita}>
                      <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                          <div className="font-semibold">{item.titulo}</div>
                          <div className="text-700">{item.titulo_caso}</div>
                          <small className="text-600">
                            {item.fecha_inicio} | {item.modalidad}
                          </small>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Tag value={item.estado} severity="info" />
                          {item.link_reunion && (
                            <Button
                              size="small"
                              label="Entrar"
                              icon="pi pi-video"
                              outlined
                              onClick={() => window.open(item.link_reunion, '_blank', 'noopener,noreferrer')}
                            />
                          )}
                        </div>
                      </div>
                      {index < data.proximas_reuniones.length - 1 && <Divider />}
                    </div>
                  ))
                )}
              </Card>
            </div>

            <div className="col-12 lg:col-6">
              <Card title="Documentos recientes" className="shadow-2 h-full">
                {(data.documentos_recientes || []).length === 0 ? (
                  <p>No hay documentos recientes.</p>
                ) : (
                  data.documentos_recientes.map((item, index) => (
                    <div key={item.id_documento_generado}>
                      <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                          <div className="font-semibold">{item.titulo_documento}</div>
                          <small className="text-600">
                            Caso #{item.id_caso} | {item.formato_salida} | {item.created_at}
                          </small>
                        </div>
                        <Tag value={item.estatus} severity="success" />
                      </div>
                      {index < data.documentos_recientes.length - 1 && <Divider />}
                    </div>
                  ))
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
