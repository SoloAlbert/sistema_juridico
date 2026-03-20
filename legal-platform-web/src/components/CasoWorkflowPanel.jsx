import { useEffect, useState } from 'react';
import api from '../api/axios';

import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';

function hitoSeverity(estatus) {
  if (estatus === 'liberado') return 'success';
  if (estatus === 'entregado') return 'info';
  if (estatus === 'observado') return 'warning';
  if (estatus === 'cancelado') return 'danger';
  if (estatus === 'en_progreso') return 'info';
  return 'secondary';
}

export default function CasoWorkflowPanel({ caseId, role, compact = false, onUpdated = null }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [contratoForm, setContratoForm] = useState({
    alcance_servicio: '',
    estrategia_inicial: '',
    obligaciones_abogado: '',
    obligaciones_cliente: '',
    terminos_liberacion: ''
  });

  const [hitoForm, setHitoForm] = useState({
    titulo: '',
    descripcion: '',
    porcentaje_liberacion: '',
    evidencia_requerida: '',
    fecha_objetivo: ''
  });

  const [disputaForm, setDisputaForm] = useState({
    tipo_disputa: 'incumplimiento',
    motivo: ''
  });

  const [alertaForm, setAlertaForm] = useState({
    tipo_alerta: 'advertencia',
    motivo: ''
  });

  const [accionesHitos, setAccionesHitos] = useState({});

  useEffect(() => {
    cargar();
  }, [caseId]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/casos/${caseId}/workflow`);
      const workflowData = data.data;
      setWorkflow(workflowData);
      setContratoForm({
        alcance_servicio: workflowData.contrato?.alcance_servicio || '',
        estrategia_inicial: workflowData.contrato?.estrategia_inicial || '',
        obligaciones_abogado: workflowData.contrato?.obligaciones_abogado || '',
        obligaciones_cliente: workflowData.contrato?.obligaciones_cliente || '',
        terminos_liberacion: workflowData.contrato?.terminos_liberacion || ''
      });
      const estadoInicial = {};
      (workflowData.hitos || []).forEach((item) => {
        estadoInicial[item.id_hito_trabajo] = {
          evidencia_entregada: item.evidencia_entregada || '',
          observaciones_cliente: item.observaciones_cliente || ''
        };
      });
      setAccionesHitos(estadoInicial);
      onUpdated?.(workflowData);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener workflow del caso');
    } finally {
      setLoading(false);
    }
  };

  const guardarContrato = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const { data } = await api.post(`/casos/${caseId}/workflow/contrato`, contratoForm);
      setWorkflow(data.data);
      setSuccess(data.message || 'Acuerdo actualizado');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar acuerdo');
    } finally {
      setSaving(false);
    }
  };

  const firmarContrato = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const { data } = await api.post(`/casos/${caseId}/workflow/firmar`);
      setWorkflow(data.data);
      setSuccess(data.message || 'Acuerdo firmado');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al firmar acuerdo');
    } finally {
      setSaving(false);
    }
  };

  const crearHito = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const { data } = await api.post(`/casos/${caseId}/workflow/hitos`, {
        ...hitoForm,
        porcentaje_liberacion: Number(hitoForm.porcentaje_liberacion)
      });
      setWorkflow(data.data);
      setHitoForm({
        titulo: '',
        descripcion: '',
        porcentaje_liberacion: '',
        evidencia_requerida: '',
        fecha_objetivo: ''
      });
      setSuccess(data.message || 'Hito agregado');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear hito');
    } finally {
      setSaving(false);
    }
  };

  const actualizarHito = async (idHito, estatus_hito) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = accionesHitos[idHito] || {};
      const { data } = await api.patch(`/casos/${caseId}/workflow/hitos/${idHito}/avance`, {
        evidencia_entregada: payload.evidencia_entregada,
        estatus_hito
      });
      setWorkflow(data.data);
      setSuccess(data.message || 'Avance actualizado');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar avance');
    } finally {
      setSaving(false);
    }
  };

  const resolverHitoCliente = async (idHito, tipo) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = accionesHitos[idHito] || {};
      const endpoint = tipo === 'aprobar' ? 'aprobar' : 'observar';
      const { data } = await api.patch(`/casos/${caseId}/workflow/hitos/${idHito}/${endpoint}`, {
        observaciones_cliente: payload.observaciones_cliente
      });
      setWorkflow(data.data);
      setSuccess(data.message || 'Hito actualizado');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al responder hito');
    } finally {
      setSaving(false);
    }
  };

  const abrirDisputa = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const { data } = await api.post(`/casos/${caseId}/workflow/disputas`, disputaForm);
      setWorkflow(data.data);
      setDisputaForm({ tipo_disputa: 'incumplimiento', motivo: '' });
      setSuccess(data.message || 'Disputa creada');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir disputa');
    } finally {
      setSaving(false);
    }
  };

  const crearAlerta = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const { data } = await api.post(`/casos/${caseId}/workflow/alertas-cumplimiento`, alertaForm);
      setWorkflow(data.data);
      setAlertaForm({ tipo_alerta: 'advertencia', motivo: '' });
      setSuccess(data.message || 'Alerta registrada');
      onUpdated?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar alerta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card title="Workflow del caso" className="shadow-2"><p>Cargando flujo de trabajo...</p></Card>;
  }

  if (!workflow?.contrato) {
    return null;
  }

  const contrato = workflow.contrato;
  const puedeFirmarCliente = role === 'cliente' && !contrato.firmado_cliente;
  const puedeFirmarAbogado = role === 'abogado' && !contrato.firmado_abogado;
  const montoTotal = Number(contrato.monto_total_retencion || 0);
  const montoLiberado = Number(contrato.monto_total_liberado || 0);
  const montoPendiente = Math.max(montoTotal - montoLiberado, 0);
  const porcentajeLiberado = Number(contrato.porcentaje_total_liberado || 0);
  const liberacionesEjecutadas = (workflow.liberaciones || []).filter((item) =>
    ['aprobada', 'ejecutada'].includes(item.estatus_liberacion)
  );
  const liberacionesPendientes = (workflow.liberaciones || []).filter((item) => item.estatus_liberacion === 'pendiente');

  return (
    <Card title="Workflow del caso y proteccion al cliente" className="shadow-2 mb-4">
      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <div className="grid">
        <div className="col-12 md:col-4">
          <div className="surface-50 border-round p-3 h-full">
            <div className="text-600 text-sm mb-2">Estatus del acuerdo</div>
            <Tag value={contrato.estatus_contrato} severity={contrato.estatus_contrato === 'activo' ? 'success' : 'warning'} />
            <div className="mt-3"><strong>Retenido:</strong> ${Number(contrato.monto_total_retencion || 0).toFixed(2)}</div>
            <div><strong>Liberado:</strong> ${Number(contrato.monto_total_liberado || 0).toFixed(2)}</div>
            <div><strong>% liberado:</strong> {Number(contrato.porcentaje_total_liberado || 0).toFixed(2)}%</div>
            <div className="mt-3"><strong>Cliente firmo:</strong> {contrato.firmado_cliente ? 'Si' : 'No'}</div>
            <div><strong>Abogado firmo:</strong> {contrato.firmado_abogado ? 'Si' : 'No'}</div>
          </div>
        </div>

        <div className="col-12 md:col-8">
          <div className="surface-50 border-round p-3 h-full">
            <div className="text-600 text-sm mb-2">Terminos de proteccion</div>
            <p className="m-0">El servicio queda documentado dentro de la plataforma. Los pagos se retienen y solo se liberan por hitos aprobados por el cliente. Si una parte intenta cobrar o negociar por fuera, se puede registrar una alerta de cumplimiento o abrir disputa.</p>
          </div>
        </div>
      </div>

      <Divider />

      <div className="grid">
        <div className="col-12 md:col-4">
          <div className="surface-50 border-round p-3 h-full">
            <div className="text-600 text-sm mb-2">Monto retenido al abogado</div>
            <div className="text-2xl font-semibold">${montoTotal.toFixed(2)}</div>
            <small className="text-600">Corresponde al neto del abogado retenido en plataforma.</small>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-50 border-round p-3 h-full">
            <div className="text-600 text-sm mb-2">Monto ya liberado</div>
            <div className="text-2xl font-semibold text-green-600">${montoLiberado.toFixed(2)}</div>
            <small className="text-600">{porcentajeLiberado.toFixed(2)}% del neto ya fue autorizado por hitos.</small>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="surface-50 border-round p-3 h-full">
            <div className="text-600 text-sm mb-2">Saldo pendiente por liberar</div>
            <div className="text-2xl font-semibold text-orange-500">${montoPendiente.toFixed(2)}</div>
            <small className="text-600">Solo se suelta cuando el cliente aprueba avances del caso.</small>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <strong>Progreso de liberacion</strong>
          <small className="text-600">
            {liberacionesEjecutadas.length} liberacion(es) ejecutada(s) · {liberacionesPendientes.length} pendiente(s)
          </small>
        </div>
        <ProgressBar value={Math.min(porcentajeLiberado, 100)} showValue />
      </div>

      {(workflow.liberaciones || []).length > 0 && (
        <>
          <Divider />
          <h3 className="mt-0">Historial de liberaciones</h3>
          {workflow.liberaciones.map((item) => (
            <div key={item.id_liberacion_pago} className="surface-50 border-round p-3 mb-3">
              <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">
                    {Number(item.porcentaje_liberado || 0).toFixed(2)}% · ${Number(item.monto_liberado || 0).toFixed(2)}
                  </div>
                  <div className="text-700 mt-2">{item.observaciones || 'Liberacion asociada a un hito del caso.'}</div>
                  <small className="text-600">
                    Pago relacionado: {item.id_pago || '-'} · creada {item.created_at || '-'}
                  </small>
                </div>
                <Tag
                  value={item.estatus_liberacion}
                  severity={item.estatus_liberacion === 'ejecutada' ? 'success' : item.estatus_liberacion === 'pendiente' ? 'warning' : 'info'}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {!compact && (role === 'cliente' || role === 'admin') && (
        <>
          <Divider />
          <h3 className="mt-0">Acuerdo de servicio</h3>
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="block mb-2">Alcance del servicio</label>
              <InputTextarea value={contratoForm.alcance_servicio} onChange={(e) => setContratoForm((p) => ({ ...p, alcance_servicio: e.target.value }))} rows={4} className="w-full" />
            </div>
            <div className="col-12 md:col-6">
              <label className="block mb-2">Estrategia inicial</label>
              <InputTextarea value={contratoForm.estrategia_inicial} onChange={(e) => setContratoForm((p) => ({ ...p, estrategia_inicial: e.target.value }))} rows={4} className="w-full" />
            </div>
            <div className="col-12 md:col-6">
              <label className="block mb-2">Obligaciones del abogado</label>
              <InputTextarea value={contratoForm.obligaciones_abogado} onChange={(e) => setContratoForm((p) => ({ ...p, obligaciones_abogado: e.target.value }))} rows={4} className="w-full" />
            </div>
            <div className="col-12 md:col-6">
              <label className="block mb-2">Obligaciones del cliente</label>
              <InputTextarea value={contratoForm.obligaciones_cliente} onChange={(e) => setContratoForm((p) => ({ ...p, obligaciones_cliente: e.target.value }))} rows={4} className="w-full" />
            </div>
            <div className="col-12">
              <label className="block mb-2">Terminos de liberacion</label>
              <InputTextarea value={contratoForm.terminos_liberacion} onChange={(e) => setContratoForm((p) => ({ ...p, terminos_liberacion: e.target.value }))} rows={3} className="w-full" />
            </div>
            <div className="col-12">
              <Button label="Guardar acuerdo" icon="pi pi-save" onClick={guardarContrato} loading={saving} />
            </div>
          </div>
        </>
      )}

      {!compact && (puedeFirmarCliente || puedeFirmarAbogado) && (
        <>
          <Divider />
          <Button
            label={role === 'cliente' ? 'Firmar acuerdo como cliente' : 'Firmar acuerdo como abogado'}
            icon="pi pi-check-circle"
            severity="success"
            onClick={firmarContrato}
            loading={saving}
          />
        </>
      )}

      {!compact && (role === 'cliente' || role === 'admin') && (
        <>
          <Divider />
          <h3 className="mt-0">Plan de trabajo y liberaciones</h3>
          <div className="grid">
            <div className="col-12 md:col-4">
              <InputText value={hitoForm.titulo} onChange={(e) => setHitoForm((p) => ({ ...p, titulo: e.target.value }))} className="w-full" placeholder="Titulo del hito" />
            </div>
            <div className="col-12 md:col-3">
              <InputText value={hitoForm.porcentaje_liberacion} onChange={(e) => setHitoForm((p) => ({ ...p, porcentaje_liberacion: e.target.value }))} className="w-full" placeholder="% liberacion" />
            </div>
            <div className="col-12 md:col-5">
              <InputText value={hitoForm.fecha_objetivo} onChange={(e) => setHitoForm((p) => ({ ...p, fecha_objetivo: e.target.value }))} className="w-full" placeholder="Fecha objetivo YYYY-MM-DD" />
            </div>
            <div className="col-12 md:col-6">
              <InputTextarea value={hitoForm.descripcion} onChange={(e) => setHitoForm((p) => ({ ...p, descripcion: e.target.value }))} rows={3} className="w-full" placeholder="Que entregara o gestionara el abogado" />
            </div>
            <div className="col-12 md:col-6">
              <InputTextarea value={hitoForm.evidencia_requerida} onChange={(e) => setHitoForm((p) => ({ ...p, evidencia_requerida: e.target.value }))} rows={3} className="w-full" placeholder="Evidencia requerida para liberar fondos" />
            </div>
            <div className="col-12">
              <Button label="Agregar hito" icon="pi pi-plus" onClick={crearHito} loading={saving} />
            </div>
          </div>
        </>
      )}

      <Divider />
      <h3 className="mt-0">Hitos del caso</h3>
      {(workflow.hitos || []).length === 0 ? (
        <p>No hay hitos registrados. Define el plan de trabajo antes de liberar dinero al abogado.</p>
      ) : (
        workflow.hitos.map((item) => (
          <div key={item.id_hito_trabajo} className="surface-50 border-round p-3 mb-3">
            <div className="flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <div className="font-semibold">{item.orden_hito}. {item.titulo}</div>
                <div className="text-700 mt-2">{item.descripcion || '-'}</div>
                <small className="text-600">
                  {Number(item.porcentaje_liberacion || 0).toFixed(2)}% · ${Number(item.monto_liberacion || 0).toFixed(2)} · objetivo {item.fecha_objetivo || '-'}
                </small>
              </div>
              <Tag value={item.estatus_hito} severity={hitoSeverity(item.estatus_hito)} />
            </div>

            {item.evidencia_requerida && <p className="mt-3 mb-1"><strong>Evidencia requerida:</strong> {item.evidencia_requerida}</p>}
            {item.evidencia_entregada && <p className="mt-2 mb-1"><strong>Evidencia entregada:</strong> {item.evidencia_entregada}</p>}
            {item.observaciones_cliente && <p className="mt-2 mb-1"><strong>Observaciones cliente:</strong> {item.observaciones_cliente}</p>}

            {!compact && role === 'abogado' && ['pendiente', 'en_progreso', 'observado'].includes(item.estatus_hito) && (
              <div className="mt-3">
                <InputTextarea
                  value={accionesHitos[item.id_hito_trabajo]?.evidencia_entregada || ''}
                  onChange={(e) => setAccionesHitos((prev) => ({
                    ...prev,
                    [item.id_hito_trabajo]: {
                      ...prev[item.id_hito_trabajo],
                      evidencia_entregada: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full mb-2"
                  placeholder="Describe evidencia, avances, escritos, reuniones o entregables del hito."
                />
                <div className="flex gap-2 flex-wrap">
                  <Button label="Guardar avance" outlined onClick={() => actualizarHito(item.id_hito_trabajo, 'en_progreso')} loading={saving} />
                  <Button label="Entregar y solicitar liberacion" onClick={() => actualizarHito(item.id_hito_trabajo, 'entregado')} loading={saving} />
                </div>
              </div>
            )}

            {!compact && role === 'cliente' && item.estatus_hito === 'entregado' && (
              <div className="mt-3">
                <InputTextarea
                  value={accionesHitos[item.id_hito_trabajo]?.observaciones_cliente || ''}
                  onChange={(e) => setAccionesHitos((prev) => ({
                    ...prev,
                    [item.id_hito_trabajo]: {
                      ...prev[item.id_hito_trabajo],
                      observaciones_cliente: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full mb-2"
                  placeholder="Comenta si apruebas la entrega o que ajustes faltan."
                />
                <div className="flex gap-2 flex-wrap">
                  <Button label="Aprobar y liberar" severity="success" onClick={() => resolverHitoCliente(item.id_hito_trabajo, 'aprobar')} loading={saving} />
                  <Button label="Observar" outlined onClick={() => resolverHitoCliente(item.id_hito_trabajo, 'observar')} loading={saving} />
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {!compact && (
        <>
          <Divider />
          <div className="grid">
            <div className="col-12 lg:col-6">
              <h3 className="mt-0">Abrir disputa</h3>
              <InputText value={disputaForm.tipo_disputa} onChange={(e) => setDisputaForm((p) => ({ ...p, tipo_disputa: e.target.value }))} className="w-full mb-2" placeholder="Tipo de disputa" />
              <InputTextarea value={disputaForm.motivo} onChange={(e) => setDisputaForm((p) => ({ ...p, motivo: e.target.value }))} rows={3} className="w-full mb-2" placeholder="Explica el incumplimiento, abandono o problema." />
              <Button label="Abrir disputa" severity="danger" outlined onClick={abrirDisputa} loading={saving} />
            </div>

            <div className="col-12 lg:col-6">
              <h3 className="mt-0">Alertas de cumplimiento</h3>
              <InputText value={alertaForm.tipo_alerta} onChange={(e) => setAlertaForm((p) => ({ ...p, tipo_alerta: e.target.value }))} className="w-full mb-2" placeholder="advertencia, pago_externo, contacto_externo..." />
              <InputTextarea value={alertaForm.motivo} onChange={(e) => setAlertaForm((p) => ({ ...p, motivo: e.target.value }))} rows={3} className="w-full mb-2" placeholder="Reporta intento de pago por fuera, contacto externo o incumplimiento." />
              <Button label="Registrar alerta" outlined onClick={crearAlerta} loading={saving} />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
