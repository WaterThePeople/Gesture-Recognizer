import React from "react";
import style from "./Home.module.sass";
import FrameCapture from "views/Camera/FrameCapture";

function Home() {
  return (
    <div className={style.container}>
      TESTUJEMY APLIKACJĘ
      <FrameCapture />
    </div>
  );
}

export default Home;
