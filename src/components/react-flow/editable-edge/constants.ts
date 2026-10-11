export const Algorithm = {
  Linear: 'Linear',
  CatmullRom: 'Catmull-Rom',
  BezierCatmullRom: 'Bezier Catmull-Rom',
  Orthogonal: 'orthogonal',

} as const;

export type Algorithm = (typeof Algorithm)[keyof typeof Algorithm];

export const COLORS = {
  [Algorithm.Linear]: '#000',
  [Algorithm.BezierCatmullRom]: '#000',
  [Algorithm.Orthogonal]: '#000',
  [Algorithm.CatmullRom]: '#FF0072',
};

export const DEFAULT_ALGORITHM = Algorithm.Linear;
