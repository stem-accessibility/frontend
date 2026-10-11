export type LongDescriptionSectionKey =
  | "purpose"
  | "structure"
  | "keyComponents"
  | "traversal"
  | "mainTakeaway";

export type LongDescriptionSection = {
  text: string;
  included: boolean;
};

export type LongDescriptionSections = {
  purpose: LongDescriptionSection;
  structure: LongDescriptionSection;
  keyComponents: LongDescriptionSection;
  traversal: LongDescriptionSection;
  mainTakeaway: LongDescriptionSection;
};