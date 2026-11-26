/* web/nombres.js · GENERADO por scripts/nombres.py. NO EDITAR A MANO: cambiar nombres.py y correr
   PYTHONPATH= python3 -I scripts/nombres.py
   Fuente única de nombres de boletas, bloques, partidos, distritos, escenarios, formatos y colores.
   Uso en las páginas: (window.NOMBRES||{}).COLOR, NOMBRES.escenario(e), NOMBRES.pct(x), … con respaldo.
   Al cargar inyecta <style id="nombres-partidos"> con las variables CSS --p-* de la paleta. */
(function(root){
"use strict";
var D={"BOLETA":{"ayun":{"clave":"ayun","json":"alcaldia","largo":"Alcaldía de Guadalajara","corto":"Alcaldía","chip":"ALCALDÍA","primera":"Alcaldía (elección de ayuntamiento)","pildora":"ALCALDÍA","icono":"alcaldia"},"dip":{"clave":"dip","json":"diputacion","largo":"Diputación local","corto":"Dip. local","chip":"DIP. LOCAL","primera":"Diputación local (4 elecciones distintas: D8, D9, D11 y D13)","pildora":"DIPUTACIÓN LOCAL","icono":"congreso"},"fed":{"clave":"fed","json":"federal","largo":"Diputación federal","corto":"Dip. federal","chip":"DIP. FEDERAL (preliminar)","primera":"Diputación federal (preliminar)","pildora":"DIPUTACIÓN FEDERAL","icono":"congreso"}},"BOLETAS":["ayun","dip","fed"],"BLOQUE":{"MC":"MC","MORENA_ALIADOS":"Coalición de Morena","PAN_PRI":"Coalición PAN-PRI","OTROS":"Otros y nulos"},"BLOQUE_DEF":{"MC":"Movimiento Ciudadano","MORENA_ALIADOS":"Morena, PT, PVEM y Hagamos/Futuro","PAN_PRI":"PAN y PRI","OTROS":"otros partidos y votos nulos"},"BLOQUE_FRASE":{"MORENA_ALIADOS":"la coalición de Morena","PAN_PRI":"la coalición PAN-PRI","OTROS":"otros y nulos"},"FEMENINO":["MORENA_ALIADOS","PAN_PRI"],"BLOQUE_DEF_FED":{"MORENA_ALIADOS":"Morena, PT y PVEM"},"PARTIDO":{"MC":"MC","MORENA":"Morena","PT":"PT","PVEM":"PVEM","HAG_FUT":"Hagamos/Futuro","PAN":"PAN","PRI":"PRI","OTROS":"Otros y nulos"},"COLOR":{"MC":"#ef852e","MORENA":"#ab2e45","PVEM":"#7cc957","PAN":"#0b5cad","PRI":"#157a3f","PT":"#d93025","HAG_FUT":"#7d5ba6","OTROS":"#9aa5b1","MORENA_ALIADOS":"#ab2e45","PAN_PRI":"#0b5cad"},"COLOR_OSCURO":{"MORENA":"#dd4c62","MORENA_ALIADOS":"#dd4c62","PAN":"#4b8ee6","PAN_PRI":"#4b8ee6"},"SUPERFICIE":{"claro":"#ffffff","oscuro":"#0b1117"},"SOBRE":{"blanco":"#ffffff","negro":"#111111"},"UI":{"acc":"#7c74ff","acc_2_oscuro":"#9a90ff","acc_2_claro":"#4b44c9"},"UMBRAL":{"GANA":80,"VENTAJA":60},"MESES":["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],"DISTRITO_LOCAL":{"8":{"corto":"D8","largo":"Distrito local 8 (D8)","ambito":"D8"},"9":{"corto":"D9","largo":"Distrito local 9 (D9)","ambito":"D9"},"11":{"corto":"D11","largo":"Distrito local 11 (D11)","ambito":"D11"},"13":{"corto":"D13*","largo":"D13 · solo su franja de Guadalajara ({n} secc.; cab. Tlaquepaque)","ambito":"D13 (solo su franja de Guadalajara)","n_secc":73}},"DISTRITOS":["8","9","11","13"],"DISTRITO_FEDERAL":{"8":{"corto":"DF8","largo":"Distrito federal 8 (DF8)"},"9":{"corto":"DF9","largo":"Distrito federal 9 (DF9)"},"11":{"corto":"DF11","largo":"Distrito federal 11 (DF11)"},"13":{"corto":"DF13","largo":"Distrito federal 13 (DF13 · Santa María Tequepexpan; no es el D13 local)"}},"TEXTO":{"S0":"S0 · sin la crisis de octubre (referencia, no posible hoy)","MODELO_AGO":"Modelo ago-2026 (anterior al motor v8)","MODELO_AGO_CORTO":"Modelo ago-2026","CORRIDAS_80":"8 de cada 10 corridas","SIN_RANGO":"(sin rango)","SIN_DATO":"s/d","SIN_COMPUTO":"sin cómputo","CAMBIA_GANADOR":"Cambia de ganador vs S0","AGENTES":"Perfiles de votante (agentes)","MAS_VOTOS":"Más votos en este recorte","SUMA_DISTRITOS":"Voto sumado de los 4 distritos (no elige a nadie)","TOCA_PUNTO":"Toca o pasa el cursor sobre un punto o una fila para ver el detalle.","RESTO":"Resto","TODA_GDL":"toda Guadalajara","FIJO":"Fijo:","FIJO_SUFIJO":"(no sigue los filtros de arriba)","NOTA_D13":"* D13: aquí solo cuenta su franja de Guadalajara (73 secciones); la cabecera del distrito está en Tlaquepaque.","NOTA_DF13":"DF13 «Santa María Tequepexpan» es un distrito federal y no es el D13 local.","DATOS_AL":"Datos","CTX_ESTAS":"Estás viendo:","CTX_BOLETA":"Boleta","CTX_ESCENARIO":"Escenario","CTX_DISTRITO":"Distrito","CTX_CORTE":"Corte","CTX_TODAS":"Las 3 boletas","CTX_TODOS_ESC":"Todos los escenarios","CTX_TODA_GDL":"Toda Guadalajara","CTX_CARGANDO":"cargando…","PRELIMINAR":"PRELIMINAR","ADELANTE_CORRIDAS":"VA ADELANTE · % DE CORRIDAS","DE_LAS_CORRIDAS":"de las corridas","PROB_FAVORITO":"probabilidad del que va adelante","NO_PROYECTADO":"Fuera del alcance del modelo (no se proyecta)","IR_A":"Ir a","SALTAR":"Saltar al contenido","MAS_DETALLE":"Más detalle","MAS_ANALISIS":"Más análisis del motor","MAS_FILTROS":"Más filtros","MOSTRAR":"Mostrar","OCULTAR":"Ocultar","CHAT_EJEMPLO":"Escribe tu pregunta…","CHAT_ENVIAR":"Enviar pregunta","CHAT_SUGERIDAS":"Preguntas sugeridas","CHAT_BORRAR":"Borrar conversación","CHAT_TU":"Tu pregunta","CHAT_RESPUESTA":"Respuesta con datos del motor","CHAT_ROTULO":"Pregunta","INACTIVO":"Sin datos por sección","PAREJO":"Parejo","SIN_DATO_LARGO":"Sin dato","POR_CANDIDATURA":"Quién va adelante se calcula por coalición, como en 2024: la coalición de Morena junta a Morena, PT, PVEM y Hagamos/Futuro, y la coalición PAN-PRI al PAN y al PRI","POR_CANDIDATURA_FED":"Quién va adelante se calcula por coalición, como en 2024: la coalición de Morena junta a Morena, PT y PVEM, y la coalición PAN-PRI al PAN y al PRI","POR_COALICION":"por coalición","REPARTO_ESTIMADO":"reparto estimado por partido","REPARTO_NOTA":"Reparto estimado por partido (cálculo propio): el voto de cada coalición se reparte entre sus partidos con la proporción de cada uno dentro de ella.","NO_COMPITE":"no compite en esta boleta","TOTAL_CANDIDATURA":"Total de la coalición","PARTIDO":"Partido","CANDIDATURA":"Coalición"},"MARCA":{"titulo":"MC · Guadalajara","sub":"Delgadillo · alcaldía 2027","panorama":"PANORAMA INTEGRAL GUADALAJARA","pie":"PROYECCIONES POLÍTICAS ELECTORALES · 2027 · PANORAMA GUADALAJARA","nav_aria":"Secciones del tablero"},"PAGINAS":[{"id":"mapa","href":"index.html","txt":"Mapa","clave":"mapa","archivo":"index.html","rotulo":"MAPA","titulo":"PE 2027","pildora":"PROYECCIONES ELECTORALES","contexto":["b","e","d"],"fijo":{},"pregunta":"¿Cómo va y dónde?"},{"id":"diputaciones","href":"diputaciones.html","txt":"Diputaciones","clave":"diputaciones","archivo":"diputaciones.html","rotulo":"DIPUTACIONES","titulo":"DIPUTACIONES 2027","pildora":"ALCALDÍA Y DIPUTACIONES","contexto":["e","d"],"fijo":{"b":"todas"},"pregunta":"¿Quién gana cada boleta y cada distrito?"},{"id":"comparativo","href":"comparativo.html","txt":"Comparativo","clave":"comparativo","archivo":"comparativo.html","rotulo":"COMPARATIVO","titulo":"COMPARATIVO 2027","pildora":"MOTOR VS ENCUESTAS","contexto":["e"],"fijo":{"b":"ayun"},"pregunta":"¿Coinciden el modelo y las encuestas?"},{"id":"territorio","href":"territorio.html","txt":"Territorio","clave":"territorio","archivo":"territorio.html","rotulo":"TERRITORIO","titulo":"TERRITORIO 2027","pildora":"DÓNDE SE GANA Y DÓNDE SE PIERDE","contexto":["b","e","d"],"fijo":{},"pregunta":"¿En qué secciones y zonas?"},{"id":"simulacion","href":"simulacion.html","txt":"Simulación","clave":"simulacion","archivo":"simulacion.html","rotulo":"SIMULACIÓN","titulo":"SIMULACIÓN 2027","pildora":"{BOLETA} · JUNIO 2027","contexto":["b","e","d"],"fijo":{},"pregunta":"¿Qué pasa si…? ¿Quién decide?"},{"id":"monitoreo","href":"monitoreo.html","txt":"Monitoreo","clave":"monitoreo","archivo":"monitoreo.html","rotulo":"MONITOREO","titulo":"MONITOREO 2027","pildora":"ENCUESTAS · PRENSA · REDES","contexto":[],"fijo":{"b":"todas","e":"todos"},"pregunta":"¿Qué se dice y qué riesgo trae?"},{"id":"fuentes","href":"fuentes.html","txt":"Fuentes","clave":"fuentes","archivo":"fuentes.html","rotulo":"FUENTES","titulo":"FUENTES 2027","pildora":"DATOS, MÉTODO Y LÍMITES","contexto":[],"fijo":{"b":"todas","e":"todos"},"pregunta":"¿De dónde sale cada cifra?"}],"TEMA_CLAVES":["pvem_tema","pan_tema","mz_tema"],"PROHIBIDOS":[{"patron":"Ayuntamiento \\(alcald[ií]a\\)","sustituto":"Alcaldía (elección de ayuntamiento)","auto":true,"i":true},{"patron":"boleta municipal","sustituto":"Alcaldía","auto":true,"i":true},{"patron":"ayuntamientos 2027","sustituto":"Alcaldía 2027","auto":true,"i":true},{"patron":"Distritos MR","sustituto":"Diputación local (4 distritos)","auto":true,"i":true},{"patron":"Morena ?\\+ ?aliados","sustituto":"Coalición de Morena","auto":true,"i":true},{"patron":"y aliados","sustituto":"«Coalición de Morena» (rótulo) o «coalición de Morena (Morena, PT, PVEM y Hagamos/Futuro)» (frase)","auto":true,"i":true},{"patron":"PAN y PRI","sustituto":"«Coalición PAN-PRI» (rótulo) o «la coalición PAN-PRI» (frase); como lista de partidos puede quedar","auto":false,"i":false},{"patron":"Morena ?\\+ ?PT ?\\+ ?PVEM","sustituto":"Morena, PT, PVEM y Hagamos/Futuro","auto":true,"i":true},{"patron":"PAN ?/ ?PRI","sustituto":"Coalición PAN-PRI","auto":true,"i":true},{"patron":"PAN ?\\+ ?PRI","sustituto":"Coalición PAN-PRI","auto":true,"i":true},{"patron":"\\bCoal\\b","sustituto":"el nombre de la coalición (p. ej. «Coalición de Morena»)","auto":true,"i":true},{"patron":"Pred\\. ?27","sustituto":"Modelo ago-2026 (anterior al motor v8)","auto":true,"i":true},{"patron":"\\bflip\\b","sustituto":"Cambia de ganador vs S0","auto":true,"i":true},{"patron":"\\bIC ?80\\b","sustituto":"entre X y Y (8 de cada 10 corridas)","auto":true,"i":true},{"patron":"réplicas","sustituto":"corridas","auto":true,"i":true},{"patron":"(?<!elecci[oó]n de )\\bayuntamiento\\b","sustituto":"«Alcaldía (elección de ayuntamiento)» la primera vez; luego «Alcaldía»","auto":false,"i":true},{"patron":"\\bMOR\\b","sustituto":"«Coalición de Morena» (coalición) o «Morena» (partido)","auto":false,"i":false},{"patron":"\\bMORENA\\b","sustituto":"«Coalición de Morena» si es la coalición; «Morena» si es el partido","auto":false,"i":false},{"patron":"Morena \\(sola\\)","sustituto":"Morena","auto":true,"i":true},{"patron":"\\bp10\\b|\\bp90\\b","sustituto":"entre X y Y (8 de cada 10 corridas)","auto":false,"i":true}],"ALIAS":{"MORENA_Y_ALIADOS":"MORENA_ALIADOS","MORENA_ALIADOS":"MORENA_ALIADOS","MORENA_SOLA":"MORENA","PAN_Y_PRI":"PAN_PRI","PANPRI":"PAN_PRI","HAGAMOS":"HAG_FUT","FUTURO":"HAG_FUT","HAGAMOS_FUTURO":"HAG_FUT","OTROS_NULOS":"OTROS","OTROS_Y_NULOS":"OTROS","NULOS":"OTROS","MOVIMIENTO_CIUDADANO":"MC","COALICIÓN_DE_MORENA":"MORENA_ALIADOS","COALICION_DE_MORENA":"MORENA_ALIADOS","COALICIÓN_PAN-PRI":"PAN_PRI","COALICION_PAN-PRI":"PAN_PRI","PAN-PRI":"PAN_PRI"},"BOLETA_ALIAS":{"ayun":"ayun","alcaldia":"ayun","alcaldía":"ayun","ayuntamiento":"ayun","dip":"dip","diputacion":"dip","diputación":"dip","local":"dip","fed":"fed","federal":"fed"},"RAMPA":{"MC":["#fde7cf","#f5b46a","#ef852e","#8a4b00"],"MORENA_ALIADOS":["#f3d3db","#d97a90","#ab2e45","#4d0b1d"],"NEUTRA":["#d9f5ec","#5fe3c6","#00807c","#062a3d"]},"DISENO":{"verde":"#00807c","teal":"#13a196","petroleo":"#05617a","marino":"#062a3d","menta":"#5fe3c6","azul_noche":"#05324a","noche":"#0b1117","tinta":"#1d2228","tinta_titulo":"#25272b","tinta_2":"#4a525b","borde":"#e3e6e8","pista":"#eef0f2","ambar":"#e08a1e","ambar_fondo":"#fff6e6","ambar_tinta":"#8a4b00","sube":"#1a7f45","baja":"#b3261e","sin_dato":"#c9ced3"},"LOGO":{"MC":{"tipo":"img","src":"img/logo_mc.png","alt":"Movimiento Ciudadano","ancho":205,"alto":125},"MORENA":{"tipo":"img","src":"img/logo_morena.png","alt":"Morena","ancho":317,"alto":56},"MORENA_ALIADOS":{"tipo":"texto","txt":"Coalición de Morena","alt":"Coalición de Morena (Morena, PT, PVEM y Hagamos/Futuro)"},"PAN":{"tipo":"texto","txt":"PAN","alt":"PAN"},"PRI":{"tipo":"texto","txt":"PRI","alt":"PRI"},"PAN_PRI":{"tipo":"texto","txt":"Coalición PAN-PRI","alt":"Coalición PAN-PRI"},"PVEM":{"tipo":"texto","txt":"PVEM","alt":"PVEM"},"PT":{"tipo":"texto","txt":"PT","alt":"PT"},"HAG_FUT":{"tipo":"texto","txt":"Hagamos/Futuro","alt":"Hagamos/Futuro"},"OTROS":{"tipo":"texto","txt":"Otros","alt":"Otros y nulos"}},"PAGINA_ALIAS":{"":"mapa","index":"mapa","alcaldia":"mapa","alcaldía":"mapa","simulación":"simulacion"},"ESTADO":{"b":"ayun","e":"S1","d":"","clave_local":"pp_estado"},"COLOR_TEXTO":{"claro":{"MC":"#b55700","MORENA":"#9a1c37","MORENA_ALIADOS":"#9a1c37"},"oscuro":{"MC":"#ffa460","MORENA":"#f56b7c","MORENA_ALIADOS":"#f56b7c"}},"COLOR_SOBRE":{"MC":"#1c0e00","PVEM":"#10300a"},"CONGRESO":{"curules":38,"filas":[10,13,15],"fuente":"decisiones/SPEC_curules_2026-11-04.md (Congreso de Jalisco: 38 curules)"},"PARTIDOS":["MC","MORENA","PT","PVEM","HAG_FUT","PAN","PRI","OTROS"],"PARTIDO_LARGO":{"MC":"Movimiento Ciudadano","MORENA":"Morena","PT":"Partido del Trabajo","PVEM":"Partido Verde Ecologista de México","HAG_FUT":"Hagamos y Futuro (partidos locales de Jalisco)","PAN":"Partido Acción Nacional","PRI":"Partido Revolucionario Institucional (incluye PRD)","OTROS":"Otros partidos y votos nulos"},"CANDIDATURAS":["MC","MORENA_ALIADOS","PAN_PRI","OTROS"],"CANDIDATURA":{"MC":["MC"],"MORENA_ALIADOS":["MORENA","PT","PVEM","HAG_FUT"],"PAN_PRI":["PAN","PRI"],"OTROS":["OTROS"]},"CANDIDATURA_FED":{"MORENA_ALIADOS":["MORENA","PT","PVEM"]},"NATURALEZA":{"MOTOR":"estimación del motor","REPARTO":"reparto estimado por partido","CALCULO":"cálculo propio"}};
var CSS_PARTIDOS=":root{--p-mc:#ef852e;--p-mc-txt:#b55700;--p-mc-sobre:#1c0e00;--p-morena:#ab2e45;--p-morena-txt:#9a1c37;--p-morena-sobre:#ffffff;--p-pvem:#7cc957;--p-pvem-txt:#518339;--p-pvem-sobre:#10300a;--p-pan:#0b5cad;--p-pan-txt:#0b5cad;--p-pan-sobre:#ffffff;--p-pri:#157a3f;--p-pri-txt:#157a3f;--p-pri-sobre:#ffffff;--p-pt:#d93025;--p-pt-txt:#d93025;--p-pt-sobre:#ffffff;--p-hag-fut:#7d5ba6;--p-hag-fut-txt:#7d5ba6;--p-hag-fut-sobre:#ffffff;--p-otros:#9aa5b1;--p-otros-txt:#6c737c;--p-otros-sobre:#111111;--p-morena-aliados:#ab2e45;--p-morena-aliados-txt:#9a1c37;--p-morena-aliados-sobre:#ffffff;--p-pan-pri:#0b5cad;--p-pan-pri-txt:#0b5cad;--p-pan-pri-sobre:#ffffff}\nhtml:not([data-tema=\"claro\"]){--p-mc:#ef852e;--p-mc-txt:#ffa460;--p-mc-sobre:#1c0e00;--p-morena:#dd4c62;--p-morena-txt:#f56b7c;--p-morena-sobre:#111111;--p-pvem:#7cc957;--p-pvem-txt:#7cc957;--p-pvem-sobre:#10300a;--p-pan:#4b8ee6;--p-pan-txt:#4b8ee6;--p-pan-sobre:#111111;--p-pri:#157a3f;--p-pri-txt:#388e5c;--p-pri-sobre:#ffffff;--p-pt:#d93025;--p-pt-txt:#dd453b;--p-pt-sobre:#ffffff;--p-hag-fut:#7d5ba6;--p-hag-fut-txt:#9174b3;--p-hag-fut-sobre:#ffffff;--p-otros:#9aa5b1;--p-otros-txt:#9aa5b1;--p-otros-sobre:#111111;--p-morena-aliados:#dd4c62;--p-morena-aliados-txt:#f56b7c;--p-morena-aliados-sobre:#111111;--p-pan-pri:#4b8ee6;--p-pan-pri-txt:#4b8ee6;--p-pan-pri-sobre:#111111}\n@media print{html:not([data-tema=\"claro\"]){--p-mc:#ef852e;--p-mc-txt:#b55700;--p-mc-sobre:#1c0e00;--p-morena:#ab2e45;--p-morena-txt:#9a1c37;--p-morena-sobre:#ffffff;--p-pvem:#7cc957;--p-pvem-txt:#518339;--p-pvem-sobre:#10300a;--p-pan:#0b5cad;--p-pan-txt:#0b5cad;--p-pan-sobre:#ffffff;--p-pri:#157a3f;--p-pri-txt:#157a3f;--p-pri-sobre:#ffffff;--p-pt:#d93025;--p-pt-txt:#d93025;--p-pt-sobre:#ffffff;--p-hag-fut:#7d5ba6;--p-hag-fut-txt:#7d5ba6;--p-hag-fut-sobre:#ffffff;--p-otros:#9aa5b1;--p-otros-txt:#6c737c;--p-otros-sobre:#111111;--p-morena-aliados:#ab2e45;--p-morena-aliados-txt:#9a1c37;--p-morena-aliados-sobre:#ffffff;--p-pan-pri:#0b5cad;--p-pan-pri-txt:#0b5cad;--p-pan-pri-sobre:#ffffff}}";
var T=D.TEXTO, NBSP=' ', MENOS='−';
function vacio(x){ return x==null||(typeof x==='number'&&isNaN(x)); }
function clave(k){
 if(k==null) return '';
 var s=String(k).trim().toUpperCase().replace(/\(/g,'').replace(/\)/g,'');
 s=s.replace(/[\s+\/]+/g,'_').replace(/^_+|_+$/g,'');
 return Object.prototype.hasOwnProperty.call(D.ALIAS,s)?D.ALIAS[s]:s;
}
function has(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }
function nombre(k){
 if(k==null) return T.SIN_DATO;
 var c=clave(k);
 if(has(D.BLOQUE,c)) return D.BLOQUE[c];
 if(has(D.PARTIDO,c)) return D.PARTIDO[c];
 return String(k);
}
function bol(b){ var s=b==null?'':String(b).trim().toLowerCase(); return has(D.BOLETA_ALIAS,s)?D.BOLETA_ALIAS[s]:'ayun'; }
function bloque_def(k,boleta){
 if(boleta===undefined) boleta='ayun';
 var c=clave(k);
 if(bol(boleta)==='fed'&&has(D.BLOQUE_DEF_FED,c)) return D.BLOQUE_DEF_FED[c];
 return has(D.BLOQUE_DEF,c)?D.BLOQUE_DEF[c]:nombre(k);
}
function en_frase(k){
 if(k==null) return T.SIN_DATO;
 var c=clave(k);
 if(has(D.BLOQUE_FRASE,c)) return D.BLOQUE_FRASE[c];
 return nombre(k);
}
function coalicion(k,boleta){
 if(boleta===undefined) boleta='ayun';
 var c=clave(k);
 if(c==='MORENA_ALIADOS') return 'coalición de Morena ('+bloque_def(c,boleta)+')';
 if(c==='PAN_PRI') return 'coalición PAN-PRI';
 return nombre(k);
}
function favoritoDe(k){ return D.FEMENINO.indexOf(clave(k))>=0?'favorita':'favorito'; }
function tnorm(t){ return t==='oscuro'?'oscuro':'claro'; }
function color(k,tema){
 var c=clave(k);
 if(tnorm(tema)==='oscuro'&&has(D.COLOR_OSCURO,c)) return D.COLOR_OSCURO[c];
 return has(D.COLOR,c)?D.COLOR[c]:D.COLOR.OTROS;
}
function rgb(h){ h=h.replace(/^#/,''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function hex(a){ return '#'+a.map(function(v){ v=Math.max(0,Math.min(255,Math.trunc(v))); return (v<16?'0':'')+v.toString(16); }).join(''); }
function lum(h){
 function ch(v){ v=v/255; return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4); }
 var c=rgb(h); return 0.2126*ch(c[0])+0.7152*ch(c[1])+0.0722*ch(c[2]);
}
function contraste(a,b){ var la=lum(a),lb=lum(b),hi=la>=lb?la:lb,lo=la>=lb?lb:la; return (hi+0.05)/(lo+0.05); }
function color_texto(k,tema){
 var t=tnorm(tema), base=color(k,t), fondo=D.SUPERFICIE[t], c0=rgb(base), ck=clave(k);
 if(has(D.COLOR_TEXTO[t],ck)&&contraste(D.COLOR_TEXTO[t][ck],fondo)>=4.5) return D.COLOR_TEXTO[t][ck];
 for(var i=0;i<21;i++){
  var f=i/20, c=hex(c0.map(function(v){ return t==='claro'?Math.floor(v*(1-f)+0.5):Math.floor(v+(255-v)*f+0.5); }));
  if(contraste(c,fondo)>=4.5) return c;
 }
 return t==='claro'?'#000000':'#ffffff';
}
function color_sobre(k,tema){
 var base=color(k,tema), bl=D.SOBRE.blanco, ng=D.SOBRE.negro, ck=clave(k);
 if(has(D.COLOR_SOBRE,ck)&&contraste(D.COLOR_SOBRE[ck],base)>=4.5) return D.COLOR_SOBRE[ck];
 return contraste(bl,base)>=contraste(ng,base)?bl:ng;
}
function red(x,dec){ if(dec===undefined) dec=1; var f=Math.pow(10,dec), s=x<0?-1:1; return s*Math.floor(Math.abs(x)*f+0.5+1e-9)/f; }
function num(x,dec){
 if(vacio(x)) return T.SIN_DATO;
 if(dec===undefined) dec=0;
 var v=red(+x,dec); if(v===0) v=0;
 var p=Math.abs(v).toFixed(dec).split('.');
 p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');
 return (v<0?MENOS:'')+p.join('.');
}
function pct(x,dec){ if(vacio(x)) return T.SIN_DATO; if(dec===undefined) dec=1; return num(x,dec)+NBSP+'%'; }
function pp(x,dec,vs){
 if(vacio(x)) return T.SIN_DATO;
 if(dec===undefined) dec=1;
 var v=red(+x,dec), sg=v>0?'+':(v<0?MENOS:'');
 return sg+Math.abs(v).toFixed(dec)+NBSP+'pp'+(vs?' vs '+String(vs):'');
}
function rango(lo,hi,dec){
 if(dec===undefined) dec=1;
 if(vacio(lo)||vacio(hi)||red(+lo,dec)===red(+hi,dec)) return T.SIN_RANGO;
 return 'entre '+num(lo,dec)+' y '+num(hi,dec)+' ('+T.CORRIDAS_80+')';
}
function pct_corridas(p,dec){
 if(vacio(p)) return T.SIN_DATO;
 if(dec===undefined) dec=1;
 if(p>=99.5) return 'más del 99'+NBSP+'% de las corridas';
 if(p<=0.5) return 'menos del 1'+NBSP+'% de las corridas';
 return pct(p,dec)+' de las corridas';
}
function fecha(iso){
 var s=iso==null?'':String(iso), m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s);
 if(!m||+m[2]<1||+m[2]>12) return s;
 return String(+m[3])+'-'+D.MESES[+m[2]-1]+'-'+m[1];
}
function mes(iso,corto){
 var s=iso==null?'':String(iso), m=/^(\d{4})-(\d{2})/.exec(s);
 if(!m||+m[2]<1||+m[2]>12) return s;
 return D.MESES[+m[2]-1]+'-'+(corto?m[1].slice(2):m[1]);
}
function datos_al(iso,que){ return (que?que:T.DATOS_AL)+' al '+fecha(iso); }
function veredicto(pg){
 var arr=Object.keys(pg||{}).map(function(k){ return [k,pg[k]]; }).filter(function(kv){ return !vacio(kv[1]); });
 arr.sort(function(a,b){ return b[1]-a[1]; });
 if(!arr.length) return {txt:T.SIN_DATO,nivel:null,lider:null,b:null,p:null,detalle:''};
 var k=arr[0][0], p=arr[0][1], nivel, txt;
 if(p>=D.UMBRAL.GANA){ nivel='gana'; txt='Gana '+nombre(k); }
 else if(p>=D.UMBRAL.VENTAJA){ nivel='ventaja'; txt='Ventaja '+nombre(k); }
 else { nivel='empate'; txt='Empate técnico'; }
 var det=nivel==='empate'?nombre(k)+' '+pct(p)+(arr.length>1?' · '+nombre(arr[1][0])+' '+pct(arr[1][1]):'')+' '+T.DE_LAS_CORRIDAS+' · nadie llega a '+pct(D.UMBRAL.VENTAJA,0)
  :nombre(k)+' por delante en '+pct_corridas(p);
 return {txt:txt,nivel:nivel,lider:k,b:nivel==='empate'?null:k,p:p,detalle:det};
}
function mas_votos(k){ return T.MAS_VOTOS+': '+nombre(k); }
function corridas_suma(k,n){
 var nd=(n==null)?D.DISTRITOS.length:n;
 return T.DE_LAS_CORRIDAS+', '+en_frase(k)+' suma más votos en los '+String(nd)+' distritos (no elige a nadie)';
}
function escenario_corto(n){
 var s=n==null?'':String(n), central=s.indexOf('(central)')>=0;
 s=s.split(':')[0].replace(/\s*\([^)]*\)/g,'').trim();
 return s+(central?' (central)':'');
}
function escenario(eid,n){
 if(eid&&typeof eid==='object'){ n=eid.nombre; eid=eid.id; }
 eid=eid==null?'':String(eid);
 if(eid==='S0') return T.S0;
 var c=n?escenario_corto(n):'';
 return c?eid+' · '+c:eid;
}
function escenario_central(es){
 es=es||[];
 for(var i=0;i<es.length;i++){ if(String(es[i].nombre||'').indexOf('(central)')>=0) return es[i].id; }
 return 'S1';
}
function dnum(d){ return (d==null?'':String(d)).trim().toUpperCase().replace(/^(DF|DL|D)/,''); }
function distrito(dl,corto,nSecc){
 var k=dnum(dl), d=has(D.DISTRITO_LOCAL,k)?D.DISTRITO_LOCAL[k]:null;
 if(!d) return corto?'D'+k:'Distrito local '+k+' (D'+k+')';
 if(corto) return d.corto;
 var n=(nSecc!=null)?nSecc:d.n_secc;
 return d.largo.replace('{n}',String(n));
}
function distrito_federal(df,corto){
 var k=dnum(df), d=has(D.DISTRITO_FEDERAL,k)?D.DISTRITO_FEDERAL[k]:null;
 if(!d) return corto?'DF'+k:'Distrito federal '+k+' (DF'+k+')';
 return corto?d.corto:d.largo;
}
function ambito(dl,boleta){
 if(boleta===undefined) boleta='ayun';
 if(dl==null||['','todos','todo','all','gdl'].indexOf(String(dl).trim().toLowerCase())>=0) return T.TODA_GDL;
 if(bol(boleta)==='fed') return distrito_federal(dl,true);
 var k=dnum(dl), d=has(D.DISTRITO_LOCAL,k)?D.DISTRITO_LOCAL[k]:null;
 return d?d.ambito:'D'+k;
}
function eidDe(e){ if(e&&typeof e==='object') return String(e.id); return e==null?'':String(e); }
function rotulo(boleta,esc,dl){ var b=bol(boleta); return D.BOLETA[b].chip+' · '+eidDe(esc)+' · '+ambito(dl,b); }
function fijo(boleta,esc,dl){ var b=bol(boleta); return T.FIJO+' '+D.BOLETA[b].corto+' · '+eidDe(esc)+' · '+ambito(dl,b)+' '+T.FIJO_SUFIJO; }
function adelante(dl,boleta){ if(boleta===undefined) boleta='dip'; return 'Adelante en '+ambito(dl,boleta); }
function resumen_distritos(lideres,boleta){
 if(boleta===undefined) boleta='dip';
 var b=bol(boleta); lideres=lideres||{};
 var ks=Object.keys(lideres).sort(function(x,y){ return (parseInt(String(x).replace(/\D/g,'')||'0',10))-(parseInt(String(y).replace(/\D/g,'')||'0',10)); });
 var grupos=[], idx={};
 ks.forEach(function(d){ var l=lideres[d], lk=l==null?'':String(l); if(!has(idx,lk)){ idx[lk]=grupos.length; grupos.push([l,[]]); } grupos[idx[lk]][1].push(d); });
 function nombrado(l){ return l!=null&&String(l)!=='PAREJO'; }
 grupos.sort(function(a,c){ return ((nombrado(a[0])?0:1)-(nombrado(c[0])?0:1))||(c[1].length-a[1].length); });
 var primero=true;
 var partes=grupos.map(function(g){
  var lista=g[1].map(function(d){ return b==='fed'?distrito_federal(d,true):distrito(d,true); }).join(', '), t;
  if(!nombrado(g[0])) return (g[0]!=null?T.PAREJO.toLowerCase():T.SIN_DATO)+' en '+g[1].length+' ('+lista+')';
  if(b==='ayun') t=(primero?'más votos para '+en_frase(g[0]):nombre(g[0]))+' en '+g[1].length+' ('+lista+')';
  else t=nombre(g[0])+(primero?' '+favoritoDe(g[0])+' en ':' en ')+g[1].length+' ('+lista+')';
  primero=false; return t;
 });
 return ks.length+' distritos: '+partes.join(' · ');
}
function lista_nominal(n,corte){ if(corte===undefined) corte='jul-2025'; return 'Lista nominal INE ('+String(corte)+'): '+num(n); }
function buscar_prohibidos(texto,soloAuto){
 var out=[];
 D.PROHIBIDOS.forEach(function(p){
  if(soloAuto&&!p.auto) return;
  var re=new RegExp(p.patron,p.i?'gi':'g'), m, s=texto||'';
  while((m=re.exec(s))!==null){ out.push({patron:p.patron,encontrado:m[0],pos:m.index,sustituto:p.sustituto,auto:p.auto}); if(m[0]==='') re.lastIndex++; }
 });
 return out;
}
function pagina(k){
 var s=(k==null?'':String(k)).trim().toLowerCase();
 s=s.replace(/[?#].*$/,'').split('/').pop().replace(/\.html$/,'');
 if(has(D.PAGINA_ALIAS,s)) s=D.PAGINA_ALIAS[s];
 for(var i=0;i<D.PAGINAS.length;i++){ if(D.PAGINAS[i].clave===s) return D.PAGINAS[i]; }
 return null;
}
function pildora(k,boleta){
 if(boleta===undefined) boleta='ayun';
 var p=pagina(k);
 if(!p) return '';
 return p.pildora.replace('{BOLETA}',D.BOLETA[bol(boleta)].pildora);
}
function logo(k){
 var c=clave(k);
 if(has(D.LOGO,c)) return D.LOGO[c];
 return {tipo:'texto',txt:nombre(k),alt:nombre(k)};
}
function rampa(k){
 var c=clave(k);
 if(c==='MORENA') c='MORENA_ALIADOS';
 return has(D.RAMPA,c)?D.RAMPA[c]:D.RAMPA.NEUTRA;
}
function partidos(boleta){
 if(boleta===undefined) boleta='ayun';
 var b=bol(boleta);
 return D.PARTIDOS.filter(function(p){ return !(b==='fed'&&p==='HAG_FUT'); });
}
function partidos_de(k,boleta){
 if(boleta===undefined) boleta='ayun';
 var c=clave(k), b=bol(boleta);
 if(b==='fed'&&has(D.CANDIDATURA_FED,c)) return D.CANDIDATURA_FED[c].slice();
 if(has(D.CANDIDATURA,c)) return D.CANDIDATURA[c].slice();
 if(has(D.PARTIDO,c)) return partidos(b).indexOf(c)>=0?[c]:[];
 return [];
}
function candidatura(k){
 var c=clave(k);
 if(has(D.CANDIDATURA,c)) return c;
 for(var i=0;i<D.CANDIDATURAS.length;i++){ if(D.CANDIDATURA[D.CANDIDATURAS[i]].indexOf(c)>=0) return D.CANDIDATURAS[i]; }
 return '';
}
function nombre_largo(k){
 var c=clave(k);
 if(has(D.PARTIDO_LARGO,c)&&c!=='MORENA_ALIADOS'&&c!=='PAN_PRI') return D.PARTIDO_LARGO[c];
 if(c==='MORENA_ALIADOS'||c==='PAN_PRI') return coalicion(c);
 if(has(D.BLOQUE_DEF,c)) return D.BLOQUE_DEF[c];
 return nombre(k);
}
function rotulo_candidatura(boleta){ if(boleta===undefined) boleta='ayun'; return bol(boleta)==='fed'?T.POR_CANDIDATURA_FED:T.POR_CANDIDATURA; }
/* Solo JS: tema de la página (data-tema; sin atributo = oscuro, como v8.js). */
function tema(){ try{ return document.documentElement.getAttribute('data-tema')==='claro'?'claro':'oscuro'; }catch(e){ return 'oscuro'; } }
function colorTema(k){ return color(k,tema()); }
function colorTextoTema(k){ return color_texto(k,tema()); }
function colorSobreTema(k){ return color_sobre(k,tema()); }
/* Variables CSS --p-* (css_partidos() de nombres.py): se inyectan una vez, al principio de <head>, para que
   cualquier regla de la página pueda usar var(--p-pvem,#3fae2a) y siga el tema sin JS. */
try{
 if(typeof document!=='undefined'&&document.head&&!document.getElementById('nombres-partidos')){
  var st=document.createElement('style'); st.id='nombres-partidos'; st.textContent=CSS_PARTIDOS;
  document.head.insertBefore(st,document.head.firstChild);
 }
}catch(e){}

var F={clave:clave,nombre:nombre,bloque_def:bloque_def,en_frase:en_frase,coalicion:coalicion,bol:bol,color:color,contraste:contraste,color_texto:color_texto,
 color_sobre:color_sobre,
 red:red,num:num,pct:pct,pp:pp,rango:rango,pct_corridas:pct_corridas,fecha:fecha,mes:mes,datos_al:datos_al,
 veredicto:veredicto,mas_votos:mas_votos,corridas_suma:corridas_suma,escenario_corto:escenario_corto,escenario:escenario,
 escenario_central:escenario_central,distrito:distrito,distrito_federal:distrito_federal,ambito:ambito,
 rotulo:rotulo,fijo:fijo,adelante:adelante,resumen_distritos:resumen_distritos,lista_nominal:lista_nominal,
 buscar_prohibidos:buscar_prohibidos,pagina:pagina,pildora:pildora,logo:logo,rampa:rampa,
 partidos:partidos,partidos_de:partidos_de,candidatura:candidatura,nombre_largo:nombre_largo,rotulo_candidatura:rotulo_candidatura,
 tema:tema,colorTema:colorTema,colorTextoTema:colorTextoTema,
 colorSobreTema:colorSobreTema};
var N={CSS_PARTIDOS:CSS_PARTIDOS};
Object.keys(D).forEach(function(k){ N[k]=D[k]; });
Object.keys(F).forEach(function(k){
 N[k]=F[k];
 var cc=k.replace(/_([a-z])/g,function(_,c){ return c.toUpperCase(); });
 if(cc!==k) N[cc]=F[k];
});
root.NOMBRES=N;
if(typeof module!=="undefined"&&module.exports) module.exports=N;
})(typeof window!=="undefined"?window:globalThis);
