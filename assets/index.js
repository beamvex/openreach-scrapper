/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const dunston = { lat: 53.1470222, lng: -0.4106133 };

let mymap = undefined;

function reqListener() {
  var goodIcon = L.icon({
    iconUrl: 'good.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  var badIcon = L.icon({
    iconUrl: 'bad.png',
    iconSize: [38, 38],
    iconAnchor: [30, 30],
    popupAnchor: [-10, -30],
  });
  let mapdata = JSON.parse(this.responseText);

  for (var address in mapdata) {
    console.log('adding map location', mapdata[address]);

    const status = mapdata[address].status;
    const geolocation = mapdata[address].geolocation;
    const postcode = mapdata[address].timeAndLocation?.postcode ?? address;
    const timestampRaw = mapdata[address].timeAndLocation?.time;
    const timestamp = timestampRaw ? new Date(timestampRaw).toLocaleString() : '';
    const icon = status === 'Available to order now' ? goodIcon : badIcon;
    var marker = L.marker([geolocation.Latitude, geolocation.Longitude], {
      icon,
    }).addTo(mymap);
    marker.bindTooltip(`${postcode}<br/>${timestamp}<br/>${status}`);
    marker.bindPopup(`${postcode}<br/>${timestamp}<br/>${status}`).openPopup();
  }
}

// Initialize and add the map
function initMap() {
  const latitude = dunston.lat;
  const longitude = dunston.lng;
  const zoom = 15;

  mymap = L.map('mapWrap').setView([latitude, longitude], zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mymap);

  // The marker, positioned at Uluru

  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', `results.json?cb=${Date.now()}`);
  oReq.send();
}

document.addEventListener('DOMContentLoaded', initMap);
