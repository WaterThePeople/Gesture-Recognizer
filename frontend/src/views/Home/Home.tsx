import React, { useEffect, useRef, useState } from "react";
import style from "./Home.module.sass";
import Camera from "views/Camera/Camera";
import Camera_old from "views/Camera/Camera_old";

function Home() {
  const [frames, setFrames] = useState<string[]>([]);
  const [cleanFrames, setCleanFrames] = useState<string[]>([]);

  return (
    <div className={style.container}>
      <div className={style.row}>
        <div className={style.camera}>
          <Camera setFrames={setFrames} setCleanFrames={setCleanFrames} />
        </div>
        <div className={style.frames}>
          <img src={frames[frames.length - 1]} style={{ width: 400 }} />
          <img
            src={cleanFrames[cleanFrames.length - 1]}
            style={{ width: 400 }}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
