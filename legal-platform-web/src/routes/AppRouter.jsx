import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import { APP_BASE_PATH } from '../config/runtime';

import HomePage from '../pages/shared/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

import DirectorioAbogadosPage from '../pages/public/DirectorioAbogadosPage';
import PerfilPublicoAbogadoPage from '../pages/public/PerfilPublicoAbogadoPage';

import ClienteDashboard from '../pages/cliente/ClienteDashboard';
import CrearCasoPage from '../pages/cliente/CrearCasoPage';
import MisCasosPage from '../pages/cliente/MisCasosPage';
import DetalleCasoPage from '../pages/cliente/DetalleCasoPage';
import PagoCasoPage from '../pages/cliente/PagoCasoPage';
import MisPagosPage from '../pages/cliente/MisPagosPage';

import AbogadoDashboard from '../pages/abogado/AbogadoDashboard';
import MiPerfilAbogadoPage from '../pages/abogado/MiPerfilAbogadoPage';
import CasosDisponiblesPage from '../pages/abogado/CasosDisponiblesPage';
import DetalleCasoDisponiblePage from '../pages/abogado/DetalleCasoDisponiblePage';
import MisCasosAbogadoPage from '../pages/abogado/MisCasosAbogadoPage';
import DetalleCasoAbogadoPage from '../pages/abogado/DetalleCasoAbogadoPage';
import IngresosAbogadoPage from '../pages/abogado/IngresosAbogadoPage';
import NotificacionesAbogadoPage from '../pages/abogado/NotificacionesAbogadoPage';
import MiVerificacionPage from '../pages/abogado/MiVerificacionPage';

import ConversacionesPage from '../pages/shared/ConversacionesPage';
import ConversacionDetallePage from '../pages/shared/ConversacionDetallePage';
import CitasPage from '../pages/shared/CitasPage';
import CierreCasoPage from '../pages/shared/CierreCasoPage';

import PlantillasPage from '../pages/abogado/PlantillasPage';
import DetallePlantillaPage from '../pages/abogado/DetallePlantillaPage';
import MisComprasPlantillasPage from '../pages/abogado/MisComprasPlantillasPage';
import MisDocumentosPage from '../pages/abogado/MisDocumentosPage';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPlantillasPage from '../pages/admin/AdminPlantillasPage';
import AdminPlantillaDetallePage from '../pages/admin/AdminPlantillaDetallePage';
import NotFoundPage from '../pages/NotFoundPage';

import AdminBloquesHtmlPage from '../pages/admin/AdminBloquesHtmlPage';
import AdminBloqueHtmlDetallePage from '../pages/admin/AdminBloqueHtmlDetallePage';

import AdminPlantillasMaestrasPage from '../pages/admin/AdminPlantillasMaestrasPage';
import AdminPlantillaMaestraDetallePage from '../pages/admin/AdminPlantillaMaestraDetallePage';

import AdminTiposDocumentoPage from '../pages/admin/AdminTiposDocumentoPage';
import AdminTipoDocumentoDetallePage from '../pages/admin/AdminTipoDocumentoDetallePage';
import AdminTipoDocumentoSugerenciaPage from '../pages/admin/AdminTipoDocumentoSugerenciaPage';

import AdminBitacoraPage from '../pages/admin/AdminBitacoraPage';

import AdminPapeleraPage from '../pages/admin/AdminPapeleraPage';
import AdminVerificacionesPage from '../pages/admin/AdminVerificacionesPage';

export default function AppRouter() {
  return (
    <BrowserRouter basename={APP_BASE_PATH}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/abogados" element={<DirectorioAbogadosPage />} />
        <Route path="/abogados/:id" element={<PerfilPublicoAbogadoPage />} />

        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          }
        />

        <Route
          path="/cliente"
          element={
            <ProtectedRoute role="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/crear-caso"
          element={
            <ProtectedRoute role="cliente">
              <CrearCasoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/mis-casos"
          element={
            <ProtectedRoute role="cliente">
              <MisCasosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/mis-casos/:id"
          element={
            <ProtectedRoute role="cliente">
              <DetalleCasoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/mis-casos/:id/pago"
          element={
            <ProtectedRoute role="cliente">
              <PagoCasoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/mis-pagos"
          element={
            <ProtectedRoute role="cliente">
              <MisPagosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/conversaciones"
          element={
            <ProtectedRoute role="cliente">
              <ConversacionesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/conversaciones/:id"
          element={
            <ProtectedRoute role="cliente">
              <ConversacionDetallePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/citas"
          element={
            <ProtectedRoute role="cliente">
              <CitasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente/casos/:id/cierre"
          element={
            <ProtectedRoute role="cliente">
              <CierreCasoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado"
          element={
            <ProtectedRoute role="abogado">
              <AbogadoDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/mi-perfil"
          element={
            <ProtectedRoute role="abogado">
              <MiPerfilAbogadoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/verificacion"
          element={
            <ProtectedRoute role="abogado">
              <MiVerificacionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/casos-disponibles"
          element={
            <ProtectedRoute role="abogado">
              <CasosDisponiblesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/casos-disponibles/:id"
          element={
            <ProtectedRoute role="abogado">
              <DetalleCasoDisponiblePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/mis-casos"
          element={
            <ProtectedRoute role="abogado">
              <MisCasosAbogadoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/mis-casos/:id"
          element={
            <ProtectedRoute role="abogado">
              <DetalleCasoAbogadoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/ingresos"
          element={
            <ProtectedRoute role="abogado">
              <IngresosAbogadoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/notificaciones"
          element={
            <ProtectedRoute role="abogado">
              <NotificacionesAbogadoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/conversaciones"
          element={
            <ProtectedRoute role="abogado">
              <ConversacionesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/conversaciones/:id"
          element={
            <ProtectedRoute role="abogado">
              <ConversacionDetallePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/citas"
          element={
            <ProtectedRoute role="abogado">
              <CitasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/abogado/casos/:id/cierre"
          element={
            <ProtectedRoute role="abogado">
              <CierreCasoPage />
            </ProtectedRoute>
          }
        />
<Route
  path="/abogado/plantillas"
  element={
    <ProtectedRoute role="abogado">
      <PlantillasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/abogado/plantillas/compras"
  element={
    <ProtectedRoute role="abogado">
      <MisComprasPlantillasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/abogado/plantillas/:id"
  element={
    <ProtectedRoute role="abogado">
      <DetallePlantillaPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/abogado/documentos"
  element={
    <ProtectedRoute role="abogado">
      <MisDocumentosPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin"
  element={
    <ProtectedRoute role="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/plantillas"
  element={
    <ProtectedRoute role="admin">
      <AdminPlantillasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/plantillas/:id"
  element={
    <ProtectedRoute role="admin">
      <AdminPlantillaDetallePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/bloques-html"
  element={
    <ProtectedRoute role="admin">
      <AdminBloquesHtmlPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/bloques-html/:id"
  element={
    <ProtectedRoute role="admin">
      <AdminBloqueHtmlDetallePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/plantillas-maestras"
  element={
    <ProtectedRoute role="admin">
      <AdminPlantillasMaestrasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/plantillas-maestras/:id"
  element={
    <ProtectedRoute role="admin">
      <AdminPlantillaMaestraDetallePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/tipos-documento"
  element={
    <ProtectedRoute role="admin">
      <AdminTiposDocumentoPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/tipos-documento"
  element={
    <ProtectedRoute role="admin">
      <AdminTiposDocumentoPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/tipos-documento/:id"
  element={
    <ProtectedRoute role="admin">
      <AdminTipoDocumentoDetallePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/tipos-documento/:id/sugerencia"
  element={
    <ProtectedRoute role="admin">
      <AdminTipoDocumentoSugerenciaPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/tipos-documento/:id/sugerencia"
  element={
    <ProtectedRoute role="admin">
      <AdminTipoDocumentoSugerenciaPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/verificaciones"
  element={
    <ProtectedRoute role="admin">
      <AdminVerificacionesPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/bitacora"
  element={
    <ProtectedRoute role="admin">
      <AdminBitacoraPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/papelera"
  element={
    <ProtectedRoute role="admin">
      <AdminPapeleraPage />
    </ProtectedRoute>
  }
/>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
