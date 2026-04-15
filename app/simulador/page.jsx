"use client";

import { useState } from "react";
import Formulario from "@/components/Formulario";
import Resultados from "@/components/Resultados";
import { simularSolar } from "@/lib/calculos";

export default function SimuladorPage() {
  const [resultados, setResultados] = useState(null);
  const [calculando, setCalculando] = useState(false);

  const handleSimular = (data) => {
    setCalculando(true);
    setTimeout(() => {
      const res = simularSolar(data);
      setResultados(res);
      setCalculando(false);
      // Scroll a resultados
      setTimeout(() => {
        document.getElementById("resultados-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 600);
  };

  return (
    <main className="sim-main">
      {/* ── HEADER ── */}
      <header className="sim-header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-icon">☀️</span>
            <div>
              <h1>Simulador Solar</h1>
              <p>Sistema técnico-financiero para energía fotovoltaica</p>
            </div>
          </div>
          <div className="header-badges">
            <span className="badge">Huila, Colombia</span>
            <span className="badge">Ley 1715 FNCE</span>
            <span className="badge">Off-grid / On-grid</span>
          </div>
        </div>
      </header>

      <div className="sim-layout">
        {/* ── COLUMNA FORMULARIO ── */}
        <aside className="sim-sidebar">
          <div className="sidebar-header">
            <h2>⚙️ Configuración del sistema</h2>
            <p>Ingresa los datos de tu instalación solar</p>
          </div>
          <Formulario onSimular={handleSimular} />
        </aside>

        {/* ── COLUMNA RESULTADOS ── */}
        <section className="sim-results" id="resultados-section">
          {calculando && (
            <div className="loading-screen">
              <div className="loading-sun">☀️</div>
              <p>Calculando tu sistema solar...</p>
            </div>
          )}

          {!calculando && !resultados && (
            <div className="empty-state">
              <div className="empty-icon">🌞</div>
              <h3>Configura tu sistema</h3>
              <p>Ingresa los parámetros de tu instalación solar en el formulario y presiona <strong>Simular Sistema Solar</strong> para ver el análisis completo.</p>
              <ul>
                <li>⚡ Generación energética (día, mes, año)</li>
                <li>💰 Retorno de inversión</li>
                <li>🏭 Venta de excedentes a Electrohuila</li>
                <li>🔋 Vida útil de baterías</li>
                <li>🧊 Cálculo de BTU</li>
              </ul>
            </div>
          )}

          {!calculando && resultados && <Resultados data={resultados} />}
        </section>
      </div>

      <footer className="sim-footer">
        <p>Simulador Solar © 2025 · Basado en datos técnicos para el <strong>Huila, Colombia</strong> · Tarifa Electrohuila referencial · Ley 1715 FNCE</p>
      </footer>
    </main>
  );
}
