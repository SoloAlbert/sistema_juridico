import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

export default function DetalleCasoDisponiblePage() {
  const { id } = useParams();

  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPostular, setLoadingPostular] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    mensaje_propuesta: '',
    monto_propuesto: '',
    tiempo_estimado_dias: ''
  });

  useEffect(() => {
    obtenerDetalle();
  }, [id]);

  const obtenerDetalle = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get(`/casos/disponibles/${id}`);
      setCaso(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener el caso');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const postularme = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingPostular(true);

    try {
      const payload = {
        mensaje_propuesta: form.mensaje_propuesta,
        monto_propuesto: form.monto_propuesto ? Number(form.monto_propuesto) : null,
        tiempo_estimado_dias: form.tiempo_estimado_dias ? Number(form.tiempo_estimado_dias) : null
      };

      const { data } = await api.post(`/casos/${id}/postularme`, payload);

      setSuccess(data.message || 'Postulación enviada correctamente');

      setForm({
        mensaje_propuesta: '',
        monto_propuesto: '',
        tiempo_estimado_dias: ''
      });

      await obtenerDetalle();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al postularse');
    } finally {
      setLoadingPostular(false);
    }
  };

  const urgenciaTag = (urgencia) => {
    let severity = 'info';
    if (urgencia === 'alta') severity = 'danger';
    if (urgencia === 'media') severity = 'warning';
    if (urgencia === 'baja') severity = 'success';

    return <Tag value={urgencia} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading ? (
        <Card title="Cargando..." />
      ) : caso ? (
        <>
          <Card title={`Detalle del caso: ${caso.folio_caso}`} className="shadow-2 mb-4">
            <div className="grid">
              <div className="col-12 md:col-6">
                <p><strong>Título:</strong> {caso.titulo}</p>
                <p><strong>Especialidad:</strong> {caso.especialidad}</p>
                <p><strong>Urgencia:</strong> {urgenciaTag(caso.urgencia)}</p>
                <p><strong>Ciudad:</strong> {caso.ciudad || '-'}</p>
              </div>

              <div className="col-12 md:col-6">
                <p><strong>Estado:</strong> <Tag value={caso.estado} severity="warning" /></p>
                <p><strong>Modalidad:</strong> {caso.modalidad_preferida}</p>
                <p><strong>Presupuesto:</strong> {caso.presupuesto_min || 0} - {caso.presupuesto_max || 0}</p>
                <p><strong>Fecha límite:</strong> {caso.fecha_limite_respuesta || '-'}</p>
                <p>
                  <strong>Postulación:</strong>{' '}
                  {caso.ya_postulado ? (
                    <Tag value="Ya postulado" severity="success" />
                  ) : (
                    <Tag value="Disponible" severity="info" />
                  )}
                </p>
              </div>

              <div className="col-12">
                <p><strong>Descripción:</strong></p>
                <p>{caso.descripcion}</p>
              </div>
            </div>
          </Card>

          {!caso.ya_postulado && (
            <Card title="Enviar postulación" className="shadow-2">
              <form onSubmit={postularme} className="grid">
                <div className="col-12">
                  <label className="block mb-2">Mensaje de propuesta</label>
                  <InputTextarea
                    value={form.mensaje_propuesta}
                    onChange={(e) => handleChange('mensaje_propuesta', e.target.value)}
                    rows={6}
                    className="w-full"
                    placeholder="Explica por qué eres una buena opción para este caso"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Monto propuesto</label>
                  <InputText
                    value={form.monto_propuesto}
                    onChange={(e) => handleChange('monto_propuesto', e.target.value)}
                    className="w-full"
                    keyfilter="money"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Tiempo estimado (días)</label>
                  <InputText
                    value={form.tiempo_estimado_dias}
                    onChange={(e) => handleChange('tiempo_estimado_dias', e.target.value)}
                    className="w-full"
                    keyfilter="int"
                  />
                </div>

                <div className="col-12">
                  <Button
                    type="submit"
                    label={loadingPostular ? 'Enviando...' : 'Postularme'}
                    icon="pi pi-send"
                    loading={loadingPostular}
                  />
                </div>
              </form>
            </Card>
          )}

          {caso.ya_postulado && (
            <Card className="shadow-2">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-check-circle text-green-500" style={{ fontSize: '1.2rem' }} />
                <span>Ya te postulaste a este caso.</span>
              </div>
            </Card>
          )}

          <Divider />
        </>
      ) : null}
    </DashboardLayout>
  );
}