import _ from "lodash";
import React, { DeploymentLocation, useEffect, useMemo, useState } from "react";
import MagicCrest from "./components/MagicCrest";
import { CORE_GEAR_GROUPS, CORRUPTION_LEVELS, UI_DESIGN } from "./constants";
import { CharacterState, CrestLevel, MemoryEntry } from "./types";

declare global {
  interface Window {
    waitGlobalInitialized?: <T>(global: string) => Promise<T>;
    getAllVariables?: () => Record<string, any>;
    errorCatched?: <T extends any[], U>(
      fn: (...args: T) => U,
    ) => (...args: T) => U;
  }
}

const safeWaitGlobalInitialized = async (n: string) =>
  window.waitGlobalInitialized ? window.waitGlobalInitialized(n) : null;
const safeGetAllVariables = () =>
  window.getAllVariables ? window.getAllVariables() : {};
const safeErrorCatched = <T extends any[], U>(fn: (...args: T) => U) =>
  window.errorCatched ? window.errorCatched(fn) : fn;

/**
 * 格式化装备显示名称的辅助函数
 * 过滤 "[部位·名称]" 或 "部位·名称"，只返回 "名称"
 */
const formatGearDisplayName = (name: any): string => {
  if (typeof name !== "string" || !name) return String(name || "");
  // 去除可能存在的包裹中括号
  const stripped = name.replace(/[\[\]]/g, "");
  // 如果包含分隔符则取最后一段
  if (stripped.includes("·")) {
    return stripped.split("·").pop() || stripped;
  }
  return stripped;
};

const App: React.FC = () => {
  const [data, setData] = useState<CharacterState | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memData, setMemData] = useState<MemoryEntry[]>([]);
  const [incompatible, setIncompatible] = useState(false);

  const update = safeErrorCatched(() => {
    const v = safeGetAllVariables();
    const ly = _.get(v, "stat_data.凌月", {});
    const common = _.get(v, "stat_data", {});
    const env = _.get(v, "stat_data.环境", {});
    const mem = _.get(v, "stat_data.记忆", {});
    const deployPos = _.get(ly, "装备.刺激模组.部署位置", []);

    /**
     * 判定逻辑优化：
     * 1. 必须是对象且非 null (typeof === 'object' && x !== null)
     * 2. 不能是数组 (!Array.isArray)
     * 3. 必须包含至少一个键 (Object.keys().length > 0)，排除空对象或初始空态
     */
    const isOldMem =
      mem &&
      !Array.isArray(mem) &&
      typeof mem === "object" &&
      Object.keys(mem).length > 0;
    const isOldDeploy =
      deployPos &&
      !Array.isArray(deployPos) &&
      typeof deployPos === "object" &&
      Object.keys(deployPos).length > 0;

    if (isOldMem || isOldDeploy) {
      setIncompatible(true);
    } else {
      setIncompatible(false);
    }

    // 将记忆列表按时间降序排列
    const sortedMem = Array.isArray(mem)
      ? [...mem].sort((a, b) => String(b.时间).localeCompare(String(a.时间)))
      : [];
    setMemData(sortedMem);

    setData({
      stats: {
        堕落度: _.get(ly, "状态.堕落度", 0),
        羞耻感: _.get(ly, "状态.羞耻感", 0),
        敏感度: _.get(ly, "状态.敏感度", 0),
        体力: _.get(ly, "状态.体力", 0),
        当前阶段: _.get(ly, "状态.当前阶段", 1),
      },
      tattoo: {
        进化等级: _.get(ly, "淫纹.进化等级", 0) as CrestLevel,
        当前活性: _.get(ly, "淫纹.当前活性", "沉寂"),
        温度反馈: _.get(ly, "淫纹.温度反馈", 37.0),
      },
      gear: {
        体内: _.get(ly, "装备.体内", {}),
        穿刺: _.get(ly, "装备.穿刺", {}),
        刺激模组: _.get(ly, "装备.刺激模组", {
          部署位置: [],
          控制模式: "待机",
        }),
        连接系统: _.get(ly, "装备.连接系统", {
          项圈: null,
          全身锁链: false,
          运作模式: "待机",
          震动等级: 0,
        }),
        公开展示: _.get(ly, "装备.公开展示", {}),
        兽化组件: _.get(ly, "装备.兽化组件", { 尾巴: null, 伪装延展: false }),
      },
      disguise: _.get(ly, "伪装", {}),
      psych: _.get(ly, "心理", {}),
      env: {
        location: common.地点 || "未知",
        date: common.日期 || "2024年5月20日",
        time: common.时间 || "14:30",
        周围人群: env.周围人群 || "无",
        噪音: env.噪音 || "平静",
        安全等级: env.安全等级 || "高",
      },
    });
  });

  useEffect(() => {
    safeWaitGlobalInitialized("Mvu").then(() => {
      update();
      const i = setInterval(update, 3000);
      return () => clearInterval(i);
    });
  }, []);

  const corruptionInfo = useMemo(() => {
    if (!data) return CORRUPTION_LEVELS[0];

    // 为了兼容 1000 的最大值且不改动常量，这里将值缩放到 100 进行判定
    const val = data.stats.堕落度 / 10;
    return (
      CORRUPTION_LEVELS.find((l) => val >= l.min && val <= l.max) ||
      CORRUPTION_LEVELS[CORRUPTION_LEVELS.length - 1]
    );
  }, [data]);

  const getTemperatureStyle = (temp: number) => {
    const min = 37;
    const max = 45;
    const ratio = Math.max(0, Math.min(1, (temp - min) / (max - min)));
    const r = Math.round(34 + ratio * (239 - 34));
    const g = Math.round(197 + ratio * (68 - 197));
    const b = Math.round(94 + ratio * (68 - 94));
    return { color: `rgb(${r}, ${g}, ${b})` };
  };

  if (!data)
    return (
      <div className="p-8 text-rose-300 animate-pulse font-black text-xl italic">
        凌月状态载入中...
      </div>
    );

  const isBranded = data.tattoo.进化等级 > 0;

  return (
    /* 关键：使用 h-auto 替代 min-h-screen 解决父窗口 .load() 高度无限增长的问题 */
    <div className="flex flex-col gap-4 p-4 h-auto bg-slate-50 font-sans text-sm overflow-visible">
      {/* 结构不兼容提示横幅 */}
      {incompatible && (
        <div className="bg-amber-100 border-2 border-amber-400 p-3 rounded-xl mb-2 flex items-center gap-3 animate-bounce-short">
          <i className="fas fa-exclamation-triangle text-amber-600 text-lg"></i>
          <span className="text-amber-900 font-black">
            状态栏更新，已与现有角色不兼容请到帖子更新角色或参照指引修改正则，帖子地址：https://discord.com/channels/1291925535324110879/1465406932549369938/1465406932549369938
          </span>
        </div>
      )}

      {/* 左右分栏布局 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：状态面板 */}
        <div
          className="glass-card flex flex-col overflow-hidden shadow-sm"
          style={{ background: UI_DESIGN.CARD_BG }}
        >
          {/* 头部装饰 */}
          <div className="p-5 pb-2 border-b-2 border-rose-100 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <i className="fas fa-microchip text-rose-400"></i>
              <h2 className="text-lg font-black text-slate-700 uppercase tracking-tighter">
                凌月状态
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-500 text-white px-3 py-0.5 rounded-full text-base font-black">
                阶段 {data.stats.当前阶段}
              </span>
              <span className="text-rose-500 font-black border-2 border-rose-200 px-3 py-0.5 rounded-full text-sm bg-white/60 shadow-sm">
                {corruptionInfo.label}
              </span>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-6">
            {/* 状态进度条区域 - 调整为 grid-cols-1 每组占一行 */}
            <div className="text-sm grid grid-cols-1 gap-y-6 items-start">
              {[
                {
                  label: "堕落度",
                  val: data.stats.堕落度,
                  max: 1000,
                  color: "bg-purple-600",
                },
                {
                  label: "羞耻感",
                  val: data.stats.羞耻感,
                  max: 100,
                  color: "bg-rose-500",
                },
                {
                  label: "敏感度",
                  val: data.stats.敏感度,
                  max: 100,
                  color: "bg-pink-500",
                },
                {
                  label: "体力值",
                  val: data.stats.体力,
                  max: 100,
                  color: "bg-emerald-500",
                },
              ].map((s) => {
                const percent = Math.min(100, (s.val / s.max) * 100);
                return (
                  <div key={s.label} className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between font-black text-slate-600 leading-none items-center px-1">
                      <span className="flex items-center gap-1.5 truncate">
                        {s.label}
                      </span>
                      <span className="font-mono">
                        {s.label === "堕落度"
                          ? `${Math.round(s.val)}/1000`
                          : `${Math.round(s.val)}%`}
                      </span>
                    </div>
                    {/* 强制高度 10px */}
                    <div
                      className="track bg-slate-200/50 relative overflow-hidden"
                      style={{
                        height: "10px",
                        minHeight: "10px",
                        maxHeight: "10px",
                      }}
                    >
                      <div
                        className={`fill ${s.color} absolute left-0 top-0 shadow-inner`}
                        style={{ width: `${percent}%`, height: "10px" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 环境区域 - 铺满一行 */}
            <div className="bg-white/40 p-4 rounded-xl border border-rose-50 flex flex-col gap-2 shadow-sm">
              <h4 className="text-base font-black text-rose-300 uppercase tracking-widest flex items-center gap-2 border-b border-rose-50 pb-2">
                <i className="fas fa-globe-asia"></i> 环境
              </h4>
              <div className="text-sm flex flex-col gap-2 font-bold text-slate-600">
                <div className="flex items-center gap-3 bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                  <span className="font-mono font-black text-rose-500 flex items-center gap-2">
                    <i className="fas fa-clock"></i>
                    {data.env.date} {data.env.time}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1 px-1">
                  <span className="flex items-center gap-2 truncate text-slate-500">
                    <i className="fas fa-map-marker-alt w-4 text-center text-rose-300"></i>
                    地点: {data.env.location}
                  </span>
                  <span className="flex items-center gap-2 truncate text-slate-500">
                    <i className="fas fa-users w-4 text-center text-rose-300"></i>
                    周围人群: {data.env.周围人群}
                  </span>
                  <span className="flex items-center gap-2 truncate text-slate-500">
                    <i className="fas fa-volume-up w-4 text-center text-rose-300"></i>
                    噪音: {data.env.噪音}
                  </span>
                  <span className="flex items-center gap-2 text-rose-400 font-black">
                    <i className="fas fa-shield-alt w-4 text-center"></i>
                    安全等级: {data.env.安全等级}
                  </span>
                </div>
              </div>
            </div>

            {/* 伪装区域 - 铺满一行 */}
            <div className="bg-white/40 p-4 rounded-xl border border-rose-50 flex flex-col gap-2 shadow-sm">
              <h4 className="text-base font-black text-rose-300 uppercase tracking-widest flex items-center gap-2 border-b border-rose-50 pb-2">
                <i className="fas fa-mask"></i> 伪装
              </h4>
              <div className="text-sm flex flex-col gap-1.5 font-bold text-slate-600 px-1">
                <span className="truncate">
                  当前着装:{" "}
                  <span className="text-slate-500">
                    {data.disguise.当前着装 || "常服"}
                  </span>
                </span>
                <span className="truncate">
                  表面状态:{" "}
                  <span className="text-slate-500">
                    {data.disguise.表面状态 || "平静"}
                  </span>
                </span>
                <span className="truncate text-rose-500">
                  生理破绽:{" "}
                  <span className="font-normal">
                    {data.disguise.生理破绽 || "无"}
                  </span>
                </span>
                <span className="truncate text-rose-500">
                  当前借口:{" "}
                  <span className="font-normal">
                    {data.disguise.当前借口 || "暂无借口掩饰..."}
                  </span>
                </span>
              </div>
            </div>

            {/* 心理独白区域 - 铺满一行 */}
            <div className="bg-white/30 p-4 rounded-xl border border-rose-100/50 flex flex-col gap-3 shadow-sm">
              <h4 className="text-base font-black text-rose-300 uppercase tracking-widest border-b border-rose-100/30 pb-2 flex items-center gap-2">
                <i className="fas fa-brain"></i> 心理
              </h4>
              <div className="flex flex-col gap-2">
                <div className="bg-white/50 p-3 rounded-lg shadow-inner">
                  <span className="text-sm font-black text-slate-600 leading-relaxed">
                    “{data.psych.内心独白 || "......"}”
                  </span>
                </div>
                <div className="flex justify-end items-center px-1">
                  <span className="text-sm font-bold text-slate-400">
                    公众印象: {data.psych.公众印象 || "普通讲师"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：淫纹与装备面板 */}
        <div className="flex flex-col gap-4">
          {/* 淫纹卡片 */}
          <div
            className="glass-card flex flex-col items-center justify-between p-4 relative overflow-visible shrink-0 shadow-sm"
            style={{ background: UI_DESIGN.CARD_BG, minHeight: "480px" }}
          >
            <div className="text-lg w-full flex justify-between items-center text-rose-300 font-black tracking-widest z-10 shrink-0">
              <div className="flex items-center gap-2">
                <span>淫纹系统</span>
                <div className="relative flex items-center justify-center ml-1 drop-shadow-sm">
                  <i className="fas fa-heart text-rose-500 text-3xl opacity-90"></i>
                  <span className="absolute text-sm font-black text-white pb-0.5">
                    {data.tattoo.进化等级}
                  </span>
                </div>
              </div>
              <span
                className={`text-sm not-italic px-3 py-1 rounded shadow-sm uppercase font-black ${isBranded ? "bg-rose-500 text-white" : "bg-slate-300 text-slate-500"}`}
              >
                {isBranded ? "激活中" : "未烙印"}
              </span>
            </div>

            <div className="relative w-full flex-grow flex items-center justify-center z-10 overflow-hidden py-4">
              <MagicCrest
                level={data.tattoo.进化等级}
                activity={data.tattoo.当前活性}
                isBranded={isBranded}
              />
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t-2 border-rose-200/50 pt-6 mt-2 z-10 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  能量活性
                </span>
                <span className="text-xl font-black text-rose-500 drop-shadow-md">
                  {data.tattoo.当前活性}
                </span>
              </div>
              <div className="flex flex-col items-center border-l-2 border-rose-100">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  实时温度
                </span>
                <span
                  className="text-xl font-mono font-black transition-colors duration-1000"
                  style={getTemperatureStyle(data.tattoo.温度反馈)}
                >
                  {data.tattoo.温度反馈.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>

          {/* 私密装备卡片 */}
          <div
            className="glass-card p-5 flex flex-col gap-4 overflow-visible shadow-sm"
            style={{ background: UI_DESIGN.CARD_BG }}
          >
            <h4 className="text-base font-black text-rose-300 uppercase tracking-widest flex items-center gap-2 border-b border-rose-100 pb-2">
              <i className="fas fa-shield-heart"></i> 私密装备
            </h4>

            <div className="grid grid-cols-3 gap-4">
              {CORE_GEAR_GROUPS.map((g) => (
                <div key={g.id} className="flex flex-col gap-2">
                  <span className="text-sm font-black text-slate-400 flex items-center gap-1.5 truncate">
                    <i className={`fas ${g.icon} text-rose-300`}></i>
                    {g.label}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {g.slots.map((s) => {
                      const v = _.get(data.gear, s.path);
                      const active = v && v !== "无" && v !== false;
                      const displayName = active
                        ? typeof v === "string"
                          ? formatGearDisplayName(v)
                          : "OK"
                        : "-";
                      return (
                        <div
                          key={s.label}
                          title={typeof v === "string" ? v : "无"}
                          className={`group relative px-2 py-1.5 rounded-lg border-2 text-sm flex justify-between items-center transition-all ${active ? "bg-white border-rose-200 text-rose-500 font-bold shadow-sm cursor-help" : "bg-slate-50/40 border-slate-100 text-slate-300"}`}
                        >
                          <span className="truncate">{s.label}</span>
                          <span className="truncate opacity-70 ml-1">
                            {displayName}
                          </span>
                          {active && typeof v === "string" && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100] pointer-events-none animate-fade-in">
                              <div className="bg-rose-600 text-white text-sm px-2 py-1.5 rounded shadow-xl whitespace-nowrap border border-white/20 font-black">
                                {v}
                              </div>
                              <div className="w-2 h-2 bg-rose-600 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/20"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 模块扩展区 */}
            <div className="bg-white/60 p-5 rounded-xl border border-rose-100 shadow-sm mt-2 min-h-[115px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-black text-slate-500 uppercase">
                  <i className="fas fa-bolt mr-1"></i>刺激模组
                </span>
                <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {data.gear.刺激模组.控制模式}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* 处理部署位置数组 */}
                {Array.isArray(data.gear.刺激模组.部署位置) &&
                data.gear.刺激模组.部署位置.length > 0 ? (
                  (data.gear.刺激模组.部署位置 as DeploymentLocation[]).map(
                    (item, idx) => (
                      <span
                        key={idx}
                        className={`bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md text-xs font-black border border-rose-200 flex items-center gap-1 ${item.震动 ? "animate-pulse" : ""}`}
                      >
                        {item.点位}{" "}
                        {item.震动 ? (
                          <i className="fas fa-bolt text-xs"></i>
                        ) : (
                          ""
                        )}
                      </span>
                    ),
                  )
                ) : (
                  <span className="text-slate-300 text-xs">未佩戴</span>
                )}
              </div>
            </div>

            <div className="bg-white/60 px-3 py-2 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between mt-2 overflow-visible">
              <span className="text-sm font-black text-slate-500 uppercase flex items-center shrink-0">
                <i className="fas fa-paw mr-1"></i>兽化组件
              </span>
              <div className="flex items-center gap-4 ml-4 flex-1 justify-end">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm text-slate-400 font-black shrink-0">
                    尾巴:
                  </span>
                  <span className="group relative text-sm font-bold text-rose-500 cursor-help truncate max-w-[120px]">
                    {data.gear.兽化组件.尾巴
                      ? formatGearDisplayName(data.gear.兽化组件.尾巴)
                      : "NONE"}
                    {data.gear.兽化组件.尾巴 && (
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-[100] pointer-events-none animate-fade-in">
                        <div className="bg-rose-600 text-white text-sm px-2 py-1.5 rounded shadow-xl whitespace-nowrap border border-white/20 font-black">
                          {data.gear.兽化组件.尾巴}
                        </div>
                        <div className="w-2 h-2 bg-rose-600 rotate-45 absolute -bottom-1 right-2 border-r border-b border-white/20"></div>
                      </div>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l border-rose-100 pl-4 shrink-0">
                  <span className="text-sm text-slate-400 font-black">
                    延展:
                  </span>
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded-full ${data.gear.兽化组件.伪装延展 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-300"}`}
                  >
                    {data.gear.兽化组件.伪装延展 ? "是" : "无"}
                  </span>
                </div>
              </div>
            </div>

            {/* 连接系统底栏 */}
            <div className="bg-slate-900/5 rounded-xl border-t-2 border-rose-200 p-3 mt-2 shadow-inner overflow-visible">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <i className="fas fa-link text-rose-400 text-sm"></i>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-400 uppercase leading-none mb-1 tracking-tighter">
                      圣洁锁链
                    </span>
                    <div className="flex gap-3">
                      <span
                        className={`group relative text-sm font-bold ${data.gear.连接系统.项圈 ? "text-rose-600 cursor-help" : "text-slate-300"}`}
                        title={data.gear.连接系统.项圈 || "未佩戴"}
                      >
                        项圈:{" "}
                        {data.gear.连接系统.项圈
                          ? formatGearDisplayName(data.gear.连接系统.项圈)
                          : "未佩戴"}
                        {data.gear.连接系统.项圈 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100] pointer-events-none animate-fade-in">
                            <div className="bg-rose-600 text-white text-sm px-2 py-1.5 rounded shadow-xl whitespace-nowrap border border-white/20 font-black">
                              {data.gear.连接系统.项圈}
                            </div>
                            <div className="w-2 h-2 bg-rose-600 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/20"></div>
                          </div>
                        )}
                      </span>
                      <span
                        className={`text-sm font-bold ${data.gear.连接系统.全身锁链 ? "text-rose-600" : "text-slate-300"}`}
                      >
                        身体链:{" "}
                        {data.gear.连接系统.全身锁链 ? "圣洁锁链" : "未佩戴"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="bg-white/80 px-2 py-1 rounded border border-rose-100 flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-tighter">
                      运作模式
                    </span>
                    <span className="text-xs font-black text-rose-500 leading-none">
                      {data.gear.连接系统.运作模式}
                    </span>
                  </div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-rose-100 flex flex-col items-end min-w-[50px]">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-tighter">
                      震动等级
                    </span>
                    <span className="text-xs font-black text-rose-500 leading-none">
                      ⚡{data.gear.连接系统.震动等级}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部里程碑卡片 */}
      <div
        className="glass-card overflow-hidden shrink-0 shadow-lg mb-6"
        style={{ background: UI_DESIGN.CARD_BG }}
      >
        <button
          onClick={() => setMemoryOpen(!memoryOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-rose-50/50 transition-all"
        >
          <div className="flex items-center gap-3 font-black text-slate-600 text-base">
            <i className="fas fa-history text-rose-400 text-xl animate-spin-slow"></i>
            事件
          </div>
          <i
            className={`fas fa-chevron-up transition-transform duration-500 text-rose-300 ${memoryOpen ? "" : "rotate-180"}`}
          ></i>
        </button>
        {memoryOpen && (
          <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto animate-fade-in">
            {/* 处理记忆数组 */}
            {memData.length > 0 ? (
              memData.map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-white/60 p-4 rounded-xl border-l-4 border-rose-400 shadow-sm flex flex-col gap-2 hover:bg-white transition-all hover:scale-[1.01] cursor-default"
                >
                  <div className="flex justify-between items-center border-b border-rose-50 pb-1">
                    <span className="font-mono text-xs text-rose-300 font-black uppercase tracking-tighter">
                      事件: {entry.名称}
                    </span>
                    <span className="text-xs text-slate-400 font-bold font-mono">
                      {entry.时间}
                    </span>
                  </div>
                  <p className="font-bold text-slate-600 text-sm leading-relaxed">
                    {entry.内容}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-slate-300 italic font-black text-sm tracking-widest uppercase">
                无记录...
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short { animation: bounce-short 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
