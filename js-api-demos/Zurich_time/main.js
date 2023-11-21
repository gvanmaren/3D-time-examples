require(
	[
		"esri/config",
		"esri/portal/Portal",
		"esri/Map",
		"esri/WebScene",
		"esri/views/SceneView",
		"esri/layers/FeatureLayer",
		"esri/layers/StreamLayer",
		"esri/renderers/DictionaryRenderer",
		"esri/widgets/Expand",
		"esri/widgets/BasemapGallery",
		"esri/widgets/LayerList",
		"esri/widgets/CoordinateConversion",
		"esri/widgets/Fullscreen",
		"esri/widgets/Feature",
		"esri/layers/support/FeatureEffect",
		"esri/layers/support/FeatureFilter"
	], function(
		esriConfig,
		Portal,
		Map,
		WebScene,
		SceneView,
		FeatureLayer,
		StreamLayer,
		DictionaryRenderer,
		Expand,
		BasemapGallery,
		LayerList,
		CoordinateConversion,
		Fullscreen,
		Feature,
		FeatureEffect,
		FeatureFilter
	) 
{ 
	var streamLayerView;
	
//	var map = new Map({
//		ground: "world-topobathymetry",
//		basemap: "topo-vector"
//	});

	// Load a webscene
	var map = new WebScene({
		portalItem: {
			id: "ed2e13b677314c19be6f809c255190d2"
		}
	});
			
	var sceneView = new SceneView({
		container: "viewDiv",
			map: map,
			qualityProfile: "high",
			environment: {
				lighting: {
					directShadowsEnabled: true
				},
				atmosphere: {
					quality: "high"
				},
				weather: {
					type: "cloudy",
					cloudCover: 0.3
				}
			},
		camera: {
			"position": {
				"spatialReference": {
					"latestWkid": 3857,
					"wkid": 102100
				},
				"x": 951458.7774535536,
				"y": 6000641.114101815,
				"z": 599.085888964124
			},
			"heading": 326.2028908849943,
			"tilt": 81.10156507107939
		},
		highlightOptions: {
			color: [255, 255, 255, 0.25],
			haloColor: [255,0,0,1],
			//fillOpacity: 0.75,
			haloOpacity: 0.55
		}
	});
		

	// configure the Zurich parking stream
	Zurich_parking_StreamLayer = new StreamLayer({
		url: "https://us-iot.arcgis.com/bc1qjuyagnrebxvh/bc1qjuyagnrebxvh/streams/arcgis/rest/services/Zurich_parking/StreamServer",
		title: "Zurich - parking availability", 
		outFields: ["*"],
		elevationInfo: {
			mode: "relative-to-ground",  // if the data doesn't have a Z-value and `relative-to-ground` is used for placement, a leader line is applied
			offset: 20
		},
		"renderer": {
			"authoringInfo": {
				"visualVariables": [
					{
						"maxSliderValue": 22,
						"minSliderValue": 0,
						"theme": "high-to-low",
						"type": "colorInfo"
					}
				]
			},
			"type": "classBreaks",
			"visualVariables": [
				{
					"type": "colorInfo",
					"field": "available",
					"stops": [
						{
							"color": [
								255,
								43,
								24,
								255
							],
							"value": 0
						},
						{
							"color": [
								245,
								201,
								38,
								255
							],
							"value": 4
						},
						{
							"color": [
								125,
								253,
								148,
								255
							],
							"value": 8.1
						},
						{
							"color": [
								28,
								194,
								253,
								255
							],
							"value": 12
						},
						{
							"color": [
								88,
								19,
								252,
								255
							],
							"value": 16
						}
					]
				}
			],
			"classBreakInfos": [
				{
					"classMaxValue": 9007199254740991,
					"symbol": {
						"type": "esriSMS",
						"color": [
							170,
							170,
							170,
							255
						],
						"angle": 0,
						"xoffset": 0,
						"yoffset": 0,
						"size": 15,
						"style": "esriSMSCircle",
						"outline": {
							"type": "esriSLS",
							"color": [
								153,
								153,
								153,
								64
							],
							"width": 0.375,
							"style": "esriSLSSolid"
						}
					}
				}
			],
			"field": "available",
			"minValue": -9007199254740991
		}
	});

	// add the stream layers to the map
	map.add(Zurich_parking_StreamLayer);

	// this is a widget that calls rotateView to spin the scene on an axis
	var spinning = false;
		
	function rotateView(angle) {
		if ( angle < 360 && spinning ) {
			sceneView.goTo(
				{
					position: {
						x: -71.018712-((Math.sin((angle/180)*Math.PI))/5),
						y: 42.353452+((1-Math.cos((angle/180)*Math.PI))/5),
						z: 1000,
						spatialReference: {
							wkid: 4326
						}
					},
					heading: angle,
					tilt: 75
				},
				{
					speedFactor: 0.2,
					easing: "linear"
				}
			);
				window.setTimeout(function() {
				rotateView((angle+5) % 360);
				}, 2000);
		}
	}	
		
	// configure the scene view and add tools
	sceneView
		.when(function() {
			sceneView.ui.add("controlDiv", "top-left");	// scene view
			sceneView.ui.add(new Fullscreen({
				view: sceneView
			}), "top-left");
			sceneView.ui.add(new Expand({				// Coordinate Conversion
				view: sceneView,
				content: new CoordinateConversion({
					view: sceneView
				}),
				expandIconClass: "esri-icon-applications",
				expandTooltip: "Coordinate Converter"
			}), "top-left");
			sceneView.ui.add(new Expand({				// Basemap Gallery
				view: sceneView,
				content: new BasemapGallery({
					view: sceneView
				}),
				expandTooltip: "Basemap Gallery"
			}), "top-left");
			sceneView.ui.add(new Expand({				// Layer List
				view: sceneView,
				content: new LayerList({
					view: sceneView
				}),
				expandTooltip: "Layer List"
			}), "top-left");
		}
	);
		
	document.getElementById("spin-btn").addEventListener("click", function() {
		switch(spinning) {
			case false:
				spinning = true;
				rotateView(sceneView.camera.heading);
				break;
			case true:
				spinning = false;
				break;
		}
	});
		
	// show connection status to the land units stream service
	sceneView.ui.add(connectionStatus, "top-right");
	connectionStatus.style.display = "inline-flex";

	sceneView.whenLayerView(Zurich_parking_StreamLayer).then(function(layerView) {
		streamLayerView = layerView;

		if (layerView.connectionStatus === "connected") {
			processConnect();
		}

		layerView.watch("connectionStatus", function(value) {
			if (value === "connected") {
				processConnect();
			} else {
				processDisconnect();
			}
		});
		
		const highlightQuery = Zurich_parking_StreamLayer.createQuery();
	});
});


function processConnect() {
		connectionStatus.style.backgroundColor = "#ffffff";
		connectionStatus.innerHTML = "connected";
}

function processDisconnect() {
		connectionStatus.style.backgroundColor = "orange";
		connectionStatus.innerHTML = "reconnecting";
}	
