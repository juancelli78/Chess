/* ============================================================
   ANOTADOR DE AJEDREZ
   Versión corregida y comentada

   PARTE 1 DE 2

   Objetivos:
   - Mantener las cuatro partidas: P1, P2, P3 y P4.
   - Permitir seleccionar piezas, casillas y acciones.
   - Mostrar una previsualización en tiempo real.
   - Mantener las marcas REVISAR y ¿QUÉ JUEGO? asociadas
     al movimiento que se está preparando.
   - No guardar movimientos hasta presionar CARGAR.

   Importante:
   Este anotador registra la notación introducida manualmente.
   No valida todavía si el movimiento es legal en el tablero.
   ============================================================ */

(() => {
  ("use strict");

  /* ========================================================
       1. CONFIGURACIÓN GENERAL
       ======================================================== */

  // Notación española de las piezas.
  // El peón no lleva letra en la notación.
  const PIEZAS_SAN = {
    Peón: "",
    Caballo: "C",
    Alfil: "A",
    Torre: "T",
    Dama: "D",
    Rey: "R"
  };

  // Identificadores de las cuatro partidas.
  const IDS_PARTIDAS = ["P1", "P2", "P3", "P4"];

  // Partida seleccionada inicialmente.
  let partidaActual = "P1";

  // Evita instalar dos veces los mismos eventos.
  let eventosInstalados = false;

  /* ========================================================
   2. CREACIÓN DEL ESTADO DE UNA PARTIDA
   ======================================================== */

  function crearPartida() {
    return {
      // Estado general de la partida.
      running: false,
      finalizada: false,

      // Datos del reloj.
      inicioPartida: null,
      inicioMovimiento: null,
      tiempoAcumuladoPartida: 0,
      tiempoAcumuladoMovimiento: 0,
      timerId: null,

      // Turno actual.
      jugadorActual: "blancas",
      movimientoActual: 1,

      // Selecciones temporales de la jugada.
      piezaSeleccionada: null,
      destinoSeleccionado: null,

      // Acciones temporales.
      captura: false,
      jaque: false,
      mate: false,
      enroque: null,

      // Marcas temporales del movimiento pendiente.
      revisar: false,
      queJuego: false,

      // Movimientos efectivamente cargados.
      movimientos: [],

      // Datos complementarios.
      jugadores: {
        blancas: "",
        negras: ""
      },

      datosPartida: {}
    };
  }

  /* ========================================================
       3. INICIALIZACIÓN DE LAS CUATRO PARTIDAS
       ======================================================== */

  const partidas = {};

  IDS_PARTIDAS.forEach((id) => {
    partidas[id] = crearPartida();
  });

  /* ========================================================
       4. ACCESO A LA PARTIDA ACTUAL
       ======================================================== */

  function obtenerPartidaActual() {
    return partidas[partidaActual];
  }

  /* ========================================================
       5. FUNCIONES AUXILIARES DEL DOM
       ======================================================== */

  // Busca un elemento por su identificador.
  function obtenerElemento(id) {
    return document.getElementById(id);
  }

  // Devuelve todos los elementos que coinciden con un selector.
  function obtenerElementos(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  /* ========================================================
   6. RELOJ DE LA PARTIDA
   ======================================================== */

  // Convierte segundos a HH:MM:SS.
  function formatearTiempo(segundos) {
    const total = Math.max(0, Math.floor(segundos || 0));

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundosRestantes = total % 60;

    return (
      String(horas).padStart(2, "0") +
      ":" +
      String(minutos).padStart(2, "0") +
      ":" +
      String(segundosRestantes).padStart(2, "0")
    );
  }

  // Convierte segundos a MM:SS.
  function formatearTiempoMovimiento(segundos) {
    const total = Math.max(0, Math.floor(segundos || 0));

    const minutos = Math.floor(total / 60);
    const segundosRestantes = total % 60;

    return (
      String(minutos).padStart(2, "0") +
      ":" +
      String(segundosRestantes).padStart(2, "0")
    );
  }

  // Tiempo total acumulado de la partida.
  function obtenerTiempoTranscurrido(partida) {
    let tiempo = partida.tiempoAcumuladoPartida || 0;

    if (partida.running && partida.inicioPartida !== null) {
      tiempo += (Date.now() - partida.inicioPartida) / 1000;
    }

    return tiempo;
  }

  // Tiempo acumulado del movimiento actual.
  function obtenerTiempoMovimiento(partida) {
    let tiempo = partida.tiempoAcumuladoMovimiento || 0;

    if (partida.running && partida.inicioMovimiento !== null) {
      tiempo += (Date.now() - partida.inicioMovimiento) / 1000;
    }

    return tiempo;
  }

  // Actualiza los dos relojes visibles.
  function actualizarRelojPantalla() {
    const partida = obtenerPartidaActual();

    const relojTotal = document.querySelector(
      "#screen-score #clock-total-value"
    );

    const relojJugada = document.querySelector(
      "#screen-score #clock-move-value"
    );

    if (!relojTotal || !relojJugada) {
      return;
    }

    relojTotal.textContent = formatearTiempo(
      obtenerTiempoTranscurrido(partida)
    );

    relojJugada.textContent = formatearTiempoMovimiento(
      obtenerTiempoMovimiento(partida)
    );
  }

  // Inicia el reloj de la partida actual.
  function iniciarPartida() {
    const partida = obtenerPartidaActual();

    if (partida.running || partida.finalizada) {
      return;
    }

    partida.running = true;
    partida.inicioPartida = Date.now();

    if (partida.inicioMovimiento === null) {
      partida.inicioMovimiento = Date.now();
    }

    if (partida.timerId !== null) {
      clearInterval(partida.timerId);
    }

    partida.timerId = setInterval(actualizarRelojPantalla, 1000);

    actualizarRelojPantalla();
  }

  // Detiene los relojes y conserva sus tiempos.
  function detenerPartida() {
    const partida = obtenerPartidaActual();

    if (!partida.running) {
      return;
    }

    partida.tiempoAcumuladoPartida = obtenerTiempoTranscurrido(partida);

    partida.tiempoAcumuladoMovimiento = obtenerTiempoMovimiento(partida);

    partida.running = false;
    partida.inicioPartida = null;
    partida.inicioMovimiento = null;

    if (partida.timerId !== null) {
      clearInterval(partida.timerId);
      partida.timerId = null;
    }

    actualizarRelojPantalla();
  }

  /* ========================================================
       7. CAMBIO ENTRE PARTIDAS P1, P2, P3 Y P4
       ======================================================== */

  function cambiarPartida(nuevaPartida) {
    console.log("1. Partida solicitada:", nuevaPartida);
    console.log("2. Partida actual:", partidaActual);
    console.log("3. IDs disponibles:", IDS_PARTIDAS);

    if (!IDS_PARTIDAS.includes(nuevaPartida)) {
      console.error("ERROR: partida no reconocida");
      return;
    }

    // Cambiamos la partida visible sin detener los demás relojes.
    partidaActual = nuevaPartida;

    console.log("4. Partida activa:", partidaActual);

    obtenerElementos(".score-game").forEach((boton) => {
      console.log("Botón:", boton.dataset.game);

      boton.classList.toggle("active", boton.dataset.game === partidaActual);
    });

    actualizarRelojPantalla();
    renderizarPlanilla();
    renderizarPendiente();
    actualizarBotonesMarca();
    actualizarTurnoUI();

    console.log("5. Iniciando cronómetro");

    iniciarPartida();

    console.log("6. Estado de partida:", obtenerPartidaActual());
  }

  /* ========================================================
       8. INDICACIÓN DEL TURNO ACTUAL
       ======================================================== */

  function actualizarTurnoUI() {
    const partida = obtenerPartidaActual();

    /*
           El HTML actual no contiene un elemento
           #turn-indicator ni #score-turn-indicator.

           Por eso esta función comprueba si existe alguno
           antes de intentar modificarlo.
        */

    const indicador =
      obtenerElemento("turn-indicator") ||
      obtenerElemento("score-turn-indicator");

    if (!indicador) return;

    indicador.textContent =
      partida.jugadorActual === "blancas" ? "JUEGAN BLANCAS" : "JUEGAN NEGRAS";
  }

  /* ========================================================
       9. SELECCIÓN DE PIEZAS
       ======================================================== */

  function seleccionarPieza(boton) {
    const partida = obtenerPartidaActual();

    if (!boton) return;

    const nombrePieza = boton.getAttribute("aria-label");

    if (!Object.prototype.hasOwnProperty.call(PIEZAS_SAN, nombrePieza)) {
      return;
    }

    // Si se vuelve a pulsar la misma pieza, se deselecciona.
    if (partida.piezaSeleccionada === nombrePieza) {
      partida.piezaSeleccionada = null;
    } else {
      partida.piezaSeleccionada = nombrePieza;
    }

    actualizarSeleccionPieza();
    renderizarPendiente();
  }

  // Refleja visualmente qué pieza está seleccionada.
  function actualizarSeleccionPieza() {
    const partida = obtenerPartidaActual();

    obtenerElementos(".piece-row button").forEach((boton) => {
      const nombre = boton.getAttribute("aria-label");

      boton.classList.toggle(
        "selected-piece",
        nombre === partida.piezaSeleccionada
      );
    });
  }

  /* ========================================================
       10. SELECCIÓN DE CASILLAS DEL TABLERO
       ======================================================== */

  function seleccionarDestino(boton) {
    const partida = obtenerPartidaActual();

    if (!boton) return;

    const casilla = boton.dataset.square;

    // Control básico del formato de la casilla.
    if (!/^[a-h][1-8]$/.test(casilla || "")) {
      return;
    }

    // Si se pulsa nuevamente la misma casilla, se deselecciona.
    if (partida.destinoSeleccionado === casilla) {
      partida.destinoSeleccionado = null;
    } else {
      partida.destinoSeleccionado = casilla;
    }

    actualizarSeleccionTablero();
    renderizarPendiente();
  }

  // Resalta la casilla seleccionada.
  function actualizarSeleccionTablero() {
    const partida = obtenerPartidaActual();

    obtenerElementos(".board-grid button").forEach((boton) => {
      const casilla = boton.dataset.square;

      boton.classList.toggle(
        "selected-square",
        casilla === partida.destinoSeleccionado
      );
    });
  }

  /* ========================================================
       11. ACCIONES DE LA JUGADA
       ======================================================== */

  // Alterna la marca de captura.
  function alternarCaptura() {
    const partida = obtenerPartidaActual();

    partida.captura = !partida.captura;

    actualizarBotonesAccion();
    renderizarPendiente();
  }

  // Alterna la marca de jaque.
  function alternarJaque() {
    const partida = obtenerPartidaActual();

    partida.jaque = !partida.jaque;

    // Si se activa jaque, se desactiva mate.
    if (partida.jaque) {
      partida.mate = false;
    }

    actualizarBotonesAccion();
    renderizarPendiente();
  }

  // Alterna la marca de mate.
  function alternarMate() {
    const partida = obtenerPartidaActual();

    partida.mate = !partida.mate;

    // Mate y jaque no se muestran simultáneamente.
    if (partida.mate) {
      partida.jaque = false;
    }

    actualizarBotonesAccion();
    renderizarPendiente();
  }

  // Selecciona enroque corto.
  function seleccionarEnroqueCorto() {
    const partida = obtenerPartidaActual();

    partida.enroque = partida.enroque === "corto" ? null : "corto";

    // El enroque no utiliza pieza ni casilla de destino.
    if (partida.enroque) {
      partida.piezaSeleccionada = null;
      partida.destinoSeleccionado = null;
      partida.captura = false;
    }

    actualizarSeleccionPieza();
    actualizarSeleccionTablero();
    actualizarBotonesAccion();
    renderizarPendiente();
  }

  // Selecciona enroque largo.
  function seleccionarEnroqueLargo() {
    const partida = obtenerPartidaActual();

    partida.enroque = partida.enroque === "largo" ? null : "largo";

    if (partida.enroque) {
      partida.piezaSeleccionada = null;
      partida.destinoSeleccionado = null;
      partida.captura = false;
    }

    actualizarSeleccionPieza();
    actualizarSeleccionTablero();
    actualizarBotonesAccion();
    renderizarPendiente();
  }

  /* ========================================================
       12. CONSTRUCCIÓN DE LA NOTACIÓN DE LA JUGADA
       ======================================================== */

  function construirJugadaPendiente() {
    const partida = obtenerPartidaActual();

    // Caso 1: enroque corto o largo.
    if (partida.enroque === "corto") {
      return "O-O";
    }

    if (partida.enroque === "largo") {
      return "O-O-O";
    }

    // Caso 2: para construir una jugada normal
    // necesitamos una pieza y una casilla de destino.
    if (!partida.piezaSeleccionada || !partida.destinoSeleccionado) {
      return "";
    }

    const letraPieza = PIEZAS_SAN[partida.piezaSeleccionada];

    let jugada = letraPieza;

    // Captura.
    if (partida.captura) {
      // En notación española, la captura de peón
      // requiere identificar la columna de origen.
      // Como el anotador no registra origen, se conserva
      // una notación simplificada para el peón.
      jugada += "x";
    }

    // Casilla de destino.
    jugada += partida.destinoSeleccionado;

    // Jaque o mate.
    if (partida.mate) {
      jugada += "#";
    } else if (partida.jaque) {
      jugada += "+";
    }

    return jugada;
  }

  /* ========================================================
       13. CONSTRUCCIÓN DE LA PREVISUALIZACIÓN COMPLETA
       ======================================================== */

  function construirPreviewCompleto() {
    const partida = obtenerPartidaActual();

    const jugada = construirJugadaPendiente();

    // La notación de la jugada se mantiene separada
    // de las marcas de análisis.
    const elementos = [];

    if (jugada) {
      elementos.push(jugada);
    }

    if (partida.revisar) {
      elementos.push("REVISAR");
    }

    if (partida.queJuego) {
      elementos.push("¿QUÉ JUEGO?");
    }

    // Si no hay ninguna selección, la vista previa queda vacía.
    return elementos.join("  ·  ");
  }

  /* ========================================================
       14. ACTUALIZACIÓN DE LA PREVISUALIZACIÓN
       ======================================================== */

  function renderizarPendiente() {
    const preview = obtenerElemento("notation-preview");

    if (!preview) return;

    const texto = construirPreviewCompleto();

    // Se utiliza textContent para evitar interpretar
    // el contenido como HTML.
    preview.textContent = texto;

    // Clase útil para diferenciar una vista previa vacía.
    preview.classList.toggle("preview-empty", texto.length === 0);
  }

  /* ========================================================
       15. ACTUALIZACIÓN VISUAL DE LAS ACCIONES
       ======================================================== */

  function actualizarBotonesAccion() {
    const partida = obtenerPartidaActual();

    const botones = obtenerElementos(".action-row button");

    botones.forEach((boton) => {
      const accion = boton.getAttribute("aria-label");

      boton.classList.remove(
        "capture-active",
        "check-active",
        "mate-active",
        "castle-active"
      );

      if (accion === "Captura") {
        boton.classList.toggle("capture-active", partida.captura);
      }

      if (accion === "Jaque") {
        boton.classList.toggle("check-active", partida.jaque);
      }

      if (accion === "Mate") {
        boton.classList.toggle("mate-active", partida.mate);
      }

      if (accion === "Enroque corto") {
        boton.classList.toggle("castle-active", partida.enroque === "corto");
      }

      if (accion === "Enroque largo") {
        boton.classList.toggle("castle-active", partida.enroque === "largo");
      }
    });
  }

  /* ========================================================
       16. ACTUALIZACIÓN VISUAL DE LAS MARCAS
       ======================================================== */

  function actualizarBotonesMarca() {
    const partida = obtenerPartidaActual();

    const botonRevisar = obtenerElemento("btn-score-revisar");

    const botonQueJuego = obtenerElemento("btn-score-que-juego");

    if (botonRevisar) {
      botonRevisar.classList.toggle("annotation-active", partida.revisar);
    }

    if (botonQueJuego) {
      botonQueJuego.classList.toggle("annotation-active", partida.queJuego);
    }
  }

  /* ========================================================
       17. MARCAS TEMPORALES: REVISAR Y ¿QUÉ JUEGO?
       ======================================================== */

  // Estas marcas pertenecen al movimiento pendiente.
  // No crean un movimiento vacío en la planilla.
  function alternarRevisar() {
    const partida = obtenerPartidaActual();

    partida.revisar = !partida.revisar;

    actualizarBotonesMarca();
    renderizarPendiente();
  }

  function alternarQueJuego() {
    const partida = obtenerPartidaActual();

    partida.queJuego = !partida.queJuego;

    actualizarBotonesMarca();
    renderizarPendiente();
  }

  /* ========================================================
       18. LIMPIEZA VISUAL DE LAS SELECCIONES
       ======================================================== */

  function limpiarSeleccionVisual() {
    obtenerElementos(
      ".piece-row button, .board-grid button, .action-row button"
    ).forEach((boton) => {
      boton.classList.remove(
        "selected-piece",
        "selected-square",
        "capture-active",
        "check-active",
        "mate-active",
        "castle-active"
      );
    });

    const botonRevisar = obtenerElemento("btn-score-revisar");

    const botonQueJuego = obtenerElemento("btn-score-que-juego");

    if (botonRevisar) {
      botonRevisar.classList.remove("annotation-active");
    }

    if (botonQueJuego) {
      botonQueJuego.classList.remove("annotation-active");
    }
  }
  /* ========================================================
       19. LIMPIEZA DEL ESTADO TEMPORAL
       ======================================================== */

  // Limpia todas las selecciones y acciones de la jugada pendiente.
  // No elimina los movimientos que ya fueron cargados.
  function limpiarJugadaPendiente() {
    const partida = obtenerPartidaActual();

    partida.piezaSeleccionada = null;
    partida.destinoSeleccionado = null;

    partida.captura = false;
    partida.jaque = false;
    partida.mate = false;
    partida.enroque = null;

    partida.revisar = false;
    partida.queJuego = false;

    limpiarSeleccionVisual();

    actualizarSeleccionPieza();
    actualizarSeleccionTablero();
    actualizarBotonesAccion();
    actualizarBotonesMarca();

    renderizarPendiente();
  }

  /* ========================================================
       20. CONSTRUCCIÓN DEL OBJETO MOVIMIENTO
       ======================================================== */

  function crearObjetoMovimiento(numero) {
    return {
      numero: numero,

      blancas: "",
      negras: "",

      tiempoBlancas: null,
      tiempoNegras: null,

      revisarBlancas: false,
      revisarNegras: false,

      queJuegoBlancas: false,
      queJuegoNegras: false
    };
  }

  /* ========================================================
       21. OBTENER O CREAR EL MOVIMIENTO ACTUAL
       ======================================================== */

  function obtenerMovimientoActual(partida) {
    const numero = partida.movimientoActual;

    let movimiento = partida.movimientos.find((item) => item.numero === numero);

    if (!movimiento) {
      movimiento = crearObjetoMovimiento(numero);
      partida.movimientos.push(movimiento);
    }

    return movimiento;
  }

  /* ========================================================
       22. CARGAR LA JUGADA
       ======================================================== */

  function cargarJugada() {
    const partida = obtenerPartidaActual();

    // Construimos la notación sin las marcas auxiliares.
    const notacion = construirJugadaPendiente();

    // No se permite cargar una jugada vacía.
    if (!notacion) {
      alert(
        "Primero seleccioná una pieza y una casilla, " +
          "o elegí un tipo de enroque."
      );
      return;
    }

    // Comprobamos que la partida no esté finalizada.
    if (partida.finalizada) {
      alert("Esta partida ya fue finalizada.");
      return;
    }

    // Obtenemos el movimiento correspondiente.
    const movimiento = obtenerMovimientoActual(partida);

    // Calculamos el tiempo empleado en esta jugada.
    const tiempoEmpleado = obtenerTiempoMovimiento(partida);

    // Guardamos el movimiento en el lado correspondiente.
    if (partida.jugadorActual === "blancas") {
      movimiento.blancas = notacion;

      movimiento.revisarBlancas = partida.revisar;
      movimiento.queJuegoBlancas = partida.queJuego;

      // Guardamos el tiempo de las blancas.
      movimiento.tiempoBlancas = tiempoEmpleado;

      // Después de las blancas juegan las negras.
      partida.jugadorActual = "negras";
    } else {
      movimiento.negras = notacion;

      movimiento.revisarNegras = partida.revisar;
      movimiento.queJuegoNegras = partida.queJuego;

      // Guardamos el tiempo de las negras.
      movimiento.tiempoNegras = tiempoEmpleado;

      // Después de las negras comienza el siguiente número.
      partida.jugadorActual = "blancas";
      partida.movimientoActual++;
    }

    // Reiniciamos el tiempo acumulado del movimiento.
    partida.tiempoAcumuladoMovimiento = 0;

    // Iniciamos el cronómetro del siguiente turno.
    partida.inicioMovimiento = partida.running ? Date.now() : null;

    // Limpiamos la selección temporal.
    limpiarJugadaPendiente();

    // Actualizamos la interfaz.
    actualizarTurnoUI();
    renderizarPlanilla();
    actualizarRelojPantalla();
  }

  function registrarNoLoVi() {
    const partida = obtenerPartidaActual();

    // No se puede registrar si la partida terminó.
    if (partida.finalizada) {
      alert("Esta partida ya fue finalizada.");
      return;
    }

    // Obtenemos el movimiento actual.
    const movimiento = obtenerMovimientoActual(partida);

    // Registramos el tiempo empleado.
    const tiempoEmpleado = obtenerTiempoMovimiento(partida);

    // Registramos la anotación en el lado correspondiente.
    if (partida.jugadorActual === "blancas") {
      movimiento.blancas = "NO LO VI";
      movimiento.tiempoBlancas = tiempoEmpleado;

      // Ahora corresponde jugar a negras.
      partida.jugadorActual = "negras";
    } else {
      movimiento.negras = "NO LO VI";
      movimiento.tiempoNegras = tiempoEmpleado;

      // Comienza el siguiente movimiento.
      partida.jugadorActual = "blancas";
      partida.movimientoActual++;
    }

    // Reiniciamos el tiempo del siguiente turno.
    partida.tiempoAcumuladoMovimiento = 0;

    partida.inicioMovimiento = partida.running ? Date.now() : null;

    // Limpiamos cualquier selección pendiente.
    limpiarJugadaPendiente();

    // Actualizamos la interfaz.
    actualizarTurnoUI();
    renderizarPlanilla();
    actualizarRelojPantalla();
  }

  function borrarUltimaJugada() {
    const partida = obtenerPartidaActual();

    // No se permite modificar una partida finalizada.
    if (partida.finalizada) {
      alert("Esta partida ya fue finalizada.");
      return;
    }

    let movimiento;
    let color;
    let tiempoRecuperado;

    // Si corresponde jugar a negras, la última jugada
    // registrada fue la de blancas.
    if (partida.jugadorActual === "negras") {
      movimiento = partida.movimientos.find(
        (item) => item.numero === partida.movimientoActual
      );

      color = "blancas";
    } else {
      // Si corresponde jugar a blancas, buscamos
      // la última jugada de negras.
      movimiento = partida.movimientos.find(
        (item) => item.numero === partida.movimientoActual - 1
      );

      color = "negras";
    }

    // Comprobamos que exista una jugada para borrar.
    if (!movimiento || !movimiento[color]) {
      alert("No hay más jugadas para borrar.");
      return;
    }

    // Guardamos el tiempo de la jugada que eliminamos.
    tiempoRecuperado =
      movimiento[color === "blancas" ? "tiempoBlancas" : "tiempoNegras"];

    // Eliminamos la notación y sus anotaciones.
    movimiento[color] = "";

    if (color === "blancas") {
      movimiento.tiempoBlancas = null;
      movimiento.revisarBlancas = false;
      movimiento.queJuegoBlancas = false;

      // Volvemos al turno de blancas.
      partida.jugadorActual = "blancas";
    } else {
      movimiento.tiempoNegras = null;
      movimiento.revisarNegras = false;
      movimiento.queJuegoNegras = false;

      // Volvemos al turno de negras.
      partida.jugadorActual = "negras";
    }

    // Restauramos el tiempo del turno eliminado.
    partida.tiempoAcumuladoMovimiento =
      typeof tiempoRecuperado === "number" ? tiempoRecuperado : 0;

    partida.inicioMovimiento = partida.running ? Date.now() : null;

    // Restauramos el número del movimiento.
    partida.movimientoActual = movimiento.numero;

    // Si la fila quedó vacía, la eliminamos.
    if (!movimiento.blancas && !movimiento.negras) {
      partida.movimientos = partida.movimientos.filter(
        (item) => item !== movimiento
      );
    }

    // Limpiamos cualquier selección pendiente.
    limpiarJugadaPendiente();

    // Actualizamos toda la interfaz.
    actualizarTurnoUI();
    renderizarPlanilla();
    actualizarRelojPantalla();

    console.log(
      "Última jugada eliminada:",
      color,
      "Movimiento:",
      movimiento.numero
    );
  }
  /* ========================================================
       23. BOTÓN CLEAR
       ======================================================== */

  // CLEAR limpia únicamente lo que todavía no fue cargado.
  // No borra los movimientos anteriores de la planilla.
  function limpiarSeleccionActual() {
    limpiarJugadaPendiente();
  }

  /* ========================================================
       24. ETIQUETAS DE LAS MARCAS
       ======================================================== */

  function obtenerEtiquetasMarcas(movimiento, color) {
    const etiquetas = [];

    if (color === "blancas") {
      if (movimiento.revisarBlancas) {
        etiquetas.push("REVISAR");
      }

      if (movimiento.queJuegoBlancas) {
        etiquetas.push("¿QUÉ JUEGO?");
      }
    } else {
      if (movimiento.revisarNegras) {
        etiquetas.push("REVISAR");
      }

      if (movimiento.queJuegoNegras) {
        etiquetas.push("¿QUÉ JUEGO?");
      }
    }

    return etiquetas;
  }

  /* ========================================================
       25. RENDERIZADO DE LA PLANILLA
       ======================================================== */

  function renderizarPlanilla() {
    const partida = obtenerPartidaActual();

    const tbody = document.querySelector("#screen-score .notation-table tbody");

    if (!tbody) return;

    // Limpiamos las filas anteriores.
    tbody.textContent = "";

    // Ordenamos los movimientos por número.
    const movimientosOrdenados = [...partida.movimientos].sort(
      (a, b) => a.numero - b.numero
    );

    movimientosOrdenados.forEach((movimiento) => {
      // Creamos la fila.
      const fila = document.createElement("tr");

      // Número de movimiento.
      const celdaNumero = document.createElement("td");
      celdaNumero.textContent = movimiento.numero;

      // Notación de blancas.
      const celdaBlancas = document.createElement("td");

      celdaBlancas.textContent = movimiento.blancas || "";

      if (movimiento.tiempoBlancas !== undefined) {
        celdaBlancas.textContent +=
          " (" + formatearTiempoMovimiento(movimiento.tiempoBlancas) + ")";
      }

      // Notación de negras.
      const celdaNegras = document.createElement("td");

      celdaNegras.textContent = movimiento.negras || "";

      if (movimiento.tiempoNegras !== undefined) {
        celdaNegras.textContent +=
          " (" + formatearTiempoMovimiento(movimiento.tiempoNegras) + ")";
      }

      // Marcas correspondientes a blancas.
      const marcasBlancas = obtenerEtiquetasMarcas(movimiento, "blancas");

      // Marcas correspondientes a negras.
      const marcasNegras = obtenerEtiquetasMarcas(movimiento, "negras");

      // Mostramos las marcas de blancas.
      if (marcasBlancas.length > 0) {
        const detalleBlancas = document.createElement("small");

        detalleBlancas.className = "notation-annotations";
        detalleBlancas.textContent = marcasBlancas.join(" · ");

        celdaBlancas.appendChild(document.createElement("br"));
        celdaBlancas.appendChild(detalleBlancas);
      }

      // Mostramos las marcas de negras.
      if (marcasNegras.length > 0) {
        const detalleNegras = document.createElement("small");

        detalleNegras.className = "notation-annotations";
        detalleNegras.textContent = marcasNegras.join(" · ");

        celdaNegras.appendChild(document.createElement("br"));
        celdaNegras.appendChild(detalleNegras);
      }

      // Incorporamos las celdas a la fila.
      fila.appendChild(celdaNumero);
      fila.appendChild(celdaBlancas);
      fila.appendChild(celdaNegras);

      // Incorporamos la fila a la planilla.
      tbody.appendChild(fila);
    });
  }

  /* ========================================================
       26. EXPORTACIÓN DE LA PARTIDA A TXT
       ======================================================== */

  function generarTextoPartida() {
    const partida = obtenerPartidaActual();

    const lineas = [];

    lineas.push("ANOTADOR DE AJEDREZ");
    lineas.push("==================");
    lineas.push("");

    lineas.push("Partida: " + partidaActual);
    lineas.push(
      "Tiempo: " + formatearTiempo(obtenerTiempoTranscurrido(partida))
    );

    lineas.push("");
    lineas.push("MOVIMIENTOS");
    lineas.push("-----------");
    lineas.push("");

    const movimientosOrdenados = [...partida.movimientos].sort(
      (a, b) => a.numero - b.numero
    );

    movimientosOrdenados.forEach((movimiento) => {
      // Notación de blancas y su tiempo.
      let textoBlancas = movimiento.blancas || "...";

      if (typeof movimiento.tiempoBlancas === "number") {
        textoBlancas +=
          " (" + formatearTiempoMovimiento(movimiento.tiempoBlancas) + ")";
      }

      // Notación de negras y su tiempo.
      let textoNegras = movimiento.negras || "";

      if (typeof movimiento.tiempoNegras === "number" && movimiento.negras) {
        textoNegras +=
          " (" + formatearTiempoMovimiento(movimiento.tiempoNegras) + ")";
      }

      // Construimos la línea del movimiento.
      let linea = movimiento.numero + ". " + textoBlancas;

      if (textoNegras) {
        linea += " " + textoNegras;
      }

      lineas.push(linea);

      // Exportamos las marcas de blancas.
      const marcasBlancas = obtenerEtiquetasMarcas(movimiento, "blancas");

      if (marcasBlancas.length > 0) {
        lineas.push("   Blancas: " + marcasBlancas.join(" · "));
      }

      // Exportamos las marcas de negras.
      const marcasNegras = obtenerEtiquetasMarcas(movimiento, "negras");

      if (marcasNegras.length > 0) {
        lineas.push("   Negras: " + marcasNegras.join(" · "));
      }
    });

    lineas.push("");
    lineas.push("FIN DEL REGISTRO");

    return lineas.join("\n");
  }
  // Descarga el registro de la partida actual.
  function descargarPartidaParcial() {
    const texto = generarTextoPartida();

    const archivo = new Blob([texto], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "partida_" + partidaActual + ".txt";

    document.body.appendChild(enlace);
    enlace.click();

    document.body.removeChild(enlace);

    // Liberamos la URL creada para la descarga.
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
  /* ========================================================
       27. FINALIZAR PARTIDA
       ======================================================== */

  function finalizarPartida() {
    const partida = obtenerPartidaActual();

    if (partida.finalizada) return;

    const confirmar = confirm(
      "¿Querés finalizar esta partida y descargar el registro?"
    );

    if (!confirmar) return;

    // Detenemos el reloj.
    detenerPartida();

    // Marcamos la partida como finalizada.
    partida.finalizada = true;

    // Descargamos la planilla.
    descargarPartidaParcial();
  }

  /* ========================================================
       28. CAMBIO DE PARTIDA DESDE LOS BOTONES
       ======================================================== */
  function instalarEventosPartidas() {
    const botones = obtenerElementos(".score-game");

    console.log("Botones encontrados:", botones.length);

    botones.forEach((boton) => {
      if (boton.dataset.anotadorEvento === "true") {
        return;
      }

      boton.dataset.anotadorEvento = "true";

      boton.addEventListener("click", () => {
        const id = boton.dataset.game;

        console.log("Botón presionado:", id);

        cambiarPartida(id);
      });
    });
  }
  /* ========================================================
       29. EVENTOS DE SELECCIÓN DE PIEZAS
       ======================================================== */

  function instalarEventosPiezas() {
    obtenerElementos(".piece-row button").forEach((boton) => {
      if (boton.dataset.anotadorEvento === "true") {
        return;
      }

      boton.dataset.anotadorEvento = "true";

      boton.addEventListener("click", () => {
        seleccionarPieza(boton);
      });
    });
  }

  /* ========================================================
       30. EVENTOS DE SELECCIÓN DE CASILLAS
       ======================================================== */

  function instalarEventosTablero() {
    obtenerElementos(".board-grid button").forEach((boton) => {
      if (boton.dataset.anotadorEvento === "true") {
        return;
      }

      boton.dataset.anotadorEvento = "true";

      boton.addEventListener("click", () => {
        seleccionarDestino(boton);
      });
    });
  }

  /* ========================================================
       31. EVENTOS DE ACCIONES
       ======================================================== */

  function instalarEventosAcciones() {
    obtenerElementos(".action-row button").forEach((boton) => {
      if (boton.dataset.anotadorEvento === "true") {
        return;
      }

      boton.dataset.anotadorEvento = "true";

      boton.addEventListener("click", () => {
        const accion = boton.getAttribute("aria-label");

        switch (accion) {
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
  }

  /* ========================================================
       32. EVENTOS DE LOS BOTONES PRINCIPALES
       ======================================================== */

  function instalarEventosBotones() {
    // Botón CARGAR.
    const botonCargar = obtenerElemento("btn-score-cargar");

    if (botonCargar && botonCargar.dataset.anotadorEvento !== "true") {
      botonCargar.dataset.anotadorEvento = "true";

      botonCargar.addEventListener("click", cargarJugada);
    }

    // Botón REVISAR.
    const botonRevisar = obtenerElemento("btn-score-revisar");

    if (botonRevisar && botonRevisar.dataset.anotadorEvento !== "true") {
      botonRevisar.dataset.anotadorEvento = "true";

      botonRevisar.addEventListener("click", alternarRevisar);
    }

    // Botón ¿QUÉ JUEGO?
    const botonQueJuego = obtenerElemento("btn-score-que-juego");

    if (botonQueJuego && botonQueJuego.dataset.anotadorEvento !== "true") {
      botonQueJuego.dataset.anotadorEvento = "true";

      botonQueJuego.addEventListener("click", alternarQueJuego);
    }

    // Botón DESCARGA PARCIAL.
    const botonDescarga = obtenerElemento("btn-score-desc-parcial");

    if (botonDescarga && botonDescarga.dataset.anotadorEvento !== "true") {
      botonDescarga.dataset.anotadorEvento = "true";

      botonDescarga.addEventListener("click", descargarPartidaParcial);
    }

    // Botón FINALIZAR.
    const botonFinalizar = obtenerElemento("btn-score-finalizar");

    if (botonFinalizar && botonFinalizar.dataset.anotadorEvento !== "true") {
      botonFinalizar.dataset.anotadorEvento = "true";

      botonFinalizar.addEventListener("click", finalizarPartida);
    }
    // Botón NO LO VI
    const botonNoLoVi = obtenerElemento("btn-score-no-la-vi");

    if (botonNoLoVi && botonNoLoVi.dataset.anotadorEvento !== "true") {
      botonNoLoVi.dataset.anotadorEvento = "true";

      botonNoLoVi.addEventListener("click", registrarNoLoVi);
    }
    // Botón BORRAR ÚLTIMA JUGADA.
    const botonBorrar = obtenerElemento("btn-score-borrar");

    if (botonBorrar && botonBorrar.dataset.anotadorEvento !== "true") {
      botonBorrar.dataset.anotadorEvento = "true";

      botonBorrar.addEventListener("click", borrarUltimaJugada);
    }
  }

  /* ========================================================
       33. ESTILOS VISUALES COMPLEMENTARIOS
       ======================================================== */

  /*
       El CSS actual no contiene reglas para todas las clases
       que utiliza el anotador.

       Para evitar modificar styles.css, incorporamos aquí
       únicamente los estilos complementarios.

       Estos estilos no modifican la estructura del HTML.
    */

  function instalarEstilosAnotador() {
    if (obtenerElemento("anotador-extra-styles")) {
      return;
    }

    const estilo = document.createElement("style");

    estilo.id = "anotador-extra-styles";

    estilo.textContent = `
            /* Pieza seleccionada */
            .piece-row button.selected-piece {
                outline: 3px solid #d5a72e;
                background: rgba(213, 167, 46, 0.20);
                border-color: #d5a72e;
            }

            /* Casilla seleccionada */
            .board-grid button.selected-square {
                outline: 3px solid #d5a72e;
                outline-offset: -3px;
                box-shadow: inset 0 0 0 999px
                    rgba(213, 167, 46, 0.28);
            }

            /* Captura activa */
            .action-row button.capture-active {
                background: rgba(190, 60, 60, 0.25);
                border-color: #c94b4b;
                color: #c94b4b;
            }

            /* Jaque activo */
            .action-row button.check-active {
                background: rgba(213, 167, 46, 0.22);
                border-color: #d5a72e;
            }

            /* Mate activo */
            .action-row button.mate-active {
                background: rgba(190, 60, 60, 0.30);
                border-color: #c94b4b;
                color: #c94b4b;
            }

            /* Enroque activo */
            .action-row button.castle-active {
                background: rgba(70, 130, 180, 0.22);
                border-color: #4682b4;
            }

            /* Marcas REVISAR y ¿QUÉ JUEGO? */
            #btn-score-revisar.annotation-active,
            #btn-score-que-juego.annotation-active {
                background: rgba(213, 167, 46, 0.25);
                border-color: #d5a72e;
                font-weight: bold;
            }

            /* Vista previa vacía */
            #notation-preview.preview-empty {
                opacity: 0.55;
            }

            /* Marcas dentro de la planilla */
            .notation-annotations {
                font-size: 0.75em;
                opacity: 0.8;
            }
        `;

    document.head.appendChild(estilo);
  }

  /* ========================================================
       34. INSTALACIÓN GENERAL DE EVENTOS
       ======================================================== */

  function instalarEventosAnotador() {
    // Evitamos duplicar la instalación.
    if (eventosInstalados) return;

    eventosInstalados = true;

    instalarEventosPartidas();
    instalarEventosPiezas();
    instalarEventosTablero();
    instalarEventosAcciones();
    instalarEventosBotones();
  }

  /* ========================================================
       35. INICIALIZACIÓN DEL ANOTADOR
       ======================================================== */

  function inicializar() {
    // Estilos complementarios.
    instalarEstilosAnotador();

    // Eventos de interacción.
    instalarEventosAnotador();

    // Renderizado inicial.
    actualizarRelojPantalla();
    actualizarTurnoUI();

    actualizarSeleccionPieza();
    actualizarSeleccionTablero();
    actualizarBotonesAccion();
    actualizarBotonesMarca();

    renderizarPendiente();
    renderizarPlanilla();
  }

  /* ========================================================
       36. INICIO DEL PROGRAMA
       ======================================================== */

  // Si el documento todavía está cargando, esperamos al DOM.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar, { once: true });
  } else {
    inicializar();
  }

  /* ========================================================
       FIN DEL ANOTADOR
       ======================================================== */
})();
