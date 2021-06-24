//----------------------------------------------------------------------------//
// see https://stackoverflow.com/questions/3277182/how-to-get-the-global-object-in-javascript
//------------------------------------------------------------------------------
//--                             Object Functions                             --
//------------------------------------------------------------------------------
// allow methods from Object.prototype to be applied to "vanilla" objects
/**** Object_hasOwnProperty ****/
function Object_hasOwnProperty(Value, PropertyName) {
    return ((Value == null) || // let this method crash like its original
        ('hasOwnProperty' in Value) && (typeof Value.hasOwnProperty === 'function')
        ? Value.hasOwnProperty(PropertyName)
        : Object.prototype.hasOwnProperty.call(Value, PropertyName));
}
/**** throwError - simplifies construction of named errors ****/
function throwError(Message) {
    var Match = /^([$a-zA-Z][$a-zA-Z0-9]*):\s*(\S.+)\s*$/.exec(Message);
    if (Match == null) {
        throw new Error(Message);
    }
    else {
        var namedError = new Error(Match[2]);
        namedError.name = Match[1];
        throw namedError;
    }
}
/**** ValueIsFiniteNumber (pure "isFinite" breaks on objects) ****/
function ValueIsFiniteNumber(Value) {
    return ((typeof Value === 'number') || (Value instanceof Number)) && isFinite(Value.valueOf());
}
/**** ValueIsInteger ****/
function ValueIsInteger(Value) {
    if ((typeof Value !== 'number') && !(Value instanceof Number)) {
        return false;
    }
    Value = Value.valueOf();
    return isFinite(Value) && (Math.round(Value) === Value);
}
/**** ValueIsString ****/
function ValueIsString(Value) {
    return (typeof Value === 'string') || (Value instanceof String);
}
/**** ValueIsNonEmptyString ****/
var emptyStringPattern = /^\s*$/;
function ValueIsNonEmptyString(Value) {
    return ((typeof Value === 'string') || (Value instanceof String)) && !emptyStringPattern.test(Value.valueOf());
}
/**** ValueIsFunction ****/
function ValueIsFunction(Value) {
    return (typeof Value === 'function');
}
/**** ValueIsObject ****/
function ValueIsObject(Value) {
    return (Value != null) && (typeof Value === 'object');
}
/**** ValueIsPlainObject ****/
function ValueIsPlainObject(Value) {
    return ((Value != null) && (typeof Value === 'object') &&
        (Object.getPrototypeOf(Value) === Object.prototype));
}
/**** ValueIsArray ****/
var ValueIsArray = Array.isArray;
/**** ValueIsListSatisfying ****/
function ValueIsListSatisfying(Value, Validator, minLength, maxLength) {
    if (ValueIsArray(Value)) {
        try {
            for (var i = 0, l = Value.length; i < l; i++) {
                if (Validator(Value[i]) == false) {
                    return false;
                }
            }
            if (minLength != null) {
                if (Value.length < minLength) {
                    return false;
                }
            }
            if (maxLength != null) {
                if (Value.length > maxLength) {
                    return false;
                }
            }
            return true;
        }
        catch (Signal) { /* nop */ }
    }
    return false;
}
/**** ValueIsOneOf ****/
function ValueIsOneOf(Value, ValueList) {
    return (ValueList.indexOf(Value) >= 0);
} // no automatic unboxing of boxed values and vice-versa!
//------------------------------------------------------------------------------
//--                      Argument Validation Functions                       --
//------------------------------------------------------------------------------
var rejectNil = false;
var acceptNil = true;
/**** validatedArgument ****/
function validatedArgument(Description, Argument, ValueIsValid, NilIsAcceptable, Expectation) {
    if (Argument == null) {
        if (NilIsAcceptable) {
            return Argument;
        }
        else {
            throwError("MissingArgument: no " + escaped(Description) + " given");
        }
    }
    else {
        if (ValueIsValid(Argument)) {
            switch (true) {
                case Argument instanceof Boolean:
                case Argument instanceof Number:
                case Argument instanceof String:
                    return Argument.valueOf(); // unboxes any primitives
                default:
                    return Argument;
            }
        }
        else {
            throwError("InvalidArgument: the given " + escaped(Description) + " is no valid " + escaped(Expectation));
        }
    }
}
/**** ValidatorForClassifier ****/
function ValidatorForClassifier(Classifier, NilIsAcceptable, Expectation) {
    var Validator = function (Description, Argument) {
        return validatedArgument(Description, Argument, Classifier, NilIsAcceptable, Expectation);
    };
    var ClassifierName = Classifier.name;
    if ((ClassifierName != null) && /^ValueIs/.test(ClassifierName)) {
        var ValidatorName = ClassifierName.replace(// derive name from validator
        /^ValueIs/, NilIsAcceptable ? 'allow' : 'expect');
        return FunctionWithName(Validator, ValidatorName);
    }
    else {
        return Validator; // without any specific name
    }
}
/**** FunctionWithName (works with older JS engines as well) ****/
function FunctionWithName(originalFunction, desiredName) {
    if (originalFunction == null) {
        throwError('MissingArgument: no function given');
    }
    if (typeof originalFunction !== 'function') {
        throwError('InvalidArgument: the given 1st Argument is not a JavaScript function');
    }
    if (desiredName == null) {
        throwError('MissingArgument: no desired name given');
    }
    if ((typeof desiredName !== 'string') && !(desiredName instanceof String)) {
        throwError('InvalidArgument: the given desired name is not a string');
    }
    if (originalFunction.name === desiredName) {
        return originalFunction;
    }
    try {
        Object.defineProperty(originalFunction, 'name', { value: desiredName });
        if (originalFunction.name === desiredName) {
            return originalFunction;
        }
    }
    catch (signal) { /* ok - let's take the hard way */ }
    var renamed = new Function('originalFunction', 'return function ' + desiredName + ' () {' +
        'return originalFunction.apply(this,Array.prototype.slice.apply(arguments))' +
        '}');
    return renamed(originalFunction);
} // also works with older JavaScript engines
/**** allow/expect[ed]FiniteNumber ****/
var allowFiniteNumber = /*#__PURE__*/ ValidatorForClassifier(ValueIsFiniteNumber, acceptNil, 'finite numeric value'), allowedFiniteNumber = allowFiniteNumber;
var expectInteger = /*#__PURE__*/ ValidatorForClassifier(ValueIsInteger, rejectNil, 'integral numeric value');
/**** allow[ed]IntegerInRange ****/
function allowIntegerInRange(Description, Argument, minValue, maxValue) {
    return (Argument == null
        ? Argument
        : expectedIntegerInRange(Description, Argument, minValue, maxValue));
}
var allowedIntegerInRange = allowIntegerInRange;
/**** expect[ed]IntegerInRange ****/
function expectIntegerInRange(Description, Argument, minValue, maxValue) {
    expectInteger(Description, Argument);
    if (isNaN(Argument)) {
        throwError("InvalidArgument: the given " + escaped(Description) + " is not-a-number");
    }
    if ((minValue != null) && isFinite(minValue)) {
        if ((maxValue != null) && isFinite(maxValue)) {
            if ((Argument < minValue) || (Argument > maxValue)) {
                throw new RangeError("the given " + escaped(Description) + " (" + Argument + ") is outside " +
                    ("the allowed range (" + minValue + "..." + maxValue + ")"));
            }
        }
        else {
            if (Argument < minValue) {
                throw new RangeError("the given " + escaped(Description) + " is below the allowed " +
                    ("minimum (" + Argument + " < " + minValue + ")"));
            }
        }
    }
    else {
        if ((maxValue != null) && isFinite(maxValue)) {
            if (Argument > maxValue) {
                throw new RangeError("the given " + escaped(Description) + " exceeds the allowed " +
                    ("maximum (" + Argument + " > " + maxValue + ")"));
            }
        }
    }
    return Argument.valueOf();
}
var expectedIntegerInRange = expectIntegerInRange;
/**** allow/expect[ed]String ****/
var allowString = /*#__PURE__*/ ValidatorForClassifier(ValueIsString, acceptNil, 'literal string'), allowedString = allowString;
/**** allow/expect[ed]Function ****/
var allowFunction = /*#__PURE__*/ ValidatorForClassifier(ValueIsFunction, acceptNil, 'JavaScript function'), allowedFunction = allowFunction;
var expectObject = /*#__PURE__*/ ValidatorForClassifier(ValueIsObject, rejectNil, 'JavaScript object');
/**** allow/expect[ed]PlainObject ****/
var allowPlainObject = /*#__PURE__*/ ValidatorForClassifier(ValueIsPlainObject, acceptNil, '"plain" JavaScript object'), allowedPlainObject = allowPlainObject;
/**** allow[ed]ListSatisfying ****/
function allowListSatisfying(Description, Argument, Validator, Expectation, minLength, maxLength) {
    return (Argument == null
        ? Argument
        : expectedListSatisfying(Description, Argument, Validator, Expectation, minLength, maxLength));
}
/**** expect[ed]ListSatisfying ****/
function expectListSatisfying(Description, Argument, Validator, Expectation, minLength, maxLength) {
    if (Argument == null) {
        throwError("MissingArgument: no " + escaped(Description) + " given");
    }
    if (ValueIsListSatisfying(Argument, Validator, minLength, maxLength)) {
        return Argument;
    }
    else {
        throwError("InvalidArgument: the given " + escaped(Description) + " is " + (Expectation == null
            ? 'either not a list or contains invalid elements'
            : 'no ' + escaped(Expectation)));
    }
}
var expectedListSatisfying = expectListSatisfying;
/**** escaped - escapes all control characters in a given string ****/
function escaped(Text) {
    var EscapeSequencePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?/g;
    var CtrlCharCodePattern = /[\x00-\x1f\x7f-\x9f]/g;
    return Text
        .replace(EscapeSequencePattern, function (Match) {
        return (Match === '\\' ? '\\\\' : Match);
    })
        .replace(CtrlCharCodePattern, function (Match) {
        switch (Match) {
            case '\0': return '\\0';
            case '\b': return '\\b';
            case '\f': return '\\f';
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            case '\v': return '\\v';
            default: {
                var HexCode = Match.charCodeAt(0).toString(16);
                return '\\x' + '00'.slice(HexCode.length) + HexCode;
            }
        }
    });
}
/**** quotable - makes a given string ready to be put in single/double quotes ****/
function quotable(Text, Quote) {
    if (Quote === void 0) { Quote = '"'; }
    var EscSeqOrSglQuotePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?|'/g;
    var EscSeqOrDblQuotePattern = /\\x[0-9a-zA-Z]{2}|\\u[0-9a-zA-Z]{4}|\\[0bfnrtv'"\\\/]?|"/g;
    var CtrlCharCodePattern = /[\x00-\x1f\x7f-\x9f]/g;
    return Text
        .replace(Quote === "'" ? EscSeqOrSglQuotePattern : EscSeqOrDblQuotePattern, function (Match) {
        switch (Match) {
            case "'": return "\\'";
            case '"': return '\\"';
            case '\\': return '\\\\';
            default: return Match;
        }
    })
        .replace(CtrlCharCodePattern, function (Match) {
        switch (Match) {
            case '\0': return '\\0';
            case '\b': return '\\b';
            case '\f': return '\\f';
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            case '\v': return '\\v';
            default: {
                var HexCode = Match.charCodeAt(0).toString(16);
                return '\\x' + '00'.slice(HexCode.length) + HexCode;
            }
        }
    });
}
/**** quoted ****/
function quoted(Text, Quote) {
    if (Quote === void 0) { Quote = '"'; }
    return Quote + quotable(Text, Quote) + Quote;
}
/**** ObjectIsEmpty ****/
function ObjectIsEmpty(Candidate) {
    expectObject('candidate', Candidate);
    for (var Key in Candidate) {
        if (Object_hasOwnProperty(Candidate, Key)) {
            return false;
        }
    }
    return true;
}
/**** ObjectIsNotEmpty ****/
function ObjectIsNotEmpty(Candidate) {
    return !ObjectIsEmpty(Candidate);
}
/**** constrained ****/
function constrained(Value, Minimum, Maximum) {
    if (Minimum === void 0) { Minimum = -Infinity; }
    if (Maximum === void 0) { Maximum = Infinity; }
    return Math.max(Minimum, Math.min(Value, Maximum));
}

var e={fromViewportTo:function(e,t,o){switch(!0){case null==t:throw new Error('no "Position" given');case"number"!=typeof t.left&&!(t.left instanceof Number):case"number"!=typeof t.top&&!(t.top instanceof Number):throw new Error('invalid "Position" given')}switch(e){case null:case void 0:throw new Error("no coordinate system given");case"viewport":return {left:t.left,top:t.top};case"document":return {left:t.left+window.scrollX,top:t.top+window.scrollY};case"local":switch(!0){case null==o:throw new Error("no target element given");case o instanceof Element:var r=window.getComputedStyle(o),n=parseFloat(r.borderLeftWidth),i=parseFloat(r.borderTopWidth),l=o.getBoundingClientRect();return {left:t.left-l.left-n,top:t.top-l.top-i};default:throw new Error("invalid target element given")}default:throw new Error("invalid coordinate system given")}},fromDocumentTo:function(e,t,o){switch(!0){case null==t:throw new Error('no "Position" given');case"number"!=typeof t.left&&!(t.left instanceof Number):case"number"!=typeof t.top&&!(t.top instanceof Number):throw new Error('invalid "Position" given')}switch(e){case null:case void 0:throw new Error("no coordinate system given");case"viewport":return {left:t.left-window.scrollX,top:t.top-window.scrollY};case"document":return {left:t.left,top:t.top};case"local":switch(!0){case null==o:throw new Error("no target element given");case o instanceof Element:var r=window.getComputedStyle(o),n=parseFloat(r.borderLeftWidth),i=parseFloat(r.borderTopWidth),l=o.getBoundingClientRect();return {left:t.left+window.scrollX-l.left-n,top:t.top+window.scrollY-l.top-i};default:throw new Error("invalid target element given")}default:throw new Error("invalid coordinate system given")}},fromLocalTo:function(e,t,o){switch(!0){case null==t:throw new Error('no "Position" given');case"number"!=typeof t.left&&!(t.left instanceof Number):case"number"!=typeof t.top&&!(t.top instanceof Number):throw new Error('invalid "Position" given')}var r,n,i;switch(!0){case null==o:throw new Error("no source element given");case o instanceof Element:var l=window.getComputedStyle(o),a=parseFloat(l.borderLeftWidth),s=parseFloat(l.borderTopWidth);n=(r=o.getBoundingClientRect()).left+a,i=r.top+s;break;default:throw new Error("invalid source element given")}switch(e){case null:case void 0:throw new Error("no coordinate system given");case"viewport":return {left:t.left+n,top:t.top+i};case"document":return {left:t.left+n+window.scrollX,top:t.top+i+window.scrollY};case"local":return {left:t.left,top:t.top};default:throw new Error("invalid coordinate system given")}}};

//----------------------------------------------------------------------------//
/**** parsedDraggableOptions ****/
function parsedDraggableOptions(Options) {
    Options = allowedPlainObject('drag options', Options) || {};
    var Extras, relativeTo;
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
        Dummy: Dummy,
        DummyOffsetX: DummyOffsetX,
        DummyOffsetY: DummyOffsetY,
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        // @ts-ignore
        onDragStart: onDragStart,
        onDragMove: onDragMove,
        onDragEnd: onDragEnd,
        onDragCancel: onDragCancel
    };
}
/**** use:asDraggable={options} ****/
function asDraggable(Element, Options) {
    var currentDraggableOptions;
    var PositionReference; // element with user coordinate system
    var ReferenceDeltaX, ReferenceDeltaY; // mouse -> user coord.s
    var PositioningWasDelayed; // workaround for prob. with "drag" events
    var DragImage;
    var initialPosition; // given in user coordinates
    var lastPosition; // dto.
    currentDraggableOptions = parsedDraggableOptions(Options);
    /**** startDragging ****/
    function startDragging(originalEvent) {
        var Options = currentDraggableOptions;
        PositionReference = PositionReferenceFor(Element, Options);
        var relativePosition = e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
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
                var PositionInDraggable = e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element);
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
        setTimeout(function () { return Element.classList.add('dragged'); }, 0);
        originalEvent.stopPropagation();
    }
    /**** continueDragging ****/
    function continueDragging(originalEvent) {
        var Options = currentDraggableOptions;
        if ((originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
            !PositioningWasDelayed) {
            PositioningWasDelayed = true; // last "drag" event contains wrong coord.s
        }
        else {
            PositioningWasDelayed = false;
            var relativePosition = e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
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
        //    continueDragging(originalEvent)           // NO! positions might be wrong!
        var Options = currentDraggableOptions;
        if (Options.onDragEnd != null) {
            var x = constrained(lastPosition.x, Options.minX, Options.maxX);
            var y = constrained(lastPosition.y, Options.minY, Options.maxY);
            var dx = x - lastPosition.x;
            var dy = y - lastPosition.y;
            invokeHandler('onDragEnd', Options, x, y, dx, dy, Options.Extras);
        }
        Element.classList.remove('dragged');
        originalEvent.stopPropagation();
    }
    /**** updateDraggableOptions ****/
    function updateDraggableOptions(Options) {
        Options = parsedDraggableOptions(Options);
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
    var Extras, Operations, DataToOffer;
    var onDropZoneEnter, onDropZoneHover, onDropZoneLeave;
    var onDropped;
    Extras = Options.Extras;
    Operations = parsedOperations('list of allowed operations', Options.Operations, 'copy');
    DataToOffer = Object.assign({}, allowedPlainObject('data to be offered', Options.DataToOffer));
    onDropZoneEnter = allowedFunction('"onDropZoneEnter" handler', Options.onDropZoneEnter);
    onDropZoneHover = allowedFunction('"onDropZoneHover" handler', Options.onDropZoneHover);
    onDropZoneLeave = allowedFunction('"onDropZoneLeave" handler', Options.onDropZoneLeave);
    onDropped = allowedFunction('"onDropped" handler', Options.onDropped);
    return {
        Extras: Extras,
        Operations: Operations,
        DataToOffer: DataToOffer,
        // @ts-ignore
        onDropZoneEnter: onDropZoneEnter,
        onDropZoneHover: onDropZoneHover,
        onDropZoneLeave: onDropZoneLeave,
        onDropped: onDropped
    };
}
/**** use:asDroppable={options} ****/
function asDroppable(Element, Options) {
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
    currentDraggableOptions = parsedDraggableOptions(Options);
    currentDroppableOptions = parsedDroppableOptions(Options);
    /**** startDragging ****/
    function startDragging(originalEvent) {
        var Options = Object.assign({}, currentDraggableOptions, currentDroppableOptions);
        PositionReference = PositionReferenceFor(Element, Options);
        var relativePosition = e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
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
                var PositionInDraggable = e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element);
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
        setTimeout(function () { return Element.classList.add('dragged'); }, 0);
        originalEvent.stopPropagation();
    }
    /**** continueDragging ****/
    function continueDragging(originalEvent) {
        var Options = Object.assign({}, currentDraggableOptions, currentDroppableOptions);
        if ((originalEvent.screenX === 0) && (originalEvent.screenY === 0) &&
            !PositioningWasDelayed) {
            PositioningWasDelayed = true; // last "drag" event contains wrong coord.s
        }
        else {
            PositioningWasDelayed = false;
            var relativePosition = e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, PositionReference); // relative to reference element
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
        Element.classList.remove('dragged', 'droppable');
        originalEvent.stopPropagation();
    }
    /**** updateDraggableOptions ****/
    function updateDraggableOptions(Options) {
        Options = parsedDraggableOptions(Options);
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
        if (Options.Extras != null) {
            currentDroppableOptions.Extras = Options.Extras;
        }
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
        // @ts-ignore
        onDroppableEnter: onDroppableEnter,
        onDroppableMove: onDroppableMove,
        onDroppableLeave: onDroppableLeave,
        // @ts-ignore
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
        var DropZonePosition = asPosition(e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element)); // relative to DropZone element
        var accepted = ResultOfHandler('onDroppableEnter', Options, DropZonePosition.x, DropZonePosition.y, wantedOperation, offeredTypeList, currentDroppableExtras, Options.Extras);
        if (accepted === false) {
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
            (currentDropZoneElement !== Element)) {
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
            if (currentDropZoneElement === Element) {
                currentDropZoneExtras = undefined;
                currentDropZoneElement = undefined;
                currentDropZonePosition = undefined;
                Element.classList.remove('hovered');
            }
            return;
        }
        currentDropZonePosition = asPosition(e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element)); // relative to DropZone element
        var accepted = ResultOfHandler('onDroppableMove', Options, currentDropZonePosition.x, currentDropZonePosition.y, wantedOperation, offeredTypeList, currentDroppableExtras, Options.Extras);
        if (accepted === false) {
            currentDropZoneExtras = undefined;
            currentDropZoneElement = undefined;
            currentDropZonePosition = undefined;
            Element.classList.remove('hovered');
        }
        else {
            originalEvent.preventDefault();
            originalEvent.stopPropagation();
        }
    }
    /**** leftByDroppable ****/
    function leftByDroppable(originalEvent) {
        var Options = currentDropZoneOptions;
        if (currentDropZoneElement === Element) {
            if (currentTypeTransferred == null) {
                currentDropZoneExtras = undefined;
                currentDropZoneElement = undefined;
                DroppableWasDropped = false;
                currentDropZonePosition = undefined;
                currentTypeTransferred = undefined;
                currentDataTransferred = undefined;
                Element.classList.remove('hovered');
                invokeHandler('onDroppableLeave', Options, currentDroppableExtras, Options.Extras);
            } // swallow "dragleave" right after successful "drop"
            originalEvent.preventDefault();
            originalEvent.stopPropagation();
        }
    }
    /**** droppedByDroppable ****/
    function droppedByDroppable(originalEvent) {
        if ((originalEvent.dataTransfer == null) ||
            (originalEvent.dataTransfer.effectAllowed === 'none') ||
            (currentDropZoneElement !== Element)) {
            return;
        }
        originalEvent.preventDefault(); // never allow default action!
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
            Element.classList.remove('hovered');
            invokeHandler('onDroppableLeave', Options, currentDroppableExtras, Options.Extras);
            return;
        }
        currentDropZonePosition = asPosition(e.fromDocumentTo('local', { left: originalEvent.pageX, top: originalEvent.pageY }, Element)); // relative to DropZone element
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
        Element.classList.remove('hovered');
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

export { asDraggable, asDropZone, asDroppable };
//# sourceMappingURL=svelte-drag-and-drop-actions.esm.js.map
