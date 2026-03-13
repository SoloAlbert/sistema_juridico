import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ClienteMenu from '../../components/ClienteMenu';
import AbogadoMenu from '../../components/AbogadoMenu';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function ConversacionesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversaciones, setConversaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerConversaciones();
  }, []);

  const obtenerConversaciones = async () => {
    try {
      const { data } = await api.get('/conversaciones');
      setConversaciones(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const menu = user?.role === 'cliente' ? <ClienteMenu /> : <AbogadoMenu />;

  const participanteBody = (row) => {
    if (user?.role === 'cliente') {
      return `${row.abogado_nombre} ${row.abogado_apellido_paterno || ''} ${row.abogado_apellido_materno || ''}`;
    }
    return `${row.cliente_nombre} ${row.cliente_apellido_paterno || ''} ${row.cliente_apellido_materno || ''}`;
  };

  const estadoBody = (row) => <Tag value={row.estado} severity="info" />;

  const accionesBody = (row) => {
    const base = user?.role === 'cliente' ? '/cliente' : '/abogado';
    return (
      <Button
        label="Abrir"
        icon="pi pi-comments"
        size="small"
        onClick={() => navigate(`${base}/conversaciones/${row.id_conversacion}`)}
      />
    );
  };

  return (
    <DashboardLayout>
      {menu}

      <Card title="Conversaciones" className="shadow-2">
        {error && <Message severity="error" text={error} className="w-full mb-3" />}

        <DataTable
          value={conversaciones}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No tienes conversaciones"
        >
          <Column field="folio_caso" header="Folio caso" />
          <Column field="titulo" header="Caso" />
          <Column header={user?.role === 'cliente' ? 'Abogado' : 'Cliente'} body={participanteBody} />
          <Column field="ultimo_mensaje" header="Último mensaje" />
          <Column header="Estado" body={estadoBody} />
          <Column field="fecha_ultimo_mensaje" header="Fecha" />
          <Column header="Acciones" body={accionesBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}