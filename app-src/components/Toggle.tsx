interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
}

function Toggle({ enabled, onToggle, label = "" }: ToggleProps) {
  return (
    <button
      className={
        "c-button-unstyled p-unreads_toggle" +
        (enabled ? "p-unreads_toggle--selected" : "")
      }
      aria-pressed="true"
      aria-label="Filtrer par messages non lus, 0 non lu(s)"
      type="button"
      onToggle={onToggle}
    >
      <div className="p-unreads_toggle__label">
        <span
          className="c-truncate c-truncate--break_words"
          data-sk="tooltip_parent"
          // style="--lines: 1; word-break: break-all;"
          style={
            { "--lines": 1, wordBreak: "break-all" } as React.CSSProperties
          }
        >
          {label}
        </span>
      </div>
      <div className="p-unreads_toggle__switch">
        <div className="p-unreads_toggle__switch__handle"></div>
      </div>
    </button>
  );
}

export default Toggle;
