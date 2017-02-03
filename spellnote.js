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
		}();

		this.snObjs = new Object();

		this.rangeBuffer = undefined;

		this.docScrollTop = undefined;

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

			var getRandomStr = function (len) {
				var result = '';
				len = len || 8;
				var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
				for (var i = 0; i < len; i++) {
					result += chars[Math.floor(Math.random() * 51)];
				}
				return result;
			};

			var scrollToTop = function ($ele, duration) {
				duration = duration || 300;
				var top = $ele.offset().top;
				var winHeight = $(window).height();
				$('html,body').animate({
					scrollTop: top,
				}, duration);
			};

			return {
				indexOf: indexOf,
				getRandomStr: getRandomStr,
				scrollToTop: scrollToTop,
			};
		}();

		this.funcs = function () {
			var $getUnits = function ($node) {
				return $node.find('.sn-unit');
			};

			var $getUnit = function ($node, unitName) {
				return $node.find('.sn-unit-name-' + unitName);
			};

			var $getUnitPanel = function ($node) {
				return $node.find('.sn-unit-panel');
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
				if (isNew) {
					try {
						return new Range();
					}
					catch (ex) {
						return selection.createRange();
					}
				}
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
				$.spellnote.rangeBuffer = range;
			};

			var setRange = function (range) {
				// 设置range 若无参数默认从rangeBuffer中取
				var selection = this.createSelection();
				selection.removeAllRanges();
				if (!range && $.spellnote.rangeBuffer)
					range = $.spellnote.rangeBuffer
				if (range)
					selection.addRange(range);
			};

			var isRangeBelongTo = function ($node, range) {
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
				return isChild;
			};

			var getRangeBelongTo = function ($node) {
				// 如果range是所属于指定编辑器的，则直接返回，若range与指定编辑器不一致，则返回指定编辑器的末尾range
				var $editor = this.$getEditor($node);
				var range = this.createRange();
				var isChild = this.isRangeBelongTo($node, range);
				if (!isChild) {
					range = $.spellnote.rangeBuffer;
					isChild = this.isRangeBelongTo($node, range)
				}
				if (!isChild)
					range = this.getRangeOfCursorAtLast($node.find('.' + $.spellnote.constant.editorClassName)[0]);
				return range;
			};

			var insertHtml = function ($node, html) {
				var range = this.getRangeBelongTo($node);
				this.setRange(range);
				$.spellnote.funcs.executeCommand('insertHtml', html);
			};

			var insertNode = function ($node, newNode) {
				var range = this.getRangeBelongTo($node);
				this.setRange(range);
				range.insertNode(newNode);
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

			var showModal = function ($node, obj) {
				// 显示前先存储range
				this.saveRangeToBuffer();
				// 储存页面滚动位置
				if (!$.spellnote.docScrollTop)
					$.spellnote.docScrollTop = $(document).scrollTop();

				var $unitPanel = this.$getUnitPanel($node);
				$unitPanel.css('top', 0);

				var title = obj['title'] || 'Modal';
				var contentHtml = obj['contentHtml'] || 'There is nothing.';
				var buttonText = obj['buttonText'] || 'OK'
				var callback = obj['callback'] || function () { };
				var autoClose = obj['autoClose'] === undefined ? false : obj['autoClose'];

				var $otherModal = $node.find('.sn-modal');
				if ($otherModal.length > 0) {
					$otherModal.find('.sn-modal-button-bar').off();
					$otherModal.find('.sn-modal-close-button').off();
					$otherModal.slideUp(50, function () {
						$otherModal.remove();
					});
				}

				var $modal = $('<div class="sn-modal"></div>');
				var $title = $('<div class="sn-modal-title">' + title + '</div>');
				var $content = $('<div class="sn-modal-content">' + contentHtml + '</div>');
				var $buttonBar = $('<div class="sn-modal-button-bar">' + buttonText + '</div>');
				var $closeButton = $('<div class="sn-modal-close-button icon-cancel"></div>');
				$closeButton.on('click', function () {
					$modal.slideUp(50, function () {
						$(this).off();
						$buttonBar.off();
						$modal.remove();

						$node.find('.sn-editor-panel').slideDown(100, function () {
							$(document).scrollTop($.spellnote.docScrollTop);
							$.spellnote.docScrollTop = undefined;
						});
					});
				});
				$buttonBar.on('click', function () {
					callback($modal, function () { $closeButton.click() });
				});
				$modal.append($title).append($content).append($buttonBar).append($closeButton);
				$modal.insertBefore($node.find('.sn-editor-panel'));

				$node.find('.sn-editor-panel').slideUp(50, function () {
					$modal.slideDown(100);
					$.spellnote.tools.scrollToTop($node);
				});

			};

			var showTip = function ($node, content, type, autoHide, duration) {
				// 先消除之前的提示
				var otherTip = $node.find('.sn-tip');
				if (otherTip.length > 0) {
					otherTip.find('.sn-tip-close-button').off();
					otherTip.remove();
				}

				autoHide = autoHide === undefined ? true : autoHide;
				duration = duration || 5000;
				type = type || 'warning';
				content = content || 'This is a tip!';
				var $tip = $('<div class="sn-tip"></div>');
				var $tipIcon = $('<span class="sn-tip-icon icon-attention-circled"></span>');
				$tipIcon.addClass(type);
				var $tipContent = $('<span class="sn-tip-content">' + content + '</span>');
				var $tipCloseButton = $('<div class="sn-tip-close-button icon-cancel"></div>');
				$tip.append($tipIcon).append($tipContent).append($tipCloseButton);
				$tipCloseButton.on('click', function () {
					$(this).off();
					$tip.slideUp(200, function () {
						$tip.remove();
					});
				});

				$tip.insertAfter($node.find('.sn-unit-panel'));
				$tip.slideDown(200);

				if (autoHide) {
					setTimeout(function () {
						$tipCloseButton.click();
					}, duration);
				}
			};

			var getSnObj = function ($node) {
				var id = $node.data('snid');
				if ($.spellnote.snObjs[id])
					return $.spellnote.snObjs[id];
				else
					return undefined;
			};

			return {
				$getUnits: $getUnits,
				$getUnit: $getUnit,
				$getUnitPanel: $getUnitPanel,
				$getEditor: $getEditor,
				$getCodeEditor: $getCodeEditor,
				getSnObj: getSnObj,
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
				insertNode: insertNode,
				insertHtml: insertHtml,
				seekNodes: seekNodes,
				cleanNodes: cleanNodes,
				isCursorAtLast: isCursorAtLast,
				getRangeOfCursorAtLast: getRangeOfCursorAtLast,
				styleWithCSS: styleWithCSS,
				showModal: showModal,
				isRangeBelongTo: isRangeBelongTo,
				getRangeBelongTo: getRangeBelongTo,
				showTip: showTip,
			};
		}();

		this.units = {};

		this.$initSingleUnit = function ($node, name) {
			var $unit, unit;
			var self = this;
			unit = this.units[name];
			if (unit.init) {
				$unit = unit.init();
			}
			else {
				if (unit.iconClass) {
					$unit = $('<button>').addClass(unit.iconClass);
					if (unit.title)
						$unit.attr('title', unit.title);
				}
				else
					$unit = $('<button>').text(unit.title);
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
						$.spellnote.funcs.setRange($.spellnote.rangeBuffer);
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
								top: thisOffset.top + $this.outerHeight() - $(document).scrollTop() + 2,
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

			var snObj = $.spellnote.funcs.getSnObj($node);

			// 绑定按钮列表适时消失事件（滚动或点击空白处）
			$(document).on('scroll click', function (e) {
				var $target = $(e.target);
				if (!$target.hasClass('sn-unit-list-active')) {
					// 移除所有显示的按钮扩展列表
					$('.sn-unit-expanding-list.show').slideUp(200);
					$('.sn-unit-list-active').removeClass('sn-unit-list-active');
				}

				// 绑定unit panel 到顶悬停事件
				if (snObj.unitsScrollTimeout) {
					clearTimeout(snObj.unitsScrollTimeout);
					snObj.unitsScrollTimeout = undefined;
				}

				snObj.unitsScrollTimeout = setTimeout(function () {
					var range = $.spellnote.funcs.createRange();
					if ($.spellnote.funcs.isRangeBelongTo($node, range)) {
						// 把当前range所属的编辑器工具栏置顶
						var nodeOffsetTop = $node.offset().top;
						var scrollTop = $(document).scrollTop();
						$units.stop();
						if (scrollTop > nodeOffsetTop)
							$units.animate({ 'top': scrollTop - nodeOffsetTop }, 200);
						else
							$units.animate({ 'top': 0 }, 200);
					}
					else
						$units.animate({ 'top': 0 }, 200);
				}, 300);

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

		this.insertNode = function ($node, args) {
			$.spellnote.funcs.insertNode($node, args[1]);
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

			return $editor;
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

			// 新建编辑器对象
			var snObj = new Object();
			snObj['$node'] = $node;
			snObj['rangeBuffer'] = undefined;
			snObj['callback'] = options['callback'] || new Object();
			var id = $.spellnote.tools.getRandomStr();
			$node.data('snid', id);
			snObj['id'] = id;
			$.spellnote.snObjs[id] = snObj;

			this.unitsInit($node, options.units);
			var $editor = this.editorInit($node);
			this.registeEventHandler($node);
			$node.css({
				position: 'relative',
				maxWitdh: options['maxWidth'],
				width: options['width'],
			});
			$editor.css({
				maxHeight: options['maxHeight'],
				height: options['height'],
			});

			if (options['cleanHtmlOnPaste']) {
				$editor.on('paste', function (e) {
					e.preventDefault ? e.preventDefault() : (e.returnValue = false);
					var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text/plain');
					document.execCommand("insertText", false, bufferText);
				});
			}
		};

		this.enable = function ($node) {
			this.funcs.getEditor($node).attr('contenteditable', 'true');
		};

		this.disable = function ($node) {
			this.funcs.getEditor($node).attr('contenteditable', 'false');
		};

		this.html = function ($node, args) {
			var html = args.length > 1 ? args[1] : undefined;
			if (html) {
				$.spellnote.funcs.$getEditor($node).html(html);
				$.spellnote.funcs.formatEditorHtml($node);
			}
			else {
				$.spellnote.funcs.formatEditorHtml($node);
				return $.spellnote.funcs.$getEditor($node).html();
			}
		};

		this.tip = function ($node, args) {
			var content = '';
			if (typeof(args[1]) === 'string') {
				content = args[1];
				$.spellnote.funcs.showTip($node, content);
			}
			else {
				var options = args[1];
				content = options['content'];
				var type = options['type'];
				var autoHide = options['autoHide'];
				var duration = options['duration'];
				$.spellnote.funcs.showTip($node, content, type, autoHide, duration);
			}
		}
	},
});

/**
 * 预设单元 
 */
$.extend($.spellnote.units, function () {
	var code = {
		title: '查看代码',
		iconClass: 'icon-code',
		statusList: ['deactive', 'active'],
		click_active: function ($node) {
			var $editor = $.spellnote.funcs.$getEditor($node);
			var $codeEditor = $.spellnote.funcs.$getCodeEditor($node);
			$codeEditor.text($editor.html());
			$editor.slideUp(100, function () {
				$codeEditor.slideDown(300);
				$.spellnote.tools.scrollToTop($node);
			});
		},
		click_deactive: function ($node) {
			var $editor = $.spellnote.funcs.$getEditor($node);
			var $codeEditor = $.spellnote.funcs.$getCodeEditor($node);
			$editor.html($codeEditor.text());
			$codeEditor.slideUp(100, function () {
				$editor.slideDown(300);
			});
		},
	};

	var bold = {
		title: '加粗',
		iconClass: 'icon-bold',
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
		iconClass: 'icon-italic',
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
		iconClass: 'icon-underline',
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
		iconClass: 'icon-strike',
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
		iconClass: 'icon-eraser',
		click: function ($node) {
			$.spellnote.funcs.executeCommand('removeFormat');
			$.spellnote.updateUnitsStatus($node);
		},
	};

	var undo = {
		title: '撤销',
		iconClass: 'icon-ccw',
		click: function ($node) {
			$.spellnote.funcs.executeCommand('undo');
			$.spellnote.updateUnitsStatus($node);
		},
	};

	var redo = {
		title: '重做',
		iconClass: 'icon-cw',
		click: function ($node) {
			$.spellnote.funcs.executeCommand('redo');
			$.spellnote.updateUnitsStatus($node);
		},
	};

	var fontSize = {
		title: '字体大小',
		iconClass: 'icon-text-height',
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
		iconClass: 'icon-font',
		list: $.spellnote.constant.colorUnitList,
		listClick: function ($node, value) {
			$.spellnote.funcs.executeCommand('foreColor', value);
		},
	};

	var backColor = {
		title: '背景颜色',
		iconClass: 'icon-font-reverse',
		list: $.spellnote.constant.colorUnitList,
		listClick: function ($node, value) {
			$.spellnote.funcs.executeCommand('backColor', value);
		},
	};

	var video = {
		title: '插入视频',
		iconClass: 'icon-video',
		click: function ($node, e) {
			$.spellnote.funcs.showModal($node, {
				title: '插入视频',
				contentHtml: '<div><p>视频链接:<p><input class="sn-input sn-video-input" type="text" /></div><p>请输入视频的网址，目前仅支持bilibili视频。</p>',
				buttonText: '确认',
				callback: function ($modal, close) {
					var url = $modal.find('.sn-video-input').val();
					var biliRegExp = /bilibili.com\/video\/av([0-9]+)(\/index_([0-9]+).html)?/;
					var biliMatch = url.match(biliRegExp);

					var $video;

					if (biliMatch) {
						$video = $('<iframe>')
							.attr('src', 'http://static.hdslb.com/miniloader.swf?aid=' + biliMatch[1] + '&page=' + (biliMatch[3] == undefined ? '1' : biliMatch[3]))
							.attr({ 'height': 415, 'width': 544, 'frameborder': 'no' });
					}
					else
						$.spellnote.funcs.showTip($node, '链接不正确！');

					if ($video) {
						$video.addClass('sn-v');
						$.spellnote.funcs.insertNode($node, $video[0]);
						close();
					}
				},
			});
		},
	};

	var music = {
		title: '插入音乐',
		iconClass: 'icon-music',
		click: function ($node, e) {
			$.spellnote.funcs.showModal($node, {
				title: '插入音乐',
				contentHtml: '<div><p>音乐链接:<p><input class="sn-input sn-music-input" type="text" /></div><p>请输入音乐的网址，目前仅支持网易云音乐。</p>',
				buttonText: '确认',
				callback: function ($modal, close) {
					var url = $modal.find('.sn-music-input').val();
					var neteaseRegExp = /music.163.com\/#\/song\?id=(\d+)/;
					var neteaseMatch = url.match(neteaseRegExp);

					var $music;

					if (neteaseMatch) {
						$music = $('<iframe>')
							.attr('src', 'http://music.163.com/outchain/player?type=2&id=' + neteaseMatch[1] + '&auto=0&height=66')
							.attr({ 'height': 86, 'width': 330, 'frameborder': 'no' });
					}
					else {
						$.spellnote.funcs.showTip($node, '链接不正确！');
					}
					if ($music) {
						$music.addClass('sn-m');
						$.spellnote.funcs.insertNode($node, $music[0]);
						//$.spellnote.funcs.insertHtml($node, $music[0].outerHTML);
						close();
					}
				},
			});
		},
	};

	var image = {
		title: '插入图片',
		iconClass: 'icon-picture',
		click: function ($node, e) {
			$.spellnote.funcs.showModal($node, {
				title: '插入图片',
				contentHtml: '<div><p>从本地选择图片:<p><input class="sn-input sn-image-input" type="file" name="files" accept="image/jpg,image/jpeg,image/gif,image/bmp,image/png" /></div>',
				buttonText: '确认',
				callback: function ($modal, close) {
					var file = $modal.find('.sn-image-input')[0].files[0];
					var obj = $.spellnote.funcs.getSnObj($node);
					if (obj.callback.onImageUpload)
						obj.callback.onImageUpload(file);
					close();
				},
			});
		},
	};

	var link = {
		title: '插入链接',
		iconClass: 'icon-link',
		click: function ($node, e) {
			$.spellnote.funcs.showModal($node, {
				title: '插入链接',
				contentHtml: '<div><p>链接文本:<p><input class="sn-input sn-link-text-input" type="text" />'
				+ '<p>链接地址:</p><input class="sn-input sn-link-href-input" type="text" />'
				+ '</div>',
				buttonText: '确认',
				callback: function ($modal, close) {
					var text = $modal.find('.sn-link-text-input').val();
					var href = $modal.find('.sn-link-href-input').val();
					if (text == '' && href != '')
						text = href;
					else if (href == '') {
						$.spellnote.funcs.showTip($node, '链接地址不能为空！');
						return;
					}
					var obj = $.spellnote.funcs.getSnObj($node);
					if (obj.callback.onLinkInsert)
						obj.callback.onLinkInsert(text, href);
					else {
						var $a = $('<a class="sn-l" href="' + href + '">' + text + '</a>')
						$.spellnote.funcs.insertNode($node, $a[0]);
					}
					close();
				},
			});
		},
	};

	var unlink = {
		title: '移除链接',
		iconClass: 'icon-unlink',
		click: function ($node, e) {
			$.spellnote.funcs.executeCommand('unlink');
		},
	};

	var alignLeft = {
		title: '段落居左',
		iconClass: 'icon-align-left',
		click: function ($node, e) {
			$.spellnote.funcs.executeCommand('justifyLeft');
		},
	};

	var alignCenter = {
		title: '段落居中',
		iconClass: 'icon-align-center',
		click: function ($node, e) {
			$.spellnote.funcs.executeCommand('justifyCenter');
		},
	};

	var alignRight = {
		title: '段落居右',
		iconClass: 'icon-align-right',
		click: function ($node, e) {
			$.spellnote.funcs.executeCommand('justifyRight');
		},
	};

	var about = {
		title: '关于',
		iconClass: 'icon-help',
		click: function ($node, e) {
			$.spellnote.funcs.showModal($node, {
				title: '关于 Spellnote',
				contentHtml:  '<p><span style="font-size: 20px;">SPELLNOTE</span> <span style="margin-left: 10px; font-size: 14px;">作者: 月之庭</span></p>'
				+ '<p>spellnote是一款轻量级富文本编辑器，它的诞生是为了使某些扩展变得更加简单，其针对性较强，所以目前并不开源，仅在作者的网站使用。<p>'
				+ '<p>建议使用Chrome或Firefox浏览器以获得最佳体验！</p>'
				+ '<p>感谢 jQuery 与 Font Awesome 为Spellnote提供的便利！</p>'
				+ '<p>若有意见、建议或BUG反馈，请发信至 lovenekomusume@163.com，谢谢！</p>',
				buttonText: '继续使用 Spellnote',
				callback: function ($modal, close) {
					close();
				},
			});
		},
	};

	var test = {
		title: 'test',
		click: function ($node, e) {
			$.spellnote.funcs.showTip($node, 'error');
		},
	};

	return {
		test: test,
		about: about,
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
		video: video,
		music: music,
		image: image,
		link: link,
		unlink: unlink,
		alignLeft: alignLeft,
		alignCenter: alignCenter,
		alignRight: alignRight,
	};
}());

$.fn.extend({
	spellnote: function () {
		var $node = $(this);
		return $.spellnote[arguments[0]]($node, arguments);
	},
});
