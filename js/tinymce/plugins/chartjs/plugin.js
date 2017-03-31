/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 2017 Caldas Lopes All rights reserved
 *
 * License: http://www.tinymce.com/license
 */

/*global tinymce:true */

tinymce.PluginManager.add('chartjs', function(editor, url) {

	function mapColors() {
		var i, colors = [], colorMap;
		colorMap = editor.settings.textcolor_map || [
			'000000', 'Black',	'993300', 'Burnt orange', '333300', 'Dark olive',
			'003300', 'Dark green', '003366', 'Dark azure', '000080', 'Navy Blue',
			'333399', 'Indigo', '333333', 'Very dark gray', '800000', 'Maroon',
			'FF6600', 'Orange', '808000', 'Olive', '008000', 'Green',
			'008080', 'Teal', '0000FF', 'Blue', '666699', 'Grayish blue',
			'808080', 'Gray', 'FF0000', 'Red', 'FF9900', 'Amber',
			'99CC00', 'Yellow green', '339966', 'Sea green', '33CCCC', 'Turquoise',
			'3366FF', 'Royal blue', '800080', 'Purple', '999999', 'Medium gray',
			'FF00FF', 'Magenta', 'FFCC00', 'Gold', 'FFFF00', 'Yellow',
			'00FF00', 'Lime', '00FFFF', 'Aqua', '00CCFF', 'Sky blue',
			'993366', 'Brown', 'C0C0C0', 'Silver', 'FF99CC', 'Pink',
			'FFCC99', 'Peach', 'FFFF99', 'Light yellow', 'CCFFCC', 'Pale green',
			'CCFFFF', 'Pale cyan', '99CCFF', 'Light sky blue', 'CC99FF', 'Plum',
			'FFFFFF', 'White'
		];
		for (i = 0; i < colorMap.length; i += 2) {
			colors.push({
				text: colorMap[i + 1],
				color: colorMap[i]
			});
		}
		return colors;
	}

	function renderColorPicker() {
		var ctrl = this, colors, color, html, last, rows, cols, x, y, i;
		colors = mapColors();
		html = '<table class="mce-grid mce-grid-border mce-colorbutton-grid" role="list" cellspacing="0"><tbody>';
		last = colors.length - 1;
		rows = editor.settings.textcolor_rows || 5;
		cols = editor.settings.textcolor_cols || 8;
		for (y = 0; y < rows; y++) {
			html += '<tr>';
			for (x = 0; x < cols; x++) {
				i = y * cols + x;
				if (i > last) {
					html += '<td></td>';
				} else {
					color = colors[i];
					html += (
						'<td><div id="' + ctrl._id + '-' + i + '" data-mce-color="' + color.color +
						'" role="option" tabIndex="-1" style="width: 10px; height: 10px; ' + (color ? 'background-color: #' + color.color : '') +
						'" title="' + color.text + '"></div></td>'
					);
				}
			}
			html += '</tr>';
		}
		html += '</tbody></table>';
		return html;
	}

	function createData() {
		let grid = [];
		let labels = [];
		labels.push({style: 'width: 200px; visibility: hidden', type: 'textbox', spacing: 0});
		for(let col = 0; col < 12; col++) labels.push({name: 'labels' + col, style: 'width: 28px', type: 'textbox', spacing: 0, onchange: dataChange});
		grid.push({type: 'container', label: 'Labels', layout: 'flex', direction: 'row', align: 'left', spacing: 0, items: labels});
		for(let row = 0; row < 8 ; row++) {
			let dataset = [];
			dataset.push({name: 'color' + row, value: mapColors()[16+row].color, style: 'width: 34px', type: 'colorbutton', text: 'C', spacing: 0, tooltip: 'Background color', panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick})
			dataset.push({name: 'trans' + row, style: 'width: 32px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange})
			dataset.push({name: 'bwidth' + row, style: 'width: 10px', type: 'textbox', spacing: 0, tooltip: 'Border width', onchange: dataChange});
			dataset.push({name: 'bcolor' + row, value: mapColors()[16+row].color, style: 'width: 34px', type: 'colorbutton', text: 'C', spacing: 0, tooltip: 'Border color', panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick})
			dataset.push({name: 'btrans' + row, style: 'width: 32px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange})
			dataset.push({name: 'label' + row, style: 'width: 40px', type: 'textbox', spacing: 0, tooltip: 'Label', onchange: dataChange});
			for(let col = 0; col < 12; col++) dataset.push({style: 'width: 28px; text-align: right', name: 'data' + row + col, type: 'textbox', spacing: 0, maxLength: 8, onchange: dataChange});
			grid.push({type: 'container', label: 'Data ' + (row + 1), layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: dataset});
		}
		return grid;
	}

	function createColor() {
		let grid = [];
		for(let row = 0; row < 8 ; row++) {
			let dataset = [];
			for(let col = 0; col < 12; col++)
				dataset.push({name: 'dataColorColor' + row + col, value: mapColors()[col].color, style: 'width: 34px', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
			dataset.push({name: 'dataColorTrans' + row, style: 'width: 32px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange});
			dataset.push({name: 'dataColor' + row, tooltip: 'Enabled', type: 'checkbox', checked: false, spacing: 0, style: 'margin: 4px', onclick: dataChange});
			grid.push({type: 'container', label: 'Data ' + (row + 1), layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: dataset});
		}
		return grid;
	}

	function createbColor() {
		let grid = [];
		for(let row = 0; row < 8 ; row++) {
			let dataset = [];
			for(let col = 0; col < 12; col++)
				dataset.push({name: 'databColorColor' + row + col, value: mapColors()[col].color, style: 'width: 34px', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
			dataset.push({name: 'databColorTrans' + row, style: 'width: 32px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange});
			dataset.push({name: 'databColor' + row, tooltip: 'Enabled', type: 'checkbox', checked: false, spacing: 0, style: 'margin: 4px', onclick: dataChange});
			grid.push({type: 'container', label: 'Data ' + (row + 1), layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: dataset});
		}
		return grid;
	}

	function createText() {
		let grid = [];
		let row = [];
		row.push({name: 'title', tooltip: 'Enabled', type: 'checkbox', checked: false, spacing: 2, onchange: dataChange});
		row.push({name: 'titleText', type: 'textbox', spacing: 0, tooltip: 'Text', onchange: dataChange});
		row.push({name: 'titleColor', value: "666666", style: 'width: 34px', tooltip: 'Color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'titleSize', type: 'textbox', style: 'width: 20px', spacing: 0, value: 12, tooltip: 'Size', onchange: dataChange});
		row.push({name: 'titlePosition', type: 'listbox', minWidth: 80, tooltip: 'Position', values: [
			{text: 'Top', value: 'top'},
			{text: 'Left', value: 'left'},
			{text: 'Bottom', value: 'bottom'},
			{text: 'Right', value: 'right'}
			],
			onchange: dataChange
		});
		grid.push({type: 'container', label: 'Title', layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: row});
		row = [];
		row.push({name: 'legend', tooltip: 'Enabled', type: 'checkbox', checked: true, spacing: 2, onchange: dataChange});
		row.push({name: 'legendColor', value: "666666", style: 'width: 34px', tooltip: 'Color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'legendSize', type: 'textbox', style: 'width: 20px', spacing: 0, value: 12, tooltip: 'Size', onchange: dataChange});
		row.push({name: 'legendPosition', type: 'listbox', minWidth: 80, tooltip: 'Position', values: [
			{text: 'Top', value: 'top'},
			{text: 'Left', value: 'left'},
			{text: 'Bottom', value: 'bottom'},
			{text: 'Right', value: 'right'}
			],
			onchange: dataChange
		});
		grid.push({type: 'container', label: 'Legend', layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: row});
		row = [];
		row.push({name: 'tooltips', tooltip: 'Enabled', type: 'checkbox', checked: true, spacing: 0, onchange: dataChange});
		row.push({name: 'tooltipsBackgroundColor', value: '000000', style: 'width: 34px', tooltip: 'Background color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'tooltipsBackgroundTrans', orientation: 'h', style: 'width: 34px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange});
		row.push({name: 'tooltipsFontColor', value: 'ffffff', style: 'width: 34px', tooltip: 'Text color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'tooltipsFontSize', type: 'textbox', style: 'width: 20px', spacing: 0, value: 12, tooltip: 'Size', onchange: dataChange});
		grid.push({type: 'container', label: 'Tooltips', layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: row});
		row = [];
		row.push({name: 'xAxesDisplay', tooltip: 'Enabled', type: 'checkbox', checked: true, spacing: 2, onchange: dataChange});
		row.push({name: 'xAxesStacked', tooltip: 'Stacked', type: 'checkbox', checked: false, spacing: 2, onchange: dataChange});
		row.push({name: 'xAxesGridLinesColor', value: '666666', style: 'width: 34px', tooltip: 'Axis color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'xAxesGridLinesTrans', style: 'width: 32px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange});
		row.push({name: 'xAxesGridLinesLineWidth', type: 'textbox', style: 'width: 20px', spacing: 0, tooltip: 'Line width', onchange: dataChange});
		row.push({name: 'xAxesGridLinesDisplay', tooltip: 'Grid enabled', type: 'checkbox', checked: true, spacing: 2, onchange: dataChange});
		row.push({name: 'xAxesScaleLabelDisplay', tooltip: 'Label', type: 'checkbox', checked: false, spacing: 2, onchange: dataChange});
		row.push({name: 'xAxesScaleLabelLabelString', type: 'textbox', spacing: 0, tooltip: 'Label text', onchange: dataChange});
		row.push({name: 'xAxesScaleLabelFontColor', value: '666666', style: 'width: 34px', tooltip: 'Label color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'xAxesScaleLabelFontSize', type: 'textbox', style: 'width: 20px', tooltip: 'Label size', spacing: 0, value: 12, onchange: dataChange});
		row.push({name: 'xAxesTicksFontColor', value: '666666', style: 'width: 34px', tooltip: 'Axis text color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'xAxesTicksFontSize', type: 'textbox', style: 'width: 20px', spacing: 0, value: 12, tooltip: 'Axis text size', onchange: dataChange});
		grid.push({type: 'container', label: 'X axis', layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: row});
		row = [];
		row.push({name: 'yAxesDisplay', tooltip: 'Enabled', type: 'checkbox', checked: true, spacing: 2, onchange: dataChange});
		row.push({name: 'yAxesStacked', tooltip: 'Stacked', type: 'checkbox', checked: false, spacing: 2, onchange: dataChange});
		row.push({name: 'yAxesGridLinesColor', value: '666666', style: 'width: 34px', tooltip: 'Axis color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'yAxesGridLinesTrans', style: 'width: 32px; height: 28px', type: 'slider', spacing: 0, tooltip: 'Opacity', minValue: 0, maxValue: 1, value: 1, ondragend: onSliderChange});
		row.push({name: 'yAxesGridLinesLineWidth', type: 'textbox', style: 'width: 20px', spacing: 0, tooltip: 'Line width', onchange: dataChange});
		row.push({name: 'yAxesGridLinesDisplay', tooltip: 'Grid enabled', type: 'checkbox', checked: true, spacing: 2, onchange: dataChange});
		row.push({name: 'yAxesScaleLabelDisplay', tooltip: 'Label', type: 'checkbox', checked: false, spacing: 2, onchange: dataChange});
		row.push({name: 'yAxesScaleLabelLabelString', type: 'textbox', spacing: 0, tooltip: 'Label text', onchange: dataChange});
		row.push({name: 'yAxesScaleLabelFontColor', value: '666666', style: 'width: 34px', tooltip: 'Label color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'yAxesScaleLabelFontSize', type: 'textbox', style: 'width: 20px', tooltip: 'Label size', spacing: 0, value: 12, onchange: dataChange});
		row.push({name: 'yAxesTicksFontColor', value: '666666', style: 'width: 34px', tooltip: 'Axis text color', type: 'colorbutton', text: 'C', spacing: 0, panel: {role: 'application', ariaRemember: true, html: renderColorPicker, onclick: onPanelClick}, onclick: onColorClick});
		row.push({name: 'yAxesTicksFontSize', type: 'textbox', style: 'width: 20px', spacing: 0, value: 12, tooltip: 'Axis text size', spacing: 0, onchange: dataChange});
		row.push({name: 'yAxesTicksBeginAtZero', label: 'Fill', type: 'checkbox', style: 'margin-left: 4px', tooltip: 'Begin at zero', checked: false, spacing: 0, onchange: dataChange});
		row.push({name: 'yAxesTicksMin', type: 'textbox', style: 'width: 20px; margin-left: 4px', spacing: 0, tooltip: 'Axis min', onchange: dataChange});
		row.push({name: 'yAxesTicksMax', type: 'textbox', style: 'width: 20px', spacing: 0, tooltip: 'Axis max', onchange: dataChange});
		row.push({name: 'yAxesTicksStepSize', type: 'textbox', style: 'width: 20px', spacing: 0, tooltip: 'Axis step', onchange: dataChange});
		grid.push({type: 'container', label: 'Y axis', layout: 'flex', direction: 'row', align: 'center', spacing: 0, items: row});
		return grid;
	}

	function onPanelClick(e) {
		var buttonCtrl = this.parent(), value;
		if ((value = e.target.getAttribute('data-mce-color'))) {
			if (this.lastId) document.getElementById(this.lastId).setAttribute('aria-selected', false);
			e.target.setAttribute('aria-selected', true);
			this.lastId = e.target.id;
			buttonCtrl.hidePanel();
			buttonCtrl.color('#' + value);
			buttonCtrl.value(value);
			dataChange();
		}
	}

	function onColorClick() {
		if(!this.panel || !this.panel.visible()) this.showPanel();
		else this.hidePanel();
	}

	function onSliderChange() {
		this.value(Math.round(this.value() * 10) / 10);
		dataChange()
	}

	function hexToRgba(hex, opacity) {
		return 'rgba(' + [(bigint = parseInt(hex, 16)) >> 16 & 255, bigint >> 8 & 255, bigint & 255, opacity].join() + ')';
	}

	function rgbaToHex(rgba) {
		rgba = rgba.substring(rgba.lastIndexOf('(')+1,rgba.lastIndexOf(')')).split(',');
    return ['' + ((1 << 24) + (Number(rgba[0]) << 16) + (Number(rgba[1]) << 8) + Number(rgba[2])).toString(16).slice(1), '' + Number(rgba[3])];
	}

	function dataChange() {
		let win = self.win;
		let mainData = {};
		let options = {}
		let labels = [];
		let datasets = [];
		for(let col = 0; col < 12; col++) {
			let l = win.find('#labels' + col).value();
			if(l != '') labels.push(l);
		}
		if(labels.length > 0) mainData.labels = labels;
		for(let row = 0; row < 8; row++) {
			let borderWidth = win.find('#bwidth' + row).value();
			let backgroundColor = hexToRgba(win.find('#color' + row).value(), win.find('#trans' + row).value());
			let borderColor = hexToRgba(win.find('#bcolor' + row).value(), win.find('#btrans' + row).value());
			let label = win.find('#label' + row).value();
			let data = [];
			let dataset = {}
			if(win.find('#dataColor' + row).checked()) backgroundColor = [];
			if(win.find('#databColor' + row).checked()) borderColor = [];
			for(let col = 0; col < 12; col++) {
				let d = win.find('#data' + row + col).value();
				if(!isNaN(d) && d.trim() != '') {
					data.push(Number(d));
					if(win.find('#dataColor' + row).checked()) backgroundColor.push(hexToRgba(win.find('#dataColorColor' + row + col).value(), win.find('#dataColorTrans' + row).value()));
					if(win.find('#databColor' + row).checked()) borderColor.push(hexToRgba(win.find('#databColorColor' + row + col).value(), win.find('#databColorTrans' + row).value()));
				}
			}
			if(data.length > 0) {
				dataset.data = data;
				dataset.label = label;
				if(!isNaN(borderWidth) && borderWidth.trim() != '') dataset.borderWidth = Number(borderWidth);
				dataset.backgroundColor = backgroundColor;
				dataset.borderColor = borderColor;
				datasets.push(dataset);
			}
		}
		if(win.find('#responsive').checked()) options.responsive = true;
		if(win.find('#title').checked()) {
			options.title = {}
			options.title.display = true;
			options.title.text = win.find('#titleText').value();
			options.title.fontColor = '#' + win.find('#titleColor').value();
			if(!isNaN(win.find('#titleSize').value()) && win.find('#titleSize').value().trim() != '') options.title.fontSize = Number(win.find('#titleSize').value());
			options.title.position = win.find('#titlePosition').value();
		}
		else delete options.title;
		options.legend = {}
		if(win.find('#legend').checked()) {
			options.legend.display = true;
			options.legend.position = win.find('#legendPosition').value();
			options.legend.labels = {};
			options.legend.labels.fontColor = '#' + win.find('#legendColor').value();
			if(!isNaN(win.find('#legendSize').value()) && win.find('#legendSize').value().trim() != '') options.legend.labels.fontSize = Number(win.find('#legendSize').value());
		}
		else options.legend.display = false;
		options.tooltips = {}
		if(win.find('#tooltips').checked()) {
			options.tooltips.enabled = true;
			options.tooltips.backgroundColor = hexToRgba(win.find('#tooltipsBackgroundColor').value(), win.find('#tooltipsBackgroundTrans').value());
			options.tooltips.titleFontColor = '#' + win.find('#tooltipsFontColor').value();
			options.tooltips.bodyFontColor = '#' + win.find('#tooltipsFontColor').value();
			options.tooltips.footerFontColor = '#' + win.find('#tooltipsFontColor').value();
			if(!isNaN(win.find('#tooltipsFontSize').value()) && win.find('#tooltipsFontSize').value().trim() != '') {
				options.tooltips.titleFontSize = Number(win.find('#tooltipsFontSize').value());
				options.tooltips.bodyFontSize = Number(win.find('#tooltipsFontSize').value()) - 2;
				options.tooltips.footerFontSize = Number(win.find('#tooltipsFontSize').value()) - 4;
			}
		}
		else options.tooltips.enabled = false;
		options.scales = {};
		options.scales.xAxes = [{}];
		options.scales.xAxes[0].scaleLabel = {};
		options.scales.xAxes[0].ticks = {};
		options.scales.xAxes[0].gridLines = {};
		options.scales.yAxes = [{}];
		options.scales.yAxes[0].scaleLabel = {};
		options.scales.yAxes[0].ticks = {};
		options.scales.yAxes[0].gridLines = {};
		options.scales.xAxes[0].display = win.find('#xAxesDisplay').checked();
		options.scales.yAxes[0].display = win.find('#yAxesDisplay').checked();
		options.scales.xAxes[0].stacked = win.find('#xAxesStacked').checked();
		options.scales.yAxes[0].stacked = win.find('#yAxesStacked').checked();
		options.scales.xAxes[0].gridLines.color = hexToRgba(win.find('#xAxesGridLinesColor').value(), win.find('#xAxesGridLinesTrans').value());
		options.scales.yAxes[0].gridLines.color = hexToRgba(win.find('#yAxesGridLinesColor').value(), win.find('#yAxesGridLinesTrans').value());
		if(!isNaN(win.find('#xAxesGridLinesLineWidth').value()) && win.find('#xAxesGridLinesLineWidth').value().trim() != '') options.scales.xAxes[0].gridLines.lineWidth = Number(win.find('#xAxesGridLinesLineWidth').value());
		if(!isNaN(win.find('#yAxesGridLinesLineWidth').value()) && win.find('#yAxesGridLinesLineWidth').value().trim() != '') options.scales.xAxes[0].gridLines.lineWidth = Number(win.find('#yAxesGridLinesLineWidth').value());
		options.scales.xAxes[0].gridLines.display = win.find('#xAxesGridLinesDisplay').checked();
		options.scales.yAxes[0].gridLines.display = win.find('#yAxesGridLinesDisplay').checked();
		options.scales.xAxes[0].scaleLabel.display = win.find('#xAxesScaleLabelDisplay').checked();
		options.scales.yAxes[0].scaleLabel.display = win.find('#yAxesScaleLabelDisplay').checked();
		options.scales.xAxes[0].scaleLabel.labelString = win.find('#xAxesScaleLabelLabelString').value();
		options.scales.yAxes[0].scaleLabel.labelString = win.find('#yAxesScaleLabelLabelString').value();
		options.scales.xAxes[0].scaleLabel.fontColor = '#' + win.find('#xAxesScaleLabelFontColor').value();
		options.scales.yAxes[0].scaleLabel.fontColor = '#' + win.find('#yAxesScaleLabelFontColor').value();
		if(!isNaN(win.find('#xAxesScaleLabelFontSize').value()) && win.find('#xAxesScaleLabelFontSize').value().trim() != '') options.scales.xAxes[0].scaleLabel.fontSize = Number(win.find('#xAxesScaleLabelFontSize').value());
		if(!isNaN(win.find('#yAxesScaleLabelFontSize').value()) && win.find('#yAxesScaleLabelFontSize').value().trim() != '') options.scales.yAxes[0].scaleLabel.fontSize = Number(win.find('#yAxesScaleLabelFontSize').value());
		options.scales.xAxes[0].ticks.fontColor = '#' + win.find('#xAxesTicksFontColor').value();
		options.scales.yAxes[0].ticks.fontColor = '#' + win.find('#yAxesTicksFontColor').value();
		if(!isNaN(win.find('#xAxesTicksFontSize').value()) && win.find('#xAxesTicksFontSize').value().trim() != '') options.scales.xAxes[0].ticks.fontSize = Number(win.find('#xAxesTicksFontSize').value());
		if(!isNaN(win.find('#yAxesTicksFontSize').value()) && win.find('#yAxesTicksFontSize').value().trim() != '') options.scales.yAxes[0].ticks.fontSize = Number(win.find('#yAxesTicksFontSize').value());
		options.scales.yAxes[0].ticks.beginAtZero = win.find('#yAxesTicksBeginAtZero').checked();
		if(!isNaN(win.find('#yAxesTicksMin').value()) && win.find('#yAxesTicksMin').value().trim() != '') options.scales.yAxes[0].ticks.min = Number(win.find('#yAxesTicksMin').value());
		if(!isNaN(win.find('#yAxesTicksMax').value()) && win.find('#yAxesTicksMax').value().trim() != '') options.scales.yAxes[0].ticks.max = Number(win.find('#yAxesTicksMax').value());
		if(!isNaN(win.find('#yAxesTicksStepSize').value()) && win.find('#yAxesTicksStepSize').value().trim() != '') options.scales.yAxes[0].ticks.stepSize = Number(win.find('#yAxesTicksStepSize').value());

		if(labels.length > 0) mainData.labels = labels;
		mainData.datasets = datasets;
		win.find('#code').value(window.beautify(JSON.stringify({data: mainData, options: options}), {format: 'json'}));
	}

	function getSelectedChart() {
		let e = editor.selection.getStart();
		if(e.tagName == 'DIV' && e.hasAttribute('data-chart')) return e;
		else return null;
	}

	editor.addButton('chartjs', {
		image: url + '/bar-chart.svg',
		tooltip: 'Insert/edit chart',
		onPostRender : function() { fragButton = this; },
		onclick: showDialog,
		stateSelector: 'div[data-chart]'
	});

	function showDialog() {
		let win = editor.windowManager.open({
			title: 'Insert/edit chart',
			width: 800,
			height: 460,
			body: [
				{
					type: 'container',
					label: 'Type',
					layout: 'flex',
					direction: 'row',
					align: 'center',
					spacing: 10,
					items: [
						{type: 'listbox', name: 'type', minWidth: 100, values: [
							{text: 'Line', value: 'line'},
							{text: 'Bar', value: 'bar'},
							{text: 'Radar', value: 'radar'},
							{text: 'Polar', value: 'polarArea'},
							{text: 'Pie', value: 'pie'},
							{text: 'Doughnut', value: 'doughnut'},
							{text: 'Bubble', value: 'bubble'}
						]},
						{type: 'label', text: 'Dimensions'},
						{name: 'width', type: 'textbox', maxLength: 5, size: 3},
						{type: 'label', text: 'x'},
						{name: 'height', type: 'textbox', maxLength: 5, size: 3},
						{name: 'responsive', text: 'Responsive', type: 'checkbox', checked: true, onchange: dataChange}
					]
				},
				{
					type: 'tabpanel',
					items: [
						{title: 'Data', type: 'form', spacing: 0, items: createData()},
						{title: 'Background color', type: 'form', spacing: 0, items: createColor()},
						{title: 'Border color', type: 'form', spacing: 0, items: createbColor()},
						{title: 'Options', type: 'form', spacing: 4, items: createText()},
						{title: 'Source code', type: 'form', items: [
							{type: 'textbox', name: 'code', multiline: true, minWidth: 720, minHeight: 340, spellcheck: false}
						]}
					]
				}
			],
			onsubmit: function(e) {
				let style = '';
				if(!isNaN(e.data.width) && e.data.width.trim() != '') style += 'width: ' + e.data.width + 'px';
				if(!isNaN(e.data.height) && e.data.height.trim() != '') {
					if(style != '') style += '; ';
					style += 'height: ' + e.data.height + 'px';
				}
				let chart = getSelectedChart();
				if(chart) {
					chart.setAttribute('data-chart', e.data.type);
					if(style != '') chart.style = style;
					chart.innerHTML = e.data.code;
				}
				else {
					if(style != '') style = ' style=\'' + style + '\'';
					editor.execCommand('insertHTML', false, '<div class=\'mceResizable mceNonEditable\' data-chart=\'' + e.data.type +'\''+ style + '\'>' + e.data.code + '</div>');
				}
			}
		});
		self.win = win;
		for(let row = 0; row < 8 ; row++) {
			win.find('#color' + row)[0].color('#' + win.find('#color' + row).value());
			win.find('#bcolor' + row)[0].color('#' + win.find('#bcolor' + row).value());
			for(let col = 0; col < 12 ; col++) {
				win.find('#dataColorColor' + row + col)[0].color('#' + win.find('#dataColorColor' + row + col).value());
				win.find('#databColorColor' + row + col)[0].color('#' + win.find('#databColorColor' + row + col).value());
			}
		}
		let chart = getSelectedChart();
		if(chart) {
			win.find('#type').value(chart.getAttribute('data-chart'));
			if(chart.style) {
				if(chart.style.width) win.find('#width').value(Number(chart.style.width.slice(0, -2)));
				if(chart.style.height) win.find('#height').value(Number(chart.style.height.slice(0, -2)));
			}
			let mainData = JSON.parse(chart.innerHTML);
			if(mainData.hasOwnProperty('options')) {
				if(mainData.options.hasOwnProperty('responsive')) win.find('#responsive').checked(mainData.options.responsive);
				if(mainData.options.hasOwnProperty('title')) {
					win.find('#title').checked(mainData.options.title);
					if(mainData.options.title.hasOwnProperty('text')) win.find('#titleText').value(mainData.options.title.text);
					if(mainData.options.title.hasOwnProperty('fontColor')) {
						win.find('#titleColor').value(mainData.options.title.fontColor.substring(1));
						win.find('#titleColor')[0].color(mainData.options.title.fontColor);
					}
					if(mainData.options.title.hasOwnProperty('fontSize')) win.find('#titleSize').value(mainData.options.title.fontSize);
					if(mainData.options.title.hasOwnProperty('position')) win.find('#titlePosition').value(mainData.options.title.position);
				}
				if(mainData.options.hasOwnProperty('legend')) {
					if(mainData.options.legend.hasOwnProperty('display')) win.find('#legend').checked(mainData.options.legend.display);
					if(mainData.options.legend.hasOwnProperty('position')) win.find('#legendPosition').value(mainData.options.legend.position);
					if(mainData.options.legend.hasOwnProperty('labels')) {
						if(mainData.options.legend.labels.hasOwnProperty('fontColor')) {
							win.find('#legendColor').value(mainData.options.legend.labels.fontColor.substring(1));
							win.find('#legendColor')[0].color(mainData.options.legend.labels.fontColor);
						}
						if(mainData.options.legend.labels.hasOwnProperty('fontSize')) win.find('#legendSize').value(mainData.options.legend.labels.fontSize);
					}
				}
				if(mainData.options.hasOwnProperty('tooltips')) {
					if(mainData.options.tooltips.hasOwnProperty('enabled')) win.find('#tooltips').checked(mainData.options.tooltips.enabled);
					if(mainData.options.tooltips.hasOwnProperty('backgroundColor')) {
						let c = rgbaToHex(mainData.options.tooltips.backgroundColor);
						win.find('#tooltipsBackgroundColor').value(c[0]);
						win.find('#tooltipsBackgroundColor')[0].color('#' + c[0]);
						win.find('#tooltipsBackgroundTrans').value(c[1]);
					}
					if(mainData.options.tooltips.hasOwnProperty('titleFontColor')) {
						win.find('#tooltipsFontColor').value(mainData.options.tooltips.titleFontColor.substring(1));
						win.find('#tooltipsFontColor')[0].color(mainData.options.tooltips.titleFontColor);
					}
					if(mainData.options.tooltips.hasOwnProperty('titleFontSize')) win.find('#tooltipsFontSize').value(mainData.options.tooltips.titleFontSize);
				}
				if(mainData.options.hasOwnProperty('scales')) {
					if(mainData.options.scales.hasOwnProperty('xAxes')) {
						if(mainData.options.scales.xAxes[0].hasOwnProperty('display')) win.find('#xAxesDisplay').checked(mainData.options.scales.xAxes[0].display);
						if(mainData.options.scales.xAxes[0].hasOwnProperty('stacked')) win.find('#xAxesStacked').checked(mainData.options.scales.xAxes[0].stacked);
						if(mainData.options.scales.xAxes[0].hasOwnProperty('scaleLabel')) {
							if(mainData.options.scales.xAxes[0].scaleLabel.hasOwnProperty('display')) win.find('#xAxesScaleLabelDisplay').checked(mainData.options.scales.xAxes[0].scaleLabel.display);
							if(mainData.options.scales.xAxes[0].scaleLabel.hasOwnProperty('labelString')) win.find('#xAxesScaleLabelLabelString').value(mainData.options.scales.xAxes[0].scaleLabel.labelString);
							if(mainData.options.scales.xAxes[0].scaleLabel.hasOwnProperty('fontColor')) {
								win.find('#xAxesScaleLabelFontColor').value(mainData.options.scales.xAxes[0].scaleLabel.fontColor.substring(1));
								win.find('#xAxesScaleLabelFontColor')[0].color(mainData.options.scales.xAxes[0].scaleLabel.fontColor);
							}
							if(mainData.options.scales.xAxes[0].scaleLabel.hasOwnProperty('fontSize')) win.find('#xAxesScaleLabelFontSize').value(mainData.options.scales.xAxes[0].scaleLabel.fontSize);
						}
						if(mainData.options.scales.xAxes[0].hasOwnProperty('ticks')) {
							if(mainData.options.scales.xAxes[0].ticks.hasOwnProperty('fontColor')) {
								win.find('#xAxesTicksFontColor').value(mainData.options.scales.xAxes[0].ticks.fontColor.substring(1));
								win.find('#xAxesTicksFontColor')[0].color(mainData.options.scales.xAxes[0].ticks.fontColor);
							}
							if(mainData.options.scales.xAxes[0].ticks.hasOwnProperty('fontSize')) win.find('#xAxesTicksFontSize').value(mainData.options.scales.xAxes[0].ticks.fontSize);
						}
						if(mainData.options.scales.xAxes[0].hasOwnProperty('gridLines')) {
							if(mainData.options.scales.xAxes[0].gridLines.hasOwnProperty('color')) {
								let c = rgbaToHex(mainData.options.scales.xAxes[0].gridLines.color);
								win.find('#xAxesGridLinesColor').value(c[0]);
								win.find('#xAxesGridLinesColor')[0].color('#' + c[0]);
								win.find('#xAxesGridLinesTrans').value(c[1]);
							}
							if(mainData.options.scales.xAxes[0].gridLines.hasOwnProperty('lineWidth')) win.find('#xAxesGridLinesLineWidth').value(mainData.options.scales.xAxes[0].gridLines.lineWidth);
							if(mainData.options.scales.xAxes[0].gridLines.hasOwnProperty('display')) win.find('#xAxesGridLinesDisplay').checked(mainData.options.scales.xAxes[0].gridLines.display);
						}
					}
					if(mainData.options.scales.hasOwnProperty('yAxes')) {
						if(mainData.options.scales.yAxes[0].hasOwnProperty('display')) win.find('#yAxesDisplay').checked(mainData.options.scales.yAxes[0].display);
						if(mainData.options.scales.yAxes[0].hasOwnProperty('stacked')) win.find('#yAxesStacked').checked(mainData.options.scales.yAxes[0].stacked);
						if(mainData.options.scales.yAxes[0].hasOwnProperty('scaleLabel')) {
							if(mainData.options.scales.yAxes[0].scaleLabel.hasOwnProperty('display')) win.find('#yAxesScaleLabelDisplay').checked(mainData.options.scales.yAxes[0].scaleLabel.display);
							if(mainData.options.scales.yAxes[0].scaleLabel.hasOwnProperty('labelString')) win.find('#yAxesScaleLabelLabelString').value(mainData.options.scales.yAxes[0].scaleLabel.labelString);
							if(mainData.options.scales.yAxes[0].scaleLabel.hasOwnProperty('fontColor')) {
								win.find('#yAxesScaleLabelFontColor').value(mainData.options.scales.yAxes[0].scaleLabel.fontColor.substring(1));
								win.find('#yAxesScaleLabelFontColor')[0].color(mainData.options.scales.yAxes[0].scaleLabel.fontColor);
							}
							if(mainData.options.scales.yAxes[0].scaleLabel.hasOwnProperty('fontSize')) win.find('#yAxesScaleLabelFontSize').value(mainData.options.scales.yAxes[0].scaleLabel.fontSize);
						}
						if(mainData.options.scales.yAxes[0].hasOwnProperty('ticks')) {
							if(mainData.options.scales.yAxes[0].ticks.hasOwnProperty('fontColor')) {
								win.find('#yAxesTicksFontColor').value(mainData.options.scales.yAxes[0].ticks.fontColor.substring(1));
								win.find('#yAxesTicksFontColor')[0].color(mainData.options.scales.yAxes[0].ticks.fontColor);
							}
							if(mainData.options.scales.yAxes[0].ticks.hasOwnProperty('fontSize')) win.find('#yAxesTicksFontSize').value(mainData.options.scales.yAxes[0].ticks.fontSize);
							if(mainData.options.scales.yAxes[0].ticks.hasOwnProperty('beginAtZero')) win.find('#yAxesTicksBeginAtZero').checked(mainData.options.scales.yAxes[0].ticks.beginAtZero);
							if(mainData.options.scales.yAxes[0].ticks.hasOwnProperty('min')) win.find('#yAxesTicksMin').value(mainData.options.scales.yAxes[0].ticks.min);
							if(mainData.options.scales.yAxes[0].ticks.hasOwnProperty('max')) win.find('#yAxesTicksMax').value(mainData.options.scales.yAxes[0].ticks.max);
							if(mainData.options.scales.yAxes[0].ticks.hasOwnProperty('stepSize')) win.find('#yAxesTicksStepSize').value(mainData.options.scales.yAxes[0].ticks.stepSize);
						}
						if(mainData.options.scales.yAxes[0].hasOwnProperty('gridLines')) {
							if(mainData.options.scales.yAxes[0].gridLines.hasOwnProperty('color')) {
								let c = rgbaToHex(mainData.options.scales.yAxes[0].gridLines.color);
								win.find('#yAxesGridLinesColor').value(c[0]);
								win.find('#yAxesGridLinesColor')[0].color('#' + c[0]);
								win.find('#yAxesGridLinesTrans').value(c[1]);
							}
							if(mainData.options.scales.yAxes[0].gridLines.hasOwnProperty('lineWidth')) win.find('#yAxesGridLinesLineWidth').value(mainData.options.scales.yAxes[0].gridLines.lineWidth);
							if(mainData.options.scales.yAxes[0].gridLines.hasOwnProperty('display')) win.find('#yAxesGridLinesDisplay').checked(mainData.options.scales.yAxes[0].gridLines.display);
						}
					}
				}
			}
			if(mainData.data) {
				if(mainData.data.labels) {
					for(let col = 0; col < mainData.data.labels.length; col++)
						if(col < 12) win.find('#labels' + col).value(mainData.data.labels[col]);
				}
				if(mainData.data.datasets) {
					for(let row = 0; row < mainData.data.datasets.length; row++) {
						if(mainData.data.datasets[row].label) win.find('#label' + row).value(mainData.data.datasets[row].label);
						if(mainData.data.datasets[row].borderWidth) {
								win.find('#bwidth' + row).value(mainData.data.datasets[row].borderWidth);
						}
						if(mainData.data.datasets[row].backgroundColor) {
							if(!Array.isArray(mainData.data.datasets[row].backgroundColor)) {
								let c = rgbaToHex(mainData.data.datasets[row].backgroundColor);
								win.find('#color' + row).value(c[0]);
								win.find('#color' + row)[0].color('#' + c[0]);
								win.find('#trans' + row).value(c[1]);
							}
							else win.find('#dataColor' + row).checked(true);
						}
						if(mainData.data.datasets[row].borderColor) {
							if(!Array.isArray(mainData.data.datasets[row].borderColor)) {
								let c = rgbaToHex(mainData.data.datasets[row].borderColor);
								win.find('#bcolor' + row).value(c[0]);
								win.find('#bcolor' + row)[0].color('#' + c[0]);
								win.find('#btrans' + row).value(c[1]);
							}
							else win.find('#databColor' + row)[0].checked(true);
						}
						if(mainData.data.datasets[row].data) {
							for(let col = 0; col < mainData.data.datasets[row].data.length; col++) {
								if(col < 12) win.find('#data' + row + col).value(mainData.data.datasets[row].data[col]);
								if(Array.isArray(mainData.data.datasets[row].backgroundColor)) {
									try {
										let c = rgbaToHex(mainData.data.datasets[row].backgroundColor[col]);
										win.find('#dataColorColor' + row + col).value(c[0]);
										win.find('#dataColorColor' + row + col)[0].color('#' + c[0]);
										win.find('#dataColorTrans' + row).value(c[1]);
									} catch(err) {};
								}
								if(Array.isArray(mainData.data.datasets[row].borderColor)) {
									try {
										let c = rgbaToHex(mainData.data.datasets[row].borderColor[col]);
										win.find('#databColorColor' + row + col).value(c[0]);
										win.find('#databColorColor' + row + col)[0].color('#' + c[0]);
										win.find('#databColorTrans' + row).value(c[1]);
									} catch(err) {};
								}
							}
						}
					}
				}
			}
			win.find('#code').value(window.beautify(chart.innerHTML, {format: 'json'}));
		}
	}
});
