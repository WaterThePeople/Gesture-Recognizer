import style from "./Home.module.sass";
import Camera from "components/Camera/Camera";
import Camera_old from "components/Camera/Camera_old";

function Home() {
  return (
    <div className={style.container}>
      <div className={style.camera_row}>
        <div className={style.camera}>
          <Camera />
        </div>
      </div>
    </div>
  );
}

export default Home;
