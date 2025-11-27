interface cardProps {
  title?: string;
  imageSrc?: string;
  backgroundColor?: keyof typeof colorsDict;
  width?: number;
  height?: number;
  onClick?: () => void;
}

const colorsDict = {
  aquarium: "--dt_color-plt-aquarium-5",
  aubergine: "--dt_color-plt-aubergine-0",
  campfire: "--dt_color-plt-campfire-5",
  mojito: "--dt_color-plt-mojito-5",
};

export default function Card({
  title = "",
  imageSrc = "",
  backgroundColor,
  width,
  height,
  onClick,
}: cardProps) {
  return (
    <button
      className="c-button-unstyled actionCard__Z29EC animated__Hi2oA"
      style={
        {
          ...(backgroundColor
            ? { backgroundColor: `rgb(var(${colorsDict[backgroundColor]}))` }
            : {}),
          "--width": 180,
          width: width || 180,
          height: height || 180,
        } as React.CSSProperties
      }
      data-qa="action_card_invite"
      aria-label={title || "Card Title"}
      type="button"
      onClick={onClick}
      // style="--width: 180;"
    >
      <div className="header__xDYH3">
        {title != "" && (
          <p className="title__tDet7">
            <span
              className="c-truncate"
              // style="--lines: 2; word-break: break-word;"
              style={
                { "--lines": 2, wordBreak: "break-word" } as React.CSSProperties
              }
            >
              {title}
            </span>
          </p>
        )}
        <p className="description__NZYOf"></p>
      </div>
      {imageSrc && (
        <img className="image__bzQGQinviteImage__jImW1" src={imageSrc} alt="" />
      )}
    </button>
  );
}
