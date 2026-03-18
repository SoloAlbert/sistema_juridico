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

export default function CitasPage() {
  const { user } = useAuth();

  const [citas, setCitas] = useState([]);
  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [form, setForm] = useState({
    id_caso: null,
    titulo: '',
    descripcion: '',
    fecha_inicio: null,
    fecha_fin: null,
    modalidad: 'videollamada',
    ubicacion: '',
    link_reunion: ''
  });

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
      const [citasRes, convRes] = await Promise.all([
        api.get('/citas/mis-citas'),
        api.get('/conversaciones')
      ]);

      setCitas(citasRes.data.data);
      setConversaciones(convRes.data.data);
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
      setVisible(false);
      setForm({
        id_caso: null,
        titulo: '',
        descripcion: '',
        fecha_inicio: null,
        fecha_fin: null,
        modalidad: 'videollamada',
        ubicacion: '',
        link_reunion: ''
      });
      await cargarTodo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cita');
    } finally {
      setSaving(false);
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
    let severity = 'info';
    if (row.estado === 'programada') severity = 'warning';
    if (row.estado === 'confirmada') severity = 'success';
    if (row.estado === 'completada') severity = 'secondary';
    if (row.estado === 'cancelada') severity = 'danger';
    if (row.estado === 'reprogramada') severity = 'contrast';

    return <Tag value={row.estado} severity={severity} />;
  };

  const modalidadBody = (row) => (
    <div className="flex align-items-center gap-2 flex-wrap">
      <Tag value={row.modalidad} severity="info" />
      {row.link_reunion && (
        <a
          href={row.link_reunion}
          target="_blank"
          rel="noreferrer"
          className="text-primary no-underline"
        >
          Unirse
        </a>
      )}
    </div>
  );

  const accionesBody = (row) => {
    return (
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
        {row.link_reunion && (
          <Button
            size="small"
            label="Entrar"
            icon="pi pi-video"
            outlined
            onClick={() => window.open(row.link_reunion, '_blank', 'noopener,noreferrer')}
          />
        )}
      </div>
    );
  };

  const proximasCitas = citas
    .filter((item) => item.estado !== 'cancelada' && item.estado !== 'completada')
    .slice()
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
    .slice(0, 3);

  return (
    <DashboardLayout>
      {menu}

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {info && <Message severity="success" text={info} className="w-full mb-3" />}

      <Card title="Citas" className="shadow-2">
        <div className="grid mb-3">
          <div className="col-12 md:col-4">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Total citas</div>
              <div className="text-2xl font-semibold">{citas.length}</div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Pendientes</div>
              <div className="text-2xl font-semibold">
                {citas.filter((item) => item.estado === 'programada' || item.estado === 'reprogramada').length}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-4">
            <div className="surface-50 border-round p-3 h-full">
              <div className="text-600 text-sm mb-2">Confirmadas</div>
              <div className="text-2xl font-semibold">
                {citas.filter((item) => item.estado === 'confirmada').length}
              </div>
            </div>
          </div>
        </div>

        {proximasCitas.length > 0 && (
          <>
            <div className="mb-3">
              <p className="font-semibold mb-2">Próximas citas</p>
              <div className="grid">
                {proximasCitas.map((item) => (
                  <div key={item.id_cita} className="col-12 md:col-4">
                    <div className="surface-50 border-round p-3 h-full">
                      <div className="flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="font-semibold">{item.titulo}</div>
                        {estadoBody(item)}
                      </div>
                      <div className="text-700 mb-2">{item.titulo_caso}</div>
                      <small className="block text-600 mb-2">{item.fecha_inicio}</small>
                      <small className="block text-600 mb-3">{item.modalidad}</small>
                      {item.link_reunion && (
                        <Button
                          size="small"
                          label="Entrar a reunión"
                          icon="pi pi-video"
                          outlined
                          onClick={() => window.open(item.link_reunion, '_blank', 'noopener,noreferrer')}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Divider />
          </>
        )}

        <div className="flex justify-content-end mb-3">
          <Button label="Nueva cita" icon="pi pi-plus" onClick={() => setVisible(true)} />
        </div>

        <DataTable
          value={citas}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes citas"
        >
          <Column field="folio_caso" header="Folio" />
          <Column field="titulo" header="Título cita" />
          <Column field="titulo_caso" header="Caso" />
          <Column header="Modalidad" body={modalidadBody} />
          <Column field="fecha_inicio" header="Inicio" />
          <Column field="fecha_fin" header="Fin" />
          <Column header="Estado" body={estadoBody} />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>

      <Dialog
        header="Crear nueva cita"
        visible={visible}
        style={{ width: '42rem' }}
        onHide={() => setVisible(false)}
      >
        <form onSubmit={crearCita} className="grid">
          <div className="col-12">
            <label className="block mb-2">Caso</label>
            <Dropdown
              value={form.id_caso}
              options={opcionesCasos}
              onChange={(e) => handleChange('id_caso', e.value)}
              className="w-full"
              placeholder="Selecciona un caso"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Título</label>
            <InputText
              value={form.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Descripción</label>
            <InputTextarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Fecha inicio</label>
            <Calendar
              value={form.fecha_inicio}
              onChange={(e) => handleChange('fecha_inicio', e.value)}
              showTime
              hourFormat="24"
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Fecha fin</label>
            <Calendar
              value={form.fecha_fin}
              onChange={(e) => handleChange('fecha_fin', e.value)}
              showTime
              hourFormat="24"
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Modalidad</label>
            <Dropdown
              value={form.modalidad}
              options={modalidades}
              onChange={(e) => handleChange('modalidad', e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="block mb-2">Ubicación</label>
            <InputText
              value={form.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <label className="block mb-2">Link de reunión</label>
            <InputText
              value={form.link_reunion}
              onChange={(e) => handleChange('link_reunion', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="col-12">
            <Button
              type="submit"
              label={saving ? 'Guardando...' : 'Crear cita'}
              icon="pi pi-save"
              loading={saving}
            />
          </div>
        </form>
      </Dialog>
    </DashboardLayout>
  );
}
