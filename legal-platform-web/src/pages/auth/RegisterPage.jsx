import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import api from '../../api/axios';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
    password: '',
    role: 'cliente'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { label: 'Cliente', value: 'cliente' },
    { label: 'Abogado', value: 'abogado' }
  ];

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', form);
      setSuccess(data.message || 'Registro exitoso');

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Crear cuenta" className="shadow-4">
      <form onSubmit={handleSubmit} className="flex flex-column gap-3">
        <InputText
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Nombre"
        />

        <InputText
          value={form.apellido_paterno}
          onChange={(e) => handleChange('apellido_paterno', e.target.value)}
          placeholder="Apellido paterno"
        />

        <InputText
          value={form.apellido_materno}
          onChange={(e) => handleChange('apellido_materno', e.target.value)}
          placeholder="Apellido materno"
        />

        <InputText
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Correo electrónico"
        />

        <InputText
          value={form.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          placeholder="Teléfono"
        />

        <Password
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Contraseña"
          toggleMask
          feedback={false}
          className="w-full"
          inputClassName="w-full"
        />

        <Dropdown
          value={form.role}
          options={roles}
          onChange={(e) => handleChange('role', e.value)}
          placeholder="Selecciona rol"
        />

        {error && <Message severity="error" text={error} />}
        {success && <Message severity="success" text={success} />}

        <Button
          type="submit"
          label={loading ? 'Registrando...' : 'Registrarme'}
          icon="pi pi-user-plus"
          loading={loading}
        />
      </form>
    </Card>
  );
}