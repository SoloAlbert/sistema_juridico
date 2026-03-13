import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import AdminMenu from '../../components/AdminMenu';
import api from '../../api/axios';

import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

export default function AdminTipoDocumentoSugerenciaPage() {
  const { id } = useParams();

  const [tipo, setTipo] = useState(null);
  const [plantillasMaestras, setPlantillasMaestras] = useState([]);
  const [variables, setVariables] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [form, setForm] = useState({
    id_plantilla_maestra: null,
    notas_sugeridas: '',
    activo: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargar();
  }, [id]);

  const cargar = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/tipos-documento/${id}/sugerencia`);

      setTipo(data.data.tipo);

      setPlantillasMaestras(
        (data.data.plantillas_maestras || []).map((item) => ({
          label: item.nombre,
          value: item.id_plantilla_maestra
        }))
      );

      const sugerencia = data.data.sugerencia;

      if (sugerencia) {
        setForm({
          id_plantilla_maestra: sugerencia.id_plantilla_maestra || null,
          notas_sugeridas: sugerencia.notas_sugeridas || '',
          activo: !!sugerencia.activo
        });

        let vars = [];
        let blqs = [];

        try {
          vars = sugerencia.variables_sugeridas_json
            ? JSON.parse(sugerencia.variables_sugeridas_json)
            : [];
        } catch {
          vars = [];
        }

        try {
          blqs = sugerencia.bloques_sugeridos_json
            ? JSON.parse(sugerencia.bloques_sugeridos_json)
            : [];
        } catch {
          blqs = [];
        }

        setVariables(Array.isArray(vars) ? vars : []);
        setBloques(Array.isArray(blqs) ? blqs : []);
      } else {
        setForm({
          id_plantilla_maestra: null,
          notas_sugeridas: '',
          activo: true
        });
        setVariables([]);
        setBloques([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar sugerencia');
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data } = await api.post(`/admin/tipos-documento/${id}/sugerencia`, {
        ...form,
        variables_sugeridas_json: variables,
        bloques_sugeridos_json: bloques
      });

      setSuccess(data.message || 'Sugerencia guardada');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar sugerencia');
    } finally {
      setSaving(false);
    }
  };

  const agregarVariable = () => {
    setVariables((prev) => [
      ...prev,
      {
        nombre_variable: '',
        label_campo: '',
        tipo_campo: 'texto',
        placeholder: '',
        ayuda: '',
        requerido: true,
        orden: prev.length + 1,
        configuracion_json: null
      }
    ]);
  };

  const actualizarVariable = (index, field, value) => {
    setVariables((prev) => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        [field]: value
      };
      return copia;
    });
  };

  const quitarVariable = (index) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarBloque = () => {
    setBloques((prev) => [
      ...prev,
      {
        tipo: 'html_libre',
        nombre: '',
        html_base: ''
      }
    ]);
  };

  const actualizarBloque = (index, field, value) => {
    setBloques((prev) => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        [field]: value
      };
      return copia;
    });
  };

  const quitarBloque = (index) => {
    setBloques((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <AdminMenu />

      {error && <Message severity="error" text={error} className="w-full mb-3" />}
      {success && <Message severity="success" text={success} className="w-full mb-3" />}

      {loading ? (
        <Card><p>Cargando sugerencia...</p></Card>
      ) : (
        <div className="grid">
          <div className="col-12">
            <Card title={`Sugerencia inteligente: ${tipo?.nombre || ''}`} className="shadow-2">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <label className="block mb-2">Plantilla maestra sugerida</label>
                  <Dropdown
                    value={form.id_plantilla_maestra}
                    options={plantillasMaestras}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, id_plantilla_maestra: e.value }))
                    }
                    className="w-full"
                    placeholder="Selecciona una maestra"
                    showClear
                  />
                </div>

                <div className="col-12 md:col-6 flex align-items-center">
                  <div className="flex align-items-center gap-2 mt-4">
                    <Checkbox
                      checked={form.activo}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, activo: e.checked }))
                      }
                    />
                    <label>Sugerencia activa</label>
                  </div>
                </div>

                <div className="col-12">
                  <label className="block mb-2">Notas sugeridas</label>
                  <InputTextarea
                    value={form.notas_sugeridas}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notas_sugeridas: e.target.value }))
                    }
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 lg:col-6">
            <Card title="Variables sugeridas" className="shadow-2">
              {variables.map((item, index) => (
                <div key={index} className="surface-50 border-round p-3 mb-3">
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Variable</label>
                      <InputText
                        value={item.nombre_variable}
                        onChange={(e) => actualizarVariable(index, 'nombre_variable', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Label</label>
                      <InputText
                        value={item.label_campo}
                        onChange={(e) => actualizarVariable(index, 'label_campo', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-4">
                      <label className="block mb-2">Tipo</label>
                      <Dropdown
                        value={item.tipo_campo}
                        options={[
                          { label: 'Texto', value: 'texto' },
                          { label: 'Número', value: 'numero' },
                          { label: 'Fecha', value: 'fecha' },
                          { label: 'Textarea', value: 'textarea' },
                          { label: 'Select', value: 'select' },
                          { label: 'Checkbox', value: 'checkbox' }
                        ]}
                        onChange={(e) => actualizarVariable(index, 'tipo_campo', e.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-4">
                      <label className="block mb-2">Orden</label>
                      <InputText
                        value={item.orden}
                        onChange={(e) => actualizarVariable(index, 'orden', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-4 flex align-items-end">
                      <Button
                        label="Quitar"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={() => quitarVariable(index)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12">
                      <label className="block mb-2">Placeholder</label>
                      <InputText
                        value={item.placeholder || ''}
                        onChange={(e) => actualizarVariable(index, 'placeholder', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12">
                      <label className="block mb-2">Ayuda</label>
                      <InputText
                        value={item.ayuda || ''}
                        onChange={(e) => actualizarVariable(index, 'ayuda', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12">
                      <div className="flex align-items-center gap-2">
                        <Checkbox
                          checked={!!item.requerido}
                          onChange={(e) => actualizarVariable(index, 'requerido', e.checked)}
                        />
                        <label>Requerido</label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button label="Agregar variable" icon="pi pi-plus" outlined onClick={agregarVariable} />
            </Card>
          </div>

          <div className="col-12 lg:col-6">
            <Card title="Bloques sugeridos" className="shadow-2">
              {bloques.map((item, index) => (
                <div key={index} className="surface-50 border-round p-3 mb-3">
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Nombre</label>
                      <InputText
                        value={item.nombre || ''}
                        onChange={(e) => actualizarBloque(index, 'nombre', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12 md:col-6">
                      <label className="block mb-2">Tipo</label>
                      <Dropdown
                        value={item.tipo || 'html_libre'}
                        options={[
                          { label: 'HTML libre', value: 'html_libre' },
                          { label: 'Bloque reutilizable', value: 'bloque' }
                        ]}
                        onChange={(e) => actualizarBloque(index, 'tipo', e.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="col-12">
                      <label className="block mb-2">HTML base</label>
                      <InputTextarea
                        value={item.html_base || ''}
                        onChange={(e) => actualizarBloque(index, 'html_base', e.target.value)}
                        rows={6}
                        className="w-full font-mono"
                      />
                    </div>

                    <div className="col-12">
                      <Button
                        label="Quitar bloque"
                        icon="pi pi-trash"
                        severity="danger"
                        outlined
                        onClick={() => quitarBloque(index)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button label="Agregar bloque" icon="pi pi-plus" outlined onClick={agregarBloque} />
            </Card>
          </div>

          <div className="col-12">
            <Button
              label={saving ? 'Guardando...' : 'Guardar sugerencia'}
              icon="pi pi-save"
              loading={saving}
              onClick={guardar}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}