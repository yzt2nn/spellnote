$.extend({
	spellnote: new function(){
		this.constant = function(){
			return {
				emptyPara : '<p><br></p>', // 空段落
				topLevelTagNameList : ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'], // 顶级标签名列表
				editorClassName : 'sn-editor', // 编辑器class
			};
		}();
		
		this.tools = function(){
			var indexOf = function(list, ele){
				/**
				 * 返回元素在数组中的位置，若没有，则返回-1
				 */
				var i = 0, len = list.length;
				for(; i < len; i++){
					if(list[i] === ele)
						break;
				}
				return (i >= len)? -1 : i;			
			};
			
			return {
				indexOf : indexOf,
			};
		}();
		
		this.funcs = function(){
			var $getUnits = function($node){
				return $node.find('.sn-unit');
			};
			
			var $getUnit = function($node, unitName){
				return $node.find('.sn-unit-name-'+ unitName);
			};
			
			var $getEditor = function($node){
				return $node.find('.sn-editor');
			};
			
			var $getCodeEditor = function($node){
				return $node.find('.sn-code-editor');	
			};
			
			var createSelection = function($node){
				var selection;
				if(document.selection && document.selection.createRange){
					selection = document.selection;
				}
				else if(document.getSelection){
					selection = document.getSelection();
				}
				else{
					selection = window.getSelection();
				}
				if(selection)
					return selection;
				else
					return null;
			};
			
			var createRange = function(isNew){
				if(isNew)
					return new Range();
				var selection = this.createSelection();
				if(!selection)
					return null;
				var range;
				if(selection.getRangeAt)
					range = selection.getRangeAt(0);
				else{
					range = selection.createRange();
				}
				if(range){
					return range;
				}
				else
					return null;
			};
			
			var isEditable = function($node, range){
				var range = range==undefined ? this.createRange() : range;
				
			};
			
			var executeCommand = function(sCommand, args){
				var args = args==undefined ? null : args;
				document.execCommand(sCommand, false, args);
			};
			
			var queryCommandState = function(sCommand, args){
				try{
					return document.queryCommandState(sCommand);
				}
				catch(e){};
			};
			
			/**
			 * 移除指定单元的所有状态类class，并添加指定状态类class，参数可以是($node, status, unitName)，也可以是($unit, status)
			 * @param {Object} $node
			 * @param {Object} unitName
			 */
			var switchUnitStatusClass = function($node, status, unitName){
				var $unit;
				if($node.hasClass('sn-unit'))
					$unit = $node;
				else
					$unit = this.$getUnit($node, unitName);
				var unitName = $unit.data('name');
				var statusList = $.spellnote.units[unitName].statusList;
				for(var i = 0; i < statusList.length; i++)
					$unit.removeClass('sn-unit-status-' + statusList[i]);
				$unit.addClass('sn-unit-status-' + status);
			};
			
			var setUnitStatus = function($node, status, unitName){
				var $unit;
				if($node.hasClass('sn-unit'))
					$unit = $node;
				else
					$unit = this.$getUnit($node, unitName);
				var currentStatus = $unit.data('status');
				var unitName = $unit.data('name');
				var unit = $.spellnote.units[unitName];
				var statusList = unit.statusList;
				var index = $.spellnote.tools.indexOf(statusList, status);
				if(currentStatus == index)
					return true;
				if(index >= 0){
					$unit.data('status', index);
					this.switchUnitStatusClass($unit, status);
					return true;
				}
				else
					return false;		
			};
			
			var setCursor = function(node, offset){
				var range;
				var sel = $.spellnote.funcs.createSelection();
				if(offset == -1)
					range = this.getRangeOfCursorAtLast(node);
				else{
					range = $.spellnote.funcs.createRange();
					var childNodes = node.childNodes;
					range.setEnd(node, childNodes.length);
	     	 		range.setStart(node, childNodes.length);     	 						
				}		
				sel.removeAllRanges();	
				sel.addRange(range);
			};
			
			var getRangeOfCursorAtLast = function(node){
				var endRange = $.spellnote.funcs.createRange(true);
				if(node.childNodes.length <= 0){
					endRange.setEnd(node, 0);
					endRange.setStart(node, 0);
					return endRange;
				}
				var lastChildNode = node.childNodes[node.childNodes.length - 1];
				var lastNode, offset = 0;
				if(lastChildNode.nodeType == 3){
					lastNode = lastChildNode;
					offset = lastNode.length;
				}
				else{
					nodeList = this.seekNode(lastChildNode, null, null, true);
					nodeList = cleanNodes(nodeList, {tagNames : ['BR']});
					if(nodeList.length == 0)
						lastNode = lastChildNode;
					else{
						lastNode = nodeList[nodeList.length - 1];
						if($.spellnote.tools.indexOf($.spellnote.constant.topLevelTagNameList, lastNode.tagName) == -1){
								lastNode = lastNode.nodeType == 3 ? lastNode : lastNode.parentNode;
								offset = lastNode.nodeType == 3 ? lastNode.length : lastNode.childNodes.length;
						}
					}
				}	
				endRange.setEnd(lastNode, offset);
     	 		endRange.setStart(lastNode, offset);
     	 		return endRange;
			};
			
			var isCursorAtLast = function(node){
				var currentRange = $.spellnote.funcs.createRange();
				if(currentRange.startContainer == node && node.childNodes == 0)
					return true;
				var endRange = this.getRangeOfCursorAtLast(node);
     	 		if(this.isRangeEqual(currentRange, endRange))
     	 			return true;
     	 		return false;
			};
			
			var formatEditorHtml = function($node){
				// 格式化文本，消除div等不规范格式
				var $editor;
				if($node.hasClass('sn-editor'))
					$editor = $node;
				else
					$editor = this.$getEditor($node);	
				var childNodes = $editor[0].childNodes;
				for(var i = 0; i < childNodes.length; i++){
					var node = childNodes[i];
					var $node = $(node);
					if(node.tagName == 'BR'){
						$node.remove();
						--i;
						continue;
					}
					if(node.tagName == 'DIV'){
						$node.replaceWith('<p>' + $node.html() + '</p>')
						continue;
					}
					if(!node.tagName || $.spellnote.tools.indexOf($.spellnote.constant.topLevelTagNameList, node.tagName) < 0)
						$node.wrap('<p>');
					else{
						if(node.childNodes.length > 1)
							$(node).children('br').remove();
					}
				}
			};
			
			var seekNode = function(node, nodeType, result, isIncludeSelf){
				//寻找节点下的所有节点，以数组形式返回
				var childNodes = node.childNodes;
				var len = childNodes.length;
				var result = result || new Array();
				if(isIncludeSelf){
					if(nodeType ? childNodes[i].nodeType == nodeType : true)
							result.push(node);
				}
				if(len > 0)
					for(var i = 0; i < len; i++){
						if(nodeType ? childNodes[i].nodeType == nodeType : true)
							result.push(childNodes[i]);
							this.seekNode(childNodes[i], nodeType, result);
					}
				return result;	
			};
			
			var isRangeEqual = function(r1, r2){
				if(r1.startContainer == r2.startContainer 
					&& r1.startOffset == r2.startOffset
					&& r1.endContainer == r2.endContainer 
					&& r1.endOffset == r2.endOffset)
					return true;
				return false;
			};
			
			var cleanNodes = function(nodeList, keywordDict){
				var resultList = new Array();
				for(var i = 0; i < nodeList.length; i++){
					if(keywordDict.tagNames)
						if(nodeList[i].tagName && $.spellnote.tools.indexOf(keywordDict.tagNames, nodeList[i].tagName) > -1)
							continue;
					if(keywordDict.nodeTypes)
						if(nodeList[i].nodeType && keywordDict.nodeTypes == nodeList[i].nodeType)
							continue;
					resultList.push(nodeList[i]);
				}
				return resultList;
			};
			
			var splitRangeToNodes = function(range){
				var nodes = new Array();
				var rng = range;
				var sc = range.startContainer;
				var ec = range.endContainer;
				var ac = range.commonAncestorContainer;
				var so = range.startOffset;
				var eo = range.endOffset;
				var sr;
				if(ac.nodeType == 3){
					//range是标签内文字的一部分或全部, 直接推入并返回
					nodes.push(range);
					return nodes;	
				}
				else if(ac.nodeType == 1){
					//range跨元素，先将首元素和末元素拆分出来
					if(sc.nodeType == 3){
						//如果startContainer是文字，直接截取字符串
						if(so == 0)
							sr = sc.parentNode;
						else{
							var range = this.createRange();
							range.setStart(sc, so);
							range.setEnd(sc, sc.length);
							sr = range;
						}			
					}
					
					nodes = this.seekNode(ac, 3, nodes);
					var isStart = false, isEnd = false;
					var nodesClone = nodes.slice(0);
					for(var i = 0; i < nodesClone.length; i++){
						if(!isStart){
							if(nodesClone[i] == sc)
								isStart = true;
							nodes.splice($.spellnote.tools.indexOf(nodes, nodesClone[i]), 1);
						}
						if(!isEnd && nodesClone[i] == ec){
							isEnd = true;
						}
						if(isEnd)
							nodes.splice($.spellnote.tools.indexOf(nodes, nodesClone[i]), 1);							
					}
					nodes.splice(0, 0, sr);
					
					if(ec.nodeType == 3){
						//如果endContainer是文字，直接截取字符串
						if(ec.length == eo)
							nodes.push(ec.parentNode);
						else{
							var range = this.createRange();
							range.setStart(ec, 0);
							range.setEnd(ec, eo);
							nodes.push(range);	
						}					
					}
				}
				return nodes;
			};
			
			var getTopLevelNodeByRange = function(range){
				var node = range.commonAncestorContainer;
				while(!node.tagName || $.spellnote.tools.indexOf($.spellnote.constant.topLevelTagNameList, node.tagName) < 0){
					if(node.className == $.spellnote.constant.editorClassName)
						break;
					node = node.parentNode;
				}
				return node;
			};
			
			return {
				$getUnits : $getUnits,
				$getUnit : $getUnit,
				$getEditor : $getEditor,
				$getCodeEditor : $getCodeEditor,
				createSelection : createSelection,
				createRange : createRange,
				isEditable : isEditable,
				executeCommand : executeCommand,
				queryCommandState : queryCommandState,
				switchUnitStatusClass : switchUnitStatusClass,
				setUnitStatus : setUnitStatus,
				formatEditorHtml : formatEditorHtml,
				seekNode : seekNode,
				splitRangeToNodes : splitRangeToNodes,
				setCursor : setCursor,
				isCursorAtLast : isCursorAtLast,
				isRangeEqual : isRangeEqual,
				getRangeOfCursorAtLast : getRangeOfCursorAtLast,
				cleanNodes : cleanNodes,
				getTopLevelNodeByRange : getTopLevelNodeByRange,
			};
		}();
		
		this.units = {};
		
		this.unitsInit = function($node, nameList){
			var $units = $('<div class="sn-unit-panel">');
			var $unit, unit;
			for(var i = 0; i < nameList.length; i++){
				if(typeof(nameList[i]) == 'object'){
					var $unitGroup = $('<div>').addClass('sn-units-group');
					for(var j = 0; j < nameList[i].length; j++){					
						unit = this.units[nameList[i][j]];
						if(unit.init){
							$unit = unit.init();
						}
						else{
							$unit = $('<button>').html(unit.title);						
						}
						$unit.addClass('sn-unit').addClass('sn-unit-name-' + nameList[i][j])
								.data('event', unit.listenEvent == 'false' ? 'false' : 'true')
								.data('type', 'unit').data('name', nameList[i][j]).data('status', 0);
						if(unit.statusList && unit.statusList[0])
								$unit.addClass('sn-unit-status-' + unit.statusList[0]);
						$unitGroup.append($unit);				
					}
					$units.append($unitGroup);
				}
				else{
					unit = this.units[nameList[i]];
					if(unit.init){
							$unit = unit.init();
						}
					else{
						$unit = $('<button>').html(unit.title);
					}
					$unit.addClass('sn-unit').addClass('sn-unit-name-' + nameList[i])
							.data('event', unit.listenEvent == 'false' ? 'false' : 'true')
							.data('type', 'unit').data('name', nameList[i]).data('status', 0);
					if(unit.statusList && unit.statusList[0])
						$unit.addClass('sn-unit-status-' + unit.statusList[0]);
					$units.append($unit);
				}		
			}
			$node.append($units);
		};
		
		this.updateUnitsStatus = function($node){
			var $units = this.funcs.$getUnits($node);
			var units = this.units;
			var status, unit, unitName;
			var range = this.funcs.createRange();
			$units.each(function(){
				unitName = $(this).data('name');
				unit = units[unitName];
				if(unit.checkStatus){
					status = unit.checkStatus(range);
					if(status)
						//该处可能增大性能损耗，为预定优化检查项
						$.spellnote.funcs.setUnitStatus($node, status, unitName);
				}
			});
		};
		
		this.editorInit = function($node){
			var $editorPanel = $('<div class="sn-editor-panel">');
			var $editor = $('<div class="sn-editor">').attr({contenteditable : true, spellcheck : false});
			var $codeEditor = $('<pre class="sn-code-editor">').attr('contenteditable', 'true').hide();
			$editor.html(this.constant.emptyPara);
			$editorPanel.append($editor).append($codeEditor);
			$node.append($editorPanel);
			$editor.on('mouseup', function(e){
				e.stopPropagation();
				$.spellnote.updateUnitsStatus($node);
			}).on('keyup', function(e){
				e.stopPropagation();
				if(e.keyCode == 13)
					// 回车抬起事件，格式化文本
					$.spellnote.funcs.formatEditorHtml($editor);
				if((e.keyCode >= 37 && e.keyCode <= 40) || e.shiftKey)
					$.spellnote.updateUnitsStatus($node);
			}).on('keydown', function(e){
				e.stopPropagation();
				if(e.keyCode == 13){
					var range = $.spellnote.funcs.createRange();
					var topLevelNode = $.spellnote.funcs.getTopLevelNodeByRange(range);
					if($.spellnote.funcs.isCursorAtLast(topLevelNode)){
						// 如果是在文本末尾回车，则阻止默认行为，并插入空段落
						e.preventDefault();
						$.spellnote.funcs.executeCommand('insertHtml', $.spellnote.constant.emptyPara);
						//$.spellnote.funcs.setCursor($editor, -1);			
					}				
				}
			}).on('blur', function(e){
				//e.stopPropagation();
				//$.spellnote.funcs.formatEditorHtml($editor);
			});
		};
		
		this.triggerEvent = function($node, e){
			var $target = $(e.target);
			if($target.data('event') === 'false')
				return;
			var type = $target.data('type');
			var name = $target.data('name');	
			if(type == 'unit'){
				var statusList = this.units[name].statusList;
				if(statusList && statusList.length > 0){
					var status = $target.data('status');				
					var nextStatus = (status + 1) % statusList.length;		
					if(this.units[name][e.type + '_' + statusList[nextStatus]])
						this.units[name][e.type + '_' + statusList[nextStatus]]($node, e);
					else
						return;
					$target.data('status', nextStatus);
					this.funcs.switchUnitStatusClass($target, statusList[nextStatus]);		
				}
				else{
					this.units[name][e.type] ? this.units[name][e.type]($node, e) : undefined;	
				}
			}
		};
		
		this.registeEventHandler = function($node){
			var self = this;
			$node.on('click change', function(e){
				self.triggerEvent($node, e);
			});
		};
		
		this.init = function($node, args){
			var options = args[1];
			this.unitsInit($node, options.units);
			this.editorInit($node);
			this.registeEventHandler($node);
		};
		
		this.enable = function($node){
			this.funcs.getEditor($node).attr('contenteditable', 'true');
		};
		
		this.disable = function($node){
			this.funcs.getEditor($node).attr('contenteditable', 'false');
		};
	},
});

/**
 * 预设单元 
 */
$.extend($.spellnote.units, function(){
	var code = {			
		title : '查看代码',
		statusList : ['deactive', 'active'],
		click_active : function($node){
			var $editor = $.spellnote.funcs.$getEditor($node);
			var $codeEditor = $.spellnote.funcs.$getCodeEditor($node);
			$codeEditor.text($editor.html());
			$codeEditor.show();
		},
		click_deactive : function($node){
			var $editor = $.spellnote.funcs.$getEditor($node);
			var $codeEditor = $.spellnote.funcs.$getCodeEditor($node);
			$editor.html($codeEditor.text());
			$codeEditor.hide();
		},
	};
			
	var bold = {
		title : '加粗',
		statusList : ['deactive', 'active'],
		click_active : function($node){
			$.spellnote.funcs.executeCommand('bold');
		},
		click_deactive : function($node){
			$.spellnote.funcs.executeCommand('bold');
		},
		checkStatus : function(){
			if($.spellnote.funcs.queryCommandState('bold'))
				return 'active';
			else
				return 'deactive';
		},
	};
			
	var italic = {
		title : '斜体',
		statusList : ['deactive', 'active'],
		click_active : function($node){
			$.spellnote.funcs.executeCommand('italic');
		},
		click_deactive : function($node){
			$.spellnote.funcs.executeCommand('italic');
		},
		checkStatus : function(){
			if($.spellnote.funcs.queryCommandState('italic'))
				return 'active';
			else
				return 'deactive';
		},
	};
			
	var italic = {
		title : '斜体',
		statusList : ['deactive', 'active'],
		click_active : function($node){
			$.spellnote.funcs.executeCommand('italic');
		},
		click_deactive : function($node){
			$.spellnote.funcs.executeCommand('italic');
		},
		checkStatus : function(){
			if($.spellnote.funcs.queryCommandState('italic'))
				return 'active';
			else
				return 'deactive';
		},
	};
	
	var underline = {
		title : '下划线',
		statusList : ['deactive', 'active'],
		click_active : function($node){
			$.spellnote.funcs.executeCommand('underline');
		},
		click_deactive : function($node){
			$.spellnote.funcs.executeCommand('underline');
		},
		checkStatus : function(){
			if($.spellnote.funcs.queryCommandState('underline'))
				return 'active';
			else
				return 'deactive';
		},
	};
	
	var strikeThrough = {
		title : '删除线',
		statusList : ['deactive', 'active'],
		click_active : function($node){
			$.spellnote.funcs.executeCommand('strikeThrough');
		},
		click_deactive : function($node){
			$.spellnote.funcs.executeCommand('strikeThrough');
		},
		checkStatus : function(){
			if($.spellnote.funcs.queryCommandState('strikeThrough'))
				return 'active';
			else
				return 'deactive';
		},
	};
	
	var undo = {
		title : '撤销',
		click : function($node){
			$.spellnote.funcs.executeCommand('undo');
			$.spellnote.updateUnitsStatus($node);
		},
	};
	
	var redo = {
		title : '重做',
		click : function($node){
			$.spellnote.funcs.executeCommand('redo');
			$.spellnote.updateUnitsStatus($node);
		},
	};
	
	var fontSize = {
		title : '字体大小',
		change : function($node, e){
			var value = $(e.target).children('option:selected').val() + 'px';
			$.spellnote.funcs.executeCommand('FontSize', value);
		},
		init : function(){
			var $select = $('<select>');
			var sizeList = [12, 14, 16, 18, 20, 14, 32, 48, 64];
			for(var i = 0; i < sizeList.length; i++){
				var $option = $('<option>'+ sizeList[i] +'</option>');
				if(sizeList[i] == 16)
					$option.attr('selected', 'selected');
				$select.append($option);
			}
			return $select;
		},
	};
	
	var test = {
		title : '分割range',
		click : function($node, e){
			var range = $.spellnote.funcs.createRange();
			var nodes = $.spellnote.funcs.splitRangeToNodes(range);
			for(var i in nodes)
				console.log(nodes[i]);
		},
	};
	
	return {
		test : test,
		code : code,
		bold : bold,
		italic : italic,
		underline : underline,
		strikeThrough : strikeThrough,
		redo : redo,
		undo : undo,
		fontSize : fontSize,
	};			
}());

$.fn.extend({
	spellnote: function(){
		var $node = $(this);
		$.spellnote[arguments[0]]($node, arguments);
	},
});
 