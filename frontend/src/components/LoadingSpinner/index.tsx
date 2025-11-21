import style from "./LoadingSpinner.module.sass";

const LoadingSpinner = ({ size = 25 }: { size?: number }) => {
  return (
    <div
      className={style.container}
      style={{ height: size, width: size }}
    ></div>
  );
};

export default LoadingSpinner;
