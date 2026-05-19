import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("clipforgeDesktop", {
  isDesktop: true,
});
