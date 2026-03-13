import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';

export default function MisComprasPlantillasPage() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerCompras();
  }, []);

  const obtenerCompras = async () => {
    try {
      const { data } = await api.get('/plantillas/mis-compras');
      setCompras(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener compras');
    } finally {
      setLoading(false);
    }
  };

  const estadoBody = (row) => {
    const severity = row.estatus_pago === 'pagado' ? 'success' : 'warning';
    return <Tag value={row.estatus_pago} severity={severity} />;
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />
      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <Card title="Mis compras de plantillas" className="shadow-2">
        <DataTable value={compras} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column field="titulo" header="Plantilla" />
          <Column field="descripcion_corta" header="Descripción" />
          <Column field="monto_pagado" header="Monto" />
          <Column field="fecha_pago" header="Fecha pago" />
          <Column header="Estado" body={estadoBody} />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}