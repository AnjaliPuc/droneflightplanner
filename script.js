'use strict';
class FlightPlan {
  id = (Date.now() + '').slice(-10);

  constructor(layer, planName) {
    this.layer = layer;
    this.planName = planName;
  }
}

///////////////////////////////////////////////
const containerFlightPlans = document.querySelector('.flight__plans');
const btnClearMap = document.querySelector('.btn--clear-map');

class App {
  #map;
  #mapZoomLevel = 13;
  #flightPlans = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    containerFlightPlans.addEventListener(
      'click',
      this._showFlightPlan.bind(this)
    );
    btnClearMap.addEventListener('click', this._clearMap.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: {
          shapeOptions: {
            color: '#FF0000',
            weight: 1.5,
            opacity: 1,
          },
        },
        polygon: false, // Turns off this drawing tool
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
    });

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    btnClearMap.style.display = 'block';

    L.Map.include({
      clearLayers() {
        this.eachLayer(layer => {
          if (layer instanceof L.TileLayer) return;
          this.removeLayer(layer);
        }, this);
      },
    });

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.addControl(drawControl);

    // Handling draw:created event on map
    this.#map.on('draw:created', this._newFlightPlan.bind(this));
  }

  _clearMap() {
    this.#map.clearLayers.call(this.#map);

    const listsFlightPlan = document.querySelectorAll('.flight__plan');

    // Remove active class
    listsFlightPlan.forEach(function (el) {
      el.classList.remove('flight__plan--active');
    });
  }

  _newFlightPlan(mapE) {
    const drawType = mapE.layerType;

    if (drawType !== 'polyline') return;

    const layer = mapE.layer;
    const layerJSON = layer.toGeoJSON();

    const planName = prompt(`Enter the plan name:`);

    if (!planName) return;

    // Create flightPlane object
    const flightPlan = new FlightPlan(JSON.stringify(layerJSON), planName);

    // Add new object to flightPlans array
    this.#flightPlans.push(flightPlan);

    // Add layer to map
    this.#map.addLayer(layer);

    // Render flightPlan on list
    this._renderFlightPlan(flightPlan);

    // Set local storage to all flightPlans
    this._setLocalStorage();
  }

  _renderFlightPlan(flightPlan) {
    let html = `
    <li class="flight__plan" data-id="${flightPlan.id}">
        <h3 class="plan__name">${flightPlan.planName}</h3>
    </li>
      `;
    containerFlightPlans.insertAdjacentHTML('afterbegin', html);
  }

  _showFlightPlan(e) {
    if (!this.#map) return;

    const flightPlanEl = e.target.closest('.flight__plan');

    // Guard clause
    if (!flightPlanEl) return;

    const flightPlan = this.#flightPlans.find(
      plan => plan.id === flightPlanEl.dataset.id
    );
    this._clearMap();

    // Activate flight plan
    flightPlanEl.classList.add('flight__plan--active');

    L.geoJSON(JSON.parse(flightPlan.layer), {
      style: {
        color: '#FF0000',
        weight: 1.5,
        opacity: 1,
      },
    }).addTo(this.#map);
  }

  _setLocalStorage() {
    localStorage.setItem('flightPlans', JSON.stringify(this.#flightPlans));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('flightPlans'));

    if (!data) return;

    this.#flightPlans = data;

    this.#flightPlans.forEach(flightPlan => {
      this._renderFlightPlan(flightPlan);
    });
  }

  reset() {
    localStorage.removeItem('flightPlans');
    location.reload();
  }
}

const app = new App();
//app.reset();
