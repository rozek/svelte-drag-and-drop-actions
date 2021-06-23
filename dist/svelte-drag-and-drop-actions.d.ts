export declare type PositionReference = ('parent' | 'body' | string | HTMLElement | SVGElement);
export declare type Position = {
    x: number;
    y: number;
};
export declare type DragDummy = (string | HTMLElement | SVGElement | // MathMLElement |
'standard' | 'none') | null | undefined;
declare type DraggableOptions = {
    relativeTo?: PositionReference;
    Dummy?: DragDummy;
    DummyOffsetX?: number;
    DummyOffsetY?: number;
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
    onDragStart?: Position | ((Element?: HTMLElement | SVGElement) => Position);
    onDragMove?: (x: number, y: number, dx: number, dy: number, Element?: HTMLElement | SVGElement) => void;
    onDragEnd?: (x: number, y: number, dx: number, dy: number, Element?: HTMLElement | SVGElement) => void;
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
    Entity?: any;
    Operations?: string;
    DataToOffer?: DataOfferSet;
    onDropZoneEnter?: (DropZone: any, x: number, y: number, Element: HTMLElement | SVGElement) => void;
    onDropZoneHover?: (DropZone: any, x: number, y: number, Element: HTMLElement | SVGElement) => void;
    onDropZoneLeave?: (DropZone: any, Element: HTMLElement | SVGElement) => void;
    onDropped?: (DropZone: any, x: number, y: number, Operation: DropOperation, TypeTransferred: string, DataTransferred: any, Element: HTMLElement | SVGElement) => void;
};
/**** use:asDroppable={options} ****/
export declare function asDroppable(Element: HTMLElement | SVGElement, Options: DroppableOptions): {
    update: (Options: any) => void;
};
export declare type TypeAcceptanceSet = {
    [Type: string]: string;
};
declare type DropZoneOptions = {
    Entity?: any;
    TypesToAccept?: TypeAcceptanceSet;
    HoldDelay?: number;
    onDroppableEnter?: (Droppable: any, x: number, y: number, Operation: DropOperation, offeredTypeList: string[], Element: HTMLElement | SVGElement) => boolean | undefined;
    onDroppableMove?: (Droppable: any, x: number, y: number, Operation: DropOperation, offeredTypeList: string[], Element: HTMLElement | SVGElement) => boolean | undefined;
    onDroppableHold?: (Droppable: any, x: number, y: number, Element: HTMLElement | SVGElement) => void;
    onDroppableRelease?: (Droppable: any, x: number, y: number, Element: HTMLElement | SVGElement) => void;
    onDroppableLeave?: (Droppable: any, Element: HTMLElement | SVGElement) => void;
    onDrop?: (Droppable: any, x: number, y: number, Operation: DropOperation, DataOffered: any, Element: HTMLElement | SVGElement) => string;
};
/**** use:asDropZone={options} ****/
export declare function asDropZone(Element: HTMLElement | SVGElement, Options: DropZoneOptions): {
    update: (Options: any) => void;
};
export {};
