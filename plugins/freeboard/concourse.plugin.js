// # Building a Freeboard Plugin
//
// A freeboard plugin is simply a javascript file that is loaded into a web page after the main freeboard.js file is loaded.
//
// Let's get started with an example of a datasource plugin and a widget plugin.
//
// -------------------

// Best to encapsulate your plugin in a closure, although not required.
(function()
{
  // ## A Datasource Plugin
  //
  // -------------------
  // ### Datasource Definition
  //
  // -------------------
  // **freeboard.loadDatasourcePlugin(definition)** tells freeboard that we are giving it a datasource plugin. It expects an object with the following:
  freeboard.loadDatasourcePlugin({
    // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
    "type_name"   : "concourse",
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    "display_name": "Concourse CI",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        "description" : "A build monitor for Concourse CI",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    "external_scripts" : [
      "http://mydomain.com/myscript1.js",
        "http://mydomain.com/myscript2.js"
    ],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    "settings"    : [
      {
        // **name** (required) : The name of the setting. This value will be used in your code to retrieve the value specified by the user. This should follow naming conventions for javascript variable and function declarations.
        "name"         : "username",
        // **display_name** : The pretty name that will be shown to the user when they adjust this setting.
        "display_name" : "Basic Auth Username",
        // **type** (required) : The type of input expected for this setting. "text" will display a single text box input. Examples of other types will follow in this documentation.
        "type"         : "text",
        // **required** : If set to true, the field will be required to be filled in by the user. Defaults to false if not specified.
        "required" : true
      },
      {
        "name"        : "password",
        "display_name": "Basic Auth password",
        // **type "calculated"** : This is a special text input box that may contain javascript formulas and references to datasources in the freeboard.
        "type"        : "text"
      },
      {
          "name"        : "pipeline",
          "display_name": "pipeline",
          // **type "number"** : A data of a numerical type. Requires the user to enter a numerical value
          "type"        : "text"
      },
      {
        "name"         : "refresh_time",
        "display_name" : "Refresh Time",
        "type"         : "text",
        "description"  : "In milliseconds",
        "default_value": 5000
      }
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance   : function(settings, newInstanceCallback, updateCallback)
    {
      // myDatasourcePlugin is defined below.
      newInstanceCallback(new myDatasourcePlugin(settings, updateCallback));
    }
  });


  // ### Datasource Implementation
  //
  // -------------------
  // Here we implement the actual datasource plugin. We pass in the settings and updateCallback.
  var myDatasourcePlugin = function(settings, updateCallback)
  {
    // Always a good idea...
    var self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;

    var data = 0;
    /* This is some function where I'll get my data from somewhere */
    function getData()
    {
      $.ajax({
        headers: {
            'Authorization': 'Basic ' + btoa('admin:12345')
        },
        url: "http://169.50.102.146/api/v1/pipelines/"+currentSettings.pipeline+"/jobs",
        success: function(results){
          results = JSON.parse(results);
          results = results.map(function(result){
            return result.next_build || result.finished_build;
          });

          latest = results.reduce(function(prev, next){
            return next.id > prev.id ? next : prev;
          }, {id: -Infinity});

          updateCallback(latest);
        },
        error: function(){
          document.body.innerHTML = "<h1>Polling failed</h1>";
        }
      });
    }

    // You'll probably want to implement some sort of timer to refresh your data every so often.
    var refreshTimer;

    function createRefreshTimer(interval)
    {
      if(refreshTimer)
      {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function()
      {
        // Here we call our getData function to update freeboard with new data.
        getData();
      }, interval);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
    }

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
    self.updateNow = function()
    {
      // Most likely I'll just call getData() here.
      getData();
    }

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function()
    {
      // Probably a good idea to get rid of our timer.
      clearInterval(refreshTimer);
      refreshTimer = undefined;
    }

    // Here we call createRefreshTimer with our current settings, to kick things off, initially. Notice how we make use of one of the user defined settings that we setup earlier.
    createRefreshTimer(currentSettings.refresh_time);
  }


  // ## A Widget Plugin
  //
  // -------------------
  // ### Widget Definition
  //
  // -------------------
  // **freeboard.loadWidgetPlugin(definition)** tells freeboard that we are giving it a widget plugin. It expects an object with the following:
  freeboard.loadWidgetPlugin({
    // Same stuff here as with datasource plugin.
    "type_name"   : "build_widget_plugin",
    "display_name": "Build Monitor widget",
        "description" : "Build monitor widget",
    // **fill_size** : If this is set to true, the widget will fill be allowed to fill the entire space given it, otherwise it will contain an automatic padding of around 10 pixels around it.
    "fill_size" : true,
    "settings"    : [
      {
        "name"        : "build_result",
        "display_name": "Build Result",
        // We'll use a calculated setting because we want what's displayed in this widget to be dynamic based on something changing (like a datasource).
        "type"        : "calculated"
      },
      {
        "name"        : "size",
        "display_name": "Size",
        "type"        : "option",
        "options"     : [
          {
            "name" : "Regular",
            "value": "regular"
          },
          {
            "name" : "Big",
            "value": "big"
          }
        ]
      }
    ],
    // Same as with datasource plugin, but there is no updateCallback parameter in this case.
    newInstance   : function(settings, newInstanceCallback)
    {
      newInstanceCallback(new myWidgetPlugin(settings));
    }
  });

  // ### Widget Implementation
  //
  // -------------------
  // Here we implement the actual widget plugin. We pass in the settings;
  var myWidgetPlugin = function(settings)
  {
    var self = this;
    var currentSettings = settings;

    // Here we create an element to hold the text we're going to display. We're going to set the value displayed in it below.
    var myTextElement = $("<a style='color: white; font-size: 2em; text-decoration: none;' target=_blank></a>");

    var myContainerElement;
    // **render(containerElement)** (required) : A public function we must implement that will be called when freeboard wants us to render the contents of our widget. The container element is the DIV that will surround the widget.
    self.render = function(containerElement)
    {

      $(containerElement).css("line-height", 100);
      $(containerElement).css("text-align", "center");
      myContainerElement = containerElement;
      // Here we append our text element to the widget container element.
      $(containerElement).append(myTextElement);
    }

    // **getHeight()** (required) : A public function we must implement that will be called when freeboard wants to know how big we expect to be when we render, and returns a height. This function will be called any time a user updates their settings (including the first time they create the widget).
    //
    // Note here that the height is not in pixels, but in blocks. A block in freeboard is currently defined as a rectangle that is fixed at 300 pixels wide and around 45 pixels multiplied by the value you return here.
    //
    // Blocks of different sizes may be supported in the future.
    self.getHeight = function()
    {
      if(currentSettings.size == "big")
      {
        return 4;
      }
      else
      {
        return 2;
      }
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function(newSettings)
    {
      // Normally we'd update our text element with the value we defined in the user settings above (the_text), but there is a special case for settings that are of type **"calculated"** -- see below.
      currentSettings = newSettings;
    }

    // **onCalculatedValueChanged(settingName, newValue)** (required) : A public function we must implement that will be called when a calculated value changes. Since calculated values can change at any time (like when a datasource is updated) we handle them in a special callback function here.
    self.onCalculatedValueChanged = function(settingName, build)
    {
      var colors = {
        "pending": "grey",
        "started": "yellow",
        "succeeded": "green",
        "failed": "red",
        "errored": "organge",
        "aborted": "brown",
        "paused": "blue"
      };

      $(myContainerElement).css("background-color", colors[build.status]);
      $(myContainerElement).css("transition", "1s ease-in-out");
      $(myTextElement).attr('href', "http://169.50.102.146"+build.url)
      $(myTextElement).html("<h3>" +build.pipeline_name + '</h3><h4>' + build.job_name + '</h4><h5>' + build.status + '</h5>');
    }

    // **onDispose()** (required) : Same as with datasource plugins.
    self.onDispose = function()
    {
    }
  }
}());
