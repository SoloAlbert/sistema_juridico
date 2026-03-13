import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function DetalleCasoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asignandoId, setAsignandoId] = useState(null);
  const [mensajeAsignacion, setMensajeAsignacion] = useState('');

  useEffect(() => {
    obtenerDetalle();
  }, [id]);

  const obtenerDetalle = async () => {
    try {
      const { data } = await api.get(`/casos/mis-casos/${id}`);
      setCaso(data.data);
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
        porcentaje_comision: 3
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
            </div>
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