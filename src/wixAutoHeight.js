const MESSAGE_TYPE = "VITE_AUTO_HEIGHT";

function getHTMLElementChildren(element) {
  return Array.from(
    element.children
  ).filter(
    (child) =>
      child instanceof HTMLElement
  );
}

/*
  Measures the actual rendered content inside a root child.

  This is intentionally different from simply measuring the
  root child's own bounding box.

  Example:

  #root
    <main class="featured-programs-section">
      <header />
      <section class="featured-programs-grid" />
    </main>

  If <main> has min-height: 100vh / 100dvh, its bounding box
  can be taller than the header + grid. That extra wrapper
  height can appear as blank space at the bottom of a Wix
  iframe.

  Instead, when a root child contains normal layout children,
  we measure those children and use their actual bottom edge.
*/
function getActualElementBottom(element) {
  const elementRect =
    element.getBoundingClientRect();

  const children =
    getHTMLElementChildren(element);

  /*
    Leaf elements can safely use their own rendered box.
  */
  if (children.length === 0) {
    return elementRect.bottom;
  }

  let actualBottom =
    elementRect.top;

  children.forEach((child) => {
    const childStyle =
      window.getComputedStyle(child);

    /*
      Fixed elements do not contribute to document height.
    */
    if (
      childStyle.position === "fixed"
    ) {
      return;
    }

    const childRect =
      child.getBoundingClientRect();

    actualBottom = Math.max(
      actualBottom,
      childRect.bottom
    );
  });

  /*
    Preserve intentional bottom padding on the wrapper.

    In your featured programs project this is currently 0,
    but keeping this here makes the helper reusable.
  */
  const elementStyle =
    window.getComputedStyle(element);

  const paddingBottom =
    Number.parseFloat(
      elementStyle.paddingBottom
    ) || 0;

  return (
    actualBottom +
    paddingBottom
  );
}

function getContentHeight() {
  const root =
    document.getElementById("root");

  if (!root) {
    return 0;
  }

  const rootRect =
    root.getBoundingClientRect();

  const children =
    getHTMLElementChildren(root);

  /*
    Measure the actual rendered layout inside #root.

    IMPORTANT:

    We intentionally do NOT use:
      document.documentElement.scrollHeight
      document.body.scrollHeight
      root.scrollHeight

    In an iframe those values can inherit or reflect the
    iframe viewport height.

    We also no longer blindly use the bounding box of the
    direct #root child, because a wrapper using:

      min-height: 100vh;
      min-height: 100dvh;

    can be taller than its actual visible content.

    Instead, getActualElementBottom() looks at the wrapper's
    real layout children.
  */
  if (children.length > 0) {
    let contentBottom =
      rootRect.top;

    children.forEach((element) => {
      contentBottom = Math.max(
        contentBottom,
        getActualElementBottom(element)
      );
    });

    return Math.ceil(
      Math.max(
        0,
        contentBottom -
          rootRect.top
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

  const timers =
    new Set();

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
          event.origin before accepting the message.

          Using "*" on the sending side avoids a
          referrer/preview origin mismatch preventing a
          shrink message from reaching Wix.
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
    const timer =
      setTimeout(
        () => {
          timers.delete(timer);

          sendHeight(force);
        },
        delay
      );

    timers.add(timer);
  };

  /*
    Send several measurements while the page settles.

    This is especially useful for:

    - Wix breakpoint changes
    - iframe resizing
    - custom fonts
    - video metadata
    - images
    - React layout
    - browser scaling
  */
  const clearQueuedSends =
    () => {
      timers.forEach(
        (timer) => {
          clearTimeout(timer);
        }
      );

      timers.clear();
    };

  const sendBurst = () => {
    clearQueuedSends();

    sendHeight(true);

    queueSend(
      50,
      true
    );

    queueSend(
      120,
      true
    );

    queueSend(
      250,
      true
    );

    queueSend(
      500,
      true
    );

    queueSend(
      900,
      true
    );

    queueSend(
      1500,
      true
    );

    /*
      One additional late measurement.

      This helps with Wix / browser combinations where
      breakpoint layout or custom fonts settle slightly
      later than expected.
    */
    queueSend(
      2200,
      true
    );
  };

  const root =
    document.getElementById(
      "root"
    );

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
      !(element instanceof HTMLElement) ||
      observedElements.has(element)
    ) {
      return;
    }

    observedElements.add(
      element
    );

    resizeObserver.observe(
      element
    );
  };

  /*
    Observe the root, its direct wrapper, and that wrapper's
    direct layout children.

    For featured_programs_section this means we directly
    observe:

      #root
      .featured-programs-section
      .featured-programs-header
      .featured-programs-grid

    That is important because the grid can resize without
    the viewport-sized outer wrapper giving us a useful
    content measurement.
  */
  const observeLayoutTree =
    () => {
      if (!root) {
        observeElement(
          document.body
        );

        return;
      }

      observeElement(root);

      getHTMLElementChildren(
        root
      ).forEach(
        (rootChild) => {
          observeElement(
            rootChild
          );

          getHTMLElementChildren(
            rootChild
          ).forEach(
            (layoutChild) => {
              observeElement(
                layoutChild
              );
            }
          );
        }
      );
    };

  observeLayoutTree();

  /*
    React may add or replace elements after initialization.

    Observe the subtree so newly-created layout containers
    are also picked up.
  */
  const mutationObserver =
    root
      ? new MutationObserver(
          () => {
            observeLayoutTree();
            sendBurst();
          }
        )
      : null;

  if (
    root &&
    mutationObserver
  ) {
    mutationObserver.observe(
      root,
      {
        childList: true,
        subtree: true,
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

  /*
    Media elements can change their rendered dimensions
    after the first React paint.
  */
  const attachMediaListeners =
    () => {
      document
        .querySelectorAll("img")
        .forEach((image) => {
          if (
            image.dataset
              .wixAutoHeightObserved ===
            "true"
          ) {
            return;
          }

          image.dataset
            .wixAutoHeightObserved =
            "true";

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
          if (
            video.dataset
              .wixAutoHeightObserved ===
            "true"
          ) {
            return;
          }

          video.dataset
            .wixAutoHeightObserved =
            "true";

          video.addEventListener(
            "loadedmetadata",
            sendBurst
          );

          video.addEventListener(
            "loadeddata",
            sendBurst
          );
        });
    };

  attachMediaListeners();

  /*
    React may insert the media after this helper starts.
  */
  if (root) {
    const mediaMutationObserver =
      new MutationObserver(
        () => {
          attachMediaListeners();
        }
      );

    mediaMutationObserver.observe(
      root,
      {
        childList: true,
        subtree: true,
      }
    );

    /*
      Store it so cleanup can disconnect it.
    */
    root.__wixAutoHeightMediaObserver =
      mediaMutationObserver;
  }

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

    if (
      root?.__wixAutoHeightMediaObserver
    ) {
      root
        .__wixAutoHeightMediaObserver
        .disconnect();

      delete root
        .__wixAutoHeightMediaObserver;
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

    timers.forEach(
      (timer) => {
        clearTimeout(timer);
      }
    );

    timers.clear();

    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );
    }
  };
}