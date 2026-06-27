/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const dunston = { lat: 53.1470222, lng: -0.4106133 };

let mymap = undefined;
const postcodeToMarker = new Map();

function normalizePostcode(value) {
  return `${value ?? ''}`.replace(/\s+/g, '').toUpperCase();
}

function wireUpPostcodeSearch() {
  const form = document.getElementById('postcodeSearchForm');
  const input = document.getElementById('postcodeSearchInput');

  if (!form || !input) {
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();

    const raw = input.value;
    const key = normalizePostcode(raw);
    if (!key) {
      return;
    }

    const marker = postcodeToMarker.get(key);
    if (!marker) {
      window.alert(`Postcode not found on map: ${raw}`);
      return;
    }

    const latLng = marker.getLatLng();
    const targetZoom = Math.max(mymap?.getZoom?.() ?? 15, 16);
    mymap.setView(latLng, targetZoom, { animate: true });
    marker.openPopup();
  });
}

function getLegendBucket(status) {
  if (status === 'Available to order now') {
    return 'available';
  }
  if (status === "We're building in this area now") {
    return 'building_now';
  }
  if (typeof status === 'string' && status.endsWith('building in this area in the next year')) {
    return 'building_next_year';
  }
  if (status === "We're planning to build in this area") {
    return 'planning';
  }
  if (status === 'not_queried_yet') {
    return 'not_queried_yet';
  }
  return 'unavailable';
}

function updateLegendCounts(counts) {
  const total = Object.values(counts).reduce((acc, n) => acc + n, 0);
  const setText = (key, label) => {
    const el = document.querySelector(`[data-legend-key="${key}"]`);
    if (!el) {
      return;
    }
    const count = counts[key] ?? 0;
    el.textContent = `${label} (${count})`;
  };

  const title = document.querySelector('.map-legend__title');
  if (title) {
    title.textContent = `Legend (${total})`;
  }

  setText('available', 'Available to order now');
  setText('building_now', "We're building in this area now");
  setText('building_next_year', "We'll be building in this area in the next year");
  setText('planning', "We're planning to build in this area");
  setText('not_queried_yet', 'Not queried yet');
  setText('unavailable', 'No plans / unavailable');
}

function reqListener() {
  var goodIcon = L.icon({
    iconUrl: 'star-3.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  var buildingIcon = L.icon({
    iconUrl: 'yoga.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  var planningNextYearIcon = L.icon({
    iconUrl: 'postal.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  var buildingInProgressIcon = L.icon({
    iconUrl: 'gourmet_0star.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  var badIcon = L.icon({
    iconUrl: 'skull.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  var notQueriedIcon = L.icon({
    iconUrl: '3d.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  
  let mapdata = JSON.parse(this.responseText);

  const counts = {
    available: 0,
    building_now: 0,
    building_next_year: 0,
    planning: 0,
    not_queried_yet: 0,
    unavailable: 0,
  };

  for (var address in mapdata) {
    console.log('adding map location', mapdata[address]);

    const status = mapdata[address].status;
    const bucket = getLegendBucket(status);
    counts[bucket] = (counts[bucket] ?? 0) + 1;
    const geolocation = mapdata[address].geolocation || { Latitude: 51.5074, Longitude: -0.1278 };
    const postcode = mapdata[address].timeAndLocation?.postcode ?? address;
    const postcodeKey = normalizePostcode(postcode);
    const timestampRaw = mapdata[address].timeAndLocation?.time;
    const timestamp = timestampRaw ? new Date(timestampRaw).toLocaleString() : '';
    const icon = status === 'Available to order now' ? goodIcon : status.endsWith("building in this area in the next year") ? buildingIcon :
      status == "We're planning to build in this area" ? planningNextYearIcon : 
      status == "We're building in this area now" ? buildingInProgressIcon :
      status == "not_queried_yet" ? notQueriedIcon : badIcon;
    var marker = L.marker([geolocation.Latitude, geolocation.Longitude], {
      icon,
    }).addTo(mymap);
    marker.bindTooltip(`${postcode}<br/>${timestamp}<br/>${status}`);
    marker.bindPopup(`${postcode}<br/>${timestamp}<br/>${status}`).openPopup();

    if (postcodeKey) {
      postcodeToMarker.set(postcodeKey, marker);
    }
  }

  updateLegendCounts(counts);
}

// Initialize and add the map
function initMap() {
  const latitude = dunston.lat;
  const longitude = dunston.lng;
  const zoom = 15;

  mymap = L.map('mapWrap').setView([latitude, longitude], zoom);

  wireUpPostcodeSearch();

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mymap);

  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <div class="map-legend__title">Legend</div>
      <div class="map-legend__row"><img class="map-legend__icon" src="star-3.png" alt="Available" /> <span data-legend-key="available">Available to order now</span></div>
      <div class="map-legend__row"><img class="map-legend__icon" src="gourmet_0star.png" alt="Building now" /> <span data-legend-key="building_now">We're building in this area now</span></div>
      <div class="map-legend__row"><img class="map-legend__icon" src="yoga.png" alt="Building next year" /> <span data-legend-key="building_next_year">We'll be building in this area in the next year</span></div>
      <div class="map-legend__row"><img class="map-legend__icon" src="postal.png" alt="Planning" /> <span data-legend-key="planning">We're planning to build in this area</span></div>
      <div class="map-legend__row"><img class="map-legend__icon" src="3d.png" alt="Not queried" /> <span data-legend-key="not_queried_yet">Not queried yet</span></div>
      <div class="map-legend__row"><img class="map-legend__icon" src="skull.png" alt="No plans" /> <span data-legend-key="unavailable">No plans / unavailable</span></div>
    `;
    return div;
  };
  legend.addTo(mymap);

  // The marker, positioned at Uluru

  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', `results.json?cb=${Date.now()}`);
  oReq.send();
}

document.addEventListener('DOMContentLoaded', initMap);
