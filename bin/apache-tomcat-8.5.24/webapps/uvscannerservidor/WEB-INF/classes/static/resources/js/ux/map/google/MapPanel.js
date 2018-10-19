Ext.define('Ext.map.MapPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.mappanel',
    requires: ['Ext.window.MessageBox'],
    initComponent: function () {
        Ext.applyIf(this, {
            plain: true,
            gmapType: 'map',
            border: false
        });
        this.markersAnimados = [];
        this.poligonos = [];
		this.polilineas = [];
		this.circulos = [];
        this.callParent();
    },
    afterFirstLayout: function () {
        this.callParent();
        if (this.center) {
            this.createMap(this.center);
        } else {
            Ext.Error.raise('El punto central es requerido');
        }
    },
    createMap: function (marker) {
        options = Ext.apply({}, this.mapOptions);
        options = Ext.applyIf(options, {
            zoom: 14,
            center: new google.maps.LatLng(marker.lat, marker.lng),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        this.gmap = new google.maps.Map(this.body.dom, options);
        if (this.markers && this.markers.length)
            this.setMarkers(this.markers);
        google.maps.LatLng.prototype.distanceFrom = function (latlng) {
            var lat = [this.lat(), latlng.lat()];
            var lng = [this.lng(), latlng.lng()];
            var R = 6378137;
            var dLat = (lat[1] - lat[0]) * Math.PI / 180;
            var dLng = (lng[1] - lng[0]) * Math.PI / 180;
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat[0] * Math.PI / 180) * Math.cos(lat[1] * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            return Math.round(d);

        };
    },
    setMarkers: function (markers, indice) {
        if (indice === undefined)
            indice = 0;
        if (this.markersAnimados && this.markersAnimados[indice] && this.markersAnimados[indice].length) {
            for (var i = 0; i < this.markersAnimados[indice].length; i++) {
                this.clearMarker(this.markersAnimados[indice][i]);
            }
        }
        this.markersAnimados[indice] = [];
        for (var i = 0; i < markers.length; i++) {
            this.addMarker(markers[i], indice);
        }
    },
    addMarkers: function (markers, indice) {
        if (indice === undefined)
            indice = 0;
        if (!this.markersAnimados[indice])
            this.markersAnimados[indice] = [];
        for (var i = 0; i < markers.length; i++) {
            this.addMarker(markers[i], indice);
        }
    },
    setCenter: function (center, verificarZoom) {
        if (verificarZoom === undefined) {
            verificarZoom = false;
        }
        this.center = center;
        this.gmap.setCenter(new google.maps.LatLng(center.lat, center.lng));
        if (verificarZoom) {
            if (this.gmap.getZoom() < 16) {
                this.gmap.setZoom(16);
            }
        }
    },
    addMarker: function (marker, indice) {
        if (indice === undefined)
            indice = 0;
        if (!marker.position) {
            marker.position = new google.maps.LatLng(marker.lat, marker.lng);
        }
        if (marker.color) {
            //marker.icon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + marker.color);
            marker.icon = {
                path: marker.path ? marker.path : google.maps.SymbolPath.CIRCLE,
                strokeColor: "gray",
                scale: marker.scale ? marker.scale : 1,
                fillColor: marker.color,
                fillOpacity: 0.8,
                strokeWeight: 1,
                anchor: marker.anchor ? new google.maps.Point(marker.anchor.x, marker.anchor.y) : new google.maps.Point(0, 0)
            };
        }



        if (marker.icon && marker.icon.anchor) {
            var anchor = marker.icon.anchor;
            marker.icon.anchor = new google.maps.Point(anchor.x, anchor.y);
        }

        var markerAnimado = new google.maps.Marker(marker);

        markerAnimado.setMap(this.gmap);

        if (marker.infowindow) {
            markerAnimado.infowindow = new google.maps.InfoWindow({
                content: marker.infowindow
            });
            if (!marker.onClick) {
                var me = this;
                google.maps.event.addListener(markerAnimado, 'click', function () {
                    me.cerrarInfoWindows();
                    this.infowindow.open(this.map, this);
                });
            }
        }

        if (marker.onClick) {
            google.maps.event.addListener(markerAnimado, 'click', function (e) {
                this.onClick(e);
            });
        }


        if (marker.detalle) {

            google.maps.event.addListener(markerAnimado, 'click', function () {
                var panelPoligonos = Ext.getCmp('estacionespoligonos');
                if (marker.detalle === 'OA') {
                    Ext.getCmp('estacionespoligonos').mask('Consultando. Por favor espere...');
                    var me = this;
                    Ext.getStore('Store_Detalle_OA').load({
                        params: {
                            numOrden: marker.numOrden
                        },
                        callback: function (records, operation, success) {
                            if (success) {
                                var cuadrilla = records[0].get('cuadrilla') ? records[0].get('cuadrilla') : ' ';
                                var observaciones = records[0].get('observaciones') ? records[0].get('observaciones') : ' ';
                                markerAnimado.infowindow = new google.maps.InfoWindow({
                                    content: '<table><tr><th>Número OA</th><th>Cadena Electrica</th><th>Fecha Registro</th><th>Número SAE</th><th>Nivel</th><th>Clientes Afectados</th><th>Cuadrilla</th><th>Observaciones</th></tr><tr><td>' + records[0].get('numOA') + '</td><td>' + records[0].get('cadenaElectrica') + '</td><td>' + records[0].get('fechaRegistro') + '</td><td>' + records[0].get('numSae') + '</td><td>' + records[0].get('nivel') + '</td><td>' + records[0].get('clienAfectados') + '</td><td>' + cuadrilla + '</td><td>' + observaciones + '</td></tr></table>'
                                });
                                me.infowindow.open(me.map, me);
                            }
                            Ext.getCmp('estacionespoligonos').unmask();
                        }
                    });
                } else if (marker.detalle === 'SAE') {
                    Ext.getCmp('estacionespoligonos').mask('Consultando. Por favor espere...');
                    var me = this;
                    Ext.getStore('Store_Detalle_SAE').load({
                        params: {
                            numOrden: marker.numOrden
                        },
                        callback: function (records, operation, success) {
                            if (success) {
                                var cuadrilla = records[0].get('descCuadrilla') ? records[0].get('descCuadrilla') : ' ';
                                var observaciones = records[0].get('observaciones') ? records[0].get('observaciones') : ' ';
                                markerAnimado.infowindow = new google.maps.InfoWindow({
                                    content: '<html><body><table><tr><th>Número SAE</th><th>Cadena Electrica</th><th>Codigo Cliente</th><th>Fecha Registro</th><th>Motivo</th><th>Descripcion Cuadrilla</th><th>Observaciones</th><th>Reiterativas</th></tr><tr><td>' + records[0].get('numSAE') + '</td><td>' + records[0].get('cadenaElectrica') + '</td><td>' + records[0].get('codCliente') + '</td><td>' + records[0].get('fechaRegistro') + '</td><td>' + records[0].get('motivo') + '</td><td>' + cuadrilla + '</td><td>' + observaciones + '</td><td>' + '<button onclick="Ext.getCmp(\'estacionespoligonos\').reiterativas_fn(' + records[0].get('codCliente') + ')">' + records[0].get('reiterativas') + '</button>' + '</td></tr></table></body></html>'
                                });
                                me.infowindow.open(me.map, me);
                            }
                            Ext.getCmp('estacionespoligonos').unmask();
                        }
                    });
                } else if (marker.detalle === 'PM') {
                    Ext.getCmp('estacionespoligonos').mask('Consultando. Por favor espere...');
                    var me = this;
                    Ext.getStore('Store_Detalle_PM').load({
                        params: {
                            numOrden: marker.numOrden
                        },
                        callback: function (records, operation, success) {
                            if (success) {
                                if (records.length > 0) {
                                    markerAnimado.infowindow = new google.maps.InfoWindow({
                                        content: '<h4>Numero PM</h4><h5>' + records[0].get('numPm') + '</h5><br><h4>Fecha Registro </h4><h5>' + records[0].get('fechaRegistro') + '</h5><br><h4>Clientes Afectados:</h4><h5>' + records[0].get('clienAfectados') + '</h5><br><h4>Cadena Electrica:</h4><h5>' + records[0].get('cadenaElectrica') + '</h5>'
                                    });
                                    me.infowindow.open(me.map, me);
                                } else {
                                    Ext.MessageBox.show({
                                        title: 'Alerta',
                                        msg: 'No hay detalle para la Subestacion seleccionada.',
                                        buttons: Ext.MessageBox.OK,
                                        buttonText: {
                                            ok: "Aceptar"
                                        },
                                        icon: Ext.MessageBox.INFO
                                    });
                                }

                            }
                            Ext.getCmp('estacionespoligonos').unmask();
                        }
                    });
                } else if (marker.detalle === 'cuadrilla') {
                    Ext.getCmp('estacionespoligonos').mask('Consultando. Por favor espere...');
                    var me = this;
                    Ext.getStore('SAtencionesPendientes').load({
                        params: {
                            imei: marker.numOrden
                        },
                        callback: function (records, operation, success) {
                            if (success) {
                                if (records.length > 0) {
                                    var fila = '';
                                    for (var i = 0; i < records.length; i++) {
                                        fila = fila + '<tr><td>' + records[i].get('tipo') + '</td><td>' + records[i].get('numero') + '</td><td>' + records[i].get('motivo') + '</td><td>' + records[i].get('fecha') + '</td></tr>';
                                    }
                                    markerAnimado.infowindow = new google.maps.InfoWindow({
                                        content: '<table><tr><th>Tipo</th><th>Numero</th><th>Motivo/Nivel</th><th>Fecha Registro</th></tr>' + fila + '</table>'
                                    });
                                    me.infowindow.open(me.map, me);
                                } else {
                                    Ext.MessageBox.show({
                                        title: 'Alerta',
                                        msg: 'No hay detalle para la cuadrilla seleccionada.',
                                        buttons: Ext.MessageBox.OK,
                                        buttonText: {
                                            ok: "Aceptar"
                                        },
                                        icon: Ext.MessageBox.INFO
                                    });
                                }

                            }
                            Ext.getCmp('estacionespoligonos').unmask();

                        }
                    });
                }
            });
        }

        if (marker.onDblClick) {
            google.maps.event.addListener(markerAnimado, 'dblclick', function () {
                this.onDblClick();
            });
        }
        Ext.Object.each(marker.listeners, function (name, fn) {
            google.maps.event.addListener(markerAnimado, name, fn);
        });
        if (this.markersAnimados===null || this.markersAnimados===undefined) 
        this.markersAnimados = [];
        this.markersAnimados.push(markerAnimado);
        return markerAnimado;
    },
    clearMarker: function (marker) {
        marker.setMap(null);
    },
    deleteMarkers: function (indice) {
       if (indice === undefined) {
            if (this.markersAnimados && this.markersAnimados.length) {
                for (indice = 0; indice < this.markersAnimados.length; indice++) {
                    if (this.markersAnimados[indice]) {
                        this.clearMarker(this.markersAnimados[indice]);


                    }
                }
                this.markersAnimados = [];
            }
        } else {
            if (this.markersAnimados && this.markersAnimados.length && this.markersAnimados[indice] && this.markersAnimados[indice].length) {
                for (var i = 0; i < this.markersAnimados[indice].length; i++) {
                    this.clearMarker(this.markersAnimados[indice][i]);
                }
                this.markersAnimados[indice] = null;
            }
        }
    },
    lookupCode: function (addr, marker) {
        this.geocoder = new google.maps.Geocoder();
        this.geocoder.geocode({
            address: addr
        }, Ext.Function.bind(this.onLookupComplete, this, [marker], true));
    },
    onLookupComplete: function (data, response, marker) {
        if (response != 'OK') {
            Ext.MessageBox.alert('Error', 'An error occured: "' + response + '"');
            return;
        }
        this.createMap(data[0].geometry.location, marker);
    },
    afterComponentLayout: function (w, h) {
        this.callParent(arguments);
        this.redraw();
    },
    redraw: function () {
        if (this.gmap) {
            google.maps.event.trigger(this.gmap, 'resize');
        }
    },
    iniDrawMap: function () {
        this.path = new google.maps.MVCArray();
        this.markersPoligono = [];
        //this.uluru = new google.maps.LatLng(-25.344, 131.036);
    },
    deleteUnPoligono: function (poligono) {
        poligono.setMap(null);
        poligono = null;
    },
    deletePoligono: function () {
        if (this.listPoligonos)
            Ext.each(this.listPoligonos, function (pol) {
                if (pol)
                {
                    pol.setMap(null);
                    pol = null;
                }
            }, this);
        if (this.markersPoligono)
        {
            for (var i = 0; i < this.markersPoligono.length; i++)
            {
                this.markersPoligono[i].setMap(null);
            }
            this.markersPoligono = [];
        }
        this.listPoligonos = null;
    },
    crearPoligono: function (r, p) {
        this.deletePoligono();

        //Position, decimal degrees
        var lat = p.lat();
        var lon = p.lng();
        //Earths radius, sphere
        var R = 6378137;
        var PI = 3.141516;
        //offsets in meters
        var dn = r;
        var de = r;
        //Coordinate offsets in radians
        var dLat = dn / R;
        var dLon = de / (R * Math.cos((PI * lat / 180)));
        //OffsetPosition, decimal degrees
        var latO = lat + dLat * 180 / PI;
        var lonO = lon + dLon * 180 / PI;
        r = p.lat() - latO;
        r = r + r / 2;
        var pi = new google.maps.LatLng(p.lat() - (r / 2), p.lng() - (r + r / 2));
        if (this.poligono)
            this.poligono.setMap(null);

        var data = [
            [pi.lat(), pi.lng()],
            [pi.lat() + r, pi.lng()],
            [pi.lat() + 2 * r, pi.lng() + r],
            [pi.lat() + 2 * r, pi.lng() + 2 * r],
            [pi.lat() + r, pi.lng() + 3 * r],
            [pi.lat(), pi.lng() + 3 * r],
            [pi.lat() - r, pi.lng() + 2 * r],
            [pi.lat() - r, pi.lng() + r]
                    //[pi.lat(), pi.lng()]
        ];
        var regionCoords = [];
        for (var i = 0; i < data.length; i++)
            regionCoords.push(new google.maps.LatLng(data[i][0], data[i][1]));

        var overlayOptions = {
            paths: regionCoords,
            strokeColor: '#FF0000',
            fillColor: '#FFFF00',
            fillOpacity: 0.5
        };
        this.poligono = new google.maps.Polygon(overlayOptions);
        this.poligono.setMap(this.gmap);
        if (!this.listPoligonos)
            this.listPoligonos = [];
        this.listPoligonos.push(this.poligono);
        //this.poligono.setPaths(new google.maps.MVCArray([path]));
        //google.maps.event.addListener(map, 'click', addPoint);
        this.crearPuntosPoligono();

    },
    crearPuntosPoligono: function (titulo)
    {
        if (!this.listPoligonos)
            this.listPoligonos = [];
        this.listPoligonos.push(this.poligono);
        var path = this.poligono.getPath();
        for (var i = 0; i < path.length; i++) {
            this.addPoint(path.getAt(i), titulo);
        }
    },
    addPoint: function (event, titulo) {
        var path = this.poligono.getPath();
        //path.insertAt(path.length, event.latLng);
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(event.lat(), event.lng()),
            //map: this.gmap,
            draggable: this.editPoligono,
            icon: this.iconPoligon
        });

        marker.setMap(this.gmap);
        if (!this.markersPoligono)
            this.markersPoligono = [];

        this.markersPoligono.push(marker);
        marker.setTitle(titulo);
        var me = this;
        /*google.maps.event.addListener(marker, 'click', function() {
         marker.setMap(null);
         for (var i = 0, I = me.markers.length; i < I && me.markers[i] != marker; ++i);
         this.markersPoligono.splice(i, 1);
         path.removeAt(i);
         
         }
         );*/
        if (this.editPoligono)
            google.maps.event.addListener(marker, 'dragend', function () {
                for (var i = 0, I = me.markers.length; i < I && me.markers[i] != marker; ++i)
                    ;
                path.setAt(i, marker.getPosition());
            }
            );
    },
    fitBoundsPuntos: function (puntos) {
        var bounds = new google.maps.LatLngBounds();
        for (var n = 0; n < puntos.length; n++) {
            if (('lat' in puntos[n]) && ('lng' in puntos[n])) {
                bounds.extend(new google.maps.LatLng(puntos[n].lat, puntos[n].lng));
            } else if (('latitud' in puntos[n]) && ('longitud' in puntos[n])) {
                bounds.extend(new google.maps.LatLng(puntos[n].lat, puntos[n].lng));
            }
        }
        this.gmap.fitBounds(bounds);
    },
    fitBounds: function () {
        var bounds = new google.maps.LatLngBounds();
        var contador = 0;
        var center;
        var path;
        var indice;
        var i;
        if (this.poligonos && this.poligonos.length) {
            for (indice = 0; indice < this.poligonos.length; indice++) {
                if (this.poligonos[indice] && this.poligonos[indice].getMap()) {
                    path = this.poligonos[indice].getPath();
                    if (path && path.length) {
                        for (i = 0; i < path.length; i++) {
                            center = path.getAt(i);
                            bounds.extend(center);
                            contador++;
                        }
                    }
                }
            }
        }
		if(this.circulo){
			var circleBounds = this.circulo.getBounds();
            bounds.union(circleBounds);
            contador += 2;	
		}
        if (this.markersAnimados) {
            if (this.markersAnimados.length) {
                for (indice = 0; indice < this.markersAnimados.length; indice++) {
                    if (this.markersAnimados[indice] && this.markersAnimados[indice].length) {
                        for (i = 0; i < this.markersAnimados[indice].length; i++) {
                            if (this.markersAnimados[indice][i].getMap() !== null) {
                                center = this.markersAnimados[indice][i].getPosition();
                                bounds.extend(center);
                                contador++;
                            }
                        }
                    }
                }
            }
            var keys = Object.keys(this.markersAnimados);
            if (keys && keys.length) {
                for (i = 0; i < keys.length; i++) {
					if(this.markersAnimados[keys[i]]){
                    var dato = this.markersAnimados[keys[i]][0];
                    if (dato && dato.getMap()) {
						
                        center = dato.getPosition();
                        bounds.extend(center);
                        contador++;
                    }
					}
                }
            }
        }
        if (contador > 0) {
            if (contador === 1) {
                this.gmap.setCenter(center);
                if (this.gmap.getZoom() < 16) {
                    this.gmap.setZoom(16);
                }
            } else {
                this.gmap.fitBounds(bounds);
            }
        }
    },
    animarMarcador: function (ids, centrar, indice) {
        if (indice === undefined) {
            indice = 0;
        }
        var retorno = [];
        var marcadores = this.markersAnimados[indice];
        for (var i = 0; i < marcadores.length; i++) {
            var marcador = marcadores[i];
            var encontrado = false;
            for (var j = 0; j < ids.length; j++) {
                if (marcador.id == ids[j]) {
                    encontrado = true;
                }
            }
            if (encontrado) {
                marcador.setAnimation(google.maps.Animation.BOUNCE);
                var marker = {lat: marcador.getPosition().lat(), lng: marcador.getPosition().lng()};
                if (centrar)
                {
                    this.setCenter(marker);
                }
                retorno.push(marker);
            } else {
                marcador.setAnimation(null);
            }
        }
        return retorno;
    },
    cerrarInfoWindows: function () {
        for (var i = 0; i < this.markersAnimados.length; i++)
            if (this.markersAnimados[i])
                for (var j = 0; j < this.markersAnimados[i].length; j++)
                    if (this.markersAnimados[i][j].infowindow)
                        this.markersAnimados[i][j].infowindow.close();
    },
     calcularRuta: function(pIni, pFin, res, show, puntos, ind, start, pathRes, limit, distancia, duracion, segundos) {
        var end;
        var waypts = [];
        var me = this;
        if (distancia === undefined)  {
            distancia = 0;
        }
        
        if (duracion === undefined)  {
            duracion = 0;
        }
        
        if (segundos === undefined)  {
            segundos = 0;
        }
        
        if (limit === undefined)  {
            limit = 1;
        }
        else  {
            limit = limit + 1;
        }
        
        if (ind === undefined) {
			ind = 0;
        }
		if(pathRes === undefined){
			pathRes = [];
		}
        if (puntos) {
            for (; ind < puntos.length; ind++) {
                var latitud = puntos[ind].lat;
                var longitud = puntos[ind].lng;
                if ((latitud !== 0) || (longitud !== 0)) {
                    if (ind === 0) {
                        start = new google.maps.LatLng(latitud, longitud);
                    }else if (ind%20 === 0  || ind === puntos.length - 1) {
						end = new google.maps.LatLng(latitud, longitud);
						ind++;
						break;
					}else{
						waypts.push({
							location: new google.maps.LatLng(latitud, longitud),
							stopover: true
						});
					}
                }
            }
        }
        if (show === undefined || show) {
            if (!this.directionsDisplay) {
                this.directionsDisplay = new google.maps.DirectionsRenderer({
                    suppressMarkers: true
                });
            }
            if (!this.directionsService) {
                this.directionsService = new google.maps.DirectionsService();
            }
            //this.directionsDisplay.setMap(this.gmap);
            var directionsDisplay = this.directionsDisplay;
            this.directionsService.route({
                origin: start,
                destination: end,
                waypoints: waypts,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(result, status) {
                if (result === null) {
                    var v = waypts;
                }
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(result);
                    
                    var legs = result.routes[0].legs;
                    var i = 0;
                    var j = 0;
                    var k = 0;
                    for (i; i < legs.length; i++) {
                        distancia = distancia + legs[i].distance.value;
                        segundos = segundos + legs[i].duration.value;
                        var steps = legs[i].steps;
                        for (j = 0; j < steps.length; j++) {
                            var nextSegment = steps[j].path;
                            for (k = 0; k < nextSegment.length; k++) {
                                pathRes.push({
                                    lat: nextSegment[k].lat(),
                                    lng: nextSegment[k].lng()
                                });
                            }
                        }
                    }
                    if (ind < puntos.length) {
                        if (limit >= 5) {
                            var task = new Ext.util.DelayedTask(function() {
                                    me.calcularRuta(pIni, pFin, res, undefined, puntos, ind, end, pathRes, 0, distancia, duracion, segundos);
                                });
                            task.delay(4000);
                        } else {
                            me.calcularRuta(pIni, pFin, res, undefined, puntos, ind, end, pathRes, limit, distancia, duracion, segundos);
                        }
                    } else {
                        res({
                            distancia: Math.round((distancia / 1000) * 100) / 100,
                            duracion: duracion,
                            minutos: Math.round((segundos / 60) * 100) / 100,
                            path: pathRes
                        });
                    }
                } else {
                    res(null);
                }
            });
        } else {
            if (!this.distanceMatrixService) {
                this.distanceMatrixService = new google.maps.DistanceMatrixService();
            }
            this.distanceMatrixService.getDistanceMatrix({
                origins: [
                    start
                ],
                destinations: [
                    end
                ],
                travelMode: google.maps.TravelMode.DRIVING
            }, function(result, status) {
                if (status == google.maps.DistanceMatrixStatus.OK) {
                    var elemento = result.rows[0].elements[0];
                    res({
                        distancia: elemento.distance.text,
                        duracion: elemento.duration.text,
                        minutos: segundos / 60
                    });
                } else {
                    res(null);
                }
            });
        }
    },
   calcularDistancia: function (pUnidades, pCliente, pUltimosClientes, res) {
        destinations = [new google.maps.LatLng(pCliente.lat, pCliente.lng)];
        origins = [];
        for (var i = 0; i < pUnidades.length; i++) {
            var pUnidad = pUnidades[i];
            var pUltimoCliente = pUltimosClientes[i];
            origins.push(new google.maps.LatLng(pUnidad.lat, pUnidad.lng));
            if (pUltimoCliente) {
                origins.push(new google.maps.LatLng(pUltimoCliente.lat, pUltimoCliente.lng));
            }
        }
        if (!this.distanceMatrixService) {
            this.distanceMatrixService = new google.maps.DistanceMatrixService();
        }
        this.distanceMatrixService.getDistanceMatrix({origins: origins, destinations: destinations, travelMode: google.maps.TravelMode.DRIVING}, function (result, status) {
            var retorno = null;
            if (status == google.maps.DistanceMatrixStatus.OK) {
                retorno = [];
                var j = 0;
                for (var i = 0; i < pUnidades.length; i++) {
                    retorno[i] = {};
                    var unidad = result.rows[j].elements[0];
                    if (unidad.status == google.maps.DistanceMatrixStatus.OK) {
                        retorno[i].distancia = unidad.distance.text;
                        retorno[i].minutos = unidad.duration.value / 60;
                        j++;
                    }
                    if (pUltimosClientes[i]) {
                        var ultimoCliente = result.rows[i].elements[0];
                        if (ultimoCliente.status == google.maps.DistanceMatrixStatus.OK) {
                            retorno[i].distanciaUltimoCliente = ultimoCliente.distance.text;
                            retorno[i].minutosUltimoCliente = ultimoCliente.duration.value / 60;
                        }
                        j++;
                    }
                }
            }
            res(retorno);
        });
    },
    deleteRutas: function () {
        if (this.directionsDisplay)
        {
            this.directionsDisplay.setMap(null);
            this.directionsDisplay = null;
        }
    },
   deletePolilineas: function () {
        for (var i = 0; i < this.polilineas.length; i++) {
            this.clearPolilinea(i);
        }
        this.polilineas = [];
    },
	clearPolilinea: function (indice) {
        if (this.polilineas[indice]) {
            this.polilineas[indice].setMap(null);
            this.polilineas[indice] = null;
        }
    },
    clearAll: function () {
        this.deletePoligono();
        this.deleteMarkers();
        this.deleteRutas();
        this.deletePolilineas();
        this.clearPoligonos();
		this.deleteCirculo();
        this.deleteRectangulo();
		this.clearCirculos();
    },
	clearCirculos: function () {
        for (var i = 0; i < this.circulos.length; i++) {
            this.circulos[i].setMap(null);
            this.circulos[i] = null;
        }
        this.circulos = [];
    },
    dibujarPolilinea: function (puntos) {
        var flightPlanCoordinates = [];
        for (var i = 0; i < puntos.length; i++) {
            flightPlanCoordinates.push(new google.maps.LatLng(puntos[i].lat, puntos[i].lng));
        }
        if (this.flightPath) {
            this.flightPath.setMap(null);
        }
        this.flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#F000F0',
            strokeOpacity: 0.5,
            strokeWeight: 2
        });
        this.flightPath.setMap(this.gmap);
    },
    addPoligono: function (poligono, color, visible, indice) {
        var markersPoligono = [];
        for (var j = 0; j < poligono.length; j++) {
            markersPoligono.push(new google.maps.LatLng(poligono[j].lat, poligono[j].lng));
        }
        var polygon = new google.maps.Polygon({
            path: markersPoligono,
            fillColor: color ? '#'+color : '#5882FA',
            fillOpacity: 0.5,
            strokeColor: '#000000',
            strokeOpacity: 0.8,
            strokeWeight: 1
        });
        if (visible) {
            polygon.setMap(this.gmap);
        }
        if (indice !== null || indice !== undefined) {
            this.poligonos[indice] = polygon;
        } else {
            this.poligonos.push(polygon);
        }
    },
    clearPoligonos: function () {
        for (var i = 0; i < this.poligonos.length; i++) {
            this.clearPoligono(i);
        }
        this.poligonos = [];
    },
    clearPoligono: function (indice) {
        if (this.poligonos[indice]) {
            this.poligonos[indice].setMap(null);
            this.poligonos[indice] = null;
        }
    },
    setOnClick: function (funcion) {
        google.maps.event.addListener(this.gmap, 'click', function (event) {
            var marker = {lat: event.latLng.lat(), lng: event.latLng.lng()};
            funcion(marker);
        });
    },
    drawingMa: function (map) {
		var me = this;
        this.drawingManager = new google.maps.drawing.DrawingManager({
            drawingControl: true,
			markerOptions: {
				icon: {
					 path: 'm -4.3504963,-21.974749 c 2.2023075,-6.858771 9.2728594,-10.575201 15.8797323,-8.369517 3.274463,1.117952 5.99835,3.565355 7.563159,6.768129 1.361943,2.809982 1.593757,5.831467 0.72442,8.550805 -2.17331,6.6170509 -6.375059,11.7233614 -10.8376211,17.1318201 L 7.7911187,3.5265859 7.6750686,3.6776679 7.5592794,3.5265859 C 2.5461643,-2.4257393 -1.5106908,-7.501835 -4.1186819,-13.786524 c -1.0721556,-2.538047 -1.1301268,-5.287599 -0.2318392,-8.188225 z',
                     fillColor: '#6E6D6D',
                     fillOpacity: 0.8,
                     anchor: {x:5, y:5}
					 }
			},
            drawingControlOptions: {
				position: google.maps.ControlPosition.LEFT_TOP,
                drawingModes: ['polygon', 'marker', 'rectangle']
            }});
        this.drawingManager.setMap(map);
        google.maps.event.addListener(this.drawingManager, 'overlaycomplete', function (event) {
			var over = event.overlay;
			var ventana;
            if(Ext.getCmp('vtn_nueva_zona')){
                ventana = Ext.getCmp('vtn_nueva_zona');
            }else if(Ext.getCmp('vtn_editar_zona')){
                ventana = Ext.getCmp('vtn_editar_zona');
            }                        
            if(event.type === 'marker'){
				me.deleteRectangulo();
				ventana.activarRadio(over);
			}else if (event.type === 'polygon'){
				me.deleteCirculo();
				me.deleteRectangulo();
				ventana.dibujarZona(over);
			}else if (event.type === 'rectangle'){
				me.deleteCirculo();
				ventana.dibujarRectangulo(over);
			}
			
		});
    },
    visualizarPoligonos: function (visualizar, fitBounds) {
        var retorno = false;
        if (this.poligonos && this.poligonos.length) {
            var mapa = null;
            if (visualizar) {
                mapa = this.gmap;
            }
            for (var i = 0; i < this.poligonos.length; i++) {
                if (this.poligonos[i]) {
                    this.poligonos[i].setMap(mapa);
                }
            }
            if (fitBounds)
                this.fitBounds();
            retorno = true;
        }
        return retorno;
    },
    visualizarMarkers: function (filtros, fitBounds, indice) {
        if (indice === undefined)
            indice = 0;
        var markers = this.markersAnimados[indice];
        if (markers && markers.length) {
            for (var i = 0; i < markers.length; i++) {
                if (filtros) {
                    var filtro = markers[i].id.split('|')[1].toUpperCase();
                    var encontrado = false;
                    for (var j = 0; j < filtros.length; j++) {
                        if (filtro === filtros[j]) {
                            encontrado = true;
                            break;
                        }
                    }
                    if (encontrado) {
                        markers[i].setMap(this.gmap);
                    } else {
                        markers[i].setMap(null);
                    }
                } else {
                    markers[i].setMap(this.gmap);
                }
            }
            if (fitBounds) {
                this.fitBounds();
            }
        }
    },
    visualizarMarkersTracking: function (filtros, fitBounds, indice, polilinea) {
        if (indice === undefined)
            indice = 0;
        var markers = this.markersAnimados[indice];
        var puntos = [];
        if (markers && markers.length) {
            for (var i = 0; i < markers.length; i++) {
                if (filtros) {
                    var filtro = parseInt(markers[i].id.substr(0, 2));
                    var encontrado = false;
                    for (var j = 0; j < filtros.length; j++) {
                        if (filtro === filtros[j]) {
                            encontrado = true;
                            break;
                        }
                    }
                    if (encontrado) {
                        markers[i].setMap(this.gmap);
                        puntos.push(markers[i]);
                    } else {
                        markers[i].setMap(null);
                        this.deletePolilinea();
                    }
                } else {
                    markers[i].setMap(this.gmap);
                }
            }
            if (polilinea) {
                this.dibujarPolilinea(puntos);
            }
            if (fitBounds) {
                this.fitBounds();
            }
        }
    },
    distanciaSeguimiento: function (pIni, pFin, res) {
        var start = new google.maps.LatLng(pIni.lat, pIni.lng);
        var end = new google.maps.LatLng(pFin.lat, pFin.lng);
        if (!this.distanceMatrixService) {
            this.distanceMatrixService = new google.maps.DistanceMatrixService();
        }
        this.distanceMatrixService.getDistanceMatrix({origins: [start], destinations: [end], travelMode: google.maps.TravelMode.DRIVING}, function (result, status) {
            if (status == google.maps.DistanceMatrixStatus.OK) {
                var elemento = result.rows[0].elements[0];
                res({distancia: elemento.distance.text, duracion: elemento.duration.text});
            } else {
                res(null);
            }
        });

    },
    paradas: function (indice, puntos, parada) {
        var bounds = new google.maps.LatLngBounds();
        var linea = [];
        var markerO = [];
        var quitar = [];
        var markerG = [];
        var markerAdd = [];
        var interno;
        var markers = this.markersAnimados[indice];
        if (parada) {
            if (markers && markers.length) {
                if (puntos && puntos.length > 0) {
                    for (var n = 0; n < puntos.length; n++) {
                        interno = puntos[n];
                        if (interno.length > 0) {
                            for (var k = 0; k < interno.length; k++) {
                                bounds.extend(new google.maps.LatLng(interno[k].lat, interno[k].lng));
                            }
                            markerG[n] = {lat: bounds.getCenter().lat(), lng: bounds.getCenter().lng()};
                        }
                        if (interno.length > 0) {
                            for (var i = 0; i < markers.length; i++) {
                                var filtro = markers[i].id;
                                var encontrado = false;
                                var insertar = true;
                                for (var f = 0; f < interno.length; f++) {
                                    if (filtro === interno[f].id) {
                                        encontrado = true;
                                        break;
                                    }
                                }
                                if (encontrado) {
                                    quitar.push(markers[i]);
                                } else {
                                    if (markerO.length === 0) {
                                        markerO.push(markers[i]);
                                    } else {
                                        for (var l = 0; l < markerO.length; l++) {
                                            var id1 = markerO[l].id;
                                            var id2 = markers[i].id;
                                            if (id1 === id2) {
                                                insertar = false;
                                                break;
                                            }
                                        }
                                        if (insertar) {
                                            markerO.push(markers[i]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (quitar.length > 0) {
                        var remove = false;
                        for (var s = 0; s < markerO.length; s++) {
                            for (var q = 0; q < quitar.length; q++) {
                                var ids1 = markerO[s].id;
                                var ids2 = quitar[q].id;
                                if (ids1 === ids2) {
                                    remove = true;
                                    break;
                                }
                            }
                            if (remove) {
                                markerAdd.push(markerO[s]);
                                linea.push(markerO[s]);
                            }
                        }
                        this.deletePolilinea();
                    }
                    if (markerAdd.length && linea) {
                        var tiempo;
                        var inicio = new Date();
                        var fin = new Date();
                        var id;
                        var marcador;
                        var marcadores = [];
                        for (var r = 0; r < puntos.length; r++) {
                            tiempo = puntos[r];
                            if (tiempo.length > 0) {
                                if (tiempo.length === 1) {
                                    id = tiempo[0].id;
                                } else {
                                    inicio.setHours(parseInt(tiempo[0].id.substr(0, 2)));
                                    inicio.setMinutes(parseInt(tiempo[0].id.substr(3, 2)));
                                    inicio.setSeconds(parseInt(tiempo[0].id.substr(6, 2)));
                                    fin.setHours(parseInt(tiempo[tiempo.length - 1].id.substr(0, 2)));
                                    fin.setMinutes(parseInt(tiempo[tiempo.length - 1].id.substr(3, 2)));
                                    fin.setSeconds(parseInt(tiempo[tiempo.length - 1].id.substr(6, 2)));
                                    var hours = Math.abs(inicio.getTime() - fin.getTime());
                                    id = new Date(hours).toString().substr(16, 9);
                                }
                                var center = markerG[r];
                                if (center) {
                                    marcador = {lat: center.lat, lng: center.lng, icon: {url: 'res/ico02.png', anchor: {x: 10, y: 10}}, id: id, infowindow: '<h4>' + id + '</h4>'};
                                    marcadores.push(marcador);
                                }
                            }
                        }
                        for (var m = 0; m < markerAdd.length; m++) {
                            marcador = {lat: markerAdd[m].lat, lng: markerAdd[m].lng, icon: markerAdd[m].icon, id: markerAdd[m].id, infowindow: markerAdd[m].id};
                            marcadores.push(marcador);
                        }
                        this.setMarkers(marcadores, 5);
                        var mar = this.markersAnimados[5];
                        for (var a = 0; a < mar.length; a++) {
                            linea.push(mar[a]);
                        }
                        if (linea.length >= 2) {
                            this.dibujarPolilinea(linea);
                        }
                    }
                }

                for (var d = 0; d < markers.length; d++) {
                    markers[d].setMap(null);
                }

            }
        } else {
            var mParada = this.markersAnimados[5];
            var dibujar = [];
            for (var j = 0; j < mParada.length; j++) {
                mParada[j].setMap(null);
                this.deletePolilinea();
            }
            for (var p = 0; p < markers.length; p++) {
                markers[p].setMap(this.gmap);
                dibujar.push({lat: markers[p].lat, lng: markers[p].lng});
            }
            if (dibujar.length >= 2) {
                this.dibujarPolilinea(dibujar);
            }

        }
    },
    filtrarMapaMarkers: function (horaMax, horaMin, indice) {
        var puntos = [];
        if (this.markersAnimados[indice].length) {
            var markers = this.markersAnimados[indice];
            for (i = 0; i < markers.length; i++) {
                var fechaRecord = parseInt(markers[i].id.substr(0, 3));
                if (fechaRecord <= horaMax && fechaRecord >= horaMin) {
                    this.markersAnimados[indice][i].setVisible(true);
                    puntos.push(markers[i]);
                } else {
                    this.markersAnimados[indice][i].setVisible(false);
                    this.deletePolilinea();
                }
            }
            this.dibujarPolilinea(puntos);
        }
    },
    saesOasmarkers: function (indice, visible) {
        if (this.markersAnimados[indice]) {
            if (this.markersAnimados[indice].length) {
                var markers = this.markersAnimados[indice];
                for (i = 0; i < markers.length; i++) {
                    this.markersAnimados[indice][i].setVisible(visible);
                }
            }
        }
    },
	crearCirculo: function (coordenadas) {
		if(this.circulo){
			this.circulo.setMap(null);
			this.circulo = null;	
		}
        this.circulo = new google.maps.Circle({
            strokeColor: coordenadas.color ? '#' + coordenadas.color : '#5882FA',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: coordenadas.color ? '#'+coordenadas.color : '#5882FA',
            fillOpacity: 0.35,
            map: this.gmap,
            center: new google.maps.LatLng(coordenadas.lat, coordenadas.lng),
            radius: coordenadas.radio
        });
    },
	 crearCirculos: function(coordenadas) {
        var circulo = new google.maps.Circle({
                strokeColor: coordenadas.color ? '#' + coordenadas.color : '#5882FA',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: coordenadas.color ? '#' + coordenadas.color : '#5882FA',
                fillOpacity: 0.35,
                map: this.gmap,
                center: new google.maps.LatLng(coordenadas.lat, coordenadas.lng),
                radius: coordenadas.radio
            });
		
        if (coordenadas.infowindow) {
            circulo.infowindow = new google.maps.InfoWindow({
                content: coordenadas.infowindow
            });
            if (!coordenadas.onClick) {
                var me=this;
				google.maps.event.addListener(circulo, 'click', function(ev) {
                    me.cerrarInfoWindowsCirculo();
                    circulo.infowindow.setPosition(ev.latLng);
                    circulo.infowindow.open(me.map, this);
                });
            }
        }
		this.circulos.push(circulo);
    },
	 cerrarInfoWindowsCirculo: function() {
         for (var j = 0; j < this.circulos.length; j++) {
                        if (this.circulos[j].infowindow) {
                            this.circulos[j].infowindow.close();
                        }
                    }
        
    },
	deleteCirculo: function () {
		if(this.circulo){
		this.circulo.setMap(null);
        this.circulo = null;	
		}
	},
	
	crearRectangulo: function (coordenadas){
		if(this.rectangle){
			this.rectangle.setMap(null);
			this.rectangle = null;	
		}
		this.rectangle = new google.maps.Rectangle({
          strokeColor: '#' + coordenadas.color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#' + coordenadas.color,
          fillOpacity: 0.35,
          map: this.gmap,
          bounds: {
            north: coordenadas.n,
            south: coordenadas.s,
            east: coordenadas.e,
            west: coordenadas.w
          }
        });
	},
	deleteRectangulo: function () {
		if(this.rectangle){
		this.rectangle.setMap(null);
        this.rectangle = null;	
		}
	},
	dibujarPolilineaAnimacion: function (puntos,inicioRuta,finRuta,idPolilinea,play,color) {
        var flightPlanCoordinates = [];
		puntos=puntos.slice(inicioRuta, finRuta);
        for (var i = 0; i < puntos.length; i++) {
            flightPlanCoordinates.push(new google.maps.LatLng(puntos[i].lat, puntos[i].lng));
        }

		var lineSymbol = {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                strokeColor: '#393'
                };
		var icon = [];
		if(play!==undefined){
			icon=[{icon: lineSymbol,offset: '100%'}];
		}
        var flightPath = new google.maps.Polyline({
            id:idPolilinea,
			path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.5,
			icons: icon,
            strokeWeight: 4
        });
        if (play !== undefined) {
            var count = 0;
            window.setInterval(function() {
                count = (count + 1);
                var icons = flightPath.get('icons');
				if(count <=100)
                icons[0].offset =  count+'%';
				else
				icons[0].offset =  '0%';
                flightPath.set('icons', icons);
            }, 2000);
        }
	  
	  flightPath.setMap(this.gmap);
	  this.polilineas.push(flightPath);
    }
});