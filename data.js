// Módulo de datos para el Calendario de Ciclos Formativos 2026-2027
// Contiene las fechas de inicio, fin, festivos oficiales de la GVA y locales,
// así como el mapeo estructural de semanas, evaluaciones, exámenes y quincenas.

const CONFIG_2026_2027 = {
  courseStart: "2026-09-09", // Miércoles 9 de Septiembre 2026
  courseEnd: "2027-06-18",   // Viernes 18 de Junio 2027
  
  // Festivos oficiales (GVA)
  gvaHolidays: {
    "2026-10-09": "Día de la Comunitat Valenciana",
    "2026-10-12": "Día de la Fiesta Nacional",
    "2026-12-08": "Día de la Inmaculada Concepción",
    "2027-03-19": "Día de San José",
  },
  
  // Festivos locales aprobados para este curso (7 Dic, 17 y 18 Mar)
  localHolidays: {
    "2026-12-07": "Festivo Local (Puente de la Constitución)",
    "2027-03-17": "Festivo Local (Fallas)",
    "2027-03-18": "Festivo Local (Fallas)",
  },
  
  // Periodos vacacionales (ambos inclusive)
  vacationPeriods: [
    {
      start: "2026-12-22",
      end: "2027-01-06",
      name: "Vacances de Nadal"
    },
    {
      start: "2027-03-25",
      end: "2027-04-05",
      name: "Vacances de Pasqua"
    }
  ],

  // Estructura de hitos por defecto para el curso, basándose en la plantilla del curso pasado
  defaultWeeklyEvents: {
    // Noviembre 2026
    "2026-11-16": { concept: "Ex. 2n", type: "exams-2n" },
    "2026-11-23": { concept: "Ex. 1r", type: "exams-1r" },
    
    // Diciembre 2026
    "2026-11-30": { concept: "Av. 1r/2n", type: "avaluacions" },
    
    // Febrero 2027
    "2027-02-15": { concept: "Ex. 2n", type: "exams-2n" },
    "2027-02-22": { concept: "PI 2n / Av. 2n", type: "pi-av-2n" },
    
    // Marzo 2027
    "2027-03-01": { concept: "Ex. 1r / FE 2n", type: "ex1-fe2" },
    "2027-03-08": { concept: "Av. 1r", type: "av-1r" },
    
    // Mayo 2027
    "2027-05-24": { concept: "FE 1r", type: "fe-1r" },
    
    // Junio 2027
    "2027-05-31": { concept: "Ex 1r", type: "exams-1r" },
    "2027-06-07": { concept: "PFC / Av O. 2n", type: "pfc-av2" },
    "2027-06-14": { concept: "EX. Extr. 2N / Av. O. 1r", type: "ex-extr-av1" },
    "2027-06-21": { concept: "Av. Extr. 2N / Ex.Extr 1r/FPB", type: "av-extr-ex-extr-1r" },
    "2027-06-28": { concept: "Av. Extr 1r/FPB/", type: "av-extr-1r" },
  }
};

// Función para parsear fechas de formato YYYY-MM-DD
function parseDateString(str) {
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Función para dar formato a fecha YYYY-MM-DD
function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Genera la lista de semanas completa desde Septiembre 2026 a Junio 2027
function generateCalendarData(customHolidays = {}, customEvents = null) {
  const startYear = 2026;
  const endYear = 2027;
  
  // Lista de semanas a retornar
  const weeks = [];
  
  // Empezamos la cuadrícula en la semana del lunes 7 de septiembre de 2026
  // Y terminamos en la última semana de junio de 2027 (semana del lunes 28 de junio)
  let currentDate = new Date(startYear, 8, 7); // 7 de Septiembre de 2026 es Lunes
  const endDate = new Date(endYear, 5, 30); // 30 de Junio de 2027
  
  // Vamos avanzando de 7 en 7 días
  let weekIndex = 1;
  const events = customEvents || CONFIG_2026_2027.defaultWeeklyEvents;
  const mergedHolidays = {
    ...CONFIG_2026_2027.gvaHolidays,
    ...CONFIG_2026_2027.localHolidays,
    ...customHolidays
  };

  while (currentDate <= endDate || formatDateString(currentDate) === "2027-06-28") {
    const mondayStr = formatDateString(currentDate);
    const weekDays = [];
    
    // Generamos los 7 días de esta semana (Lunes a Domingo)
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(currentDate);
      dayDate.setDate(currentDate.getDate() + i);
      const dayStr = formatDateString(dayDate);
      
      const dayOfWeek = dayDate.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      
      // Clasificación de la fecha
      let dayType = "lectiu";
      let name = "";
      
      const isBeforeClasses = dayStr < CONFIG_2026_2027.courseStart;
      const isAfterClasses = dayStr > CONFIG_2026_2027.courseEnd;
      const isOutOfCalendar = dayStr < "2026-09-07" || dayStr > "2027-07-01"; // El 1 de Julio de 2027 es el último día editable
      
      if (isWeekend) {
        dayType = "weekend";
      } else if (isOutOfCalendar) {
        dayType = "pre-post";
      } else if (mergedHolidays[dayStr]) {
        dayType = "festiu";
        name = mergedHolidays[dayStr];
      } else {
        // Comprobar vacaciones
        let inVacation = false;
        for (const vp of CONFIG_2026_2027.vacationPeriods) {
          if (dayStr >= vp.start && dayStr <= vp.end) {
            inVacation = true;
            name = vp.name;
            break;
          }
        }
        if (inVacation) {
          dayType = "vacances";
        } else if (isBeforeClasses || isAfterClasses) {
          dayType = "no-lectiu";
        } else {
          dayType = "lectiu";
        }
      }
      
      weekDays.push({
        dateStr: dayStr,
        dayNum: dayDate.getDate(),
        monthNum: dayDate.getMonth(), // 0-11
        dayType: dayType,
        holidayName: name,
        dayOfWeek: dayOfWeek
      });
    }
    
    // Obtenemos evento de la semana
    const eventConfig = events[mondayStr] || { concept: "", type: "" };
    
    // Determinar la quincena para 1er y 2n año de acuerdo con la lógica de la tabla
    let q1Label = "";
    let q2Label = "";
    
    const weekNum = weekIndex;
    
    // Mapeo preciso de Quincenas para 1er Año en 2026-2027:
    if (weekNum === 1 || weekNum === 2) q1Label = "1";
    else if (weekNum === 3 || weekNum === 4) q1Label = "2";
    else if (weekNum === 5 || weekNum === 6) q1Label = "3";
    else if (weekNum === 7 || weekNum === 8) q1Label = "4";
    else if (weekNum === 9 || weekNum === 10 || weekNum === 11) q1Label = "5";
    else if (weekNum === 12) q1Label = "Ex 1er";
    else if (weekNum === 13) q1Label = "6"; 
    else if (weekNum === 14 || weekNum === 15) q1Label = "7";
    else if (weekNum === 16 || weekNum === 17) q1Label = "Nadal"; 
    else if (weekNum === 18 || weekNum === 19) q1Label = "8";
    else if (weekNum === 20 || weekNum === 21) q1Label = "9";
    else if (weekNum === 22 || weekNum === 23) q1Label = "10";
    else if (weekNum === 24 || weekNum === 25) q1Label = "11";
    else if (weekNum === 26) q1Label = "Ex 1er";
    else if (weekNum === 27 || weekNum === 28) q1Label = "12";
    else if (weekNum === 29 || weekNum === 30) q1Label = "Pasqua"; 
    else if (weekNum === 31 || weekNum === 32) q1Label = "13";
    else if (weekNum === 33 || weekNum === 34) q1Label = "14";
    else if (weekNum === 35 || weekNum === 36) q1Label = "15";
    else if (weekNum === 37) q1Label = "16";
    else if (weekNum >= 38) q1Label = "FE"; 
    
    // Mapeo preciso de Quincenas para 2n Año en 2026-2027:
    if (weekNum === 1 || weekNum === 2) q2Label = "1";
    else if (weekNum === 3 || weekNum === 4) q2Label = "2";
    else if (weekNum === 5 || weekNum === 6) q2Label = "3";
    else if (weekNum === 7 || weekNum === 8) q2Label = "4";
    else if (weekNum === 9 || weekNum === 10) q2Label = "5";
    else if (weekNum === 11) q2Label = "Ex 2n";
    else if (weekNum === 12 || weekNum === 13) q2Label = "6";
    else if (weekNum === 14 || weekNum === 15) q2Label = "7";
    else if (weekNum === 16 || weekNum === 17) q2Label = "Nadal";
    else if (weekNum === 18 || weekNum === 19) q2Label = "8";
    else if (weekNum === 20 || weekNum === 21) q2Label = "9";
    else if (weekNum === 22 || weekNum === 23) q2Label = "10";
    else if (weekNum === 24) q2Label = "Ex 2n";
    else if (weekNum >= 25) q2Label = "FE";

    weeks.push({
      weekIndex: weekIndex,
      mondayDateStr: mondayStr,
      concept: eventConfig.concept,
      eventType: eventConfig.type,
      days: weekDays,
      quinzena1: q1Label,
      quinzena2: q2Label
    });
    
    // Avanzar a la siguiente semana
    currentDate.setDate(currentDate.getDate() + 7);
    weekIndex++;
  }
  
  return weeks;
}

// Calcula los días lectivos totales en la lista de semanas generada
function countLectiveDays(weeks) {
  let count = 0;
  // Solo se computan como lectivos los días dentro del periodo escolar ordinario (del 9 de septiembre al 18 de junio)
  // que no sean fines de semana, festivos o vacaciones. Los días de preparación (septiembre/junio) no suman al cómputo oficial.
  weeks.forEach(w => {
    w.days.forEach(d => {
      const isWithinTeachingWindow = d.dateStr >= "2026-09-09" && d.dateStr <= "2027-06-18";
      const noLectivos = ["weekend", "festiu", "vacances"];
      
      if (isWithinTeachingWindow && !noLectivos.includes(d.dayType)) {
        count++;
      }
    });
  });
  return count;
}

// Exportamos las variables y funciones
if (typeof window !== 'undefined') {
  window.CONFIG_2026_2027 = CONFIG_2026_2027;
  window.generateCalendarData = generateCalendarData;
  window.countLectiveDays = countLectiveDays;
}
