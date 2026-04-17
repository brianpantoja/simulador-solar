// ============================================================
// SIMULADOR SOLAR — Logica de calculo
// ============================================================

const FACTORES_CLIMA = {
  soleado: 1.0,
  nublado: 0.5,
  lluvia: 0.2,
};

export function simularSolar(data) {
  const {
    // Paneles
    panel_kw,
    cantidad_paneles,
    precio_panel,
    horas_sol,
    eficiencia,
    temperatura,
    anos,
    // Baterias
    bateria_kwh,
    cantidad_baterias,
    precio_bateria,
    ciclos_bateria,
    // MPPT
    cantidad_mppt,
    precio_mppt,
    // Aires
    cantidad_aires,
    precio_aire,
    btu_aire,
    // Consumo
    area,
    consumo_diario,
    precio_kwh,
    clima,
    mantenimiento_mensual,
    // Voltaje del sistema
    voltaje_sistema = 48,
  } = data;

  // ── 1. TOTALES DE EQUIPOS ──────────────────────────────────
  const potencia_total_kw = panel_kw * cantidad_paneles; // kW instalados
  const capacidad_total_kwh = bateria_kwh * cantidad_baterias; // kWh banco de baterias
  const btu_total = btu_aire * cantidad_aires; // BTU totales instalados

  // Costos por categoria
  const costo_paneles = precio_panel * cantidad_paneles;
  const costo_baterias = precio_bateria * cantidad_baterias;
  const costo_mppt = precio_mppt * cantidad_mppt;
  const costo_aires = precio_aire * cantidad_aires;
  const costo_total = costo_paneles + costo_baterias + costo_mppt + costo_aires;

  const pct_paneles = costo_total > 0 ? (costo_paneles / costo_total) * 100 : 0;
  const pct_baterias =
    costo_total > 0 ? (costo_baterias / costo_total) * 100 : 0;
  const pct_mppt = costo_total > 0 ? (costo_mppt / costo_total) * 100 : 0;
  const pct_aires = costo_total > 0 ? (costo_aires / costo_total) * 100 : 0;

  // ── 2. CLIMA Y EFICIENCIA ─────────────────────────────────
  const factor_clima = FACTORES_CLIMA[clima] ?? 1.0;
  const eficiencia_dec = eficiencia / 100;
  const eficiencia_temp = eficiencia_dec * (1 - 0.005 * (temperatura - 25));
  const eficiencia_final = eficiencia_temp * Math.pow(1 - 0.01, anos);
  const degradacion_pct =
    ((eficiencia_dec - eficiencia_final) / eficiencia_dec) * 100;

  // ── 3. ENERGIA GENERADA ───────────────────────────────────
  const kwh_dia =
    potencia_total_kw * horas_sol * eficiencia_final * factor_clima;
  const kwh_mes = kwh_dia * 30;
  const kwh_ano = kwh_dia * 365;

  // Generacion segun clima (para comparacion)
  const kwh_dia_soleado =
    potencia_total_kw * horas_sol * eficiencia_final * FACTORES_CLIMA.soleado;
  const kwh_dia_nublado =
    potencia_total_kw * horas_sol * eficiencia_final * FACTORES_CLIMA.nublado;
  const kwh_dia_lluvia =
    potencia_total_kw * horas_sol * eficiencia_final * FACTORES_CLIMA.lluvia;

  // ── 4. BATERIAS ───────────────────────────────────────────
  const vida_bateria_anos = ciclos_bateria / 365;
  const vida_bateria_meses = ciclos_bateria / 30;

  // Autonomia: cuantas horas/dias aguantan las baterias sin sol
  const autonomia_horas =
    consumo_diario > 0 ? (capacidad_total_kwh / consumo_diario) * 24 : 0;
  const autonomia_dias = autonomia_horas / 24;

  // ── 5. FRACCION SOLAR / RED ───────────────────────────────
  const fraccion_solar =
    consumo_diario > 0 ? Math.min(kwh_dia / consumo_diario, 1) : 1;
  const fraccion_red = 1 - fraccion_solar;
  const fraccion_solar_pct = fraccion_solar * 100;
  const fraccion_red_pct = fraccion_red * 100;

  // ── 6. EXCEDENTE Y VENTA ──────────────────────────────────
  const excedente_dia = Math.max(kwh_dia - consumo_diario, 0);
  const excedente_mes = excedente_dia * 30;
  const excedente_ano = excedente_dia * 365;

  // Precio real de compra de excedentes Electrohuila (precio bolsa aprox.)
  const precio_venta_kwh = precio_kwh * 0.35; // ~35% del precio residencial
  const venta_dia = excedente_dia * precio_venta_kwh;
  const venta_mes = excedente_mes * precio_venta_kwh;
  const venta_ano = excedente_ano * precio_venta_kwh;

  const genera_mas_pct =
    consumo_diario > 0
      ? ((kwh_dia - consumo_diario) / consumo_diario) * 100
      : 0;

  // ── 7. AHORRO Y ROI ───────────────────────────────────────
  const consumo_desde_solar = Math.min(kwh_dia, consumo_diario);
  const ahorro_mensual = consumo_desde_solar * 30 * precio_kwh + venta_mes;
  const ahorro_anual = ahorro_mensual * 12;

  const roi_meses = ahorro_mensual > 0 ? costo_total / ahorro_mensual : 0;
  const roi_anos = roi_meses / 12;

  // ── 8. MANTENIMIENTO ─────────────────────────────────────
  const mantenimiento_anual = mantenimiento_mensual * 12;
  const mantenimiento_5_anos = mantenimiento_mensual * 60;
  const mantenimiento_vida_bateria = mantenimiento_mensual * vida_bateria_meses;
  const costo_total_con_mant = costo_total + mantenimiento_vida_bateria;

  // ── 9. BTU (area requerida vs instalada) ──────────────────
  const btu_requerido = area * 600;
  const btu_toneladas_req = btu_requerido / 12000;
  const btu_toneladas_inst = btu_total / 12000;
  const potencia_ac_kw = btu_total * 0.000293;
  const cubre_area_pct =
    btu_requerido > 0 ? Math.min((btu_total / btu_requerido) * 100, 100) : 0;

  // ── 10. CONVERSIÓN A AMPERIOS Y VATIOS ────────────────────
  const voltaje = parseFloat(voltaje_sistema) || 48;

  // Amperios (corriente DC)
  const amperios_dia = voltaje > 0 ? (kwh_dia * 1000) / voltaje : 0;
  const amperios_mes = amperios_dia * 30;
  const amperios_ano = amperios_dia * 365;

  // Vatios (potencia)
  const vatios_pico = potencia_total_kw * 1000; // Potencia pico instalada en vatios
  const vatios_dia = kwh_dia * 1000; // Vatios-hora por día
  const vatios_mes = kwh_mes * 1000; // Vatios-hora por mes
  const vatios_ano = kwh_ano * 1000; // Vatios-hora por año
  const vatios_medios = (kwh_dia / 24) * 1000; // Watts promedio constantes

  // Amperios según clima
  const amperios_dia_soleado =
    voltaje > 0 ? (kwh_dia_soleado * 1000) / voltaje : 0;
  const amperios_dia_nublado =
    voltaje > 0 ? (kwh_dia_nublado * 1000) / voltaje : 0;
  const amperios_dia_lluvia =
    voltaje > 0 ? (kwh_dia_lluvia * 1000) / voltaje : 0;

  // Vatios según clima (vatios-hora por día)
  const vatios_dia_soleado = kwh_dia_soleado * 1000;
  const vatios_dia_nublado = kwh_dia_nublado * 1000;
  const vatios_dia_lluvia = kwh_dia_lluvia * 1000;

  // Amperios de consumo
  const amperios_consumo_dia =
    voltaje > 0 ? (consumo_diario * 1000) / voltaje : 0;

  // Vatios de consumo (vatios-hora por día)
  const vatios_consumo_dia = consumo_diario * 1000;

  // Amperios de excedente
  const amperios_excedente_dia =
    voltaje > 0 ? (excedente_dia * 1000) / voltaje : 0;
  const amperios_excedente_mes = amperios_excedente_dia * 30;
  const amperios_excedente_ano = amperios_excedente_dia * 365;

  // Vatios de excedente (vatios-hora)
  const vatios_excedente_dia = excedente_dia * 1000;
  const vatios_excedente_mes = excedente_mes * 1000;
  const vatios_excedente_ano = excedente_ano * 1000;

  // ── 11. MENSAJES INTELIGENTES ─────────────────────────────
  const mensajes = [];

  // ROI
  if (roi_anos < 3) {
    mensajes.push(
      "🚀 Excelente inversion: recuperas tu dinero en solo " +
        roi_anos.toFixed(1) +
        " años.",
    );
  } else if (roi_anos <= 7) {
    mensajes.push(
      "✅ Buena inversion: recuperas la inversion en " +
        roi_anos.toFixed(1) +
        " años.",
    );
  } else {
    mensajes.push(
      "⚠️ Inversion a largo plazo: retorno en " +
        roi_anos.toFixed(1) +
        " años. Considera optimizar el sistema.",
    );
  }

  // Excedente
  if (genera_mas_pct > 0) {
    mensajes.push(
      "⚡ Generas " +
        genera_mas_pct.toFixed(1) +
        "% mas energia de la que consumes. Puedes vender el excedente a Electrohuila.",
    );
  } else if (genera_mas_pct === 0) {
    mensajes.push("⚖️ Tu sistema cubre exactamente tu consumo diario.");
  } else {
    mensajes.push(
      "🔌 Tu sistema cubre el " +
        fraccion_solar_pct.toFixed(1) +
        "% de tu consumo. Necesitas la red electrica para el resto.",
    );
  }

  // Temperatura
  if (temperatura > 35) {
    mensajes.push(
      "🌡️ Alta temperatura (" +
        temperatura +
        "°C): la eficiencia se reduce. Considera ventilacion en los paneles.",
    );
  }

  // Baterias
  if (vida_bateria_anos < 5) {
    mensajes.push(
      "🔋 Vida util de las baterias: " +
        vida_bateria_anos.toFixed(1) +
        " años. Planifica su reemplazo.",
    );
  } else {
    mensajes.push(
      "🔋 Baterias con buena durabilidad: " +
        vida_bateria_anos.toFixed(1) +
        " años de vida util.",
    );
  }

  // Autonomia
  mensajes.push(
    "🌙 Autonomia nocturna: " +
      autonomia_horas.toFixed(1) +
      " horas (" +
      autonomia_dias.toFixed(1) +
      " dias) sin sol con el banco de baterias.",
  );

  // BTU
  if (btu_total > 0 && btu_total < btu_requerido) {
    mensajes.push(
      "❄️ Los aires instalados (" +
        btu_toneladas_inst.toFixed(1) +
        " TR) no cubren el area. Necesitas " +
        btu_toneladas_req.toFixed(1) +
        " TR para " +
        area +
        " m².",
    );
  } else if (btu_total >= btu_requerido && btu_total > 0) {
    mensajes.push(
      "❄️ Los aires instalados cubren correctamente el area de " +
        area +
        " m².",
    );
  }
  // ── 12. CABLEADO DC ───────────────────────────────────────
  const distancia = parseFloat(data.distancia_paneles) || 0;
  const tipoCable = data.tipo_cable || "cobre";
  const caidaVoltaje = (parseFloat(data.caida_voltaje) || 2) / 100;

  // Corriente máxima del sistema (amperios pico)
  const corriente_maxima =
    voltaje > 0 ? (potencia_total_kw * 1000) / voltaje : 0;

  // Conductividad del material (Cobre=56, Aluminio=35)
  const conductividad = tipoCable === "cobre" ? 56 : 35;

  // Cálculo de sección mínima del cable (mm²)
  // Fórmula: S = (2 × L × I) / (γ × ΔV × V)
  // donde L=distancia, I=corriente, γ=conductividad, ΔV=caída%, V=voltaje
  let seccion_cable_mm2 = 0;
  let calibre_recomendado = "";
  let precio_cable_metro = 0;
  let costo_cable_total = 0;
  let perdida_cable_watts = 0;
  let perdida_cable_porcentaje = 0;

  if (distancia > 0 && corriente_maxima > 0) {
    seccion_cable_mm2 =
      (2 * distancia * corriente_maxima) /
      (conductividad * caidaVoltaje * voltaje);

    // Redondear al calibre comercial superior
    const calibres = [
      { mm2: 1.5, nombre: "1.5 mm² (AWG 16)", precio: 3000, amp_max: 10 },
      { mm2: 2.5, nombre: "2.5 mm² (AWG 14)", precio: 4500, amp_max: 15 },
      { mm2: 4.0, nombre: "4.0 mm² (AWG 12)", precio: 7000, amp_max: 25 },
      { mm2: 6.0, nombre: "6.0 mm² (AWG 10)", precio: 10000, amp_max: 35 },
      { mm2: 10.0, nombre: "10.0 mm² (AWG 8)", precio: 16000, amp_max: 50 },
      { mm2: 16.0, nombre: "16.0 mm² (AWG 6)", precio: 25000, amp_max: 70 },
      { mm2: 25.0, nombre: "25.0 mm² (AWG 4)", precio: 40000, amp_max: 95 },
      { mm2: 35.0, nombre: "35.0 mm² (AWG 2)", precio: 55000, amp_max: 120 },
      { mm2: 50.0, nombre: "50.0 mm² (AWG 1/0)", precio: 80000, amp_max: 150 },
      { mm2: 70.0, nombre: "70.0 mm² (AWG 2/0)", precio: 110000, amp_max: 190 },
      { mm2: 95.0, nombre: "95.0 mm² (AWG 3/0)", precio: 150000, amp_max: 230 },
    ];

    // Encontrar calibre que soporte la corriente y sección
    let calibreEncontrado = null;
    for (const calibre of calibres) {
      if (
        calibre.mm2 >= seccion_cable_mm2 &&
        calibre.amp_max >= corriente_maxima
      ) {
        calibreEncontrado = calibre;
        break;
      }
    }

    // Si no hay calibre suficiente, usar el último
    if (!calibreEncontrado && calibres.length > 0) {
      calibreEncontrado = calibres[calibres.length - 1];
    }

    if (calibreEncontrado) {
      seccion_cable_mm2 = calibreEncontrado.mm2;
      calibre_recomendado = calibreEncontrado.nombre;
      precio_cable_metro = calibreEncontrado.precio;

      // Ajustar precio según tipo de cable (aluminio más barato)
      if (tipoCable === "aluminio") {
        precio_cable_metro = Math.round(precio_cable_metro * 0.6);
      }

      // Costo total: distancia × 2 (ida y vuelta) × precio_metro
      costo_cable_total = distancia * 2 * precio_cable_metro;

      // Pérdida real en watts (caída de voltaje real)
      const resistencia_real =
        (2 * distancia) / (conductividad * seccion_cable_mm2);
      perdida_cable_watts = resistencia_real * Math.pow(corriente_maxima, 2);
      perdida_cable_porcentaje =
        (perdida_cable_watts / (potencia_total_kw * 1000)) * 100;
    }
  }

  // ── RESULTADO FINAL ───────────────────────────────────────
  return {
    // Equipos
    equipos: {
      paneles: {
        cantidad: cantidad_paneles,
        kw_unitario: panel_kw,
        kw_total: round(potencia_total_kw, 2),
        precio_unit: precio_panel,
        total: round(costo_paneles),
      },
      baterias: {
        cantidad: cantidad_baterias,
        kwh_unitario: bateria_kwh,
        kwh_total: round(capacidad_total_kwh, 1),
        precio_unit: precio_bateria,
        total: round(costo_baterias),
      },
      mppt: {
        cantidad: cantidad_mppt,
        precio_unit: precio_mppt,
        total: round(costo_mppt),
      },
      aires: {
        cantidad: cantidad_aires,
        btu_unitario: btu_aire,
        btu_total: round(btu_total),
        precio_unit: precio_aire,
        total: round(costo_aires),
      },
    },

    // Energia (kWh)
    kwh_dia: round(kwh_dia),
    kwh_mes: round(kwh_mes),
    kwh_ano: round(kwh_ano),
    kwh_dia_soleado: round(kwh_dia_soleado),
    kwh_dia_nublado: round(kwh_dia_nublado),
    kwh_dia_lluvia: round(kwh_dia_lluvia),

    // Potencia (Vatios)
    vatios_pico: round(vatios_pico, 0),
    vatios_dia: round(vatios_dia, 0),
    vatios_mes: round(vatios_mes, 0),
    vatios_ano: round(vatios_ano, 0),
    vatios_medios: round(vatios_medios, 0),
    vatios_dia_soleado: round(vatios_dia_soleado, 0),
    vatios_dia_nublado: round(vatios_dia_nublado, 0),
    vatios_dia_lluvia: round(vatios_dia_lluvia, 0),
    vatios_consumo_dia: round(vatios_consumo_dia, 0),

    // Corriente (Amperios)
    voltaje_sistema: round(voltaje, 1),
    amperios_dia: round(amperios_dia, 1),
    amperios_mes: round(amperios_mes, 0),
    amperios_ano: round(amperios_ano, 0),
    amperios_dia_soleado: round(amperios_dia_soleado, 1),
    amperios_dia_nublado: round(amperios_dia_nublado, 1),
    amperios_dia_lluvia: round(amperios_dia_lluvia, 1),
    amperios_consumo_dia: round(amperios_consumo_dia, 1),

    // Eficiencia
    potencia_total_kw: round(potencia_total_kw, 2),
    eficiencia_final: round(eficiencia_final * 100, 2),
    degradacion_pct: round(degradacion_pct, 2),

    // Baterias
    capacidad_total_kwh: round(capacidad_total_kwh, 1),
    vida_bateria_anos: round(vida_bateria_anos, 1),
    vida_bateria_meses: round(vida_bateria_meses, 0),
    autonomia_horas: round(autonomia_horas, 1),
    autonomia_dias: round(autonomia_dias, 2),

    // Fraccion
    fraccion_solar_pct: round(fraccion_solar_pct, 1),
    fraccion_red_pct: round(fraccion_red_pct, 1),

    // Excedente / venta (kWh)
    excedente_dia: round(excedente_dia),
    excedente_mes: round(excedente_mes),
    excedente_ano: round(excedente_ano),
    precio_venta_kwh: round(precio_venta_kwh),
    venta_dia: round(venta_dia),
    venta_mes: round(venta_mes),
    venta_ano: round(venta_ano),
    genera_mas_pct: round(genera_mas_pct, 1),

    // Excedente en amperios
    amperios_excedente_dia: round(amperios_excedente_dia, 1),
    amperios_excedente_mes: round(amperios_excedente_mes, 0),
    amperios_excedente_ano: round(amperios_excedente_ano, 0),

    // Excedente en vatios
    vatios_excedente_dia: round(vatios_excedente_dia, 0),
    vatios_excedente_mes: round(vatios_excedente_mes, 0),
    vatios_excedente_ano: round(vatios_excedente_ano, 0),

    // Financiero
    costo_total: round(costo_total),
    costo_total_con_mant: round(costo_total_con_mant),
    desglose_costos: {
      paneles: { valor: round(costo_paneles), pct: round(pct_paneles, 1) },
      baterias: { valor: round(costo_baterias), pct: round(pct_baterias, 1) },
      mppt: { valor: round(costo_mppt), pct: round(pct_mppt, 1) },
      aires: { valor: round(costo_aires), pct: round(pct_aires, 1) },
    },
    ahorro_mensual: round(ahorro_mensual),
    ahorro_anual: round(ahorro_anual),
    roi_meses: round(roi_meses, 1),
    roi_anos: round(roi_anos, 1),

    // Mantenimiento
    mantenimiento_mensual: round(mantenimiento_mensual),
    mantenimiento_anual: round(mantenimiento_anual),
    mantenimiento_5_anos: round(mantenimiento_5_anos),
    mantenimiento_vida_bateria: round(mantenimiento_vida_bateria),

    // BTU
    btu_requerido: round(btu_requerido),
    btu_total: round(btu_total),
    btu_toneladas_req: round(btu_toneladas_req, 2),
    btu_toneladas_inst: round(btu_toneladas_inst, 2),
    potencia_ac_kw: round(potencia_ac_kw, 2),
    cubre_area_pct: round(cubre_area_pct, 1),

    // Cableado
    cableado: {
      distancia: round(distancia, 1),
      tipo: tipoCable,
      caida_voltaje_max: round(caidaVoltaje * 100, 1),
      corriente_maxima: round(corriente_maxima, 1),
      seccion_mm2: round(seccion_cable_mm2, 1),
      calibre_recomendado: calibre_recomendado,
      precio_metro: round(precio_cable_metro),
      costo_total: round(costo_cable_total),
      perdida_watts: round(perdida_cable_watts, 1),
      perdida_porcentaje: round(perdida_cable_porcentaje, 2),
    },

    mensajes,
  };
}

function round(val, decimals = 0) {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
