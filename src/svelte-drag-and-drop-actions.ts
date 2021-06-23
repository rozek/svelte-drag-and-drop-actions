//----------------------------------------------------------------------------//
//                        Svelte Drag-and-Drop Actions                        //
//----------------------------------------------------------------------------//

  import {
    throwError,
    ValueIsFiniteNumber, ValueIsString, ValueIsNonEmptyString,
    ValueIsPlainObject, ValueIsOneOf,
    allowedFiniteNumber, allowedIntegerInRange, allowedString,
    allowPlainObject, allowedPlainObject,
    allowListSatisfying, allowedFunction, allowedOneOf,
    ObjectIsEmpty, ObjectIsNotEmpty, StringIsNotEmpty, quoted, constrained
  } from 'javascript-interface-library'

  import Conversion from 'svelte-coordinate-conversion'

  const localId = Date.now() + '-' + Math.random()    // identifies this browser

//-------------------------------------------------------------------------------
//--             use:asDraggable={options} - "drag" without "drop"             --
//-------------------------------------------------------------------------------

  export type PositionReference = (
    'parent' | 'body' | string | HTMLElement | SVGElement // | MathMLElement
  )

  export type Position = { x:number, y:number }

  export type DragDummy = (
    string | HTMLElement | SVGElement | // MathMLElement |
    'standard' | 'none'
  ) | null | undefined

  type DraggableOptions = {
    relativeTo?:PositionReference,
    Dummy?:DragDummy, DummyOffsetX?:number, DummyOffsetY?:number,
    minX?:number, minY?:number, maxX?:number, maxY?:number,
    onDragStart?:Position | ((Element?:HTMLElement | SVGElement) => Position),
    onDragMove?: (x:number,y:number, dx:number,dy:number, Element?:HTMLElement | SVGElement) => void,
    onDragEnd?:  (x:number,y:number, dx:number,dy:number, Element?:HTMLElement | SVGElement) => void,
  }

/**** parsedDraggableOptions ****/

  function parsedDraggableOptions (Options:any):DraggableOptions {
    Options = allowedPlainObject('drag options',Options) || {}

    let relativeTo:PositionReference
    let Dummy:DragDummy, DummyOffsetX:number, DummyOffsetY:number
    let minX:number, minY:number, maxX:number, maxY:number
    let onDragStart:Function, onDragMove:Function, onDragEnd:Function, onDragCancel:Function

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

    switch (true) {
      case (Options.Dummy == null):
        Dummy = undefined; break
      case (Options.Dummy === 'standard'):
      case (Options.Dummy === 'none'):
      case ValueIsNonEmptyString(Options.Dummy):
      case (Options.Dummy instanceof HTMLElement):
      case (Options.Dummy instanceof SVGElement):
//    case (Options.Dummy instanceof MathMLElement):
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

    if (ValueIsPosition(Options.onDragStart)) {
      let { x,y } = Options.onDragStart as Position
      onDragStart = () => ({x,y})
    } else {
      onDragStart = allowedFunction('"onDragStart" handler', Options.onDragStart)
    }

    onDragMove = allowedFunction('"onDragMove" handler', Options.onDragMove)
    onDragEnd  = allowedFunction('"onDragEnd" handler',  Options.onDragEnd)

    return {
      relativeTo, Dummy, DummyOffsetX,DummyOffsetY,
      minX,minY, maxX,maxY,
// @ts-ignore
      onDragStart, onDragMove, onDragEnd, onDragCancel
    }
  }

/**** use:asDraggable={options} ****/

  export function asDraggable (
    Element:HTMLElement|SVGElement, Options:DraggableOptions
  ) {
    let currentDraggableOptions:DraggableOptions

    let PositionReference:Element         // element with user coordinate system
    let ReferenceDeltaX:number, ReferenceDeltaY:number  // mouse -> user coord.s
    let PositioningWasDelayed:boolean // workaround for prob. with "drag" events
    let DragImage:Element | undefined
    let initialPosition:Position                    // given in user coordinates
    let lastPosition:   Position                                         // dto.

    Options = currentDraggableOptions = parsedDraggableOptions(Options)

  /**** startDragging ****/

    function startDragging (originalEvent:DragEvent) {
      let Options = currentDraggableOptions

      PositionReference = PositionReferenceFor(Element,Options)

      let relativePosition = Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, PositionReference
      )                                         // relative to reference element

      ReferenceDeltaX = ReferenceDeltaY = 0; initialPosition = { x:0,y:0 }
      if (Options.onDragStart == null) {
        initialPosition = { x:0,y:0 }               // given in user coordinates
      } else {
        try {
          let StartPosition = (Options.onDragStart as Function)(Element)
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

      Element.classList.add('dragged')

      originalEvent.stopPropagation()
    }

  /**** continueDragging ****/

    function continueDragging (originalEvent:DragEvent) {
      let Options = currentDraggableOptions

      if (
        (originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
        ! PositioningWasDelayed
      ) {
        PositioningWasDelayed = true // last "drag" event contains wrong coord.s
      } else {
        PositioningWasDelayed = false

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

        invokeHandler('onDragMove', Options, x,y, dx,dy, Element)
      }

      originalEvent.stopPropagation()
    }

  /**** finishDragging ****/

    function finishDragging (originalEvent:DragEvent) {
//    continueDragging(originalEvent)           // NO! positions might be wrong!

      let Options = currentDraggableOptions

      if (Options.onDragEnd != null) {
        let x = constrained(lastPosition.x, Options.minX,Options.maxX)
        let y = constrained(lastPosition.y, Options.minY,Options.maxY)

        let dx = x - lastPosition.x
        let dy = y - lastPosition.y

        invokeHandler('onDragEnd', Options, x,y, dx,dy, Element)
      }

      Element.classList.remove('dragged')

      originalEvent.stopPropagation()
    }

  /**** updateDraggableOptions ****/

    function updateDraggableOptions (Options:any):void {
      Options = parsedDraggableOptions(Options)

      currentDraggableOptions.Dummy = (
        Options.Dummy || currentDraggableOptions.Dummy
      )

      currentDraggableOptions.minX = Options.minX
      currentDraggableOptions.minY = Options.minY
      currentDraggableOptions.maxX = Options.maxX
      currentDraggableOptions.maxY = Options.maxY

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

/**** extended Drag-and-Drop Support ****/

  let currentDroppableEntity:any                  // currently dragged droppable
  let currentDropZoneEntity:any                   // currently hovered drop zone
  let currentDropZoneElement:Element|undefined                // dto. as Element

  let DroppableWasDropped:boolean       // indicates a successful drop operation
  let currentDropZonePosition:Position|undefined// position relative to DropZone
  let currentDropOperation:DropOperation|undefined      // actual drop operation
  let currentTypeTransferred:string|undefined // actual type of transferred data
  let currentDataTransferred:any                      // actual data transferred

//-------------------------------------------------------------------------------
//--               use:asDroppable={options} - "drag" and "drop"               --
//-------------------------------------------------------------------------------

  const DropOperations = [ 'copy', 'move', 'link' ]
  export type DropOperation = typeof DropOperations[number]

  export type DataOfferSet = { [Type:string]:string }

  type DroppableOptions = DraggableOptions & {
    Entity?:any,
    Operations?:string,// consisting of 'copy', 'move', 'link' (blank-separated)
    DataToOffer?:DataOfferSet,
    onDropZoneEnter?: (DropZone:any, x:number,y:number, Element:HTMLElement | SVGElement) => void,
    onDropZoneHover?: (DropZone:any, x:number,y:number, Element:HTMLElement | SVGElement) => void,
    onDropZoneLeave?: (DropZone:any, Element:HTMLElement | SVGElement) => void,
    onDropped?:       (DropZone:any, x:number,y:number, Operation:DropOperation,
                        TypeTransferred:string, DataTransferred:any,
                        Element:HTMLElement | SVGElement) => void,
  }

/**** parsedDroppableOptions ****/

  function parsedDroppableOptions (Options:any):DroppableOptions {
    Options = allowedPlainObject('drop options',Options) || {}

    let Entity:any, Operations:string, DataToOffer:DataOfferSet
    let onDropZoneEnter:Function, onDropZoneHover:Function, onDropZoneLeave:Function
    let onDropped:Function

    Entity = Options.Entity

    Operations  = parsedOperations('list of allowed operations',Options.Operations,'copy')
    DataToOffer = Object.assign(
      {}, allowedPlainObject('data to be offered',Options.DataToOffer)
    )

    if (
      ('#' in DataToOffer) ||
      ObjectIsEmpty(DataToOffer) && StringIsNotEmpty(Operations)
    ) {
      DataToOffer['#'] = localId          // for passing objects within this app
    }

    onDropZoneEnter = allowedFunction('"onDropZoneEnter" handler',Options.onDropZoneEnter)
    onDropZoneHover = allowedFunction('"onDropZoneHover" handler',Options.onDropZoneHover)
    onDropZoneLeave = allowedFunction('"onDropZoneLeave" handler',Options.onDropZoneLeave)
    onDropped       = allowedFunction('"onDropped" handler',      Options.onDropped)

    return {
      Entity, Operations, DataToOffer,
// @ts-ignore
      onDropZoneEnter, onDropZoneHover, onDropZoneLeave, onDropped
    }
  }

/**** use:asDroppable={options} ****/

  export function asDroppable (
    Element:HTMLElement|SVGElement, Options:DroppableOptions
  ) {
    let currentDraggableOptions:DraggableOptions
    let currentDroppableOptions:DroppableOptions

    let PositionReference:Element         // element with user coordinate system
    let ReferenceDeltaX:number, ReferenceDeltaY:number  // mouse -> user coord.s
    let PositioningWasDelayed:boolean // workaround for prob. with "drag" events
    let DragImage:Element | undefined
    let initialPosition:Position                    // given in user coordinates
    let lastPosition:   Position                                         // dto.

    let lastDropZoneEntity:any

    currentDraggableOptions = parsedDraggableOptions(Options)
    currentDroppableOptions = parsedDroppableOptions(Options)

    Options = Object.assign(currentDraggableOptions,currentDroppableOptions)

  /**** startDragging ****/

    function startDragging (originalEvent:DragEvent) {
      let Options = Object.assign(
        {}, currentDraggableOptions, currentDroppableOptions
      )

      PositionReference = PositionReferenceFor(Element,Options)

      let relativePosition = Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, PositionReference
      )                                         // relative to reference element

      ReferenceDeltaX = ReferenceDeltaY = 0; initialPosition = { x:0,y:0 }
      if (Options.onDragStart == null) {
        initialPosition = { x:0,y:0 }               // given in user coordinates
      } else {
        try {
          let StartPosition = (Options.onDragStart as Function)(Element)
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

      lastPosition       = initialPosition
      lastDropZoneEntity = undefined

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

      currentDroppableEntity = Options.Entity

      currentDropZoneEntity   = undefined
      currentDropZonePosition = undefined

      DroppableWasDropped     = false
      currentDropOperation    = undefined
      currentTypeTransferred  = undefined
      currentDataTransferred  = undefined

      Element.classList.add('dragged')

      originalEvent.stopPropagation()
    }

  /**** continueDragging ****/

    function continueDragging (originalEvent:DragEvent) {
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

        if (Options.onDragMove != null) {
          invokeHandler('onDragMove', Options, x,y, dx,dy, Element)
        }
      }

      if (currentDropZoneEntity === lastDropZoneEntity) {
        if (currentDropZoneEntity != null) {
          invokeHandler(
            'onDropZoneHover', Options, currentDropZoneEntity,
            (currentDropZonePosition as Position).x,(currentDropZonePosition as Position).y,
            Element
          )
        }
      } else {
        if (currentDropZoneEntity == null) {
          Element.classList.remove('droppable')
          invokeHandler('onDropZoneLeave', Options, lastDropZoneEntity, Element)
        } else {
          Element.classList.add('droppable')
          invokeHandler(
            'onDropZoneEnter', Options, lastDropZoneEntity,
            (currentDropZonePosition as Position).x,(currentDropZonePosition as Position).y,
            Element
          )
        }

        lastDropZoneEntity = currentDropZoneEntity
      }

      originalEvent.stopPropagation()
    }

  /**** finishDragging ****/

    function finishDragging (originalEvent:DragEvent) {
//    continueDragging(originalEvent)           // NO! positions might be wrong!

      let Options = Object.assign(
        {}, currentDraggableOptions, currentDroppableOptions
      )

      if (DroppableWasDropped) {
        invokeHandler(
          'onDropped', Options, currentDropZoneEntity,
          (currentDropZonePosition as Position).x,(currentDropZonePosition as Position).y,
          currentDropOperation, currentTypeTransferred, currentDataTransferred, Element
        )

        currentDropZoneEntity   = undefined
        currentDropZonePosition = undefined

        DroppableWasDropped     = false
        currentDropOperation    = undefined
        currentTypeTransferred  = undefined
        currentDataTransferred  = undefined
      }

      if (Options.onDragEnd != null) {
        let x = constrained(lastPosition.x, Options.minX,Options.maxX)
        let y = constrained(lastPosition.y, Options.minY,Options.maxY)

        let dx = x - lastPosition.x
        let dy = y - lastPosition.y

        invokeHandler('onDragEnd', Options, x,y, dx,dy)
      }

      currentDroppableEntity = undefined

      Element.classList.remove('dragged','droppable')

      originalEvent.stopPropagation()
    }

  /**** updateDraggableOptions ****/

    function updateDraggableOptions (Options:any):void {
      Options = parsedDraggableOptions(Options)

      currentDraggableOptions.Dummy = (
        Options.Dummy || currentDraggableOptions.Dummy
      )

      currentDraggableOptions.minX = Options.minX
      currentDraggableOptions.minY = Options.minY
      currentDraggableOptions.maxX = Options.maxX
      currentDraggableOptions.maxY = Options.maxY

      currentDraggableOptions.onDragStart = (
        Options.onDragStart || currentDraggableOptions.onDragStart
      )           // may be used to update initial position for subsequent drags
    }  /**** updateDroppableOptions ****/

    function updateDroppableOptions (Options:any):void {
      Options = parsedDroppableOptions(Options)

      if (Options.Entity != null) {
        currentDroppableOptions.Entity = Options.Entity
      }
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
    Entity?:any,
    TypesToAccept?:TypeAcceptanceSet,
    HoldDelay?:number,
    onDroppableEnter?:  (Droppable:any, x:number,y:number, Operation:DropOperation,
                          offeredTypeList:string[], Element:HTMLElement | SVGElement) => boolean|undefined,
    onDroppableMove?:   (Droppable:any, x:number,y:number, Operation:DropOperation,
                          offeredTypeList:string[], Element:HTMLElement | SVGElement) => boolean|undefined,
    onDroppableHold?:   (Droppable:any, x:number,y:number, Element:HTMLElement | SVGElement) => void,
    onDroppableRelease?:(Droppable:any, x:number,y:number, Element:HTMLElement | SVGElement) => void,
    onDroppableLeave?:  (Droppable:any, Element:HTMLElement | SVGElement) => void,
    onDrop?:            (Droppable:any, x:number,y:number, Operation:DropOperation,
                          DataOffered:any, Element:HTMLElement | SVGElement) => string,
  }

/**** parsedDropZoneOptions ****/

  function parsedDropZoneOptions (Options:any):DropZoneOptions {
    Options = allowedPlainObject('drop zone options',Options) || {}

    let Entity:any, TypesToAccept:TypeAcceptanceSet, HoldDelay:number
    let onDroppableEnter:Function, onDroppableMove:Function, onDroppableLeave:Function
    let onDroppableHold:Function, onDroppableRelease:Function, onDrop:Function

    Entity = Options.Entity

    allowPlainObject('data types to be accepted',Options.TypesToAccept)
    TypesToAccept = Object.create(null)
      for (let Type in Options.TypesToAccept) {
        if (Options.TypesToAccept.hasOwnProperty(Type)) {
          TypesToAccept[Type] = parsedOperations(
            'list of accepted operations for type ' + quoted(Type),
            Options.TypesToAccept[Type]
          )
        }
      }
    HoldDelay = allowedIntegerInRange('min. time to hold',Options.HoldDelay, 0) as number

    onDroppableEnter   = allowedFunction('"onDroppableEnter" handler',  Options.onDroppableEnter)
    onDroppableMove    = allowedFunction('"onDroppableMove" handler',   Options.onDroppableMove)
    onDroppableLeave   = allowedFunction('"onDroppableLeave" handler',  Options.onDroppableLeave)
    onDroppableHold    = allowedFunction('"onDroppableHold" handler',   Options.onDroppableHold)
    onDroppableRelease = allowedFunction('"onDroppableRelease" handler',Options.onDroppableRelease)
    onDrop             = allowedFunction('"onDrop" handler',            Options.onDrop)

    return {
      Entity, TypesToAccept, HoldDelay,
// @ts-ignore
      onDroppableEnter, onDroppableMove, onDroppableLeave,
// @ts-ignore
      onDroppableHold, onDroppableRelease, onDrop
    }
  }

/**** use:asDropZone={options} ****/

  export function asDropZone (
    Element:HTMLElement|SVGElement, Options:DropZoneOptions
  ) {
    let currentDropZoneOptions:DropZoneOptions

    Options = currentDropZoneOptions = parsedDropZoneOptions(Options)

  /**** enteredByDroppable ****/

    function enteredByDroppable (originalEvent:DragEvent) {
      if (
        (originalEvent.dataTransfer == null) ||
        (originalEvent.dataTransfer.effectAllowed === 'none')
      ) { return }

      let Options = currentDropZoneOptions

      let wantedOperation:any = originalEvent.dataTransfer.dropEffect
      if (wantedOperation === 'none') {            // workaround for browser bug
        wantedOperation = undefined
      }

      let TypesToAccept   = Options.TypesToAccept as TypeAcceptanceSet
      let offeredTypeList = originalEvent.dataTransfer.types.filter((Type) =>
        (Type in TypesToAccept) &&
        (TypesToAccept[Type] !== '')          // "getData" is not available here
      ) // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
      if (offeredTypeList.length === 0) { return }

      let DropZonePosition = asPosition(Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
      ))                                         // relative to DropZone element

      let accepted:boolean|undefined = ResultOfHandler(
        'onDroppableEnter', Options, currentDroppableEntity,
        DropZonePosition.x, DropZonePosition.y,
        wantedOperation, offeredTypeList, Element
      )

      if (accepted === false) {
        return
      } else {
        currentDropZoneEntity   = Options.Entity
        currentDropZoneElement  = Element
        currentDropZonePosition = DropZonePosition

        Element.classList.add('hovered')

        originalEvent.preventDefault()
        originalEvent.stopPropagation()
      }
    }

  /**** hoveredByDroppable ****/

    function hoveredByDroppable (originalEvent:DragEvent) {
      if (
        (originalEvent.dataTransfer == null) ||
        (originalEvent.dataTransfer.effectAllowed === 'none') ||
        (currentDropZoneElement !== Element)
      ) { return }

      let Options = currentDropZoneOptions

      let wantedOperation:any = originalEvent.dataTransfer.dropEffect
      if (wantedOperation === 'none') {            // workaround for browser bug
        wantedOperation = undefined
      }

      let TypesToAccept   = Options.TypesToAccept as TypeAcceptanceSet
      let offeredTypeList = originalEvent.dataTransfer.types.filter((Type) =>
        (Type in TypesToAccept) &&
        (TypesToAccept[Type] !== '')          // "getData" is not available here
      ) // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
      if (offeredTypeList.length === 0) {
        if (currentDropZoneElement === Element) {
          currentDropZoneEntity   = undefined
          currentDropZoneElement  = undefined
          currentDropZonePosition = undefined

          Element.classList.remove('hovered')
        }

        return
      }

      currentDropZonePosition = asPosition(Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
      ))                                         // relative to DropZone element

      let accepted = ResultOfHandler(
        'onDroppableMove', Options, currentDroppableEntity,
        currentDropZonePosition.x, currentDropZonePosition.y,
        wantedOperation, offeredTypeList, Element
      )

      if (accepted === false) {
        currentDropZoneEntity   = undefined
        currentDropZoneElement  = undefined
        currentDropZonePosition = undefined

        Element.classList.remove('hovered')
      } else {
        originalEvent.preventDefault()
        originalEvent.stopPropagation()
      }
    }

  /**** leftByDroppable ****/

    function leftByDroppable (originalEvent:DragEvent) {
      let Options = currentDropZoneOptions

      if (currentDropZoneElement === Element) {
        if (currentTypeTransferred == null) {
          currentDropZoneEntity   = undefined
          currentDropZoneElement  = undefined

          DroppableWasDropped     = false
          currentDropZonePosition = undefined
          currentTypeTransferred  = undefined
          currentDataTransferred  = undefined

          Element.classList.remove('hovered')

          invokeHandler('onDroppableLeave', Options, currentDroppableEntity, Element)
        }                   // swallow "dragleave" right after successful "drop"

        originalEvent.preventDefault()
        originalEvent.stopPropagation()
      }
    }

  /**** droppedByDroppable ****/

    function droppedByDroppable (originalEvent:DragEvent) {
      if (
        (originalEvent.dataTransfer == null) ||
        (originalEvent.dataTransfer.effectAllowed === 'none') ||
        (currentDropZoneElement !== Element)
      ) { return }

      originalEvent.preventDefault()              // never allow default action!
      originalEvent.stopPropagation()

      let Options = currentDropZoneOptions

      let wantedOperation:any = originalEvent.dataTransfer.dropEffect
      if (wantedOperation === 'none') {            // workaround for browser bug
        wantedOperation = undefined
      }

      let TypesToAccept   = Options.TypesToAccept as TypeAcceptanceSet
      let offeredTypeList = originalEvent.dataTransfer.types.filter((Type) =>
        (Type in TypesToAccept) && (
          (wantedOperation == null) ||
          (TypesToAccept[Type].indexOf(wantedOperation) >= 0)
        ) && (
          (Type !== '#') ||
// @ts-ignore originalEvent.dataTransfer is definitely != null
          (Type === '#') && (originalEvent.dataTransfer.getData('#') === localId)
        )
      ) // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
      if (offeredTypeList.length === 0) {
        currentDropZoneEntity   = undefined
        currentDropZonePosition = undefined

        DroppableWasDropped     = false
        currentDropOperation    = undefined
        currentTypeTransferred  = undefined
        currentDataTransferred  = undefined

        Element.classList.remove('hovered')

        invokeHandler('onDroppableLeave', Options, currentDroppableEntity, Element)

        return
      }

      currentDropZonePosition = asPosition(Conversion.fromDocumentTo(
        'local', { left:originalEvent.pageX, top:originalEvent.pageY }, Element
      ))                                         // relative to DropZone element

      let offeredData:any = {}
        offeredTypeList.forEach(
// @ts-ignore originalEvent.dataTransfer definitely exists
          (Type) => offeredData[Type] = originalEvent.dataTransfer.getData(Type)
        )
        if ('#' in offeredData) { offeredData['#'] = null }
      let acceptedType = ResultOfHandler(
        'onDrop', Options, currentDroppableEntity,
        currentDropZonePosition.x, currentDropZonePosition.y,
        wantedOperation, offeredData, Element
      )

      switch (true) {
        case (acceptedType == null):
          DroppableWasDropped    = true
          currentDropOperation   = wantedOperation
          currentTypeTransferred = undefined
          currentDataTransferred = undefined
          break
        case ValueIsOneOf(acceptedType,offeredTypeList):
          DroppableWasDropped    = true
          currentDropOperation   = wantedOperation
          currentTypeTransferred = acceptedType
          currentDataTransferred = offeredData[acceptedType]
          break
        default:               // handler should return false in case of failure
          DroppableWasDropped     = false
          currentDropZoneEntity   = undefined
          currentDropZonePosition = undefined
          currentDropOperation    = undefined
          currentTypeTransferred  = undefined
          currentDataTransferred  = undefined

//        invokeHandler('onDroppableLeave', Options, currentDroppableEntity, Element)
      }

      Element.classList.remove('hovered')
    }

  /**** updateDropZoneOptions ****/

    function updateDropZoneOptions (Options:any):void {
      Options = parsedDropZoneOptions(Options)

      if (Options.Entity != null) {
        currentDropZoneOptions.Entity = Options.Entity
      }

      if (ObjectIsNotEmpty(Options.TypesToAccept)) {
        currentDropZoneOptions.TypesToAccept = Options.TypesToAccept
      }

      if (Options.HoldDelay != null) {
        currentDropZoneOptions.HoldDelay = Options.HoldDelay
      }
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
    }
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


