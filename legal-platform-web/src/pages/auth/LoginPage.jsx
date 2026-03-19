import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);

      login({
        token: data.token,
        user: data.user
      });

      if (data.user.role === 'cliente') {
        navigate('/cliente');
      } else if (data.user.role === 'abogado') {
        navigate('/abogado');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Iniciar sesion" className="auth-card shadow-4">
      <p className="auth-card__lead">Ingresa a una plataforma legal con presencia, control y confianza.</p>

      <form onSubmit={handleSubmit} className="flex flex-column gap-3">
        <span className="p-float-label">
          <InputText
            id="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full"
          />
          <label htmlFor="email">Correo electronico</label>
        </span>

        <span className="p-float-label">
          <Password
            id="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            toggleMask
            feedback={false}
            className="w-full"
            inputClassName="w-full"
          />
          <label htmlFor="password">Contrasena</label>
        </span>

        {error && <Message severity="error" text={error} />}

        <Button
          type="submit"
          label={loading ? 'Entrando...' : 'Entrar'}
          icon="pi pi-sign-in"
          loading={loading}
        />
      </form>
    </Card>
  );
}
