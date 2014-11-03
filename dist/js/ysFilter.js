;(function($, window) {

	//Private Methods
	var priv = {
		init: function() {
			var $this = this;
			
			//Allow css to handle display while loading.
			$this.addClass('ysFilter-loading ysFilter-init');
			$this.set.currentHash = window.location.hash;

			if($this.set.currentHash == '#') {
				$this.set.currentHash = '';
			} else {
				$this.addClass('ysFilter-filtered');
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
					$this.set.limit = $this.filter.settings.limit;
					$this.set.pages = Math.ceil(Object.keys($this.filter.productIds).length / $this.set.limit);

					//If previously filtered. Filter and render relevant products.
					if($this.set.currentHash !== '') {
						$this.set.filteredBy = priv.dehashify.apply($this, [window.location.hash]);
						if($this.set.filteredBy.page > 1) {
							$this.find($this.set.filterOptions.paging.prevBtnClass).closest('.paging').show();
							$this.set.initialLoad = true;
						}

						priv.gatherItems.apply($this);
						priv.reSelect.apply($this);
					} else {
						//We clone the array objects in the array however keep references. 
						//Now we can sort the array without screwing original order.
						if($this.set.preSort !== false) {
							priv.gatherItems.apply($this);
						} else {
							//Replace even on first load if debug: true
							if($this.set.debug === true) 
								priv.gatherItems.apply($this);
						}
					}
				}
			});

		},
		preFilter: function() {
			var $this = this,
				renderItems = [],
				tmpArr = [],
				i = 0,
				categories = null,
				paramTypes = null,
				totalItems = null,
				filterItem = '',
				cat = '';

			//Remove excess data from filter object.
			$this.set.initItems = $this.filter.products.slice(0);
			$this.set.currentItems = $this.set.initItems;

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
					if(category.indexOf($this.set.category) === 0) {
						tmpArr[i] = categories[category];
						//console.log('√√√ ', categories[category], category);
						i++;
					} else {
						//console.log('!!! ', categories[category], category);
					}
				}

				//These are all the relevant items for the rest of the filtering.
				renderItems = Array.prototype.concat.apply([], tmpArr);
				
				$this.set.relevantFilters = {};

				for (j = 0; j < paramTypes.length; j++) {
					cat = paramTypes[j][0].replace(/_\d/, '');
					filterItem = totalItems[cat];

					for(var subCat in filterItem) {
						tmpArr = [];

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
				$this.set.initItems = priv.keysToItems.apply($this, [renderItems]);
				$this.set.currentItems = $this.set.initItems;

			}

		},
		buildFilter: function() {
			//Builds filtering elements.
			var $this = this,
				$filters = $this.find('.' + $this.set.groupClass),
				html = '',
				create = '',
				tplAdditions = {},
				len = $this.filter.settings.filter.length,
				splitSizeEnd = $this.set.splitSizes !== false ? '</' + $this.set.splitSizes.match(/<([a-z]+)/)[1] + '>' : '';

			//Sort ends up in a different part of the filter attrs. Needs to be looped through seperately.
			if($this.filter.settings.sort !== undefined) {
				var $sort = $('#sort'),
					initDesc = $this.filter.settings.sort.init !== undefined ? $this.filter.settings.sort.init : '';

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
					html = '<div class="filter-value fake-select"><span class="title" data-orig-text="' + initDesc + '">' + initDesc + '</span><ul class="ul-clean fake-select-list">' + html + '</ul></div>';
				} else if(create === 'a') {

				}
				if(create === 'select' || create === 'multiSelect') html = '<select class="filter-value"' + (create === 'multiSelect' ? ' multiple="multiple"' : '') + '><option value="0">' + initDesc + '</option>' + html + '</select>';

				$sort.append(html);
			}

			for (var i = 0; i < len; i++) {
				var catId = $this.filter.settings.filter[i][0],
					cat = catId.replace(/_\d/, ''),
					catDesc = $this.filter.settings.filter[i][1],
					$filter = $filters.filter('#' + catId),
					relevantFilters = $this.set.relevantFilters || $this.filter.filter,
					type = $filter.data('type'),
					maxLength = $filter.data('max-length') || null,
					numItems = 0,
					subHtml = '',
					desc = '',
					whichGroup = null,
					currGroup = null,
					depth = null,
					filterId = '',
					categoriesDesc = [],
					categoriesId = [],
					uniqueCategories = {};
				
				html = '';
				create = $filter.data('create');
				tplAdditions = $this.set.filterOptions[catId] || {};

				for (var underCat in relevantFilters[cat]) {
					desc = underCat;

					if($this.filter.filterDescriptions[cat] !== undefined && $this.filter.filterDescriptions[cat][underCat] !== undefined) {
						if($this.filter.filterDescriptions[cat][underCat].color_img !== undefined) {
							desc = [desc, $this.filter.filterDescriptions[cat][underCat].color_img];
						} else if($this.filter.filterDescriptions[cat][underCat].color_hex !== undefined) {
							desc = [desc, $this.filter.filterDescriptions[cat][underCat].color_hex];
						} else {
							desc = $this.filter.filterDescriptions[cat][underCat];
						}
					}

					if(desc.indexOf('::') !== -1) {
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
					html = '<div class="filter-value fake-select"><span class="title" data-orig-text="' + catDesc + '">' + catDesc + '</span><ul class="ul-clean fake-select-list">' + subHtml + html + '</ul></div>';
				}
				if(create === 'select' || create === 'multiSelect') html = '<select name="' + cat + '" class="filter-value"' + (create === 'multiSelect' ? ' multiple="multiple"' : '') + '><option value="0">' + catDesc + '</option>' + html + '</select>';
				$filter.append(html);
			}

			//Filter is loaded and ready to use.
			$this.removeClass('ysFilter-loading ysFilter-filtered').addClass('ysFilter-loaded');
			
			//Trigger callback for added functionality
			if($this.set.afterFilterRendered !== undefined) {
				$this.set.afterFilterRendered();
			}

		},
		buildFilterTemplate: function(create, id, val, desc, obj) {
			//Loop through filter alterations.
			//Change them to string values.
			//Insert them in templates.
			var $this = this,
				valObj = {'desc': desc},
				classes = '',
				wrapStart = '',
				wrapEnd = '',
				attrs = '',
				style = '',
				backgroundStyle = '',
				backgroundText = '',
				background = false;

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

			if(typeof desc === 'object') {
				valObj.desc = desc[0];
				if(background) {
					style = (desc[1] && desc[1].substr(0,4) === 'http') ? 'background-image: url(\'' + desc[1] + '\')' : (desc[1].substr(0,1) === '#') ? 'background-color: ' + desc[1] : 'background-color: #' + desc[1];
				}
			}

			if($this.set.eachFilterAttrs !== undefined) {
				valObj = $this.set.eachFilterAttrs(valObj);
			}

			backgroundStyle = background ? ' style="' + style + '"' : '';
			backgroundText = background ? '' : valObj.desc;

			id = id.replace(/\W/g, '-');

			//Repeating elements
			if(create === 'a') return wrapStart + '<a id="' + id + '" class="' + classes + ' filter-value" href="#"' + backgroundStyle + ' data-value=\'' + val + '\'' + attrs + '>' + backgroundText + '</a>' + wrapEnd;
			if(create === 'select' || create === 'multiSelect') return '<option id="' + id + '" value="' + val + '">' + valObj.desc + '</option>';
			if(create === 'fakeSelect') return '<li class="' + classes + '"' + attrs + '><a id="' + id + '" class="filter-value" href="#"' + backgroundStyle + ' data-value=\'' + val + '\'>' + backgroundText + '</a></li>';
			//These need parents for disabling and selecting.
			if(create === 'radio') return wrapStart + '<input id="' + id + '" type="radio" class="' + classes + ' filter-value" value="' + val + '" /><label' + backgroundStyle + ' for="' + id + '">' + backgroundText + '</label>' + wrapEnd;
			if(create === 'checkbox') return wrapStart + '<input id="' + id + '" type="checkbox" class="' + classes + ' filter-value" value="' + val + '" /><label' + backgroundStyle + ' for="' + id + '">' + backgroundText + '</label>' + wrapEnd;
			//Handling of grouping for tree categories
			if(create === 'group_select') return '<optgroup label="' + valObj.desc + '">' + val + '</optgroup>';
			//Initial remove value
			if(create === 'start_fakeSelect') return '<li class="' + classes + '"' + attrs + '><a class="remove" href="#">' + valObj.desc + '</a></li>';
			return '';
		},
		enableEvents: function() {
			var $this = this;

			$this.on('change', '.filter-group select.filter-value', function(e) {
				e.preventDefault();
				var type = $(this).closest('.filter-group').data('type'),
					cat = $(this).closest('.filter-group').attr('id'),
					val = $(this).val();
				
				if(cat !== 'sort') $this.set.latestCat = cat;

				priv.updateFilter.apply($this, [type, cat, val]);
			});

			$this.on('click', '.filter-group a.filter-value', function(e) {
				e.preventDefault();
				var type = $(this).closest('.filter-group').data('type'),
					cat = $(this).closest('.filter-group').attr('id'),
					val = $(this).data('value');
				
				if(type !== 's' && type !== 's1') {
					$this.set.latestCat = cat;
				} else { 
					if(!$(this).hasClass('selected')) {
						$(this).closest('.filter-group').find('.filter-value').removeClass($this.set.filterSelectedClass);
					}
				}

				if(!$(this).hasClass('disabled') && !$(this).parent().hasClass('disabled')) {
					$(this).toggleClass($this.set.filterSelectedClass);
					priv.updateFilter.apply($this, [type, cat, val]);
				}
			});

			$this.on('click', '.remove', function(e) {
				e.preventDefault();
				//Remove all from group
				var $group = $(this).closest('.filter-group'),
					type,
					cat,
					val;
				
				if($group.length === 0) $group = $(this).siblings('.filter-group');

				type = $group.data('type');
				cat = $group.attr('id');
				val = 'remove';

				$group.find('.' + $this.set.filterSelectedClass).removeClass($this.set.filterSelectedClass);
				$group.find('select').find('option').removeAttr('disabled').filter(':selected').removeAttr('selected');
				priv.updateFilter.apply($this, [type, cat, val]);
			});

			$this.on('click', '.remove-all', function(e) {
				e.preventDefault();
				//Remove all filters
				$this.set.filteredBy = {};
				$this.set.filteredBy.page = 1;
				$this.set.currentHash = '';
				window.location.hash = $this.set.currentHash;
				$this.find('.filter-group .' + $this.set.filterSelectedClass).removeClass($this.set.filterSelectedClass);
				$this.find('.filter-group option').removeAttr('disabled').filter(':selected').removeAttr('selected');
				if($this.set.onFilterChanged !== undefined) $this.set.onFilterChanged();
				priv.gatherItems.apply($this);
			});

			$this.on('click', $this.set.filterOptions.paging.nextBtnClass, function(e) {
				e.preventDefault();
				//Next Page
				if($this.set.filteredBy.page < $this.set.pages) {
					$this.set.filteredBy.page += 1;
					$this.set.currentHash = priv.hashify($this.set.filteredBy);
					if($this.set.currentHash.length > 0) window.location.hash = $this.set.currentHash;
					$this.find('.current-page').text($this.set.filteredBy.page);
					priv.gatherItems.apply($this);
				}
				return false;
			});

			$this.on('click', $this.set.filterOptions.paging.prevBtnClass, function(e) {
				e.preventDefault();
				//Prev Page
				if($this.set.filteredBy.page > 1) {
					$this.set.filteredBy.page -= 1;
					$this.set.currentHash = priv.hashify($this.set.filteredBy);
					if($this.set.currentHash.length > 0) window.location.hash = $this.set.currentHash;
					$this.find('.current-page').text($this.set.filteredBy.page);
					priv.gatherItems.apply($this);
				}
			});

			$this.on('click', $this.set.filterOptions.paging.allBtnClass, function(e) {
				e.preventDefault();
				var $paging = $(this).closest('.paging');
				//Prev Page
				if($paging.hasClass('viewing-all')) {
					$this.set.limit = $this.set.oldLimit;
					$paging.removeClass('viewing-all');
					$this.find('.current-page').text($this.set.filteredBy.page);
				} else {
					$this.set.oldLimit = $this.set.limit;
					$this.set.limit = 'none';
					$paging.addClass('viewing-all');
					$this.find('.current-page').text(1);
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
				break;
			}

		},
		updateFilter: function(type, cat, val) {
			//Must update
			//Updates filter object.
			var $this = this,
				currVal = null,
				posInArray = null;

			if(type === 's1' || type === 's') {
				//Select One
				currVal = $this.set.filteredBy[cat] !== undefined ? (typeof $this.set.filteredBy[cat].value === 'object') ? $this.set.filteredBy[cat].value.join(',') : $this.set.filteredBy[cat].value : '';
				if(currVal === val || val === 0 || val === '0' || val === 'remove') {
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
					//if multiple select is emtpy it returns val() as null.
					delete $this.set.filteredBy[cat];
					priv.reSelectLatestFilter.apply($this);

				} else if(typeof val === 'object') {
					//Multiple select returns val() as an array.
					if(val.length > 0) {
						$this.set.filteredBy[cat] = {type: type, value: val};
					}

				} else {
					currVal = $this.set.filteredBy[cat] !== undefined && $this.set.filteredBy[cat].value !== undefined ? $this.set.filteredBy[cat].value : [];
					posInArray = $.inArray(val, currVal);

					if(posInArray !== -1 || val === 0 || val === '0') {
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

			//Filter has changed reset to page 1
			$this.set.filteredBy.page = 1;
			
			//Update Hash - hashify object
			$this.set.currentHash = priv.hashify($this.set.filteredBy);
			window.location.hash = $this.set.currentHash;

			//Gather items from each filter.
			priv.gatherItems.apply($this);
			
			//Filter items have changed do callback. 
			if($this.set.onFilterChanged !== undefined) $this.set.onFilterChanged();


			if($this.set.updateWHash !== false) {
				$('.' + $this.set.updateWHash).each(function() {
					var href = $(this).attr('href');
					$(this).attr('href', href + '#' + $this.set.currentHash);
				}) ;
			}
		},
		reSelect: function() {
			//Show correct values on filter based on hash load.
			var $this = this,
				filteredBy = $this.set.filteredBy,
				$filter = {},
				$filterOpt = {},
				filterVal = '',
				type = '';

			for(var filter in filteredBy) {
				$filter = $this.find('#' + filter);
				filterVal = filteredBy[filter].value;
				type = $filter.data('create');
				if($filter.length === 0) continue;
				if(filter === 'sort') filterVal = filteredBy[filter].value.join('-');

				if(typeof filteredBy[filter].value === 'object' && filter !== 'sort') {
					for(var i = 0; i < filteredBy[filter].value.length; i++) {
						filterVal = filteredBy[filter].value[i].replace(/\W/g, '-');
						if(type === 'select' || type === 'multiSelect') {
							$filter.find('#' + filter + '-' + filterVal).attr('selected', true);
						} else {
							if(type === 'fakeSelect') {
								$filter.find('#' + filter + '-' + filterVal).closest('li').addClass($this.set.filterSelectedClass);
							} else {
								$filter.find('#' + filter + '-' + filterVal).addClass($this.set.filterSelectedClass);
							}
						}
					}
				} else {
					$filterOpt = $filter.find('#' + filter + '-' + filterVal.replace(/\W/g, '-'));
					if(type === 'select' || type === 'multiSelect') {
						$filterOpt.attr('selected', true);
					} else if(type === 'fakeSelect') {
						$filterOpt.addClass('selected');
						$filter.find('.fake-select').addClass('selected').find('span').text($filterOpt.text());
					} else {
						$filterOpt.addClass($this.set.filterSelectedClass);
					}
				}
			}

			//Filter items have changed do callback. 
			if($this.set.onFilterChanged !== undefined) $this.set.onFilterChanged();

		},
		gatherItems: function() {
			//Collect all items to be printed out based on filter.
			var $this = this,
				catRegexp = /_\d$/,
				filteredBy = $this.set.filteredBy,
				paramTypes = $this.filter.settings.filter,
				totalItems = $this.set.relevantFilters || $this.filter.filter,
				filters = 0,
				i = 0,
				filterValue = '',
				tmpArr = [],
				newItems = [],
				renderItems = [];

			var catTotal, catId, itemTotal, $filter, $item, create, maxLength, prop, compiledObj, updateFilterObj, depth, subCat;

			var matchUri = function(filter, value) {
				var urlArray = [],
					j = 0,
					catDepth = parseInt(filter.slice(-1), 10) - 1,
					filterId = filter.replace(catRegexp, ''),
					uriValue = (value === $this.set.undefinedCatId) ? undefined : value;

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
				//Runs per set of filters.
				if(filter === 'page' || filter === 'sort') continue;
				if(filteredBy[filter].type === 's1') {
					if(catRegexp.test(filter)) {
						newItems = matchUri(filter, filteredBy[filter].value);
					} else {
						newItems = totalItems[filter][filteredBy[filter].value];
					}
				} else if(filteredBy[filter].type === 'sor') {
					//Concatente all arrays
					//Product only needs to match one value to be relevant.
					for (i = 0; i < filteredBy[filter].value.length; i++) {
						//Runs per set of values in a filter.
						if(catRegexp.test(filter)) {
							tmpArr[i] = matchUri(filter, filteredBy[filter].value[i]);
						} else {
							console.log('var ', filteredBy[filter].value[i], totalItems[filter][filteredBy[filter].value[i]]);
							tmpArr[i] = totalItems[filter][filteredBy[filter].value[i]];
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

			if(filters === 0) {
				//Same here if the intersect returns nothing.
				//Clone filter items to return everything back to original state.
				//Objects retain references
				$this.set.currentItems = $this.set.initItems.slice(0);
				$this.find('.filter-group').find('.disabled,.' + $this.set.filterSelectedClass).removeClass('disabled ' + $this.set.filterSelectedClass);
				$this.find('.filter-group option').removeAttr('disabled').filter(':selected').removeAttr('selected');

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
					//Previous filter.
					if($this.set.latestCat !== paramTypes[i][0]) {
						
						catTotal = 0;
						catId = paramTypes[i][0].replace(/_\d$/, '');
						itemTotal = 0;
						$filter = $this.find('#' + paramTypes[i][0]);
						$item = {};
						create = $filter.data('create') || null;
						maxLength = $filter.data('max-length') || null;
						prop = '';
						compiledObj = {};
						updateFilterObj = totalItems[catId];
						depth = ($filter.data('depth') - 1) || null;
						tmpArr = [];

						if(depth !== null) {

							//Need to join arrays together before being intersected.
							for(subCat in totalItems[catId]) {
								var initArr = [],
									categoriesId = subCat.split('/');

								//If there is no head desc/Id skip
								if(categoriesId[depth] === undefined) continue;
								id = categoriesId[depth];
								initArr = (compiledObj[id] === undefined) ? [] : compiledObj[id];
								compiledObj[id] = Array.prototype.concat.apply(initArr, totalItems[catId][subCat]);
							}

							updateFilterObj = compiledObj;

						}

						for(subCat in updateFilterObj) {

							var id = subCat.replace(/\W/g, '-'),
								intersected = priv.intersect(renderItems, updateFilterObj[subCat]);

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
										$item.closest('li').removeClass('disabled').attr('title', tmpArr.length);
									} else {
										$item.removeClass('disabled').attr('title', tmpArr.length);
									}
								}
								itemTotal += tmpArr.length;
								catTotal++;

							} else {
								
								//Disable category no items for that option.
								if(prop === 'option' || prop === 'input') {
									$item.attr('disabled', true);
								} else {
									if(create === 'fakeSelect') {
										//Remove class disabled
										$item.closest('li').addClass('disabled').removeAttr('title');
									} else {
										$item.addClass('disabled').removeAttr('title');
									}
								}

							}

						}

						
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
							$filter.removeClass('disabled').attr('title', itemTotal);
						} else {
							$filter.addClass('disabled').removeAttr('title');
						}
					}
				}


				//Modify array keys to return item objs show only unique items.
				renderItems = priv.unique(renderItems);
				$this.set.currentItems = priv.keysToItems.apply($this, [renderItems]);
			}

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
			var $this = this,
				items = $this.set.currentItems,
				itemsLen = items.length,
				sortBy = preSortBy || $this.set.filteredBy.sort.value[0],
				sortId = (preSortBy && preSortDir) ? preSortBy + '-' + preSortDir : $this.set.filteredBy.sort.value.join('-'),
				i = 0,
				sortArr = [];

			for (i = 0; i < itemsLen; i++) {
				//Create array
				sortArr[i] = {obj: items[i]};
				if(sortBy === 'price') {
					if(parseFloat(items[i].price.priceAsNumber, 10) != items[i].price.priceAsNumber)
						foo = items[i].price;
					// console.log(parseInt(items[i].price.priceAsNumber, 10), items[i].price);
					sortArr[i][sortBy] = parseFloat(items[i].price.priceAsNumber, 10);
				} else if(sortBy === 'news') {
					sortArr[i][sortBy] = items[i].price.newProduct ? 0 : 10;
				} else {
					//Sort alphabetically
					sortArr[i][sortBy] = items[i][sortBy];
				}
			}

			$item = $this.find('#sort-' + sortId);

			if($this.find('#sort').data('create') === 'fakeSelect') {
				//Remove class disabled
				$item.closest('li').addClass($this.set.filterSelectedClass);
			} else {
				$item.addClass($this.set.filterSelectedClass);
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

			if((preSortDir || $this.set.filteredBy.sort.value[1]) === 'dsc') sortArr.reverse();

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
			var $this = this,
				items = $this.set.currentItems,
				len = items.length,
				range = null,
				start = 0,
				html = '';

			if($this.set.initialLoad) {

				if($this.set.appendItems) {
					
					//Take away page 1 and add the rest of the pages as long as there are enough products.
					start = 0;
					range = $this.set.limit * $this.set.filteredBy.page;
					len = (range > len) ? len : range;

					//Force reload of html
					$this.set.pages = 1;

					if(len !== range) {
						//If len equals range then there we've met the max and should hide paging.
						$this.find('.paging').addClass('disabled');
					}

				} else {
					//Set up for paging environment. Not load.
				}

				$this.set.initialLoad = false;

			} else if($this.set.limit !== 'none') {

				if(len > $this.set.limit) {
					//Set how many pages there are after filtering.
					$this.set.pages = Math.ceil(len / $this.set.limit);

					//Not sure this is right.
					$this.find('.paging').removeClass('disabled');
					
					//This gives us max products in pages...
					range = $this.set.limit * $this.set.filteredBy.page;
					//Where to start from.
					start = ($this.set.filteredBy.page - 1) * $this.set.limit;

					len = (range > len) ? len : range;

					//Show previous buttons if page count is greater than 1
					if($this.set.filteredBy.page > 1) {
						$this.find($this.set.filterOptions.paging.prevBtnClass).closest('.paging').removeClass('disabled');
					} else {
						$this.find($this.set.filterOptions.paging.prevBtnClass).closest('.paging').addClass('disabled');
					}

					if(len !== range) {
						//assume we are on the last page.
						$this.find('.paging').addClass('disabled');
					}
				} else {
					//Pages not needed too few items compared to limit.
					$this.set.pages = 1;
					$this.find('.paging').addClass('disabled');
					$this.find($this.set.filterOptions.paging.prevBtnClass).closest('.paging').addClass('disabled');
				}

			} else {
				$this.set.pages = 1;
			}

			$this.find('.page-total').text($this.set.pages);

			for (var i = start; i < len; i++) {
				//Chance to add more items to the object. Must also be in the template.
				if($this.set.eachItemAttrs) items[i] = $this.set.eachItemAttrs($this, items[i], i);
				if($this.set.onItemIndex === i) html += $this.set.onItem(len);
				html += priv.renderItemTemplate.apply($this, [items[i]]);
			}

			if($this.set.appendItems && $this.set.pages !== 1 && $this.set.filteredBy.page !== 1) {
				$this.find('#' + $this.set.itemContId).append(html);
			} else {
				$this.find('#' + $this.set.itemContId).html(html);
			}
			
			if($this.set.afterItemsRendered !== undefined) $this.set.afterItemsRendered();
		},
		renderItemTemplate: function(obj) {
			//Optimized: jsperf test http://jsperf.com/replace-function-or-several-replaces
			//Parse template add data.
			//use text between {} as keys.
			var $this = this,
				template = $this.filter.settings.template.item,
				priceTemplate = '',
				images = [],
				numImages = 0,
				clearImageLine = false,
				imageStr = '',
				varArr = [],
				len = images.length;

			if(typeof obj.price === 'object' && obj.price.soldout) {
				priceTemplate = $this.filter.settings.template.price.soldout;
			} else {
				if(typeof obj.price === 'object' && obj.price.showAsOnSale) {
					priceTemplate = $this.filter.settings.template.price.discounted;
				} else {
					priceTemplate = $this.filter.settings.template.price.default;
				}
			}

			if(typeof obj.image === 'object') {
				images = obj.image;
			} else {
				images[0] = obj.image;
			}

			obj.hash = $this.set.currentHash.indexOf('#') === -1 ? '#' + $this.set.currentHash : $this.set.currentHash;
			obj.root = encodeURIComponent(window.location.origin);
			obj.category = $this.set.category;
			
			if(typeof obj.priceHTML === 'undefined') {
				obj.priceHTML = priceTemplate.replace(/\{(.+?)\}/g, function(value, text) {
					return obj.price[text];
				});
			}

			template = template.replace(/\{(.+?)\}/g, function(value, text) {
				//Replace text with property only if property exists.
				//Special logic for not enough images to fill html.
				var str = '',
					pos, 
					attribute;

				if(text.substring(0,6) === 'image_') {
					pos = parseInt(text.substring(6)) - 1;
					str = images[pos];
					if(str === undefined || str === null) {
						clearImageLine = true;
						return '{#}';
					}
				} else if(text.substring(0,5) === 'attr_') {
					attribute = text.substring(5);
					if(obj[attribute] !== null && typeof obj[attribute] === 'object') {
						for(var type in obj[attribute]) {
							if(obj[attribute][type].image !== undefined && obj[attribute][type].image.url !== undefined && typeof obj[attribute][type].image === 'object') {
								str += '<img class="filter-list-attribute" src="' + obj[attribute][type].image.url + '">';
							}
						}
					}
				} else if(text.indexOf('|') !== -1) {
					text = text.split('|');
					switch(text[1]) {
						case 'title': 
							str = obj[text[0]] !== undefined ? priv.titleCase(obj[text[0]]) : '';
							break;
					}
				} else {
					str = obj[text] !== undefined ? obj[text] : '';
				}
				return str;
			});

			if(clearImageLine) template = template.replace(/<[^<]*\{#\}[^>]*>/g, '');

			return template;
		},
		keysToItems: function(arr) {
			var $this = this,
				newArr = [],
				item = '';

			for (var i = 0; i < arr.length; i++) {
				item = $this.filter.productIds[arr[i]];
				newArr[i] = $this.filter.products[item];
			}

			return newArr;
		},
		//Helper functions
		unique: function(a)  {
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
			var $this = this,
				obj = {},
				filters = str.substring(1).split('&'),
				tmpArr = [],
				type = '',
				firstFilter = true,
				value = [];

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
						if(firstFilter && type[0] !== 'sort') {
							firstFilter = false;
							$this.set.latestCat = type[0];
						}
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
			var strHash = '',
				value = null;

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
			return s.toLowerCase().replace(/\b./g, function(a) { return a.toUpperCase(); });
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
				var $this = $(this),
					objectData = $this.data();

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
		updateWHash: false,
		hideAncestor: false,
		repeatStartFakeSelect: false,
		undefinedCat: 'Unsorted',
		undefinedCatId: 'unsorted',
		itemContId: 'item-cont',
		filterSelectedClass: 'selected',
		groupClass: 'filter-group'
	};

	var privateOpts = {
		filteredBy: {
			page: 1
		},
		currentHash: '',
		latestCat: '',
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
			$.error('Method ' +  method + ' does not exist on jQuery.ysFilter');
		}

	};

})(jQuery, window);