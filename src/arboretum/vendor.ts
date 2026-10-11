// The parts of Arboretum (https://github.com/ritesh-kanchi/Arboretum, MIT) that we import.
// Everything else in the app talks to Arboretum through this file, so the submodule path
// lives in one place.
export {
  coreToTree,
  buildTree,
  buildPositionTree,
  getTreeDetails,
  getNodePosition,
  traversePreOrder,
  traverseInOrder,
  traversePostOrder,
} from "../../vendor/arboretum/lib/ir/tree";
export { coreToLinkedList, getEdgesFromLinkedList } from "../../vendor/arboretum/lib/ir/linked-list";
export { coreToArray, coreTo2DArray } from "../../vendor/arboretum/lib/ir/arr";
export {
  generateLinkedListDescription,
  generateTreeDescription,
  generateArrayDescription,
} from "../../vendor/arboretum/lib/outputs/func";
export { PHANTOM_NODE_IDS } from "../../vendor/arboretum/lib/constants";
export type {
  IRNode,
  IREdge,
  IRArrayElement,
} from "../../vendor/arboretum/lib/structures/interfaces";
export type {
  IRDiagram,
  IRTree,
  IRLinkedList,
  IRArray,
  IRMetadata,
} from "../../vendor/arboretum/lib/structures/types";
export {
  generateBrailleText,
  generateBrailleSvg,
  dotSpacing,
  letterSpacing,
  offset as brailleOffset,
} from "../../vendor/arboretum/app/components/output/Braille";
