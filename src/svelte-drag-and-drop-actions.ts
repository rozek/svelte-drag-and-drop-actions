//----------------------------------------------------------------------------//
//                        Svelte Drag-and-Drop Actions                        //
//----------------------------------------------------------------------------//

  import {
    global, throwError,
    ValueIsNumber, ValueIsFiniteNumber, ValueIsString, ValueIsNonEmptyString,
    ValueIsFunction, ValueIsPlainObject, ValueIsOneOf,
    allowedFiniteNumber, allowedIntegerInRange, allowedOrdinal,
    allowedString, allowedNonEmptyString,
    allowPlainObject, allowedPlainObject,
    allowListSatisfying, allowedFunction,
    ObjectIsNotEmpty, quoted, constrained
  } from 'javascript-interface-library'

  import Conversion from 'svelte-coordinate-conversion'

/**** never ever trust module loading if you REALLY need a singleton! ****/
// finding multiple existing singletons if you actually trust them is so hard!

  type ContextType = extendedDragAndDropSupport & SupportForHoldingAndPanning
  const Context:ContextType = (            // make this package a REAL singleton
    '__DragAndDropActions' in global
    ? global.__DragAndDropActions
    : global.__DragAndDropActions = {}
  )

//-------------------------------------------------------------------------------
//--             use:asDraggable={options} - "drag" without "drop"             --
//-------------------------------------------------------------------------------

  export type PositionReference = (
    'parent' | 'body' | string | HTMLElement | SVGElement // | MathMLElement
  )

  export type Position = { x:number, y:number }

  export type DragDummy = (
    string | HTMLElement | SVGElement | // MathMLElement |
    ((DraggableExtras:any, Element:HTMLElement|SVGElement) => HTMLElement|SVGElement) |
    'standard' | 'none'
  ) | null | undefined

  type DraggableOptions = {
    Extras?:any,
    relativeTo?:PositionReference, onlyFrom?:string, neverFrom?:string,
    Dummy?:DragDummy, DummyOffsetX?:number, DummyOffsetY?:number,
    minX?:number, minY?:number, maxX?:number, maxY?:number,
    Pannable?:string|HTMLElement|SVGElement,
    PanSensorWidth?:number, PanSensorHeight?:number, PanSpeed?:number,
    onDragStart?:Position | ((DraggableExtras:any) => Position),
    onDragMove?: (x:number,y:number, dx:number,dy:number, DraggableExtras:any) => void,
    onDragEnd?:  (x:number,y:number, dx:number,dy:number, DraggableExtras:any) => void,
  }

/**** parsedDraggableOptions ****/

  function parsedDraggableOptions (Options:any):DraggableOptions {
    Options = allowedPlainObject('drag options',Options) || {}

    let Extras:any, relativeTo:PositionReference
    let onlyFrom:string|undefined, neverFrom:string|undefined
    let Dummy:DragDummy, DummyOffsetX:number, DummyOffsetY:number
    let minX:number, minY:number, maxX:number, maxY:number
    let Pannable:string|HTMLElement|SVGElement|undefined
    let PanSensorWidth:number, PanSensorHeight:number, PanSpeed:number
    let onDragStart:Function, onDragMove:Function, onDragEnd:Function, onDragCancel:Function

    Extras = Options.Extras

    switch (true) {
      case (Options.relativeTo == null):
        relativeTo = 'parent'; break
      case (Options.relativeTo === 'parent'):
      case (Options.relativeTo === 'body'):
      case ValueIsNonEmptyString(Options.relativeTo):
      case (Options.relativeTo instanceof HTMLElement):
      case (Options.relativeTo instanceof SVGElement):
//    case (Options.relativeTo instanceof MathMLElement):
        relativeTo = Options.relativeTo as PositionReference; break
      default: throwError(
        'InvalidArgument: invalid position reference given'
      )
    }

    onlyFrom  = allowedNonEmptyString ('"onlyFrom" CSS selector',Options.onlyFrom)
    neverFrom = allowedNonEmptyString('"neverFrom" CSS selector',Options.neverFrom)

    switch (true) {
      case (Options.Dummy == null):
        Dummy = undefined; break
      case (Options.Dummy === 'standard'):
      case (Options.Dummy === 'none'):
      case ValueIsNonEmptyString(Options.Dummy):
      case (Options.Dummy instanceof HTMLElement):
      case (Options.Dummy instanceof SVGElement):
//    case (Options.Dummy instanceof MathMLElement):
      case ValueIsFunction(Options.Dummy):
        Dummy = Options.Dummy as DragDummy; break
      default: throwError(
        'InvalidArgument: invalid drag dummy specification given'
      )
    }

    DummyOffsetX = allowedFiniteNumber('dummy x offset',Options.DummyOffsetX)
    DummyOffsetY = allowedFiniteNumber('dummy y offset',Options.DummyOffsetY)

    minX = allowedFiniteNumber('min. x position',Options.minX)
      if (minX == null) { minX = -Infinity }
    minY = allowedFiniteNumber('min. y position',Options.minY)
      if (minY == null) { minY = -Infinity }
    maxX = allowedFiniteNumber('max. x position',Options.maxX)
      if (maxX == null) { maxX = Infinity }
    maxY = allowedFiniteNumber('max. y position',Options.maxY)
      if (maxY == null) { maxY = Infinity }

    switch (true) {
      case (Options.Pannable == null):
        Pannable = undefined; break
      case ValueIsNonEmptyString(Options.Pannable):
      case (Options.Pannable instanceof HTMLElement):
      case (Options.Pannable instanceof SVGElement):
//    case (Options.Pannable instanceof MathMLElement):
        Pannable = Options.Pannable; break
      default: throwError(
        'InvalidArgument: invalid "Pannable" specification given'
      )
    }

    PanSensorWidth  = allowedOrdinal ('panning sensor width',Options.PanSensorWidth)
      if (PanSensorWidth  == null) { PanSensorWidth = 20 }
    PanSensorHeight = allowedOrdinal('panning sensor height',Options.PanSensorHeight)
      if (PanSensorHeight == null) { PanSensorHeight = 20 }
    PanSpeed        = allowedOrdinal        ('panning speed',Options.PanSpeed)
      if (PanSpeed == null) { PanSpeed = 10 }

    if (ValueIsPosition(Options.onDragStart)) {
      let { x,y } = Options.onDragStart as Position
      onDragStart = () => ({x,y})
    } else {
      onDragStart = allowedFunction('"onDragStart" handler', Options.onDragStart)
    }

    onDragMove = allowedFunction('"onDragMove" handler', Options.onDragMove)
    onDragEnd  = allowedFunction('"onDragEnd" handler',  Options.onDragEnd)

    return {
      Extras, relativeTo, onlyFrom,neverFrom, Dummy, DummyOffsetX,DummyOffsetY,
      minX,minY, maxX,maxY,
      Pannable, PanSensorWidth,PanSensorHeight, PanSpeed,
// @ts-ignore we cannot validate given functions any further
      onDragStart, onDragMove, onDragEnd, onDragCancel
    }
  }

/**** use:asDraggable={options} ****/

  export function asDraggable (
    Element:HTMLElement|SVGElement, Options:DraggableOptions
  ) {
    let isDragged:boolean
    let currentDraggableOptions:DraggableOptions

    let PositionReference:Element         // element with user coordinate system
    let ReferenceDeltaX:number, ReferenceDeltaY:number  // mouse -> user coord.s
    let PositioningWasDelayed:boolean // workaround for prob. with "drag" events
    let DragImage:Element | undefined
    let initialPosition:Position                    // given in user coordinates
    let lastPosition:   Position                                         // dto.

    isDragged = false

    currentDraggableOptions = parsedDraggableOptions(Options)

  /**** startDragging ****/

    function startDragging (originalEvent:DragEvent) {
      let Options = currentDraggableOptions

      if (fromForbiddenElement(Element,Options,originalEvent)) {
        originalEvent.stopPropagation()
        originalEvent.preventDefault()
        return false
      }

      PositionReference = PositionReferenceFor(Element,Options)

      let relativePosition = Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, PositionReference
      )                                         // relative to reference element

      ReferenceDeltaX = ReferenceDeltaY = 0; initialPosition = { x:0,y:0 }
      if (Options.onDragStart == null) {
        initialPosition = { x:0,y:0 }               // given in user coordinates
      } else {
        try {
          let StartPosition = (Options.onDragStart as Function)(Options.Extras)
          if (ValueIsPlainObject(StartPosition)) {
            let x = allowedFiniteNumber('x start position',StartPosition.x)
            let y = allowedFiniteNumber('y start position',StartPosition.y)

            ReferenceDeltaX = x - relativePosition.left
            ReferenceDeltaY = y - relativePosition.top

            x = constrained(x, Options.minX,Options.maxX)
            y = constrained(y, Options.minY,Options.maxY)

            initialPosition = { x,y }               // given in user coordinates
          }
        } catch (Signal) {
          console.error('"onDragStart" handler failed',Signal)
        }
      }

      lastPosition = initialPosition

      PositioningWasDelayed = false                    // initializes workaround

      if (Options.Dummy == null) {
        Options.Dummy = 'none'      // this is the default for "use.asDraggable"
      }

      DragImage = DragImageFor(Element,Options)
      if ((DragImage != null) && (originalEvent.dataTransfer != null)) {
        let OffsetX = Options.DummyOffsetX as number
        let OffsetY = Options.DummyOffsetY as number

        if ((OffsetX == null) || (OffsetY == null)) {
          let PositionInDraggable = Conversion.fromDocumentTo(
            'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
          )

          if (OffsetX == null) { OffsetX = PositionInDraggable.left }
          if (OffsetY == null) { OffsetY = PositionInDraggable.top }
        }

        switch (true) {
          case (Options.Dummy === 'none'):
            originalEvent.dataTransfer.setDragImage(DragImage,0,0)
            setTimeout(() => { // remove element after browser took its snapshot
              document.body.removeChild(DragImage as HTMLElement)
            },0)
            break
          case ValueIsString(Options.Dummy):
            originalEvent.dataTransfer.setDragImage(DragImage, OffsetX,OffsetY)
            setTimeout(() => { // remove element after browser took its snapshot
              document.body.removeChild(
                (DragImage as HTMLElement).parentElement as HTMLElement
              )
            },0)
            break
          default:
            originalEvent.dataTransfer.setDragImage(DragImage, OffsetX,OffsetY)
        }
      }

      if (originalEvent.dataTransfer != null) {
        originalEvent.dataTransfer.effectAllowed = 'none'
      }

      isDragged = true
      setTimeout(() => Element.classList.add('dragged'), 0)

      originalEvent.stopPropagation()
    }

  /**** continueDragging ****/

    function continueDragging (originalEvent:DragEvent) {
      if (! isDragged) { return false }

      let Options = currentDraggableOptions

      if (
        (originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
        ! PositioningWasDelayed
      ) {
        PositioningWasDelayed = true // last "drag" event contains wrong coord.s
      } else {
        PositioningWasDelayed = false

        performPanningFor(
          'draggable',
          Element, Options, originalEvent.pageX,originalEvent.pageY
        )

        let relativePosition = Conversion.fromDocumentTo(
          'local', { left:originalEvent.pageX, top:originalEvent.pageY }, PositionReference
        )                                       // relative to reference element

        let x  = relativePosition.left + ReferenceDeltaX  // in user coordinates
        let y  = relativePosition.top  + ReferenceDeltaY

        x = constrained(x, Options.minX,Options.maxX)
        y = constrained(y, Options.minY,Options.maxY)

        let dx = x - lastPosition.x         // calculated AFTER constraining x,y
        let dy = y - lastPosition.y                                      // dto.

        lastPosition = { x,y }

        invokeHandler('onDragMove', Options, x,y, dx,dy, Options.Extras)
      }

      originalEvent.stopPropagation()
    }

  /**** finishDragging ****/

    function finishDragging (originalEvent:DragEvent) {
      if (! isDragged) { return false }

//    continueDragging(originalEvent)           // NO! positions might be wrong!

      let Options = currentDraggableOptions

      if (Options.onDragEnd != null) {
        let x = constrained(lastPosition.x, Options.minX,Options.maxX)
        let y = constrained(lastPosition.y, Options.minY,Options.maxY)

        let dx = x - lastPosition.x
        let dy = y - lastPosition.y

        invokeHandler('onDragEnd', Options, x,y, dx,dy, Options.Extras)
      }

      isDragged = false
      Element.classList.remove('dragged')

      originalEvent.stopPropagation()
    }

  /**** updateDraggableOptions ****/

    function updateDraggableOptions (Options:any):void {
      Options = parsedDraggableOptions(Options)

      if (
        (currentDraggableOptions.Extras == null) && (Options.Extras != null)
      ) {
        currentDraggableOptions.Extras = Options.Extras
      }           // Extras may be set with delay, but remain constant afterwards

      currentDraggableOptions.Dummy = (
        Options.Dummy || currentDraggableOptions.Dummy
      )

      currentDraggableOptions.minX = Options.minX
      currentDraggableOptions.minY = Options.minY
      currentDraggableOptions.maxX = Options.maxX
      currentDraggableOptions.maxY = Options.maxY

      currentDraggableOptions.Pannable        = Options.Pannable
      currentDraggableOptions.PanSensorWidth  = Options.PanSensorWidth
      currentDraggableOptions.PanSensorHeight = Options.PanSensorHeight
      currentDraggableOptions.PanSpeed        = Options.PanSpeed

      currentDraggableOptions.onDragStart = (
        Options.onDragStart || currentDraggableOptions.onDragStart
      )           // may be used to update initial position for subsequent drags
    }

    Element.setAttribute('draggable','true')

// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragstart', startDragging)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('drag',      continueDragging)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragend',   finishDragging)

    return { update:updateDraggableOptions }
  }

/**** fromForbiddenElement ****/

  function fromForbiddenElement (
    Element:HTMLElement|SVGElement, Options:DraggableOptions,
    originalEvent:DragEvent
  ):boolean {
    if ((Options.onlyFrom != null) || (Options.neverFrom != null)) {
      let x = originalEvent.clientX
      let y = originalEvent.clientY

      let touchedElement = document.elementFromPoint(x,y) as HTMLElement

//    elementFromPoint considers elements with "pointer-events" <> "none" only
//    but sometimes, "pointer-events:none" is needed for proper operation

      touchedElement = innerElementOf(touchedElement, x,y)

      if (Options.onlyFrom != null) {
        let fromElement = touchedElement.closest(Options.onlyFrom as string)
        if ((Element !== fromElement) && ! Element.contains(fromElement)) {
          return true
        }
      }

      if (Options.neverFrom != null) {
        let fromElement = touchedElement.closest(Options.neverFrom as string)
        if ((Element === fromElement) || Element.contains(fromElement)) {
          return true
        }
      }
    }

    return false
  }

/**** innerElementOf ****/

  function innerElementOf (Candidate:HTMLElement, x:number,y:number):HTMLElement {
    let innerElements = Candidate.children
    for (let i = 0, l = innerElements.length; i < l; i++) {
      let innerElement = innerElements[i] as HTMLElement

      let Position = Conversion.fromLocalTo(
        'viewport', { left:0, top:0 }, innerElement
      )
      if ((x < Position.left) || (y < Position.top)) { continue }

      if (x > Position.left+innerElement.offsetWidth-1) { continue }
      if (y > Position.top+innerElement.offsetHeight-1) { continue }

      return innerElementOf(innerElement, x,y)
    }

    return Candidate               // this is the innermost element at (x,y)
  }

/**** extended Drag-and-Drop Support ****/

  type extendedDragAndDropSupport = {
    currentDroppableExtras:any,        // extras for currently dragged droppable
    currentDropZoneExtras:any,         // extras for currently hovered drop zone
    currentDropZoneElement:Element|undefined,                 // dto. as Element

    DroppableWasDropped:boolean,        // indicates a successful drop operation
    currentDropZonePosition:Position|undefined, // position relative to DropZone
    currentDropOperation:DropOperation|undefined,       // actual drop operation
    currentTypeTransferred:string|undefined,  // actual type of transferred data
    currentDataTransferred:any,                       // actual data transferred
  }

/**** Support for Holding and Panning ****/

  type SupportForHoldingAndPanning = {
    HoldPosition?:Position,               // current position to compare against
    HoldTimer?:any,
    HoldWasTriggeredForElement?:HTMLElement | SVGElement,

    DropZonePanning?:boolean
  }                                           // because we trigger it once only

//-------------------------------------------------------------------------------
//--               use:asDroppable={options} - "drag" and "drop"               --
//-------------------------------------------------------------------------------

  export const DropOperations = [ 'copy', 'move', 'link' ]
  export type  DropOperation  = typeof DropOperations[number]

  export type DataOfferSet = { [Type:string]:string }

  type DroppableOptions = DraggableOptions & {
    Operations?:string,// consisting of 'copy', 'move', 'link' (blank-separated)
    DataToOffer?:DataOfferSet,
    onDropZoneEnter?: (x:number,y:number, DropZoneExtras:any, DroppableExtras:any) => void,
    onDropZoneHover?: (x:number,y:number, DropZoneExtras:any, DroppableExtras:any) => void,
    onDropZoneLeave?: (DropZoneExtras:any, DroppableExtras:any) => void,
    onDropped?:       (x:number,y:number, Operation:DropOperation,
                        TypeTransferred:string, DataTransferred:any,
                        DropZoneExtras:any, DroppableExtras:any) => void,
  }

/**** parsedDroppableOptions ****/

  function parsedDroppableOptions (Options:any):DroppableOptions {
    Options = allowedPlainObject('drop options',Options) || {}

    let Operations:string, DataToOffer:DataOfferSet
    let onDropZoneEnter:Function, onDropZoneHover:Function, onDropZoneLeave:Function
    let onDropped:Function

    Operations  = parsedOperations('list of allowed operations',Options.Operations,'copy')
    DataToOffer = Object.assign(
      {}, allowedPlainObject('data to be offered',Options.DataToOffer)
    )
    if ('none' in DataToOffer) throwError(
      'InvalidArgument: "none" is not a valid data type'
    )

    onDropZoneEnter = allowedFunction('"onDropZoneEnter" handler',Options.onDropZoneEnter)
    onDropZoneHover = allowedFunction('"onDropZoneHover" handler',Options.onDropZoneHover)
    onDropZoneLeave = allowedFunction('"onDropZoneLeave" handler',Options.onDropZoneLeave)
    onDropped       = allowedFunction('"onDropped" handler',      Options.onDropped)

    return {
      Operations, DataToOffer,
// @ts-ignore we cannot validate given functions any further
      onDropZoneEnter, onDropZoneHover, onDropZoneLeave, onDropped
    }
  }

/**** use:asDroppable={options} ****/

  export function asDroppable (
    Element:HTMLElement|SVGElement, Options:DroppableOptions
  ) {
    let isDragged:boolean
    let currentDraggableOptions:DraggableOptions
    let currentDroppableOptions:DroppableOptions

    let PositionReference:Element         // element with user coordinate system
    let ReferenceDeltaX:number, ReferenceDeltaY:number  // mouse -> user coord.s
    let PositioningWasDelayed:boolean // workaround for prob. with "drag" events
    let DragImage:Element | undefined
    let initialPosition:Position                    // given in user coordinates
    let lastPosition:   Position                                         // dto.

    let lastDropZoneElement:HTMLElement|SVGElement|undefined
    let lastDropZoneExtras:any

    isDragged = false

    currentDraggableOptions = parsedDraggableOptions(Options)
    currentDroppableOptions = parsedDroppableOptions(Options)

  /**** startDragging ****/

    function startDragging (originalEvent:DragEvent) {
      let Options = Object.assign(
        {}, currentDraggableOptions, currentDroppableOptions
      )

      if (fromForbiddenElement(Element,Options,originalEvent)) {
        originalEvent.stopPropagation()
        originalEvent.preventDefault()
        return false
      }

      PositionReference = PositionReferenceFor(Element,Options)

      let relativePosition = Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, PositionReference
      )                                         // relative to reference element

      ReferenceDeltaX = ReferenceDeltaY = 0; initialPosition = { x:0,y:0 }
      if (Options.onDragStart == null) {
        initialPosition = { x:0,y:0 }               // given in user coordinates
      } else {
        try {
          let StartPosition = (Options.onDragStart as Function)(Options.Extras)
          if (ValueIsPlainObject(StartPosition)) {
            let x = allowedFiniteNumber('x start position',StartPosition.x)
            let y = allowedFiniteNumber('y start position',StartPosition.y)

            ReferenceDeltaX = x - relativePosition.left
            ReferenceDeltaY = y - relativePosition.top

            x = constrained(x, Options.minX,Options.maxX)
            y = constrained(y, Options.minY,Options.maxY)

            initialPosition = { x,y }               // given in user coordinates
          }
        } catch (Signal) {
          console.error('"onDragStart" handler failed',Signal)
        }
      }

      lastPosition        = initialPosition
      lastDropZoneElement = undefined
      lastDropZoneExtras  = undefined

      PositioningWasDelayed = false                    // initializes workaround

      if (Options.Dummy == null) {
        Options.Dummy = 'standard'  // this is the default for "use.asDroppable"
      }

      DragImage = DragImageFor(Element,Options)
      if ((DragImage != null) && (originalEvent.dataTransfer != null)) {
        let OffsetX = Options.DummyOffsetX as number
        let OffsetY = Options.DummyOffsetY as number

        if ((OffsetX == null) || (OffsetY == null)) {
          let PositionInDraggable = Conversion.fromDocumentTo(
            'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
          )

          if (OffsetX == null) { OffsetX = PositionInDraggable.left }
          if (OffsetY == null) { OffsetY = PositionInDraggable.top }
        }

        switch (true) {
          case (Options.Dummy === 'none'):
            originalEvent.dataTransfer.setDragImage(DragImage,0,0)
            setTimeout(() => { // remove element after browser took its snapshot
              document.body.removeChild(DragImage as HTMLElement)
            },0)
            break
          case ValueIsString(Options.Dummy):
            originalEvent.dataTransfer.setDragImage(DragImage, OffsetX,OffsetY)
            setTimeout(() => { // remove element after browser took its snapshot
              document.body.removeChild(
                (DragImage as HTMLElement).parentElement as HTMLElement
              )
            },0)
            break
          default:
            originalEvent.dataTransfer.setDragImage(DragImage, OffsetX,OffsetY)
        }
      }

      if (originalEvent.dataTransfer != null) {
        let allowedEffects = allowedEffectsFrom(Options.Operations as string)
        originalEvent.dataTransfer.effectAllowed = allowedEffects

        if (ObjectIsNotEmpty(Options.DataToOffer)) {
          for (let Type in Options.DataToOffer) {
            if (Options.DataToOffer.hasOwnProperty(Type)) {
              originalEvent.dataTransfer.setData(
                Type, Options.DataToOffer[Type]
              )
            }
          }
        }
      }

      Context.currentDroppableExtras  = Options.Extras
      Context.currentDropZoneExtras   = undefined
      Context.currentDropZonePosition = undefined
      Context.currentDropZoneElement  = undefined

      Context.DroppableWasDropped     = false
      Context.currentDropOperation    = undefined
      Context.currentTypeTransferred  = undefined
      Context.currentDataTransferred  = undefined

      isDragged = true
      setTimeout(() => Element.classList.add('dragged'), 0)

      originalEvent.stopPropagation()
    }

  /**** continueDragging ****/

    function continueDragging (originalEvent:DragEvent) {
      if (! isDragged) { return false }

      let Options = Object.assign(
        {}, currentDraggableOptions, currentDroppableOptions
      )

      if (
        (originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
        ! PositioningWasDelayed
      ) {
        PositioningWasDelayed = true // last "drag" event contains wrong coord.s
      } else {
        PositioningWasDelayed = false

        performPanningFor(
          'draggable',
          Element, Options, originalEvent.pageX,originalEvent.pageY
        )

        let relativePosition = Conversion.fromDocumentTo(
          'local', { left:originalEvent.pageX, top:originalEvent.pageY }, PositionReference
        )                                       // relative to reference element

        let x  = relativePosition.left + ReferenceDeltaX  // in user coordinates
        let y  = relativePosition.top  + ReferenceDeltaY

        x = constrained(x, Options.minX,Options.maxX)
        y = constrained(y, Options.minY,Options.maxY)

        let dx = x - lastPosition.x         // calculated AFTER constraining x,y
        let dy = y - lastPosition.y                                      // dto.

        lastPosition = { x,y }

        invokeHandler('onDragMove', Options, x,y, dx,dy, Options.Extras)
      }

      if (Context.currentDropZoneElement === lastDropZoneElement) {
        if (Context.currentDropZoneElement != null) {
          invokeHandler(
            'onDropZoneHover', Options,
            (Context.currentDropZonePosition as Position).x,(Context.currentDropZonePosition as Position).y,
            Context.currentDropZoneExtras, Options.Extras
          )
        }
      } else {
        if (Context.currentDropZoneElement == null) {
          Element.classList.remove('droppable')
          invokeHandler('onDropZoneLeave', Options, lastDropZoneExtras, Options.Extras)
        } else {
          Element.classList.add('droppable')
          invokeHandler(
            'onDropZoneEnter', Options,
            (Context.currentDropZonePosition as Position).x,(Context.currentDropZonePosition as Position).y,
            lastDropZoneExtras, Options.Extras
          )
        }

        lastDropZoneElement = Context.currentDropZoneElement as HTMLElement
        lastDropZoneExtras  = Context.currentDropZoneExtras
      }

      originalEvent.stopPropagation()
    }

  /**** finishDragging ****/

    function finishDragging (originalEvent:DragEvent) {
      if (! isDragged) { return false }

//    continueDragging(originalEvent)           // NO! positions might be wrong!

      let Options = Object.assign(
        {}, currentDraggableOptions, currentDroppableOptions
      )

      if (Context.DroppableWasDropped) {
        invokeHandler(
          'onDropped', Options,
          (Context.currentDropZonePosition as Position).x,(Context.currentDropZonePosition as Position).y,
          Context.currentDropOperation, Context.currentTypeTransferred, Context.currentDataTransferred,
          Context.currentDropZoneExtras, Options.Extras
        )

        Context.currentDropZoneExtras   = undefined
        Context.currentDropZonePosition = undefined
        Context.currentDropZoneElement  = undefined

        Context.DroppableWasDropped     = false
        Context.currentDropOperation    = undefined
        Context.currentTypeTransferred  = undefined
        Context.currentDataTransferred  = undefined
      }

      if (Options.onDragEnd != null) {
        let x = constrained(lastPosition.x, Options.minX,Options.maxX)
        let y = constrained(lastPosition.y, Options.minY,Options.maxY)

        let dx = x - lastPosition.x
        let dy = y - lastPosition.y

        invokeHandler('onDragEnd', Options, x,y, dx,dy, Options.Extras)
      }

      Context.currentDroppableExtras = undefined

      isDragged = false
      Element.classList.remove('dragged','droppable')

      originalEvent.stopPropagation()
    }

  /**** updateDraggableOptions ****/

    function updateDraggableOptions (Options:any):void {
      Options = parsedDraggableOptions(Options)

      if (
        (currentDraggableOptions.Extras == null) && (Options.Extras != null)
      ) {
        currentDraggableOptions.Extras = Options.Extras
      }           // Extras may be set with delay, but remain constant afterwards

      currentDraggableOptions.Dummy = (
        Options.Dummy || currentDraggableOptions.Dummy
      )

      currentDraggableOptions.minX = Options.minX
      currentDraggableOptions.minY = Options.minY
      currentDraggableOptions.maxX = Options.maxX
      currentDraggableOptions.maxY = Options.maxY

      currentDraggableOptions.Pannable        = Options.Pannable
      currentDraggableOptions.PanSensorWidth  = Options.PanSensorWidth
      currentDraggableOptions.PanSensorHeight = Options.PanSensorHeight
      currentDraggableOptions.PanSpeed        = Options.PanSpeed

      currentDraggableOptions.onDragStart = (
        Options.onDragStart || currentDraggableOptions.onDragStart
      )           // may be used to update initial position for subsequent drags
    }

  /**** updateDroppableOptions ****/

    function updateDroppableOptions (Options:any):void {
      Options = parsedDroppableOptions(Options)

      currentDroppableOptions.Operations  = Options.Operations
      currentDroppableOptions.DataToOffer = Options.DataToOffer
    }

    Element.setAttribute('draggable','true')

// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragstart', startDragging)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('drag',      continueDragging)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragend',   finishDragging)

    return {
      update:(Options:any) => {
        updateDraggableOptions(Options)
        updateDroppableOptions(Options)
      }
    }
  }

//-------------------------------------------------------------------------------
//--                 use:asDropZone={options} - for drop zones                 --
//-------------------------------------------------------------------------------

  export type TypeAcceptanceSet = { [Type:string]:string }
                   // values consist of 'copy', 'move', 'link' (blank-separated)
  type DropZoneOptions = {
    Extras?:any,
    TypesToAccept?:TypeAcceptanceSet,
    HoldDelay?:number,
    Pannable?:string|'this'|HTMLElement|SVGElement,
    PanSensorWidth?:number, PanSensorHeight?:number, PanSpeed?:number,
    onDroppableEnter?:(x:number,y:number, Operation:DropOperation, offeredTypeList:string[],
                        DroppableExtras:any, DropZoneExtras:any) => boolean|undefined,
    onDroppableMove?: (x:number,y:number, Operation:DropOperation, offeredTypeList:string[],
                        DroppableExtras:any, DropZoneExtras:any) => boolean|undefined,
    onDroppableHold?: (x:number,y:number, DroppableExtras:any, DropZoneExtras:any) => void,
    onDroppableLeave?:(DroppableExtras:any, DropZoneExtras:any) => void,
    onDrop?:          (x:number,y:number, Operation:DropOperation, DataOffered:any,
                        DroppableExtras:any, DropZoneExtras:any) => string | undefined,
  }

/**** parsedDropZoneOptions ****/

  function parsedDropZoneOptions (Options:any):DropZoneOptions {
    Options = allowedPlainObject('drop zone options',Options) || {}

    let Extras:any, TypesToAccept:TypeAcceptanceSet, HoldDelay:number
    let Pannable:string|'this'|HTMLElement|SVGElement|undefined
    let PanSensorWidth:number, PanSensorHeight:number, PanSpeed:number
    let onDroppableEnter:Function, onDroppableMove:Function, onDroppableLeave:Function
    let onDroppableHold:Function, onDroppableRelease:Function, onDrop:Function

    Extras = Options.Extras

    allowPlainObject('data types to be accepted',Options.TypesToAccept)
    TypesToAccept = Object.create(null)
      if ((Options.TypesToAccept != null) && ('none' in Options.TypesToAccept)) throwError(
        'InvalidArgument: "none" is not a valid data type'
      )

      for (let Type in Options.TypesToAccept) {
        if (Options.TypesToAccept.hasOwnProperty(Type)) {
          TypesToAccept[Type] = parsedOperations(
            'list of accepted operations for type ' + quoted(Type),
            Options.TypesToAccept[Type]
          )
        }
      }
    HoldDelay = allowedIntegerInRange('min. time to hold',Options.HoldDelay, 0) as number

    switch (true) {
      case (Options.Pannable == null):
        Pannable = undefined; break
      case (Options.Pannable === 'this'):
      case ValueIsNonEmptyString(Options.Pannable):
      case (Options.Pannable instanceof HTMLElement):
      case (Options.Pannable instanceof SVGElement):
//    case (Options.Pannable instanceof MathMLElement):
        Pannable = Options.Pannable; break
      default: throwError(
        'InvalidArgument: invalid "Pannable" specification given'
      )
    }

    PanSensorWidth  = allowedOrdinal ('panning sensor width',Options.PanSensorWidth)
      if (PanSensorWidth  == null) { PanSensorWidth = 20 }
    PanSensorHeight = allowedOrdinal('panning sensor height',Options.PanSensorHeight)
      if (PanSensorHeight == null) { PanSensorHeight = 20 }
    PanSpeed        = allowedOrdinal        ('panning speed',Options.PanSpeed)
      if (PanSpeed == null) { PanSpeed = 10 }

    onDroppableEnter   = allowedFunction('"onDroppableEnter" handler',  Options.onDroppableEnter)
    onDroppableMove    = allowedFunction('"onDroppableMove" handler',   Options.onDroppableMove)
    onDroppableLeave   = allowedFunction('"onDroppableLeave" handler',  Options.onDroppableLeave)
    onDroppableHold    = allowedFunction('"onDroppableHold" handler',   Options.onDroppableHold)
    onDroppableRelease = allowedFunction('"onDroppableRelease" handler',Options.onDroppableRelease)
    onDrop             = allowedFunction('"onDrop" handler',            Options.onDrop)

    return {
      Extras, TypesToAccept, HoldDelay,
      Pannable, PanSensorWidth,PanSensorHeight, PanSpeed,
// @ts-ignore we cannot validate given functions any further
      onDroppableEnter, onDroppableMove, onDroppableLeave,
// @ts-ignore we cannot validate given functions any further
      onDroppableHold, onDroppableRelease, onDrop,
    }
  }

/**** use:asDropZone={options} ****/

  export function asDropZone (
    Element:HTMLElement|SVGElement, Options:DropZoneOptions
  ) {
    let currentDropZoneOptions:DropZoneOptions

    currentDropZoneOptions = parsedDropZoneOptions(Options)

  /**** enteredByDroppable ****/

    function enteredByDroppable (originalEvent:DragEvent) {
      let Options = currentDropZoneOptions

      performPanningFor(
        'dropzone',
        Element, Options, originalEvent.pageX,originalEvent.pageY
      )

      let DropZonePosition = asPosition(Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
      ))                                         // relative to DropZone element

      if (
        ValueIsNumber(Options.HoldDelay) && (Options.HoldDelay as number > 0) &&
        (Context.HoldWasTriggeredForElement !== Element)
      ) { startHoldTimer(DropZonePosition) }

      if (
        (originalEvent.dataTransfer == null) ||
        (originalEvent.dataTransfer.effectAllowed === 'none')
      ) { return }

      let wantedOperation:any = originalEvent.dataTransfer.dropEffect
      if (wantedOperation === 'none') {            // workaround for browser bug
        switch (originalEvent.dataTransfer.effectAllowed) {
          case 'copy': case 'move': case 'link':
            wantedOperation = originalEvent.dataTransfer.effectAllowed; break
          default:
            wantedOperation = undefined
        }
      }

      let TypesToAccept   = Options.TypesToAccept as TypeAcceptanceSet
      let offeredTypeList = originalEvent.dataTransfer.types.filter((Type) =>
        (Type in TypesToAccept) &&
        (TypesToAccept[Type] !== '')          // "getData" is not available here
      ) // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
      if (offeredTypeList.length === 0) { return }

      let accepted:boolean|undefined = ResultOfHandler(
        'onDroppableEnter', Options,
        DropZonePosition.x, DropZonePosition.y,
        wantedOperation, offeredTypeList, Context.currentDroppableExtras, Options.Extras
      )

      if (accepted === false) {         // i.e. explicit "false" result required
        return
      } else {
        Context.currentDropZoneExtras   = Options.Extras
        Context.currentDropZoneElement  = Element
        Context.currentDropZonePosition = DropZonePosition

        Element.classList.add('hovered')

        originalEvent.preventDefault()
        originalEvent.stopPropagation()
      }
    }

  /**** hoveredByDroppable ****/
// warning: I've already seen leftByDroppable followed by hoveredByDropable!

    function hoveredByDroppable (originalEvent:DragEvent) {
      let Options = currentDropZoneOptions

      performPanningFor(
        'dropzone',
        Element, Options, originalEvent.pageX,originalEvent.pageY
      )

      let DropZonePosition = asPosition(Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
      ))                                         // relative to DropZone element

      if (
        ValueIsNumber(Options.HoldDelay) && (Options.HoldDelay as number > 0) &&
        (Context.HoldWasTriggeredForElement !== Element)
      ) {
        if (Context.HoldPosition == null) {           // see above for reasoning
          startHoldTimer(DropZonePosition)
        } else {
          continueHoldTimer(DropZonePosition)
        }
      }

      if (
        (originalEvent.dataTransfer == null) ||
        (originalEvent.dataTransfer.effectAllowed === 'none') ||
        (Context.currentDropZoneElement != null) && (Context.currentDropZoneElement !== Element)
      ) {
        Element.classList.remove('hovered')
        return
      }

// in some browsers, it may be that (currentDropZone !== Element)!

      let wantedOperation:any = originalEvent.dataTransfer.dropEffect
      if (wantedOperation === 'none') {            // workaround for browser bug
        switch (originalEvent.dataTransfer.effectAllowed) {
          case 'copy': case 'move': case 'link':
            wantedOperation = originalEvent.dataTransfer.effectAllowed; break
          default:
            wantedOperation = undefined
        }
      }

      let TypesToAccept   = Options.TypesToAccept as TypeAcceptanceSet
      let offeredTypeList = originalEvent.dataTransfer.types.filter((Type) =>
        (Type in TypesToAccept) &&
        (TypesToAccept[Type] !== '')          // "getData" is not available here
      ) // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
      if (offeredTypeList.length === 0) {
        if (Context.currentDropZoneElement === Element) {
          Context.currentDropZoneExtras   = undefined
          Context.currentDropZoneElement  = undefined
          Context.currentDropZonePosition = undefined
        }

        Element.classList.remove('hovered')
        return
      }

      Context.currentDropZonePosition = DropZonePosition

      let accepted = ResultOfHandler(
        'onDroppableMove', Options,
        Context.currentDropZonePosition.x, Context.currentDropZonePosition.y,
        wantedOperation, offeredTypeList, Context.currentDroppableExtras, Options.Extras
      )

      if (accepted === false) {         // i.e. explicit "false" result required
        Context.currentDropZoneExtras   = undefined
        Context.currentDropZoneElement  = undefined
        Context.currentDropZonePosition = undefined

        Element.classList.remove('hovered')
      } else {              // warning: sometimes (currentDropZone !== Element)!
        Context.currentDropZoneExtras   = Options.Extras
        Context.currentDropZoneElement  = Element
//      Context.currentDropZonePosition has already been set before

        Element.classList.add('hovered')

        originalEvent.preventDefault()            // never allow default action!
//      originalEvent.stopPropagation()

        return false          // special return value when drop seems acceptable
      }
    }

  /**** leftByDroppable ****/

    function leftByDroppable (originalEvent:DragEvent) {
      Element.classList.remove('hovered')
      Context.DropZonePanning = false

      stopHoldTimer()

      let Options = currentDropZoneOptions

      if (Context.currentDropZoneElement === Element) {
        if (Context.currentTypeTransferred == null) {   // see explanation below
          Context.currentDropZoneExtras   = undefined
          Context.currentDropZoneElement  = undefined

          Context.DroppableWasDropped     = false
          Context.currentDropZonePosition = undefined
          Context.currentTypeTransferred  = undefined
          Context.currentDataTransferred  = undefined

          invokeHandler('onDroppableLeave', Options, Context.currentDroppableExtras, Options.Extras)
        }                   // swallow "dragleave" right after successful "drop"

        originalEvent.preventDefault()
        originalEvent.stopPropagation()
      }
    }

  /**** droppedByDroppable ****/

    function droppedByDroppable (originalEvent:DragEvent) {
      Element.classList.remove('hovered')
      Context.DropZonePanning = false

      stopHoldTimer()

      if (
        (originalEvent.dataTransfer == null) ||
        (originalEvent.dataTransfer.effectAllowed === 'none') ||
        (Context.currentDropZoneElement !== Element)
      ) { return }

//    originalEvent.preventDefault()
      originalEvent.stopPropagation()

      let Options = currentDropZoneOptions

      let wantedOperation:any = originalEvent.dataTransfer.dropEffect
      if (wantedOperation === 'none') {            // workaround for browser bug
        switch (originalEvent.dataTransfer.effectAllowed) {
          case 'copy': case 'move': case 'link':
            wantedOperation = originalEvent.dataTransfer.effectAllowed; break
          default:
            wantedOperation = undefined
        }
      }

      let TypesToAccept   = Options.TypesToAccept as TypeAcceptanceSet
      let offeredTypeList = originalEvent.dataTransfer.types.filter((Type) =>
        (Type in TypesToAccept) && (
          (wantedOperation == null) ||
          (TypesToAccept[Type].indexOf(wantedOperation) >= 0)
        )
      ) // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
      if (offeredTypeList.length === 0) {
        Context.currentDropZoneExtras   = undefined
        Context.currentDropZonePosition = undefined

        Context.DroppableWasDropped     = false
        Context.currentDropOperation    = undefined
        Context.currentTypeTransferred  = undefined
        Context.currentDataTransferred  = undefined

        invokeHandler('onDroppableLeave', Options, Context.currentDroppableExtras, Options.Extras)

        return
      }

      Context.currentDropZonePosition = asPosition(Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
      ))                                         // relative to DropZone element

      let offeredData:any = {}
        offeredTypeList.forEach(
// @ts-ignore originalEvent.dataTransfer definitely exists
          (Type) => offeredData[Type] = originalEvent.dataTransfer.getData(Type)
        )
      let acceptedType = ResultOfHandler(
        'onDrop', Options,
        Context.currentDropZonePosition.x, Context.currentDropZonePosition.y,
        wantedOperation, offeredData, Context.currentDroppableExtras, Options.Extras
      )

      switch (true) {
        case (acceptedType == null):
          Context.DroppableWasDropped    = true
          Context.currentDropOperation   = wantedOperation
          Context.currentTypeTransferred = undefined
          Context.currentDataTransferred = undefined
          break
        case ValueIsOneOf(acceptedType,offeredTypeList):
          Context.DroppableWasDropped    = true
          Context.currentDropOperation   = wantedOperation
          Context.currentTypeTransferred = acceptedType
          Context.currentDataTransferred = offeredData[acceptedType]
          break
        default:               // handler should return false in case of failure
          Context.DroppableWasDropped     = false
          Context.currentDropZoneExtras   = undefined
          Context.currentDropZonePosition = undefined
          Context.currentDropOperation    = undefined
          Context.currentTypeTransferred  = undefined
          Context.currentDataTransferred  = undefined

//        invokeHandler('onDroppableLeave', Options, currentDroppableExtras, Options.Extras)
      }

      Context.currentDropZoneElement = undefined
    }

  /**** startHoldTimer ****/

    function startHoldTimer (DropZonePosition:Position):void {
      Context.HoldPosition = DropZonePosition

      if (Context.HoldTimer != null) {
        clearTimeout(Context.HoldTimer)
      }
      Context.HoldTimer    = setTimeout(triggerHold, Options.HoldDelay)
    }

  /**** continueHoldTimer ****/

    function continueHoldTimer (DropZonePosition:Position):void {
      let Offset = (
        ((Context.HoldPosition as Position).x-DropZonePosition.x)**2 +
        ((Context.HoldPosition as Position).y-DropZonePosition.y)**2
      )
      if (Offset > 25) {
        Context.HoldPosition = DropZonePosition

        clearTimeout(Context.HoldTimer)
        Context.HoldTimer = setTimeout(triggerHold, Options.HoldDelay)
      }
    }

  /**** stopHoldTimer ****/

    function stopHoldTimer () {
      delete Context.HoldPosition

      if (Context.HoldTimer != null) {
        clearTimeout(Context.HoldTimer)
        delete Context.HoldTimer
      }

      delete Context.HoldWasTriggeredForElement
    }

  /**** triggerHold ****/

    function triggerHold () {
      let DropZonePosition = (    // sometimes, there is no "enteredByDroppable"
        Context.currentDropZonePosition || Context.HoldPosition
      )

      delete Context.HoldPosition
      delete Context.HoldTimer

      Context.HoldWasTriggeredForElement = Element

      invokeHandler(
        'onDroppableHold', Options,
        (DropZonePosition as Position).x, (DropZonePosition as Position).y,
        Context.currentDroppableExtras, Options.Extras
      )
    }

  /**** updateDropZoneOptions ****/

    function updateDropZoneOptions (Options:any):void {
      Options = parsedDropZoneOptions(Options)

      if (
        (currentDropZoneOptions.Extras == null) && (Options.Extras != null)
      ) {
        currentDropZoneOptions.Extras = Options.Extras
      }           // Extras may be set with delay, but remain constant afterwards

      currentDropZoneOptions.TypesToAccept = Options.TypesToAccept

      currentDropZoneOptions.HoldDelay = Options.HoldDelay

      currentDropZoneOptions.Pannable        = Options.Pannable
      currentDropZoneOptions.PanSensorWidth  = Options.PanSensorWidth
      currentDropZoneOptions.PanSensorHeight = Options.PanSensorHeight
      currentDropZoneOptions.PanSpeed        = Options.PanSpeed
    }

    Element.setAttribute('draggable','true')

// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragenter', enteredByDroppable)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragover',  hoveredByDroppable)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragleave', leftByDroppable)
// @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('drop',      droppedByDroppable)

    return { update:updateDropZoneOptions }
  }

/**** ValueIsPosition ****/

  function ValueIsPosition (Candidate:any):boolean {
    return (
      ValueIsPlainObject(Candidate) &&
      ValueIsFiniteNumber(Candidate.x) && ValueIsFiniteNumber(Candidate.y)
    )
  }

/**** asPosition ****/

  function asPosition (Value:any):Position {
    return { x:Value.left, y:Value.top }
  }

/**** PositionReferenceFor ****/

  function PositionReferenceFor (
    Element:HTMLElement|SVGElement,
    Options:DraggableOptions|DroppableOptions
  ):Element {
    let PositionReference:Element | undefined | null
      switch (true) {
        case (Options.relativeTo === 'parent'):
          PositionReference = Element.parentElement
          break
        case (Options.relativeTo === 'body'):
          PositionReference = document.body
          break
        case (Options.relativeTo instanceof HTMLElement):
        case (Options.relativeTo instanceof SVGElement):
  //    case (Options.relativeTo instanceof MathMLElement):
          PositionReference = Options.relativeTo as Element
          if (
            (PositionReference != document.body) &&
            ! document.body.contains(PositionReference)
          ) throwError(
            'InvalidArgument: the HTML element given as "relativeTo" option ' +
            'is not part of this HTML document'
          )
          break
        default:                                                 // CSS selector
          PositionReference = Element.closest(Options.relativeTo as string)
      }
    return (PositionReference == null ? document.body : PositionReference)
  }

/**** DragImageFor ****/

  function DragImageFor (
    Element:HTMLElement|SVGElement,
    Options:DraggableOptions|DroppableOptions
  ):Element|undefined {
    switch (true) {
      case (Options.Dummy === 'standard'):
        return undefined
      case (Options.Dummy === 'none'):
        let invisibleDragImage = document.createElement('div')
          invisibleDragImage.setAttribute('style',
            'display:block; position:absolute; width:1px; height:1px; ' +
            'background:transparent; border:none; margin:0px; padding:0px; ' +
            'cursor:auto'
          )
          document.body.appendChild(invisibleDragImage)
        return invisibleDragImage
      case ValueIsNonEmptyString(Options.Dummy):          // may flicker shortly
        let auxiliaryElement = document.createElement('div')
          auxiliaryElement.style.display  = 'block'
          auxiliaryElement.style.position = 'absolute'
          auxiliaryElement.style.left     = (document.body.scrollWidth + 100)+'px'

          document.body.appendChild(auxiliaryElement)

          auxiliaryElement.innerHTML = Options.Dummy as string
        return auxiliaryElement.children[0]
      case (Options.Dummy instanceof HTMLElement):
      case (Options.Dummy instanceof SVGElement):
//    case (Options.Dummy instanceof MathMLElement):
        return Options.Dummy as Element
      case ValueIsFunction(Options.Dummy):
        let Candidate:HTMLElement | SVGElement | undefined = undefined
        try {
          Candidate = (Options.Dummy as Function)(Options.Extras, Element)
        } catch (Signal) {
          console.error('RuntimeError: creating draggable dummy failed',Signal)
        }

        if (Candidate != null) {
          if ((Candidate instanceof HTMLElement) || (Candidate instanceof SVGElement)) {
            return Candidate
          } else {
            console.error(
              'InvalidArgument: the newly created draggable dummy is ' +
              'neither an HTML nor an SVG element'
            )
          }
        }
    }
  }

  /**** performPanningFor ****/

    function performPanningFor (
      Type:'draggable'|'dropzone',
      Element:HTMLElement | SVGElement, Options:DraggableOptions,
      xOnPage:number,yOnPage:number
    ):void {
      if ((Type === 'draggable') && Context.DropZonePanning) { return }

      if (
        (Options.Pannable == null) ||
        ((Options.PanSensorWidth === 0) && (Options.PanSensorHeight === 0)) ||
        (Options.PanSpeed === 0)
      ) { Context.DropZonePanning = false; return }

      let pannableElement:Element|undefined|null
        switch (true) {
          case ValueIsNonEmptyString(Options.Pannable):
            pannableElement = Element.parentElement
            if (pannableElement != null) {
              pannableElement = pannableElement.closest(Options.Pannable as string)
            }
            break
          case (Options.Pannable === 'this') && (Type === 'dropzone'):
            pannableElement = Element
            break
          case (Options.Pannable instanceof HTMLElement):
          case (Options.Pannable instanceof SVGElement):
//        case (Options.Pannable instanceof MathMLElement):
            pannableElement = Options.Pannable as HTMLElement
        }
      if (pannableElement == null) { Context.DropZonePanning = false; return }

      let { left:xInPannable, top:yInPannable } = Conversion.fromDocumentTo(
        'local', { left:xOnPage, top:yOnPage }, pannableElement
      )

      if ((xInPannable >= 0) && (xInPannable < (Options.PanSensorWidth as number))) {
        pannableElement.scrollLeft = Math.max(
          0,pannableElement.scrollLeft - (Options.PanSpeed as number)
        )
      }

      let PannableWidth = pannableElement.clientWidth           // w/o scrollbar
      if (
        (xInPannable >= PannableWidth-(Options.PanSensorWidth as number)) &&
        (xInPannable < PannableWidth)
      ) {
        pannableElement.scrollLeft = Math.min(
          pannableElement.scrollLeft + (Options.PanSpeed as number),
          pannableElement.scrollWidth-PannableWidth
        )
      }

      if ((yInPannable >= 0) && (yInPannable < (Options.PanSensorHeight as number))) {
        pannableElement.scrollTop = Math.max(
          0,pannableElement.scrollTop - (Options.PanSpeed as number)
        )
      }

      let PannableHeight = pannableElement.clientHeight         // w/o scrollbar
      if (
        (yInPannable >= PannableHeight-(Options.PanSensorHeight as number)) &&
        (yInPannable < PannableHeight)
      ) {
        pannableElement.scrollTop = Math.min(
          pannableElement.scrollTop + (Options.PanSpeed as number),
          pannableElement.scrollHeight-PannableHeight
        )
      }

      Context.DropZonePanning = (Type === 'dropzone')
    }

/**** parsedOperations ****/

  function parsedOperations (
    Description:string, Argument:any, Default:string='copy move link'
  ):string {
    let Operations = allowedString(Description,Argument) || Default

    switch (Operations.trim()) {
      case 'all':  return 'copy move link'
      case 'none': return ''
    }

    let OperationList = Operations.trim().replace(/\s+/g,' ').split(' ')
      allowListSatisfying(
        Description,OperationList,
        (Operation:string) => ValueIsOneOf(Operation,DropOperations)
      )
    return OperationList.reduce(
      (Result:string, Operation:string) => (
        Result.indexOf(Operation) < 0 ? Result + Operation + ' ': Result
      ),' '
    )
  }

/**** allowedEffectsFrom ****/

  type allowedEffects = (
    'none'|'copy'|'copyLink'|'copyMove'|'link'|'linkMove'|'move'|'all'
  )

  function allowedEffectsFrom (Operations:string):allowedEffects {
    let EffectIndex = (                                       // Horner's method
      (Operations.indexOf('move') < 0 ? 0 : 1) * 2 +
      (Operations.indexOf('link') < 0 ? 0 : 1)
    ) * 2 +
    (Operations.indexOf('copy') < 0 ? 0 : 1)

    return [
      'none','copy','link','copyLink','move','copyMove','linkMove','all'
    ][EffectIndex] as allowedEffects
  }

/**** invokeHandler ****/

  function invokeHandler (Name:string, Options:any, ...Arguments:any):any {
    if (Options[Name] != null) {
      try {
        return Options[Name].apply(null,Arguments)
      } catch (Signal) {
        console.error(quoted(Name) + ' handler failed',Signal)
      }
    }
  }
  const ResultOfHandler = invokeHandler


