;(function($, window) {

	//Private Methods
	var priv = {
		init: function() {
			var $this = this;
			
			//Allow css to handle display while loading.
			$this.addClass('ysFilter--loading ysFilter--init');
			$this.set.currentHash = window.location.hash;

			//Reassigning of deprecated variable in filterOptions
			//@version 0.6
			if($this.set.filterOptions.paging) $this.set.paging = $this.set.filterOptions.paging;

			if($this.set.currentHash === '#' || $this.set.currentHash === '') {
				$this.set.currentHash = '';
			} else {
				$this.addClass('ysFilter--filtered');
				//Adds the hash to relevant URLs that are not products.
				if($this.set.updateWHash !== false) {
					$('.' + $this.set.updateWHash).each(function() {
						var href = $(this).attr('href');
						$(this).attr('href', href + $this.set.currentHash);
					});
				}
			}
			//Ajax in products - json string
			//This should test if there is a locally stored JSON that is relevant (relevant == correct MD5 hash)
			$.ajax({
				url: $this.set.url,
				type: 'GET',
				cache: true,
				dataType: 'JSON',
				success: function(data) {
					$this.filter = data;
					if($this.set.debug === true) console.log('var $this.filter', $.extend({}, $this.filter));

					//We want to run a pre-filter here to remove excess filter options if a catgeory has been set.
					priv.preFilter.apply($this);
					//Build filter now we know which products are left and what they can be filtered with.
					priv.buildFilter.apply($this);
					//Enable events on filters.
					priv.enableEvents.apply($this);

					//Set some global variables.
					if($this.filter.settings.limit > 0) {
						$this.set.limit = $this.filter.settings.limit;
					}
					$this.set.pages = Math.ceil($this.set.initItems.length / $this.set.limit);

					priv.updateFilterObjFromHash({data:{this:$this,init:true}});
					$(window).on('hashchange', {this:$this,init:false}, priv.updateFilterObjFromHash);
				}
			});

		},
		preFilter: function() {
			//Remove excess data from filter object.
			var $this = this;
			var renderItems = [];
			var tmpArr = [];
			var variantArr = [];
			var i = 0;
			var j = 0;
			var k = 0;
			var categories = null;
			var paramTypes = null;
			var totalItems = null;
			var filterItem = '';
			var cat = '';

			//We clone the array objects in the array however keep references. 
			//Now we can sort the array without screwing original order.
			$this.set.initItems = $.extend(true, [], $this.filter.products);

			if($this.set.category !== undefined && $this.set.category !== '/') {
				//Returns:
				//A refined category object for creating the filters.
				//Relevant products to the current category

				//Removes possible first slash so the categories can be matched.
				if($this.set.category.indexOf('/') === 0) $this.set.category = $this.set.category.slice(1);

				//Select relevant products.
				categories = $this.filter.filter.categories;
				paramTypes = $this.filter.settings.filter;
				totalItems = $this.filter.filter;

				for(var category in categories) {
					var testCorrectCategory = new RegExp('^' + category + '$');
					if(testCorrectCategory.test($this.set.category)) {
						tmpArr[i] = categories[category];
						i++;
					}
				}

				//These are all the relevant items for the rest of the filtering.
				renderItems = Array.prototype.concat.apply([], tmpArr);

				$this.set.relevantFilters = {};

				for (i = 0; i < paramTypes.length; i++) {
					cat = paramTypes[i][0].replace(/_\d/, '');
					filterItem = totalItems[cat];

					for(var subCat in filterItem) {
						tmpArr = [];
						variantArr = [];

						//Are there relevant items in this filter?
						tmpArr = priv.intersect(renderItems, filterItem[subCat]);

						if(tmpArr.length > 0) {
							//Add them to "relevantFilters"
							if($this.set.relevantFilters[cat] === undefined) $this.set.relevantFilters[cat] = {};
							$this.set.relevantFilters[cat][subCat] = tmpArr;
						}
					}
				}

				//Modify array keys to return item objs show only unique items.
				renderItems = priv.unique(renderItems);

				if($this.filter.related !== undefined) {
					//These should only have the main items explicity in the category.
					$this.set.initItems = priv.relatedToItems.apply($this, [renderItems, true]);
				} else {
					$this.set.initItems = priv.keysToItems.apply($this, [renderItems]);
				}
			}

			//Removes any issues from caching
			for (i = 0; i < $this.set.initItems.length; i++) {
				if($this.set.initItems[i] === undefined) $this.set.initItems.splice(i, 1);
			}

			$this.set.initItemsStr = JSON.stringify($this.set.initItems);
			$this.set.currentItems = $this.set.initItems.slice(0);

		},
		buildFilter: function() {
			//Builds filtering elements.
			var $this = this;
			var	$filters = $this.find('.' + $this.set.groupClass);
			var	html = '';
			var	create = '';
			var	tplAdditions = {};
			var parentClassNames = '';
			var	len = $this.filter.settings.filter.length;
			var	splitSizeEnd = $this.set.splitSizes !== false ? '</' + $this.set.splitSizes.match(/<([a-z]+)/)[1] + '>' : '';

			//Sort ends up in a different part of the filter attrs. Needs to be looped through seperately.
			if($this.filter.settings.sort !== undefined) {
				var $sort = $('#sort');
				var initDesc = $this.filter.settings.sort.init !== undefined ? $this.filter.settings.sort.init : '';

				create = $sort.data('create');
				tplAdditions = $this.set.filterOptions.sort || {};

				for(var sort in $this.filter.settings.sort) {
					if(sort === 'init') continue;
					if($this.filter.settings.sort[sort].asc) html += priv.buildFilterTemplate.call($this, create, 'sort-' + sort + '-asc', '["' + sort + '","asc"]', $this.filter.settings.sort[sort].asc, tplAdditions);
					if($this.filter.settings.sort[sort].dsc) html += priv.buildFilterTemplate.call($this, create, 'sort-' + sort + '-dsc', '["' + sort + '","dsc"]', $this.filter.settings.sort[sort].dsc, tplAdditions);
				}

				if(tplAdditions.wrapperGroup !== undefined) html = tplAdditions.wrapperGroup + html + '</' + tplAdditions.wrapperGroup.match(/<([a-z]+)/)[1] + '>';
				if(create === 'fakeSelect') {
					if($this.set.repeatStartFakeSelect) html = priv.buildFilterTemplate.call($this, 'start_' + create, '', '', initDesc, tplAdditions) + html;
					parentClassNames = tplAdditions.parentClassNames !== undefined ? ' ' + tplAdditions.parentClassNames.join(' ') : '';
					html = '<div class="filterControls-value fake-select' + parentClassNames + '"><span class="title" data-orig-text="' + initDesc + '">' + initDesc + '</span><ul class="ul-clean fake-select-list">' + html + '</ul></div>';
				} else if(create === 'a') {

				}
				if(create === 'select' || create === 'multiSelect') html = '<select class="filterControls-value"' + (create === 'multiSelect' ? ' multiple="multiple"' : '') + '><option value="0">' + initDesc + '</option>' + html + '</select>';

				$sort.append(html);
			}

			for (var i = 0; i < len; i++) {
				var catId = $this.filter.settings.filter[i][0];
				var cat = catId.replace(/_\d/, '');
				var catDesc = $this.filter.settings.filter[i][1];
				var $filter = $filters.filter('#' + catId);
				var relevantFilters = $this.set.relevantFilters || $this.filter.filter;
				var sortedFilters = {};
				var type = $filter.data('type');
				var maxLength = $filter.data('max-length') || null;
				var numItems = 0;
				var subHtml = '';
				var desc = '';
				var whichGroup = null;
				var currGroup = null;
				var depth = null;
				var filterId = '';
				var categoriesDesc = [];
				var categoriesId = [];
				var uniqueCategories = {};
				
				html = '';
				create = $filter.data('create');
				tplAdditions = $this.set.filterOptions[catId] || {};

				if($this.set.sortFiltersAlphabetically && cat !== 'categories' && relevantFilters[cat] !== undefined) {
					Object.keys(relevantFilters[cat])
						.sort(function(a,b) {
							if(a < b || b === '') return -1;
							if(a > b) return 1;
							return 0;
						})
						.forEach(function(v, i) {
							if(sortedFilters[cat] === undefined) {
								sortedFilters[cat] = [];
							}
							sortedFilters[cat][v] = relevantFilters[cat][v];
						});
				} else {
					sortedFilters = relevantFilters;
				}

				for (var underCat in sortedFilters[cat]) {
					desc = underCat;

					if($this.filter.filterDescriptions[cat] !== undefined && $this.filter.filterDescriptions[cat][underCat] !== undefined) {
						desc = $this.filter.filterDescriptions[cat][underCat];
					}

					if(typeof desc !== 'object' && desc.indexOf('::') !== -1 || cat === 'categories') {
						//Filter out categories not in initial category. 
						//Products can be even found in other categories that are not relevant.
						if(underCat.indexOf($this.set.category) !== 0) continue;
						//Split descriptions of the different categories.
						categoriesDesc = desc.split('::');
						categoriesId = underCat.split('/');
						//Are we working with a specific depth of category?
						if($filter.data('depth') !== undefined) {
							depth = $filter.data('depth') - 1;
							//If there is no head desc/Id skip
							if(categoriesDesc[depth] === undefined) continue;
							filterId = categoriesId[depth];
							desc = categoriesDesc[depth];
							if(uniqueCategories[filterId] === undefined) {
								//Only print out unique categories.
								html += priv.buildFilterTemplate.call($this, create, catId + '-' + filterId, filterId, desc, tplAdditions);
								uniqueCategories[filterId] = true;
							}
						} else {
							//Handling of tree categories.
							desc = categoriesDesc.pop();
							whichGroup = 'tree';
							if(currGroup !== categoriesDesc.join('')) {
								if(currGroup !== null) {
									//Add subhtml to html only when the group has changed.
									html += priv.buildFilterTemplate.call($this, 'group_' + create, '', subHtml, currGroup, tplAdditions);
									subHtml = '';
								}
								currGroup = categoriesDesc.join('');
							}
							subHtml += priv.buildFilterTemplate.call($this, create, cat + '-' + underCat, underCat, desc, tplAdditions);
						}
					} else if($this.set.splitSizes !== false && cat === 'size') {
						//Handling of split size groups. -> needs to be added to filterDescriptions.
						whichGroup = 'size';
						sizeTables = underCat.split('_');
						if(currGroup !== sizeTables[0]) {
							if(currGroup !== null) {
								html += $this.set.splitSizes + subHtml + splitSizeEnd;
								subHtml = '';
							}
							currGroup = sizeTables[0];
						}
						subHtml += priv.buildFilterTemplate.call($this, create, cat + '-' + underCat, underCat, desc, tplAdditions);
					} else {
						//Handling of all other JSParams.
						html += priv.buildFilterTemplate.call($this, create, cat + '-' + underCat, underCat, desc, tplAdditions);
					}
					numItems++;
				}

				//Send in grouped items.
				if(currGroup !== null) {
					if(whichGroup === 'tree') {
						html += priv.buildFilterTemplate.call($this, 'group_' + create, '', subHtml, currGroup, tplAdditions);
					} else {
						html += $this.set.splitSizes + subHtml + splitSizeEnd;
					}
				}
				if(numItems > maxLength && maxLength !== null) {
					if($this.set.hideAncestor !== false) {
						$filter.closest('.' + $this.set.hideAncestor).addClass('too-many-options');
					} else {
						$filter.addClass('too-many-options');
					}
				}
				if(tplAdditions.wrapperGroup !== undefined) html = tplAdditions.wrapperGroup + html + '</' + tplAdditions.wrapperGroup.match(/<([a-z]+)/)[1] + '>';

				if(create === 'fakeSelect') {
					if($this.set.repeatStartFakeSelect) subHtml = priv.buildFilterTemplate.call($this, 'start_' + create, '', underCat, catDesc, tplAdditions);
					parentClassNames = tplAdditions.parentClassNames !== undefined ? ' ' + tplAdditions.parentClassNames.join(' ') : '';
					html = '<div class="filterControls-value fake-select' + parentClassNames + '"><span class="title" data-orig-text="' + catDesc + '">' + catDesc + '</span><ul class="ul-clean fake-select-list">' + subHtml + html + '</ul></div>';
				}
				if(create === 'select' || create === 'multiSelect') html = '<select name="' + cat + '" class="filterControls-value"' + (create === 'multiSelect' ? ' multiple="multiple"' : '') + '><option value="0">' + catDesc + '</option>' + html + '</select>';
				$filter.append(html);
			}

			//Filter is loaded and ready to use.
			$this.removeClass('ysFilter--loading ysFilter--filtered').addClass('ysFilter--loaded');
			
			//Trigger callback for added functionality
			if($this.set.afterFilterRendered !== undefined) {
				$this.set.afterFilterRendered();
			}

		},
		buildFilterTemplate: function(create, id, val, desc, obj) {
			//Loop through filter alterations.
			//Change them to string values.
			//Insert them in templates.
			var $this = this;
			var valObj = {'desc': desc};
			var classes = '';
			var wrapStart = '';
			var wrapEnd = '';
			var attrs = '';
			var innerHtml = '';
			var backgroundTitle = '';
			var background = false;

			for(var options in obj) {
				switch (options) {
					case 'classNames':
						classes = obj[options].join(' ');
						break;
					case 'background':
						background = obj[options];
						break;
					case 'attrs':
						attrs = ' ' + obj[options].replace('{desc}', desc[0]);
						break;
					case 'wrapper':
						wrapStart = obj[options];
						wrapEnd = '</' + obj[options].match(/<([a-z]+)/)[1] + '>';
						break;
				}
			}

			if(typeof desc === 'object') { valObj.desc = desc.desc; }

			//A chance to overwrite/edit the standard description names
			if($this.set.eachFilterAttrs !== undefined) {
				valObj = $this.set.eachFilterAttrs(valObj);
			}

			//Title is used if text isn't
			backgroundTitle = background ? ' title="' + valObj.desc + '"' : '';
			innerHtml = background ? priv.hexOrImage(desc, 'style', $this.set.forceHex) : valObj.desc;

			id = id.replace(/\W/g, '-');

			//Repeating elements
			if(create === 'a') return wrapStart + '<a id="' + id + '" class="' + classes + ' filterControls-value"' + backgroundTitle + ' href="#" data-value=\'' + val + '\'' + attrs + '>' + innerHtml + '</a>' + wrapEnd;
			if(create === 'select' || create === 'multiSelect') return '<option id="' + id + '" value="' + val + '">' + valObj.desc + '</option>';
			if(create === 'fakeSelect') return '<li ' + attrs + backgroundTitle + '><a id="' + id + '" class="' + classes + ' filterControls-value"' + backgroundTitle + ' href="#" data-value=\'' + val + '\'>' + innerHtml + '</a></li>';
			//These need parents for disabling and selecting.
			if(create === 'radio') return wrapStart + '<input id="' + id + '" type="radio" class="' + classes + ' filterControls-value" value="' + val + '" /><label' + backgroundTitle + ' for="' + id + '">' + innerHtml + '</label>' + wrapEnd;
			if(create === 'checkbox') return wrapStart + '<input id="' + id + '" type="checkbox" class="' + classes + ' filterControls-value" value="' + val + '" /><label' + backgroundTitle + ' for="' + id + '">' + innerHtml + '</label>' + wrapEnd;
			//Handling of grouping for tree categories
			if(create === 'group_select') return '<optgroup label="' + valObj.desc + '">' + val + '</optgroup>';
			//Initial remove value
			if(create === 'start_fakeSelect') return '<li class="' + classes + '"' + attrs + '><a class="js-remove" href="#">' + valObj.desc + '</a></li>';
			return '';
		},
		enableEvents: function() {
			var $this = this;
			var touchStart = null;
			var touchClick = null;
			var winTouches = {
				move: false
			};

			touchClick = function() {
				if(winTouches.moved) return false;
				return (Math.abs(Math.abs(winTouches.startX) - Math.abs(winTouches.endX))) < 50 && (Math.abs(Math.abs(winTouches.startY) - Math.abs(winTouches.endY))) < 50;
			};

			//logging all touches on screen.
			$(window).on({
				touchstart: function(e) {
					$this.set.touch = true;
					winTouches.startX = e.originalEvent.targetTouches[0].clientX;
					winTouches.startY = e.originalEvent.targetTouches[0].clientY;
					winTouches.endX = e.originalEvent.targetTouches[0].clientX;
					winTouches.endY = e.originalEvent.targetTouches[0].clientY;
					winTouches.moved = false;
				},
				touchmove: function(e) {
					winTouches.endX = e.originalEvent.targetTouches[0].clientX;
					winTouches.endY = e.originalEvent.targetTouches[0].clientY;
					if(!touchClick()) {
						//You have moved away but you might move back.
						winTouches.moved = true;
					}
				}
			});

			//FILTERING
			//----------
			$this.on('change', '.' + $this.set.groupClass + ' select.filterControls-value', function(e) {
				e.preventDefault();
				var type = $(this).closest('.' + $this.set.groupClass).data('type');
				var cat = $(this).closest('.' + $this.set.groupClass).attr('id');
				var val = $(this).val();
				
				if(cat !== 'sort') $this.set.latestCat = cat;

				priv.updateFilterObj.apply($this, [type, cat, val]);
			});

			$this.on('click touchend', '.' + $this.set.groupClass + ' a.filterControls-value', function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				var type = $(this).closest('.' + $this.set.groupClass).data('type');
				var cat = $(this).closest('.' + $this.set.groupClass).attr('id');
				var val = $(this).data('value');
				//if sor select as latestCat
				if(type !== 's' && type !== 's1') {
					$this.set.latestCat = cat;
				} else { 
					//if selecting new filter element clear selected
					if(!$(this).hasClass('selected')) {
						$(this).closest('.' + $this.set.groupClass).find('.filterControls-value').removeClass($this.set.selectedClass);
					}
				}

				//If not disabled let filtering continue.
				if(!$(this).hasClass($this.set.disabledClass) && !$(this).parent().hasClass($this.set.disabledClass)) {
					//Add or remove select on element.
					$(this).toggleClass($this.set.selectedClass);
					priv.updateFilterObj.apply($this, [type, cat, val]);
				}
			});

			$this.on('click touchend', '.js-removeElement', function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				//Remove specific element from filters
				//Relies upon data object matching element to remove
				var data = $(this).find('a').data();
				
				//Need to remove the specified item based on the data attribute
				type = data.type; // s, sor, sand
				cat = data.cat; // sort, size, swatch
				val = data.value;

				if($('#' + cat).data('create') === 'fakeSelect') {
					$('#' + cat + '-' + val).parent().trigger('click');
				}

				priv.updateFilterObj.apply($this, [type, cat, val]);
			});

			$this.on('click touchend', '.js-remove', function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				//Remove all from group
				var $group = $(this).closest('.' + $this.set.groupClass);
				var type;
				var cat;
				var val;
				
				if($group.length === 0) $group = $(this).siblings('.' + $this.set.groupClass);

				type = $group.data('type');
				cat = $group.attr('id');
				val = 'remove';

				$group.find('.' + $this.set.selectedClass).removeClass($this.set.selectedClass);
				$group.find('select').find('option').removeAttr('disabled').filter(':selected').removeAttr('selected');
				priv.updateFilterObj.apply($this, [type, cat, val]);
			});

			$this.on('click touchend', '.js-removeAll', function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				var currentScroll = $(window).scrollTop();
				//Remove all filters
				$this.set.filteredBy = {};
				$this.set.filteredBy.page = 1;
				$this.set.currentHash = '';

				if($this.set.outputChosenFiltersId !== false) $('#' + $this.set.outputChosenFiltersId).find('#js-ysFilterElements').remove();

				window.location.hash = $this.set.currentHash;
				$(window).scrollTop(currentScroll);

				$this.find('.' + $this.set.groupClass).each(function() {
					if($(this).data('create') === 'fakeSelect')	$(this).find('.fake-select').trigger('rekaf.resetSelect');
				});

				$this.find('.' + $this.set.groupClass + ' .' + $this.set.selectedClass).removeClass($this.set.selectedClass);
				$this.find('.' + $this.set.groupClass + ' option').removeAttr('disabled').filter(':selected').removeAttr('selected');

				if($this.set.onFilterChanged !== undefined) $this.set.onFilterChanged($this.set.filteredBy);

				priv.gatherItems.apply($this);
			});

			//PAGING
			//----------
			$this.on('click touchend', '.' + $this.set.paging.nextBtnClass, function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				//Next Page
				if($this.set.filteredBy.page < $this.set.pages) {
					$this.set.filteredBy.page += 1;
					$this.set.currentHash = priv.hashify($this.set.filteredBy);
					if($this.set.currentHash.length > 0) window.location.hash = $this.set.currentHash;
					$this.find('.' + $this.set.pageCurrentClass).text($this.set.filteredBy.page);
					priv.gatherItems.apply($this);
				}
				return false;
			});

			$this.on('click touchend', '.' + $this.set.paging.prevBtnClass, function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				var currentScroll = $(window).scrollTop();
				//Prev Page
				if($this.set.filteredBy.page > 1) {
					$this.set.filteredBy.page -= 1;
					$this.set.currentHash = priv.hashify($this.set.filteredBy);
					window.location.hash = $this.set.currentHash;
					$(window).scrollTop(currentScroll);
					$this.find('.' + $this.set.pageCurrentClass).text($this.set.filteredBy.page);
					priv.gatherItems.apply($this);
				}
			});

			$this.on('click touchend', '.' + $this.set.paging.allBtnClass, function(e) {
				e.preventDefault();
				if($this.set.touch === true && touchClick() === false) return;
				var $paging = $(this).closest('.' + $this.set.paging.contClass);
				//Prev Page
				if($paging.hasClass('viewing-all')) {
					$this.set.limit = $this.set.oldLimit;
					$paging.removeClass('viewing-all');
					$this.find('.' + $this.set.pageCurrentClass).text($this.set.filteredBy.page);
				} else {
					$this.set.oldLimit = $this.set.limit;
					$this.set.limit = 'none';
					$paging.addClass('viewing-all');
					$this.find('.' + $this.set.pageCurrentClass).text(1);
				}
				priv.gatherItems.apply($this);
			});

		},
		reSelectLatestFilter: function() {
			var $this = this;

			//Previous latestCat
			for(var firstCat in $this.set.filteredBy) {
				if(firstCat === 'page' || firstCat === 'sort') continue;
				$this.set.latestCat = firstCat;
				$this.set.resetLatestCat = true;
				break;
			}

		},
		createChosenElements: function() {

			var $this = this;
			var filterObj = $this.set.filteredBy;
			var str = '<div id="js-ysFilterElements">';

			//Update elements based on what's in the object.
			var prepareString = function(cat, value, type) {
				var $filterElement = $('#' + cat + '-' + value);
				var title = $filterElement.attr('title') !== undefined ? ' title="' + $filterElement.attr('title') + '"' : '';

				if($filterElement.length > 0) {
					if($filterElement[0].nodeName === 'A') {
						return '<span class="js-removeElement"' + title + '>' + $filterElement.parent().clone().children().removeAttr('id').attr({'data-type': type, 'data-cat': cat}).parent().html() + '</span>';
					} else {
						return '<span class="js-removeElement"><a href="#" data-type="' + type + '" data-cat="' + cat + '" data-value="' + value + '">' + value + '</a></span>';
					}
				}
			};

			//Clone selected elements available in filter object.
			//if anchor clone as is if option or other element use information and build an anchor.
			for(var element in filterObj) {
				//Skip if it's not filter elements
				if(element === 'page' || element === 'sort') continue;

				//if there can be more than one element we need to loop through them.
				if(filterObj[element].type === 'sor' || filterObj[element].type === 'sand') {
					
					for (var i = 0; i < filterObj[element].value.length; i++) {
						str += prepareString(element, filterObj[element].value[i], filterObj[element].type);
					}

				} else {
					str += prepareString(element, filterObj[element].value, filterObj[element].type);
				}
			}

			str += '</div>';

			$('#' + $this.set.outputChosenFiltersId).find('#js-ysFilterElements').remove();
			$('#' + $this.set.outputChosenFiltersId).append(str);

		},
		updateFilterObjFromHash: function(e) {
			$this = e.data.this;
			init = e.data.init;
			$this.set.currentHash = window.location.hash;
			//If previously filtered. Filter and render relevant products.
			$this.set.filteredBy = priv.dehashify.apply($this, [window.location.hash]);
			
			if($this.set.currentHash !== '') {
				if($this.set.filteredBy.page > 1) {
					$this.find('.' + $this.set.paging.prevBtnClass).removeClass('.' + $this.set.disabledClass);
					$this.set.initialLoad = true;
				}

				priv.gatherItems.apply($this);
				if($this.set.outputChosenFiltersId !== false) priv.createChosenElements.apply($this);
				priv.reSelect.apply($this);
			} else if(init) {
				//Only replace objects in certain circumstances otherwise don't update page.
				if($this.set.preSort !== false) {
					priv.gatherItems.apply($this);
				} else if($this.set.debug === true) {
					//Replace even on first load if debug: true
					priv.gatherItems.apply($this);
				}
			} else {
				priv.gatherItems.apply($this);
			}
			//Filter items have changed do callback. 
			if($this.set.onFilterChanged !== undefined) $this.set.onFilterChanged($this.set.filteredBy);
		},
		updateFilterObj: function(type, cat, val) {
			//Must update
			//Updates filter object.
			var $this = this;
			var currVal = null;
			var checkVal = null;
			var posInArray = null;
			var currentScroll = 0;

			if(type === 's1' || type === 's') {
				//Select OnecheckVal = typeof val === 'object' ? val.join(',') : val;
				currVal = $this.set.filteredBy[cat] !== undefined ? (typeof $this.set.filteredBy[cat].value === 'object') ? $this.set.filteredBy[cat].value.join(',') : $this.set.filteredBy[cat].value : '';
				if(currVal === checkVal || checkVal === 'remove') {
					delete $this.set.filteredBy[cat];
					priv.reSelectLatestFilter.apply($this);
				} else {
					$this.set.filteredBy[cat] = {type: type, value: val};
				}
			} else if(type === 'sand' || type === 'sor') {
				//Select And || Select Or
				if(val === 'remove') {
					//If remove, remove all and only if it has been set.
					if($this.set.filteredBy[cat] !== undefined) {
						delete $this.set.filteredBy[cat];
						priv.reSelectLatestFilter.apply($this);
					}
				} else if(val === null) {
					//if native multiple select is emtpy it returns val() as null.
					delete $this.set.filteredBy[cat];
					priv.reSelectLatestFilter.apply($this);

				} else if(typeof val === 'object') {
					//Native multiple select returns val() as an array.
					if(val.length > 0) {
						$this.set.filteredBy[cat] = {type: type, value: val};
					}

				} else {
					//coerce to string
					val = val + '';
					currVal = $this.set.filteredBy[cat] !== undefined && $this.set.filteredBy[cat].value !== undefined ? $this.set.filteredBy[cat].value : [];
					posInArray = $.inArray(val, currVal);
					if(posInArray !== -1) {
						currVal.splice(posInArray, 1);
					} else {
						currVal.push(val);
					}

					if(currVal.length > 0) {
						$this.set.filteredBy[cat] = {type: type, value: currVal};
					} else {
						delete $this.set.filteredBy[cat];
						priv.reSelectLatestFilter.apply($this);
					}
				}
			}

			if($this.set.debug === true) console.log('var $this.set.filteredBy', $this.set.filteredBy);
			if($this.set.outputChosenFiltersId !== false) priv.createChosenElements.apply($this);

			//Filter has changed reset to page 1
			$this.set.filteredBy.page = 1;
			
			//Update Hash - hashify object
			$this.set.currentHash = priv.hashify($this.set.filteredBy);
			if($this.set.currentHash === '') currentScroll = $(window).scrollTop();
			window.location.hash = $this.set.currentHash;
			if($this.set.currentHash === '') $(window).scrollTop(currentScroll);

			if($this.set.updateWHash !== false) {
				$('.' + $this.set.updateWHash).each(function() {
					var href = $(this).attr('href');
					$(this).attr('href', href + '#' + $this.set.currentHash);
				});
			}
		},
		reSelect: function() {
			//Show correct values on filter based on hash load.
			var $this = this;
			var filteredBy = $this.set.filteredBy;
			var $filter = {};
			var $filterOpt = {};
			var filterVal = '';
			var type = '';
			var filter;
			var filters = $this.filter.settings.filter.slice();

			filters.push(['sort']);//just to have it inside the loop for verification.

			//first, let's reset the objects which are not in filteredBy but in filters.
			for(filter in filters) {
				filter = filters[filter][0];
				if(!filteredBy[filter]) { 
					$filter = $this.find('#' + filter);
					$filter.find('.' + $this.set.selectedClass + ', option[selected=selected]').removeClass($this.set.selectedClass).removeAttr('selected');
				}
			}
			for(filter in filteredBy) {
				$filter = $this.find('#' + filter);
				filterVal = filteredBy[filter].value;
				type = $filter.data('create');
				if($filter.length === 0) continue;
				if(filter === 'sort') filterVal = filteredBy[filter].value.join('-');

				if(typeof filteredBy[filter].value === 'object' && filter !== 'sort') {
					//then let's reset the other selected here, so we can use this function on complete refresh.
					if(type === 'select' || type === 'multiSelect') {
						$filter.find('option').removeAttr('selected');
					} else {
						if(type === 'fakeSelect') {
							$filter.find('li.' + $this.set.selectedClass).removeClass($this.set.selectedClass);
						} else {
							$filter.find('.' + $this.set.selectedClass).removeClass($this.set.selectedClass);
						}
					}
					for(var i = 0; i < filteredBy[filter].value.length; i++) {
						filterVal = filteredBy[filter].value[i].replace(/\W/g, '-');
						if(type === 'select' || type === 'multiSelect') {
							$filter.find('#' + filter + '-' + filterVal).attr('selected', true);
						} else {
							if(type === 'fakeSelect') {
								$filter.find('#' + filter + '-' + filterVal).closest('li').addClass($this.set.selectedClass);
							} else {
								$filter.find('#' + filter + '-' + filterVal).addClass($this.set.selectedClass);
							}
						}
					}
				} else {
					//first, reset!
					if(type === 'select' || type === 'multiSelect') {
						$filter.find('option').removeAttr('selected');
					} else {
						if(type === 'fakeSelect') {
							$filter.find('.selected').removeClass('selected');
							$filter.find('.' + $this.set.selectedClass).removeClass($this.set.selectedClass);
						} else {
							$filter.find('.' + $this.set.selectedClass).removeClass($this.set.selectedClass);
						}
					}
					$filterOpt = $filter.find('#' + filter + '-' + filterVal.replace(/\W/g, '-'));
					if(type === 'select' || type === 'multiSelect') {
						$filterOpt.attr('selected', true);
					} else if(type === 'fakeSelect') {
						$filterOpt.closest('li').addClass($this.set.selectedClass);
						$filter.find('.fake-select').addClass('selected').find('span').text($filterOpt.text());
					} else {
						$filterOpt.addClass($this.set.selectedClass);
					}
				}
			}

			//Filter items have changed do callback. 
			if($this.set.onFilterChanged !== undefined) $this.set.onFilterChanged($this.set.filteredBy);

		},
		gatherItems: function(shouldReturn, filteredBy) {
			//Collect all items to be printed out based on filter.
			var $this = this;
			var catRegexp = /_\d$/;
			var totalItems = $this.set.relevantFilters || $this.filter.filter;
			var filters = 0;
			var i = 0;
			var filterValue = '';
			var tmpArr = [];
			var newItems = [];
			var renderItems = [];
			var filteredByReverse = [];

			filteredBy = filteredBy || $this.set.filteredBy;
			shouldReturn = shouldReturn || false; 

			//Category levels.
			var matchUri = function(filter, value) {
				var urlArray = [];
				var j = 0;
				var catDepth = parseInt(filter.slice(-1), 10) - 1;
				var filterId = filter.replace(catRegexp, '');
				var uriValue = (value === $this.set.undefinedCatId) ? undefined : value;

				for(var urls in totalItems[filterId]) {
					if(urls.indexOf($this.set.category) !== 0) continue;

					//Does URI exist in URL?
					if(uriValue === urls.split('/')[catDepth]) {
						urlArray[j] = totalItems[filterId][urls];
						j++;
					}							
				}
				return Array.prototype.concat.apply([], urlArray);
			};

			//Could build on previous items to be even quicker? Instead of parsing the whole object...
			for(var filter in filteredBy) {
				//Skip non filter items.
				if(filter === 'page' || filter === 'sort') continue;
				
				//console.log('var filter', filter);
				//console.log('var filter', filteredBy[filter]);

				//Runs per set of filters.
				if(filteredBy[filter].type === 's1') {
					if(catRegexp.test(filter)) {
						newItems = matchUri(filter, filteredBy[filter].value);
					} else {
						newItems = totalItems[filter][filteredBy[filter].value];
					}
				} else if(filteredBy[filter].type === 'sor') {
					//Concatente all arrays
					//Product only needs to match one value to be relevant.
					//reverse items so that the newest are added at the top.
					filteredByReverse = filteredBy[filter].value.slice(0);
					filteredByReverse.reverse();
					for (i = 0; i < filteredByReverse.length; i++) {
						//Runs per set of values in a filter.
						if(catRegexp.test(filter)) {
							tmpArr[i] = matchUri(filter, filteredByReverse[i]);
						} else {
							tmpArr[i] = totalItems[filter][filteredByReverse[i]];
						}
					}
					//Join them together to create newItems.
					newItems = Array.prototype.concat.apply([], tmpArr);
				} else if(filteredBy[filter].type === 'sand') {
					//Intersect all arrays
					//All values must be present to show product.
					for (i = 0; i < filteredBy[filter].value.length; i++) {
						//TODO: run intersect on arrays
						tmpArr[i] = totalItems[filter][filteredBy[filter].value[i]];
						newItems = newItems;
					}
				}
				//There are still items that should be excluded.
				//Need to know if the items should be subtracted from the total or added between groups.
				//Only adds newItems if it is the first filter.
				renderItems = filters === 0 ? newItems : priv.intersect(renderItems, newItems);
				tmpArr = [];
				filters++;
			}

			if(!shouldReturn) {
				if(filters > 0) {
					$this.addClass('ysFilter--filtered');
				} else {
					$this.removeClass('ysFilter--filtered');
				}

				priv.updateFilterHTML.apply($this, [filters, renderItems, totalItems]);
			} else {
				return renderItems;
			}

		},
		updateFilterHTML: function(filters, renderItems, totalItems) {
			//Updates how the HTML filters look. Based on filtering.
			var $this = this;
			var paramTypes = $this.filter.settings.filter;
			var $filter = {};
			var $item = {};
			var catTotal;
			var catId;
			var itemTotal;
			var create;
			var type;
			var maxLength;
			var prop;
			var compiledObj;
			var updateFilterObj;
			var depth;
			var subCat;
			var tempRenderItems;
			var tempFilterObj;

			if(filters === 0) {
				//Same here if the intersect returns nothing.
				//Clone filter items to return everything back to original state.
				//Objects retain references like really really lots... 
				//JSON parse feels like only solution to really stop this completely...
				$this.set.currentItems = JSON.parse($this.set.initItemsStr);

				$this.find('.' + $this.set.groupClass).find('.' + $this.set.disabledClass + ', .' + $this.set.selectedClass).removeClass($this.set.disabledClass + ' ' + $this.set.selectedClass);
				$this.find('.' + $this.set.groupClass + ' option').removeAttr('disabled').filter(':selected').removeAttr('selected');

				for (i = 0; i < paramTypes.length; i++) {
					$filter = $this.find('#' + paramTypes[i][0]);
					maxLength = $filter.data('max-length') || null;

					if(maxLength !== null) {
						if(Object.keys(totalItems[paramTypes[i][0]]).length > maxLength) {
							if($this.set.hideAncestor !== false) {
								$filter.closest('.' + $this.set.hideAncestor).addClass('too-many-options');
							} else {
								$filter.addClass('too-many-options');
							}
						}
					}
				}
			} else {
				//Disable options in the other filters
				//Now we should know which products are left and be able to see if they are available in the other filters.
				//Latest filter show all from that filter (skip it then).
				for (i = 0; i < paramTypes.length; i++) {
					//Don't change the category we're in.
					//If only one filter is chosen, remove disabled on that one remove latestCat
					//Previous filter if sor use only for first filter.
					$filter = $this.find('#' + paramTypes[i][0]);
					type = $filter.data('type') || null;
					
					if((type === 's1' && $this.set.latestCat === paramTypes[i][0]) || (type === 'sor' && filters === 1 && $this.set.latestCat === paramTypes[i][0])) {
						if($this.set.resetLatestCat) {
							$('#' + $this.set.latestCat).find('.' + $this.set.disabledClass).removeClass($this.set.disabledClass);
							$('#' + $this.set.latestCat).find('option').removeAttr('disabled');
							$this.set.resetLatestCat = false;
						}
						continue;
					}
						
					catTotal = 0;
					catId = paramTypes[i][0].replace(/_\d$/, '');
					itemTotal = 0;
					create = $filter.data('create') || null;
					maxLength = $filter.data('max-length') || null;
					depth = ($filter.data('depth') - 1) || null;
					prop = '';
					compiledObj = {};
					updateFilterObj = totalItems[catId];
					intersected = [];
					tempRenderItems = renderItems.slice();

					if(depth !== null) {

						//Need to join arrays together before being intersected.
						for(subCat in totalItems[catId]) {
							var initArr = [];
							var categoriesId = subCat.split('/');

							//If there is no head desc/Id skip
							if(categoriesId[depth] === undefined) continue;
							id = categoriesId[depth];
							initArr = (compiledObj[id] === undefined) ? [] : compiledObj[id];
							compiledObj[id] = Array.prototype.concat.apply(initArr, totalItems[catId][subCat]);
						}

						updateFilterObj = compiledObj;

					}

					//We're effectively not counting any of the filters from the same category that we are in.
					//If you filter one thing with categories then obviously that will make the other categories unselectable. 
						//Unless products appear in more than one category.
					//But based on all the other filters not the one that is currently selected are there other categories that can be still added?

					//Choice has been filtered with but is not the latest chosen filter.
					if($this.set.filteredBy[paramTypes[i][0]] !== undefined && type === 'sor') {
						//Re-gather items excluding currently filtered category.
						tempFilterObj = $.extend(true, {}, $this.set.filteredBy);
						delete tempFilterObj[paramTypes[i][0]];
						newGatheredItems = priv.gatherItems.apply($this, [true, tempFilterObj]);

						//We want to temporarily include all items based on the other filters in this section to renderItems.
						tempRenderItems = Array.prototype.concat.apply(tempRenderItems, newGatheredItems);
						tempRenderItems = priv.unique(tempRenderItems);
					}

					for(subCat in updateFilterObj) {

						var id = subCat.replace(/\W/g, '-');
						intersected = priv.intersect(tempRenderItems, updateFilterObj[subCat]);

						//Do these sub categories have any of our items?
						$item = $this.find('#' + paramTypes[i][0] + '-' + id);
						if($item.length === 0) continue;
						prop = $item.prop('tagName').toLowerCase();

						if(intersected.length > 0) {

							//Items in that category make available
							if(prop === 'option' || prop === 'input') {
								//Remove attr disabled
								$item.removeAttr('disabled');
							} else {
								if(create === 'fakeSelect') {
									//Remove class disabled
									$item.closest('li').removeClass($this.set.disabledClass);
								} else {
									$item.removeClass($this.set.disabledClass);
								}
							}
							itemTotal += intersected.length;
							catTotal++;

						} else {
							
							//Disable category no items for that option.
							if(prop === 'option' || prop === 'input') {
								$item.attr('disabled', true);
							} else {
								if(create === 'fakeSelect') {
									//Remove class disabled
									$item.closest('li').addClass($this.set.disabledClass);
								} else {
									$item.addClass($this.set.disabledClass);
								}
							}

						}

					}

					//Use to hide certain filters if there are too many to choose between.
					if(maxLength !== null) {
						if(catTotal > maxLength) {
							if($this.set.hideAncestor !== false) {
								$filter.closest('.' + $this.set.hideAncestor).addClass('too-many-options');
							} else {
								$filter.addClass('too-many-options');
							}
						} else {
							if($this.set.hideAncestor !== false) {
								$filter.closest('.' + $this.set.hideAncestor).removeClass('too-many-options');
							} else {
								$filter.removeClass('too-many-options');
							}
						}
					}

					//If the whole category is empty hide category.
					if(catTotal > 0) {
						$filter.removeClass($this.set.disabledClass);
					} else {
						$filter.addClass($this.set.disabledClass);
					}
					
				}


				//Modify array keys to return item objs show only unique items.
				renderItems = priv.unique(renderItems);

				if($this.filter.related !== undefined) {
					$this.set.currentItems = priv.relatedToItems.apply($this, [renderItems, false]);
				} else {
					$this.set.currentItems = priv.keysToItems.apply($this, [renderItems]);
				}

			}

			priv.sortOrRenderItems.apply($this);

		},
		sortOrRenderItems: function() {
			var $this = this;

			if($this.set.filteredBy.sort !== undefined && $this.set.currentItems.length > 0) {
				priv.sortItems.apply($this);
			} else {
				if($this.set.preSort !== false) {
					priv.sortItems.apply($this, [$this.set.preSort[0], $this.set.preSort[1]]);
				} else {
					priv.renderItems.apply($this);
				}
			}
		},
		sortItems: function(preSortBy, preSortDir) {
			var $this = this;
			var items = $this.set.currentItems;
			var itemsLen = items.length;
			var sortBy = preSortBy || $this.set.filteredBy.sort.value[0];
			var sortId = (preSortBy && preSortDir) ? preSortBy + '-' + preSortDir : $this.set.filteredBy.sort.value.join('-');
			var sortDir = preSortDir || $this.set.filteredBy.sort.value[1];
			var i = 0;
			var j = 0;
			var price = 0;
			var sortArr = [];
			var sortWith = {};


			for (i = 0; i < itemsLen; i++) {
				//Create array
				sortArr[i] = {obj: items[i]};
				
				//Create a sort by object for use with related
				if($this.filter.related !== undefined && items[i].relatedShowMain === false) {
					related = priv.keysToItems.apply($this, [items[i].relatedShowVariants]);
					sortWith = related[0];
				} else {
					sortWith = items[i];
				}

				if(sortBy === 'price') {
					price = parseFloat(sortWith.price.priceAsNumber, 10);
					if(sortWith.price.soldout) price = sortDir === 'dsc' ? 0 : 999999999;
					sortArr[i][sortBy] = price;
				} else if(sortBy === 'news') {
					sortArr[i][sortBy] = sortWith.price.newProduct ? 0 : 10;
				} else {
					//Sort alphabetically | numerically
					sortArr[i][sortBy] = sortWith[sortBy];
				}
				j++;
			}

			$item = $this.find('#sort-' + sortId);

			if($this.find('#sort').data('create') === 'fakeSelect') {
				//Remove class disabled
				$item.closest('li').addClass($this.set.selectedClass);
			} else {
				$item.addClass($this.set.selectedClass);
			}

			if(typeof sortArr[0][sortBy] === 'number') {
				sortArr.sort(function(a,b) { 
					return a[sortBy] - b[sortBy];
				});
			} else {
				sortArr.sort(function(a,b) {
					if(a[sortBy] < b[sortBy] || b[sortBy] === '') return -1;
					if(a[sortBy] > b[sortBy]) return 1;
					return 0;
				});
			}

			if(sortDir === 'dsc') sortArr.reverse();

			//Clean array before reloading objects
			$this.set.currentItems = [];
			for (i = 0; i < itemsLen; i++) {
				$this.set.currentItems[i] = sortArr[i].obj;
			}

			priv.renderItems.apply($this);
		},
		renderItems: function() {
			//Filter out correct products to be shown
			//Only unique items
			var $this = this;
			var items = $this.set.currentItems;
			var len = items.length;
			var range = null;
			var start = 0;
			var html = '';
			var customRenderObj = [];

			//Handle paging
			if($this.set.initialLoad) {

				//start at 0 if append products start at page - 1 in not.
				start = $this.set.appendItems ? 0 : ($this.set.limit * ($this.set.filteredBy.page - 1));
				range = $this.set.limit * $this.set.filteredBy.page;
				len = (range > len) ? len : range;

				if($this.set.filteredBy.page > 1) {
					$this.find('.' + $this.set.paging.prevBtnClass).removeClass($this.set.disabledClass);
				}

				if(len !== range) {
					//If len is larger than range then we've met the max and should disable next.
					$this.find('.' + $this.set.paging.nextBtnClass).addClass($this.set.disabledClass);
				}

			} else if($this.set.limit !== 'none') {

				if(len > $this.set.limit) {
					//Set how many pages there are after filtering.
					$this.set.pages = Math.ceil(len / $this.set.limit);

					//This gives us max products in pages...
					range = $this.set.limit * $this.set.filteredBy.page;
					//Where to start from.
					start = ($this.set.filteredBy.page - 1) * $this.set.limit;

					len = (range > len) ? len : range;

					//Show previous buttons if page count is greater than 1
					if($this.set.filteredBy.page > 1) {
						$this.find('.' + $this.set.paging.prevBtnClass).removeClass($this.set.disabledClass);
					} else {
						$this.find('.' + $this.set.paging.prevBtnClass).addClass($this.set.disabledClass);
					}

					if(len !== range) {
						//assume we are on the last page.
						//hide next leave all and prev.
						$this.find('.' + $this.set.paging.nextBtnClass).addClass($this.set.disabledClass);
					} else {
						$this.find('.' + $this.set.paging.nextBtnClass).removeClass($this.set.disabledClass);
					}
				} else {
					//Pages not needed too few items compared to limit.
					$this.set.pages = 1;
					//Disable all pagination
					$this.find('.' + $this.set.paging.contClass).addClass($this.set.disabledClass);
				}

			} else {
				//This is for show all.
				$this.set.pages = 1;
				//Hide next and prev
				$this.find('.' + $this.set.paging.nextBtnClass + ',' + '.' + $this.set.paging.prevBtnClass).addClass($this.set.disabledClass);
			}

			//Return data for paging.
			$this.find('.' + $this.set.pageTotalClass).text($this.set.pages);
			$this.find('.' + $this.set.itemTotalClass).text(items.length);
			$this.find('.' + $this.set.allItemsTotalClass).text($this.set.currentItems.length);
			$this.find('.' + $this.set.currentTotalClass).text(len);

			for (var i = start; i < len; i++) {
				//Chance to add more variables to the object. Must also be in the template to be useful.
				if($this.set.eachItemAttrs) items[i] = $this.set.eachItemAttrs($this, items[i], i);
				//Add in specific html snippets in certain places in HTML.
				if($this.set.onItemIndex === i) html += $this.set.onItem(len);
				if($this.set.customRender !== undefined) {
					customRenderObj[customRenderObj.length] = {
						html: priv.renderItemTemplate.apply($this, [items[i]]),
						item: items[i]
					};
				} else {
					html += priv.renderItemTemplate.apply($this, [items[i]]);
				}
			}


			if($this.set.appendItems && $this.set.pages !== 1 && $this.set.filteredBy.page !== 1 && $this.set.initialLoad === false) {
				if($this.set.beforeItemsRendered !== undefined) $this.set.beforeItemsRendered('append');
				if($this.set.customRender !== undefined) {
					$this.set.customRender('append', $this.filter, customRenderObj);
				} else {
					$this.find('#' + $this.set.itemContId).append(html);
				}
			} else {
				if($this.set.beforeItemsRendered !== undefined) $this.set.beforeItemsRendered('replace');
				if($this.set.customRender !== undefined) {
					$this.set.customRender('replace', $this.filter, customRenderObj);
				} else {
					$this.find('#' + $this.set.itemContId).html(html);
				}
			}
			
			//Replace all hashes
			if($this.set.appendHashValue === undefined || $this.set.appendHashValue) {
				hash = $this.set.currentHash.indexOf('#') === -1 ? '#' + $this.set.currentHash : $this.set.currentHash;
				$this.find('#' + $this.set.itemContId + ' a').each(function() {
					var href = $(this).attr('href');

					if(href.indexOf('#') !== -1) href = href.substring(0, href.indexOf('#'));
					$(this).attr('href', href + hash);
				});
			}
			
			$this.set.initialLoad = false;
			//Callback for when items have finished rendering.
			if($this.set.afterItemsRendered !== undefined) $this.set.afterItemsRendered();
		},
		renderItemTemplate: function(obj) {
			//Optimized: jsperf test http://jsperf.com/replace-function-or-several-replaces
			//Parse template add data.
			//use text in anonymous callback for keys.
			var $this = this;
			var itemTemplate = $this.filter.settings.template.item;
			var priceTemplate = $this.filter.settings.template.price;
			var relatedTemplate = $this.filter.settings.template.related;
			var attributeTemplate = $this.filter.settings.template.attribute;
			var numImages = 0;
			var str = '';
			var tpl = '';
			var tempObj = {};
			var varArr = [];
			var related = [];
			var renderObj = {};
			var relatedShouldHide = true;

			//- if - relatedShowMain is false send in first related obj instead
			//This then sets the correct main picture and surrounding data i.e. price variant etc.
			if($this.filter.related !== undefined && obj.relatedShowMain === false) {
				//Only check if this is even set up
				related = priv.keysToItems.apply($this, [obj.relatedShowVariants]);
				renderObj = $.extend({}, related[0]);
			} else {
				//We don't want to mutate the object.
				renderObj = $.extend({}, obj);
			}

			//Run through related products.
			if(relatedTemplate !== undefined) {
				//We use the main products attributes here so that we always have the same variants...
				//Also maintains variant swatch/image order...

				if(obj.related !== undefined && obj.related.length > 0) related = priv.keysToItems.apply($this, [obj.related]);
				
				//Loop through template
				for(tpl in relatedTemplate) {
					if(tpl === 'swatch' && obj.swatch !== null) {
						relatedShouldHide = !obj.relatedShowMain;
						str += priv.renderItemReplace.apply($this, [obj, relatedTemplate[tpl], {idPrefix: obj.id + '_', relatedHide: relatedShouldHide}]);
					}


					for (var i = 0; i < related.length; i++) {
						if(related[i] === undefined) continue;
						//We want to concatenate string results for each of the parts to send into the next replace.
						relatedShouldHide = true;
						if($this.filter.related !== undefined && obj.relatedShowVariants !== undefined) {
							for (var j = 0; j < obj.relatedShowVariants.length; j++) {
								if(obj.relatedShowVariants[j] === related[i].id) {
									relatedShouldHide = false;
									break;
								}
							}
						}
						if(priceTemplate !== undefined && relatedTemplate[tpl].indexOf('{price}') !== -1 && typeof related[i].price === 'object') related[i].price = priv.renderItemPrice.apply($this, [related[i], priceTemplate]);
						str += priv.renderItemReplace.apply($this, [related[i], relatedTemplate[tpl], {idPrefix: obj.id + '_', relatedHide: relatedShouldHide}]);
					}

					if(str !== '') renderObj['related_' + tpl] = str;
					str = '';
				}

			}

			if(attributeTemplate !== undefined) {
				for(tpl in attributeTemplate) {
					str = '';
					for(var attr in renderObj[tpl]) {
						tempObj = $.extend({}, renderObj);
						tempObj[tpl] = renderObj[tpl][attr];
						str += priv.renderItemReplace.apply($this, [tempObj, attributeTemplate[tpl], {}]);
					}
					renderObj['attribute_' + tpl] = str;
				}
			}

			if(priceTemplate !== undefined) {
				if(typeof renderObj.price === 'object') renderObj.price = priv.renderItemPrice.apply($this, [renderObj, priceTemplate]);
			}


			//All properties have now been set.
			//Loop through template.
			itemTemplate = priv.renderItemReplace.apply($this, [renderObj, itemTemplate, {finalReplace: true}]);

			return itemTemplate;
		},
		renderItemPrice: function(obj, priceTemplate) {
			var $this = this;
			var price = '';

			if(typeof obj.price === 'object' && obj.price.priceAsNumber === 0 && !$this.set.showZeroPrices) {
				return '';
			}

			//Use price template (obj.price)
			if(typeof obj.price === 'object' && obj.price.soldout && priceTemplate.soldout) {
				price = priceTemplate.soldout;
			} else {
				if(typeof obj.price === 'object' && obj.price.showAsOnSale && priceTemplate.discounted) {
					price = priceTemplate.discounted;
				} else if(typeof obj.price === 'object' && obj.price.newProduct && priceTemplate.news) {
					price = priceTemplate.news;
				} else {
					price = priceTemplate.default;
				}
				//Add sale or news classes
				obj.classProductNew = obj.price.newProduct === true ? ' ' + $this.set.classProductNew : '';
				obj.classProductSale = obj.price.showAsOnSale === true ? ' ' + $this.set.classProductSale : '';
			}

			//Overwrite the price property with the price template.
			price = price.replace(/\{(.+?)\}/g, function(value, text) {
				return obj.price[text] === undefined ? '' : obj.price[text];
			});

			//Returns obj.price with correct HTML
			return price;
		},
		renderItemReplace: function(obj, itemTemplate, options) {

			var $this = this;
			var clearImageLine = false;
			var finalReplace = options.finalReplace || false;

			//Generic non-item specific properties.
			obj.image = typeof obj.image === 'object' ? obj.image : [obj.image];
			obj.hash = $this.set.currentHash.indexOf('#') === -1 ? '#' + $this.set.currentHash : $this.set.currentHash;
			obj.root = encodeURIComponent(window.location.origin);
			obj.locale = priv.getLocale();
			obj.category = $this.set.category;

			itemTemplate = itemTemplate.replace(/\{(.+?)\}/g, function(value, text) {
				//Replace text with property only if property exists.
				var str = '';
				var pos;
				var attribute = '';
				var attributeType = '';
				var attributeParts = [];

				if(text.substring(0,6) === 'image_') {
					pos = parseInt(text.substring(6)) - 1;
					str = obj.image[pos];
					if(str === undefined || str === null) {
						clearImageLine = true;
						return '{#}';
					}
				} else if (text.substring(0,10) === 'attribute_' && !finalReplace) {

					attributeParts = text.split('_');
					attribute = attributeParts[1];
					attributeType = attributeParts.length > 2 ? attributeParts[2] : '';

					if(obj[attribute] !== null && typeof obj[attribute] === 'object') {
						if(obj[attribute].desc !== undefined) {
							str = priv.hexOrImage(obj[attribute], attributeType, $this.set.forceHex, $this.set.swatchClass);
						}
					}

				} else if(text.indexOf('|') !== -1) {
					text = text.split('|');
					switch(text[1]) {
						case 'title': 
							str = obj[text[0]] !== undefined ? priv.titleCase(obj[text[0]]) : '';
							break;
					}
				} else if(text === 'relatedHide' && options.relatedHide !== undefined) {
					str = options.relatedHide ? $this.set.disabledClass : '';
				} else if(text === 'id' && options.idPrefix !== undefined) {
					str = options.idPrefix + obj[text];
				} else {
					str = obj[text] !== undefined ? obj[text] : '';
				}

				return str;
			});

			//Removes text if there was no replace found in object.
			if(clearImageLine) itemTemplate = itemTemplate.replace(/<[^<]*\{#\}[^>]*>/g, '');

			//Returns a string
			return itemTemplate;

		},
		hexOrImage: function(obj, type, forceHex, swatchClass) {
			var str = '';

			if(obj.image !== undefined && obj.image.url !== undefined && !forceHex) {
				if(type === 'style') {
					str = '<span class="' + swatchClass + '" style="background-image: url(' + obj.image.url + ');"></span>';
				} else {
					str = obj.image.url;
				}
			} else if(obj.hex !== undefined) {
				obj.hex.replace(/#?([a-f,0-9]{3,6})/ig, function(value, text) {
					str += '<span class="' + swatchClass + '" style="background-color: #' + text + ';"></span>';
				});
			}

			return str;
		},
		relatedToItems: function(arr, onlyMain) {
			//product_variant

			// Include in related items here into their "original" objects.
			// If given the following array of included product ID's
			// 7123, 7123_7124, 7124, 7124_7123, 7125, 7126_7125 
			// We should show 7123, 7124, 7125, 7126 (but only the variant)
			// Add flags to the object.
			// related_show_main: boolean
			// related_show_variants: []

			// 7126_7125 7126_7124 7126_7123 7126_7121
			// show 7126 (with 7126_7125 in focus) 

			var $this = this;
			var mainObjs = {};
			var mainObjOrder = [];
			var variants = {};
			var newArr = [];
			var item = '';
			var itemParts = [];
			var itemKey = '';
			var i = 0;

			//Save to variants to not break category order.
			for (i = 0; i < arr.length; i++) {
				if(arr[i].indexOf('_') !== -1) {
					itemParts = arr[i].split('_');
					if(variants[itemParts[0]] === undefined) {
						//If root element missing initiate it and add flag
						variants[itemParts[0]] = {
							'relatedShowVariants': [itemParts[1]]
						};
					} else {
						//Push new variant onto array.
						variants[itemParts[0]].relatedShowVariants.push(itemParts[1]);
					}
				} else {
					mainObjs[arr[i]] = {'relatedShowMain': true};
					mainObjOrder[mainObjOrder.length] = arr[i];
				}
			}

			for (itemKey in variants) {
				if(mainObjs[itemKey] !== undefined) {
					//Add variants to main array
					mainObjs[itemKey].relatedShowVariants = variants[itemKey].relatedShowVariants;
				} else if(!onlyMain) {
					//only apply variants that don't have main values now.
					mainObjs[itemKey] = variants[itemKey];
					mainObjs[itemKey].relatedShowMain = false;
					mainObjOrder[mainObjOrder.length] = itemKey;
				}
			}

			for (i = 0; i < mainObjOrder.length; i++) {
				item = $this.filter.productIds[mainObjOrder[i]];
				newArr[i] = $this.filter.products[item];
				newArr[i].relatedShowMain = mainObjs[mainObjOrder[i]].relatedShowMain;
				newArr[i].relatedShowVariants = mainObjs[mainObjOrder[i]].relatedShowVariants;
			}

			return newArr;
		},
		keysToItems: function(arr) {
			var $this = this;
			var newArr = [];
			var item = '';

			for (var i = 0; i < arr.length; i++) {
				item = $this.filter.productIds[arr[i]];
				if(item === undefined) continue;
				newArr[i] = $this.filter.products[item];
			}

			return newArr;
		},
		//Helper functions
		unique: function(a) {
			//Optimized: jsperf test http://jsperf.com/hash-sieving/3
			//Returns an array with only unique values
			var na = [];
			lbl:for(var i = 0; i < a.length; i++) {
				for(var j = 0; j < na.length; j++) {
					if(na[j] == a[i])
						continue lbl;
				}
				na[na.length] = a[i];
			}
			return na;
		},
		intersect: function(a, b) {
			//Optimized: jsperf test http://jsperf.com/replace-function-or-several-replaces
			//Only choose items that are in both arrays (a and b)
			//Returns array
			var inter = [], inA = {}, i = 0;

			for (i = 0; i < a.length; i++) {
				inA[a[i]] = true;
			}
			for(i = 0; i < b.length; i++) {
				if(inA[b[i]]) inter[inter.length] = b[i];
			}
			return inter;
		},
		dehashify: function(str) {
			//Returns obj
			var $this = this;
			var obj = {};
			var filters = str.substring(1).split('&');
			var tmpArr = [];
			var type = '';
			var value = [];

			if(str.length > 1 && str.indexOf('/') !== 1) {
				for (var i = 0; i < filters.length; i++) {
					tmpArr = filters[i].split('=');
					if(tmpArr[0] === 'page') {
						obj.page = parseInt(tmpArr[1]);
					} else {
						type = tmpArr[0].split('~');
						switch (type[1]) {
							case 'sand':
								value = tmpArr[1].split('+');
								break;
							case 'sor':
							case 'r':
							case 's':
							case 'f':
								value = tmpArr[1].split(',');
								break;
							default:
								value = tmpArr[1];
								break;
						}
						if(type[0] !== 'sort') $this.set.latestCat = type[0];
						obj[type[0]] = {type: type[1], value: value};
					}
				}
			}

			//Set page number if not set.
			if(obj.page === undefined) obj.page = 1;

			return obj;
		},
		hashify: function(obj) {
			//Returns str
			var strHash = '';
			var value = null;

			for (var filter in obj) {
				//Handling of arrays of values.
				if(filter === 'page') {
					if(obj[filter] > 1) strHash += filter + '=' + obj[filter] + '&';
				} else {
					switch (obj[filter].type) {
						case 'sand':
							value = obj[filter].value.join('+');
							break;
						case 'sor':
						case 's':
						case 'r':
						case 'f':
							value = obj[filter].value.join(',');
							break;
						default:
							value = obj[filter].value;
							break;
					}
					strHash += filter + '~' + obj[filter].type + '=' + value + '&';
				}
			}
			strHash = strHash.substring(0, strHash.length - 1);
			return strHash.length ? strHash : '';
		},
		titleCase: function(s) {
			return s.toLowerCase().replace(/^\S|\s\S/g, function(a) { return a.toUpperCase(); });
		},
		getLocale: function() {
			var localeText = window.location.pathname.split('/')[1];
			if(/\w/.test(localeText)) {
				return '/' + localeText;
			} else {
				return '';
			}
		},
		urlify: function(str) {
			//Returns str
			return str.toLowerCase().replace(/\s{2,}|\s/g,'-');
		}
	};

	var methods = {
		init: function(options) {

			var init = $.extend({}, defaultOpts, options);
			
			window.requestAnimFrame = (function() { return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60); }; })();

			return this.each(function() {
				var $this = $(this);
				var objectData = $this.data();

				$this.set = $.extend({}, init, objectData, privateOpts);

				if($this.set.debug === true) {
					console.warn(':::: YS Filter Debug has been set to true ::::');
					console.log('Options -> ', $this.set);

					if($this.set.url === undefined) {
						console.warn('No url has been defined i.e. loadproducts');
					}
				}

				priv.init.apply($this);
				$this.data($this.set);

			});
		}
	};

	var defaultOpts = {
		limit: 20,
		preSort: false,
		splitSizes: false,
		appendItems: false,
		multipleImgs: false,
		filterOptions: {},
		paging: {
			contClass: 'filterPaging',
			nextBtnClass: 'filterPaging-next',
			prevBtnClass: 'filterPaging-prev',
			allBtnClass: 'filterPaging-all'
		},
		updateWHash: false,
		hideAncestor: false,
		repeatStartFakeSelect: false,
		outputChosenFiltersId: false,
		forceHex: false,
		sortFiltersAlphabetically: false,
		undefinedCat: 'Unsorted',
		undefinedCatId: 'unsorted',
		itemContId: 'filterItems',
		selectedClass: 'u-selected',
		disabledClass: 'u-disabled',
		groupClass: 'filterControls-group',
		classProductNew: 'product--new',
		classProductSale: 'product--sale',
		pageTotalClass: 'js-pages-total',
		pageCurrentClass: 'js-pages-current',
		itemTotalClass: 'js-items-total',
		allItemsTotalClass: 'js-allItems-total',
		currentTotalClass: 'js-items-current',
		swatchClass: 'colorList-color'
	};

	var privateOpts = {
		filteredBy: {
			page: 1
		},
		currentHash: '',
		latestCat: '',
		resetLatestCat: false,
		currentItems: [],
		oldLimit: null,
		relevantFilters: null,
		initialLoad: false,
		pages: 1
	};

	$.fn.ysFilter = function(method) {

		//arguments local variable to all functions.
		if (methods[method]) {
			//If explicitly calling a method.
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			//If method is an "object" (can also be an array) or no arguments passed to the function.
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.ysFilter');
		}

	};

})(jQuery, window);