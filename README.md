# ysFilter - For filtering and sorting products returned from Silk API. #

A jQuery plugin that asynchronously loads in a JSON of all the product data in the current category. The plugin is able to be manipulated with a range of callbacks and properties that allow you to change the default properties.

### Usage ###


Initiate with `$(selector).ysFilter({'some':'property'});`   
Invoke methods with `$(selector).ysFilter('method', {'some':'property'});`   
Example

	$('.prod-pics-sect').ysFilter({
		debug: true,
		zIndex: 2000
	})
 

### HTML ###

This is the basic page structure required for the filter to work.
	
	<div id="filter-container" data-url="">
	     <!-- All things related to filter are collected here. -->
	     <div class="filter-group" data-type="">
	         <div id="color" class="filter-group" data-type="<!-- See "Data Types" below -->" data-create="<!-- See "Data Create" below -->"></div>
	         <!-- id === desc->param_types repeat above if needed -->
	     </div>
	     <div class="paging">
	         <a class="next"></a>
	         <a class="prev"></a>
	     </div>
	     <div class="item-container">
	         <!-- items must come directly after parent -->
	     <div>
	</div>

The following structure you can use in combination with Emmet for tab completion.

	div#filter-container[data-url=""]>div.filter-group[data-type=""]+div.paging>a.next+a.prev^div.item-container

### Properties ###


#### limit ####

*Default* `20`  
*Expects* `integer`

How many items to be rendered per page.

	$(selector).ysFilter({limit: 20})

#### splitSizes ####

*Default* `false`  
*Expects* `false, wrapper`

Splits sizes into groups based on size chart otherwise they are presented as one group.

	$(selector).ysFilter({splitSizes: false})

#### appendItems ####

*Default* `false`  
*Expects* `boolean`

Whether to replace items or to append new items with regards to paging.

	$(selector).ysFilter({appendItems: false})

#### updateWHash ####

*Default* `false`  
*Expects* `false, class`

Update other elements on the page by appending hash to those URL's like e.g. product URL's.

	$(selector).ysFilter({updateWHash: false})

#### filterOptions ####

*Default* `{}`  
*Expects* `object with nested objects`

Extend filter HTML with predefined variables. See Filter Variables below.

	$(selector).ysFilter({filterOptions: {
		color: {
			background: true
		}
	}})

#### multipleImgs ####

*Default* `false`  
*Expects* `boolean`

Using several images on product listing for roll overs etc.

	$(selector).ysFilter({multipleImgs: false})

#### eachItemAttrs ####

*Expects* `function($this, items[i], i)`

Add / manipulate obj that renders the template.
Extend object with new properties and add new curly braces in the template that match these.
Expects an object to be returned.

	$(selector).ysFilter({eachItemAttrs: function($this, currentItem, i) {
		//Manipulate Item
		return currentItem;
	}})

#### eachFilterAttrs ####

*Expects* `function(valObj)`

Add extra items to each item rendered.
Replace strings, only *desc* is supported at the moment.
Expects an object to be returned.

	$(selector).ysFilter({eachFilterAttrs: function(currentItem) {
		//Manipulate Filter Item
		return currentItem;
	}})

#### afterFilterRendered ####

*Expects* `function()`

Create a callback to allow extra functionality after filters are built.

	$(selector).ysFilter({afterFilterRendered: function() {
		//Do something now. (uniform, chosen)
	}})

#### afterItemsRendered ####

*Expects* `function()`

Using several images on product listing for roll overs etc.

	$(selector).ysFilter({afterItemsRendered: function() {
		//Do something after products are loaded.
	}})

#### onFilterChanged ####

*Expects* `function()`

Callback to update filter styles manually after changes.

	$(selector).ysFilter({onFilterChanged: function() {
		//Do something after filtering is finished.
	}})

### Template Options ###

The template options allows you to customize the filter methods with extra classes wrap the filters with different containers etc. All following properties should be placed within `filter-id: {}`. The filter-id should pertain to the filter name i.e. `color`, `size`.

**Property** `classNames: []`  
Extra classes in addition of the default `filter-value`

**Property** `background: true`  
If background-image/color should be used or text, useful when create a filter list for colors.

**Property** `attrs: []`  
Add attributes in string format with {} for replacing, {desc}

**Property** `wrapperGroup: '<div class="wrap">'`  
Wrap all objects for the filter.

**Property** `wrapper: '<div class="wrap">'`  
Wrap repeating objects. Wraps each individual item.

**Property** `inner: '<div class="group">'`  
Wrapper per group, groups appear in sizes and categories. This does not wrap the whole filter only a group within that filter.


### Data Types ###

The following functions are used with the attribute `data-type=""`. Data type are methods of the filter defining how this filter interacts with the data. Not all data-types have been created. If none have been chosen the **default** is `s1` which means select only one.
Example:

	<div id="color" data-type="s1" data-create="a"></div>

#### s1 - select-one ####

**As seen in URL** `#cat~s1=value`

This limits the filter to only allow one item to be chosen at a time other items are deselected when another is clicked. If the selected item is clicked again that item is deselected.


#### sand - select-and ####

**As seen in URL** `#cat~sand=value+value1+value2`

multi selectable within group.
refines selection, all values must be met to show article.


#### sor - select-or ####

**As seen in URL** `#cat~sor=value,value1,value2`

multi selectable within group.
grows selection, selected article needs to only meet one value


#### r - range ####

**As seen in URL** `#cat~r=value_min,valuemax`

show items bounds two values need to be presented
can be used in conjuction with min and max to get lower and upper bounds respectively


#### s - sort ####

**As seen in URL** `#sort~s=value,dir`

direction and what is to be sorted.


#### f - fuzzy ####

**As seen in URL** `#cat~f=value,spread`

choose a value
spread of values

### Data Create ###


#### a ####

Create anchor tags
HTML using Emmet:

	a


#### fakeSelect ####

Drop down with anchor tags, use in conjunction with rekaf.
HTML using Emmet:
	
	div>span+ul>li>a


#### select ####

Normal select use afterFilterRendered callback to turn them into uniform selects
HTML using Emmet:

	select>option


#### radio ####

Radio buttons with labels.
HTML using Emmet:

	input[type=radio]+label


#### checkbox ####

Radio buttons with labels.
HTML using Emmet:

	input[type=checkbox]+label


#### Classes ####

Numerous classes can be reassigned. Check the `defaultOpts {}` as to which classes are able to be manipulated.


### Changelog ###

**Version 0.2.3** 
Paging problems. Hash didn't have parseInt. Special use case for images where the image was connected to a variant despite there being no variants.

**Version 0.2.2** 
Moved replace items on first load to do it only on `debug: true` added possibility for remove button to be a sibling.

**Version 0.2.1** 
Fixed on remove of last item in filter category, filter options are refreshed right, previously only worked on .remove before.

**Version 0.2** 
Added multi select as an option in filter, added a new listener for on change of filter.

**Version 0.1.3** 
Pages now show up in URL. Possible to load in to that page.

**Version 0.1.2** 
Fixed a bug with color being read as an array and outputted as a string

**Version 0.1.1** 
Fixed category parsing, was removing a letter if there was only one category.


### Development ###

**Requirements**
* This plugin requires [node](http://nodejs.org/), [gulpjs](http://gulpjs.com/) and [bower](http://bower.io/).
* Follow JSCS guidelines a styling-example.js is also included.
* Run `bower install` and `npm install` to get dev dependencies. Bower and Gulp is assumed to be running globally.

### Contact ###

This is a small plugin by Young Skilled.
Contact [richard](mailto:richard@youngskilled) for more details about this plugin.
