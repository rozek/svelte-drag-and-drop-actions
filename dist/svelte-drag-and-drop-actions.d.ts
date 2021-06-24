export declare type PositionReference = ('parent' | 'body' | string | HTMLElement | SVGElement);
export declare type Position = {
    x: number;
    y: number;
};
export declare type DragDummy = (string | HTMLElement | SVGElement | // MathMLElement |
'standard' | 'none') | null | undefined;
declare type DraggableOptions = {
    Extras?: any;
    relativeTo?: PositionReference;
    Dummy?: DragDummy;
    DummyOffsetX?: number;
    DummyOffsetY?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
    onDragStart?: Position | ((DraggableExtras: any) => Position);
    onDragMove?: (x: number, y: number, dx: number, dy: number, DraggableExtras: any) => void;
    onDragEnd?: (x: number, y: number, dx: number, dy: number, DraggableExtras: any) => void;
};
/**** use:asDraggable={options} ****/
export declare function asDraggable(Element: HTMLElement | SVGElement, Options: DraggableOptions): {
    update: (Options: any) => void;
};
declare const DropOperations: string[];
export declare type DropOperation = typeof DropOperations[number];
export declare type DataOfferSet = {
    [Type: string]: string;
};
declare type DroppableOptions = DraggableOptions & {
    Extras?: any;
    Operations?: string;
    DataToOffer?: DataOfferSet;
    onDropZoneEnter?: (x: number, y: number, DropZoneExtras: any, DroppableExtras: any) => void;
    onDropZoneHover?: (x: number, y: number, DropZoneExtras: any, DroppableExtras: any) => void;
    onDropZoneLeave?: (DropZoneExtras: any, DroppableExtras: any) => void;
    onDropped?: (x: number, y: number, Operation: DropOperation, TypeTransferred: string, DataTransferred: any, DropZoneExtras: any, DroppableExtras: any) => void;
};
/**** use:asDroppable={options} ****/
export declare function asDroppable(Element: HTMLElement | SVGElement, Options: DroppableOptions): {
    update: (Options: any) => void;
};
export declare type TypeAcceptanceSet = {
    [Type: string]: string;
};
declare type DropZoneOptions = {
    Extras?: any;
    TypesToAccept?: TypeAcceptanceSet;
    HoldDelay?: number;
    onDroppableEnter?: (x: number, y: number, Operation: DropOperation, offeredTypeList: string[], DroppableExtras: any, DropZoneExtras: any) => boolean | undefined;
    onDroppableMove?: (x: number, y: number, Operation: DropOperation, offeredTypeList: string[], DroppableExtras: any, DropZoneExtras: any) => boolean | undefined;
    onDroppableHold?: (x: number, y: number, DroppableExtras: any, DropZoneExtras: any) => void;
    onDroppableLeave?: (DroppableExtras: any, DropZoneExtras: any) => void;
    onDrop?: (x: number, y: number, Operation: DropOperation, DataOffered: any, DroppableExtras: any, DropZoneExtras: any) => string;
};
/**** use:asDropZone={options} ****/
export declare function asDropZone(Element: HTMLElement | SVGElement, Options: DropZoneOptions): {
    update: (Options: any) => void;
};
export {};