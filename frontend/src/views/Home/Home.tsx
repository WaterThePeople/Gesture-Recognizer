import React from "react";
import style from "./Home.module.sass";
import FrameCapture from "views/Camera/FrameCapture";
import HandLandmarkDetector from "views/Camera/HandLandmarkDetector";

function Home() {
  return (
    <div className={style.container}>
      TESTUJEMY APLIKACJĘ
      {/* <FrameCapture /> */}
      <HandLandmarkDetector/>
    </div>
  );
}

export default Home;
