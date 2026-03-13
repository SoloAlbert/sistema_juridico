import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import Navbar from '../../components/Navbar';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen surface-ground">
      <Navbar />

      <div className="p-4 md:p-6">
        <div className="grid">
          <div className="col-12">
            <Card className="shadow-3">
              <div className="text-center py-6">
                <h1 className="text-4xl mb-3">Marketplace Legal</h1>
                <p className="text-lg text-700 mb-4">
                  Conecta clientes con abogados, compara perfiles, revisa reseñas y gestiona todo desde una sola plataforma.
                </p>

                <div className="flex justify-content-center gap-3 flex-wrap">
                  <Button
                    label="Buscar abogados"
                    icon="pi pi-search"
                    onClick={() => navigate('/abogados')}
                  />
                  <Button
                    label="Iniciar sesión"
                    icon="pi pi-sign-in"
                    outlined
                    onClick={() => navigate('/login')}
                  />
                  <Button
                    label="Crear cuenta"
                    icon="pi pi-user-plus"
                    outlined
                    onClick={() => navigate('/register')}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}