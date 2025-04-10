import React, { ReactNode } from "react";

interface ContentProps {
  children: ReactNode;
}

/**
 * A layout component for consistency that wraps its children with horizontal padding.
 *
 * @param {React.ReactNode} props.children - The elements to be rendered within the content container.
 *
 * @example
 * <Content>
 *   <p>This is some content.</p>
 * </Content>
 */
const Content: React.FC<ContentProps> = ({ children }: ContentProps) => {
  return <div style={{ padding: "0 96px" }}>{children}</div>;
};

export default Content;
