import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

export default function AdminTiposDocumentoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/tipos-documento');
      setItems(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar tipos de documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <Card title="Tipos de documento" className="shadow-2">
        <DataTable value={items} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column field="nombre" header="Nombre" />
          <Column field="slug" header="Slug" />
          <Column field="descripcion" header="Descripción" />
          <Column
            header="Sugerencia"
            body={(row) =>
              row.id_sugerencia ? (
                <Tag value="Configurada" severity="success" />
              ) : (
                <Tag value="Sin configurar" severity="warning" />
              )
            }
          />
          <Column
            header="Acciones"
            body={(row) => (
              <Button
                label="Editar sugerencia"
                icon="pi pi-pencil"
                size="small"
                onClick={() => navigate(`/admin/tipos-documento/${row.id_tipo_documento}/sugerencia`)}
              />
            )}
          />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}