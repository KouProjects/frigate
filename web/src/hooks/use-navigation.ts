import { ENV } from "@/env";
import { FrigateConfig } from "@/types/frigateConfig";
import { NavData } from "@/types/navigation";
import { useMemo } from "react";
import { isDesktop } from "react-device-detect";
import {
  ID_LIVE,
  ID_REVIEW,
  ID_EXPLORE,
  ID_EXPORT,
  ID_PLAYGROUND,
  ID_FACE_LIBRARY,
  ID_CLASSIFICATION,
  sidebarData,
} from "@/components/sidebar/sidebar-data";
import useSWR from "swr";
import { useIsAdmin } from "./use-is-admin";

export const ID_LIVE_HOOK = ID_LIVE;
export const ID_REVIEW_HOOK = ID_REVIEW;
export const ID_EXPLORE_HOOK = ID_EXPLORE;
export const ID_EXPORT_HOOK = ID_EXPORT;
export const ID_PLAYGROUND_HOOK = ID_PLAYGROUND;
export const ID_FACE_LIBRARY_HOOK = ID_FACE_LIBRARY;
export const ID_CLASSIFICATION_HOOK = ID_CLASSIFICATION;

export default function useNavigation(
  variant: "primary" | "secondary" = "primary",
) {
  const { data: config } = useSWR<FrigateConfig>("config", {
    revalidateOnFocus: false,
  });
  const isAdmin = useIsAdmin();

  return useMemo(
    () =>
      sidebarData.main
        .map((item) => ({
          id: item.id || 0,
          variant,
          icon: item.icon,
          title: item.titleKey || item.title,
          url: item.url,
          enabled: item.enabled ?? true,
        }))
        .map((item) => {
          // Apply dynamic conditions
          if (item.id === ID_PLAYGROUND && ENV === "production") {
            return { ...item, enabled: false };
          }
          if (
            item.id === ID_FACE_LIBRARY &&
            (!isDesktop || !config?.face_recognition?.enabled || !isAdmin)
          ) {
            return { ...item, enabled: false };
          }
          if (item.id === ID_CLASSIFICATION && (!isDesktop || !isAdmin)) {
            return { ...item, enabled: false };
          }
          return item;
        }) as NavData[],
    [config?.face_recognition?.enabled, variant, isAdmin],
  );
}
