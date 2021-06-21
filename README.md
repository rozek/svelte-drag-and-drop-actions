# svelte-drag-and-drop-actions #

a lightweight but flexible HTML5 Drag-and-Drop implemented as Svelte actions

HTML5 Drag-and-Drop allows web applications to provide a visual user interface for transfering data between HTML elements or exchanging data with a browser's environment. Using HTML5 Drag-and-Drop for *operating* an application (i.e. repositioning, resizing or reordering of elements) is difficult and suffers from some browser-specific bugs.

Instead of fully re-implementing the visual operation of web applications with mouse and touch gestures (as done in [agnostic-draggable](https://github.com/rozek/agnostic-draggable)), `svelte-drag-and-drop-actions` builds upon already existing HTML5 Drag-and-Drop functionality and simply extends it. The result is a lightweight package with a surprisingly simple programming interface.

**NPM users**: please consider the [Github README](https://github.com/rozek/javascript-interface-library/blob/main/README.md) for the latest description of this package (as updating the docs would otherwise always require a new NPM package version)

**Mobile Developers**: since many mobile platforms lack support for native HTML5 drag-and-drop, you should consider importing [svelte-drag-drop-touch](https://github.com/rozek/svelte-drag-drop-touch) as a polyfill (a simple import of that package is sufficient - there is no extra programming needed)

### Installation ###

```
npm install svelte-drag-and-drop-actions
```

### Usage Example ###

The following example illustrates plain dragging of a "Draggable" within the bounds of a given "Arena". Read below to understand how it is working.

```
<script>
  import  DragDropTouch  from 'svelte-drag-drop-touch' // for mobile platforms
  import { asDraggable } from 'svelte-drag-and-drop-actions'

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

Additional, more detailled examples can be found below.

### Functional Principle ###

Svelte is a Framework for building *reactive* applications, i.e. it assumes, that there is some *application state* which is used to construct the application's user interface - and whenever any part of this state changes, the corresponding interface elements are updated accordingly.

`svelte-drag-and-drop-actions` takes this mechanism into account and assumes that position and size of draggable elements are also part of the application's state. For that reason, the module does not perform any dragging, resizing, sorting (or similar) itself but only provides the  coordinates and dimensions needed to update state and - in succession - the visual appearance of any affected elements.

Combined with a rather declarative API (designed with the most common use cases in mind), such an approach leads to a lightweight and easily usable module which still offers programmers full control over the actual side-effects of dragging (and dropping)

If this sounds too abstract, just have a look into the examples: many of them illustrate specific use cases any may therefore serve as a basis for your own dvelopment.

### Exported Types ###

TypeScript programmers may import the following types in order to benefit from static type checking:

* `type Position = { x:number, y:number }`<br>a `Position` instance represents a single point in a linearly scaled cartesic coordinate system. It may be considered as the same coordinate system a browser uses when coordinates are measured in pixels (px) - with one important exception: the origin of this system can be chosen by the programmer. An intelligent choice of such an origin may simplify the callbacks provided for `svelte-drag-and-drop-actions` and allow to use delivered coordinates, f.e., to set the size of an element directly and without any need for additional calculations.
* `type PositionReference = (`<br>&nbsp; `'parent' | 'body' | HTMLElement | SVGElement // | MathMLElement`<br>`)`<br>a `PositionReference` specifies, relative to which element the mouse or touch position is measured. This decision becomes important, if the referred element is scrollable and/or its position or size may be changed by external code (which is neither part of this module nor any of the configured callbacks)
* `type DragDummy = (`<br>&nbsp; `string | HTMLElement | SVGElement |`<br>&nbsp; `'standard' | 'clone' | 'none'`<br>`)`<br>a `DragDummy` specifies which drag image will be shown during dragging (see below for details)
* `type DraggableOptions = {`<br>&nbsp; `relativeTo?:PositionReference,`<br>&nbsp; `Dummy?:DragDummy, DummyOffsetX?:number, DummyOffsetY?:number,`<br>&nbsp; `minX?:number, minY?:number, maxX?:number, maxY?:number,`<br>&nbsp; `onDragStart?:Position | (() => Position),`<br>&nbsp; `onDragMove?: (x:number,y:number, dx:number,dy:number) => void,`<br>&nbsp; `onDragEnd?:  (x:number,y:number, dx:number,dy:number) => void,`<br>`}`<br>a `DraggableOptions` instance holds all options for a "Draggable" (see below for details)

### use:asDraggable ###

`use:asDraggable` should be used for elements which will only be dragged around (but never dropped onto another element). Many use cases (from dragable windows over draggable nodes of graphical shapes to the resize handles found in many visual designers) only need this kind of behaviour.

The type annotiations shown below are relevant for TypeScript programmers only, JavaScript programmers may simply ignore them.

`use:asDraggable={options}`

is the classical pattern for Svelte actions. `use:asDraggable` supports the following options (bundled into an instance of type `DraggableOptions`):

* **`relativeTo?:PositionReference`**<br>`relativeTo` is an optional `PositionReference` (defaulting to `parent`) which specifies relative to which element the current mouse or touch position is measured during dragging. It may be set to `body` for measurements relative to the current document body, to `parent` for measurements relative to the Draggable's containing element, to a CSS selector for measurements relative to the Draggable's closest element matching the given selector (or 'body' otherwise) or to a given HTML or SVG element (which must be part of the document)<br>&nbsp;<br>
* **`Dummy?:DragDummy`**<br>`Dummy` specifies which "drag image" to show at the current mouse or touch position during dragging. `Dummy` is optional (defaulting to `none`) and may be set to `standard` (for the standard appearance of HTML5 dragging), to `clone` (showing a clone of the Draggable), to `none` (effectively showing nothing), to some HTML code (which is used to construct the element to be shown during dragging - and removed afterwards) or to an already existing HTML element
* **`DummyOffsetX?:number`**<br>`DummyOffsetX` is an optional number (defaulting to 0) specifying the horizontal offset between the current x position of a mouse or finger during dragging and the shown drag image. It is used ay the second argument to `DataTransfer.setDragImage` without prior change
* **`DummyOffsetY?:number`**<br>`DummyOffsetY` is an optional number (defaulting to 0) specifying the vertical offset between the current y position of a mouse or finger during dragging and the shown drag image. It is used ay the third argument to `DataTransfer.setDragImage` without prior change<br>&nbsp;<br>
* **`minX?:number`**<br>`minX` is an optional number (defaulting to -Infinity) specifying the smallest possible value for the `x` part of any drag result
* **`minY?:number`**<br>`minY` is an optional number (defaulting to -Infinity) specifying the smallest possible value for the `y` part of any drag result
* **`maxX?:number`**<br>`maxX` is an optional number (defaulting to Infinity) specifying the lagest possible value for the `x` part of any drag result
* **`maxY?:number`**<br>`maxY` is an optional number (defaulting to Infinity) specifying the lagest possible value for the `y` part of any drag result<br>&nbsp;<br>
* **`onDragStart?:Position | (() => Position)`**<br>`onDragStart` is either an optional `Position` (defaulting to `{x:0, y:0}`) or a parameter-less function returning such a `Position`. In either case, this parameter specifies the coordinate values from which to start dragging. **Important**: these "coordinates" do not necessarily represent a particular point on the screen - in fact, e.g., a resize handle may choose to start with the current width and height of the element to be resized and then directly use the results of any `onDragMove` or `onDragEnd` as the new element width and height without additional computation
* **`onDragMove?: (x:number,y:number, dx:number,dy:number) => void`**<br>`onDragMove` is an optional callback which (if given) is called repeatedly during dragging. When invoked, it receives the current drag result (in `x` and `y`, with an initial value chosen by `onDragStart`) and  the offset between this and the previous invocation (in `dx` and `dy`)
* **`onDragEnd?:  (x:number,y:number, dx:number,dy:number) => void`**<br>`onDragEnd` is is an optional callback which (if given) is called once when dragging has finished. When invoked, it receives the final drag result (in `x` and `y`, with the origin chosen by `onDragStart`) and the offset between this and the most recent invocation of `onDragMove` (in `dx` and `dy`)

`use:asDraggable` should never be combined with `use:asDroppable` (as the latter includes the former) - if you want an element to be dropped somewhere, simply use `use:asDroppable` alone.

`use:asDraggable` may, however, be combined with `use:asDropZone` in order to implement draggable drop zones.

### use:asDroppable ###

`use:asDroppable` is an extension of `use:asDraggable` and should be used for elements which will not only be dragged around but also dropped onto another element. Because of the underlying HTML5 drag-and-drop, dropping an element onto another one may lead to an exchange of data - but `svelte-drag-and-drop-actions` extends that functionality (for elements within the same application) and gives the programmer full control over what a "drop" will trigger without any need for nasty tricks (based on the keys of a DataTransfer object)

The type annotiations shown below are relevant for TypeScript programmers only, JavaScript programmers may simply ignore them.

(t.b.w.)

`use:asDraggable` should never be combined with `use:asDroppable` (as the latter includes the former) - if you want an element to be dropped somewhere, simply use `use:asDroppable` alone.

`use:asDroppable` may, however, be combined with `use:asDropZone` in order to implement draggable drop zones which may itself be dropped over other drop zones.

### use:asDropZone ###

`use:asDropZone` marks an element as a "drop zone" which allows "droppable" elements to be dropped onto it in order to trigger an operation. 

The type annotiations shown below are relevant for TypeScript programmers only, JavaScript programmers may simply ignore them.

(t.b.w.)

`use:asDropZone` may be combined with either `use:asDraggable` or `use:asDroppable` (not both together) in order to implement draggable drop zones which may itself be dropped over other drop zones.

### Build Instructions ###

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/svelte-drag-and-drop-actions/archive/refs/heads/main.zip) with its contents to your disk and unpack it there 
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build
