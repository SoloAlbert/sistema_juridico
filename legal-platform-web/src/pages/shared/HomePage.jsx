import { Card } from 'primereact/card';
import Navbar from '../../components/Navbar';

export default function HomePage() {
  return (
    <div className="public-scene">
      <Navbar />

      <main className="public-shell">
        <section className="hero-legal">
          <div className="hero-legal__copy">
            <div className="hero-legal__eyebrow">Tu defensor de confianza</div>
            <h1 className="hero-legal__title">
              Defensa profesional,
              <br />
              confianza verificable.
            </h1>
            <p className="hero-legal__lead">
              Conecta clientes con abogados verificados, compara perfiles con criterio y gestiona
              asuntos legales desde una plataforma que prioriza seguridad, claridad y seguimiento real.
            </p>

            <div className="hero-legal__trust">
              <span>Abogados con validacion profesional</span>
              <span>Pagos y seguimiento centralizados</span>
              <span>Perfiles publicos con indicadores reales</span>
            </div>
          </div>

          <div className="hero-legal__visual">
            <div className="hero-legal__panel">
              <div className="hero-stat">
                <span className="hero-stat__label">Validacion</span>
                <strong>Profesional y documental</strong>
              </div>
              <div className="hero-stat">
                <span className="hero-stat__label">Contratacion</span>
                <strong>Comparacion clara de perfiles</strong>
              </div>
              <div className="hero-stat">
                <span className="hero-stat__label">Operacion</span>
                <strong>Casos, pagos y mensajes en un solo lugar</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="public-metrics">
          <article>
            <strong>Proceso serio</strong>
            <span>Revision documental, cédula y validacion administrativa.</span>
          </article>
          <article>
            <strong>Seleccion con criterio</strong>
            <span>Perfiles visibles, experiencia, modalidad y reputacion.</span>
          </article>
          <article>
            <strong>Seguimiento profesional</strong>
            <span>Conversaciones, citas, pagos y cierre de servicio.</span>
          </article>
        </section>

        <section className="public-grid">
          <Card className="public-card public-card--feature">
            <h3>Para clientes</h3>
            <p>
              Publica tu asunto, recibe postulaciones y contrata con más certeza gracias a perfiles
              verificados y seguimiento centralizado.
            </p>
          </Card>

          <Card className="public-card public-card--feature">
            <h3>Para abogados</h3>
            <p>
              Muestra tu perfil profesional con mejor presencia, construye confianza y opera tus
              casos desde una plataforma diseñada para servicios legales.
            </p>
          </Card>

          <Card className="public-card public-card--statement">
            <div className="public-card__badge">Criterio profesional</div>
            <h3>Una web legal no debe verse improvisada.</h3>
            <p>
              La experiencia publica ahora apunta a despacho moderno: mas jerarquia visual, mas
              confianza y menos apariencia de panel interno.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}
