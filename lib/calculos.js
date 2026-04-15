// ============================================================
// SIMULADOR SOLAR — Lógica de cálculo
// Todos los cálculos técnicos y financieros del sistema solar
// ============================================================

/**
 * Factores de reducción según clima
 */
const FACTORES_CLIMA = {
  soleado: 1.0,
  nublado: 0.5,
  lluvia: 0.2,
};

/**
 * Función principal de simulación solar
 * @param {Object} data - Datos ingresados por el usuario
 * @returns {Object} - Resultados técnicos y financieros
 */
export function simularSolar(data) {
  const {
    panel_kw,
    horas_sol,
    eficiencia,
    temperatura,
    años,
    bateria_kwh,
    ciclos_bateria,
    costo_paneles,
    costo_baterias,
    costo_mppt,
    costo_aires,
    area,
    consumo_diario,
    precio_kwh,
    clima,
    mantenimiento_mensual,
  } = data;

  // ─── 1. FACTOR CLIMÁTICO ────────────────────────────────────
  const factor_clima = FACTORES_CLIMA[clima] ?? 1.0;

  // ─── 2. TEMPERATURA Y DEGRADACIÓN ──────────────────────────
  // Degradación por temperatura (coeficiente -0.5%/°C sobre 25°C)
  const eficiencia_decimal = eficiencia / 100;
  const eficiencia_temp = eficiencia_decimal * (1 - 0.005 * (temperatura - 25));

  // Degradación anual acumulada (1% por año)
  const eficiencia_final = eficiencia_temp * Math.pow(1 - 0.01, años);
  const degradacion_pct = ((eficiencia_decimal - eficiencia_final) / eficiencia_decimal) * 100;

  // ─── 3. ENERGÍA GENERADA ────────────────────────────────────
  // kWh por día = potencia (kW) × horas de sol × eficiencia × factor clima
  const kwh_dia = panel_kw * horas_sol * eficiencia_final * factor_clima;
  const kwh_mes = kwh_dia * 30;
  const kwh_año = kwh_dia * 365;

  // Valor del kWh según clima
  const valor_kwh_soleado = panel_kw * horas_sol * eficiencia_final * FACTORES_CLIMA.soleado;
  const valor_kwh_nublado = panel_kw * horas_sol * eficiencia_final * FACTORES_CLIMA.nublado;
  const valor_kwh_lluvia = panel_kw * horas_sol * eficiencia_final * FACTORES_CLIMA.lluvia;

  // ─── 4. BATERÍAS ────────────────────────────────────────────
  // Vida útil en años: ciclos / 365 descargas por año
  const vida_bateria_años = ciclos_bateria / 365;
  const vida_bateria_meses = ciclos_bateria / 30;

  // Capacidad almacenada total
  const energia_bateria_kwh = bateria_kwh;

  // ─── 5. COSTOS TOTALES ──────────────────────────────────────
  const costo_total =
    parseFloat(costo_paneles) +
    parseFloat(costo_baterias) +
    parseFloat(costo_mppt) +
    parseFloat(costo_aires);

  // Desglose porcentual
  const pct_paneles = (costo_paneles / costo_total) * 100;
  const pct_baterias = (costo_baterias / costo_total) * 100;
  const pct_mppt = (costo_mppt / costo_total) * 100;
  const pct_aires = (costo_aires / costo_total) * 100;

  // ─── 6. FRACCIÓN SOLAR vs RED ───────────────────────────────
  const fraccion_solar = Math.min(kwh_dia / consumo_diario, 1);
  const fraccion_red = 1 - fraccion_solar;
  const fraccion_solar_pct = fraccion_solar * 100;
  const fraccion_red_pct = fraccion_red * 100;

  // ─── 7. EXCEDENTE Y VENTA A ELECTRIFICADORA ─────────────────
  const excedente_dia = Math.max(kwh_dia - consumo_diario, 0);
  const excedente_mes = excedente_dia * 30;
  const excedente_año = excedente_dia * 365;

  const venta_dia = excedente_dia * precio_kwh;
  const venta_mes = excedente_mes * precio_kwh;
  const venta_año = excedente_año * precio_kwh;

  const genera_mas_pct = ((kwh_dia - consumo_diario) / consumo_diario) * 100;

  // ─── 8. AHORRO Y ROI ────────────────────────────────────────
  // Ahorro = energía consumida desde solar × precio kWh + venta excedente
  const consumo_desde_solar_dia = Math.min(kwh_dia, consumo_diario);
  const ahorro_mensual = consumo_desde_solar_dia * 30 * precio_kwh + venta_mes;
  const ahorro_anual = ahorro_mensual * 12;

  // Retorno de inversión en meses y años
  const roi_meses = costo_total / ahorro_mensual;
  const roi_años = roi_meses / 12;

  // ─── 9. MANTENIMIENTO ───────────────────────────────────────
  const mantenimiento_anual = mantenimiento_mensual * 12;
  const mantenimiento_5_años = mantenimiento_mensual * 60;
  const mantenimiento_total_vida = mantenimiento_mensual * vida_bateria_meses;

  // Costo real ajustado con mantenimiento
  const costo_total_con_mantenimiento = costo_total + mantenimiento_total_vida;

  // ─── 10. BTU ────────────────────────────────────────────────
  // BTU = área (m²) × 600
  const btu = area * 600;
  const btu_toneladas = btu / 12000;
  const potencia_ac_kw = btu * 0.000293; // conversión BTU/h a kW

  // ─── 11. MENSAJES INTELIGENTES ──────────────────────────────
  const mensajes = [];

  if (roi_años < 3) {
    mensajes.push(`🚀 Excelente inversión: recuperas tu dinero en solo ${roi_años.toFixed(1)} años.`);
  } else if (roi_años < 7) {
    mensajes.push(`✅ Buena inversión: recuperas la inversión en ${roi_años.toFixed(1)} años.`);
  } else {
    mensajes.push(`⚠️ Inversión a largo plazo: retorno en ${roi_años.toFixed(1)} años. Considera optimizar el sistema.`);
  }

  if (genera_mas_pct > 0) {
    mensajes.push(`⚡ Generas ${genera_mas_pct.toFixed(1)}% más energía de la que consumes. Puedes vender el excedente.`);
  } else if (genera_mas_pct === 0) {
    mensajes.push(`⚖️ Tu sistema cubre exactamente tu consumo diario.`);
  } else {
    mensajes.push(`🔌 Tu sistema cubre el ${fraccion_solar_pct.toFixed(1)}% de tu consumo. Necesitarás red eléctrica para el resto.`);
  }

  if (temperatura > 35) {
    mensajes.push(`🌡️ Alta temperatura (${temperatura}°C): la eficiencia se reduce por calor. Considera ventilación o paneles bifaciales.`);
  }

  if (vida_bateria_años < 5) {
    mensajes.push(`🔋 Vida útil de las baterías: ${vida_bateria_años.toFixed(1)} años. Planifica su reemplazo.`);
  } else {
    mensajes.push(`🔋 Baterías con buena durabilidad: ${vida_bateria_años.toFixed(1)} años de vida útil.`);
  }

  // ─── RESULTADO FINAL ────────────────────────────────────────
  return {
    // Energía
    kwh_dia: round(kwh_dia),
    kwh_mes: round(kwh_mes),
    kwh_año: round(kwh_año),

    // Eficiencia
    eficiencia_final: round(eficiencia_final * 100, 2),
    degradacion_pct: round(degradacion_pct, 2),

    // Valor kWh por clima
    valor_kwh_soleado: round(valor_kwh_soleado),
    valor_kwh_nublado: round(valor_kwh_nublado),
    valor_kwh_lluvia: round(valor_kwh_lluvia),

    // Baterías
    vida_bateria_años: round(vida_bateria_años, 1),
    vida_bateria_meses: round(vida_bateria_meses, 0),
    energia_bateria_kwh,

    // Costos
    costo_total: round(costo_total),
    costo_total_con_mantenimiento: round(costo_total_con_mantenimiento),
    desglose_costos: {
      paneles: { valor: round(costo_paneles), pct: round(pct_paneles, 1) },
      baterias: { valor: round(costo_baterias), pct: round(pct_baterias, 1) },
      mppt: { valor: round(costo_mppt), pct: round(pct_mppt, 1) },
      aires: { valor: round(costo_aires), pct: round(pct_aires, 1) },
    },

    // Fracción solar
    fraccion_solar_pct: round(fraccion_solar_pct, 1),
    fraccion_red_pct: round(fraccion_red_pct, 1),

    // Venta / excedente
    excedente_dia: round(excedente_dia),
    excedente_mes: round(excedente_mes),
    excedente_año: round(excedente_año),
    venta_dia: round(venta_dia),
    venta_mes: round(venta_mes),
    venta_año: round(venta_año),

    // Financiero
    ahorro_mensual: round(ahorro_mensual),
    ahorro_anual: round(ahorro_anual),
    roi_meses: round(roi_meses, 1),
    roi_años: round(roi_años, 1),

    // Mantenimiento
    mantenimiento_mensual: round(mantenimiento_mensual),
    mantenimiento_anual: round(mantenimiento_anual),
    mantenimiento_5_años: round(mantenimiento_5_años),

    // BTU
    btu: round(btu),
    btu_toneladas: round(btu_toneladas, 2),
    potencia_ac_kw: round(potencia_ac_kw, 2),

    // Mensajes
    mensajes,
  };
}

/**
 * Redondea un número a N decimales
 */
function round(val, decimals = 2) {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
