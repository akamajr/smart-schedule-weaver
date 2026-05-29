import { useEffect, useState } from "react";

export const useFullscreenPortalContainer = () => {
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    const sync = () => {
      setContainer(document.fullscreenElement instanceof HTMLElement ? document.fullscreenElement : undefined);
    };

    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  return container;
};
