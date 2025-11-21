import style from "./DefaultButton.module.sass";
import cn from "classnames";

function DefaultButton({
  onClick,
  text,
  color = "none",
}: {
  onClick: Function;
  text: string;
  color?: "none" | "red" | "green" | "blue";
}) {
  return (
    <button
      className={cn(style.container, {
        [style.red]: color === "red",
        [style.green]: color === "green",
        [style.blue]: color === "blue",
      })}
      onClick={() => onClick()}
    >
      <div className={cn(style.text)}>{text}</div>
    </button>
  );
}

export default DefaultButton;
