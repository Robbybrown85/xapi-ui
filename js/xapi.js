$(document).ready(function() {
  // Set up some basics
  var config = {};

  var baseurl;
  
  // Set up the map
  map = new OpenLayers.Map('bboxmap', 
                           {projection: "EPSG:900913",});  
  // We'll use these projections in our functions later
  var goog =  new OpenLayers.Projection("EPSG:900913");
  var latlon = new OpenLayers.Projection("EPSG:4326");

  var drawbbox = true;

  var bboxVectors = new OpenLayers.Layer.Vector("Bounding Box");
  map.addLayer(bboxVectors);
  var bboxShiftControl = new OpenLayers.Control();
  OpenLayers.Util.extend(bboxShiftControl, {
    draw: function () {
      // this Handler.Box will intercept the shift-mousedown
      // before Control.MouseDefault gets to see it
      this.box = new OpenLayers.Handler.Box( bboxShiftControl,
          {"done": this.notice},
          {keyMask: OpenLayers.Handler.MOD_SHIFT});
      this.box.activate();
    },

    notice: function (bounds) {
      var ll = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.left, bounds.bottom)); 
      var ur = map.getLonLatFromPixel(new OpenLayers.Pixel(bounds.right, bounds.top)); 
      var llLat = ll.transform(map.getProjectionObject(), latlon);
      var urLat = ur.transform(map.getProjectionObject(), latlon);
      $('#bbox_left').val(llLat.lon.toFixed(5));
      $('#bbox_bottom').val(llLat.lat.toFixed(5));
      $('#bbox_right').val(urLat.lon.toFixed(5));
      $('#bbox_top').val(urLat.lat.toFixed(5));
      update_bbox();
      update_results();      
      $('#noneToggle').attr('checked','true');
    }
  });
  map.addControl(bboxShiftControl);

  //  draw box without shift
  bboxToggleControl = new OpenLayers.Control.DrawFeature(bboxVectors,
    OpenLayers.Handler.RegularPolygon, {handlerOptions: {sides: 4, irregular: true}});
  map.addControl(bboxToggleControl);
  
  bboxToggleControl.featureAdded=featureInsert;
  function featureInsert(feature) {
    var old=[];
    for (var i = 0; i < bboxVectors.features.length; i++) {
        if (bboxVectors.features[i] != feature) {
            old.push(bboxVectors.features[i]);
        }
    }
    bboxVectors.destroyFeatures(old);
    
    var bounds = feature.geometry.getBounds();
    bounds=bounds.transform(map.getProjectionObject(), latlon);
    $('#bbox_top').val(bounds.top.toFixed(5));
    $('#bbox_right').val(bounds.right.toFixed(5));
    $('#bbox_bottom').val(bounds.bottom.toFixed(5));
    $('#bbox_left').val(bounds.left.toFixed(5));

    update_results();      
    $('#bboxNone').attr('checked','true');
    bboxToggleControl.deactivate();
  }

  // Function to return proper tag search string
  var tagsearch = function() {
    if($("#searchbytag").is(':checked')) {
      t = $('#element').val() + '[' + $('#tag').val() + ']';
    }
    else { t = ""; };
    return t;
  };

  // Function to return a bbox string
  var bbox = function() {
    var b = 'bbox=' + $('#bbox_left').val() + ',' + $('#bbox_bottom').val() +
      ',' + $('#bbox_right').val() + ',' + $('#bbox_top').val();
    return b;
  }

  // Update the bbox from the text to the map
  var update_bbox = function() {
    var bounds = new OpenLayers.Bounds( parseFloat($('#bbox_left').val()),
                                        parseFloat($('#bbox_bottom').val()),
                                        parseFloat($('#bbox_right').val()),
                                        parseFloat($('#bbox_top').val()));
    bounds.transform(latlon, goog);
    
    var bboxGeom = bounds.toGeometry();
    bboxVectors.removeAllFeatures();
    bboxVectors.addFeatures([new OpenLayers.Feature.Vector(bboxGeom)]);
    };

  // Function to update the display on the page  
  var update_results = function() {
    var results = baseurl + '/' ;
    if ($('#searchbytag').is(':checked')) {
      results = results + tagsearch();
      if ($('#searchbybbox').is(':checked')) {
        results = results + '[' + bbox() + ']'; };}
    else {
      if ($('#searchbybbox').is(':checked')) {
        results = results + 'map?' + bbox(); }
    };
    $('#results').text(results);
    $('#results').attr('href', results);
  };

  // Draw BBOX wihle toggle is activated
  $('#bboxNone').click(function() {
    bboxToggleControl.deactivate(); });
  $('#bboxToggle').click(function() {
    bboxToggleControl.activate(); });

  // Set up some UI element functions
  $("#searchbytag").click(function() {
    if ( $(this).is(':checked') ) {
      $('#tag').removeAttr('disabled');
      $('#element').removeAttr('disabled');
    }
    else {
      $('#tag').attr('disabled', 'disabled');
      $('#element').attr('disabled', 'disabled');
    };
    update_results();
  });
  
  $('#element').change(function() {
    update_results(); });
  
  $('#tag').keyup(function() {
    update_results(); });
  
  $('#searchbybbox').click(function() {
    if ( $(this).is(':checked')) {
      $('#bbox_top').removeAttr('disabled');
      $('#bbox_bottom').removeAttr('disabled');
      $('#bbox_left').removeAttr('disabled');
      $('#bbox_right').removeAttr('disabled');
      $('#bboxNone').removeAttr('disabled');
      $('#bboxToggle').removeAttr('disabled');
    }
    else {
      $('#bbox_top').attr('disabled', 'disabled');
      $('#bbox_bottom').attr('disabled', 'disabled');
      $('#bbox_left').attr('disabled', 'disabled');
      $('#bbox_right').attr('disabled', 'disabled');
      $('#bboxNone').attr('disabled', 'disabled');
      $('#bboxToggle').attr('disabled', 'disabled');};
    update_results();
  });

  $('#bbox_top').change(function() {
    update_bbox();
    update_results();});
  $('#bbox_bottom').change(function() {
    update_bbox();
    update_results();});
  $('#bbox_left').change(function() {
    update_bbox();
    update_results();});
  $('#bbox_right').change(function() {
    update_bbox();
    update_results();});

  $.getJSON("config.json", function(json) {
    baseurl = json.baseurl;
    tileurl = json.tileurl;
    document.title = json.title;
    $('#title').text(json.title);
    attribution = json.attribution;
    
    var osm = new OpenLayers.Layer.OSM("bboxmap",
                                       tileurl + "${z}/${x}/${y}.png",
                                       {attribution: ''});
    $('#attribution').text(attribution);
    map.addLayer(osm);
    map.zoomTo(1);
    update_results();
  });

});
