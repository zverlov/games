# Carola Samimi · Mobile Ergotherapie

Eigenständiger Website-Prototyp für die Kundenabnahme. Zum Ansehen die Datei `index.html` im Browser öffnen. Der Prototyp benötigt weder eine Installation noch einen Build oder Internetzugang. Nur die externen Ziele, etwa der Link zu GitHubs Datenschutzhinweisen, benötigen Internet.

## Analyse und Entwurf

| In der gespeicherten Vorlage | Im Prototyp |
| --- | --- |
| Die Startseite beginnt mit viel Leerraum und längeren Einleitungstexten. | Die erste Ansicht zeigt Angebot, Ort, Zielgruppe, Originalporträt und einen klaren Weg zum Erstgespräch. |
| Navigation und Handlungsaufforderungen verweisen häufig wieder auf die Live-Seite. | Unter „Leistungen“ führen drei Unterpunkte zu den beiden Detailseiten und zu Ablauf und Kosten. Die bisherigen Verzeichnispfade bleiben für bestehende Links erreichbar. |
| Beträge und Bezeichnungen wurden mit Leerzeichen ausgerichtet. | Die acht Preispositionen stehen in einer semantischen Tabelle, die sich bei Bedarf aufklappen lässt. |
| Die Kontaktseite verwendete für die sichtbare E-Mail-Adresse das falsche Linkziel. Das Formular war an das alte System gebunden. | Telefon und E-Mail sind direkt verlinkt. Das Formular übernimmt Name, E-Mail-Adresse und Nachricht in einen E-Mail-Entwurf. |
| Der Browserexport enthält IONOS-Skripte und Verweise auf entfernte Ressourcen. | HTML, CSS, das Menüskript und alle Bilder liegen im Projekt. Es gibt keine eingebetteten externen Dienste oder Tracker. |

Gestalterisch arbeitet der Entwurf mit gedecktem Grün, warmem Creme, ruhigen Überschriften in Serifenschrift und Originalfotos. Die Seite führt vom Angebot über Leistungen, Qualifikation und Kosten bis zur Kontaktaufnahme. Navigation und Layout passen sich der Fensterbreite an.

## Auf GitHub Pages bereitstellen

1. Das ZIP vollständig entpacken. **Den Inhalt** des entpackten Projektordners (einschließlich `.nojekyll`, `index.html` und aller Unterordner) in die oberste Ebene deines Repositories legen und pushen.
2. Im Repository **Settings → Pages** öffnen. Unter **Build and deployment** als Quelle **Deploy from a branch** wählen. Den Branch mit den Dateien (z. B. `main`) und den Ordner **/ (root)** auswählen und speichern.
3. Nach der Bereitstellung die dort angezeigte Adresse öffnen. Alle internen Links und Assets sind relativ, damit die Seite auch unter `<name>.github.io/<repository>/` funktioniert.

[GitHub-Dokumentation zur Veröffentlichungsquelle](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

Vor der öffentlichen Freigabe bitte die Kundenangaben und Preise bestätigen lassen, die Nutzungsrechte der übernommenen Fotos klären und Impressum sowie Datenschutz für das tatsächliche Hosting freigeben lassen. Die Datenschutzhinweise sind ausdrücklich ein Entwurf. Die echten Seiten enthalten zur Abnahme `noindex, nofollow`; nach Freigabe kannst du das Meta-Tag für die Aufnahme in Suchmaschinen entfernen. Das Tag ist kein Zugriffsschutz.

## Kontaktformular für direkten Versand einrichten

In der Vorschau öffnet das Formular ein eingerichtetes E-Mail-Programm. Die Besucherin oder der Besucher sendet den Entwurf von dort ab. Direkter Versand aus der Website braucht einen separaten HTTPS-Endpunkt, da GitHub Pages nur statische Dateien ausliefert.

Sobald ein Endpunkt für die Praxis eingerichtet ist, ersetze in `index.html` das `action`-Attribut des Elements mit `data-contact-form` durch seine HTTPS-Adresse. Das Formular sendet per POST die Felder `name`, `email` und `message`. Die Beschriftung wechselt automatisch zu „Anfrage senden“. Der Endpunkt muss die Eingaben serverseitig prüfen, den Versand übernehmen und eine verständliche Erfolgs- oder Fehlerseite zurückgeben. Passe die Datenschutzhinweise an den gewählten Dienst an und prüfe den Versand mit einer Testanfrage.

## Inhaltsgrundlage

Startseite, Preise und Fotos stammen aus dem bereitgestellten Browserexport. Ergänzende Angaben wurden auf den öffentlichen Seiten von Carola Samimi abgeglichen:

- [Kontakt](https://www.carola-samimi.de/kontakt/) und [Impressum](https://www.carola-samimi.de/impressum/)
- [Über mich](https://www.carola-samimi.de/ueber-mich/)
- [Ergotherapie für Erwachsene](https://www.carola-samimi.de/leistungen/ergotherapie-bei-erwachsenen/) und [Ergotherapie für Kinder](https://www.carola-samimi.de/leistungen/ergotherapie-bei-kindern/)
