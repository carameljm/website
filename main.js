import Map from 'https://cdn.skypack.dev/ol/Map.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import XYZ from 'https://cdn.skypack.dev/ol/source/XYZ.js';
import {fromLonLat} from 'https://cdn.skypack.dev/ol/proj.js';
import {getRenderPixel} from 'https://cdn.skypack.dev/ol/render.js';
import {FullScreen, defaults as defaultControls} from 'https://cdn.skypack.dev/ol/control.js';

const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const roads = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 22,
  }),
});

const imagery = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://geo.api.vlaanderen.be/HISTCART/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=abw&STYLE=&FORMAT=image/png&TILEMATRIXSET=GoogleMapsVL&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    maxZoom: 20,
  }),
});

const container = document.getElementById('map');

const map = new Map({
  layers: [roads, imagery],
  controls: defaultControls().extend([new FullScreen()]),
  target: container,
  view: new View({
    center: fromLonLat([3.6066, 50.8266]),
    zoom: 15,
  }),
});

let radius = 75;
document.addEventListener('keydown', function (evt) {
  if (evt.key === 'ArrowUp') {
    radius = Math.min(radius + 5, 150);
    map.render();
    evt.preventDefault();
  } else if (evt.key === 'ArrowDown') {
    radius = Math.max(radius - 5, 25);
    map.render();
    evt.preventDefault();
  }
});

// get the pixel position with every move
let mousePosition = null;

container.addEventListener('mousemove', function (event) {
  mousePosition = map.getEventPixel(event);
  map.render();
});

container.addEventListener('mouseout', function () {
  mousePosition = null;
  map.render();
});

// before rendering the layer, do some clipping
imagery.on('prerender', function (event) {
  const ctx = event.context;
  ctx.save();
  ctx.beginPath();
  if (mousePosition) {
    // only show a circle around the mouse
    const pixel = getRenderPixel(event, mousePosition);
    const offset = getRenderPixel(event, [
      mousePosition[0] + radius,
      mousePosition[1],
    ]);
    const canvasRadius = Math.sqrt(
      Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2)
    );
    ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
    ctx.lineWidth = (5 * canvasRadius) / radius;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
  }
  ctx.clip();
});

// after rendering the layer, restore the canvas context
imagery.on('postrender', function (event) {
  const ctx = event.context;
  ctx.restore();
});
