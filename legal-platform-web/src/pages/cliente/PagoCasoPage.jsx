import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';

export default function PagoCasoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPago, setLoadingPago] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    id_metodo_pago: 1,
    referencia_externa: ''
  });

  const metodosPago = [
    { label: 'Tarjeta', value: 1 },
    { label: 'Transferencia', value: 2 },
    { label: 'Mercado Pago', value: 3 },
    { label: 'Stripe', value: 4 }
  ];

  useEffect(() => {
    obtenerResumen();
  }, [id]);

  const obtenerResumen = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get(`/pagos/caso/${id}/resumen`);
      setResumen(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener resumen de pago');
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

  const pagarCaso = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoadingPago(true);

    try {
      const payload = {
        id_metodo_pago: form.id_metodo_pago,
        referencia_externa: form.referencia_externa || null
      };

      const { data } = await api.post(`/pagos/caso/${id}/pagar`, payload);

      setSuccess(data.message || 'Pago registrado correctamente');

      setTimeout(() => {
        navigate(`/cliente/mis-casos/${id}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar pago');
    } finally {
      setLoadingPago(false);
    }
  };

  const estadoBody = (estado) => {
    let severity = 'info';
    if (estado === 'pendiente_pago') severity = 'warning';
    if (estado === 'pagado') severity = 'success';
    if (estado === 'en_proceso') severity = 'info';
    if (estado === 'completado') severity = 'secondary';
    if (estado === 'cancelado') severity = 'danger';

    return <Tag value={estado} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <ClienteMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading ? (
        <Card title="Cargando resumen..." />
      ) : resumen ? (
        <div className="grid">
          <div className="col-12 lg:col-7">
            <Card title={`Pagar caso: ${resumen.folio_caso}`} className="shadow-2">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <p><strong>Título:</strong> {resumen.titulo}</p>
                  <p><strong>Estado del caso:</strong> <Tag value={resumen.estado} severity="info" /></p>
                  <p><strong>Estado del servicio:</strong> {estadoBody(resumen.estado_servicio)}</p>
                </div>

                <div className="col-12 md:col-6">
                  <p><strong>Monto acordado:</strong> ${Number(resumen.monto_acordado || 0).toFixed(2)}</p>
                  <p><strong>Comisión plataforma:</strong> {resumen.porcentaje_comision}%</p>
                  <p><strong>Monto comisión:</strong> ${Number(resumen.monto_comision || 0).toFixed(2)}</p>
                  <p><strong>Neto abogado:</strong> ${Number(resumen.monto_neto_abogado || 0).toFixed(2)}</p>
                </div>
              </div>

              <Divider />

              <form onSubmit={pagarCaso} className="grid">
                <div className="col-12 md:col-6">
                  <label className="block mb-2">Método de pago</label>
                  <Dropdown
                    value={form.id_metodo_pago}
                    options={metodosPago}
                    onChange={(e) => handleChange('id_metodo_pago', e.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-12 md:col-6">
                  <label className="block mb-2">Referencia externa</label>
                  <InputText
                    value={form.referencia_externa}
                    onChange={(e) => handleChange('referencia_externa', e.target.value)}
                    className="w-full"
                    placeholder="Ej. PAGO-CLIENTE-001"
                  />
                </div>

                <div className="col-12">
                  <Button
                    type="submit"
                    label={loadingPago ? 'Procesando...' : 'Confirmar pago'}
                    icon="pi pi-credit-card"
                    loading={loadingPago}
                    disabled={resumen.estado_servicio !== 'pendiente_pago'}
                  />
                </div>
              </form>
            </Card>
          </div>

          <div className="col-12 lg:col-5">
            <Card title="Resumen financiero" className="shadow-2">
              <p className="mb-3">Este pago se registrará en la plataforma y permitirá iniciar formalmente el caso.</p>

              <div className="surface-100 p-3 border-round">
                <div className="flex justify-content-between mb-2">
                  <span>Monto del caso</span>
                  <strong>${Number(resumen.monto_acordado || 0).toFixed(2)}</strong>
                </div>

                <div className="flex justify-content-between mb-2">
                  <span>Comisión plataforma</span>
                  <strong>${Number(resumen.monto_comision || 0).toFixed(2)}</strong>
                </div>

                <div className="flex justify-content-between">
                  <span>Recibe abogado</span>
                  <strong>${Number(resumen.monto_neto_abogado || 0).toFixed(2)}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}