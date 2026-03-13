import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-column align-items-center justify-content-center min-h-screen p-4">
      <h1 className="text-6xl m-0">404</h1>
      <p className="text-700 mb-4">Página no encontrada.</p>
      <Button label="Volver al inicio" onClick={() => navigate('/')} />
    </div>
  );
}