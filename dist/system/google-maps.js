System.register(["aurelia-dependency-injection", "aurelia-templating", "aurelia-task-queue", "aurelia-binding", "aurelia-logging", "./configure", "./google-maps-api", "./marker-clustering", "./events"], function (exports_1, context_1) {
    "use strict";
    var __assign = (this && this.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var aurelia_dependency_injection_1, aurelia_templating_1, aurelia_task_queue_1, aurelia_binding_1, aurelia_logging_1, configure_1, google_maps_api_1, marker_clustering_1, events_1, logger, GoogleMaps;
    var __moduleName = context_1 && context_1.id;
    function dispatchEvent(name, detail, target, bubbles) {
        if (bubbles === void 0) { bubbles = true; }
        var changeEvent;
        if (window.CustomEvent) {
            changeEvent = new CustomEvent(name, { detail: detail, bubbles: bubbles });
        }
        else {
            changeEvent = document.createEvent('CustomEvent');
            changeEvent.initCustomEvent(name, bubbles, true, { data: detail });
        }
        target.dispatchEvent(changeEvent);
    }
    return {
        setters: [
            function (aurelia_dependency_injection_1_1) {
                aurelia_dependency_injection_1 = aurelia_dependency_injection_1_1;
            },
            function (aurelia_templating_1_1) {
                aurelia_templating_1 = aurelia_templating_1_1;
            },
            function (aurelia_task_queue_1_1) {
                aurelia_task_queue_1 = aurelia_task_queue_1_1;
            },
            function (aurelia_binding_1_1) {
                aurelia_binding_1 = aurelia_binding_1_1;
            },
            function (aurelia_logging_1_1) {
                aurelia_logging_1 = aurelia_logging_1_1;
            },
            function (configure_1_1) {
                configure_1 = configure_1_1;
            },
            function (google_maps_api_1_1) {
                google_maps_api_1 = google_maps_api_1_1;
            },
            function (marker_clustering_1_1) {
                marker_clustering_1 = marker_clustering_1_1;
            },
            function (events_1_1) {
                events_1 = events_1_1;
            }
        ],
        execute: function () {
            logger = aurelia_logging_1.getLogger('aurelia-google-maps');
            GoogleMaps = (function () {
                function GoogleMaps(element, taskQueue, config, bindingEngine, googleMapsApi, markerClustering) {
                    var _this_1 = this;
                    this._currentInfoWindow = null;
                    this.drawnMarkers = [];
                    this.drawnCircles = [];
                    this.longitude = 0;
                    this.latitude = 0;
                    this.circleRadius = 0;
                    this.zoom = 8;
                    this.disableDefaultUi = false;
                    this.markers = [];
                    this.autoUpdateBounds = false;
                    this.autoInfoWindow = true;
                    this.mapType = 'ROADMAP';
                    this.options = {};
                    this.drawEnabled = false;
                    this.drawMode = 'MARKER';
                    this.polygons = [];
                    this.drawSingleElement = false;
                    this.map = null;
                    this._renderedMarkers = [];
                    this._markersSubscription = null;
                    this._scriptPromise = null;
                    this._mapPromise = null;
                    this._mapResolve = null;
                    this.drawingManager = null;
                    this._renderedPolygons = [];
                    this._polygonsSubscription = null;
                    this.element = element;
                    this.taskQueue = taskQueue;
                    this.config = config;
                    this.bindingEngine = bindingEngine;
                    this.googleMapsApi = googleMapsApi;
                    this.markerClustering = markerClustering;
                    if (!config.get('apiScript')) {
                        logger.error('No API script is defined.');
                    }
                    if ((!config.get('apiKey') && config.get('apiKey') !== false) && (!config.get('client') && config.get('client') !== false)) {
                        logger.error('No API key or client ID has been specified.');
                    }
                    this.markerClustering.loadScript();
                    this._scriptPromise = this.googleMapsApi.getMapsInstance();
                    var self = this;
                    this._mapPromise = this._scriptPromise.then(function () {
                        return new Promise(function (resolve) {
                            self._mapResolve = resolve;
                        });
                    });
                    this.element.addEventListener(events_1.Events.START_MARKER_HIGHLIGHT, function (data) {
                        var marker = self._renderedMarkers[data.detail.index];
                        marker.setIcon(marker.custom.altIcon);
                        marker.setZIndex(window.google.maps.Marker.MAX_ZINDEX + 1);
                    });
                    this.element.addEventListener(events_1.Events.STOP_MARKER_HIGHLIGHT, function (data) {
                        var marker = self._renderedMarkers[data.detail.index];
                        marker.setIcon(marker.custom.defaultIcon);
                    });
                    this.element.addEventListener(events_1.Events.PAN_TO_MARKER, function (data) {
                        self.map.panTo(self._renderedMarkers[data.detail.index].position);
                        self.map.setZoom(17);
                    });
                    this.element.addEventListener(events_1.Events.CLEAR_MARKERS, function () {
                        _this_1.clearMarkers();
                    });
                }
                GoogleMaps.prototype.clearMarkers = function () {
                    if (!this._renderedMarkers) {
                        return;
                    }
                    this._renderedMarkers.forEach(function (marker) {
                        marker.setMap(null);
                    });
                    this._renderedMarkers = [];
                    if (this.markerClustering) {
                        this.markerClustering.clearMarkers();
                    }
                };
                GoogleMaps.prototype.attached = function () {
                    var _this_1 = this;
                    this.element.addEventListener('dragstart', function (evt) {
                        evt.preventDefault();
                    });
                    this.element.addEventListener('zoom_to_bounds', function () {
                        _this_1.zoomToMarkerBounds(true);
                    });
                    this._scriptPromise.then(function () {
                        var latLng = new window.google.maps.LatLng(parseFloat(_this_1.latitude), parseFloat(_this_1.longitude));
                        var mapTypeId = _this_1.getMapTypeId();
                        var options = Object.assign({}, _this_1.options, _this_1.config.get('options'), {
                            center: latLng,
                            zoom: parseInt(_this_1.zoom, 10),
                            disableDefaultUI: _this_1.disableDefaultUi,
                            mapTypeId: mapTypeId
                        });
                        _this_1.map = new window.google.maps.Map(_this_1.element, options);
                        if (_this_1.mapLoaded) {
                            _this_1.mapLoaded(_this_1.map);
                        }
                        _this_1._mapResolve();
                        _this_1.map.addListener('click', function (e) {
                            dispatchEvent(events_1.Events.MAPCLICK, e, _this_1.element);
                            if (!_this_1.autoInfoWindow)
                                return;
                            if (_this_1._currentInfoWindow) {
                                _this_1._currentInfoWindow.close();
                                dispatchEvent(events_1.Events.INFOWINDOWCLOSE, { infoWindow: _this_1._currentInfoWindow }, _this_1.element);
                            }
                        });
                        _this_1.map.addListener('dragend', function () {
                            _this_1.sendBoundsEvent();
                        });
                        _this_1.map.addListener('zoom_changed', function () {
                            _this_1.sendBoundsEvent();
                        });
                    });
                };
                GoogleMaps.prototype.sendBoundsEvent = function () {
                    var bounds = this.map.getBounds();
                    if (!bounds)
                        return;
                    dispatchEvent(events_1.Events.BOUNDSCHANGED, { bounds: bounds }, this.element);
                };
                GoogleMaps.prototype.renderMarker = function (marker) {
                    var _this_1 = this;
                    return this._mapPromise.then(function () {
                        var markerLatLng = new window.google.maps.LatLng(parseFloat(marker.latitude), parseFloat(marker.longitude));
                        _this_1.createMarker({
                            map: _this_1.map,
                            position: markerLatLng
                        }).then(function (createdMarker) {
                            createdMarker.addListener('click', function () {
                                dispatchEvent(events_1.Events.MARKERCLICK, { marker: marker, createdMarker: createdMarker }, _this_1.element);
                                if (!_this_1.autoInfoWindow)
                                    return;
                                if (_this_1._currentInfoWindow) {
                                    _this_1._currentInfoWindow.close();
                                }
                                if (!createdMarker.infoWindow) {
                                    _this_1._currentInfoWindow = null;
                                    return;
                                }
                                _this_1._currentInfoWindow = createdMarker.infoWindow;
                                createdMarker.infoWindow.open(_this_1.map, createdMarker);
                            });
                            createdMarker.addListener('mouseover', function () {
                                dispatchEvent(events_1.Events.MARKERMOUSEOVER, { marker: createdMarker }, _this_1.element);
                                createdMarker.setZIndex(window.google.maps.Marker.MAX_ZINDEX + 1);
                            });
                            createdMarker.addListener('mouseout', function () {
                                dispatchEvent(events_1.Events.MARKERMOUSEOUT, { marker: createdMarker }, _this_1.element);
                            });
                            createdMarker.addListener('dblclick', function () {
                                _this_1.map.setZoom(15);
                                _this_1.map.panTo(createdMarker.position);
                            });
                            if (marker.icon) {
                                createdMarker.setIcon(marker.icon);
                            }
                            if (marker.label) {
                                createdMarker.setLabel(marker.label);
                            }
                            if (marker.title) {
                                createdMarker.setTitle(marker.title);
                            }
                            if (marker.draggable) {
                                createdMarker.setDraggable(marker.draggable);
                            }
                            if (marker.infoWindow) {
                                createdMarker.infoWindow = new window.google.maps.InfoWindow({
                                    content: marker.infoWindow.content,
                                    pixelOffset: marker.infoWindow.pixelOffset,
                                    position: marker.infoWindow.position,
                                    maxWidth: marker.infoWindow.maxWidth,
                                    parentMarker: __assign({}, marker)
                                });
                                createdMarker.infoWindow.addListener('domready', function () {
                                    dispatchEvent(events_1.Events.INFOWINDOWSHOW, { infoWindow: createdMarker.infoWindow }, _this_1.element);
                                });
                                createdMarker.infoWindow.addListener('closeclick', function () {
                                    dispatchEvent(events_1.Events.INFOWINDOWCLOSE, { infoWindow: createdMarker.infoWindow }, _this_1.element);
                                });
                            }
                            if (marker.custom) {
                                createdMarker.custom = marker.custom;
                            }
                            _this_1._renderedMarkers.push(createdMarker);
                            dispatchEvent(events_1.Events.MARKERRENDERED, { createdMarker: createdMarker, marker: marker }, _this_1.element);
                        });
                    });
                };
                GoogleMaps.prototype.setOptions = function (options) {
                    if (!this.map) {
                        return;
                    }
                    this.map.setOptions(options);
                };
                GoogleMaps.prototype.createMarker = function (options) {
                    return this._scriptPromise.then(function () {
                        return Promise.resolve(new window.google.maps.Marker(options));
                    });
                };
                GoogleMaps.prototype.getCenter = function () {
                    var _this_1 = this;
                    this._mapPromise.then(function () {
                        return Promise.resolve(_this_1.map.getCenter());
                    });
                };
                GoogleMaps.prototype.setCenter = function (latLong) {
                    var _this_1 = this;
                    this._mapPromise.then(function () {
                        _this_1.map.setCenter(latLong);
                        _this_1.sendBoundsEvent();
                    });
                };
                GoogleMaps.prototype.updateCenter = function () {
                    var _this_1 = this;
                    this._mapPromise.then(function () {
                        var lat = parseFloat(_this_1.latitude);
                        var lng = parseFloat(_this_1.longitude);
                        if (lat && lng) {
                            var latLng = new window.google.maps.LatLng(lat, lng);
                            _this_1.setCenter(latLng);
                        }
                    });
                };
                GoogleMaps.prototype.latitudeChanged = function () {
                    var _this_1 = this;
                    this._mapPromise.then(function () {
                        _this_1.taskQueue.queueMicroTask(function () {
                            _this_1.updateCenter();
                        });
                    });
                };
                GoogleMaps.prototype.longitudeChanged = function () {
                    var _this_1 = this;
                    this._mapPromise.then(function () {
                        _this_1.taskQueue.queueMicroTask(function () {
                            _this_1.updateCenter();
                        });
                    });
                };
                GoogleMaps.prototype.zoomChanged = function (newValue) {
                    var _this_1 = this;
                    this._mapPromise.then(function () {
                        _this_1.taskQueue.queueMicroTask(function () {
                            var zoomValue = parseInt(newValue, 10);
                            _this_1.map.setZoom(zoomValue);
                        });
                    });
                };
                GoogleMaps.prototype.circleRadiusChanged = function () {
                    if (this.drawSingleElement) {
                        this.clearDrawnCircles();
                    }
                };
                GoogleMaps.prototype.markersChanged = function (newValue) {
                    var _this_1 = this;
                    if (this.drawSingleElement) {
                        this.clearDrawnMarkers();
                        this.clearDrawnCircles();
                        if (this.circleRadius) {
                            for (var _i = 0, newValue_1 = newValue; _i < newValue_1.length; _i++) {
                                var newMarker = newValue_1[_i];
                                var circle = new window.google.maps.Circle({
                                    map: this.map,
                                    center: { lat: parseFloat(newMarker.latitude.toString()), lng: parseFloat(newMarker.longitude.toString()) },
                                    radius: parseFloat(this.circleRadius.toString())
                                });
                                this.drawnCircles.push(circle);
                            }
                        }
                        if (newValue.length == 0) {
                            this.clearDrawnCircles();
                        }
                    }
                    if (this._markersSubscription !== null) {
                        this._markersSubscription.dispose();
                        for (var _a = 0, _b = this._renderedMarkers; _a < _b.length; _a++) {
                            var marker = _b[_a];
                            marker.setMap(null);
                        }
                        this._renderedMarkers = [];
                    }
                    this._markersSubscription = this.bindingEngine
                        .collectionObserver(this.markers)
                        .subscribe(function (splices) { _this_1.markerCollectionChange(splices); });
                    if (!newValue.length)
                        return;
                    var markerPromises = [];
                    this._mapPromise.then(function () {
                        markerPromises = newValue.map(function (marker) {
                            return _this_1.renderMarker(marker);
                        });
                        return markerPromises;
                    }).then(function (p) {
                        Promise.all(p).then(function () {
                            _this_1.taskQueue.queueTask(function () {
                                _this_1.markerClustering.renderClusters(_this_1.map, _this_1._renderedMarkers);
                                _this_1.zoomToMarkerBounds();
                            });
                        });
                    });
                };
                GoogleMaps.prototype.markerCollectionChange = function (splices) {
                    var _this_1 = this;
                    if (!splices.length) {
                        return;
                    }
                    var renderPromises = [];
                    for (var _i = 0, splices_1 = splices; _i < splices_1.length; _i++) {
                        var splice = splices_1[_i];
                        if (splice.removed.length) {
                            for (var _a = 0, _b = splice.removed; _a < _b.length; _a++) {
                                var removedObj = _b[_a];
                                for (var markerIndex in this._renderedMarkers) {
                                    if (!this._renderedMarkers.hasOwnProperty(markerIndex)) {
                                        continue;
                                    }
                                    var renderedMarker = this._renderedMarkers[markerIndex];
                                    if (renderedMarker.position.lat().toFixed(12) !== removedObj.latitude.toFixed(12) ||
                                        renderedMarker.position.lng().toFixed(12) !== removedObj.longitude.toFixed(12)) {
                                        continue;
                                    }
                                    renderedMarker.setMap(null);
                                    this._renderedMarkers.splice(markerIndex, 1);
                                    break;
                                }
                            }
                        }
                        if (splice.addedCount) {
                            var addedMarkers = this.markers.slice(splice.index, splice.index + splice.addedCount);
                            for (var _c = 0, addedMarkers_1 = addedMarkers; _c < addedMarkers_1.length; _c++) {
                                var addedMarker = addedMarkers_1[_c];
                                renderPromises.push(this.renderMarker(addedMarker));
                            }
                        }
                    }
                    Promise.all(renderPromises).then(function () {
                        _this_1.markerClustering.renderClusters(_this_1.map, _this_1._renderedMarkers);
                        _this_1.taskQueue.queueTask(function () {
                            _this_1.zoomToMarkerBounds();
                        });
                    });
                };
                GoogleMaps.prototype.zoomToMarkerBounds = function (force) {
                    var _this_1 = this;
                    if (force === void 0) { force = false; }
                    if (typeof force === 'undefined') {
                        force = false;
                    }
                    if (!force && (!this._renderedMarkers || !this.autoUpdateBounds)) {
                        return;
                    }
                    this._mapPromise.then(function () {
                        var bounds = new window.google.maps.LatLngBounds();
                        for (var _i = 0, _a = _this_1._renderedMarkers; _i < _a.length; _i++) {
                            var marker = _a[_i];
                            var lat = parseFloat(marker.position.lat());
                            var lng = parseFloat(marker.position.lng());
                            if (isNaN(lat) || isNaN(lng)) {
                                console.warn("Marker returned NaN for lat/lng", { marker: marker, lat: lat, lng: lng });
                                return;
                            }
                            var markerLatLng = new window.google.maps.LatLng(parseFloat(marker.position.lat()), parseFloat(marker.position.lng()));
                            bounds.extend(markerLatLng);
                        }
                        for (var _b = 0, _c = _this_1._renderedPolygons; _b < _c.length; _b++) {
                            var polygon = _c[_b];
                            polygon.getPath().forEach(function (element) {
                                bounds.extend(element);
                            });
                        }
                        _this_1.map.fitBounds(bounds);
                    });
                };
                GoogleMaps.prototype.getMapTypeId = function () {
                    if (this.mapType.toUpperCase() === 'HYBRID') {
                        return window.google.maps.MapTypeId.HYBRID;
                    }
                    else if (this.mapType.toUpperCase() === 'SATELLITE') {
                        return window.google.maps.MapTypeId.SATELLITE;
                    }
                    else if (this.mapType.toUpperCase() === 'TERRAIN') {
                        return window.google.maps.MapTypeId.TERRAIN;
                    }
                    return window.google.maps.MapTypeId.ROADMAP;
                };
                GoogleMaps.prototype.initDrawingManager = function (options) {
                    var _this_1 = this;
                    if (options === void 0) { options = {}; }
                    return this._mapPromise.then(function () {
                        if (_this_1.drawingManager)
                            return Promise.resolve();
                        var config = Object.assign({}, {
                            drawingMode: _this_1.getOverlayType(_this_1.drawMode),
                            drawingControl: _this_1.drawingControl,
                            drawingControlOptions: _this_1.drawingControlOptions
                        }, options);
                        _this_1.drawingManager = new window.google.maps.drawing.DrawingManager(config);
                        _this_1.drawingManager.addListener('overlaycomplete', function (evt) {
                            if (evt.type.toUpperCase() == 'POLYGON' || evt.type.toUpperCase() == 'POLYLINE') {
                                Object.assign(evt, {
                                    path: evt.overlay.getPath().getArray().map(function (x) { return { latitude: x.lat(), longitude: x.lng() }; }),
                                    encode: _this_1.encodePath(evt.overlay.getPath())
                                });
                            }
                            dispatchEvent(events_1.Events.MAPOVERLAYCOMPLETE, evt, _this_1.element);
                        });
                        if (_this_1.drawSingleElement) {
                            var _this = _this_1;
                            _this_1.drawingManager.addListener('markercomplete', function (marker) {
                                _this.drawnMarkers.push(marker);
                            });
                            _this_1.drawingManager.addListener('circlecomplete', function (circle) {
                                _this.drawnCircles.push(circle);
                            });
                        }
                        return Promise.resolve();
                    });
                };
                GoogleMaps.prototype.destroyDrawingManager = function () {
                    if (!this.drawingManager)
                        return;
                    this.drawingManager.setMap(null);
                    this.drawingManager = null;
                };
                GoogleMaps.prototype.getOverlayType = function (type) {
                    if (type === void 0) { type = ''; }
                    switch (type.toUpperCase()) {
                        case 'POLYGON':
                            return window.google.maps.drawing.OverlayType.POLYGON;
                        case 'POLYLINE':
                            return window.google.maps.drawing.OverlayType.POLYLINE;
                        case 'RECTANGLE':
                            return window.google.maps.drawing.OverlayType.RECTANGLE;
                        case 'CIRCLE':
                            return window.google.maps.drawing.OverlayType.CIRCLE;
                        case 'MARKER':
                            return window.google.maps.drawing.OverlayType.MARKER;
                        default:
                            return null;
                    }
                };
                GoogleMaps.prototype.drawEnabledChanged = function (newval, oldval) {
                    var _this_1 = this;
                    this.initDrawingManager()
                        .then(function () {
                        if (newval && !oldval) {
                            _this_1.drawingManager.setMap(_this_1.map);
                        }
                        else if (oldval && !newval) {
                            _this_1.destroyDrawingManager();
                        }
                    });
                };
                GoogleMaps.prototype.drawModeChanged = function (newval) {
                    var _this_1 = this;
                    if (newval === void 0) { newval = ''; }
                    this.initDrawingManager()
                        .then(function () {
                        _this_1.drawingManager.setOptions({
                            drawingMode: _this_1.getOverlayType(newval)
                        });
                    });
                };
                GoogleMaps.prototype.encodePath = function (path) {
                    if (path === void 0) { path = []; }
                    return window.google.maps.geometry.encoding.encodePath(path);
                };
                GoogleMaps.prototype.decodePath = function (polyline) {
                    return window.google.maps.geometry.encoding.decodePath(polyline);
                };
                GoogleMaps.prototype.renderPolygon = function (polygonObject) {
                    var _this_1 = this;
                    if (polygonObject === void 0) { polygonObject = []; }
                    var paths = polygonObject.paths;
                    if (!paths)
                        return;
                    if (Array.isArray(paths)) {
                        paths = paths.map(function (x) {
                            return new window.google.maps.LatLng(x.latitude, x.longitude);
                        });
                    }
                    var polygon = new window.google.maps.Polygon(Object.assign({}, polygonObject, { paths: paths }));
                    polygon.addListener('click', function () {
                        dispatchEvent(events_1.Events.POLYGONCLICK, { polygon: polygon }, _this_1.element);
                    });
                    polygon.setMap(this.map);
                    if (polygonObject.infoWindow) {
                        polygon.infoWindow = new window.google.maps.InfoWindow({
                            content: polygonObject.infoWindow.content,
                            pixelOffset: polygonObject.infoWindow.pixelOffset,
                            position: polygonObject.infoWindow.position,
                            maxWidth: polygonObject.infoWindow.maxWidth,
                            parentPolygon: __assign({}, polygonObject)
                        });
                    }
                    dispatchEvent(events_1.Events.POLYGONRENDERED, { polygon: polygon, polygonObject: polygonObject }, this.element);
                    this._renderedPolygons.push(polygon);
                };
                GoogleMaps.prototype.polygonsChanged = function (newValue) {
                    var _this_1 = this;
                    if (this._polygonsSubscription !== null) {
                        this._polygonsSubscription.dispose();
                        for (var _i = 0, _a = this._renderedPolygons; _i < _a.length; _i++) {
                            var polygon = _a[_i];
                            polygon.setMap(null);
                        }
                        this._renderedPolygons = [];
                    }
                    this._polygonsSubscription = this.bindingEngine
                        .collectionObserver(this.polygons)
                        .subscribe(function (splices) { _this_1.polygonCollectionChange(splices); });
                    if (!newValue.length)
                        return;
                    this._mapPromise.then(function () {
                        Promise.all(newValue.map(function (polygon) {
                            if (typeof polygon === 'string') {
                                return _this_1.decodePath(polygon);
                            }
                            return polygon;
                        })).then(function (polygons) {
                            return Promise.all(polygons.map(_this_1.renderPolygon.bind(_this_1)));
                        }).then(function () {
                            _this_1.taskQueue.queueTask(function () {
                                _this_1.zoomToMarkerBounds();
                            });
                        });
                    });
                };
                GoogleMaps.prototype.polygonCollectionChange = function (splices) {
                    var _this_1 = this;
                    if (!splices.length) {
                        return;
                    }
                    this._mapPromise.then(function () {
                        for (var _i = 0, splices_2 = splices; _i < splices_2.length; _i++) {
                            var splice = splices_2[_i];
                            if (splice.removed.length) {
                                for (var _a = 0, _b = splice.removed; _a < _b.length; _a++) {
                                    var removedObj = _b[_a];
                                    for (var polygonIndex in _this_1._renderedPolygons) {
                                        if (!_this_1._renderedPolygons.hasOwnProperty(polygonIndex)) {
                                            continue;
                                        }
                                        var renderedPolygon = _this_1._renderedPolygons[polygonIndex];
                                        var strRendered = void 0, strRemoved = void 0;
                                        strRendered = _this_1.encodePath(renderedPolygon.getPath());
                                        var removedPaths = removedObj.paths.map(function (x) {
                                            return new window.google.maps.LatLng(x.latitude, x.longitude);
                                        });
                                        strRemoved = _this_1.encodePath(removedPaths);
                                        if (strRendered !== strRemoved) {
                                            continue;
                                        }
                                        renderedPolygon.setMap(null);
                                        _this_1._renderedPolygons.splice(polygonIndex, 1);
                                        break;
                                    }
                                }
                            }
                            if (splice.addedCount) {
                                var addedPolygons = _this_1.polygons.slice(splice.index, splice.index + splice.addedCount);
                                for (var _c = 0, addedPolygons_1 = addedPolygons; _c < addedPolygons_1.length; _c++) {
                                    var addedPolygon = addedPolygons_1[_c];
                                    _this_1.renderPolygon(addedPolygon);
                                }
                            }
                        }
                    }).then(function () {
                        _this_1.taskQueue.queueTask(function () {
                            _this_1.zoomToMarkerBounds();
                        });
                    });
                };
                GoogleMaps.prototype.clearDrawnCircles = function () {
                    for (var _i = 0, _a = this.drawnCircles; _i < _a.length; _i++) {
                        var circle = _a[_i];
                        circle.setMap(null);
                    }
                    this.drawnCircles = [];
                };
                GoogleMaps.prototype.clearDrawnMarkers = function () {
                    for (var _i = 0, _a = this.drawnMarkers; _i < _a.length; _i++) {
                        var marker = _a[_i];
                        marker.setMap(null);
                    }
                    this.drawnMarkers = [];
                };
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Number)
                ], GoogleMaps.prototype, "longitude", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Number)
                ], GoogleMaps.prototype, "latitude", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Number)
                ], GoogleMaps.prototype, "circleRadius", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Number)
                ], GoogleMaps.prototype, "zoom", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Boolean)
                ], GoogleMaps.prototype, "disableDefaultUi", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "markers", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Boolean)
                ], GoogleMaps.prototype, "autoUpdateBounds", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Boolean)
                ], GoogleMaps.prototype, "autoInfoWindow", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "mapType", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "options", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "mapLoaded", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Boolean)
                ], GoogleMaps.prototype, "drawEnabled", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "drawMode", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "polygons", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Boolean)
                ], GoogleMaps.prototype, "drawingControl", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Object)
                ], GoogleMaps.prototype, "drawingControlOptions", void 0);
                __decorate([
                    aurelia_templating_1.bindable,
                    __metadata("design:type", Boolean)
                ], GoogleMaps.prototype, "drawSingleElement", void 0);
                GoogleMaps = __decorate([
                    aurelia_templating_1.noView(),
                    aurelia_templating_1.customElement('google-map'),
                    aurelia_dependency_injection_1.inject(Element, aurelia_task_queue_1.TaskQueue, configure_1.Configure, aurelia_binding_1.BindingEngine, google_maps_api_1.GoogleMapsAPI, marker_clustering_1.MarkerClustering),
                    __metadata("design:paramtypes", [Element,
                        aurelia_task_queue_1.TaskQueue,
                        configure_1.Configure,
                        aurelia_binding_1.BindingEngine,
                        google_maps_api_1.GoogleMapsAPI,
                        marker_clustering_1.MarkerClustering])
                ], GoogleMaps);
                return GoogleMaps;
            }());
            exports_1("GoogleMaps", GoogleMaps);
        }
    };
});
//# sourceMappingURL=google-maps.js.map