"use client";

import { useEffect, useRef } from "react";

// ─── Tarjeta de métrica simple ────────────────────────────────
const MetricCard = ({ icon, label, value, sub, accent }) => (
  <div className={`metric-card ${accent ? "accent-" + accent : ""}`}>
    <div className="metric-icon">{icon}</div>
    <div className="metric-body">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  </div>
);

// ─── Fila de energía (día/mes/año) ───────────────────────────
const EnergyRow = ({ label, dia, mes, año, prefix = "", suffix = "" }) => (
  <div className="energy-row">
    <span className="energy-label">{label}</span>
    <div className="energy-values">
      <span><strong>{prefix}{dia}{suffix}</strong><em>Día</em></span>
      <span><strong>{prefix}{mes}{suffix}</strong><em>Mes</em></span>
      <span><strong>{prefix}{año}{suffix}</strong><em>Año</em></span>
    </div>
  </div>
);

// ─── Barra de porcentaje ──────────────────────────────────────
const ProgressBar = ({ label, value, color, total = 100 }) => (
  <div className="progress-wrap">
    <div className="progress-header">
      <span>{label}</span>
      <strong>{value}%</strong>
    </div>
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  </div>
);

// ─── Gráfica de dona (canvas) ────────────────────────────────
const DonutChart = ({ data, colors, size = 180 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const total = data.reduce((s, d) => s + d.value, 0);
    let start = -Math.PI / 2;
    const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.22;

    data.forEach((item, i) => {
      const slice = (item.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      start += slice;
    });

    // Agujero central
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(10,15,25,0.95)";
    ctx.fill();
  }, [data, size, colors]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: "50%" }}
    />
  );
};

// ─── Gráfica de barras ────────────────────────────────────────
const BarChart = ({ items, color }) => {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="bar-chart">
      {items.map((item, i) => (
        <div key={i} className="bar-item">
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item.value / max) * 100}%`, background: color }}
            />
            <span className="bar-value">{item.display}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function Resultados({ data }) {
  if (!data) return null;

  const fmt = (n, dec = 0) =>
    new Intl.NumberFormat("es-CO", { maximumFractionDigits: dec }).format(n);

  const cop = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  const costoItems = [
    { label: "Paneles", value: data.desglose_costos.paneles.valor, display: `${data.desglose_costos.paneles.pct}%` },
    { label: "Baterías", value: data.desglose_costos.baterias.valor, display: `${data.desglose_costos.baterias.pct}%` },
    { label: "MPPT", value: data.desglose_costos.mppt.valor, display: `${data.desglose_costos.mppt.pct}%` },
    { label: "Aires", value: data.desglose_costos.aires.valor, display: `${data.desglose_costos.aires.pct}%` },
  ];

  const donutData = costoItems.map((c, i) => ({ value: c.value }));
  const donutColors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

  return (
    <div className="resultados-dashboard">

      {/* ── MENSAJES INTELIGENTES ── */}
      <div className="mensajes-section">
        {data.mensajes.map((msg, i) => (
          <div key={i} className="mensaje-badge">{msg}</div>
        ))}
      </div>

      {/* ── SECCIÓN 1: ENERGÍA ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>⚡</span> Energía Generada
        </h3>
        <div className="result-grid-3">
          <MetricCard icon="🌞" label="kWh por día" value={`${fmt(data.kwh_dia, 2)} kWh`} accent="yellow" />
          <MetricCard icon="📅" label="kWh por mes" value={`${fmt(data.kwh_mes, 1)} kWh`} accent="yellow" />
          <MetricCard icon="📆" label="kWh por año" value={`${fmt(data.kwh_año, 0)} kWh`} accent="yellow" />
        </div>
        <div className="sub-cards">
          <div className="sub-card">
            <h4>Eficiencia del sistema</h4>
            <p>Eficiencia final tras degradación: <strong>{data.eficiencia_final}%</strong></p>
            <p>Degradación acumulada: <strong>{data.degradacion_pct}%</strong></p>
          </div>
          <div className="sub-card">
            <h4>Valor del kWh según clima</h4>
            <div className="clima-table">
              <div><span>☀️ Soleado</span><strong>{fmt(data.valor_kwh_soleado, 2)} kWh/día</strong></div>
              <div><span>⛅ Nublado</span><strong>{fmt(data.valor_kwh_nublado, 2)} kWh/día</strong></div>
              <div><span>🌧️ Lluvia</span><strong>{fmt(data.valor_kwh_lluvia, 2)} kWh/día</strong></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: FRACCIÓN SOLAR ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>⚖️</span> Fracción Solar vs Red
        </h3>
        <div className="fraccion-wrap">
          <div className="fraccion-bars">
            <ProgressBar label="🌞 Energía Solar" value={data.fraccion_solar_pct} color="linear-gradient(90deg, #f59e0b, #fbbf24)" />
            <ProgressBar label="🔌 Red Eléctrica" value={data.fraccion_red_pct} color="linear-gradient(90deg, #6366f1, #818cf8)" />
          </div>
          <div className="fraccion-desc">
            <p>Tu sistema solar cubre <strong>{data.fraccion_solar_pct}%</strong> de tu consumo diario.</p>
            <p>Dependes de la red eléctrica para el <strong>{data.fraccion_red_pct}%</strong> restante.</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: FINANZAS ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>💰</span> Análisis Financiero
        </h3>
        <div className="result-grid-2">
          <MetricCard icon="📉" label="Costo total del sistema" value={cop(data.costo_total)} sub="Sin mantenimiento" accent="red" />
          <MetricCard icon="🏆" label="Retorno de inversión" value={`${data.roi_años} años`} sub={`${fmt(data.roi_meses, 0)} meses`} accent="green" />
          <MetricCard icon="💵" label="Ahorro mensual" value={cop(data.ahorro_mensual)} sub="Energía + venta excedente" accent="green" />
          <MetricCard icon="📊" label="Ahorro anual" value={cop(data.ahorro_anual)} sub="Proyección primer año" accent="green" />
        </div>
        <div className="sub-cards">
          <div className="sub-card">
            <h4>Desglose de costos</h4>
            <BarChart items={costoItems} color="#f59e0b" />
          </div>
          <div className="sub-card donut-card">
            <h4>Distribución de inversión</h4>
            <div className="donut-wrap">
              <DonutChart data={donutData} colors={donutColors} size={160} />
              <div className="donut-legend">
                {costoItems.map((item, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: donutColors[i] }} />
                    <span>{item.label}: {item.display}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: VENTA DE ENERGÍA ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🏭</span> Venta a Electrohuila (RENS)
        </h3>
        {data.excedente_dia > 0 ? (
          <>
            <EnergyRow
              label="⚡ Excedente"
              dia={`${fmt(data.excedente_dia, 2)} kWh`}
              mes={`${fmt(data.excedente_mes, 1)} kWh`}
              año={`${fmt(data.excedente_año, 0)} kWh`}
            />
            <EnergyRow
              label="💵 Ingreso venta"
              dia={cop(data.venta_dia)}
              mes={cop(data.venta_mes)}
              año={cop(data.venta_año)}
            />
            <p className="nota-venta">
              📋 Bajo la Ley 1715 de 2014 y la Resolución CREG 030-2018 puedes vender excedentes a Electrohuila como usuario FNCE.
            </p>
          </>
        ) : (
          <div className="no-excedente">
            <span>🔌</span>
            <p>Tu sistema no genera excedentes. Aumenta la potencia instalada o reduce el consumo para poder vender energía.</p>
          </div>
        )}
      </section>

      {/* ── SECCIÓN 5: BATERÍAS ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🔋</span> Sistema de Almacenamiento
        </h3>
        <div className="result-grid-3">
          <MetricCard icon="⚡" label="Capacidad" value={`${data.energia_bateria_kwh} kWh`} accent="blue" />
          <MetricCard icon="🔄" label="Vida útil" value={`${data.vida_bateria_años} años`} sub={`≈ ${fmt(data.vida_bateria_meses, 0)} meses`} accent="blue" />
          <MetricCard icon="🛠️" label="Mant. a 5 años" value={cop(data.mantenimiento_5_años)} sub={`${cop(data.mantenimiento_mensual)}/mes`} accent="purple" />
        </div>
      </section>

      {/* ── SECCIÓN 6: BTU Y CLIMATIZACIÓN ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🧊</span> Cálculo BTU y Climatización
        </h3>
        <div className="result-grid-3">
          <MetricCard icon="🌡️" label="BTU requeridos" value={`${fmt(data.btu, 0)} BTU/h`} sub="Área × 600" accent="cyan" />
          <MetricCard icon="❄️" label="Toneladas de frío" value={`${data.btu_toneladas} TR`} sub="BTU / 12,000" accent="cyan" />
          <MetricCard icon="⚡" label="Potencia AC" value={`${data.potencia_ac_kw} kW`} sub="Consumo eléctrico" accent="cyan" />
        </div>
        <p className="nota-venta">
          💡 Para enfriar el área indicada necesitas aproximadamente <strong>{data.btu_toneladas} toneladas de refrigeración</strong> ({fmt(data.btu, 0)} BTU/h). Los aires DC a 48V son ideales para sistema solar sin inversor.
        </p>
      </section>

      {/* ── SECCIÓN 7: MANTENIMIENTO ── */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🛠️</span> Mantenimiento Preventivo
        </h3>
        <div className="result-grid-3">
          <MetricCard icon="📅" label="Mensual" value={cop(data.mantenimiento_mensual)} accent="purple" />
          <MetricCard icon="📆" label="Anual" value={cop(data.mantenimiento_anual)} accent="purple" />
          <MetricCard icon="🏗️" label="Costo total + mant." value={cop(data.costo_total_con_mantenimiento)} sub="Vida útil baterías" accent="red" />
        </div>
      </section>

    </div>
  );
}
