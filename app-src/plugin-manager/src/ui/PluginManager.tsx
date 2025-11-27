import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PluginList from "./PluginList";
import type { Plugin } from "../../../types";
import "../style.css";
import Window from "./Window";
import Card from "../../../components/Card";
import TabButton from "../../../components/TabButton";

function ToolbarButton({ onClick }: { onClick: () => void }) {
  const [toolbarNode, setToolbarNode] = useState<Element | null>(null);
  const [container] = useState(() => document.createElement("div"));

  useEffect(() => {
    function wait() {
      const toolbar = document.querySelector(".p-control_strip");
      if (toolbar) {
        setToolbarNode(toolbar);
        toolbar.insertBefore(container, toolbar.firstChild);
      } else {
        setTimeout(wait, 100);
      }
    }
    wait();
  }, []);
  if (!toolbarNode) {
    return null;
  }

  container.style.marginBottom = "-8px";

  return createPortal(
    <button
      id="slackmod-trigger"
      className="c-button-unstyled p-control_strip__circle_button p-control_strip__create_button"
      onClick={onClick}
    >
      <div className="p-control_strip__create_button__icon icon_container">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          style={{
            transform: "translateY(2px)",
          }}
        >
          <path
            fill="currentColor"
            d="M13.3636 5.25C12.2716 5.25 11.3864 6.13525 11.3864 7.22727V7.97727L7.97727 7.97727L7.97727 11.3864H7.22727C6.13526 11.3864 5.25 12.2716 5.25 13.3636C5.25 14.4557 6.13526 15.3409 7.22727 15.3409H7.97727L7.97727 18.75L18.75 18.75V16.7598C17.1901 16.4169 16.0227 15.0266 16.0227 13.3636C16.0227 11.7007 17.1901 10.3104 18.75 9.96745V7.97727L15.3409 7.97727V7.22727C15.3409 6.13526 14.4557 5.25 13.3636 5.25ZM9.96745 6.47727C10.3104 4.91733 11.7007 3.75 13.3636 3.75C15.0266 3.75 16.4169 4.91733 16.7598 6.47727L20.25 6.47727V11.3864L19.5 11.3864C18.408 11.3864 17.5227 12.2716 17.5227 13.3636C17.5227 14.4557 18.408 15.3409 19.5 15.3409H20.25V20.25L6.47727 20.25L6.47727 16.7598C4.91733 16.4169 3.75 15.0266 3.75 13.3636C3.75 11.7007 4.91733 10.3104 6.47727 9.96745L6.47727 6.47727L9.96745 6.47727Z"
          />
        </svg>
      </div>
    </button>,
    container,
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  const Tabs = ["plugins", "themes"];

  const [focusedTab, setFocusedTab] = useState(Tabs[0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const id = setInterval(() => {
      const list = (window as any).slackmod_custom.getPluginList();
      setPlugins(list);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <>
      <ToolbarButton
        onClick={() => {
          console.log("Opening plugin manager");
          setOpen(true);
        }}
      />

      <div
        id="slackmod-overlay"
        className={`slackmod-overlay ${open ? "open" : ""}`}
        onClick={(e) => {
          if (
            e.target instanceof HTMLElement &&
            e.target.id === "slackmod-overlay"
          ) {
            setOpen(false);
          }
        }}
        hidden={!open}
      >
        {open && (
          <Window title="slack-plugin-thingy" onClose={() => setOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                  padding: 16,
                  marginBottom: -16,
                }}
              >
                <Card width={180} height={250} backgroundColor="mojito" />
                <Card width={180} height={250} backgroundColor="campfire" />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <Card
                    width={180}
                    height={120}
                    backgroundColor="aquarium"
                    imageSrc="https://picsum.photos/id/598/200/300"
                  />
                  <Card
                    width={180}
                    height={120}
                    backgroundColor="aubergine"
                    title="Reload slack </>"
                    onClick={() => {
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                }}
              >
                <div className="tabs_buttons">
                  {Tabs.map((tab) => (
                    <TabButton
                      key={tab}
                      label={tab.charAt(0).toUpperCase() + tab.slice(1)}
                      active={focusedTab === tab}
                      onClick={() => setFocusedTab(tab)}
                    />
                  ))}
                </div>
                <div className="tabs_content">
                  {focusedTab === "plugins" && <PluginList plugins={plugins} />}
                  {focusedTab === "themes" && (
                    <div style={{ color: "#ababad" }}>No themes yet.</div>
                  )}
                </div>
              </div>
            </div>
          </Window>
        )}
      </div>
    </>
  );
}
