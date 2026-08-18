const MESSAGE_TYPE = "VITE_AUTO_HEIGHT";

function getParentOrigin() {
  try {
    if (!document.referrer) {
      return "*";
    }

    return new URL(
      document.referrer
    ).origin;
  } catch {
    return "*";
  }
}

function getContentHeight() {
  const root =
    document.getElementById("root");

  if (root) {
    return Math.floor(
      root.getBoundingClientRect()
        .height
    );
  }

  return Math.ceil(
    Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    )
  );
}

export function initWixAutoHeight() {
  if (window.parent === window) {
    return;
  }

  const parentOrigin =
    getParentOrigin();

  let lastHeight = 0;
  let animationFrame = null;

  const sendHeight = () => {
    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );
    }

    animationFrame =
      requestAnimationFrame(() => {
        const height =
          getContentHeight();

        if (
          !height ||
          height === lastHeight
        ) {
          return;
        }

        lastHeight = height;

        window.parent.postMessage(
          {
            type: MESSAGE_TYPE,
            height,
            pathname:
              window.location.pathname,
          },
          parentOrigin
        );
      });
  };

  sendHeight();

  requestAnimationFrame(
    sendHeight
  );

  setTimeout(sendHeight, 100);
  setTimeout(sendHeight, 300);
  setTimeout(sendHeight, 750);
  setTimeout(sendHeight, 1500);

  const root =
    document.getElementById("root");

  const resizeObserver =
    new ResizeObserver(() => {
      sendHeight();
    });

  if (root) {
    resizeObserver.observe(root);
  } else {
    resizeObserver.observe(
      document.body
    );
  }

  window.addEventListener(
    "resize",
    sendHeight
  );

  document
    .querySelectorAll("img")
    .forEach((image) => {
      if (!image.complete) {
        image.addEventListener(
          "load",
          sendHeight
        );

        image.addEventListener(
          "error",
          sendHeight
        );
      }
    });

  if (document.fonts?.ready) {
    document.fonts.ready
      .then(sendHeight)
      .catch(() => {});
  }

  return () => {
    resizeObserver.disconnect();

    window.removeEventListener(
      "resize",
      sendHeight
    );

    if (animationFrame) {
      cancelAnimationFrame(
        animationFrame
      );
    }
  };
}