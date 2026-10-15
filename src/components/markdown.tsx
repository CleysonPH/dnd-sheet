import { Fragment } from "react";

import { parseMarkdown, type Inline } from "@/lib/markdown";

/*
 * Exibe o Markdown básico (design F4). Todo texto entra como filho de texto do
 * React, que o escapa: HTML digitado aparece literalmente.
 */

function Inlines({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return <Fragment key={index}>{node.text}</Fragment>;
      case "strong":
        return (
          <strong key={index} className="font-semibold">
            <Inlines nodes={node.children} />
          </strong>
        );
      case "em":
        return (
          <em key={index}>
            <Inlines nodes={node.children} />
          </em>
        );
    }
  });
}

export function Markdown({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseMarkdown(text);
  if (blocks.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 text-sm leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  <Inlines nodes={line} />
                </Fragment>
              ))}
            </p>
          );
        }
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            key={index}
            className={`flex flex-col gap-0.5 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Inlines nodes={item} />
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
