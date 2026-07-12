document.addEventListener("DOMContentLoaded", () => {
  // --- CONSTANTES ---
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

  // --- VARIABLES DE ESTADO ---
  let appState = {
    currentView: "unified", // "unified" | "1er" | "2n"
    shadingBase: "1er",     // "1er" | "2n"
    localHolidays: {},      // Se heredan del administrador
    weeklyEvents: {},       // Aquí el usuario público guarda sus cambios de quincena
    dayOverrides: {}        // Se heredan del administrador
  };

  // Identificador de la semana que se está editando (quinzenas únicamente)
  let activeEditingWeekMondayStr = null;

  // Referencias DOM
  const themeToggleBtn = document.getElementById("theme-toggle");
  const printPdfBtn = document.getElementById("print-pdf");
  const shadingBaseContainer = document.getElementById("shading-base-container");
  const viewBtns = document.querySelectorAll(".view-btn");
  const lectiveCountEl = document.getElementById("lective-count");
  const lectiveBadgeEl = document.getElementById("lective-badge");

  const calendarGrid = document.getElementById("calendar-grid");
  const calendarBody = document.getElementById("calendar-body");
  const thQ1 = document.getElementById("th-q1");
  const thQ2 = document.getElementById("th-q2");

  // Modal de Semana (Quinzenes)
  const editWeekOverlay = document.getElementById("edit-week-overlay");
  const closeWeekModalBtn = document.getElementById("close-week-modal-btn");
  const weekModalTitle = document.getElementById("week-modal-title");
  const modalQ1Input = document.getElementById("modal-q1-input");
  const modalQ2Input = document.getElementById("modal-q2-input");
  const cancelWeekBtn = document.getElementById("cancel-week-btn");
  const saveWeekBtn = document.getElementById("save-week-btn");

  // --- TEMA CLARO / OSCURO ---
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("calendario_fp_theme", newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector("i");
    if (theme === "dark") {
      icon.className = "fa-solid fa-sun";
    } else {
      icon.className = "fa-solid fa-moon";
    }
  }

  const savedTheme = localStorage.getItem("calendario_fp_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  // --- LOCAL STORAGE ---
  function saveStateToLocalStorage() {
    localStorage.setItem("calendario_fp_public_state_2026", JSON.stringify(appState));
  }

  function loadStateFromLocalStorage() {
    const saved = localStorage.getItem("calendario_fp_public_state_2026");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        appState = {
          currentView: parsed.currentView || "unified",
          shadingBase: parsed.shadingBase || "1er",
          localHolidays: parsed.localHolidays || {},
          weeklyEvents: parsed.weeklyEvents || {},
          dayOverrides: parsed.dayOverrides || {}
        };
      } catch (e) {
        console.error("Error cargando estado local visor público", e);
      }
    }
  }

  // --- CÁLCULO Y RENDERIZADO ---
  function getComputedCalendarData() {
    // Fusionar datos base con la configuración exportada por el administrador (desde custom-data.js)
    const published = window.CUSTOM_PUBLISHED_DATA || { localHolidays: {}, weeklyEvents: {}, dayOverrides: {} };
    
    // Combinar festivos locales
    const mergedLocalHolidays = {
      ...CONFIG_2026_2027.localHolidays,
      ...published.localHolidays
    };
    
    // Combinar eventos semanales (conceptos y colores de la administración, y quincenas)
    const mergedWeeklyEvents = {
      ...CONFIG_2026_2027.defaultWeeklyEvents,
      ...published.weeklyEvents
    };

    // Generar la lista de semanas base
    const baseWeeks = generateCalendarData(mergedLocalHolidays, mergedWeeklyEvents);
    
    // Aplicar overrides de quincenas y días
    baseWeeks.forEach(week => {
      // 1. Aplicar las quincenas publicadas por el admin
      const pubEvent = published.weeklyEvents && published.weeklyEvents[week.mondayDateStr];
      if (pubEvent) {
        if (pubEvent.quinzena1 !== undefined) {
          week.quinzena1 = pubEvent.quinzena1;
        }
        if (pubEvent.quinzena2 !== undefined) {
          week.quinzena2 = pubEvent.quinzena2;
        }
      }

      // 2. Aplicar las quincenas personalizadas por el usuario público (desde su LocalStorage)
      const userOverride = appState.weeklyEvents[week.mondayDateStr];
      if (userOverride) {
        if (userOverride.quinzena1 !== undefined) {
          week.quinzena1 = userOverride.quinzena1;
        }
        if (userOverride.quinzena2 !== undefined) {
          week.quinzena2 = userOverride.quinzena2;
        }
      }

      // 3. Aplicar los overrides de días (los colores de días individuales pintados por el administrador)
      week.days.forEach(day => {
        const pubOverride = published.dayOverrides && published.dayOverrides[day.dateStr];
        if (pubOverride) {
          day.dayType = pubOverride.dayType;
          if (pubOverride.holidayName) {
            day.holidayName = pubOverride.holidayName;
          }
        }
      });
    });
    
    return baseWeeks;
  }

  function updateLectiveStats(weeks) {
    if (!lectiveCountEl || !lectiveBadgeEl) return;
    const totalLectivos = countLectiveDays(weeks);
    lectiveCountEl.textContent = totalLectivos;
    
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

    const counts = {
      lectiu: 0,
      exams: 0,
      avaluacions: 0,
      pfc: 0,
      "inici-fi": 0,
      "inici-fe": 0,
      "inici-pi": 0,
      altresLectivos: 0,
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

  function renderCalendarGrid(weeks) {
    calendarBody.innerHTML = "";
    
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
      const mondayDate = new Date(week.days[0].dateStr);
      const currentMonth = mondayDate.getMonth();
      let isNewMonth = false;
      
      if (currentMonth !== lastMonth) {
        isNewMonth = true;
        lastMonth = currentMonth;
      }

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

      // Celda del Concepto (Solo lectura, pero al hacer clic abre la edición de quinzenas)
      const conceptCell = document.createElement("td");
      conceptCell.className = "cell-concept";
      conceptCell.setAttribute("data-monday", week.mondayDateStr);
      conceptCell.style.cursor = "pointer";
      
      // Aplicar color de concepto especial si procede
      const displayType = getDisplayClassType(viewEvent.eventType);
      if (displayType) {
        conceptCell.classList.add(`cell-${displayType}`);
      }
      
      conceptCell.innerHTML = `
        <span class="concept-text" style="font-weight: 500;">
          ${viewEvent.concept || `<span class="no-concept-placeholder" style="color: var(--text-muted); font-style: italic; font-size: 0.75rem;">Sense concepte</span>`}
        </span>
      `;
      row.appendChild(conceptCell);

      // Celdas de los Días (Totalmente bloqueados en el visor público, no-click)
      week.days.forEach(day => {
        const dayCell = document.createElement("td");
        
        // Determinar el tipo de día a mostrar en esta vista
        const displayDayType = getDayTypeForView(day, week, appState.currentView);
        
        dayCell.className = `date-cell cell-${displayDayType}`;
        dayCell.setAttribute("data-date", day.dateStr);
        dayCell.style.cursor = "default";
        
        let tooltipText = "";
        if (displayDayType === "festiu") tooltipText = day.holidayName || "Festiu";
        else if (displayDayType === "vacances") tooltipText = day.holidayName || "Vacances";
        else if (displayDayType === "weekend") tooltipText = day.dayOfWeek === 6 ? "Dissabte" : "Diumenge";
        else if (displayDayType === "pre-post") tooltipText = "Fora de curs lectiu";
        else if (displayDayType === "no-lectiu") tooltipText = "No lectiu (bloquejat)";
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

      // Celda Quinzena 2n (Editable)
      if (appState.currentView === "unified" || appState.currentView === "2n") {
        const q2Cell = document.createElement("td");
        q2Cell.className = "cell-quinzena cell-q2";
        q2Cell.style.cursor = "pointer";
        
        if (week.quinzena2) {
          q2Cell.textContent = week.quinzena2;
          const cleanLabel = String(week.quinzena2).toLowerCase()
            .replace(/extraordinaria/g, "")
            .replace(/extraordinària/g, "")
            .replace(/extr\./g, "")
            .replace(/extr/g, "");

          if (cleanLabel.includes("ex") || cleanLabel.includes("exàmen")) {
            q2Cell.classList.add("cell-exams");
          } else if (cleanLabel.includes("fe") || cleanLabel.includes("fct")) {
            q2Cell.classList.add("cell-quinzena-special");
          } else if (cleanLabel.includes("pi") || cleanLabel.includes("pfc")) {
            q2Cell.classList.add("cell-pfc");
          } else if (cleanLabel.includes("av") || cleanLabel.includes("avaluació")) {
            q2Cell.classList.add("cell-avaluacions");
          } else if (!isNaN(week.quinzena2)) {
            q2Cell.classList.add("cell-quinzena-active");
          }
        }
        
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

      // Celda Quinzena 1er (Editable)
      if (appState.currentView === "unified" || appState.currentView === "1er") {
        const q1Cell = document.createElement("td");
        q1Cell.className = "cell-quinzena cell-q1";
        q1Cell.style.cursor = "pointer";
        
        if (week.quinzena1) {
          q1Cell.textContent = week.quinzena1;
          const cleanLabel = String(week.quinzena1).toLowerCase()
            .replace(/extraordinaria/g, "")
            .replace(/extraordinària/g, "")
            .replace(/extr\./g, "")
            .replace(/extr/g, "");

          if (cleanLabel.includes("ex") || cleanLabel.includes("exàmen")) {
            q1Cell.classList.add("cell-exams");
          } else if (cleanLabel.includes("fe") || cleanLabel.includes("fct")) {
            q1Cell.classList.add("cell-quinzena-special");
          } else if (cleanLabel.includes("pi") || cleanLabel.includes("pfc")) {
            q1Cell.classList.add("cell-pfc");
          } else if (cleanLabel.includes("av") || cleanLabel.includes("avaluació")) {
            q1Cell.classList.add("cell-avaluacions");
          } else if (!isNaN(week.quinzena1)) {
            q1Cell.classList.add("cell-quinzena-active");
          }
        }
        
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

    attachGridEvents();
  }

  function attachGridEvents() {
    // Clic en Concepto o Celdas de Quinzena abre el modal para cambiar solo quinzenas
    document.querySelectorAll(".cell-concept, .cell-quinzena").forEach(cell => {
      cell.addEventListener("click", () => {
        const row = cell.closest("tr");
        const conceptCell = row.querySelector(".cell-concept");
        if (conceptCell) {
          const monday = conceptCell.getAttribute("data-monday");
          openWeekModal(monday);
        }
      });
    });
  }

  // --- CONTROLES DE EDICIÓN (SÓLO QUINZENAS) ---
  function openWeekModal(mondayStr) {
    activeEditingWeekMondayStr = mondayStr;
    const computedWeeks = getComputedCalendarData();
    const currentWeek = computedWeeks.find(w => w.mondayDateStr === mondayStr);
    
    if (currentWeek) {
      modalQ1Input.value = currentWeek.quinzena1 || "";
      modalQ2Input.value = currentWeek.quinzena2 || "";
      weekModalTitle.textContent = `Quinzenes Setmana: ${formatSpanishDate(mondayStr)}`;
      editWeekOverlay.classList.add("active");
    }
  }

  // Cierra el modal
  function closeWeekModal() {
    editWeekOverlay.classList.remove("active");
    activeEditingWeekMondayStr = null;
  }

  function saveWeekChanges() {
    if (activeEditingWeekMondayStr) {
      if (!appState.weeklyEvents[activeEditingWeekMondayStr]) {
        appState.weeklyEvents[activeEditingWeekMondayStr] = {};
      }
      
      appState.weeklyEvents[activeEditingWeekMondayStr].quinzena1 = modalQ1Input.value.trim();
      appState.weeklyEvents[activeEditingWeekMondayStr].quinzena2 = modalQ2Input.value.trim();
      
      saveStateToLocalStorage();
      renderAll();
      closeWeekModal();
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

  // --- EVENT LISTENERS ---
  closeWeekModalBtn.addEventListener("click", closeWeekModal);
  cancelWeekBtn.addEventListener("click", closeWeekModal);
  saveWeekBtn.addEventListener("click", saveWeekChanges);

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

  // Selector de Base de Proyección
  document.querySelectorAll("input[name='shading-base']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      appState.shadingBase = e.target.value;
      saveStateToLocalStorage();
      renderAll();
    });
  });

  // Checkbox de sombreado
  const toggleShadingEl = document.getElementById("toggle-fortnight-shading");
  if (toggleShadingEl) {
    toggleShadingEl.addEventListener("change", () => {
      renderAll();
    });
  }

  // Impresión PDF
  printPdfBtn.addEventListener("click", () => {
    window.print();
  });

  // --- RENDER COMPLETO ---
  function renderAll() {
    const computedData = getComputedCalendarData();
    updateLectiveStats(computedData);
    renderCalendarGrid(computedData);
  }

  // --- INICIALIZACIÓN ---
  loadStateFromLocalStorage();
  
  // Sincronizar UI de la barra lateral con el estado cargado
  const activeViewBtn = document.querySelector(`.view-btn[data-view='${appState.currentView}']`);
  if (activeViewBtn) {
    viewBtns.forEach(b => b.classList.remove("active"));
    activeViewBtn.classList.add("active");
  }
  
  const activeRadio = document.querySelector(`input[name='shading-base'][value='${appState.shadingBase}']`);
  if (activeRadio) activeRadio.checked = true;

  renderAll();
});
