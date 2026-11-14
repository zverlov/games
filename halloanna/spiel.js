/* München-Mission · Annas Theaterkarten
 * Spiellogik. Die Inhalte stehen in szenen.js (ORTE, WEGE, SZENEN, ABSCHLUSS, START).
 *
 * Die Karte ist die Bühne. Szenen öffnen sich als Fenster darüber. Nach einer gelösten
 * Szene schließt sich das Fenster, und das Kind tippt auf der Karte den Ort an, zu dem Anna
 * laut Übergangstext geht. Anna läuft hin, dann öffnet sich die nächste Szene. Liegt die
 * nächste Szene am selben Ort, geht es direkt weiter.
 */
(function () {
  "use strict";

  const SPEICHER_SCHLUESSEL = "muenchen-mission-v2";
  const GESAMT = SZENEN.length;
  const MARKEN = ["A", "B", "C"];
  const TEXT_FALSCH = "Schau noch einmal genau hin.";
  const TEXT_RICHTIG = "Richtig!";
  const KARTE_BREITE = 1000;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const START_ORT = SZENEN[0].ort;

  /* ---------- Spielstand ---------- */

  // geloest: IDs der gelösten Szenen in Spielreihenfolge
  // wartetAufWeiter: gelöste Szene, bei der „Weiter“ noch nicht gedrückt wurde
  // annaOrt: Kartenort, an dem Anna gerade steht
  let zustand = { geloest: [], wartetAufWeiter: null, annaOrt: START_ORT };

  function spielstandLaden() {
    try {
      const roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
      if (!roh) return;
      const daten = JSON.parse(roh);
      if (!daten || !Array.isArray(daten.geloest)) return;
      const bekannt = new Set(SZENEN.map((s) => s.id));
      zustand.geloest = daten.geloest.filter((id) => bekannt.has(id));
      zustand.wartetAufWeiter =
        typeof daten.wartetAufWeiter === "string" && zustand.geloest.includes(daten.wartetAufWeiter)
          ? daten.wartetAufWeiter
          : null;
      zustand.annaOrt = ortNachId(daten.annaOrt) ? daten.annaOrt : abgeleiteterAnnaOrt();
    } catch (fehler) {
      /* Speicher gesperrt oder kaputt: die laufende Runde läuft ohne Speichern weiter. */
    }
  }

  function abgeleiteterAnnaOrt() {
    const letzte = zustand.geloest[zustand.geloest.length - 1];
    const szene = letzte ? szeneNachId(letzte) : null;
    return szene ? szene.ort : START_ORT;
  }

  function spielstandSpeichern() {
    try {
      localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(zustand));
    } catch (fehler) {
      /* Speicher gesperrt: ignorieren. */
    }
  }

  function spielstandLoeschen() {
    zustand = { geloest: [], wartetAufWeiter: null, annaOrt: START_ORT };
    try {
      localStorage.removeItem(SPEICHER_SCHLUESSEL);
    } catch (fehler) {
      /* ignorieren */
    }
  }

  /* ---------- Abfragen ---------- */

  const istGeloest = (id) => zustand.geloest.includes(id);
  const szeneNachId = (id) => SZENEN.find((s) => s.id === id) || null;
  const ortNachId = (id) => ORTE.find((o) => o.id === id) || null;
  const szenenVonOrt = (ortId) => SZENEN.filter((s) => s.ort === ortId);
  const szenenNummer = (szene) => SZENEN.indexOf(szene) + 1;

  function aktuelleSzene() {
    return SZENEN.find((s) => !istGeloest(s.id)) || null;
  }

  function fortsetzungsSzene() {
    if (zustand.wartetAufWeiter) return szeneNachId(zustand.wartetAufWeiter);
    return aktuelleSzene();
  }

  // Anna muss erst noch zum Ort der nächsten Szene finden.
  function istUnterwegs() {
    const aktuell = aktuelleSzene();
    return !!aktuell && aktuell.ort !== zustand.annaOrt;
  }

  function letzteGeloesteSzene() {
    const id = zustand.geloest[zustand.geloest.length - 1];
    return id ? szeneNachId(id) : null;
  }

  // "geloest", "aktuell" (Anna steht hier und hat eine Aufgabe) oder "offen".
  function ortStatus(ort) {
    const szenen = szenenVonOrt(ort.id);
    if (szenen.length && szenen.every((s) => istGeloest(s.id))) return "geloest";
    const aktuell = aktuelleSzene();
    if (aktuell && aktuell.ort === ort.id && zustand.annaOrt === ort.id) return "aktuell";
    return "offen";
  }

  // Reihenfolge der Orte, die Anna nacheinander besucht (ohne Zwischenhalte).
  const STATIONEN = SZENEN.map((s) => s.ort).filter((ort, i, liste) => liste.indexOf(ort) === i);

  function zwischenhaltPassiert(ort) {
    const index = ORTE.indexOf(ort);
    const naechster = ORTE.slice(index + 1).find((o) => !o.zwischenhalt);
    if (!naechster) return false;
    return STATIONEN.indexOf(zustand.annaOrt) >= STATIONEN.indexOf(naechster.id);
  }

  function nummernText(ort) {
    const nummern = szenenVonOrt(ort.id).map(szenenNummer);
    if (!nummern.length) return "";
    return nummern.length === 1 ? String(nummern[0]) : `${nummern[0]}–${nummern[nummern.length - 1]}`;
  }

  function ortHinweis(ort) {
    if (ort.zwischenhalt) return zwischenhaltPassiert(ort) ? "Zwischenhalt, schon vorbei" : "Zwischenhalt ohne Aufgabe";
    return `Aufgabe ${nummernText(ort)}, ` + {
      geloest: "gelöst. Zum Nachlesen öffnen",
      aktuell: "hier ist Anna gerade. Aufgabe öffnen",
      offen: "noch nicht besucht"
    }[ortStatus(ort)];
  }

  /* ---------- DOM-Helfer ---------- */

  const $ = (id) => document.getElementById(id);

  function el(tag, eigenschaften, kinder) {
    const knoten = document.createElement(tag);
    if (eigenschaften) {
      for (const [name, wert] of Object.entries(eigenschaften)) {
        if (wert === null || wert === undefined || wert === false) continue;
        if (name === "class") knoten.className = wert;
        else if (name === "text") knoten.textContent = wert;
        else if (name.startsWith("on")) knoten.addEventListener(name.slice(2), wert);
        else knoten.setAttribute(name, wert === true ? "" : wert);
      }
    }
    if (kinder) {
      for (const kind of [].concat(kinder)) {
        if (kind === null || kind === undefined || kind === false) continue;
        knoten.append(kind);
      }
    }
    return knoten;
  }

  function svg(tag, eigenschaften, kinder) {
    const knoten = document.createElementNS(SVG_NS, tag);
    if (eigenschaften) {
      for (const [name, wert] of Object.entries(eigenschaften)) {
        if (wert === null || wert === undefined || wert === false) continue;
        if (name === "text") knoten.textContent = wert;
        else if (name.startsWith("on")) knoten.addEventListener(name.slice(2), wert);
        else knoten.setAttribute(name, wert);
      }
    }
    if (kinder) for (const kind of [].concat(kinder)) if (kind) knoten.append(kind);
    return knoten;
  }

  function leeren(knoten) {
    while (knoten.firstChild) knoten.removeChild(knoten.firstChild);
  }

  function erzaehlungRendern(ziel, absaetze) {
    leeren(ziel);
    for (const absatz of absaetze) {
      if (typeof absatz === "string") {
        ziel.append(el("p", { text: absatz }));
      } else {
        ziel.append(
          el("div", { class: "rede" }, [
            el("span", { class: "rede-wer", text: absatz.wer }),
            el("p", { class: "rede-text", text: "„" + absatz.sagt + "“" })
          ])
        );
      }
    }
  }

  function fokussieren(knoten) {
    if (!knoten) return;
    window.requestAnimationFrame(() => knoten.focus());
  }

  // Setzt einen Live-Text so, dass Screenreader ihn auch bei Wiederholung vorlesen.
  function statusSetzen(knoten, text, klasse) {
    knoten.className = knoten.className.split(" ")[0] + (klasse ? " " + klasse : "");
    knoten.textContent = "";
    window.setTimeout(() => { knoten.textContent = text; }, 30);
  }

  const bewegungReduziert = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fortschrittAnzeigen() {
    $("fortschritt").textContent = `${zustand.geloest.length} von ${GESAMT} Aufgaben gelöst`;
  }

  /* ---------- Karte ---------- */

  let laeuftGerade = false;
  // Fehlversuche bei der Ortssuche; ab zwei blinkt das Ziel.
  let fehlversuche = 0;
  let fehlversucheZiel = null;

  function hinweisAktiv() {
    const aktuell = aktuelleSzene();
    return !!aktuell && istUnterwegs() && fehlversucheZiel === aktuell.ort && fehlversuche >= 2;
  }

  // Wegweiser-Satz mit hervorgehobenem Zielwort, z. B. „Anna geht zur <strong>Bibliothek</strong>.“
  function wegweiserSatz(weg, ziel, klasse) {
    const wort = weg.ziel || ziel.name;
    const p = el("p", { class: klasse });
    weg.satz.split(wort).forEach((teil, i) => {
      if (i) p.append(el("strong", { class: "ziel", text: wort }));
      if (teil) p.append(document.createTextNode(teil));
    });
    return p;
  }

  // Kleiner Kartenausschnitt mit dem gesuchten Ort (direkt aus karte.svg).
  function suchbild(ort) {
    const [x, y, b, h] = ort.flaeche;
    const rand = 16;
    const bild = svg("svg", {
      class: "suchbild",
      viewBox: `${x - rand} ${y - rand - 12} ${b + 2 * rand} ${h + 2 * rand + 12}`,
      preserveAspectRatio: "xMidYMid slice",
      "aria-hidden": "true",
      focusable: "false"
    });
    const karte = svg("image", { x: 0, y: 0, width: 1000, height: 700, href: "assets/karte.svg" });
    karte.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/karte.svg");
    bild.append(karte);
    return bild;
  }

  function karteRendern() {
    fortschrittAnzeigen();
    leisteRendern();
    orteRendern();
    orteKnoepfeRendern();
    annaSetzen(ortNachId(zustand.annaOrt).anna);
    spurZeichnen();
    $("karte-beschriftung").textContent = istUnterwegs()
      ? "Wohin geht Anna jetzt? Tippe auf den richtigen Ort."
      : "Annas Weg durch Schwabing. Tippe auf einen Ort.";
  }

  // Zeichnet Tippflächen, Nummern und Namen direkt in die Kartenebene (skaliert mit der Karte).
  function orteRendern() {
    const ebene = $("karte-orte");
    leeren(ebene);

    for (const ort of ORTE) {
      const [x, y, b, h] = ort.flaeche;
      const status = ort.zwischenhalt ? null : ortStatus(ort);
      const passiert = ort.zwischenhalt && zwischenhaltPassiert(ort);
      const klein = !!ort.zwischenhalt;
      const radius = klein ? 12 : 18;
      const cx = x + 6;
      const cy = y - 2;
      const links = ort.beschriftung === "links";
      const hinweis = hinweisAktiv() && aktuelleSzene().ort === ort.id;
      const klasse = ["ort", ort.zwischenhalt ? "ist-zwischenhalt" : "ist-" + status, passiert ? "ist-passiert" : "", hinweis ? "ist-hinweis" : ""].join(" ").trim();
      const nummer = ort.zwischenhalt ? (passiert ? "✓" : "·") : status === "geloest" ? "✓" : nummernText(ort);

      const gruppe = svg("g", {
        class: klasse,
        role: "button",
        tabindex: "0",
        "aria-label": `${ort.name}: ${ortHinweis(ort)}`,
        "aria-current": status === "aktuell" ? "step" : null,
        "data-ort": ort.id
      }, [
        svg("rect", { class: "ort-flaeche", x, y, width: b, height: h, rx: 14 }),
        svg("circle", { class: "ort-halo", cx, cy, r: radius }),
        svg("circle", { class: "ort-kreis", cx, cy, r: radius }),
        svg("text", { class: "ort-nummer", x: cx, y: cy, text: nummer }),
        svg("text", {
          class: "ort-name",
          x: links ? cx - radius - 6 : cx + radius + 6,
          y: cy + 5,
          "text-anchor": links ? "end" : "start",
          text: ort.name
        })
      ]);
      gruppe.addEventListener("click", () => ortGeklickt(ort, gruppe));
      gruppe.addEventListener("keydown", (ereignis) => {
        if (ereignis.key === "Enter" || ereignis.key === " ") {
          ereignis.preventDefault();
          ortGeklickt(ort, gruppe);
        }
      });
      ebene.append(gruppe);
    }
  }

  // Dieselben Orte als Knöpfe unter der Karte, unabhängig von der Bildschirmgröße.
  function orteKnoepfeRendern() {
    const liste = $("orte-liste");
    leeren(liste);
    $("orte-titel").textContent = istUnterwegs() ? "Oder wähle den Ort hier:" : "Orte";
    for (const ort of ORTE) {
      if (ort.zwischenhalt) continue;
      const status = ortStatus(ort);
      const hinweis = hinweisAktiv() && aktuelleSzene().ort === ort.id;
      const knopf = el("button", {
        type: "button",
        class: "knopf knopf-neben ist-" + status + (hinweis ? " ist-hinweis" : ""),
        "aria-label": `${ort.name}: ${ortHinweis(ort)}`,
        onclick: () => ortGeklickt(ort, knopf)
      }, [
        el("span", { class: "ort-knopf-nummer", "aria-hidden": "true", text: status === "geloest" ? "✓" : nummernText(ort) }),
        el("span", { text: ort.name })
      ]);
      liste.append(el("li", null, knopf));
    }
  }

  function leisteRendern() {
    const leiste = $("leiste");
    const titel = $("leiste-titel");
    const text = $("leiste-text");
    const knopf = $("knopf-leiste");
    leeren(text);
    leiste.classList.remove("ist-suche");
    knopf.hidden = false;

    const aktuell = aktuelleSzene();

    if (zustand.geloest.length === 0) {
      titel.textContent = START.titel;
      erzaehlungRendern(text, START.text);
      knopf.textContent = "Mission starten";
    } else if (!aktuell) {
      titel.textContent = "Alle Aufgaben gelöst!";
      erzaehlungRendern(text, ["Anna hat ihren Rucksack wieder. Die Vorstellung kann beginnen."]);
      knopf.textContent = "Zur Vorstellung";
    } else if (zustand.wartetAufWeiter) {
      const ort = ortNachId(szeneNachId(zustand.wartetAufWeiter).ort);
      titel.textContent = "Weiter geht's!";
      erzaehlungRendern(text, [`Anna hat die Aufgabe am ${ort.name} gelöst. Lies, wie es weitergeht.`]);
      knopf.textContent = "Fortsetzen";
    } else if (istUnterwegs()) {
      // Kartenaufgabe: Wegweiser mit genau einem Ort, Auftrag und Suchbild.
      const letzte = letzteGeloesteSzene();
      const ziel = ortNachId(aktuell.ort);
      const weg = letzte && letzte.weg;
      leiste.classList.add("ist-suche");
      titel.textContent = "Wohin geht Anna jetzt?";
      const textTeil = el("div", { class: "suche-text" });
      if (weg) {
        textTeil.append(wegweiserSatz(weg, ziel, "zitat"));
        textTeil.append(el("p", { class: "finde", text: weg.finde }));
      } else {
        textTeil.append(el("p", { class: "zitat", text: letzte ? letzte.danach : "" }));
        textTeil.append(el("p", { class: "finde", text: `Finde: ${ziel.name}!` }));
      }
      textTeil.append(el("p", { class: "suche-hinweis", text: "Tippe auf der Karte auf den Ort, oder wähle ihn unter der Karte." }));
      const bildTeil = el("figure", { class: "suchbild-rahmen" }, [
        suchbild(ziel),
        el("figcaption", { class: "suchbild-beschriftung", text: "So sieht es aus" })
      ]);
      text.append(el("div", { class: "suche-zeile" }, [textTeil, bildTeil]));
      knopf.hidden = true;
    } else {
      const ort = ortNachId(aktuell.ort);
      titel.textContent = `Anna ist hier: ${ort.name}`;
      erzaehlungRendern(text, [`Aufgabe ${szenenNummer(aktuell)} von ${GESAMT} wartet auf dich.`]);
      knopf.textContent = "Aufgabe öffnen";
    }
  }

  function leisteGeklickt() {
    const naechste = fortsetzungsSzene();
    if (naechste) szeneZeigen(naechste);
    else finaleZeigen();
  }

  function ortGeklickt(ort, element) {
    if (laeuftGerade) return;
    const status = $("karte-status");
    const aktuell = aktuelleSzene();

    if (!ort.zwischenhalt && ortStatus(ort) === "geloest") {
      rueckschauZeigen(ort);
      return;
    }

    if (!aktuell) {
      statusSetzen(status, "Alle Aufgaben sind gelöst. Anna ist in der Schauburg.", "");
      return;
    }

    if (istUnterwegs()) {
      const ziel = ortNachId(aktuell.ort);
      if (ort.id === ziel.id) {
        fehlversuche = 0;
        fehlversucheZiel = null;
        zustand.wartetAufWeiter = null;
        spielstandSpeichern();
        statusSetzen(status, `✓ Richtig! Anna geht ${ziel.richtung}.`, "ist-richtig");
        annaLaufen(zustand.annaOrt, ziel.id, () => {
          zustand.annaOrt = ziel.id;
          spielstandSpeichern();
          szeneZeigen(aktuell);
        });
        return;
      }
      // Falscher Ort: beide Orte beim Namen nennen, ab dem zweiten Fehler blinkt das Ziel.
      if (fehlversucheZiel !== ziel.id) {
        fehlversucheZiel = ziel.id;
        fehlversuche = 0;
      }
      fehlversuche++;
      let text = ort.zwischenhalt
        ? `Das ist ${ort.nom}. Da kommt Anna nur vorbei. Anna sucht ${ziel.akk}.`
        : `✗ Das ist ${ort.nom}. Anna sucht ${ziel.akk}.`;
      if (fehlversuche >= 2) {
        text += " Schau, wo es blinkt!";
        orteRendern();
        orteKnoepfeRendern();
      } else {
        wackeln(element);
      }
      statusSetzen(status, text, "ist-falsch");
      return;
    }

    if (ort.id === aktuell.ort) {
      zustand.wartetAufWeiter = null;
      spielstandSpeichern();
      szeneZeigen(aktuell);
      return;
    }
    if (ort.zwischenhalt) {
      statusSetzen(status, `Am ${ort.name} hat Anna keine Aufgabe.`, "");
      return;
    }
    statusSetzen(status, `${ort.name} kommt später. Anna ist gerade hier: ${ortNachId(aktuell.ort).name}.`, "");
  }

  function wackeln(element) {
    if (!element) return;
    element.classList.remove("ist-gewackelt");
    void element.getBoundingClientRect();
    element.classList.add("ist-gewackelt");
  }

  // Frageleiste und Karte zusammen ins Bild holen.
  function karteScrollen() {
    $("leiste").scrollIntoView({ behavior: bewegungReduziert() ? "auto" : "smooth", block: "start" });
  }

  /* ---------- Anna auf der Karte ---------- */

  // Setzt Anna auf einen Kartenpunkt. Auf schmalen Schirmen folgt der Kartenausschnitt.
  function annaSetzen(punkt, sanft) {
    const x = Array.isArray(punkt) ? punkt[0] : punkt.x;
    const y = Array.isArray(punkt) ? punkt[1] : punkt.y;
    $("anna").setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

    const scroll = $("karte-scroll");
    if (scroll.scrollWidth > scroll.clientWidth + 2) {
      const ziel = (x / KARTE_BREITE) * scroll.scrollWidth - scroll.clientWidth / 2;
      scroll.scrollTo({ left: Math.max(0, ziel), behavior: sanft && !bewegungReduziert() ? "smooth" : "auto" });
    }
  }

  function wegPunkte(vonId, nachId) {
    const von = ortNachId(vonId);
    const nach = ortNachId(nachId);
    const mitte = WEGE[`${vonId}>${nachId}`] || [];
    return [von.anna, ...mitte, nach.anna].map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
  }

  function pfadText(punkte) {
    return punkte.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }

  function spurZeichnen() {
    const bisIndex = STATIONEN.indexOf(zustand.annaOrt);
    const teile = [];
    for (let i = 0; i < bisIndex; i++) teile.push(pfadText(wegPunkte(STATIONEN[i], STATIONEN[i + 1])));
    $("spur-fertig").setAttribute("d", teile.join(" "));
    $("spur-aktuell").setAttribute("d", "");
  }

  function blaseZeigen(text) {
    const blase = $("anna-blase");
    const textKnoten = $("anna-blase-text");
    textKnoten.textContent = text;
    const breite = textKnoten.getComputedTextLength() + 24;
    const rahmen = $("anna-blase-rahmen");
    rahmen.setAttribute("width", breite);
    rahmen.setAttribute("x", -breite / 2);
    blase.setAttribute("visibility", "visible");
  }

  function annaLaufen(vonId, nachId, fertig) {
    const punkte = wegPunkte(vonId, nachId);
    const anna = $("anna");
    const spur = $("spur-aktuell");
    const blase = $("anna-blase");

    if (bewegungReduziert()) {
      annaSetzen(punkte[punkte.length - 1]);
      fertig();
      return;
    }

    laeuftGerade = true;
    karteScrollen();

    const abschnitte = [];
    let abschnitt = [punkte[0]];
    for (let i = 1; i < punkte.length; i++) {
      abschnitt.push(punkte[i]);
      if (punkte[i].halt || i === punkte.length - 1) {
        abschnitte.push(abschnitt);
        abschnitt = [punkte[i]];
      }
    }
    const gelaufen = [punkte[0]];

    function abschnittLaufen(index) {
      if (index >= abschnitte.length) {
        anna.classList.remove("laeuft");
        laeuftGerade = false;
        window.setTimeout(fertig, 350);
        return;
      }
      const pts = abschnitte[index];
      const laengen = [];
      let gesamt = 0;
      for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        laengen.push(l);
        gesamt += l;
      }
      const dauer = Math.min(4200, Math.max(900, (gesamt / 170) * 1000));
      const startZeit = performance.now();
      anna.classList.add("laeuft");

      function schritt(jetzt) {
        const anteil = Math.min(1, (jetzt - startZeit) / dauer);
        let rest = anteil * gesamt;
        let seg = 0;
        while (seg < laengen.length - 1 && rest > laengen[seg]) { rest -= laengen[seg]; seg++; }
        const a = pts[seg];
        const b = pts[seg + 1];
        const t = laengen[seg] ? rest / laengen[seg] : 1;
        const pos = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        anna.classList.toggle("nach-links", b.x < a.x);
        annaSetzen(pos);
        spur.setAttribute("d", pfadText([...gelaufen, ...pts.slice(1, seg + 1), pos]));
        if (anteil < 1) {
          window.requestAnimationFrame(schritt);
          return;
        }
        gelaufen.push(...pts.slice(1));
        const ende = pts[pts.length - 1];
        if (ende.halt) {
          anna.classList.remove("laeuft");
          blaseZeigen(ende.sagt || "");
          window.setTimeout(() => {
            blase.setAttribute("visibility", "hidden");
            abschnittLaufen(index + 1);
          }, 1600);
        } else {
          abschnittLaufen(index + 1);
        }
      }
      window.requestAnimationFrame(schritt);
    }

    abschnittLaufen(0);
  }

  /* ---------- Fenster ---------- */

  const abschnitte = { szene: "ansicht-szene", rueckschau: "ansicht-rueckschau", finale: "ansicht-finale" };
  const fensterTitel = { szene: "szene-titel", rueckschau: "rueckschau-titel", finale: "finale-titel" };

  function fensterOeffnen(name, ortName) {
    const fenster = $("fenster");
    for (const [schluessel, id] of Object.entries(abschnitte)) $(id).hidden = schluessel !== name;
    fenster.setAttribute("aria-labelledby", fensterTitel[name]);
    $("fenster-ort").textContent = ortName || "";
    if (!fenster.open) fenster.showModal();
    fenster.scrollTo({ top: 0 });
    fokussieren($(fensterTitel[name]));
  }

  function fensterSchliessen() {
    const fenster = $("fenster");
    if (fenster.open) fenster.close();
  }

  // Beim Schließen (Knopf oder Escape) liegt die Karte wieder frei.
  function fensterGeschlossen() {
    karteRendern();
    fokussieren($("leiste-titel"));
  }

  /* ---------- Szene ---------- */

  function szeneZeigen(szene) {
    const ort = ortNachId(szene.ort);
    const nummer = szenenNummer(szene);
    const naechste = SZENEN[nummer] || null;

    $("szene-nummer").textContent = `Aufgabe ${nummer} von ${GESAMT}`;
    $("szene-titel").textContent = szene.titel;
    erzaehlungRendern($("szene-text"), szene.text);
    $("szene-frage").textContent = szene.frage;

    const tippText = $("tipp-text");
    tippText.textContent = szene.tipp;
    tippText.hidden = true;
    const tippKnopf = $("knopf-tipp");
    tippKnopf.hidden = false;
    tippKnopf.setAttribute("aria-expanded", "false");
    tippKnopf.lastChild.textContent = " Tipp anzeigen";

    const rueckmeldung = $("szene-rueckmeldung");
    rueckmeldung.textContent = "";
    rueckmeldung.className = "rueckmeldung";
    $("szene-danach").hidden = true;
    $("danach-text").textContent = szene.danach;
    $("notiz-hinweis-text").textContent = `Neuer Eintrag im Notizbuch: „${szene.notiz}“`;
    $("knopf-weiter").textContent = !naechste ? "Zur Vorstellung" : naechste.ort === szene.ort ? "Weiter" : "Los geht's!";

    // Wegweiser im Fenster, damit das Ziel schon vor „Los geht's!“ klar ist.
    const wegweiser = $("wegweiser");
    leeren(wegweiser);
    if (szene.weg && naechste && naechste.ort !== szene.ort) {
      wegweiser.append(el("span", { "aria-hidden": "true", text: "🧭 " }));
      wegweiser.append(wegweiserSatz(szene.weg, ortNachId(naechste.ort), "wegweiser-satz"));
      wegweiser.hidden = false;
    } else {
      wegweiser.hidden = true;
    }

    antwortenRendern(szene);
    if (istGeloest(szene.id)) geloestAnzeigen(szene, false);
    karteRendern();
    fensterOeffnen("szene", ort.name);
  }

  function antwortenRendern(szene) {
    const behaelter = $("szene-antworten");
    leeren(behaelter);
    const istBild = szene.antworten.some((a) => a.bild);
    behaelter.className = "antworten" + (istBild ? " ist-bild" : "");

    szene.antworten.forEach((antwort, index) => {
      const marke = MARKEN[index] || String(index + 1);
      const knopf = el("button", {
        type: "button",
        class: "antwort" + (antwort.bild ? " ist-bild" : ""),
        "data-id": antwort.id,
        onclick: () => antwortGewaehlt(szene, antwort, knopf)
      });

      if (antwort.bild) {
        knopf.setAttribute("aria-label", `${marke}: ${antwort.beschreibung}`);
        knopf.append(
          el("img", { src: "assets/" + antwort.bild, alt: "", width: "400", height: "300" }),
          el("span", { class: "antwort-marke", "aria-hidden": "true", text: marke })
        );
      } else {
        knopf.append(
          el("span", { class: "antwort-marke", "aria-hidden": "true", text: marke }),
          el("span", { class: "antwort-text", text: antwort.text })
        );
      }
      behaelter.append(knopf);
    });
  }

  function antwortGewaehlt(szene, antwort, knopf) {
    if (istGeloest(szene.id)) return;
    const rueckmeldung = $("szene-rueckmeldung");

    if (antwort.id !== szene.richtig) {
      knopf.classList.add("ist-falsch");
      knopf.querySelector(".antwort-marke").textContent = "✗";
      statusSetzen(rueckmeldung, "✗ " + TEXT_FALSCH, "ist-falsch");
      return;
    }

    zustand.geloest.push(szene.id);
    zustand.wartetAufWeiter = szene.id;
    spielstandSpeichern();
    fortschrittAnzeigen();
    geloestAnzeigen(szene, true);
  }

  function geloestAnzeigen(szene, frisch) {
    const behaelter = $("szene-antworten");
    behaelter.querySelectorAll(".antwort").forEach((knopf, index) => {
      const richtig = knopf.dataset.id === szene.richtig;
      knopf.setAttribute("aria-disabled", "true");
      knopf.classList.remove("ist-falsch");
      knopf.classList.toggle("ist-richtig", richtig);
      knopf.classList.toggle("ist-gedimmt", !richtig);
      knopf.querySelector(".antwort-marke").textContent = MARKEN[index] || String(index + 1);
      if (richtig) {
        knopf.querySelector(".antwort-marke").textContent = "✓";
        const antwort = szene.antworten.find((a) => a.id === szene.richtig);
        if (antwort && antwort.bild) knopf.setAttribute("aria-label", `Richtig: ${antwort.beschreibung}`);
        else knopf.append(el("span", { class: "sr-only", text: " (richtig)" }));
      }
    });

    const rueckmeldung = $("szene-rueckmeldung");
    rueckmeldung.className = "rueckmeldung ist-richtig";
    rueckmeldung.textContent = "✓ " + TEXT_RICHTIG;
    $("szene-danach").hidden = false;
    $("knopf-tipp").hidden = true;
    if (frisch) fokussieren($("knopf-weiter"));
  }

  function weiterGeklickt() {
    zustand.wartetAufWeiter = null;
    spielstandSpeichern();
    const naechste = aktuelleSzene();
    if (!naechste) {
      finaleZeigen();
    } else if (naechste.ort === zustand.annaOrt) {
      szeneZeigen(naechste);
    } else {
      // Das Fenster schließt sich, die Karte fragt, wohin Anna geht.
      fensterSchliessen();
      karteScrollen();
    }
  }

  function tippUmschalten() {
    const knopf = $("knopf-tipp");
    const text = $("tipp-text");
    const offen = knopf.getAttribute("aria-expanded") === "true";
    knopf.setAttribute("aria-expanded", String(!offen));
    text.hidden = offen;
    knopf.lastChild.textContent = offen ? " Tipp anzeigen" : " Tipp verbergen";
  }

  /* ---------- Rückschau ---------- */

  function rueckschauZeigen(ort) {
    const inhalt = $("rueckschau-inhalt");
    leeren(inhalt);
    $("rueckschau-titel").textContent = ort.name;

    for (const szene of szenenVonOrt(ort.id)) {
      const richtige = szene.antworten.find((a) => a.id === szene.richtig);
      const tafel = el("article", { class: "tafel rueckschau-szene" }, [
        el("p", { class: "tafel-oben", text: `Aufgabe ${szenenNummer(szene)} von ${GESAMT} · gelöst` }),
        el("h2", { text: szene.titel })
      ]);
      const erzaehlung = el("div", { class: "erzaehlung" });
      erzaehlungRendern(erzaehlung, szene.text);
      tafel.append(erzaehlung);
      tafel.append(el("p", { class: "frage", text: szene.frage }));

      const loesung = el("div", { class: "rueckschau-loesung" }, [
        el("span", { class: "antwort-marke ist-richtig", "aria-hidden": "true", text: "✓" })
      ]);
      if (richtige.bild) {
        loesung.append(el("img", { src: "assets/" + richtige.bild, alt: richtige.beschreibung, width: "400", height: "300" }));
        loesung.append(el("span", { text: richtige.beschreibung }));
      } else {
        loesung.append(el("span", { text: richtige.text }));
      }
      tafel.append(loesung);
      tafel.append(el("p", { text: szene.danach }));
      tafel.append(el("p", { class: "rueckschau-notiz", text: szene.notiz }));
      inhalt.append(tafel);
    }

    fensterOeffnen("rueckschau", "Rückschau");
  }

  /* ---------- Finale ---------- */

  function finaleZeigen() {
    $("finale-titel").textContent = ABSCHLUSS.titel;
    erzaehlungRendern($("finale-text"), ABSCHLUSS.text);
    karteRendern();
    fensterOeffnen("finale", "Schauburg");
  }

  /* ---------- Notizbuch ---------- */

  function notizbuchOeffnen() {
    const liste = $("notizbuch-liste");
    leeren(liste);
    const eintraege = SZENEN.filter((s) => istGeloest(s.id));
    $("notizbuch-leer").hidden = eintraege.length > 0;
    for (const szene of eintraege) {
      liste.append(
        el("li", null, [
          el("span", { class: "notizen-ort", text: `${szenenNummer(szene)}. ${ortNachId(szene.ort).name} · ${szene.titel}` }),
          el("p", { class: "notizen-text", text: szene.notiz })
        ])
      );
    }
    $("notizbuch").showModal();
  }

  /* ---------- Neustart ---------- */

  function neustartFragen() {
    $("dialog-neustart").showModal();
  }

  function neustartBestaetigt() {
    $("dialog-neustart").close();
    spielstandLoeschen();
    fensterSchliessen();
    karteRendern();
    fokussieren($("leiste-titel"));
  }

  /* ---------- Start ---------- */

  function verdrahten() {
    $("knopf-leiste").addEventListener("click", leisteGeklickt);
    $("knopf-zur-karte").addEventListener("click", fensterSchliessen);
    $("knopf-finale-karte").addEventListener("click", fensterSchliessen);
    $("fenster").addEventListener("close", fensterGeschlossen);
    $("knopf-weiter").addEventListener("click", weiterGeklickt);
    $("knopf-tipp").addEventListener("click", tippUmschalten);

    $("knopf-notizbuch").addEventListener("click", notizbuchOeffnen);
    $("knopf-fenster-notizbuch").addEventListener("click", notizbuchOeffnen);
    $("knopf-finale-notizbuch").addEventListener("click", notizbuchOeffnen);
    $("knopf-notizbuch-schliessen").addEventListener("click", () => $("notizbuch").close());

    $("knopf-neustart-karte").addEventListener("click", neustartFragen);
    $("knopf-finale-neustart").addEventListener("click", neustartFragen);
    $("knopf-neustart-ja").addEventListener("click", neustartBestaetigt);
    $("knopf-neustart-nein").addEventListener("click", () => $("dialog-neustart").close());

    for (const dialog of document.querySelectorAll("dialog.dialog")) {
      dialog.addEventListener("click", (ereignis) => {
        if (ereignis.target === dialog) dialog.close();
      });
    }
  }

  function starten() {
    spielstandLaden();
    verdrahten();
    karteRendern();
  }

  starten();
})();
