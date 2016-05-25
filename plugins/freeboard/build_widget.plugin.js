(function()
{
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
        "pending": "#BDC3C7",
        "started": "#F1C40F",
        "succeeded": "#2ECC71",
        "failed": "#E74C3C",
        "errored": "#E67E22",
        "aborted": "#8F4B2D",
        "paused": "#3498DB",
        "connection-error": "black"
      };

      var buildImage = build.type === "concourse" ? "concourse-logo.png" : "bluemix-logo.png";

      var img = "<img src='img/" + buildImage + "' height='25' width='25'>";

      $(myContainerElement).css("background-color", colors[build.status]);
      $(myContainerElement).css("transition", "1s ease-in-out");
      $(myTextElement).attr('href', build.url)
      $(myTextElement).html("<h3>" +build.pipeline_name + "</h3><h4>" + build.job_name + " - " + build.status + "</h4>" + "<h5>" + img + "</h5>");
    }

    // **onDispose()** (required) : Same as with datasource plugins.
    self.onDispose = function()
    {
    }
  }
}());
