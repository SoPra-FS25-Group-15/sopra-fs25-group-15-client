import Link from "next/link";
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
 *
 * A menu item must have either a link or an onClick handler defined.
 */
export type MenuItem = {
  label: string;
  link?: string;
  onClick?: () => void;
  subview?: React.ReactNode;
};

const MenuItem: React.FC<MenuItem> = ({
  label,
  link,
  onClick,
  subview,
}: MenuItem): React.ReactElement => {
  return (
    <li>
      {link ? (
        <Button type="link">
          <Link
            href={link}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            {label}
            {subview ? subview : ""}
          </Link>
        </Button>
      ) : onClick ? (
        <Button type="link" onClick={onClick}>
          {label}
        </Button>
      ) : (
        (() => {
          throw new Error(
            "MenuItem must have either its link or onClick attribute set."
          );
        })()
      )}
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
