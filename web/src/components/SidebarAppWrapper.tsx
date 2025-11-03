import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./sidebar/AppSidebar";

interface SidebarAppLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

interface BreadcrumbItem {
  path: string;
  name: string;
}

export type { BreadcrumbItem };

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  contentPadding?: boolean;
  showBackButton?: boolean;
}

const BreadcrumbNav = ({
  customBreadcrumbs,
}: {
  customBreadcrumbs?: BreadcrumbItem[];
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const paths = pathname?.split("/").filter(Boolean) || [];

  const formatPathName = (path: string) => {
    const decodedPath = decodeURIComponent(path)
      .toLowerCase()
      .replace(/-/g, " ");
    return decodedPath.charAt(0).toUpperCase() + decodedPath.slice(1);
  };

  // Use custom breadcrumbs if provided, otherwise generate from path
  const breadcrumbItems =
    customBreadcrumbs ||
    paths.map((path, index) => ({
      path: `/${paths.slice(0, index + 1).join("/")}`,
      name: formatPathName(path),
    }));

  if (!breadcrumbItems || breadcrumbItems.length <= 3) {
    return (
      <>
        {breadcrumbItems?.map((item, index) => (
          <React.Fragment key={`fragment-${item.path}`}>
            {index === breadcrumbItems.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={item.path}>{item.name}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
          </React.Fragment>
        ))}
      </>
    );
  }

  return (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink href={breadcrumbItems[0]?.path}>
          {breadcrumbItems[0]?.name}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            <BreadcrumbEllipsis className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {breadcrumbItems.slice(1, -2).map((item) => (
              <DropdownMenuItem key={item.path} asChild>
                <Link to={item.path}>{item.name}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink
          href={breadcrumbItems[breadcrumbItems.length - 2]?.path}
        >
          {breadcrumbItems[breadcrumbItems.length - 2]?.name}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>
          {breadcrumbItems[breadcrumbItems.length - 1]?.name}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
};

export const SidebarAppHeader = React.forwardRef<
  HTMLDivElement,
  SidebarHeaderProps
>(
  (
    { children, showBreadcrumbs = true, breadcrumbs, className, ...props },
    ref,
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          "supports-backdrop-filter:bg-background/60 sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />

          {showBreadcrumbs && (
            <>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbNav customBreadcrumbs={breadcrumbs} />
                </BreadcrumbList>
              </Breadcrumb>
            </>
          )}
        </div>
        {children}
      </header>
    );
  },
);

SidebarAppHeader.displayName = "SidebarAppHeader";

export const SidebarAppContent = React.forwardRef<
  HTMLElement,
  SidebarContentProps
>(
  (
    {
      children,
      className,
      title,
      description,
      showBackButton,
      contentPadding,
      ...props
    },
    ref,
  ) => {
    const navigate = useNavigate();

    return (
      <main
        ref={ref}
        className={cn(
          "flex flex-1 flex-col",
          className,
          contentPadding && "p-4 lg:p-14",
        )}
        {...props}
      >
        <div className={cn("space-y-4", contentPadding && "mb-6")}>
          {showBackButton && (
            <Button
              onClick={() => navigate(-1)}
              className="group"
              variant="outline"
            >
              <ArrowLeft className="mr-2 size-5 transition-all group-hover:-translate-x-0.5" />
              Back
            </Button>
          )}
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {children}
      </main>
    );
  },
);

SidebarAppContent.displayName = "SidebarAppContent";

export const SidebarAppLayout = React.forwardRef<
  HTMLDivElement,
  SidebarAppLayoutProps
>(({ children, className, ...props }, ref) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div
          ref={ref}
          className={cn("flex min-h-screen flex-col", className)}
          {...props}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
});

SidebarAppLayout.displayName = "SidebarAppLayout";
