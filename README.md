# svelte-drag-and-drop-actions #

a lightweight but flexible HTML5 Drag-and-Drop implemented as Svelte actions

HTML5 Drag-and-Drop allows web applications to provide a visual user interface for transfering data between HTML elements or exchanging data with a browser's environment. Using HTML5 Drag-and-Drop for the *operation* of an application (i.e. the repositioning, resizing or reordering of elements) is difficult and suffers from some browser-specific bugs.

Instead of fully re-implementing the visual operation of web applications with mouse and touch gestures (as done in [agnostic-draggable](https://github.com/rozek/agnostic-draggable) or [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action)), `svelte-drag-and-drop-actions` builds upon already existing HTML5 Drag-and-Drop functionality and simply extends it. The result is a lightweight package with a surprisingly simple programming interface. (And because this module is tree-shakable, using the plain dragging functionality only - i.e., without support for dropping - will reduce the import size even further)

A first Svelte component based on `svelte-drag-and-drop-actions` is the [svelte-sortable-flat-list-view](https://github.com/rozek/svelte-sortable-flat-list-view).

**But try yourself**: there are a number of [examples](#examples) that can be tried out live

**NPM users**: please consider the [Github README](https://github.com/rozek/svelte-drag-and-drop-actions/blob/main/README.md) for the latest description of this package (as updating the docs would otherwise always require a new NPM package version)

**Mobile Developers**: since many mobile platforms lack support for native HTML5 drag-and-drop, you should consider importing [svelte-drag-drop-touch](https://github.com/rozek/svelte-drag-drop-touch) as a polyfill (a simple import of that package will suffice - there is no extra programming needed)

*Please note: this package is currently under active development. Be invited to follow me on this road (with many detours searching for a [proper build environment](https://github.com/rozek/build-configuration-study), preparing [npm packages for Svelte](https://github.com/rozek/save-to-file) or struggling with singletons that turn out not to be so "single" in reality), but don't expect this package to be stable until perhaps end of July 2021 (sorry for frequent updates until then - sometimes you may see even multiple npm publications per day...).*

## Installation ##

```
npm install svelte-drag-and-drop-actions
```

## Usage Example ##

The following example illustrates plain dragging of a "Draggable" within the bounds of a given "Arena". Read on to understand how it is working.

```
<script context="module">
  import  DragDropTouch  from 'svelte-drag-drop-touch' // for mobile platforms
  import { asDraggable } from 'svelte-drag-and-drop-actions'
</script>

<script>
  let DraggableX = 20, DraggableY = 20, DraggableWidth = 80, DraggableHeight = 30
  let ArenaWidth = 400, ArenaHeight = 400

  function onDragMove (x,y, dx,dy) { DraggableX = x; DraggableY = y }
  function onDragEnd  (x,y, dx,dy) { DraggableX = x; DraggableY = y }
</script>

<div style="
  display:block; position:relative;
  width:{ArenaWidth}px; height:{ArenaHeight}px; margin:20px;
  border:dotted 1px black; border-radius:4px;
">
  <div style="
    display:block; position:absolute;
    left:{DraggableX}px; top:{DraggableY}px; width:{DraggableWidth}px; height:{DraggableHeight}px;
    background:forestgreen; color:white; line-height:30px; text-align:center; cursor:move;
  " use:asDraggable={{
    minX:0,minY:0, maxX:ArenaWidth-DraggableWidth,maxY:ArenaHeight-DraggableHeight,
    onDragStart:{x:DraggableX,y:DraggableY}, onDragMove, onDragEnd
  }}
  >Drag me!</div>
</div>

```

Additional, [more detailled examples](#examples) can be found below.

## Functional Principle ##

Svelte is a Framework for building *reactive* applications, i.e. it assumes, that there is some *application state* which is used to construct the application's user interface - and whenever any part of this state changes, the corresponding interface elements are updated accordingly.

`svelte-drag-and-drop-actions` takes this mechanism into account and assumes that position and size of draggable elements are also part of the application's state. For that reason, the module does not perform any dragging, resizing, sorting (or similar) itself but only provides the  coordinates and dimensions needed to update state and - in succession - the visual appearance of any affected elements.

Combined with a rather declarative API (designed with the most common use cases in mind), such an approach leads to a lightweight and easily usable module which still offers programmers full control over the actual side-effects of dragging (and dropping)

If this sounds too abstract, just have a look at the [examples](#examples): many of them illustrate specific use cases and may therefore serve as a basis for your own development.

**Nota bene**: since it is based on native HTML5 drag-and-drop, `svelte-drag-and-drop-actions` principally also allows dragging and dropping between multiple windows (or tabs) of the same browser or even between browsers. To what extent this works, depends on the participating browsers, the data types involved (transferring text often works best), and may also depend on the operating system used.

## Exported Types ##

TypeScript programmers may import the following types in order to benefit from static type checking (JavaScript programmers may simply skip this section):

* `type Position = { x:number, y:number }`<br>a `Position` instance represents a single point in a linearly scaled cartesic coordinate system. It may be considered as the same coordinate system a browser uses when coordinates are measured in pixels (px) - with one important exception: the origin of this system can be chosen by the programmer. An intelligent choice of such an origin may simplify the callbacks provided for `svelte-drag-and-drop-actions` and allow to use delivered coordinates, f.e., to set the size of an element directly and without any need for additional calculations.
* `type PositionReference = (`<br>&nbsp; `'parent' | 'body' | string | HTMLElement | SVGElement // | MathMLElement`<br>`)`<br>a `PositionReference` specifies, relative to which element the mouse or touch position is measured. This decision becomes important, if the referred element is scrollable and/or its position or size may be changed by external code (which is neither part of this module nor any of the configured callbacks)
* `type DragDummy = (`<br>&nbsp; `string | HTMLElement | SVGElement | 'standard' | 'none' |`<br>&nbsp; `((DraggableExtras:any, Element:HTMLElement | SVGElement) => HTMLElement | SVGElement)`<br>`)`<br>a `DragDummy` specifies which drag image will be shown during dragging (see below for details)
* `type DraggableOptions = {`<br>&nbsp; `Extras?:any, relativeTo?:PositionReference, onlyFrom?:string, neverFrom?:string,`<br>&nbsp; `Dummy?:DragDummy, DummyOffsetX?:number, DummyOffsetY?:number,`<br>&nbsp; `minX?:number, minY?:number, maxX?:number, maxY?:number,`<br>&nbsp; `Pannable?:string|HTMLElement|SVGElement,`<br>&nbsp; `PanSensorWidth?:number, PanSensorHeight?:number, PanSpeed?:number,`<br>&nbsp; `onDragStart?:Position | ((DraggableExtras:any) => Position),`<br>&nbsp; `onDragMove?:(x:number,y:number, dx:number,dy:number, DraggableExtras:any) => void,`<br>&nbsp; `onDragEnd?:  (x:number,y:number, dx:number,dy:number, DraggableExtras:any) => void,`<br>`}`<br>a `DraggableOptions` instance holds all options for a "Draggable" (see below for details)<br>&nbsp;<br>
* `type DropOperation = 'copy'|'move'|'link'`<br>a `DropOperation` specifies whether the data associated with a droppable element should be copied, moved or linked to a drop target (native HTML5 drag-and-drop jargon calls this an "effect")
* `type DataOfferSet = { [Type:string]:string }`<br>`DataOfferSet` instances are dictionaries listing the various data formats offered by a droppable object and the actually offered data for every format. The keys into a `DataOfferSet` are often MIME types (or the special value "DownloadURL") but could well be any kind of string (except `none`) - a detail which is often used to overcome some limitations of native HTML 5 drag-and-drop
* `type DroppableOptions = DraggableOptions & {`<br>&nbsp; `Extras?:any, Operations?:string, DataToOffer?:DataOfferSet,`<br>&nbsp; `onDropZoneEnter?:(x:number,y:number, DropZoneExtras:any, DroppableExtras:any) => void,`<br>&nbsp; `onDropZoneHover?:(x:number,y:number, DropZoneExtras:any, DroppableExtras:any) => void,`<br>&nbsp; `onDropZoneLeave?:(DropZoneExtras:any, DroppableExtras:any) => void,`<br>&nbsp; `onDropped?:      (x:number,y:number, Operation:DropOperation,`<br>&nbsp; &nbsp; &nbsp; `TypeTransferred:string, DataTransferred:any, DropZoneExtras:any, DroppableExtras:any) => void`<br>&nbsp; `}`<br>a `DroppableOptions` instance holds all *extra* options for a "Droppable" (please note, that this includes all `DraggableOptions` shown above, see below for details)<br>&nbsp;<br>
* `type TypeAcceptanceSet = { [Type:string]:string }`<br>`TypeAcceptanceSet` instances are dictionaries listing the various data formats accepted by a drop zone and the permitted drop operations for every format. The keys into a `TypeAcceptanceSet` are the same as for the abovementioned `DataOfferSet`s
* `type DropZoneOptions = {`<br>&nbsp; `Extras?:any, TypesToAccept?:TypeAcceptanceSet, HoldDelay?:number,`<br>&nbsp; `onDroppableEnter?:  (x:number,y:number, Operation:DropOperation,`<br>&nbsp; &nbsp; &nbsp; `offeredTypeList:string[], DroppableExtras:any, DropZoneExtras:any) => boolean|undefined,`<br>&nbsp; `onDroppableMove?:   (x:number,y:number, Operation:DropOperation,`<br>&nbsp; &nbsp; &nbsp; `offeredTypeList:string[], DroppableExtras:any, DropZoneExtras:any) => boolean|undefined,`<br>&nbsp; `onDroppableHold?:   (x:number,y:number, DroppableExtras:any, DropZoneExtras:any) => void,`<br>&nbsp; `onDroppableLeave?:  (DroppableExtras:any, DropZoneExtras:any) => void,`<br>&nbsp; `onDrop?:            (x:number,y:number, Operation:DropOperation,`<br>&nbsp; &nbsp; &nbsp; `DataOffered:any, DroppableExtras:any, DropZoneExtras:any) => string,`<br>`}`<br>a `DropZoneOptions` instance holds all options for a drop target (see below for details)

## use:asDraggable ##

`use:asDraggable` should be used for elements which will only be dragged around (but never dropped onto another element). Many use cases (from draggable windows over draggable nodes of graphical shapes to the resize handles found in many visual designers) only need this kind of behaviour.

The type annotiations shown below are relevant for TypeScript programmers only, JavaScript programmers may simply ignore them.

`use:asDraggable={options}`

is the classical pattern for Svelte actions. `use:asDraggable` supports the following options (bundled into an instance of type `DraggableOptions`):

* **`Extras?:any`**<br>`Extras` are an optional, user-defined value which can be used during drag-and-drop operations within the same application to identify the draggable component. They become useful as soon as multiple draggables share the same callbacks<br>&nbsp;<br>
* **`relativeTo?:PositionReference`**<br>`relativeTo` is an optional `PositionReference` (defaulting to `parent`) which specifies relative to which element the current mouse or touch position is measured during dragging. It may be set to `body` for measurements relative to the current document body, to `parent` for measurements relative to the draggable's containing element, to a CSS selector for measurements relative to the Draggable's closest element matching the given selector (or 'body' otherwise) or to a given HTML or SVG element (which must be part of the document)<br>
* **`onlyFrom?:string`**<br>`onlyFrom` is an optional, comma-separated list of CSS selectors identifying the inner elements of a draggable element, from which a drag operation must be started in order to be allowed. If `onlyFrom` is missing, no `onlyFrom` restriction is applied<br>
* **`neverFrom?:string`**<br>`neverFrom` is an optional, comma-separated list of CSS selectors identifying the inner elements of a draggable element, from which a drag operation must *never* be started in order to be allowed. If `neverFrom` is missing, no `neverFrom` restriction is applied<br>&nbsp;<br>
* **`Dummy?:DragDummy`**<br>`Dummy` specifies which "drag image" to show at the current mouse or touch position during dragging. `Dummy` is optional (defaulting to `none`) and may be set to `standard` (for the HTML5 standard behaviour which usually shows a semi-transparent copy of the actual draggable), to `none` (effectively showing nothing), to some HTML code (which is used to construct the element to be shown during dragging), to a function which receives the draggable's configured extras and the element to be dragged as its arguments and returns an HTML element to be used as the drag dummy or to an already existing HTML element (which must be visible). **Important**: creating a drag image from HTML or from a function is quite tricky - the approach used here is lightweight but may cause some flickering when dragging is started. Such flickering can usually be avoided by setting the CSS "overflow" of the document body to "hidden". Where this is not possible, constructing an image from HTML using [html2canvas](https://github.com/niklasvh/html2canvas) may be an (albeit no longer lightweight) alternative. If a function is used to construct the dummy, that function should also care itself about removing the newly created HTML element after use (see below for a suitable example)
* **`DummyOffsetX?:number`**<br>`DummyOffsetX` is an optional number (defaulting to 0) specifying the horizontal offset between the current x position of a mouse or finger during dragging and the shown drag image. It is used ay the second argument to `DataTransfer.setDragImage` without prior change
* **`DummyOffsetY?:number`**<br>`DummyOffsetY` is an optional number (defaulting to 0) specifying the vertical offset between the current y position of a mouse or finger during dragging and the shown drag image. It is used ay the third argument to `DataTransfer.setDragImage` without prior change<br>&nbsp;<br>
* **`minX?:number`**<br>`minX` is an optional number (defaulting to -Infinity) specifying the smallest possible value for the `x` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` to effectively hide the drag image
* **`minY?:number`**<br>`minY` is an optional number (defaulting to -Infinity) specifying the smallest possible value for the `y` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` to effectively hide the drag image
* **`maxX?:number`**<br>`maxX` is an optional number (defaulting to Infinity) specifying the largest possible value for the `x` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` tto effectively hide the drag image
* **`maxY?:number`**<br>`maxY` is an optional number (defaulting to Infinity) specifying the largest possible value for the `y` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` to effectively hide the drag image<br>&nbsp;<br>
* **`Pannable?:string|HTMLElement|SVGElement`**<br>some browsers provide automatic scrolling of only partially visible elements while a Draggable is dragged over them - but most do not, which is why `svelte-drag-and-drop-actions` implements its own "panning". `Pannable` is an optional parameter specifying the element which should be scrolled automatically. It should be a (not necessarily immediate) container of the Draggable and may be set to the DOM element itself or a CSS selector which identifies the desired container. If omitted, no panning will be performed
* **`PanSensorWidth?:number`**<br>`PanSensorWidth` is an optional ordinal number (defaulting to `20`) which specifies the width (in pixels) of the horizontal pan sensor area: panning starts as soon as the mouse pointer (or finger) gets closer than the given number of pixels to the left or right border of the configured `Pannable`. If set to `0`, no horizontal panning will be performed
* **`PanSensorHeight?:number`**<br>`PanSensorHeight` is an optional ordinal number (defaulting to `20`) which specifies the height (in pixels) of the vertical pan sensor area: panning starts as soon as the mouse pointer (or finger) gets closer than the given number of pixels to the upper or lower border of the configured `Pannable`. If set to `0`, no vertical panning will be performed
* **`PanSpeed?:number`**<br>`PanSpeed` is an optional ordinal number (defaulting to `10`) which specifies the "speed" of automatic scrolling - values in the range of 10...20 are reasonable choices, but it is always a good idea to make this parameter configurable for the users of your application. If set to `0`, no panning will be performed<br>&nbsp;<br>
* **`onDragStart?:Position | ((DraggableExtras:any) => Position)`**<br>`onDragStart` is either an optional `Position` (defaulting to `{x:0, y:0}`) or a function returning such a `Position`. When invoked, that function receives any `Extras` configured for the affected draggable. In either case, this parameter specifies the coordinate values from which to start dragging. **Important**: these "coordinates" do not necessarily represent a particular point on the screen - in fact, e.g., a resize handle may choose to start with the current width and height of the element to be resized and then directly use the results of any `onDragMove` or `onDragEnd` as the new element width and height without additional computation
* **`onDragMove?: (x:number,y:number, dx:number,dy:number, DraggableExtras:any) => void`**<br>`onDragMove` is an optional callback which (if given) is called repeatedly during dragging. When invoked, it receives the current drag result (in `x` and `y`, with an initial value chosen by `onDragStart`), the offset between this and the previous invocation (in `dx` and `dy`) and any `Extras` configured for the affected draggable
* **`onDragEnd?:  (x:number,y:number, dx:number,dy:number, DraggableExtras:any) => void`**<br>`onDragEnd` is is an optional callback which (if given) is called once when dragging has finished. When invoked, it receives the final drag result (in `x` and `y`, with the origin chosen by `onDragStart`), the offset between this and the most recent invocation of `onDragMove` (in `dx` and `dy`) and any `Extras` configured for the affected draggable

While being dragged, the CSS class `dragged` is assigned to the draggable element (not the drag image!). It will be removed again as soon as dragging has ended.

`use:asDraggable` should never be combined with `use:asDroppable` (as the latter already includes the former) - if you want an element to be dropped somewhere, simply use `use:asDroppable` alone.

`use:asDraggable` may, however, be combined with `use:asDropZone` in order to implement draggable drop zones.

## use:asDroppable ##

`use:asDroppable` is an extension of `use:asDraggable` and should be used for elements which will not only be dragged around but also dropped onto another element. Because of the underlying HTML5 drag-and-drop, dropping an element onto another one may lead to an exchange of data - but `svelte-drag-and-drop-actions` extends that functionality (for elements within the same application) and gives the programmer full control over what a "drop" will trigger (you could even delegate the actual action to take after dropping to the droppable, which sometimes turns out to be easier than the "classical" approach where the drop target is responsible)

**Warning**: some platforms show proper feedback while dragging a droppable over a drop target only for `copy` as configured drop operation.

The type annotiations shown below are relevant for TypeScript programmers only, JavaScript programmers may simply ignore them.

`use:asDroppable={options}`

is the classical pattern for Svelte actions. `use:asDroppable` supports the following options (some of them being equal or, at least, similar to those listed under `use:asDraggable`):

* **`Extras?:any`**<br>`Extras` are an optional, user-defined value which can be used during drag-and-drop operations within the same application to identify the droppable component or its associated data. They become useful as soon as multiple droppables share the same callbacks<br>&nbsp;<br>
* **`relativeTo?:PositionReference`**<br>`relativeTo` is an optional `PositionReference` (defaulting to `parent`) which specifies relative to which element the current mouse or touch position is measured during dragging. It may be set to `body` for measurements relative to the current document body, to `parent` for measurements relative to the draggable's containing element, to a CSS selector for measurements relative to the Draggable's closest element matching the given selector (or 'body' otherwise) or to a given HTML or SVG element (which must be part of the document)<br>
* **`onlyFrom?:string`**<br>`onlyFrom` is an optional, comma-separated list of CSS selectors identifying the inner elements of a droppable element, from which a drag-and-drop operation must be started in order to be allowed. If `onlyFrom` is missing, no `onlyFrom` restriction is applied<br>
* **`neverFrom?:string`**<br>`neverFrom` is an optional, comma-separated list of CSS selectors identifying the inner elements of a droppable element, from which a drag-and-drop operation must *never* be started in order to be allowed. If `neverFrom` is missing, no `neverFrom` restriction is applied<br>&nbsp;<br>
* **`Dummy?:DragDummy`**<br>`Dummy` specifies which "drag image" to show at the current mouse or touch position during dragging. `Dummy` is optional (defaulting to `standard`) and may be set to `none` (effectively showing nothing), to `standard` (for the HTML5 standard behaviour which usually shows a semi-transparent copy of the actual draggable), to some HTML code (which is used to construct the element to be shown during dragging), to a function which receives the draggable's configured extras and the element to be dragged as its arguments and returns an HTML element to be used as the drag dummy or to an already existing HTML element (which must be visible). **Important**: creating a drag image from HTML is quite tricky - the approach used here is lightweight but may cause some flickering when dragging is started. Such flickering can usually be avoided by setting the CSS "overflow" of the document body to "hidden". Where this is not possible, constructing an image from HTML using [html2canvas](https://github.com/niklasvh/html2canvas) may be an (albeit no longer lightweight) alternative. If a function is used to construct the dummy, that function should also care itself about removing the newly created HTML element after use (see below for a suitable example)
* **`DummyOffsetX?:number`**<br>`DummyOffsetX` is an optional number (defaulting to 0) specifying the horizontal offset between the current x position of a mouse or finger during dragging and the shown drag image. It is used ay the second argument to `DataTransfer.setDragImage` without prior change
* **`DummyOffsetY?:number`**<br>`DummyOffsetY` is an optional number (defaulting to 0) specifying the vertical offset between the current y position of a mouse or finger during dragging and the shown drag image. It is used ay the third argument to `DataTransfer.setDragImage` without prior change<br>&nbsp;<br>
* **`minX?:number`**<br>`minX` is an optional number (defaulting to -Infinity) specifying the smallest possible value for the `x` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` to effectively hide the drag image
* **`minY?:number`**<br>`minY` is an optional number (defaulting to -Infinity) specifying the smallest possible value for the `y` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` to effectively hide the drag image
* **`maxX?:number`**<br>`maxX` is an optional number (defaulting to Infinity) specifying the largest possible value for the `x` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` tto effectively hide the drag image
* **`maxY?:number`**<br>`maxY` is an optional number (defaulting to Infinity) specifying the largest possible value for the `y` component of any drag result. Please note: a configured drag image may well be dragged beyond configured limits - for that reason, such limits are most often combined with `Dummy:'none'` to effectively hide the drag image<br>&nbsp;<br>
* **`Pannable?:string|HTMLElement|SVGElement`**<br>some browsers provide automatic scrolling of only partially visible elements while a Draggable is dragged over them - but most do not, which is why `svelte-drag-and-drop-actions` implements its own "panning". `Pannable` is an optional parameter specifying the element which should be scrolled automatically. It should be a (not necessarily immediate) container of the Draggable and may be set to the DOM element itself or a CSS selector which identifies the desired container. If omitted, no panning will be performed
* **`PanSensorWidth?:number`**<br>`PanSensorWidth` is an optional ordinal number (defaulting to `20`) which specifies the width (in pixels) of the horizontal pan sensor area: panning starts as soon as the mouse pointer (or finger) gets closer than the given number of pixels to the left or right border of the configured `Pannable`. If set to `0`, no horizontal panning will be performed
* **`PanSensorHeight?:number`**<br>`PanSensorHeight` is an optional ordinal number (defaulting to `20`) which specifies the height (in pixels) of the vertical pan sensor area: panning starts as soon as the mouse pointer (or finger) gets closer than the given number of pixels to the upper or lower border of the configured `Pannable`. If set to `0`, no vertical panning will be performed
* **`PanSpeed?:number`**<br>`PanSpeed` is an optional ordinal number (defaulting to `10`) which specifies the "speed" of automatic scrolling - values in the range of 10...20 are reasonable choices, but it is always a good idea to make this parameter configurable for the users of your application. If set to `0`, no panning will be performed<br>&nbsp;<br>
* **`Operations?:string`**<br>`Operations` is either a blank-separated list of `DropOperation`s (`'copy'`, `'move'` or `'link'`), the keyword `all` (which includes all three available operations) or the keyword `none` (which effectively suppresses dropping) and specifies which kind of data transfer the droppable component is going to support
* **`DataToOffer?:DataOfferSet`**<br>`DataToOffer` is a plain JavaScript object whose keys represent the various data formats a droppable component supports and whose corresponding values contain the transferrable data in that format. Often, the given keys denote MIME formats (which simplifies data transfer between different applications) or contain the special value "DownloadURL", but - in principle - any string (except `none`) may be used<br>&nbsp;<br>
* **`onDragStart?:Position | ((DroppableExtras:any) => Position)`**<br>`onDragStart` is either an optional `Position` (defaulting to `{x:0, y:0}`) or a function returning such a `Position`. When invoked, that function receives any `Extras` configured for the affected droppable. In either case, this parameter specifies the coordinate values from which to start dragging. **Important**: these "coordinates" do not necessarily represent a particular point on the screen - in fact, e.g., a resize handle may choose to start with the current width and height of the element to be resized and then directly use the results of any `onDragMove` or `onDragEnd` as the new element width and height without additional computation
* **`onDragMove?: (x:number,y:number, dx:number,dy:number, DroppableExtras:any) => void`**<br>`onDragMove` is an optional callback which (if given) is called repeatedly during dragging. When invoked, it receives the current drag result (in `x` and `y`, with an initial value chosen by `onDragStart`), the offset between this and the previous invocation (in `dx` and `dy`) and any `Extras` configured for the affected droppable
* **`onDragEnd?:  (x:number,y:number, dx:number,dy:number, DroppableExtras:any) => void`**<br>`onDragEnd` is an optional callback which (if given) is called once when dragging has finished. When invoked, it receives the final drag result (in `x` and `y`, with the origin chosen by `onDragStart`), the offset between this and the most recent invocation of `onDragMove` (in `dx` and `dy`) and any `Extras` configured for the affected droppable<br>&nbsp;<br>
* **`onDropZoneEnter?: (x:number,y:number, DropZoneExtras:any, DroppableExtras:any) => void`**<br>`onDropZoneEnter` is an optional callback which (when invoked) indicates that the droppable has entered the bounds of a drop target which accepts (some of) the given data it offers. `x` and `y` contain the current coordinates of the mouse or finger *relative to the drop zone*, `DropZoneExtras` are any `Extras` configured for the entered drop zone and `DroppableExtras` any `Extras` configured for the affected droppable (which becomes useful as soon as multiple droppables share the same callbacks)
* **`onDropZoneHover?: (x:number,y:number, DropZoneExtras:any, DroppableExtras:any) => void`**<br>`onDropZoneHover` is an optional callback which (when invoked) indicates that the droppable is still moving within the bounds of a drop zone which accepts (some of) the given data it offers. `x` and `y` contain the current coordinates of the mouse or finger *relative to the drop zone*, `DropZoneExtras` are any `Extras` configured for the hovered drop zone and `DroppableExtras` any `Extras` configured for the affected droppable (which becomes useful as soon as multiple droppables share the same callbacks)
* **`onDropZoneLeave?: (DropZoneExtras:any, DroppableExtras:any) => void`**<br>`onDropZoneLeave` is an optional callback which (when invoked) indicates that the droppable has either just left the bounds of a previously entered drop zone or that drop zone has decided to no longer accept any data offered by the droppable. `DropZoneExtras` are any `Extras` configured for the left drop zone and `DroppableExtras` any `Extras` configured for the affected droppable (which becomes useful as soon as multiple droppables share the same callbacks)
* **`onDropped?: (x:number,y:number, Operation:DropOperation, TypeTransferred:string, DataTransferred:any, DropZoneExtras:any, DroppableExtras:any) => void}`**<br>`onDropped` is an optional callback which (when invoked) indicates that the droppable has just been dropped onto a drop zone - and it could now be up to the droppable to react accordingly (including the possibility to perform the requested operation itself, instead of the drop zone). `x` and `y` contain the coordinates of the mouse or finger *relative to the drop zone* when the droppable was dropped, `Operation` contains the performed drop operation (if known - or `undefined` otherwise), `TypeTransferred` indicates the type of the actually transferred data (if known - or `undefined` otherwise), `DataTransferred` is the actually transferred data itself (if known - or `undefined` otherwise), `DropZoneExtras` are any `Extras` configured for the drop zone and `DroppableExtras` any `Extras` configured for the affected droppable (which becomes useful as soon as multiple droppables share the same callbacks)

While being dragged, the CSS class `dragged` is assigned to the draggable element (not the drag image!). It will be removed again as soon as dragging has ended.


While over a drop zone which accepts (some of) the data offered, the CSS class `droppable` is assigned to the draggable element (not the drag image!). It will be removed again as soon as dragging has ended or the droppable has been left.

`use:asDraggable` should never be combined with `use:asDroppable` (as the latter already includes the former) - if you want an element to be dropped somewhere, simply use `use:asDroppable` alone.

`use:asDroppable` may, however, be combined with `use:asDropZone` in order to implement draggable drop zones which may itself be dropped over other drop zones.

## use:asDropZone ##

`use:asDropZone` marks an element as a "drop zone" which allows "droppable" elements to be dropped onto it in order to trigger an operation.

The type annotiations shown below are relevant for TypeScript programmers only, JavaScript programmers may simply ignore them.

`use:asDropZone={options}`

is the classical pattern for Svelte actions. `use:asDropZone` supports the following options (bundled into an instance of type `DropZoneOptions`):

* **`Extras?:any`**<br>`Extras` are an optional, user-defined value which can be used during drag-and-drop operations within the same application to identify the drop zone component. They become useful as soon as multiple drop zones share the same callbacks<br>&nbsp;<br>
* **`TypesToAccept?:TypeAcceptanceSet`**<br>`TypesToAccept` is a plain JavaScript object whose keys represent the various data formats a drop zone accepts and whose corresponding values contain a blank-separated, perhaps empty, list of supported drop operations for that format. Often, the given keys denote MIME formats (which simplifies data transfer between different applications) or contain the special value "DownloadURL", but - in principle - any string (except `none`) may be used. Note: since native HTML5 drag-and-drop implementations often fail reporting a correct "dropEffect", the given drop operations can not be properly checked - with the exception, that types with empty operation lists will never be accepted
* **`HoldDelay?:number`**<br>when a droppable has entered a drop zone and remains there for at least `HoldDelay` milliseconds without much movement, the `onDroppableHold` callback of that drop zone is invoked (if it exists). Such a callback may be used to perform activities such as expanding a collapsed tree list entry, opening an input dialog or similar. The property is optional: when missing, `onDroppableHold` will never be called
* **`onDroppableEnter?: (x:number,y:number, Operation:DropOperation, offeredTypeList:string[], DroppableExtras:any, DropZoneExtras:any) => boolean|undefined`**<br>`onDroppableEnter` is an optional callback which (when invoked) indicates that a droppable has entered this drop zone and that this droppable's data is at least partially acceptable. `x` and `y` contain the current coordinates of the mouse or finger *relative to the drop zone*, `Operation` is the requested drop operation (if known - or `undefined` otherwise), `offeredTypeList` is a JavaScript array containing the offered data "types", `DroppableExtras` are any `Extras` configured for the entering droppable and `DropZoneExtras` any `Extras` configured for the affected drop zone (which becomes useful as soon as multiple drop zones share the same callbacks). The callback should return `false` if the offered data turns out not to be acceptable after all - or anything else (including `undefined`) otherwise
* **`onDroppableMove?: (x:number,y:number, Operation:DropOperation, offeredTypeList:string[], DroppableExtras:any, DropZoneExtras:any) => boolean|undefined`**<br>`onDroppableMove` is an optional callback which (when invoked) indicates that a droppable is still moving within the bounds of this drop zone and that this droppable's data is at least partially acceptable. `x` and `y` contain the current coordinates of the mouse or finger *relative to the drop zone*, `Operation` is the requested drop operation (if known - or `undefined` otherwise), `offeredTypeList` is a JavaScript array containing the offered data "types", `DroppableExtras` are any `Extras` configured for the hovering droppable and `DropZoneExtras` any `Extras` configured for the affected drop zone (which becomes useful as soon as multiple drop zones share the same callbacks). The callback should return `false` if the offered data turns out not to be acceptable after all - or anything else (including `undefined`) otherwise
* **`onDroppableHold?: (x:number,y:number, DroppableExtras:any, DropZoneExtras:any) => void`**<br>`onDroppableHold` is an optional callback which (when invoked) indicates that a droppable whose data is at least partially acceptable, stood still for at least `HoldDelay` milliseconds within the bounds of this drop zone. `x` and `y` contain the current coordinates of the mouse or finger *relative to the drop zone*, `DroppableExtras` are any `Extras` configured for the held droppable and `DropZoneExtras` any `Extras` configured for the affected drop zone (which becomes useful as soon as multiple drop zones share the same callbacks). **Warning**: be careful with what to do within that callback - if you disturb the flow of events (e.g., by invoking `window.alert`), the visual feedback for drag-and-drop may get mixed up!
* **`onDroppableLeave?: (DroppableExtras:any, DropZoneExtras:any) => void`**<br>`onDroppableLeave` is an optional callback which (when invoked) indicates that a droppable whose data was at least partially acceptable, moved outside the bounds of this drop zone. `DroppableExtras` are any `Extras` configured for the leaving droppable and `DropZoneExtras` any `Extras` configured for the affected drop zone (which becomes useful as soon as multiple drop zones share the same callbacks)
* **`onDrop?: (x:number,y:number, Operation:DropOperation, DataOffered:any, DroppableExtras:any, DropZoneExtras:any) => string`**<br>`onDrop` is an optional callback which (when invoked) indicates that a droppable (whose data is at least partially acceptable) was dropped within the bounds of this drop zone - and it may now be up to the drop zone to perform the requested operation. `x` and `y` contain the current coordinates of the mouse or finger *relative to the drop zone*, `Operation` is the requested drop operation (if known - or `undefined` otherwise), `DataOffered` is a JavaScript object, whose keys represent the various data formats offered and whose corresponding values contain the offered data in that format, `DroppableExtras` are any `Extras` configured for the droppable and `DropZoneExtras` any `Extras` configured for the affected drop zone (which becomes useful as soon as multiple drop zones share the same callbacks). The callback should return the data format actually accepted or, at least, `undefined` to report that *any* offered data was accepted - or `false` if the offered data turned out not to be acceptable after all

While being hovered by a droppable whose data offered is at least partially acceptable, the CSS class `hovered` is assigned to the drop zone element. It will be removed again as soon as either dragging has ended, the droppable has left the drop zone or the droppable's offered data is no longer acceptable.

`use:asDropZone` may be combined with either `use:asDraggable` or `use:asDroppable` (not both together) in order to implement draggable drop zones which may perhaps itself be dropped over other drop zones.

## Examples ##

### Dragging only ###

* [standard dragging](https://svelte.dev/repl/da5c51729c974c8b950e8de4bdb7d1c5) - shows hardly more than HTML5 drag-and-drop, but proves that it still works
* [plain dragging](https://svelte.dev/repl/e779dd6b998a4c0ba94e417dd2a66c16) - drags an object itself (not a "ghost" or "dummy")
* [dragging with CSS class "dragged"](https://svelte.dev/repl/019d96b653b1418785c06e5cb3ad1d59) - demonstrates usage of CSS class "dragged" assigned to a Draggable during dragging
* [plain dragging within region](https://svelte.dev/repl/6e98523988f54335bf2e2307e79b4173) - restricts dragging to a given region
* [dragging a custom dummy](https://svelte.dev/repl/801170099918424c998f689a3c6b2ddc) - drags a custom dummy made from HTML
* [dragging an existing dummy](https://svelte.dev/repl/ee2a354b389049fa87da061ab7731c53) - drags a dummy built from an existing HTML element (which must be visible, however)
* [dragging an ad-hoc dummy](https://svelte.dev/repl/65a48616a12f4cd18bca6fed83cb2088) - demonstrates how to dynamically create a drag image for a draggable
* [plain dragging from a handle](https://svelte.dev/repl/83e4a79911f243f0b618fd25eece9d39) - illustrates dragging from a given handle rather than the whole draggable
* [plain dragging with panning](https://svelte.dev/repl/70d99ffcd0494eac871e5ce68198bd4d) - demonstrates automatic scrolling while a Draggable is dragged over a scrollable container
* [plain draggable Button](https://svelte.dev/repl/ba1d1ce67c0b40439ea5e3015d6d36bf) - drags a button which remains clickable
* [plain draggable Note](https://svelte.dev/repl/03727e9474614e678b23fdaa1cbf5003) - drags a "note", but only from its title bar
* [plain draggable resizable Note](https://svelte.dev/repl/86663312b0034250943904ed537feff8) - adds a "resize" handle to the draggable note
* [plain Line Node Dragging](https://svelte.dev/repl/3f5f997239c645029cb2afb6f33ae635) - lets drag the handles at the end of a straight line
* [plain Polygon Node Dragging](https://svelte.dev/repl/ded27af54b2747559f2d2f239aa990e8) - lets drag the nodes of a polygon
* [plain quadratic Bezier Curve Node Dragging](https://svelte.dev/repl/78c7766012894a33afbc665234c35f9b) - lets drag the control points of a quadratic bezier curve
* [plain cubic Bezier Curve Node Dragging](https://svelte.dev/repl/e9c64887e2684146acdc16e9af13193e) - lets drag the control points of a cubic bezier curve
* [plain draggable Resize Handles](https://svelte.dev/repl/1a620cee8fe9402a8063efea8b164232) - demonstrates the "classical" positioning and shaping of a rectangular element using a selection frame and handles
* [plain draggable Resize Handles for Mouse, Pen and Touch Input](https://svelte.dev/repl/52e662d6220d447495be8cd8851322b9) - like above but with proper handle sizes for devices with mouse, pen or touch input

### Drag-and-Drop ###

* [standard drag-and-drop](https://svelte.dev/repl/8e0ec7bf90bf4ad889b48ff6029bf1f6) - demonstrates the sequence of callbacks for droppables and drop zones
* [standard drop](https://svelte.dev/repl/097fdce459684421aa11d53cea4b48e7) - logs callbacks for actual drop operations only
* [plain drag-and-drop with CSS class "dragged"](https://svelte.dev/repl/08ad7687579b4e29a9a4f87446e0cfee) - demonstrates usage of CSS class "dragged" assigned to a Droppable during dragging
* [type-specific drop](https://svelte.dev/repl/64cdbfb322f84eac8aa150ba6470e948) - illustrates determination of droppability based on offered types
* [type-specific drop with CSS class "hovered"](https://svelte.dev/repl/b354d5e23d7a4b09ad50af5114561e6a) - demonstrates visual feedback of drop zones while hovered by a matching droppable based on CSS class "hovered"
* [operation-specific drop](https://svelte.dev/repl/263f54e6cbad489a861517bedb848e3b) - would illustrate the determination of droppability based on offered operations, if browsers would properly implement HTML5 drag-and-drop (i.e., may work in some browsers and "fail" in others)
* [drag-and-drop into Trashcan](https://svelte.dev/repl/601fe6818bdc48f487002c489024c0a8) - drag any "Waste" into the Trashcan



## Caveats ##

Simply extending already existing native HTML5 drag-and-drop functionality has a lot of advantages - but also some disadvantages, as there are:

* the cursor shown while dragging is under full control of the native drag-and-drop implementation and can not be influenced programmatically (with the minor exception of setting a proper drop operation for a Droppable)
* a custom drag image must either be an image object or a visible(!) element within the document from which a snapshot is taken
* the configured drag image can not be changed during dragging as it is constructed when dragging starts and never updated again
* in some browsers, as soon as the document is scrolled (even a little bit only) a custom drag dummy "slides in" to its designated position when dragging starts rather than appears there from the beginning - this seems to be a browser bug which the author cannot compensate

## Build Instructions ##

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/svelte-drag-and-drop-actions/archive/refs/heads/main.zip) with its contents to your disk and unpack it there
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build

You may also look into the author's [build-configuration-study](https://github.com/rozek/build-configuration-study) for a general description of his build environment.

## License ##

[MIT License](LICENSE.md)
