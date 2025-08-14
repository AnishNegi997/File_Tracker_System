import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

export default function Barcode({ value }) {
  const svgRef = useRef();
  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: true,
        height: 50,
        width: 2,
      });
    }
  }, [value]);
  return <svg ref={svgRef}></svg>;
} 