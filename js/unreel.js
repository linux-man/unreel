"use strict";
window.onload = () => {
  const electron = require("electron");
  const {shell, webFrame} = electron;
  const remote = electron.remote;
  const {dialog, BrowserWindow} = remote;
  const appPath = remote.getGlobal("appPath");
  const homePath = remote.getGlobal("homePath");
  const path = require("path");
  const http = require("http");
  const https = require("https");
  window.beautify = require(path.join(appPath,"/node_modules/beautify"));
  const fs = require(path.join(appPath,"/node_modules/fs-extra"));
  const archiver = require(path.join(appPath,"/node_modules/archiver"));
  const extract = require(path.join(appPath,"/node_modules/extract-zip"));
  const probe = require(path.join(appPath,"/node_modules/probe-image-size"));
  const sanitize = require(path.join(appPath,"/node_modules/sanitize-filename"));

//---------------------------------------  Initialize, Find and Hide elements  -----------
  const win = BrowserWindow.getAllWindows()[0];
  const tempPath = remote.getGlobal("tempPath");
  if(remote.getGlobal("debug")) win.openDevTools();
  const dependencies = '[\n{src: "plugin/notes/notes.js", async: true},'
  +'\n{src: "plugin/highlight/highlight.js", async: true, callback: function() {hljs.initHighlightingOnLoad();}},'
  +'\n{src: "plugin/zoom-js/zoom.js", async: true},'
  +'\n{src: "plugin/search/search.js", async: true},'
  +'\n{src: "plugin/katex/katex.js", async: true},'
  +'\n{src: "plugin/chart/Chart.min.js"},'
  +'\n{src: "plugin/chart/csv2chart.js"}]';
  const newContent = '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title></title>'
  + '<link rel="stylesheet" href="css/reveal.css"><link rel="stylesheet" href="css/theme/black.css" id="theme"><link rel="stylesheet" href="lib/css/zenburn.css">'
  + '<link rel="stylesheet" href="css/print/paper.css" id="pdf"><link rel="stylesheet" href="css/unreel.css"></head>'
  + '<body><div class="reveal"><div class="slides"><section></section></div></div>'
  +'<script src="lib/js/head.min.js"></script><script src="js/reveal.js"></script>'
  + '<script>Reveal.initialize({pdfMaxPagesPerSlide: 1,zoomKey: "ctrl",dependencies:' + dependencies + '});</script></body>';
  let btfOpts = {format: "html"};
  let presentation = document.implementation.createHTMLDocument("");
  let presentationName, presentationPath, current;
  let editing = false;
  let lazy = false;
  let firstTime = true;

  let attribs = {
    boolBackgroundColor: false,
    backgroundColor: "#000000", //data-background-color
    boolBackgroundImage: false,
    backgroundImage: "", //data-background-image
    backgroundSize: "cover", //data-background-size
    backgroundPosition: "center", //data-background-position
    backgroundRepeat: "no-repeat", //data-background-repeat
    boolBackgroundVideo: false,
    backgroundVideo: "", //data-background-video
    backgroundVideoLoop: false, //data-background-video-loop
    backgroundVideoMute: false, //data-background-video-mute
    boolDataTransition: false,
    dataTransition: "slide", //data-transition
    boolBackgroundTransition: false,
    backgroundTransition: "fade", //data-background-transition
    plain: false,
    attributes: ""
  };

  let props = {
    zoomKey: "ctrl",
    pdfMaxPagesPerSlide: 1
  };

  mytextarea.style.display = "none";

//---------------------------------------  Buttons events  -------------------------------
  editB.onclick = (e) => {e.stopPropagation();openEditor("text")};
  editNotesB.onclick = (e) => {e.stopPropagation();openEditor("note")};
  attributesB.onclick = (e) => {e.stopPropagation();openEditor("attr")};
  propertiesB.onclick = (e) => {e.stopPropagation();openEditor("prop")};
  fullScreenB.onclick = (e) => {e.stopPropagation();switchFullscreen()};
  fullScreen2B.onclick = (e) => {e.stopPropagation();switchFullscreen2()};
  newB.onclick = (e) => {e.stopPropagation();newPresentation()};
  loadB.onclick = (e) => {e.stopPropagation();loadPresentation()};
  saveB.onclick = (e) => {e.stopPropagation();savePresentation()};
  printB.onclick = (e) => {e.stopPropagation();printPDF()};
  minimizeB.onclick = (e) => {e.stopPropagation();win.minimize()};
  fullscreenB.onclick = (e) => {e.stopPropagation();win.setFullScreen(!win.isFullScreen())};
  quitB.onclick = (e) => {e.stopPropagation();win.close()};
  addRightB.onclick = (e) => {e.stopPropagation();addSlideRight()};
  delB.onclick = (e) => {e.stopPropagation();deleteSlide();};
  addDownB.onclick = (e) => {e.stopPropagation();addSlideDown()};
  moveRightB.onclick = (e) => {e.stopPropagation();moveSlideRight()};
  moveLeftB.onclick = (e) => {e.stopPropagation();moveSlideLeft()};
  moveUpB.onclick = (e) => {e.stopPropagation();moveSlideUp()};
  moveDownB.onclick = (e) => {e.stopPropagation();moveSlideDown()};
  //Editor Buttons
  saveEditB.onclick = (e) => {e.stopPropagation();closeEditor(true)};
  cancelEditB.onclick = (e) => {e.stopPropagation();closeEditor(false)};
  //External page
  backB.onclick = (e) => {e.stopPropagation();webview.goBack();};

//---------------------------------------  Editor  --------------------------------------
  tinymce.init({
    selector: "#mytextarea",
    skin: "unreel",
    menubar: false,
    fixed_toolbar_container: "#mytoolbar",
    preview_styles: false,
    image_advtab: true,
    image_description: false,
    images_reuse_filename: false,
    automatic_uploads: false,
    media_alt_source: false,
    media_poster: false,
    inline: true,
    forced_root_block: "",
    force_p_newlines : true,
    file_picker_types: 'image media',
    file_picker_callback: function(callback, value, meta) {
      if (meta.filetype == 'image') {
        dialog.showOpenDialog(win, {title: "Load Image", filters: [{name: "Image files", extensions: ["jpg", "jpeg", "png", "gif", "svg"]}]}, (fileNames) => {
          if(fileNames === undefined) return;
          let file = fileNames[0];
          let newFile = newFilename(file);
          document.querySelector(".mce-window").style.visibility = "hidden"; //Hide dialog during upload
          copyToTemp(file, newFile, () => {
            document.querySelector(".mce-window").style.visibility = "visible";
            callback(newFile, {});
          })
        })
      }
      if (meta.filetype == 'media') {
        dialog.showOpenDialog(win, {title: "Load Video", filters: [{name: "Video files", extensions: ["mp4", "ogv", "webm", "m4v"]}]}, (fileNames) => {
          if(fileNames === undefined) return;
          let file = fileNames[0];
          let newFile = newFilename(file);
          document.querySelector(".mce-window").style.visibility = "hidden";
          copyToTemp(file, newFile, () => {
            document.querySelector(".mce-window").style.visibility = "visible";
            callback(newFile);
          })
        })
      }
    },
    images_upload_handler: function (blobInfo, success, failure) {
      startWait();
      let filename = blobInfo.filename();
      let reader = new FileReader();
      reader.onload = function(){
        let buffer = new Buffer(reader.result);
        fs.writeFile(path.join(tempPath, filename), buffer, {}, (err, res) => {
          if(err) dialog.showErrorBox("Couldn't copy file", err.message);
          stopWait();
          success(filename);
        })
      }
      reader.readAsArrayBuffer(blobInfo.blob());
    },
    plugins: [
      "advlist autolink charmap code colorpicker contextmenu fragment hr image imagetools insertdatetime",
      "link lists media table template textcolor visualblocks equationeditor chartjs noneditable"
    ],
    contextmenu: "link image inserttable | cell row column deletetable",
    imagetools_toolbar: "rotateleft rotateright | flipv fliph | editimage",
    toolbar1: "insert styleselect fontselect fontsizeselect | bold italic underline | alignleft aligncenter alignright | indent outdent",
    toolbar2: "fragment unfragment | bullist numlist | media link unlink image | forecolor backcolor | visualblocks removeformat | equationeditor chartjs | code",
    fontsize_formats: "8pt 12pt 16pt 20pt 24pt 28pt 32pt 36pt 40pt 48pt 56pt 72pt 80pt 96pt 128pt",
    templates: [
      {title: "Title", description: "Title and Content", content: "<h1>Title</h1><p>Text</p>"},
      {title: "Subtitle", description: "Title, Subtitle and Content", content: "<h1>Title</h1><h2>Subtitle</h2><p>Text</p>"},
      {title: "2 Panels", description: "Title and 2 Horizontal Panels", content: "<h1>Title</h1><div class=\"mceResizable\" style=\"width: 50%;float: left\">Panel 1</div><div class=\"mceResizable\" style=\"width: 50%;float: left\">Panel 2</div>"},
      {title: "3 Panels", description: "Title and 3 Horizontal Panels", content: "<h1>Title</h1><div class=\"mceResizable\" style=\"width: 33%;float: left\">Panel 1</div><div class=\"mceResizable\" style=\"width: 33%;float: left\">Panel 2</div><div class=\"mceResizable\" style=\"width: 33%;float: left\">Panel 3</div>"},
      {title: "4 Panels", description: "Title and 4 Panels", content: "<h1>Title</h1><div class=\"mceResizable\" style=\"width: 50%;float: left\">Panel 1</div><div class=\"mceResizable\" style=\"width: 50%;float: left\">Panel 2</div><div class=\"mceResizable\" style=\"width: 50%;float: left\">Panel 3</div><div class=\"mceResizable\" style=\"width: 50%;float: left\">Panel 4</div>"},
      {title: "Code Block", description: "Syntax Highlighted Code Block", content: "<h1>Title</h1><pre><code>println(\"Hello world\")</code></pre>"}
    ],
    style_formats: [
      {title: "Headers", items: [
        {title: "Header 1", format: "h1"},
        {title: "Header 2", format: "h2"},
        {title: "Header 3", format: "h3"},
        {title: "Header 4", format: "h4"}
      ]},
      {title: "Inline", items: [
        {title: "Bold", icon: "bold", format: "bold"},
        {title: "Italic", icon: "italic", format: "italic"},
        {title: "Underline", icon: "underline", format: "underline"},
        {title: "Strikethrough", icon: "strikethrough", format: "strikethrough"},
        {title: "Superscript", icon: "superscript", format: "superscript"},
        {title: "Subscript", icon: "subscript", format: "subscript"},
        {title: "Code", icon: "code", format: "code"}
      ]},
      {title: "Blocks", items: [
        {title: "Paragraph", format: "p"},
        {title: "Blockquote", format: "blockquote"},
        {title: "Div", block: "div", classes: "mceResizable", styles: {float: "left", width: "98%"}},
        {title: "Pre", format: "pre"}
      ]},
      {title: "Images", items: [
        {title: 'Image Left', selector: 'img', styles: {'float' : 'left', 'margin': '0 10px 0 10px'}},
         {title: 'Image Right', selector: 'img', styles: {'float' : 'right', 'margin': '0 10px 0 10px'}}
       ]},
      {title: "Alignment", items: [
        {title: "Left", icon: "alignleft", format: "alignleft"},
        {title: "Center", icon: "aligncenter", format: "aligncenter"},
        {title: "Right", icon: "alignright", format: "alignright"},
        {title: "Justify", icon: "alignjustify", format: "alignjustify"}
      ]}
    ]
  });

//---------------------------------------  Atributtes  -----------------------------------
  QuickSettings.useExtStyleSheet();
	let attribs1 = QuickSettings.create(0, 0, "", attributesPanel)
  .addBoolean("Background color", false, (value) => {
    attribs.boolBackgroundColor = value;
		if(value) {
      attribs1.showControl("Color");
      attribs.backgroundColor = attribs1.getValue("Color");
    }
    else attribs1.hideControl("Color");
	})
	.addColor("Color", "#000000", (value) => {attribs.backgroundColor = value;})
  .hideTitle("Color")
  .hideControl("Color");

  let attribs2 = QuickSettings.create(0+170, 0, "", attributesPanel)
  .addBoolean("Background image", false, (value) => {
    attribs.boolBackgroundImage = value;
		if(value) {
      attribs2.setValue("Background video", false);
      attribs2.showControl("Image");
      attribs2.showControl("Load image");
      attribs2.showControl("Size");
      attribs2.showControl("Position");
      attribs2.showControl("Repeat");
      attribs.backgroundImage = attribs2.getValue("Image");
      attribs.backgroundSize = attribs2.getValue("Size").value;
      attribs.backgroundPosition = attribs2.getValue("Position").value;
      attribs.backgroundRepeat = attribs2.getValue("Repeat").value;
    }
    else {
      attribs2.hideControl("Image");
      attribs2.hideControl("Load image");
      attribs2.hideControl("Size");
      attribs2.hideControl("Position");
      attribs2.hideControl("Repeat");
    }
	})
  .addText("Image","", (value) => {attribs.backgroundImage = value.trim()})
  .hideTitle("Image")
  .addButton("Load image", (btn) => {
    dialog.showOpenDialog(win, {title: "Load Image", filters: [{name: "Image files", extensions: ["jpg", "jpeg", "png", "gif", "svg"]}]}, (fileNames) => {
      if(fileNames === undefined) return;
      let file = fileNames[0];
      let newFile = newFilename(file);
      copyToTemp(file, newFile, () => {attribs2.setValue("Image", newFile);})
    })
  })
  .addDropDown("Size", [{label:"Cover", value:"cover"}, {label:"Contain", value:"contain"},
  {label:"Auto", value:"auto"}, {label:"75%", value:"75%"},{label:"50%", value:"50%"},{label:"25%", value:"25%"}],
  (value) => {attribs.backgroundSize = value.value})
  .addDropDown("Position", [{label:"Center", value:"center"}, {label:"Top", value:"top"},
  {label:"Bottom", value:"bottom"}, {label:"Left", value:"left"}, {label:"Right", value:"right"}],
  (value) => {attribs.backgroundPosition = value.value})
  .addDropDown("Repeat", [{label:"No repeat", value:"no-repeat"}, {label:"Repeat", value:"repeat"},
  {label:"Space", value:"space"}, {label:"X repeat", value:"repeat-x"},{label:"Y repeat", value:"repeat-y"}],
  (value) => {attribs.backgroundRepeat = value.value})
  .hideControl("Image")
  .hideControl("Load image")
  .hideControl("Size")
  .hideControl("Position")
  .hideControl("Repeat")
  .addBoolean("Background video", false, (value) => {
    attribs.boolBackgroundVideo = value;
		if(value) {
      attribs2.setValue("Background image", false);
      attribs2.showControl("Video");
      attribs2.showControl("Load video");
      attribs2.showControl("Loop");
      attribs2.showControl("Mute");
      attribs.backgroundVideo = attribs2.getValue("Video");
      attribs.backgroundVideoLoop = attribs2.getValue("Loop");
      attribs.backgroundVideoMute = attribs2.getValue("Mute");
    }
    else {
      attribs2.hideControl("Video");
      attribs2.hideControl("Load video")
      attribs2.hideControl("Loop");
      attribs2.hideControl("Mute");
    }
	})
  .addText("Video","", (value) => {attribs.backgroundVideo = value.trim();})
  .hideTitle("Video")
  .addButton("Load video", (btn) => {
    dialog.showOpenDialog(win, {title: "Load Video", filters: [{name: "Video files", extensions: ["mp4", "ogv", "webm", "m4v"]}]}, (fileNames) => {
      if(fileNames === undefined) return;
      let file = fileNames[0];
      let newFile = newFilename(file);
      copyToTemp(file, newFile, () => {attribs2.setValue("Video", newFile);})
    })
  })
  .addBoolean("Loop", false, (value) => {attribs.backgroundVideoLoop = value;})
  .addBoolean("Mute", false, (value) => {attribs.backgroundVideoMute = value;})
  .hideControl("Video")
  .hideControl("Load video")
  .hideControl("Loop")
  .hideControl("Mute");

  let attribs3 = QuickSettings.create(0+170+170, 0, "", attributesPanel)
  .addBoolean("Transition", false, (value) => {
    attribs.boolDataTransition = value;
    if(value) {
      attribs3.showControl("Slide effect");
      attribs.dataTransition = attribs3.getValue("Slide effect").value;
    }
    else attribs3.hideControl("Slide effect");
  })
  .addDropDown("Slide effect", [{label:"None", value:"none"}, {label:"Fade", value:"fade"},
  {label:"Slide", value:"slide"}, {label:"Convex", value:"convex"},
  {label:"Concave", value:"concave"}, {label:"Zoom", value:"zoom"}],
  (value) => {attribs.dataTransition = value.value;})
  .hideTitle("Slide effect")
  .hideControl("Slide effect")
  .setValue("Slide effect", 2)
  .addBoolean("Background transition", false, (value) => {
    attribs.boolBackgroundTransition = value;
    if(value) {
      attribs3.showControl("Background effect");
      attribs.backgroundTransition = attribs3.getValue("Background effect").value;
    }
    else attribs3.hideControl("Background effect");
  })
  .addDropDown("Background effect", [{label:"None", value:"none"}, {label:"Fade", value:"fade"},
  {label:"Slide", value:"slide"}, {label:"Convex", value:"convex"},
  {label:"Concave", value:"concave"}, {label:"Zoom", value:"zoom"}],
  (value) => {attribs.backgroundTransition = value.value;})
  .setValue("Background effect", 1)
  .hideTitle("Background effect")
  .hideControl("Background effect");

  let attribs4 = QuickSettings.create(0+170+170+170, 0, "", attributesPanel)
  .addBoolean("Attributes", false, (value) => {
    attribs.plain = value;
    if(value) {
      attribs4.showControl("plain");
      attribs4.setWidth(170+170+170+170);
      attribs4.setPosition(0, 0);
      attribs1.hide();
      attribs2.hide();
      attribs3.hide();
    }
    else {
      attribs1.show();
      attribs2.show();
      attribs3.show();
      attribs4.hideControl("plain");
      attribs4.setWidth(170);
      attribs4.setPosition(0+170+170+170, 0);
    }
  })
  .addTextArea("plain", "", (value) => {attribs.attributes = value.trim();})
  .setTextAreaRows("plain", 8)
  .hideTitle("plain")
  .hideControl("plain");

  //---------------------------------------  Properties  ---------------------------------
	let props1 = QuickSettings.create(0, 0, "", propertiesPanel)
  .addNumber("Width", 800, 4000, 960, 1, (value) => {props.width = value;})
  .addNumber("Height", 560, 3000, 700, 1, (value) => {props.height = value;})
  .addNumber("Margin", 0, 20, 0.04, 0.01, (value) => {props.margin = value;})
  .addNumber("Min scale", 0.1, 1, 0.2, 0.1, (value) => {props.minScale = value;})
  .addNumber("Max scale", 1, 4, 2, 0.1, (value) => {props.maxScale = value;})
  .addDropDown("Show slide number", [{label:"False", value:"false"}, {label:"Hor.Vert", value:"true"},
  {label:"Hor/Vert", value:"h/v"}, {label:"Number", value:"c"}, {label:"Number/Total", value:"c/t"}],
  (value) => {props.slideNumber = value.value})
  .setValue("Show slide number", 0)
  .addBoolean("Show controls", true, (value) => {props.controls = value;})
  .addBoolean("Show progress", true, (value) => {props.progress = value;})
  .addBoolean("Show notes", false, (value) => {props.showNotes = value;});

  let props2 = QuickSettings.create(0+170, 0, "", propertiesPanel)
  .addDropDown("Theme", [{label:"Black", value:"black"}, {label:"White", value:"white"},
  {label:"League", value:"league"}, {label:"Sky", value:"sky"},{label:"Beige", value:"beige"},
  {label:"Simple", value:"simple"}, {label:"Serif", value:"serif"}, {label:"Blood", value:"blood"},
  {label:"Night", value:"night"}, {label:"Moon", value:"moon"}, {label:"Solarized", value:"solarized"}],
  (value) => {props.theme = value.value;})
  .setValue("Theme", 0)
  .addDropDown("Transition ", [{label:"None", value:"none"}, {label:"Fade", value:"fade"},
  {label:"Slide", value:"slide"}, {label:"Convex", value:"convex"},
  {label:"Concave", value:"concave"}, {label:"Zoom", value:"zoom"}],
  (value) => {props.transition = value.value;})
  .setValue("Transition ", 2)
  .addDropDown("Background transition ", [{label:"None", value:"none"}, {label:"Fade", value:"fade"},
  {label:"Slide", value:"slide"}, {label:"Convex", value:"convex"},
  {label:"Concave", value:"concave"}, {label:"Zoom", value:"zoom"}],
  (value) => {props.backgroundTransition = value.value;})
  .setValue("Background transition ", 1)
  .addDropDown("Transition speed", [{label:"Default", value:"default"},
  {label:"Fast", value:"fast"}, {label:"Slow", value:"slow"}],
  (value) => {props.transitionSpeed = value.value;})
  .setValue("Transition speed", 0)
  .addBoolean("Enable loop", false, (value) => {props.loop = value;})
  .addBoolean("Enable pause (B)", true, (value) => {props.pause = value;})
  .addBoolean("Enable fragments", true, (value) => {props.fragments = value;})
  .addBoolean("Center slides", true, (value) => {props.center = value;})
  .addBoolean("Shuffle (on load)", false, (value) => {props.shuffle = value;})
  .addBoolean("Lazy loading", false, (value) => {});

  let props3 = QuickSettings.create(0+170+170, 0, "", propertiesPanel)
  .addNumber("Auto slide (A)", 0, 100000, 0, 100, (value) => {
    props.autoSlide = value;
    if(value > 0) props3.showControl("Stoppable");
    else props3.hideControl("Stoppable");
  })
  .addBoolean("Stoppable", false, (value) => {props.autoSlideStoppable = value;})
  .hideControl("Stoppable")
  .addBoolean("Parallax", false, (value) => {
    if(value) {
      props3.showControl("Parallax image");
      props3.showControl("Load image ");
      props3.showControl("Horizontal shift");
      props3.showControl("Vertical shift");
    }
    else {
      props3.setValue("Parallax image", "");
      props3.setValue("Horizontal shift", false);
      props3.setValue("Vertical shift", false);
      props3.hideControl("Parallax image");
      props3.hideControl("Load image ");
      props3.hideControl("Horizontal shift");
      props3.hideControl("Vertical shift");
    }
  })
  .addText("Parallax image", "", (value) => {
    props.parallaxBackgroundImage = value.trim();
    if(props.parallaxBackgroundImage == "") props.parallaxBackgroundSize = "";
    else {
      if(props.parallaxBackgroundImage.indexOf("http") == 0) {
        probe(props.parallaxBackgroundImage, (err, dimensions) => {
          if(err) props.parallaxBackgroundSize = "";
          else props.parallaxBackgroundSize = dimensions.width + "px " + dimensions.height + "px";
        })
      }
      else {
        let f = fs.createReadStream(path.join(tempPath, props.parallaxBackgroundImage));
        probe(f, (err, dimensions) => {
          if(err) props.parallaxBackgroundSize = "";
          else props.parallaxBackgroundSize = dimensions.width + "px " + dimensions.height + "px";
        })
      }
    }
  })
  .addButton("Load image ", (btn) => {
    dialog.showOpenDialog(win, {title: "Load Image", filters: [{name: "Image files", extensions: ["jpg", "jpeg", "png", "gif", "svg"]}]}, (fileNames) => {
      if(fileNames === undefined) return;
      let file = fileNames[0];
      let newFile = newFilename(file);
      copyToTemp(file, newFile, () => {props3.setValue("Parallax image", newFile);})
    })
  })
  .addBoolean("Horizontal shift", false, (value) => {
    if(value) {
      props3.showControl("Hs");
      props.parallaxBackgroundHorizontal = props3.getValue("Hs");
    }
    else {
      props3.hideControl("Hs");
      props.parallaxBackgroundHorizontal = null;
    }
  })
  .addNumber("Hs", 0, 1000, 100, 1, (value) => {props.parallaxBackgroundHorizontal = value;})
  .addBoolean("Vertical shift", false, (value) => {
    if(value) {
      props3.showControl("Vs");
      props.parallaxBackgroundVertical = props3.getValue("Vs");
    }
    else {
      props3.hideControl("Vs");
      props.parallaxBackgroundVertical = null;
    }
  })
  .addNumber("Vs", 0, 1000, 100, 1, (value) => {props.parallaxBackgroundVertical = value;})
  .hideTitle("Hs")
  .hideTitle("Vs")
  .hideControl("Parallax image")
  .hideControl("Load image ")
  .hideControl("Horizontal shift")
  .hideControl("Vertical shift")
  .hideControl("Hs")
  .hideControl("Vs");

  let props4 = QuickSettings.create(0+170+170+170, 0, "", propertiesPanel)
  .addBoolean("Properties", false, (value) => {
    if(value) {
      props4.showControl("plain ");
      props4.setWidth(170+170+170+170);
      props4.setPosition(0, 0);
      props1.hide();
      props2.hide();
      props3.hide();
    }
    else {
      props1.show();
      props2.show();
      props3.show();
      props4.hideControl("plain ");
      props4.setWidth(170);
      props4.setPosition(0+170+170+170, 0);
    }
  })
  .addTextArea("plain ", "", (value) => {})
  .setTextAreaRows("plain ", 24)
  .hideTitle("plain ")
  .hideControl("plain ");

  let argv = remote.getGlobal("argv");
  if(argv) loadPresentation(argv);
  else loadPresentation(path.join(appPath, "intro/Intro.reel"));

//---------------------------------------  Editor states  --------------------------------
  function openEditor(mode) {
    controls.style.display = "none";
    if(mode == "text" || mode == "note") {
      mytextarea.style.display = "block";
      tinymce.activeEditor.show();
      mytextarea.focus();
      webview.send("startEdit");
      let a;
      if(mode == "note") {
        a = "none";
        if(current.querySelector("aside.notes")) tinymce.activeEditor.setContent(dataSrcToSrc(current.querySelector("aside.notes")));
        else {
          tinymce.activeEditor.setContent("");
        }
      }
      else {
        a = "inline-block";
        current.querySelectorAll("div").forEach((e) => {e.classList.add("mceResizable");})
        current.querySelectorAll("div[data-chart]").forEach((e) => {e.classList.add("mceNonEditable");})
        tinymce.activeEditor.setContent(dataSrcToSrc(current));
      }
        try {document.querySelector("#mceu_0").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_12").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_13").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_16").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_17").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_18").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_19").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_24").style.display = a;} catch(err) {};
        try {document.querySelector("#mceu_25").style.display = a;} catch(err) {};
    }
    else if(mode == "attr") {
      updateAttribs(current.attributes);
      attributesPanel.style.display = "block";
    }
    else if(mode == "prop") propertiesPanel.style.display = "block";
    editorControls.style.display = "block";
    editing = true;
  }

  function closeEditor(save) {
    if(save) {
      if(mytextarea.style.display == "block") {
        tinymce.activeEditor.uploadImages(() => {
          if(document.querySelector("#mceu_0").style.display == "none") {
            if(tinymce.activeEditor.getContent() == "") {
              try {
                current.querySelector("aside.notes").remove();
              } catch(err) {console.error(err);};
            }
            else {
              let aside = current.querySelector("aside.notes");
              if(aside == null) {
                aside = document.createElement("ASIDE");
                aside.className = "notes";
                current.appendChild(aside);
              }
              aside.innerHTML = tinymce.activeEditor.getContent();
            }
          }
          else current.innerHTML = tinymce.activeEditor.getContent();
          current.querySelectorAll("div").forEach((e) => {e.classList.remove("mceResizable", "mceNonEditable");})
          current.querySelectorAll("span#mce_marker").forEach((el) => {el.remove()});//Tinymce keeps adding this on video drag and drop
          updateIndex();
          webview.send("updateContents", {html: current.innerHTML});
          hideEditor();
        })
      }
      else if(attributesPanel.style.display == "block") {
        if(attribs.plain){
          while(current.attributes.length > 0) current.removeAttribute(current.attributes[0].name);
          let list = attribs.attributes.split("\n");
          for(let a of list) {
            let v = a.split("=");
            if(v[0]) v[0] = v[0].trim();
            if(v[1]) v[1] = v[1].trim();
            else v[1] = "";
            if(v[0] && v[0] != "") current.setAttribute(v[0], v[1]);
          }
        }
        else {
          if (attribs.boolBackgroundColor) current.setAttribute("data-background-color", attribs.backgroundColor);
          else current.removeAttribute("data-background-color");
          if (attribs.boolBackgroundImage && attribs.backgroundImage.trim() != "") {
            current.setAttribute("data-background-image", attribs.backgroundImage);
            current.setAttribute("data-background-size", attribs.backgroundSize);
            current.setAttribute("data-background-position", attribs.backgroundPosition);
            current.setAttribute("data-background-repeat", attribs.backgroundRepeat);
          }
          else {
            current.removeAttribute("data-background-image");
            current.removeAttribute("data-background-size");
            current.removeAttribute("data-background-position");
            current.removeAttribute("data-background-repeat");
          }
          if (attribs.boolBackgroundVideo && attribs.backgroundVideo.trim() != "") {
            current.setAttribute("data-background-video", attribs.backgroundVideo);
            if(attribs.backgroundVideoLoop) current.setAttribute("data-background-video-loop", true)
            else current.removeAttribute("data-background-video-loop");
            if(attribs.backgroundVideoMute) current.setAttribute("data-background-video-muted", true)
            else current.removeAttribute("data-background-video-muted");
          }
          else {
            current.removeAttribute("data-background-video");
            current.removeAttribute("data-background-video-loop");
            current.removeAttribute("data-background-video-muted");
          }
          if (attribs.boolBackgroundTransition) current.setAttribute("data-background-transition", attribs.backgroundTransition);
          else current.removeAttribute("data-background-transition");
          if (attribs.boolDataTransition) current.setAttribute("data-transition", attribs.dataTransition);
          else current.removeAttribute("data-transition");
        }
        webview.send("updateAttribs", attribToObj(current.attributes));
        updateIndex();
      }
      else if(propertiesPanel.style.display == "block") {
        if(props4.getValue("Properties")) webview.send("updateProps", props4.getValue("plain "));
        else webview.send("updateProps", props);
        lazy = props2.getValue("Lazy loading");
      }
      notSaved(true);
    }
    hideEditor();
  }

//---------------------------------------  webview events  -------------------------------
  webview.addEventListener("dom-ready", () => {
    if(remote.getGlobal("debug")) webview.openDevTools();
    if(webview.getURL().indexOf("http") != 0) {
      backB.style.display = "none";
      controls.style.display = "block";
    }
  })

  webview.addEventListener("will-navigate", (e) => { //Link to outside
    backB.style.display = "block";
    controls.style.display = "none";
  })

  webview.addEventListener("new-window", (e) => {
    if(e.url.indexOf("http") == 0) shell.openExternal(e.url); //Don"t open Notes on browser
  })

//---------------------------------------  Messages from webview  ------------------------
  webview.addEventListener("ipc-message", (e) => {
    if(e.channel == "slidechanged") changeSlide(e.args[0], e.args[1], e.args[2]);
    else if(e.channel == "updateProps") updateProps(e.args[0]);
    else if(e.channel == "hover") {
      if(e.args[0] == "A") document.body.style.cursor = "pointer";
      else document.body.style.cursor = "default";
    }
    else if(e.channel == "overview") {
      if(e.args[0]) controls.style.display = "none";
      else controls.style.display = "block";
    }
  })

//---------------------------------------  document events  ------------------------------
  document.addEventListener("keydown", (e) => {
    if(e.key == "+" && (e.metaKey || e.ctrlKey)) webFrame.setZoomFactor(Math.min(webFrame.getZoomFactor() + 0.1, 2));
    if(e.key == "-" && (e.metaKey || e.ctrlKey)) webFrame.setZoomFactor(Math.max(webFrame.getZoomFactor() - 0.1, 0.5));
    if(e.key == "0" && (e.metaKey || e.ctrlKey)) webFrame.setZoomFactor(1);
    if(e.key == "p" && (e.metaKey || e.ctrlKey)) printPDF();
    if(process.platform !== "darwin" && e.key == "h" && (e.metaKey || e.ctrlKey)) {
      remote.getGlobal("settings").haccel = !remote.getGlobal("settings").haccel;
      let text = "disabled";
      if(remote.getGlobal("settings").haccel) text = "enabled";
      dialog.showMessageBox(win, {type:"info", title: "Settings", message: "Hardware acceleration " + text, detail: "After restart.", buttons: ["OK"]});
    }
    if(!editing) {
      if(e.key == "n" && (e.metaKey || e.ctrlKey)) newPresentation();
      else if(e.key == "o" && (e.metaKey || e.ctrlKey)) loadPresentation();
      else if(e.key == "s" && (e.metaKey || e.ctrlKey)) savePresentation();
      else if(e.keyCode == 122) win.setFullScreen(!win.isFullScreen());//F11
      else if(e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {//Control+Enter
        if(controls.style.display == "block") {//Dont't hide in overview mode
          if(controls.style.visibility == "visible") controls.style.visibility = "hidden";
          else controls.style.visibility = "visible";
        }
      }
      let key = e.key;
      let m = [];
      if(e.ctrlKey) m.push("control");
      if(e.altKey) m.push("alt");
      if(e.shiftKey) m.push("shift");
      if(e.metaKey) m.push("meta");
      switch (e.keyCode) {
        case 13: key = "Return"; break;
        case 37: key = "Left"; break;
        case 38: key = "Up"; break;
        case 39: key = "Right"; break;
        case 40: key = "Down"; break;
      }
      webview.sendInputEvent({type:"keyDown", keyCode:key, modifiers: m});
      if(e.key.length === 1) webview.sendInputEvent({type:'char', keyCode:key});
    }
  })

  document.addEventListener("keyup", (e) => {
    let key = e.key;
    let m = [];
    if(e.ctrlKey) m.push("control");
    if(e.altKey) m.push("alt");
    if(e.shiftKey) m.push("shift");
    if(e.metaKey) m.push("meta");
    switch (e.keyCode) {
      case 13: key = "Return"; break;
      case 37: key = "Left"; break;
      case 38: key = "Up"; break;
      case 39: key = "Right"; break;
      case 40: key = "Down"; break;
    }
    webview.sendInputEvent({type:"keyUp", keyCode:key, modifiers: m});
  })

  document.addEventListener("drop", (e) => {
    e.preventDefault();
    if(!editing && e.dataTransfer.files[0] && path.extname(e.dataTransfer.files[0].path).toLowerCase() == ".reel")
      loadPresentation(e.dataTransfer.files[0].path);
    return false;
  }, false);

  document.addEventListener("dragover", (e) => {
    if(e.target.tagName != "SECTION") {
      e.preventDefault();
      return false;
    }
  }, false);

  document.addEventListener("mousedown", (e) => {
    if(!editing){
      if(moveDownB.style.display == "block" && controls.style.visibility == "visible"
      && win.getSize()[1] - e.clientY < 50 && Math.abs(win.getSize()[0] / 2 - e.clientX) < 50
    ) return;//Avoid jump to other slide when clicking move slide down
      let m = [];
      if(e.ctrlKey) m.push("control");
      if(e.altKey) m.push("alt");
      if(e.shiftKey) m.push("shift");
      if(e.metaKey) m.push("meta");
      webview.sendInputEvent({type:"mouseDown", x: e.clientX, y: e.clientY, button:"left", modifiers: m, clickCount: 1});
    }
  })

  document.addEventListener("mouseup", (e) => {
    if(!editing) webview.sendInputEvent({type:"mouseUp", x: e.clientX, y: e.clientY, button:"left", clickCount: 1});
  })

  document.addEventListener("mousemove", (e) => {
    if(!editing && e.which == 1) webview.sendInputEvent({type:"mouseDown", x: e.clientX, y: e.clientY, button:"left", clickCount: 1});
    webview.sendInputEvent({type:"mouseMove", x: e.clientX, y: e.clientY});
  })

//---------------------------------------  window events  --------------------------------
  window.onresize = () => {
    let dim = win.getContentSize();
    let zoom = window.outerWidth / window.innerWidth;
    mytextarea.style["max-height"] = dim[1] / zoom - 200 + "px";
  };

  window.onbeforeunload = () => {
    remote.getGlobal("settings").fullscreen = win.isFullScreen();
    remote.getGlobal("settings").maximized = win.isMaximized();
  };

//---------------------------------------  mytextarea events  ----------------------------
  mytextarea.addEventListener("drop", (e) => {
    let src;
    e.stopPropagation();
    if(e.dataTransfer.getData("URL") && e.dataTransfer.getData("URL").indexOf("http") == 0) src = e.dataTransfer.getData("URL");
    else if(e.dataTransfer.files[0]) src = e.dataTransfer.files[0].path;
    if(src) {
      e.preventDefault();
      if([".jpg", ".jpeg", ".png", ".bmp", ".svg", ".mp4", ".m4v", ".webm", ".ogv", ".mp3", ".ogg", ".wav"].includes(path.extname(src).toLowerCase()))
      mediaToTemp(src, newFilename(src), () => {insertMedia(newFilename(src), document.caretRangeFromPoint(e.clientX, e.clientY))});
    }
  })

  mytextarea.addEventListener("paste", (e) => {
    e.preventDefault();
    e.stopPropagation();
    let div = document.createElement("div");
    div.innerHTML = e.clipboardData.getData("text/html");
    let img;
    if(img = div.querySelector("img")) {
      let src = img.src.trim();
      if(src.indexOf("http") == 0) mediaToTemp(src, newFilename(src), () => {insertMedia(newFilename(src), window.getSelection().getRangeAt(0))});
      else if(src.includes(tempPath)) insertMedia(path.basename(src), window.getSelection().getRangeAt(0));
    }
    else {
      let src = e.clipboardData.getData("text/plain");
      if([".jpg", ".jpeg", ".png", ".bmp", ".svg", ".mp4", ".m4v", ".webm", ".ogv", ".avi", ".mp3", ".ogg", ".wav"].includes(path.extname(src).toLowerCase())) {
        mediaToTemp(src, newFilename(src), () => {insertMedia(newFilename(src), window.getSelection().getRangeAt(0))});
      }
      else tinymce.activeEditor.insertContent(src);
    }
  }, false);

//---------------------------------------  Load and Save Presentation --------------------
  function notSaved(b) {
    if(b == undefined) return remote.getGlobal("notSaved").value;
    else remote.getGlobal("notSaved").value = b;
  }

  function newPresentation() {
    function newP() {
      controls.style.visibility = "visible";
      startWait();
      clearAttribs();
      props2.setValue("Lazy loading", false);
      presentation.documentElement.innerHTML = newContent;
      presentationName = "Presentation";
      presentationPath = path.join(homePath, presentationName);
      deleteTempFiles(() => {
        fs.writeFile(path.join(tempPath, "index.html"), window.beautify("<!doctype html>\n<html>\n" + newContent + "\n</html>\n", btfOpts), (err) => {
          stopWait();
          if(err) dialog.showErrorBox("Couldn't create index.html", err.message);
          else {
            firstTime = true;
            webFrame.setZoomFactor(1);
            webview.src = "index.html";
            win.setTitle("Unreel");
            notSaved(false);
          }
        })
      })
    }
    if(notSaved()) {
      dialog.showMessageBox(win, {type:"warning", title: "Warning", message: "Presentation has changed, do you want to continue?", detail: "Your changes will be lost if you continue without saving.", buttons: ["No", "Yes"]}, (response) => {
        if(response == 1) newP();
      })
    }
    else newP();
  };

  function loadPresentation(file) {
    function openDialog() {
      dialog.showOpenDialog(win, {title: "Load Presentation", filters: [{name: "Unreel files", extensions: ["reel"]}]}, (fileNames) => {
        if(fileNames === undefined) return;
        presentationPath = fileNames[0];
        loadP();
      })
    }
    function loadP() {
      controls.style.visibility = "visible";
      startWait();
      clearAttribs();
      deleteTempFiles(() => {
        extract(presentationPath, {dir: tempPath}, (err) => {
          stopWait();
          if(err) {
            dialog.showErrorBox("Extration Error", err.message);
            newPresentation();
          }
          else {
            fs.readFile(path.join(tempPath, "index.html"), "utf8", (err, data) => {
              if (err) {
                dialog.showErrorBox("Index read error", err.message);
                newPresentation();
              }
              else {
                presentation.documentElement.innerHTML = data.substring(data.indexOf("<head>"), data.indexOf("</html>"));
                let slides = presentation.querySelector("div.slides");
                presentation.documentElement.innerHTML = newContent;
                presentation.querySelector("div.slides").innerHTML = slides.innerHTML;
                updateIndex();
                lazy = presentation.querySelectorAll("img[data-src], video[data-src], source[data-src], audio[data-src], iframe[data-src]").length > 0;
                props2.setValue("Lazy loading", lazy);
                firstTime = true;
                webFrame.setZoomFactor(1);
                webview.src = "index.html";
                win.setTitle("Unreel - " + path.basename(presentationPath, path.extname(presentationPath)));
                notSaved(false);
              }
            })
          }
        })
      })
    }
    if(notSaved()) {
      dialog.showMessageBox(win, {type:"warning", title: "Warning", message: "Presentation has changed, do you want to continue?", detail: "Your changes will be lost if you continue without saving.", buttons: ["No", "Yes"]}, (response) => {
        if(response == 1) {
          if(file) {
            presentationPath = file;
            loadP();
          }
          else openDialog();
        }
      })
    }
    else {
      if(file) {
        presentationPath = file;
        loadP();
      }
      else openDialog();
    }
  };

  function savePresentation() {
    let ps = path.parse(presentationPath);
    let fn = path.join(ps.dir, ps.name);
    controls.style.visibility = "visible";
    dialog.showSaveDialog(win, {title: "Save Presentation", defaultPath: fn, filters: [{name: "Unreel files", extensions: ["reel"]}, {name: "HTML files", extensions: ["html"]}]}, (fileName) => {
      if(fileName === undefined) return;
      startWait();
      updateIndex();
      presentationPath = fileName;
      let fileList = ["index.html"];
      let media = presentation.querySelectorAll("img, video, source, audio, iframe");
      media.forEach((m) => {
        if(m.hasAttribute("src")) fileList.push(m.getAttribute("src"));
        else if(m.hasAttribute("data-src")) fileList.push(m.getAttribute("data-src"));
      })
      media = presentation.querySelectorAll("section");
      media.forEach((m) => {
        if(m.getAttribute("data-background-image") || m.getAttribute("data-background-video"))
        fileList.push(m.getAttribute("data-background-image") || m.getAttribute("data-background-video"));
      })
      if(props.parallaxBackgroundImage != "") fileList.push(props.parallaxBackgroundImage);
      fileList = Array.from(new Set(fileList));//Remove duplicates
      if(path.extname(presentationPath) == ".reel") {//Export .reveal
        let output = fs.createWriteStream(presentationPath);
        let archive = archiver("zip");
        output.on("close", () => {
          notSaved(false);
          stopWait();
          win.setTitle("Unreel - " + path.basename(presentationPath, path.extname(presentationPath)));
        })
        archive.on("error", (err) => {
          notSaved(false);
          stopWait();
          dialog.showErrorBox("File Save Error", err.message);
        })
        archive.pipe(output);
        fs.readdir(tempPath, (err, files) => {
          for (let i = 0; i < fileList.length; i++) {
            if(files.includes(fileList[i])) archive.file(path.join(tempPath, fileList[i]), {name: fileList[i]});
          }
          archive.finalize();
        })
      }
      else {//Export as HTML
        fileList.push("css");
        fileList.push("js");
        fileList.push("lib");
        fileList.push("plugin");
        let dir = path.join(path.dirname(presentationPath), path.basename(presentationPath, path.extname(presentationPath)));
        function copyTempFile(files, callback) {
          if(files.length == 0) callback();
          else {
            let file = files.pop()
            fs.copy(path.join(tempPath, file), path.join(dir, file), (err) => {
              copyTempFile(files, callback);
            })
          }
        }
        let contents = '<!DOCTYPE html><html><head> <meta http-equiv="refresh" content="0; url=';
        contents += path.join(path.basename(presentationPath, path.extname(presentationPath)), "index.html");
        contents += '"></head><body></body></html>';
        fs.writeFile(presentationPath, contents, (err) => {//Write redirector
          if(err) {
            stopWait();
            dialog.showErrorBox("File Save Error", err.message)
          }
          else {
            fs.emptyDir(dir, (err) => {
              if(err) {
                stopWait();
                dialog.showErrorBox("Directory Creation Error", err.message)
              }
              else copyTempFile(fileList, () => {
                notSaved(false);
                stopWait();
              })
            })
          }
        })
      }
    })
  }

//---------------------------------------  Update and synchronize  -----------------------
  function updateProps(p) {
    if(firstTime) {
      if(p.shuffle) {
        dialog.showMessageBox(win, {type:"warning", title: "Warning", message: "Shuffle is ON. It randomizes the order of slides each time the presentation loads.", detail: "If you want to edit slides, turn Shuffle off, save and reopen this presentation.", buttons: ["OK"]});
        editB.style.display = "none";
        editNotesB.style.display = "none";
        attributesB.style.display = "none";
      }
      else {
        editB.style.display = "block";
        editNotesB.style.display = "block";
        attributesB.style.display = "block";
      }
    }
    delete p.dependencies;
    p.theme = path.basename(p.theme, ".css");
    presentation.querySelector("#theme").setAttribute("href","css/theme/" + p.theme + ".css");
    document.querySelector("#theme").setAttribute("href","css/theme/" + p.theme + ".css");
    props = Object.assign(props, p);
    props4.setValue("Properties", false);
    props1.setValue("Width", p.width);
    props1.setValue("Height", p.height);
    props1.setValue("Margin", p.margin);
    props1.setValue("Min scale", p.minScale);
    props1.setValue("Max scale", p.maxScale);
    if(p.slideNumber == false || p.slideNumber == "false") props1.setValue("Show slide number", 0);
    else if(p.slideNumber == true || p.slideNumber == "true") props1.setValue("Show slide number", 1);
    else if(["h/v", "c", "c/t"].includes(p.slideNumber)) props1.setValue("Show slide number", ["h/v", "c", "c/t"].indexOf(p.slideNumber) + 2);
    else props4.setValue("Properties", true);
    props1.setValue("Show controls", p.controls);
    props1.setValue("Show progress", p.progress);
    props1.setValue("Show notes", p.showNotes);
    if(["black", "white", "league", "sky", "beige", "simple", "serif", "blood", "night", "moon", "solarized"].includes(p.theme))
    props2.setValue("Theme", ["black", "white", "league", "sky", "beige", "simple", "serif", "blood", "night", "moon", "solarized"].indexOf(p.theme))
    else props4.setValue("Properties", true);
    if(["none", "fade", "slide", "convex", "concave", "zoom"].includes(p.transition))
    props2.setValue("Transition ", ["none", "fade", "slide", "convex", "concave", "zoom"].indexOf(p.transition))
    else props4.setValue("Properties", true);
    if(["none", "fade", "slide", "convex", "concave", "zoom"].includes(p.backgroundTransition))
    props2.setValue("Background transition ", ["none", "fade", "slide", "convex", "concave", "zoom"].indexOf(p.backgroundTransition))
    else props4.setValue("Properties", true);
    if(["default", "fast", "slow"].includes(p.transitionSpeed))
    props2.setValue("Transition speed", ["default", "fast", "slow"].indexOf(p.transitionSpeed))
    else props4.setValue("Properties", true);
    props2.setValue("Enable loop", p.loop);
    props2.setValue("Enable pause (B)", p.pause);
    props2.setValue("Enable fragments", p.fragments);
    props2.setValue("Shuffle (on load)", p.shuffle);
    props2.setValue("Center slides", p.center);
    props2.setValue("Lazy loading", lazy);
    props3.setValue("Auto slide (A)", p.autoSlide);
    props3.setValue("Stoppable", p.autoSlideStoppable);
    props3.setValue("Parallax", p.parallaxBackgroundImage != "");
    props3.setValue("Parallax image", p.parallaxBackgroundImage);
    if(p.parallaxBackgroundHorizontal) {
      props3.setValue("Horizontal shift", true);
      props3.setValue("Hs", p.parallaxBackgroundHorizontal);
    }
    else {
      props3.setValue("Horizontal shift", false);
    }
    if(p.parallaxBackgroundVertical) {
      props3.setValue("Vertical shift", true);
      props3.setValue("Vs", p.parallaxBackgroundVertical);
    }
    else {
      props3.setValue("Vertical shift", false);
    }
    delete p.theme;
    try {
      props4.setValue("plain ", window.beautify(JSON.stringify(p), {format: "json"}));
    } catch(err) {console.error(err);};
    updateIndex();
  }

  function clearAttribs() {
    attribs1.setValue("Background color", false);
    attribs1.setValue("Color", "#000000");
    attribs2.setValue("Background image", false);
    attribs2.setValue("Image", "");
    attribs2.setValue("Size", 0);
    attribs2.setValue("Position", 0);
    attribs2.setValue("Repeat", 0);
    attribs2.setValue("Background video", false);
    attribs2.setValue("Video", "");
    attribs2.setValue("Loop", false);
    attribs2.setValue("Mute", false);
    attribs3.setValue("Transition", false);
    attribs3.setValue("Slide effect", 2);
    attribs3.setValue("Background transition", false);
    attribs3.setValue("Background effect", 1);
    attribs4.setValue("Attributes", false);
    attribs4.setValue("plain", "");
  }

  function updateAttribs(data) {
    let a = attribToObj(data);
    attribs1.setValue("Background color", false);
    attribs4.setValue("Attributes", false);
    if(a["data-background-color"]) {
      if(a["data-background-color"].charAt(0) == "#") {
        attribs1.setValue("Background color", true);
        attribs1.setValue("Color", a["data-background-color"]);
      }
      else {
        attribs1.setValue("Background color", false);
        attribs4.setValue("Attributes", true);
      }
    }
    else attribs1.setValue("Background color", false);
    if(a["data-background-image"]) {
      attribs2.setValue("Background image", true);
      attribs2.setValue("Image", a["data-background-image"]);
      if(["cover", "contain", "auto", "75%", "50%", "25%"].includes(a["data-background-size"]))
      attribs2.setValue("Size", ["cover", "contain", "auto", "75%", "50%", "25%"].indexOf(a["data-background-size"]))
      else attribs4.setValue("Attributes", true);
      if(["center", "top", "bottom", "left", "right"].includes(a["data-background-position"]))
      attribs2.setValue("Position", ["center", "top", "bottom", "left", "right"].indexOf(a["data-background-position"]))
      else attribs4.setValue("Attributes", true);
      if(["no-repeat", "repeat", "space", "repeat-x", "repeat-y"].includes(a["data-background-repeat"]))
      attribs2.setValue("Repeat", ["no-repeat", "repeat", "space", "repeat-x", "repeat-y"].indexOf(a["data-background-repeat"]))
      else attribs4.setValue("Attributes", true);
    }
    else attribs2.setValue("Background image", false);
    if(a["data-background-video"]) {
      attribs2.setValue("Background image", false);
      attribs2.setValue("Background video", true);
      attribs2.setValue("Video", a["data-background-video"]);
      attribs2.setValue("Loop", a["data-background-video-loop"] || false);
      attribs2.setValue("Mute", a["data-background-video-muted"] || false);
    }
    else attribs2.setValue("Background video", false);
    if(a["data-transition"]) {
      attribs3.setValue("Transition", true);
      if(["none", "fade", "slide", "convex", "concave", "zoom"].includes(a["data-transition"]))
      attribs3.setValue("Slide effect", ["none", "fade", "slide", "convex", "concave", "zoom"].indexOf(a["data-transition"]))
      else attribs4.setValue("Attributes", true);
    }
    else attribs3.setValue("Transition", false);
    if(a["data-background-transition"]) {
      attribs3.setValue("Background transition", true);
      if(["none", "fade", "slide", "convex", "concave", "zoom"].includes(a["data-background-transition"]))
      attribs3.setValue("Background effect", ["none", "fade", "slide", "convex", "concave", "zoom"].indexOf(a["data-background-transition"]))
      else attribs4.setValue("Attributes", true);
    }
    else attribs3.setValue("Background transition", false);
    let attributes = "";
    for(let key in a) {
      attributes += key;
      if(a[key]) attributes += "=" + a[key];
      attributes += "\n";
    }
    attribs4.setValue("plain", attributes);
  }

  function updateIndex() {
    let media = presentation.querySelectorAll("img, video, source, audio, iframe");
    media.forEach((m) => {
      if(lazy) {
        if(m.hasAttribute("src")) {
          m.setAttribute("data-src", m.getAttribute("src"));
          m.removeAttribute("src");
        }
      }
      else {
        if(m.hasAttribute("data-src")) {
          m.setAttribute("src", m.getAttribute("data-src"));
          m.removeAttribute("data-src");
        }
      }
    })
    let config = Object.assign({}, props);
    delete config.theme;
    delete config.plain;
    delete config.properties;
    if(config.width == 960) delete config.width;
    if(config.height == 700) delete config.height;
    if(config.margin == 0.04) delete config.margin;
    if(config.minScale == 0.2) delete config.minScale;
    if(config.maxScale == 2) delete config.maxScale;
    if(config.controls == true) delete config.controls;
    if(config.progress == true) delete config.progress;
    if(config.slideNumber == false || config.slideNumber == "false") delete config.slideNumber;
    if(config.history == false) delete config.history;
    if(config.keyboard == true) delete config.keyboard;
    if(config.keyboardCondition == null) delete config.keyboardCondition;//function
    if(config.overview == true) delete config.overview;
    if(config.center == true) delete config.center;
    if(config.touch == true) delete config.touch;
    if(config.loop == false) delete config.loop;
    if(config.rtl == false) delete config.rtl;
    if(config.shuffle == false) delete config.shuffle;
    if(config.fragments == true) delete config.fragments;
    if(config.embedded == false) delete config.embedded;
    if(config.help == true) delete config.help;
    if(config.pause == true) delete config.pause;
    if(config.showNotes == false) delete config.showNotes;
    if(config.autoSlide == 0) delete config.autoSlide;
    if(config.autoSlideStoppable == true) delete config.autoSlideStoppable;
    if(config.autoSlideMethod == null) delete config.autoSlideMethod;//function
    if(config.mouseWheel == false) delete config.mouseWheel;
    if(config.rollingLinks == false) delete config.rollingLinks;
    if(config.hideAddressBar == true) delete config.hideAddressBar;
    if(config.previewLinks == false) delete config.previewLinks;
    if(config.postMessage == true) delete config.postMessage;
    if(config.postMessageEvents == false) delete config.postMessageEvents;
    if(config.focusBodyOnPageVisibilityChange == true) delete config.focusBodyOnPageVisibilityChange;
    if(config.transition == "slide") delete config.transition;
    if(config.transitionSpeed == "default") delete config.transitionSpeed;
    if(config.backgroundTransition == "fade") delete config.backgroundTransition;
    if(config.parallaxBackgroundImage == "") delete config.parallaxBackgroundImage;
    if(config.parallaxBackgroundSize == "") delete config.parallaxBackgroundSize;
    if(config.parallaxBackgroundHorizontal == null) delete config.parallaxBackgroundHorizontal;
    if(config.parallaxBackgroundVertical == null) delete config.parallaxBackgroundVertical;
    if(config.pdfMaxPagesPerSlide == Number.POSITIVE_INFINITY) delete config.pdfMaxPagesPerSlide;
    if(config.viewDistance == 3) delete config.viewDistance;
    let inner = "Reveal.initialize({";
    if(config.keyboardCondition) {
      inner += "keyboardCondition: " + config.keyboardCondition + ",";
      delete config.keyboardCondition;
    }
    if(config.autoSlideMethod) {
      inner += "autoSlideMethod" + config.autoSlideMethod + ",";
      delete config.autoSlideMethod;
    };
    if(Object.keys(config).length > 0) inner += JSON.stringify(config).slice(1, -1) + ",";
    inner += "\ndependencies: " + dependencies + "\n});"
    let script = presentation.querySelectorAll("script");
    script.forEach((s) => {if(s.innerHTML.includes("Reveal.initialize")) s.innerHTML = inner});
    let contents = window.beautify("<!doctype html><html>" + presentation.documentElement.innerHTML + "</html>", btfOpts);
    fs.writeFile(path.join(tempPath, "index.html"), contents, (err) => {
      if(err) dialog.showErrorBox("Couldn't write file", err.message);
    })
  }

//---------------------------------------  Functions  ------------------------------------

//---------------------------------------  Slides management  ----------------------------
  function changeSlide(h, v, movement) {
    if(firstTime) {
      if(remote.getGlobal("settings").fullscreen) win.setFullScreen(true);
      else if(remote.getGlobal("settings").maximized) win.maximize();
      else win.show();
      webview.style.visibility = "visible";
      controls.style.visibility = "visible";
      firstTime = false;
    }
    if(movement.left) moveLeftB.style.display = "block"; else moveLeftB.style.display = "none";
    if(movement.right) moveRightB.style.display = "block"; else moveRightB.style.display = "none";
    if(movement.up) moveUpB.style.display = "block"; else moveUpB.style.display = "none";
    if(movement.down) moveDownB.style.display = "block"; else moveDownB.style.display = "none";
    let hor = presentation.querySelectorAll(".slides>section");
    if(hor.length > 0) {
      let s;
      if(hor[h]) s = hor[h];
      else s = hor[0];
      let ver = s.querySelectorAll("section");
      if(ver.length > 0) {
        if(ver[v]) current = ver[v];
        else current = ver[0];
      }
      else current = s;
    }
    else {
      dialog.showErrorBox("No slide found.", err.message);
    }
  };

  function deleteSlide() {
    if(presentation.querySelectorAll("section").length == 1) return;
    let toDelete = current;
    let parentSection;
    if(toDelete.parentNode && toDelete.parentNode.tagName == "SECTION") parentSection = toDelete.parentNode;
    toDelete.remove();
    if(parentSection != null && parentSection.querySelectorAll("section").length == 1)
      parentSection.parentNode.replaceChild(parentSection.querySelector("section"), parentSection);
    notSaved(true);
    updateIndex();
    webview.send("delete")
  }

  function addSlideRight() {
    if(current.parentNode.tagName == "SECTION") current = current.parentNode;
    let newSection = document.createElement("section");
    current.parentNode.insertBefore(newSection, current.nextSibling);
    notSaved(true);
    updateIndex();
    webview.send("addRight")
  }

  function addSlideDown() {
    if(current.parentNode.tagName != "SECTION") {
      let newParent = document.createElement("section");
      current.parentNode.insertBefore(newParent, current.nextSibling);
      newParent.appendChild(current);
    }
    let newSection = document.createElement("section");
    current.parentNode.insertBefore(newSection, current.nextSibling);
    notSaved(true);
    updateIndex();
    webview.send("addDown")
  }

  function moveSlideLeft() {
    if(current.parentNode.tagName == "SECTION") current = current.parentNode;
    let other = current;
    do other = other.previousSibling;
      while (other && other.tagName != "SECTION");
    if(!other) return;
    let other_copy = other.cloneNode(true);
    current.parentNode.insertBefore(other_copy, current);
    other.parentNode.insertBefore(current, other);
    other.parentNode.replaceChild(other, other_copy);
    notSaved(true);
    updateIndex();
    webview.send("moveLeft")
  }

  function moveSlideRight() {
    if(current.parentNode.tagName == "SECTION") current = current.parentNode;
    let other = current;
    do other = other.nextSibling;
      while (other && other.tagName != "SECTION");
    if(!other) return;
    let other_copy = other.cloneNode(true);
    current.parentNode.insertBefore(other_copy, current);
    other.parentNode.insertBefore(current, other);
    other.parentNode.replaceChild(other, other_copy);
    notSaved(true);
    updateIndex();
    webview.send("moveRight")
  }

  function moveSlideUp() {
    if(current.parentNode.tagName != "SECTION") return;
    let other = current;
    do other = other.previousSibling;
      while (other && other.tagName != "SECTION");
    if(!other) return;
    let other_copy = other.cloneNode(true);
    current.parentNode.insertBefore(other_copy, current);
    other.parentNode.insertBefore(current, other);
    other.parentNode.replaceChild(other, other_copy);
    notSaved(true);
    updateIndex();
    webview.send("moveUp")
  }

  function moveSlideDown() {
    if(current.parentNode.tagName != "SECTION") return;
    let other = current;
    do other = other.nextSibling;
      while (other && other.tagName != "SECTION");
    if(!other) return;
    let other_copy = other.cloneNode(true);
    current.parentNode.insertBefore(other_copy, current);
    other.parentNode.insertBefore(current, other);
    other.parentNode.replaceChild(other, other_copy);
    notSaved(true);
    updateIndex();
    webview.send("moveDown")
  }

  function printPDF() {
    let newDoc = document.implementation.createHTMLDocument("");
    newDoc.documentElement.innerHTML = presentation.documentElement.innerHTML;
    newDoc.querySelector("#pdf").setAttribute("href", "css/print/pdf.css");
    let contents = "<!doctype html>\n<html>\n" + newDoc.documentElement.innerHTML + "\n</html>\n";
    fs.writeFile(path.join(tempPath, "print-pdf.html"), contents, (err) => {
      if(err) dialog.showErrorBox("Couldn't create print file", err.message);
      else {
        let pdfWindow = new BrowserWindow({width: 800, height: 560, show: false});
        pdfWindow.loadURL("file://" + path.join(tempPath, "print-pdf.html"));
        dialog.showSaveDialog(win, {title: "Save PDF", defaultPath: homePath, filters: [{name: "PDF files", extensions: ["pdf"]}]}, (fileName) => {
          if(fileName === undefined) pdfWindow.close();
          else {
            pdfWindow.webContents.printToPDF({printBackground: true, landscape: true}, (err, data) => {
              if (err) dialog.showErrorBox("Couldn't print", error.message);
              else {
                fs.writeFile(fileName, data, (err) => {
                  pdfWindow.close();
                  if(err) dialog.showErrorBox("Couldn't save file", err.message);
                })
              }
            })
          }
        })
      }
    })
  }

//---------------------------------------  Display management  ---------------------------
  function multiDisplay() {
    let scr = electron.screen.getPrimaryDisplay();
    let scrs = electron.screen.getAllDisplays();
    for(let s of scrs) {
      if(s.id != scr.id && (s.bounds.x != scr.bounds.x || s.bounds.y != scr.bounds.y)) {
        return true;
      }
    }
    return false;
  }

  function primaryDisplay() {
    return electron.screen.getPrimaryDisplay().bounds;
  }

  function secondaryDisplay() {
    let scr = electron.screen.getPrimaryDisplay();
    let scrs = electron.screen.getAllDisplays();
    let scr2;
    for(let s of scrs) {
      if(s.id != scr.id && (s.bounds.x != scr.bounds.x || s.bounds.y != scr.bounds.y)) {
        scr2 = s;
        break;
      }
    }
    return scr2.bounds;
  }

  function switchFullscreen(s) {
    let scr = s || primaryDisplay();
    win.setBounds(scr);
    win.setFullScreen(!win.isFullScreen());
    if(win.isFullScreen()) {
      controls.style.visibility = "hidden";
      if(multiDisplay()) {
        if(!BrowserWindow.getAllWindows()[1]) webview.sendInputEvent({type:"keyDown", keyCode:"s"});
        else {
          if(s) BrowserWindow.getAllWindows()[1].setBounds(primaryDisplay());
          else BrowserWindow.getAllWindows()[1].setBounds(secondaryDisplay());
        }
      }
    }
  }

  function switchFullscreen2() {
    if(multiDisplay()) switchFullscreen(secondaryDisplay());
    else dialog.showMessageBox(win, {type:"info", title: "Display", message: "There is only 1 display.", buttons: ["OK"]});
  }

//---------------------------------------  Files management  -----------------------------
  function newFilename(src) {
    return sanitize(path.basename(src).toLowerCase().replace(/ /g, "").replace(/\(/g, "").replace(/\)/g, ""));
  }

  function deleteTempFiles(callback) {
    function deleteTempFile(files, callback) {
      if(files.length == 0) callback();
      else fs.unlink(path.join(tempPath, files.pop()), (err) => {
        deleteTempFile(files, callback);
      })
    }
    fs.readdir(tempPath, (err, files) => {
      if(!err) {
        files.splice(files.indexOf("index.html"), 1);
        files.splice(files.indexOf("unreel.html"), 1);
        files.splice(files.indexOf("css"), 1);
        files.splice(files.indexOf("js"), 1);
        files.splice(files.indexOf("lib"), 1);
        files.splice(files.indexOf("plugin"), 1);
        deleteTempFile(files, callback);
      }
    })
  }

  function copyToTemp(file, newFile, callback) {
    function cp() {
      startWait();
      fs.copy(file, path.join(tempPath, newFile), (err) => {
        stopWait();
        if(err) dialog.showErrorBox("Couldn't copy file", err.message);
        else callback();
      })
    }
    fs.readdir(tempPath, (err, files) => {
      if(files.includes(newFile)) {
        dialog.showMessageBox(win, {type:"warning", title: "Warning", message: "File already exist. Overwrite?", detail: "If not, change filename.", buttons: ["No", "Yes"]}, (response) => {
          if(response == 1) cp();
        })
      }
      else cp();
    })
  }

  function mediaToTemp(src, newSrc, callback) {
    if(!(src.indexOf("http") == 0)) copyToTemp(src, newSrc, callback);
    else {
      let h;
      startWait();
      let file = fs.createWriteStream(path.join(tempPath, newSrc));
      if(src.includes("https")) h = https;
      else h = http;
      let request = h.get(src, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          stopWait();
          file.close();
          callback();
        })
      }).on("error", (err) => {
        stopWait();
        fs.unlink(newSrc);
        dialog.showErrorBox("Couldn't download file", err.message);
      })
    };
  };

  function insertMedia(src, range) {
    let el = null;
    switch (path.extname(src)) {
      case ".jpg": case ".jpeg": case ".png": case ".gif": case ".svg":
        el = "<img src=\"" + src + "\">";
        break;
      case ".mp4": case ".m4v": case ".ogv": case ".webm":
        el = "<video src=\"" + src + "\" controls>";
        break;
      case ".mp3": case ".ogg": case ".wav":
        el = "<audio src=\"" + src + "\" controls>";
        break;
    }
    if(el) {
      tinymce.activeEditor.selection.setRng(range);
      tinymce.activeEditor.insertContent(el);
    }
  }

//---------------------------------------  Misc  -----------------------------------------
  function hideEditor() {
    webview.send("stopEdit");
    tinymce.activeEditor.hide();
    mytextarea.style.display = "none";
    attributesPanel.style.display = "none";
    propertiesPanel.style.display = "none";
    editorControls.style.display = "none";
    editing = false;
    controls.style.display = "block";
  }

  function dataSrcToSrc(c) {
    let media = c.querySelectorAll("img[data-src], video[data-src], source[data-src], audio[data-src], iframe[data-src]");
    if(media.length > 0) {
      media.forEach((m) => {
        m.setAttribute("src", m.getAttribute("data-src"));
        m.removeAttribute("data-src");
      })
    }
    return c.innerHTML;
  }

  function attribToObj(attribs) {
    let output = {};
    if(attribs.length > 0) {
      for(let i = 0; i < attribs.length; i++) {
        output[attribs[i].name] = attribs[i].value;
      }
    }
    return output;
  }

  function startWait() {
    wait.style.visibility = "visible";
  }

  function stopWait() {
    wait.style.visibility = "hidden";
  }
};
