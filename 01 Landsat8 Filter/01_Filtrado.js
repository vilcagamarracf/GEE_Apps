// MEJORANDO CODIGO: Landsat8: Filter 

// Google Earth Engine Tutorial: Widgets and Apps     https://www.youtube.com/watch?v=ctLsxPXr76A
// Ejemplos de apps:
// https://github.com/jdbcode/Snazzy-EE-TS-GIF/blob/master/script/ee-ts-gif.js
// https://emaprlab.users.earthengine.app/view/lt-gee-time-series-animator
// https://github.com/Andi1974/Forest-degradation-monitoring/blob/2.4.1/Delta-rNBR.txt

ui.root.clear();

// Estilos ----------------------------------------------------------------------

var colors = {'cyan': '#24C1E0', 'transparent': '#11ffee00', 'gray': '#F8F9FA'};
var TITLE_STYLE = {fontWeight: '400', fontSize: '20px', margin: '16px 0px 10px 16px', color: 'green',backgroundColor: colors.transparent};
var PARAGRAPH_STYLE = {fontSize: '14px', padding: '0px 0px 10px 8px', backgroundColor: colors.transparent};
var LABEL_STYLE = {fontWeight: '50', textAlign: 'center', backgroundColor: colors.transparent};
var SUBTITLES_STYLE = {fontWeight: 'bold', fontSize: '14px', margin: '14px 0px 14px 16px', backgroundColor: colors.transparent};
var BUTTON_STYLE = {width:'185px', padding:'0px 0px 4px 0px', color:'green'};
var BORDER_STYLE = '5px solid rgba(97, 97, 97, 0.05)';

// Panel ------------------------------------------------------------------------

var panel1 = ui.Panel({
  style: {width: '450px'},
  layout: ui.Panel.Layout.flow('vertical', true),
  widgets:[
    ui.Label('Filtrado de Imágenes Landsat 8', TITLE_STYLE),
    ui.Label(
      "Esta aplicación te permite visualizar de forma interactiva la mejor imagen "+
      "(de menor porcentaje de nubosidad) de la colección USGS Landsat 8 Surface "+
      "Reflectance Tier 1.", PARAGRAPH_STYLE
    )
  ]
});

// Panel izquierdo: Instrucciones -----------------------------------------------
var instructionsPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    backgroundColor: colors.transparent,
    width: '225px',
  },
  widgets: [
    ui.Label('Fecha de Inicio:', SUBTITLES_STYLE),            // F1
    ui.Label('Fecha Final:', SUBTITLES_STYLE),                // F2
    ui.Label('Nubosidad:', SUBTITLES_STYLE),                  // F3
    ui.Label('Seleccionar Departamento:', SUBTITLES_STYLE),   // F4
  ]
});

// Panel derecho ----------------------------------------------------------------
var filterPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    backgroundColor: colors.transparent,
    margin: '0px 0px 0px 0px',
    width: '225px',
  },
});

// Panel derecho: Funciones 1, 2 y 3 -------------------------------------------
var fecha_ini = ui.Textbox({placeholder: 'YYYY-MM-DD', value: '2020-01-01', style: BUTTON_STYLE, 
  onChange: function(text){
    var fecha_ini_chng = text
  }});
var fecha_fin = ui.Textbox({placeholder: 'YYYY-MM-DD', value: '2020-12-31', style: BUTTON_STYLE,
  onChange: function(text){
    var fecha_fin_chng = text
  }});

var nubesText = ui.Slider({
  min: 0,
  max: 100, 
  value: 20, 
  step: 5,
  onChange: function(value) {
    var nubesText_chng = value
  },
  style: {width: '215px'}
});

// Panel derecho: Funcion 4 ------------------------------------------------------

var mapPanel = ui.Map();

var DEPARTAMENTOS = ee.FeatureCollection('users/CesarVilca/departamentos');
var depsNames = DEPARTAMENTOS.aggregate_array('DEPARTAMEN')

var VIZ_PARAMS = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.4, gamma: 1.5};

var selectDepartamentos = ui.Select({
  items: [],
  placeholder: 'Cargando...',
  style: BUTTON_STYLE
})

depsNames.evaluate(function(deps){
  selectDepartamentos.items().reset(deps)
  selectDepartamentos.setPlaceholder('Departamentos')
  selectDepartamentos.onChange(function(dep){
    var departamentos_chng = dep
  })
})
  
filterPanel.add(fecha_ini);
filterPanel.add(fecha_fin);
filterPanel.add(nubesText);
filterPanel.add(selectDepartamentos);

// Botón de RUN
var button = ui.Button({
  label: 'Run', 
  onClick: function(){return runFilter()},
  style: BUTTON_STYLE
})

filterPanel.add(button);

var runFilter = function(key, icol){
  mapPanel.clear() // Reinicia la visualización  var fecha_ini_chng = fecha_ini.getValue()
  
  var fecha_ini_chng = fecha_ini.getValue()
  var fecha_fin_chng = fecha_fin.getValue()
  var nubesText_chng = nubesText.getValue()
  var departamentos_chng = selectDepartamentos.getValue()
  
  if  (departamentos_chng === null){
    // var boton = ui.Button('Escoge un departamento');
    //   boton.style().set({
    //     position: 'top-center',
    //     border : '1px solid #000000',
    //   });
    //   Map.add(boton);
    mapPanel.addLayer(DEPARTAMENTOS.geometry(),{},'Departamentos del Perú')
  } else {
    // Filtrado por departamento
  var filtrado = DEPARTAMENTOS.filterMetadata('DEPARTAMEN','equals', departamentos_chng).geometry()
  var COLLECTION_ID = 'LANDSAT/LC08/C01/T1_SR';
  var viz = ee.ImageCollection(COLLECTION_ID)
                          .filter(ee.Filter.lte('CLOUD_COVER', nubesText_chng))
                          .filterDate(fecha_ini_chng, fecha_fin_chng)
                          .filterBounds(filtrado).median().multiply(0.0001)

  mapPanel.addLayer(viz, VIZ_PARAMS, 'Imagenes Landsat8'); // Agregar imágenes Landsat8

  // Departamento seleccionado: Asignar un color
  var bordeDpto = ee.Image().byte().paint({
    featureCollection: filtrado,
    color: 1,
    width: 2
  });
  
  mapPanel.addLayer(bordeDpto, {palette: '#24C1E0'}, departamentos_chng); // Agregar layer del departamento
  mapPanel.centerObject(filtrado, 7)
  }
}

// Estableciendo la estructura final

var panel2 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal', true),
  });

// Adjuntar instrucciones a panel2
panel2.add(instructionsPanel)
panel2.add(filterPanel)
panel2.add(ui.Label('Más información', SUBTITLES_STYLE, 'https://github.com/vilcagamarracf/GEE_Apps/blob/main/01%20Landsat8%20Filter/01_Filtrado.js'))
panel1.add(panel2)

var initGeometry = ee.Geometry.Point([-74.414, -9.097]);
mapPanel.addLayer(DEPARTAMENTOS.geometry(),{},'Departamentos del Perú')
mapPanel.centerObject(initGeometry, 5);

ui.root.add(panel1);
ui.root.add(mapPanel);