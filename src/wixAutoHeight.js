const MESSAGE_TYPE = "VITE_AUTO_HEIGHT";

function getContentHeight() {
  const root =
    document.getElementById("root");

  if (!root) {
    return 0;
  }

  const rootRect =
    root.getBoundingClientRect();

  const children = Array.from(
    root.children
  ).filter(
    (element) =>
      element instanceof HTMLElement
  );

  /*
    Measure the actual rendered content inside #root,
    not document/body scrollHeight.

    In an iframe, documentElement/body scrollHeight can
    equal the iframe viewport height even when the Vite
    content itself is shorter. That can prevent Wix from
    shrinking the embed after a responsive breakpoint
    change.
  */
  if (children.length > 0) {
    let contentBottom =
      rootRect.top;

    children.forEach((element) => {
      const rect =
        element.getBoundingClientRect();

      contentBottom = Math.max(
        contentBottom,
        rect.bottom
      );
    });

    return Math.ceil(
      Math.max(
        0,
        contentBottom - rootRect.top
      )
    );
  }

  return Math.ceil(
    Math.max(
      0,
      rootRect.height
    )
  );
}

export function initWixAutoHeight() {
  if (window.parent === window) {
    return;
  }

  let lastHeight = 0;
  let animationFrame = null;

  const timers = new Set();

  const sendHeight = (
    force = false
  ) => {
    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );
    }

    animationFrame =
      requestAnimationFrame(() => {
        animationFrame = null;

        const height =
          getContentHeight();

        if (!height) {
          return;
        }

        if (
          !force &&
          height === lastHeight
        ) {
          return;
        }

        lastHeight = height;

        /*
          Use "*" for the target origin here.

          Your Wix-side listener should continue validating
          event.origin before accepting the message. Using
          "*" on the sending side avoids a referrer/preview
          origin mismatch preventing a shrink message from
          reaching Wix.
        */
        window.parent.postMessage(
          {
            type: MESSAGE_TYPE,
            height,
            pathname:
              window.location.pathname,
          },
          "*"
        );
      });
  };

  const queueSend = (
    delay,
    force = false
  ) => {
    const timer = setTimeout(
      () => {
        timers.delete(timer);

        sendHeight(force);
      },
      delay
    );

    timers.add(timer);
  };

  /*
    Send more than once because Wix, React, fonts and
    responsive layout can settle on slightly different
    frames during initial load and breakpoint changes.

    Forced sends are intentional: if Wix missed an earlier
    message, it still gets another chance to shrink.
  */
  const clearQueuedSends = () => {
    timers.forEach((timer) => {
      clearTimeout(timer);
    });

    timers.clear();
  };

  const sendBurst = () => {
    clearQueuedSends();

    sendHeight(true);

    queueSend(50, true);
    queueSend(120, true);
    queueSend(250, true);
    queueSend(500, true);
    queueSend(900, true);
    queueSend(1500, true);
  };

  const root =
    document.getElementById("root");

  const resizeObserver =
    new ResizeObserver(() => {
      sendHeight();
    });

  const observedElements =
    new Set();

  const observeElement = (
    element
  ) => {
    if (
      !element ||
      observedElements.has(element)
    ) {
      return;
    }

    observedElements.add(element);
    resizeObserver.observe(element);
  };

  if (root) {
    observeElement(root);

    Array.from(
      root.children
    ).forEach(observeElement);
  } else {
    observeElement(document.body);
  }

  /*
    React may add the main section after this file begins
    running. Observe new direct children of #root so their
    final rendered height is tracked as well.
  */
  const mutationObserver =
    root
      ? new MutationObserver(() => {
          Array.from(
            root.children
          ).forEach(
            observeElement
          );

          sendBurst();
        })
      : null;

  if (
    root &&
    mutationObserver
  ) {
    mutationObserver.observe(
      root,
      {
        childList: true,
      }
    );
  }

  const handleViewportChange =
    () => {
      sendBurst();
    };

  const handleLoad =
    () => {
      sendBurst();
    };

  window.addEventListener(
    "resize",
    handleViewportChange
  );

  window.addEventListener(
    "orientationchange",
    handleViewportChange
  );

  window.addEventListener(
    "load",
    handleLoad
  );

  document
    .querySelectorAll("img")
    .forEach((image) => {
      if (!image.complete) {
        image.addEventListener(
          "load",
          sendBurst
        );

        image.addEventListener(
          "error",
          sendBurst
        );
      }
    });

  document
    .querySelectorAll("video")
    .forEach((video) => {
      video.addEventListener(
        "loadedmetadata",
        sendBurst
      );

      video.addEventListener(
        "loadeddata",
        sendBurst
      );
    });

  if (document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        sendBurst();
      })
      .catch(() => {});
  }

  sendBurst();

  return () => {
    resizeObserver.disconnect();

    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    window.removeEventListener(
      "resize",
      handleViewportChange
    );

    window.removeEventListener(
      "orientationchange",
      handleViewportChange
    );

    window.removeEventListener(
      "load",
      handleLoad
    );

    timers.forEach((timer) => {
      clearTimeout(timer);
    });

    timers.clear();

    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );
    }
  };
}