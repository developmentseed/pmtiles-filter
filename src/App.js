import React, { createRef, useEffect, useLayoutEffect, useState } from 'react';
import * as pmtiles from 'pmtiles';
import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

let TILES_URL = "https://pmtiles.s3.amazonaws.com/seychelles.pmtiles";
let protocol = new pmtiles.Protocol();
maplibre.addProtocol("pmtiles", protocol.tile);

const xyzStyle = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 21
    }
  ]
};

const getFilterItem = (item) => {
  if (item.length > 1) return ['==', item[0], item[1]];
  return ['has', item[0]];
};

const popupContent = (feature) => {
  return (
    const name = e.features[0].properties.name;
    return `OSM ID ${e.features[0].properties['@id']}${name ? ` (${name})` : ''}`;
  );
}

export default function App() {
  const mapRef = createRef();
  const [map, setMap] = useState(null);
  const [filter, setFilter] = useState('amenity');

  useLayoutEffect(() => {
    const m = new maplibre.Map({
      container: mapRef.current,
      style: xyzStyle,
      center: [55.4954, -4.7020],
      zoom: 12,
      attributionControl: false
    })
      .addControl(new maplibre.AttributionControl({ compact: false }))
      .addControl(new maplibre.NavigationControl({ showCompass: true }));

    const onLoad = () => setMap(m);
    m.on('load', () => {
      onLoad();
      m.addSource("protomaps", {
        type: "vector",
        url: "pmtiles://" + TILES_URL,
        attribution: 'Protomaps'
       });
       m.addLayer(
        {
          'id': 'points',
          'type': 'circle',
          'paint': {
            'circle-radius': [
              'interpolate',
              ['exponential', 0.5],
              ['zoom'],
              15,
              3,
              22,
              10
              ],
            'circle-color': '#007cbf'
          },
          'filter': ['all', ['==', '$type', 'Point'], ['has', 'amenity']],
          'source': 'protomaps',
          'source-layer': 'osm',
        }
      );
       m.addLayer(
        {
          'id': 'lines',
          'type': 'line',
          'paint': {
            'line-color': '#007cbf',
            'line-opacity': 0.6,
            'line-width': 2
          },
          'filter': ['all', ['==', '$type', 'LineString'], ['has', 'amenity']],
          'source': 'protomaps',
          'source-layer': 'osm',
        }
      );
       m.addLayer(
        {
          'id': 'areas',
          'type': 'fill',
          'paint': {
            'fill-color': '#007cbf',
            'fill-opacity': 1
          },
          'filter': ['all', ['==', '$type', 'Polygon'], ['has', 'amenity']],
          'source': 'protomaps',
          'source-layer': 'osm',
        }
      );
      m.on('click', 'points', function (e) {
        

        new maplibre.Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(m);
      });
      m.on('click', 'lines', function (e) {
        const name = e.features[0].properties.name;
        const content = `OSM ID ${e.features[0].properties['@id']}${name ? ` (${name})` : ''}`;

        new maplibre.Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(m);
      });
      m.on('click', 'areas', function (e) {
        const name = e.features[0].properties.name;
        const content = `OSM ID ${e.features[0].properties['@id']}${name ? ` (${name})` : ''}`;

        new maplibre.Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(m);
      });
    });

    return () => {
      m.off('load', onLoad);
      if (map) {
        map.remove();
      }
    };
    // eslint-disable-next-line
  }, []);

  const updateFilters = () => {
    const newFilter = filter
      .replaceAll(' ', '')
      .split(',')
      .map((i) => i.split('='));
    map.setFilter(
      'points',
      [
        'all',
        ['==', '$type', 'Point'],
        ['any', ...newFilter.map((i) => getFilterItem(i))]
      ]
    );
    map.setFilter(
      'lines',
      [
        'all',
        ['==', '$type', 'LineString'],
        ['any', ...newFilter.map((i) => getFilterItem(i))]
      ]
    );
    map.setFilter(
      'areas',
      [
        'all',
        ['==', '$type', 'Polygon'],
        ['any', ...newFilter.map((i) => getFilterItem(i))]
      ]
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    updateFilters()
  }

  return (
    <>
      <div id="map" className='h-screen w-full' ref={mapRef} />
      <div className='absolute float-right top-0 left-0 p-2 m-2 rounded bg-gray-300/50'>
        <h1 className='font-semibold pb-2'>Filter by OSM tags combinations</h1>
        <form onSubmit={onSubmit}
        >
          <input
            className='p-1 rounded border'
            type='text'
            onChange={(e) => setFilter(e.target.value)} value={filter}
          />
          <button className='bg-slate-400 font-semibold px-2 py-1 ml-1 rounded' onClick={updateFilters}>
            Filter
          </button>
        </form>
      </div>
    </>
  );
};
