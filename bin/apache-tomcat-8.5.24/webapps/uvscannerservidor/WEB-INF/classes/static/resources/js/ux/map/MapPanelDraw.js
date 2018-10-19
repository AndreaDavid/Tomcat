try{
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
            this.inf = new google.maps.InfoWindow();
            if (this.drawOptions){
                this.setDrawOptions();
            }
            if (options.infoCustom){
                google.maps.event.addListener(this.inf, 'domready', function() {
                    var iwOuter = $('.gm-style-iw');
                    var iwBackground = iwOuter.prev();

                    // Removes background shadow DIV
                    iwBackground.children(':nth-child(2)').css({'display' : 'none'});

                    // Removes white background DIV
                    iwBackground.children(':nth-child(4)').css({'display' : 'none'});

                    // Moves the infowindow 115px to the right.
                    iwOuter.parent().parent().css({left: '115px'});

                    // Moves the shadow of the arrow 76px to the left margin.
                    iwBackground.children(':nth-child(1)').attr('style', function(i,s){return s + 'left: 76px !important;';});

                    // Moves the arrow 76px to the left margin.
                    iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 76px !important;';});

                    // Changes the desired tail shadow color.
                    iwBackground.children(':nth-child(3)').find('div').children().css({'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index' : '1'});

                    // Reference to the div that groups the close button elements.
                    var iwCloseBtn = iwOuter.next();

                    // Apply the desired effect to the close button
                    iwCloseBtn.css({opacity: '1', right: '38px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9'});

                    // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
                    if($('.iw-content').height() < 140){
                        $('.iw-bottom-gradient').css({display: 'none'});
                    }

                    // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
                    iwCloseBtn.mouseout(function(){
                        $(this).css({opacity: '1'});
                    });
                });
            }
        },
        setMarkers:function (markers,noEncajar) {
            //Verifica si tiene activa la opcion para animar:
            if (this.animarMarkers){
                //Debe actualizar la posicion segun el id:
                //Buscar en los markers del mapa si existen los que se envian, en cuyo caso se actualiza la posicion
                var encontrado=false;
                for (var p=0;p<markers.length;p++){
                    encontrado=false;
                    for (var i=0;i<this.markersAnimados.length;i++){
                        if (this.markersAnimados[i].id===markers[p].id){
                            this.markersAnimados[i].setPosition({lat:markers[p].lat,lng:markers[p].lng});
                            encontrado=true;
                            break;
                        }
                    }
                    //En caso de que no exista el marcador se debe agregar:
                    if (!encontrado){
                        this.addMarker(markers[p]);
                    }
                }
                //Eliminar los marcadores del mapa que no llegaron en la lista nueva:
                for (var i = this.markersAnimados.length - 1; i >= 0; i--) {
                    encontrado=false;
                    for (var p=0;p<markers.length;p++){
                        if (this.markersAnimados[i].id===markers[p].id){
                            this.markersAnimados[i].setPosition({lat:markers[p].lat,lng:markers[p].lng});
                            encontrado=true;
                        }
                    }
                    if (!encontrado){
                        this.markersAnimados[i].setMap(null);
                        this.markersAnimados.splice(i,1);
                    }
                }
            }else{
                Ext.each(this.markersAnimados, this.clearMarker, this);
                this.markersAnimados = [];
                this.markers = markers;
                Ext.each(this.markers, this.addMarker, this);
                if (!noEncajar){
                    this.fitBoundPuntos(this.markers);
                }
            }
        },
        setCenter:function (center) {
            this.center = center;
            this.gmap.setCenter(new google.maps.LatLng(center.lat, center.lng));
        },
        addMarker:function (marker) {
            if (!marker.position) {
                marker.position = new google.maps.LatLng(marker.lat, marker.lng);
            }
            if (marker.icon){
                marker.draggable= false;
                marker.icon= marker.icon;
                marker.label= {
                    text: marker.labelContent,
                    color: '#000000',
                    fontSize: '12px'
                };
            }
            else if (marker.path){
                var clickIcon = {
                    //path: 'M8,0C3.400,0,0,3.582,0,8s8,24,8,24s8-19.582,8-24S12.418,0,8,0z M8,12c-2.209,0-4-1.791-4-4   s1.791-4,4-4s4,1.791,4,4S10.209,12,8,12z',
                    path:'M 10.49645,6.7855644 A 2.5193384,2.6778913 0 0 1 7.9771111,9.4634558 2.5193384,2.6778913 0 0 1 5.4577727,6.7855644 2.5193384,2.6778913 0 0 1 7.9771111,4.1076725 2.5193384,2.6778913 0 0 1 10.49645,6.7855644 Z M 7.9235505,33.100201 C 7.2546785,29.353959 6.0753535,26.23642 4.6469298,23.34703 3.587402,21.203784 2.3599911,19.225531 1.224319,17.147193 0.8452098,16.453386 0.51803604,15.720418 0.15374769,15.000367 -0.57465422,13.560602 -1.165231,11.891278 -1.1277031,9.7258911 -1.0910384,7.6101887 -0.55472606,5.9130506 0.21864054,4.5254292 1.4906036,2.2431471 3.6211851,0.37192471 6.4799114,-0.11982905 8.8172695,-0.52189284 11.008708,0.15738888 12.562757,1.1941651 c 1.269911,0.8472404 2.253329,1.9789634 3.00085,3.312739 0.780233,1.3921102 1.317511,3.0367458 1.362581,5.1819568 0.02309,1.0990631 -0.13467,2.1168631 -0.356886,2.9611101 -0.224892,0.854546 -0.586575,1.568867 -0.908366,2.331874 -0.628154,1.489412 -1.41569,2.854098 -2.206035,4.219593 -2.354109,4.067221 -4.5636661,8.215114 -5.5313505,13.898763 z',
                    fillColor :marker.color,
                    fillOpacity: 0.9,
                    strokeColor: "gray",
                    strokeWeight: 1,
                    labelOrigin: new google.maps.Point(8, 35),
                    anchor: new google.maps.Point(9, 35),
                    scale: 1
                };
                // animation: google.maps.Animation.DROP,
                marker.draggable= false;
                marker.icon= clickIcon;
                marker.label= {
                    text: marker.labelContent,
                    color: '#284A6D',
                    fontSize: '12px',
                    fontWeight: 'bold'
                };
            }
            else if(marker.color){
                //marker.icon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + marker.color);
                marker.icon={
                    path: google.maps.SymbolPath.CIRCLE,
                    strokeColor: "gray",
                    scale: 10,
                    fillColor :marker.color,
                    fillOpacity :0.5,
                    strokeWeight:2
                };
            }
            //var markerAnimado =  new MarkerWithLabel(marker);
            marker.draggable= false;
            var markerAnimado =  new google.maps.Marker(marker);
            markerAnimado.setMap(this.gmap);
            if(marker.infowindow){
                var me=this;
                google.maps.event.addListener(markerAnimado, 'click', function() {
                    me.inf.close();
                    me.inf.setContent(markerAnimado.infowindow);
                    me.inf.open(this.map, markerAnimado);

                });
            }
            if(marker.onClick){
                google.maps.event.addListener(markerAnimado, 'click', function() {
                    this.onClick(marker);
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
            this.path = new google.maps.MVCArray();
            this.markers=[];
            //this.uluru = new google.maps.LatLng(-25.344, 131.036);
        },
        deletePoligono:function(){
            if (this.listPoligonos)
                Ext.each(this.listPoligonos, function(pol){
                    if (pol)
                    {
                        pol.setMap(null);
                        pol=null;
                    }
                }, this);
            if (this.markers)
            {
                for (var i = 0;i < this.markers.length; i++)
                {
                    this.markers[i].setMap(null);
                }
                this.markers=[];
            }
            this.listPoligonos=null;
        },
        crearPoligono:function(r,p){
            this.deletePoligono();

            //Position, decimal degrees
            var lat = p.lat();
            var lon = p.lng();
            //Earths radius, sphere
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
                strokeColor: '#FF0000',
                fillColor: '#FFFF00',
                fillOpacity:0.5
            };
            this.poligono= new google.maps.Polygon(overlayOptions);
            this.poligono.setMap(this.gmap);
            if (!this.listPoligonos)
                this.listPoligonos= [];
            this.listPoligonos.push(this.poligono);
            //this.poligono.setPaths(new google.maps.MVCArray([path]));
            //google.maps.event.addListener(map, 'click', addPoint);
            this.crearPuntosPoligono();

        },
        crearPuntosPoligono:function(titulo)
        {
            if (!this.listPoligonos)
                this.listPoligonos= [];
            this.listPoligonos.push(this.poligono);
            var path=this.poligono.getPath();
            for(var i=0 ; i < path.length ; i++){
                this.addPoint(path.getAt(i),titulo);
            }
        },
        addPoint:function(event,titulo) {
            var path=this.poligono.getPath();
            //path.insertAt(path.length, event.latLng);
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(event.lat(), event.lng()),
                //map: this.gmap,
                draggable: this.editPoligono,
                icon:'res/pin.png'
            });

            if (!this.markers)
                this.markers= [];

            marker.setMap(this.gmap);

            this.markers.push(marker);
            marker.setTitle(titulo);
            var me=this;
            /*google.maps.event.addListener(marker, 'click', function() {
			marker.setMap(null);
			for (var i = 0, I = me.markers.length; i < I && me.markers[i] != marker; ++i);
			this.markers.splice(i, 1);
			path.removeAt(i);

		  }
		);*/
            if (this.editPoligono)
                google.maps.event.addListener(marker, 'dragend', function() {
                    for (var i = 0, I = me.markers.length; i < I && me.markers[i] != marker; ++i);
                    path.setAt(i, marker.getPosition());
                }
                                             );
        },
        fitBoundPuntos:function (puntos) {
            if (puntos){
                var bounds = new google.maps.LatLngBounds();
                for (var n = 0; n < puntos.length ; n++){
                    bounds.extend(puntos[n]);
                }
                this.gmap.fitBounds(bounds);
            }
        },
        animarMarcador:function (id,centrar) {
            for (var i=0;i<this.markersAnimados.length;i++){
                if(this.markersAnimados[i].id==id){
                    this.markersAnimados[i].setAnimation(google.maps.Animation.BOUNCE);
                    if (centrar)
                        this.setCenter({lat:this.markersAnimados[i].getPosition().lat(), lng:this.markersAnimados[i].getPosition().lng()});
                }else
                    this.markersAnimados[i].setAnimation(null);
            }
        },
        cerrarInfoWindows:function (id,centrar) {
            for (var i=0;i<this.markersAnimados.length;i++)
                if (this.markersAnimados[i].infowindow)
                    this.markersAnimados[i].infowindow.close();
        },
        dibujarPolilinea:function(puntos,icon){
            var flightPlanCoordinates=[];
            for (var i=0;i<puntos.length;i++){
                flightPlanCoordinates.push(new google.maps.LatLng(puntos[i].lat, puntos[i].lng));
            }
            /* this.flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            icon:icon
        });
        this.flightPath.setMap(this.gmap);*/

            this.flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: this.gmap,
                icons: icon,
                zIndex: 100

            });


            this.flightPath.setOptions({ zIndex: 100 });

        },
        calcularRuta:function(pIni, pFin, res, show,anima,puntos) {
            var start = new google.maps.LatLng(pIni.lat, pIni.lng);
            var end = new google.maps.LatLng(pFin.lat, pFin.lng);
            if(show===undefined || show){
                var me = this;
                if (!this.directionsDisplay)
                {
                    this.directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
                }
                if (!this.directionsService){
                    this.directionsService = new google.maps.DirectionsService();
                }
                this.directionsDisplay.setMap(this.gmap);
                var directionsDisplay = this.directionsDisplay;
                var waypts = [];
                for(var p=0;p<puntos.length;p++){
                    waypts.push({
                        location: new google.maps.LatLng(puntos[p].lat, puntos[p].lng),
                        stopover: true
                    });  
                }
                this.directionsService.route({
                    origin: start, 
                    destination: end,
                    waypoints: waypts, 
                    travelMode: 'DRIVING'
                }, function(result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {

                        // directionsDisplay.setDirections(response);

                        var bounds = new google.maps.LatLngBounds();

                        var path1 = [];
                        var legs = result.routes[0].legs;
                        var distancia = 0;
                        var duracion1 = 0;
                        
                        for (i=0;i<legs.length;i++) {
                            distancia = distancia+ legs[i].distance.value;
                            duracion1 = duracion1+ legs[i].duration.value;
                            var steps = legs[i].steps;
                            for (j=0;j<steps.length;j++) {
                                var nextSegment = steps[j].path;
                                for (k=0;k<nextSegment.length;k++) {
                                    path1.push({lat:nextSegment[k].lat(),lng:nextSegment[k].lng()});
                                    //bounds.extend(nextSegment[k]);
                                }
                            }
                        }
                        Ext.getCmp('lbl_recorrido').setText((Math.round((distancia/1000), 2))+' km');
                        Ext.getCmp('lbl_duracion').setText((Math.round((duracion1/60), 2))+' Min');
                        //polyline.getPath().push([{lat: 2.468886, lng: -76.593353}, {lat: 2.468200, lng: -76.593063},{lat: 2.468554, lng: -76.592226},{lat: 2.468219, lng: -76.592073},{lat: 2.469010, lng: -76.591311}]);
                        var mapa= me.gmap;

                        var lineSymbol = {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            strokeColor: '#393'
                        };
                        var col = [];
                        if(anima){
                            col =[{
                                icon: lineSymbol,
                                offset: '100%'
                            }];
                        }
                        me.polyline = new google.maps.Polyline({
                            path: path1,
                            strokeColor: '',
                            strokeWeight: 3,
                            icons: col,
                            map: mapa
                        });
                        if(anima){
                            Ext.ComponentManager.get('main').fn_animar(me.polyline);
                        }
                        directionsDisplay.setDirections(result);
                        //this.gmap.fitBounds(bounds);
                    }
                    else{
                        res(null);
                    }
                });
            }else{
                if(!this.distanceMatrixService){
                    this.distanceMatrixService = new google.maps.DistanceMatrixService();
                }
                this.distanceMatrixService.getDistanceMatrix({origins: [start], destinations: [end], travelMode: google.maps.TravelMode.DRIVING}, function(result, status) {
                    if (status == google.maps.DistanceMatrixStatus.OK) {
                        var elemento = result.rows[0].elements[0];
                        res({distancia: elemento.distance.text, duracion: elemento.duration.text, minutos: elemento.duration.value/60});
                    }
                    else{
                        res(null);
                    }
                });
            }
        },
        deletePolyline:function(){
            if(this.polyline !== undefined)
                this.polyline.setMap(null);
        },
        deleteRutas:function(){
            if (this.directionsDisplay)
            {
                this.directionsDisplay.setMap(null);
                this.directionsDisplay=null;
            }
        },
        deleteMarkers:function () {
            Ext.each(this.markersAnimados, this.clearMarker, this);
            this.markersAnimados = [];
            //Ext.each(this.markers, this.clearMarker, this);
            this.markers = [];
        },
        addMarkerWithLabel:function (marker) {
            if (!marker.position) {
                marker.position = new google.maps.LatLng(marker.lat, marker.lng);
            }

            var markerAnimado =   new MarkerWithLabel(marker);
            markerAnimado.setMap(this.gmap);
            if(marker.infowindow){
                markerAnimado.infowindow = new google.maps.InfoWindow({
                    content: marker.infowindow
                });
                if(!marker.onClick){
                    var me=this;
                    google.maps.event.addListener(markerAnimado, 'click', function() {
                        me.cerrarInfoWindows();
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
        deletePolilinea:function(){
            if (this.flightPath)
            {
                this.flightPath.setMap(null);
                this.flightPath=null;
            }
        },
        clearAll:function(){
            this.deleteMarkers();
        },
        setDrawOptions:function(config){
            var options = Ext.apply({}, config);
            options = Ext.applyIf(options, {
                drawingControl:false
            });
            this.drawingManager = new google.maps.drawing.DrawingManager(options);
            this.drawingManager.setMap(this.gmap);

        },
        deleteDraw:function(){
            if (this.drawingManager){
                this.drawingManager.setMap(null);
            }
        }
    });
}catch(e){}