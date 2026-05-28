import { useRef, useState } from "react";
import { colors } from "../theme";

interface DividerProps {
  orientation: "vertical" | "horizontal";
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

export function Divider({
  orientation,
  value,
  min,
  max,
  onChange,
}: DividerProps) {
  const [hot, setHot] = useState(false);
  const dragRef = useRef<{ startCoord: number; startValue: number } | null>(
    null,
  );
  const valueRef = useRef(value);
  valueRef.current = value;

  const sizeProp = orientation === "vertical" ? { width: 1 } : { height: 0.5 };

  return (
    <box
      {...sizeProp}
      flexShrink={0}
      backgroundColor={hot ? colors.borderFocus : colors.border}
      onMouseOver={() => setHot(true)}
      onMouseOut={() => setHot(false)}
      onMouseDown={(e) => {
        dragRef.current = {
          startCoord: orientation === "vertical" ? e.x : e.y,
          startValue: valueRef.current,
        };
      }}
      onMouseDrag={(e) => {
        const start = dragRef.current;
        if (!start) return;
        const current = orientation === "vertical" ? e.x : e.y;
        const next = Math.min(
          max,
          Math.max(min, start.startValue + (current - start.startCoord)),
        );
        onChange(next);
      }}
      onMouseDragEnd={() => {
        dragRef.current = null;
      }}
    />
  );
}
