const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const especialidadesRoutes = require('./routes/especialidades.routes');
const abogadosRoutes = require('./routes/abogados.routes');
const casosRoutes = require('./routes/casos.routes');
const pagosRoutes = require('./routes/pagos.routes');
const conversacionesRoutes = require('./routes/conversaciones.routes');
const citasRoutes = require('./routes/citas.routes');
const resenasRoutes = require('./routes/resenas.routes');
const plantillasRoutes = require('./routes/plantillas.routes');
const adminPlantillasRoutes = require('./routes/adminPlantillas.routes');
const adminBloquesHtmlRoutes = require('./routes/adminBloquesHtml.routes');
const adminPlantillasMaestrasRoutes = require('./routes/adminPlantillasMaestras.routes');
const adminTiposDocumentoRoutes = require('./routes/adminTiposDocumento.routes');
const adminBitacoraRoutes = require('./routes/adminBitacora.routes');
const adminPapeleraRoutes = require('./routes/adminPapelera.routes');
const adminDashboardRoutes = require('./routes/adminDashboard.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API legal-platform funcionando correctamente'
  });
});

app.use(
  '/documentos_generados',
  express.static(path.join(__dirname, '../storage/documentos_generados'))
);

app.use(
  '/plantillas_base',
  express.static(path.join(__dirname, '../storage/plantillas_base'))
);

app.use('/api/auth', authRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/abogados', abogadosRoutes);
app.use('/api/casos', casosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/conversaciones', conversacionesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/plantillas', plantillasRoutes);
app.use('/api/admin/plantillas', adminPlantillasRoutes);
app.use('/api/admin/bloques-html', adminBloquesHtmlRoutes);
app.use('/api/admin/plantillas-maestras', adminPlantillasMaestrasRoutes);
app.use('/api/admin/tipos-documento', adminTiposDocumentoRoutes);
app.use('/api/admin/bitacora', adminBitacoraRoutes);
app.use('/api/admin/papelera', adminPapeleraRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

const PORT = process.env.PORT || 3003;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  await testConnection();
});