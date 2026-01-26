import React from "react";
import { CREST_LEVEL_COLORS, SVG_PATHS } from "../constants";
import { ActivityState } from "../types";

interface MagicCrestProps {
  level: number;
  activity: ActivityState;
  isBranded: boolean;
}

const MagicCrest: React.FC<MagicCrestProps> = ({
  level,
  activity,
  isBranded,
}) => {
  /**
   * 根据进化等级获取 5 种等级的基础状态颜色
   */
  const getCrestStageColors = (lvl: number): string => {
    return CREST_LEVEL_COLORS[lvl] || CREST_LEVEL_COLORS[1];
  };

  const baseColor = isBranded
    ? getCrestStageColors(level)
    : CREST_LEVEL_COLORS[0];

  const getGlowStyle = () => {
    const style: React.CSSProperties = {
      "--glow-color": baseColor,
      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    } as React.CSSProperties;

    if (!isBranded) {
      style.opacity = 0.2;
      return style;
    }

    /* 【配置说明】：此处调整“光晕尺寸” (drop-shadow 的第三个参数) */
    switch (activity) {
      case "沉寂":
        style.filter = `drop-shadow(0 0 4px ${baseColor})`;
        style.opacity = 0.6;
        break;
      case "呼吸":
        style.filter = `drop-shadow(0 0 10px ${baseColor})`;
        break;
      case "充能":
        style.filter = `drop-shadow(0 0 12px ${baseColor}) drop-shadow(0 0 4px white)`;
        break;
      case "满溢":
        style.filter = `drop-shadow(0 0 18px ${baseColor}) drop-shadow(0 0 35px ${baseColor})`;
        break;
      case "绽放":
        style.filter = `drop-shadow(0 0 25px white) drop-shadow(0 0 50px ${baseColor})`;
        break;
      case "常态":
      default:
        style.filter = `drop-shadow(0 0 8px ${baseColor})`;
        break;
    }
    return style;
  };

  const showFlowingLines =
    isBranded &&
    (activity === "充能" || activity === "满溢" || activity === "绽放");
  const isBloom = isBranded && activity === "绽放";

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      <svg
        className={`w-full h-full max-h-[320px] overflow-visible ${isBranded && activity === "呼吸" ? "animate-pulse-glow" : ""}`}
        style={getGlowStyle()}
        viewBox="0 0 512 366"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="90%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* 【配置说明】：此处调整“纹身显示尺寸” (修改 scale 的值，缩小以容纳光晕) 
            由原来的 scale(0.1, -0.1) 调整为 scale(0.08, -0.08)，并配合 translate 居中 */}
        <g transform="translate(50, 335) scale(0.08, -0.08)">
          {/* 背景阴影层 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`shadow-${i}`}
              d={d}
              fill="rgba(0,0,0,0.05)"
              transform="translate(10, -10)"
            />
          ))}
          {/* 填充层 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`fill-${i}`}
              d={d}
              fill={baseColor}
              fillOpacity={isBranded ? 0.35 : 0.15}
            />
          ))}
          {/* 描边层 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`stroke-${i}`}
              d={d}
              fill="none"
              stroke={baseColor}
              strokeWidth="50"
              strokeLinejoin="round"
            />
          ))}
          {/* 能量流动线 */}
          {showFlowingLines &&
            SVG_PATHS.map((d, i) => (
              <path
                key={`flow-${i}`}
                d={d}
                fill="none"
                stroke="url(#glow-grad)"
                strokeWidth="25"
                /* 【配置说明】：此处调整“流光拖尾长度” (strokeDasharray 的第一个参数是流光长度，第二个是间距) */
                strokeDasharray="900 3000"
                className={
                  activity === "绽放"
                    ? "animate-flow-bloom"
                    : activity === "满溢"
                      ? "animate-flow-overflow"
                      : "animate-flow-charging"
                }
                style={{ strokeLinecap: "round" }}
              />
            ))}
          {/* 核心光点勾勒 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`core-${i}`}
              d={d}
              fill="none"
              stroke={isBranded ? "white" : "#cbd5e1"}
              strokeWidth="12"
              strokeOpacity={isBranded ? 0.8 : 0.3}
              className={isBloom ? "animate-energy-flicker" : ""}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default MagicCrest;
