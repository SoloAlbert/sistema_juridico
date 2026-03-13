import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function AdminPapeleraPage() {
  const [tipo, setTipo] = useState('plantillas');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const opciones = [
    { label: 'Plantillas', value: 'plantillas' },
    { label: 'Bloques HTML', value: 'bloques' },
    { label: 'Plantillas maestras', value: 'maestras' },
    { label: 'Tipos de documento', value: 'tipos_documento' }
  ];

  useEffect(() => {
    cargar();
  }, [tipo]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/papelera', {
        params: { tipo }
      });
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar papelera');
    } finally {
      setLoading(false);
    }
  };

  const restaurar = async (id) => {
    try {
      setError('');
      setSuccess('');
      const { data } = await api.post(`/admin/papelera/${tipo}/${id}/restaurar`);
      setSuccess(data.message || 'Registro restaurado');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restaurar');
    }
  };

  const getPrimaryKey = (row) => {
    if (tipo === 'plantillas') return row.id_plantilla;
    if (tipo === 'bloques') return row.id_bloque;
    if (tipo === 'maestras') return row.id_plantilla_maestra;
    if (tipo === 'tipos_documento') return row.id_tipo_documento;
    return null;
  };

  const getNombre = (row) => row.titulo || row.nombre || row.slug || '-';

  const eliminadoPor = (row) =>
    `${row.nombre || ''} ${row.apellido_paterno || ''} ${row.apellido_materno || ''}`.trim() || row.email || '-';

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      <Card title="Papelera admin" className="shadow-2 mb-4">
        <div className="grid">
          <div className="col-12 md:col-4">
            <label className="block mb-2">Tipo</label>
            <Dropdown
              value={tipo}
              options={opciones}
              onChange={(e) => setTipo(e.value)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      <Card className="shadow-2">
        <DataTable value={items} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column body={(row) => getPrimaryKey(row)} header="ID" />
          <Column body={(row) => getNombre(row)} header="Nombre/Título" />
          <Column field="slug" header="Slug" />
          <Column field="deleted_at" header="Eliminado el" />
          <Column body={(row) => eliminadoPor(row)} header="Eliminado por" />
          <Column
            header="Acciones"
            body={(row) => (
              <Button
                label="Restaurar"
                icon="pi pi-replay"
                outlined
                onClick={() => restaurar(getPrimaryKey(row))}
              />
            )}
          />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}