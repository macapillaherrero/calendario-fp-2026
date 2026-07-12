// Lógica de la aplicación web del Calendario FP 2026-2027
// Gestiona el estado de la aplicación, el renderizado de la cuadrícula,
// la interactividad del usuario, las ventanas modales y el almacenamiento local.

document.addEventListener("DOMContentLoaded", () => {
  // --- VARIABLES DE ESTADO ---
  let appState = {
    currentView: "unified", // "unified" | "1er" | "2n"
    shadingBase: "1er",     // "1er" | "2n" - Base de proyección para días laborables
    localHolidays: { ...CONFIG_2026_2027.localHolidays },
    weeklyEvents: { ...CONFIG_2026_2027.defaultWeeklyEvents },
    dayOverrides: {} // Overrides de días individuales: { "YYYY-MM-DD": { dayType, holidayName } }
  };

  // Nombres de los meses en Valenciano/Catalán
  const MONTH_NAMES = {
    8: "Setembre",
    9: "Octubre",
    10: "Novembre",
    11: "Desembre",
    0: "Gener",
    1: "Febrer",
    2: "Març",
    3: "Abril",
    4: "Maig",
    5: "Juny"
  };

  // Obtiene el número de quincena a partir del texto (ej: "2", "Ex 2n" -> null o "2" si empieza por número)
  function getFortnightNumber(label) {
    if (!label) return null;
    const match = String(label).trim().match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  // Retorna la clase de sombreado (even/odd) según la etiqueta actual de quincena
  function getShadingClass(label) {
    if (!label) return "";
    const cleanLabel = String(label).trim();
    
    // Si es un periodo especial no lectivo o de prácticas, no sombrear
    const lower = cleanLabel.toLowerCase();
    if (lower.includes("ex") || lower.includes("fe") || lower.includes("nadal") || lower.includes("pasqua") || lower.includes("pi")) {
      return "";
    }
    
    const fNum = getFortnightNumber(cleanLabel);
    if (fNum !== null) {
      return (fNum % 2 === 0) ? "fortnight-even-row" : "fortnight-odd-row";
    }
    return "";
  }

  // En la vista unificada, solo sombreamos si las quincenas no coinciden (no unificadas)
  function getShadingClassForUnified(week) {
    const q1 = String(week.quinzena1 || "").trim();
    const q2 = String(week.quinzena2 || "").trim();
    
    if (q1 === q2) {
      return "";
    }
    
    const fNum1 = getFortnightNumber(q1);
    const fNum2 = getFortnightNumber(q2);
    
    if (fNum1 !== null && fNum2 === null) {
      return (fNum1 % 2 === 0) ? "fortnight-even-row" : "fortnight-odd-row";
    }
    if (fNum2 !== null && fNum1 === null) {
      return (fNum2 % 2 === 0) ? "fortnight-even-row" : "fortnight-odd-row";
    }
    
    return "";
  }

  // Comprobar si un evento pertenece a un curso determinado
  function isEventForYear(type, concept, year) {
    // Eliminamos el texto aclaratorio entre paréntesis para evitar falsos positivos de curso
    const cleanConcept = String(concept).replace(/\([^)]*\)/g, "");
    const c = cleanConcept.toLowerCase();
    const t = String(type).toLowerCase();
    
    const has1r = t.includes("-1r") || t === "av-1r" || t === "fe-1r" || t === "av-extr-1r" || 
                  c.includes("1r") || c.includes("1er") || c.includes("1º") || c.includes("primer");
                  
    // Para 2º año, buscamos "2n" pero excluyendo expresiones de evaluaciones como "2na" o "2a" o "2ª"
    const has2n = t.includes("-2n") || t === "pi-av-2n" || t === "pfc-av2" || 
                  (/\b(2n|2N|2º|segon)\b(?!a|ª|o)/i.test(c)) || 
                  (c.includes("2n") && !c.includes("2na") && !c.includes("2ª") && !c.includes("2a"));
                  
    if (year === "1er") {
      if (has1r) return true;
      if (has2n) return false;
      return true;
    }
    
    if (year === "2n") {
      if (has2n) return true;
      if (has1r) return false;
      return true;
    }
    
    return true;
  }

  // Obtener concepto y tipo de evento filtrado según la vista seleccionada
  function getEventInfoForView(week, view) {
    const concept = week.concept || "";
    const type = week.eventType || "";
    
    if (view === "1er") {
      // Si el evento NO pertenece a primer año, lo ocultamos
      if (!isEventForYear(type, concept, "1er")) {
        return { concept: "", eventType: "" };
      }
      let cleanConcept = concept;
      let cleanType = type;
      
      if (concept.includes("/") || concept.includes("-") || concept.includes(" / ")) {
        cleanConcept = getCleanConceptForYear(concept, "1er");
        cleanType = getCleanTypeForYear(type, "1er");
      }
      
      // Ajuste dinámico de color según las palabras clave en el concepto limpio (ignorando aclaraciones entre paréntesis)
      const cleanConceptLower = cleanConcept.replace(/\([^)]*\)/g, "").toLowerCase();
      if (cleanConceptLower.includes("av") || cleanConceptLower.includes("avaluació")) {
        cleanType = "avaluacions";
      } else if (cleanConceptLower.includes("ex") || cleanConceptLower.includes("exàmen")) {
        cleanType = "exams";
      } else if (cleanConceptLower.includes("pfc") || /\bpi\b/i.test(cleanConceptLower)) {
        cleanType = "pfc";
      } else if (cleanConceptLower.includes("fe") || cleanConceptLower.includes("fct")) {
        cleanType = "inici-fe";
      }
      
      return { concept: cleanConcept, eventType: cleanType };
    }
    
    if (view === "2n") {
      // Si el evento NO pertenece a segundo año, lo ocultamos
      if (!isEventForYear(type, concept, "2n")) {
        return { concept: "", eventType: "" };
      }
      let cleanConcept = concept;
      let cleanType = type;
      
      if (concept.includes("/") || concept.includes("-") || concept.includes(" / ")) {
        cleanConcept = getCleanConceptForYear(concept, "2n");
        cleanType = getCleanTypeForYear(type, "2n");
      }
      
      // Ajuste dinámico de color según las palabras clave en el concepto limpio (ignorando aclaraciones entre paréntesis)
      const cleanConceptLower = cleanConcept.replace(/\([^)]*\)/g, "").toLowerCase();
      if (cleanConceptLower.includes("av") || cleanConceptLower.includes("avaluació")) {
        cleanType = "avaluacions";
      } else if (cleanConceptLower.includes("ex") || cleanConceptLower.includes("exàmen")) {
        cleanType = "exams";
      } else if (cleanConceptLower.includes("pfc") || /\bpi\b/i.test(cleanConceptLower)) {
        cleanType = "pfc";
      } else if (cleanConceptLower.includes("fe") || cleanConceptLower.includes("fct")) {
        cleanType = "inici-fe";
      }
      
      return { concept: cleanConcept, eventType: cleanType };
    }
    
    return { concept, eventType: type };
  }

  function has1rIndicator(text) {
    const t = String(text).toLowerCase();
    return t.includes("1r") || t.includes("1er") || t.includes("1º") || t.includes("primer");
  }
  
  function has2nIndicator(text) {
    const t = String(text).toLowerCase();
    return (/\b(2n|2N|2º|segon)\b(?!a|ª|o)/i.test(t)) || (t.includes("2n") && !t.includes("2na") && !t.includes("2ª") && !t.includes("2a"));
  }

  function getCleanConceptForYear(concept, year) {
    let c = concept.trim();
    
    // Primero, si contiene rangos del tipo 1r/2n, los limpiamos
    // ej: "Avaluació 1r/2n" -> "Avaluació 1r" o "Avaluació 2n"
    const regexRange = /(1r|1er|1º)\s*\/\s*(2n|2nd|2º)/i;
    if (regexRange.test(c)) {
      return c.replace(regexRange, year === "1er" ? "1r" : "2n");
    }
    
    // Si no, intentamos dividir por la barra principal (espacio barra espacio)
    const parts = c.split(/\s+\/\s+/);
    if (parts.length === 2) {
      const p1 = parts[0];
      const p2 = parts[1];
      
      const has1r = has1rIndicator(p1) || has1rIndicator(p2);
      const has2n = has2nIndicator(p1) || has2nIndicator(p2);
      
      if (has1r && has2n) {
        // Encontramos los dos. Identificamos cuál es de primero y cuál de segundo
        const p1Is1r = has1rIndicator(p1);
        const p2Is1r = has1rIndicator(p2);
        
        let result = "";
        if (p1Is1r && !p2Is1r) {
          result = year === "1er" ? p1 : p2;
        } else if (p2Is1r && !p1Is1r) {
          result = year === "1er" ? p2 : p1;
        } else {
          // Si ambos tienen o no tienen de forma clara, asumimos p1 primero, p2 segundo
          result = year === "1er" ? p1 : p2;
        }
        
        // Regla: "y /FPB déjalo siempre"
        if (c.toUpperCase().includes("FPB") && !result.toUpperCase().includes("FPB")) {
          result = result.trim() + "/FPB";
        }
        return result;
      }
    }
    
    return c;
  }

  function getCleanTypeForYear(type, year) {
    if (type === "avaluacions") return "avaluacions";
    if (type === "ex1-fe2") {
      return year === "1er" ? "exams" : "inici-fe";
    }
    if (type === "ex-extr-av1") {
      return year === "1er" ? "avaluacions" : "exams";
    }
    if (type === "av-extr-ex-extr-1r") {
      return year === "1er" ? "exams" : "avaluacions";
    }
    return type;
  }

  // Mapear tipos de eventos específicos a clases principales de CSS
  function getDisplayClassType(type) {
    if (!type) return "";
    if (type.includes("exams") || type.includes("ex")) return "exams";
    if (type.includes("avaluacions") || type.includes("av")) return "avaluacions";
    if (type.includes("pfc")) return "pfc";
    if (type.includes("fe") || type.includes("inici-fe")) return "inici-fe";
    if (type.includes("inici-fi")) return "inici-fi";
    if (type.includes("inici-pi")) return "inici-pi";
    return type;
  }

  // Calcula el tipo de día por defecto sin overrides
  function getDefaultDayType(day) {
    if (day.dayOfWeek === 0 || day.dayOfWeek === 6) return "weekend";
    
    const dateStr = day.dateStr;
    const isHoliday = CONFIG_2026_2027.gvaHolidays[dateStr] || (appState.localHolidays && appState.localHolidays[dateStr]);
    if (isHoliday) return "festiu";
    
    let isVacation = false;
    CONFIG_2026_2027.vacationPeriods.forEach(p => {
      if (dateStr >= p.start && dateStr <= p.end) {
        isVacation = true;
      }
    });
    if (isVacation) return "vacances";
    
    if (dateStr < CONFIG_2026_2027.courseStart || dateStr > CONFIG_2026_2027.courseEnd) {
      if (dateStr >= "2026-09-07" && dateStr <= "2027-07-01") {
        return "no-lectiu";
      }
      return "pre-post";
    }
    
    return "lectiu";
  }

  // Ocultar tipo de día de otro curso si está filtrado (con soporte para semanas combinadas)
  function getDayTypeForView(day, week, view) {
    const type = day.dayType;
    const weekEvent = week.eventType || "";
    const weekConcept = week.concept || "";
    
    // Función auxiliar para evitar falsos positivos de "ex" por la palabra "extr" o "extraordinaria"
    const cleanKeywordChecks = (text) => {
      return String(text).toLowerCase()
        .replace(/extraordinaria/g, "")
        .replace(/extraordinària/g, "")
        .replace(/extr\./g, "")
        .replace(/extr/g, "");
    };
    
    if (view === "1er") {
      // Si la semana es exclusiva de segundo año, ocultamos los días especiales
      if (!isEventForYear(weekEvent, weekConcept, "1er")) {
        if (type === "exams" || type === "avaluacions" || type === "pfc" || type === "inici-fe" || type === "inici-pi") {
          return getDefaultDayType(day);
        }
      }
      
      // Si la semana es combinada, hacemos un filtrado fino de los días de examen/avaluación
      if (weekConcept.includes(" / ")) {
        const parts = weekConcept.split(/\s+\/\s+/);
        if (parts.length === 2) {
          const p1 = parts[0];
          const p2 = parts[1];
          const p1Is1r = has1rIndicator(p1);
          const p2Is1r = has1rIndicator(p2);
          
          const part1r = p1Is1r ? p1 : (p2Is1r ? p2 : p1);
          const part1rClean = cleanKeywordChecks(part1r);
          
          if (type === "exams" && !(part1rClean.includes("ex") || part1rClean.includes("exàmen"))) {
            return getDefaultDayType(day);
          }
          if (type === "avaluacions" && !(part1rClean.includes("av") || part1rClean.includes("avaluació"))) {
            return getDefaultDayType(day);
          }
          if (type === "pfc" && !(part1rClean.includes("pfc") || /\bpi\b/i.test(part1rClean))) {
            return getDefaultDayType(day);
          }
          if (type === "inici-fe" && !(part1rClean.includes("fe") || part1rClean.includes("fct"))) {
            return getDefaultDayType(day);
          }
        }
      }
    }
    
    if (view === "2n") {
      // Si la semana es exclusiva de primer año, ocultamos los días especiales
      if (!isEventForYear(weekEvent, weekConcept, "2n")) {
        if (type === "exams" || type === "avaluacions" || type === "pfc" || type === "inici-fe" || type === "inici-pi") {
          return getDefaultDayType(day);
        }
      }
      
      // Si la semana es combinada, hacemos un filtrado fino de los días de examen/avaluación
      if (weekConcept.includes(" / ")) {
        const parts = weekConcept.split(/\s+\/\s+/);
        if (parts.length === 2) {
          const p1 = parts[0];
          const p2 = parts[1];
          const p1Is2n = has2nIndicator(p1);
          const p2Is2n = has2nIndicator(p2);
          
          const part2n = p1Is2n ? p1 : (p2Is2n ? p2 : p2);
          const part2nClean = cleanKeywordChecks(part2n);
          
          if (type === "exams" && !(part2nClean.includes("ex") || part2nClean.includes("exàmen"))) {
            return getDefaultDayType(day);
          }
          if (type === "avaluacions" && !(part2nClean.includes("av") || part2nClean.includes("avaluació"))) {
            return getDefaultDayType(day);
          }
          if (type === "pfc" && !(part2nClean.includes("pfc") || /\bpi\b/i.test(part2nClean))) {
            return getDefaultDayType(day);
          }
          if (type === "inici-fe" && !(part2nClean.includes("fe") || part2nClean.includes("fct"))) {
            return getDefaultDayType(day);
          }
        }
      }
    }
    
    return type;
  }

  // Referencias DOM
  const themeToggleBtn = document.getElementById("theme-toggle");
  const exportBtn = document.getElementById("export-json");
  const exportPublishBtn = document.getElementById("export-publish-js");
  const importTrigger = document.getElementById("import-trigger");
  const importFileInput = document.getElementById("import-file");
  const printPdfBtn = document.getElementById("print-pdf");
  const resetBtn = document.getElementById("reset-calendar-btn");
  const shadingBaseContainer = document.getElementById("shading-base-container");
  
  const viewBtns = document.querySelectorAll(".view-btn");
  const lectiveCountEl = document.getElementById("lective-count");
  const lectiveBadgeEl = document.getElementById("lective-badge");
  const holidaysListContainer = document.getElementById("holidays-list-container");
  const addHolidayBtn = document.getElementById("add-holiday-btn");
  const newHolidayDateInput = document.getElementById("new-holiday-date");
  
  const calendarBody = document.getElementById("calendar-body");
  const thQ1 = document.getElementById("th-q1");
  const thQ2 = document.getElementById("th-q2");
  
  // Modales
  const editWeekModal = document.getElementById("edit-week-modal");
  const modalConceptInput = document.getElementById("modal-concept-input");
  const btnCancelModal = document.getElementById("btn-cancel-modal");
  const btnSaveModal = document.getElementById("btn-save-modal");
  const closeModalBtn = document.getElementById("close-modal");
  
  const editDayModal = document.getElementById("edit-day-modal");
  const dayModalTitle = document.getElementById("day-modal-title");
  const dayModalDesc = document.getElementById("day-modal-desc");
  const closeDayModalBtn = document.getElementById("close-day-modal");
  const btnCancelDayModal = document.getElementById("btn-cancel-day-modal");
  const btnSaveDayModal = document.getElementById("btn-save-day-modal");
  const dayHolidayNameInput = document.getElementById("day-holiday-name-input");
  const dayHolidayNameGroup = document.getElementById("day-holiday-name-group");
  
  // Variables auxiliares para los modales abiertos
  let activeEditingWeekMonday = null;
  let activeEditingDayStr = null;
  let selectedWeekType = "";
  let selectedDayType = "";

  // --- PERSISTENCIA LOCAL ---
  function saveStateToLocalStorage() {
    localStorage.setItem("calendario_fp_state_2026", JSON.stringify(appState));
  }

  function loadStateFromLocalStorage() {
    const saved = localStorage.getItem("calendario_fp_state_2026");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        appState = {
          currentView: parsed.currentView || "unified",
          shadingBase: parsed.shadingBase || "1er",
          localHolidays: parsed.localHolidays || { ...CONFIG_2026_2027.localHolidays },
          weeklyEvents: parsed.weeklyEvents || { ...CONFIG_2026_2027.defaultWeeklyEvents },
          dayOverrides: parsed.dayOverrides || {}
        };
      } catch (e) {
        console.error("Error cargando estado local", e);
      }
    }
  }

  // --- CÁLCULO Y RENDERIZADO ---
  
  // Genera el listado completo fusionando datos base y custom overrides
  function getComputedCalendarData() {
    // 1. Generar la lista de semanas base con los festivos locales actuales
    const baseWeeks = generateCalendarData(appState.localHolidays, appState.weeklyEvents);
    
    // 2. Aplicar overrides de días específicos y quincenas
    baseWeeks.forEach(week => {
      // Aplicar overrides de quincenas de weeklyEvents
      const eventConfig = appState.weeklyEvents[week.mondayDateStr];
      if (eventConfig) {
        if (eventConfig.quinzena1 !== undefined) {
          week.quinzena1 = eventConfig.quinzena1;
        }
        if (eventConfig.quinzena2 !== undefined) {
          week.quinzena2 = eventConfig.quinzena2;
        }
      }

      week.days.forEach(day => {
        const override = appState.dayOverrides[day.dateStr];
        if (override) {
          day.dayType = override.dayType;
          if (override.holidayName) {
            day.holidayName = override.holidayName;
          }
        }
      });
    });
    
    return baseWeeks;
  }

  // Actualiza las estadísticas de días lectivos y su desglose
  function updateLectiveStats(weeks) {
    const totalLectivos = countLectiveDays(weeks);
    lectiveCountEl.textContent = totalLectivos;
    
    // El objetivo son 179 días lectivos
    const target = 179;
    if (totalLectivos === target) {
      lectiveCountEl.className = "stat-number stat-success";
      lectiveBadgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Objectiu aconseguit (179)`;
      lectiveBadgeEl.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
      lectiveBadgeEl.style.color = "#10b981";
    } else {
      lectiveCountEl.className = "stat-number stat-warning";
      const diff = totalLectivos - target;
      const text = diff > 0 ? `+${diff} de més` : `${diff} de menys`;
      lectiveBadgeEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Objectiu: 179 (${text})`;
      lectiveBadgeEl.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
      lectiveBadgeEl.style.color = "#ef4444";
    }

    // Calcular el desglose de días lectivos y no lectivos
    const counts = {
      // Lectivos
      lectiu: 0,
      exams: 0,
      avaluacions: 0,
      pfc: 0,
      "inici-fi": 0,
      "inici-fe": 0,
      "inici-pi": 0,
      altresLectivos: 0,
      
      // No lectivos
      vacances: 0,
      festiu: 0,
      weekend: 0,
      "no-lectiu": 0,
      "pre-post": 0
    };

    const noLectivosList = ["weekend", "pre-post", "no-lectiu", "festiu", "vacances"];

    weeks.forEach(w => {
      w.days.forEach(d => {
        if (noLectivosList.includes(d.dayType)) {
          if (counts[d.dayType] !== undefined) {
            counts[d.dayType]++;
          }
        } else {
          if (counts[d.dayType] !== undefined) {
            counts[d.dayType]++;
          } else {
            counts.altresLectivos++;
          }
        }
      });
    });

    // Helper para generar filas de desglose
    function createBreakdownRow(label, count, dotClass) {
      let backgroundStyle = "";
      if (dotClass === "color-lectiu") backgroundStyle = "background-color: var(--c-lectiu); border: 1px solid var(--border-color);";
      else if (dotClass === "color-festiu") backgroundStyle = "background-color: var(--c-festiu);";
      else if (dotClass === "color-vacances") backgroundStyle = "background-color: var(--c-vacances);";
      else if (dotClass === "color-inici-fi") backgroundStyle = "background-color: var(--c-inici-fi);";
      else if (dotClass === "color-inici-fe") backgroundStyle = "background-color: var(--c-inici-fe);";
      else if (dotClass === "color-pfc") backgroundStyle = "background-color: var(--c-pfc);";
      else if (dotClass === "color-avaluacions") backgroundStyle = "background-color: var(--c-avaluacions);";
      else if (dotClass === "color-exams") backgroundStyle = "background-color: var(--c-exams);";
      else if (dotClass === "color-inici-pi") backgroundStyle = "background-color: var(--c-inici-pi);";
      else if (dotClass === "color-weekend") backgroundStyle = "background-color: var(--c-weekend); border: 1px solid var(--border-color);";
      else if (dotClass === "color-pre-post") backgroundStyle = "background-color: var(--c-pre-post); opacity: 0.55;";
      else if (dotClass === "color-no-lectiu") backgroundStyle = "background-color: var(--c-pre-post); border: 1px dashed var(--accent-color);";
      else backgroundStyle = "background-color: var(--text-muted);";

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; padding: 0.2rem 0; border-bottom: 1px dashed var(--border-color); color: var(--text-muted);">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <div style="width: 8px; height: 8px; border-radius: 50%; ${backgroundStyle}"></div>
            <span>${label}</span>
          </div>
          <span style="font-weight: 700; color: var(--text-main);">${count} ${count === 1 ? 'dia' : 'dies'}</span>
        </div>
      `;
    }

    // Renderizar desglose de lectivos
    const lectivosContainer = document.getElementById("lectivos-breakdown-list");
    if (lectivosContainer) {
      lectivosContainer.innerHTML = `
        ${counts.lectiu > 0 ? createBreakdownRow("Ordinari", counts.lectiu, "color-lectiu") : ""}
        ${counts.exams > 0 ? createBreakdownRow("Exàmens", counts.exams, "color-exams") : ""}
        ${counts.avaluacions > 0 ? createBreakdownRow("Avaluacions", counts.avaluacions, "color-avaluacions") : ""}
        ${counts.pfc > 0 ? createBreakdownRow("PFC", counts.pfc, "color-pfc") : ""}
        ${counts["inici-fi"] > 0 ? createBreakdownRow("Inici/Fi Curs", counts["inici-fi"], "color-inici-fi") : ""}
        ${counts["inici-fe"] > 0 ? createBreakdownRow("Inici FE (FCT)", counts["inici-fe"], "color-inici-fe") : ""}
        ${counts["inici-pi"] > 0 ? createBreakdownRow("Inici PI", counts["inici-pi"], "color-inici-pi") : ""}
        ${counts.altresLectivos > 0 ? createBreakdownRow("Altres lectius", counts.altresLectivos, "color-other") : ""}
      `;
    }

    // Renderizar desglose de no lectivos
    const noLectivosContainer = document.getElementById("no-lectivos-breakdown-list");
    if (noLectivosContainer) {
      noLectivosContainer.innerHTML = `
        ${counts.weekend > 0 ? createBreakdownRow("Caps de setmana", counts.weekend, "color-weekend") : ""}
        ${counts.vacances > 0 ? createBreakdownRow("Vacances", counts.vacances, "color-vacances") : ""}
        ${counts.festiu > 0 ? createBreakdownRow("Festius", counts.festiu, "color-festiu") : ""}
        ${counts["no-lectiu"] > 0 ? createBreakdownRow("No lectius (Set/Jun)", counts["no-lectiu"], "color-no-lectiu") : ""}
        ${counts["pre-post"] > 0 ? createBreakdownRow("Fora de curs", counts["pre-post"], "color-pre-post") : ""}
      `;
    }
  }

  // Renderiza la lista de festivos locales en la barra lateral
  function renderLocalHolidaysList() {
    holidaysListContainer.innerHTML = "";
    const dates = Object.keys(appState.localHolidays).sort();
    
    if (dates.length === 0) {
      holidaysListContainer.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No hi ha festius locals definits</div>`;
      return;
    }

    dates.forEach(dStr => {
      const parts = dStr.split("-");
      const formattedDate = `${parts[2]}/${parts[1]}`;
      const name = appState.localHolidays[dStr] || "Festiu Local";
      
      const item = document.createElement("div");
      item.className = "holiday-item";
      item.innerHTML = `
        <div>
          <span class="date">${formattedDate}</span>
          <span class="name" title="${name}"> - ${name}</span>
        </div>
        <button class="delete-holiday-btn" data-date="${dStr}" title="Eliminar festiu">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      holidaysListContainer.appendChild(item);
    });

    // Añadir eventos para eliminar festivos
    document.querySelectorAll(".delete-holiday-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const dStr = btn.getAttribute("data-date");
        delete appState.localHolidays[dStr];
        // Quitar también el override si existía en ese día
        delete appState.dayOverrides[dStr];
        
        saveStateToLocalStorage();
        renderAll();
      });
    });
  }

  // Renderiza la cuadrícula del calendario
  function renderCalendarGrid(weeks) {
    calendarBody.innerHTML = "";
    
    // Visibilidad de columnas de Quincenas según la vista
    if (appState.currentView === "1er") {
      thQ1.style.display = "";
      thQ2.style.display = "none";
    } else if (appState.currentView === "2n") {
      thQ1.style.display = "none";
      thQ2.style.display = "";
    } else {
      thQ1.style.display = "";
      thQ2.style.display = "";
    }

    // Visibilidad del selector de base de proyección (se oculta por completo ya que ahora el cálculo es automático/innecesario)
    if (shadingBaseContainer) {
      shadingBaseContainer.style.display = "none";
    }

    let lastMonth = -1;

    weeks.forEach((week, idx) => {
      // Si cambia el mes de la semana (por su lunes), marcar inicio de mes y calcular rowspan
      const mondayDate = new Date(week.days[0].dateStr);
      const currentMonth = mondayDate.getMonth();
      let isNewMonth = false;
      
      if (currentMonth !== lastMonth) {
        isNewMonth = true;
        lastMonth = currentMonth;
      }

      // Crear fila de la semana
      const row = document.createElement("tr");
      if (isNewMonth) {
        row.classList.add("month-start-row");
      }

      // Celda del Mes (si es inicio de mes)
      if (isNewMonth) {
        const monthCell = document.createElement("td");
        monthCell.className = "month-cell";
        
        // Calcular cuántas semanas tiene este mes en este año lectivo
        let rowSpanCount = 0;
        let scanIdx = idx;
        while (scanIdx < weeks.length) {
          const scanMonday = new Date(weeks[scanIdx].days[0].dateStr);
          if (scanMonday.getMonth() === currentMonth) {
            rowSpanCount++;
            scanIdx++;
          } else {
            break;
          }
        }
        
        monthCell.rowSpan = rowSpanCount;
        
        // Formato: Mes + Año (ej: "Setembre" y abajo "'26")
        const shortYear = String(mondayDate.getFullYear()).slice(-2);
        monthCell.innerHTML = `<div style="font-weight: 750;">${MONTH_NAMES[currentMonth]}</div><div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; margin-top: 3px;">'${shortYear}</div>`;
        
        row.appendChild(monthCell);
      }

      // Destacar visualmente quincenas (sombreado)
      const toggleShadingEl = document.getElementById("toggle-fortnight-shading");
      const showFortnightShading = toggleShadingEl ? toggleShadingEl.checked : true;

      if (showFortnightShading) {
        if (appState.currentView === "unified") {
          // En la vista unificada, solo sombreamos las semanas que NO están unificadas (diferentes quincenas o una vacía)
          const shadingClass = getShadingClassForUnified(week);
          if (shadingClass) {
            row.classList.add(shadingClass);
          }
        } else {
          // En las vistas individuales (no unificadas), se sombrean todas las quincenas ordinarias normalmente
          const labelCurrent = (appState.currentView === "2n") ? week.quinzena2 : week.quinzena1;
          const shadingClass = getShadingClass(labelCurrent);
          if (shadingClass) {
            row.classList.add(shadingClass);
          }
        }
      }
      
      // Obtener el concepto y tipo filtrados para la vista actual
      const viewEvent = getEventInfoForView(week, appState.currentView);

      // Celda del Concepto Semanal
      const conceptCell = document.createElement("td");
      conceptCell.className = "cell-concept";
      conceptCell.setAttribute("data-monday", week.mondayDateStr);
      
      // Aplicar color de concepto especial si procede
      const displayType = getDisplayClassType(viewEvent.eventType);
      if (displayType) {
        conceptCell.classList.add(`cell-${displayType}`);
      }
      
      conceptCell.innerHTML = `
        <span class="concept-text" title="${viewEvent.concept || "Premeu per editar"}">
          ${viewEvent.concept || `<span class="no-concept-placeholder" style="color: var(--text-muted); font-style: italic; font-size: 0.75rem;">Sense concepte</span>`}
        </span>
        <i class="fa-solid fa-pen edit-indicator"></i>
      `;
      row.appendChild(conceptCell);

      // Celdas de los Días (Lunes a Domingo)
      week.days.forEach(day => {
        const dayCell = document.createElement("td");
        
        // Determinar el tipo de día a mostrar en esta vista
        const displayDayType = getDayTypeForView(day, week, appState.currentView);
        
        dayCell.className = `date-cell cell-${displayDayType}`;
        dayCell.setAttribute("data-date", day.dateStr);
        
        let tooltipText = "";
        if (displayDayType === "festiu") tooltipText = day.holidayName || "Festiu";
        else if (displayDayType === "vacances") tooltipText = day.holidayName || "Vacances";
        else if (displayDayType === "weekend") tooltipText = day.dayOfWeek === 6 ? "Dissabte" : "Diumenge";
        else if (displayDayType === "pre-post") tooltipText = "Fora de curs lectiu";
        else if (displayDayType === "no-lectiu") tooltipText = "No lectiu (editable)";
        else if (displayDayType === "exams") tooltipText = "Exàmens";
        else if (displayDayType === "avaluacions") tooltipText = "Avaluació";
        else if (displayDayType === "inici-fe") tooltipText = "Inici FE";
        else if (displayDayType === "pfc") tooltipText = "PI";
        else if (displayDayType === "inici-pi") tooltipText = "Inici PI 2n";
        else if (displayDayType === "inici-fi") tooltipText = "Inici / Fi curs";
        else tooltipText = "Lectiu ordinari";

        dayCell.innerHTML = `
          <span class="date-number">${day.dayNum}</span>
          <span class="day-name-tooltip">${tooltipText}</span>
        `;
        row.appendChild(dayCell);
      });

      // Celda Quinzena 2n
      if (appState.currentView === "unified" || appState.currentView === "2n") {
        const q2Cell = document.createElement("td");
        q2Cell.className = "cell-quinzena cell-q2";
        
        if (week.quinzena2) {
          q2Cell.textContent = week.quinzena2;
          if (week.quinzena2 === "Ex 2n") {
            q2Cell.classList.add("cell-exams");
          } else if (week.quinzena2 === "PI / FE" || week.quinzena2 === "FE") {
            q2Cell.classList.add("cell-quinzena-special");
          } else if (!isNaN(week.quinzena2)) {
            q2Cell.classList.add("cell-quinzena-active");
          }
        }
        
        // Línea doble independiente para la columna de 2n Any
        const nextWeek = weeks[idx + 1];
        if (nextWeek && showFortnightShading) {
          const labelCurrent = String(week.quinzena2 || "").trim();
          const labelNext = String(nextWeek.quinzena2 || "").trim();
          if (labelCurrent !== labelNext) {
            q2Cell.classList.add("fortnight-divider-q2");
          }
        }
        row.appendChild(q2Cell);
      }

      // Celda Quinzena 1er
      if (appState.currentView === "unified" || appState.currentView === "1er") {
        const q1Cell = document.createElement("td");
        q1Cell.className = "cell-quinzena cell-q1";
        
        if (week.quinzena1) {
          q1Cell.textContent = week.quinzena1;
          if (week.quinzena1.includes("Ex 1er")) {
            q1Cell.classList.add("cell-exams");
          } else if (week.quinzena1 === "FE") {
            q1Cell.classList.add("cell-quinzena-special");
          } else if (!isNaN(week.quinzena1)) {
            q1Cell.classList.add("cell-quinzena-active");
          }
        }
        
        // Línea doble independiente para la columna de 1er Any
        const nextWeek = weeks[idx + 1];
        if (nextWeek && showFortnightShading) {
          const labelCurrent = String(week.quinzena1 || "").trim();
          const labelNext = String(nextWeek.quinzena1 || "").trim();
          if (labelCurrent !== labelNext) {
            q1Cell.classList.add("fortnight-divider-q1");
          }
        }
        row.appendChild(q1Cell);
      }

      calendarBody.appendChild(row);
    });

    // Agregar manejadores de eventos sobre la cuadrícula dinámica
    attachGridEvents();
  }

  // Une eventos del Grid
  function attachGridEvents() {
    // Clic en Concepto
    document.querySelectorAll(".cell-concept").forEach(cell => {
      cell.addEventListener("click", () => {
        const monday = cell.getAttribute("data-monday");
        openWeekModal(monday);
      });
    });

    // Clic en Celda de Quincena (hace lo mismo que clic en concepto, permitiendo editar la quincena)
    document.querySelectorAll(".cell-quinzena").forEach(cell => {
      cell.addEventListener("click", () => {
        const row = cell.closest("tr");
        const conceptCell = row.querySelector(".cell-concept");
        if (conceptCell) {
          const monday = conceptCell.getAttribute("data-monday");
          openWeekModal(monday);
        }
      });
    });

    // Clic en Celda de Fecha (Día individual)
    document.querySelectorAll(".date-cell").forEach(cell => {
      cell.addEventListener("click", () => {
        const dateStr = cell.getAttribute("data-date");
        // No permitir editar días fuera de curso
        const override = appState.dayOverrides[dateStr];
        const dayData = getComputedCalendarData().flatMap(w => w.days).find(d => d.dateStr === dateStr);
        
        if (dayData && dayData.dayType !== "pre-post") {
          openDayModal(dateStr, dayData);
        }
      });
    });
  }

  // Render totalizador de la interfaz
  function renderAll() {
    const computedData = getComputedCalendarData();
    updateLectiveStats(computedData);
    renderLocalHolidaysList();
    renderCalendarGrid(computedData);
  }

  // --- MANEJO DE MODALES ---

  // Modal de Semana
  function openWeekModal(mondayStr) {
    activeEditingWeekMonday = mondayStr;
    const event = appState.weeklyEvents[mondayStr] || { concept: "", type: "", quinzena1: undefined, quinzena2: undefined };
    
    // Cargar los valores de quincena actuales calculados para esta semana
    const computedWeeks = getComputedCalendarData();
    const currentWeek = computedWeeks.find(w => w.mondayDateStr === mondayStr);
    
    modalConceptInput.value = event.concept || "";
    selectedWeekType = event.type || "lectiu";
    
    // Cargar inputs del modal con el valor modificado o el por defecto de la semana
    document.getElementById("modal-q1-input").value = event.quinzena1 !== undefined ? event.quinzena1 : (currentWeek ? currentWeek.quinzena1 : "");
    document.getElementById("modal-q2-input").value = event.quinzena2 !== undefined ? event.quinzena2 : (currentWeek ? currentWeek.quinzena2 : "");
    
    // Resetear checkbox de propagación
    document.getElementById("modal-propagate-days").checked = false;
    
    // Resaltar el botón correspondiente en el modal
    updateModalTypeSelection("week", selectedWeekType);
    
    document.getElementById("modal-title").textContent = `Planificar Setmana del ${formatSpanishDate(mondayStr)}`;
    editWeekModal.classList.add("active");
  }

  function closeWeekModal() {
    editWeekModal.classList.remove("active");
    activeEditingWeekMonday = null;
  }

  // Modal de Día
  function openDayModal(dateStr, dayData) {
    activeEditingDayStr = dateStr;
    selectedDayType = dayData.dayType;
    
    dayHolidayNameInput.value = dayData.dayType === "festiu" ? (dayData.holidayName || "") : "";
    dayHolidayNameGroup.style.display = dayData.dayType === "festiu" ? "block" : "none";
    
    updateModalTypeSelection("day", selectedDayType);
    
    dayModalTitle.textContent = `Editar Dia: ${formatSpanishDate(dateStr)}`;
    editDayModal.classList.add("active");
  }

  function closeDayModal() {
    editDayModal.classList.remove("active");
    activeEditingDayStr = null;
  }

  // Actualiza la visualización de selección de botones de tipo en el modal
  function updateModalTypeSelection(modalType, typeVal) {
    if (modalType === "week") {
      document.querySelectorAll(".color-choice-group button").forEach(btn => {
        const btnType = btn.getAttribute("data-type");
        if (btnType === typeVal) {
          btn.classList.add("selected");
        } else {
          btn.classList.remove("selected");
        }
      });
    } else {
      document.querySelectorAll("#day-type-choices button").forEach(btn => {
        const btnType = btn.getAttribute("data-daytype");
        if (btnType === typeVal) {
          btn.classList.add("selected");
        } else {
          btn.classList.remove("selected");
        }
      });
    }
  }

  // Formato español de fecha (ej: "Dilluns 14 de Desembre de 2026")
  function formatSpanishDate(dateStr) {
    const parts = dateStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const weekday = ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"][d.getDay()];
    const month = MONTH_NAMES[d.getMonth()];
    return `${weekday}, ${parts[2]} de ${month} ${parts[0]}`;
  }

  // --- BOTONES Y COMPORTAMIENTO GENERAL ---

  // Selección de tipo de semana en modal
  document.querySelectorAll(".color-choice-group button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedWeekType = btn.getAttribute("data-type");
      updateModalTypeSelection("week", selectedWeekType);
    });
  });

  // Guardar datos semana modal
  btnSaveModal.addEventListener("click", () => {
    if (activeEditingWeekMonday) {
      const newConcept = modalConceptInput.value.trim();
      const type = selectedWeekType === "lectiu" ? "" : selectedWeekType;
      const q1Val = document.getElementById("modal-q1-input").value.trim();
      const q2Val = document.getElementById("modal-q2-input").value.trim();
      const propagate = document.getElementById("modal-propagate-days").checked;
      
      // Si hay datos modificados o valores específicos, guardar
      if (newConcept || type || q1Val !== "" || q2Val !== "") {
        appState.weeklyEvents[activeEditingWeekMonday] = {
          concept: newConcept,
          type: type,
          quinzena1: q1Val,
          quinzena2: q2Val
        };
      } else {
        delete appState.weeklyEvents[activeEditingWeekMonday];
      }
      
      // Propagar el tipo a todos los días laborables de esta semana si se solicita
      if (propagate) {
        const computedWeeks = getComputedCalendarData();
        const currentWeek = computedWeeks.find(w => w.mondayDateStr === activeEditingWeekMonday);
        if (currentWeek) {
          currentWeek.days.forEach(day => {
            if (day.dayOfWeek !== 0 && day.dayOfWeek !== 6 && day.dayType !== "pre-post") {
              if (selectedWeekType === "lectiu") {
                delete appState.dayOverrides[day.dateStr];
              } else {
                appState.dayOverrides[day.dateStr] = {
                  dayType: selectedWeekType,
                  holidayName: ""
                };
              }
            }
          });
        }
      }
      
      saveStateToLocalStorage();
      closeWeekModal();
      renderAll();
    }
  });

  // Selección de tipo de día en modal
  document.querySelectorAll("#day-type-choices button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedDayType = btn.getAttribute("data-daytype");
      updateModalTypeSelection("day", selectedDayType);
      dayHolidayNameGroup.style.display = selectedDayType === "festiu" ? "block" : "none";
    });
  });

  // Guardar datos día modal
  btnSaveDayModal.addEventListener("click", () => {
    if (activeEditingDayStr) {
      const holidayName = dayHolidayNameInput.value.trim();
      
      // Aplicar override de día
      appState.dayOverrides[activeEditingDayStr] = {
        dayType: selectedDayType,
        holidayName: selectedDayType === "festiu" ? (holidayName || "Festiu Local") : ""
      };
      
      // Si se cambia a festivo de forma explícita, agregarlo a la lista de festivos locales
      if (selectedDayType === "festiu") {
        appState.localHolidays[activeEditingDayStr] = holidayName || "Festiu Local";
      } else {
        // Si antes era un festivo local, quitarlo
        delete appState.localHolidays[activeEditingDayStr];
      }

      saveStateToLocalStorage();
      closeDayModal();
      renderAll();
    }
  });

  // Cancelar modales
  btnCancelModal.addEventListener("click", closeWeekModal);
  closeModalBtn.addEventListener("click", closeWeekModal);
  btnCancelDayModal.addEventListener("click", closeDayModal);
  closeDayModalBtn.addEventListener("click", closeDayModal);

  // Selector de Vista (1er / 2n / Unified)
  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      appState.currentView = btn.getAttribute("data-view");
      saveStateToLocalStorage();
      renderAll();
    });
  });

  // Añadir festivo desde formulario lateral
  addHolidayBtn.addEventListener("click", () => {
    const dStr = newHolidayDateInput.value;
    if (!dStr) return;
    
    // Comprobar límite de 3 festivos locales
    const totalLocals = Object.keys(appState.localHolidays).length;
    if (totalLocals >= 3 && !appState.localHolidays[dStr]) {
      alert("Atenció: Ja has definit els 3 festius locals permesos oficialment (7 desembre, 17 i 18 març). Pots afegir més de forma excepcional, però l'objectiu oficial de 179 dies lectius pot desviar-se.");
    }
    
    appState.localHolidays[dStr] = "Festiu Local Especial";
    
    // Registrar el override también
    appState.dayOverrides[dStr] = {
      dayType: "festiu",
      holidayName: "Festiu Local Especial"
    };

    newHolidayDateInput.value = "";
    saveStateToLocalStorage();
    renderAll();
  });

  // Restablecer el calendario a los valores por defecto
  resetBtn.addEventListener("click", () => {
    if (confirm("Segur que vols restablir el calendari als valors oficials per defecte del curs 2026-2027? Es perdran tots els conceptes i festius personalitzats.")) {
      appState.localHolidays = { ...CONFIG_2026_2027.localHolidays };
      appState.weeklyEvents = { ...CONFIG_2026_2027.defaultWeeklyEvents };
      appState.dayOverrides = {};
      saveStateToLocalStorage();
      renderAll();
    }
  });

  // Modo Oscuro / Claro
  themeToggleBtn.addEventListener("click", () => {
    const html = document.documentElement;
    const isDark = html.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    
    themeToggleBtn.innerHTML = newTheme === "dark" 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
    
    localStorage.setItem("calendario_theme", newTheme);
  });

  // Carga del tema guardado
  const savedTheme = localStorage.getItem("calendario_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggleBtn.innerHTML = savedTheme === "dark" 
    ? '<i class="fa-solid fa-sun"></i>' 
    : '<i class="fa-solid fa-moon"></i>';

  // Exportar JSON
  exportBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `planificacio_fp_2026_2027.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Exportar para Publicar (archivo JS)
  if (exportPublishBtn) {
    exportPublishBtn.addEventListener("click", () => {
      const dataObj = {
        localHolidays: appState.localHolidays,
        weeklyEvents: appState.weeklyEvents,
        dayOverrides: appState.dayOverrides
      };
      
      const fileContent = `// Archivo de datos exportado por el administrador para la versión de consulta pública.
// No modificar manualmente. Para actualizar este archivo, pulsa "Exportar per a Publicar"
// en la versión de administración (index.html) y guarda el archivo descargado en esta carpeta.
window.CUSTOM_PUBLISHED_DATA = ${JSON.stringify(dataObj, null, 2)};
`;

      const dataStr = "data:text/javascript;charset=utf-8," + encodeURIComponent(fileContent);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `custom-data.js`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Importar JSON
  importTrigger.addEventListener("click", () => {
    importFileInput.click();
  });

  importFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        appState = {
          currentView: parsed.currentView || "unified",
          localHolidays: parsed.localHolidays || {},
          weeklyEvents: parsed.weeklyEvents || {},
          dayOverrides: parsed.dayOverrides || {}
        };
        
        saveStateToLocalStorage();
        renderAll();
        
        // Ajustar el botón de vista activa en la UI
        document.querySelectorAll(".view-btn").forEach(btn => {
          if (btn.getAttribute("data-view") === appState.currentView) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
        
        alert("Planificació importada correctament!");
      } catch (err) {
        alert("Error al carregar el fitxer JSON. Assegurat que és un format vàlid.");
      }
    };
    reader.readAsText(file);
    // Resetear input para que permita cargar el mismo archivo
    importFileInput.value = "";
  });

  // Imprimir / Guardar en PDF
  printPdfBtn.addEventListener("click", () => {
    window.print();
  });

  // Resaltado interactivo de leyendas
  document.querySelectorAll(".legend-item").forEach(item => {
    const type = item.getAttribute("data-type");
    
    item.addEventListener("mouseenter", () => {
      // Resaltar todas las celdas de este tipo
      document.querySelectorAll(`.cell-${type}, .date-cell.cell-${type}`).forEach(el => {
        el.classList.add("highlight-type");
      });
    });

    item.addEventListener("mouseleave", () => {
      document.querySelectorAll(".highlight-type").forEach(el => {
        el.classList.remove("highlight-type");
      });
    });
  });

  // --- INICIALIZACIÓN ---
  
  // Cargar preferencia de sombreado de quincenas
  const toggleFortnightShadingEl = document.getElementById("toggle-fortnight-shading");
  if (toggleFortnightShadingEl) {
    const savedShading = localStorage.getItem("calendario_fortnight_shading");
    if (savedShading !== null) {
      toggleFortnightShadingEl.checked = savedShading === "true";
    }
    toggleFortnightShadingEl.addEventListener("change", () => {
      localStorage.setItem("calendario_fortnight_shading", toggleFortnightShadingEl.checked);
      renderAll();
    });
  }

  // Cargar y binear el selector de base de proyección (1er / 2n)
  document.querySelectorAll("input[name='shading-base']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      appState.shadingBase = e.target.value;
      saveStateToLocalStorage();
      renderAll();
    });
  });

  loadStateFromLocalStorage();
  
  // Sincronizar radio buttons de proyección con el estado cargado
  const activeRadio = document.querySelector(`input[name='shading-base'][value='${appState.shadingBase}']`);
  if (activeRadio) activeRadio.checked = true;

  renderAll();
});
