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
   * baseColor: 纹身的基础轮廓色，Lv.0 为灰色，其他等级使用渐进红色系。
   * highlightColor: 能量激发时的填充色。重构后根据进化等级精确匹配，不再混用基础色。
   */
  const baseColor = isBranded
    ? CREST_LEVEL_COLORS[level] || CREST_LEVEL_COLORS[1]
    : CREST_LEVEL_COLORS[0];
  const highlightColor = isBranded
    ? CREST_HIGHLIGHT_COLORS[level] || CREST_HIGHLIGHT_COLORS[1]
    : CREST_HIGHLIGHT_COLORS[0];

  /**
   * 【光晕(Glow)计算】
   * 采用 drop-shadow 实现。
   * 随着活性(activity)提升，光晕的扩展半径和扩散层数逐渐增加。
   * 绽放(Bloom)态会额外叠加白色光晕以增强视觉冲击力。
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
        className={`w-full h-full max-h-[320px] overflow-visible ${isBranded && activity === "呼吸" ? "animate-pulse-glow" : ""}`}
        style={getGlowStyle()}
        viewBox="0 0 512 366"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="90%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          {/* 【修订项】：新增边缘柔化滤镜，用于实现能量核心与边框的平滑衔接 */}
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

        {/* 【配置说明】：此处调整“纹身显示尺寸” (修改 scale 的值，缩小以容纳光晕) 
            由原来的 scale(0.1, -0.1) 调整为 scale(0.08, -0.08)，并配合 translate 居中 */}
        <g transform="translate(50, 335) scale(0.08, -0.08)">
          {/* 1. 背景阴影层：提供深度感 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`shadow-${i}`}
              d={d}
              fill="rgba(0,0,0,0.05)"
              transform="translate(10, -10)"
            />
          ))}

          {/* 2. 基础填充层：纹身的基本色块 */}
          {SVG_PATHS.map((d, i) => (
            <path
              key={`fill-${i}`}
              d={d}
              fill={baseColor}
              fillOpacity={isBranded ? 0.35 : 0.15}
            />
          ))}

          {/* 3. 【修订项】高亮填充层 (Energy Core) 
              使用 filter="url(#soft-energy-blur)" 使边缘产生向外扩散的虚化感。
              这种虚化会使填充色在视觉上“漫反射”到边框内壁，消除生硬的边界感。
          */}
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

          {/* 4. 描边层：主轮廓线，由于在填充层之后渲染，其内部宽度会创造填充边距 */}
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

          {/* 5. 能量流动线 (Flowing Dash)：高能态下流转的白光 */}
          {showFlowingLines &&
            SVG_PATHS.map((d, i) => (
              <path
                key={`flow-${i}`}
                d={d}
                fill="none"
                stroke="url(#glow-grad)"
                strokeWidth="25"
                /* 【配置说明】：此处调整“流光拖尾长度” (strokeDasharray 的第一个参数是流光长度，第二个是间距) */
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

          {/* 6. 核心光点勾勒 (Inner Core)：最精细的白色极细边缘，增强质感 */}
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
