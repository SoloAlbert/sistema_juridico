import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AbogadoMenu from '../../components/AbogadoMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';

export default function MisDocumentosPage() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const descargarBody = (row) => {
  const url = `http://localhost:3003${row.ruta_archivo_generado}`;
  return (
    <Button
      label="Descargar"
      icon="pi pi-download"
      size="small"
      onClick={() => window.open(url, '_blank')}
    />
  );
};

  useEffect(() => {
    obtenerDocumentos();
  }, []);

  const obtenerDocumentos = async () => {
    try {
      const { data } = await api.get('/plantillas/mis-documentos');
      setDocumentos(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener documentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <AbogadoMenu />
      {error && <Message severity="error" text={error} className="w-full mb-3" />}

      <Card title="Mis documentos generados" className="shadow-2">
        <DataTable value={documentos} loading={loading} paginator rows={10} responsiveLayout="scroll">
          <Column field="titulo_documento" header="Documento" />
          <Column field="plantilla_titulo" header="Plantilla base" />
          <Column field="formato_salida" header="Formato" body={(row) => <Tag value={row.formato_salida} severity="info" />} />
          <Column field="estatus" header="Estatus" body={(row) => <Tag value={row.estatus} severity="success" />} />
          <Column header="Archivo" body={descargarBody} />
          <Column field="created_at" header="Fecha" />
        </DataTable>
      </Card>
    </DashboardLayout>
  );
}
