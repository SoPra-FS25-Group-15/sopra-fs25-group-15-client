import React from "react";
import { Button } from "antd";

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

const MenuItem: React.FC<MenuItem> = ({
  label,
  link,
  onClick,
  subview,
}: MenuItem): React.ReactElement => {
  // If a link is provided, set href to the link
  // If an onClick handler is provided, set onClick to the handler
  return (
    <li style={{ listStyle: "none" }}>
      <Button
        type="link"
        href={link ? link : undefined}
        onClick={onClick ? onClick : undefined}
        style={{
          margin: 0,
          padding: 8,
          height: "fit-content",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {label}
        {subview ? subview : ""}
      </Button>
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
        alignItems: "flex-start",
        listStyle: "none",
      }}
    >
      {items.map((item, index) => (
        <MenuItem
          key={index}
          link={item.link}
          label={item.label}
          onClick={item.onClick}
          subview={item.subview}
        />
      ))}
    </ul>
  );
};

export default Menu;
