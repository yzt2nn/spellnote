$.extend({
	spellnote: new function () {
		this.constant = function () {
			return {
				emptyPara: '<p><br></p>', // 空段落
				topLevelTagNameList: ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'], // 顶级标签名列表
				editorClassName: 'sn-editor', // 编辑器class
				colorUnitList: ['#000000', '<span class="sn-unit-foreColor-preview" style="background-color: #000000;"></span>',
					'#FFFFFF', '<span class="sn-unit-foreColor-preview" style="background-color: #FFFFFF;"></span>',
					'#FF0000', '<span class="sn-unit-foreColor-preview" style="background-color: #FF0000;"></span>',
					'#FF9C00', '<span class="sn-unit-foreColor-preview" style="background-color: #FF9C00;"></span>',
					'#FFFF00', '<span class="sn-unit-foreColor-preview" style="background-color: #FFFF00;"></span>',
					'#00FF00', '<span class="sn-unit-foreColor-preview" style="background-color: #00FF00;"></span>',
					'#00FFFF', '<span class="sn-unit-foreColor-preview" style="background-color: #00FFFF;"></span>',
					'#0000FF', '<span class="sn-unit-foreColor-preview" style="background-color: #0000FF;"></span>',
					'#9C00FF', '<span class="sn-unit-foreColor-preview" style="background-color: #9C00FF;"></span>',
					'#CE0000', '<span class="sn-unit-foreColor-preview" style="background-color: #CE0000;"></span>',
					'#E79439', '<span class="sn-unit-foreColor-preview" style="background-color: #E79439;"></span>',
					'#EFC631', '<span class="sn-unit-foreColor-preview" style="background-color: #EFC631;"></span>',
					'#6BA54A', '<span class="sn-unit-foreColor-preview" style="background-color: #6BA54A;"></span>',
					'#4A7B8C', '<span class="sn-unit-foreColor-preview" style="background-color: #4A7B8C;"></span>',
					'#3984C6', '<span class="sn-unit-foreColor-preview" style="background-color: #3984C6;"></span>',
					'#634AA5', '<span class="sn-unit-foreColor-preview" style="background-color: #634AA5;"></span>',
					'#E79C9C', '<span class="sn-unit-foreColor-preview" style="background-color: #E79C9C;"></span>',]
			};
		} ();

		this.rangeBuffer = undefined;

		this.tools = function () {
			var indexOf = function (list, ele) {
				/**
				 * 返回元素在数组中的位置，若没有，则返回-1
				 */
				var i = 0, len = list.length;
				for (; i < len; i++) {
					if (list[i] === ele)
						break;
				}
				return (i >= len) ? -1 : i;
			};

			return {
				indexOf: indexOf,
			};
		} ();

		this.funcs = function () {
			var $getUnits = function ($node) {
				return $node.find('.sn-unit');
			};

			var $getUnit = function ($node, unitName) {
				return $node.find('.sn-unit-name-' + unitName);
			};

			var $getEditor = function ($node) {
				return $node.find('.sn-editor');
			};

			var $getCodeEditor = function ($node) {
				return $node.find('.sn-code-editor');
			};

			var createSelection = function ($node) {
				var selection;
				if (document.selection && document.selection.createRange) {
					selection = document.selection;
				}
				else if (document.getSelection) {
					selection = document.getSelection();
				}
				else {
					selection = window.getSelection();
				}
				if (selection)
					return selection;
				else
					return null;
			};

			var createRange = function (isNew) {
				if (isNew)
					return new Range();
				var selection = this.createSelection();
				if (!selection)
					return null;
				var range;
				if (selection.rangeCount > 0)
					if (selection.getRangeAt)
						range = selection.getRangeAt(0);
					else {
						range = selection.createRange();
					}
				if (range) {
					return range;
				}
				else
					return null;
				return null;
			};

			var isEditable = function ($node, range) {
				var range = range == undefined ? this.createRange() : range;

			};

			var executeCommand = function (sCommand, args) {
				var args = args == undefined ? null : args;
				document.execCommand(sCommand, false, args);
			};

			var queryCommandState = function (sCommand, args) {
				try {
					return document.queryCommandState(sCommand);
				}
				catch (e) { };
			};

			var styleWithCSS = function ($node, callback) {
				// ***!!! 暂时废弃 !!!***
				document.execCommand("styleWithCSS", false, true);
				callback($node);
				document.execCommand("styleWithCSS", false, false);
			}

			/**
			 * 移除指定单元的所有状态类class，并添加指定状态类class，参数可以是($node, status, unitName)，也可以是($unit, status)
			 * @param {Object} $node
			 * @param {Object} unitName
			 */
			var switchUnitStatusClass = function ($node, status, unitName) {
				var $unit;
				if ($node.hasClass('sn-unit'))
					$unit = $node;
				else
					$unit = this.$getUnit($node, unitName);
				var unitName = $unit.data('name');
				var statusList = $.spellnote.units[unitName].statusList;
				for (var i = 0; i < statusList.length; i++)
					$unit.removeClass('sn-unit-status-' + statusList[i]);
				$unit.addClass('sn-unit-status-' + status);
			};

			var setUnitStatus = function ($node, status, unitName) {
				var $unit;
				if ($node.hasClass('sn-unit'))
					$unit = $node;
				else
					$unit = this.$getUnit($node, unitName);
				var currentStatus = $unit.data('status');
				var unitName = $unit.data('name');
				var unit = $.spellnote.units[unitName];
				var statusList = unit.statusList;
				var index = $.spellnote.tools.indexOf(statusList, status);
				if (currentStatus == index)
					return true;
				if (index >= 0) {
					$unit.data('status', index);
					this.switchUnitStatusClass($unit, status);
					return true;
				}
				else
					return false;
			};

			var getRangeOfCursorAtLast = function (node) {
				// 获取节点内，最后一个节点最后的光标range
				var endRange = $.spellnote.funcs.createRange(true);
				if (node.childNodes.length <= 0) {
					endRange.setEnd(node, 0);
					endRange.setStart(node, 0);
					return endRange;
				}
				var lastChildNode = node.childNodes[node.childNodes.length - 1];
				var lastNode, offset = 0;
				if (lastChildNode.nodeType == 3) {
					lastNode = lastChildNode;
					offset = lastNode.length;
				}
				else {
					nodeList = this.seekNodes(lastChildNode, null, null, true);
					nodeList = cleanNodes(nodeList, { tagNames: ['BR'] });
					if (nodeList.length == 0)
						lastNode = lastChildNode;
					else {
						lastNode = nodeList[nodeList.length - 1];
						if ($.spellnote.tools.indexOf($.spellnote.constant.topLevelTagNameList, lastNode.tagName) == -1) {
							lastNode = lastNode.nodeType == 3 ? lastNode : lastNode.parentNode;
							offset = lastNode.nodeType == 3 ? lastNode.length : lastNode.childNodes.length;
						}
					}
				}
				endRange.setEnd(lastNode, offset);
				endRange.setStart(lastNode, offset);
				return endRange;
			};

			var isCursorAtLast = function (node) {
				var currentRange = $.spellnote.funcs.createRange();
				if (currentRange.startContainer == node && node.childNodes == 0)
					return true;
				var endRange = this.getRangeOfCursorAtLast(node);
				if (this.isRangeEqual(currentRange, endRange))
					return true;
				return false;
			};

			var seekNodes = function (node, nodeType, result, isIncludeSelf) {
				//寻找节点下的所有节点，以数组形式返回
				var childNodes = node.childNodes;
				var len = childNodes.length;
				var result = result || new Array();
				if (isIncludeSelf) {
					if (nodeType ? childNodes[i].nodeType == nodeType : true)
						result.push(node);
				}
				if (len > 0)
					for (var i = 0; i < len; i++) {
						if (nodeType ? childNodes[i].nodeType == nodeType : true)
							result.push(childNodes[i]);
						this.seekNodes(childNodes[i], nodeType, result);
					}
				return result;
			};

			var cleanNodes = function (nodeList, keywordDict) {
				var resultList = new Array();
				for (var i = 0; i < nodeList.length; i++) {
					if (keywordDict.tagNames)
						if (nodeList[i].tagName && $.spellnote.tools.indexOf(keywordDict.tagNames, nodeList[i].tagName) > -1)
							continue;
					if (keywordDict.nodeTypes)
						if (nodeList[i].nodeType && keywordDict.nodeTypes == nodeList[i].nodeType)
							continue;
					resultList.push(nodeList[i]);
				}
				return resultList;
			};

			var setCursor = function (node, offset) {
				var range;
				var sel = $.spellnote.funcs.createSelection();
				if (offset == -1)
					range = this.getRangeOfCursorAtLast(node);
				else {
					range = $.spellnote.funcs.createRange();
					var childNodes = node.childNodes;
					range.setEnd(node, childNodes.length);
					range.setStart(node, childNodes.length);
				}
				sel.removeAllRanges();
				sel.addRange(range);
			};

			var saveRangeToBuffer = function () {
				var range = this.createRange();
				this.rangeBuffer = range;
			};

			var setRange = function (range) {
				// 设置range 若无参数默认从rangeBuffer中取
				var selection = this.createSelection();
				selection.removeAllRanges();
				if (!range && this.rangeBuffer)
					range = this.rangeBuffer
				if (range)
					selection.addRange(range);
			};

			var insertHtml = function ($node, html) {
				// 如果range是所属于指定编辑器的，则直接插入，若range与指定编辑器不一致，则在指定编辑器末尾插入

				var $editor = this.$getEditor($node);
				var range = this.createRange();
				var isChild = false;
				if (range) {
					// 分析range的宿主
					var t_node = range.commonAncestorContainer;

					while (t_node.tagName != 'HTML') {
						if (t_node.className == 'sn-editor-panel')
							break;
						t_node = t_node.parentNode;
					}

					if ($node[0] == t_node.parentNode)
						isChild = true;

				}
				if (!isChild)
					range = this.getRangeOfCursorAtLast($node.find('.' + $.spellnote.constant.editorClassName)[0]);
				this.setRange(range);
				$.spellnote.funcs.executeCommand('insertHtml', html);
			};

			var formatEditorHtml = function ($node) {
				// 格式化文本，消除div等不规范格式
				var $editor;
				if ($node.hasClass('sn-editor'))
					$editor = $node;
				else
					$editor = this.$getEditor($node);
				var childNodes = $editor[0].childNodes;
				if (childNodes.length == 0)
					this.insertHtml($node, $.spellnote.constant.emptyPara);
				for (var i = 0; i < childNodes.length; i++) {
					var node = childNodes[i];
					var $node = $(node);
					if (node.tagName == 'BR') {
						$node.remove();
						--i;
						continue;
					}
					if (node.tagName == 'DIV') {
						$node.replaceWith('<p>' + $node.html() + '</p>')
						continue;
					}
					if (!node.tagName || $.spellnote.tools.indexOf($.spellnote.constant.topLevelTagNameList, node.tagName) < 0)
						$node.wrap('<p>');
					else {
						if (node.childNodes.length > 1)
							$(node).children('br').remove();
					}
				}
			};

			var isRangeEqual = function (r1, r2) {
				if (r1.startContainer == r2.startContainer
					&& r1.startOffset == r2.startOffset
					&& r1.endContainer == r2.endContainer
					&& r1.endOffset == r2.endOffset)
					return true;
				return false;
			};

			return {
				$getUnits: $getUnits,
				$getUnit: $getUnit,
				$getEditor: $getEditor,
				$getCodeEditor: $getCodeEditor,
				createSelection: createSelection,
				createRange: createRange,
				isEditable: isEditable,
				executeCommand: executeCommand,
				queryCommandState: queryCommandState,
				switchUnitStatusClass: switchUnitStatusClass,
				setUnitStatus: setUnitStatus,
				formatEditorHtml: formatEditorHtml,
				setCursor: setCursor,
				isRangeEqual: isRangeEqual,
				setRange: setRange,
				saveRangeToBuffer: saveRangeToBuffer,
				insertHtml: insertHtml,
				seekNodes: seekNodes,
				cleanNodes: cleanNodes,
				isCursorAtLast: isCursorAtLast,
				getRangeOfCursorAtLast: getRangeOfCursorAtLast,
				styleWithCSS: styleWithCSS,
			};
		} ();

		this.units = {};

		this.$initSingleUnit = function ($node, name) {
			var $unit, unit;
			var self = this;
			unit = this.units[name];
			if (unit.init) {
				$unit = unit.init();
			}
			else {
				$unit = $('<button>').html(unit.title);
			}
			$unit.addClass('sn-unit').addClass('sn-unit-name-' + name)
				.data('event', unit.listenEvent == 'false' ? 'false' : 'true')
				.data('type', 'unit').data('name', name).data('status', 0);
			if (unit.statusList && unit.statusList[0])
				$unit.addClass('sn-unit-status-' + unit.statusList[0]);

			// 构造扩展列表
			if (unit.list) {
				var $list = $('<div class="sn-unit-expanding-list sn-unit-expanding-list-' + name + '" style="display: none;">');
				for (var i = 0; i < unit.list.length; i += 2) {
					var $item = $('<div class="sn-unit-expanding-list-item" data-value="' + unit.list[i] + '">');
					$item.html(unit.list[i + 1]);
					$list.append($item);
					$item.on('click', function () {
						$.spellnote.funcs.setRange();
						self.units[name].listClick($node, $(this).data('value'));
					});
				}
				if ($list.children.length > 0) {
					$node.append($list);
					$unit.addClass('sn-list-unit');
					var listHeight = $list.outerHeight();
					var listWidth = $list.outerWidth();
					$list.css({
						width: listWidth,
						height: listHeight,
					});
					$unit.on('click', function () {
						//暂存range
						$.spellnote.funcs.saveRangeToBuffer();

						// 先隐藏已经显示的非该项列表
						$('.sn-unit-expanding-list:not(.sn-unit-expanding-list-' + name + ')').hide();
						$('.sn-unit-list-active').removeClass('sn-unit-list-active');

						var $list = $('.sn-unit-expanding-list-' + name);
						if ($list.is(':hidden')) {
							var $this = $(this);

							var thisOffset = $this.offset();
							$list.css({
								left: thisOffset.left,
								top: thisOffset.top + $this.outerHeight() + 2,
							});
							$unit.addClass('sn-unit-list-active');
							$list.addClass('show');
							$list.slideDown(200);
							var listOffset = $list.offset();
							if (listOffset.left < 0)
								$list.css('left', 0);
							else if (listOffset.left + listWidth > $(window).width()) {
								$list.css('left', $(window).width() - listWidth - 5);
							}
						}
						else {
							$list.slideUp(200);
							$unit.removeClass('sn-unit-list-active');
							$list.removeClass('show');
						}
					});
				}
			}

			return $unit;
		};

		this.unitsInit = function ($node, nameList) {
			var $units = $('<div class="sn-unit-panel">');
			for (var i = 0; i < nameList.length; i++) {
				if (typeof (nameList[i]) == 'object') {
					var $unitGroup = $('<div>').addClass('sn-units-group');
					for (var j = 0; j < nameList[i].length; j++) {
						var $unit = this.$initSingleUnit($node, nameList[i][j]);
						$unitGroup.append($unit);
					}
					$units.append($unitGroup);
				}
				else {
					var $unit = this.$initSingleUnit($node, nameList[i]);
					$units.append($unit);
				}
			}
			$node.append($units);

			// 绑定按钮列表适时消失事件（滚动或点击空白处）
			$(document).on('scroll click', function (e) {
				var $target = $(e.target);
				if (!$target.hasClass('sn-unit-list-active')) {
					// 移除所有显示的按钮扩展列表
					$('.sn-unit-expanding-list.show').slideUp(200);
					$('.sn-unit-list-active').removeClass('sn-unit-list-active');
				}
			});
		};

		this.updateUnitsStatus = function ($node) {
			var $units = this.funcs.$getUnits($node);
			var units = this.units;
			var status, unit, unitName;
			var range = this.funcs.createRange();
			$units.each(function () {
				unitName = $(this).data('name');
				unit = units[unitName];
				if (unit.checkStatus) {
					status = unit.checkStatus(range);
					if (status)
						//该处可能增大性能损耗，为预定优化检查项
						$.spellnote.funcs.setUnitStatus($node, status, unitName);
				}
			});
		};

		this.insertHtml = function ($node, args) {
			$.spellnote.funcs.insertHtml($node, args[1]);
		};

		this.editorInit = function ($node) {
			var $editorPanel = $('<div class="sn-editor-panel">');
			var $editor = $('<div class="sn-editor">').attr({ contenteditable: true, spellcheck: false });
			var $codeEditor = $('<pre class="sn-code-editor">').attr('contenteditable', 'true').hide();
			$editor.html(this.constant.emptyPara);
			$editorPanel.append($editor).append($codeEditor);
			$node.append($editorPanel);
			$editor.on('mouseup', function (e) {
				e.stopPropagation();
				$.spellnote.updateUnitsStatus($node);
			}).on('keyup', function (e) {
				e.stopPropagation();
				if (e.keyCode == 13 || (e.keyCode == 8 && $editor[0].childNodes.length == 0))
					// 回车抬起，或退格至清空编辑器时，格式化文本
					$.spellnote.funcs.formatEditorHtml($node);
				if ((e.keyCode >= 37 && e.keyCode <= 40) || e.keyCode == 13 || e.keyCode == 8 || e.shiftKey)
					$.spellnote.updateUnitsStatus($node);
			}).on('keydown', function (e) {
				e.stopPropagation();
				//tab和空格
				if (e.keyCode == 32) {
					e.preventDefault();
					// $.spellnote.funcs.insertHtml($node, '&ensp;');
					$.spellnote.funcs.insertHtml($node, '&nbsp;');
				}
				if (e.keyCode == 9) {
					e.preventDefault();
					// $.spellnote.funcs.insertHtml($node, '&ensp;&ensp;&ensp;&ensp;');
					$.spellnote.funcs.insertHtml($node, '&nbsp;&nbsp;&nbsp;&nbsp;');
				}
			}).on('blur', function (e) {
				e.stopPropagation();
			});
		};

		this.triggerEvent = function ($node, e) {
			var $target = $(e.target);
			if ($target.data('event') === 'false')
				return;
			var type = $target.data('type');
			var name = $target.data('name');
			if (type == 'unit') {
				var statusList = this.units[name].statusList;
				if (statusList && statusList.length > 0) {
					var status = $target.data('status');
					var nextStatus = (status + 1) % statusList.length;
					if (this.units[name][e.type + '_' + statusList[nextStatus]])
						this.units[name][e.type + '_' + statusList[nextStatus]]($node, e);
					else
						return;
					$target.data('status', nextStatus);
					this.funcs.switchUnitStatusClass($target, statusList[nextStatus]);
				}
				else {
					this.units[name][e.type] ? this.units[name][e.type]($node, e) : undefined;
				}
			}
		};

		this.registeEventHandler = function ($node) {
			var self = this;
			$node.on('click change', function (e) {
				self.triggerEvent($node, e);
			});
		};

		this.init = function ($node, args) {
			var options = args[1];
			this.unitsInit($node, options.units);
			this.editorInit($node);
			this.registeEventHandler($node);
			$node.css({
				position: 'relative',
			});
		};

		this.enable = function ($node) {
			this.funcs.getEditor($node).attr('contenteditable', 'true');
		};

		this.disable = function ($node) {
			this.funcs.getEditor($node).attr('contenteditable', 'false');
		};
	},
});

/**
 * 预设单元 
 */
$.extend($.spellnote.units, function () {
	var code = {
		title: '查看代码',
		statusList: ['deactive', 'active'],
		click_active: function ($node) {
			var $editor = $.spellnote.funcs.$getEditor($node);
			var $codeEditor = $.spellnote.funcs.$getCodeEditor($node);
			$codeEditor.text($editor.html());
			$codeEditor.show();
		},
		click_deactive: function ($node) {
			var $editor = $.spellnote.funcs.$getEditor($node);
			var $codeEditor = $.spellnote.funcs.$getCodeEditor($node);
			$editor.html($codeEditor.text());
			$codeEditor.hide();
		},
	};

	var bold = {
		title: '加粗',
		statusList: ['deactive', 'active'],
		click_active: function ($node) {
			$.spellnote.funcs.executeCommand('bold');
		},
		click_deactive: function ($node) {
			$.spellnote.funcs.executeCommand('bold');
		},
		checkStatus: function () {
			if ($.spellnote.funcs.queryCommandState('bold'))
				return 'active';
			else
				return 'deactive';
		},
	};

	var italic = {
		title: '斜体',
		statusList: ['deactive', 'active'],
		click_active: function ($node) {
			$.spellnote.funcs.executeCommand('italic');
		},
		click_deactive: function ($node) {
			$.spellnote.funcs.executeCommand('italic');
		},
		checkStatus: function () {
			if ($.spellnote.funcs.queryCommandState('italic'))
				return 'active';
			else
				return 'deactive';
		},
	};


	var underline = {
		title: '下划线',
		statusList: ['deactive', 'active'],
		click_active: function ($node) {
			$.spellnote.funcs.executeCommand('underline');
		},
		click_deactive: function ($node) {
			$.spellnote.funcs.executeCommand('underline');
		},
		checkStatus: function () {
			if ($.spellnote.funcs.queryCommandState('underline'))
				return 'active';
			else
				return 'deactive';
		},
	};

	var strikeThrough = {
		title: '删除线',
		statusList: ['deactive', 'active'],
		click_active: function ($node) {
			$.spellnote.funcs.executeCommand('strikeThrough');
		},
		click_deactive: function ($node) {
			$.spellnote.funcs.executeCommand('strikeThrough');
		},
		checkStatus: function () {
			if ($.spellnote.funcs.queryCommandState('strikeThrough'))
				return 'active';
			else
				return 'deactive';
		},
	};

	var removeFormat = {
		title: '清除样式',
		click: function ($node) {
			$.spellnote.funcs.executeCommand('removeFormat');
			$.spellnote.updateUnitsStatus($node);
		},
	};

	var undo = {
		title: '撤销',
		click: function ($node) {
			$.spellnote.funcs.executeCommand('undo');
			$.spellnote.updateUnitsStatus($node);
		},
	};

	var redo = {
		title: '重做',
		click: function ($node) {
			$.spellnote.funcs.executeCommand('redo');
			$.spellnote.updateUnitsStatus($node);
		},
	};

	var fontSize = {
		title: '字体大小',
		list: [1, '<font size="1">Aa</font>',
			2, '<font size="2">Aa</font>',
			3, '<font size="3">Aa<span style="font-size: 12px;">(默认)<span></font>',
			4, '<font size="4">Aa</font>',
			5, '<font size="5">Aa</font>',
			6, '<font size="6">Aa</font>',
			7, '<font size="7">Aa</font>'],
		listClick: function ($node, value) {
			$.spellnote.funcs.executeCommand('fontSize', parseInt(value));
		},
	};

	var foreColor = {
		title: '字体颜色',
		list: $.spellnote.constant.colorUnitList,
		listClick: function ($node, value) {
			$.spellnote.funcs.executeCommand('foreColor', value);
		},
	};

	var backColor = {
		title: '背景颜色',
		list: $.spellnote.constant.colorUnitList,
		listClick: function ($node, value) {
			$.spellnote.funcs.executeCommand('backColor', value);
		},
	};

	var test = {
		title: '分割range',
		click: function ($node, e) {
			var range = $.spellnote.funcs.createRange();
			var nodes = $.spellnote.funcs.splitRangeToNodes(range);
			for (var i in nodes)
				console.log(nodes[i]);
		},
	};

	return {
		test: test,
		code: code,
		bold: bold,
		italic: italic,
		underline: underline,
		strikeThrough: strikeThrough,
		redo: redo,
		undo: undo,
		fontSize: fontSize,
		foreColor: foreColor,
		backColor: backColor,
		removeFormat: removeFormat,
	};
} ());

$.fn.extend({
	spellnote: function () {
		var $node = $(this);
		$.spellnote[arguments[0]]($node, arguments);
	},
});
