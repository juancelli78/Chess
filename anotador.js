/* =========================================================
   ANOTADOR DE AJEDREZ
   ---------------------------------------------------------
   - P1 / P2 / P3 / P4 totalmente independientes
   - Cada partida tiene su propio reloj
   - Cada partida tiene su propia planilla
   - Cada partida tiene su propia configuración
   - app.js NO participa de la lógica del anotador
   ========================================================= */
(() => {
  "use strict";
  /* =========================================================
     CONFIGURACIÓN GENERAL
     ========================================================= */
  const PIEZAS_SAN = {
    "♟": "",
    "♞": "C",
    "♝": "A",
    "♜": "T",
    "♛": "D",
    "♚": "R"
  };
  const NOMBRES_PARTIDAS = ["P1", "P2", "P3", "P4"];
  let partidaActual = "P1";
  let partidaConfiguracionActual = "P1";
  const partidas = {
    P1: crearPartida("P1"),
    P2: crearPartida("P2"),
    P3: crearPartida("P3"),
    P4: crearPartida("P4")
  };
  /* =========================================================
     CREAR ESTADO DE UNA PARTIDA
     ========================================================= */
  function crearPartida(numero) {
    return {
      numero,
      /* ---------- RELOJ ---------- */
      running: false,
      finalizada: false,
      inicioPartida: null,
      inicioMovimiento: null,
      tiempoAcumuladoPartida: 0,
      timerId: null,
      /* ---------- TURNO ---------- */
      jugadorActual: "blancas",
      movimientoActual: 1,
      /* ---------- JUGADA PENDIENTE ---------- */
      piezaSeleccionada: null,
      destinoSeleccionado: null,
      captura: false,
      jaque: false,
      mate: false,
      enroque: null,
      /* ---------- PLANILLA ---------- */
      movimientos: [],
      /* ---------- MARCAS ---------- */
      revisar: false,
      queJuego: false,
      /* ---------- CONFIGURACIÓN ---------- */
      datos: {
        whiteName: "",
        blackName: "",
        whiteElo: "",
        blackElo: "",
        whiteNationality: "",
        blackNationality: "",
        gameTime: "01:30:00",
        round: "1",
        date: "",
        place: "",
        competitionType: "amistoso"
      }
    };
  }
  /* =========================================================
     OBTENER PARTIDA ACTUAL
     ========================================================= */
  function getPartida() {
    return partidas[partidaActual];
  }
  /* =========================================================
     ELEMENTOS
     ========================================================= */
  function $(selector) {
    return document.querySelector(selector);
  }
  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }
  /* =========================================================
     FORMATEAR TIEMPOS
     ========================================================= */
  function formatearTiempo(ms) {
    if (!Number.isFinite(ms) || ms < 0) {
      ms = 0;
    }
    const totalSegundos = Math.floor(ms / 1000);
    const segundos = totalSegundos % 60;
    const minutos = Math.floor(totalSegundos / 60);
    return (
      String(minutos).padStart(2, "0") + ":" + String(segundos).padStart(2, "0")
    );
  }
  /* =========================================================
     TIEMPO TOTAL DE PARTIDA
     ========================================================= */
  function obtenerTiempoPartida(partida) {
    if (!partida.inicioPartida) {
      return partida.tiempoAcumuladoPartida;
    }
    if (!partida.running) {
      return partida.tiempoAcumuladoPartida;
    }
    return (
      partida.tiempoAcumuladoPartida +
      (performance.now() - partida.inicioPartida)
    );
  }
  /* =========================================================
     TIEMPO DE LA JUGADA ACTUAL
     ========================================================= */
  function obtenerDuracionMovimiento(partida) {
    if (!partida.inicioMovimiento) {
      return 0;
    }
    return performance.now() - partida.inicioMovimiento;
  }
  /* =========================================================
     INICIAR UNA PARTIDA
     ========================================================= */
  function iniciarPartida(partida) {
    if (!partida) return;
    if (partida.finalizada) {
      return;
    }
    if (partida.running) {
      return;
    }
    const ahora = performance.now();
    partida.running = true;
    partida.inicioPartida = ahora;
    partida.inicioMovimiento = ahora;
    /* Cada partida tiene su propio intervalo */
    partida.timerId = setInterval(() => {
      if (partidaActual === partida.numero) {
        actualizarRelojPantalla();
      }
    }, 50);
  }
  /* =========================================================
     DETENER PARTIDA
     ========================================================= */
  function detenerPartida(partida) {
    if (!partida) return;
    if (!partida.running) {
      return;
    }
    const ahora = performance.now();
    partida.tiempoAcumuladoPartida += ahora - partida.inicioPartida;
    partida.running = false;
    partida.inicioPartida = null;
    if (partida.timerId) {
      clearInterval(partida.timerId);
      partida.timerId = null;
    }
  }
  /* =========================================================
     ACTUALIZAR RELOJ EN PANTALLA
     ========================================================= */
  function actualizarRelojPantalla() {
    const partida = getPartida();
    const clock = $("#screen-score .score-clock");
    if (!clock) return;
    const elementos = clock.querySelectorAll("div, span");
    const tiempoPartida = obtenerTiempoPartida(partida);
    const tiempoMovimiento = obtenerDuracionMovimiento(partida);
    if (elementos[0]) {
      elementos[0].textContent = formatearTiempo(tiempoPartida);
    }
    if (elementos[1]) {
      elementos[1].textContent = formatearTiempo(tiempoMovimiento);
    }
  }
  /* =========================================================
     CAMBIAR PARTIDA P1 / P2 / P3 / P4
     ========================================================= */
  function cambiarPartida(numero) {
    if (!partidas[numero]) return;
    partidaActual = numero;
    /* IMPORTANTE:
       NO detenemos la partida anterior.
       Las partidas son independientes. */
    actualizarSelectorPartida();
    limpiarSeleccionVisual();
    renderizarPlanilla();
    renderizarPendiente();
    actualizarBotonesMarca();
    actualizarRelojPantalla();
    /* Si esta partida todavía no comenzó,
       comienza al entrar en ella. */
    iniciarPartida(partidas[numero]);
  }
  /* =========================================================
     SELECTOR P1 / P2 / P3 / P4
     ========================================================= */
  function actualizarSelectorPartida() {
    $$(".score-game").forEach((button, index) => {
      const numero = `P${index + 1}`;
      button.classList.toggle("active", numero === partidaActual);
    });
  }
  /* =========================================================
     SELECCIÓN DE PIEZA
     ========================================================= */
  function seleccionarPieza(button) {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    const pieza = button.getAttribute("aria-label");
    if (!pieza) return;
    /* Si toca nuevamente la misma pieza:
       deseleccionamos todo lo pendiente relacionado */
    if (partida.piezaSeleccionada === pieza) {
      partida.piezaSeleccionada = null;
      partida.destinoSeleccionado = null;
      partida.captura = false;
      partida.jaque = false;
      partida.mate = false;
      partida.enroque = null;
      limpiarSeleccionVisual();
      renderizarPendiente();
      return;
    }
    partida.piezaSeleccionada = pieza;
    /* Si se selecciona una pieza normal,
       eliminamos cualquier enroque pendiente. */
    partida.enroque = null;
    actualizarSeleccionPieza();
    renderizarPendiente();
  }
  /* =========================================================
     VISUAL DE PIEZA SELECCIONADA
     ========================================================= */
  function actualizarSeleccionPieza() {
    const partida = getPartida();
    $$("#screen-score .piece-row button").forEach((button) => {
      const pieza = button.getAttribute("aria-label");
      button.classList.toggle(
        "selected-piece",
        pieza === partida.piezaSeleccionada
      );
    });
  }
  /* =========================================================
     SELECCIÓN DE DESTINO
     ========================================================= */
  function seleccionarDestino(button) {
    const partida = getPartida();
    if (!partida || partida.finalizada) {
      return;
    }
    /* Primero debe haber pieza */
    if (!partida.piezaSeleccionada) {
      return;
    }
    /* Si el usuario está haciendo una captura,
     X debe haber sido pulsada antes del destino */
    const square = button.dataset.square;
    if (!square) {
      return;
    }
    partida.destinoSeleccionado = square;
    partida.enroque = null;
    actualizarSeleccionTablero();
    renderizarPendiente();
  }
  /* =========================================================
     VISUAL DEL DESTINO
     ========================================================= */
  function actualizarSeleccionTablero() {
    const partida = getPartida();
    $$("#screen-score .board-grid button").forEach((button) => {
      button.classList.toggle(
        "selected-square",
        button.dataset.square === partida.destinoSeleccionado
      );
    });
  }
  /* =========================================================
     BOTÓN X — CAPTURA
     ========================================================= */
  function alternarCaptura() {
    const partida = getPartida();
    if (!partida || partida.finalizada) {
      return;
    }
    /* X solamente puede pulsarse DESPUÉS de seleccionar pieza */
    if (!partida.piezaSeleccionada) {
      return;
    }
    /* No permitimos captura en enroque */
    if (partida.enroque) {
      return;
    }
    partida.captura = !partida.captura;
    actualizarBotonCaptura();
    renderizarPendiente();
  }
  /* =========================================================
     JAQUE
     ========================================================= */
  function alternarJaque() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    if (!partida.piezaSeleccionada || !partida.destinoSeleccionado) {
      return;
    }
    partida.jaque = !partida.jaque;
    /* Jaque y mate son excluyentes */
    if (partida.jaque) {
      partida.mate = false;
    }
    renderizarPendiente();
  }
  /* =========================================================
     MATE
     ========================================================= */
  function alternarMate() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    if (!partida.piezaSeleccionada || !partida.destinoSeleccionado) {
      return;
    }
    partida.mate = !partida.mate;
    /* Mate y jaque son excluyentes */
    if (partida.mate) {
      partida.jaque = false;
    }
    renderizarPendiente();
  }
  /* =========================================================
     ENROQUE CORTO
     ========================================================= */
  function seleccionarEnroqueCorto() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    partida.enroque = partida.enroque === "O-O" ? null : "O-O";
    partida.piezaSeleccionada = null;
    partida.destinoSeleccionado = null;
    partida.captura = false;
    partida.jaque = false;
    partida.mate = false;
    limpiarSeleccionVisual();
    renderizarPendiente();
  }
  /* =========================================================
     ENROQUE LARGO
     ========================================================= */
  function seleccionarEnroqueLargo() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    partida.enroque = partida.enroque === "O-O-O" ? null : "O-O-O";
    partida.piezaSeleccionada = null;
    partida.destinoSeleccionado = null;
    partida.captura = false;
    partida.jaque = false;
    partida.mate = false;
    limpiarSeleccionVisual();
    renderizarPendiente();
  }
  /* =========================================================
     CONSTRUIR NOTACIÓN PENDIENTE
     ========================================================= */
  function construirJugadaPendiente(partida) {
    if (!partida) {
      return "";
    }
    /* =====================================================
     ENROQUE
     ===================================================== */
    if (partida.enroque) {
      let notation = partida.enroque;
      if (partida.mate) {
        notation += "#";
      } else if (partida.jaque) {
        notation += "+";
      }
      return notation;
    }
    /* =====================================================
     JUGADA NORMAL
     ===================================================== */
    /* Necesitamos SIEMPRE pieza + destino */
    if (!partida.piezaSeleccionada || !partida.destinoSeleccionado) {
      return "";
    }
    /* Letra de la pieza */
    const pieza = obtenerLetraPieza(partida.piezaSeleccionada);
    /* =====================================================
     CONSTRUIR EN EL ORDEN CORRECTO
     PIEZA + x + DESTINO
     ===================================================== */
    const captura = partida.captura ? "x" : "";
    let notation = pieza + captura + partida.destinoSeleccionado.toLowerCase();
    /* =====================================================
     JAQUE / MATE
     ===================================================== */
    if (partida.mate) {
      notation += "#";
    } else if (partida.jaque) {
      notation += "+";
    }
    return notation;
  }
  /* =========================================================
     LETRA SAN
     ========================================================= */
  function obtenerLetraPieza(nombre) {
    const simbolos = {
      Peón: "♟",
      Caballo: "♞",
      Alfil: "♝",
      Torre: "♜",
      Dama: "♛",
      Rey: "♚"
    };
    const simbolo = simbolos[nombre];
    if (!simbolo) {
      return "";
    }
    return PIEZAS_SAN[simbolo] || "";
  }
  /* =========================================================
     MOSTRAR JUGADA PENDIENTE
     ========================================================= */
  function renderizarPendiente() {
    const partida = getPartida();
    const preview = $("#notation-preview");
    if (!preview) return;
    const notation = construirJugadaPendiente(partida);
    preview.textContent = notation || "—";
    actualizarSeleccionPieza();
    actualizarSeleccionTablero();
    actualizarBotonCaptura();
  }
  /* =========================================================
     BOTÓN CAPTURA VISUAL
     ========================================================= */
  function actualizarBotonCaptura() {
    const partida = getPartida();
    const buttons = $$("#screen-score .action-row button");
    const button = buttons.find(
      (b) => b.getAttribute("aria-label") === "Captura"
    );
    if (!button) return;
    button.classList.toggle("capture-active", !!partida.captura);
  }
  /* =========================================================
     LIMPIAR SELECCIONES VISUALES
     ========================================================= */
  function limpiarSeleccionVisual() {
    $$("#screen-score .piece-row button").forEach((button) => {
      button.classList.remove("selected-piece");
    });
    $$("#screen-score .board-grid button").forEach((button) => {
      button.classList.remove("selected-square");
    });
    actualizarBotonCaptura();
  }
  /* =========================================================
     CLEAR
     ========================================================= */
  function limpiarJugadaPendiente() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    partida.piezaSeleccionada = null;
    partida.destinoSeleccionado = null;
    partida.captura = false;
    partida.jaque = false;
    partida.mate = false;
    partida.enroque = null;
    limpiarSeleccionVisual();
    renderizarPendiente();
  }
  /* =========================================================
     CARGAR JUGADA
     ========================================================= */
  function cargarJugada() {
    const partida = getPartida();
    if (!partida || partida.finalizada) {
      return;
    }
    const notation = construirJugadaPendiente(partida);
    /* Sin jugada completa, no se carga */
    if (!notation) {
      return;
    }
    const ahora = performance.now();
    const duracion = partida.inicioMovimiento
      ? ahora - partida.inicioMovimiento
      : 0;
    const numeroMovimiento = partida.movimientoActual;
    /* Buscar si ya existe la fila del movimiento */
    let movimiento = partida.movimientos.find(
      (m) => m.numero === numeroMovimiento
    );
    if (!movimiento) {
      movimiento = {
        numero: numeroMovimiento,
        blancas: "",
        negras: "",
        duracionBlancas: null,
        duracionNegras: null,
        revisar: false,
        queJuego: false
      };
      partida.movimientos.push(movimiento);
    }
    if (partida.jugadorActual === "blancas") {
      movimiento.blancas = notation;
      movimiento.duracionBlancas = duracion;
      movimiento.revisar = !!partida.revisar;
      movimiento.queJuego = !!partida.queJuego;
      partida.jugadorActual = "negras";
    } else {
      movimiento.negras = notation;
      movimiento.duracionNegras = duracion;
      movimiento.revisar = !!partida.revisar || !!movimiento.revisar;
      movimiento.queJuego = !!partida.queJuego || !!movimiento.queJuego;
      partida.jugadorActual = "blancas";
      partida.movimientoActual++;
    }
    /* Reiniciar cronómetro de la nueva jugada */
    partida.inicioMovimiento = ahora;
    /* La jugada pendiente desaparece */
    partida.piezaSeleccionada = null;
    partida.destinoSeleccionado = null;
    partida.captura = false;
    partida.jaque = false;
    partida.mate = false;
    partida.enroque = null;
    /* Las marcas vuelven a estar listas
       para el siguiente movimiento */
    partida.revisar = false;
    partida.queJuego = false;
    limpiarSeleccionVisual();
    renderizarPendiente();
    renderizarPlanilla();
    actualizarBotonesMarca();
    actualizarRelojPantalla();
  }
  /* =========================================================
     OBTENER / CREAR MOVIMIENTO ACTUAL PARA MARCAS
     ========================================================= */
  function obtenerMovimientoActualParaMarca(partida) {
    if (!partida) return null;
    let movimiento = partida.movimientos.find(
      (m) => m.numero === partida.movimientoActual
    );
    if (!movimiento) {
      movimiento = {
        numero: partida.movimientoActual,
        blancas: "",
        negras: "",
        duracionBlancas: null,
        duracionNegras: null,
        revisar: false,
        queJuego: false
      };
      partida.movimientos.push(movimiento);
    }
    return movimiento;
  }
  /* =========================================================
     REVISAR
     ========================================================= */
  function alternarRevisar() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    const movimiento = obtenerMovimientoActualParaMarca(partida);
    movimiento.revisar = !movimiento.revisar;
    partida.revisar = movimiento.revisar;
    actualizarBotonesMarca();
    renderizarPlanilla();
  }
  /* =========================================================
     ¿QUÉ JUEGO?
     ========================================================= */
  function alternarQueJuego() {
    const partida = getPartida();
    if (!partida || partida.finalizada) return;
    const movimiento = obtenerMovimientoActualParaMarca(partida);
    movimiento.queJuego = !movimiento.queJuego;
    partida.queJuego = movimiento.queJuego;
    actualizarBotonesMarca();
    renderizarPlanilla();
  }
  /* =========================================================
     ACTUALIZAR BOTONES DE MARCAS
     ========================================================= */
  function actualizarBotonesMarca() {
    const partida = getPartida();
    const movimiento = partida.movimientos.find(
      (m) => m.numero === partida.movimientoActual
    );
    const revisar = movimiento ? movimiento.revisar : false;
    const queJuego = movimiento ? movimiento.queJuego : false;
    const btnRevisar = $("#btn-score-revisar");
    const btnQueJuego = $("#btn-score-que-juego");
    if (btnRevisar) {
      btnRevisar.classList.toggle("active", revisar);
    }
    if (btnQueJuego) {
      btnQueJuego.classList.toggle("active", queJuego);
    }
  }
  /* =========================================================
     RENDERIZAR PLANILLA
     ---------------------------------------------------------
     Muestra solamente los últimos movimientos.
     La totalidad permanece en memoria.
     ========================================================= */
  function renderizarPlanilla() {
    const partida = getPartida();
    const tbody = $("#screen-score .notation-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const movimientos = partida.movimientos;
    const ultimos = movimientos.slice(-6);
    ultimos.forEach((movimiento) => {
      const tr = document.createElement("tr");
      const marcas = [];
      if (movimiento.revisar) {
        marcas.push("REV");
      }
      if (movimiento.queJuego) {
        marcas.push("J");
      }
      let blancas = movimiento.blancas || "";
      let negras = movimiento.negras || "";
      /* Duración junto a cada jugada */
      if (movimiento.duracionBlancas !== null) {
        blancas += ` <small>${formatearTiempo(movimiento.duracionBlancas)}</small>`;
      }
      if (movimiento.duracionNegras !== null) {
        negras += ` <small>${formatearTiempo(movimiento.duracionNegras)}</small>`;
      }
      if (marcas.length && movimiento.numero === partida.movimientoActual) {
        if (partida.jugadorActual === "blancas") {
          negras += ` [${marcas.join(",")}]`;
        } else {
          blancas += ` [${marcas.join(",")}]`;
        }
      }
      tr.innerHTML = `
        <td>${movimiento.numero}</td>
        <td>${blancas}</td>
        <td>${negras}</td>
      `;
      tbody.appendChild(tr);
    });
    /* Auto-scroll hacia el último movimiento */
    const container = $("#screen-score .notation-table-container");
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }
  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */
  function leerFormularioConfiguracion() {
    return {
      whiteName: $("#cfg-white-name")?.value.trim() || "",
      blackName: $("#cfg-black-name")?.value.trim() || "",
      whiteElo: $("#cfg-white-elo")?.value.trim() || "",
      blackElo: $("#cfg-black-elo")?.value.trim() || "",
      whiteNationality: $("#cfg-white-nationality")?.value.trim() || "",
      blackNationality: $("#cfg-black-nationality")?.value.trim() || "",
      gameTime: $("#cfg-game-time")?.value.trim() || "01:30:00",
      round: $("#cfg-round")?.value.trim() || "1",
      date: $("#cfg-date")?.value.trim() || "",
      place: $("#cfg-place")?.value.trim() || "",
      competitionType: $("#cfg-competition-type")?.value || "amistoso"
    };
  }
  /* =========================================================
     ESCRIBIR CONFIGURACIÓN EN FORMULARIO
     ========================================================= */
  function escribirFormularioConfiguracion(partida) {
    if (!partida) return;
    const d = partida.datos;
    const whiteName = $("#cfg-white-name");
    const blackName = $("#cfg-black-name");
    const whiteElo = $("#cfg-white-elo");
    const blackElo = $("#cfg-black-elo");
    const whiteNationality = $("#cfg-white-nationality");
    const blackNationality = $("#cfg-black-nationality");
    const gameTime = $("#cfg-game-time");
    const round = $("#cfg-round");
    const date = $("#cfg-date");
    const place = $("#cfg-place");
    const competitionType = $("#cfg-competition-type");
    if (whiteName) {
      whiteName.value = d.whiteName;
    }
    if (blackName) {
      blackName.value = d.blackName;
    }
    if (whiteElo) {
      whiteElo.value = d.whiteElo;
    }
    if (blackElo) {
      blackElo.value = d.blackElo;
    }
    if (whiteNationality) {
      whiteNationality.value = d.whiteNationality;
    }
    if (blackNationality) {
      blackNationality.value = d.blackNationality;
    }
    if (gameTime) {
      gameTime.value = d.gameTime || "01:30:00";
    }
    if (round) {
      round.value = d.round || "1";
    }
    if (date) {
      date.value = d.date;
    }
    if (place) {
      place.value = d.place;
    }
    if (competitionType) {
      competitionType.value = d.competitionType || "amistoso";
    }
  }
  /* =========================================================
     GUARDAR CONFIGURACIÓN ACTUAL
     ========================================================= */
  function guardarConfiguracionActual() {
    const partida = partidas[partidaConfiguracionActual];
    if (!partida) return;
    partida.datos = leerFormularioConfiguracion();
  }
  /* =========================================================
     CAMBIAR PARTIDA EN CONFIGURACIÓN
     ========================================================= */
  function cambiarPartidaConfiguracion(numero) {
    if (!partidas[numero]) return;
    /* Primero guardamos lo que estaba editando */
    guardarConfiguracionActual();
    partidaConfiguracionActual = numero;
    /* Marcador visual 1 / 2 / 3 / 4 */
    $$(".match-number").forEach((button, index) => {
      const numeroBoton = `P${index + 1}`;
      button.classList.toggle(
        "active",
        numeroBoton === partidaConfiguracionActual
      );
    });
    /* Cargar los datos de la partida seleccionada */
    escribirFormularioConfiguracion(partidas[numero]);
  }
  /* =========================================================
     GUARDAR CONFIGURACIÓN MIENTRAS SE ESCRIBE
     ========================================================= */
  function instalarListenersConfiguracion() {
    const campos = [
      "#cfg-white-name",
      "#cfg-black-name",
      "#cfg-white-elo",
      "#cfg-black-elo",
      "#cfg-white-nationality",
      "#cfg-black-nationality",
      "#cfg-game-time",
      "#cfg-round",
      "#cfg-date",
      "#cfg-place",
      "#cfg-competition-type"
    ];
    campos.forEach((selector) => {
      const campo = $(selector);
      if (!campo) return;
      campo.addEventListener("input", guardarConfiguracionActual);
      campo.addEventListener("change", guardarConfiguracionActual);
    });
  }
  /* =========================================================
     INICIALIZAR CONFIGURACIÓN
     ========================================================= */
  function inicializarConfiguracion() {
    /* Partida 1 inicialmente seleccionada */
    partidaConfiguracionActual = "P1";
    escribirFormularioConfiguracion(partidas.P1);
    /* 1 / 2 / 3 / 4 */
    $$(".match-number").forEach((button, index) => {
      button.addEventListener("click", () => {
        cambiarPartidaConfiguracion(`P${index + 1}`);
      });
    });
    instalarListenersConfiguracion();
    /* Guardar al abrir el anotador */
    const btnStart = $("#btn-start-score");
    if (btnStart) {
      btnStart.addEventListener("click", () => {
        guardarConfiguracionActual();
        /* La partida que se configuró
             es la que se abre */
        partidaActual = partidaConfiguracionActual;
        actualizarSelectorPartida();
      });
    }
  }
  /* =========================================================
   DESCARGAR PARTIDA PARCIAL
   ---------------------------------------------------------
   Descarga todo lo registrado hasta este momento.
   NO finaliza la partida.
   NO detiene el reloj.
   ========================================================= */
  function descargarPartidaParcial() {
    const partida = getPartida();
    if (!partida) return;
    const d = partida.datos;
    const lineas = [];
    lineas.push("==========================================");
    lineas.push("PARTIDA DE AJEDREZ — DESCARGA PARCIAL");
    lineas.push("==========================================");
    lineas.push("");
    lineas.push(`Partida: ${partida.numero}`);
    lineas.push(`Blancas: ${d.whiteName || "-"}`);
    lineas.push(`ELO Blancas: ${d.whiteElo || "-"}`);
    lineas.push(`Nacionalidad Blancas: ${d.whiteNationality || "-"}`);
    lineas.push("");
    lineas.push(`Negras: ${d.blackName || "-"}`);
    lineas.push(`ELO Negras: ${d.blackElo || "-"}`);
    lineas.push(`Nacionalidad Negras: ${d.blackNationality || "-"}`);
    lineas.push("");
    lineas.push(`Tiempo configurado: ${d.gameTime || "-"}`);
    lineas.push(`Ronda: ${d.round || "-"}`);
    lineas.push(`Fecha: ${d.date || "-"}`);
    lineas.push(`Lugar: ${d.place || "-"}`);
    lineas.push(`Tipo de competición: ${d.competitionType || "-"}`);
    lineas.push("");
    lineas.push(
      `Tiempo transcurrido: ${formatearTiempo(obtenerTiempoPartida(partida))}`
    );
    lineas.push("");
    lineas.push("------------------------------------------");
    lineas.push("PLANILLA");
    lineas.push("------------------------------------------");
    lineas.push("");
    partida.movimientos.forEach((movimiento) => {
      const marcas = [];
      if (movimiento.revisar) {
        marcas.push("REVISAR");
      }
      if (movimiento.queJuego) {
        marcas.push("QUE JUEGO");
      }
      const marcaTexto = marcas.length ? ` [${marcas.join(" / ")}]` : "";
      const duracionBlancas =
        movimiento.duracionBlancas !== null
          ? formatearTiempo(movimiento.duracionBlancas)
          : "";
      const duracionNegras =
        movimiento.duracionNegras !== null
          ? formatearTiempo(movimiento.duracionNegras)
          : "";
      lineas.push(
        `${movimiento.numero}. ` +
          `${movimiento.blancas || "..."} ` +
          `(${duracionBlancas})    ` +
          `${movimiento.negras || "..."} ` +
          `(${duracionNegras})` +
          marcaTexto
      );
    });
    lineas.push("");
    lineas.push("==========================================");
    lineas.push("FIN DE DESCARGA PARCIAL");
    lineas.push("==========================================");
    const contenido = lineas.join("\r\n");
    const blob = new Blob([contenido], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    const fecha = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    enlace.href = url;
    enlace.download = `ajedrez_${partida.numero}_parcial_${fecha}.txt`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }
  /* =========================================================
     EXPORTAR PARTIDA
     ========================================================= */
  function finalizarPartida() {
    const partida = getPartida();
    if (!partida) return;
    if (partida.finalizada) {
      return;
    }
    /* Detener únicamente esta partida */
    detenerPartida(partida);
    partida.finalizada = true;
    /* =====================================================
       CONSTRUIR TXT
       ===================================================== */
    const d = partida.datos;
    const lineas = [];
    lineas.push("==========================================");
    lineas.push("PARTIDA DE AJEDREZ");
    lineas.push("==========================================");
    lineas.push("");
    lineas.push(`Partida: ${partida.numero}`);
    lineas.push(`Blancas: ${d.whiteName || "-"}`);
    lineas.push(`ELO Blancas: ${d.whiteElo || "-"}`);
    lineas.push(`Nacionalidad Blancas: ${d.whiteNationality || "-"}`);
    lineas.push("");
    lineas.push(`Negras: ${d.blackName || "-"}`);
    lineas.push(`ELO Negras: ${d.blackElo || "-"}`);
    lineas.push(`Nacionalidad Negras: ${d.blackNationality || "-"}`);
    lineas.push("");
    lineas.push(`Tiempo configurado: ${d.gameTime || "-"}`);
    lineas.push(`Ronda: ${d.round || "-"}`);
    lineas.push(`Fecha: ${d.date || "-"}`);
    lineas.push(`Lugar: ${d.place || "-"}`);
    lineas.push(`Tipo de competición: ${d.competitionType || "-"}`);
    lineas.push("");
    lineas.push(
      `Tiempo total registrado: ${formatearTiempo(
        partida.tiempoAcumuladoPartida
      )}`
    );
    lineas.push("");
    lineas.push("------------------------------------------");
    lineas.push("PLANILLA");
    lineas.push("------------------------------------------");
    lineas.push("");
    partida.movimientos.forEach((movimiento) => {
      const marcas = [];
      if (movimiento.revisar) {
        marcas.push("REVISAR");
      }
      if (movimiento.queJuego) {
        marcas.push("QUE JUEGO");
      }
      const marcaTexto = marcas.length ? ` [${marcas.join(" / ")}]` : "";
      lineas.push(
        `${movimiento.numero}. ` +
          `${movimiento.blancas || "..."} ` +
          `${movimiento.negras || "..."}`
      );
      if (movimiento.duracionBlancas !== null) {
        lineas.push(
          `   Duración Blancas: ${formatearTiempo(movimiento.duracionBlancas)}`
        );
      }
      if (movimiento.duracionNegras !== null) {
        lineas.push(
          `   Duración Negras: ${formatearTiempo(movimiento.duracionNegras)}`
        );
      }
      if (marcaTexto) {
        lineas.push(`   Marcas:${marcaTexto}`);
      }
      lineas.push("");
    });
    lineas.push("==========================================");
    lineas.push("FIN DE LA PARTIDA");
    lineas.push("==========================================");
    const contenido = lineas.join("\r\n");
    const blob = new Blob([contenido], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    const fecha = new Date().toISOString().slice(0, 10);
    enlace.href = url;
    enlace.download = `ajedrez_${partida.numero}_${fecha}.txt`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }
  /* =========================================================
     EVENTOS DEL ANOTADOR
     ========================================================= */
  function instalarEventosAnotador() {
    /* ---------- P1 / P2 / P3 / P4 ---------- */
    $$(".score-game").forEach((button, index) => {
      button.addEventListener("click", () => {
        cambiarPartida(`P${index + 1}`);
      });
    });
    /* ---------- PIEZAS ---------- */
    $$("#screen-score .piece-row button").forEach((button) => {
      button.addEventListener("click", () => {
        seleccionarPieza(button);
      });
    });
    /* ---------- TABLERO ---------- */
    $$("#screen-score .board-grid button").forEach((button) => {
      button.addEventListener("click", () => {
        seleccionarDestino(button);
      });
    });
    /* ---------- ACCIONES ---------- */
    const actionButtons = $$("#screen-score .action-row button");
    actionButtons.forEach((button) => {
      const label = button.getAttribute("aria-label");
      button.addEventListener("click", () => {
        switch (label) {
          case "Captura":
            alternarCaptura();
            break;
          case "Jaque":
            alternarJaque();
            break;
          case "Mate":
            alternarMate();
            break;
          case "Enroque corto":
            seleccionarEnroqueCorto();
            break;
          case "Enroque largo":
            seleccionarEnroqueLargo();
            break;
        }
      });
    });
    /* ---------- CLEAR ---------- */
    const btnClear = $("#btn-score-clear");
    if (btnClear) {
      btnClear.addEventListener("click", limpiarJugadaPendiente);
    }
    /* ---------- CARGAR ---------- */
    const btnCargar = $("#btn-score-cargar");
    if (btnCargar) {
      btnCargar.addEventListener("click", cargarJugada);
    }
    /* ---------- REVISAR ---------- */
    const btnRevisar = $("#btn-score-revisar");
    if (btnRevisar) {
      btnRevisar.addEventListener("click", alternarRevisar);
    }
    /* ---------- ¿QUÉ JUEGO? ---------- */
    const btnQueJuego = $("#btn-score-que-juego");
    if (btnQueJuego) {
      btnQueJuego.addEventListener("click", alternarQueJuego);
    }
    /* ---------- DESCARGA PARCIAL ---------- */
    const btnDescParcial = $("#btn-score-desc-parcial");
    if (btnDescParcial) {
      btnDescParcial.addEventListener("click", descargarPartidaParcial);
    }
    /* ---------- FINALIZAR ---------- */
    const btnFinalizar = $("#btn-score-finalizar");
    if (btnFinalizar) {
      btnFinalizar.addEventListener("click", finalizarPartida);
    }
  }
  /* =========================================================
     INICIALIZACIÓN
     ========================================================= */
  function inicializar() {
    inicializarConfiguracion();
    instalarEventosAnotador();
    actualizarSelectorPartida();
    renderizarPlanilla();
    renderizarPendiente();
    actualizarBotonesMarca();
    actualizarRelojPantalla();
  }
  /* =========================================================
     DOM READY
     ========================================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
