import { useState, useMemo, useCallback } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LuPlus } from "react-icons/lu";
import { MdHome } from "react-icons/md";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import useSWR from "swr";
import { FrigateConfig } from "@/types/frigateConfig";
import { usePersistedOverlayState } from "@/hooks/use-overlay-state";
import { useTranslation } from "react-i18next";
import * as LuIcons from "react-icons/lu";
import { isValidIconName } from "@/utils/iconUtil";
import { IconRenderer } from "@/components/icons/IconPicker";
import { isDesktop } from "react-device-detect";
import { NewGroupDialog } from "@/components/filter/CameraGroupSelector";

export function CameraGroupNavItem() {
  const { t } = useTranslation(["components/camera"]);
  const { data: config } = useSWR<FrigateConfig>("config");

  // tooltip
  const [tooltip, setTooltip] = useState<string>();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const showTooltip = useCallback(
    (newTooltip: string | undefined) => {
      if (!newTooltip) {
        setTooltip(newTooltip);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } else {
        setTimeoutId(setTimeout(() => setTooltip(newTooltip), 500));
      }
    },
    [timeoutId],
  );

  // groups
  const [group, setGroup, , deleteGroup] = usePersistedOverlayState(
    "cameraGroup",
    "default" as string,
  );

  const groups = useMemo(() => {
    if (!config) {
      return [];
    }
    return Object.entries(config.camera_groups).sort(
      (a, b) => a[1].order - b[1].order,
    );
  }, [config]);

  // add group
  const [addGroup, setAddGroup] = useState(false);

  return (
    <>
      <NewGroupDialog
        open={addGroup}
        setOpen={setAddGroup}
        currentGroups={groups}
        activeGroup={group}
        setGroup={setGroup}
        deleteGroup={deleteGroup}
      />

      <SidebarGroup>
        <div className="flex items-center justify-between px-2">
          <SidebarGroupLabel className="m-0">
            {t("group.label")}
          </SidebarGroupLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setAddGroup(true)}
                size="icon"
                variant="ghost"
                className="h-6 w-6"
              >
                <LuPlus className="text-primary size-4" />
              </Button>
            </TooltipTrigger>
            {isDesktop && (
              <TooltipPortal>
                <TooltipContent side="right" className="text-xs">
                  {t("group.add")}
                </TooltipContent>
              </TooltipPortal>
            )}
          </Tooltip>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-0">
              <Tooltip open={tooltip == "default"}>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => (group ? setGroup("default", true) : null)}
                    onMouseEnter={() =>
                      isDesktop ? showTooltip("default") : null
                    }
                    onMouseLeave={() =>
                      isDesktop ? showTooltip(undefined) : null
                    }
                    isActive={group === "default"}
                    className="flex-1"
                  >
                    <MdHome className="size-4" />
                    <span>{t("menu.live.allCameras", { ns: "common" })}</span>
                  </SidebarMenuButton>
                </TooltipTrigger>
                {isDesktop && (
                  <TooltipPortal>
                    <TooltipContent side="right">
                      {t("menu.live.allCameras", { ns: "common" })}
                    </TooltipContent>
                  </TooltipPortal>
                )}
              </Tooltip>
            </div>
          </SidebarMenuItem>

          {groups.map(([name, groupConfig]) => (
            <SidebarMenuItem key={name}>
              <div className="flex w-full items-center gap-0">
                <Tooltip open={tooltip == name}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => setGroup(name, group != "default")}
                      onMouseEnter={() =>
                        isDesktop ? showTooltip(name) : null
                      }
                      onMouseLeave={() =>
                        isDesktop ? showTooltip(undefined) : null
                      }
                      isActive={group === name}
                      className="flex-1"
                    >
                      {groupConfig &&
                        groupConfig.icon &&
                        isValidIconName(groupConfig.icon) && (
                          <IconRenderer
                            icon={LuIcons[groupConfig.icon]}
                            className="size-4"
                          />
                        )}
                      <span className="smart-capitalize">{name}</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isDesktop && (
                    <TooltipPortal>
                      <TooltipContent className="smart-capitalize" side="right">
                        {name}
                      </TooltipContent>
                    </TooltipPortal>
                  )}
                </Tooltip>
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
