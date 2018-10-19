Ext.define('Ext.map.MapPanelDraw', {
    extend:'Ext.panel.Panel',
    alias:'widget.mappaneldraw',
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
	iniDrawMap:function(){
		this.path = new google.maps.MVCArray;
		this.markers=[];
		//this.uluru = new google.maps.LatLng(-25.344, 131.036);
	},
	deletePoligono:function(){
		if (this.poligono)
		{
			this.poligono.setMap(null);
			this.poligono=null;
		}
		if (this.markers)
		{
			for (var i = 0;i < this.markers.length; i++)
			{
				this.markers[i].setMap(null);
			}
			this.markers=[];
		}
	},
	crearPoligono:function(r,p){
		this.deletePoligono();
			
		//Position, decimal degrees
		var lat = p.lat();
		var lon = p.lng();
		//Earth�s radius, sphere
		var R=6378137;
		var PI=3.141516;
		//offsets in meters
		var dn = r;
		var de = r;
		//Coordinate offsets in radians
		var dLat = dn/R;
		var dLon = de/(R*Math.cos((PI*lat/180)));
		//OffsetPosition, decimal degrees
		var latO = lat + dLat * 180/PI;
		var lonO = lon + dLon * 180/PI;
		r=p.lat()- latO;
		r=r+r/2;
		var pi=new google.maps.LatLng(p.lat()-(r/2),p.lng()-(r+r/2));
		if (this.poligono)
			this.poligono.setMap(null);
		
		var data=[
			[pi.lat(), pi.lng()],
			[pi.lat()+r, pi.lng()],
			[pi.lat()+2*r, pi.lng()+r],
			[pi.lat()+2*r, pi.lng()+2*r],
			[pi.lat()+r, pi.lng()+3*r],
			[pi.lat(), pi.lng()+3*r],
			[pi.lat()-r, pi.lng()+2*r],
			[pi.lat()-r, pi.lng()+r]
			//[pi.lat(), pi.lng()]
		];
		var regionCoords = [];
		for(var i=0 ; i < data.length ; i++)
		  regionCoords.push(new google.maps.LatLng(data[i][0], data[i][1]));

		var overlayOptions = {
		  paths: regionCoords,
		  strokeColor: "#FF0000"
		};
		this.poligono= new google.maps.Polygon(overlayOptions);
		this.poligono.setMap(this.gmap);
		//this.poligono.setPaths(new google.maps.MVCArray([path]));
		//google.maps.event.addListener(map, 'click', addPoint);
		this.crearPuntosPoligono();
		
	},
	crearPuntosPoligono:function()
	{
		var path=this.poligono.getPath();
		for(var i=0 ; i < path.length ; i++){
			this.addPoint(path.getAt(i));
		}
	},
	addPoint:function(event) {
		var path=this.poligono.getPath();
		//path.insertAt(path.length, event.latLng);
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(event.lat(), event.lng()),
			//map: this.gmap,
			draggable: true
		});
		
		marker.setMap(this.gmap);
		
		this.markers.push(marker);
		marker.setTitle('Hola');
		var me=this;
		/*google.maps.event.addListener(marker, 'click', function() {
			marker.setMap(null);
			for (var i = 0, I = me.markers.length; i < I && me.markers[i] != marker; ++i);
			this.markers.splice(i, 1);
			path.removeAt(i);
			
		  }
		);*/
		google.maps.event.addListener(marker, 'dragend', function() {
			for (var i = 0, I = me.markers.length; i < I && me.markers[i] != marker; ++i);
			path.setAt(i, marker.getPosition());
		}
		);
	},
    fitBoundPuntos:function (puntos) {
        var bounds = new google.maps.LatLngBounds();
		for (var n = 0; n < puntos.length ; n++){
			bounds.extend(puntos[n]);
		}
		this.gmap.fitBounds(bounds);
    }
});