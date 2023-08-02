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
		"esri/layers/support/FeatureFilter",
		"esri/identity/IdentityManager",
    "esri/identity/OAuthInfo"
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
		FeatureFilter,
		IdentityManager,
		OAuthInfo
	) 
{ 
	var streamLayerView;


	const pathname = document.location.pathname;
	const directory = pathname.substring(0, pathname.lastIndexOf('/'));
	const popupCallbackUrl = `${document.location.origin}${directory}/oauth-callback-api.html`;

	IdentityManager.registerOAuthInfos([
		new OAuthInfo({
			portalUrl: "https://velocityqaperf.mapsqa.arcgis.com/",
			appId: "EtoYFfpj5yjOMYyY",
			popup: true,
			popupCallbackUrl,
		}),
	]);
	
	window.setOAuthResponseHash = (responseHash) => {
		IdentityManager.setOAuthResponseHash(responseHash);
	};

//	var map = new Map({
//		ground: "world-topobathymetry",
//		basemap: "topo-vector"
//	});

	// Load a webscene
	var map = new WebScene({
		portalItem: {
			id: "2f67306fd2b646bba4e431155ce4482c"
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
			position: {
				x: -71.018712,
				y: 42.353452,
				z: 1000
			},
			heading: 270,
			tilt: 75
		},
		highlightOptions: {
			color: [255, 255, 255, 0.25],
			haloColor: [255,0,0,1],
			//fillOpacity: 0.75,
			haloOpacity: 0.55
		}
	});
		
	// setup dictionary renderer for land units based on 2525c style
	dictRenderer2525C = new DictionaryRenderer({
		url: "https://www.arcgis.com/sharing/rest/content/items/64d5c3d58a924cd98587fd80f9ec4ef1", //2525c
		fieldMap: {   //only map the symbol ID, speed and unique designation
			sidc: "sidc_2525c",
			speed: "Speed",
			uniquedesignation: "uniquedesignation"
		},
		config: {  
				frame: "ON",
				fill: "ON",
				icon: "ON",
				text: "ON",
				colors: "LIGHT",
				condition:  "PRIMARY",
				amplifiers: "ON"
		}
    });

	// setup dictionary renderer for CoT (cursor on target) events based on 2525c style
	// this is similar to the renderer configured for land units, with a few small differences
	dictRenderer2525C_cot = new DictionaryRenderer({
		url: "https://www.arcgis.com/sharing/rest/content/items/64d5c3d58a924cd98587fd80f9ec4ef1", //2525c
		scaleExpression:"0.8",	//scale the symbols to be a little smaller than land units
		fieldMap: {				//the only field that needs to be mapped is the symbol ID code
			sidc: "sidc_2525c"
		},
		config: {
			frame: "ON",
			fill: "ON",
			icon: "ON",
			text: "ON",
			colors: "LIGHT",
			condition:  "PRIMARY",
			amplifiers: "ON"
		}
    });

	// setup dictionary renderer for air tracks, based on 2525c style
	// also similar to the renderer configured for land units, but with a few small differences
	dictRenderer2525C_air = new DictionaryRenderer({
		url: "https://www.arcgis.com/sharing/rest/content/items/64d5c3d58a924cd98587fd80f9ec4ef1", //2525c
		scaleExpression:"1.25",	// set a scale expression so it appears a little larger than land units
		fieldMap: {				// only need to map the symbol ID code, speed and unique designation
			sidc: "sidc",
			speed: "Speed",
			uniquedesignation: "uniquedesignation"
		},
		config: {
			frame: "ON",
			fill: "ON",
			icon: "ON",
			text: "ON",
			colors: "LIGHT",
			condition:  "PRIMARY",
			amplifiers: "ON"
		}
    });

	// setup the popup template to only display a few of the attributes
	var popupTemplateHostileUnits = {
		title: "Hostile Land Units: {uniquedesignation}",
		content: [
			{
				type: "fields",
				fieldInfos: [
					{
						fieldName: "owningunit",
						label: "Higher Formation"
					},						
					{
						fieldName: "staffcomment",
						label: "Staff Commment"
					},						
					{
						fieldName: "speed",
						label: "Speed"
					},						
					{
						fieldName: "status911",
						label: "Alert"
					},		
					{
						fieldName: "sidc_2525c",
						label: "SIDC"
					}
				]
			}
		]
	};

	// setup the popup template for air tracks
	var popupTemplateAirUnits = {
		title: "Friendly Air Units: {uniquedesignation}",
		content: [
			{
				type: "fields",
				fieldInfos: [
					{
						fieldName: "owningunit",
						label: "Higher Formation"
					},						
					{
						fieldName: "speed",
						label: "Speed"
					},						
					{
						fieldName: "sidc",
						label: "SIDC"
					}
				]
			}
		]
	};

	// configure the Land Units stream layer i nBoston
	Boston_hostileLandStreamLayer = new StreamLayer({
		url: "https://us-iotqa.arcgis.com/qausa2verify/xfjp7xjnunpc0rzs/streams/arcgis/rest/services/BENM_tracks/StreamServer",
//		url: "https://us-iotqa.arcgis.com/qausa2verify/xfjp7xjnunpc0rzs/streams/arcgis/rest/services/BNM_tracks/StreamServer",
		title: "Hostile Land Tracks in Boston", 
		outFields: ["*"],
		elevationInfo: {
			mode: "absolute-height",  // if the data doesn't have a Z-value and `relative-to-ground` is used for placement, a leader line is applied
			offset: 2
		},
		popupTemplate: popupTemplateHostileUnits,
		renderer: dictRenderer2525C
	});

	// add the stream layers to the map
	map.add(Boston_hostileLandStreamLayer);

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
		
	// this is a function called by the Options tool to change configuration settings for the dictionary renderer
	function adjustRenderer() {
		var adjustedDictionaryRenderer;
		adjustedDictionaryRenderer = dictRenderer2525C.clone();
		with(adjustedDictionaryRenderer.config) {
			frame = document.getElementById("sym-frame").value;
			fill = document.getElementById("sym-fill").value;
			icon = document.getElementById("sym-icon").value;
			text = document.getElementById("sym-text").value;
			colors = document.getElementById("sym-colors").value;
			condition = document.getElementById("sym-condition").value;
			amplifiers = document.getElementById("sym-amplifiers").value;
		}
		Boston_hostileLandStreamLayer.renderer = adjustedDictionaryRenderer; //we only do this for the land units, to show the difference
		//friendlyAirStreamLayer.renderer = adjustedDictionaryRenderer;
		//cotStreamLayer.renderer = adjustedDictionaryRenderer;
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
			sceneView.ui.add(new Expand({				// Dictionary Renderer symbology configuration options
				view: sceneView,
				content: options,
				expandIconClass: "esri-icon-settings",
				expandTooltip: "Options"
			}), "bottom-left");
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

	sceneView.whenLayerView(Boston_hostileLandStreamLayer).then(function(layerView) {
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
		
		const highlightQuery = Boston_hostileLandStreamLayer.createQuery();

		// monitor the land units stream for a status911 change to highlight any alerted units
		streamLayerView.on("data-received", (event) => {
			if (event.attributes["status911"] === 1) {
				console.log("Alert: " + event.attributes["uniquedesignation"]);

			}
		});

		
	});
			 
		
	document.getElementById("sym-frame").addEventListener("change", function() {
		adjustRenderer();
	});
	
	document.getElementById("sym-fill").addEventListener("change", function() {
		adjustRenderer();
	});
	
	document.getElementById("sym-icon").addEventListener("change", function() {
		adjustRenderer();
	});
	
	document.getElementById("sym-text").addEventListener("change", function() {
		adjustRenderer();
	});
	
	document.getElementById("sym-colors").addEventListener("change", function() {
		adjustRenderer();
	});
	
	document.getElementById("sym-condition").addEventListener("change", function() {
		adjustRenderer();
	});
	
	document.getElementById("sym-amplifiers").addEventListener("change", function() {
		adjustRenderer();
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
