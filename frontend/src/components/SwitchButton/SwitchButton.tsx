import style from "./SwitchButton.module.sass";
import cn from "classnames";

function SwitchButton({
  onClick,
  color = "none",
  text,
  isOn,
}: {
  onClick: Function;
  color?: "none" | "red" | "green" | "blue";
  text?: string;
  isOn?: boolean;
}) {

  const handleToggle = () => {
    onClick();
  };
  return (
    <div className={cn(style.container)}>
      <div
        onClick={handleToggle}
        className={cn(style.switch, isOn ? style.on : style.off)}
      >
        <div
          className={cn(style.dot, isOn ? style.on : style.off, {
            [style.red]: color === "red",
            [style.green]: color === "green",
            [style.blue]: color === "blue",
          })}
        />
      </div>
      <div className={cn(style.text, isOn ? style.on : style.off)}>{text}</div>
    </div>
  );
}

export default SwitchButton;
