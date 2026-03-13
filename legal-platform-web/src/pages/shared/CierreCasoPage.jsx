import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import AbogadoMenu from '../../components/AbogadoMenu';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';

export default function CierreCasoPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompletar, setLoadingCompletar] = useState(false);
  const [loadingResena, setLoadingResena] = useState(false);
  const [loadingRespuesta, setLoadingRespuesta] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [respuestaAbogado, setRespuestaAbogado] = useState('');

  useEffect(() => {
    obtenerDetalle();
  }, [id]);

  const obtenerDetalle = async () => {
    try {
      const { data } = await api.get(`/resenas/caso/${id}`);
      setCaso(data.data);

      if (data.data?.resena?.respuesta_abogado) {
        setRespuestaAbogado(data.data.resena.respuesta_abogado);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener el detalle del caso');
    } finally {
      setLoading(false);
    }
  };

  const completarCaso = async () => {
    try {
      setLoadingCompletar(true);
      setError('');
      setSuccess('');

      const { data } = await api.patch(`/resenas/caso/${id}/completar`);
      setSuccess(data.message || 'Caso completado correctamente');
      await obtenerDetalle();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al completar el caso');
    } finally {
      setLoadingCompletar(false);
    }
  };

  const guardarResena = async (e) => {
    e.preventDefault();

    try {
      setLoadingResena(true);
      setError('');
      setSuccess('');

      const { data } = await api.post(`/resenas/caso/${id}`, {
        calificacion,
        comentario
      });

      setSuccess(data.message || 'Reseña creada correctamente');
      await obtenerDetalle();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar reseña');
    } finally {
      setLoadingResena(false);
    }
  };

  const guardarRespuesta = async (e) => {
    e.preventDefault();

    try {
      setLoadingRespuesta(true);
      setError('');
      setSuccess('');

      const { data } = await api.patch(`/resenas/${caso.resena.id_resena}/responder`, {
        respuesta_abogado
      });

      setSuccess(data.message || 'Respuesta guardada correctamente');
      await obtenerDetalle();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al responder reseña');
    } finally {
      setLoadingRespuesta(false);
    }
  };

  const menu = user?.role === 'cliente' ? <ClienteMenu /> : <AbogadoMenu />;

  const estadoCasoTag = (estado) => {
    let severity = 'info';
    if (estado === 'en_proceso') severity = 'success';
    if (estado === 'finalizado') severity = 'secondary';
    if (estado === 'asignado') severity = 'warning';
    return <Tag value={estado} severity={severity} />;
  };

  const estadoServicioTag = (estado) => {
    let severity = 'info';
    if (estado === 'pagado') severity = 'success';
    if (estado === 'completado') severity = 'secondary';
    if (estado === 'pendiente_pago') severity = 'warning';
    return <Tag value={estado} severity={severity} />;
  };

  return (
    <DashboardLayout>
      {menu}

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading ? (
        <Card title="Cargando..." />
      ) : caso ? (
        <>
          <Card title={`Cierre del caso: ${caso.folio_caso}`} className="shadow-2 mb-4">
            <div className="grid">
              <div className="col-12 md:col-6">
                <p><strong>Título:</strong> {caso.titulo}</p>
                <p><strong>Estado del caso:</strong> {estadoCasoTag(caso.estado)}</p>
                <p><strong>Estado del servicio:</strong> {estadoServicioTag(caso.estado_servicio)}</p>
              </div>

              <div className="col-12 md:col-6">
                <p><strong>Monto acordado:</strong> {Number(caso.monto_acordado || 0).toFixed(2)}</p>
                <p><strong>Comisión:</strong> {Number(caso.monto_comision || 0).toFixed(2)}</p>
                <p><strong>Neto abogado:</strong> {Number(caso.monto_neto_abogado || 0).toFixed(2)}</p>
              </div>

              <div className="col-12">
                <p><strong>Descripción:</strong></p>
                <p>{caso.descripcion}</p>
              </div>

              {caso.estado === 'en_proceso' && (
                <div className="col-12">
                  <Button
                    label={loadingCompletar ? 'Completando...' : 'Marcar caso como completado'}
                    icon="pi pi-check-circle"
                    severity="success"
                    loading={loadingCompletar}
                    onClick={completarCaso}
                  />
                </div>
              )}
            </div>
          </Card>

          {user?.role === 'cliente' && caso.estado === 'finalizado' && !caso.resena && (
            <Card title="Dejar reseña" className="shadow-2 mb-4">
              <form onSubmit={guardarResena} className="grid">
                <div className="col-12">
                  <label className="block mb-2">Calificación</label>
                  <Rating value={calificacion} onChange={(e) => setCalificacion(e.value)} cancel={false} />
                </div>

                <div className="col-12">
                  <label className="block mb-2">Comentario</label>
                  <InputTextarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={5}
                    className="w-full"
                  />
                </div>

                <div className="col-12">
                  <Button
                    type="submit"
                    label={loadingResena ? 'Guardando...' : 'Guardar reseña'}
                    icon="pi pi-star"
                    loading={loadingResena}
                  />
                </div>
              </form>
            </Card>
          )}

          {caso.resena && (
            <Card title="Reseña del caso" className="shadow-2">
              <div className="mb-3">
                <Rating value={caso.resena.calificacion} readOnly cancel={false} />
              </div>

              <p><strong>Comentario:</strong></p>
              <p>{caso.resena.comentario || '-'}</p>

              {caso.resena.respuesta_abogado ? (
                <>
                  <Divider />
                  <p><strong>Respuesta del abogado:</strong></p>
                  <p>{caso.resena.respuesta_abogado}</p>
                </>
              ) : null}

              {user?.role === 'abogado' && (
                <>
                  <Divider />
                  <form onSubmit={guardarRespuesta}>
                    <label className="block mb-2">Responder reseña</label>
                    <InputTextarea
                      value={respuestaAbogado}
                      onChange={(e) => setRespuestaAbogado(e.target.value)}
                      rows={4}
                      className="w-full mb-3"
                    />

                    <Button
                      type="submit"
                      label={loadingRespuesta ? 'Guardando...' : 'Guardar respuesta'}
                      icon="pi pi-reply"
                      loading={loadingRespuesta}
                    />
                  </form>
                </>
              )}
            </Card>
          )}
        </>
      ) : null}
    </DashboardLayout>
  );
}