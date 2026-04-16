import React from "react";
import {
  CREST_HIGHLIGHT_COLORS,
  CREST_LEVEL_COLORS,
  SVG_PATHS,
} from "../constants";
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
   * 【色彩获取逻辑】
   */
  const baseColor = isBranded
    ? CREST_LEVEL_COLORS[level] || CREST_LEVEL_COLORS[1]
    : CREST_LEVEL_COLORS[0];
  const highlightColor = isBranded
    ? CREST_HIGHLIGHT_COLORS[level] || CREST_HIGHLIGHT_COLORS[1]
    : CREST_HIGHLIGHT_COLORS[0];

  /**
   * 【光晕(Glow)计算】
   */
  const getGlowStyle = () => {
    const style: React.CSSProperties = {
      "--glow-color": baseColor,
      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    } as React.CSSProperties;

    if (!isBranded) {
      style.opacity = 0.2;
      return style;
    }

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
        style.filter = `drop-shadow(0 0 25px ${baseColor}) drop-shadow(0 0 50px ${baseColor})`;
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
  const isHighEnergy = activity === "满溢" || activity === "绽放";

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      <svg
        className={`w-full h-full overflow-visible ${isBranded && activity === "呼吸" ? "animate-pulse-glow" : ""}`}
        style={getGlowStyle()}
        viewBox="0 0 512 366"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* 【修订项】：流光渐变优化。
              将 stopOpacity 统一设为 1.0，确保流光线走到路径最末端的坐标点时依然清晰可见，不产生渐隐。
          */}
          <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="50%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>

          <filter
            id="soft-energy-blur"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
          </filter>
        </defs>

        <g transform="translate(50, 335) scale(0.08, -0.08)">
          {/* 1. 背景阴影层 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`shadow-${i}`}
              d={d}
              fill="rgba(0,0,0,0.05)"
              transform="translate(10, -10)"
            />
          ))}

          {/* 2. 基础填充层 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`fill-${i}`}
              d={d}
              fill={baseColor}
              fillOpacity={isBranded ? 0.35 : 0.15}
            />
          ))}

          {/* 3. 高亮填充层 (Energy Core) */}
          {isHighEnergy &&
            SVG_PATHS.map((d, i) => (
              <React.Fragment key={`energy-wrap-${i}`}>
                <path
                  d={d}
                  fill={highlightColor}
                  fillOpacity={0.2}
                  filter="url(#soft-energy-blur)"
                  className={`transition-opacity duration-500 ${isBloom ? "animate-energy-flicker" : ""}`}
                />
                <path
                  d={d}
                  fill="#ffffff"
                  fillOpacity={isBloom ? 0.9 : 0.9}
                  filter="url(#soft-energy-blur)"
                  className={`transition-opacity duration-500 ${isBloom ? "animate-flicker-white" : ""}`}
                  style={{ mixBlendMode: "plus-lighter" }}
                />
              </React.Fragment>
            ))}

          {/* 4. 描边层 */}
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

          {/* 5. 能量流动线 (Flowing Dash)
              【核心修订】：
              - strokeDasharray="1000 500"：
                1. 单段流光长1000，空隙长500，总循环节为 1500。
                2. 配合 CSS 中 3000 单位的动画行程，正好包含两个完整图案循环，确保循环时无瞬间重置感。
                3. 由于流光占据了周期的 2/3，在视觉上能完美实现“第一段走到 2/3 时第二段开始”的密集衔接效果。
          */}
          {showFlowingLines &&
            SVG_PATHS.map((d, i) => (
              <path
                key={`flow-${i}`}
                d={d}
                fill="none"
                stroke="url(#glow-grad)"
                strokeWidth="30"
                strokeDasharray="1000 500"
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

          {/* 6. 核心光点勾勒 */}
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
