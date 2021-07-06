import { allowedPlainObject, throwError, ValueIsNonEmptyString, allowedNonEmptyString, ValueIsFunction, allowedFiniteNumber, ValueIsPlainObject, ValueIsFiniteNumber, allowedFunction, constrained, ValueIsString, ObjectIsNotEmpty, allowPlainObject, quoted, allowedIntegerInRange, ValueIsOneOf, allowedString, allowListSatisfying } from 'javascript-interface-library';
import Conversion from 'svelte-coordinate-conversion';

//----------------------------------------------------------------------------//
/**** parsedDraggableOptions ****/
function parsedDraggableOptions(Options) {
    Options = allowedPlainObject('drag options', Options) || {};
    var Extras, relativeTo;
    var onlyFrom, neverFrom;
    var Dummy, DummyOffsetX, DummyOffsetY;
    var minX, minY, maxX, maxY;
    var onDragStart, onDragMove, onDragEnd, onDragCancel;
    Extras = Options.Extras;
    switch (true) {
        case (Options.relativeTo == null):
            relativeTo = 'parent';
            break;
        case (Options.relativeTo === 'parent'):
        case (Options.relativeTo === 'body'):
        case ValueIsNonEmptyString(Options.relativeTo):
        case (Options.relativeTo instanceof HTMLElement):
        case (Options.relativeTo instanceof SVGElement):
            //    case (Options.relativeTo instanceof MathMLElement):
            relativeTo = Options.relativeTo;
            break;
        default: throwError('InvalidArgument: invalid position reference given');
    }
    onlyFrom = allowedNonEmptyString('"onlyFrom" CSS selector', Options.onlyFrom);
    neverFrom = allowedNonEmptyString('"neverFrom" CSS selector', Options.neverFrom);
    switch (true) {
        case (Options.Dummy == null):
            Dummy = undefined;
            break;
        case (Options.Dummy === 'standard'):
        case (Options.Dummy === 'none'):
        case ValueIsNonEmptyString(Options.Dummy):
        case (Options.Dummy instanceof HTMLElement):
        case (Options.Dummy instanceof SVGElement):
        //    case (Options.Dummy instanceof MathMLElement):
        case ValueIsFunction(Options.Dummy):
            Dummy = Options.Dummy;
            break;
        default: throwError('InvalidArgument: invalid drag dummy specification given');
    }
    DummyOffsetX = allowedFiniteNumber('dummy x offset', Options.DummyOffsetX);
    DummyOffsetY = allowedFiniteNumber('dummy y offset', Options.DummyOffsetY);
    minX = allowedFiniteNumber('min. x position', Options.minX);
    if (minX == null) {
        minX = -Infinity;
    }
    minY = allowedFiniteNumber('min. y position', Options.minY);
    if (minY == null) {
        minY = -Infinity;
    }
    maxX = allowedFiniteNumber('max. x position', Options.maxX);
    if (maxX == null) {
        maxX = Infinity;
    }
    maxY = allowedFiniteNumber('max. y position', Options.maxY);
    if (maxY == null) {
        maxY = Infinity;
    }
    if (ValueIsPosition(Options.onDragStart)) {
        var _a = Options.onDragStart, x_1 = _a.x, y_1 = _a.y;
        onDragStart = function () { return ({ x: x_1, y: y_1 }); };
    }
    else {
        onDragStart = allowedFunction('"onDragStart" handler', Options.onDragStart);
    }
    onDragMove = allowedFunction('"onDragMove" handler', Options.onDragMove);
    onDragEnd = allowedFunction('"onDragEnd" handler', Options.onDragEnd);
    return {
        Extras: Extras,
        relativeTo: relativeTo,
        onlyFrom: onlyFrom,
        neverFrom: neverFrom,
        Dummy: Dummy,
        DummyOffsetX: DummyOffsetX,
        DummyOffsetY: DummyOffsetY,
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        // @ts-ignore we cannot validate given functions any further
        onDragStart: onDragStart,
        onDragMove: onDragMove,
        onDragEnd: onDragEnd,
        onDragCancel: onDragCancel
    };
}
/**** use:asDraggable={options} ****/
function asDraggable(Element, Options) {
    var isDragged;
    var currentDraggableOptions;
    var PositionReference; // element with user coordinate system
    var ReferenceDeltaX, ReferenceDeltaY; // mouse -> user coord.s
    var PositioningWasDelayed; // workaround for prob. with "drag" events
    var DragImage;
    var initialPosition; // given in user coordinates
    var lastPosition; // dto.
    isDragged = false;
    currentDraggableOptions = parsedDraggableOptions(Options);
    /**** startDragging ****/
    function startDragging(originalEvent) {
        var Options = currentDraggableOptions;
        if (fromForbiddenElement(Element, Options, originalEvent)) {
            originalEvent.stopPropagation();
            originalEvent.preventDefault();
            return false;
        }
        PositionReference = PositionReferenceFor(Element, Options);
        var relativePosition = Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
        ReferenceDeltaX = ReferenceDeltaY = 0;
        initialPosition = { x: 0, y: 0 };
        if (Options.onDragStart == null) {
            initialPosition = { x: 0, y: 0 }; // given in user coordinates
        }
        else {
            try {
                var StartPosition = Options.onDragStart(Options.Extras);
                if (ValueIsPlainObject(StartPosition)) {
                    var x = allowedFiniteNumber('x start position', StartPosition.x);
                    var y = allowedFiniteNumber('y start position', StartPosition.y);
                    ReferenceDeltaX = x - relativePosition.left;
                    ReferenceDeltaY = y - relativePosition.top;
                    x = constrained(x, Options.minX, Options.maxX);
                    y = constrained(y, Options.minY, Options.maxY);
                    initialPosition = { x: x, y: y }; // given in user coordinates
                }
            }
            catch (Signal) {
                console.error('"onDragStart" handler failed', Signal);
            }
        }
        lastPosition = initialPosition;
        PositioningWasDelayed = false; // initializes workaround
        if (Options.Dummy == null) {
            Options.Dummy = 'none'; // this is the default for "use.asDraggable"
        }
        DragImage = DragImageFor(Element, Options);
        if ((DragImage != null) && (originalEvent.dataTransfer != null)) {
            var OffsetX = Options.DummyOffsetX;
            var OffsetY = Options.DummyOffsetY;
            if ((OffsetX == null) || (OffsetY == null)) {
                var PositionInDraggable = Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element);
                if (OffsetX == null) {
                    OffsetX = PositionInDraggable.left;
                }
                if (OffsetY == null) {
                    OffsetY = PositionInDraggable.top;
                }
            }
            switch (true) {
                case (Options.Dummy === 'none'):
                    originalEvent.dataTransfer.setDragImage(DragImage, 0, 0);
                    setTimeout(function () {
                        document.body.removeChild(DragImage);
                    }, 0);
                    break;
                case ValueIsString(Options.Dummy):
                    originalEvent.dataTransfer.setDragImage(DragImage, OffsetX, OffsetY);
                    setTimeout(function () {
                        document.body.removeChild(DragImage.parentElement);
                    }, 0);
                    break;
                default:
                    originalEvent.dataTransfer.setDragImage(DragImage, OffsetX, OffsetY);
            }
        }
        if (originalEvent.dataTransfer != null) {
            originalEvent.dataTransfer.effectAllowed = 'none';
        }
        isDragged = true;
        setTimeout(function () { return Element.classList.add('dragged'); }, 0);
        originalEvent.stopPropagation();
    }
    /**** continueDragging ****/
    function continueDragging(originalEvent) {
        if (!isDragged) {
            return false;
        }
        var Options = currentDraggableOptions;
        if ((originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
            !PositioningWasDelayed) {
            PositioningWasDelayed = true; // last "drag" event contains wrong coord.s
        }
        else {
            PositioningWasDelayed = false;
            var relativePosition = Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
            var x = relativePosition.left + ReferenceDeltaX; // in user coordinates
            var y = relativePosition.top + ReferenceDeltaY;
            x = constrained(x, Options.minX, Options.maxX);
            y = constrained(y, Options.minY, Options.maxY);
            var dx = x - lastPosition.x; // calculated AFTER constraining x,y
            var dy = y - lastPosition.y; // dto.
            lastPosition = { x: x, y: y };
            invokeHandler('onDragMove', Options, x, y, dx, dy, Options.Extras);
        }
        originalEvent.stopPropagation();
    }
    /**** finishDragging ****/
    function finishDragging(originalEvent) {
        if (!isDragged) {
            return false;
        }
        //    continueDragging(originalEvent)           // NO! positions might be wrong!
        var Options = currentDraggableOptions;
        if (Options.onDragEnd != null) {
            var x = constrained(lastPosition.x, Options.minX, Options.maxX);
            var y = constrained(lastPosition.y, Options.minY, Options.maxY);
            var dx = x - lastPosition.x;
            var dy = y - lastPosition.y;
            invokeHandler('onDragEnd', Options, x, y, dx, dy, Options.Extras);
        }
        isDragged = false;
        Element.classList.remove('dragged');
        originalEvent.stopPropagation();
    }
    /**** updateDraggableOptions ****/
    function updateDraggableOptions(Options) {
        Options = parsedDraggableOptions(Options);
        //    currentDraggableOptions.Extras = Options.Extras // Extras are kept constant
        currentDraggableOptions.Dummy = (Options.Dummy || currentDraggableOptions.Dummy);
        currentDraggableOptions.minX = Options.minX;
        currentDraggableOptions.minY = Options.minY;
        currentDraggableOptions.maxX = Options.maxX;
        currentDraggableOptions.maxY = Options.maxY;
        currentDraggableOptions.onDragStart = (Options.onDragStart || currentDraggableOptions.onDragStart); // may be used to update initial position for subsequent drags
    }
    Element.setAttribute('draggable', 'true');
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragstart', startDragging);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('drag', continueDragging);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragend', finishDragging);
    return { update: updateDraggableOptions };
}
/**** fromForbiddenElement ****/
function fromForbiddenElement(Element, Options, originalEvent) {
    if ((Options.onlyFrom != null) || (Options.neverFrom != null)) {
        var x = originalEvent.clientX;
        var y = originalEvent.clientY;
        var touchedElement = document.elementFromPoint(x, y);
        //    elementFromPoint considers elements with "pointer-events" <> "none" only
        //    but sometimes, "pointer-events:none" is needed for proper operation
        touchedElement = innerElementOf(touchedElement, x, y);
        if (Options.onlyFrom != null) {
            var fromElement = touchedElement.closest(Options.onlyFrom);
            if ((Element !== fromElement) && !Element.contains(fromElement)) {
                return true;
            }
        }
        if (Options.neverFrom != null) {
            var fromElement = touchedElement.closest(Options.neverFrom);
            if ((Element === fromElement) || Element.contains(fromElement)) {
                return true;
            }
        }
    }
    return false;
}
/**** innerElementOf ****/
function innerElementOf(Candidate, x, y) {
    var innerElements = Candidate.children;
    for (var i = 0, l = innerElements.length; i < l; i++) {
        var innerElement = innerElements[i];
        var Position = Conversion.fromLocalTo('viewport', { left: 0, top: 0 }, innerElement);
        if ((x < Position.left) || (y < Position.top)) {
            continue;
        }
        if (x > Position.left + innerElement.offsetWidth - 1) {
            continue;
        }
        if (y > Position.top + innerElement.offsetHeight - 1) {
            continue;
        }
        return innerElementOf(innerElement, x, y);
    }
    return Candidate; // this is the innermost element at (x,y)
}
/**** extended Drag-and-Drop Support ****/
var currentDroppableExtras; // extras for currently dragged droppable
var currentDropZoneExtras; // extras for currently hovered drop zone
var currentDropZoneElement; // dto. as Element
var DroppableWasDropped; // indicates a successful drop operation
var currentDropZonePosition; // position relative to DropZone
var currentDropOperation; // actual drop operation
var currentTypeTransferred; // actual type of transferred data
var currentDataTransferred; // actual data transferred
//-------------------------------------------------------------------------------
//--               use:asDroppable={options} - "drag" and "drop"               --
//-------------------------------------------------------------------------------
var DropOperations = ['copy', 'move', 'link'];
/**** parsedDroppableOptions ****/
function parsedDroppableOptions(Options) {
    Options = allowedPlainObject('drop options', Options) || {};
    var Operations, DataToOffer;
    var onDropZoneEnter, onDropZoneHover, onDropZoneLeave;
    var onDropped;
    Operations = parsedOperations('list of allowed operations', Options.Operations, 'copy');
    DataToOffer = Object.assign({}, allowedPlainObject('data to be offered', Options.DataToOffer));
    if ('none' in DataToOffer)
        throwError('InvalidArgument: "none" is not a valid data type');
    onDropZoneEnter = allowedFunction('"onDropZoneEnter" handler', Options.onDropZoneEnter);
    onDropZoneHover = allowedFunction('"onDropZoneHover" handler', Options.onDropZoneHover);
    onDropZoneLeave = allowedFunction('"onDropZoneLeave" handler', Options.onDropZoneLeave);
    onDropped = allowedFunction('"onDropped" handler', Options.onDropped);
    return {
        Operations: Operations,
        DataToOffer: DataToOffer,
        // @ts-ignore we cannot validate given functions any further
        onDropZoneEnter: onDropZoneEnter,
        onDropZoneHover: onDropZoneHover,
        onDropZoneLeave: onDropZoneLeave,
        onDropped: onDropped
    };
}
/**** use:asDroppable={options} ****/
function asDroppable(Element, Options) {
    var isDragged;
    var currentDraggableOptions;
    var currentDroppableOptions;
    var PositionReference; // element with user coordinate system
    var ReferenceDeltaX, ReferenceDeltaY; // mouse -> user coord.s
    var PositioningWasDelayed; // workaround for prob. with "drag" events
    var DragImage;
    var initialPosition; // given in user coordinates
    var lastPosition; // dto.
    var lastDropZoneElement;
    var lastDropZoneExtras;
    isDragged = false;
    currentDraggableOptions = parsedDraggableOptions(Options);
    currentDroppableOptions = parsedDroppableOptions(Options);
    /**** startDragging ****/
    function startDragging(originalEvent) {
        var Options = Object.assign({}, currentDraggableOptions, currentDroppableOptions);
        if (fromForbiddenElement(Element, Options, originalEvent)) {
            originalEvent.stopPropagation();
            originalEvent.preventDefault();
            return false;
        }
        PositionReference = PositionReferenceFor(Element, Options);
        var relativePosition = Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
        ReferenceDeltaX = ReferenceDeltaY = 0;
        initialPosition = { x: 0, y: 0 };
        if (Options.onDragStart == null) {
            initialPosition = { x: 0, y: 0 }; // given in user coordinates
        }
        else {
            try {
                var StartPosition = Options.onDragStart(Options.Extras);
                if (ValueIsPlainObject(StartPosition)) {
                    var x = allowedFiniteNumber('x start position', StartPosition.x);
                    var y = allowedFiniteNumber('y start position', StartPosition.y);
                    ReferenceDeltaX = x - relativePosition.left;
                    ReferenceDeltaY = y - relativePosition.top;
                    x = constrained(x, Options.minX, Options.maxX);
                    y = constrained(y, Options.minY, Options.maxY);
                    initialPosition = { x: x, y: y }; // given in user coordinates
                }
            }
            catch (Signal) {
                console.error('"onDragStart" handler failed', Signal);
            }
        }
        lastPosition = initialPosition;
        lastDropZoneElement = undefined;
        lastDropZoneExtras = undefined;
        PositioningWasDelayed = false; // initializes workaround
        if (Options.Dummy == null) {
            Options.Dummy = 'standard'; // this is the default for "use.asDroppable"
        }
        DragImage = DragImageFor(Element, Options);
        if ((DragImage != null) && (originalEvent.dataTransfer != null)) {
            var OffsetX = Options.DummyOffsetX;
            var OffsetY = Options.DummyOffsetY;
            if ((OffsetX == null) || (OffsetY == null)) {
                var PositionInDraggable = Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element);
                if (OffsetX == null) {
                    OffsetX = PositionInDraggable.left;
                }
                if (OffsetY == null) {
                    OffsetY = PositionInDraggable.top;
                }
            }
            switch (true) {
                case (Options.Dummy === 'none'):
                    originalEvent.dataTransfer.setDragImage(DragImage, 0, 0);
                    setTimeout(function () {
                        document.body.removeChild(DragImage);
                    }, 0);
                    break;
                case ValueIsString(Options.Dummy):
                    originalEvent.dataTransfer.setDragImage(DragImage, OffsetX, OffsetY);
                    setTimeout(function () {
                        document.body.removeChild(DragImage.parentElement);
                    }, 0);
                    break;
                default:
                    originalEvent.dataTransfer.setDragImage(DragImage, OffsetX, OffsetY);
            }
        }
        if (originalEvent.dataTransfer != null) {
            var allowedEffects = allowedEffectsFrom(Options.Operations);
            originalEvent.dataTransfer.effectAllowed = allowedEffects;
            if (ObjectIsNotEmpty(Options.DataToOffer)) {
                for (var Type in Options.DataToOffer) {
                    if (Options.DataToOffer.hasOwnProperty(Type)) {
                        originalEvent.dataTransfer.setData(Type, Options.DataToOffer[Type]);
                    }
                }
            }
        }
        currentDroppableExtras = Options.Extras;
        currentDropZoneExtras = undefined;
        currentDropZonePosition = undefined;
        DroppableWasDropped = false;
        currentDropOperation = undefined;
        currentTypeTransferred = undefined;
        currentDataTransferred = undefined;
        isDragged = true;
        setTimeout(function () { return Element.classList.add('dragged'); }, 0);
        originalEvent.stopPropagation();
    }
    /**** continueDragging ****/
    function continueDragging(originalEvent) {
        if (!isDragged) {
            return false;
        }
        var Options = Object.assign({}, currentDraggableOptions, currentDroppableOptions);
        if ((originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
            !PositioningWasDelayed) {
            PositioningWasDelayed = true; // last "drag" event contains wrong coord.s
        }
        else {
            PositioningWasDelayed = false;
            var relativePosition = Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
            var x = relativePosition.left + ReferenceDeltaX; // in user coordinates
            var y = relativePosition.top + ReferenceDeltaY;
            x = constrained(x, Options.minX, Options.maxX);
            y = constrained(y, Options.minY, Options.maxY);
            var dx = x - lastPosition.x; // calculated AFTER constraining x,y
            var dy = y - lastPosition.y; // dto.
            lastPosition = { x: x, y: y };
            invokeHandler('onDragMove', Options, x, y, dx, dy, Options.Extras);
        }
        if (currentDropZoneElement === lastDropZoneElement) {
            if (currentDropZoneElement != null) {
                invokeHandler('onDropZoneHover', Options, currentDropZonePosition.x, currentDropZonePosition.y, currentDropZoneExtras, Options.Extras);
            }
        }
        else {
            if (currentDropZoneElement == null) {
                Element.classList.remove('droppable');
                invokeHandler('onDropZoneLeave', Options, lastDropZoneExtras, Options.Extras);
            }
            else {
                Element.classList.add('droppable');
                invokeHandler('onDropZoneEnter', Options, currentDropZonePosition.x, currentDropZonePosition.y, lastDropZoneExtras, Options.Extras);
            }
            lastDropZoneElement = currentDropZoneElement;
            lastDropZoneExtras = currentDropZoneExtras;
        }
        originalEvent.stopPropagation();
    }
    /**** finishDragging ****/
    function finishDragging(originalEvent) {
        if (!isDragged) {
            return false;
        }
        //    continueDragging(originalEvent)           // NO! positions might be wrong!
        var Options = Object.assign({}, currentDraggableOptions, currentDroppableOptions);
        if (DroppableWasDropped) {
            invokeHandler('onDropped', Options, currentDropZonePosition.x, currentDropZonePosition.y, currentDropOperation, currentTypeTransferred, currentDataTransferred, currentDropZoneExtras, Options.Extras);
            currentDropZoneExtras = undefined;
            currentDropZonePosition = undefined;
            DroppableWasDropped = false;
            currentDropOperation = undefined;
            currentTypeTransferred = undefined;
            currentDataTransferred = undefined;
        }
        if (Options.onDragEnd != null) {
            var x = constrained(lastPosition.x, Options.minX, Options.maxX);
            var y = constrained(lastPosition.y, Options.minY, Options.maxY);
            var dx = x - lastPosition.x;
            var dy = y - lastPosition.y;
            invokeHandler('onDragEnd', Options, x, y, dx, dy, Options.Extras);
        }
        currentDroppableExtras = undefined;
        isDragged = false;
        Element.classList.remove('dragged', 'droppable');
        originalEvent.stopPropagation();
    }
    /**** updateDraggableOptions ****/
    function updateDraggableOptions(Options) {
        Options = parsedDraggableOptions(Options);
        //    currentDraggableOptions.Extras = Options.Extras // Extras are kept constant
        currentDraggableOptions.Dummy = (Options.Dummy || currentDraggableOptions.Dummy);
        currentDraggableOptions.minX = Options.minX;
        currentDraggableOptions.minY = Options.minY;
        currentDraggableOptions.maxX = Options.maxX;
        currentDraggableOptions.maxY = Options.maxY;
        currentDraggableOptions.onDragStart = (Options.onDragStart || currentDraggableOptions.onDragStart); // may be used to update initial position for subsequent drags
    }
    /**** updateDroppableOptions ****/
    function updateDroppableOptions(Options) {
        Options = parsedDroppableOptions(Options);
        currentDroppableOptions.Operations = Options.Operations;
        currentDroppableOptions.DataToOffer = Options.DataToOffer;
    }
    Element.setAttribute('draggable', 'true');
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragstart', startDragging);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('drag', continueDragging);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragend', finishDragging);
    return {
        update: function (Options) {
            updateDraggableOptions(Options);
            updateDroppableOptions(Options);
        }
    };
}
/**** parsedDropZoneOptions ****/
function parsedDropZoneOptions(Options) {
    Options = allowedPlainObject('drop zone options', Options) || {};
    var Extras, TypesToAccept, HoldDelay;
    var onDroppableEnter, onDroppableMove, onDroppableLeave;
    var onDroppableHold, onDroppableRelease, onDrop;
    Extras = Options.Extras;
    allowPlainObject('data types to be accepted', Options.TypesToAccept);
    TypesToAccept = Object.create(null);
    if ((Options.TypesToAccept != null) && ('none' in Options.TypesToAccept))
        throwError('InvalidArgument: "none" is not a valid data type');
    for (var Type in Options.TypesToAccept) {
        if (Options.TypesToAccept.hasOwnProperty(Type)) {
            TypesToAccept[Type] = parsedOperations('list of accepted operations for type ' + quoted(Type), Options.TypesToAccept[Type]);
        }
    }
    HoldDelay = allowedIntegerInRange('min. time to hold', Options.HoldDelay, 0);
    onDroppableEnter = allowedFunction('"onDroppableEnter" handler', Options.onDroppableEnter);
    onDroppableMove = allowedFunction('"onDroppableMove" handler', Options.onDroppableMove);
    onDroppableLeave = allowedFunction('"onDroppableLeave" handler', Options.onDroppableLeave);
    onDroppableHold = allowedFunction('"onDroppableHold" handler', Options.onDroppableHold);
    onDroppableRelease = allowedFunction('"onDroppableRelease" handler', Options.onDroppableRelease);
    onDrop = allowedFunction('"onDrop" handler', Options.onDrop);
    return {
        Extras: Extras,
        TypesToAccept: TypesToAccept,
        HoldDelay: HoldDelay,
        // @ts-ignore we cannot validate given functions any further
        onDroppableEnter: onDroppableEnter,
        onDroppableMove: onDroppableMove,
        onDroppableLeave: onDroppableLeave,
        // @ts-ignore we cannot validate given functions any further
        onDroppableHold: onDroppableHold,
        onDroppableRelease: onDroppableRelease,
        onDrop: onDrop
    };
}
/**** use:asDropZone={options} ****/
function asDropZone(Element, Options) {
    var currentDropZoneOptions;
    currentDropZoneOptions = parsedDropZoneOptions(Options);
    /**** enteredByDroppable ****/
    function enteredByDroppable(originalEvent) {
        if ((originalEvent.dataTransfer == null) ||
            (originalEvent.dataTransfer.effectAllowed === 'none')) {
            return;
        }
        var Options = currentDropZoneOptions;
        var wantedOperation = originalEvent.dataTransfer.dropEffect;
        if (wantedOperation === 'none') { // workaround for browser bug
            switch (originalEvent.dataTransfer.effectAllowed) {
                case 'copy':
                case 'move':
                case 'link':
                    wantedOperation = originalEvent.dataTransfer.effectAllowed;
                    break;
                default:
                    wantedOperation = undefined;
            }
        }
        var TypesToAccept = Options.TypesToAccept;
        var offeredTypeList = originalEvent.dataTransfer.types.filter(function (Type) {
            return (Type in TypesToAccept) &&
                (TypesToAccept[Type] !== '');
        } // "getData" is not available here
        ); // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
        if (offeredTypeList.length === 0) {
            return;
        }
        var DropZonePosition = asPosition(Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element)); // relative to DropZone element
        var accepted = ResultOfHandler('onDroppableEnter', Options, DropZonePosition.x, DropZonePosition.y, wantedOperation, offeredTypeList, currentDroppableExtras, Options.Extras);
        if (accepted === false) { // i.e. explicit "false" result required
            return;
        }
        else {
            currentDropZoneExtras = Options.Extras;
            currentDropZoneElement = Element;
            currentDropZonePosition = DropZonePosition;
            Element.classList.add('hovered');
            originalEvent.preventDefault();
            originalEvent.stopPropagation();
        }
    }
    /**** hoveredByDroppable ****/
    function hoveredByDroppable(originalEvent) {
        if ((originalEvent.dataTransfer == null) ||
            (originalEvent.dataTransfer.effectAllowed === 'none') ||
            (currentDropZoneElement != null) && (currentDropZoneElement !== Element)) {
            Element.classList.remove('hovered');
            return;
        }
        // in some browsers, it may be that (currentDropZone !== Element)!
        var Options = currentDropZoneOptions;
        var wantedOperation = originalEvent.dataTransfer.dropEffect;
        if (wantedOperation === 'none') { // workaround for browser bug
            switch (originalEvent.dataTransfer.effectAllowed) {
                case 'copy':
                case 'move':
                case 'link':
                    wantedOperation = originalEvent.dataTransfer.effectAllowed;
                    break;
                default:
                    wantedOperation = undefined;
            }
        }
        var TypesToAccept = Options.TypesToAccept;
        var offeredTypeList = originalEvent.dataTransfer.types.filter(function (Type) {
            return (Type in TypesToAccept) &&
                (TypesToAccept[Type] !== '');
        } // "getData" is not available here
        ); // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
        if (offeredTypeList.length === 0) {
            if (currentDropZoneElement === Element) {
                currentDropZoneExtras = undefined;
                currentDropZoneElement = undefined;
                currentDropZonePosition = undefined;
            }
            Element.classList.remove('hovered');
            return;
        }
        currentDropZonePosition = asPosition(Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element)); // relative to DropZone element
        var accepted = ResultOfHandler('onDroppableMove', Options, currentDropZonePosition.x, currentDropZonePosition.y, wantedOperation, offeredTypeList, currentDroppableExtras, Options.Extras);
        if (accepted === false) { // i.e. explicit "false" result required
            currentDropZoneExtras = undefined;
            currentDropZoneElement = undefined;
            currentDropZonePosition = undefined;
            Element.classList.remove('hovered');
        }
        else { // warning: sometimes (currentDropZone !== Element)!
            currentDropZoneExtras = Options.Extras;
            currentDropZoneElement = Element;
            //      currentDropZonePosition has already been set before
            Element.classList.add('hovered');
            originalEvent.preventDefault(); // never allow default action!
            //      originalEvent.stopPropagation()
            return false; // special return value when drop seems acceptable
        }
    }
    /**** leftByDroppable ****/
    function leftByDroppable(originalEvent) {
        Element.classList.remove('hovered');
        var Options = currentDropZoneOptions;
        if (currentDropZoneElement === Element) {
            if (currentTypeTransferred == null) { // see explanation below
                currentDropZoneExtras = undefined;
                currentDropZoneElement = undefined;
                DroppableWasDropped = false;
                currentDropZonePosition = undefined;
                currentTypeTransferred = undefined;
                currentDataTransferred = undefined;
                invokeHandler('onDroppableLeave', Options, currentDroppableExtras, Options.Extras);
            } // swallow "dragleave" right after successful "drop"
            originalEvent.preventDefault();
            originalEvent.stopPropagation();
        }
    }
    /**** droppedByDroppable ****/
    function droppedByDroppable(originalEvent) {
        Element.classList.remove('hovered');
        if ((originalEvent.dataTransfer == null) ||
            (originalEvent.dataTransfer.effectAllowed === 'none') ||
            (currentDropZoneElement !== Element)) {
            return;
        }
        //    originalEvent.preventDefault()
        originalEvent.stopPropagation();
        var Options = currentDropZoneOptions;
        var wantedOperation = originalEvent.dataTransfer.dropEffect;
        if (wantedOperation === 'none') { // workaround for browser bug
            switch (originalEvent.dataTransfer.effectAllowed) {
                case 'copy':
                case 'move':
                case 'link':
                    wantedOperation = originalEvent.dataTransfer.effectAllowed;
                    break;
                default:
                    wantedOperation = undefined;
            }
        }
        var TypesToAccept = Options.TypesToAccept;
        var offeredTypeList = originalEvent.dataTransfer.types.filter(function (Type) {
            return (Type in TypesToAccept) && ((wantedOperation == null) ||
                (TypesToAccept[Type].indexOf(wantedOperation) >= 0));
        }); // cannot use "originalEvent.dataTransfer.dropEffect" due to browser bug
        if (offeredTypeList.length === 0) {
            currentDropZoneExtras = undefined;
            currentDropZonePosition = undefined;
            DroppableWasDropped = false;
            currentDropOperation = undefined;
            currentTypeTransferred = undefined;
            currentDataTransferred = undefined;
            invokeHandler('onDroppableLeave', Options, currentDroppableExtras, Options.Extras);
            return;
        }
        currentDropZonePosition = asPosition(Conversion.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element)); // relative to DropZone element
        var offeredData = {};
        offeredTypeList.forEach(
        // @ts-ignore originalEvent.dataTransfer definitely exists
        function (Type) { return offeredData[Type] = originalEvent.dataTransfer.getData(Type); });
        var acceptedType = ResultOfHandler('onDrop', Options, currentDropZonePosition.x, currentDropZonePosition.y, wantedOperation, offeredData, currentDroppableExtras, Options.Extras);
        switch (true) {
            case (acceptedType == null):
                DroppableWasDropped = true;
                currentDropOperation = wantedOperation;
                currentTypeTransferred = undefined;
                currentDataTransferred = undefined;
                break;
            case ValueIsOneOf(acceptedType, offeredTypeList):
                DroppableWasDropped = true;
                currentDropOperation = wantedOperation;
                currentTypeTransferred = acceptedType;
                currentDataTransferred = offeredData[acceptedType];
                break;
            default: // handler should return false in case of failure
                DroppableWasDropped = false;
                currentDropZoneExtras = undefined;
                currentDropZonePosition = undefined;
                currentDropOperation = undefined;
                currentTypeTransferred = undefined;
                currentDataTransferred = undefined;
            //        invokeHandler('onDroppableLeave', Options, currentDroppableExtras, Options.Extras)
        }
        currentDropZoneElement = undefined;
    }
    /**** updateDropZoneOptions ****/
    function updateDropZoneOptions(Options) {
        Options = parsedDropZoneOptions(Options);
        if (Options.Extras != null) {
            currentDropZoneOptions.Extras = Options.Extras;
        }
        if (ObjectIsNotEmpty(Options.TypesToAccept)) {
            currentDropZoneOptions.TypesToAccept = Options.TypesToAccept;
        }
        if (Options.HoldDelay != null) {
            currentDropZoneOptions.HoldDelay = Options.HoldDelay;
        }
    }
    Element.setAttribute('draggable', 'true');
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragenter', enteredByDroppable);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragover', hoveredByDroppable);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('dragleave', leftByDroppable);
    // @ts-ignore we know that the passed event is a DragEvent
    Element.addEventListener('drop', droppedByDroppable);
    return { update: updateDropZoneOptions };
}
/**** ValueIsPosition ****/
function ValueIsPosition(Candidate) {
    return (ValueIsPlainObject(Candidate) &&
        ValueIsFiniteNumber(Candidate.x) && ValueIsFiniteNumber(Candidate.y));
}
/**** asPosition ****/
function asPosition(Value) {
    return { x: Value.left, y: Value.top };
}
/**** PositionReferenceFor ****/
function PositionReferenceFor(Element, Options) {
    var PositionReference;
    switch (true) {
        case (Options.relativeTo === 'parent'):
            PositionReference = Element.parentElement;
            break;
        case (Options.relativeTo === 'body'):
            PositionReference = document.body;
            break;
        case (Options.relativeTo instanceof HTMLElement):
        case (Options.relativeTo instanceof SVGElement):
            //    case (Options.relativeTo instanceof MathMLElement):
            PositionReference = Options.relativeTo;
            if ((PositionReference != document.body) &&
                !document.body.contains(PositionReference))
                throwError('InvalidArgument: the HTML element given as "relativeTo" option ' +
                    'is not part of this HTML document');
            break;
        default: // CSS selector
            PositionReference = Element.closest(Options.relativeTo);
    }
    return (PositionReference == null ? document.body : PositionReference);
}
/**** DragImageFor ****/
function DragImageFor(Element, Options) {
    switch (true) {
        case (Options.Dummy === 'standard'):
            return undefined;
        case (Options.Dummy === 'none'):
            var invisibleDragImage = document.createElement('div');
            invisibleDragImage.setAttribute('style', 'display:block; position:absolute; width:1px; height:1px; ' +
                'background:transparent; border:none; margin:0px; padding:0px; ' +
                'cursor:auto');
            document.body.appendChild(invisibleDragImage);
            return invisibleDragImage;
        case ValueIsNonEmptyString(Options.Dummy): // may flicker shortly
            var auxiliaryElement = document.createElement('div');
            auxiliaryElement.style.display = 'block';
            auxiliaryElement.style.position = 'absolute';
            auxiliaryElement.style.left = (document.body.scrollWidth + 100) + 'px';
            document.body.appendChild(auxiliaryElement);
            auxiliaryElement.innerHTML = Options.Dummy;
            return auxiliaryElement.children[0];
        case (Options.Dummy instanceof HTMLElement):
        case (Options.Dummy instanceof SVGElement):
            //    case (Options.Dummy instanceof MathMLElement):
            return Options.Dummy;
        case ValueIsFunction(Options.Dummy):
            var Candidate = undefined;
            try {
                Candidate = Options.Dummy(Options.Extras, Element);
            }
            catch (Signal) {
                console.error('RuntimeError: creating draggable dummy failed', Signal);
            }
            if (Candidate != null) {
                if ((Candidate instanceof HTMLElement) || (Candidate instanceof SVGElement)) {
                    return Candidate;
                }
                else {
                    console.error('InvalidArgument: the newly created draggable dummy is ' +
                        'neither an HTML nor an SVG element');
                }
            }
    }
}
/**** parsedOperations ****/
function parsedOperations(Description, Argument, Default) {
    if (Default === void 0) { Default = 'copy move link'; }
    var Operations = allowedString(Description, Argument) || Default;
    switch (Operations.trim()) {
        case 'all': return 'copy move link';
        case 'none': return '';
    }
    var OperationList = Operations.trim().replace(/\s+/g, ' ').split(' ');
    allowListSatisfying(Description, OperationList, function (Operation) { return ValueIsOneOf(Operation, DropOperations); });
    return OperationList.reduce(function (Result, Operation) { return (Result.indexOf(Operation) < 0 ? Result + Operation + ' ' : Result); }, ' ');
}
function allowedEffectsFrom(Operations) {
    var EffectIndex = ( // Horner's method
    (Operations.indexOf('move') < 0 ? 0 : 1) * 2 +
        (Operations.indexOf('link') < 0 ? 0 : 1)) * 2 +
        (Operations.indexOf('copy') < 0 ? 0 : 1);
    return [
        'none', 'copy', 'link', 'copyLink', 'move', 'copyMove', 'linkMove', 'all'
    ][EffectIndex];
}
/**** invokeHandler ****/
function invokeHandler(Name, Options) {
    var Arguments = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        Arguments[_i - 2] = arguments[_i];
    }
    if (Options[Name] != null) {
        try {
            return Options[Name].apply(null, Arguments);
        }
        catch (Signal) {
            console.error(quoted(Name) + ' handler failed', Signal);
        }
    }
}
var ResultOfHandler = invokeHandler;

export { DropOperations, asDraggable, asDropZone, asDroppable };
//# sourceMappingURL=svelte-drag-and-drop-actions.esm.js.map
