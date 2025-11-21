import style from "./LoadingCard.module.sass";
import cn from "classnames";
import LoadingSpinner from "components/LoadingSpinner";

const LoadingCard = ({
  classname,
  spinnerSize = 25,
}: {
  classname?: string;
  spinnerSize?: number;
}) => {
  return (
    <div className={cn(style.container, classname)}>
      <div className={style.content}>
        <LoadingSpinner size={spinnerSize} />
      </div>
    </div>
  );
};

export default LoadingCard;
