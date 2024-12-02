/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { CHAPTERS_SETTINGS } from "./constants";
// @ts-ignore
import Player = videojs.Player;
// @ts-ignore
import PlayerOptions = videojs.PlayerOptions;

type VideoPlayerPropsType = {
  chapters: SegmentType[];
  className?: string;
  onReady: (player: Player) => void;
  options: PlayerOptions;
};

function VideoPlayer({
  chapters,
  className,
  onReady,
  options,
}: VideoPlayerPropsType) {
  const videoRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<Player>(null);

  const [chaptersTrack, setChaptersTrack] = React.useState<TextTrack>(null);
  const [playerIsReady, setPlayerIsReady] = React.useState<boolean>(false);
  const [lastTimePressedPlay, setLastTimePressedPlay] = React.useState<boolean>(
    false
  );

  // ----- Methods -----

  function updateChapters(player: Player) {
    if (!player) {
      return;
    }

    let track: TextTrack = chaptersTrack;

    // "Remove" previously created track
    if (track) {
      // NOTE: Video tracks cannot be removed.
      // Despite that fact that we can remove track cues and add them later, it makes no changes!
      // The only way is to disable previoys track and create a new one and add new cues
      track.mode = "disabled";

      // Remove previously created cues to clear memory (I hope)
      if (Array.isArray(track.cues)) {
        [...track.cues].forEach((cue: TextTrackCue) => {
          track.removeCue(cue);
        });
      }
    }

    // Create new chapters track if there is still no one
    if (!track || track?.mode === "disabled") {
      track = player.addTextTrack(
        CHAPTERS_SETTINGS.kind,
        CHAPTERS_SETTINGS.label,
        CHAPTERS_SETTINGS.language
      );
      track.mode = CHAPTERS_SETTINGS.mode;
      setChaptersTrack(track);
    }

    // Create new cues
    chapters.forEach((chapter: SegmentType) => {
      const cue: TextTrackCue = new VTTCue(
        chapter.start_sec,
        chapter.end_sec,
        chapter.title
      );
      track.addCue(cue);
    });
  }

  // ----- Effects -----

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement: HTMLElement = document.createElement("video-js");

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      // Initializing player
      const player: Player = (playerRef.current = videojs(
        videoElement,
        options,
        () => {
          videojs.log("VideoPlayer is ready");
          setPlayerIsReady(true);
          updateChapters(player);
          onReady && onReady(player);
        }
      ));
    }
  }, [options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player: Player = playerRef.current;

    // Add time of previous pressing on Play button in HTML
    // for HACK where we pause video in the end of current segment
    player.on("play", () => {
      setLastTimePressedPlay(player.currentTime());
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  React.useEffect(() => {
    if (playerIsReady) {
      updateChapters(playerRef.current);
    }
  }, [chapters]);

  return (
    <div
      className={`${className || ""}`}
      data-vjs-player={""}
      data-lasttimepressedplay={lastTimePressedPlay}
    >
      <div ref={videoRef} />
    </div>
  );
}

export default VideoPlayer;
