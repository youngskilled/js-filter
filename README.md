# ysFilter - For filtering and sorting products returned from Silk API. #

A jQuery plugin that asynchronously loads in a JSON of all the product data in the current category. The plugin is able to be manipulated with a range of callbacks and properties that allow you to change the default properties.

## Background ##

Beneath the whole filter is a very basic html product list with the only functionality being paging. Products are ideally only shown once and URL's are kept to a minimum. This follows our philosophy at Young/Skilled that a website should be perfectly accessible with javascript even turned off. 
This means when the page is indexed the default HTML page is the only page that is indexed because the javascript adds all the functionality in a separate layer. 
To enable sharing the page's hash is updated every time a filter selection is made which is not seen by a search engine as being a new page. This is also semantically correct in that we are effectively just showing the same content, similar to how an anchor shows the same content but a different section of that content.
This plugin uses a JSON string that has all the information for all the products that are displayed. On every filtering the results are shown nearly instantly as there are no requests being sent or received making the filter more responsive.


### Dependencies ###
ECMAScript > 5.1
jQuery > 1.7


### Usage ###

Initiate with `$(selector).ysFilter({'some':'property'});`   
Invoke methods with `$(selector).ysFilter('method', {'some':'property'});`   
All classes and ids used in properties should omit `.` and `#`
Example

	$('#ysFilter').ysFilter({
		debug: true,
		appendItems: true
	});
 

### HTML ###

This is the basic page structure required for the filter to work.
	
	<div id="ysFilter" data-url="" data-category="">
    <div class="filterControls" data-type="">
      <div id="color" class="filterGroup" data-type="<!-- See "Data Types" below -->" data-create="<!-- See "Data Create" below -->">
      	<!-- HTML is appended here so it's ok to have elements here. -->
      	<!-- Each value receives class filterControls-value -->
      </div>
      <!-- id === filterDescriptions[key] repeat above if needed -->
    </div>
    <div id="filterItems">
      <!-- items must come directly after parent there shouldn't be any container surrounding these -->
    <div>
    <nav class="filterPaging">
      <a class="filterPaging-prev"></a>
      <a class="filterPaging-all"></a>
      <a class="filterPaging-next"></a>
    </nav>
	</div>

Following classes are added to the filter during different phases.  
`ysFilter--loading`,`ysFilter--init`,`ysFilter--filtered`,`ysFilter--loaded`


The following structure you can use in combination with Emmet for tab completion.

	div#ysFilter[data-url="" data-category=""]>div.filterControls[data-type=""]+div#filterItems+div.filterPaging>a.filterPaging-prev+a.filterPaging-all+a.filterPaging-next

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

#### onItemIndex ####

*Default* `undefined`  
*Expects* `integer`

Used in conjunction with onItem. After a certain amount of products built do this.

#### outputChosenFiltersId ####

*Default* `false`  
*Expects* `false, id`

Specify a container where you would like the current filters which are selected to be outputted. If in the filter controls you have an anchor it will copy that with all the classes removing any ID's into this field. Otherwise it will create an anchor per filter.

	$(selector).ysFilter({outputChosenFiltersId: 'js-filtersChosen-list'})

#### forceHex ####

*Default* `false`  
*Expects* `boolean`

Make the renderer use hex when rendering products and filter. Used in conjunction with background color/images for related products and color filter controls.

	$(selector).ysFilter({forceHex: false})

#### sortFiltersAlphabetically ####

*Default* `false`  
*Expects* `boolean`

Sort filters/dropdowns menu to be shown in alphabetical order.

	$(selector).ysFilter({sortFiltersAlphabetically: false})


#### onItem ####

*Expects* `function(length)`

Can add an extra string on a specific item index to be used in conjunction with onItemIndex. Length of items to be rendered also displayed. This is often used in handling banners in category views.

	$(selector).ysFilter({eachItemAttrs: function(length) {
		//number of items in array
		//Add string here
		return returnExtraString;
	}})

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

#### beforeItemsRendered ####

*Expects* `function(type)`  
*Since* `1.3.1`

Good for removing elements before filtering.
One variable is passed of type string defining a complete replace or an append.

	$(selector).ysFilter({beforeItemsRendered: function(type) {
		//Do something before products are loaded.
		if(type === 'replace') ...
	}})

#### customRender ####

*Expects* `function(insertType, filterObj, renderArray)`  
*Since* `1.6.0`

Good for rendering complex layouts.  
Three variables are passed through.  
`insertType` Either `replace` or `append`.  
`renderArray` The original filter object. Be mindful of changes to this so that you don't mutate the object.  
`renderArray` An array of objects containing items html and their original variables.  

	$(selector).ysFilter({beforeItemsRendered: function(insertType, filterObj, renderArray) {
		for(i = 0; i < renderArray.length; i++) {
			html += renderArray[i].html;
		}

		if(insertType === 'replace') {
			$('#filterItems').html(html);
		} else {
			$('#filterItems').append(html);
		}
	}})

#### afterItemsRendered ####

*Expects* `function()`

Using several images on product listing for roll overs etc.

	$(selector).ysFilter({afterItemsRendered: function() {
		//Do something after products are loaded.
	}})

#### onFilterChanged ####

*Expects* `function(filterObj)`
*Updated* `1.3.2`

Callback to update filter styles manually after changes. Filter object sent as a variable.

	$(selector).ysFilter({onFilterChanged: function(filterObj) {
		//Do something after filtering is finished.
		for(var filter in filterObj) { ... }
	}})

#### classProductNew, classProductSale ####

*Default* `product-new`, `product-sale`  
*Expects* `string`

A string to be placed in render template for using Sale or News. A space is always added in the code before the class name.

	$(selector).ysFilter({
		classProductNew: 'product-new',
		classProductSale: 'product-sale'
	})

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


### Classes ###

Numerous classes can be reassigned. Check the `defaultOpts {}` as to which classes are able to be manipulated.


### Initial Data ###


#### url ####

Where to get the JSON object from.

	/loadfilter


#### category ####

Category URI. Everything after the root and no slash is needed in the beginning.

	shop/all


## Changelog ##

**Version 1.9.0** 
Added a new possiblity for a custom price template. Needs to be used in conjunction with `eachItemAttrs` to set a property on the price object `special` which will then invoke the `special` template within the price templates. Used in Artilleriet for grouped products.

**Version 1.8.4** 
Fixed and cleaned up safeguards, remove duplication of functions.

**Version 1.8.3** 
Further safeguarding against items not properly formed by cache.

**Version 1.8.2** 
Safed items not properly formed by cache.

**Version 1.8.1** 
Safed the alphabetical sorting if the object is empty.

**Version 1.8.0** 
Added an option to remove price if price is zero.

**Version 1.7.1** 
Alphabetically sort filters - excluded categories from this as that can be controlled via category sort order.

**Version 1.7.0** 
Added option to alphabetically sort filters.

**Version 1.6.0** 
Added a new callback for custom rendering of html for difficult layouts. Added a new class to filter rendering function.

**Version 1.5.6** 
Added a new class to control swatches.

**Version 1.5.5** 
Fixed bug clearing disabled's on first filter choice.

**Version 1.5.4** 
Removed possibility for limit to be set to 0. Limit must always be explicitly set to a number higher than 0 to ensure the choice is understood.

**Version 1.5.3** 
1.5.2 was tagged incorrectly now is 1.5.3. Made the matching of categories exact from ^category to ^category$ reducing the number of duplicate items as all items are in containing categories.

**Version 1.5.1** 
Tweak to resetting filters properly when changing between options.

**Version 1.5.0** 
Changed how the filter options display disabled or not. If a filter has options that are multiple choice then the filter will be based on the other options and not the option currently being chosen it will give a list of other filterable values to filter with.
i.e. Category -> Backpacks and Accessories are chosen. The user then chooses brown. Previously it was not possible to then add more categories but now all other categories that have something brown in them will be available.
Be aware of the value that can be disabled and selected at the same time I suggest using strikethrough for communication purposes that the option you previously chose is now longer valid but still chosen.

**Version 1.4.0** 
Added touchevents to more quickly read variables from filters. Updated mainly due to changes in rekaf.

**Version 1.3.4** 
Added a new class for retrieving and updating total products.

**Version 1.3.3** 
Bug fix. Latest filter now correctly selects the latest filter in object based on hash.

**Version 1.3.2** 
Added a an argument to `onFilterChanged`. Object of all the various filters running.

**Version 1.3.1** 
Added a new method `beforeItemsRendered` for listening to before the page is to be re-rendered.

**Version 1.3.0** 
Possible minor breaking change. Filter descriptions were using keys instead of displaying values not sure why this was the case may just have been a bug.

**Version 1.2.0** 
0 is removed as a value to reset filter. 'remove' or the same value is the only values available to reset filter with.

**Version 1.1.5** 
Changes to how pagination works. Traditional paged views now working correctly. Support before for only appended items. Individual page navigation is now independently set instead of paging parent class.

**Version 1.1.0** 
Final fixes to the related products. New features also added inc. `outputChosenFiltersId` to paste in filters which are selected. `forceHex` force use hex instead of using image which is default.

**Version 1.0.0** 
Filter now has a complete feature set. A few features are still available to be added, these are regarding more semantic filtering versions i.e. range scale etc.

* Variants are now handled by the filter. Showing even which of the variants that is available.
* Classes have changed in this version to a more OOCSS way of doing things. This means if other clients update to this then it will require class changes on menu etc or if you simply state as options in the filter.


**Version 0.5.8** 
Changed the order in which items are added in additive filtering. If several products are chosen in the same filter then the products chosen last are furthest up.

**Version 0.5.7** 
Fixed paging errors. Referring to non-existing variables

**Version 0.5.6** 
Fixed a bug that showed categories in specific depth. When those categories had products directly related to them.

**Version 0.5.5** 
Fixed some bugs that were also in to "beforeAPI" branch. All anchors are updated with hash on filter change. Fixed a bug with reload with pages and clicking on next. Added selectors for pages/items remaining.

**Version 0.5.4** 
Added in fall backs for possibly undefined price template attributes.

**Version 0.5.3** 
Added in a news filter template for price.

**Version 0.5.2** 
Removed some debugging data.

**Version 0.5.1** 
Pretty much reverted changes in previous commit in 0.5.0 no longer is dependent on changes in SilkAdapterBundle due to refactoring of category arrays. Default sorting is still following the correct order in Silk from here on out.

**Version 0.5.0** 
Default sort order now follows correct sort order in Silk. Needs to have SilkAdapterBundle > 0.4.3 requires filterDescriptions > categorySorting.

**Version 0.4.0** 
Added placeholders for sales and news classes so that sales or news can be used in other parts of the item.

**Version 0.3.4** 
Added locale for sharing.

**Version 0.3.3** 
Fixed titlecase which split on foreign characters for uppercasing. 

**Version 0.3.2** 
Fixed sort by news.

**Version 0.3.1** 
Added a new rendering attribute. {attr|'object key'} i.e. {attr|badges} added titleCase function for doing titles using the |title. Tidied up the code a bit also, formatting and jsHint.

**Version 0.3.0** 
*WARNING BREAKING CHANGES* Filter is now working against a new JSON object returned from Symfony instead of directly against Silk. Some added features are the filter works against all products category agnostic this means also that the category needs to be sent in as a parameter. Pre-sort has also been added as a feature along with some more classes to easily hide/show products while filter loads.

**Version 0.2.6 - Branch beforeAPI** 
Tidied up several issues. All product URL's hashes are updated on filter change. Price is now sorted with sale prices also. Fixed issues on first load of products.

**Version 0.2.5 - Branch beforeAPI**
Fixed an issue regarding reloading of category products. Not all products were reloaded.

**Version 0.2.4 - Branch beforeAPI** 
Fixed problems with urls not assigning root correctly. Fixed sort of currencies that are prefixed with something other than a number. Fixed fallback for filters when sort was first selected. Also added ysFilter-init as a class on the filter.

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

## Understanding the core code ##

Ajax request gets three major elements: `filter`, `productIds` and `products`.
`filter` has arrays of which productID's are relevant for each filtering mechanism.
`productIds` are the ID's used to match products and filters together. It's an object mapping array position of products to their ID's
`products` this contains the information of each individual product.

┃  
┣━ init  
┃     Runs first this gets the AJAX and is the starting point for all further interactions.  
┃     We also read the hash here to determine the current state for the filter.  
┃  
┣━ preFilter  
┃     Filters out all categories that are irrelevant and reduces the data set.
┃     We get our currentItems from this function and relevantFilters.
┃  
┣━┳━━ buildFilter  
┃ ┃      Using the html filterControls-group creates the filtering html for the user to control the page with.  
┃ ┃      This only occurs once on page load.  
┃ ┃  
┃ ┗━━ buildFilterTemplate  
┃        This is called per filterControls-group to render each of the filters.  
┃        This is the where the HTML is produced for the html filters.  
┃  
┣━┳━━ enableEvents  
┃ ╻       Called after the filter is built and is only called once to instantiate it.  
┃ ╻       This listens to pages and filtering events.  
┃ ╻       
┃ ┗━━ updateFilterObj  
┃        Creates a filter object which determines the state of the filter.  
┃        Triggered only from events, when the customer updates the filter.  
┃        Sends the obj to the hashify function which updates the URL.  
┃  
┣ ┳ ━ dehashify (Extra functions run if hash in URL)  
┃ ╻      Extract information from hash to creates the filter object.  
┃ ╻  
┃ ┗ ━ reSelect  
┃        Using the filter object disable certain filter elements.  
┃  
┣━ gatherItems  
┃     Based upon the filter object intersect the arrays and deploy the major logic behind the filter.  
┃     This listens to pages and filtering events.  
┃  
┣━ updateFilterHTML  
┃     Updates the HTML so that the customer can see which filters are still relevant.  
┃  
┣ ━ sortItems  
┃     Sort items based on the products properties.  
┃  
┗━┳━━ renderItems  
  ┃      Define paging and send through for looping through the product templates.  
  ┃      Several callbacks here to hook into for editing what is rendered on the page.  
  ┃      Final step before rendering out the products on the page.  
  ┃  
  ┣━━ renderItemTemplate  
  ┃      Connect variants product objects here to show all related variant information.  
  ┃      Runs through templates received in AJAX call.  
  ┃  
  ┣━━ renderItemPrice  
  ┃      Uses relevant template to display based on price object.  
  ┃  
  ┗━━ renderItemReplace  
         Major replacement of product attributes.  

Some helper functions not mentioned above.
`relatedToITems` maps even variants to objects in `products` to be later rendered by `renderItemTemplate` It's used in `preFilter` and `updateFilterHTML`
`hexOrImage` pertains to attributes whether they should use the hex code available or use the image. Image always takes precedent.
`dehasify` reads the `window.location.hash` and turns it into an object for using with the filter.
`hashify` updates the `window.location.hash`
`titleCase` is a filtering function for changing the output of the productObjects. Use in template with a `|`
`getLocale` if this needs to be done.
`keysToItems` Maps productID's to products
`unique` Takes a simple array and removes duplicates. Don't use with an object is it doesn't test depth.
`intersect` Takes a two simple arrays and removes duplicates. Don't use with an object is it doesn't test depth.


## Development ##

**Requirements**
* This plugin requires [node](http://nodejs.org/), [gulpjs](http://gulpjs.com/) and [bower](http://bower.io/).
* Follow JSCS guidelines a styling-example.js is also included.
* Run `bower install` and `npm install` to get dev dependencies. Bower and Gulp is assumed to be running globally.

## Contact ##

This is a small plugin by Young Skilled.
Contact [support](mailto:support@youngskilled.com) for more details about this plugin.
