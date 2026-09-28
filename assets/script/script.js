/***************
  MAP LEAFLET
***************/

// Carte centrée sur lat 0 / lng 0, zoom 5.
// 'map' est l'id de la div qui contient la carte dans index.html.
const MAP = L.map('map').setView([0, 0], 5);

// Tuiles OpenStreetMap. L'attribution est obligatoire (licence OSM).
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(MAP);

// Icône personnalisée pour l'ISS.
// Le chemin est relatif à index.html, PAS à script.js.
const ISS_ICON = L.icon({
  iconUrl: './assets/img/international-space-station-icon.png',
  iconSize: [50, 50],
  iconAnchor: [22, 94]
});

// .addTo() renvoie le marker lui-même : on peut donc créer, ajouter
// et stocker le marker en une seule instruction.
const MARKER = L.marker([0, 0], { icon: ISS_ICON }).addTo(MAP);

/*******************
  SUIVI ISS
*******************/

/**
 * Récupère la position actuelle de l'ISS et met à jour la carte et le marker.
 * @param {L.Map} map - La carte Leaflet à recentrer.
 * @param {L.Marker} marker - Le marker de l'ISS à déplacer.
 * @returns {Promise<void>}
 */
async function issAPI(map, marker) {
  try {
    const response = await fetch('http://api.open-notify.org/iss-now.json');

    // fetch ne rejette QUE sur une erreur réseau.
    // Un 404 ou un 500 passe sans erreur : il faut le vérifier soi-même.
    if (!response.ok) {
      throw new Error(`Réponse HTTP ${response.status}`);
    }

    const data = await response.json();

    // L'API renvoie des chaînes ("48.85") : on les convertit en nombres.
    const lat = parseFloat(data.iss_position.latitude);
    const lng = parseFloat(data.iss_position.longitude);

    map.setView([lat, lng], map.getZoom()); // recentre en gardant le zoom actuel
    marker.setLatLng([lat, lng]);           // déplace le marker
  } catch (error) {
    console.error('Erreur lors de la récupération de la position ISS :', error);
  }
}

// On passe une fonction fléchée : setInterval attend une RÉFÉRENCE de fonction.
// setInterval(issAPI(MAP, MARKER), 1000) exécuterait issAPI une seule fois,
// immédiatement, puis passerait son résultat (une Promise) à setInterval.
setInterval(() => issAPI(MAP, MARKER), 1000);

/***************
  METEO LOCALE
***************/

// 1) Création du paragraphe et styles, uniquement en JS
const paragrapheMeteo = document.createElement('p');
paragrapheMeteo.style.height = '300px';
paragrapheMeteo.style.width = '200px';
paragrapheMeteo.style.marginTop = '16px';
paragrapheMeteo.style.marginBottom = '16px';
paragrapheMeteo.style.border = '3px solid gray';
paragrapheMeteo.style.padding = '16px 12px 24px 12px'; // haut, droite, bas, gauche

// 2) Insertion dans article.cardMeteo, avant le bouton
const cardMeteo = document.querySelector('article.cardMeteo');
const boutonCharger = cardMeteo.querySelector('button');
cardMeteo.insertBefore(paragrapheMeteo, boutonCharger);

/**
 * 3) Remplit un élément HTML avec un texte.
 * textContent plutôt qu'innerHTML : le texte vient d'une API externe,
 * et textContent empêche toute injection de HTML (faille XSS).
 * @param {HTMLElement} element - L'élément à remplir.
 * @param {string} text - Le texte à afficher.
 */
function addInfo(element, text) {
  element.textContent = text;
}

// 4) Au clic, on appelle l'API météo et on affiche le résultat
boutonCharger.addEventListener('click', async () => {
  try {
    const response = await fetch('https://prevision-meteo.ch/services/json/toulouse');

    if (!response.ok) {
      throw new Error(`Réponse HTTP ${response.status}`);
    }

    const data = await response.json();

    // Déstructuration : on extrait directement les champs utiles
    const { condition, tmp } = data.current_condition;
    const { tmax, tmin } = data.fcst_day_0;

    addInfo(
      paragrapheMeteo,
      `Condition météo : ${condition}, et la température est de ${tmp}°C. T° Max = ${tmax} - T° Min = ${tmin}`
    );
  } catch (error) {
    console.error('Erreur lors de la récupération de la météo :', error);
    addInfo(paragrapheMeteo, 'Impossible de charger la météo pour le moment.');
  }
});