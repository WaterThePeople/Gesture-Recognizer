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
  const [letters, setLetters] = useState<[string, string][]>([]);
  const horizontalScrollRef = useRef<HorizontalScrollRef>(null);

  function toPercentageString(value: string, decimals = 0): string {
    return `${(parseFloat(value) * 100).toFixed(decimals)}%`;
  }

  return (
    <div className={style.container}>
      {frames.length > 0 && cleanFrames.length > 0 && (
        <div className={style.frames_counter}>
          {frames.length} / {maxFrames}
        </div>
      )}
      <div className={style.row}>
        <div className={style.camera}>
          <Camera
            setFrames={setFrames}
            setCleanFrames={setCleanFrames}
            setLetters={setLetters}
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
                  <div className={style.column_item_letter}>
                    <div className={style.letter}>
                      {letters[letters.length - 1 - index]
                        ? letters[letters.length - 1 - index][0]
                        : ""}
                    </div>
                    <div className={style.confidence}>
                      {toPercentageString(
                        letters[letters.length - 1 - index]
                          ? letters[letters.length - 1 - index][1]
                          : ""
                      )}
                    </div>
                  </div>
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
