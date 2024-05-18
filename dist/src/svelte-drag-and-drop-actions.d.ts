export type PositionReference = ('parent' | 'body' | string | HTMLElement | SVGElement);
export type Position = {
    x: number;
    y: number;
};
export type DragDummy = (string | HTMLElement | SVGElement | // MathMLElement |
((DraggableExtras: any, Element: HTMLElement | SVGElement) => HTMLElement | SVGElement) | 'standard' | 'none') | null | undefined;
type DraggableOptions = {
    Extras?: any;
    relativeTo?: PositionReference;
    onlyFrom?: string;
    neverFrom?: string;
    Dummy?: DragDummy;
    DummyOffsetX?: number;
    DummyOffsetY?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
    Pannable?: string | HTMLElement | SVGElement;
    PanSensorWidth?: number;
    PanSensorHeight?: number;
    PanSpeed?: number;
    onDragStart?: Position | ((DraggableExtras: any) => Position);
    onDragMove?: (x: number, y: number, dx: number, dy: number, DraggableExtras: any) => void;
    onDragEnd?: (x: number, y: number, dx: number, dy: number, DraggableExtras: any) => void;
};
/**** use:asDraggable={options} ****/
export declare function asDraggable(Element: HTMLElement | SVGElement, Options: DraggableOptions): {
    update: (Options: any) => void;
};
export declare const DropOperations: string[];
export type DropOperation = typeof DropOperations[number];
export type DataOfferSet = {
    [Type: string]: string;
};
type DroppableOptions = DraggableOptions & {
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
export type TypeAcceptanceSet = {
    [Type: string]: string;
};
type DropZoneOptions = {
    Extras?: any;
    TypesToAccept?: TypeAcceptanceSet;
    HoldDelay?: number;
    Pannable?: string | 'this' | HTMLElement | SVGElement;
    PanSensorWidth?: number;
    PanSensorHeight?: number;
    PanSpeed?: number;
    onDroppableEnter?: (x: number, y: number, Operation: DropOperation, offeredTypeList: string[], DroppableExtras: any, DropZoneExtras: any) => boolean | undefined;
    onDroppableMove?: (x: number, y: number, Operation: DropOperation, offeredTypeList: string[], DroppableExtras: any, DropZoneExtras: any) => boolean | undefined;
    onDroppableHold?: (x: number, y: number, DroppableExtras: any, DropZoneExtras: any) => void;
    onDroppableLeave?: (DroppableExtras: any, DropZoneExtras: any) => void;
    onDrop?: (x: number, y: number, Operation: DropOperation, DataOffered: any, DroppableExtras: any, DropZoneExtras: any) => string | undefined;
};
/**** use:asDropZone={options} ****/
export declare function asDropZone(Element: HTMLElement | SVGElement, Options: DropZoneOptions): {
    update: (Options: any) => void;
};
export {};
