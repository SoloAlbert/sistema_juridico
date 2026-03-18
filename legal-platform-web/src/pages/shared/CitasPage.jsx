import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import AbogadoMenu from '../../components/AbogadoMenu';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Divider } from 'primereact/divider';

const formInicial = {
  id_caso: null,
  titulo: '',
  descripcion: '',
  fecha_inicio: null,
  fecha_fin: null,
  modalidad: 'videollamada',
  ubicacion: '',
  link_reunion: ''
};

export default function CitasPage() {
  const { user } = useAuth();

  const [citas, setCitas] = useState([]);
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCrear, setVisibleCrear] = useState(false);
  const [visibleEditar, setVisibleEditar] = useState(false);
  const [visibleHistorial, setVisibleHistorial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState(formInicial);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [historial, setHistorial] = useState([]);

  const modalidades = [
    { label: 'Videollamada', value: 'videollamada' },
    { label: 'Presencial', value: 'presencial' },
    { label: 'Llamada', value: 'llamada' }
  ];

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    try {
      setLoading(true);
      setError('');
      const [citasRes, convRes] = await Promise.all([
        api.get('/citas/mis-citas'),
        api.get('/conversaciones')
      ]);

      setCitas(citasRes.data.data || []);
      setConversaciones(convRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar citas');
    } finally {
      setLoading(false);
    }
  };

  const opcionesCasos = conversaciones.map((item) => ({
    label: `${item.folio_caso} - ${item.titulo}`,
    value: item.id_caso
  }));

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const formatMySQL = (fecha) => {
    if (!fecha) return null;
    const pad = (n) => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
  };

  const formatoFecha = (valor) => {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return valor;

    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(fecha);
  };

  const abrirCrear = () => {
    setForm(formInicial);
    setVisibleCrear(true);
  };

  const crearCita = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setInfo('');

      await api.post('/citas', {
        ...form,
        fecha_inicio: formatMySQL(form.fecha_inicio),
        fecha_fin: formatMySQL(form.fecha_fin)
      });

      setInfo('Cita creada correctamente');
      setVisibleCrear(false);
      setForm(formInicial);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cita');
    } finally {
      setSaving(false);
    }
  };

  const abrirEditar = (row) => {
    setCitaSeleccionada(row);
    setForm({
      id_caso: row.id_caso,
      titulo: row.titulo || '',
      descripcion: row.descripcion || '',
      fecha_inicio: row.fecha_inicio ? new Date(row.fecha_inicio) : null,
      fecha_fin: row.fecha_fin ? new Date(row.fecha_fin) : null,
      modalidad: row.modalidad || 'videollamada',
      ubicacion: row.ubicacion || '',
      link_reunion: row.link_reunion || ''
    });
    setVisibleEditar(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();

    if (!citaSeleccionada) return;

    try {
      setSaving(true);
      setError('');
      setInfo('');

      await api.put(`/citas/${citaSeleccionada.id_cita}`, {
        ...form,
        fecha_inicio: formatMySQL(form.fecha_inicio),
        fecha_fin: formatMySQL(form.fecha_fin)
      });

      setInfo('Cita reprogramada correctamente');
      setVisibleEditar(false);
      setCitaSeleccionada(null);
      setForm(formInicial);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar cita');
    } finally {
      setSaving(false);
    }
  };

  const verHistorial = async (row) => {
    try {
      setError('');
      const { data } = await api.get(`/citas/${row.id_cita}`);
      setCitaSeleccionada(data.data?.cita || row);
      setHistorial(data.data?.historial || []);
      setVisibleHistorial(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar historial');
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      setError('');
      setInfo('');
      await api.patch(`/citas/${id}/estado`, { estado });
      setInfo(`Cita marcada como ${estado}`);
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar cita');
    }
  };

  const menu = user?.role === 'cliente' ? <ClienteMenu /> : <AbogadoMenu />;

  const estadoBody = (row) => {
    const severities = {
      programada: 'warning',
      confirmada: 'success',
      completada: 'secondary',
      cancelada: 'danger',
      reprogramada: 'contrast'
    };

    return <Tag value={row.estado} severity={severities[row.estado] || 'info'} />;
  };

  const modalidadBody = (row) => (
    <div className="flex align-items-center gap-2 flex-wrap">
      <Tag value={row.modalidad} severity="info" />
      {row.link_reunion && (
        <Button
          size="small"
          label="Entrar"
          icon="pi pi-video"
          text
          onClick={() => window.open(row.link_reunion, '_blank', 'noopener,noreferrer')}
        />
      )}
    </div>
  );

  const participanteBody = (row) => {
    if (user?.role === 'cliente') {
      return `${row.abogado_nombre || ''} ${row.abogado_apellido_paterno || ''}`.trim();
    }

    return `${row.cliente_nombre || ''} ${row.cliente_apellido_paterno || ''}`.trim();
  };

  const accionesBody = (row) => (
    <div className="flex gap-2 flex-wrap">
      {row.estado !== 'confirmada' && row.estado !== 'completada' && row.estado !== 'cancelada' && (
        <Button size="small" label="Confirmar" outlined onClick={() => cambiarEstado(row.id_cita, 'confirmada')} />
      )}
      {row.estado !== 'completada' && row.estado !== 'cancelada' && (
        <Button size="small" label="Completar" outlined severity="success" onClick={() => cambiarEstado(row.id_cita, 'completada')} />
      )}
      {row.estado !== 'cancelada' && row.estado !== 'completada' && (
        <Button size="small" label="Cancelar" outlined severity="danger" onClick={() => cambiarEstado(row.id_cita, 'cancelada')} />
      )}
      {row.estado !== 'cancelada' && row.estado !== 'completada' && (
        <Button size="small" label="Reprogramar" outlined severity="warning" onClick={() => abrirEditar(row)} />
      )}
      <Button size="small" label="Historial" outlined severity="secondary" onClick={() => verHistorial(row)} />
    </div>
  );

  const activas = citas.filter((item) => !['cancelada', 'completada'].includes(item.estado));
  const proximasCitas = activas
    .slice()
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, 4);

  const agendaPorDia = activas.reduce((acc, item) => {
    const key = item.fecha_inicio ? item.fecha_inicio.slice(0, 10) : 'sin-fecha';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const diasAgenda = Object.keys(agendaPorDia)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(0, 5);

  const renderFormulario = (onSubmit, textoBoton) => (
    <form onSubmit={onSubmit} className="grid">
      <div className="col-12">
        <label className="block mb-2">Caso</label>
        <Dropdown
          value={form.id_caso}
          options={opcionesCasos}
          onChange={(e) => handleChange('id_caso', e.value)}
          className="w-full"
          placeholder="Selecciona un caso"
          disabled={visibleEditar}
        />
      </div>

      <div className="col-12">
        <label className="block mb-2">Titulo</label>
        <InputText value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} className="w-full" />
      </div>

      <div className="col-12">
        <label className="block mb-2">Descripcion</label>
        <InputTextarea value={form.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} rows={4} className="w-full" />
      </div>

      <div className="col-12 md:col-6">
        <label className="block mb-2">Fecha inicio</label>
        <Calendar value={form.fecha_inicio} onChange={(e) => handleChange('fecha_inicio', e.value)} showTime hourFormat="24" className="w-full" />
      </div>

      <div className="col-12 md:col-6">
        <label className="block mb-2">Fecha fin</label>
        <Calendar value={form.fecha_fin} onChange={(e) => handleChange('fecha_fin', e.value)} showTime hourFormat="24" className="w-full" />
      </div>

      <div className="col-12 md:col-6">
        <label className="block mb-2">Modalidad</label>
        <Dropdown value={form.modalidad} options={modalidades} onChange={(e) => handleChange('modalidad', e.value)} className="w-full" />
      </div>

      <div className="col-12 md:col-6">
        <label className="block mb-2">Ubicacion</label>
        <InputText value={form.ubicacion} onChange={(e) => handleChange('ubicacion', e.target.value)} className="w-full" />
      </div>

      <div className="col-12">
        <label className="block mb-2">Link de reunion</label>
        <InputText value={form.link_reunion} onChange={(e) => handleChange('link_reunion', e.target.value)} className="w-full" />
      </div>

      <div className="col-12">
        <Button type="submit" label={saving ? 'Guardando...' : textoBoton} icon="pi pi-save" loading={saving} />
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      {menu}

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {info && <Message severity="success" text={info} className="w-full mb-3" />}

      <div className="mb-4">
        <h1 className="m-0">Agenda y citas</h1>
        <p className="text-700">Programa reuniones, confirma horarios, reprograma y consulta el historial de cada cita.</p>
      </div>

      <Card title="Resumen de agenda" className="shadow-2 mb-4">
        <div className="grid">
          <div className="col-12 md:col-3">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Total citas</div>
              <div className="text-2xl font-semibold">{citas.length}</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Pendientes</div>
              <div className="text-2xl font-semibold">
                {citas.filter((item) => item.estado === 'programada' || item.estado === 'reprogramada').length}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Confirmadas</div>
              <div className="text-2xl font-semibold">{citas.filter((item) => item.estado === 'confirmada').length}</div>
            </div>
          </div>
          <div className="col-12 md:col-3">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Con enlace</div>
              <div className="text-2xl font-semibold">{citas.filter((item) => item.link_reunion).length}</div>
            </div>
          </div>
        </div>
      </Card>

      {proximasCitas.length > 0 && (
        <Card title="Proximas citas" className="shadow-2 mb-4">
          <div className="grid">
            {proximasCitas.map((item) => (
              <div key={item.id_cita} className="col-12 md:col-6 lg:col-3">
                <div className="surface-50 border-round p-3 h-full">
                  <div className="flex justify-content-between align-items-start gap-2 mb-2">
                    <div className="font-semibold">{item.titulo}</div>
                    {estadoBody(item)}
                  </div>
                  <div className="text-700 mb-2">{item.titulo_caso}</div>
                  <small className="block text-600 mb-2">{formatoFecha(item.fecha_inicio)}</small>
                  <small className="block text-600 mb-3">{item.modalidad}</small>
                  {item.link_reunion && (
                    <Button size="small" label="Entrar" icon="pi pi-video" outlined onClick={() => window.open(item.link_reunion, '_blank', 'noopener,noreferrer')} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {diasAgenda.length > 0 && (
        <Card title="Calendario de trabajo" className="shadow-2 mb-4">
          <div className="grid">
            {diasAgenda.map((dia) => (
              <div key={dia} className="col-12 md:col-6 lg:col-4">
                <div className="border-1 surface-border border-round p-3 h-full">
                  <div className="font-semibold mb-3">{formatoFecha(`${dia}T09:00:00`)}</div>
                  {agendaPorDia[dia].map((item, index) => (
                    <div key={item.id_cita}>
                      <div className="flex justify-content-between align-items-start gap-2">
                        <div>
                          <div>{item.titulo}</div>
                          <small className="text-600">{item.titulo_caso}</small>
                        </div>
                        {estadoBody(item)}
                      </div>
                      <small className="block text-600 mt-2">{formatoFecha(item.fecha_inicio)}</small>
                      {index < agendaPorDia[dia].length - 1 && <Divider />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Listado de citas" className="shadow-2">
        <div className="flex justify-content-end mb-3">
          <Button label="Nueva cita" icon="pi pi-plus" onClick={abrirCrear} />
        </div>

        <DataTable value={citas} loading={loading} paginator rows={10} responsiveLayout="scroll" emptyMessage="No tienes citas">
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Titulo cita" />
          <Column field="titulo_caso" header="Caso" />
          <Column header={user?.role === 'cliente' ? 'Abogado' : 'Cliente'} body={participanteBody} />
          <Column header="Modalidad" body={modalidadBody} />
          <Column field="fecha_inicio" header="Inicio" body={(row) => formatoFecha(row.fecha_inicio)} />
          <Column field="fecha_fin" header="Fin" body={(row) => formatoFecha(row.fecha_fin)} />
          <Column header="Estado" body={estadoBody} />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>

      <Dialog header="Crear nueva cita" visible={visibleCrear} style={{ width: '42rem' }} onHide={() => setVisibleCrear(false)}>
        {renderFormulario(crearCita, 'Crear cita')}
      </Dialog>

      <Dialog header="Reprogramar cita" visible={visibleEditar} style={{ width: '42rem' }} onHide={() => setVisibleEditar(false)}>
        {renderFormulario(guardarEdicion, 'Guardar cambios')}
      </Dialog>

      <Dialog header="Historial de cita" visible={visibleHistorial} style={{ width: '40rem' }} onHide={() => setVisibleHistorial(false)}>
        {citaSeleccionada && (
          <div className="mb-4">
            <div className="font-semibold">{citaSeleccionada.titulo}</div>
            <small className="text-600">{citaSeleccionada.titulo_caso}</small>
          </div>
        )}

        {historial.length === 0 ? (
          <p>No hay historial para esta cita.</p>
        ) : (
          historial.map((item, index) => (
            <div key={item.id_cita_historial}>
              <div className="flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="font-semibold">{item.accion}</div>
                  <div className="text-700">{item.detalle}</div>
                  <small className="text-600">
                    {item.nombre || 'Sistema'} {item.apellido_paterno || ''} | {formatoFecha(item.created_at)}
                  </small>
                </div>
              </div>
              {index < historial.length - 1 && <Divider />}
            </div>
          ))
        )}
      </Dialog>
    </DashboardLayout>
  );
}
