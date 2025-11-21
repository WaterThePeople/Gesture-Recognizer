import React, { useState } from "react";
import style from "./SwitchButton.module.sass";
import cn from "classnames";

function SwitchButton({
  onClick,
  color = "none",
}: {
  onClick: Function;
  color?: "none" | "red" | "green" | "blue";
}) {
  const [isOn, setIsOn] = useState(false);

  const handleToggle = () => {
    setIsOn(!isOn);
    onClick();
  };
  return (
    <div
      onClick={handleToggle}
      className={cn(style.container, isOn ? style.on : style.off)}
    >
      <div
        className={cn(style.dot, isOn ? style.on : style.off, {
          [style.red]: color === "red",
          [style.green]: color === "green",
          [style.blue]: color === "blue",
        })}
      />
    </div>
  );
}

export default SwitchButton;
