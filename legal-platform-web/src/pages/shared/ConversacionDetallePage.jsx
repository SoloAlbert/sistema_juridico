import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import AbogadoMenu from '../../components/AbogadoMenu';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { FileUpload } from 'primereact/fileupload';

export default function ConversacionDetallePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [conversacion, setConversacion] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    obtenerMensajes();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const obtenerMensajes = async () => {
    try {
      const { data } = await api.get(`/conversaciones/${id}/mensajes`);
      setConversacion(data.conversacion);
      setMensajes(data.mensajes);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener mensajes');
    } finally {
      setLoading(false);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() && archivos.length === 0) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('mensaje', mensaje.trim());

      archivos.forEach((archivo) => {
        formData.append('archivos', archivo);
      });

      await api.post(`/conversaciones/${id}/mensajes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMensaje('');
      setArchivos([]);
      await obtenerMensajes();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const menu = user?.role === 'cliente' ? <ClienteMenu /> : <AbogadoMenu />;

  const baseRuta = user?.role === 'cliente' ? '/cliente' : '/abogado';

  return (
    <DashboardLayout>
      {menu}

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <Card
        title={conversacion ? `Conversación - ${conversacion.folio_caso}` : 'Conversación'}
        subTitle={conversacion?.titulo || ''}
        className="shadow-2"
      >
        {loading ? (
          <p>Cargando mensajes...</p>
        ) : (
          <>
            <div className="flex justify-content-end gap-2 mb-3 flex-wrap">
              <Button
                label="Ir a citas"
                icon="pi pi-calendar"
                outlined
                onClick={() => navigate(`${baseRuta}/citas`)}
              />
              <Button
                label="Cierre del caso"
                icon="pi pi-check-circle"
                severity="success"
                outlined
                onClick={() => navigate(`${baseRuta}/casos/${conversacion.id_caso}/cierre`)}
              />
            </div>

            <div
              className="surface-50 border-round p-3 mb-3"
              style={{ maxHeight: '420px', overflowY: 'auto' }}
            >
              {mensajes.length === 0 ? (
                <p>No hay mensajes todavía.</p>
              ) : (
                mensajes.map((item) => {
                  const mio = item.id_remitente === user?.id_usuario;

                  return (
                    <div
                      key={item.id_mensaje}
                      className={`mb-3 flex ${mio ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className={`p-3 border-round ${mio ? 'bg-blue-100' : 'surface-card border-1 surface-border'}`}
                        style={{ maxWidth: '70%' }}
                      >
                        <div className="text-sm text-600 mb-2">
                          {item.nombre} {item.apellido_paterno || ''} {item.apellido_materno || ''}
                        </div>
                        {item.mensaje && <div>{item.mensaje}</div>}
                        {(item.archivos || []).length > 0 && (
                          <div className="mt-3 flex flex-column gap-2">
                            {item.archivos.map((archivo) => (
                              <a
                                key={archivo.id_mensaje_archivo}
                                href={`http://localhost:3003${archivo.ruta_archivo}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary no-underline"
                              >
                                <i className="pi pi-paperclip mr-2" />
                                {archivo.nombre_archivo}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-500 mt-2">{item.created_at}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <Divider />

            <form onSubmit={enviarMensaje} className="grid">
              <div className="col-12">
                <label className="block mb-2">Escribe un mensaje</label>
                <InputTextarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <label className="block mb-2">Adjuntar archivos</label>
                <FileUpload
                  mode="basic"
                  name="archivos"
                  customUpload
                  auto={false}
                  multiple
                  chooseLabel={archivos.length > 0 ? `${archivos.length} archivo(s)` : 'Seleccionar archivos'}
                  onSelect={(e) => setArchivos(e.files || [])}
                  onClear={() => setArchivos([])}
                />
              </div>

              <div className="col-12">
                <Button
                  type="submit"
                  label={sending ? 'Enviando...' : 'Enviar mensaje'}
                  icon="pi pi-send"
                  loading={sending}
                />
              </div>
            </form>
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}
