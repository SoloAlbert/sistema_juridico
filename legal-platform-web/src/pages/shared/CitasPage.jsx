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

  const accionesBody = (row) => {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button size="small" label="Confirmar" outlined onClick={() => cambiarEstado(row.id_cita, 'confirmada')} />
        <Button size="small" label="Completar" outlined severity="success" onClick={() => cambiarEstado(row.id_cita, 'completada')} />
        <Button size="small" label="Cancelar" outlined severity="danger" onClick={() => cambiarEstado(row.id_cita, 'cancelada')} />
      </div>
    );
  };

  return (
    <DashboardLayout>
      {menu}

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {info && <Message severity="success" text={info} className="w-full mb-3" />}

      <Card title="Citas" className="shadow-2">
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
          <Column field="modalidad" header="Modalidad" />
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