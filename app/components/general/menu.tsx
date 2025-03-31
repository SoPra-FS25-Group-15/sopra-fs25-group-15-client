import { Button } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

/**
 * Represents a single item within a menu.
 *
 * A {@link MenuItem} can be used to define a navigation item or a button action within a menu.
 * It provides optional properties for specifying a navigation link, an onClick handler,
 * and a subview which can be used to render additional content such as tags.
 *
 * @property label - The text displayed for the menu item.
 * @property link - `Optional` An URL that the menu item navigates to when clicked.
 * @property onClick - `Optional` A callback function that handles click events on the menu item.
 * @property subview - `Optional` A React node that represents an additional view or nested menu.
 */
export interface MenuItem {
  label: string;
  link?: string;
  onClick?: () => void;
  subview?: React.ReactNode;
}

//CSS styles for the menu item
const menuItemStyle: React.CSSProperties = {
  margin: 0,
  padding: 8,
  height: "fit-content",
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const MenuItem: React.FC<MenuItem> = ({ label, link, onClick, subview }: MenuItem): React.ReactElement => {
  const pathname = usePathname();
  const current = pathname === link;
  // If a link is provided, wrap element is a Link component
  if (link) {
    return (
      <li style={{ listStyle: "none" }}>
        <Link href={link}>
          <Button type={current ? "text" : "link"} style={menuItemStyle}>
            {label}
            {subview ? subview : ""}
          </Button>
        </Link>
      </li>
    );
  }

  // If an onClick handler is provided, set onClick to the handler
  if (onClick) {
    return (
      <li style={{ listStyle: "none" }}>
        <Button type="link" onClick={onClick} style={menuItemStyle}>
          {label}
          {subview ? subview : ""}
        </Button>
      </li>
    );
  }

  // If neither link nor onClick is provided, render a simple text item
  return (
    <li style={{ listStyle: "none" }}>
      <span style={menuItemStyle}>
        {label}
        {subview ? subview : ""}
      </span>
    </li>
  );
};

/**
 * Creates a menu.
 *
 * @property items - An array of {@link MenuItem}.
 * @property horizontal - `Optional` Flag indicating if the menu is displayed horizontally.
 */
export type Menu = {
  items: MenuItem[];
  horizontal?: boolean;
};

const Menu: React.FC<Menu> = ({ items, horizontal }) => {
  return (
    <ul
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        gap: horizontal ? 16 : 2,
        alignItems: horizontal ? "center" : "flex-start",
        listStyle: "none",
      }}
    >
      {items.map((item, index) => (
        <MenuItem key={index} link={item.link} label={item.label} onClick={item.onClick} subview={item.subview} />
      ))}
    </ul>
  );
};

export default Menu;
