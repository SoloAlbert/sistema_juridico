import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';
import { toAbsoluteUrl } from '../../config/runtime';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { InputTextarea } from 'primereact/inputtextarea';
import CasoWorkflowPanel from '../../components/CasoWorkflowPanel';

export default function DetalleCasoAbogadoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [solicitudDocumentos, setSolicitudDocumentos] = useState('');
  const [notaPrivada, setNotaPrivada] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargar();
  }, [id]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/casos/abogado/mis-casos/${id}`);
      setCaso(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener caso');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (estado) => {
    try {
      setSaving(true);
      setError('');
      setInfo('');
      const { data } = await api.patch(`/casos/abogado/mis-casos/${id}/estado`, { estado });
      setInfo(data.message || 'Estado actualizado');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  const pedirDocumentos = async () => {
    try {
      setSaving(true);
      setError('');
      setInfo('');
      const { data } = await api.post(`/casos/abogado/mis-casos/${id}/solicitar-documentos`, {
        mensaje: solicitudDocumentos
      });
      setInfo(data.message || 'Solicitud enviada');
      setSolicitudDocumentos('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al solicitar documentos');
    } finally {
      setSaving(false);
    }
  };

  const guardarNota = async () => {
    try {
      setSaving(true);
      setError('');
      setInfo('');
      const { data } = await api.post(`/casos/abogado/mis-casos/${id}/notas-privadas`, {
        nota: notaPrivada
      });
      setInfo(data.message || 'Nota guardada');
      setNotaPrivada('');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar nota');
    } finally {
      setSaving(false);
    }
  };

  const estadoTag = (value) => {
    let severity = 'info';
    if (value === 'asignado' || value === 'pendiente_pago' || value === 'pagado') severity = 'warning';
    if (value === 'en_proceso') severity = 'success';
    if (value === 'completado' || value === 'finalizado') severity = 'secondary';
    if (value === 'cancelado') severity = 'danger';
    return <Tag value={value} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {info && <Message severity="success" text={info} className="w-full mb-3" />}

      {loading ? (
        <Card title="Cargando..." />
      ) : caso ? (
        <div className="grid">
          <div className="col-12 lg:col-8">
            <Card title={`Gestión del caso: ${caso.folio_caso}`} className="shadow-2 mb-4">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <p><strong>Título:</strong> {caso.titulo}</p>
                  <p><strong>Especialidad:</strong> {caso.especialidad}</p>
                  <p><strong>Urgencia:</strong> {caso.urgencia}</p>
                  <p><strong>Modalidad:</strong> {caso.modalidad_preferida}</p>
                </div>
                <div className="col-12 md:col-6">
                  <p><strong>Estado caso:</strong> {estadoTag(caso.estado)}</p>
                  <p><strong>Estado servicio:</strong> {estadoTag(caso.estado_servicio)}</p>
                  <p><strong>Monto acordado:</strong> ${Number(caso.monto_acordado || 0).toFixed(2)}</p>
                  <p><strong>Comisión:</strong> ${Number(caso.monto_comision || 0).toFixed(2)}</p>
                </div>
                <div className="col-12">
                  <p><strong>Descripción:</strong></p>
                  <p>{caso.descripcion}</p>
                </div>
              </div>

              <Divider />

              <div className="flex gap-2 flex-wrap">
                <Button
                  label="Marcar en proceso"
                  icon="pi pi-play"
                  outlined
                  onClick={() => cambiarEstado('en_proceso')}
                  loading={saving}
                />
                <Button
                  label="Cancelar caso"
                  icon="pi pi-times"
                  severity="danger"
                  outlined
                  onClick={() => cambiarEstado('cancelado')}
                  loading={saving}
                />
                {caso.conversacion && (
                  <Button
                    label="Abrir conversación"
                    icon="pi pi-comments"
                    outlined
                    onClick={() => navigate(`/abogado/conversaciones/${caso.conversacion.id_conversacion}`)}
                  />
                )}
                <Button
                  label="Generar documento"
                  icon="pi pi-file-edit"
                  outlined
                  onClick={() => navigate('/abogado/plantillas')}
                />
                <Button
                  label="Cerrar caso"
                  icon="pi pi-check-circle"
                  severity="success"
                  outlined
                  onClick={() => navigate(`/abogado/casos/${id}/cierre`)}
                />
              </div>
            </Card>

            <CasoWorkflowPanel caseId={id} role="abogado" />

            <Card title="Cliente" className="shadow-2 mb-4">
              <p><strong>Nombre:</strong> {caso.cliente_nombre} {caso.cliente_apellido_paterno || ''} {caso.cliente_apellido_materno || ''}</p>
              <p><strong>Email:</strong> {caso.cliente_email || '-'}</p>
              <p><strong>Teléfono:</strong> {caso.cliente_telefono || '-'}</p>
              <p><strong>Ciudad:</strong> {caso.ciudad || '-'}, {caso.estado_republica || '-'}</p>
            </Card>

            <Card title="Historial del expediente" className="shadow-2 mb-4">
              {(caso.historial || []).length === 0 ? (
                <p>No hay historial disponible.</p>
              ) : (
                caso.historial.map((item, index) => (
                  <div key={item.clave}>
                    <div className="font-semibold">{item.titulo}</div>
                    <div className="text-700 mb-1">{item.descripcion}</div>
                    <small className="text-600">{item.fecha}</small>
                    {index < caso.historial.length - 1 && <Divider />}
                  </div>
                ))
              )}
            </Card>

            <Card title="Mensajes recientes" className="shadow-2 mb-4">
              {(caso.mensajes_recientes || []).length === 0 ? (
                <p>No hay mensajes todavía.</p>
              ) : (
                caso.mensajes_recientes.map((item) => (
                  <div key={item.id_mensaje} className="surface-50 border-round p-3 mb-3">
                    <div className="flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                      <div className="font-semibold">
                        {item.nombre} {item.apellido_paterno || ''} {item.apellido_materno || ''}
                      </div>
                      <Tag value={item.tipo_mensaje} severity={item.tipo_mensaje === 'sistema' ? 'warning' : 'info'} />
                    </div>
                    <div className="text-700">{item.mensaje || '(sin texto)'}</div>
                    <small className="text-600">{item.created_at}</small>
                  </div>
                ))
              )}
            </Card>

            <Card title="Pedir documentos al cliente" className="shadow-2 mb-4">
              <InputTextarea
                value={solicitudDocumentos}
                onChange={(e) => setSolicitudDocumentos(e.target.value)}
                rows={4}
                className="w-full mb-3"
                placeholder="Ej. Comparte identificación oficial y comprobante relacionado con el caso."
              />
              <Button
                label="Enviar solicitud"
                icon="pi pi-send"
                onClick={pedirDocumentos}
                loading={saving}
              />
            </Card>

            <Card title="Notas privadas" className="shadow-2">
              <InputTextarea
                value={notaPrivada}
                onChange={(e) => setNotaPrivada(e.target.value)}
                rows={4}
                className="w-full mb-3"
                placeholder="Anota estrategia, pendientes o información interna del caso."
              />
              <Button
                label="Guardar nota"
                icon="pi pi-save"
                onClick={guardarNota}
                loading={saving}
              />

              <Divider />

              {(caso.notas_privadas || []).length === 0 ? (
                <p>No hay notas privadas todavía.</p>
              ) : (
                caso.notas_privadas.map((item) => (
                  <div key={item.id_nota_privada} className="surface-50 border-round p-3 mb-3">
                    <div className="text-700 mb-2">{item.nota}</div>
                    <small className="text-600">{item.created_at}</small>
                  </div>
                ))
              )}
            </Card>
          </div>

          <div className="col-12 lg:col-4">
            <Card title="Archivos del caso" className="shadow-2 mb-4">
              {(caso.archivos || []).length === 0 ? (
                <p>No hay archivos del cliente.</p>
              ) : (
                caso.archivos.map((item) => (
                  <div key={item.id_archivo} className="mb-3">
                    <a href={toAbsoluteUrl(item.ruta_archivo)} target="_blank" rel="noreferrer" className="text-primary">
                      {item.nombre_archivo}
                    </a>
                  </div>
                ))
              )}
            </Card>

            <Card title="Documentos generados" className="shadow-2 mb-4">
              {(caso.documentos || []).length === 0 ? (
                <p>No has generado documentos para este caso.</p>
              ) : (
                caso.documentos.map((item) => (
                  <div key={item.id_documento_generado} className="mb-3">
                    <div className="font-semibold">{item.titulo_documento}</div>
                    <small className="text-600">{item.formato_salida} · {item.estatus}</small>
                  </div>
                ))
              )}
            </Card>

            <Card title="Pagos y comisiones" className="shadow-2 mb-4">
              {(caso.pagos || []).length === 0 ? (
                <p>No hay pagos registrados.</p>
              ) : (
                caso.pagos.map((item) => (
                  <div key={item.id_pago} className="mb-3">
                    <div><strong>Bruto:</strong> ${Number(item.monto_bruto || 0).toFixed(2)}</div>
                    <div><strong>Comisión:</strong> ${Number(item.monto_comision || 0).toFixed(2)}</div>
                    <div><strong>Neto:</strong> ${Number(item.monto_neto_abogado || 0).toFixed(2)}</div>
                    <small className="text-600">{item.fecha_pago || '-'}</small>
                  </div>
                ))
              )}
            </Card>

            <Card title="Reuniones" className="shadow-2">
              {(caso.citas || []).length === 0 ? (
                <p>No hay reuniones registradas.</p>
              ) : (
                caso.citas.map((item) => (
                  <div key={item.id_cita} className="mb-3">
                    <div className="font-semibold">{item.titulo}</div>
                    <small className="text-600">{item.fecha_inicio} · {item.modalidad} · {item.estado}</small>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
