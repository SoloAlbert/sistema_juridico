import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import api from '../../api/axios';
import { toAbsoluteUrl } from '../../config/runtime';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import CasoWorkflowPanel from '../../components/CasoWorkflowPanel';

export default function DetalleCasoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caso, setCaso] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asignandoId, setAsignandoId] = useState(null);
  const [mensajeAsignacion, setMensajeAsignacion] = useState('');

  useEffect(() => {
    obtenerDetalle();
  }, [id]);

  const obtenerDetalle = async () => {
    try {
      const [casoRes, archivosRes] = await Promise.all([
        api.get(`/casos/mis-casos/${id}`),
        api.get(`/cliente/casos/${id}/archivos`)
      ]);

      setCaso(casoRes.data.data);
      setArchivos(archivosRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener el detalle del caso');
    } finally {
      setLoading(false);
    }
  };

  const asignarAbogado = async (postulacion) => {
    try {
      setMensajeAsignacion('');
      setAsignandoId(postulacion.id_abogado);

        const { data } = await api.post(`/casos/${id}/asignar-abogado`, {
        id_abogado: postulacion.id_abogado,
        monto_acordado: postulacion.monto_propuesto,
        porcentaje_comision: 10
      });

      setMensajeAsignacion(data.message || 'Abogado asignado correctamente');
      await obtenerDetalle();
    } catch (err) {
      setMensajeAsignacion(err.response?.data?.message || 'Error al asignar abogado');
    } finally {
      setAsignandoId(null);
    }
  };

  const estadoTag = (estado) => {
    let severity = 'info';
    if (estado === 'publicado') severity = 'warning';
    if (estado === 'asignado') severity = 'info';
    if (estado === 'en_proceso') severity = 'success';
    if (estado === 'finalizado') severity = 'secondary';
    if (estado === 'cancelado') severity = 'danger';

    return <Tag value={estado} severity={severity} />;
  };

  const seguimientoTag = (estado) => {
    let severity = 'secondary';
    if (estado === 'completado') severity = 'success';
    if (estado === 'actual') severity = 'info';
    if (estado === 'pendiente') severity = 'warning';
    return <Tag value={estado} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <ClienteMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {mensajeAsignacion && <Message severity="info" text={mensajeAsignacion} className="w-full mb-3" />}

      {loading ? (
        <Card title="Cargando..." />
      ) : caso ? (
        <>
          <Card title={`Detalle del caso: ${caso.folio_caso}`} className="shadow-2 mb-4">
            <div className="grid">
              <div className="col-12 md:col-6">
                <p><strong>Título:</strong> {caso.titulo}</p>
                <p><strong>Especialidad:</strong> {caso.especialidad}</p>
                <p><strong>Urgencia:</strong> {caso.urgencia}</p>
                <p><strong>Ciudad:</strong> {caso.ciudad || '-'}</p>
              </div>

              <div className="col-12 md:col-6">
                <p><strong>Estado:</strong> {estadoTag(caso.estado)}</p>
                <p><strong>Modalidad:</strong> {caso.modalidad_preferida}</p>
                <p><strong>Presupuesto:</strong> {caso.presupuesto_min || 0} - {caso.presupuesto_max || 0}</p>
                <p><strong>Fecha límite:</strong> {caso.fecha_limite_respuesta || '-'}</p>
              </div>

              <div className="col-12">
                <p><strong>Descripción:</strong></p>
                <p>{caso.descripcion}</p>
              </div>

              {caso.estado === 'asignado' && (
                <div className="col-12">
                  <Button
                    label="Pagar caso"
                    icon="pi pi-credit-card"
                    severity="success"
                    onClick={() => navigate(`/cliente/mis-casos/${id}/pago`)}
                  />
                </div>
              )}
              {(caso.seguimiento?.documentos || []).length > 0 && (
                <div className="col-12">
                  <Divider />
                  <p className="font-semibold mb-3">Documentos generados</p>
                  {caso.seguimiento.documentos.map((item) => (
                    <div key={item.id_documento_generado} className="surface-50 border-round p-3 mb-3">
                      <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <div className="font-semibold">{item.titulo_documento}</div>
                          <small className="text-600">
                            {item.formato_salida} · {item.estatus} · {item.created_at}
                          </small>
                        </div>
                        <Tag value={item.estatus} severity="success" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {['asignado', 'en_proceso', 'finalizado'].includes(caso.estado) && (
            <CasoWorkflowPanel caseId={id} role="cliente" />
          )}

          <Card title="Seguimiento del caso" className="shadow-2 mb-4">
            <div className="grid">
              <div className="col-12 md:col-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="text-600 text-sm mb-2">Estado actual</div>
                  <div>{estadoTag(caso.seguimiento?.estado_actual || caso.estado)}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="text-600 text-sm mb-2">Postulaciones</div>
                  <div className="text-2xl font-semibold">{caso.seguimiento?.total_postulaciones || 0}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="text-600 text-sm mb-2">Documentos generados</div>
                  <div className="text-2xl font-semibold">{caso.seguimiento?.total_documentos_generados || 0}</div>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="text-600 text-sm mb-2">Citas</div>
                  <div className="text-2xl font-semibold">{caso.seguimiento?.total_citas || 0}</div>
                </div>
              </div>

              <div className="col-12">
                <div className="flex gap-2 flex-wrap mb-3">
                  {caso.seguimiento?.conversacion && (
                    <Button
                      label="Abrir conversación"
                      icon="pi pi-comments"
                      outlined
                      onClick={() => navigate(`/cliente/conversaciones/${caso.seguimiento.conversacion.id_conversacion}`)}
                    />
                  )}
                  {(caso.seguimiento?.citas || []).length > 0 && (
                    <Button
                      label="Ver citas"
                      icon="pi pi-calendar"
                      outlined
                      onClick={() => navigate('/cliente/citas')}
                    />
                  )}
                </div>
              </div>

              <div className="col-12">
                {!caso.seguimiento?.timeline || caso.seguimiento.timeline.length === 0 ? (
                  <p>No hay movimientos de seguimiento todavía.</p>
                ) : (
                  caso.seguimiento.timeline.map((item, index) => (
                    <div key={item.clave}>
                      <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                          <div className="font-semibold mb-1">{item.titulo}</div>
                          <div className="text-700 mb-1">{item.descripcion}</div>
                          <small className="text-500">{item.fecha || 'Sin fecha registrada'}</small>
                        </div>
                        <div>{seguimientoTag(item.estado)}</div>
                      </div>
                      {index < caso.seguimiento.timeline.length - 1 && <Divider />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card title="Archivos del caso" className="shadow-2 mb-4">
            {archivos.length === 0 ? (
              <p>No hay archivos adjuntos todavia.</p>
            ) : (
              archivos.map((item) => (
                <div key={item.id_archivo} className="surface-50 border-round p-3 mb-3">
                  <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <div className="font-semibold">{item.nombre_archivo}</div>
                      <small className="text-600">
                        {item.mime_type || 'archivo'} · {item.tamano_bytes || 0} bytes
                      </small>
                    </div>

                    <a
                      href={toAbsoluteUrl(item.ruta_archivo)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary"
                    >
                      Ver archivo
                    </a>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card title="Abogados sugeridos para este caso" className="shadow-2 mb-4">
            {!caso.abogados_sugeridos || caso.abogados_sugeridos.length === 0 ? (
              <p>No hay sugerencias disponibles por el momento.</p>
            ) : (
              caso.abogados_sugeridos.map((item) => (
                <div key={item.id_abogado} className="surface-50 border-round p-3 mb-3">
                  <div className="grid">
                    <div className="col-12 md:col-8">
                      <div className="flex align-items-center gap-2 flex-wrap mb-2">
                        <h3 className="m-0">
                          {item.nombre} {item.apellido_paterno} {item.apellido_materno}
                        </h3>
                        {item.badge_verificado && <Tag value="Verificado" severity="success" />}
                        <Tag value={`Match ${item.puntaje_match}`} severity="info" />
                      </div>
                      <p className="m-0"><strong>Despacho:</strong> {item.nombre_despacho || '-'}</p>
                      <p className="m-0"><strong>Ubicación:</strong> {item.ciudad || '-'}, {item.estado || '-'}</p>
                      <p className="m-0"><strong>Experiencia:</strong> {item.anos_experiencia} años</p>
                      <p className="m-0"><strong>Casos atendidos:</strong> {item.total_casos}</p>
                      <p className="m-0"><strong>Calificación:</strong> {item.rating_promedio} ({item.total_resenas} reseñas)</p>
                      <p className="m-0"><strong>Disponibilidad activa:</strong> {item.disponibilidad_activa}</p>
                      <p className="m-0"><strong>Modalidad:</strong> {item.modalidad_atencion}</p>
                      <p className="m-0"><strong>Precio orientativo:</strong> ${item.precio_consulta_base.toFixed(2)} {item.moneda}</p>
                      <p className="mt-2 mb-0">{item.biografia_corta || 'Sin biografía breve.'}</p>
                    </div>

                    <div className="col-12 md:col-4 flex align-items-start md:justify-content-end">
                      <Button
                        label="Ver perfil"
                        icon="pi pi-external-link"
                        outlined
                        onClick={() => navigate(`/abogados/${item.id_abogado}`)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card title="Postulaciones recibidas" className="shadow-2">
            {!caso.postulaciones || caso.postulaciones.length === 0 ? (
              <p>No hay postulaciones todavía.</p>
            ) : (
              caso.postulaciones.map((item) => (
                <div key={item.id_postulacion}>
                  <div className="grid">
                    <div className="col-12 md:col-8">
                      <h3 className="mb-2">
                        {item.nombre} {item.apellido_paterno} {item.apellido_materno}
                      </h3>
                      <p className="m-0"><strong>Despacho:</strong> {item.nombre_despacho || '-'}</p>
                      <p className="m-0"><strong>Experiencia:</strong> {item.anos_experiencia} años</p>
                      <p className="m-0"><strong>Modalidad:</strong> {item.modalidad_atencion}</p>
                      <p className="m-0"><strong>Calificación:</strong> {item.rating_promedio} ({item.total_resenas} reseñas)</p>
                      <p><strong>Propuesta:</strong> {item.mensaje_propuesta || '-'}</p>
                    </div>

                    <div className="col-12 md:col-4">
                      <p><strong>Monto propuesto:</strong> {item.monto_propuesto || 0}</p>
                      <p><strong>Tiempo estimado:</strong> {item.tiempo_estimado_dias || '-'} días</p>
                      <p><strong>Estado:</strong> <Tag value={item.estado} /></p>

                      {caso.estado === 'publicado' && item.estado === 'enviada' && (
                        <Button
                          label={asignandoId === item.id_abogado ? 'Asignando...' : 'Asignar abogado'}
                          icon="pi pi-check"
                          loading={asignandoId === item.id_abogado}
                          onClick={() => asignarAbogado(item)}
                        />
                      )}
                    </div>
                  </div>
                  <Divider />
                </div>
              ))
            )}
          </Card>
        </>
      ) : null}
    </DashboardLayout>
  );
}
