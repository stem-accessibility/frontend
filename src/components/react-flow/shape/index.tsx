import { ShapeComponents, type ShapeComponentProps } from './types';


function Shape({ type, width, height, renderSVG = true, ...svgAttributes }: ShapeComponentProps) {
  const ShapeComponent = ShapeComponents[type];

  if (!ShapeComponent || !width || !height) {
    return null;
  }

  const strokeWidth = svgAttributes.strokeWidth
    ? +svgAttributes.strokeWidth
    : 0;

  // we subtract the strokeWidth to make sure the shape is not cut off
  // this is done because svg doesn't support stroke inset (https://stackoverflow.com/questions/7241393/can-you-control-how-an-svgs-stroke-width-is-drawn)
  const innerWidth = width - 2 * strokeWidth;
  const innerHeight = height - 2 * strokeWidth;

  const shapeContent = (
    <g 
        transform={`translate(${svgAttributes.strokeWidth ?? 0}, ${
          svgAttributes.strokeWidth ?? 0
        })`}
      >
        <ShapeComponent
          width={innerWidth}
          height={innerHeight}
          pointerEvents="none"
          {...svgAttributes}
        />
      </g>
  )
  return renderSVG ? (
    <svg width={width} height={height} className="shape-svg">
      {shapeContent}
    </svg>
  ) : (
    shapeContent
  );
}


export default Shape;
