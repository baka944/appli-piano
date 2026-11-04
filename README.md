# Appli piano

Appli d'entraînement au piano jazz, pensée comme un jeu : XP, niveaux nommés par des tempos (de Largo à Prestissimo), quêtes de la semaine.

## V1

- **Aujourd'hui** : programme du jour selon le temps disponible (15, 30, 45 ou 60 min), quêtes de la semaine.
- **Morceaux** : tes morceaux en cours, notes de travail, temps passé.
- **Travail › Rythme** : placements de comping joués au piano en MIDI (ou tapés), écart mesuré à chaque attaque, calibrage de la latence.
- **Oreille et théorie** : intervalles (montants, descendants, harmoniques), types d'accords, quiz de théorie généré (degrés, accords, harmonisation de toutes les gammes, modes, II-V-I, armures, intervalles).
- **Journal** : niveaux par compétence, historique, thème clair ou sombre, export et import de la progression.

## Utilisation

- Ouvrir l'appli dans **Chrome** (Mac ou Android). Safari et les iPhone ne gèrent pas le MIDI.
- Brancher le piano en USB (adaptateur USB OTG sur Android), puis « Connecter le piano ».
- La progression est enregistrée dans le navigateur de chaque appareil. Pour la transférer : Journal › Exporter, puis Importer sur l'autre appareil.

## Technique

Site statique sans dépendance ni étape de build : `index.html`, `css/`, `js/` (modules ES). Publié avec GitHub Pages.

À chaque publication, changer `version.json` : c'est ce qui affiche le bandeau « Nouvelle version » sur les appareils où l'appli est ouverte. `sw.js` va chercher les fichiers sur le réseau en priorité, pour contourner le cache de 10 minutes de GitHub Pages.
