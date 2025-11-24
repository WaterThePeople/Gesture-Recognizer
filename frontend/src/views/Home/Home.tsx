import React, { useEffect, useRef, useState } from "react";
import style from "./Home.module.sass";
import Camera from "views/Camera/Camera";
import HorizontalScroll, {
  HorizontalScrollRef,
} from "components/HorizontalScroll/HorizontalScroll";

const maxFrames = 24;

function Home() {
  const [frames, setFrames] = useState<string[]>([]);
  const [cleanFrames, setCleanFrames] = useState<string[]>([]);
  const horizontalScrollRef = useRef<HorizontalScrollRef>(null);

  return (
    <div className={style.container}>
      {frames.length > 0 && cleanFrames.length > 0 && (
        <div className={style.frames_counter}>{frames.length} / {maxFrames}</div>
      )}
      <div className={style.row}>
        <div className={style.camera}>
          <Camera
            setFrames={setFrames}
            setCleanFrames={setCleanFrames}
            frameCaptureTimer={6}
            maxFrames={maxFrames}
          />
        </div>

        <div className={style.frames}>
          {frames.length > 0 && cleanFrames.length > 0 && (
            <HorizontalScroll
              ref={horizontalScrollRef}
              className={style.horizontal_scroll}
            >
              {frames.map((frame: any, index: number) => (
                <div className={style.column} key={index}>
                  <img
                    src={frames[frames.length - 1 - index]}
                    className={style.column_item}
                    key={`frame+${index}`}
                  />
                  <img
                    src={cleanFrames[cleanFrames.length - 1 - index]}
                    className={style.column_item}
                    key={`clean_frame+${index}`}
                  />
                </div>
              ))}
            </HorizontalScroll>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
