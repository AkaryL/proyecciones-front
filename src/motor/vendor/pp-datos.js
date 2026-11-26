/* web/js/pp-datos.js · capa de acceso a datos del tablero (PP.datos, o window.PPDatos si PP no existe).
   Documentación y ejemplos: web/js/LEEME_datos.md · Pruebas: node _banco/pruebas/test_datos.js

   Qué hace
   - Carga los JSON de web/ una sola vez (caché en memoria) y rompe la caché del navegador con la fecha de corte.
   - Da lecturas ya localizadas: boleta, distritos, recorte (distrito × edad × género), veredicto, votos, trayectoria,
     qué mueve la aguja, perfiles de votante (agentes) y zonas.
   - Devuelve las cifras TAL CUAL están en el JSON (mismos objetos, sin redondear). Lo único que calcula está rotulado
     en cada función: votos() (lista nominal × participación, solo donde el motor exporta esa participación), reparto()
     y curules() (conteo de favoritos), igualCentral()/mueve() y el filtro de agentes.
   - Tolera que falte una boleta ('fed' sobre todo) o un archivo: devuelve null y la página lo rotula.

   Porta la lógica útil de la UI anterior (v8.js y evolucion.js) con las correcciones del paso 4 de la auditoría de UI:
   veredicto(pg, modo) devuelve también el líder; «Más votos» en vez de «Gana» cuando el recorte no es una elección;
   una sola regla de empate técnico (NOMBRES.UMBRAL); nombres desde NOMBRES; junio de la trayectoria usa las mismas
   corridas que las fichas; textos sin códigos internos (llano).

   No depende de pp.js. Nombres y rótulos salen de web/nombres.js (window.NOMBRES); en node se carga solo. */
(function (root, fabrica) {
  'use strict';
  var api = fabrica(root);
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root && typeof root.document !== 'undefined') {            /* navegador */
    root.PPDatos = api;
    if (root.PP && typeof root.PP === 'object') root.PP.datos = api;
    else if (root.document && typeof root.document.addEventListener === 'function') {
      /* si pp.js se carga después, PP.datos queda puesto antes de que las páginas pinten */
      root.document.addEventListener('DOMContentLoaded', function () {
        if (root.PP && typeof root.PP === 'object' && !root.PP.datos) root.PP.datos = api;
      });
    }
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (root) {
  'use strict';

  var VERSION = '2026-11-24';
  var EN_NODE = (!root || typeof root.document === 'undefined') && typeof require === 'function';

  /* clave corta → archivo de web/ */
  var ARCHIVOS = {
    v8: 'sim_v8.json', agentes: 'sim_agentes.json', escenarios: 'sim_escenarios.json', evolucion: 'sim_evolucion.json',
    menciones: 'sim_menciones.json', dashboard: 'sim_dashboard.json', corridas: 'sim_corridas.json',
    concilio: 'sim_concilio.json', dossier: 'sim_dossier.json', agua: 'sim_agua.json', proyecciones: 'proyecciones.json',
    /* grupos por lugar (motor v8.1): nombres y lectura · todas las variables · índice de la predicción por sección.
       Sus archivos por distrito y por escenario no van aquí: se piden cuando hacen falta (cargarSecciones, cargarVariables, cargarGruposSeccion). */
    grupos_desc: 'grupos_descripcion.json', grupos_var: 'grupos_variables.json', secc_indice: 'sim_secciones.json',
    /* partidos por separado (24-nov-2026): resultado oficial 2024 POR PARTIDO y por sección. partidos_2024.json (Alcaldía y Dip. local)
       lo genera scripts/35_partidos_2024.py desde el cómputo oficial que usa el motor; federal_2024.js no es JSON sino un script que deja
       un global (window.FED_DATA): la capa lo lee como texto y saca el objeto con JSON.parse (no ejecuta nada). pvem_datos.js (igual,
       window.PVEM_DATOS) ya NO es fuente del 2024: solo lo usa el Mapa para el censo. Se piden con cargarPartidos2024(). */
    p2024: 'partidos_2024.json', pvem: 'pvem_datos.js', fed2024: 'federal_2024.js'
  };
  /* global que deja cada archivo .js de datos (si la página ya lo cargó con <script>, se usa ese objeto) */
  var GLOBAL_JS = { 'pvem_datos.js': 'PVEM_DATOS', 'federal_2024.js': 'FED_DATA' };
  /* ---- partidos por separado (SA-PAR-01 a SA-PAR-04, 24-nov-2026): respaldo mínimo si nombres.js no cargó; la fuente es scripts/nombres.py ---- */
  var PARTIDOS8 = ['MC', 'MORENA', 'PT', 'PVEM', 'HAG_FUT', 'PAN', 'PRI', 'OTROS'];
  var CANDIDATURAS4 = ['MC', 'MORENA_ALIADOS', 'PAN_PRI', 'OTROS'];
  var CANDIDATURA_R = { MC: ['MC'], MORENA_ALIADOS: ['MORENA', 'PT', 'PVEM', 'HAG_FUT'], PAN_PRI: ['PAN', 'PRI'], OTROS: ['OTROS'] };
  var CANDIDATURA_FED_R = { MORENA_ALIADOS: ['MORENA', 'PT', 'PVEM'] };
  /* Resultado oficial 2024 POR PARTIDO y por sección que ya está en web/ (y de qué boleta es cada campo):
       ayun → partidos_2024.json · ayun[id] = Alcaldía de Guadalajara 2024 (cómputo por casilla, base electoral → ayun_2024);
       dip  → partidos_2024.json · dip[id]  = Diputación local de mayoría 2024 (base electoral → dip_local_2024). Los dos los exporta
               scripts/35_partidos_2024.py del mismo cómputo oficial y con la misma regla que el motor: % de la votación válida de MC,
               MORENA, PT, PVEM, HAG_FUT (Hagamos + Futuro), PAN, PRI (con el PRD) y OTROS, con los votos marcados a varios partidos de
               una coalición repartidos en partes iguales entre ellos. Antes (hasta el 24-nov) salían de pvem_datos.js (vAyun, v),
               datos clonados de otro proyecto que no coincidían con el cómputo oficial: ya no se usan para esto;
       fed  → federal_2024.js · dipfed[id] = Diputación federal de mayoría 2024: MC, MORENA, PT, PVEM, PAN, PRI y OTROS (no hay
               partidos locales en la federal), con los votos de coalición repartidos; ahí el PRD va en OTROS.
     sim_secciones.json → calidad.<boleta>.resultado_2024 (seccionBase) trae ese mismo resultado pero solo POR CANDIDATURA (mc, mor, pp):
     no sirve para repartir dentro de la candidatura.
     como = qué cuenta la cifra, en palabras (las páginas lo citan de aquí, no lo escriben a mano). */
  var COMO_2024 = 'votos de cada partido, con los marcados a varios partidos de una misma coalición repartidos en partes iguales entre ellos';
  var FUENTE_2024 = {
    ayun: { clave: 'p2024', archivo: 'partidos_2024.json', campo: null, ruta: 'ayun', boleta: 'Alcaldía 2024',
            como: COMO_2024 + '; Hagamos y Futuro van juntos y el PRI incluye al PRD' },
    dip: { clave: 'p2024', archivo: 'partidos_2024.json', campo: null, ruta: 'dip', boleta: 'Diputación local 2024',
           como: COMO_2024 + '; Hagamos y Futuro van juntos y el PRI incluye al PRD' },
    fed: { clave: 'fed2024', archivo: 'federal_2024.js', campo: null, ruta: 'dipfed', boleta: 'Diputación federal 2024',
           como: COMO_2024 + '; el PRD va en Otros' }
  };
  var BLOQUES3 = ['MC', 'MORENA_ALIADOS', 'PAN_PRI'];           /* los tres bloques con probabilidad de ganar */
  /* dónde se elige cada cargo: la alcaldía en toda la ciudad; las diputaciones, distrito por distrito */
  var AMBITO_ELECCION = { ayun: 'ciudad', dip: 'distrito', fed: 'distrito' };
  /* Respaldo mínimo si nombres.js no cargó: solo lo estructural. Los nombres salen entonces como claves crudas. */
  var RESPALDO = {
    BOLETA: { ayun: { clave: 'ayun', json: 'alcaldia', corto: 'ayun', largo: 'ayun', chip: 'AYUN' },
              dip: { clave: 'dip', json: 'diputacion', corto: 'dip', largo: 'dip', chip: 'DIP' },
              fed: { clave: 'fed', json: 'federal', corto: 'fed', largo: 'fed', chip: 'FED' } },
    BOLETAS: ['ayun', 'dip', 'fed'],
    ALIAS: { ayun: 'ayun', alcaldia: 'ayun', dip: 'dip', diputacion: 'dip', fed: 'fed', federal: 'fed' },
    UMBRAL: { GANA: 80, VENTAJA: 60 }                            /* la fuente es scripts/nombres.py (UMBRAL) */
  };
  /* Nombre llano de cada supuesto del motor (sensibilidad). Portado de v8.js. */
  var SUPUESTO = {
    lam_agua: 'Magnitud del castigo por agua', mult_afectado: 'Castigo extra en secciones afectadas',
    lam_ddhh: 'Magnitud del efecto de la represión', lam_polar: 'Magnitud de la polarización',
    lam_nac: 'Magnitud de la ola nacional', lam_cand: 'Fuerza del efecto Delgadillo',
    lam_seg: 'Magnitud del choque de seguridad', lam_resp: 'Recuperación por respuesta visible',
    lam_mob: 'Movilización por indignación', lam_dem: 'Desmovilización de la base de MC',
    g_mujer_agua: 'Castigo extra de mujeres por agua', c_pop: 'El tandeo pega más en zonas populares',
    h_esc: 'La represión pega más con escolaridad', n_bien: 'Ola nacional más fuerte con menor bienestar',
    n_inf: 'Ola nacional más fuerte con informalidad', n_pens: 'Ola nacional más fuerte en mayores (pensiones)',
    d_esc: 'Efecto Delgadillo más fuerte con escolaridad', d_mujer: 'Efecto Delgadillo más fuerte en mujeres',
    kappa: 'Arraigo de MC en sus bastiones', rho: 'Contagio entre secciones vecinas',
    beta_esc: 'Quienes dejan a MC con más escolaridad van al PAN',
    destino_MOR: 'Quienes dejan a MC y se van con la coalición de Morena', destino_PAN: 'Quienes dejan a MC y se van al PAN',
    destino_PRI: 'Quienes dejan a MC y se van al PRI', destino_OT: 'Quienes dejan a MC y anulan o votan por otros',
    destino_ABST: 'Quienes dejan a MC y no votan', deriva_base_alcaldia: 'Punto de partida (encuestas contra modelo)',
    deriva_base_diputacion: 'Punto de partida de la diputación local', deriva_base_federal: 'Punto de partida de la diputación federal',
    escudo_Delgadillo: 'Escudo de Delgadillo'
  };
  /* Palabras que los JSON traen sin acento (red en la interfaz; la causa se corrige en los generadores). */
  var ACENTOS = {
    alcaldia: 'alcaldía', geografia: 'geografía', mayoria: 'mayoría', patron: 'patrón', padron: 'padrón',
    gestion: 'gestión', segun: 'según', geografico: 'geográfico', socioeconomico: 'socioeconómico',
    pronostico: 'pronóstico', computo: 'cómputo', computos: 'cómputos', mas: 'más',
    explicitos: 'explícitos', linea: 'línea', genero: 'género', unico: 'único', mecanica: 'mecánica',
    deterministico: 'determinístico', razon: 'razón', tambien: 'también', numero: 'número', metodo: 'método',
    ultimo: 'último', analisis: 'análisis', indice: 'índice', dia: 'día', dias: 'días', despues: 'después',
    ademas: 'además', raiz: 'raíz', ningun: 'ningún', algun: 'algún', comun: 'común', politico: 'político',
    politica: 'política', economico: 'económico', clusteres: 'clústeres', demoscopo: 'demóscopo', pais: 'país'
  };
  /* Estas también son formas de verbo («se numero cada casilla», «lo computo»): tras un pronombre no se acentúan.
     «valida» no está en ACENTOS por lo mismo («se valida con…»): solo se acentúa en la frase «votación válida». */
  var PUEDE_SER_VERBO = { numero: 1, computo: 1, pronostico: 1, genero: 1 };
  var TRAS_PRONOMBRE = /(?:^|[^A-Za-zñÑáéíóúüÁÉÍÓÚÜ])(?:se|yo|lo|la|los|las|le|les|me|te|nos)\s+$/i;
  var GENERO_TXT = { mujer: 'mujeres', hombre: 'hombres' };
  /* Capas temáticas del Mapa (diseño del 20-nov, SA-SEC-28): qué bloques de grupos_variables.json entran en cada capa del PDF y cuál se
     elige al abrirla. «Nivel socioeconómico» usa además el índice de grupos_descripcion.json; «Género», el % de mujeres en la lista nominal. */
  var CAPAS_TEMATICAS = [
    { clave: 'sentimiento', nombre: 'Sentimiento digital', inactiva: true, enlace: 'monitoreo', enlace_texto: 'Ver Monitoreo',
      motivo: 'Las menciones en redes y prensa se miden por canal, tema y actor, no por sección: no se pueden pintar en el mapa.' },
    { clave: 'servicios', nombre: 'Servicios públicos', bloques: ['Agua', 'Vivienda', 'Conectividad'], defecto: 'agua_exposicion' },
    { clave: 'seguridad_social', nombre: 'Seguridad social', bloques: ['Salud'], defecto: 'pct_sin_afiliacion_salud' },
    { clave: 'economia', nombre: 'Economía', bloques: ['Trabajo', 'Bienes del hogar', 'Negocios'], defecto: 'pct_desocupada' },
    { clave: 'nse', nombre: 'Nivel socioeconómico', bloques: ['Escuela'], extra: ['nse'], defecto: 'nse' },
    { clave: 'genero', nombre: 'Género', claves: ['ln_pct_mujeres', 'pct_mujeres', 'pct_mujeres_18_mas', 'pct_hogares_jefa', 'grado_escolar_mujeres', 'tasa_actividad_mujeres'], defecto: 'ln_pct_mujeres' }
  ];
  var NSE_CATEGORIAS = ['bajo', 'medio-bajo', 'medio', 'medio-alto', 'alto', 'muy alto'];   /* las de grupos_descripcion.json, de menos a más */
  /* Medios de cada edad (sim_agentes.json → dieta_medios): palabra del motor → medio de la leyenda del PDF */
  var MEDIOS_NOMBRE = { redes: 'Redes', whatsapp: 'WhatsApp', tv_radio: 'TV y radio', prensa: 'Prensa y noticias digitales', podcast: 'Podcasts' };
  var MEDIOS_REGLAS = [[/whatsapp/, 'whatsapp'], [/tiktok|instagram|facebook|reels|redes/, 'redes'], [/\btv\b|radio|televisi/, 'tv_radio'],
                       [/prensa|noticias|peri[oó]dic/, 'prensa'], [/podcast/, 'podcast']];
  /* Avisos de votos() y de «adelante»: textos de respaldo; si nombres.js trae NOMBRES.TEXTO.AVISO_NULOS,
     SIN_PARTICIPACION_DISTRITO, SIN_MARGEN_DISTRITO, SOLO_BRECHA_DISTRITO o SOLO_FRANJA, mandan esos. */
  /* G4 de cifras (20-nov): la participación del motor es votos VÁLIDOS entre lista nominal (sim_v8.json → _meta.exportacion.campos;
     sim_secciones → _meta.series.part), así que lista nominal × participación ya son votos válidos: no son «votos emitidos». */
  var NAT_MOTOR = 'estimación del motor', NAT_REPARTO = 'reparto estimado por partido', NAT_CALCULO = 'cálculo propio';
  var AVISO_NULOS = 'No se descuentan votos nulos porque no hace falta: la participación del motor ya es votos válidos entre lista nominal, así que la cifra son votos válidos estimados.';
  var SIN_PARTICIPACION_DISTRITO = 'Sin estimación de votos para este distrito: el motor no exporta la participación por distrito.';
  var SIN_MARGEN_DISTRITO = 'Sin brecha en votos para este distrito: el motor no exporta el margen por distrito.';
  var SOLO_BRECHA_DISTRITO = 'Para este escenario solo hay la brecha en votos del distrito; no su participación ni su total de votos.';
  var SOLO_FRANJA = 'solo su franja de Guadalajara';

  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function esNum(x) { return typeof x === 'number' && !isNaN(x); }
  function igual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function crear(opciones) {
    var cfg = { base: '', corte: null, lector: null, nombres: null, alError: null };
    var datos = {}, promesas = {}, fallos = [], libres = {}, memo = {}, nomNode;

    /* ------------------------------------------------------------------ nombres (NOMBRES, con respaldo) */
    function NOM() {
      if (cfg.nombres) return cfg.nombres;
      if (root && root.NOMBRES) return root.NOMBRES;
      if (EN_NODE && nomNode === undefined) {
        try { nomNode = require(require('path').join(__dirname, '..', 'nombres.js')); } catch (e) { nomNode = null; }
      }
      return nomNode || null;
    }
    function fnN(nombreFn, args, respaldo) {
      var n = NOM();
      return n && typeof n[nombreFn] === 'function' ? n[nombreFn].apply(n, args) : respaldo;
    }
    var nm = {
      nombre: function (k) { return fnN('nombre', [k], k == null ? '' : String(k)); },
      texto: function (k, resp) { var n = NOM(); return n && n.TEXTO && n.TEXTO[k] != null ? n.TEXTO[k] : resp; },
      umbral: function () { var n = NOM(); return (n && n.UMBRAL) || RESPALDO.UMBRAL; },
      boletas: function () { var n = NOM(); return (n && n.BOLETAS) || RESPALDO.BOLETAS; },
      boleta: function (b) { var n = NOM(); return (n && n.BOLETA && n.BOLETA[b]) || RESPALDO.BOLETA[b] || null; },
      fecha: function (iso) { return fnN('fecha', [iso], iso == null ? '' : String(iso)); },
      escenario: function (e) { return fnN('escenario', [e], e && e.id != null ? String(e.id) : String(e)); },
      escenarioCorto: function (t) { return fnN('escenario_corto', [t], t == null ? '' : String(t)); },
      distrito: function (dl, corto, n) { return fnN('distrito', [dl, corto, n], 'D' + dl); },
      distritoFederal: function (dl, corto) { return fnN('distrito_federal', [dl, corto], 'DF' + dl); },
      ambito: function (dl, b) { return fnN('ambito', [dl, b], dl ? (b === 'fed' ? 'DF' : 'D') + dl : 'toda Guadalajara'); },
      rotulo: function (b, e, dl) { return fnN('rotulo', [b, e, dl], [b, e, dl || ''].join(' · ')); },
      adelante: function (dl, b) { return fnN('adelante', [dl, b], 'Adelante en ' + nm.ambito(dl, b)); },
      masVotos: function (k) { return fnN('mas_votos', [k], 'Más votos en este recorte: ' + nm.nombre(k)); },
      resumenDistritos: function (lideres, b) { return fnN('resumen_distritos', [lideres, b], ''); },
      pctCorridas: function (p) { return fnN('pct_corridas', [p], String(p) + ' % de las corridas'); }
    };
    function sinDato() { return nm.texto('SIN_DATO', 's/d'); }

    /* ------------------------------------------------------------------ normalización de argumentos */
    function bol(b) {                                             /* 'ayun' | 'dip' | 'fed' | null (estricto) */
      if (b == null) return null;
      var s = String(b).trim().toLowerCase(), n = NOM(), al = (n && n.BOLETA_ALIAS) || RESPALDO.ALIAS;
      return has(al, s) ? al[s] : null;
    }
    function jsonDe(b) { var i = nm.boleta(b); return i ? i.json : null; }
    function escId(e) {
      if (e && typeof e === 'object') return e.id != null ? String(e.id) : null;
      return e == null || e === '' ? null : String(e);
    }
    function normDl(dl) {                                         /* '8' | null (= toda Guadalajara) */
      if (dl == null) return null;
      var s = String(dl).trim();
      if (s === '' || s === '*' || /^(todos?|todas?|all|gdl)$/i.test(s)) return null;
      return s.toUpperCase().replace(/^(DF|DL|D)/, '');
    }
    function normEdad(x) {
      if (x == null) return null;
      var s = String(x).trim();
      return (s === '' || s === '*' || /^(todas?|todos?|all)$/i.test(s)) ? null : s;
    }
    /* Las lecturas por recorte admiten también el estado compartido de pp.js como único argumento: recorte(PP.estado),
       es decir {b, e, d} (más edad y genero si los hay). */
    function esEstado(x) { return !!x && typeof x === 'object' && !has(x, 'id') && (has(x, 'b') || has(x, 'e') || has(x, 'd')); }
    function normGenero(g) {
      if (g == null) return null;
      var s = String(g).trim().toLowerCase();
      if (s === '' || s === '*' || /^(ambos|todos?|todas?|all)$/.test(s)) return null;
      if (s === 'mujeres' || s === 'm' || s === 'f') return 'mujer';
      if (s === 'hombres' || s === 'h') return 'hombre';
      return s;
    }

    /* ------------------------------------------------------------------ carga y caché */
    function clave(x) {
      var s = String(x == null ? '' : x).trim();
      if (has(ARCHIVOS, s)) return s;
      var base = s.replace(/^.*\//, '').replace(/\.json$/i, ''), k;
      for (k in ARCHIVOS) if (has(ARCHIVOS, k) && ARCHIVOS[k].replace(/\.json$/, '') === base) return k;
      libres[base] = /\.json$/i.test(s) ? s : s + '.json';         /* archivo fuera de la lista: se admite */
      return base;
    }
    function archivo(k) { return has(ARCHIVOS, k) ? ARCHIVOS[k] : (libres[k] || k + '.json'); }
    function selloActual() {
      if (cfg.corte) return String(cfg.corte);
      var d = datos.v8;
      return (d && d._meta && d._meta.corte) ? String(d._meta.corte) : '';
    }
    function url(arch) {
      var s = selloActual();
      return cfg.base + arch + (s ? (arch.indexOf('?') < 0 ? '?' : '&') + 'v=' + encodeURIComponent(s) : '');
    }
    function aJson(x) { return typeof x === 'string' ? JSON.parse(x) : x; }
    /* Un archivo .js de datos («window.X = {…};»): se toma el texto entre la primera «{» y la última «}» y se lee con JSON.parse
       (no se ejecuta). Si el lector ya da un objeto, se usa tal cual. */
    function desdeJs(x) {
      if (typeof x !== 'string') return x;
      var a = x.indexOf('{'), z = x.lastIndexOf('}');
      if (a < 0 || z < a) throw new Error('no es un archivo de datos «window.X = {…}»');
      return JSON.parse(x.slice(a, z + 1));
    }
    function leerJs(arch) {
      var g = GLOBAL_JS[arch];
      if (g && root && root[g] && typeof root[g] === 'object' && typeof root.document !== 'undefined') return Promise.resolve(root[g]);   /* la página ya lo cargó */
      if (typeof cfg.lector === 'function') return Promise.resolve().then(function () { return cfg.lector(arch); }).then(desdeJs);
      if (EN_NODE) {
        return new Promise(function (ok, mal) {
          var fs = require('fs'), path = require('path'), dir = cfg.base || path.join(__dirname, '..');
          fs.readFile(path.join(dir, arch), 'utf8', function (e, t) { if (e) return mal(e); try { ok(desdeJs(t)); } catch (x) { mal(x); } });
        });
      }
      if (!root || typeof root.fetch !== 'function') return Promise.reject(new Error('no hay fetch ni lector configurado'));
      return root.fetch(url(arch), { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return typeof r.text === 'function' ? r.text() : r.json();
      }).then(desdeJs);
    }
    function leer(arch) {
      if (/\.js$/i.test(arch)) return leerJs(arch);
      if (typeof cfg.lector === 'function') return Promise.resolve().then(function () { return cfg.lector(arch); }).then(aJson);
      if (EN_NODE) {
        return new Promise(function (ok, mal) {
          var fs = require('fs'), path = require('path'), dir = cfg.base || path.join(__dirname, '..');
          fs.readFile(path.join(dir, arch), 'utf8', function (e, t) {
            if (e) return mal(e);
            try { ok(JSON.parse(t)); } catch (x) { mal(x); }
          });
        });
      }
      if (!root || typeof root.fetch !== 'function') return Promise.reject(new Error('no hay fetch ni lector configurado'));
      /* ?v=<corte> rompe cachés largas; 'no-cache' obliga a revalidar si el archivo se regeneró con el mismo corte */
      return root.fetch(url(arch), { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    }
    function anotaFallo(k, arch, e, opcional) {
      var f = { clave: k, archivo: arch, error: String((e && e.message) || e), opcional: !!opcional };
      fallos.push(f);
      if (opcional) return;
      try {                                                       /* el aviso no debe romper la carga */
        if (typeof cfg.alError === 'function') cfg.alError(f);
        else if (root && root.PP && typeof root.PP.error === 'function') root.PP.error('No cargó ' + arch + ': ' + f.error);
      } catch (x) { }
    }
    function cargarUno(k, opcional) {
      if (promesas[k]) return promesas[k];
      var arch = archivo(k);
      promesas[k] = leer(arch).then(function (j) { datos[k] = j; memo = {}; return j; },
        function (e) { datos[k] = null; anotaFallo(k, arch, e, opcional); return null; });
      return promesas[k];
    }
    /* El sello de caché es la fecha de corte del motor: sale de sim_v8.json, que se pide primero (sin sello). */
    function selloListo() {
      if (cfg.corte || typeof cfg.lector === 'function' || EN_NODE) return Promise.resolve();
      return cargarUno('v8').then(function () { });
    }
    /**
     * cargar(['v8','agentes'], op) → Promise<{v8:…, agentes:…}>. Nunca rechaza: el archivo que falte llega como null,
     * queda en errores() y se avisa a PP.error (o a configurar({alError})), salvo que se pida como opcional:
     * op.opcionales = true (todos) o ['proyecciones']. op.forzar = true vuelve a leer.
     */
    function cargar(lista, op) {
      if (lista == null) lista = ['v8'];
      if (!Array.isArray(lista)) lista = [lista];
      var claves = lista.map(clave), opc = op && op.opcionales;
      function esOpc(k) { return opc === true || (Array.isArray(opc) && opc.map(clave).indexOf(k) >= 0); }
      if (op && op.forzar) {
        claves.forEach(function (k) { delete promesas[k]; delete datos[k]; });
        fallos = fallos.filter(function (f) { return claves.indexOf(f.clave) < 0; });
        memo = {};
      }
      return selloListo().then(function () { return Promise.all(claves.map(function (k) { return cargarUno(k, esOpc(k)); })); }).then(function (vals) {
        var o = {};
        claves.forEach(function (k, i) { o[k] = vals[i]; });
        return o;
      });
    }
    function poner(k, json) { k = clave(k); datos[k] = json == null ? null : json; promesas[k] = Promise.resolve(datos[k]); memo = {}; return api; }
    function dato(k) { k = clave(k); return has(datos, k) && datos[k] != null ? datos[k] : null; }
    function listo(k) { return dato(k) != null; }
    function errores() { return fallos.slice(); }
    function configurar(op) {
      op = op || {};
      ['base', 'corte', 'lector', 'nombres', 'alError'].forEach(function (k) { if (has(op, k)) cfg[k] = op[k]; });
      if (cfg.base && !EN_NODE && !/\/$/.test(cfg.base)) cfg.base += '/';
      return api;
    }

    /* ------------------------------------------------------------------ motor: meta, corte y escenarios */
    function v8() { return datos.v8 || null; }
    function meta() { var d = v8(); return (d && d._meta) || null; }
    /** Fecha de corte del motor, tal cual: 'AAAA-MM-DD' (sim_v8.json → _meta.corte). */
    function corte() { var m = meta(); return (m && m.corte) || null; }
    function corteTexto() { var c = corte(); return c ? nm.fecha(c) : sinDato(); }           /* «3-nov-2026» */
    /** Fecha propia de cada archivo (cada fuente lleva la suya): _meta.corte → fecha → _meta.fecha → _meta_monitoreo.corte. */
    function fechaDe(k) {
      var j = dato(k); if (!j) return null;
      return (j._meta && j._meta.corte) || j.fecha || (j._meta && j._meta.fecha) || (j._meta_monitoreo && j._meta_monitoreo.corte) || null;
    }
    function listaEsc() { var d = v8(); return d && Array.isArray(d.escenarios) ? d.escenarios : []; }
    /** El escenario crudo de sim_v8.json (se busca por id: escenarios es un ARRAY). */
    function escenario(esc) {
      var id = escId(esc); if (!id) return null;
      if (!memo.esc) { memo.esc = {}; listaEsc().forEach(function (e) { memo.esc[e.id] = e; }); }
      return has(memo.esc, id) ? memo.esc[id] : null;
    }
    /** id del escenario que el motor marca «(central)»; hoy S1. */
    function central() {
      var es = listaEsc(), i;
      for (i = 0; i < es.length; i++) if (String(es[i].nombre || '').indexOf('(central)') >= 0) return es[i].id;
      return es.length ? fnN('escenario_central', [es], es[0].id) : null;
    }
    function boletasAfectadas(e) {                                 /* dato nuevo de la exportación; null si no existe */
      var x = e ? e.boletas_afectadas : null, out = [];
      if (x == null) return null;
      if (Array.isArray(x)) x.forEach(function (b) { var k = bol(b); if (k && out.indexOf(k) < 0) out.push(k); });
      else if (typeof x === 'object') Object.keys(x).forEach(function (b) { var k = bol(b); if (k && x[b] && out.indexOf(k) < 0) out.push(k); });
      else return null;
      return out;
    }
    /** ¿El escenario da en esta boleta exactamente lo mismo que el central? (true/false; null si falta algo). */
    function igualCentral(esc, b) {
      var id = escId(esc), c = central(), X = boleta(id, b), C = boleta(c, b);
      if (!X || !C) return null;
      if (id === c) return false;
      return igual(X.bloques, C.bloques) && igual(X.p_gana, C.p_gana) && igual(X.participacion, C.participacion);
    }
    /**
     * ¿El escenario mueve esta boleta? Usa boletas_afectadas si el motor lo exporta; si no, compara con el central.
     * null para el propio central (es la referencia de la comparación: el motor exporta su lista vacía y lo explica en
     * boletas_afectadas_nota) y cuando la boleta no existe en los datos.
     */
    function mueve(esc, b) {
      var e = escenario(esc), k = bol(b); if (!e || !k) return null;
      if (e.id === central()) return null;                        /* antes de leer boletas_afectadas: en el central va [] */
      if (!boleta(e.id, k)) return null;
      var ba = boletasAfectadas(e);
      if (ba) return ba.indexOf(k) >= 0;
      var ig = igualCentral(e.id, k);
      return ig == null ? null : !ig;
    }
    /** Lista de escenarios: id, nombre, definición y, si el dato existe, las boletas que mueve, su nota y su fuente. */
    function escenarios() {
      var c = central();
      return listaEsc().map(function (e) {
        var mv = {};
        nm.boletas().forEach(function (b) { mv[b] = mueve(e.id, b); });
        return {
          id: e.id, nombre: e.nombre, definicion: e.definicion,
          corto: nm.escenarioCorto(e.nombre), rotulo: nm.escenario(e), definicion_llana: llano(e.definicion),
          central: e.id === c, referencia: e.id === 'S0',
          boletas_afectadas: boletasAfectadas(e),
          boletas_afectadas_nota: nul(e.boletas_afectadas_nota), fuente: nul(e.fuente),   /* tal cual vienen del JSON */
          mueve: mv, crudo: e
        };
      });
    }

    /* ------------------------------------------------------------------ boleta, distritos y recortes */
    /** El bloque del escenario para la boleta ('ayun' | 'dip' | 'fed'), tal cual está en el JSON. null si no existe. */
    function boleta(esc, b) {
      var e = escenario(esc), j = jsonDe(bol(b));
      return e && j && e[j] && typeof e[j] === 'object' ? e[j] : null;
    }
    function hayBoleta(b) { var es = listaEsc(), j = jsonDe(bol(b)); return !!(j && es.length && es[0][j]); }
    function ordenDl(ks) {
      var n = NOM(), ref = (n && n.DISTRITOS) || [];
      return ks.slice().sort(function (a, c) {
        var ia = ref.indexOf(a), ic = ref.indexOf(c);
        if (ia >= 0 && ic >= 0) return ia - ic;
        return (parseInt(a, 10) || 0) - (parseInt(c, 10) || 0);
      });
    }
    /** Claves de distrito que trae el motor para la boleta (en el orden de NOMBRES.DISTRITOS). */
    function listaDistritos(b) {
      var es = listaEsc(), j = jsonDe(bol(b)), i, X;
      for (i = 0; i < es.length; i++) { X = j && es[i][j]; if (X && X.distritos) return ordenDl(Object.keys(X.distritos)); }
      return [];
    }
    function bloqueDistrito(dl) {                                   /* el distrito en cualquier boleta: la franja es geográfica */
      var es = listaEsc(), bs = nm.boletas(), i, k, X;
      for (i = 0; i < es.length; i++) for (k = 0; k < bs.length; k++) {
        X = es[i][jsonDe(bs[k])];
        if (X && X.distritos && X.distritos[dl]) return X.distritos[dl];
      }
      return null;
    }
    function existeDistrito(dl) {
      if (listaEsc().length) return !!bloqueDistrito(dl);
      var n = NOM(); return !!(n && n.DISTRITOS && n.DISTRITOS.indexOf(dl) >= 0);
    }
    /** ¿El motor solo cuenta una franja del distrito? (D13: 73 secciones de Guadalajara; la cabecera es Tlaquepaque). */
    function esFranja(dl) {
      dl = normDl(dl); if (!dl) return false;
      var d = bloqueDistrito(dl), n = NOM(), L;
      if (d) return d.franja === true;
      L = n && n.DISTRITO_LOCAL && n.DISTRITO_LOCAL[dl];
      return !!(L && L.n_secc != null);
    }
    /** true solo si el recorte corresponde a una elección real (un cargo que se decide con esos votos). */
    function esEleccion(b, dl, edad, genero) {
      if (esEstado(b)) { genero = b.genero; edad = b.edad; dl = b.d; b = b.b; }
      b = bol(b); if (!b) return false;
      if (normEdad(edad) || normGenero(genero)) return false;      /* un segmento de edad o género no elige a nadie */
      dl = normDl(dl);
      if (AMBITO_ELECCION[b] === 'ciudad') return !dl;             /* la alcaldía se decide en toda la ciudad */
      if (!dl) return false;                                        /* diputación con «todos los distritos»: es una suma */
      if (!existeDistrito(dl)) return false;
      return !esFranja(dl);                                         /* D13: aquí solo cuenta su franja de Guadalajara */
    }
    /** Por qué un recorte es o no una elección, con la frase para la interfaz. */
    function tipoRecorte(b, dl, edad, genero) {
      if (esEstado(b)) { genero = b.genero; edad = b.edad; dl = b.d; b = b.b; }
      b = bol(b); dl = normDl(dl);
      if (!b) return { eleccion: false, tipo: 'sin_dato', nota: '' };
      if (esEleccion(b, dl, edad, genero)) return { eleccion: true, tipo: 'eleccion', nota: '' };
      if (normEdad(edad) || normGenero(genero)) return { eleccion: false, tipo: 'segmento', nota: 'Es un segmento del electorado, no una elección.' };
      if (AMBITO_ELECCION[b] === 'ciudad') return { eleccion: false, tipo: 'distrito_de_alcaldia', nota: 'La alcaldía se decide en toda la ciudad; este es el voto de un distrito.' };
      if (!dl) return { eleccion: false, tipo: 'suma_distritos', nota: nm.texto('SUMA_DISTRITOS', 'Voto sumado de los distritos (no elige a nadie)') };
      if (esFranja(dl)) return { eleccion: false, tipo: 'franja', nota: textoFranja(b, dl).nota };
      return { eleccion: false, tipo: 'sin_dato', nota: '' };
    }

    /**
     * veredicto(pg, modo, donde) · pg = probabilidades de ganar por bloque, tal cual vienen en el JSON.
     * modo 'eleccion' (por defecto): «Gana X» (≥ UMBRAL.GANA), «Ventaja X» (≥ UMBRAL.VENTAJA) o «Empate técnico».
     * modo 'suma' (el recorte no elige a nadie): «Más votos en este recorte: X» o «Parejo». Nunca dice «Gana».
     * Devuelve siempre el líder (también en empate) y su probabilidad sin redondear.
     * donde = {dl, boleta} · solo si pg es el voto del DISTRITO ENTERO (sin filtro de edad ni género): entonces, en modo
     * 'suma' y con nivel «más votos», .adelante = «Adelante en D9: X». Con donde.edad o donde.genero, o sin donde,
     * .adelante = null: quien encabeza un segmento no es quien va adelante en el distrito.
     */
    function veredicto(pg, modo, donde) {
      var arr = [], m = modo === 'suma' ? 'suma' : 'eleccion', U = nm.umbral();
      if (pg && typeof pg === 'object') Object.keys(pg).forEach(function (k) { if (esNum(pg[k])) arr.push([k, pg[k]]); });
      arr.sort(function (a, c) { return c[1] - a[1]; });
      var v = { txt: sinDato(), corto: sinDato(), verbo: null, nivel: null, lider: null, nombre: null, b: null, p: null,
                segundo: null, p2: null, firme: false, detalle: '', adelante: null, modo: m, eleccion: m === 'eleccion' };
      if (!arr.length) return v;
      var k = arr[0][0], p = arr[0][1], nom = nm.nombre(k), base;
      v.lider = k; v.nombre = nom; v.p = p; v.firme = p >= U.GANA;
      if (arr.length > 1) { v.segundo = arr[1][0]; v.p2 = arr[1][1]; }
      v.detalle = nom + ' por delante en ' + nm.pctCorridas(p);
      if (m === 'eleccion') {
        base = fnN('veredicto', [pg], null);                        /* la regla vigente vive en nombres.py */
        if (base && base.nivel && base.lider === k) { v.nivel = base.nivel; v.txt = base.txt; if (base.detalle) v.detalle = base.detalle; }
        else {
          v.nivel = p >= U.GANA ? 'gana' : (p >= U.VENTAJA ? 'ventaja' : 'empate');
          v.txt = v.nivel === 'gana' ? 'Gana ' + nom : (v.nivel === 'ventaja' ? 'Ventaja ' + nom : 'Empate técnico');
        }
        v.verbo = v.nivel === 'empate' ? v.txt : v.txt.slice(0, Math.max(0, v.txt.length - nom.length)).trim();
        v.corto = v.txt;
        v.b = v.nivel === 'empate' ? null : k;
      } else if (p >= U.VENTAJA) {
        v.nivel = 'mas_votos'; v.verbo = 'Más votos'; v.txt = nm.masVotos(k); v.corto = v.verbo + ': ' + nom; v.b = k;
      } else {
        v.nivel = 'parejo'; v.verbo = nm.texto('PAREJO', 'Parejo'); v.txt = v.verbo; v.corto = v.verbo; v.b = null;
      }
      /* casi empate (SA-SEC-33): ni «X por delante» ni la cifra de uno solo; las dos partes y el umbral, como NOMBRES.veredicto */
      if ((v.nivel === 'empate' && !(base && base.nivel === 'empate' && base.lider === k && base.detalle)) || v.nivel === 'parejo') v.detalle = partesParejo(arr, U);
      if (v.p2 != null && v.p2 === p) v.detalle = nom + ' y ' + nm.nombre(v.segundo) + ' con la misma probabilidad (' + nm.pctCorridas(p) + ')';
      if (m === 'suma' && v.nivel === 'mas_votos' && donde && normDl(donde.dl) && !normEdad(donde.edad) && !normGenero(donde.genero)) {
        v.adelante = adelanteEn(normDl(donde.dl), bol(donde.boleta) || 'dip') + ': ' + nom;
      }
      return v;
    }
    /* «Coalición de Morena 55.9 % · MC 44.1 % de las corridas · nadie llega a 60 %» (arr = [[clave, %], …] de mayor a menor) */
    function partesParejo(arr, U) {
      var pc = function (x, d) { return fnN('pct', [x, d], String(x) + ' %'); };
      return arr.slice(0, 2).map(function (x) { return nm.nombre(x[0]) + ' ' + pc(x[1]); }).join(' · ') + ' ' + nm.texto('DE_LAS_CORRIDAS', 'de las corridas') +
        ' · nadie llega a ' + pc(U.VENTAJA, 0);
    }
    function modoDe(b, dl, edad, genero) { return esEleccion(b, dl, edad, genero) ? 'eleccion' : 'suma'; }
    /* «Adelante en D9» · «Adelante en D13 (solo su franja de Guadalajara)». En la federal NOMBRES.ambito da solo «DF13»:
       se añade aquí que es la franja, para no afirmar nada del distrito federal entero. */
    function adelanteEn(dl, b) {
      var t = nm.adelante(dl, b);
      if (esFranja(dl) && !/franja/i.test(t)) t += ' (' + nm.texto('SOLO_FRANJA', SOLO_FRANJA) + ')';
      return t;
    }

    function fichaDistrito(id, b, dl, d) {
      return {
        esc: id, boleta: b, dl: dl,
        corto: b === 'fed' ? nm.distritoFederal(dl, true) : nm.distrito(dl, true),
        largo: b === 'fed' ? nm.distritoFederal(dl, false) : nm.distrito(dl, false, d.n_secciones),
        ambito: nm.ambito(dl, b),
        n_secciones: d.n_secciones, franja: d.franja === true, lista_nominal: listaNominal(dl),
        bloques: d.bloques, p_gana: d.p_gana, partidos_p50: has(d, 'partidos_p50') ? d.partidos_p50 : null,
        curules: has(d, 'curules') ? d.curules : null,
        eleccion: esEleccion(b, dl),
        veredicto: veredicto(d.p_gana, modoDe(b, dl), { dl: dl, boleta: b }),
        crudo: d
      };
    }
    /** Los distritos de la boleta en ese escenario (lista ordenada). null si la boleta no existe. */
    function distritos(esc, b) {
      var X = boleta(esc, b), id = escId(esc); b = bol(b);
      if (!X || !X.distritos) return null;
      return ordenDl(Object.keys(X.distritos)).map(function (dl) { return fichaDistrito(id, b, dl, X.distritos[dl]); });
    }
    /** Un distrito de la boleta en ese escenario. null si no existe. */
    function distrito(esc, b, dl) {
      if (esEstado(esc)) { dl = esc.d; b = esc.b; esc = esc.e; }
      var X = boleta(esc, b); dl = normDl(dl); b = bol(b);
      if (!X || !X.distritos || !dl || !has(X.distritos, dl)) return null;
      return fichaDistrito(escId(esc), b, dl, X.distritos[dl]);
    }

    function rangoPP(x) {                                           /* coalición PAN-PRI de un recorte: mediana y, si existe, rango */
      if (x.PP_rango && typeof x.PP_rango === 'object') return { p10: x.PP_rango.p10, p50: has(x.PP_rango, 'p50') ? x.PP_rango.p50 : x.PP, p90: x.PP_rango.p90 };
      if (x.PP && typeof x.PP === 'object') return x.PP;
      return null;
    }
    function nul(x) { return x === undefined ? null : x; }
    /**
     * recorte(esc, b, dl, edad, genero) · el voto de un recorte (distrito × banda de edad × género; vacío = todos).
     * Lee sim_v8.json → recortes[esc]['dl|edad|genero'][b]. Si esa boleta no está en recortes (hoy 'fed') y no hay
     * filtro de edad ni género, toma las mismas cifras del bloque de la boleta o de su distrito (origen: 'bloque').
     * Con edad o género y sin dato, devuelve null.
     */
    function recorte(esc, b, dl, edad, genero) {
      if (esEstado(esc)) { genero = esc.genero; edad = esc.edad; dl = esc.d; b = esc.b; esc = esc.e; }
      var id = escId(esc), d = v8(); b = bol(b); dl = normDl(dl); edad = normEdad(edad); genero = normGenero(genero);
      if (!d || !b || !id || !escenario(id)) return null;
      var k = (dl || '*') + '|' + (edad || '*') + '|' + (genero || '*');
      var R = d.recortes && d.recortes[id] && d.recortes[id][k], x = R && R[b] && typeof R[b] === 'object' ? R[b] : null;
      var X = boleta(id, b), B = null, o = null, pp;
      if (!edad && !genero && X) B = dl ? (X.distritos && X.distritos[dl]) || null : X;   /* el mismo recorte, visto en el bloque */
      if (x) {
        pp = rangoPP(x);
        o = { origen: 'recortes', MC: x.MC, MORENA_ALIADOS: x.MOR, pp_rango: pp ? 'recortes' : null,
              PAN_PRI: pp || { p10: null, p50: x.PP, p90: null },
              p_gana: { MC: nul(x.p_mc), MORENA_ALIADOS: nul(x.p_mor), PAN_PRI: nul(x.p_pp) },
              delta: { MC: nul(x.d_mc), MORENA_ALIADOS: nul(x.d_mor), PAN_PRI: nul(x.d_pp) }, crudo: x };
        /* el recorte solo trae la mediana de la coalición PAN-PRI: si el bloque equivalente tiene el rango (misma mediana), se usa */
        if (!pp && B && B.bloques && B.bloques.PAN_PRI && B.bloques.PAN_PRI.p50 === x.PP) { o.PAN_PRI = B.bloques.PAN_PRI; o.pp_rango = 'bloque'; }
        /* igual con el cambio de la coalición PAN-PRI frente a S0: el recorte no lo trae; el bloque de toda la ciudad sí */
        if (o.delta.PAN_PRI == null && B === X && X.delta_vs_s0 && X.delta_vs_s0.PAN_PRI) o.delta.PAN_PRI = nul(X.delta_vs_s0.PAN_PRI.p50);
      } else if (B && B.bloques && B.p_gana) {
        var dv = !dl && X.delta_vs_s0 ? X.delta_vs_s0 : null;
        o = { origen: 'bloque', MC: B.bloques.MC, MORENA_ALIADOS: B.bloques.MORENA_ALIADOS, PAN_PRI: B.bloques.PAN_PRI, pp_rango: 'bloque',
              p_gana: { MC: nul(B.p_gana.MC), MORENA_ALIADOS: nul(B.p_gana.MORENA_ALIADOS), PAN_PRI: nul(B.p_gana.PAN_PRI) },
              delta: { MC: dv && dv.MC ? dv.MC.p50 : null, MORENA_ALIADOS: dv && dv.MORENA_ALIADOS ? dv.MORENA_ALIADOS.p50 : null, PAN_PRI: dv && dv.PAN_PRI ? dv.PAN_PRI.p50 : null },
              crudo: B };
      }
      if (!o) return null;
      o.esc = id; o.boleta = b; o.clave = k; o.dl = dl; o.edad = edad; o.genero = genero;
      o.bloques = { MC: o.MC, MORENA_ALIADOS: o.MORENA_ALIADOS, PAN_PRI: o.PAN_PRI };
      o.eleccion = esEleccion(b, dl, edad, genero);
      o.tipo = tipoRecorte(b, dl, edad, genero).tipo;
      /* «Adelante en D9» solo vale para el voto del distrito entero: en un segmento (edad o género) no se pasa el lugar */
      o.veredicto = veredicto(o.p_gana, o.eleccion ? 'eleccion' : 'suma', (!edad && !genero) ? { dl: dl, boleta: b } : null);
      o.rotulo = rotulo(b, id, dl, edad, genero);
      return o;
    }
    /** Veredicto del recorte con el modo correcto ya elegido; en diputaciones sin distrito añade el reparto por distrito. */
    function veredictoDe(esc, b, dl, edad, genero) {
      if (esEstado(esc)) { genero = esc.genero; edad = esc.edad; dl = esc.d; b = esc.b; esc = esc.e; }
      var r = recorte(esc, b, dl, edad, genero); if (!r) return null;
      var v = r.veredicto; v.tipo = r.tipo;
      v.reparto = (r.tipo === 'suma_distritos') ? reparto(esc, b) : null;
      return v;
    }
    /** ¿Casi empate? (nadie queda primero en NOMBRES.UMBRAL.VENTAJA % o más de las corridas): entonces no se nombra a nadie. */
    function esParejo(ve) { return !!ve && (ve.nivel === 'empate' || ve.nivel === 'parejo'); }
    /** Quién va adelante en cada distrito y cuántos distritos suma cada bloque (conteo propio, no cifra del motor).
     *  lideres = el que queda primero en más corridas (dato, también en casi empate). conteo, orden y txt NO cuentan ni
     *  nombran los distritos en casi empate (regla del propietario): van en parejos y el texto dice «parejo en 1 (D8)». */
    function reparto(esc, b) {
      var ds = distritos(esc, b); if (!ds) return null;
      var lideres = {}, conteo = {}, parejos = [], rot = {};
      ds.forEach(function (d) {
        var l = d.veredicto.lider, par = esParejo(d.veredicto); lideres[d.dl] = l; rot[d.dl] = par ? 'PAREJO' : l;
        if (par) parejos.push(d.dl); else if (l != null) conteo[l] = (conteo[l] || 0) + 1;
      });
      return { esc: escId(esc), boleta: bol(b), n: ds.length, lideres: lideres, conteo: conteo, parejos: parejos,
               orden: Object.keys(conteo).map(function (k) { return [k, conteo[k]]; }).sort(function (a, c) { return c[1] - a[1]; }),
               txt: nm.resumenDistritos(rot, bol(b)) };
    }
    /**
     * Curules de la boleta (SPEC_curules): por distrito, el favorito (bloque con mayor probabilidad) para el centro de la
     * dona y partidos_p50 para el anillo. conteo = curules por favorito. exportado = lo que traiga el motor en «curules».
     * null para la alcaldía (no es un curul) o si la boleta no existe.
     */
    function curules(esc, b) {
      b = bol(b); if (!b || AMBITO_ELECCION[b] !== 'distrito') return null;
      var X = boleta(esc, b), ds = distritos(esc, b), e = escenario(esc); if (!X || !ds) return null;
      var conteo = {}, parejos = [];
      var lista = ds.map(function (d) {   /* conteo: curules por favorito SIN los distritos en casi empate (van en parejos) */
        var l = d.veredicto.lider, par = esParejo(d.veredicto);
        if (par) parejos.push(d.dl); else if (l != null) conteo[l] = (conteo[l] || 0) + 1;
        return { dl: d.dl, corto: d.corto, largo: d.largo, franja: d.franja, favorito: l, favorito_nombre: d.veredicto.nombre,
                 p: d.veredicto.p, nivel: d.veredicto.nivel, parejo: par, partidos_p50: d.partidos_p50, bloques: d.bloques, p_gana: d.p_gana,
                 exportado: d.curules, crudo: d.crudo };
      });
      var exp = has(X, 'curules') ? X.curules : (e && e.curules && typeof e.curules === 'object' ? nul(e.curules[b] !== undefined ? e.curules[b] : e.curules[jsonDe(b)]) : null);
      return { esc: escId(esc), boleta: b, distritos: lista, conteo: conteo, parejos: parejos, exportado: exp };
    }
    /** Una fila por escenario para la boleta y el ámbito dados (para la escalera y la gráfica de rangos). */
    function tablaEscenarios(b, dl) {
      b = bol(b); dl = normDl(dl);
      return escenarios().map(function (s) {
        var X = boleta(s.id, b);
        return { id: s.id, nombre: s.nombre, rotulo: s.rotulo, central: s.central, referencia: s.referencia, mueve: s.mueve[b],
                 recorte: recorte(s.id, b, dl),
                 margen: X && !dl && X.margen_mc_vs_morena_aliados ? X.margen_mc_vs_morena_aliados : null,
                 participacion: X && X.participacion ? X.participacion : null };
      });
    }

    /* ------------------------------------------------------------------ lista nominal y votos */
    /** Lista nominal del ámbito: suma de sim_v8.json → secciones.lista_nominal (respaldo: sim_agentes.json → distritos[].ln). */
    function listaNominal(dl) {
      dl = normDl(dl);
      var mk = 'ln|' + (dl || '*'); if (has(memo, mk)) return memo[mk];
      var d = v8(), s = d && d.secciones, tot = 0, n = 0, i, A = datos.agentes;
      if (s && Array.isArray(s.lista_nominal) && Array.isArray(s.dl)) {
        for (i = 0; i < s.lista_nominal.length; i++) if (!dl || String(s.dl[i]) === dl) { tot += s.lista_nominal[i]; n++; }
      } else if (A && Array.isArray(A.distritos)) {
        A.distritos.forEach(function (x) { if ((!dl || String(x.dl) === dl) && esNum(x.ln)) { tot += x.ln; n++; } });
      }
      memo[mk] = n ? tot : null;
      return memo[mk];
    }
    function nSecciones(dl) {
      dl = normDl(dl); var d = v8(), s = d && d.secciones, n = 0, i;
      if (!s || !Array.isArray(s.dl)) return null;
      for (i = 0; i < s.dl.length; i++) if (!dl || String(s.dl[i]) === dl) n++;
      return n;
    }
    /* Fracción de votos nulos (entre 0 y 1), si el motor la exporta: sim_v8.json → _meta.fraccion_nulos[b] o _meta.nulos[b].
       Es el mismo sitio donde la busca scripts/27_proyecciones.py. Hoy no existe: null. */
    function nulosDe(b) {
      var m = meta(), ks = ['fraccion_nulos', 'nulos'], j = jsonDe(b), i, d, k;
      if (!m) return null;
      for (i = 0; i < ks.length; i++) {
        d = m[ks[i]];
        if (!d || typeof d !== 'object') continue;
        k = has(d, b) ? b : j;
        if (esNum(d[k]) && d[k] >= 0 && d[k] < 1) return { valor: d[k], fuente: 'sim_v8.json → _meta.' + ks[i] + '.' + k };
      }
      return null;
    }
    function numDe(x) { return x && typeof x === 'object' ? (esNum(x.valor) ? x.valor : null) : (esNum(x) ? x : null); }
    function solo50(x) { return esNum(x) ? { p10: null, p50: x, p90: null } : null; }
    /* Votos de un distrito YA CALCULADOS en proyecciones.json (P2 · «Brecha en votos»), tal cual. Solo si ese archivo está
       cargado y es del mismo corte que el motor. P2 trae el detalle del distrito para su escenario (hoy el central) y,
       para los demás escenarios, solo la brecha en votos (por_escenario[esc].margen_votos_por_distrito). */
    function votosP2(id, b, dl) {
      var P = datos.proyecciones, P2 = proyeccion('P2'), B = P2 && P2.boletas ? P2.boletas[b] : null, c = corte();
      if (!B || typeof B !== 'object') return null;
      if (P && P._meta && P._meta.corte && c && P._meta.corte !== c) return null;      /* proyecciones de otro corte: no se mezclan */
      var ref = B.distritos && B.distritos[dl] && typeof B.distritos[dl] === 'object' ? B.distritos[dl] : null;
      var sup = ref && ref.participacion && ref.participacion.supuesto ? llano(ref.participacion.supuesto) : null;
      var det = ref && String(P2.escenario) === id ? ref : null, nu = numDe(B.nulos), calc = P2.como_se_calcula || null, m, pe, mv;
      /* ¿P2 se calculó con la misma participación del distrito que exporta el motor? Se contrasta en el escenario de P2;
         si el motor no la exporta no hay nada que contrastar. Sirve para no mezclar la brecha de P2 con votos de otra base. */
      var Xc = boleta(String(P2.escenario), b), Dc = Xc && Xc.distritos ? Xc.distritos[dl] : null;
      var pm = Dc && Dc.participacion ? Dc.participacion.p50 : null, pr = ref ? numDe(ref.participacion) : null;
      var misma = !esNum(pm) || (esNum(pr) && Math.abs(pr - pm) < 0.006);                /* P2 publica la participación con 2 decimales */
      if (det) {
        m = det.margen_mc_vs_morena_aliados || {};
        return { participacion: solo50(numDe(det.participacion)), votos: solo50(numDe(det.votos_validos)),
                 margen: solo50(numDe(m.pp)), brecha: solo50(numDe(m.votos)), supuesto: sup, crudo: det, nulos: nu, formula: calc, nota: null,
                 misma_participacion: misma,
                 fuente: ['proyecciones.json → P2.boletas.' + b + '.distritos.' + dl] };
      }
      pe = B.por_escenario ? B.por_escenario[id] : null;
      mv = pe && pe.margen_votos_por_distrito ? pe.margen_votos_por_distrito[dl] : null;
      if (!esNum(mv)) return null;
      return { participacion: null, votos: null, margen: null, brecha: solo50(mv), supuesto: sup, crudo: pe, nulos: nu, formula: calc,
               misma_participacion: misma,
               nota: nm.texto('SOLO_BRECHA_DISTRITO', SOLO_BRECHA_DISTRITO),
               fuente: ['proyecciones.json → P2.boletas.' + b + '.por_escenario.' + id + '.margen_votos_por_distrito.' + dl] };
    }
    /**
     * votos(esc, b, dl) · lista nominal, participación y votos estimados del ámbito.
     *
     * FÓRMULA   votos válidos ≈ lista nominal × participación ÷ 100 [× (1 − nulos)]   (para p10, p50 y p90 de la participación)
     *   lista nominal  = suma de sim_v8.json → secciones.lista_nominal de las secciones del ámbito (padrón INE, jul-2025)
     *   participación  = sim_v8.json → escenarios[esc].<boleta>.participacion (toda la ciudad) o
     *                    escenarios[esc].<boleta>.distritos[dl].participacion (si el motor la exporta), en % de la lista nominal
     *   brecha         = (margen MC − coalición de Morena) × votos válidos (p50) ÷ 100     (solo donde el motor exporta el margen)
     *
     * NULOS · El motor declara que sus porcentajes tienen por base la votación válida (_meta.validacion.sumas: cada celda
     *   suma 100) y no exporta la fracción de votos nulos (su bloque «Otros y nulos» no los separa). La especificación (P2)
     *   pide × (1 − nulos): mientras ese dato no exista NO se descuenta nada. Como la participación del motor ya es votos
     *   VÁLIDOS entre lista nominal (_meta.exportacion.campos), la cifra son votos válidos, no votos emitidos (corrección del
     *   20-nov). Se avisa en .aviso_nulos siempre que no se descuenta. Si el motor llega a exportar la fracción (nulosDe),
     *   se descuenta, se devuelve en .nulos y .aviso_nulos queda en null (OJO: antes de usarla, confirmar con quien mantiene
     *   el motor sobre qué base está esa fracción, para no descontar dos veces).
     * VOTOS DEL MOTOR · .votos_motor = escenarios[esc].<boleta>.votos_esperados (ciudad o distrito): votos válidos por bloque,
     *   promedio de las corridas, en personas. Es la cifra que enseñan las páginas; null si el motor no la exporta.
     *
     * POR DISTRITO · La capa solo calcula si el distrito trae su propia «participacion» (origen: 'motor'). Si no la trae, NO
     *   aplica la tasa de toda la ciudad (daría una cifra distinta de la de proyecciones.json y dos números para el mismo
     *   distrito): entrega los valores ya calculados de proyecciones.json → P2 cuando ese archivo está cargado
     *   (origen: 'proyecciones'; con su supuesto) y, si no, votos_validos = null y brecha = null (origen: 'sin_dato').
     *   El margen por distrito tampoco se exporta: con participación propia, la brecha es null salvo que P2 la traiga
     *   calculada con esa misma participación (brecha_origen: 'proyecciones'; si P2 usó otra, no se mezclan).
     *
     * No se redondea lo que calcula la capa: el formato lo pone la página. Las cifras de proyecciones.json vienen ya en enteros.
     */
    function votos(esc, b, dl) {
      if (esEstado(esc)) { dl = esc.d; b = esc.b; esc = esc.e; }
      var X = boleta(esc, b), id = escId(esc); b = bol(b); dl = normDl(dl);
      if (!X) return null;
      var D = dl ? (X.distritos && X.distritos[dl]) || null : null;
      if (dl && !D) return null;
      var jb = jsonDe(b), nu = nulosDe(b), fac = nu ? 1 - nu.valor : 1;
      var o = {
        esc: id, boleta: b, dl: dl, ambito: nm.ambito(dl, b),
        lista_nominal: D && esNum(D.lista_nominal) ? D.lista_nominal : listaNominal(dl),
        n_secciones: D ? D.n_secciones : nSecciones(null),
        origen: 'sin_dato', participacion: null, participacion_ambito: 'sin_dato',
        votos_validos: null, votos: null, margen: null, brecha: null, brecha_origen: null,
        formula: 'votos válidos ≈ lista nominal × participación ÷ 100' + (nu ? ' × (1 − nulos)' : ''),
        nulos: nu ? nu.valor : null, aviso_nulos: nu ? null : nm.texto('AVISO_NULOS', AVISO_NULOS),
        supuesto: null, nota: null, proyeccion: null, votos_motor: null,
        fuente: ['sim_v8.json → secciones.lista_nominal']
      };
      /* votos_motor: los votos válidos que el motor YA exporta (escenarios[esc].<boleta>.votos_esperados, de la ciudad o del
         distrito): por bloque, en personas, PROMEDIO de las corridas, sumados sección por sección. Es la cifra de votos que
         enseñan las páginas; lista nominal × participación (votos_validos) queda para el rango y la brecha. */
      var VE = X.votos_esperados, ve = VE && typeof VE === 'object' ? (dl ? (VE.distritos || {})[dl] : VE.ciudad) : null;
      if (ve && typeof ve === 'object' && Object.keys(ve).length && Object.keys(ve).every(function (k) { return esNum(ve[k]); })) {
        o.votos_motor = { total: Object.keys(ve).reduce(function (t, k) { return t + ve[k]; }, 0), bloques: ve, naturaleza: 'votos válidos · promedio de las corridas',
                          fuente: 'sim_v8.json → escenarios[' + id + '].' + jb + '.votos_esperados.' + (dl ? 'distritos.' + dl : 'ciudad') };
      }
      var part = dl ? (D.participacion && typeof D.participacion === 'object' ? D.participacion : null) : (X.participacion || null);
      if (part) {                                                  /* el motor da la participación de este ámbito: se calcula */
        var mar = (dl ? D.margen_mc_vs_morena_aliados : X.margen_mc_vs_morena_aliados) || null, vt = null, br = null;
        if (esNum(o.lista_nominal)) {
          vt = {}; ['p10', 'p50', 'p90'].forEach(function (q) { vt[q] = esNum(part[q]) ? o.lista_nominal * part[q] / 100 * fac : null; });
          if (mar && esNum(vt.p50)) { br = {}; ['p10', 'p50', 'p90'].forEach(function (q) { br[q] = esNum(mar[q]) ? mar[q] * vt.p50 / 100 : null; }); }
        }
        o.origen = 'motor'; o.participacion = part; o.participacion_ambito = 'propia';
        o.votos_validos = vt; o.votos = vt; o.margen = mar; o.brecha = br; o.brecha_origen = br ? 'motor' : null;
        o.fuente.push('sim_v8.json → escenarios[' + id + '].' + jb + (dl ? '.distritos[' + dl + ']' : '') + '.participacion');
        if (nu) o.fuente.push(nu.fuente);
        if (dl && !br) {
          /* El motor no exporta el margen por distrito: la brecha, si la hay, es la de proyecciones.json. Solo se toma si P2
             se calculó con la misma participación del distrito que exporta el motor: si no, no se mezclan (brecha = null). */
          var q = votosP2(id, b, dl);
          if (q && q.brecha && q.misma_participacion) {
            o.margen = q.margen; o.brecha = q.brecha; o.brecha_origen = 'proyecciones'; o.proyeccion = q.crudo; o.fuente = o.fuente.concat(q.fuente);
          } else o.nota = nm.texto('SIN_MARGEN_DISTRITO', SIN_MARGEN_DISTRITO);
        }
        return o;
      }
      if (!dl) return o;                                           /* la boleta no trae participación: sin dato */
      var p = votosP2(id, b, dl);                                  /* distrito sin participación propia: NO se aplica la municipal */
      if (p) {
        o.origen = 'proyecciones'; o.participacion = p.participacion; o.participacion_ambito = p.participacion ? 'proyecciones' : 'sin_dato';
        o.votos_validos = p.votos; o.votos = p.votos; o.margen = p.margen; o.brecha = p.brecha; o.brecha_origen = p.brecha ? 'proyecciones' : null;
        o.supuesto = p.supuesto; o.nota = p.nota; o.proyeccion = p.crudo; o.fuente = o.fuente.concat(p.fuente);
        o.formula = p.formula;                                     /* el cálculo es el de proyecciones.json (P2.como_se_calcula) */
        o.nulos = p.nulos; o.aviso_nulos = p.nulos != null ? null : nm.texto('AVISO_NULOS', AVISO_NULOS);   /* lo que haya descontado P2 */
        return o;
      }
      o.nota = nm.texto('SIN_PARTICIPACION_DISTRITO', SIN_PARTICIPACION_DISTRITO);
      return o;
    }

    /* ------------------------------------------------------------------ trayectoria, canales y sensibilidad */
    function mesCorto(m) { return String(m == null ? '' : m).split('-')[0]; }
    function evolEsc(esc) {
      var E = datos.evolucion, id = escId(esc), i;
      if (!E || !Array.isArray(E.escenarios)) return null;
      for (i = 0; i < E.escenarios.length; i++) if (E.escenarios[i].id === id) return E.escenarios[i];
      return null;
    }
    /**
     * trayectoria(esc, b) · «si la elección fuera en cada mes». Puntos mensuales del motor; el ÚLTIMO (junio, la elección)
     * toma los bloques y la participación del resultado de la boleta (todas las corridas), para que el final de la línea
     * coincida con las fichas. El punto original queda en .crudo. null si la boleta no existe.
     */
    function trayectoria(esc, b) {
      var X = boleta(esc, b); b = bol(b);
      if (!X || !Array.isArray(X.trayectoria)) return null;
      var m = meta() || {}, tr = X.trayectoria, n = tr.length, ev = evolEsc(esc), evp = ev && Array.isArray(ev[b]) ? ev[b] : null, E = datos.evolucion;
      var puntos = tr.map(function (t, i) {
        var fin = i === n - 1;
        var p = { i: i, mes: t.mes, etiqueta: i === 0 ? 'hoy' : mesCorto(t.mes), es_hoy: i === 0, es_eleccion: fin,
                  fecha: fin && E && E._meta && E._meta.eleccion ? E._meta.eleccion : (evp && evp[i] ? evp[i].fecha : (i === 0 ? corte() : null)),
                  corridas: fin ? nul(m.n_corridas) : nul(m.n_corridas_trayectoria), origen: fin && X.bloques ? 'bloques' : 'trayectoria', crudo: t };
        BLOQUES3.forEach(function (k) { p[k] = fin && X.bloques && X.bloques[k] ? X.bloques[k] : nul(t[k]); });
        p.participacion = fin && X.participacion ? X.participacion : nul(t.participacion);
        return p;
      });
      return { esc: escId(esc), boleta: b, puntos: puntos, meses: tr.map(function (t) { return t.mes; }),
               n_corridas: nul(m.n_corridas), n_corridas_trayectoria: nul(m.n_corridas_trayectoria),
               nota: 'Junio usa las mismas corridas que las fichas; los meses anteriores usan menos corridas.' };
    }
    function canalTxt(c) { var m = meta(); return llano((m && m.canales && m.canales[c]) || String(c).replace(/_/g, ' ')); }
    /** Aporte de cada canal, en puntos, tal cual lo da el motor (una fila por canal, en el orden del JSON). [] en S0. */
    function descomposicion(esc, b) {
      var X = boleta(esc, b);
      if (!X) return null;
      var dc = X.descomposicion || {};
      return Object.keys(dc).map(function (c) {
        var v = dc[c] || {};
        return { canal: c, nombre: canalTxt(c), MC: nul(v.MC), MORENA_ALIADOS: nul(v.MORENA_ALIADOS), PAN_PRI: nul(v.PAN_PRI),
                 OTROS: nul(v.OTROS), participacion: nul(v.participacion), crudo: v };
      });
    }
    function supuestoTxt(k) {
      if (has(SUPUESTO, k)) return SUPUESTO[k];
      if (String(k).indexOf('intensidad_') === 0) return 'Intensidad: ' + canalTxt(String(k).slice(11));
      return llano(String(k).replace(/_/g, ' '));
    }
    /**
     * sensibilidad(esc, b) · qué supuesto pesa más en el margen (correlación de rangos, tal cual). El motor la calcula
     * para el margen de la ALCALDÍA; con b = 'dip' o 'fed' devuelve null salvo que la exportación traiga su propio «tornado».
     */
    function sensibilidad(esc, b) {
      var e = escenario(esc), k = b == null ? 'ayun' : bol(b), X = boleta(esc, k), t = null;
      if (!e || !k) return null;
      if (X && Array.isArray(X.tornado)) t = X.tornado;
      else if (k === 'ayun' && Array.isArray(e.tornado)) t = e.tornado;
      if (!t) return null;
      return t.map(function (x) { return { supuesto: x.supuesto, nombre: supuestoTxt(x.supuesto), rho: x.rho, crudo: x }; });
    }
    function ladoBloque(s) {                                       /* a qué bloque pertenece un lado del flujo (para el color) */
      var t = String(s).trim();
      if (t === 'MC') return 'MC';
      if (t.indexOf('MORENA') === 0) return 'MORENA_ALIADOS';
      if (t.indexOf('PAN') === 0 || t.indexOf('PRI') === 0) return 'PAN_PRI';
      if (t === 'ABSTENCION') return 'ABSTENCION';
      if (t === 'oposicion') return 'OPOSICION';
      return 'OTROS';
    }
    function ladoTxt(s) {
      var t = String(s).trim();
      if (t === 'MC') return nm.nombre('MC');
      if (t === 'MORENA_ALIADOS') return nm.nombre('MORENA_ALIADOS');
      if (t === 'PAN/PRI' || t === 'PAN_PRI') return nm.nombre('PAN_PRI');
      if (t === 'OTROS/NULOS' || t === 'OTROS') return nm.nombre('OTROS').toLowerCase();
      if (t === 'ABSTENCION') return 'abstención';
      if (t === 'oposicion') return 'oposición';
      return t;
    }
    /** Votos que cambian de destino frente a la línea base (mediana), tal cual; con el texto llano de cada flujo. */
    function flujos(esc, b) {
      var X = boleta(esc, b);
      if (!X) return null;
      var fl = X.flujos || {};
      return Object.keys(fl).map(function (k) {
        var m = /^(.*?)->(.*?)(?:\s*\((.*)\))?$/.exec(k) || [k, k, '', ''], mot = m[3] ? llano(m[3]) : null, a = String(m[2]).trim();
        return { clave: k, de: String(m[1]).trim(), a: a, motivo: mot, origen_bloque: ladoBloque(m[1]), destino_bloque: ladoBloque(a),
                 texto: ladoTxt(m[1]) + ' → ' + ladoTxt(a) + (mot ? ' (' + mot + ')' : ''), votos: fl[k] };
      });
    }
    /** Los 12 segmentos de edad × género de la boleta, tal cual (o uno solo con edad y género). */
    function segmentos(esc, b, edad, genero) {
      var X = boleta(esc, b); if (!X || !Array.isArray(X.segmentos)) return null;
      edad = normEdad(edad); genero = normGenero(genero);
      if (!edad && !genero) return X.segmentos;
      return X.segmentos.filter(function (s) { return (!edad || s.edad === edad) && (!genero || s.genero === genero); });
    }
    /** Intensidad mensual de cada canal en el escenario (mediana), tal cual. */
    function perfil(esc) {
      var e = escenario(esc), d = v8(); if (!e) return null;
      var p = e.perfil || {};
      return Object.keys(p).map(function (c) { return { canal: c, nombre: canalTxt(c), serie: p[c], meses: (d && d.meses) || null }; });
    }
    function similitud() { var d = v8(); return (d && d.similitud) || null; }
    function edades() {
      var A = datos.agentes, es = listaEsc(), out = [], X, i;
      if (A && A._meta && Array.isArray(A._meta.bandas_edad)) return A._meta.bandas_edad.slice();
      for (i = 0; i < es.length && !out.length; i++) {
        X = es[i][jsonDe('ayun')] || es[i][jsonDe('dip')];
        if (X && Array.isArray(X.segmentos)) X.segmentos.forEach(function (s) { if (out.indexOf(s.edad) < 0) out.push(s.edad); });
      }
      return out;
    }

    /* ------------------------------------------------------------------ secciones */
    function secciones() { var d = v8(); return (d && d.secciones) || null; }
    function idxSeccion(id) {
      var s = secciones(); if (!s || !Array.isArray(s.ids)) return -1;
      if (!memo.sec) { memo.sec = {}; s.ids.forEach(function (x, i) { memo.sec[String(x)] = i; }); }
      return has(memo.sec, String(id)) ? memo.sec[String(id)] : -1;
    }
    /**
     * seccion(id, esc) · los datos de una sección, tal cual: todos los campos por sección que traiga el motor
     * (dl, exposicion_agua, lista_nominal, s0_mc_ayun…) y, con esc, los del escenario (d_mc_ayun, p_mc_ayun, d_mc_dip y,
     * si la exportación los trae, d_mc_fed…). En S0 no hay cambios que mostrar: .escenario = null.
     */
    function seccion(id, esc) {
      var s = secciones(), i = idxSeccion(id); if (i < 0) return null;
      var o = { id: s.ids[i], i: i, escenario: null };
      Object.keys(s).forEach(function (k) { if (k !== 'ids' && Array.isArray(s[k]) && s[k].length === s.ids.length) o[k] = s[k][i]; });
      var E = esc != null && s.escenarios ? s.escenarios[escId(esc)] : null;
      if (E) { o.escenario = {}; Object.keys(E).forEach(function (k) { if (Array.isArray(E[k])) o.escenario[k] = nul(E[k][i]); }); }
      return o;
    }
    /** Serie por sección de un campo: campoSeccion('lista_nominal') o campoSeccion('d_mc_ayun','S4'). null si no existe. */
    function campoSeccion(campo, esc) {
      var s = secciones(); if (!s) return null;
      if (esc == null) return Array.isArray(s[campo]) ? s[campo] : null;
      var E = s.escenarios && s.escenarios[escId(esc)];
      return E && Array.isArray(E[campo]) ? E[campo] : null;
    }
    function seccionesDe(dl) {
      var s = secciones(); dl = normDl(dl); if (!s || !Array.isArray(s.ids)) return null;
      return s.ids.filter(function (x, i) { return !dl || String(s.dl[i]) === dl; });
    }
    function seccionesResumen(esc) { var e = escenario(esc); return (e && e.secciones_resumen) || null; }   /* solo alcaldía */
    function seccionesTop(esc) { var e = escenario(esc); return (e && e.secciones_top) || null; }           /* solo alcaldía */

    /* ------------------------------------------------------------------ perfiles de votante (agentes) y zonas */
    /** Partido que encabeza las preferencias de partida del perfil en la boleta (priors_<b>); null si no hay dato. */
    function liderAgente(a, b) {
      var v = a ? a['priors_' + (bol(b) || 'dip')] : null, m = null, mx = -Infinity, p;
      if (!v || typeof v !== 'object') return null;
      for (p in v) if (has(v, p) && esNum(v[p]) && v[p] > mx) { mx = v[p]; m = p; }
      return m;
    }
    function pasaFiltro(x, f, b) {
      if (f.dl != null && normDl(f.dl) && String(x.dl) !== normDl(f.dl)) return false;
      var z = f.zona != null ? f.zona : f.cluster;
      if (z != null && z !== '' && x.cluster !== z) return false;
      if (normEdad(f.edad) && x.edad !== normEdad(f.edad)) return false;
      if (normGenero(f.genero) && x.genero !== normGenero(f.genero)) return false;
      if (f.lider != null && f.lider !== '' && liderAgente(x, b) !== f.lider) return false;
      if (f.id != null && x.id !== f.id) return false;
      return true;
    }
    /** agentes({dl, zona, edad, genero, lider, boleta}) · los perfiles de votante que cumplen el filtro (objetos crudos). */
    function agentes(f) {
      var A = datos.agentes; if (!A || !Array.isArray(A.agentes)) return null;
      f = f || {};
      return A.agentes.filter(function (a) { return pasaFiltro(a, f, f.boleta); });
    }
    /** Cuántos perfiles y cuánta lista nominal (suma de «peso») hay en el filtro. */
    function resumenAgentes(f) {
      var l = agentes(f); if (!l) return null;
      return { n: l.length, lista_nominal: l.reduce(function (s, a) { return s + (esNum(a.peso) ? a.peso : 0); }, 0) };
    }
    /** Cambio del perfil en un escenario y una boleta: respuesta_v8[esc].d_mc_<b> y d_mor_<b> (null si el motor no lo da). */
    function respuestaAgente(a, esc, b) {
      var r = a && a.respuesta_v8 ? a.respuesta_v8[escId(esc)] : null; b = bol(b);
      if (!r || !b) return null;
      return { d_mc: nul(r['d_mc_' + b]), d_mor: nul(r['d_mor_' + b]), crudo: r };
    }
    function listaZonas() {
      var A = datos.agentes; if (!A || !Array.isArray(A.distritos)) return null;
      if (!memo.zonas) { memo.zonas = []; A.distritos.forEach(function (d) { (d.clusters || []).forEach(function (c) { memo.zonas.push(c); }); }); }
      return memo.zonas;
    }
    /** zonas({dl}) · las zonas del modelo (clústeres), objetos crudos de sim_agentes.json → distritos[].clusters[]. */
    function zonas(f) {
      var l = listaZonas(); if (!l) return null;
      var dl = f ? normDl(f.dl) : null;
      return dl ? l.filter(function (c) { return String(c.dl) === dl; }) : l.slice();
    }
    function zona(id) { var l = listaZonas(), i; if (!l) return null; for (i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
    /** Voto de la zona en el escenario y la boleta: sim_v8.json → escenarios[esc].<boleta>.clusters[id], tal cual. */
    function zonaVoto(esc, b, id) { var X = boleta(esc, b); return X && X.clusters && has(X.clusters, id) ? X.clusters[id] : null; }
    /** Lectura por zona (sim_corridas.json) y lectura en cinco voces (sim_concilio.json) de una zona. */
    function zonaLectura(id) {
      var C = datos.corridas, K = datos.concilio, o = { corrida: null, deliberacion: null }, i;
      if (C && Array.isArray(C.corridas)) for (i = 0; i < C.corridas.length; i++) if (C.corridas[i].cluster === id) { o.corrida = C.corridas[i]; break; }
      if (K && Array.isArray(K.deliberaciones)) for (i = 0; i < K.deliberaciones.length; i++) if (K.deliberaciones[i].cluster === id) { o.deliberacion = K.deliberaciones[i]; break; }
      return o;
    }
    /** Info del distrito en sim_agentes.json (k, silueta, n_secciones, ln, clusters), tal cual. */
    function distritoZonas(dl) {
      var A = datos.agentes, i; dl = normDl(dl); if (!A || !Array.isArray(A.distritos)) return null;
      for (i = 0; i < A.distritos.length; i++) if (String(A.distritos[i].dl) === dl) return A.distritos[i];
      return null;
    }
    /** grupos({dl, zona, edad, genero}) · grupos clave de sim_escenarios.json (objetos crudos, en el orden del JSON). */
    function grupos(f) {
      var E = datos.escenarios; if (!E || !Array.isArray(E.grupos_clave)) return null;
      f = f || {};
      return E.grupos_clave.filter(function (g) { return pasaFiltro(g, { dl: f.dl, zona: f.zona, cluster: f.cluster, edad: f.edad, genero: f.genero, id: f.id }); });
    }
    /** microGrupos({dl, zona, edad, genero, seccion}) · sección × edad × género de sim_escenarios.json (objetos crudos). */
    function microGrupos(f) {
      var E = datos.escenarios; if (!E || !Array.isArray(E.micro_grupos)) return null;
      f = f || {};
      return E.micro_grupos.filter(function (g) {
        if (f.seccion != null && String(g.seccion) !== String(f.seccion)) return false;
        return pasaFiltro(g, { dl: f.dl, zona: f.zona, cluster: f.cluster, edad: f.edad, genero: f.genero });
      });
    }

    /* ------------------------------------------------------------------ grupos por lugar (motor v8.1): tipos de sección, zonas y secciones
       Archivos: grupos_descripcion.json (nombres, nivel aproximado, lo que destaca y los segmentos por edad) · grupos_variables.json
       y uno por distrito (todas las variables: valor, posición frente a la ciudad y diferencia) · sim_secciones.json y uno por
       escenario (predicción por sección con su rango) · sim_grupos_seccion_D<dl>.json (los 12 grupos de edad y género de cada sección).
       Los archivos por distrito y por escenario se piden cuando hacen falta. Lo que la capa CALCULA aquí está dicho en cada función:
       la suma de votos de un tipo de sección, el voto y la participación por EDAD (mujeres y hombres juntos, igual que
       scripts/33_grupos_descripcion.py) y el conteo de secciones por bloque que va adelante. */
    var NIVELES = ['tipos', 'zonas', 'secciones'];
    var BLOQUES_SECC = [['mc', 'MC'], ['mor', 'MORENA_ALIADOS'], ['pp', 'PAN_PRI'], ['otros', 'OTROS']];   /* clave del archivo → clave del tablero */
    function arr(x) { return Array.isArray(x) ? x : []; }
    function numFinal(s) { var m = /(\d+)\s*$/.exec(String(s)); return m ? parseInt(m[1], 10) : 0; }
    function claveBloque(k) { var i; for (i = 0; i < BLOQUES_SECC.length; i++) if (BLOQUES_SECC[i][0] === k) return BLOQUES_SECC[i][1]; return null; }
    function GD() { return datos.grupos_desc || null; }
    function GV() { return datos.grupos_var || null; }
    function SI() { return datos.secc_indice || null; }
    /** estadoCarga(clave o archivo) · 'sin_pedir' | 'cargando' | 'listo' | 'falta' (se pidió y no llegó). Para pintar «cargando» y «sin datos». */
    function estadoCarga(k) {
      if (k == null || k === '') return 'falta';
      k = clave(k);
      if (!promesas[k] && !has(datos, k)) return 'sin_pedir';
      if (!has(datos, k)) return 'cargando';
      return datos[k] != null ? 'listo' : 'falta';
    }
    /* Nombre de cada archivo partido: el que da el índice ya cargado; si el índice aún no está, el nombre de siempre. */
    function archivoSecciones(esc) {
      var id = escId(esc), I = SI(), L = I && I._meta && I._meta.archivos, i;
      if (!id) return null;
      if (Array.isArray(L)) { for (i = 0; i < L.length; i++) if (L[i] && String(L[i].escenario) === id) return L[i].archivo; return null; }
      return 'sim_secciones_' + id + '.json';
    }
    function archivoVariables(dl) {
      var d = normDl(dl), V = GV(), L = V && V._meta && V._meta.archivos, i;
      if (!d) return null;
      if (Array.isArray(L)) { for (i = 0; i < L.length; i++) if (L[i] && String(L[i].distrito) === d) return L[i].archivo; return null; }
      return 'grupos_variables_D' + d + '.json';
    }
    function archivoGruposSeccion(dl) { var d = normDl(dl); return d ? 'sim_grupos_seccion_D' + d + '.json' : null; }
    function cargaUno(a) { return a ? cargar([a]).then(function (r) { return r[clave(a)]; }) : Promise.resolve(null); }
    /** cargarGrupos() · nombres, variables de tipos y zonas e índice de secciones (3 archivos). Nunca rechaza. */
    function cargarGrupos() { return cargar(['grupos_desc', 'grupos_var', 'secc_indice']); }
    /** cargarSecciones(esc) · la predicción por sección de UN escenario (sim_secciones_<esc>.json). Promise con el JSON o null. */
    function cargarSecciones(esc) { return cargaUno(archivoSecciones(esc)); }
    /** cargarVariables(dl) · todas las variables de las secciones de UN distrito (grupos_variables_D<dl>.json). */
    function cargarVariables(dl) { return cargaUno(archivoVariables(dl)); }
    /** cargarGruposSeccion(dl) · los 12 grupos de edad y género de las secciones de UN distrito (sim_grupos_seccion_D<dl>.json). */
    function cargarGruposSeccion(dl) { return cargaUno(archivoGruposSeccion(dl)); }
    function estadoSecciones(esc) { return estadoCarga(archivoSecciones(esc)); }
    function estadoVariables(dl) { return estadoCarga(archivoVariables(dl)); }
    function estadoGruposSeccion(dl) { return estadoCarga(archivoGruposSeccion(dl)); }
    /** gruposMeta() · {descripcion, variables, secciones}: los _meta de los tres archivos (reglas, naturaleza de cada cifra, límites). */
    function gruposMeta() {
      var G = GD(), V = GV(), I = SI();
      return { descripcion: (G && G._meta) || null, variables: (V && V._meta) || null, secciones: (I && I._meta) || null };
    }
    /** gruposCiudad() · la ficha de toda la ciudad de grupos_descripcion.json, tal cual (ln, v, alcaldía 2024 y 2027 en S1, por_sexo). */
    function gruposCiudad() { var G = GD(); return (G && G.ciudad) || null; }
    /** grupos12() · los 12 grupos de edad y género de la ciudad, tal cual: {clave, nombre, edad, genero, ln, edad_part, edad_mc, edad_mor, edad_pp, medios_supuesto}. */
    function grupos12() { var G = GD(); return G && Array.isArray(G.grupos12) ? G.grupos12 : null; }
    /** gruposEscenario() · el escenario en que grupos_descripcion.json publica el voto de la alcaldía de tipos, zonas y sus segmentos por edad
     *  (lo dice el nombre de su campo «alcaldia_2027_<escenario>»; hoy, el central). null si no se puede leer. */
    function gruposEscenario() {
      var c = gruposCiudad(), k, m;
      for (k in (c || {})) { m = /^alcaldia_\d{4}_(S\d+)$/.exec(k); if (m) return m[1]; }
      return null;
    }
    /** escenariosPorGrupo(dl) · los escenarios en que el motor publica el voto de cada grupo de sección (hoy S0 y S1). [] si el archivo no está. */
    function escenariosPorGrupo(dl) {
      var d = normDl(dl), F = d ? dato(archivoGruposSeccion(d)) : null;
      return arr(F && F._meta && F._meta.escenarios_con_voto).slice();
    }
    /** edadTxt('18-24') → «18 a 24 años» · '65+' → «65 años o más» (como los nombres de grupos12). */
    function edadTxt(e) {
      var s = String(e == null ? '' : e), m = /^(\d+)\s*-\s*(\d+)$/.exec(s), n = /^(\d+)\s*\+$/.exec(s);
      return m ? m[1] + ' a ' + m[2] + ' años' : (n ? n[1] + ' años o más' : s);
    }
    /** gruposIds(nivel, {dl}) · ids de 'tipos' (no siguen el distrito), 'zonas' o 'secciones' (del distrito, si se da), en orden estable. */
    function gruposIds(nivel, f) {
      var G = GD(), dl = normDl(f && f.dl), n = NOM(), orden = (n && n.DISTRITOS) || [], I, ids;
      if (!G || NIVELES.indexOf(nivel) < 0 || !G[nivel]) return null;
      if (nivel === 'tipos') return Object.keys(G.tipos).sort(function (a, b) { return numFinal(a) - numFinal(b); });
      if (nivel === 'zonas') {
        return Object.keys(G.zonas).filter(function (k) { return !dl || String(G.zonas[k].dl) === dl; }).sort(function (a, b) {
          var da = orden.indexOf(String(G.zonas[a].dl)), db = orden.indexOf(String(G.zonas[b].dl));
          return (da - db) || (numFinal(a) - numFinal(b));
        });
      }
      I = SI(); ids = I && Array.isArray(I.ids) ? I.ids : Object.keys(G.secciones);
      return ids.filter(function (id) { var s = G.secciones[id]; return !!s && (!dl || String(s.dl) === dl); });
    }
    /**
     * grupo(nivel, id) · la descripción de un tipo de sección, una zona o una sección (grupos_descripcion.json), con su título:
     * sección → «Sección 570 · Ladrón de Guevara» y de subtítulo su nombre descriptivo; zona → «Zona Rancho Nuevo – Oblatos»
     * (el código va aparte, en «codigo»); tipo → su nombre descriptivo y de subtítulo «Colonias como …». Las cifras van tal cual en «crudo».
     */
    function grupo(nivel, id) {
      var G = GD(), k = String(id), r, o;
      if (!G || NIVELES.indexOf(nivel) < 0 || !G[nivel] || !has(G[nivel], k)) return null;
      r = G[nivel][k];
      o = { nivel: nivel, id: k, nombre: r.nombre, nse: nul(r.nse), edad: nul(r.edad), destaca: arr(r.destaca), lista_nominal: nul(r.ln),
            dl: r.dl != null ? String(r.dl) : null, zona: r.zona || null, tipo: r.tipo || null, colonia: r.colonia || null,
            colonias: Array.isArray(r.colonias) ? r.colonias : null, lugar: r.lugar || null, codigo: null, numero: null,
            n_secciones: nivel === 'secciones' ? 1 : nul(r.secciones), sin_censo: nivel === 'secciones' ? !!r.sin_censo : false,
            sin_censo_pct: nivel === 'secciones' ? null : nul(r.sin_censo_pct), grupos_ln: Array.isArray(r.g_ln) ? r.g_ln : null, crudo: r };
      if (nivel === 'secciones') { o.titulo = 'Sección ' + k + (o.colonia ? ' · ' + o.colonia : ''); o.subtitulo = r.nombre; }
      else if (nivel === 'zonas') { o.titulo = 'Zona ' + (o.lugar || k); o.subtitulo = r.nombre; o.codigo = k; }
      else { o.numero = numFinal(k); o.titulo = r.nombre; o.subtitulo = r.como ? 'Colonias como ' + r.como : null; }
      return o;
    }
    function serie3(o, i) { return o && Array.isArray(o.p50) ? { p10: o.p10 ? nul(o.p10[i]) : null, p50: nul(o.p50[i]), p90: o.p90 ? nul(o.p90[i]) : null } : null; }
    function posiciones(k, ids) { if (!memo[k]) { memo[k] = {}; arr(ids).forEach(function (id, i) { memo[k][String(id)] = i; }); } return memo[k]; }
    function archivoEsc(esc) { var a = archivoSecciones(esc); return a ? dato(a) : null; }
    /**
     * prediccionSeccion(esc, b, id) · la predicción del motor para UNA sección, tal cual (sim_secciones_<esc>.json): MC, MORENA_ALIADOS,
     * PAN_PRI y OTROS con {p10, p50, p90}; margen (MC menos la coalición de Morena) con rango; p_primero (% de corridas en que cada bloque
     * queda primero); adelante (el bloque con más corridas en primer lugar); participacion con rango; validos y votos por bloque
     * (PROMEDIO de las corridas, en personas); d_mc y d_margen (cambio frente a S0). null si ese escenario no está cargado.
     */
    function prediccionSeccion(esc, b, id) {
      var eid = escId(esc), S = archivoEsc(eid), X, i, orden, ad, pos;
      b = bol(b);
      if (!S || !b || !S[b] || !Array.isArray(S.ids)) return null;
      pos = posiciones('secc_' + eid, S.ids); i = pos[String(id)]; X = S[b];
      if (i == null) return null;
      orden = (S._meta && S._meta.bloques_que_pueden_ir_adelante) || ['mc', 'mor', 'pp'];
      ad = X.adelante && X.adelante[i] != null ? claveBloque(orden[X.adelante[i]]) : null;
      var o = { esc: eid, boleta: b, nivel: 'secciones', id: String(id), origen: 'seccion', estadistico: 'mediana', rango: true,
               MC: serie3(X.mc, i), MORENA_ALIADOS: serie3(X.mor, i), PAN_PRI: serie3(X.pp, i), OTROS: serie3(X.otros, i),
               margen: serie3(X.margen, i),
               p_primero: X.p_primero ? { MC: nul(X.p_primero.mc[i]), MORENA_ALIADOS: nul(X.p_primero.mor[i]), PAN_PRI: nul(X.p_primero.pp[i]) } : null,
               adelante: ad, participacion: serie3(X.part, i), validos: X.validos ? nul(X.validos[i]) : null,
               votos: X.votos ? { MC: nul(X.votos.mc[i]), MORENA_ALIADOS: nul(X.votos.mor[i]), PAN_PRI: nul(X.votos.pp[i]), OTROS: nul(X.votos.otros[i]) } : null,
               d_mc: X.d_mc ? nul(X.d_mc[i]) : null, d_margen: X.d_margen ? nul(X.d_margen[i]) : null };
      return parejoSeccion(o);
    }
    /* Regla de «parejo» en una sección (la misma de veredicto en modo 'suma': NOMBRES.UMBRAL.VENTAJA): el que queda primero en más
       corridas solo se nombra si queda primero en VENTAJA % o más de las corridas Y tiene la mediana más alta. Si no, parejo = true y
       segundo = el otro bloque con más corridas en primer lugar. Añade parejo, segundo, umbral_parejo y regla_parejo. */
    function parejoSeccion(o) {
      var ve = o.p_primero ? veredicto(o.p_primero, 'suma') : null, U = nm.umbral(), maxMed = null;
      BLOQUES3.forEach(function (k) { if (o[k] && esNum(o[k].p50) && (maxMed == null || o[k].p50 > maxMed)) maxMed = o[k].p50; });
      o.umbral_parejo = U.VENTAJA;
      o.segundo = ve ? (ve.lider === o.adelante ? ve.segundo : ve.lider) : null;
      o.parejo = !o.adelante || !ve || ve.nivel !== 'mas_votos' || ve.lider !== o.adelante || !(o[o.adelante] && o[o.adelante].p50 === maxMed);
      o.regla_parejo = !o.adelante || !ve ? null : (ve.nivel !== 'mas_votos' ? 'corridas' : (ve.lider !== o.adelante ? 'lider' : (o.parejo ? 'mediana' : null)));
      return o;
    }
    /**
     * seccionBase(b, id) · de qué dato parte la sección en esa boleta (sim_secciones.json, no cambia con el escenario):
     * {lista_nominal, lista_nominal_en_grupos, sin_censo, dato (código), dato_texto (cómo se lee), validos_2024, fraccion_estimada,
     *  peso_propio, n_vecinas, resultado_2024: {MC, MORENA_ALIADOS, PAN_PRI}}.
     */
    function seccionBase(b, id) {
      var I = SI(), i, Q, M, cod, r24;
      b = bol(b);
      if (!I || !Array.isArray(I.ids)) return null;
      i = posiciones('secc_idx', I.ids)[String(id)];
      if (i == null) return null;
      Q = (I.calidad && b && I.calidad[b]) || {}; M = (I._meta && I._meta.calidad && I._meta.calidad.dato) || {};
      cod = Q.dato && Q.dato[i] != null && Array.isArray(M.codigos) ? M.codigos[Q.dato[i]] : null; r24 = Q.resultado_2024;
      return { id: String(id), boleta: b, dl: I.dl ? String(I.dl[i]) : null, zona: I.zona ? I.zona[i] : null,
               lista_nominal: I.lista_nominal ? nul(I.lista_nominal[i]) : null,
               lista_nominal_en_grupos: I.lista_nominal_en_grupos ? nul(I.lista_nominal_en_grupos[i]) : null,
               sin_censo: !!(I.sin_censo && I.sin_censo[i]), dato: cod || null, dato_texto: cod && M.se_lee ? (M.se_lee[cod] || null) : null,
               validos_2024: Q.validos_2024 ? nul(Q.validos_2024[i]) : null, fraccion_estimada: Q.fraccion_estimada ? nul(Q.fraccion_estimada[i]) : null,
               peso_propio: Q.peso_propio ? nul(Q.peso_propio[i]) : null, n_vecinas: Q.n_vecinas ? nul(Q.n_vecinas[i]) : null,
               resultado_2024: r24 && r24.mc ? { MC: nul(r24.mc[i]), MORENA_ALIADOS: nul(r24.mor[i]), PAN_PRI: nul(r24.pp[i]) } : null };
    }
    function adelanteDe(o) {   /* el bloque con la cifra más alta y su ventaja sobre el segundo (para tipos y zonas, que no traen corridas) */
      var l = BLOQUES3.map(function (k) { return { k: k, v: o[k] ? o[k].p50 : null }; }).filter(function (x) { return esNum(x.v); })
        .sort(function (a, c) { return c.v - a.v; });
      var V = GV(), u = V && V._meta && V._meta.voto_sin_rango ? V._meta.voto_sin_rango.parejo_menos_de_puntos : null;
      o.adelante = l.length ? l[0].k : null; o.segundo = l.length > 1 ? l[1].k : null;
      o.ventaja = l.length > 1 ? l[0].v - l[1].v : null;
      /* sin rango: «parejo» si los dos primeros quedan a menos del umbral declarado en grupos_variables.json (_meta.voto_sin_rango);
         sin ese archivo cargado no se sabe (null) y la pantalla no nombra a nadie */
      o.umbral_parejo = esNum(u) ? u : null;
      o.parejo = !o.adelante ? true : (esNum(o.ventaja) && esNum(u) ? o.ventaja < u : (esNum(o.ventaja) ? null : false));
      return o;
    }
    /**
     * prediccionGrupo(esc, b, nivel, id) · el voto estimado de un grupo en el escenario y la boleta, diciendo de dónde sale:
     *   'secciones' → prediccionSeccion (mediana y rango de las corridas; origen 'seccion', rango true);
     *   'zonas'     → sim_v8.json · clusters (mediana, la misma cifra que las páginas de zonas; sin rango; origen 'zona_motor');
     *   'tipos'     → SUMA de los votos estimados de sus secciones entre la suma de sus votos válidos (lo calcula la capa con los votos
     *                 por sección, que son el promedio de las corridas; sin rango; origen 'suma_secciones'). Pide ese escenario cargado.
     * En tipos y zonas, adelante = el bloque con la cifra más alta y ventaja = su diferencia con el segundo.
     */
    function prediccionGrupo(esc, b, nivel, id) {
      var eid = escId(esc), G = GD(), S, X, v, o, ids, tot, n, pos;
      b = bol(b);
      if (!b || !eid) return null;
      if (nivel === 'secciones') return prediccionSeccion(eid, b, id);
      if (nivel === 'zonas') {
        v = zonaVoto(eid, b, String(id)); if (!v) return null;
        o = { esc: eid, boleta: b, nivel: nivel, id: String(id), origen: 'zona_motor', estadistico: 'mediana', rango: false,
              margen: null, p_primero: null, participacion: null, validos: null, votos: null, d_mc: nul(v.d_mc), d_margen: null };
        BLOQUES3.forEach(function (k) { o[k] = esNum(v[k]) ? { p10: null, p50: v[k], p90: null } : null; });
        return adelanteDe(o);
      }
      if (nivel !== 'tipos' || !G || !G.secciones) return null;
      S = archivoEsc(eid); X = S && S[b];
      if (!X || !X.votos || !Array.isArray(S.ids)) return null;
      pos = posiciones('secc_' + eid, S.ids);
      ids = Object.keys(G.secciones).filter(function (s) { return G.secciones[s].tipo === String(id); });
      tot = { MC: 0, MORENA_ALIADOS: 0, PAN_PRI: 0, OTROS: 0 }; n = 0;
      ids.forEach(function (s) {
        var i = pos[s]; if (i == null) return;
        n++;
        BLOQUES_SECC.forEach(function (q) { var x = X.votos[q[0]] ? X.votos[q[0]][i] : null; if (esNum(x)) tot[q[1]] += x; });
      });
      v = tot.MC + tot.MORENA_ALIADOS + tot.PAN_PRI + tot.OTROS;
      if (!n || !v) return null;
      o = { esc: eid, boleta: b, nivel: nivel, id: String(id), origen: 'suma_secciones', estadistico: 'promedio', rango: false, n_secciones: n,
            margen: null, p_primero: null, participacion: null, validos: v, votos: tot, d_mc: null, d_margen: null };
      BLOQUES3.forEach(function (k) { o[k] = { p10: null, p50: 100 * tot[k] / v, p90: null }; });
      return adelanteDe(o);
    }
    /** resumenSecciones(esc, b, dl) · cuántas secciones del ámbito encabeza cada bloque (conteo de la capa sobre «adelante»), sin contar
     *  las parejas (regla de parejoSeccion): {n, adelante: {MC, MORENA_ALIADOS, PAN_PRI}, parejo, umbral_parejo}. n = adelante + parejo. */
    function resumenSecciones(esc, b, dl) {
      var ids = gruposIds('secciones', { dl: dl }), o = { n: 0, adelante: { MC: 0, MORENA_ALIADOS: 0, PAN_PRI: 0 }, parejo: 0, umbral_parejo: nm.umbral().VENTAJA };
      if (!ids || !archivoEsc(esc)) return null;
      ids.forEach(function (id) { var p = prediccionSeccion(esc, b, id); if (p && p.adelante) { o.n++; if (p.parejo) o.parejo++; else o.adelante[p.adelante]++; } });
      return o.n ? o : null;
    }
    function filasVariables(V, u) {
      var C = V.ciudad || {}, alto = arr(u.alto), bajo = arr(u.bajo);
      return V.variables.map(function (d, i) {
        var ia = alto.indexOf(i), ib = bajo.indexOf(i);
        return { i: i, def: d, clave: d.clave, bloque: d.bloque, v: u.v ? nul(u.v[i]) : null, p: u.p ? nul(u.p[i]) : null, d: u.d ? nul(u.d[i]) : null,
                 ciudad: C.v ? nul(C.v[i]) : null, destaca: ia >= 0 ? 'alto' : (ib >= 0 ? 'bajo' : null), orden: ia >= 0 ? ia : (ib >= 0 ? ib : null),
                 parcial: (u.parciales && u.parciales[d.clave]) || null, parcial_ciudad: (C.parciales && C.parciales[d.clave]) || null };
      });
    }
    /**
     * variablesGrupo(nivel, id) · TODAS las variables de un grupo (grupos_variables.json; en secciones, el archivo de su distrito):
     * {nivel, id, listo, filas, bloques: [{bloque, texto, filas}], n_destaca, marcas, sin_censo, sin_negocios, ln_sin_censo_pct, unidad}.
     * Cada fila: {def (la variable: nombre, detalle, unidad, decimales, fuente, naturaleza…), v, p, d, ciudad, destaca: 'alto' | 'bajo' | null,
     * orden (su lugar en la lista de lo que destaca), parcial, parcial_ciudad}. Cifras tal cual (4 decimales o más); la pantalla redondea una vez.
     * nivel 'ciudad' da la fila de la ciudad; 'origen_sin_censo', el grupo de 2020 que sirve de referencia a las secciones sin censo.
     * En una sección cuyo archivo de distrito no está cargado devuelve {listo: false, dl}.
     */
    function variablesGrupo(nivel, id) {
      var V = GV(), k = String(id == null ? '' : id), u = null, g, F, a, filas, ord, M;
      if (!V || !Array.isArray(V.variables)) return null;
      if (nivel === 'ciudad') u = V.ciudad;
      else if (nivel === 'origen_sin_censo') u = V.origen_sin_censo;
      else if (nivel === 'tipos' || nivel === 'zonas') u = V[nivel] ? V[nivel][k] : null;
      else if (nivel === 'secciones') {
        g = grupo('secciones', k); a = g && g.dl ? archivoVariables(g.dl) : null; F = a ? dato(a) : null;
        if (!F) return g ? { nivel: nivel, id: k, listo: false, dl: g.dl, estado: a ? estadoCarga(a) : 'falta' } : null;
        u = F.secciones ? F.secciones[k] : null;
      }
      if (!u) return null;
      filas = filasVariables(V, u); M = V._meta || {};
      ord = arr(M.bloques).map(function (b) { return { bloque: b.bloque, texto: b.texto, filas: filas.filter(function (f) { return f.bloque === b.bloque; }) }; });
      filas.forEach(function (f) {   /* un bloque que no esté en la lista del _meta no se pierde */
        if (!ord.some(function (b) { return b.bloque === f.bloque; })) ord.push({ bloque: f.bloque, texto: null, filas: filas.filter(function (x) { return x.bloque === f.bloque; }) });
      });
      return { nivel: nivel, id: k, listo: true, filas: filas, bloques: ord, n_destaca: arr(u.alto).length + arr(u.bajo).length,
               marcas: arr(u.marcas), sin_censo: nivel === 'secciones' ? arr(u.marcas).indexOf('sin_censo') >= 0 : arr(u.sin_censo),
               sin_negocios: nivel === 'secciones' ? arr(u.marcas).indexOf('sin_negocios') >= 0 : arr(u.sin_negocios),
               ln_sin_censo_pct: nul(u.ln_sin_censo_pct), lista_nominal: nul(u.ln), n_secciones: nul(u.n), nota: u.nota || null, unidad: u };
    }
    /* Voto y participación por EDAD con mujeres y hombres juntos. Si el motor publica el % de cada celda (B.pct) y su participación
       (B.part), se juntan las dos celdas con esas cifras: voto = % de cada celda pesado por sus votantes estimados; participación =
       la de cada celda pesada por su lista nominal. Así no se arrastra el redondeo de los votos a enteros (m1 del 18-nov). Sin esas
       series, se suman los votos enteros de las dos celdas (la cuenta de scripts/33). */
    function porEdad(ln, B, j) {
      var a = 2 * j, c = 2 * j + 1, l = (ln[a] || 0) + (ln[c] || 0), vt, tv = 0, vb = {}, o, wa, wc;
      if (!B || !B.votos) return null;
      vt = (B.votantes ? (B.votantes[a] || 0) + (B.votantes[c] || 0) : null);
      BLOQUES_SECC.forEach(function (q) { var x = B.votos[q[0]]; vb[q[1]] = x ? (x[a] || 0) + (x[c] || 0) : 0; tv += vb[q[1]]; });
      o = { participacion: l && esNum(vt) ? 100 * vt / l : null, votantes: vt, votos: tv };
      if (B.part && esNum(B.part[a]) && esNum(B.part[c]) && l) o.participacion = (B.part[a] * (ln[a] || 0) + B.part[c] * (ln[c] || 0)) / l;
      wa = B.votantes ? B.votantes[a] || 0 : 0; wc = B.votantes ? B.votantes[c] || 0 : 0;
      if (B.pct && wa + wc > 0 && BLOQUES_SECC.every(function (q) { return q[1] === 'OTROS' || (B.pct[q[0]] && esNum(B.pct[q[0]][a]) && esNum(B.pct[q[0]][c])); })) {
        BLOQUES3.forEach(function (k) { var q = BLOQUES_SECC.filter(function (x) { return x[1] === k; })[0]; o[k] = (B.pct[q[0]][a] * wa + B.pct[q[0]][c] * wc) / (wa + wc); });
        o.de = 'pct';
      } else {
        BLOQUES3.forEach(function (k) { o[k] = tv ? 100 * vb[k] / tv : null; });
        o.de = 'votos';
      }
      return o;
    }
    /**
     * gruposEdad(nivel, id, b) · los 12 grupos de edad y género de un grupo, por edad: tamaño REAL de mujeres y de hombres (lista nominal)
     * y, de la edad con mujeres y hombres juntos, participación (supuesto del motor) y voto estimado por bloque.
     *   'secciones' → de sim_grupos_seccion_D<dl>.json, en la boleta pedida y en los escenarios que el motor publica por grupo (S0 y S1);
     *                 la capa suma las dos celdas de cada edad. cambio.MC[esc] y cambio.MORENA_ALIADOS[esc] = cambio frente a S0 en cada
     *                 escenario, promedio de las dos celdas ponderado por sus votantes estimados en S0 (aproximación de la capa).
     *                 Si el archivo del distrito no está cargado: {listo: false, dl, tamanos (de grupos_descripcion.json)}.
     *   'tipos' y 'zonas' → de grupos_descripcion.json (segmentos_tipo, segmentos_zona): solo Alcaldía en S1 (fijo: true).
     * Devuelve {nivel, id, listo, boleta, escenarios, fijo, filas: [{edad, edad_txt, mujeres, hombres, lista_nominal, por_esc: {S1: {participacion, MC, MORENA_ALIADOS, PAN_PRI}}, cambio}]}.
     */
    function gruposEdad(nivel, id, b) {
      var G = GD(), k = String(id), g12 = grupos12() || [], eds = [], g, F, i, B, ln, segs, out;
      g12.forEach(function (x) { if (eds.indexOf(x.edad) < 0) eds.push(x.edad); });
      if (!G || !eds.length) return null;
      if (nivel === 'tipos' || nivel === 'zonas') {
        segs = G[nivel === 'tipos' ? 'segmentos_tipo' : 'segmentos_zona']; segs = segs ? segs[k] : null;
        if (!Array.isArray(segs)) return null;
        var ee = gruposEscenario() || central();
        return { nivel: nivel, id: k, listo: true, boleta: 'ayun', escenarios: [ee], fijo: true, filas: eds.map(function (e, j) {
          var m = segs[2 * j] || {}, h = segs[2 * j + 1] || {}, pe = {};
          pe[ee] = { participacion: nul(m.edad_part), MC: nul(m.edad_mc), MORENA_ALIADOS: nul(m.edad_mor), PAN_PRI: nul(m.edad_pp) };
          return { edad: e, edad_txt: edadTxt(e), mujeres: nul(m.ln), hombres: nul(h.ln), lista_nominal: (m.ln || 0) + (h.ln || 0), por_esc: pe, cambio: null };
        }) };
      }
      if (nivel !== 'secciones') return null;
      g = grupo('secciones', k); b = bol(b);
      if (!g || !b) return null;
      F = g.dl ? dato(archivoGruposSeccion(g.dl)) : null;
      out = { nivel: nivel, id: k, listo: false, dl: g.dl, boleta: b, escenarios: [], fijo: false,
              tamanos: g.grupos_ln ? eds.map(function (e, j) { return { edad: e, edad_txt: edadTxt(e), mujeres: nul(g.grupos_ln[2 * j]), hombres: nul(g.grupos_ln[2 * j + 1]) }; }) : null, filas: null };
      if (!F || !Array.isArray(F.ids) || !F[b]) return out;
      i = posiciones('gsec_' + g.dl, F.ids)[k];
      if (i == null) return out;
      B = F[b]; ln = arr(F.ln[i]);
      out.listo = true;
      out.escenarios = arr(F._meta && F._meta.escenarios_con_voto).filter(function (e) { return !!B[e]; });
      out.filas = eds.map(function (e, j) {
        var f = { edad: e, edad_txt: edadTxt(e), mujeres: nul(ln[2 * j]), hombres: nul(ln[2 * j + 1]), lista_nominal: (ln[2 * j] || 0) + (ln[2 * j + 1] || 0), por_esc: {}, cambio: { MC: {}, MORENA_ALIADOS: {} } };
        out.escenarios.forEach(function (e2) {
          var X = B[e2];
          f.por_esc[e2] = porEdad(ln, { votantes: X.votantes ? X.votantes[i] : null, votos: { mc: X.votos.mc[i], mor: X.votos.mor[i], pp: X.votos.pp[i], otros: X.votos.otros[i] },
            part: X.part ? X.part[i] : null, pct: X.pct ? { mc: X.pct.mc[i], mor: X.pct.mor[i], pp: X.pct.pp[i] } : null }, j);
        });
        var w = B.S0 && B.S0.votantes ? [B.S0.votantes[i][2 * j] || 0, B.S0.votantes[i][2 * j + 1] || 0] : null, sw = w ? w[0] + w[1] : 0;
        [['d_mc', 'MC'], ['d_mor', 'MORENA_ALIADOS']].forEach(function (q) {
          var Dq = B[q[0]];
          if (!Dq || !sw) return;
          Object.keys(Dq).forEach(function (e3) {
            var r = Dq[e3][i];
            if (r && esNum(r[2 * j]) && esNum(r[2 * j + 1])) f.cambio[q[1]][e3] = (w[0] * r[2 * j] + w[1] * r[2 * j + 1]) / sw;
          });
        });
        return f;
      });
      return out;
    }
    /**
     * segmentosZona({dl}) · los segmentos zona × edad × género de grupos_descripcion.json (336 en la ciudad), con el lugar de su zona:
     * [{zona, lugar, dl, grupo (nombre del grupo de edad y género), edad, genero, nombre (el publicado), lista_nominal (dato),
     *   participacion (de su edad, supuesto del motor), MC, MORENA_ALIADOS, PAN_PRI (voto estimado de su edad, mujeres y hombres juntos)}].
     * Solo Alcaldía en el escenario central (no sigue la boleta ni el escenario).
     */
    function segmentosZona(f) {
      var G = GD(), ids = gruposIds('zonas', f || {}), g12 = grupos12() || [], out = [];
      if (!G || !G.segmentos_zona || !ids) return null;
      ids.forEach(function (z) {
        arr(G.segmentos_zona[z]).forEach(function (s, j) {
          var g = g12[j] || {};
          out.push({ zona: z, lugar: G.zonas[z].lugar || null, dl: String(G.zonas[z].dl), j: j, grupo: g.nombre || null, edad: g.edad || null, genero: g.genero || null,
                     nombre: s.nombre, lista_nominal: nul(s.ln), participacion: nul(s.edad_part), MC: nul(s.edad_mc), MORENA_ALIADOS: nul(s.edad_mor), PAN_PRI: nul(s.edad_pp), crudo: s });
        });
      });
      return out;
    }
    /**
     * gruposSeccionDistrito(dl, b, esc) · los 12 grupos de CADA sección del distrito (sim_grupos_seccion_D<dl>.json), uno por fila:
     * [{seccion, j, grupo, edad, genero, lista_nominal (dato), participacion, MC, MORENA_ALIADOS, PAN_PRI (de su edad en la sección,
     *   mujeres y hombres juntos; la capa suma las dos celdas)}]. esc = 'S0' o 'S1' (los que el motor publica por grupo). null si falta el archivo.
     */
    function gruposSeccionDistrito(dl, b, esc) {
      var d = normDl(dl), F = d ? dato(archivoGruposSeccion(d)) : null, g12 = grupos12() || [], eid = escId(esc), B, X, out = [];
      b = bol(b);
      if (!F || !b || !F[b] || !Array.isArray(F.ids)) return null;
      B = F[b]; X = B[eid];
      if (!X || !X.votos) return null;
      F.ids.forEach(function (id, i) {
        var ln = arr(F.ln[i]), ed = [], j;
        for (j = 0; j < ln.length / 2; j++) ed.push(porEdad(ln, { votantes: X.votantes ? X.votantes[i] : null, votos: { mc: X.votos.mc[i], mor: X.votos.mor[i], pp: X.votos.pp[i], otros: X.votos.otros[i] },
            part: X.part ? X.part[i] : null, pct: X.pct ? { mc: X.pct.mc[i], mor: X.pct.mor[i], pp: X.pct.pp[i] } : null }, j));
        ln.forEach(function (n, q) {
          var g = g12[q] || {}, e = ed[Math.floor(q / 2)] || {};
          out.push({ seccion: String(id), dl: d, j: q, grupo: g.nombre || null, edad: g.edad || null, genero: g.genero || null, lista_nominal: nul(n),
                     participacion: nul(e.participacion), MC: nul(e.MC), MORENA_ALIADOS: nul(e.MORENA_ALIADOS), PAN_PRI: nul(e.PAN_PRI) });
        });
      });
      return out;
    }

    /* ------------------------------------------------------------------ evolución 2021–2027 y proyecciones */
    /**
     * evolucion(b) · resultados oficiales, encuestas y la serie mensual de cada escenario (sim_evolucion.json), tal cual.
     * Encuestas: las que el generador asigna a la boleta en _meta.encuestas_por_boleta (las de esa boleta más las
     * genéricas), con su nota; si ese dato no existe, todas. Si la boleta no tiene serie, .disponible = false,
     * .oficiales = null y cada escenario trae puntos = null (.sin_serie dice por qué, si el generador lo anotó).
     */
    function evolucion(b) {
      var E = datos.evolucion; b = bol(b); if (!E || !b) return null;
      var m = E._meta || {}, todas = E.encuestas || [], ids = m.encuestas_por_boleta ? m.encuestas_por_boleta[b] : null;
      var enc = Array.isArray(ids) ? todas.filter(function (q) { return ids.indexOf(q.id) >= 0; }) : (m.encuestas_por_boleta ? [] : todas);
      var esc = (E.escenarios || []).map(function (e) {
        return { id: e.id, nombre: e.nombre, rotulo: nm.escenario(e), puntos: Array.isArray(e[b]) ? e[b] : null,
                 eleccion: (e.eleccion && e.eleccion[b]) || null, crudo: e };
      });
      var ofi = (E.oficiales && E.oficiales[b]) || null;
      return { boleta: b, meta: E._meta || null, corte: (E._meta && E._meta.corte) || null, eleccion: (E._meta && E._meta.eleccion) || null,
               oficiales: ofi, encuestas: enc, encuestas_todas: todas,
               nota_encuestas: (m.nota_encuestas && m.nota_encuestas[b]) || null, sin_serie: (m.sin_serie && m.sin_serie[b]) || null,
               escenarios: esc,
               disponible: !!ofi || esc.some(function (e) { return !!e.puntos; }) };
    }
    /** proyeccion('P1') · el bloque de proyecciones.json (lo genera scripts/27_proyecciones.py). null si aún no existe. */
    function proyeccion(id) {
      var P = datos.proyecciones, i; if (!P) return null;
      if (id == null) return P;
      if (has(P, id)) return P[id];
      if (P.proyecciones && typeof P.proyecciones === 'object') {
        if (!Array.isArray(P.proyecciones)) return has(P.proyecciones, id) ? P.proyecciones[id] : null;
        for (i = 0; i < P.proyecciones.length; i++) if (P.proyecciones[i] && P.proyecciones[i].id === id) return P.proyecciones[i];
      }
      return null;
    }

    /* ------------------------------------------------------------------ textos */
    /** Texto de la franja: «D13 · solo su franja de Guadalajara (73 secc.; cab. Tlaquepaque)» y su nota, con el número del JSON. */
    function textoFranja(b, dl) {
      b = bol(b) || 'dip'; dl = normDl(dl) || '13';
      var d = bloqueDistrito(dl), n = NOM(), L = n && n.DISTRITO_LOCAL && n.DISTRITO_LOCAL[dl];
      var ns = d && esNum(d.n_secciones) ? d.n_secciones : (L && L.n_secc != null ? L.n_secc : null);
      var fr = esFranja(dl), o = { boleta: b, dl: dl, franja: fr, n_secciones: ns, lista_nominal: listaNominal(dl), texto: '', corto: '', nota: '', nota_federal: null };
      if (!fr) return o;
      var notaL = nm.texto('NOTA_D' + dl, '');
      if (L && L.n_secc != null && ns != null && ns !== L.n_secc) notaL = notaL.replace(String(L.n_secc) + ' secciones', String(ns) + ' secciones');
      o.texto = nm.distrito(dl, false, ns);
      o.corto = b === 'fed' ? nm.distritoFederal(dl, true) : nm.distrito(dl, true);
      o.nota = notaL;
      if (b === 'fed') {                                            /* el distrito federal 13 no es el D13 local, pero el motor cuenta las mismas secciones */
        o.texto = nm.distritoFederal(dl, false); o.nota_federal = nm.texto('NOTA_DF' + dl, '');
        o.nota = o.corto + ': aquí solo cuenta su franja de Guadalajara' + (ns != null ? ' (' + ns + ' secciones)' : '') + '.';
      }
      return o;
    }
    function segmentoTxt(edad, genero) {
      edad = normEdad(edad); genero = normGenero(genero);
      var g = genero ? (GENERO_TXT[genero] || genero) : '';
      return [g, edad ? edad + ' años' : ''].filter(function (x) { return x; }).join(' de ');
    }
    /** Rótulo [BOLETA · ESCENARIO · ÁMBITO] de NOMBRES, más el segmento si lo hay: «ALCALDÍA · S1 · D9 · mujeres de 18-24 años». */
    function rotulo(b, esc, dl, edad, genero) {
      var s = segmentoTxt(edad, genero);
      return nm.rotulo(bol(b) || b, escId(esc), normDl(dl) || '') + (s ? ' · ' + s : '');
    }
    /** describe(b, esc, dl, edad, genero) o describe(PP.estado) · qué se está viendo, con sus nombres, su rótulo y si es una elección. */
    function describe(b, esc, dl, edad, genero) {
      if (esEstado(b)) { genero = b.genero; edad = b.edad; dl = b.d; esc = b.e; b = b.b; }
      var k = bol(b), id = escId(esc) || central(), e = escenario(id), i = nm.boleta(k);
      return { boleta: i ? { clave: k, json: i.json, corto: i.corto, largo: i.largo, chip: i.chip, primera: i.primera || i.largo } : null,
               boleta_disponible: !!boleta(id, k),
               escenario: e ? { id: e.id, nombre: e.nombre, rotulo: nm.escenario(e), central: e.id === central(), referencia: e.id === 'S0' } : null,
               dl: normDl(dl), ambito: nm.ambito(normDl(dl) || '', k || 'ayun'), segmento: segmentoTxt(edad, genero),
               rotulo: rotulo(k, id, dl, edad, genero), corte: corte(), corte_texto: corteTexto(),
               eleccion: esEleccion(k, dl, edad, genero), tipo: tipoRecorte(k, dl, edad, genero) };
    }
    function acentua(w, antes) {
      var l = w.toLowerCase(), r = has(ACENTOS, l) ? ACENTOS[l] : null;
      if (r && has(PUEDE_SER_VERBO, l) && antes != null && TRAS_PRONOMBRE.test(antes)) return w;   /* «se numero», «lo computo» */
      if (!r && /[cs]ion$/.test(l)) r = l.slice(0, -2) + 'ón';      /* -cion / -sion → -ción / -sión */
      if (!r) return w;
      if (w === w.toUpperCase() && w.length > 1) return r.toUpperCase();
      return w.charAt(0) === w.charAt(0).toUpperCase() ? r.charAt(0).toUpperCase() + r.slice(1) : r;
    }
    /** sinAliados(t) · SA-PAR-07 (24-nov-2026, orden del propietario: «lo subí y viene eso de morena y aliados etc. en mapa»). Los JSON
     *  del motor (sim_v8, sim_concilio, sim_corridas, sim_escenarios, proyecciones…) no se pueden regenerar sin relanzarlo y traen
     *  «Morena y aliados», «PAN y PRI» y las claves MORENA_ALIADOS / PAN_PRI. Aquí se nombran por sus partidos, con la nomenclatura única:
     *    · al empezar frase → «La coalición de Morena»; tras preposición, conjunción o verbo («de», «para», «y», «gana»…) → «la coalición
     *      de Morena»; en listas, rótulos y tras «:», «·», «,», «(», «=», «–» → «Coalición de Morena» (NOMBRES.nombre);
     *    · «el bloque PAN y PRI» → «la coalición PAN-PRI»; «candidatura Morena y aliados» → «coalición de Morena»;
     *    · «favorito» detrás de una coalición → «favorita»; «PAN y PRI van primero y le sacan» → «… va primero y le saca»;
     *    · «sin aliados» → «sin coalición». En versalitas («GANA MORENA Y ALIADOS») sale en versalitas.
     *    · «PAN y PRI» como lista de partidos («MC, PAN y PRI», «votantes de PAN y PRI») se deja: no es la coalición. */
    var RE_COAL = /(\b(?:[Ee]l|[Dd]el|[Aa]l|[Uu]n)\s+bloque\s+|\b(?:[Ll]a|[Dd]e la|[Aa] la)\s+candidatura\s+|\b[Cc]andidatura\s+|\b[Bb]loque\s+)?(Morena\s*(?:y|\+)\s*(?:sus\s+)?aliados|MORENA\s*(?:Y|\+)\s*ALIADOS|\bMORENA_ALIADOS\b|\bPAN\s*(?:y|Y|\+|\/)\s*PRI\b|\bPAN_PRI\b)(\s+favorit[oa]s?\b|\s+FAVORIT[OA]S?\b|\s+van primero y le sacan\b|\s+van\b)?/gi;
    var ART_COAL = /^(?:de|a|para|con|sin|entre|frente|por|sobre|contra|que|y|o|e|u|ante|hacia|menos|son|está|están|queda|quedan|iría|irían|gana|ganaría|ganan|ganó|supera|superan|como|según|sea|es|era|fue|será|quien|vence|en|hasta|desde|tras|cuando|si|ni|pero|mientras|aunque|donde|porque|pues)$/i;
    function sinAliados(t) {
      var s = String(t);
      s = s.replace(RE_COAL, function (todo, pre, nom, suf, pos, txt) {
        var k = /pan/i.test(nom) ? 'PAN_PRI' : 'MORENA_ALIADOS', may = /ALIADOS| Y /.test(nom) && !/_/.test(nom);
        /* «PAN y PRI» como LISTA de partidos («le quita votos a MC, PAN y PRI», «votantes de PAN y PRI») no es la coalición: se deja */
        if (!pre && /^PAN\s+y\s+PRI$/.test(nom) && (/(?:MC|Morena|PT|PVEM|Hagamos\/Futuro),\s*$/.test(txt.slice(0, pos)) ||
            /\b(?:votantes|electores|militantes|simpatizantes|bases?)\s+de\s*$/i.test(txt.slice(0, pos)))) return todo;
        var etiqueta = nm.nombre(k), corto = etiqueta.charAt(0).toLowerCase() + etiqueta.slice(1);    /* «coalición de Morena» */
        var antes = txt.slice(0, pos), out;
        if (pre) {
          var p = pre.trim().toLowerCase().replace(/\s+/g, ' '), art = { 'el bloque': 'la ', 'del bloque': 'de la ', 'al bloque': 'a la ', 'un bloque': 'una ',
            'la candidatura': 'la ', 'de la candidatura': 'de la ', 'a la candidatura': 'a la ' }[p];
          out = (art || '') + corto;
          if (/^[A-ZÁÉÍÓÚ]/.test(pre)) out = out.charAt(0).toUpperCase() + out.slice(1);
        } else {
          var ult = (/([A-Za-zÁÉÍÓÚáéíóúñÑü]+)\s*$/.exec(antes) || [])[1] || '', fin = antes.replace(/\s+$/, '');
          if (/^\s*[\d−+\-]/.test(txt.slice(pos + todo.length)) || (!fin && !txt.slice(pos + todo.length).trim())) out = etiqueta;   /* «… 42 %» o el nombre solo: rótulo */
          else if (!fin || /[.!?]$/.test(fin)) out = 'La ' + corto;                              /* empieza frase */
          else if (/[:·,;(=–—\-\/|»«"]$/.test(fin) || /\d\s*%?$/.test(fin)) out = etiqueta;          /* lista o rótulo */
          else if (ART_COAL.test(ult) && /[A-Za-zÁÉÍÓÚáéíóúñÑü]$/.test(fin)) out = 'la ' + corto;         /* «de la coalición de Morena» */
          else out = etiqueta;
        }
        if (suf) {
          if (/favorit/i.test(suf)) suf = ' favorita';
          else if (/sacan/.test(suf)) suf = ' va primero y le saca';
          else suf = ' va';
        }
        out += suf || '';
        return may ? out.toUpperCase() : out;
      });
      return s.replace(/\bsin aliados\b/g, 'sin coalición').replace(/\bSIN ALIADOS\b/g, 'SIN COALICIÓN');
    }
    /** llano(t) · quita los códigos internos (N-xx, SA-xx), pone acentos y cambia la jerga por la nomenclatura única. */
    function llano(t) {
      if (t == null) return '';
      var s = String(t), ini;
      ini = /^\s*N-\d+(?:\s*(?:,|y)\s*N-\d+)*\s*:\s*/.exec(s);                                   /* «N-02 y N-03: en lugar…» */
      if (ini) { s = s.slice(ini[0].length); s = s.charAt(0).toUpperCase() + s.slice(1); }
      s = s.replace(/\s*\((?:N|SA)-\d+(?:\s*(?:,|y)\s*(?:N|SA)-\d+)*\)/g, '')                     /* «(N-02)», «(SA-08)» */
           .replace(/,\s*(?:N|SA)-\d+(?=\))/g, '')                                                  /* «(… saldo, N-06)» */
           .replace(/Supuesto SA-\d+\s*:/g, 'Supuesto:')
           .replace(/\s*Supuesto SA-\d+\.?/g, '')
           .replace(/\s*\b(?:N|SA)-\d+\b[.:]?/g, '')
           .replace(/\s*\(pendiente_de_exportacion\)/g, '');                                       /* marca interna de proyecciones.json */
      s = s.replace(/(r)ango p10\s*[-–]\s*p90/gi, function (_, r) { return r + 'ango de ' + nm.texto('CORRIDAS_80', '8 de cada 10 corridas'); })
           .replace(/p10\s*[-–]\s*p90/gi, nm.texto('CORRIDAS_80', '8 de cada 10 corridas'))
           .replace(/Morena \(sola\)/g, nm.nombre('MORENA'));                                    /* SA-PAR-04 (24-nov): el partido es «Morena» */
      s = sinAliados(s)                                                                           /* SA-PAR-07 (24-nov): sin «y aliados» */
           .replace(/OTROS\/NULOS/g, nm.nombre('OTROS').toLowerCase())
           .replace(/\bABSTENCION\b/g, 'abstención')
           .replace(/(votaci[oó]n(?:es)?)(\s+)valida(s?)(?![A-Za-zñÑáéíóúü_\/\-])/gi, function (_, a, e, p) {            /* «valida» sola puede ser verbo */
             return a + e + (a === a.toUpperCase() ? 'VÁLIDA' + p.toUpperCase() : 'válida' + p);
           });
      s = s.replace(/[A-Za-zñÑ]+/g, function (w, pos, todo) {      /* palabras sueltas; no rutas, dominios ni claves */
        var a = pos > 0 ? todo.charAt(pos - 1) : '', z = todo.charAt(pos + w.length), z2 = todo.charAt(pos + w.length + 1);
        if (/[\w\/.\-áéíóúüÁÉÍÓÚÜ]/.test(a) || /[\w\/\-áéíóúüÁÉÍÓÚÜ]/.test(z) || (z === '.' && /[A-Za-z]/.test(z2))) return w;
        return acentua(w, todo.slice(Math.max(0, pos - 24), pos));
      });
      return s.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([.,;:)])(?=\s|$)/g, '$1').replace(/\(\s+/g, '(').trim();
    }

    /* ================================================================== diseño del 20-nov-2026 (SA-SEC-23 a SA-SEC-32)
       Tres familias de accesos nuevos: (a) capas temáticas del Mapa; (b) lo que necesita el simulador (chat) de Simulación; (c) mapa de
       grupos sexo × edad y tabla «Análisis por grupos de edad». Todo sale de los JSON ya exportados; lo que calcula la capa va rotulado. */

    /* ------------------------------------------------------------------ (a) capas temáticas del Mapa */
    /** capasTematicas() · las capas del panel «Filtrar» del Mapa, en el orden del PDF, con sus variables elegibles (de grupos_variables.json:
        bloques del censo, padrón, agua y negocios; el nivel socioeconómico, de grupos_descripcion.json). «Sentimiento digital» va inactiva:
        las menciones se miden por canal, tema y actor, no por sección. Sin grupos_variables.json cargado, las variables salen vacías y listo = false. */
    function capasTematicas() {
      var V = GV(), G = GD(), vars = V && Array.isArray(V.variables) ? V.variables : [];
      return CAPAS_TEMATICAS.map(function (c) {
        var o = { clave: c.clave, nombre: c.nombre, activa: !c.inactiva, listo: !c.inactiva && !!V, bloques: (c.bloques || []).slice(), variables: [], defecto: c.defecto || null,
                  motivo: c.motivo || null, enlace: c.enlace || null, enlace_texto: c.enlace_texto || null };
        if (c.inactiva) return o;
        if (c.extra && c.extra.indexOf('nse') >= 0) { var dn = defNse(); if (dn && G) o.variables.push(dn); }
        vars.forEach(function (d) {
          if (d.tipo === 'conteo' || d.comparable === false) return;            /* conteos (habitantes, negocios…): dependen del tamaño de la sección */
          if ((c.bloques && c.bloques.indexOf(d.bloque) >= 0) || (c.claves && c.claves.indexOf(d.clave) >= 0)) o.variables.push(d);
        });
        if (c.claves) o.variables.sort(function (a, b) { return c.claves.indexOf(a.clave) - c.claves.indexOf(b.clave); });
        if (!o.variables.some(function (d) { return d.clave === o.defecto; })) o.defecto = o.variables.length ? o.variables[0].clave : null;
        return o;
      });
    }
    function capaTematica(clave) { var l = capasTematicas(), i; for (i = 0; i < l.length; i++) if (l[i].clave === clave) return l[i]; return null; }
    /* «nse»: el índice 0 a 100 y la etiqueta (bajo … muy alto) de grupos_descripcion.json; no es el nivel AMAI (lo dice su _meta) */
    function defNse() {
      var G = GD(); if (!G) return null;
      var R = (G._meta && G._meta.reglas && G._meta.reglas.nivel_socioeconomico_aproximado) || {}, nat = G._meta && G._meta.naturaleza ? arr(G._meta.naturaleza.etiqueta)[0] : null;
      return { clave: 'nse', nombre: 'Nivel socioeconómico aproximado', detalle: R.indice ? 'Índice de 0 a 100: ' + R.indice + '.' : null, bloque: 'Nivel socioeconómico',
               tipo: 'índice', unidad: '', decimales: 0, fuente: 'Censo de Población y Vivienda 2020 (INEGI), estadísticas por sección electoral; regla de este tablero',
               anio: '2020', naturaleza: 'etiqueta propia', nota: nat || null, categorias: NSE_CATEGORIAS.slice(), cortes_categoria: arr(R.cortes_del_indice), origen: 'grupos_descripcion' };
    }
    function defVariable(clave) {
      if (clave === 'nse') return defNse();
      var V = GV(), i; if (!V || !Array.isArray(V.variables)) return null;
      for (i = 0; i < V.variables.length; i++) if (V.variables[i].clave === clave) return V.variables[i];
      return null;
    }
    function idxVariable(clave) { var V = GV(), i; if (!V || !Array.isArray(V.variables)) return -1; for (i = 0; i < V.variables.length; i++) if (V.variables[i].clave === clave) return i; return -1; }
    /* cuartiles para la leyenda (cálculo de la capa, solo para colorear): sobre las secciones del ámbito con dato */
    function cuartiles(vals) {
      var v = vals.filter(esNum).sort(function (a, b) { return a - b; }); if (!v.length) return null;
      function q(f) { var x = (v.length - 1) * f, i = Math.floor(x), r = x - i; return i + 1 < v.length ? v[i] + (v[i + 1] - v[i]) * r : v[i]; }
      return [q(0.25), q(0.5), q(0.75)];
    }
    /**
     * valoresCapa(variable, dl) · el valor de una variable en cada sección del ámbito (dl vacío = las 985), para colorear el mapa:
     * {variable (su definición: nombre, unidad, decimales, fuente, anio, naturaleza…), dl, listo, faltan (distritos cuyo archivo aún no está),
     *  ids, valores, posiciones (0 a 100 frente a la ciudad, del JSON), categorias (solo «nse»), n, n_sin_dato, ciudad, escala {min, max},
     *  clases [{desde, hasta}] y clase (índice de clase por sección, o null sin dato), clases_origen, fuente, anio, naturaleza}.
     * Cifras tal cual (la pantalla redondea una vez con variable.decimales). Las clases son cuartiles del ámbito (cálculo de la capa, solo para la
     * leyenda); en «nse», las seis categorías de grupos_descripcion.json. null si la variable no existe o no están sim_v8.json y grupos_variables.json.
     */
    function valoresCapa(variable, dl) {
      var def = defVariable(variable), S = secciones(); dl = normDl(dl);
      if (!def || !S || !Array.isArray(S.ids)) return null;
      var ids = [], valores = [], pos = [], cats = [], faltan = [], esNse = variable === 'nse', G = GD(), j = esNse ? -1 : idxVariable(variable), F = {};
      S.ids.forEach(function (id, i) {
        var d = String(S.dl[i]); if (dl && d !== dl) return;
        var k = String(id), v = null, p = null, c = null;
        if (esNse) { var g = G && G.secciones ? G.secciones[k] : null; v = g && esNum(g.indice) ? g.indice : null; c = g && g.nse ? g.nse : null; }
        else {
          if (!has(F, d)) { var a = archivoVariables(d); F[d] = a ? dato(a) : null; if (!F[d] && faltan.indexOf(d) < 0) faltan.push(d); }
          var u = F[d] && F[d].secciones ? F[d].secciones[k] : null;
          v = u && u.v ? nul(u.v[j]) : null; p = u && u.p ? nul(u.p[j]) : null;
        }
        ids.push(k); valores.push(esNum(v) ? v : null); pos.push(esNum(p) ? p : null); if (esNse) cats.push(c);
      });
      var con = valores.filter(esNum), clases, clase, C = GV() && GV().ciudad;
      if (esNse) {
        clases = NSE_CATEGORIAS.map(function (t, i) { var cc = def.cortes_categoria; return { t: t, desde: i ? nul(cc[i - 1]) : null, hasta: i < cc.length ? nul(cc[i]) : null }; });
        clase = cats.map(function (c) { var i = NSE_CATEGORIAS.indexOf(c); return i >= 0 ? i : null; });
      } else {
        var q = cuartiles(con), mn = con.length ? Math.min.apply(null, con) : null, mx = con.length ? Math.max.apply(null, con) : null;
        clases = q ? [{ desde: mn, hasta: q[0] }, { desde: q[0], hasta: q[1] }, { desde: q[1], hasta: q[2] }, { desde: q[2], hasta: mx }] : [];
        clase = valores.map(function (v) { return !q || !esNum(v) ? null : (v <= q[0] ? 0 : (v <= q[1] ? 1 : (v <= q[2] ? 2 : 3))); });
      }
      return { variable: def, dl: dl, listo: !faltan.length && (!esNse || !!G), faltan: faltan, ids: ids, valores: valores, posiciones: pos, categorias: esNse ? cats : null,
               n: ids.length, n_sin_dato: ids.length - con.length, ciudad: !esNse && C && C.v && j >= 0 ? nul(C.v[j]) : null,
               escala: con.length ? { min: Math.min.apply(null, con), max: Math.max.apply(null, con) } : null, clases: clases, clase: clase,
               clases_origen: esNse ? 'categorias' : 'cuartiles', fuente: def.fuente || null, anio: def.anio || null, naturaleza: def.naturaleza || null };
    }
    /** cargarCapa(variable, dl) → Promise con valoresCapa(variable, dl): pide lo que falte (grupos y, si la variable es del censo, los archivos
        de variables de los distritos del ámbito: uno con dl, los cuatro sin dl). Nunca rechaza: si algo falta, llega con listo = false. */
    function cargarCapa(variable, dl) {
      dl = normDl(dl);
      return cargarGrupos().then(function () {
        if (variable === 'nse') return null;
        var ds = dl ? [dl] : listaDistritos('dip');
        return Promise.all(ds.map(function (d) { return cargarVariables(d); }));
      }).then(function () { return valoresCapa(variable, dl); });
    }

    /* ------------------------------------------------------------------ (b) simulador de escenarios (chat de Simulación) */
    function estadoP5(id) {
      var P = proyeccion('P5'), e = P && P.escenarios ? P.escenarios[id] : null;
      return e ? { estado: nul(e.estado), porque: e.porque ? llano(e.porque) : null } : null;
    }
    function cambioFrente(r, c) {
      var o = {}; BLOQUES3.forEach(function (k) { o[k] = r && c && r[k] && c[k] && esNum(r[k].p50) && esNum(c[k].p50) ? Math.round((r[k].p50 - c[k].p50) * 1e6) / 1e6 : null; });
      return o;
    }
    /**
     * escenarioFicha(esc) · todo lo que un escenario hace, para responder en el chat: {id, nombre, rotulo, corto, definicion_llana, central,
     * referencia, estado ('ocurrió' | 'en curso' | 'posible' | 'poco probable' | 'referencia' | 'central', de proyecciones.json → P5; null sin ese
     * archivo), estado_porque, estado_origen, boletas: {ayun, dip, fed}}. Cada boleta: {boleta, disponible, preliminar, mueve, ciudad, distritos, reparto,
     * margen, participacion, delta_vs_s0}. ciudad y cada distrito: {veredicto, rotulo, eleccion, tipo, bloques {MC, MORENA_ALIADOS, PAN_PRI}
     * con {p10, p50, p90} del JSON, cambio_vs_central {MC, MORENA_ALIADOS, PAN_PRI} en puntos}. cambio_vs_central lo CALCULA la capa (diferencia de
     * medianas frente al escenario central; null en el propio central). null si el escenario no existe.
     */
    function escenarioFicha(esc) {
      var e = escenario(esc), c = central(); if (!e) return null;
      var ex = escenarios().filter(function (x) { return x.id === e.id; })[0], st = estadoP5(e.id);
      var o = { id: e.id, nombre: e.nombre, rotulo: ex.rotulo, corto: ex.corto, definicion_llana: ex.definicion_llana, central: e.id === c, referencia: e.id === 'S0',
                estado: st ? st.estado : (e.id === c ? 'central' : null), estado_porque: st ? st.porque : null, estado_origen: st ? 'proyecciones' : null,
                boletas: {}, cambio_origen: 'calculado: mediana de este escenario menos la del central (' + c + ')' };
      nm.boletas().forEach(function (b) {
        var X = boleta(e.id, b), P5 = proyeccion('P5'), pre = P5 && P5.boletas && P5.boletas[b] ? !!P5.boletas[b].preliminar : null;
        if (!X) { o.boletas[b] = { boleta: b, disponible: false }; return; }
        function lectura(dl) {
          var r = recorte(e.id, b, dl), rc = e.id === c ? null : recorte(c, b, dl);
          return r ? { dl: dl || null, ambito: nm.ambito(dl, b), veredicto: r.veredicto, rotulo: r.rotulo, eleccion: r.eleccion, tipo: r.tipo, franja: dl ? esFranja(dl) : false,
                       bloques: r.bloques, cambio_vs_central: rc ? cambioFrente(r.bloques, rc.bloques) : null } : null;
        }
        var ds = {}; listaDistritos(b).forEach(function (dl) { ds[dl] = lectura(dl); });
        o.boletas[b] = { boleta: b, disponible: true, preliminar: pre, mueve: mueve(e.id, b), ciudad: lectura(null), distritos: ds,
                         reparto: b === 'ayun' ? null : reparto(e.id, b), margen: nul(X.margen_mc_vs_morena_aliados), participacion: nul(X.participacion), delta_vs_s0: nul(X.delta_vs_s0) };
      });
      return o;
    }
    function sinAcentos(t) { return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+]+/g, ' ').trim(); }
    /**
     * buscar(texto) · reconoce por palabras de qué habla una pregunta (sin modelo de lenguaje: coincidencia de palabras):
     * {texto, palabras, escenarios: [{id, rotulo, puntos, por}], distritos: [{dl, ambito, por}], boletas, bloques, edades, genero, entendido}.
     * Escenario: por su id («S4», «escenario 4»), por «central» o por palabras de su nombre (puntos = cuántas coinciden). Distrito: «D9», «DF9»,
     * «distrito 9». Boleta: alcaldía/ayuntamiento/municipal → 'ayun'; federal → 'fed'; diputación/local/congreso → 'dip'. Bloque: MC, Morena,
     * PAN/PRI. Grupos: «jóvenes» (18-24 y 25-29), «mayores» (65+), «18-24»…, mujeres/hombres. entendido = false si no reconoció nada.
     */
    var VACIAS = { de: 1, del: 1, la: 1, las: 1, el: 1, los: 1, en: 1, y: 1, a: 1, que: 1, se: 1, con: 1, por: 1, para: 1, un: 1, una: 1, al: 1, sin: 1, si: 1,
                   es: 1, lo: 1, como: 1, mas: 1, menos: 1, cual: 1, quien: 1, pasa: 1, pasaria: 1, gana: 1, ganaria: 1, va: 1, iria: 1, escenario: 1, escenarios: 1,
                   morena: 1, hay: 1, sus: 1, este: 1, esta: 1 };   /* «morena» va a bloques, no elige escenario */
    function buscar(texto) {
      var t = sinAcentos(texto), pal = t ? t.split(' ') : [], o = { texto: String(texto == null ? '' : texto), palabras: pal, escenarios: [], distritos: [], boletas: [], bloques: [], edades: [], genero: null, entendido: false };
      var es = listaEsc(), c = central(), m, re;
      function pon(lista, x) { if (lista.indexOf(x) < 0) lista.push(x); }
      function escPon(id, por, puntos) {
        var e = escenario(id); if (!e) return;
        var y = o.escenarios.filter(function (x) { return x.id === e.id; })[0];
        if (y) { y.puntos = Math.max(y.puntos, puntos); return; }
        o.escenarios.push({ id: e.id, rotulo: nm.escenario(e), puntos: puntos, por: por });
      }
      re = /\b(?:s|escenario|esc)\s?(\d{1,2})\b/g;
      while ((m = re.exec(t))) escPon('S' + parseInt(m[1], 10), 'id', 100);
      if (/\bcentral\b|\binercia\b/.test(t) && c) escPon(c, 'central', 90);
      es.forEach(function (e) {
        var nom = sinAcentos(e.nombre).split(' ').filter(function (w) { return w.length >= 4 && !has(VACIAS, w); }), n = 0;
        nom.forEach(function (w) { if (pal.indexOf(w) >= 0 || pal.some(function (p) { return p.length >= 5 && (w.indexOf(p) === 0 || p.indexOf(w) === 0); })) n++; });
        if (n) escPon(e.id, 'nombre', n);
      });
      o.escenarios.sort(function (a, b) { return b.puntos - a.puntos; });
      var hayFed = /\bfederal(es)?\b|\bdf\s?\d/.test(t);
      re = /\b(df|dl|d|distrito|distritos)\s?(?:(?:local|federal)\s)?(8|9|11|13)\b/g;
      while ((m = re.exec(t))) { var dl = m[2]; if (!o.distritos.some(function (x) { return x.dl === dl; })) o.distritos.push({ dl: dl, ambito: nm.ambito(dl, m[1] === 'df' || hayFed ? 'fed' : 'dip'), por: m[1] }); }
      if (/\balcald|\bayuntamiento|\bmunicip|\bpresidencia municipal|\bpresidente municipal/.test(t)) pon(o.boletas, 'ayun');
      if (hayFed) pon(o.boletas, 'fed');
      if (/\bdiputa|\blocal(es)?\b|\bcongreso\b/.test(t) && !(hayFed && !/\blocal(es)?\b/.test(t))) pon(o.boletas, 'dip');
      if (/\bmc\b|movimiento ciudadano|\bnaranja\b/.test(t)) pon(o.bloques, 'MC');
      if (/\bmorena\b|\b4t\b/.test(t)) pon(o.bloques, 'MORENA_ALIADOS');
      if (/\bpan\b|\bpri\b/.test(t)) pon(o.bloques, 'PAN_PRI');
      edades().forEach(function (ed) { var x = sinAcentos(ed).replace('+', ' '); if (new RegExp('\\b' + x.replace(/ /g, '\\s?') + '\\b').test(t) || (ed === '65+' && /\b65\b/.test(t))) pon(o.edades, ed); });
      if (/\bjoven(es)?\b|\bjuventud\b/.test(t)) { pon(o.edades, '18-24'); pon(o.edades, '25-29'); }
      if (/\bmayor(es)?\b|\btercera edad\b|\bpensionad/.test(t)) pon(o.edades, '65+');
      var mu = /\bmujer(es)?\b|\bfemenin/.test(t), ho = /\bhombre(s)?\b|\bmasculin|\bvarones\b/.test(t);
      o.genero = mu && !ho ? 'mujer' : (ho && !mu ? 'hombre' : null);
      o.entendido = !!(o.escenarios.length || o.distritos.length || o.boletas.length || o.bloques.length || o.edades.length || o.genero);
      return o;
    }

    /* ------------------------------------------------------------------ (c) grupos sexo × edad («Mapa de grupos» y «Análisis por grupos de edad») */
    function mediosDe(txt) {
      var out = [];
      String(txt || '').toLowerCase().split(/[;\/]/).forEach(function (w) {
        w = w.trim(); var k = null, i;
        for (i = 0; i < MEDIOS_REGLAS.length && !k; i++) if (MEDIOS_REGLAS[i][0].test(w)) k = MEDIOS_REGLAS[i][1];
        if (k && out.indexOf(k) < 0) out.push(k);
      });
      return out.map(function (k) { return { clave: k, nombre: MEDIOS_NOMBRE[k] }; });
    }
    /** medios() · los medios que distingue la tabla, en orden, para su leyenda: [{clave, nombre}]. */
    function medios() { return Object.keys(MEDIOS_NOMBRE).map(function (k) { return { clave: k, nombre: MEDIOS_NOMBRE[k] }; }); }
    function supuestosGrupos() {
      var G = GD(), sup = G && G._meta && G._meta.naturaleza ? arr(G._meta.naturaleza.supuesto) : [], R = meta() && meta().reparto_por_edad_y_genero;
      function busca(re) { for (var i = 0; i < sup.length; i++) if (re.test(sup[i])) return sup[i]; return null; }
      return { genero: R ? (R.indice_de_genero_naturaleza || null) : null, reparto: R ? (R.nota || null) : null,
               participacion: busca(/^participaci/i), medios: busca(/^medios/i), sin_diferencia: busca(/mujeres de hombres/i) };
    }
    /**
     * gruposSexoEdad(b, esc, dl) o gruposSexoEdad({b, e, d}) · los 12 grupos de sexo × edad del ámbito (toda la ciudad o un distrito) para el
     * «Mapa de grupos» y la tabla «Análisis por grupos de edad». Ver LEEME_datos.md § 4 · «Grupos sexo × edad». null si falta la boleta o el escenario.
     */
    function gruposSexoEdad(b, esc, dl) {
      if (esEstado(b)) { dl = b.d; esc = b.e; b = b.b; }
      b = bol(b); dl = normDl(dl); var id = escId(esc);
      if (!b || !id || !escenario(id) || !v8()) return null;
      var hayAg = !!(datos.agentes && Array.isArray(datos.agentes.agentes)), U = nm.umbral(), P3 = proyeccion('P3'), P3b = P3 && P3.boletas ? P3.boletas[b] : null;
      var filas = [], res = { MC: 0, MORENA_ALIADOS: 0, PAN_PRI: 0 }, parejos = 0;
      function part(l) {   /* participación de referencia de los perfiles (turnout_prior), pesada por su lista nominal; en % */
        var ln = 0, s = 0; l.forEach(function (a) { if (esNum(a.peso) && esNum(a.turnout_prior)) { ln += a.peso; s += a.peso * a.turnout_prior; } });
        return ln ? 100 * s / ln : null;
      }
      edades().forEach(function (ed) {
        var agEd = hayAg ? agentes({ dl: dl, edad: ed }) : null;
        ['hombre', 'mujer'].forEach(function (g) {
          var r = recorte(id, b, dl, ed, g), ag = hayAg ? agEd.filter(function (a) { return a.genero === g; }) : null;
          var ln = ag ? ag.reduce(function (sm, a) { return sm + (esNum(a.peso) ? a.peso : 0); }, 0) : null;
          var f = { edad: ed, genero: g, nombre: (g === 'mujer' ? 'Mujeres' : 'Hombres') + ' ' + ed, edad_txt: edadTxt(ed), lista_nominal: ag ? ln : null,
                    voto: null, otros: null, p_primero: null, veredicto: null, adelante: null, segundo: null, ventaja: null, parejo: null, regla_parejo: null, rotulo: null,
                    participacion: ag ? part(ag) : null, participacion_edad: agEd ? part(agEd) : null,
                    medios: ag && ag.length ? mediosDe(ag.reduce(function (x, a) { return !x || a.peso > x.peso ? a : x; }, null).dieta_medios) : null,
                    medios_texto: ag && ag.length ? ag[0].dieta_medios : null, interes_mayor: null };
          if (r) {
            var orden = BLOQUES3.slice().sort(function (a, c) { return (r[c].p50 || 0) - (r[a].p50 || 0); }), v = r.veredicto;
            f.voto = r.bloques; f.p_primero = r.p_gana; f.veredicto = v; f.rotulo = r.rotulo;
            f.otros = Math.round((100 - BLOQUES3.reduce(function (sm, k) { return sm + (esNum(r[k].p50) ? r[k].p50 : 0); }, 0)) * 1e6) / 1e6;
            /* regla de «parejo»: no se nombra líder si el primero en corridas no llega al umbral de ventaja o no tiene la mediana más alta */
            var porCorr = v && v.nivel === 'mas_votos' && v.lider, mediana = porCorr && orden[0] === v.lider;
            f.parejo = !(porCorr && mediana);
            f.regla_parejo = f.parejo ? (porCorr ? 'mediana' : 'corridas') : null;
            f.adelante = f.parejo ? null : v.lider;
            f.segundo = f.parejo ? null : orden[1];
            f.ventaja = f.parejo ? null : Math.round((r[orden[0]].p50 - r[orden[1]].p50) * 1e6) / 1e6;
            if (f.adelante) res[f.adelante]++; else parejos++;
          }
          if (P3b && Array.isArray(P3b.grupos)) {   /* el grupo de zona (zona × edad × sexo) con más interés: P3 solo lo da así y en el escenario central */
            P3b.grupos.forEach(function (q) {
              if (q.edad !== ed || q.genero !== g || (dl && String(q.dl) !== dl) || !esNum(q.interes)) return;
              if (!f.interes_mayor || q.interes > f.interes_mayor.interes) f.interes_mayor = { interes: q.interes, zona: q.zona, dl: String(q.dl), puesto_en_distrito: nul(q.puesto_interes_en_distrito), escenario: P3b.escenario_central || (P3 && P3.escenario_central) || null };
            });
          }
          filas.push(f);
        });
      });
      var sup = supuestosGrupos();
      return {
        boleta: b, esc: id, dl: dl, ambito: nm.ambito(dl, b), rotulo: rotulo(b, id, dl), umbral_parejo: U.VENTAJA, filas: filas,
        resumen: { n: filas.length, adelante: res, parejos: parejos },
        disponible: { voto: filas.some(function (f) { return !!f.voto; }), participacion: hayAg, medios: hayAg, interes: !!(P3b && P3b.grupos) },
        fijo: { participacion: 'la misma en las tres boletas y en todos los escenarios (participación de referencia del perfil)',
                medios: 'los mismos en las tres boletas y en todos los escenarios; dependen solo de la edad',
                interes: 'el índice de interés solo existe por zona, edad y sexo, y solo en el escenario central' },
        naturaleza: { voto: 'estimación del motor (reparto del voto de cada sección entre edades y sexos)', genero: 'supuesto del motor sin respaldo local',
                      participacion: 'supuesto', medios: 'supuesto', interes: 'cálculo propio sobre estimaciones del motor', ventaja: 'cálculo de la capa: diferencia de medianas en puntos' },
        /* textos para la página, en español llano (los del JSON traen nombres de campo); la naturaleza de cada cifra va arriba */
        avisos: { genero: 'La diferencia entre mujeres y hombres sale de un supuesto del motor sin respaldo local (cómo reparte el voto por sexo). No es un hallazgo.',
                  reparto: sup.reparto ? llano(sup.reparto) : null,
                  participacion: 'Supuesto: es la participación de referencia de cada perfil (la de la elección intermedia de 2021 en sus secciones, repartida por edad y sexo con factores fijos sin medición local). Es la misma en las tres boletas y en todos los escenarios.',
                  medios: 'Supuesto del motor, sin fuente local: los medios dependen solo de la edad y son los mismos en todos los escenarios.',
                  interes: 'El índice de interés solo existe por zona, edad y sexo, y solo en el escenario central: no hay una cifra por sexo y edad. Lo que se enseña es el grupo de una zona con más interés.' },
        faltan: (hayAg ? [] : ['agentes']).concat(P3 ? [] : ['proyecciones'])
      };
    }

    /* ================================================================== partidos por separado (24-nov-2026, SA-PAR-01 a SA-PAR-04)
       Orden del propietario: «necesito que me separes los partidos políticos de todo». En todo el portal se enseñan los partidos por separado
       (MC, Morena, PT, PVEM, Hagamos/Futuro, PAN, PRI y Otros); quién gana, la probabilidad, «parejo», el veredicto y los curules siguen
       por CANDIDATURA (coaliciones de 2024), porque es la candidatura la que gana el cargo (SA-PAR-03).
       · Donde el motor da la cifra por partido se usa tal cual (partidosBoleta, partidosDistrito): naturaleza «estimación del motor».
       · Donde solo hay cifra de candidatura, la capa la REPARTE entre sus partidos con la proporción de cada uno dentro de ella
         (repartoPartidos): naturaleza «reparto estimado por partido» (cálculo propio). Los partidos suman EXACTAMENTE la candidatura
         (un solo redondeo, al final, por el método del mayor resto). El motor no se relanza.
       · Proporción: por sección, la del resultado oficial 2024 de esa sección y boleta (FUENTE_2024); por zona, grupo o voto de un
         distrito, la del motor en ese distrito (partidos_p50); por tipo de sección (abarcan toda la ciudad), la del motor en la ciudad. */
    function NN() { return NOM() || {}; }
    function listaPartidos(b) {                                   /* los partidos que compiten en la boleta (la federal, sin Hagamos/Futuro) */
      var n = NN(), k = bol(b) || 'ayun';
      if (typeof n.partidos === 'function') return n.partidos(k);
      return PARTIDOS8.filter(function (p) { return !(k === 'fed' && p === 'HAG_FUT'); });
    }
    function partidosDeCand(c, b) {
      var n = NN(), k = bol(b) || 'ayun';
      if (typeof n.partidos_de === 'function') return n.partidos_de(c, k);
      if (k === 'fed' && has(CANDIDATURA_FED_R, c)) return CANDIDATURA_FED_R[c].slice();
      return has(CANDIDATURA_R, c) ? CANDIDATURA_R[c].slice() : [];
    }
    function candidaturaDe(p) {
      var n = NN(), c;
      if (typeof n.candidatura === 'function') return n.candidatura(p);
      for (c in CANDIDATURA_R) if (has(CANDIDATURA_R, c) && CANDIDATURA_R[c].indexOf(p) >= 0) return c;
      return '';
    }
    function candidaturas() { var n = NN(); return (n.CANDIDATURAS || CANDIDATURAS4).slice(); }
    function rotuloCandidatura(b) { return fnN('rotulo_candidatura', [bol(b) || 'ayun'], 'Quién va adelante se calcula por coalición, como en 2024'); }
    function natTexto(k, resp) { var n = NN(); return (n.NATURALEZA && n.NATURALEZA[k]) || resp; }
    function p50De(x) { return x && typeof x === 'object' ? (esNum(x.p50) ? x.p50 : null) : (esNum(x) ? x : null); }
    function tri(x) { return x && typeof x === 'object' ? { p10: nul(x.p10), p50: nul(x.p50), p90: nul(x.p90) } : (esNum(x) ? { p10: null, p50: x, p90: null } : null); }
    function unidades(x, f) { var s = x < 0 ? -1 : 1; return s * Math.floor(Math.abs(x) * f + 0.5 + 1e-9); }
    /* Esqueleto común de todo lo que devuelve esta familia: partidos en el orden canónico, el mapa «por» y las candidaturas con su total. */
    function armaPartidos(b, por, totales, base) {
      var o = base || {}, ks = listaPartidos(b);
      o.boleta = b; o.preliminar = b === 'fed';
      o.rotulo_candidatura = rotuloCandidatura(b);
      o.por = {}; o.partidos = [];
      ks.forEach(function (k) {
        var v = por[k] || null;
        o.por[k] = v;
        o.partidos.push({ clave: k, nombre: nm.nombre(k), candidatura: candidaturaDe(k), p10: v ? v.p10 : null, p50: v ? v.p50 : null, p90: v ? v.p90 : null });
      });
      o.candidaturas = candidaturas().map(function (c) {
        var ps = partidosDeCand(c, b).filter(function (k) { return ks.indexOf(k) >= 0; }), suma = 0, n = 0;
        ps.forEach(function (k) { if (o.por[k] && esNum(o.por[k].p50)) { suma += o.por[k].p50; n++; } });
        return { clave: c, nombre: nm.nombre(c), partidos: ps, total: totales[c] || null, suma_partidos: n ? Math.round(suma * 1e6) / 1e6 : null };
      });
      return o;
    }
    /**
     * repartoPartidos(bloques, proporciones, op) · reparte el voto de cada candidatura entre sus partidos (cálculo propio).
     *   bloques: {MC, MORENA_ALIADOS, PAN_PRI, OTROS} con números o con {p50} (falta una → sus partidos van en null).
     *   proporciones: {MORENA: 31.2, PT: 2.3, …} pesos de cada partido en cualquier escala (solo cuenta su proporción DENTRO de la
     *   candidatura). Si una candidatura no tiene pesos (todos 0 o ausentes), sus partidos van en null y la candidatura en sin_proporcion.
     *   op: {boleta: 'ayun' (decide si la coalición de Morena lleva Hagamos/Futuro), dec: 1 (0 para votos), nota, fuente, proporcion}.
     * Los partidos de cada candidatura suman EXACTAMENTE la candidatura redondeada a dec: se redondea una sola vez al final por el
     * método del mayor resto (empate de restos: orden canónico). MC y Otros van 1 a 1. p10 y p90 van en null: el reparto no tiene rango.
     */
    function repartoPartidos(bloques, proporciones, op) {
      op = op || {};
      var b = bol(op.boleta) || 'ayun', dec = esNum(op.dec) ? op.dec : 1, f = Math.pow(10, dec), por = {}, tot = {}, sin = [], exactos = {};
      bloques = bloques || {}; proporciones = proporciones || {};
      candidaturas().forEach(function (c) {
        var T = p50De(bloques[c]), ps = partidosDeCand(c, b), w, S = 0, u, Tu, resto, orden;
        if (T == null) { ps.forEach(function (k) { por[k] = null; }); tot[c] = null; return; }
        Tu = unidades(T, f); tot[c] = { p10: null, p50: Tu / f, p90: null };
        if (ps.length === 1) { por[ps[0]] = { p10: null, p50: Tu / f, p90: null }; exactos[ps[0]] = T; return; }
        w = ps.map(function (k) { var x = proporciones[k]; return esNum(x) && x > 0 ? x : 0; });
        w.forEach(function (x) { S += x; });
        if (!(S > 0)) { ps.forEach(function (k) { por[k] = null; }); sin.push(c); return; }
        u = ps.map(function (k, i) { var x = T * w[i] / S; exactos[k] = x; return { k: k, i: i, x: x * f, u: Math.floor(x * f + 1e-9) }; });
        resto = Tu - u.reduce(function (s2, q) { return s2 + q.u; }, 0);
        orden = u.slice().sort(function (a, z) { var dr = (z.x - z.u) - (a.x - a.u); return (Math.abs(dr) > 1e-9 ? dr : 0) || (a.i - z.i); });   /* restos iguales salvo ruido de coma flotante: manda el orden canónico */
        for (var j = 0; j < orden.length && resto > 0; j++, resto--) orden[j].u++;
        for (j = orden.length - 1; j >= 0 && resto < 0; j--) { if (orden[j].u > 0) { orden[j].u--; resto++; } }
        u.forEach(function (q) { por[q.k] = { p10: null, p50: q.u / f, p90: null }; });
      });
      var o = armaPartidos(b, por, tot, { naturaleza: natTexto('REPARTO', NAT_REPARTO), calculo: natTexto('CALCULO', NAT_CALCULO), dec: dec });
      o.rotulo_naturaleza = nm.texto('REPARTO_ESTIMADO', NAT_REPARTO);
      o.nota = op.nota || nm.texto('REPARTO_NOTA', 'Reparto estimado por partido (cálculo propio).');
      o.proporcion = op.proporcion || null; o.fuente = op.fuente || null; o.sin_proporcion = sin; o.exacto = exactos;
      o.partidos.forEach(function (p) { p.naturaleza = o.naturaleza; });
      return o;
    }
    /** partidosBoleta(esc, b) · los partidos de toda la ciudad tal como los da el motor (escenarios[esc].<boleta>.partidos): {p10, p50, p90}
        de cada uno; candidaturas con su total = el bloque del motor (su propia mediana y rango). null si falta la boleta. */
    function partidosBoleta(esc, b) {
      if (esEstado(esc)) { b = esc.b; esc = esc.e; }
      var id = escId(esc), X = boleta(id, b), por = {}, tot = {};
      b = bol(b);
      if (!X || !X.partidos) return null;
      listaPartidos(b).forEach(function (k) { por[k] = tri(X.partidos[k]); });
      candidaturas().forEach(function (c) { tot[c] = X.bloques && X.bloques[c] ? X.bloques[c] : null; });
      var o = armaPartidos(b, por, tot, { esc: id, dl: null, ambito: nm.ambito(null, b), rotulo: nm.rotulo(b, id, null),
        naturaleza: natTexto('MOTOR', NAT_MOTOR), estadistico: 'mediana y rango de las corridas', rango: true,
        fuente: 'sim_v8.json → escenarios[' + id + '].' + jsonDe(b) + '.partidos' });
      o.rotulo_naturaleza = o.naturaleza; o.crudo = X.partidos;
      o.partidos.forEach(function (p) { p.naturaleza = o.naturaleza; });
      return o;
    }
    /** partidosDistrito(esc, b, dl) · las medianas por partido que da el motor en el distrito (….distritos[dl].partidos_p50; sin rango por
        partido); candidaturas con su total = el bloque del distrito (con rango). Sin distrito = partidosBoleta. null si no existe. */
    function partidosDistrito(esc, b, dl) {
      if (esEstado(esc)) { dl = esc.d; b = esc.b; esc = esc.e; }
      var id = escId(esc), X = boleta(id, b), d, por = {}, tot = {};
      b = bol(b); dl = normDl(dl);
      if (!dl) return partidosBoleta(id, b);
      d = X && X.distritos ? X.distritos[dl] : null;
      if (!d || !d.partidos_p50) return null;
      listaPartidos(b).forEach(function (k) { por[k] = esNum(d.partidos_p50[k]) ? { p10: null, p50: d.partidos_p50[k], p90: null } : null; });
      candidaturas().forEach(function (c) { tot[c] = d.bloques && d.bloques[c] ? d.bloques[c] : null; });
      var o = armaPartidos(b, por, tot, { esc: id, dl: dl, ambito: nm.ambito(dl, b), rotulo: nm.rotulo(b, id, dl),
        naturaleza: natTexto('MOTOR', NAT_MOTOR), estadistico: 'mediana de las corridas (el motor no da el rango por partido en el distrito)', rango: false,
        franja: d.franja === true, fuente: 'sim_v8.json → escenarios[' + id + '].' + jsonDe(b) + '.distritos[' + dl + '].partidos_p50' });
      o.rotulo_naturaleza = o.naturaleza; o.crudo = d.partidos_p50;
      o.partidos.forEach(function (p) { p.naturaleza = o.naturaleza; });
      return o;
    }
    /** partidos(esc, b, dl) o partidos(PP.vigente()) · el del ámbito: partidosDistrito con distrito, partidosBoleta sin él. */
    function partidos(esc, b, dl) { if (esEstado(esc)) { dl = esc.d; b = esc.b; esc = esc.e; } return normDl(dl) ? partidosDistrito(esc, b, dl) : partidosBoleta(esc, b); }
    /** proporcionesMotor(esc, b, dl) · los pesos por partido del motor en el ámbito (medianas del distrito o de la ciudad), para repartir. */
    function proporcionesMotor(esc, b, dl) {
      var id = escId(esc), X = boleta(id, b), d, src, pesos = {};
      b = bol(b); dl = normDl(dl);
      if (!X) return null;
      if (dl) { d = X.distritos ? X.distritos[dl] : null; src = d ? d.partidos_p50 : null; }
      else src = X.partidos ? Object.keys(X.partidos).reduce(function (o, k) { o[k] = p50De(X.partidos[k]); return o; }, {}) : null;
      if (!src) return null;
      listaPartidos(b).forEach(function (k) { pesos[k] = esNum(src[k]) ? src[k] : null; });
      return { origen: dl ? 'motor_distrito' : 'motor_ciudad', esc: id, boleta: b, dl: dl, ambito: nm.ambito(dl, b), pesos: pesos,
               texto: 'la proporción de cada partido dentro de su coalición que da el motor en ' + (dl ? nm.ambito(dl, b) : 'toda Guadalajara') + ' en el escenario ' + nm.escenario(escenario(id) || id),
               fuente: 'sim_v8.json → escenarios[' + id + '].' + jsonDe(b) + (dl ? '.distritos[' + dl + '].partidos_p50' : '.partidos') };
    }
    /** cargarPartidos2024() · pide el resultado oficial 2024 por partido y sección (partidos_2024.json y federal_2024.js, ~1.4 MB entre los dos).
        Solo hace falta para partidosSeccion. Nunca rechaza. estadoPartidos2024(b) → 'sin_pedir' | 'cargando' | 'listo' | 'falta'. */
    function cargarPartidos2024(b) {
      var k = bol(b), l = k ? [FUENTE_2024[k].clave] : ['p2024', 'fed2024'];
      return cargar(l.filter(function (x, i) { return l.indexOf(x) === i; }));
    }
    function estadoPartidos2024(b) { return estadoCarga(FUENTE_2024[bol(b) || 'ayun'].clave); }
    /** proporciones2024(b, id) · lo que sacó cada partido en esa sección en la elección de 2024 de esa boleta (% de la votación válida, tal
        cual): {origen: 'seccion_2024', boleta, eleccion, archivo, campo, pesos}. null si el archivo no está cargado o la sección no está. */
    function proporciones2024(b, id) {
      b = bol(b); if (!b) return null;
      var F = FUENTE_2024[b], J = dato(F.clave), x = null, pesos = {}, k;
      if (!J) return null;
      x = F.ruta ? (J[F.ruta] || {})[String(id)] : ((J[String(id)] || {})[F.campo]);
      if (!x || typeof x !== 'object') return null;
      for (k in x) if (has(x, k) && esNum(x[k])) pesos[k] = x[k];
      return { origen: 'seccion_2024', boleta: b, eleccion: F.boleta, como: F.como, archivo: F.archivo, campo: F.ruta ? F.ruta + '[' + id + ']' : '[' + id + '].' + F.campo, pesos: pesos,
               fuente: F.archivo + ' → ' + (F.ruta ? F.ruta + '[' + id + ']' : '[' + id + '].' + F.campo) + ' (' + F.boleta + ', % de la votación válida por partido)' };
    }
    function sumaDe(o, ks) { var s = 0; ks.forEach(function (k) { if (o && esNum(o[k]) && o[k] > 0) s += o[k]; }); return s; }
    function dlDeSeccion(id) { var s = secciones(), i = idxSeccion(id); return s && i >= 0 && s.dl ? String(s.dl[i]) : null; }
    /**
     * partidosSeccion(esc, b, id) · el voto de UNA sección por partido: la mediana de cada candidatura en la sección (prediccionSeccion)
     * repartida entre sus partidos (cálculo propio, «reparto estimado por partido»). Proporción dentro de cada candidatura:
     *   · la del resultado oficial 2024 de esa sección en la MISMA boleta (proporciones2024: Alcaldía 2024, Diputación local 2024 o
     *     Diputación federal 2024), si cargarPartidos2024() ya llegó y la sección trae votos de esos partidos;
     *   · un partido que ese resultado no traiga aparte (desde el 24-nov ya no pasa: partidos_2024.json trae Hagamos/Futuro) llevaría la
     *     parte que le da el motor en el distrito de la sección, y los demás se repartirían el resto con su proporción 2024 de la sección;
     *   · si falta el 2024 de la sección (archivo sin cargar o sin votos de esos partidos): la del motor en su distrito, y se dice.
     * proporcion = {origen: 'seccion_2024' | 'seccion_2024_y_distrito' | 'motor_distrito', por_candidatura, texto, pendiente_2024}.
     * null si el escenario de la sección no está cargado (cargarSecciones) o la sección no existe.
     */
    function partidosSeccion(esc, b, id) {
      var eid = escId(esc), pr = prediccionSeccion(eid, b, id), dl, pm, p24, est, pesos = {}, por = {}, txt = [], nota;
      b = bol(b);
      if (!pr) return null;
      dl = dlDeSeccion(id); pm = proporcionesMotor(eid, b, dl); p24 = proporciones2024(b, id); est = estadoPartidos2024(b);
      var pmP = pm ? pm.pesos : {}, P = p24 ? p24.pesos : {};
      candidaturas().forEach(function (c) {
        var ps = partidosDeCand(c, b), con24 = ps.filter(function (k) { return has(P, k); });
        if (ps.length <= 1) { ps.forEach(function (k) { pesos[k] = 1; }); return; }
        if (con24.length && sumaDe(P, con24) > 0) {
          var sin24 = ps.filter(function (k) { return con24.indexOf(k) < 0; });      /* hoy solo Hagamos/Futuro en ayun y dip */
          var tm = sumaDe(pmP, ps), h = tm > 0 ? sumaDe(pmP, sin24) / tm : 0, s24 = sumaDe(P, con24);
          con24.forEach(function (k) { pesos[k] = (1 - h) * (esNum(P[k]) && P[k] > 0 ? P[k] : 0) / s24; });
          sin24.forEach(function (k) { pesos[k] = tm > 0 && esNum(pmP[k]) && pmP[k] > 0 ? pmP[k] / tm : 0; });
          por[c] = sin24.length ? 'seccion_2024_y_distrito' : 'seccion_2024';
        } else { ps.forEach(function (k) { pesos[k] = pmP[k]; }); por[c] = 'motor_distrito'; }
      });
      var origenes = Object.keys(por).map(function (c) { return por[c]; });
      var origen = origenes.every(function (x) { return x === 'motor_distrito'; }) ? 'motor_distrito'
        : (origenes.some(function (x) { return x !== 'seccion_2024'; }) ? 'seccion_2024_y_distrito' : 'seccion_2024');
      var usa24 = origenes.some(function (x) { return x !== 'motor_distrito'; }), sinCands = Object.keys(por).filter(function (c) { return por[c] === 'motor_distrito'; });
      if (usa24) txt.push('con lo que sacó cada partido en esta sección en la ' + p24.eleccion);
      if (origenes.indexOf('seccion_2024_y_distrito') >= 0) txt.push('los partidos que ese resultado no trae aparte, con su parte en ' + (pm ? pm.ambito : 'su distrito') + ' según el motor');
      if (sinCands.length) txt.push((usa24 ? 'en ' + sinCands.map(function (c) { return fnN('en_frase', [c], nm.nombre(c)); }).join(' y ') + ', ' : '') + 'con ' + (pm ? pm.texto : 'la proporción del motor en su distrito') +
        (!p24 && (est === 'sin_pedir' || est === 'cargando') ? ' (el resultado 2024 por sección aún no está cargado)' : ' (esta sección no trae resultado 2024 de esos partidos)'));
      nota = 'Reparto estimado por partido (cálculo propio): el voto de cada coalición en la sección se reparte entre sus partidos ' + txt.join('; ') + '.';
      var bl = { MC: pr.MC, MORENA_ALIADOS: pr.MORENA_ALIADOS, PAN_PRI: pr.PAN_PRI, OTROS: pr.OTROS };
      var o = repartoPartidos(bl, pesos, { boleta: b, dec: 1, nota: nota,
        proporcion: { origen: origen, por_candidatura: por, pendiente_2024: !p24 && (est === 'sin_pedir' || est === 'cargando'), estado_2024: est,
                      seccion_2024: p24, distrito: pm, texto: txt.join('; ') },
        fuente: ['sim_secciones_' + eid + '.json → ' + b + ' (mediana de cada coalición en la sección)'].concat(p24 ? [p24.fuente] : []).concat(pm ? [pm.fuente] : []) });
      o.esc = eid; o.nivel = 'secciones'; o.id = String(id); o.dl = dl; o.ambito = 'Sección ' + id; o.rotulo = nm.rotulo(b, eid, dl) + ' · Sección ' + id;
      return o;
    }
    /* reparto con la proporción del motor en un ámbito (distrito o ciudad), con su rótulo */
    function conMotor(bl, esc, b, dl, base, dec) {
      var pm = proporcionesMotor(esc, b, dl), o;
      if (!pm) return null;
      o = repartoPartidos(bl, pm.pesos, { boleta: b, dec: dec == null ? 1 : dec, proporcion: { origen: pm.origen, distrito: pm, texto: pm.texto },
        nota: 'Reparto estimado por partido (cálculo propio): el voto de cada coalición se reparte entre sus partidos con ' + pm.texto + '.', fuente: [pm.fuente] });
      Object.keys(base || {}).forEach(function (k) { o[k] = base[k]; });
      return o;
    }
    /** partidosDeBloques(bloques, esc, b, dl, op) · reparte cualquier cifra por candidatura ({MC, MORENA_ALIADOS, PAN_PRI, OTROS}) con la
        proporción del motor en el distrito dl (o en la ciudad si no hay dl). Para lo que no tiene función propia (grupos de una sección…).
        op.dec: 1 por defecto (0 para votos). */
    function partidosDeBloques(bloques, esc, b, dl, op) {
      b = bol(b); dl = normDl(dl);
      return conMotor(bloques, escId(esc), b, dl, { esc: escId(esc), dl: dl, ambito: nm.ambito(dl, b) }, op && esNum(op.dec) ? op.dec : 1);
    }
    /** partidosGrupo(esc, b, dl, edad, genero) · el voto de un grupo de edad y/o sexo (el recorte del motor, por candidatura) repartido con la
        proporción del motor en su distrito (o en la ciudad). Otros: null (el recorte no lo trae). null si no hay recorte. */
    function partidosGrupo(esc, b, dl, edad, genero) {
      if (esEstado(esc)) { genero = esc.genero; edad = esc.edad; dl = esc.d; b = esc.b; esc = esc.e; }
      var r = recorte(esc, b, dl, edad, genero);
      if (!r) return null;
      return conMotor({ MC: r.MC, MORENA_ALIADOS: r.MORENA_ALIADOS, PAN_PRI: r.PAN_PRI, OTROS: null }, r.esc, r.boleta, r.dl,
        { esc: r.esc, dl: r.dl, edad: r.edad, genero: r.genero, ambito: nm.ambito(r.dl, r.boleta), rotulo: r.rotulo, nivel: 'grupo' });
    }
    /** partidosZona(esc, b, id) · la mediana por candidatura de la zona (zonaVoto, la misma cifra de las páginas de zonas) repartida con la
        proporción del motor en el distrito de la zona. Otros: null (el motor no lo da por zona). */
    function partidosZona(esc, b, id) {
      var eid = escId(esc), v = zonaVoto(eid, b, String(id)), z, dl, m;
      b = bol(b);
      if (!v) return null;
      z = zona(String(id)); m = /^D(\d+)-/.exec(String(id)); dl = z && z.dl != null ? String(z.dl).replace(/^D/, '') : (m ? m[1] : null);
      return conMotor({ MC: v.MC, MORENA_ALIADOS: v.MORENA_ALIADOS, PAN_PRI: v.PAN_PRI, OTROS: null }, eid, b, dl,
        { esc: eid, nivel: 'zonas', id: String(id), dl: dl, ambito: 'Zona ' + id, rotulo: nm.rotulo(b, eid, dl) + ' · Zona ' + id });
    }
    /** partidosTipo(esc, b, id) · el voto de un tipo de sección (suma de sus secciones, prediccionGrupo) repartido con la proporción del motor
        en TODA la ciudad (los tipos abarcan la ciudad entera). Pide el escenario cargado (cargarSecciones). */
    function partidosTipo(esc, b, id) {
      var eid = escId(esc), g = prediccionGrupo(eid, b, 'tipos', id);
      b = bol(b);
      if (!g) return null;
      var ot = g.votos && g.validos ? 100 * g.votos.OTROS / g.validos : null;
      return conMotor({ MC: g.MC, MORENA_ALIADOS: g.MORENA_ALIADOS, PAN_PRI: g.PAN_PRI, OTROS: ot }, eid, b, null,
        { esc: eid, nivel: 'tipos', id: String(id), dl: null, ambito: 'toda Guadalajara', rotulo: nm.rotulo(b, eid, null) + ' · ' + ((grupo('tipos', id) || {}).titulo || id) });
    }
    /** votosPartidos(esc, b, dl) · votos válidos estimados por partido: los votos de cada candidatura que exporta el motor (votos().votos_motor,
        promedio de las corridas) × la proporción del partido dentro de ella (la del motor en el ámbito). Es lo mismo que «votos válidos ×
        porcentaje del partido», ajustado para que los partidos sumen exactamente los votos de su candidatura (enteros, un solo redondeo). */
    function votosPartidos(esc, b, dl) {
      if (esEstado(esc)) { dl = esc.d; b = esc.b; esc = esc.e; }
      var v = votos(esc, b, dl), o;
      if (!v || !v.votos_motor) return null;
      o = conMotor(v.votos_motor.bloques, v.esc, v.boleta, v.dl, { esc: v.esc, dl: v.dl, ambito: v.ambito, rotulo: nm.rotulo(v.boleta, v.esc, v.dl),
        unidad: 'votos', estadistico: 'promedio de las corridas', total: v.votos_motor.total }, 0);
      if (o) { o.fuente = [v.votos_motor.fuente].concat(o.fuente || []); o.formula = 'votos del partido = votos válidos de su coalición × (porcentaje del partido ÷ porcentaje de la coalición)'; }
      return o;
    }

    var api = {
      VERSION: VERSION, ARCHIVOS: ARCHIVOS, BLOQUES: BLOQUES3,
      /* carga */
      configurar: configurar, cargar: cargar, poner: poner, dato: dato, listo: listo, errores: errores, crear: crear,
      /* motor */
      meta: meta, corte: corte, corteTexto: corteTexto, fechaDe: fechaDe,
      escenarios: escenarios, escenario: escenario, central: central, igualCentral: igualCentral, mueve: mueve,
      boleta: boleta, hayBoleta: hayBoleta, listaDistritos: listaDistritos, distritos: distritos, distrito: distrito,
      recorte: recorte, veredicto: veredicto, veredictoDe: veredictoDe, esEleccion: esEleccion, esFranja: esFranja,
      tipoRecorte: tipoRecorte, reparto: reparto, curules: curules, tablaEscenarios: tablaEscenarios,
      listaNominal: listaNominal, votos: votos,
      trayectoria: trayectoria, descomposicion: descomposicion, sensibilidad: sensibilidad, flujos: flujos,
      segmentos: segmentos, perfil: perfil, similitud: similitud, edades: edades,
      secciones: secciones, seccion: seccion, campoSeccion: campoSeccion, seccionesDe: seccionesDe,
      seccionesResumen: seccionesResumen, seccionesTop: seccionesTop,
      /* perfiles de votante y zonas */
      agentes: agentes, resumenAgentes: resumenAgentes, liderAgente: liderAgente, respuestaAgente: respuestaAgente,
      zonas: zonas, zona: zona, zonaVoto: zonaVoto, zonaLectura: zonaLectura, distritoZonas: distritoZonas,
      grupos: grupos, microGrupos: microGrupos,
      /* grupos por lugar (motor v8.1): tipos de sección, zonas y secciones */
      NIVELES: NIVELES, cargarGrupos: cargarGrupos, cargarSecciones: cargarSecciones, cargarVariables: cargarVariables,
      cargarGruposSeccion: cargarGruposSeccion, estadoCarga: estadoCarga, estadoSecciones: estadoSecciones,
      estadoVariables: estadoVariables, estadoGruposSeccion: estadoGruposSeccion,
      gruposMeta: gruposMeta, gruposCiudad: gruposCiudad, gruposEscenario: gruposEscenario, escenariosPorGrupo: escenariosPorGrupo, grupos12: grupos12, edadTxt: edadTxt, gruposIds: gruposIds, grupo: grupo,
      prediccionSeccion: prediccionSeccion, seccionBase: seccionBase, prediccionGrupo: prediccionGrupo, resumenSecciones: resumenSecciones,
      variablesGrupo: variablesGrupo, gruposEdad: gruposEdad, segmentosZona: segmentosZona, gruposSeccionDistrito: gruposSeccionDistrito,
      /* diseño del 20-nov: capas temáticas del Mapa · simulador (chat) · grupos sexo × edad */
      capasTematicas: capasTematicas, capaTematica: capaTematica, valoresCapa: valoresCapa, cargarCapa: cargarCapa,
      escenarioFicha: escenarioFicha, buscar: buscar, gruposSexoEdad: gruposSexoEdad, medios: medios,
      /* partidos por separado (24-nov-2026, SA-PAR-01 a SA-PAR-04) */
      listaPartidos: listaPartidos, partidos: partidos, partidosBoleta: partidosBoleta, partidosDistrito: partidosDistrito,
      repartoPartidos: repartoPartidos, proporcionesMotor: proporcionesMotor, proporciones2024: proporciones2024,
      cargarPartidos2024: cargarPartidos2024, estadoPartidos2024: estadoPartidos2024, partidosSeccion: partidosSeccion,
      partidosDeBloques: partidosDeBloques, partidosGrupo: partidosGrupo, partidosZona: partidosZona, partidosTipo: partidosTipo,
      votosPartidos: votosPartidos, rotuloCandidatura: rotuloCandidatura, FUENTE_2024: FUENTE_2024,
      /* otras fuentes */
      evolucion: evolucion, proyeccion: proyeccion,
      /* textos */
      textoFranja: textoFranja, rotulo: rotulo, describe: describe, llano: llano, sinAliados: sinAliados, canalTxt: canalTxt, supuestoTxt: supuestoTxt,
      segmentoTxt: segmentoTxt,
      /* ¿cargó nombres.js? (si no, los nombres salen como claves crudas) */
      sinNombres: function () { return !NOM(); }
    };
    if (opciones) configurar(opciones);
    return api;
  }

  return crear();
});
