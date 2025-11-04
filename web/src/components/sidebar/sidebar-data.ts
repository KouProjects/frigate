import {
  Activity,
  Construction,
  Download,
  HardDrive,
  Search,
  Settings,
  Play,
  Clapperboard,
  Wrench,
  Users,
  Tag,
} from "lucide-react";
import { IconType } from "react-icons";

export const ID_LIVE = 1;
export const ID_REVIEW = 2;
export const ID_EXPLORE = 3;
export const ID_EXPORT = 4;
export const ID_PLAYGROUND = 5;
export const ID_FACE_LIBRARY = 6;
export const ID_CLASSIFICATION = 7;

export interface NavItem {
  id?: number;
  title: string;
  url: string;
  icon: IconType;
  isActive?: boolean;
  enabled?: boolean;
  titleKey?: string;
}

export interface SidebarData {
  main: NavItem[];
  system: NavItem[];
}

export const sidebarData: SidebarData = {
  main: [
    {
      id: ID_LIVE,
      title: "Live",
      url: "/",
      icon: Play,
      titleKey: "menu.live.title",
    },
    {
      id: ID_REVIEW,
      title: "Review",
      url: "/review",
      icon: Clapperboard,
      titleKey: "menu.review",
    },
    {
      id: ID_EXPLORE,
      title: "Explore",
      url: "/explore",
      icon: Search,
      titleKey: "menu.explore",
    },
    {
      id: ID_EXPORT,
      title: "Exports",
      url: "/export",
      icon: Download,
      titleKey: "menu.export",
    },
    {
      id: ID_PLAYGROUND,
      title: "UI Playground",
      url: "/playground",
      icon: Wrench,
      titleKey: "menu.uiPlayground",
      // enabled: false, // Will be set dynamically in useNavigation
    },
    {
      id: ID_FACE_LIBRARY,
      title: "Face Library",
      url: "/faces",
      icon: Users,
      titleKey: "menu.faceLibrary",
      // enabled: false, // Will be set dynamically in useNavigation
    },
    {
      id: ID_CLASSIFICATION,
      title: "Classification",
      url: "/classification",
      icon: Tag,
      titleKey: "menu.classification",
      // enabled: false, // Will be set dynamically in useNavigation
    },
  ],
  system: [
    {
      title: "System",
      url: "/system",
      icon: Activity,
    },
    {
      title: "Config",
      url: "/config",
      icon: HardDrive,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: Construction,
    },
  ],
};
