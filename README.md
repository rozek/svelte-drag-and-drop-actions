# svelte-drag-and-drop-actions #

a lightweight but flexible HTML5 Drag-and-Drop implemented as Svelte actions

HTML5 Drag-and-Drop allows web applications to provide a visual user interface for transfering data between HTML elements or exchanging data with a browser's environment. Using HTML5 Drag-and-Drop for *operating* an application (i.e. repositioning, resizing or reordering of elements) is difficult and suffers from some browser-specific bugs.

Instead of fully re-implementing the vsual operation of web applications with mouse and touch gestures (as done in [agnostic-draggable](https://github.com/rozek/agnostic-draggable)), `svelte-drag-and-drop-actions` builds upon already existing HTML5 Drag-and-Drop functionality and simply extends it. The result is a lightweight package with a surprisingly simple programming interface.

**NPM users**: please consider the [Github README](https://github.com/rozek/javascript-interface-library/blob/main/README.md) for the latest description of this package (as updating the docs would otherwise always require a new NPM package version)

**Mobile Developers**: since many mobile platforms lack support for native HTML5 drag-and-drop, you should consider importing [svelte-drag-drop-touch](https://github.com/rozek/svelte-drag-drop-touch) as a polyfill (a single simple import of that package is sufficient - there is no more programming needed)

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

### use:asDraggable ###

`use:asDraggable` should be used for elements which will only be dragged around (but never dropped onto another element). Many use cases (from dragable windows over draggable nodes of graphical shapes to the resize handles found in may visual designers) only need this kind of behaviour.

(t.b.w.)

`use:asDraggable` should never be combined with `use:asDroppable` (as the latter includes the former) - if you want an element to be dropped somewhere, simply use `use:asDroppable` alone.

`use:asDraggable` may, however, be combined with `use:asDropZone` in order to implement draggable drop zones.

### use:asDroppable ###

`use:asDroppable` is an extension of `use:asDraggable` and should be used for elements which will not only be dragged around but also dropped onto another element. Because of the underlying HTML5 drag-and-drop, dropping an element onto another one may lead to an exchange of data - but `svelte-drag-and-drop-actions` extends that functionality (for elements within the same application) and gives the programmer full control over what a "drop" will trigger without any need for nasty tricks (based on the keys of a DataTransfer object)

(t.b.w.)

`use:asDraggable` should never be combined with `use:asDroppable` (as the latter includes the former) - if you want an element to be dropped somewhere, simply use `use:asDroppable` alone.

`use:asDroppable` may, however, be combined with `use:asDropZone` in order to implement draggable drop zones which may itself be dropped over other drop zones.

### use:asDropZone ###

`use:asDropZone` marks an element as a "drop zone" which allows "droppable" elements to be dropped onto it in order to trigger an operation. 

(t.b.w.)

`use:asDropZone` may be combined with either `use:asDraggable` or `use:asDroppable` (not both together) in order to implement draggable drop zones which may itself be dropped over other drop zones.

### Build Instructions ###

You may easily build this package yourself.

Just install [NPM](https://docs.npmjs.com/) according to the instructions for your platform and follow these steps:

1. either clone this repository using [git](https://git-scm.com/) or [download a ZIP archive](https://github.com/rozek/svelte-drag-and-drop-actions/archive/refs/heads/main.zip) with its contents to your disk and unpack it there 
2. open a shell and navigate to the root directory of this repository
3. run `npm install` in order to install the complete build environment
4. execute `npm run build` to create a new build
