import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function PerfilPublicoAbogadoPage() {
  const { id } = useParams();

  const [abogado, setAbogado] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, [id]);

  const formatearTiempoRespuesta = (minutos) => {
    if (minutos === null || minutos === undefined) {
      return 'Sin datos todavia';
    }

    const totalMinutos = Number(minutos);

    if (totalMinutos < 60) {
      return `${totalMinutos} min`;
    }

    const horas = Math.floor(totalMinutos / 60);
    const minutosRestantes = totalMinutos % 60;

    if (horas < 24) {
      return minutosRestantes > 0 ? `${horas} h ${minutosRestantes} min` : `${horas} h`;
    }

    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return horasRestantes > 0 ? `${dias} d ${horasRestantes} h` : `${dias} d`;
  };

  const obtenerSeverityVerificacion = (estatus) => {
    if (estatus === 'verificado') return 'success';
    if (estatus === 'pendiente') return 'warning';
    if (estatus === 'rechazado') return 'danger';
    if (estatus === 'observado') return 'warning';
    return 'info';
  };

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError('');

      const [perfilRes, resenasRes] = await Promise.all([
        api.get(`/abogados/publicos/${id}`),
        api.get(`/resenas/abogado/${id}`)
      ]);

      setAbogado(perfilRes.data.data);
      setResenas(resenasRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar perfil del abogado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen surface-ground">
      <Navbar />

      <div className="p-4 md:p-6">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        {loading ? (
          <Card className="shadow-2">
            <p>Cargando perfil...</p>
          </Card>
        ) : abogado ? (
          <div className="grid">
            <div className="col-12 lg:col-4">
              <Card title="Resumen profesional" className="shadow-2 mb-4">
                <h2 className="mb-2">
                  {abogado.nombre} {abogado.apellido_paterno || ''} {abogado.apellido_materno || ''}
                </h2>

                <div className="mb-3">
                  <Tag value={abogado.modalidad_atencion} severity="info" />
                  {abogado.badge_verificado && (
                    <Tag value="Verificado" severity="success" className="ml-2" />
                  )}
                  {abogado.estatus_verificacion && (
                    <Tag
                      value={`Estatus: ${abogado.estatus_verificacion}`}
                      severity={obtenerSeverityVerificacion(abogado.estatus_verificacion)}
                      className="ml-2"
                    />
                  )}
                </div>

                <p className="m-0 mb-2"><strong>Despacho:</strong> {abogado.nombre_despacho || 'Independiente'}</p>
                <p className="m-0 mb-2"><strong>Cédula:</strong> {abogado.cedula_profesional || '-'}</p>
                <p className="m-0 mb-2"><strong>Cedula validada:</strong> {abogado.cedula_verificada ? 'Si' : 'No'}</p>
                <p className="m-0 mb-2"><strong>Universidad:</strong> {abogado.universidad || '-'}</p>
                <p className="m-0 mb-2"><strong>Nivel:</strong> {abogado.nivel_academico || '-'}</p>
                <p className="m-0 mb-2"><strong>Experiencia:</strong> {abogado.anos_experiencia} años</p>
                <p className="m-0 mb-2"><strong>Casos atendidos:</strong> {abogado.total_casos || 0}</p>
                <p className="m-0 mb-2"><strong>Tiempo de respuesta:</strong> {formatearTiempoRespuesta(abogado.tiempo_respuesta_promedio_minutos)}</p>
                <p className="m-0 mb-2"><strong>Disponibilidad activa:</strong> {abogado.disponibilidad_activa || 0} horarios</p>
                <p className="m-0 mb-2"><strong>Consulta base:</strong> ${Number(abogado.precio_consulta_base || 0).toFixed(2)} {abogado.moneda}</p>
                <p className="m-0 mb-2"><strong>Consulta gratuita:</strong> {abogado.consulta_gratuita ? 'Si' : 'No'}</p>
                <p className="m-0 mb-2"><strong>Acepta nuevos casos:</strong> {abogado.acepta_nuevos_casos ? 'Si' : 'No'}</p>
                <p className="m-0 mb-2"><strong>Ubicación:</strong> {abogado.ciudad || '-'}, {abogado.estado || '-'}</p>

                <Divider />

                <div className="flex align-items-center gap-2">
                  <Rating value={Number(abogado.rating_promedio || 0)} readOnly cancel={false} />
                  <span className="text-700">({abogado.total_resenas || 0} reseñas)</span>
                </div>

                <Divider />

                <div className="flex flex-column gap-2">
                  <Button
                    label="Registrarme para contratar"
                    icon="pi pi-user-plus"
                    onClick={() => {
                      window.location.href = '/register';
                    }}
                  />
                  <Button
                    label="Iniciar sesión"
                    icon="pi pi-sign-in"
                    outlined
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                  />
                </div>
              </Card>
            </div>

            <div className="col-12 lg:col-8">
              <Card title="Perfil público" className="shadow-2 mb-4">
                <p><strong>Biografía corta:</strong></p>
                <p>{abogado.biografia_corta || '-'}</p>

                <Divider />

                <p><strong>Descripción profesional:</strong></p>
                <p>{abogado.descripcion_profesional || '-'}</p>

                <Divider />

                <p><strong>Especialidades:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {(abogado.especialidades || []).length === 0 ? (
                    <span className="text-700">Sin especialidades cargadas.</span>
                  ) : (
                    abogado.especialidades.map((item, index) => (
                      <Tag
                        key={index}
                        value={`${item.nombre}${item.principal ? ' • principal' : ''}`}
                        severity={item.principal ? 'success' : 'info'}
                      />
                    ))
                  )}
                </div>

                <Divider />

                <p><strong>Contacto visible:</strong></p>
                <p className="m-0"><strong>Email:</strong> {abogado.email || '-'}</p>
                <p className="m-0"><strong>Teléfono:</strong> {abogado.telefono || '-'}</p>
              </Card>

              <Card title="Reseñas de clientes" className="shadow-2">
                {resenas.length === 0 ? (
                  <p>Este abogado aún no tiene reseñas públicas.</p>
                ) : (
                  resenas.map((item) => (
                    <div key={item.id_resena} className="mb-4">
                      <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                        <h4 className="m-0">
                          {item.nombre} {item.apellido_paterno || ''} {item.apellido_materno || ''}
                        </h4>
                        <Rating value={Number(item.calificacion || 0)} readOnly cancel={false} />
                      </div>

                      <p className="mt-3 mb-2">{item.comentario || '-'}</p>

                      {item.respuesta_abogado && (
                        <div className="surface-100 border-round p-3">
                          <p className="m-0"><strong>Respuesta del abogado:</strong></p>
                          <p className="m-0 mt-2">{item.respuesta_abogado}</p>
                        </div>
                      )}

                      <Divider />
                    </div>
                  ))
                )}
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
