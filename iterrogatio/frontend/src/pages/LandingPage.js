import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">Interrogatio</span>
        <button type="button" className="landing-login">
          Logar
        </button>
      </header>

      <main className="landing-main">
        <section className="landing-copy" aria-labelledby="landing-headline">
          <h1 id="landing-headline" className="landing-headline">
            Análise profissional de entrevistas com IA.
          </h1>
          <p className="landing-sub">
            Transforme suas entrevistas em insights claros e objetivos com feedback automático e inteligente.
          </p>
          <p className="landing-cta-line">
            <Link className="landing-demo-link" to="/analise">
              Ver análise em tempo real
            </Link>
          </p>
        </section>

        <section className="landing-hero" aria-label="Logo do produto">
          <img 
            src="/logoMenuHomem.png" 
            alt="Illustration" 
            className="landing-hero-image" 
          />
        </section>
      </main>
    </div>
  );
}
