/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 2018 Caldas Lopes All rights reserved
 *
 * License: http://www.tinymce.com/license
 */

/*global tinymce:true */

tinymce.PluginManager.add("fragment", function(editor, url) {

	function getSelectedFragment() {
		return editor.dom.getParent(editor.selection.getStart(), ".fragment");
	}

	editor.addButton("fragment", {
		image: url + "/eye.svg",
		tooltip: "Insert/edit animation",
		onclick: showDialog,
		stateSelector: ".fragment"
	});

	editor.addButton("unfragment", {
		image: url + "/eye-slash.svg",
		tooltip: "Remove animation",
		onclick: function() {
			if(getSelectedFragment()) {
				let elm = getSelectedFragment();
				elm.removeAttribute("class");
				elm.removeAttribute("data-fragment-index");
			}
		},
		stateSelector: ".fragment"
	});

	function showDialog() {
		let win = editor.windowManager.open({
			title: "Insert/edit animation",
			width: 300,
			height: 200,
			body: [
				{type: "listbox", name: "transition", label: "Transition", values: [
					{text: "Grow", value: "grow"},
					{text: "Shrink", value: "shrink"},
					{text: "Fade", value: "fade-"},
					{text: "Highlight", value: "highlight-"},
					{text: "Highlight once", value: "highlight-current-"},
					{text: "Visible once", value: "current-visible"}
					],
					onselect: function() {
						win.find("#color").disabled(!this.value().includes("highlight"));
						win.find("#direction").disabled(!this.value().includes("fade"));
					},
				},
				{type: "listbox", name: "color", label: "Color", values: [
					{text: "Red", value: "red"},
					{text: "Green", value: "green"},
					{text: "Blue", value: "blue"}
					]
				},
				{type: "listbox", name: "direction", label: "Direction", values: [
					{text: "In", value: "in"},
					{text: "Out", value: "out"},
					{text: "Semi out", value: "semi-fade-out"},
					{text: "In then out", value: "in-then-out"},
					{text: "In then semi out", value: "in-then-semi-out"},
					{text: "Up", value: "up"},
					{text: "Down", value: "down"},
					{text: "Left", value: "left"},
					{text: "Right", value: "right"},
					]
				},
				{type: "textbox", name: "order", label: "Order"}
			],
			onsubmit: function(e) {
				let elm;
				if(getSelectedFragment()) elm = getSelectedFragment();
				else {
					if(editor.selection.getContent() != "") editor.execCommand('insertHTML', false, "<span class=\"fragment\">" + editor.selection.getContent() + "</span>");
					elm = editor.selection.getNode();
				}
				let transition = e.data.transition;
				if(transition == "fade-") transition += e.data.direction;
				if(e.data.direction == "semi-fade-out") transition = "semi-fade-out";
				if(transition.includes("highlight-")) transition += e.data.color;
				let order;
				if(Number.isInteger(parseInt(e.data.order))) order = parseInt(e.data.order);
				if(transition == "fade-in")	elm.className = "fragment";
				else elm.className = "fragment " + transition;
				if(order > 0) elm.setAttribute("data-fragment-index", order - 1);
				else elm.removeAttribute("data-fragment-index");
			}
		});
		let elm = getSelectedFragment();
		let transition = win.find("#transition");
		let color = win.find("#color");
		let direction = win.find("#direction");
		let order = win.find("#order");
		transition.value("fade-");
		direction.value("in");
		if(elm) {
			if(elm.className.includes("grow")) transition.value("grow");
			else if(elm.className.includes("shrink")) transition.value("shrink");
			else if(elm.className.includes("fade-")) {
				transition.value("fade-");
				if(elm.className.includes("fade-in-then-semi-out")) direction.value("in-then-semi-out");
				else if(elm.className.includes("fade-in-then-out")) direction.value("in-then-out");
				else if(elm.className.includes("semi-fade-out")) direction.value("semi-fade-out");
				else if(elm.className.includes("fade-in")) direction.value("in");
				else if(elm.className.includes("fade-out")) direction.value("out");
				else if(elm.className.includes("fade-up")) direction.value("up");
				else if(elm.className.includes("fade-down")) direction.value("down");
				else if(elm.className.includes("fade-left")) direction.value("left");
				else if(elm.className.includes("fade-right")) direction.value("right");
			}
			else if(elm.className.includes("highlight-")) {
				if(elm.className.includes("highlight-current-")) transition.value("highlight-current-");
				else transition.value("highlight-");
				if(elm.className.includes("-red")) color.value("red");
				else if(elm.className.includes("-green")) color.value("green");
				else if(elm.className.includes("-blue")) color.value("blue");
			}
			else if(elm.className.includes("current-visible")) transition.value("current-visible");
			let index = elm.getAttribute("data-fragment-index");
			if(Number.isInteger(parseInt(index))) order.value(parseInt(index) + 1);
		}
		color.disabled(!transition.value().includes("highlight"));
		direction.disabled(!transition.value().includes("fade"));
	}
});
