"use client";
import React, { useState } from "react";
import Link from "next/link";
import ComingSoonBadge from "../Common/ComingSoonBadge";

interface NavItemData {
  icon: string;
  filledIcon?: string;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  link?: string;
  hasSubmenu?: boolean;
  submenuType?: string;
  badgeCount?: number;
  group?: string;
  groupIcon?: string;
  groupFilledIcon?: string;
}

interface NavSectionsProps {
  sections: NavItemData[];
  onItemClick?: (itemIndex: number) => void;
  onSubmenuClick?: (itemIndex: number) => void;
}

interface NavItemProps {
  icon: string;
  filledIcon?: string;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  hasSubmenu?: boolean;
  href?: string;
  onClick?: () => void;
  onSubmenuClick?: () => void;
  badgeCount?: number;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  filledIcon,
  label,
  isActive = false,
  disabled = false,
  hasSubmenu = false,
  href,
  onClick,
  onSubmenuClick,
  badgeCount,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const showActiveState = isActive || isHovered;
  const shouldShowFilledIcon = showActiveState && filledIcon;

  const content = (
    <>
      <img
        src={shouldShowFilledIcon ? filledIcon : icon}
        alt=""
        className={`object-contain shrink-0 transition-all duration-200 ease-in-out ${!showActiveState ? "w-5 h-5" : "w-6 h-6"}`}
      />
      <span
        className={`flex-1 shrink self-stretch my-auto basis-0 text-left transition-colors duration-200 ease-in-out ${
          showActiveState ? "text-text-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </span>
      {disabled && <ComingSoonBadge size="small" />}
      {badgeCount !== undefined && badgeCount > 0 && (
        <div className="text-white rounded-full bg-red-600 w-8 h-6 flex items-center justify-center text-sm font-semibold">
          {badgeCount}
        </div>
      )}
    </>
  );

  const sharedClasses = `flex gap-3 items-center h-11 p-2.5 w-full whitespace-nowrap rounded-xl transition-all duration-200 ease-in-out justify-between ${disabled ? "cursor-not-allowed" : "cursor-pointer"} focus:outline-none`;
  const sharedStyle = {
    borderRadius: showActiveState ? "8px" : "12px",
    borderBottom: showActiveState ? "1px solid var(--primary-divider)" : "1px solid transparent",
    background: showActiveState ? "var(--background)" : "transparent",
    transition: "all 200ms ease-in-out",
  };

  // Use <Link> for navigation items, <button> for submenu/disabled
  const inner = (!disabled && !hasSubmenu && href != null) ? (
    <Link
      href={href}
      className={sharedClasses}
      style={sharedStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      prefetch={true}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className={sharedClasses}
      style={sharedStyle}
      aria-label={label}
      onClick={() => {
        if (disabled) return;
        if (hasSubmenu) onSubmenuClick?.();
        else onClick?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </button>
  );

  return (
    <div className="flex flex-row gap-2 w-full">
      <div
        className="self-center transition-all duration-200 ease-in-out"
        style={{
          borderRadius: "0 2px 2px 0",
          background: showActiveState ? "var(--bg-surface-blue-600, #066EFF)" : "transparent",
          width: "4px",
          height: "20px",
          transform: showActiveState ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "center",
        }}
      />
      {inner}
    </div>
  );
};

export const NavSections: React.FC<NavSectionsProps> = ({ sections, onItemClick, onSubmenuClick }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group if any child is active
  React.useEffect(() => {
    const activeGroups: Record<string, boolean> = {};
    sections.forEach(item => {
      if (item.group && item.isActive) {
        activeGroups[item.group] = true;
      }
    });
    setExpandedGroups(prev => ({ ...prev, ...activeGroups }));
  }, [sections]);

  // Collect groups: { groupName -> indices[] }
  const groups = new Map<string, number[]>();
  const rendered = new Set<number>();

  sections.forEach((item, idx) => {
    if (item.group) {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group)!.push(idx);
    }
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="flex gap-1 flex-col w-full pr-3">
      {sections.map((item, itemIdx) => {
        if (rendered.has(itemIdx)) return null;

        // If item belongs to a group and is the first in that group, render the collapsible group
        if (item.group && groups.has(item.group)) {
          const groupIndices = groups.get(item.group)!;
          if (groupIndices[0] !== itemIdx) return null; // skip non-first items, they're rendered by the group

          const groupName = item.group;
          const isExpanded = !!expandedGroups[groupName];
          const hasActiveChild = groupIndices.some(i => sections[i].isActive);
          groupIndices.forEach(i => rendered.add(i));

          return (
            <React.Fragment key={`group-${groupName}`}>
              {/* Group toggle button */}
              <div className="flex flex-row gap-2 w-full">
                <div
                  className="self-center transition-all duration-200 ease-in-out"
                  style={{
                    borderRadius: "0 2px 2px 0",
                    background: hasActiveChild ? "var(--bg-surface-blue-600, #066EFF)" : "transparent",
                    width: "4px",
                    height: "20px",
                    transform: hasActiveChild ? "scaleY(1)" : "scaleY(0)",
                    transformOrigin: "center",
                  }}
                />
                <button
                  type="button"
                  className={`flex gap-3 items-center h-11 p-2.5 w-full whitespace-nowrap rounded-xl transition-all duration-200 ease-in-out justify-between cursor-pointer focus:outline-none`}
                  style={{
                    borderRadius: hasActiveChild || isExpanded ? "8px" : "12px",
                    borderBottom: hasActiveChild ? "1px solid var(--primary-divider)" : "1px solid transparent",
                    background: hasActiveChild ? "var(--background)" : "transparent",
                  }}
                  onClick={() => toggleGroup(groupName)}
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={hasActiveChild && item.groupFilledIcon ? item.groupFilledIcon : (item.groupIcon || item.icon)}
                      alt=""
                      className={`object-contain shrink-0 transition-all duration-200 ease-in-out ${hasActiveChild ? "w-6 h-6" : "w-5 h-5"}`}
                    />
                    <span className={`text-left transition-colors duration-200 ease-in-out ${hasActiveChild ? "text-text-primary" : "text-text-secondary"}`}>
                      {groupName}
                    </span>
                  </div>
                  <img
                    src="/arrow/chevron-down.svg"
                    alt=""
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Group children */}
              <div
                className={`flex flex-col gap-1 pl-4 overflow-hidden transition-all duration-200 ${
                  isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {groupIndices.map(childIdx => {
                  const child = sections[childIdx];
                  return (
                    <NavItem
                      key={childIdx}
                      icon={child.icon}
                      filledIcon={child.filledIcon}
                      label={child.label}
                      isActive={child.isActive}
                      disabled={child.disabled}
                      hasSubmenu={child.hasSubmenu}
                      href={child.link != null ? `/${child.link}` : undefined}
                      badgeCount={child.badgeCount}
                      onClick={() => onItemClick?.(childIdx)}
                      onSubmenuClick={() => onSubmenuClick?.(childIdx)}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          );
        }

        // Regular (non-grouped) item
        return (
          <NavItem
            key={itemIdx}
            icon={item.icon}
            filledIcon={item.filledIcon}
            label={item.label}
            isActive={item.isActive}
            disabled={item.disabled}
            hasSubmenu={item.hasSubmenu}
            href={item.link != null ? `/${item.link}` : undefined}
            badgeCount={item.badgeCount}
            onClick={() => onItemClick?.(itemIdx)}
            onSubmenuClick={() => onSubmenuClick?.(itemIdx)}
          />
        );
      })}
    </div>
  );
};
