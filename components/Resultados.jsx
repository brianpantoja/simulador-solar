"use client";

import { useEffect, useRef, useState } from "react";

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

const EnergyRow = ({ label, dia, mes, ano }) => (
  <div className="energy-row">
    <span className="energy-label">{label}</span>
    <div className="energy-values">
      <span>
        <strong>{dia}</strong>
        <em>Dia</em>
      </span>
      <span>
        <strong>{mes}</strong>
        <em>Mes</em>
      </span>
      <span>
        <strong>{ano}</strong>
        <em>Año</em>
      </span>
    </div>
  </div>
);

const ProgressBar = ({ label, value, color }) => (
  <div className="progress-wrap">
    <div className="progress-header">
      <span>{label}</span>
      <strong>{value}%</strong>
    </div>
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: Math.min(value, 100) + "%", background: color }}
      />
    </div>
  </div>
);

const DonutChart = ({ data, colors, size = 160 }) => {
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
    if (total === 0) return;
    let start = -Math.PI / 2;
    const cx = size / 2,
      cy = size / 2,
      r = size * 0.38,
      inner = size * 0.22;
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
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(10,15,25,0.97)";
    ctx.fill();
  }, [data, size, colors]);
  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: "50%" }}
    />
  );
};

const BarChart = ({ items, color }) => {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bar-chart">
      {items.map((item, i) => (
        <div key={i} className="bar-item">
          <span className="bar-label">{item.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: (item.value / max) * 100 + "%",
                background: color,
              }}
            />
            <span className="bar-value">{item.display}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Resultados({ data }) {
  if (!data) return null;

  const [unidad, setUnidad] = useState("kwh"); // "kwh", "amperios", "vatios"

  const fmt = (n, dec = 0) =>
    new Intl.NumberFormat("es-CO", { maximumFractionDigits: dec }).format(n);
  const cop = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const donutColors = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
  const donutData = [
    { value: data.desglose_costos.paneles.valor },
    { value: data.desglose_costos.baterias.valor },
    { value: data.desglose_costos.mppt.valor },
    { value: data.desglose_costos.aires.valor },
  ];
  const costoItems = [
    {
      label: "Paneles",
      value: data.desglose_costos.paneles.valor,
      display: data.desglose_costos.paneles.pct + "%",
    },
    {
      label: "Baterias",
      value: data.desglose_costos.baterias.valor,
      display: data.desglose_costos.baterias.pct + "%",
    },
    {
      label: "MPPT",
      value: data.desglose_costos.mppt.valor,
      display: data.desglose_costos.mppt.pct + "%",
    },
    {
      label: "Aires",
      value: data.desglose_costos.aires.valor,
      display: data.desglose_costos.aires.pct + "%",
    },
  ];

  // Valores según la unidad seleccionada
  const getGeneracionDia = () => {
    if (unidad === "kwh") return fmt(data.kwh_dia, 2) + " kWh";
    if (unidad === "amperios") return fmt(data.amperios_dia, 1) + " A";
    return fmt(data.vatios_dia, 0) + " W";
  };

  const getGeneracionMes = () => {
    if (unidad === "kwh") return fmt(data.kwh_mes, 1) + " kWh";
    if (unidad === "amperios") return fmt(data.amperios_mes, 0) + " A";
    return fmt(data.vatios_mes, 0) + " W";
  };

  const getGeneracionAno = () => {
    if (unidad === "kwh") return fmt(data.kwh_ano) + " kWh";
    if (unidad === "amperios") return fmt(data.amperios_ano, 0) + " A";
    return fmt(data.vatios_ano, 0) + " W";
  };

  const getClimaValue = (climaTipo) => {
    if (unidad === "kwh") {
      if (climaTipo === "soleado")
        return fmt(data.kwh_dia_soleado, 2) + " kWh/día";
      if (climaTipo === "nublado")
        return fmt(data.kwh_dia_nublado, 2) + " kWh/día";
      return fmt(data.kwh_dia_lluvia, 2) + " kWh/día";
    }
    if (unidad === "amperios") {
      if (climaTipo === "soleado")
        return fmt(data.amperios_dia_soleado, 1) + " A";
      if (climaTipo === "nublado")
        return fmt(data.amperios_dia_nublado, 1) + " A";
      return fmt(data.amperios_dia_lluvia, 1) + " A";
    }
    if (climaTipo === "soleado") return fmt(data.vatios_dia_soleado, 0) + " W";
    if (climaTipo === "nublado") return fmt(data.vatios_dia_nublado, 0) + " W";
    return fmt(data.vatios_dia_lluvia, 0) + " W";
  };

  const getExcedenteLabel = () => {
    if (unidad === "kwh") return "⚡ Excedente";
    if (unidad === "amperios") return "⚡ Excedente (corriente)";
    return "⚡ Excedente (potencia)";
  };

  const getExcedenteDia = () => {
    if (unidad === "kwh") return fmt(data.excedente_dia, 2) + " kWh";
    if (unidad === "amperios")
      return fmt(data.amperios_excedente_dia, 1) + " A";
    return fmt(data.vatios_excedente_dia, 0) + " W";
  };

  const getExcedenteMes = () => {
    if (unidad === "kwh") return fmt(data.excedente_mes, 1) + " kWh";
    if (unidad === "amperios")
      return fmt(data.amperios_excedente_mes, 0) + " A";
    return fmt(data.vatios_excedente_mes, 0) + " W";
  };

  const getExcedenteAno = () => {
    if (unidad === "kwh") return fmt(data.excedente_ano) + " kWh";
    if (unidad === "amperios")
      return fmt(data.amperios_excedente_ano, 0) + " A";
    return fmt(data.vatios_excedente_ano, 0) + " W";
  };

  const getUnidadIcon = () => {
    if (unidad === "kwh") return "🔋";
    if (unidad === "amperios") return "⚡";
    return "💡";
  };

  const getUnidadTitle = () => {
    if (unidad === "kwh") return "Energía Generada";
    if (unidad === "amperios") return "Corriente Generada";
    return "Potencia Generada";
  };

  const getSubCardInfo = () => {
    if (unidad === "kwh") {
      return {
        title: "⚡ Potencia promedio",
        text: `${fmt(data.vatios_medios)} Watts promedio constantes`,
        extra: null,
      };
    }
    if (unidad === "amperios") {
      return {
        title: "⚡ Consumo y excedente (corriente DC)",
        text: `Consumo diario: ${fmt(data.amperios_consumo_dia, 1)} A a ${data.voltaje_sistema}V`,
        extra: `Excedente diario: ${fmt(data.amperios_excedente_dia, 1)} A a ${data.voltaje_sistema}V`,
      };
    }
    return {
      title: "⚡ Potencia del sistema",
      text: `Potencia pico instalada: ${fmt(data.vatios_pico, 0)} W (${data.potencia_total_kw} kW)`,
      extra: `Potencia promedio: ${fmt(data.vatios_medios, 0)} W constante`,
    };
  };

  const subCardInfo = getSubCardInfo();

  return (
    <div className="resultados-dashboard">
      {/* MENSAJES */}
      <div className="mensajes-section">
        {data.mensajes.map((msg, i) => (
          <div key={i} className="mensaje-badge">
            {msg}
          </div>
        ))}
      </div>

      {/* SECCION: RESUMEN DE EQUIPOS */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🔧</span> Equipos del Sistema
        </h3>
        <div className="equipos-table">
          <div className="equipos-header">
            <span>Equipo</span>
            <span>Cantidad</span>
            <span>Especificacion</span>
            <span>Precio unitario</span>
            <span>Total</span>
          </div>
          <div className="equipos-row">
            <span>☀️ Paneles solares</span>
            <span>{data.equipos.paneles.cantidad} und</span>
            <span>
              {data.equipos.paneles.kw_unitario} kW c/u —{" "}
              <strong>{data.equipos.paneles.kw_total} kW total</strong>
            </span>
            <span>{cop(data.equipos.paneles.precio_unit)}</span>
            <span className="col-total">{cop(data.equipos.paneles.total)}</span>
          </div>
          <div className="equipos-row">
            <span>🔋 Baterias</span>
            <span>{data.equipos.baterias.cantidad} und</span>
            <span>
              {data.equipos.baterias.kwh_unitario} kWh c/u —{" "}
              <strong>{data.equipos.baterias.kwh_total} kWh total</strong>
            </span>
            <span>{cop(data.equipos.baterias.precio_unit)}</span>
            <span className="col-total">
              {cop(data.equipos.baterias.total)}
            </span>
          </div>
          <div className="equipos-row">
            <span>⚡ MPPT</span>
            <span>{data.equipos.mppt.cantidad} und</span>
            <span>Controlador/inversor</span>
            <span>{cop(data.equipos.mppt.precio_unit)}</span>
            <span className="col-total">{cop(data.equipos.mppt.total)}</span>
          </div>
          <div className="equipos-row">
            <span>❄️ Aires DC 48V</span>
            <span>{data.equipos.aires.cantidad} und</span>
            <span>
              {fmt(data.equipos.aires.btu_unitario)} BTU c/u —{" "}
              <strong>{fmt(data.equipos.aires.btu_total)} BTU total</strong>
            </span>
            <span>{cop(data.equipos.aires.precio_unit)}</span>
            <span className="col-total">{cop(data.equipos.aires.total)}</span>
          </div>
          <div className="equipos-total-row">
            <span className="span-3">INVERSION TOTAL</span>
            <span></span>
            <span className="col-total gran-total">
              {cop(data.costo_total)}
            </span>
          </div>
        </div>
      </section>

      {/* TOGGLE DE UNIDADES - 3 OPCIONES */}
      <div className="toggle-unidades">
        <span className="toggle-label">Mostrar como:</span>
        <div className="toggle-switch toggle-switch-3">
          <button
            className={unidad === "kwh" ? "active" : ""}
            onClick={() => setUnidad("kwh")}
          >
            🔋 kWh
          </button>
          <button
            className={unidad === "amperios" ? "active" : ""}
            onClick={() => setUnidad("amperios")}
          >
            ⚡ Amperios
          </button>
          <button
            className={unidad === "vatios" ? "active" : ""}
            onClick={() => setUnidad("vatios")}
          >
            💡 Vatios
          </button>
        </div>
        <span className="toggle-hint">
          {unidad === "kwh" && "Energía (kilovatios-hora)"}
          {unidad === "amperios" && `Corriente DC a ${data.voltaje_sistema}V`}
          {unidad === "vatios" && "Potencia (vatios)"}
        </span>
      </div>

      {/* SECCION: ENERGIA / CORRIENTE / POTENCIA */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>{getUnidadIcon()}</span>
          {getUnidadTitle()}
        </h3>

        <div className="result-grid-3">
          <MetricCard
            icon="🌞"
            label="Por día"
            value={getGeneracionDia()}
            accent="yellow"
          />
          <MetricCard
            icon="📅"
            label="Por mes"
            value={getGeneracionMes()}
            accent="yellow"
          />
          <MetricCard
            icon="📆"
            label="Por año"
            value={getGeneracionAno()}
            accent="yellow"
          />
        </div>

        <div className="sub-card" style={{ marginTop: "0.5rem" }}>
          <h4>{subCardInfo.title}</h4>
          <p>
            <strong>{subCardInfo.text}</strong>
          </p>
          {subCardInfo.extra && (
            <p style={{ marginTop: "0.3rem" }}>{subCardInfo.extra}</p>
          )}
        </div>

        <div className="sub-cards" style={{ marginTop: "1rem" }}>
          <div className="sub-card">
            <h4>Generación según clima</h4>
            <div className="clima-table">
              <div>
                <span>☀️ Soleado</span>
                <strong>{getClimaValue("soleado")}</strong>
              </div>
              <div>
                <span>⛅ Nublado</span>
                <strong>{getClimaValue("nublado")}</strong>
              </div>
              <div>
                <span>🌧️ Lluvia</span>
                <strong>{getClimaValue("lluvia")}</strong>
              </div>
            </div>
          </div>
          <div className="sub-card">
            <h4>Especificaciones del sistema</h4>
            <p>
              Voltaje nominal: <strong>{data.voltaje_sistema} V DC</strong>
            </p>
            <p>
              Potencia pico: <strong>{data.potencia_total_kw} kW</strong> (
              {fmt(data.vatios_pico, 0)} W)
            </p>
            <p>
              Eficiencia final: <strong>{data.eficiencia_final}%</strong>
            </p>
          </div>
        </div>
      </section>

      {/* SECCION: FRACCION SOLAR */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>⚖️</span> Fraccion Solar vs Red
        </h3>
        <div className="fraccion-wrap">
          <div className="fraccion-bars">
            <ProgressBar
              label="🌞 Energia Solar"
              value={data.fraccion_solar_pct}
              color="linear-gradient(90deg,#f59e0b,#fbbf24)"
            />
            <ProgressBar
              label="🔌 Red Electrica"
              value={data.fraccion_red_pct}
              color="linear-gradient(90deg,#6366f1,#818cf8)"
            />
          </div>
          <div className="fraccion-desc">
            <p>
              Tu sistema cubre <strong>{data.fraccion_solar_pct}%</strong> del
              consumo diario.
            </p>
            <p>
              Depende de la red para el{" "}
              <strong>{data.fraccion_red_pct}%</strong> restante.
            </p>
          </div>
        </div>
      </section>

      {/* SECCION: FINANCIERO */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>💰</span> Analisis Financiero
        </h3>
        <div className="result-grid-2">
          <MetricCard
            icon="📉"
            label="Costo total del sistema"
            value={cop(data.costo_total)}
            sub="Sin mantenimiento"
            accent="red"
          />
          <MetricCard
            icon="🏆"
            label="Retorno de inversion"
            value={data.roi_anos + " años"}
            sub={fmt(data.roi_meses, 0) + " meses"}
            accent="green"
          />
          <MetricCard
            icon="💵"
            label="Ahorro mensual estimado"
            value={cop(data.ahorro_mensual)}
            sub="Energia + venta excedente"
            accent="green"
          />
          <MetricCard
            icon="📊"
            label="Ahorro anual estimado"
            value={cop(data.ahorro_anual)}
            sub="Proyeccion primer año"
            accent="green"
          />
        </div>
        <div className="sub-cards">
          <div className="sub-card">
            <h4>Desglose de inversion</h4>
            <BarChart items={costoItems} color="#f59e0b" />
          </div>
          <div className="sub-card donut-card">
            <h4>Distribucion porcentual</h4>
            <div className="donut-wrap">
              <DonutChart data={donutData} colors={donutColors} size={140} />
              <div className="donut-legend">
                {costoItems.map((item, i) => (
                  <div key={i} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: donutColors[i] }}
                    />
                    <span>
                      {item.label}: {item.display}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCION: VENTA EXCEDENTES */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🏭</span> Venta a Electrohuila (RENS / Ley 1715)
        </h3>
        {data.excedente_dia > 0 ? (
          <>
            <EnergyRow
              label={getExcedenteLabel()}
              dia={getExcedenteDia()}
              mes={getExcedenteMes()}
              ano={getExcedenteAno()}
            />
            <EnergyRow
              label={"💵 Ingreso (" + cop(data.precio_venta_kwh) + "/kWh)"}
              dia={cop(data.venta_dia)}
              mes={cop(data.venta_mes)}
              ano={cop(data.venta_ano)}
            />
            <p className="nota-venta">
              💡{" "}
              {unidad === "amperios"
                ? `A ${data.voltaje_sistema}V DC, ${fmt(data.amperios_excedente_dia, 1)} Amperios equivalen a ${fmt(data.excedente_dia, 2)} kWh/día. `
                : unidad === "vatios"
                  ? `${fmt(data.vatios_excedente_dia, 0)} Watts equivalen a ${fmt(data.excedente_dia, 2)} kWh/día. `
                  : ""}
              Electrohuila compra excedentes al <strong>precio de bolsa</strong>{" "}
              (aprox. 35% de la tarifa residencial, {cop(data.precio_venta_kwh)}
              /kWh). Bajo la Ley 1715 debes tramitar la conexion como usuario
              FNCE.
            </p>
          </>
        ) : (
          <div className="no-excedente">
            <span>🔌</span>
            <p>
              No hay excedentes para vender. Aumenta la cantidad de paneles o
              reduce el consumo.
            </p>
          </div>
        )}
      </section>

      {/* SECCION: BATERIAS */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🔋</span> Sistema de Almacenamiento
        </h3>
        <div className="result-grid-3">
          <MetricCard
            icon="⚡"
            label="Banco de baterias"
            value={data.capacidad_total_kwh + " kWh"}
            sub={
              data.equipos.baterias.cantidad +
              " baterias x " +
              data.equipos.baterias.kwh_unitario +
              " kWh"
            }
            accent="blue"
          />
          <MetricCard
            icon="🔄"
            label="Vida util baterias"
            value={data.vida_bateria_anos + " años"}
            sub={"aprox. " + fmt(data.vida_bateria_meses) + " meses"}
            accent="blue"
          />
          <MetricCard
            icon="🌙"
            label="Autonomia sin sol"
            value={data.autonomia_horas + " horas"}
            sub={data.autonomia_dias + " dias de reserva"}
            accent="purple"
          />
        </div>
      </section>

      {/* SECCION: BTU Y CLIMATIZACION */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>❄️</span> Climatizacion y BTU
        </h3>
        <div className="result-grid-2">
          <MetricCard
            icon="📐"
            label="BTU requeridos para el area"
            value={fmt(data.btu_requerido) + " BTU/h"}
            sub={data.btu_toneladas_req + " toneladas de frio requeridas"}
            accent="cyan"
          />
          <MetricCard
            icon="❄️"
            label="BTU instalados (aires DC)"
            value={fmt(data.btu_total) + " BTU/h"}
            sub={data.btu_toneladas_inst + " toneladas instaladas"}
            accent="cyan"
          />
        </div>
        <div className="result-grid-2" style={{ marginTop: "0.75rem" }}>
          <MetricCard
            icon="⚡"
            label="Consumo electrico aires"
            value={data.potencia_ac_kw + " kW"}
            sub="Consumo del sistema de climatizacion"
            accent="cyan"
          />
          <MetricCard
            icon="📊"
            label="Cobertura del area"
            value={data.cubre_area_pct + "%"}
            sub="Porcentaje del area cubierto"
            accent={data.cubre_area_pct >= 100 ? "green" : "red"}
          />
        </div>
        {data.equipos.aires.cantidad > 0 && (
          <div className="clima-equipos-detalle">
            <strong>
              {data.equipos.aires.cantidad} aire(s) ×{" "}
              {fmt(data.equipos.aires.btu_unitario)} BTU
            </strong>{" "}
            = {fmt(data.btu_total)} BTU totales instalados
          </div>
        )}
      </section>

      {/* SECCION: MANTENIMIENTO */}
      <section className="result-section">
        <h3 className="result-section-title">
          <span>🛠️</span> Mantenimiento Preventivo
        </h3>
        <div className="result-grid-3">
          <MetricCard
            icon="📅"
            label="Costo mensual"
            value={cop(data.mantenimiento_mensual)}
            sub="Limpieza y revisión básica"
            accent="purple"
          />
          <MetricCard
            icon="📆"
            label="Costo anual"
            value={cop(data.mantenimiento_anual)}
            sub="12 meses de mantenimiento"
            accent="purple"
          />
          <MetricCard
            icon="🗓️"
            label="5 años acumulado"
            value={cop(data.mantenimiento_5_anos)}
            sub="60 meses de mantenimiento"
            accent="purple"
          />
        </div>
        <div className="result-grid-2" style={{ marginTop: "0.75rem" }}>
          <MetricCard
            icon="🔋"
            label="Mantenimiento hasta fin vida baterías"
            value={cop(data.mantenimiento_vida_bateria)}
            sub={`${data.vida_bateria_anos} años de mantenimiento (${Math.round(data.vida_bateria_anos * 12)} meses)`}
            accent="purple"
          />
          <MetricCard
            icon="🏗️"
            label="Costo total real (equipo + mantenimiento)"
            value={cop(data.costo_total_con_mant)}
            sub="Incluye mantenimiento durante vida útil de baterías"
            accent="red"
          />
        </div>
      </section>
      {/* SECCION: CABLEADO DC */}
      {data.cableado && data.cableado.distancia > 0 && (
        <section className="result-section">
          <h3 className="result-section-title">
            <span>🔌</span> Cableado DC
          </h3>
          <div className="result-grid-2">
            <MetricCard
              icon="📏"
              label="Distancia paneles → baterías"
              value={data.cableado.distancia + " metros"}
              sub={`Cable total: ${data.cableado.distancia * 2} m (ida y vuelta)`}
              accent="cyan"
            />
            <MetricCard
              icon="⚡"
              label="Corriente máxima"
              value={data.cableado.corriente_maxima + " A"}
              sub={`Sistema a ${data.voltaje_sistema}V DC`}
              accent="yellow"
            />
          </div>
          <div className="result-grid-2" style={{ marginTop: "0.75rem" }}>
            <MetricCard
              icon="🔌"
              label="Calibre recomendado"
              value={data.cableado.calibre_recomendado}
              sub={`Sección: ${data.cableado.seccion_mm2} mm²`}
              accent="blue"
            />
            <MetricCard
              icon="💰"
              label="Costo del cableado"
              value={cop(data.cableado.costo_total)}
              sub={`${cop(data.cableado.precio_metro)}/metro × ${data.cableado.distancia * 2} m`}
              accent="green"
            />
          </div>
          <div className="result-grid-2" style={{ marginTop: "0.75rem" }}>
            <MetricCard
              icon="📉"
              label="Pérdida por cable"
              value={data.cableado.perdida_watts + " W"}
              sub={`${data.cableado.perdida_porcentaje}% de la potencia`}
              accent="red"
            />
            <MetricCard
              icon="🎯"
              label="Caída de voltaje"
              value={data.cableado.caida_voltaje_max + "%"}
              sub={`Máxima permitida: ${data.cableado.caida_voltaje_max}%`}
              accent="purple"
            />
          </div>
          {data.cableado.tipo === "aluminio" && (
            <div
              className="nota-venta"
              style={{
                marginTop: "1rem",
                background: "rgba(239,68,68,0.05)",
                borderLeftColor: "#ef4444",
              }}
            >
              <span>⚠️ </span>
              <strong>Cable de aluminio:</strong> Requiere conectores especiales
              y mantenimiento más frecuente. Para sistemas solares se recomienda{" "}
              <strong>cobre</strong> por mayor durabilidad y eficiencia.
            </div>
          )}
          {data.cableado.perdida_porcentaje > 3 && (
            <div
              className="nota-venta"
              style={{
                marginTop: "1rem",
                background: "rgba(245,158,11,0.05)",
                borderLeftColor: "#f59e0b",
              }}
            >
              <span>⚠️ </span>
              La pérdida por cable es del{" "}
              <strong>{data.cableado.perdida_porcentaje}%</strong> (mayor a 3%
              recomendado). Considera <strong>aumentar el calibre</strong> del
              cable o <strong>reducir la distancia</strong> entre paneles y
              baterías.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
