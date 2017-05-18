(function waitForReveal() {
  if(typeof Reveal !== "undefined"){

    const ipc = require("electron").ipcRenderer;

  //---------------------------------------  Initialize  -----------------------------------
    Reveal.sync();
    updateProps();
    ipc.sendToHost("slidechanged", 0, 0, Reveal.availableRoutes());

  //-------------------------------------- Events ------------------------------------------
    document.addEventListener("mouseover",(e) => {ipc.sendToHost("hover", e.target.nodeName);}, false);

    Reveal.addEventListener("slidechanged", (event) => {ipc.sendToHost("slidechanged", event.indexh, event.indexv, Reveal.availableRoutes());});

    Reveal.addEventListener("overviewshown", (event) => {ipc.sendToHost("overview", true);});

    Reveal.addEventListener("overviewhidden", (event) => {ipc.sendToHost("overview", false);});

    //-------------------------------------- Messages from main ----------------------------
    ipc.on("startEdit", (event, data) => {Reveal.getCurrentSlide().style.display = "none";});

    ipc.on("stopEdit", (event, data) => {
      Reveal.getCurrentSlide().style.display = "block";
      Reveal.sync();
    });

    ipc.on("updateContents", (event, data) => {
      Reveal.getCurrentSlide().innerHTML = data.html;
      RevealChart.initalizeCharts(Reveal.getCurrentSlide());
      Reveal.getCurrentSlide().querySelectorAll("pre>code").forEach((el) => {hljs.highlightBlock(el)});
      renderMathInElement(Reveal.getCurrentSlide(), {
  			delimiters: [
      		{left: '\\[', right: '\\]', display: true},
  				{left: '$$', right: '$$', display: true},
  				{left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false}
  			]
  		});
    });

    ipc.on("updateAttribs", (event, data) => {
      let current = Reveal.getCurrentSlide();
      while(current.attributes.length > 0) current.removeAttribute(current.attributes[0].name);
      for(let key in data) current.setAttribute(key, data[key]);
    });

    ipc.on("updateProps", (event, data) => {
      if(data.width) {
        document.querySelector("#theme").setAttribute("href","css/theme/" + data.theme + ".css");
        Reveal.configure({width: data.width});
        Reveal.configure({height: data.height});
        Reveal.configure({margin: data.margin});
        Reveal.configure({minScale: data.minScale});
        Reveal.configure({maxScale: data.maxScale});
        Reveal.configure({controls: data.controls});
        let o;
        if(data.slideNumber == "true") o = true;
        else if(data.slideNumber == "false") o = false;
        else o = data.slideNumber;
        Reveal.configure({slideNumber: o});
        Reveal.configure({progress: data.progress});
        Reveal.configure({showNotes: data.showNotes});
        Reveal.configure({transition: data.transition});
        Reveal.configure({backgroundTransition: data.backgroundTransition});
        Reveal.configure({transitionSpeed: data.transitionSpeed});
        Reveal.configure({center: data.center});
        Reveal.configure({loop: data.loop});
        Reveal.configure({pause: data.pause});
        Reveal.configure({fragments: data.fragments});
        Reveal.configure({shuffle: data.shuffle});
        Reveal.configure({autoSlide: data.autoSlide});
        Reveal.configure({autoSlideStoppable: data.autoSlideStoppable});
        if(data.parallaxBackgroundImage && data.parallaxBackgroundImage.trim() != "") {
          Reveal.configure({parallaxBackgroundImage: data.parallaxBackgroundImage});
          Reveal.configure({parallaxBackgroundSize: data.parallaxBackgroundSize});
          Reveal.configure({parallaxBackgroundHorizontal: data.parallaxBackgroundHorizontal});
          Reveal.configure({parallaxBackgroundVertical: data.parallaxBackgroundVertical});
        }
        else {
          Reveal.configure({parallaxBackgroundImage: ""});
          Reveal.configure({parallaxBackgroundSize: ""});
          Reveal.configure({parallaxBackgroundHorizontal: null});
          Reveal.configure({parallaxBackgroundVertical: null});
        }
      }
      else {
        let props;
        try {
          props = JSON.parse(data);
          for(let key in props) Reveal.configure({[key]: props[key]});
        } catch (ex) {console.error(ex);}
      }
      updateProps();
    });

    ipc.on("delete", (event, data) => {
      if(Reveal.getTotalSlides() == 1) return;
      let toDelete = Reveal.getCurrentSlide();
      if(Reveal.isLastSlide()) Reveal.prev()
      else Reveal.next();
      let parentSection;
      if(toDelete.parentNode && toDelete.parentNode.tagName == "SECTION") parentSection = toDelete.parentNode;
      toDelete.remove();
      if(parentSection != null && parentSection.querySelectorAll("section").length == 1)
        parentSection.parentNode.replaceChild(parentSection.querySelector("section"), parentSection);
      Reveal.sync();
      ipc.sendToHost("slidechanged", Reveal.getIndices().h, Reveal.getIndices().v, Reveal.availableRoutes());
    });

    ipc.on("addRight", (event, data) => {
      let current = Reveal.getCurrentSlide();
      if(current.parentNode.tagName == "SECTION") current = current.parentNode;
      let newSection = document.createElement("section");
      newSection.className = "future";
      current.parentNode.insertBefore(newSection, current.nextSibling);
      Reveal.right();
      Reveal.sync();
    });

    ipc.on("addDown", (event, data) => {
      let current = Reveal.getCurrentSlide();
      if(current.parentNode.tagName != "SECTION") {
        let newParent = document.createElement("section");
        newParent.className = "stack present";
        current.parentNode.insertBefore(newParent, current.nextSibling);
        newParent.appendChild(current);
      }
      let newSection = document.createElement("section");
      newSection.className = "future";
      current.parentNode.insertBefore(newSection, current.nextSibling);
      Reveal.down();
      Reveal.sync();
    });

    ipc.on("moveLeft", (event, data) => {
      let current = Reveal.getCurrentSlide();
      if(current.parentNode.tagName == "SECTION") current = current.parentNode;
      let other = current;
      do other = other.previousSibling;
        while (other && other.tagName != "SECTION");
      if(!other) return;
      let other_copy = other.cloneNode(true);
      current.parentNode.insertBefore(other_copy, current);
      other.parentNode.insertBefore(current, other);
      other.parentNode.replaceChild(other, other_copy);
      Reveal.left();
      Reveal.sync();
    });

    ipc.on("moveRight", (event, data) => {
      let current = Reveal.getCurrentSlide();
      if(current.parentNode.tagName == "SECTION") current = current.parentNode;
      let other = current;
      do other = other.nextSibling;
        while (other && other.tagName != "SECTION");
      if(!other) return;
      let other_copy = other.cloneNode(true);
      current.parentNode.insertBefore(other_copy, current);
      other.parentNode.insertBefore(current, other);
      other.parentNode.replaceChild(other, other_copy);
      Reveal.right();
      Reveal.sync();
    });

    ipc.on("moveUp", (event, data) => {
      let current = Reveal.getCurrentSlide();
      if(current.parentNode.tagName != "SECTION") return;
      let other = current;
      do other = other.previousSibling;
        while (other && other.tagName != "SECTION");
      if(!other) return;
      let other_copy = other.cloneNode(true);
      current.parentNode.insertBefore(other_copy, current);
      other.parentNode.insertBefore(current, other);
      other.parentNode.replaceChild(other, other_copy);
      Reveal.up();
      Reveal.sync();
    });

    ipc.on("moveDown", (event, data) => {
      let current = Reveal.getCurrentSlide();
      if(current.parentNode.tagName != "SECTION") return;
      let other = current;
      do other = other.nextSibling;
        while (other && other.tagName != "SECTION");
      if(!other) return;
      let other_copy = other.cloneNode(true);
      current.parentNode.insertBefore(other_copy, current);
      other.parentNode.insertBefore(current, other);
      other.parentNode.replaceChild(other, other_copy);
      Reveal.down();
      Reveal.sync();
    });

  //-------------------------------------- Functions ---------------------------------------
    function updateProps() {
      let p = Reveal.getConfig();
      p.theme = document.querySelector("#theme").getAttribute("href");
      ipc.sendToHost("updateProps", p);
    }
  }
  else {
    setTimeout(waitForReveal, 250);
  }
})();
