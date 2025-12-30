/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const dunston = { lat: 53.1470222, lng: -0.4106133 };

let map = undefined;

function reqListener() {
  let mapdata = JSON.parse(this.responseText);

  console.log(mapdata);

  for (var address in mapdata) {
    console.log('adding map location', mapdata[address]);

    const position = {
      lng: Number(mapdata[address].addressData.Longitude),
      lat: Number(mapdata[address].addressData.Latitude),
    };

    let icon = 'no.png';

    if (mapdata[address].hasFullFibre) {
      icon = 'yes.png';
    }

    const marker = new google.maps.Marker({
      position: position,
      map: map,
      title: mapdata[address].addressLine,
      icon,
    });
  }
}

// Initialize and add the map
function initMap() {
  const latitude = dunston.lat;
  const longitude = dunston.lng;
  const zoom = 15;

  var mymap = L.map('mapWrap').setView([latitude, longitude], zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {
    foo: 'bar',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mymap);

  var marker = L.marker([latitude, longitude]).addTo(mymap);
  marker
    .bindPopup('Latitude: ' + latitude + '<br>Longitude: ' + longitude)
    .openPopup();
  // The marker, positioned at Uluru

  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', 'results.json');
  oReq.send();
}

document.addEventListener('DOMContentLoaded', initMap);
