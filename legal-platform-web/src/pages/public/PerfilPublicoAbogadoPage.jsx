import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import { useAuth } from '../../context/AuthContext';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function PerfilPublicoAbogadoPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

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

  const contenido = (
      <main className="public-shell">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        {loading ? (
          <Card className="shadow-2">
            <p>Cargando perfil...</p>
          </Card>
        ) : abogado ? (
          <>
            <section className="lawyer-hero">
              <div className="lawyer-hero__main">
                <div className="lawyer-hero__eyebrow">Perfil profesional</div>
                <h1 className="lawyer-hero__name">
                  {abogado.nombre} {abogado.apellido_paterno || ''} {abogado.apellido_materno || ''}
                </h1>
                <p className="lawyer-hero__summary">
                  {abogado.biografia_corta || 'Perfil legal con atencion profesional y criterios claros de contratacion.'}
                </p>

                <div className="lawyer-hero__tags">
                  <Tag value={abogado.modalidad_atencion} severity="info" />
                  {abogado.badge_verificado && (
                    <Tag value="Abogado verificado" severity="success" />
                  )}
                  {abogado.cedula_verificada && (
                    <Tag value="Cedula validada" severity="warning" />
                  )}
                </div>

                <div className="lawyer-hero__stats">
                  <div>
                    <strong>{abogado.total_casos || 0}</strong>
                    <span>Casos atendidos</span>
                  </div>
                  <div>
                    <strong>{Number(abogado.rating_promedio || 0).toFixed(1)}</strong>
                    <span>Calificacion media</span>
                  </div>
                  <div>
                    <strong>{abogado.total_resenas || 0}</strong>
                    <span>Resenas verificadas</span>
                  </div>
                </div>
              </div>

              <div className="lawyer-hero__aside">
                <Card className="public-card shadow-2">
                  <div className="lawyer-hero__trust-title">Confianza y contratacion</div>
                  <p className="lawyer-hero__trust-copy">
                    Este perfil muestra informacion profesional, experiencia visible y validaciones para que el cliente decida con mas certeza.
                  </p>

                  <div className="lawyer-hero__trust-list">
                    <span>Despacho: {abogado.nombre_despacho || 'Independiente'}</span>
                    <span>Cedula: {abogado.cedula_profesional || '-'}</span>
                    <span>Universidad: {abogado.universidad || '-'}</span>
                    <span>Experiencia: {abogado.anos_experiencia} anos</span>
                    <span>Tiempo de respuesta: {formatearTiempoRespuesta(abogado.tiempo_respuesta_promedio_minutos)}</span>
                    <span>Consulta base: ${Number(abogado.precio_consulta_base || 0).toFixed(2)} {abogado.moneda}</span>
                    <span>Cumplimiento: {Number(abogado.reputacion_cumplimiento || 100).toFixed(0)}/100</span>
                    <span>Estatus operativo: {abogado.estatus_cumplimiento || 'normal'}</span>
                  </div>

                  <div className="lawyer-hero__cta">
                    {!isAuthenticated && (
                      <>
                        <Button
                          label="Registrarme para contratar"
                          icon="pi pi-user-plus"
                          onClick={() => {
                            window.location.href = '/register';
                          }}
                        />
                        <Button
                          label="Iniciar sesion"
                          icon="pi pi-sign-in"
                          outlined
                          onClick={() => {
                            window.location.href = '/login';
                          }}
                        />
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </section>

            <section className="public-grid">
              <Card className="public-card shadow-2">
                <h3>Descripcion profesional</h3>
                <p>{abogado.descripcion_profesional || '-'}</p>

                <Divider />

                <h3>Especialidades</h3>
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
              </Card>

              <Card className="public-card shadow-2">
                <h3>Ficha profesional</h3>
                <p><strong>Cedula validada:</strong> {abogado.cedula_verificada ? 'Si' : 'No'}</p>
                <p><strong>Nivel academico:</strong> {abogado.nivel_academico || '-'}</p>
                <p><strong>Ubicacion:</strong> {abogado.ciudad || '-'}, {abogado.estado || '-'}</p>
                <p><strong>Consulta gratuita:</strong> {abogado.consulta_gratuita ? 'Si' : 'No'}</p>
                <p><strong>Acepta nuevos casos:</strong> {abogado.acepta_nuevos_casos ? 'Si' : 'No'}</p>
                <p><strong>Disponibilidad activa:</strong> {abogado.disponibilidad_activa || 0} horarios</p>
                <p><strong>Alertas activas:</strong> {abogado.total_alertas_cumplimiento || 0}</p>
                <p><strong>Disputas abiertas:</strong> {abogado.total_disputas_abiertas || 0}</p>

                {abogado.badge_verificado && (
                  <Message
                    severity="success"
                    text="Este abogado ya paso validacion documental y revision profesional."
                    className="w-full mt-3"
                  />
                )}

                <Divider />

                <div className="flex align-items-center gap-2">
                  <Rating value={Number(abogado.rating_promedio || 0)} readOnly cancel={false} />
                  <span className="text-700">({abogado.total_resenas || 0} resenas)</span>
                </div>
              </Card>
            </section>

            <section className="public-section">
              <Card className="public-card shadow-2">
                <h2>Resenas de clientes</h2>
                {resenas.length === 0 ? (
                  <p>Este abogado aun no tiene resenas publicas.</p>
                ) : (
                  <div className="flex flex-column gap-3">
                    {resenas.map((item) => (
                      <div key={item.id_resena} className="public-review">
                        <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                          <h4 className="m-0">
                            {item.nombre} {item.apellido_paterno || ''} {item.apellido_materno || ''}
                          </h4>
                          <Rating value={Number(item.calificacion || 0)} readOnly cancel={false} />
                        </div>

                        <p className="mt-3 mb-2">{item.comentario || '-'}</p>

                        {item.respuesta_abogado && (
                          <div className="public-review__reply">
                            <p className="m-0"><strong>Respuesta del abogado:</strong></p>
                            <p className="m-0 mt-2">{item.respuesta_abogado}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </>
        ) : null}
      </main>
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
    <div className="public-scene">
      <Navbar />
      {contenido}
    </div>
  );
}
