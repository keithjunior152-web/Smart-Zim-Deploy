import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type MermaidApi = typeof import("mermaid")["default"];

let mermaidPromise: Promise<MermaidApi> | null = null;
function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      const m = mod.default;
      m.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
        fontFamily: "Inter, system-ui, sans-serif",
      });
      return m;
    });
  }
  return mermaidPromise;
}

function MermaidDiagram({ code }: { code: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string>("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadMermaid()
      .then((m) => m.render(`mmd-${rawId}`, code))
      .then(({ svg }) => {
        if (active) {
          setSvg(svg);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [code, rawId]);

  if (failed) {
    return (
      <pre className="bg-slate-900! text-slate-100! p-3 rounded-lg my-2 overflow-x-auto text-xs">
        <code className="text-slate-100!">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="my-3 flex justify-center overflow-x-auto rounded-lg bg-white p-3"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="markdown-body text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-pre:my-2 prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1 break-words"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre(props) {
            // Unwrap react-markdown's default <pre> so the `code` handler below
            // fully controls block rendering (avoids nesting + prose contrast bugs).
            return <>{props.children}</>;
          },
          code(props) {
            const { className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className ?? "");
            const lang = match?.[1];
            const text = String(children ?? "").replace(/\n$/, "");
            const isInline = !className && !text.includes("\n");

            if (lang === "mermaid") {
              return <MermaidDiagram code={text} />;
            }
            if (isInline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-[0.85em]" {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-slate-900! text-slate-100! p-3 rounded-lg my-2 overflow-x-auto text-xs">
                <code className={`${className ?? ""} text-slate-100!`} {...rest}>
                  {children}
                </code>
              </pre>
            );
          },
          table(props) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="border-collapse text-xs" {...props} />
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownMessage;
