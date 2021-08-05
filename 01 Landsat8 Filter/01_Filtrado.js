// Estilos ----------------------------------------------------------------------

var colors = {'cyan': '#24C1E0', 'transparent': '#11ffee00', 'gray': '#F8F9FA'};
var TITLE_STYLE = {fontWeight: '400', fontSize: '20px', margin: '16px 0px 10px 16px', color: 'green',backgroundColor: colors.transparent};
var PARAGRAPH_STYLE = {fontSize: '14px', padding: '0px 20px 0px 8px', backgroundColor: colors.transparent};
var LABEL_STYLE = {fontWeight: '50', textAlign: 'center', backgroundColor: colors.transparent};
var SUBTITLES_STYLE = {fontWeight: 'bold', fontSize: '14px', margin: '14px 0px 14px 16px', backgroundColor: colors.transparent};
var BUTTON_STYLE = {width:'185px', padding:'0px 0px 4px 0px', color:'green'};
var BORDER_STYLE = '5px solid rgba(97, 97, 97, 0.05)';

// Panel ------------------------------------------------------------------------

var mainPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical', true),
  style: {
    stretch: 'horizontal',
    width: '450px',
    },
  widgets: [
    ui.Label('Filtrado de Imágenes Landsat 8', TITLE_STYLE),
    ui.Label('Esta aplicación te permite visualizar de forma interactiva la mejor imagen ' +
      '(de menor porcentaje de nubosidad) de la colección USGS Landsat 8 Surface Reflectance Tier 1.', 
      PARAGRAPH_STYLE)
      ]
  });

var instructionsPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
      backgroundColor: colors.transparent,
      margin: '0px 0px 0px 0px',
      width: '200px',
      height: '200px'
    },
    widgets: [
      ui.Label('Fecha de Inicio:', SUBTITLES_STYLE),          // F1
      ui.Label('Fecha Final:', SUBTITLES_STYLE),              // F2
      ui.Label('Seleccionar Departamento:', SUBTITLES_STYLE)  // F3
      ]
  });


// Inputs ------------------------------------------------------------------------

var filterPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    backgroundColor: colors.transparent,
    // border: BORDER_STYLE,
    // padding: '4px',
    margin: '0px 0px 0px 0px',
    width: '200px',
    height: '200px'
    },
  });

// Funciones 1 y 2 : FECHAS para filtrado ---------------

var COLLECTION_ID = 'LANDSAT/LC08/C01/T1_SR';
var START_DATE = '2020-01-01';
var END_DATE = '2021-01-01';

var BASE_COLLECTION = ee.ImageCollection(COLLECTION_ID)
                        .filter(ee.Filter.lte('CLOUD_COVER', 20))
                        .filterDate(START_DATE, END_DATE);

// Funcion 1: Fecha de Inicio

var fecha_ini = ui.Textbox({
  placeholder: 'YYYY-MM-DD',
  value: '2020-01-01',
  onChange: function(text) {
    var dateStart = text
    print(dateStart)
    },
  style: BUTTON_STYLE
  });

filterPanel.add(fecha_ini);

// Funcion 2: Fecha Final

var fecha_fin = ui.Textbox({
  placeholder: 'YYYY-MM-DD',
  value: '2020-12-31',
  onChange: function(text) {
    var dateEnd = text
    print(dateEnd)
    },
    style: BUTTON_STYLE
  });
  
filterPanel.add(fecha_fin);

// Funcion 3: Seleccion de departamentos ------------------------------------------------------

var DEPARTAMENTOS = ee.FeatureCollection('users/CesarVilca/Departamentos_Peru');

var departamentos = {
  'AMAZONAS':['AMAZONAS'],
  'ANCASH':['ANCASH'],
  'APURIMAC':['APURIMAC'],
  'AREQUIPA':['AREQUIPA'],
  'AYACUCHO':['AYACUCHO'],
  'CAJAMARCA':['CAJAMARCA'],
  // 'CALLAO':['CALLAO'],
  'CUSCO':['CUSCO'],
  'HUANCAVELICA':['HUANCAVELICA'],
  'HUANUCO':['HUANUCO'],
  'ICA':['ICA'],
  'JUNIN':['JUNIN'],
  'LA LIBERTAD':['LA LIBERTAD'],
  'LAMBAYEQUE':['LAMBAYEQUE'],
  'LIMA':['LIMA'],
  'LORETO':['LORETO'],
  'MADRE DE DIOS':['MADRE DE DIOS'],
  'MOQUEGUA':['MOQUEGUA'],
  'PASCO':['PASCO'],
  'PIURA':['PIURA'],
  'PUNO':['PUNO'],
  'SAN MARTIN':['SAN MARTIN'],
  'TACNA':['TACNA'],
  'TUMBES':['TUMBES'],
  'UCAYALI':['UCAYALI']
}

var VIZ_PARAMS = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.4, gamma: 1.5};


var mapPanel = ui.Map();

var selectDepartamentos = ui.Select({
  items: Object.keys(departamentos), 
  placeholder: 'Departamentos',
  
  onChange: function(key, icol){
    
    mapPanel.clear() // Reinicia la visualización
    
    var filtrado = DEPARTAMENTOS.filter(ee.Filter.eq('NOMBDEP', departamentos[key][0])).geometry()
    
    mapPanel.addLayer(BASE_COLLECTION.filterBounds(filtrado).median().multiply(0.0001),
    VIZ_PARAMS, 'Imagenes Landsat8')
    
    // Departamento seleccionado: Color
    var bordeDpto = ee.Image().byte().paint({
      featureCollection: filtrado,
      color: 1,
      width: 2
    });
    
    mapPanel.addLayer(bordeDpto, {palette: 'FFFFFF'}, departamentos[key][0]);
    mapPanel.centerObject(filtrado, 7)
    },
    
  style: BUTTON_STYLE
})

filterPanel.add(selectDepartamentos);

var panel1 = ui.Panel();
var panel2 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal', true),
    style: {
      stretch: 'vertical',
      height: '200px',
      backgroundColor: colors.transparent
    }
  });

ui.root.clear();

panel1.add(mainPanel)
panel2.add(instructionsPanel)
panel2.add(filterPanel)
panel1.add(panel2)


var initGeometry = ee.Geometry.Point([-74.414, -9.097]);
mapPanel.addLayer(DEPARTAMENTOS.geometry(),{},'Departamentos del Perú')
mapPanel.centerObject(initGeometry, 5);

ui.root.insert(0, panel1);
ui.root.insert(1, mapPanel);