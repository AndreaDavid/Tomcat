Ext.define('Ext.map.GMapPanel', {
    extend:'Ext.panel.Panel',
    alias:'widget.gmappanel',
    requires:['Ext.window.MessageBox'],
    initComponent:function () {
        Ext.applyIf(this, {
            plain:true,
            gmapType:'map',
            border:false
        });
        this.callParent();
    },
    afterFirstLayout:function () {
        this.callParent();
        if (this.center) {
            this.createMap(this.center);
        } else {
            Ext.Error.raise('center is required');
        }
    },
    createMap:function (marker) {
        options = Ext.apply({}, this.mapOptions);
        options = Ext.applyIf(options, {
            zoom:14,
            center:new google.maps.LatLng(marker.lat, marker.lng),
            mapTypeId:google.maps.MapTypeId.ROADMAP
        });
        this.gmap = new google.maps.Map(this.body.dom, options);
        Ext.each(this.markers, this.addMarker, this);
    },
    setMarkers:function (markers) {
        Ext.each(this.markersAnimados, this.clearMarker, this);
        this.markersAnimados = [];
        this.markers = markers;
        Ext.each(this.markers, this.addMarker, this);
    },
    setCenter:function (center) {
        this.center = center;
        this.gmap.setCenter(new google.maps.LatLng(center.lat, center.lng));
    },
    addMarker:function (marker) {
        if (!marker.position) {
            marker.position = new google.maps.LatLng(marker.lat, marker.lng);
        }
        if(marker.color){
            marker.icon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + marker.color);
        }
        var markerAnimado =  new google.maps.Marker(marker);
        markerAnimado.setMap(this.gmap);
        if(marker.infowindow){
            markerAnimado.infowindow = new google.maps.InfoWindow({
                content: marker.infowindow
            });
            if(!marker.onClick){
                google.maps.event.addListener(markerAnimado, 'click', function() {
                    this.infowindow.open(this.map, this);
                });
            }
        }
        if(marker.onClick){
            google.maps.event.addListener(markerAnimado, 'click', function() {
                this.onClick();
            });
        }
        if(marker.onDblClick){
            google.maps.event.addListener(markerAnimado, 'dblclick', function() {
                this.onDblClick();
            });
        }
        Ext.Object.each(marker.listeners, function (name, fn) {
            google.maps.event.addListener(markerAnimado, name, fn);
        });
        this.markersAnimados.push(markerAnimado);
        return markerAnimado;
    },
    clearMarker:function (marker) {
        marker.setMap(null);
    },
    lookupCode:function (addr, marker) {
        this.geocoder = new google.maps.Geocoder();
        this.geocoder.geocode({
            address:addr
        }, Ext.Function.bind(this.onLookupComplete, this, [marker], true));
    },
    onLookupComplete:function (data, response, marker) {
        if (response != 'OK') {
            Ext.MessageBox.alert('Error', 'An error occured: "' + response + '"');
            return;
        }
        this.createMap(data[0].geometry.location, marker);
    },
    afterComponentLayout:function (w, h) {
        this.callParent(arguments);
        this.redraw();
    },
    redraw:function () {
        if (this.gmap) {
            google.maps.event.trigger(this.gmap, 'resize');
        }
    },
    clearSelectionShape:function () {
        if (this.selectedShape) {
          this.selectedShape.setEditable(false);
          this.selectedShape = null;
        }
    },
    setSelectionShape:function (shape) {
        this.clearSelectionShape();
        this.selectedShape = shape;
        shape.setEditable(true);
        //selectColor(shape.get('fillColor') || shape.get('strokeColor'));
    },
    deleteSelectedShape:function () {
        if (this.selectedShape) {
          this.selectedShape.setMap(null);
          this.selectedShape=undefined;
          this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        }
    },
    setDrawingManager:function(manager)
    {
        this.drawingManager=manager;
        var self=this;
        google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function(e) {
            if (e.type != google.maps.drawing.OverlayType.MARKER) {
                self.drawingManager.setDrawingMode(null);
                // Add an event listener that selects the newly-drawn shape when the user mouses down on it.
                var newShape = e.overlay;
                newShape.type = e.type;
                google.maps.event.addListener(newShape, 'click', function() {
                  self.setSelectionShape(newShape);
                });
                self.setSelectionShape(newShape);
          }
        });

        google.maps.event.addListener(this.drawingManager, 'drawingmode_changed', this.clearSelectionShape);
        google.maps.event.addListener(this.gmap, 'click', this.clearSelectionShape);
        //google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', this.deleteSelectedShape);
    },
    fitBoundPuntos:function (puntos) {
        var bounds = new google.maps.LatLngBounds();
		for (var n = 0; n < puntos.length ; n++){
			bounds.extend(puntos[n]);
		}
		this.gmap.fitBounds(bounds);
    }
});