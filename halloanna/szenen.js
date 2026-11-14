/* München-Mission · Annas Theaterkarten
 * Spielinhalte: Kartenorte und die zehn Szenen in Spielreihenfolge.
 *
 * ORTE: Kartenpunkte. x und y sind Prozentwerte von links und von oben,
 *       bezogen auf die Illustration in assets/karte.svg.
 *       Ein Ort mit "zwischenhalt: true" hat keine Aufgabe.
 *
 * SZENEN: Die Reihenfolge der Liste ist die Spielreihenfolge.
 *   id        feste ID (gehört zum gespeicherten Fortschritt, nicht ändern)
 *   ort       ID eines Kartenpunkts
 *   titel     Überschrift der Szene
 *   text      Erzähltext und Dialog. Ein String ist ein Absatz,
 *             ein Objekt { wer, sagt } ist eine Dialogzeile.
 *   frage     Die Frage
 *   antworten drei Antworten. Textantwort: { id, text }
 *             Bildantwort:  { id, bild, beschreibung } (Datei in assets/)
 *   richtig   ID der richtigen Antwort
 *   tipp      Hilfestellung hinter „Tipp anzeigen“
 *   danach    erzählerischer Übergang nach der Lösung
 *   notiz     Eintrag für das Notizbuch
 *   weg       Wegweiser für die Karte, wenn Anna danach zu einem anderen Ort geht:
 *             { satz, finde, ziel? }. "satz" nennt genau einen Ort, "finde" ist der Auftrag.
 *             Das Zielwort wird hervorgehoben; "ziel" überschreibt es (z. B. "Englischen Garten").
 */

// Die Lage ist grob an Schwabing angelehnt: Leopoldstraße in der Mitte, Englischer Garten
// rechts, Luitpoldpark oben links, Elisabethplatz mit Markt und Schauburg in der Mitte.
// Alle Koordinaten sind Kartenpixel: karte.svg ist 1000 × 700 groß.
//   flaeche       [x, y, Breite, Höhe] der Tippfläche rund um das Motiv
//   anna          Annas Standplatz (Fußpunkt)
//   richtung      Wendung für Sätze wie „Anna geht … zur Bibliothek“
//   nom, akk      „Das ist die Bibliothek“ / „Anna sucht die Bibliothek“
//   beschriftung  "links" setzt den Namen links neben die Nummer
//   zwischenhalt  Ort ohne Aufgabe, Anna kommt nur vorbei
// Die Karte folgt dem echten Schwabing (Straßen aus OpenStreetMap). Elisabethplatz,
// Elisabethmarkt und Schauburg liegen in Wirklichkeit dicht beieinander, deshalb sind
// ihre Motive etwas auseinandergezogen. Schreibwarengeschäft und Café sind erfunden.
const ORTE = [
  { id: "elisabethplatz", name: "Elisabethplatz", flaeche: [282, 418, 66, 52], anna: [350, 476], richtung: "zum Elisabethplatz", nom: "der Elisabethplatz", akk: "den Elisabethplatz", beschriftung: "links" },
  { id: "schreibwaren", name: "Schreibwarengeschäft", flaeche: [208, 344, 70, 54], anna: [262, 410], richtung: "zum Schreibwarengeschäft", nom: "das Schreibwarengeschäft", akk: "das Schreibwarengeschäft" },
  { id: "bibliothek", name: "Bibliothek", flaeche: [498, 296, 76, 56], anna: [556, 380], richtung: "zur Bibliothek", nom: "die Bibliothek", akk: "die Bibliothek" },
  { id: "cafe", name: "Café Venezia", flaeche: [594, 310, 60, 50], anna: [596, 366], richtung: "ins Café Venezia", nom: "das Café Venezia", akk: "das Café Venezia" },
  { id: "markt", name: "Elisabethmarkt", flaeche: [284, 470, 78, 44], anna: [372, 494], richtung: "zum Elisabethmarkt", nom: "der Elisabethmarkt", akk: "den Elisabethmarkt" },
  { id: "spielplatz", name: "Spielplatz", flaeche: [168, 118, 74, 60], anna: [165, 178], richtung: "zum Spielplatz", nom: "der Spielplatz", akk: "den Spielplatz", zwischenhalt: true },
  { id: "park", name: "Park", flaeche: [188, 18, 92, 74], anna: [196, 100], richtung: "in den Park", nom: "der Park", akk: "den Park" },
  { id: "englischer-garten", name: "Englischer Garten", flaeche: [705, 388, 84, 62], anna: [700, 452], richtung: "in den Englischen Garten", nom: "der Englische Garten", akk: "den Englischen Garten", beschriftung: "links" },
  { id: "schauburg", name: "Schauburg", flaeche: [360, 374, 64, 52], anna: [434, 440], richtung: "zur Schauburg", nom: "die Schauburg", akk: "die Schauburg" }
];

// Wege zwischen zwei Orten, als Zwischenpunkte in Kartenpixeln entlang der echten Straßen
// (Elisabethstraße, Nordendstraße, Hohenzollernstraße, Leopoldstraße, Tengstraße,
// Hiltenspergerstraße, Martiusstraße). Start- und Endpunkt sind die "anna"-Standplätze.
// Ein Punkt mit "halt" lässt Anna kurz stehen und zeigt eine Sprechblase.
const WEGE = {
  "elisabethplatz>schreibwaren": [[346, 450], [344, 428], [324, 427], [274, 411]],
  "schreibwaren>bibliothek": [[274, 411], [324, 427], [344, 428], [343, 415], [341, 370], [346, 338], [397, 345], [461, 352], [524, 358], [545, 365]],
  "bibliothek>cafe": [[562, 370], [575, 376], [580, 372], [583, 360]],
  "cafe>markt": [[580, 372], [575, 376], [569, 397], [562, 419], [555, 442], [516, 429], [453, 423], [377, 426], [345, 429], [346, 450], [350, 482]],
  "markt>park": [[350, 482], [346, 450], [344, 428], [324, 427], [274, 411], [216, 387], [213, 360], [209, 338], [204, 310], [183, 312], [160, 315], [153, 238], [152, 205], { x: 165, y: 178, halt: "spielplatz", sagt: "Hier ist Tina nicht." }, [156, 152], [160, 107], [162, 91], [180, 95]],
  "park>englischer-garten": [[162, 91], [160, 107], [156, 152], [153, 238], [160, 312], [204, 310], [287, 332], [346, 338], [461, 352], [524, 358], [575, 376], [569, 397], [562, 419], [555, 442], [567, 445], [596, 456], [656, 462], [680, 452]],
  "englischer-garten>schauburg": [[680, 452], [656, 462], [596, 456], [567, 445], [555, 442], [516, 429], [453, 423], [420, 423]]
};

const SZENEN = [
  {
    id: "s01-rucksack-weg",
    ort: "elisabethplatz",
    titel: "Der Rucksack ist weg",
    text: [
      "Anna wartet auf Benno. Sie wollen zusammen in die Schauburg.",
      { wer: "Benno", sagt: "Hast du die Karten?" },
      { wer: "Anna", sagt: "Ja, sie sind in meinem Rucksack. Oje, mein Rucksack ist weg!" },
      { wer: "Benno", sagt: "Wie sieht er aus?" },
      { wer: "Anna", sagt: "Er ist rot und gelb und hat vorne einen blauen Stern." }
    ],
    frage: "Welchen Rucksack sucht Anna?",
    antworten: [
      { id: "a", bild: "rucksack-gelber-stern.svg", beschreibung: "Rot-gelber Rucksack mit gelbem Stern" },
      { id: "b", bild: "rucksack-blauer-stern.svg", beschreibung: "Rot-gelber Rucksack mit blauem Stern" },
      { id: "c", bild: "rucksack-roter-stern.svg", beschreibung: "Blau-grüner Rucksack mit rotem Stern" }
    ],
    richtig: "b",
    tipp: "Achte auf die Farbe des Sterns.",
    danach: "Benno wartet auf Anna an der Schauburg. Anna fragt im Schreibwarengeschäft nach ihrem Rucksack.",
    notiz: "Annas Rucksack ist rot und gelb. Vorne hat er einen blauen Stern.",
    weg: { satz: "Anna geht zum Schreibwarengeschäft.", finde: "Finde das Schreibwarengeschäft!" }
  },
  {
    id: "s02-frau-braun",
    ort: "schreibwaren",
    titel: "Bei Frau Braun",
    text: [
      "Anna kauft zwei Kulis, ein Lineal und vier Bleistifte. Dann fragt sie nach ihrem Rucksack.",
      { wer: "Frau Braun", sagt: "Tina hatte deinen Rucksack. Schau mal in der Bibliothek nach. Dort wollte sie hin." }
    ],
    frage: "Was kauft Anna im Schreibwarengeschäft?",
    antworten: [
      { id: "a", bild: "schreibwaren-2-kulis-1-lineal-4-bleistifte.svg", beschreibung: "Zwei Kulis, ein Lineal und vier Bleistifte" },
      { id: "b", bild: "schreibwaren-3-kulis-1-lineal-2-bleistifte.svg", beschreibung: "Drei Kulis, ein Lineal und zwei Bleistifte" },
      { id: "c", bild: "schreibwaren-1-kuli-2-lineale-4-bleistifte.svg", beschreibung: "Ein Kuli, zwei Lineale und vier Bleistifte" }
    ],
    richtig: "a",
    tipp: "Zähle Kulis, Lineale und Bleistifte einzeln.",
    danach: "Anna macht sich auf den Weg zur Bibliothek.",
    notiz: "Tina hatte den Rucksack. Sie wollte in die Bibliothek.",
    weg: { satz: "Tina ist in der Bibliothek. Anna geht zur Bibliothek.", finde: "Finde die Bibliothek!" }
  },
  {
    id: "s03-zu-fuss-oder-fahrrad",
    ort: "bibliothek",
    titel: "Zu Fuß oder mit dem Fahrrad",
    text: [
      "Zu Fuß braucht Anna zehn Minuten bis zur Bibliothek. Mit dem Fahrrad braucht sie fünf Minuten. Sie nimmt das Fahrrad.",
      "In der Bibliothek findet sie Tina nicht."
    ],
    frage: "Wie lange braucht Anna bis zur Bibliothek?",
    antworten: [
      { id: "a", text: "Fünf Minuten zu Fuß und zehn Minuten mit dem Fahrrad." },
      { id: "b", text: "Zehn Minuten zu Fuß und fünf Minuten mit dem Fahrrad." },
      { id: "c", text: "Fünf Minuten zu Fuß und fünf Minuten mit dem Fahrrad." }
    ],
    richtig: "b",
    tipp: "Anna nimmt das Fahrrad. Damit ist sie schneller.",
    danach: "Anna ist müde und hat Hunger. Sie macht eine Pause im Café Venezia.",
    notiz: "Tina ist nicht in der Bibliothek.",
    weg: { satz: "Anna hat Hunger. Sie geht ins Café Venezia.", finde: "Finde das Café!" }
  },
  {
    id: "s04-kleine-pause",
    ort: "cafe",
    titel: "Eine kleine Pause",
    text: [
      { wer: "Anna", sagt: "Ich hätte gern eine Tasse Kakao, ein Stück Kuchen und einen Apfel, bitte." }
    ],
    frage: "Was bekommt Anna?",
    antworten: [
      { id: "a", bild: "cafe-kakao-kuchen-apfel.svg", beschreibung: "Eine Tasse Kakao, ein Stück Kuchen und einen Apfel" },
      { id: "b", bild: "cafe-kakao-broetchen-banane.svg", beschreibung: "Eine Tasse Kakao, ein belegtes Brötchen und eine Banane" },
      { id: "c", bild: "cafe-saft-kuchen-apfel.svg", beschreibung: "Ein Glas Orangensaft, ein Stück Kuchen und einen Apfel" }
    ],
    richtig: "a",
    tipp: "Anna bestellt ein Getränk und zwei Sachen zum Essen.",
    danach: "Anna hat eine Idee. Tinas Oma arbeitet auf dem Elisabethmarkt. Vielleicht weiß sie, wo Tina ist.",
    notiz: "Tinas Oma arbeitet auf dem Elisabethmarkt.",
    weg: { satz: "Tinas Oma arbeitet auf dem Elisabethmarkt. Anna geht zum Elisabethmarkt.", finde: "Finde den Markt!" }
  },
  {
    id: "s05-tinas-tasche",
    ort: "markt",
    titel: "Tinas Tasche",
    text: [
      "Anna trifft Tinas Oma, Frau Klein. Tina ist gerade weg. Ihre Tasche steht bei Frau Klein.",
      "Darin sind drei Bücher, fünf Hefte und Tinas Lieblingsmaus."
    ],
    frage: "Welches Kuscheltier gehört Tina?",
    antworten: [
      { id: "a", bild: "kuscheltier-maus.svg", beschreibung: "Eine graue Stoffmaus" },
      { id: "b", bild: "kuscheltier-katze.svg", beschreibung: "Eine Stoffkatze" },
      { id: "c", bild: "kuscheltier-hund.svg", beschreibung: "Ein Stoffhund" }
    ],
    richtig: "a",
    tipp: "Lies das Wort „Lieblingsmaus“ noch einmal.",
    danach: "Anna fragt Frau Klein, wo Tina sein könnte.",
    notiz: "Tinas Lieblingskuscheltier ist eine Maus."
  },
  {
    id: "s06-wo-suchen",
    ort: "markt",
    titel: "Wo soll Anna suchen?",
    text: [
      { wer: "Frau Klein", sagt: "Schau zuerst auf dem Spielplatz nach. Wenn Tina dort nicht ist, geh weiter in den Park." }
    ],
    frage: "Wo sucht Anna zuerst? Wohin geht sie danach?",
    antworten: [
      { id: "a", text: "Sie geht in den Zoo und dann in den Park." },
      { id: "b", text: "Sie geht in den Park und dann in den Garten." },
      { id: "c", text: "Sie geht auf den Spielplatz und dann in den Park." }
    ],
    richtig: "c",
    tipp: "„Zuerst“ sagt dir, wo Anna anfängt.",
    danach: "Auf dem Spielplatz ist Tina nicht. Anna geht weiter in den Park.",
    notiz: "Frau Klein schickt Anna erst zum Spielplatz und dann in den Park.",
    weg: { satz: "Anna schaut auf dem Spielplatz nach. Dann geht sie in den Park.", finde: "Finde den Park!" }
  },
  {
    id: "s07-anna-findet-tina",
    ort: "park",
    titel: "Anna findet Tina",
    text: [
      { wer: "Anna", sagt: "Tina, wo ist mein Rucksack?" },
      { wer: "Tina", sagt: "Fabian hat ihn mitgenommen. Er spielt mit Daniel und Lucas Fußball im Englischen Garten." }
    ],
    frage: "Wo ist Fabian?",
    antworten: [
      { id: "a", text: "Im Olympiapark." },
      { id: "b", text: "Im Englischen Garten." },
      { id: "c", text: "Auf dem Spielplatz." }
    ],
    richtig: "b",
    tipp: "Lies den letzten Satz von Tina.",
    danach: "Anna geht zu Fabian in den Englischen Garten.",
    notiz: "Fabian spielt Fußball im Englischen Garten. Er hatte den Rucksack.",
    weg: { satz: "Fabian spielt Fußball im Englischen Garten. Anna geht in den Englischen Garten.", ziel: "Englischen Garten", finde: "Finde den Englischen Garten!" }
  },
  {
    id: "s08-naechste-spur",
    ort: "englischer-garten",
    titel: "Die nächste Spur",
    text: [
      "Fabian spielt Fußball. Anna fragt ihn nach ihrem Rucksack.",
      { wer: "Fabian", sagt: "Ich habe deinen Rucksack mit den Karten im Theater abgegeben. Er liegt dort an der Kasse." }
    ],
    frage: "Wo hat Fabian den Rucksack abgegeben?",
    antworten: [
      { id: "a", text: "An der Kasse im Supermarkt." },
      { id: "b", text: "An der Kasse im Theater." },
      { id: "c", text: "An der Kasse im Café." }
    ],
    richtig: "b",
    tipp: "Achte darauf, zu welchem Ort die Kasse gehört.",
    danach: "Die Vorstellung beginnt bald. Anna fragt Fabian, wie sie schnell zur Schauburg kommt.",
    notiz: "Der Rucksack liegt an der Theaterkasse."
  },
  {
    id: "s09-schnell-zum-theater",
    ort: "englischer-garten",
    titel: "Schnell zum Theater",
    text: [
      { wer: "Anna", sagt: "Wie komme ich am schnellsten zum Theater?" },
      { wer: "Fabian", sagt: "Nimm meinen Roller!" }
    ],
    frage: "Wie kommt Anna zum Theater?",
    antworten: [
      { id: "a", text: "Sie fährt Fahrrad." },
      { id: "b", text: "Sie fährt Roller." },
      { id: "c", text: "Sie fährt Bus." }
    ],
    richtig: "b",
    tipp: "Was leiht Fabian Anna?",
    danach: "Anna fährt mit dem Roller zur Schauburg. Benno wartet schon am Eingang.",
    notiz: "Anna fährt mit Fabians Roller zur Schauburg.",
    weg: { satz: "Anna fährt mit dem Roller zur Schauburg.", finde: "Finde die Schauburg!" }
  },
  {
    id: "s10-drei-rucksaecke",
    ort: "schauburg",
    titel: "Drei Rucksäcke",
    text: [
      "Noch zehn Minuten bis zur Vorstellung. Anna und Benno gehen zur Theaterkasse.",
      { wer: "Anna", sagt: "Guten Tag! Wurde hier ein Rucksack abgegeben?" },
      { wer: "Die Frau an der Kasse", sagt: "Ja, hier sind drei Rucksäcke. Wie sieht deiner aus?" }
    ],
    frage: "Welche Beschreibung passt zu Annas Rucksack?",
    antworten: [
      { id: "a", text: "Er ist grün und gelb und hat vorne einen blauen Stern." },
      { id: "b", text: "Er ist rot und gelb und hat vorne einen blauen Stern." },
      { id: "c", text: "Er ist rot und grün und hat vorne einen gelben Stern." }
    ],
    richtig: "b",
    tipp: "Annas Beschreibung steht im ersten Eintrag im Notizbuch.",
    danach: "Die Frau gibt Anna den richtigen Rucksack. Anna öffnet ihn. Die Theaterkarten sind noch da.",
    notiz: "Anna hat ihren rot-gelben Rucksack mit dem blauen Stern wieder."
  }
];

const ABSCHLUSS = {
  titel: "Rucksack gefunden!",
  text: [
    "Anna und Benno zeigen ihre Karten und gehen in den Saal.",
    "Kurz darauf beginnt die Vorstellung."
  ]
};

const START = {
  titel: "Annas Theaterkarten",
  text: [
    "Anna und Benno wollen in die Schauburg. Dort gibt es heute Kindertheater.",
    "Die Karten sind in Annas Rucksack. Aber der Rucksack ist weg!",
    "Hilf Anna. Geh mit ihr durch Schwabing und löse an jedem Ort eine Aufgabe."
  ]
};
