/* ============================================================
   AJEDREZ — RELOJ + ANOTADOR
   APP.JS
   Versión base funcional
   Incluye:
   - Navegación entre pantallas
   - Configuración de tiempos P1 / P2
   - Modo A lo MATI / LIBRE
   - Incremento configurable
   - Cartas +1/+2/+3
   - Reloj regresivo
   - Cambio de turno
   - Tiempo por movimiento
   - Matriz de movimientos
   - TIME OUT
   - Finalización con doble pulsación
   - Gráfico Canvas básico
   ============================================================ */
/* ============================================================
   1. NAVEGACIÓN ENTRE PANTALLAS
   ============================================================ */
function showScreen(screenId) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach((screen) => {
    screen.classList.remove("active");
  });
  const target = document.getElementById(screenId);
  if (!target) {
    console.error("No existe la pantalla:", screenId);
    return;
  }
  target.classList.add("active");
}
/* ============================================================
   2. ELEMENTOS PRINCIPALES
   ============================================================ */
const btnOpenClock = document.getElementById("btn-open-clock");
const btnOpenScore = document.getElementById("btn-open-score");
const btnStartConfig = document.getElementById("btn-start-config");
const btnStartScore = document.getElementById("btn-start-score");
const btnPlay = document.getElementById("btn-play");
const btnPause = document.getElementById("btn-pause");
const btnFinish = document.getElementById("btn-finish");
const zonePlayer1 = document.getElementById("zone-player-1");
const zonePlayer2 = document.getElementById("zone-player-2");
const timeoutMessage = document.getElementById("timeout-message");
const finishConfirm = document.getElementById("finish-confirm");
/* ============================================================
   3. NAVEGACIÓN INICIAL
   ============================================================ */
if (btnOpenClock) {
  btnOpenClock.addEventListener("click", () => {
    showScreen("screen-clock-config");
  });
}
if (btnOpenScore) {
  btnOpenScore.addEventListener("click", () => {
    showScreen("screen-score-config");
  });
}
if (btnStartScore) {
  btnStartScore.addEventListener("click", () => {
    showScreen("screen-score");
  });
}
/* ============================================================
   4. BOTONES HOME
   ============================================================ */
document.querySelectorAll("[data-home]").forEach((button) => {
  button.addEventListener("click", () => {
    pauseClock();
    showScreen("screen-home");
  });
});
/* ============================================================
   5. CONFIGURACIÓN DEL MODO DE JUEGO
   ============================================================ */
const modeRadios = document.querySelectorAll('input[name="clock-mode"]');
const freeOptions = document.getElementById("free-options");
const incrementEnabled = document.getElementById("cfg-increment-enabled");
const incrementOptions = document.getElementById("increment-options");
function updateModeUI() {
  const selected = document.querySelector('input[name="clock-mode"]:checked');
  if (!selected) return;
  if (selected.value === "libre") {
    if (freeOptions) {
      freeOptions.classList.remove("hidden");
    }
  } else {
    if (freeOptions) {
      freeOptions.classList.add("hidden");
    }
  }
}
modeRadios.forEach((radio) => {
  radio.addEventListener("change", updateModeUI);
});
if (incrementEnabled) {
  incrementEnabled.addEventListener("change", () => {
    if (incrementEnabled.checked) {
      incrementOptions.classList.remove("hidden");
    } else {
      incrementOptions.classList.add("hidden");
    }
  });
}
updateModeUI();
/* ============================================================
   6. ESTADO DEL RELOJ
   ============================================================ */
const clockState = {
  running: false,
  activePlayer: null,
  lastTick: null,
  timerId: null,
  startDateTime: null,
  endDateTime: null,
  finishPending: false,
  finishTimeoutId: null,
  timeoutPlayer: null,
  remaining: {
    1: 0,
    2: 0
  },
  moveElapsed: {
    1: 0,
    2: 0
  },
  moveNumber: {
    1: 0,
    2: 0
  },
  globalMoveNumber: 0,
  matrix: [],
  history: []
};
/* ============================================================
   7. FUNCIONES PARA LEER LA CONFIGURACIÓN
   ============================================================ */
function getNumber(id, fallback = 0) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn("No existe el elemento:", id);
    return fallback;
  }
  const value = Number(element.value);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
}
/* ============================================================
   CONVERTIR HH + MM + SS A MILISEGUNDOS
   ============================================================ */
function readPlayerTime(player) {
  let hours;
  let minutes;
  let seconds;
  if (player === 1) {
    hours = getNumber("cfg-p1-hours", 0);
    minutes = getNumber("cfg-p1-minutes", 0);
    seconds = getNumber("cfg-p1-seconds", 0);
  } else {
    hours = getNumber("cfg-p2-hours", 0);
    minutes = getNumber("cfg-p2-minutes", 0);
    seconds = getNumber("cfg-p2-seconds", 0);
  }
  /*
       Evitamos valores negativos.
    */
  hours = Math.max(0, hours);
  minutes = Math.max(0, minutes);
  seconds = Math.max(0, seconds);
  const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
  return totalMs;
}
/* ============================================================
   9. FORMATO DE TIEMPO
   ============================================================ */
/*
   Internamente usamos MILISEGUNDOS.
   Para mostrar:
   00:05
   01:37
   12:48
   01:30:00
   usamos estas funciones.
*/
function formatMMSS(ms) {
  ms = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
  );
}
function formatHHMMSS(ms) {
  ms = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}
/* ============================================================
   10. ACTUALIZAR DISPLAY DEL RELOJ
   ============================================================ */
function updateDisplay() {
  const p1Total = document.getElementById("clock-p1-total");
  const p2Total = document.getElementById("clock-p2-total");
  const p1Move = document.getElementById("clock-p1-move");
  const p2Move = document.getElementById("clock-p2-move");
  if (p1Total) {
    p1Total.textContent = formatHHMMSS(clockState.remaining[1]);
  }
  if (p2Total) {
    p2Total.textContent = formatHHMMSS(clockState.remaining[2]);
  }
  if (p1Move) {
    p1Move.textContent = formatMMSS(clockState.moveElapsed[1]);
  }
  if (p2Move) {
    p2Move.textContent = formatMMSS(clockState.moveElapsed[2]);
  }
  updateTurnIndicators();
}
/* ============================================================
   11. INDICADOR DE TURNO
   ============================================================ */
function updateTurnIndicators() {
  const status1 = document.getElementById("player-1-status");
  const status2 = document.getElementById("player-2-status");
  if (status1) {
    status1.textContent =
      clockState.activePlayer === 1 ? "JUGANDO" : "ESPERANDO";
  }
  if (status2) {
    status2.textContent =
      clockState.activePlayer === 2 ? "JUGANDO" : "ESPERANDO";
  }
  if (zonePlayer1) {
    zonePlayer1.classList.toggle("active-turn", clockState.activePlayer === 1);
  }
  if (zonePlayer2) {
    zonePlayer2.classList.toggle("active-turn", clockState.activePlayer === 2);
  }
}
/* ============================================================
   12. NUEVA PARTIDA
   ============================================================ */
function startNewGame() {
  pauseClock();
  const p1Time = readPlayerTime(1);
  const p2Time = readPlayerTime(2);
  console.log("Tiempo configurado P1:", p1Time, "ms");
  console.log("Tiempo configurado P2:", p2Time, "ms");
  /*
       IMPORTANTE:
       Si por algún motivo el usuario deja ambos
       tiempos en cero, NO arrancamos.
       Esto evita el TIME OUT instantáneo.
    */
  if (p1Time <= 0 || p2Time <= 0) {
    alert("El tiempo inicial de ambos jugadores debe ser mayor que 00:00.");
    return false;
  }
  clockState.running = false;
  clockState.activePlayer = null;
  clockState.lastTick = null;
  clockState.remaining[1] = p1Time;
  clockState.remaining[2] = p2Time;
  clockState.moveElapsed[1] = 0;
  clockState.moveElapsed[2] = 0;
  clockState.moveNumber[1] = 0;
  clockState.moveNumber[2] = 0;
  clockState.globalMoveNumber = 0;
  clockState.matrix = [];
  clockState.history = [];
  clockState.timeoutPlayer = null;
  clockState.finishPending = false;
  hideTimeout();
  hideFinishMessage();
  updateDisplay();
  drawClockChart();
  /*
       Actualizamos también la variable global
       para poder inspeccionar la matriz desde consola.
    */
  window.__AJEDREZ_MATRIX__ = clockState.matrix;
  return true;
}
/* ============================================================
   13. INICIAR PARTIDA DESDE CONFIGURACIÓN
   ============================================================ */
if (btnStartConfig) {
  btnStartConfig.addEventListener("click", () => {
    const started = startNewGame();
    if (!started) {
      return;
    }
    showScreen("screen-clock");
    /*
           IMPORTANTE:
           Acá NO arrancamos automáticamente.
           Primero aparece el reloj.
           Después el usuario presiona PLAY.
        */
  });
}
/* ============================================================
   14. PLAY
   ============================================================ */
function playClock() {
  /*
       Si todavía no existe una partida,
       creamos una.
    */
  if (clockState.remaining[1] <= 0 || clockState.remaining[2] <= 0) {
    const started = startNewGame();
    if (!started) return;
  }
  /*
       Registrar fecha y hora de inicio
       SOLAMENTE en el primer PLAY de la partida.
       Si la partida está pausada y volvemos a
       presionar PLAY, esta fecha NO cambia.
    */
  if (!clockState.startDateTime) {
    clockState.startDateTime = new Date();
  }
  /*
       Primer PLAY de la partida:
       empieza Jugador 1.
    */
  if (clockState.activePlayer === null) {
    clockState.activePlayer = 1;
    clockState.moveElapsed[1] = 0;
  }
  if (clockState.running) {
    return;
  }
  clockState.running = true;
  clockState.lastTick = Date.now();
  clockState.timerId = setInterval(clockTick, 50);
  updateDisplay();
}
/* =========================================
   BOTÓN PLAY
   ========================================= */
if (btnPlay) {
  btnPlay.addEventListener("click", () => {
    playClock();
  });
}
/* ============================================================
   15. TICK DEL RELOJ
   ============================================================ */
function clockTick() {
  if (!clockState.running) {
    return;
  }
  const now = Date.now();
  if (clockState.lastTick === null) {
    clockState.lastTick = now;
    return;
  }
  const elapsed = now - clockState.lastTick;
  clockState.lastTick = now;
  const player = clockState.activePlayer;
  if (player !== 1 && player !== 2) {
    return;
  }
  /*
       Restamos tiempo al jugador activo.
    */
  clockState.remaining[player] -= elapsed;
  /*
       Sumamos tiempo al movimiento actual.
    */
  clockState.moveElapsed[player] += elapsed;
  /*
       TIME OUT
    */
  if (clockState.remaining[player] <= 0) {
    clockState.remaining[player] = 0;
    updateDisplay();
    handleTimeout(player);
    return;
  }
  updateDisplay();
}
/* ============================================================
   16. PAUSA
   ============================================================ */
function pauseClock() {
  if (!clockState.running) {
    return;
  }
  /*
       Antes de detenerlo registramos
       el último intervalo de tiempo.
    */
  updateClockBeforeStop();
  clockState.running = false;
  clockState.lastTick = null;
  if (clockState.timerId !== null) {
    clearInterval(clockState.timerId);
    clockState.timerId = null;
  }
  updateDisplay();
}
/* ============================================================
   17. ACTUALIZAR TIEMPO ANTES DE PAUSAR
   ============================================================ */
function updateClockBeforeStop() {
  if (!clockState.running) {
    return;
  }
  const now = Date.now();
  const elapsed = now - clockState.lastTick;
  const player = clockState.activePlayer;
  if (player === 1 || player === 2) {
    clockState.remaining[player] -= elapsed;
    clockState.moveElapsed[player] += elapsed;
    if (clockState.remaining[player] < 0) {
      clockState.remaining[player] = 0;
    }
  }
  clockState.lastTick = now;
}
/* ============================================================
   18. BOTÓN PAUSA
   ============================================================ */
if (btnPause) {
  btnPause.addEventListener("click", () => {
    pauseClock();
  });
}
/* ============================================================
   19. CAMBIO DE TURNO
   ============================================================ */
function switchTurn() {
  if (!clockState.running) {
    return;
  }
  const currentPlayer = clockState.activePlayer;
  if (currentPlayer !== 1 && currentPlayer !== 2) {
    return;
  }
  /*
       Actualizamos exactamente hasta el
       momento en que se pulsó la zona.
    */
  updateClockBeforeStop();
  /*
       Registramos el movimiento.
    */
  registerMove(currentPlayer);
  /*
       Acá después incorporaremos:
       - Fischer
       - Bronstein
       - A lo MATI
       - cartas
    */
  const nextPlayer = currentPlayer === 1 ? 2 : 1;
  clockState.activePlayer = nextPlayer;
  clockState.moveElapsed[nextPlayer] = 0;
  clockState.running = true;
  clockState.lastTick = Date.now();
  updateDisplay();
}
/* ============================================================
   20. TOQUE / CLICK EN JUGADOR 1
   ============================================================ */
if (zonePlayer1) {
  zonePlayer1.addEventListener("click", (event) => {
    /*
           Si se hace click sobre un botón interno,
           no cambiar el turno.
        */
    if (event.target.closest("button")) {
      return;
    }
    if (clockState.running && clockState.activePlayer === 1) {
      switchTurn();
    }
  });
}
/* ============================================================
   21. TOQUE / CLICK EN JUGADOR 2
   ============================================================ */
if (zonePlayer2) {
  zonePlayer2.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    if (clockState.running && clockState.activePlayer === 2) {
      switchTurn();
    }
  });
}
/* ============================================================
   22. REGISTRAR MOVIMIENTO EN MATRIZ
   ============================================================ */
function registerMove(player) {
  // Movimiento global = cada cambio de turno
  clockState.globalMoveNumber++;
  // Movimiento individual del jugador
  clockState.moveNumber[player]++;
  const spentMs = clockState.moveElapsed[player];
  const remainingMs = clockState.remaining[player];
  const incrementalApplied = 0;
  const row = {
    // Número total de movimientos/turnos
    movimientoGlobal: clockState.globalMoveNumber,
    // 1 = Blancas / 2 = Negras
    jugador: player,
    // Número de movimiento correspondiente
    // AL JUGADOR, no al turno global.
    //
    // Blancas: 1, 2, 3, 4...
    // Negras:  1, 2, 3, 4...
    movimiento: clockState.moveNumber[player],
    tiempoMovimientoMs: spentMs,
    tiempoRestanteMs: remainingMs,
    incrementoMs: incrementalApplied,
    tiempoMovimiento: formatMMSS(spentMs),
    tiempoRestante: formatMMSS(remainingMs),
    incremento: formatMMSS(incrementalApplied)
  };
  clockState.matrix.push(row);
  window.__AJEDREZ_MATRIX__ = clockState.matrix;
  console.log(
    "Movimiento global:",
    row.movimientoGlobal,
    "| Jugador:",
    player === 1 ? "BLANCAS" : "NEGRAS",
    "| Movimiento:",
    row.movimiento,
    "| Tiempo:",
    row.tiempoMovimiento,
    "| Restante:",
    row.tiempoRestante
  );
  console.table(clockState.matrix);
}
/* ============================================================
   23. TIME OUT
   ============================================================ */
function handleTimeout(player) {
  pauseClock();
  clockState.timeoutPlayer = player;
  if (timeoutMessage) {
    const playerText = timeoutMessage.querySelector("div");
    if (playerText) {
      playerText.textContent = "TIME OUT — JUGADOR " + player;
    }
    timeoutMessage.classList.remove("hidden");
    /*
           Nos aseguramos de que el mensaje
           quede por encima del contenido.
        */
    timeoutMessage.style.zIndex = "1000";
    timeoutMessage.style.position = "fixed";
    timeoutMessage.style.inset = "0";
    timeoutMessage.style.display = "flex";
    timeoutMessage.style.alignItems = "center";
    timeoutMessage.style.justifyContent = "center";
    timeoutMessage.style.flexDirection = "column";
    timeoutMessage.style.pointerEvents = "none";
  }
  /*
       El juego queda detenido.
    */
  updateDisplay();
}
/* ============================================================
   24. OCULTAR TIME OUT
   ============================================================ */
function hideTimeout() {
  if (!timeoutMessage) return;
  timeoutMessage.classList.add("hidden");
  timeoutMessage.style.display = "none";
}
/* ============================================================
   25. FINALIZAR PARTIDA
   ============================================================ */
function finishGame() {
  clockState.endDateTime = new Date();
  // Guardamos quién estaba jugando antes de detener el reloj
  const player = clockState.activePlayer;
  // Detener el reloj
  pauseClock();
  /*
     Si había un movimiento en curso, lo registramos
     antes de finalizar la partida.
  */
  if (
    player !== null &&
    player !== undefined &&
    clockState.moveElapsed[player] > 0
  ) {
    registerMove(player);
  }
  console.log("PARTIDA FINALIZADA");
  console.table(clockState.matrix);
  // Ocultar confirmación
  hideFinishMessage();
  // Descargar matriz
  downloadMatrixTXT();
}
/* ============================================================
   DESCARGAR MATRIZ — FORMATO DE PARTIDA
   ============================================================ */
function downloadMatrixTXT() {
  const matrix = clockState.matrix;
  if (!matrix || matrix.length === 0) {
    console.warn("No hay movimientos registrados para descargar.");
    return;
  }
  const movimientos = {};
  matrix.forEach((row) => {
    const numero = row.movimiento;
    if (!movimientos[numero]) {
      movimientos[numero] = {
        blancas: null,
        negras: null
      };
    }
    if (row.jugador === 1) {
      movimientos[numero].blancas = row;
    }
    if (row.jugador === 2) {
      movimientos[numero].negras = row;
    }
  });
  /* ============================================================
     CREAR TEXTO
     ============================================================ */
  let txt = "";
  txt += "MATRIZ DE TIEMPOS — AJEDREZ APP\n";
  txt += "================================\n\n";
  /* ============================================================
     FECHA Y HORA DE INICIO / FIN
     ============================================================ */
  const inicio = clockState.startDateTime || new Date();
  const fin = clockState.endDateTime || new Date();
  function formatoFechaHora(fecha) {
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${dia}-${mes}-${anio} ${hora}:${minutos}`;
  }
  txt += `INICIO: ${formatoFechaHora(inicio)}\n`;
  txt += `FIN:    ${formatoFechaHora(fin)}\n\n`;
  /* ============================================================
     ENCABEZADOS
     ============================================================ */
  txt +=
    "MOVIMIENTO\t" +
    "TIEMPO BLANCAS\t" +
    "TIEMPO NEGRAS\t" +
    "INCREMENTO BLANCAS\t" +
    "INCREMENTO NEGRAS\n";
  txt +=
    "---------\t" +
    "---------------\t" +
    "--------------\t" +
    "-------------------\t" +
    "------------------\n";
  /* ============================================================
     FILAS
     ============================================================ */
  const numeros = Object.keys(movimientos)
    .map(Number)
    .sort((a, b) => a - b);
  numeros.forEach((numero) => {
    const movimiento = movimientos[numero];
    const blancas = movimiento.blancas;
    const negras = movimiento.negras;
    const tiempoBlancas = blancas ? blancas.tiempoMovimiento : "--:--";
    const tiempoNegras = negras ? negras.tiempoMovimiento : "--:--";
    const incrementoBlancas = blancas ? blancas.incremento : "--:--";
    const incrementoNegras = negras ? negras.incremento : "--:--";
    txt +=
      `${numero}\t` +
      `${tiempoBlancas}\t` +
      `${tiempoNegras}\t` +
      `${incrementoBlancas}\t` +
      `${incrementoNegras}\n`;
  });
  /* ============================================================
     CREAR ARCHIVO
     ============================================================ */
  const blob = new Blob([txt], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  /* ============================================================
     NOMBRE DEL ARCHIVO
     ============================================================ */
  const dia = String(inicio.getDate()).padStart(2, "0");
  const mes = String(inicio.getMonth() + 1).padStart(2, "0");
  const anio = inicio.getFullYear();
  const horaInicio =
    String(inicio.getHours()).padStart(2, "0") +
    ":" +
    String(inicio.getMinutes()).padStart(2, "0");
  const horaFin =
    String(fin.getHours()).padStart(2, "0") +
    ":" +
    String(fin.getMinutes()).padStart(2, "0");
  const nombreArchivo = `Ajedrez - ${dia}-${mes}-${anio} de ${horaInicio} a ${horaFin}.txt`;
  /* ============================================================
     DESCARGAR
     ============================================================ */
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  /* ============================================================
     LIBERAR MEMORIA
     ============================================================ */
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
/* ============================================================
   26. MOSTRAR CONFIRMACIÓN DE FINALIZACIÓN
   ============================================================ */
function finishPressed() {
  // El reloj queda pausado mientras el usuario decide.
  pauseClock();
  if (finishConfirm) {
    finishConfirm.classList.remove("hidden");
    finishConfirm.style.zIndex = "1100";
  }
}
/* ============================================================
   27. OCULTAR CONFIRMACIÓN
   ============================================================ */
function hideFinishMessage() {
  if (!finishConfirm) return;
  finishConfirm.classList.add("hidden");
}
/* ============================================================
   28. BOTONES DE CONFIRMACIÓN
   ============================================================ */
if (btnFinish) {
  btnFinish.addEventListener("click", finishPressed);
}
/* ------------------------------------------------------------
   CANCELAR
   ------------------------------------------------------------ */
const btnFinishCancel = document.getElementById("btn-finish-cancel");
if (btnFinishCancel) {
  btnFinishCancel.addEventListener("click", () => {
    hideFinishMessage();
  });
}
/* ------------------------------------------------------------
   FINALIZAR
   ------------------------------------------------------------ */
const btnFinishConfirm = document.getElementById("btn-finish-confirm");
if (btnFinishConfirm) {
  btnFinishConfirm.addEventListener("click", () => {
    finishGame();
  });
}
/* ============================================================
   28 BIS. CREAR LOS CONTROLES +1 / +2 / +3 PARA CADA JUGADOR
   ============================================================ */
function createBonusGroup(player) {
  const zone = document.getElementById(`zone-player-${player}`);
  if (!zone) {
    console.warn("No existe la zona del jugador:", player);
    return null;
  }
  /*
     Si ya existe un grupo dentro de esta zona,
     lo reutilizamos.
  */
  let group = zone.querySelector(".manual-bonus");
  if (!group) {
    group = document.createElement("div");
    group.className = "manual-bonus";
    [1, 2, 3].forEach((amount) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bonus-button";
      button.dataset.bonus = String(amount);
      button.textContent = `+${amount}`;
      group.appendChild(button);
    });
    zone.appendChild(group);
  }
  /*
     Identificamos explícitamente a qué jugador
     pertenece este grupo.
  */
  group.dataset.player = String(player);
  return group;
}
/*
   Nos aseguramos de que existan los dos grupos.
*/
function initializeBonusButtons() {
  /*
     Primero eliminamos grupos duplicados que pudieran
     haber quedado fuera de las zonas de jugadores.
  */
  document.querySelectorAll(".manual-bonus").forEach((group) => {
    const insidePlayerZone =
      group.closest("#zone-player-1") || group.closest("#zone-player-2");
    if (!insidePlayerZone) {
      group.remove();
    }
  });
  /*
     Crear / reutilizar grupo del Jugador 1.
  */
  createBonusGroup(1);
  /*
     Crear / reutilizar grupo del Jugador 2.
  */
  createBonusGroup(2);
}
/*
   Inicializamos los dos grupos.
*/
initializeBonusButtons();
/* ============================================================
   29. CARTAS +1 / +2 / +3
   ============================================================ */
function setupBonusButtonEvents() {
  const bonusButtons = document.querySelectorAll(".bonus-button");
  bonusButtons.forEach((button) => {
    /*
       Evitamos agregar dos veces el mismo listener.
    */
    if (button.dataset.bonusListener === "true") {
      return;
    }
    button.dataset.bonusListener = "true";
    button.addEventListener("click", (event) => {
      /*
         Evita que el click llegue a la zona
         del jugador y cambie el turno.
      */
      event.stopPropagation();
      /*
         Las cartas solamente funcionan
         si están activadas.
      */
      const cardsEnabled = document.getElementById("cfg-cards")?.checked;
      if (!cardsEnabled) {
        return;
      }
      /*
         La partida tiene que estar corriendo.
      */
      if (!clockState.running) {
        return;
      }
      /*
         Determinamos qué jugador está jugando.
      */
      const player = clockState.activePlayer;
      if (player !== 1 && player !== 2) {
        return;
      }
      /*
         Valor del botón:
         +1
         +2
         +3
      */
      const bonusMinutes = Number(button.dataset.bonus);
      if (!Number.isFinite(bonusMinutes)) {
        return;
      }
      /*
         Convertimos minutos a milisegundos.
      */
      const bonusMs = bonusMinutes * 60 * 1000;
      /*
         Sumamos el tiempo al jugador ACTIVO.
      */
      clockState.remaining[player] += bonusMs;
      /*
         Registramos también el uso de la carta
         en la consola.
      */
      console.log(`BONUS P${player}: +${bonusMinutes} minuto(s)`);
      console.log(
        `Tiempo restante P${player}:`,
        formatHHMMSS(clockState.remaining[player])
      );
      /*
         Mostramos el aviso visual.
      */
      showBonus(player, bonusMinutes);
      /*
         Actualizamos el reloj.
      */
      updateDisplay();
    });
  });
}
/*
   Configuramos los botones después de crearlos.
*/
setupBonusButtonEvents();
/* ============================================================
   30. MOSTRAR BONUS
   ============================================================ */
function showBonus(player, amount) {
  const element = document.getElementById(`bonus-p${player}`);
  if (!element) {
    return;
  }
  element.textContent = `+${amount} MIN`;
  element.classList.add("show");
  setTimeout(() => {
    element.classList.remove("show");
  }, 800);
}
/* ============================================================
   31. CANVAS — GRÁFICO EN TIEMPO REAL
   ============================================================ */
function drawClockChart() {
  const canvas = document.getElementById("clock-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = (canvas.width = canvas.clientWidth || 800);
  const height = (canvas.height = canvas.clientHeight || 180);
  ctx.clearRect(0, 0, width, height);
  /*
       Gráfico muy básico por ahora.
       Más adelante lo reemplazaremos
       por el gráfico completo de la partida.
    */
  const maxTime = Math.max(clockState.remaining[1], clockState.remaining[2], 1);
  function drawPlayer(player, y) {
    const ratio = clockState.remaining[player] / maxTime;
    const x = ratio * width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  drawPlayer(1, 50);
  drawPlayer(2, 120);
}
/* ============================================================
   32. REDIBUJAR CANVAS DURANTE EL RELOJ
   ============================================================ */
const originalUpdateDisplay = updateDisplay;
/*
   No necesitamos reemplazar
   updateDisplay.
   Dibujamos directamente en el ticker
   mediante esta función auxiliar.
*/
function updateChart() {
  drawClockChart();
}
/* ============================================================
   33. ENVOLTORIO DE TICK PARA GRÁFICO
   ============================================================ */
/*
   El gráfico se actualiza mediante
   un intervalo independiente liviano.
*/
setInterval(() => {
  if (clockState.running) {
    updateChart();
  }
}, 250);
/* ============================================================
   34. ESTADO INICIAL
   ============================================================ */
function initializeApp() {
  hideTimeout();
  hideFinishMessage();
  /*
       No arrancamos el reloj todavía.
       Solamente dejamos preparada
       la pantalla inicial.
    */
  showScreen("screen-home");
  console.log("AJEDREZ APP — inicializada correctamente.");
}
/* ============================================================
   35. INICIAR APP
   ============================================================ */
initializeApp();
/* ============================================================
   36. DEBUG
   ============================================================ */
window.__AJEDREZ_CLOCK__ = clockState;
window.__AJEDREZ_FORMAT_MMSS__ = formatMMSS;
window.__AJEDREZ_FORMAT_HHMMSS__ = formatHHMMSS;
