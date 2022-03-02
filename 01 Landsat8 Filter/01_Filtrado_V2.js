// Código para filtrar departamentos fue adaptado de:
// https://gis.stackexchange.com/questions/330277/using-ui-select-for-administrative-levels-dropdown-in-google-earth-engine

ui.root.clear();

// Estilos ----------------------------------------------------------------------

var colors = {'cyan': '#24C1E0', 'transparent': '#11ffee00', 'gray': '#F8F9FA'};
var TITLE_STYLE     = {fontWeight: '400', fontSize: '20px', margin: '16px 0px 10px 16px', color: 'green',backgroundColor: colors.transparent};
var PARAGRAPH_STYLE = {fontSize: '14px', padding: '0px 0px 10px 8px', backgroundColor: colors.transparent};
var LABEL_STYLE     = {fontWeight: '50', textAlign: 'center', backgroundColor: colors.transparent};
var SUBTITLES_STYLE = {fontWeight: 'bold', fontSize: '14px', margin: '14px 0px 14px 16px', backgroundColor: colors.transparent};
var BUTTON_STYLE    = {width:'185px', padding:'0px 0px 4px 0px', color:'green'};
var BORDER_STYLE    = '5px solid rgba(97, 97, 97, 0.05)';

// Panel izquierdo -----------------------------------------------------------------

var panel1 = ui.Panel({
  style: {width: '450px'},
  layout: ui.Panel.Layout.flow('vertical', true),
  widgets:[
    ui.Label('Prueba de filtrado por Departamentos y Provincias', TITLE_STYLE),
    ui.Label("Esta aplicación te permite visualizar de forma interactiva los departamentos \
              y provincias del Perú.", PARAGRAPH_STYLE)
  ]
});

// Panel izquierdo 1: Instrucciones -----------------------------------------------

var instructionsPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    backgroundColor: colors.transparent,
    width: '220px',
  },
  widgets: [
    ui.Label('1. Seleccionar Departamento:', SUBTITLES_STYLE),   
    ui.Label('2. Seleccionar Provincia:', SUBTITLES_STYLE),      
    ui.Label('3. Seleccionar Distrito:', SUBTITLES_STYLE),      
  ]
});

// Panel izquierdo 2: Filtrado ----------------------------------------------------------------
var filterPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    backgroundColor: colors.transparent,
    margin: '0px 0px 0px 0px',
    width: '225px',
  },
});

// ASSETS
var assetDeps  = ee.FeatureCollection('users/CesarVilca/departamentos')
var assetProvs = ee.FeatureCollection('users/CesarVilca/provincias')
var assetDist  = ee.FeatureCollection('users/CesarVilca/distritos')

var depsNames = assetDeps.aggregate_array('DEPARTAMEN')

// Funciones de Filtrado

// Dado un departamento -> Obtener sus provincias
var getProvs = function(prov) {
  var depSelected = ee.Feature(assetDeps.filterMetadata('DEPARTAMEN', 'equals', prov).first())
  var depSelectedName = ee.String(depSelected.get('DEPARTAMEN'))
  var filteredProvs = assetProvs.filterMetadata('DEPARTAMEN', 'equals', depSelectedName)
  var filteredProvsNames = filteredProvs.aggregate_array('PROVINCIA')
  return filteredProvsNames
}

// Dado una provincia -> Obtener distritos
var getDist = function(dist) {
  var provSelected = ee.Feature(assetProvs.filterMetadata('PROVINCIA', 'equals', dist).first())
  var provSelectedName = ee.String(provSelected.get('PROVINCIA'))
  var filteredDist = assetDist.filterMetadata('PROVINCIA', 'equals', provSelectedName)
  var filteredDistNames = filteredDist.aggregate_array('DISTRITO')
  return filteredDistNames
}

// ---------- Dropdown ---------- 

// 1. Vacíos al inicio

var depsDD  = ui.Select({items:[], placeholder:'Cargando..', style:BUTTON_STYLE})
var provsDD = ui.Select({items:[], placeholder:'Esperando por un departamento..', style:BUTTON_STYLE})
var distDD  = ui.Select({items:[], placeholder:'Esperando por un departamento..', style:BUTTON_STYLE})

// 2. Una vez se va seleccionando las opciones -> Cambiar nombres

depsNames.evaluate(function(deps){
  
  depsDD.items().reset(deps)
  depsDD.setPlaceholder('Selecciona un departamento')
  
  depsDD.onChange(function(prov){
    
    // Despúes de haber seleccionado un departamento:
    provsDD.setPlaceholder('Ahora selecciona una provincia...')
    distDD.setPlaceholder('Ahora selecciona una provincia...')
    var provincias = getProvs(prov)
    provincias.evaluate(function(provsNames){
      provsDD.items().reset(provsNames)
    })
    
    provsDD.onChange(function(dist){
      
      // Despúes de haber seleccionado una provincia:
      distDD.setPlaceholder('Ahora selecciona una distrito...')
      var distritos = getDist(dist)
      distritos.evaluate(function(distNames){
        distDD.items().reset(distNames)
      })
      
    })
    
  })
  
})

// Opciones de Filtrado
var fecha_ini_chng = '2020-08-01'
var fecha_ini = ui.Textbox({placeholder: 'YYYY-MM-DD', value: fecha_ini_chng, style: BUTTON_STYLE, 
  onChange: function(text){
    var fecha_ini_chng = text
  }});
  
var fecha_fin_chng = '2020-12-31'
var fecha_fin = ui.Textbox({placeholder: 'YYYY-MM-DD', value: fecha_fin_chng, style: BUTTON_STYLE,
  onChange: function(text){
    var fecha_fin_chng = text
  }});

var nubesText_chng = 20
var nubesText = ui.Slider({
  min: 0,
  max: 100, 
  value: nubesText_chng, 
  step: 2,
  onChange: function(value) {
    var nubesText_chng = value
  },
  style: {width: '215px'}
});

// ---------- Botón ---------- 

var add = ui.Button({
  label:'Ver imágenes',
  style: BUTTON_STYLE})

add.onClick(function(){
  
  var provname = provsDD.getValue()
  var provincia_add = assetDist.filter(ee.Filter.eq('PROVINCIA', provname))
  
  var distname = distDD.getValue() 
  var distrito = provincia_add.filter(ee.Filter.eq('DISTRITO', distname)).geometry()
  
  var bordeDist = ee.Image().paint({
    featureCollection: distrito,
    color: 1,
    width: 2
  });
  mapPanel.addLayer(bordeDist, {palette: '#24C1E0'}, distname); // Agregar layer del departamento
  
  mapPanel.clear() // Limpiar el mapa cada vez que se cambia de selección
  
  var imgCol_id = "LANDSAT/LC08/C01/T1"
  var l8Raw = ee.ImageCollection(imgCol_id)
    .filterDate(fecha_ini_chng, fecha_fin_chng)
    .filterBounds(distrito)
    // .filter(ee.Filter.lte('CLOUD_COVER', nubesText_chng))
    
  print(l8Raw.size())
  print(l8Raw.aggregate_array('system:index'))
  print(l8Raw.aggregate_array('CLOUD_COVER'))
  
  
  var l8RawImg = l8Raw.mosaic().multiply(0.00001)
  
  var l8RawImg_vis = {
    bands:['B4','B3','B2'],
    min:0,
    max:0.3
  }
  
  mapPanel.centerObject(distrito, 9)
  mapPanel.addLayer(l8RawImg, l8RawImg_vis, 'Imagen Landsat 8')
  mapPanel.addLayer(bordeDist, {palette: '#24C1E0'}, distname)
})

filterPanel.add(depsDD)
filterPanel.add(provsDD)
filterPanel.add(distDD)

filterPanel.add(fecha_ini);
filterPanel.add(fecha_fin);
filterPanel.add(nubesText);

filterPanel.add(add)

var panel2 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal', true),
  });
  
// Adjuntar instrucciones a panel2
panel2.add(instructionsPanel)
panel2.add(filterPanel)

var informacion = ui.Label(
  'Más información', 
  SUBTITLES_STYLE, 
  'https://github.com/vilcagamarracf/GEE_Apps/blob/main/01%20Landsat8%20Filter/01_Filtrado_V2.js'
  )
  
panel2.add(informacion)
panel1.add(panel2)

ui.root.add(panel1);

var mapPanel = ui.Map();
var initGeometry = ee.Geometry.Point([-74.414, -9.097]);
mapPanel.centerObject(initGeometry, 5);

ui.root.add(mapPanel);